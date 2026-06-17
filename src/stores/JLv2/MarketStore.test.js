// MarketStore.test.js

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { BigNumber } from 'bignumber.js';
import MarketStore from './MarketStore.js';

vi.mock('../../service/V2backend', () => ({
  getMarketInfo: vi.fn(),
  getMarketMyPosition: vi.fn(),
  getMarketBorrowHistory: vi.fn(),
  getMarketVaultList: vi.fn()
}));
vi.mock('../../utils/blockchain', () => ({
  getTRC20Balance: vi.fn(),
  getTrxBalance: vi.fn(),
  tronObj: {
    tronWeb: {
      toBigNumber: val => new BigNumber(val)
    }
  }
}));

vi.mock('../../stores/strx.js', () => {
  // Mock the StrxStore class to prevent its constructor from running
  return {
    default: class MockStrxStore {
      constructor() {
        // The constructor is now empty and won't init tronWeb
      }
      // Add any fake methods or properties if rootStore needs them
      // example: someProperty = 'mockedValue';
    }
  };
});


const setLimit = val => {
  if (val.isNaN() || val.isNegative()) return new BigNumber(0);
  if (!val.isFinite()) return new BigNumber(100);
  if (val.gt(100)) return new BigNumber(100);
  return val;
};


global.setLimit = setLimit;


const mockRootStore = {
  lend: {
    getEnergyFee: vi.fn().mockResolvedValue('420') 
  },
  systemV2: {},
  network: {},
  transactionV2: {}
};

