import { useEffect, useRef, useState, useCallback } from 'react';
import BigNumber from 'bignumber.js';
import config from '../../config';
import Stores from '../../stores';
import {
  fetchMockPendingRewards,
  fetchMockPendingPeriods,
  fetchMockMarketMiningApy,
  fetchMockVaultMiningApy,
  fetchMockUserPositionMining,
  isMockVaultMiningEnabled,
  isMockMarketMiningEnabled,
  getMockDefaultVaultMiningEntry
} from '../../service/mock/mining';
import { sendMockClaimPeriod } from '../mock/miningContract';
import { getV2TronBull, getV2Tronbullish, getV2UnClaimedAirDrop, getTokenPrice } from '../backend';
import { getVaultInfo, getVaultMyPosition, getMyPosition } from '../../service/V2backend';
import v2Config from '../../config/v2config';

const WTRX_ADDRESS = v2Config?.tokens?.WTRX;
// Match formatTokenSymbol from utils/formatters without pulling that module's
// TronWeb-loading dependencies into the hook test harness.
const normalizeAssetSymbol = (address, symbol) => (address === WTRX_ADDRESS ? 'TRX' : symbol);

const sumRewardsUsd = rewards =>
  rewards.reduce((acc, r) => acc.plus(BigNumber(r.amount).times(r.priceUsd || 0)), BigNumber(0)).toNumber();

const sumPeriodsUsd = periods =>
  periods
    .reduce((acc, p) => {
      for (const t of p.tokens || []) {
        acc = acc.plus(BigNumber(t.amount).times(t.priceUsd || 0));
      }
      return acc;
    }, BigNumber(0))
    .toNumber();

export const hasClaimableRewards = rewards =>
  Array.isArray(rewards) && rewards.some(reward => BigNumber(reward?.amount || 0).gt(0));

const USDD_PRICE_DEFAULT = 1;
// Last-resort value if tokenPriceUrl is unreachable; the live price from getTokenPrice() wins when available.
const TRX_PRICE_FALLBACK = 0.145;
const TRX_PRICE_TTL_MS = 60 * 1000;

let _trxPrice = null;
let _trxLoadedAt = 0;
let _trxInflight = null;

const loadTrxPrice = () => {
  const now = Date.now();
  if (_trxPrice != null && now - _trxLoadedAt < TRX_PRICE_TTL_MS) return Promise.resolve(_trxPrice);
  if (_trxInflight) return _trxInflight;
  _trxInflight = getTokenPrice()
    .then(resp => {
      if (resp?.success && resp.priceTRX) {
        const next = Number(resp.priceTRX);
        if (Number.isFinite(next) && next > 0) {
          _trxPrice = next;
          _trxLoadedAt = Date.now();
        }
      }
      return _trxPrice ?? TRX_PRICE_FALLBACK;
    })
    .catch(() => _trxPrice ?? TRX_PRICE_FALLBACK)
    .finally(() => {
      _trxInflight = null;
    });
  return _trxInflight;
};

const priceFor = symbol => {
  if (symbol === 'USDD' || symbol === 'USDDNEW' || symbol === 'USDDOLD') return USDD_PRICE_DEFAULT;
  if (symbol === 'TRX' || symbol === 'TRXNEW') return _trxPrice ?? TRX_PRICE_FALLBACK;
  return 0;
};

// Airdrop amounts arrive in each token's native minimum unit (USDD: 10^18, TRX: 10^6).
// Keep the raw value for contract calls but expose a normalized human-readable amount
// for display and USD math; hardcoding decimals=18 inflated TRX totals by 10^12.
const TOKEN_DECIMALS = {
  USDD: 18,
  USDDNEW: 18,
  USDDOLD: 18,
  TRX: 6,
  TRXNEW: 6
};

const decimalsFor = symbol => TOKEN_DECIMALS[symbol] ?? 18;

const hexToDecimal = value => {
  if (value == null) return '0';
  const str = String(value);
  if (str.startsWith('0x') || str.startsWith('0X')) {
    return new BigNumber(str.slice(2), 16).toFixed();
  }
  return str;
};

const toArray = v => (Array.isArray(v) ? v : v == null ? [] : [v]);

const ZERO_BYTES32 = '0'.repeat(64);
const CLAIM_CONFIRM_ATTEMPTS = 8;
const CLAIM_CONFIRM_INTERVAL_MS = 3000;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const isEmptyBytes32Result = result => {
  if (!Array.isArray(result) || result.length === 0) return true;
  const value = String(result[0] || '')
    .replace(/^0x/i, '')
    .toLowerCase();
  return !value || value === ZERO_BYTES32;
};

