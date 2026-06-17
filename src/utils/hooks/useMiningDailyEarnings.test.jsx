import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useUserPositionMining, useVaultMiningApy } from './useMining';

const mocks = vi.hoisted(() => ({
  config: { USE_MINING_MOCK: false },
  store: {
    network: { defaultAccount: 'TUSER' },
    dashboardStore: {
      userVaults: [{ vaultAddress: 'VAULT_A' }, { vaultAddress: 'VAULT_B' }]
    }
  },
  getMyPosition: vi.fn(),
  getVaultMyPosition: vi.fn(),
  getVaultInfo: vi.fn(),
  getV2TronBull: vi.fn(),
  getTokenPrice: vi.fn()
}));

vi.mock('../../config', () => ({ default: mocks.config }));
vi.mock('../../stores', () => ({ default: mocks.store }));
vi.mock('../../service/mock/mining', () => ({
  fetchMockPendingRewards: vi.fn(),
  fetchMockPendingPeriods: vi.fn(),
  fetchMockMarketMiningApy: vi.fn(),
  fetchMockVaultMiningApy: vi.fn(),
  fetchMockUserPositionMining: vi.fn(),
  isMockVaultMiningEnabled: vi.fn(),
  isMockMarketMiningEnabled: vi.fn(),
  getMockDefaultVaultMiningEntry: vi.fn()
}));
vi.mock('../mock/miningContract', () => ({ sendMockClaimPeriod: vi.fn() }));
vi.mock('../backend', () => ({
  getV2TronBull: (...args) => mocks.getV2TronBull(...args),
  getV2Tronbullish: vi.fn(),
  getV2UnClaimedAirDrop: vi.fn(),
  getTokenPrice: (...args) => mocks.getTokenPrice(...args)
}));
vi.mock('../../service/V2backend', () => ({
  getVaultInfo: (...args) => mocks.getVaultInfo(...args),
  getVaultMyPosition: (...args) => mocks.getVaultMyPosition(...args),
  getMyPosition: (...args) => mocks.getMyPosition(...args)
}));

const UserPositionHarness = () => {
  const { dailyEarnings } = useUserPositionMining();
  return (
    <div>
      <span data-testid="user-usdd">{dailyEarnings.mining?.usdd || '0'}</span>
      <span data-testid="user-trx">{dailyEarnings.mining?.trx || '0'}</span>
      <span data-testid="user-usd">{dailyEarnings.mining?.amountUsd || '0'}</span>
    </div>
  );
};

const VaultPositionHarness = () => {
  const { dailyEarnings } = useVaultMiningApy('VAULT_A');
  return (
    <div>
      <span data-testid="vault-usdd">{dailyEarnings.mining?.usdd || '0'}</span>
      <span data-testid="vault-trx">{dailyEarnings.mining?.trx || '0'}</span>
      <span data-testid="vault-usd">{dailyEarnings.mining?.amountUsd || '0'}</span>
    </div>
  );
};

describe('mining daily earnings sources', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.config.USE_MINING_MOCK = false;
    mocks.store.network.defaultAccount = 'TUSER';
    mocks.store.dashboardStore.userVaults = [{ vaultAddress: 'VAULT_A' }, { vaultAddress: 'VAULT_B' }];
    mocks.getTokenPrice.mockResolvedValue({ success: true, priceTRX: 0.2 });
    mocks.getMyPosition.mockResolvedValue({
      success: true,
      data: {
        netEarnApy: '0.1',
        dailyRevenue: '10',
        miningApy: '0.03',
        miningApyUsdd: '0.02',
        miningApyTrx: '0.01',
        dailyMiningRewardUsdd: '99',
        dailyMiningRewardTrx: '88'
      }
    });
    mocks.getVaultInfo.mockResolvedValue({
      success: true,
      data: {
        apy: '0.1',
        tvlInUsd: '1000',
        assetSymbol: 'USDD',
        farmRewardUsddAmount24h: '0',
        farmRewardTrxAmount24h: '0'
      }
    });
    mocks.getV2TronBull.mockResolvedValue({ success: true, data: { VAULT_A: { USDDNEW: 0.05, TRXNEW: 0.02 } } });
    mocks.getVaultMyPosition.mockImplementation(vaultAddress =>
      Promise.resolve({
        success: true,
        data:
          vaultAddress === 'VAULT_A'
            ? {
                dailyInterestAmount: '1',
                dailyInterest: '1',
                depositUsd: '7300',
                farmRewardUsddAmount24h: '1000000000000000000',
                farmRewardTrxAmount24h: '2000000'
              }
            : {
                dailyInterestAmount: '2',
                dailyInterest: '2',
                depositUsd: '14600',
                farmRewardUsddAmount24h: '3000000000000000000',
                farmRewardTrxAmount24h: '4000000'
              }
      })
    );
  });

  afterEach(() => cleanup());

  it('reads dashboard My Position daily mining from /index/position user-wide fields', async () => {
    render(<UserPositionHarness />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    // /index/position exposes user-wide dailyMiningRewardUsdd / Trx already
    // denominated in human units (USDD: 99, TRX: 88 in this mock). The
    // dashboard reads them directly — summing /vault/position fields gave
    // wrong numbers because farmReward*Amount24h is not 1e18-scaled.
    // USD = 99*1 + 88*0.2 = 116.6.
    expect(mocks.getMyPosition).toHaveBeenCalledWith('TUSER');
    expect(mocks.getVaultMyPosition).not.toHaveBeenCalled();
    expect(screen.getByTestId('user-usdd').textContent).toBe('99');
    expect(screen.getByTestId('user-trx').textContent).toBe('88');
    expect(screen.getByTestId('user-usd').textContent).toBe('116.6');
  });

  it('computes vault detail mining tokens via depositUsd x miningApy / 365 (no /index/position, no farmReward fields)', async () => {
    render(<VaultPositionHarness />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    // VAULT_A: depositUsd=7300, USDDNEW APY=0.05, TRXNEW APY=0.02, TRX price=0.2.
    //   usdd_native = 7300 * 0.05 / 365            = 1    USDD
    //   trx_as_usd  = 7300 * 0.02 / 365            = 0.4  USDD-equivalent
    //   mining.usdd = 1 + 0.4                      = 1.4  USDD (folded for detail page)
    //   mining.trx  = 0  (TRX slice already merged into USDD)
    //   mining.usd  = 1.4 USD
    // The vault detail page must NOT call /index/position (its dailyMiningReward*
    // are user-wide totals across all mining vaults).
    expect(mocks.getVaultMyPosition).toHaveBeenCalledWith('VAULT_A', 'TUSER');
    expect(mocks.getMyPosition).not.toHaveBeenCalled();
    expect(screen.getByTestId('vault-usdd').textContent).toBe('1.4');
    expect(screen.getByTestId('vault-trx').textContent).toBe('0');
    expect(screen.getByTestId('vault-usd').textContent).toBe('1.4');
  });
});
