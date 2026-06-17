import React from 'react';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { MiningPeriodsModal } from './MiningPeriods';

const mocks = vi.hoisted(() => ({
  store: {
    lend: {
      theme: 'light'
    }
  },
  periods: [
    {
      periodKey: '55-4',
      tokens: [{ token: 'USDD', tokenAddress: '0x1', amount: '7.88', priceUsd: 1 }]
    }
  ],
  loading: false,
  refresh: vi.fn(),
  claimDelayMs: 0,
  claimShouldReject: false,
  claimError: new Error('claim failed'),
  successMessage: vi.fn(),
  errorMessage: vi.fn()
}));

vi.mock('../../../stores', () => ({
  default: mocks.store
}));

vi.mock('../../../utils/hooks/useMining', async () => {
  const ReactModule = await import('react');
  return {
    useMiningPeriods: () => ({
      periods: mocks.periods,
      totalUsd: 7.88,
      loading: mocks.loading,
      refresh: mocks.refresh
    }),
    useClaimMiningPeriod: () => {
      const [activeKey, setActiveKey] = ReactModule.useState(null);
      const claim = async period => {
        const periodKey = typeof period === 'string' ? period : period?.periodKey;
        setActiveKey(periodKey);
        try {
          return await new Promise((resolve, reject) => {
            setTimeout(() => {
              if (mocks.claimShouldReject) reject(mocks.claimError);
              else resolve({ status: 'success', periodKey });
            }, mocks.claimDelayMs);
          });
        } finally {
          setActiveKey(null);
        }
      };
      return { claim, activeKey };
    }
  };
});

vi.mock('../../../utils/helper', () => ({
  renderSplitAmount: (amount, symbol) => `${amount} ${symbol}`
}));

vi.mock('ismobilejs', () => ({
  default: () => ({ any: false })
}));

vi.mock('react-intl-universal', () => ({
  default: {
    get: key =>
      ({
        'v2.rewards.claim_mining': 'Claim Mining Rewards',
        'v2.rewards.claiming': 'You can claim',
        'v2.rewards.mining_round': 'Mining Round',
        'v2.rewards.reward_balance': 'To Be Claimed',
        'v2.rewards.claim': 'Claim',
        'mining.rewards.claim_success': 'Claim transaction submitted successfully.',
        'mining.rewards.claim_failed': 'Claim failed'
      }[key] || key),
    getHTML: (key, params = {}) =>
      ({
        'v2.rewards.num': `#${params.value}`
      }[key] || key)
  }
}));

vi.mock('antd', () => ({
  Modal: ({ visible, title, onCancel, children }) =>
    visible ? (
      <div>
        <div>{title}</div>
        <button type="button" aria-label="close" onClick={onCancel}>
          x
        </button>
        {children}
      </div>
    ) : null,
  message: {
    success: (...args) => mocks.successMessage(...args),
    error: (...args) => mocks.errorMessage(...args)
  }
}));

describe('mining claim events (per-period)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    mocks.periods = [
      {
        periodKey: '55-4',
        tokens: [{ token: 'USDD', tokenAddress: '0x1', amount: '7.88', priceUsd: 1 }]
      }
    ];
    mocks.claimDelayMs = 0;
    mocks.claimShouldReject = false;
    window.gtag = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('fires claim and claim_success events on a successful per-period claim', async () => {
    vi.useFakeTimers();
    mocks.claimDelayMs = 2000;
    render(<MiningPeriodsModal visible={true} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Claim' }));

    expect(window.gtag).toHaveBeenCalledWith('event', 'PC_mining_rewards_claim', {
      event_category: 'PC_V2',
      event_label: 'mining_rewards_claim_single'
    });

    await act(async () => {
      vi.advanceTimersByTime(2000);
      await Promise.resolve();
    });

    expect(window.gtag).toHaveBeenCalledWith('event', 'PC_mining_rewards_claim_success', {
      event_category: 'PC_V2',
      event_label: 'mining_rewards_claim_success_single'
    });
  });

  it('fires claim_fail when the per-period claim rejects', async () => {
    mocks.claimShouldReject = true;
    render(<MiningPeriodsModal visible={true} onClose={vi.fn()} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Claim' }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(window.gtag).toHaveBeenCalledWith('event', 'PC_mining_rewards_claim_fail', {
      event_category: 'PC_V2',
      event_label: 'mining_rewards_claim_fail_single'
    });
  });
});
