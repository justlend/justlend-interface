import { describe, it, expect, beforeEach, vi } from 'vitest';
import BigNumber from 'bignumber.js';

// `energyRental.js` reads `tronObj.tronWeb` at module load — stub everything
// the module pulls in before importing the store.
vi.mock('../utils/blockchain', () => ({
  tronObj: { tronWeb: {}, walletTronWeb: null },
  triggerSmartContract: vi.fn(),
  MAX_UINT256: '0x0'
}));

vi.mock('../config', () => ({
  default: {
    chain: { privateKey: '01', fullHost: 'http://test' },
    tokenDefaultPrecision: '1000000000000000000', // 18 decimals — JST-shaped
    rewardNum: 5,
    trxPrecision: 1e6,
    energyRental: { newOrderDefaultEnergyValue: 0 } // class field initializer reads this
  }
}));

vi.mock('../utils/backend', () => ({
  getAllowanceMultiReward: vi.fn(),
  getSTrxDashboard: vi.fn(),
  getSTrxStakeAccount: vi.fn(),
  getStrxRentAllOrderList: vi.fn(),
  getReturnRentInfo: vi.fn(),
  getMarketHistory: vi.fn()
}));

vi.mock('../utils/helper', () => ({
  formatNumber: vi.fn(v => String(v)),
  getTrxBalance: vi.fn()
}));

import EnergyRentalStore from './energyRental';

const makeStore = () => {
  const rootStore = { network: { isConnected: false, defaultAccount: null } };
  return new EnergyRentalStore(rootStore);
};

describe('EnergyRentalStore.filterReward — 18-decimal precision (regression for parseInt truncation)', () => {
  let store;

  beforeEach(() => {
    store = makeStore();
  });

  // Same-shape regression as StrxStore — energyRental.js had the identical
  // `parseInt(amount)` bug. Keep both tests in sync; if one drifts, the
  // other should fail review.
  it('preserves precision for amounts past 2^53 (19-digit chain units)', () => {
    const multiRewardData = {
      r1: { amount: '12345678901234567890' }
    };

    store.filterReward(null, multiRewardData);

    expect(store.totalReward.toString()).toBe('12.34567890123456789');
    expect(store.choosedTotalReward.toString()).toBe('12.34567890123456789');
  });

  it('aggregates multiple 18-decimal amounts without precision loss', () => {
    const multiRewardData = {
      r1: { amount: '1000000000000000000' },
      r2: { amount: '2500000000000000000' },
      r3: { amount: '12345678901234567890' }
    };

    store.filterReward(null, multiRewardData);

    expect(store.totalReward.toString()).toBe('15.84567890123456789');
  });

  it('treats undefined amount as 0', () => {
    const multiRewardData = { r1: {} };

    store.filterReward(null, multiRewardData);

    expect(store.totalReward.toString()).toBe('0');
    expect(store.choosedTotalReward.toString()).toBe('0');
  });

  it('caps choosedTotalReward at Config.rewardNum entries when total exceeds it', () => {
    const multiRewardData = {};
    for (let i = 1; i <= 6; i++) {
      multiRewardData[`r${i}`] = { amount: '1000000000000000000' };
    }

    store.filterReward(null, multiRewardData);

    expect(store.totalReward.toString()).toBe('6');
    expect(store.choosedTotalReward.toString()).toBe('5');
    expect(store.defaultValue.length).toBe(5);
  });

  it('handles small (sub-2^53) safe-range amounts correctly', () => {
    const multiRewardData = {
      r1: { amount: '1000000000000000' }
    };

    store.filterReward(null, multiRewardData);

    expect(store.totalReward.toString()).toBe('0.001');
  });
});
