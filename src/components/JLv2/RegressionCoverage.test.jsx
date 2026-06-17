import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { MarketTabs } from './Dashboard/MarketTabs';
import VaultPage from '../../pages/JLv2/VaultPage';
import Account from '../Account';

const mocks = vi.hoisted(() => ({
  theme: 'light',
  store: {
    network: {
      isConnected: true,
      defaultAccount: 'TMock',
      isRightChain: 1,
      connectWalletV2: vi.fn()
    },
    lend: {
      serviceInnerStatus: 'enabled',
      setNoServiceModalAllVisible: vi.fn(),
      theme: 'light',
      getCurrentBlock: vi.fn()
    },
    dashboardStore: {
      activeTab: 'supply',
      listLoading: false,
      homeSearchparam: '',
      supplyCount: 1,
      borrowCount: 1,
      setActiveTab: vi.fn(),
      setHomeSearchparam: vi.fn(),
      positionData: {
        totalSupplyUsd: '100',
        totalBorrowUsd: '0',
        totalCollateralUsd: '0'
      }
    },
    ui: {
      rewardVisible: false,
      miningRewardVisible: false
    },
    vaultStore: {
      isLoading: false,
      vaultAddressError: false,
      vaultAddress: 'enabled-vault',
      fetchAllVaultData: vi.fn(),
      getDataInterval: vi.fn(() => 1),
      vaultDetails: {
        address: 'enabled-vault',
        name: 'USDD Vault',
        assetSymbol: 'USDD',
        apy: '7.33',
        tags: []
      },
      historicalData: {
        currentSupplyUsd: '1000000',
        currentSupplyTokenAmount: '1000000',
        supplyBaseApy: '4.21',
        supplyMiningApy: '3.12',
        historyRecords: []
      },
      myPosition: {
        depositAmount: '100',
        depositUsd: '100',
        dailyInterest: '16.9',
        apy: '7.33'
      },
      setActionTab: vi.fn(),
      activeActionTab: 'supply',
      setInputAmount: vi.fn(),
      inputAmount: '',
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
    user: {
      userDepositDataSource: [{ id: 1 }],
      userLendDataSource: [{ id: 2 }]
    }
  }
}));

vi.mock('../../stores', () => ({
  default: mocks.store
}));

vi.mock('ismobilejs', () => ({
  default: () => ({ any: false })
}));

vi.mock('react-router-dom', () => ({
  useHistory: () => ({ push: vi.fn() }),
  useLocation: () => ({ search: '?address=enabled-vault' }),
  Link: ({ children, ...props }) => <a {...props}>{children}</a>
}));

vi.mock('antd', () => ({
  Tooltip: ({ title, children }) => (
    <div>
      <div>{title}</div>
      {children}
    </div>
  ),
  Select: ({ children }) => <div>{children}</div>,
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
  Input: props => <input {...props} />,
  Skeleton: () => <div>Skeleton</div>
}));

vi.mock('../../components/JLv2/Dashboard/FilterBar', () => ({
  default: () => <div data-testid="filter-bar" />
}));

vi.mock('../../components/JLv2/Dashboard/MarketList', () => ({
  default: ({ listSkeletonRender }) => <div data-testid="market-list">{listSkeletonRender?.()}</div>
}));

vi.mock('../../components/v2/Header', () => ({
  default: () => <header>Header</header>
}));

vi.mock('../../components/v2/Footer', () => ({
  default: () => <footer>Footer</footer>
}));

vi.mock('../../components/v2/mobile/TabsBar', () => ({
  default: () => <div data-testid="tabs-bar" />
}));

vi.mock('../../components/v2/season/index', () => ({
  default: () => <div data-testid="season" />
}));

vi.mock('../Account/RewardModal', () => ({
  default: () => <div>V1 Reward Modal</div>
}));

vi.mock('../Account/RewardValue', () => ({
  default: () => <div>V1 Reward Value</div>
}));

vi.mock('../Account/RiskValue', () => ({
  default: () => <div>V1 Risk Value</div>
}));

vi.mock('../Account/UserDataInfo', () => ({
  default: () => <div>V1 User Data</div>
}));

vi.mock('../Modals/v2/MiningReward', () => ({
  default: () => <div>V1 Mining Reward Modal</div>
}));

vi.mock('../Modals/v2/Reward', () => ({
  default: () => <div>V1 Reward</div>
}));

vi.mock('../../components/JLv2/Vault/VaultHeader', () => ({
  VaultHeader: () => <div>Vault Header</div>
}));

vi.mock('../../components/JLv2/Vault/VaultOverviewStat', () => ({
  VaultOverviewStat: () => <div>Vault Overview</div>
}));

vi.mock('../../components/JLv2/Vault/VaultInteractionPanel', () => ({
  MyVaultPosition: () => <div>My Vault Position</div>
}));

vi.mock('../../components/JLv2/Vault/VaultHistoricalChart', () => ({
  VaultHistoricalChart: () => <div>Vault Historical Chart</div>
}));

vi.mock('../../components/JLv2/Vault/MarketAllocationList', () => ({
  MarketAllocationList: () => <div>Market Allocation List</div>
}));

vi.mock('../../components/JLv2/Vault/VaultInfo', () => ({
  VaultInfo: () => <div>Vault Info</div>
}));

vi.mock('../../components/JLv2/Vault/ActionBox', () => ({
  ActionBox: () => <div>Action Box</div>
}));

vi.mock('../../components/JLv2/TransactionModal', () => ({
  TransactionModal: () => <div>Transaction Modal</div>
}));

vi.mock('../../utils/hooks/useMining', () => ({
  preloadMiningResolver: vi.fn()
}));

vi.mock('../../utils/helper', () => ({
  emptyReactNodeNew: () => <div>Empty</div>
}));

vi.mock('../../utils/formatters', () => ({
  formatTokenAmount: value => `${value}`,
  formatFiatValue: value => `$${value}`,
  formatApyRate: value => `${value}%`,
  formatCompactFiatValue: value => `$${value}`
}));

vi.mock('react-intl-universal', () => ({
  default: {
    get: key =>
      ({
        'jlv2.home.supply_vault': 'Supply Vault',
        'jlv2.home.lending_market': 'Lending Market',
        'jlv2.back_to_home': 'Back',
        'v2.account_overview': 'Account Overview'
      }[key] || key),
    getHTML: key => key
  }
}));

describe('regression coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.store.lend.theme = 'light';
    mocks.store.dashboardStore.activeTab = 'supply';
  });

  afterEach(() => {
    cleanup();
  });

  it('keeps the borrow tab free of mining breakdown tooltips', () => {
    mocks.store.dashboardStore.activeTab = 'borrow';

    render(<MarketTabs />);

    expect(screen.getByText('Supply Vault')).toBeTruthy();
    expect(screen.getByText('Lending Market')).toBeTruthy();
    expect(screen.queryByText('Base APY')).toBeNull();
  });

  it('keeps vault page core actions present', () => {
    render(<VaultPage />);

    expect(screen.getByText('Vault Header')).toBeTruthy();
    expect(screen.getByText('Vault Overview')).toBeTruthy();
    expect(screen.getByText('My Vault Position')).toBeTruthy();
    expect(screen.getByText('Vault Historical Chart')).toBeTruthy();
    expect(screen.getByText('Market Allocation List')).toBeTruthy();
    expect(screen.getByText('Vault Info')).toBeTruthy();
    expect(screen.getByText('Action Box')).toBeTruthy();
    expect(screen.getByText('Transaction Modal')).toBeTruthy();
  });

  it('keeps V1 account mining modal mounted path intact', () => {
    render(<Account isLoading={false} />);

    expect(screen.getByText('Account Overview')).toBeTruthy();
    expect(screen.getByText('V1 Risk Value')).toBeTruthy();
    expect(screen.getByText('V1 User Data')).toBeTruthy();
    expect(screen.getByText('V1 Reward Value')).toBeTruthy();
    expect(screen.getByText('V1 Reward Modal')).toBeTruthy();
  });
});