const isMerkleRootReady = async (contractAddress, merkleIndex) => {
  const system = Stores.system;
  if (!system || typeof system.view !== 'function') return false;
  const result = await system.view(contractAddress, 'merkleRoots(uint256)', [{ type: 'uint256', value: merkleIndex }]);
  return !isEmptyBytes32Result(result);
};

// Ask the distributor itself whether this (merkleIndex, index) has already been
// claimed. The backend /getAllUnClaimedAirDrop indexer can lag minutes behind
// the chain, so without this check a user who refreshes the page after a
// successful claim (which wipes the in-memory optimistic cache) sees the round
// again, clicks Claim, and the contract reverts — wasting gas and surfacing a
// "Failed to confirm the transaction" notification from TransactionStore. If
// the view call itself fails (contract lacks this selector), fall through and
// let the tx attempt proceed as before.
const isAlreadyClaimed = async (contractAddress, merkleIndex, index) => {
  const system = Stores.system;
  if (!system || typeof system.view !== 'function') return false;
  const result = await system.view(contractAddress, 'isClaimed(uint256,uint256)', [
    { type: 'uint256', value: merkleIndex },
    { type: 'uint256', value: index }
  ]);
  if (!Array.isArray(result) || result.length === 0) return false;
  const hex = String(result[0] || '').replace(/^0x/i, '');
  if (!hex) return false;
  return !/^0+$/.test(hex);
};

const findAirdropEntry = (data, period) => {
  if (!data || typeof data !== 'object' || !period) return null;
  if (data[period.periodKey]) return data[period.periodKey];
  return Object.values(data).find(entry => {
    if (!entry) return false;
    return (
      Number(entry.merkleIndex ?? -1) === Number(period.merkleIndex) &&
      Number(entry.index ?? -1) === Number(period.index)
    );
  });
};

const waitForClaimedState = async period => {
  const addr = Stores.network?.defaultAccount;
  if (!addr) return false;
  for (let i = 0; i < CLAIM_CONFIRM_ATTEMPTS; i++) {
    const resp = await getV2UnClaimedAirDrop(addr, false);
    const entry = resp.success ? findAirdropEntry(resp.data, period) : null;
    if (entry?.claimed === true) return true;
    await sleep(CLAIM_CONFIRM_INTERVAL_MS);
  }
  return false;
};

// Backend normally emits tokenSymbol. When it's missing we identify USDD by
// address (market/vault, legacy v1, and the redeployed mining variant) so the
// rewards don't silently fall through to the TRX branch, which would apply
// 6-decimals and a TRX price.
const resolveTokenSymbol = (symbol, address) => {
  if (symbol) return symbol;
  if (address && address === config.usdd?.token) return 'USDD';
  if (address && address === config.usddold?.token) return 'USDD';
  if (address && address === config.usddnew?.token) return 'USDD';
  return 'TRX';
};

const periodFromAirdropRound = (roundKey, entry) => {
  const merkleIndex = Number(entry.merkleIndex ?? roundKey);
  const symbols = toArray(entry.tokenSymbol);
  const addresses = toArray(entry.tokenAddress);
  const amounts = toArray(entry.amount);
  const tokens = amounts.map((amt, i) => {
    const token = resolveTokenSymbol(symbols[i], addresses[i]);
    const amountRaw = hexToDecimal(amt);
    const decimals = decimalsFor(token);
    return {
      token,
      tokenAddress: addresses[i] || null,
      amount: BigNumber(amountRaw).shiftedBy(-decimals).toFixed(),
      amountRaw,
      decimals,
      priceUsd: priceFor(token)
    };
  });
  return {
    periodKey: String(roundKey),
    merkleIndex,
    index: Number(entry.index ?? 0),
    proof: Array.isArray(entry.proof) ? entry.proof : [],
    tokens
  };
};



const _optimisticallyClaimed = new Map();
const OPTIMISTIC_CLAIM_TTL_MS = 10 * 60 * 1000;

const markOptimisticallyClaimed = periodKey => {
  if (!periodKey) return;
  _optimisticallyClaimed.set(String(periodKey), Date.now() + OPTIMISTIC_CLAIM_TTL_MS);
};

