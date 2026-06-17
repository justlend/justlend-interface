import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { MyVaultPosition } from './VaultInteractionPanel';

const mocks = vi.hoisted(() => ({
  store: {
    network: {
      isConnected: true
    },
    vaultStore: {
      vaultDetails: {
        address: 'enabled-vault',
        name: 'USDD Vault',
        assetSymbol: 'USDD',
        tags: []
      },
      myPosition: {
        depositAmount: '100',
        depositUsd: '100',
        dailyInterest: '16.9',
        apy: '7.33'
      },
      setActionTab: vi.fn()
    },
    dashboardStore: {
      flashingEnd: vi.fn(),
      flashingAnimation: vi.fn()
    }
  },
  vaultMining: {
    enabled: true,
    baseApy: 4.21,
    miningApy: { usdd: 3.12, trx: 0, total: 3.12 },
    dailyEarnings: {
      base: { amount: '66.2516', token: 'USDD', amountUsd: 12.34 },
      mining: { usdd: '12.2352', trx: '0', amountUsd: 4.56 }
    }
  }
}));

vi.mock('../../../stores', () => ({
  default: mocks.store
}));

vi.mock('ismobilejs', () => ({
  default: () => ({ any: false })
}));

vi.mock('antd', () => ({
  Tooltip: ({ title, children }) => (
    <div>
      <div data-testid="tooltip-title">{title}</div>
      {children}
    </div>
  )
}));

vi.mock('../../../utils/hooks/useMining', () => ({
  useVaultMiningApy: () => mocks.vaultMining
}));

vi.mock('../../../utils/formatters', () => ({
  formatTokenAmount: (value, symbol) => `${value} ${symbol}`,
  formatFiatValue: value => `$${value}`,
  formatApyRate: value => `${value}%`
}));

vi.mock('react-intl-universal', () => ({
  default: {
    get: key =>
      ({
        'jlv2.vault.my_position': 'My Position',
        'jlv2.vault.supplied': 'Supplied',
        'jlv2.vault.withdraw': 'Withdraw',
        'jlv2.vault.daily_earning': 'Daily Earnings',
        'jlv2.vault.supply_apy2': 'Supply APY',
        'mining.breakdown.base_earnings': 'Base Earnings',
        'mining.breakdown.mining_earnings': 'Mining Earnings',
        'mining.breakdown.total_earnings': 'Total Earnings',
        'mining.breakdown.base_label': 'Base',
        'mining.breakdown.mining_label': 'Mining',
        'mining.breakdown.base_apy': 'Base APY',
        'mining.breakdown.mining_apy': 'Mining APY',
        'mining.breakdown.total_apy': 'Total APY'
      }[key] || key),
    getHTML: (key, params = {}) =>
      ({
        'jlv2.vault.vault_name': params.vaultname
      }[key] || key)
  }
}));

describe('MyVaultPosition mining tooltips', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.store.network.isConnected = true;
    mocks.store.vaultStore.myPosition = {
      depositAmount: '100',
      depositUsd: '100',
      dailyInterest: '16.9',
      apy: '7.33'
    };
    mocks.vaultMining.enabled = true;
    mocks.vaultMining.baseApy = 4.21;
    mocks.vaultMining.miningApy = { usdd: 3.12, trx: 0, total: 3.12 };
    mocks.vaultMining.dailyEarnings = {
      base: { amount: '66.2516', token: 'USDD', amountUsd: 12.34 },
      mining: { usdd: '12.2352', trx: '0', amountUsd: 4.56 }
    };
  });

  afterEach(() => {
    cleanup();
  });

  it('renders Daily Earnings and Supply APY mining breakdowns when the user has a vault position', () => {
    const { container } = render(<MyVaultPosition />);

    expect(screen.getByText('My Position')).toBeTruthy();
    expect(screen.getByText('Daily Earnings')).toBeTruthy();
    expect(screen.getByText(/66.2516 USDD/)).toBeTruthy();
    expect(screen.getByText(/12.2352 USDD/)).toBeTruthy();
    expect(screen.getByText(/Supply APY/)).toBeTruthy();
    expect(screen.getByText('Base APY')).toBeTruthy();
    expect(screen.getByText('Mining APY')).toBeTruthy();
    expect(screen.getByText('Total APY')).toBeTruthy();
    expect(screen.getByText('4.21%')).toBeTruthy();
    expect(screen.getByText('3.12%')).toBeTruthy();
    expect(screen.getAllByText('7.33%').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('.j-info-icon').length).toBe(1);
    expect(container.querySelectorAll('.fire-v2-small').length).toBe(1);
  });

  it('does not render when wallet is disconnected', () => {
    mocks.store.network.isConnected = false;

    const { container } = render(<MyVaultPosition />);

    expect(container.firstChild).toBeNull();
  });

  it('does not render when the user has no supplied vault position', () => {
    mocks.store.vaultStore.myPosition = {
      depositAmount: '0',
      depositUsd: '0',
      dailyInterest: '0',
      apy: '0'
    };

    const { container } = render(<MyVaultPosition />);

    expect(container.firstChild).toBeNull();
  });
});
