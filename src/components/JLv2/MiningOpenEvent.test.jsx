import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { RewardsClaimPanel } from './Dashboard/RewardsClaimPanel';

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
    rewards: [{ token: 'USDD', tokenAddress: '0x1', amount: '12.345678', priceUsd: 1 }],
    totalUsd: 12.345678,
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
  formatFiatValue: value => `$${value}`
}));

vi.mock('../../components/Modals/JLv2/MiningPeriods', () => ({
  default: ({ visible }) => (visible ? <div data-testid="periods-modal" /> : null)
}));

vi.mock('react-intl-universal', () => ({
  default: {
    get: key =>
      ({
        'mining.rewards.title': 'Mining Rewards',
        'mining.rewards.empty_tip': 'No mining rewards to claim yet.',
        'mining.rewards.claim': 'Claim'
      }[key] || key)
  }
}));

describe('mining open event', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.gtag = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  it('fires PC_mining_rewards_open when the column Claim is clicked', () => {
    const { container } = render(<RewardsClaimPanel />);

    fireEvent.click(container.querySelector('.mrc-claim'));

    expect(window.gtag).toHaveBeenCalledWith('event', 'PC_mining_rewards_open', {
      event_category: 'PC_V2',
      event_label: 'mining_rewards_open'
    });
  });
});