const isOptimisticallyClaimed = periodKey => {
  const expiresAt = _optimisticallyClaimed.get(String(periodKey));
  if (!expiresAt) return false;
  if (Date.now() > expiresAt) {
    _optimisticallyClaimed.delete(String(periodKey));
    return false;
  }
  return true;
};

// In-flight dedup: when DashboardPage and RewardsClaimPanel both mount the
// same hook on Dashboard load, share the same API call instead of round-
// tripping twice. No TTL — once the Promise resolves, the next call refetches
// (e.g. after bumpMiningRefresh from polling or a tx).
let _pendingPeriodsInflight = null;
const fetchRealPendingPeriods = async () => {
  if (_pendingPeriodsInflight) return _pendingPeriodsInflight;
  _pendingPeriodsInflight = (async () => {
    const addr = Stores.network?.defaultAccount;
    if (!addr) return [];
    const [resp] = await Promise.all([getV2UnClaimedAirDrop(addr, true), loadTrxPrice()]);
    if (!resp.success || !resp.data || typeof resp.data !== 'object') return [];
    return Object.entries(resp.data)
      .filter(([roundKey, entry]) => entry && entry.claimed !== true && !isOptimisticallyClaimed(roundKey))
      .map(([roundKey, entry]) => periodFromAirdropRound(roundKey, entry));
  })().finally(() => {
    _pendingPeriodsInflight = null;
  });
  return _pendingPeriodsInflight;
};

const fetchRealPendingRewards = async () => {
  const periods = await fetchRealPendingPeriods();
  const byToken = new Map();
  for (const p of periods) {
    for (const t of p.tokens) {
      const existing = byToken.get(t.token);
      if (existing) {
        existing.amount = BigNumber(existing.amount).plus(t.amount).toFixed();
      } else {
        byToken.set(t.token, {
          token: t.token,
          tokenAddress: t.tokenAddress,
          amount: String(t.amount),
          decimals: t.decimals,
          priceUsd: t.priceUsd
        });
      }
    }
  }
  return Array.from(byToken.values());
};

const fetchRealMarketMiningApy = async _marketAddress => {
  // No dedicated /market mining APY endpoint in the 2026-04-21 changelog; leave disabled until backend provides one.
  return null;
};

const fetchRealVaultMiningApy = async vaultAddress => {
  if (!vaultAddress) return null;
  const userAddress = Stores.network?.defaultAccount;

  // getV2TronBull is parallelized with the other fetches. The dashboard
  // resolver path proves the call returns the same APY fields without a tvl
  // arg, so we no longer block on getVaultInfo just to forward tvlInUsd —
  // this removes the ~1s sequential leg that delayed mining UI on detail
  // page entry.
  const [infoResp, positionResp, , tronBullResp] = await Promise.all([
    getVaultInfo(vaultAddress),
    userAddress ? getVaultMyPosition(vaultAddress, userAddress) : Promise.resolve({ success: false }),
    loadTrxPrice(),
    getV2TronBull(vaultAddress)
  ]);

  if (!infoResp.success || !infoResp.data) return null;
  const info = infoResp.data;
  // Backend returns the raw underlying symbol (WTRX for TRX vaults); normalize
  // here so downstream consumers — daily-earnings tooltip, breakdown rows —
  // show 'TRX' to match VaultStore's already-normalized vaultDetails.
  const displayAssetSymbol = normalizeAssetSymbol(info.asset, info.assetSymbol) || '';

  const tvlInUsd = info.tvlInUsd;
  const tronBullEntry = (tronBullResp.success && tronBullResp.data && tronBullResp.data[vaultAddress]) || {};

  // tronbull returns APY as a fraction (e.g. "0.123" = 12.3%), matching
  // baseApy units; consume directly so formatApyRate's x100 yields the
  // correct percent.
  const miningUsdd = Number(tronBullEntry.USDDNEW) || 0;
  const miningTrx = Number(tronBullEntry.TRXNEW) || 0;

  const farmRate = {
    usdd: String(info.farmRewardUsddAmount24h ?? '0'),
    trx: String(info.farmRewardTrxAmount24h ?? '0')
  };

  const position = positionResp.success ? positionResp.data : null;

  // Per-vault user daily mining = standard interest formula in USD:
  //   daily_USD_value = principal_USD × miningApy_fraction / 365
  // The TRX-denominated mining slice is folded into USDD here so the vault
  
  // USDD figure for mining instead of a TRX number that, on a TRX vault,
  // silently merges with the base TRX bucket. USDD ≈ $1, so no extra
  // conversion is needed for the USDD slice. Sourced from
  // /vault/position.depositUsd plus the vault's mining APY split (tronbull's
  // USDDNEW / TRXNEW); the dashboard hook (useUserPositionMining) keeps its
  // own per-token output and is intentionally left alone.
  const principalUsd = BigNumber(position?.depositUsd ?? 0);
  const userMiningUsddNative = position ? principalUsd.times(miningUsdd).div(365) : BigNumber(0);
  const userMiningTrxAsUsd = position ? principalUsd.times(miningTrx).div(365) : BigNumber(0);
  const userMiningUsdd = userMiningUsddNative.plus(userMiningTrxAsUsd).toFixed();
  const userMiningTrx = '0';
  const userMiningUsd = BigNumber(userMiningUsdd).times(priceFor('USDD')).toNumber();

  return {
    baseApy: Number(info.apy) || 0,
    miningApy: { usdd: miningUsdd, trx: miningTrx, total: miningUsdd + miningTrx },
    miningRate: farmRate,
    tvlInUsd: tvlInUsd != null ? String(tvlInUsd) : '0',
    dailyEarnings: {
      base: position
        ? {
            amount: String(position.dailyInterestAmount ?? '0'),
            token: displayAssetSymbol,
            amountUsd: Number(position.dailyInterest) || 0
          }
        : null,
      mining: position
        ? {
            usdd: userMiningUsdd,
            trx: userMiningTrx,
            amountUsd: userMiningUsd
          }
        : null
    }
  };
};

