import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { RewardsClaimPanel } from './RewardsClaimPanel';

const mocks = vi.hoisted(() => ({
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
  },
  accruing: { accruingUsd: 0, settlingUsd: 0, loading: false }
}));

vi.mock('../../../stores', () => ({
  default: mocks.store
}));

vi.mock('../../../utils/hooks/useMining', () => ({
  hasClaimableRewards: rewards => Array.isArray(rewards) && rewards.some(reward => Number(reward?.amount || 0) > 0),
  useMiningRewards: () => mocks.miningRewards,
  useAccruingMining: () => mocks.accruing,
  useUserPositionMining: () => ({ enabled: false, baseApy: 0, miningApy: { total: 0 } })
}));

vi.mock('../../Modals/JLv2/MiningPeriods', () => ({
  default: ({ visible }) => (visible ? <div data-testid="periods-modal" /> : null)
}));

vi.mock('../../../utils/formatters', () => ({
  formatFiatValue: value => `$${value}`,
  formatTokenAmount: (value, symbol) => (symbol ? `${value} ${symbol}` : `${value}`),
  formatApyRate: value => `${value}%`
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

vi.mock('react-intl-universal', () => ({
  default: {
    get: key =>
      ({
        'mining.rewards.title': 'Mining Rewards',
        'mining.rewards.empty_tip': 'No mining rewards to claim yet.',
        'mining.rewards.claim': 'Claim',
        'mining.rewards.accrue': 'Accruing',
        'mining.rewards.settle': 'Settling'
      }[key] || key)
  }
}));

describe('RewardsClaimPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.store.network.isConnected = true;
    mocks.miningRewards.rewards = [];
    mocks.miningRewards.totalUsd = 0;
    mocks.miningRewards.loading = false;
    mocks.accruing.accruingUsd = 0;
    mocks.accruing.settlingUsd = 0;
    mocks.accruing.loading = false;
  });

  afterEach(() => {
    cleanup();
  });

  it('shows accruing state with USD value when only accruing rewards exist', () => {
    mocks.accruing.accruingUsd = 4.56;

    const { container } = render(<RewardsClaimPanel />);

    expect(screen.getByText('Mining Rewards')).toBeTruthy();
    expect(screen.getByText('$4.56')).toBeTruthy();
    expect(screen.getByText('Accruing')).toBeTruthy();
    const tooltipTitles = screen.getAllByTestId('tooltip-title').map(el => el.textContent);
    expect(tooltipTitles).toContain('No mining rewards to claim yet.');
    expect(container.querySelector('.mrc-claim-disabled')).toBeTruthy();
  });

  it('shows settling state with USD value when only settling rewards exist', () => {
    mocks.accruing.settlingUsd = 7.89;

    const { container } = render(<RewardsClaimPanel />);

    expect(screen.getByText('Mining Rewards')).toBeTruthy();
    expect(screen.getByText('$7.89')).toBeTruthy();
    expect(screen.getByText('Settling')).toBeTruthy();
    expect(screen.queryByText('Accruing')).toBeNull();
    expect(container.querySelector('.mrc-claim-disabled')).toBeTruthy();
  });

  it('shows the combined accruing+settling total but keeps the accruing label when both are non-zero', () => {
    mocks.accruing.accruingUsd = 4.56;
    mocks.accruing.settlingUsd = 7.89;

    render(<RewardsClaimPanel />);

    expect(screen.getByText('$12.45')).toBeTruthy();
    expect(screen.getByText('Accruing')).toBeTruthy();
    expect(screen.queryByText('Settling')).toBeNull();
    expect(screen.queryByText('$4.56')).toBeNull();
    expect(screen.queryByText('$7.89')).toBeNull();
  });

  it('sums airdrop + accruing + settling when claimable rewards exist', () => {
    mocks.miningRewards.rewards = [{ token: 'USDD', tokenAddress: '0x1', amount: '10', priceUsd: 1 }];
    mocks.miningRewards.totalUsd = 10;
    mocks.accruing.accruingUsd = 1.23;
    mocks.accruing.settlingUsd = 4.56;

    const { container } = render(<RewardsClaimPanel />);

    expect(screen.getByText('$15.79')).toBeTruthy();
    expect(container.querySelector('.mrc-claim-disabled')).toBeNull();
  });

  it('does not render when there are no claimable or accruing rewards', () => {
    const { container } = render(<RewardsClaimPanel />);

    expect(container.firstChild).toBeNull();
    expect(screen.queryByText('Mining Rewards')).toBeNull();
  });

  it('does not render the green accent block on the title', () => {
    mocks.accruing.accruingUsd = 1;

    const { container } = render(<RewardsClaimPanel />);

    const title = container.querySelector('.mrc-title');
    expect(title).toBeTruthy();
    expect(title.classList.contains('preblock')).toBe(false);
  });

  it('does not render when wallet is disconnected', () => {
    mocks.store.network.isConnected = false;
    const { container } = render(<RewardsClaimPanel />);

    expect(container.firstChild).toBeNull();
    expect(screen.queryByText('Mining Rewards')).toBeNull();
  });

  it('shows active state with USD total and opens periods modal directly on column Claim click', () => {
    mocks.miningRewards.rewards = [{ token: 'USDD', tokenAddress: '0x1', amount: '12.345678', priceUsd: 1 }];
    mocks.miningRewards.totalUsd = 12.345678;

    const { container } = render(<RewardsClaimPanel />);

    expect(screen.getByText('$12.345678')).toBeTruthy();
    expect(container.querySelector('.mrc-claim-disabled')).toBeNull();
    expect(screen.queryByTestId('periods-modal')).toBeNull();

    fireEvent.click(container.querySelector('.mrc-claim'));
    expect(screen.getByTestId('periods-modal')).toBeTruthy();
  });
});
