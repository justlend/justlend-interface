import { describe, it, expect, beforeEach, vi } from 'vitest';
import BigNumber from 'bignumber.js';

// `strx.js` instantiates `new TronWeb(...)` at module load and pulls Config
// at the top level — stub everything before importing the store.
// `new TronWeb(...)` runs at module load — return a real (not arrow) ctor so
// the `new` call is legal. Arrow functions can't be constructors.
vi.mock('tronweb', () => ({
  TronWeb: class {
    constructor() {
      this.setHeader = () => {};
      this.fullNode = { host: '' };
      this.trx = {};
    }
  }
}));

vi.mock('../config', () => ({
  default: {
    chain: { privateKey: '01', fullHost: 'http://test' },
    tokenDefaultPrecision: '1000000000000000000', // 18 decimals — JST-shaped
    rewardNum: 5,
    trxPrecision: 1e6
  }
}));

vi.mock('../utils/backend', () => ({
  getAllowanceMultiReward: vi.fn(),
  getSTrxDashboard: vi.fn(),
  getSTrxStakeAccount: vi.fn(),
  getReturnRentInfo: vi.fn()
}));

vi.mock('../utils/helper', () => ({
  formatNumber: vi.fn(v => String(v)),
  getTrxBalance: vi.fn()
}));

// Imported after vi.mock so the mocks apply to the top-level imports.
import StrxStore from './strx';

const makeStore = () => {
  const rootStore = { network: { isConnected: false, defaultAccount: null } };
  return new StrxStore(rootStore);
};

describe('StrxStore.filterReward — 18-decimal precision (regression for parseInt truncation)', () => {
  let store;

  beforeEach(() => {
    store = makeStore();
  });

  // Sentinel test: this is the case the old `parseInt(amount)` code got
  // wrong — a 19-digit chain amount blows past 2^53 and the JS Number
  // representation rounds the low-order digits before BigNumber sees them.
  // Old: 12.345678901234567 (truncated)
  // New: 12.34567890123456789 (exact)
  it('preserves precision for amounts past 2^53 (19-digit chain units)', () => {
    const multiRewardData = {
      r1: { amount: '12345678901234567890' } // 12.345678901234567890 JST
    };

    store.filterReward(null, multiRewardData);

    expect(store.totalReward.toString()).toBe('12.34567890123456789');
    expect(store.choosedTotalReward.toString()).toBe('12.34567890123456789');
  });

  it('aggregates multiple 18-decimal amounts without precision loss', () => {
    const multiRewardData = {
      r1: { amount: '1000000000000000000' }, // 1 JST
      r2: { amount: '2500000000000000000' }, // 2.5 JST
      r3: { amount: '12345678901234567890' } // 12.345... JST
    };

    store.filterReward(null, multiRewardData);

    // 1 + 2.5 + 12.34567890123456789 = 15.84567890123456789
    expect(store.totalReward.toString()).toBe('15.84567890123456789');
  });

  it('treats undefined amount as 0 (defensive — entry without `amount` key)', () => {
    const multiRewardData = {
      r1: {} // no amount field
    };

    store.filterReward(null, multiRewardData);

    expect(store.totalReward.toString()).toBe('0');
    expect(store.choosedTotalReward.toString()).toBe('0');
  });

  it('caps choosedTotalReward at Config.rewardNum entries when total exceeds it', () => {
    // 6 entries, Config.rewardNum = 5 — choosed should sum only 5
    const multiRewardData = {};
    for (let i = 1; i <= 6; i++) {
      multiRewardData[`r${i}`] = { amount: '1000000000000000000' }; // 1 JST each
    }

    store.filterReward(null, multiRewardData);

    expect(store.totalReward.toString()).toBe('6');
    expect(store.choosedTotalReward.toString()).toBe('5'); // capped
    expect(store.defaultValue.length).toBe(5);
  });

  it('handles small (sub-2^53) safe-range amounts correctly', () => {
    const multiRewardData = {
      r1: { amount: '1000000000000000' } // 0.001 JST
    };

    store.filterReward(null, multiRewardData);

    expect(store.totalReward.toString()).toBe('0.001');
  });
});
