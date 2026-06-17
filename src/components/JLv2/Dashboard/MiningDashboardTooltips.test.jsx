import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { MyPositionSummary } from './MyPositionSummary';
import MarketList from './MarketList';

const mocks = vi.hoisted(() => ({
  store: {
    network: {
      isConnected: true
    },
    dashboardStore: {
      positionData: {
        totalSupplyUsd: '1000',
        vaults: [{ id: 1 }],
        vaultNew: false,
        dailyRevenue: '16.9',
        netEarnApy: '7.33'
      },
      setHomeSearchparam: vi.fn(),
      flashingAnimation: vi.fn(),
      allVaults: [],
      userVaults: [],
      allMarkets: [],
      userMarkets: [],
      allVaultsCount: 0,
      allMarketsCount: 0,
      activeTab: 'supply',
      listLoading: false,
      filters: {},
      sorter: {},
      moreLoading: false,
      userBalances: {},
      myVaultFold: false,
      myMarketFold: false,
      setMyVaultFold: vi.fn(),
      setMyMarketFold: vi.fn(),
      setActiveTab: vi.fn(),
      setSorter: vi.fn(),
      setPage: vi.fn(),
      setClearAll: vi.fn(),
      currentPage: 1,
      isFlashing: false
    }
  },
  userPositionMining: {
    enabled: true,
    baseApy: 4.21,
    miningApy: { usdd: 3.12, trx: 0, total: 3.12 },
    dailyEarnings: {
      base: { amount: '66.2516', token: 'USDD', amountUsd: 12.34 },
      mining: { usdd: '12.2352', trx: '0', amountUsd: 4.56 }
    }
  },
  vaultEntries: {},
  tooltipTitles: []
}));

vi.mock('../../../stores', () => ({
  default: mocks.store
}));

vi.mock('ismobilejs', () => ({
  default: () => ({ any: false })
}));

vi.mock('react-router-dom', () => ({
  useHistory: () => ({ push: vi.fn() })
}));

vi.mock('antd', () => ({
  Tooltip: ({ title, children }) => {
    mocks.tooltipTitles.push(title);
    return (
      <div>
        <div data-testid="tooltip-title">{title}</div>
        {children}
      </div>
    );
  }
}));

vi.mock('../../../utils/hooks/useMining', () => ({
  useUserPositionMining: () => mocks.userPositionMining,
  useVaultMiningResolver: () => ({
    isEnabled: vaultAddress => !!mocks.vaultEntries[vaultAddress],
    getEntry: vaultAddress => mocks.vaultEntries[vaultAddress] || null
  }),
  useMarketMiningResolver: () => ({
    isEnabled: () => false
  })
}));

vi.mock('../../../utils/constant', () => ({
  getIconsJLv2: symbol => `/icons/${symbol}.png`
}));

vi.mock('../../../utils/helper', () => {
  function MockBigNumber(value) {
    const num = Number(value || 0);
    return {
      times: multiplier => ({
        toNumber: () => num * Number(multiplier || 0)
      }),
      div: divisor => num / Number(divisor || 1),
      gt: other => num > Number(other || 0),
      plus: other => MockBigNumber(num + Number(other || 0)),
      toString: () => String(num)
    };
  }

  return {
    BigNumber: MockBigNumber,
    emptyReactNodeNew: () => <div>Empty</div>
  };
});

vi.mock('tronweb', () => {
  function TronwebMockBigNumber(value) {
    const num = Number(value || 0);
    return {
      lte: other => num <= Number(other || 0),
      plus: other => TronwebMockBigNumber(num + Number(other || 0)),
      toString: () => String(num)
    };
  }
  return { BigNumber: TronwebMockBigNumber };
});

vi.mock('../../../config', () => ({
  default: {
    portalLink: 'https://portal.example'
  }
}));

vi.mock('../../../utils/formatters', () => ({
  formatFiatValue: value => `$${value}`,
  formatApyRate: value => `${value}%`,
  formatTokenAmount: (value, symbol) => (symbol ? `${value} ${symbol}` : `${value}`),
  highlightText: value => value
}));

vi.mock('react-intl-universal', () => ({
  default: {
    get: key =>
      ({
        'jlv2.home.loading': 'Loading',
        'jlv2.home.supplied': 'Supplied',
        'jlv2.home.daily_earning': 'Daily Earnings',
        'jlv2.home.net_supply_apy': 'Net Supply APY',
        'jlv2.home.vault': 'Vault',
        'jlv2.home.supply_apy': 'Supply APY',
        'jlv2.home.supplied_amount': 'Supplied Amount',
        'jlv2.home.total_supply': 'Total Supply',
        'jlv2.home.collateral': 'Collateral',
        'jlv2.home.wallet_balance': 'Wallet Balance',
        'jlv2.home.action': 'Action',
        'jlv2.home.my_supply': 'My Supply',
        'jlv2.home.all_supply_vault': 'All Supply Vaults',
        'jlv2.home.hide_zero_balance': 'Hide zero balance',
        'jlv2.home.details': 'Details',
        'mining.breakdown.base_apy': 'Base APY',
        'mining.breakdown.mining_apy': 'Mining APY',
        'mining.breakdown.total_apy': 'Total APY',
        'mining.breakdown.base_earnings': 'Base Earnings',
        'mining.breakdown.mining_earnings': 'Mining Earnings',
        'mining.breakdown.total_earnings': 'Total Earnings',
        'mining.breakdown.base_label': 'Base',
        'mining.breakdown.mining_label': 'Mining'
      }[key] || key),
    getHTML: (key, params = {}) =>
      ({
        'jlv2.home.in_which_vault': `In ${params.amount} vault`
      }[key] || key)
  }
}));

