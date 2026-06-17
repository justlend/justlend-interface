import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { VaultHistoricalChart } from './VaultHistoricalChart';

const mocks = vi.hoisted(() => ({
  locale: 'en-US',
  store: {
    vaultStore: {
      vaultDetails: {
        address: 'enabled-vault',
        name: 'USDD Vault',
        assetSymbol: 'USDD',
        tags: []
      },
      historicalData: {
        currentSupplyUsd: '1000000',
        currentSupplyTokenAmount: '1000000',
        supplyBaseApy: '4.21',
        supplyMiningApy: '3.12',
        historyRecords: [
          {
            timestamp: 1776643200000,
            supplyTokenAmount: '1000000',
            supplyUsd: '1000000',
            supplyApy: '7.33'
          }
        ]
      },
      isLoading: false
    },
    lend: {
      theme: 'dark'
    }
  },
  vaultMining: {
    enabled: true,
    baseApy: 4.21,
    miningApy: { usdd: 3.12, trx: 0, total: 3.12 },
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
    const tooltipHtml = option?.tooltip?.formatter?.([{ name: '2026-04-24 00:00', dataIndex: 0 }]);
    return (
      <div data-testid="echarts">
        <div data-testid="apy-series">{String(option?.series?.[0]?.data?.[0])}</div>
        <div data-testid="tooltip-html">{tooltipHtml}</div>
      </div>
    );
  }
}));

vi.mock('antd', () => {
  const Select = ({ children }) => <div>{children}</div>;
  Select.Option = ({ children }) => <div>{children}</div>;

  return {
    Tooltip: ({ title, children }) => (
      <div>
        <div>{title}</div>
        {children}
      </div>
    ),
    Select
  };
});

vi.mock('../../../utils/hooks/useMining', () => ({
  useVaultMiningApy: () => mocks.vaultMining
}));

vi.mock('../../../utils/formatters', () => ({
  formatApyRate: (value, isPercent = false) => {
    if (value === null || value === undefined) return '-%';
    const num = Number(value);
    if (isNaN(num)) return '0%';
    const pct = isPercent ? num : num * 100;
    return `${parseFloat(pct.toPrecision(12))}%`;
  },
  formatFiatValue: value => `$${value}`,
  formatCompactFiatValue: value => `$${value}`,
  formatTokenAmount: (value, symbol) => (symbol ? `${value} ${symbol}` : `${value}`),
  getXAxisInterval: () => 0
}));

vi.mock('react-intl-universal', () => ({
  default: {
    get: key => {
      const translations = {
        'en-US': {
          'mining.rate.title': 'Mining Rate',
          'mining.rate.unit': 'USDD/day'
        },
        'zh-CN': {
          'mining.rate.title': '矿速',
          'mining.rate.unit': 'USDD / 天'
        },
        'zh-TC': {
          'mining.rate.title': '礦速',
          'mining.rate.unit': 'USDD / 天'
        }
      };

      return (
        translations[mocks.locale]?.[key] ||
        {
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
          'jlv2.vault.supply_apy3': 'Supply APY',
          'jlv2.vault.total_supply': 'Total Supply'
        }[key] ||
        key
      );
    },
    getHTML: (key, params = {}) =>
      ({
        'jlv2.vault.vault_name': params.vaultname,
        'jlv2.vault.compute_by_token': params.token
      }[key] || key)
  }
}));

describe('VaultHistoricalChart mining rate', () => {
  beforeEach(() => {
    mocks.locale = 'en-US';
    mocks.vaultMining.enabled = true;
    mocks.vaultMining.miningRate = {
      usdd: '3000',
      trx: '0'
    };
  });

  afterEach(() => {
    cleanup();
  });

  it('does not render the mining rate row inside the chart frame (moved to VaultOverviewStat)', () => {
    render(<VaultHistoricalChart />);

    expect(screen.queryByText('Mining Rate')).toBeNull();
    expect(screen.queryByText('3000 USDD/day')).toBeNull();
  });

  it('still keeps only two ccd items (Total Supply and Supply APY) on mining-enabled vaults', () => {
    const { container } = render(<VaultHistoricalChart />);

    expect(container.querySelectorAll('.chart-current-data > div').length).toBe(2);
  });

  it('keeps the chart frame in simplified Chinese without a mining rate entry', () => {
    mocks.locale = 'zh-CN';

    render(<VaultHistoricalChart />);

    expect(screen.queryByText('矿速')).toBeNull();
  });

  it('keeps the chart frame in traditional Chinese without a mining rate entry', () => {
    mocks.locale = 'zh-TC';

    render(<VaultHistoricalChart />);

    expect(screen.queryByText('礦速')).toBeNull();
  });

  it('uses historical mining APY fields for the APY line and tooltip split', () => {
    mocks.store.vaultStore.historicalData.historyRecords[0].supplyApy = '0.0421';
    mocks.store.vaultStore.historicalData.historyRecords[0].miningUsddApy = '0.0312';
    mocks.store.vaultStore.historicalData.historyRecords[0].miningTrxApy = '0.008';

    render(<VaultHistoricalChart />);

    expect(Number(screen.getByTestId('apy-series').textContent)).toBeCloseTo(0.0813, 4);
    expect(screen.getByTestId('tooltip-html').textContent).toContain('4.21% Base APY + 3.92% Mining APY');
  });

  it('keeps mining style on historical bars even after the vault has closed mining', () => {
    mocks.vaultMining.enabled = false;
    mocks.vaultMining.miningApy = { usdd: 0, trx: 0, total: 0 };
    mocks.store.vaultStore.historicalData.historyRecords[0].supplyApy = '0.0421';
    mocks.store.vaultStore.historicalData.historyRecords[0].miningUsddApy = '0.0312';
    mocks.store.vaultStore.historicalData.historyRecords[0].miningTrxApy = '0';

    render(<VaultHistoricalChart />);

    const tooltipHtml = screen.getByTestId('tooltip-html').textContent;
    expect(tooltipHtml).toContain('4.21% Base APY + 3.12% Mining APY');
    expect(tooltipHtml).toContain('fire-v2-smallest');
  });

  it('treats null historical mining APY fields as zero and hides the mining breakdown for that bar', () => {
    mocks.store.vaultStore.historicalData.historyRecords[0].supplyApy = '0.0421';
    mocks.store.vaultStore.historicalData.historyRecords[0].miningUsddApy = null;
    mocks.store.vaultStore.historicalData.historyRecords[0].miningTrxApy = null;

    render(<VaultHistoricalChart />);

    expect(Number(screen.getByTestId('apy-series').textContent)).toBeCloseTo(0.0421, 4);
    // Bars predating the mining rollout (or otherwise zero-mining) should
    // render only the base APY — no fire icon, no "+ 0% Mining APY" line.
    const tooltipHtml = screen.getByTestId('tooltip-html').textContent;
    expect(tooltipHtml).not.toContain('Mining APY');
    expect(tooltipHtml).not.toContain('fire-v2-smallest');
  });
});