let _userPositionMiningInflight = null;
const fetchRealUserPositionMining = async () => {
  if (_userPositionMiningInflight) return _userPositionMiningInflight;
  _userPositionMiningInflight = (async () => {
    const addr = Stores.network?.defaultAccount;
    if (!addr) return null;
    const [resp] = await Promise.all([getMyPosition(addr), loadTrxPrice()]);
    if (!resp.success || !resp.data) return null;
    // /index/position's miningApy / miningApyUsdd / miningApyTrx aren't read
    // anywhere — the per-vault APY breakdown comes from getV2TronBull
    // (useVaultMiningApy) and the dashboard panel's "is mining active"
    // signal comes from getV2Tronbullish (useAccruingMining: gainNew /
    // gainLast). Skipping them here keeps this hook focused on dailyEarnings.
    const { dailyRevenue, dailyMiningRewardUsdd, dailyMiningRewardTrx } = resp.data;

    const userMiningUsdd = String(dailyMiningRewardUsdd ?? '0');
    const userMiningTrx = String(dailyMiningRewardTrx ?? '0');
    const userMiningUsd = BigNumber(userMiningUsdd)
      .times(priceFor('USDD'))
      .plus(BigNumber(userMiningTrx).times(priceFor('TRX')))
      .toNumber();
    const hasMining = BigNumber(userMiningUsdd).gt(0) || BigNumber(userMiningTrx).gt(0);

    return {
      dailyEarnings: {
        base: { amount: String(dailyRevenue ?? '0'), token: 'USD', amountUsd: Number(dailyRevenue) || 0 },
        mining: hasMining ? { usdd: userMiningUsdd, trx: userMiningTrx, amountUsd: userMiningUsd } : null
      }
    };
  })().finally(() => {
    _userPositionMiningInflight = null;
  });
  return _userPositionMiningInflight;
};

const CLAIM_INTL_OBJ = {
  title: 'lend.withdraw',
  title2: 'deposit.transactionsent',
  title3: 'v2.transaction_confirm_fail',
  title4: 'deposit.confirm_transaction',
  obj: { value: '', token: 'Rewards' },
  transType: 'reward'
};

