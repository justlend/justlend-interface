import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

import { RewardsClaimPanel } from './Dashboard/RewardsClaimPanel';
import { ApyBreakdownTooltip } from './Common/ApyBreakdownTooltip';
import { EarningsBreakdownTooltip } from './Common/EarningsBreakdownTooltip';

const mocks = vi.hoisted(() => ({
  tooltipTitles: [],
  store: {
    network: {
      isConnected: true
    },
    dashboardStore: {
      positionData: null
    }
  },
  miningRewards: {
    rewards: [],
    totalUsd: 0,
    loading: false
  }
}));

vi.mock('../../stores', () => ({
  default: mocks.store
}));

vi.mock('../../utils/hooks/useMining', () => ({
  hasClaimableRewards: rewards => Array.isArray(rewards) && rewards.some(reward => Number(reward?.amount || 0) > 0),
  useMiningRewards: () => mocks.miningRewards,
  useAccruingMining: () => ({ totalUsd: 0, loading: false }),
  useUserPositionMining: () => ({ enabled: false, baseApy: 0, miningApy: { total: 0 } })
}));

vi.mock('../../utils/formatters', () => ({
  formatApyRate: value => `${value}%`,
  formatFiatValue: value => {
    const num = Number(value);
    if (num === 12345.6789) return '$12,345.6';
    if (num === 12.34) return '$12.34';
    if (num === 4.56) return '$4.56';
    if (num === 16.9) return '$16.9';
    if (num === 0) return '$0';
    return `$${value}`;
  },
  formatTokenAmount: (value, symbol) => (symbol ? `${value} ${symbol}` : `${value}`)
}));

vi.mock('../../components/Modals/JLv2/MiningPeriods', () => ({ default: () => null }));

vi.mock('react-intl-universal', () => ({
  default: {
    get: key =>
      ({
        'mining.rewards.title': 'Mining Rewards',
        'mining.rewards.empty_tip': 'No mining rewards to claim yet.',
        'mining.rewards.claim': 'Claim',
        'mining.breakdown.base_apy': 'Base APY',
        'mining.breakdown.mining_apy': 'Mining APY',
        'mining.breakdown.total_apy': 'Total APY',
        'mining.breakdown.base_earnings': 'Base Earnings',
        'mining.breakdown.mining_earnings': 'Mining Earnings',
        'mining.breakdown.total_earnings': 'Total Earnings',
        'mining.breakdown.base_label': 'Base',
        'mining.breakdown.mining_label': 'Mining'
      }[key] || key)
  }
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

describe('mining formatting and boundaries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.tooltipTitles = [];
    mocks.miningRewards.rewards = [];
    mocks.miningRewards.totalUsd = 0;
    mocks.miningRewards.loading = false;
  });

  afterEach(() => {
    cleanup();
  });

  it('keeps claimable rewards active when only the USD estimate is zero', () => {
    mocks.miningRewards.rewards = [{ token: 'USDD', tokenAddress: '0x1', amount: '12.345678', priceUsd: 0 }];
    mocks.miningRewards.totalUsd = 0;

    const { container } = render(<RewardsClaimPanel />);

    expect(screen.getByText('Claim')).toBeTruthy();
    expect(container.querySelector('.mrc-claim-disabled')).toBeFalsy();
  });

  it('does not treat zero reward amounts as claimable on the dashboard column', () => {
    mocks.miningRewards.rewards = [{ token: 'USDD', tokenAddress: '0x1', amount: '0', priceUsd: 1 }];
    mocks.miningRewards.totalUsd = 0;

    const { container } = render(<RewardsClaimPanel />);

    expect(container.firstChild).toBeNull();
    expect(screen.queryByText('Claim')).toBeNull();
  });

  it('renders the USD total using the shared formatter on the dashboard column', () => {
    mocks.miningRewards.rewards = [{ token: 'USDD', tokenAddress: '0x1', amount: '12345.6789', priceUsd: 1 }];
    mocks.miningRewards.totalUsd = 12345.6789;

    render(<RewardsClaimPanel />);

    expect(screen.getByText('$12,345.6')).toBeTruthy();
  });

  it('shows totals and token breakdown for earnings and APY breakdowns', () => {
    render(
      <div>
        <ApyBreakdownTooltip baseApy={4.21} miningApy={3.12} />
        <EarningsBreakdownTooltip baseAmount="66.2516" baseToken="USDD" miningAmount="12.2352" miningToken="USDD" />
      </div>
    );

    expect(screen.getByText('4.21%')).toBeTruthy();
    expect(screen.getByText('3.12%')).toBeTruthy();
    expect(screen.getByText('7.33%')).toBeTruthy();
    expect(screen.getByText(/66.2516 USDD/)).toBeTruthy();
    expect(screen.getByText(/12.2352 USDD/)).toBeTruthy();
  });
});
