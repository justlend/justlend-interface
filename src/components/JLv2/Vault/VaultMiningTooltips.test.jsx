import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { VaultOverviewStat } from './VaultOverviewStat';
import { ActionBox } from './ActionBox';
import { VaultHistoricalChart } from './VaultHistoricalChart';

const mocks = vi.hoisted(() => ({
  chartOption: null,
  locale: 'en-US',
  store: {
    vaultStore: {
      vaultDetails: {
        address: 'enabled-vault',
        name: 'USDD Vault',
        assetSymbol: 'USDD',
        apy: '0.0421',
        tags: [],
        tvlInUsd: '1000000',
        tvl: '1000000',
        interestInUsd: '1234',
        interest: '1234',
        liquidityInUsd: '500000',
        liquidity: '500000'
      },
      historicalData: {
        currentSupplyUsd: '1000000',
        currentSupplyTokenAmount: '1000000',
        supplyBaseApy: '0.0421',
        supplyMiningApy: '3.12',
        historyRecords: [
          {
            timestamp: 1776643200000,
            supplyTokenAmount: '1000000',
            supplyUsd: '1000000',
            supplyApy: '0.0421',
            miningUsddApy: '0.0312',
            miningTrxApy: '0'
          }
        ]
      },
      isLoading: false,
      activeActionTab: 'supply',
      setActionTab: vi.fn(),
      inputAmount: '1',
      setInputAmount: vi.fn(),
      executeSupply: vi.fn(),
      executeWithdraw: vi.fn(),
      isInputAmountValid: true,
      isActionInProgress: false,
      walletBalance: '10',
      availableAmount: '5',
      inputError: '',
      withdrawWithShares: false,
      hasWarning: false,
      estimatedFee: '-',
      showFeeSuggestion: false,
      handleMaxClick: vi.fn(),
      estimatedDailyEarnings: '0.01',
      setReservedFee: vi.fn()
    },
    network: {
      defaultAccount: 'TMockAddress',
      isRightChain: 1,
      connectWalletV2: vi.fn(),
      changeChain: vi.fn()
    },
    lend: {
      serviceInnerStatus: 'enabled',
      setNoServiceModalAllVisible: vi.fn(),
      theme: 'dark'
    },
    dashboardStore: {
      isFlashing: false
    }
  },
  vaultMining: {
    enabled: true,
    baseApy: 0.0421,
    miningApy: { usdd: 0.0312, trx: 0, total: 0.0312 },
    miningRate: {
      usdd: '3000',
      trx: '0'
    }
  }
}));

vi.mock('../../../stores', () => ({
  default: mocks.store
}));

vi.mock('ismobilejs', () => ({
  default: () => ({ any: false })
}));

vi.mock('echarts', () => ({}));

vi.mock('echarts-for-react', () => ({
  default: ({ option }) => {
    mocks.chartOption = option;
    return <div data-testid="echarts" />;
  }
}));

vi.mock('antd', () => {
  const Select = ({ children }) => <div data-testid="select">{children}</div>;
  Select.Option = ({ children }) => <div>{children}</div>;

  return {
    Tooltip: ({ title, children }) => (
      <div>
        <div data-testid="tooltip-title">{title}</div>
        {children}
      </div>
    ),
    Input: props => <input aria-label="vault-input" value={props.value || ''} readOnly />,
    Skeleton: () => <div>Skeleton</div>,
    Select
  };
});

vi.mock('../../../utils/hooks/useMining', () => ({
  useVaultMiningApy: () => mocks.vaultMining
}));

vi.mock('../../../utils/constant', () => ({
  getIconsJLv2: symbol => `/icons/${symbol}.png`
}));

vi.mock('../../../config', () => ({
  default: {
    tokenDefaultPrecision: 6
  }
}));

vi.mock('../../../utils/helper', () => {
  function MockBigNumber(value) {
    const num = Number(value || 0);
    return {
      valueOf: () => num,
      toString: () => String(num),
      gte: other => num >= Number(other || 0),
      plus: other => MockBigNumber(num + Number(other || 0))
    };
  }

  return {
    BigNumber: MockBigNumber,
    errorMessageTootip: message => <div>{message}</div>
  };
});

vi.mock('../../../utils/formatters', () => ({
  formatApyRate: (value, isPercent = false) => {
    if (value === null || value === undefined) return '-%';
    const num = Number(value);
    if (isNaN(num)) return '0%';
    const pct = isPercent ? num : num * 100;
    return `${parseFloat(pct.toPrecision(12))}%`;
  },
  formatTokenAmount: (value, symbol) => (symbol ? `${value} ${symbol}` : `${value}`),
  formatFiatValue: value => `$${value}`,
  formatCompactFiatValue: value => `$${value}`,
  getXAxisInterval: () => 0
}));