const sendRealClaimPeriod = async period => {
  if (!period || !Array.isArray(period.tokens) || period.tokens.length === 0) {
    throw new Error('invalid period payload');
  }

  const contractAddress = config.merkleDistributorV2;
  if (!contractAddress) {
    const error = new Error('v2 mining distributor not configured for current env');
    error.code = 'DISTRIBUTOR_NOT_CONFIGURED';
    throw error;
  }

  // Backend builds the merkle tree with leaves encoded as (index, account,
  // uint256[] amounts) — slot order matches tokenAddress[]/tokenSymbol[],
  // including zero-amount slots — so the distributor only exposes the array
  // form of multiClaim and we always pass amounts as an array.
  const funcSelector = 'multiClaim((uint256,uint256,uint256[],bytes32[])[])';
  const amountParam = period.tokens.map(t => t.amountRaw ?? t.amount);

  const parametersV2 = [[period.merkleIndex, period.index, amountParam, period.proof]];

  const system = Stores.system;
  if (!system || typeof system.getMultiReward !== 'function') {
    throw new Error('system store unavailable for claim');
  }

  if (await isAlreadyClaimed(contractAddress, period.merkleIndex, period.index)) {
    // Chain says this merkle leaf is already spent; the backend just hasn't
    // refreshed yet. Surface it as a dedicated ALREADY_CLAIMED error so the UI
    // can inform the user and wait for the indexer to catch up instead of
    // paying gas to submit a tx that will revert. We deliberately don't
    // mutate the optimistic cache here — the backend is still the source of
    // truth for the displayed list.
    const error = new Error('claim already settled on-chain');
    error.code = 'ALREADY_CLAIMED';
    throw error;
  }

  const rootReady = await isMerkleRootReady(contractAddress, period.merkleIndex);
  if (!rootReady) {
    const error = new Error('claim rewards are not ready');
    error.code = 'MERKLE_ROOT_NOT_READY';
    throw error;
  }

  // getFeeLimitCommon can't estimate this call (parametersV2 is a nested tuple array and we
  // hand the ABI-encoded payload to getMultiReward via shieldedParameter instead), so it
  // always threw "Invalid parameter type provided: undefined" from triggerEnergy and fell
  // back to Config.feeLimit. Skip the noisy call and let getMultiReward use that fallback.
  const txID = await system.getMultiReward([parametersV2], CLAIM_INTL_OBJ, false, contractAddress, funcSelector);

  if (!txID) {
    throw new Error('claim transaction failed');
  }

  const txConfirmed = await system.waitForTxConfirmation(txID);
  if (!txConfirmed) {
    const error = new Error('claim transaction not confirmed');
    error.code = 'CLAIM_TX_NOT_CONFIRMED';
    error.txHash = txID;
    throw error;
  }

  // Tx is on-chain and didn't revert, so the claim has succeeded. Hide the round
  // from the UI immediately via the optimistic cache; the /getAllUnClaimedAirDrop
  // indexer can lag past our polling window and that used to surface as a bogus
  // "claim failed" even though funds had moved.
  markOptimisticallyClaimed(period.periodKey);

  // Best-effort wait so the next refresh sees a consistent backend state, but
  // never treat timeout as a claim failure — the chain is the source of truth.
  const claimed = await waitForClaimedState(period);
  if (!claimed) {
    console.warn(`claim ${period.periodKey} tx ${txID} confirmed on-chain; backend still reports unclaimed.`);
  }

  return { status: 'success', txHash: txID, periodKey: period.periodKey };
};

// --- Resolver prefetch (dashboard-wide) ----------------------------------------

let _resolverCache = null;
let _resolverLoadedAt = 0;
let _resolverInflight = null;
const RESOLVER_TTL_MS = 5 * 60 * 1000;

const loadResolverEntries = async (force = false) => {
  const now = Date.now();
  if (!force && _resolverCache && now - _resolverLoadedAt < RESOLVER_TTL_MS) return _resolverCache;
  if (!force && _resolverInflight) return _resolverInflight;
  _resolverInflight = getV2TronBull()
    .then(resp => {
      const raw = resp.success && resp.data ? resp.data : {};
      const map = new Map();
      // tronbull returns APY as a fraction (e.g. "0.123" = 12.3%), matching
      // baseApy units; consume directly so the tooltip and formatApyRate's
      // x100 yield the correct percent.
      for (const [pool, entry] of Object.entries(raw)) {
        const usdd = Number(entry?.USDDNEW) || 0;
        const trx = Number(entry?.TRXNEW) || 0;
        const total = usdd + trx;
        map.set(pool, { usdd, trx, total });
      }
      _resolverCache = map;
      _resolverLoadedAt = Date.now();
      return map;
    })
    .catch(() => new Map())
    .finally(() => {
      _resolverInflight = null;
    });
  return _resolverInflight;
};

export const preloadMiningResolver = () => {
  if (config.USE_MINING_MOCK) return;
  loadResolverEntries();
};

const isRealVaultMiningEnabled = vaultAddress => {
  if (!vaultAddress || !_resolverCache) return false;
  const entry = _resolverCache.get(vaultAddress);
  return !!(entry && entry.total > 0);
};

const isRealMarketMiningEnabled = _marketId => false;