const buildVault = (vaultAddress, assetSymbol = vaultAddress) => ({
  vaultAddress,
  assetSymbol,
  vaultName: `${assetSymbol} Vault`,
  tags: [],
  icon: '',
  apy: '7.33',
  userSupplyAmount: '10',
  totalSupplyAmount: '100',
  userSupplyUsd: '10',
  tvl: '100',
  collateralTokens: [],
  assetAddress: `${vaultAddress}-asset`,
  assetDecimals: 6
});

describe('dashboard mining tooltip integrations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.tooltipTitles = [];
    mocks.store.dashboardStore.positionData = {
      totalSupplyUsd: '1000',
      vaults: [{ id: 1 }],
      vaultNew: false,
      dailyRevenue: '16.9',
      netEarnApy: '7.33'
    };
    mocks.store.dashboardStore.activeTab = 'supply';
    mocks.store.dashboardStore.userVaults = [];
    mocks.store.dashboardStore.allVaults = [];
    mocks.store.dashboardStore.allVaultsCount = 0;
    mocks.store.dashboardStore.userMarkets = [];
    mocks.store.dashboardStore.allMarkets = [];
    mocks.userPositionMining.enabled = true;
    mocks.userPositionMining.baseApy = 4.21;
    mocks.userPositionMining.miningApy = { usdd: 3.12, trx: 0, total: 3.12 };
    mocks.userPositionMining.dailyEarnings = {
      base: { amount: '66.2516', token: 'USDD', amountUsd: 12.34 },
      mining: { usdd: '12.2352', trx: '0', amountUsd: 4.56 }
    };
    mocks.vaultEntries = {};
  });

  afterEach(() => {
    cleanup();
  });

  it('renders daily earnings breakdown with base + mining total in My Positions', () => {
    mocks.store.dashboardStore.positionData.dailyMiningReward = '4.56';
    render(<MyPositionSummary totalAssetsV1="0" />);

    expect(screen.getByText('Daily Earnings')).toBeTruthy();
    expect(screen.getByText(/66.2516 USDD/)).toBeTruthy();
    expect(screen.getByText(/12.2352 USDD/)).toBeTruthy();
    // Outer value now shows base + mining totals ($16.9 + $4.56 with IEEE float noise).
    expect(screen.getByText(/^\$21\.45/)).toBeTruthy();
    // Net Supply APY / ApyBreakdownTooltip moved to RewardsClaimPanel; should not appear here.
    expect(screen.queryByText('Net Supply APY')).toBeNull();
    expect(screen.queryByText('Base APY')).toBeNull();
    expect(screen.queryByText('Total APY')).toBeNull();
  });

  it('renders mining APY breakdown tooltip on supply vault rows when resolver reports mining APY', () => {
    mocks.store.dashboardStore.userVaults = [buildVault('enabled-vault', 'USDD'), buildVault('disabled-vault', 'TRX')];
    mocks.store.dashboardStore.allVaults = [];
    mocks.vaultEntries = {
      'enabled-vault': {
        miningApy: { usdd: 3.12, trx: 0, total: 3.12 }
      }
    };

    render(<MarketList />);

    expect(screen.getByText('Base APY')).toBeTruthy();
    expect(screen.getByText('Mining APY')).toBeTruthy();
    expect(screen.getByText('Total APY')).toBeTruthy();
  });

  it('shows fire icon on supply rows when resolver reports mining APY even if tags are empty', () => {
    mocks.store.dashboardStore.userVaults = [
      buildVault('resolver-enabled-vault', 'USDD'),
      buildVault('no-mining-vault', 'TRX')
    ];
    mocks.store.dashboardStore.allVaults = [];
    mocks.vaultEntries = {
      'resolver-enabled-vault': { miningApy: { usdd: 3.12, trx: 0, total: 3.12 } }
    };

    const { container } = render(<MarketList />);

    expect(container.querySelectorAll('.fire-lista').length).toBe(1);
  });

  it('keeps the fire tag icon without tooltip rows for non-mining fire-tag supply rows', () => {
    mocks.store.dashboardStore.userVaults = [buildVault('fire-tag-only', 'TRX')];
    mocks.store.dashboardStore.userVaults[0].tags = ['fire'];
    mocks.store.dashboardStore.allVaults = [];
    mocks.vaultEntries = {};

    const { container } = render(<MarketList />);

    expect(container.querySelectorAll('.fire-lista').length).toBe(1);
    expect(screen.queryByText('Base APY')).toBeNull();
    expect(screen.queryByText('Mining APY')).toBeNull();
    expect(screen.queryByText('Total APY')).toBeNull();
  });
});