vi.mock('react-intl-universal', () => ({
  default: {
    options: {
      get currentLocale() {
        return mocks.locale;
      }
    },
    get: key => {
      const translations = {
        'en-US': {
          'jlv2.vault.supply_apy1': 'Supply APY',
          'jlv2.vault.supply_apy': 'Supply APY',
          'jlv2.vault.supply_apy3': 'Supply APY',
          'jlv2.vault.tips1': 'Legacy Supply APY tooltip',
          'jlv2.vault.total_supply1': 'Total Supply',
          'jlv2.vault.total_supply': 'Total Supply',
          'jlv2.vault.interest_income': 'Interest Income',
          'jlv2.vault.tips2': 'Interest tooltip',
          'jlv2.home.liquidity': 'Liquidity',
          'jlv2.vault.tips3': 'Liquidity tooltip',
          'jlv2.vault.supply_btn': 'Supply',
          'jlv2.vault.withdraw_btn': 'Withdraw',
          'jlv2.market.balance': 'Balance',
          'jlv2.withdrawable': 'Withdrawable',
          'jlv2.market.max': 'Max',
          'jlv2.vault.daily_earning': 'Daily Earnings',
          'jlv2.vault.vault_data': 'Vault Data',
          'jlv2.vault.usd': 'USD',
          'jlv2.vault.current_total_supply': 'Current Total Supply',
          'jlv2.vault.supply_base_apy': 'Supply Base APY',
          'jlv2.vault.supply_mining_apy': 'Supply Mining APY',
          'jlv2.home.loading': 'Loading',
          'mining.breakdown.base_apy': 'Base APY',
          'mining.breakdown.mining_apy': 'Mining APY',
          'mining.breakdown.total_apy': 'Total APY',
          'mining.breakdown.apy_formula': 'Supply APY = Base APY + Mining APY',
          'mining.rate.title': 'Daily Mining Rewards',
          'mining.rate.unit': 'USDD',
          'navi.wallet_linkbtn': 'Connect Wallet'
        },
        'zh-CN': {
          'jlv2.vault.supply_apy1': 'Supply APY',
          'jlv2.vault.supply_apy': 'Supply APY',
          'jlv2.vault.supply_apy3': 'Supply APY',
          'jlv2.vault.tips1': 'Legacy Supply APY tooltip',
          'jlv2.vault.total_supply1': 'Total Supply',
          'jlv2.vault.total_supply': 'Total Supply',
          'jlv2.vault.interest_income': 'Interest Income',
          'jlv2.vault.tips2': 'Interest tooltip',
          'jlv2.home.liquidity': 'Liquidity',
          'jlv2.vault.tips3': 'Liquidity tooltip',
          'jlv2.vault.supply_btn': 'Supply',
          'jlv2.vault.withdraw_btn': 'Withdraw',
          'jlv2.market.balance': 'Balance',
          'jlv2.withdrawable': 'Withdrawable',
          'jlv2.market.max': 'Max',
          'jlv2.vault.daily_earning': 'Daily Earnings',
          'jlv2.vault.vault_data': 'Vault Data',
          'jlv2.vault.usd': 'USD',
          'jlv2.vault.current_total_supply': 'Current Total Supply',
          'jlv2.vault.supply_base_apy': 'Supply Base APY',
          'jlv2.vault.supply_mining_apy': 'Supply Mining APY',
          'jlv2.home.loading': 'Loading',
          'mining.breakdown.base_apy': 'Base APY',
          'mining.breakdown.mining_apy': 'Mining APY',
          'mining.breakdown.total_apy': 'Total APY',
          'mining.breakdown.apy_formula': 'Supply APY = Base APY + Mining APY',
          'mining.rate.title': '挖矿奖励/日',
          'mining.rate.unit': 'USDD',
          'navi.wallet_linkbtn': 'Connect Wallet'
        },
        'zh-TC': {
          'jlv2.vault.supply_apy1': 'Supply APY',
          'jlv2.vault.supply_apy': 'Supply APY',
          'jlv2.vault.supply_apy3': 'Supply APY',
          'jlv2.vault.tips1': 'Legacy Supply APY tooltip',
          'jlv2.vault.total_supply1': 'Total Supply',
          'jlv2.vault.total_supply': 'Total Supply',
          'jlv2.vault.interest_income': 'Interest Income',
          'jlv2.vault.tips2': 'Interest tooltip',
          'jlv2.home.liquidity': 'Liquidity',
          'jlv2.vault.tips3': 'Liquidity tooltip',
          'jlv2.vault.supply_btn': 'Supply',
          'jlv2.vault.withdraw_btn': 'Withdraw',
          'jlv2.market.balance': 'Balance',
          'jlv2.withdrawable': 'Withdrawable',
          'jlv2.market.max': 'Max',
          'jlv2.vault.daily_earning': 'Daily Earnings',
          'jlv2.vault.vault_data': 'Vault Data',
          'jlv2.vault.usd': 'USD',
          'jlv2.vault.current_total_supply': 'Current Total Supply',
          'jlv2.vault.supply_base_apy': 'Supply Base APY',
          'jlv2.vault.supply_mining_apy': 'Supply Mining APY',
          'jlv2.home.loading': 'Loading',
          'mining.breakdown.base_apy': 'Base APY',
          'mining.breakdown.mining_apy': 'Mining APY',
          'mining.breakdown.total_apy': 'Total APY',
          'mining.breakdown.apy_formula': 'Supply APY = Base APY + Mining APY',
          'mining.rate.title': '挖礦獎勵/日',
          'mining.rate.unit': 'USDD',
          'navi.wallet_linkbtn': 'Connect Wallet'
        }
      };

      return translations[mocks.locale]?.[key] || key;
    },
    getHTML: (key, params = {}) =>
      ({
        'jlv2.vault.vault_name': params.vaultname,
        'jlv2.vault.compute_by_token': params.token
      }[key] || key)
  }
}));