const getRealVaultMiningEntry = vaultAddress => {
  if (!vaultAddress || !_resolverCache) return null;
  const entry = _resolverCache.get(vaultAddress);
  if (!entry || entry.total <= 0) return null;
  return {
    baseApy: 0,
    miningApy: { usdd: entry.usdd, trx: entry.trx, total: entry.total }
  };
};

// --- Hooks ---------------------------------------------------------------------

// Bumped by stores after supply/withdraw/borrow/repay/claim and on the dashboard
// polling tick; mining hooks read it inside an observer-wrapped tree so the
// mobx track triggers a re-render → the useEffect dep changes → refetch. Fixes
// vault detail / dashboard mining UI staying stale until a manual refresh.
const readMiningRefreshKey = () => Stores.dashboardStore?.miningRefreshKey ?? 0;

export const useMiningRewards = () => {
  const [data, setData] = useState({ rewards: [], totalUsd: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const reqIdRef = useRef(0);
  const defaultAccount = Stores.network?.defaultAccount;
  const refreshKey = readMiningRefreshKey();

  const load = useCallback(async () => {
    const reqId = ++reqIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const rewards = config.USE_MINING_MOCK ? await fetchMockPendingRewards() : await fetchRealPendingRewards();
      if (reqId !== reqIdRef.current) return;
      setData({ rewards, totalUsd: sumRewardsUsd(rewards) });
    } catch (e) {
      if (reqId !== reqIdRef.current) return;
      setError(e);
    } finally {
      if (reqId === reqIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, defaultAccount, refreshKey]);

  return { ...data, loading, error, refresh: load };
};







const EMPTY_ACCRUING = {
  accruingUsd: 0,
  settlingUsd: 0,
  settlingTokens: [],
  settlementTime: '',
  globalSettlementStatus: false
};

let _accruingInflight = null;
const fetchRealAccruingMining = async addr => {
  if (_accruingInflight) return _accruingInflight;
  _accruingInflight = (async () => {
    if (!addr) return EMPTY_ACCRUING;
    const resp = await getV2Tronbullish(undefined, addr);
    if (!resp.success || !resp.data) return EMPTY_ACCRUING;
    let accruing = BigNumber(0);
    let settling = BigNumber(0);
    let settlementTime = '';
    let globalSettlementStatus = false;
    
    // token's gainNew (current round's accruing earnings, heading to the
    // next settlement boundary). Same source as V1 (transferringSoonBreakdown
    // / amountNew). The currRewardStatus === '2' filter is GLOBAL — when any
    // token in any pool reports it, the backend's gainNew across the board
    // is in flux, so V1 hides the whole row as "--". Mirror that here so V2
    // and V1 stay aligned: aggregate gainNew per token unconditionally and
    // surface globalSettlementStatus so the tooltip can swap to "--".
    const pendingByToken = new Map();
    for (const poolEntry of Object.values(resp.data)) {
      if (!poolEntry) continue;
      for (const [tokenKey, tokenEntry] of Object.entries(poolEntry)) {
        if (!tokenEntry || tokenKey === 'NFTNEW' || tokenKey === 'NFT') continue;
        const symbol = tokenKey.replace(/NEW$/, '');
        const price = tokenEntry.price || 0;
        const gainNew = BigNumber(tokenEntry.gainNew || 0);
        const gainLast = BigNumber(tokenEntry.gainLast || 0);
        accruing = accruing.plus(gainNew.times(price));
        // gainLast only counts toward the dashboard combinedRewardsUsd when
        // the previous round is in the brief miningStatus === 2 window AND
        // currRewardStatus === '1' (current round still emitting normally —
        // gainLast is a stable value not yet migrated to airdrop). Without
        // the currRewardStatus guard the figure double-counts when status
        // moves to '2'/'3' (closing / merkle published).
        if (
          Number(tokenEntry.miningStatus) === 2 &&
          String(tokenEntry.currRewardStatus ?? '') === '1' &&
          gainLast.gt(0)
        ) {
          settling = settling.plus(gainLast.times(price));
        }
        if (gainNew.gt(0)) {
          pendingByToken.set(symbol, (pendingByToken.get(symbol) || BigNumber(0)).plus(gainNew));
          if (!settlementTime && tokenEntry.currEndTime && tokenEntry.currEndTime !== '1970-01-01 08:00') {
            settlementTime = tokenEntry.currEndTime;
          }
        }
        if (String(tokenEntry.currRewardStatus ?? '') === '2') {
          globalSettlementStatus = true;
        }
      }
    }
    return {
      accruingUsd: accruing.toNumber(),
      settlingUsd: settling.toNumber(),
      settlingTokens: Array.from(pendingByToken.entries()).map(([token, amount]) => ({
        token,
        amount: amount.toFixed()
      })),
      settlementTime,
      globalSettlementStatus
    };
  })().finally(() => {
    _accruingInflight = null;
  });
  return _accruingInflight;
};

export const useAccruingMining = () => {
  const [data, setData] = useState(EMPTY_ACCRUING);
  const [loading, setLoading] = useState(false);
  const defaultAccount = Stores.network?.defaultAccount;
  const refreshKey = readMiningRefreshKey();

  useEffect(() => {
    if (config.USE_MINING_MOCK || !defaultAccount) {
      setData(EMPTY_ACCRUING);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchRealAccruingMining(defaultAccount)
      .then(next => {
        if (!cancelled) setData(next);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [defaultAccount, refreshKey]);

  return { ...data, loading };
};

export const useMiningPeriods = () => {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const reqIdRef = useRef(0);
  const defaultAccount = Stores.network?.defaultAccount;
  const refreshKey = readMiningRefreshKey();

  const load = useCallback(async () => {
    const reqId = ++reqIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const next = config.USE_MINING_MOCK ? await fetchMockPendingPeriods() : await fetchRealPendingPeriods();
      if (reqId !== reqIdRef.current) return;
      setPeriods(next);
    } catch (e) {
      if (reqId !== reqIdRef.current) return;
      setError(e);
    } finally {
      if (reqId === reqIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, defaultAccount, refreshKey]);

  const totalUsd = sumPeriodsUsd(periods);

  return { periods, totalUsd, loading, error, refresh: load };
};

const emptyMiningApy = () => ({ usdd: 0, trx: 0, total: 0 });

const normalizeMiningApy = raw => {
  if (raw == null) return emptyMiningApy();
  if (typeof raw === 'number') {
    const v = Number(raw) || 0;
    return { usdd: v, trx: 0, total: v };
  }
  const usdd = Number(raw.usdd) || 0;
  const trx = Number(raw.trx) || 0;
  const total = Number.isFinite(Number(raw.total)) ? Number(raw.total) : usdd + trx;
  return { usdd, trx, total };
};

const buildApyResult = entry => {
  if (!entry) return { baseApy: 0, miningApy: emptyMiningApy(), totalApy: 0, enabled: false };
  const baseApy = Number(entry.baseApy) || 0;
  const miningApy = normalizeMiningApy(entry.miningApy);
  return { baseApy, miningApy, totalApy: baseApy + miningApy.total, enabled: miningApy.total > 0 };
};

export const useMarketMiningApy = marketAddress => {
  const [data, setData] = useState(buildApyResult(null));
  const [loading, setLoading] = useState(false);
  const refreshKey = readMiningRefreshKey();

  useEffect(() => {
    if (!marketAddress) return;
    let cancelled = false;
    setLoading(true);
    const fetcher = config.USE_MINING_MOCK ? fetchMockMarketMiningApy : fetchRealMarketMiningApy;
    fetcher(marketAddress)
      .then(entry => {
        if (!cancelled) setData(buildApyResult(entry));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [marketAddress, refreshKey]);

  return { ...data, loading };
};

const EMPTY_DAILY_EARNINGS = { base: null, mining: null };

const normalizeMiningRate = rate => {
  if (!rate) return null;
  return { usdd: String(rate.usdd ?? '0'), trx: String(rate.trx ?? '0') };
};

// Synchronously hydrate from the dashboard-wide resolver cache so navigating
// into a detail page (where the cache was populated by preloadMiningResolver)
// shows the fire icon / mining APY in the first frame, not after the
// per-vault fetch chain resolves.
const hydrateFromResolverCache = vaultAddress => {
  if (!vaultAddress || config.USE_MINING_MOCK) return null;
  const raw = getRealVaultMiningEntry(vaultAddress);
  if (!raw) return null;
  return {
    ...buildApyResult(raw),
    dailyEarnings: EMPTY_DAILY_EARNINGS,
    miningRate: null,
    tvlInUsd: '0'
  };
};

export const useVaultMiningApy = vaultAddress => {
  const [data, setData] = useState(
    () =>
      hydrateFromResolverCache(vaultAddress) || {
        ...buildApyResult(null),
        dailyEarnings: EMPTY_DAILY_EARNINGS,
        miningRate: null,
        tvlInUsd: '0'
      }
  );
  const [loading, setLoading] = useState(false);
  const defaultAccount = Stores.network?.defaultAccount;
  const refreshKey = readMiningRefreshKey();

  useEffect(() => {
    if (!vaultAddress) return;
    let cancelled = false;
    const cached = hydrateFromResolverCache(vaultAddress);
    if (cached) setData(prev => ({ ...prev, ...cached }));
    setLoading(true);
    const fetcher = config.USE_MINING_MOCK ? fetchMockVaultMiningApy : fetchRealVaultMiningApy;
    fetcher(vaultAddress)
      .then(entry => {
        if (cancelled) return;
        const apy = buildApyResult(entry);
        setData({
          ...apy,
          dailyEarnings: (entry && entry.dailyEarnings) || EMPTY_DAILY_EARNINGS,
          miningRate: normalizeMiningRate(entry && entry.miningRate),
          tvlInUsd: (entry && entry.tvlInUsd) || '0'
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [vaultAddress, defaultAccount, refreshKey]);

  return { ...data, loading };
};

export const useUserPositionMining = () => {
  const [dailyEarnings, setDailyEarnings] = useState(EMPTY_DAILY_EARNINGS);
  const [loading, setLoading] = useState(false);
  const defaultAccount = Stores.network?.defaultAccount;
  const refreshKey = readMiningRefreshKey();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const fetcher = config.USE_MINING_MOCK ? fetchMockUserPositionMining : fetchRealUserPositionMining;
    fetcher()
      .then(entry => {
        if (cancelled) return;
        setDailyEarnings((entry && entry.dailyEarnings) || EMPTY_DAILY_EARNINGS);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [defaultAccount, refreshKey]);

  return { dailyEarnings, loading };
};

export const useVaultMiningResolver = () => {
  // Resolver cache is a module-level Map filled asynchronously; subscribe so
  // consumers re-render once entries arrive (otherwise the fire icon stays
  // hidden whenever fetchVaultList resolves before loadResolverEntries).
  const [, setTick] = useState(0);
  const refreshKey = readMiningRefreshKey();
  useEffect(() => {
    if (config.USE_MINING_MOCK) return undefined;
    let cancelled = false;
    // Force a refetch when bumped — the 5-min TTL would otherwise re-serve
    // stale eligibility (e.g. a vault that just became fire-enabled).
    loadResolverEntries(refreshKey > 0).then(() => {
      if (!cancelled) setTick(t => t + 1);
    });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (config.USE_MINING_MOCK) {
    const defaultEntry = buildApyResult(getMockDefaultVaultMiningEntry());
    return {
      isEnabled: vaultAddress => isMockVaultMiningEnabled(vaultAddress),
      getEntry: vaultAddress => (isMockVaultMiningEnabled(vaultAddress) ? defaultEntry : null)
    };
  }
  return {
    isEnabled: vaultAddress => isRealVaultMiningEnabled(vaultAddress),
    getEntry: vaultAddress => {
      const raw = getRealVaultMiningEntry(vaultAddress);
      return raw ? buildApyResult(raw) : null;
    }
  };
};

export const useMarketMiningResolver = () => {
  if (config.USE_MINING_MOCK) {
    const defaultEntry = buildApyResult(getMockDefaultVaultMiningEntry());
    return {
      isEnabled: marketId => isMockMarketMiningEnabled(marketId),
      getEntry: marketId => (isMockMarketMiningEnabled(marketId) ? defaultEntry : null)
    };
  }
  return {
    isEnabled: marketId => isRealMarketMiningEnabled(marketId),
    getEntry: _marketId => null
  };
};

export const useClaimMiningPeriod = () => {
  const [status, setStatus] = useState('idle');
  const [activeKey, setActiveKey] = useState(null);
  const [error, setError] = useState(null);

  const claim = useCallback(async period => {
    const periodKey = typeof period === 'string' ? period : period?.periodKey;
    setError(null);
    setActiveKey(periodKey);
    setStatus('pending');
    try {
      const result = config.USE_MINING_MOCK ? await sendMockClaimPeriod(period) : await sendRealClaimPeriod(period);
      setStatus('success');
      Stores.dashboardStore?.bumpMiningRefresh?.();
      return result;
    } catch (e) {
      setError(e);
      setStatus('failed');
      throw e;
    } finally {
      setActiveKey(null);
    }
  }, []);

  return { claim, status, activeKey, error };
};