describe('MarketStore.setBorrowInput', () => {
  let store;

  
  beforeEach(() => {
    
    vi.clearAllMocks();

    
    store = new MarketStore(mockRootStore);

    
    store.marketDetails = {
      borrowApy: '0.0365', // 3.65% APY
      borrowPrice: '1', 
      collateralPrice: '50', 
      minLoanValue: '10', 
      borrowSymbol: 'USDT'
    };
    store.myPosition = {
      lltv: '0.8', 
      borrowUsd: '400', 
      collateralUsd: '1000' 
    };
    store.availableToBorrow = '500'; 
    store.collateralInputAmount = '0'; 
    store.collateralInputError = '';
  });

  afterEach(() => {
    
    delete global.setLimit;
  });
  // ----------------------------------------
  
  // ----------------------------------------
  describe('1. 基础状态和利息计算', () => {
    it('应该正确清理并设置 borrowInputAmount', () => {
      store.setBorrowInput('123abc45.6');
      expect(store.borrowInputAmount).toBe('12345.6');
    });

    it('输入为 0 时，日利息应为 0', () => {
      store.setBorrowInput('0');
      expect(store.estimatedDailyInterest.toString()).toBe('0');
    });

    it('APY 为 0 时，日利息应为 0', () => {
      store.marketDetails.borrowApy = '0';
      store.setBorrowInput('1000');
      expect(store.estimatedDailyInterest.toString()).toBe('0');
    });

    it('应根据 APY 和金额正确计算日利息', () => {
      // 1000 * 0.0365 / 365 = 0.1
      store.setBorrowInput('1000');
      expect(store.estimatedDailyInterest.toString()).toBe('0.1');
    });

    it('应清除上一次的错误和警告信息 (在无新错误时)', () => {
      
      store.setBorrowInput('1000'); 
      expect(store.borrowInputError).not.toBe('');

      
      store.setBorrowInput('100');
      expect(store.borrowInputError).toBe('');
      expect(store.borrowWarningMsg).toBe('');
    });
  });

  // ----------------------------------------
  
  // ----------------------------------------
  describe('2. 校验逻辑 (Errors & Warnings)', () => {
    it('当输入金额 > availableToBorrow 时, 应设置 borrowInputError', () => {
      store.availableToBorrow = '499';
      store.setBorrowInput('500');
      expect(store.borrowInputError).toBe('已超过可借数量，请增加抵押品');
      expect(store.borrowWarningMsg).toBe('');
    });

    it('当 0 < 输入金额 < minLoanValue 时, 应设置 borrowInputError', () => {
      store.marketDetails.minLoanValue = '10';
      store.setBorrowInput('9.99');
      expect(store.borrowInputError).toBe('10USDT 起借');
      expect(store.borrowWarningMsg).toBe('');
    });

    it('当输入金额为 0 时, 不应触发 minLoanValue 错误', () => {
      store.marketDetails.minLoanValue = '10';
      store.setBorrowInput('0');
      expect(store.borrowInputError).toBe('');
    });

    it('当计算出的 safePercent >= 80% 时, 应设置 borrowWarningMsg', () => {
      
      
      
      store.setBorrowInput('250');
      expect(store.borrowInputError).toBe(''); 
      expect(store.borrowWarningMsg).toBe('当前风险值较高，请增加抵押品');
    });

    it('当 safePercent = 100% 时, 必须设置 borrowWarningMsg', () => {
      
      
      store.setBorrowInput('400');
      expect(store.borrowInputError).toBe('');
      expect(store.borrowWarningMsg).toBe('当前风险值较高，请增加抵押品');
    });
  });

  // ----------------------------------------
  
  // ----------------------------------------
  describe('3. 风险百分比 (safePercent) 计算', () => {
    describe('场景 A: 无初始仓位 (myPosition = null)', () => {
      beforeEach(() => {
        store.myPosition = null;
      });

      it('仅借款 (tempA > 0), 无抵押 (tempB = 0), safePercent 应为 100', () => {
        store.setBorrowInput('100');
        expect(store.safePercent.toString()).toBe('100');
        expect(store.borrowWarningMsg).toBe('当前风险值较高，请增加抵押品');
      });

      it('不借款 (tempA = 0), 无抵押 (tempB = 0), safePercent 应为 0', () => {
        store.setBorrowInput('0');
        expect(store.safePercent.toString()).toBe('0');
      });

      it('同时输入借款和抵押 (tempA > 0, tempB > 0), 应正确计算', () => {
        
        store.collateralInputAmount = '1';
        store.marketDetails.lltv = '0.8'; 

        
        
        
        store.setBorrowInput('10');
        expect(store.safePercent.toString()).toBe('25');
      });
    });

    describe('场景 B: 有初始仓位 (默认 beforeEach)', () => {
      it('输入 0 时，safePercent 应反映当前仓位风险', () => {
        
        store.setBorrowInput('0');
        expect(store.safePercent.toString()).toBe('50');
      });

      it('增加借款时，safePercent 应正确增加', () => {
        
        
        
        store.setBorrowInput('100');
        expect(store.safePercent.toString()).toBe('62.5');
      });

      it('应同时考虑借款输入和抵押品输入 (来自 collateralInputAmount)', () => {
        
        
        
        store.collateralInputAmount = '10';

        
        store.setBorrowInput('100');
        expect(store.safePercent.toFixed(2)).toBe('41.67');
      });

      it('如果抵押品输入框有错误 (collateralInputError), 不应计算其金额', () => {
        
        
        
        store.collateralInputAmount = '10';
        store.collateralInputError = '余额不足'; 

        
        store.setBorrowInput('100');
        expect(store.safePercent.toString()).toBe('62.5');
      });
    });

    describe('场景 C: 边缘情况 (LLTV, 0, Infinity)', () => {
      it('当 lltv 为 0 时, 只要有债务, safePercent 应为 100', () => {
        store.myPosition.lltv = '0';
        
        store.setBorrowInput('0');
        expect(store.safePercent.toString()).toBe('100');
      });

      it('当 lltv 为 null 或 undefined 时, 只要有债务, safePercent 应为 100', () => {
        store.myPosition.lltv = null;
        store.setBorrowInput('0'); 
        expect(store.safePercent.toString()).toBe('100');

        store.myPosition.lltv = undefined;
        store.setBorrowInput('0');
        expect(store.safePercent.toString()).toBe('100');
      });

      it('当 lltv 为 0 且 债务也为 0 时, safePercent 应为 0', () => {
        store.myPosition.lltv = '0';
        store.myPosition.borrowUsd = '0';
        store.setBorrowInput('0');
        expect(store.safePercent.toString()).toBe('0');
      });
    });
  });
});