describe('Vault mining APY tooltips', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.chartOption = null;
    mocks.locale = 'en-US';
    mocks.vaultMining.enabled = true;
    mocks.vaultMining.baseApy = 0.0421;
    mocks.vaultMining.miningApy = { usdd: 0.0312, trx: 0, total: 0.0312 };
    mocks.vaultMining.miningRate = {
      usdd: '3000',
      trx: '0'
    };
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the VaultOverviewStat Supply APY value breakdown without replacing the existing label tooltip', () => {
    const { container } = render(<VaultOverviewStat />);
    const firstStat = container.querySelector('.stat-item');

    expect(screen.queryByText('Legacy Supply APY tooltip')).toBeNull();
    expect(screen.getByText('Base APY')).toBeTruthy();
    expect(screen.getByText('Mining APY')).toBeTruthy();
    expect(screen.getByText('Total APY')).toBeTruthy();
    expect(screen.getByText('4.21%')).toBeTruthy();
    expect(screen.getByText('3.12%')).toBeTruthy();
    expect(screen.getAllByText('7.33%').length).toBeGreaterThan(0);
    expect(firstStat.querySelectorAll('.j-info-icon').length).toBe(0);
    expect(firstStat.querySelectorAll('.fire-v2-small').length).toBe(1);
  });

  it('renders the ActionBox Supply APY breakdown', () => {
    render(<ActionBox />);

    expect(screen.getByText('Supply APY')).toBeTruthy();
    expect(screen.getByText('Base APY')).toBeTruthy();
    expect(screen.getByText('Mining APY')).toBeTruthy();
    expect(screen.getByText('Total APY')).toBeTruthy();
    expect(screen.getByText('4.21%')).toBeTruthy();
    expect(screen.getByText('3.12%')).toBeTruthy();
    expect(screen.getAllByText('7.33%').length).toBeGreaterThan(0);
  });

  it('renders Daily Mining Rewards as the fifth top stat only when mining is enabled', () => {
    const { container, unmount } = render(<VaultOverviewStat />);

    expect(screen.getByText('Daily Mining Rewards')).toBeTruthy();
    expect(screen.getByText('3000 USDD')).toBeTruthy();
    expect(container.querySelectorAll('.stats-line .stat-item').length).toBe(5);

    unmount();
    mocks.vaultMining.enabled = false;
    const { container: disabledContainer } = render(<VaultOverviewStat />);

    expect(screen.queryByText('Daily Mining Rewards')).toBeNull();
    expect(disabledContainer.querySelectorAll('.stats-line .stat-item').length).toBe(4);
  });

  it('renders the top mining stat copy in simplified and traditional Chinese', () => {
    mocks.locale = 'zh-CN';
    const { unmount } = render(<VaultOverviewStat />);

    expect(screen.getByText('挖矿奖励/日')).toBeTruthy();
    expect(screen.getByText('3000 USDD')).toBeTruthy();

    unmount();
    mocks.locale = 'zh-TC';
    render(<VaultOverviewStat />);

    expect(screen.getByText('挖礦獎勵/日')).toBeTruthy();
    expect(screen.getByText('3000 USDD')).toBeTruthy();
  });

  it('renames the chart frame to Supply APY with a fire breakdown icon and adds the per-point APY breakdown line to the echarts tooltip', () => {
    const { container } = render(<VaultHistoricalChart />);

    expect(screen.queryByText('Supply Base APY')).toBeNull();
    expect(screen.getAllByText('Supply APY').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('.ccd-title .j-info-icon').length).toBe(0);
    expect(container.querySelectorAll('.ccd-value .fire-v2-small').length).toBe(1);
    expect(mocks.chartOption).toBeTruthy();

    const tooltipHtml = mocks.chartOption.tooltip.formatter([{ name: '2026-04-20 00:00', dataIndex: 0 }]);
    expect(tooltipHtml).toContain('Supply APY');
    expect(tooltipHtml).toContain('Total Supply');
    expect(tooltipHtml).toContain('4.21% Base APY');
    expect(tooltipHtml).toContain('3.12% Mining APY');
  });
});
