import React from 'react';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { MiningPeriodsModal } from './MiningPeriods';

const mocks = vi.hoisted(() => ({
  store: { lend: { theme: 'light' } },
  periods: [],
  loading: false,
  refresh: vi.fn(),
  claimDelayMs: 2000,
  locale: 'en-US',
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
      totalUsd: mocks.periods.reduce(
        (s, p) => s + (p.tokens || []).reduce((a, t) => a + Number(t.amount) * Number(t.priceUsd || 0), 0),
        0
      ),
      loading: mocks.loading,
      refresh: mocks.refresh
    }),
    useClaimMiningPeriod: () => {
      const [activeKey, setActiveKey] = ReactModule.useState(null);
      const claim = async period => {
        const periodKey = typeof period === 'string' ? period : period?.periodKey;
        setActiveKey(periodKey);
        try {
          return await new Promise(resolve => {
            setTimeout(() => {
              mocks.periods = mocks.periods.filter(p => p.periodKey !== periodKey);
              resolve({ status: 'success', periodKey });
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

vi.mock('../../../utils/helper', async () => {
  const { default: BigNumber } = await import('bignumber.js');
  return {
    BigNumber,
    renderSplitAmount: (amount, symbol) => `${amount} ${symbol}`
  };
});

vi.mock('../../../utils/formatters', () => ({
  formatTokenAmount: value => String(value)
}));

vi.mock('ismobilejs', () => ({
  default: () => ({ any: false })
}));

vi.mock('react-intl-universal', () => ({
  default: {
    get: key => {
      const translations = {
        'en-US': {
          'v2.rewards.claim_mining': 'Claim Mining Rewards',
          'v2.rewards.claiming': 'You can claim',
          'v2.rewards.mining_round': 'Mining Round',
          'v2.rewards.reward_balance': 'To Be Claimed',
          'v2.rewards.claim': 'Claim',
          'mining.rewards.claim_success': 'Claim transaction submitted successfully.',
          'mining.rewards.claim_failed': 'Claim failed'
        },
        'zh-TC': {
          'v2.rewards.claim_mining': '領取收益',
          'v2.rewards.claiming': '當前可領取',
          'v2.rewards.mining_round': '挖礦期數',
          'v2.rewards.reward_balance': '可領取',
          'v2.rewards.claim': '領取',
          'mining.rewards.claim_success': '領取交易已提交。',
          'mining.rewards.claim_failed': '領取失敗'
        }
      };

      return translations[mocks.locale]?.[key] || key;
    },
    getHTML: (key, params = {}) =>
      ({
        'v2.rewards.num': `#${params.value}`
      }[key] || key)
  }
}));

vi.mock('antd', () => ({
  Modal: ({ visible, title, onCancel, children }) =>
    visible ? (
      <div data-testid="periods-modal">
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

describe('MiningPeriodsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    mocks.store.lend.theme = 'light';
    mocks.locale = 'en-US';
    mocks.periods = [
      {
        periodKey: '55-4',
        tokens: [{ token: 'USDD', tokenAddress: '0x1', amount: '7.88', priceUsd: 1 }]
      },
      {
        periodKey: '55-3',
        tokens: [{ token: 'USDD', tokenAddress: '0x1', amount: '9.79', priceUsd: 1 }]
      },
      {
        periodKey: '55-2',
        tokens: [{ token: 'USDD', tokenAddress: '0x1', amount: '9.77', priceUsd: 1 }]
      }
    ];
    mocks.loading = false;
    mocks.claimDelayMs = 2000;
    window.gtag = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('renders 3 period rows with labels, amounts and total', () => {
    render(<MiningPeriodsModal visible={true} onClose={vi.fn()} />);

    expect(screen.getByText('Claim Mining Rewards')).toBeTruthy();
    expect(screen.getByText('#55-4')).toBeTruthy();
    expect(screen.getByText('#55-3')).toBeTruthy();
    expect(screen.getByText('#55-2')).toBeTruthy();
    expect(screen.getByText('7.88 USDD')).toBeTruthy();
    expect(screen.getByText('9.79 USDD')).toBeTruthy();
    expect(screen.getByText('9.77 USDD')).toBeTruthy();
    expect(screen.getByText('27.44 USDD')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Claim' }).length).toBe(3);
  });

  it('marks only the active row as signing during a claim', async () => {
    vi.useFakeTimers();
    const { container } = render(<MiningPeriodsModal visible={true} onClose={vi.fn()} />);

    const claimButtons = container.querySelectorAll('.j-reward-item .j-btn');
    fireEvent.click(claimButtons[0]);

    const signingButtons = container.querySelectorAll('.j-btn.j-signing');
    expect(signingButtons.length).toBe(1);
    expect(signingButtons[0]).toBe(claimButtons[0]);

    await act(async () => {
      vi.advanceTimersByTime(2000);
      await Promise.resolve();
    });
  });

  it('removes a period from the list and toasts after a successful claim', async () => {
    vi.useFakeTimers();
    const { container } = render(<MiningPeriodsModal visible={true} onClose={vi.fn()} />);

    const firstClaim = container.querySelector('.j-reward-item .j-btn');
    fireEvent.click(firstClaim);

    await act(async () => {
      vi.advanceTimersByTime(2000);
      await Promise.resolve();
    });

    expect(mocks.successMessage).toHaveBeenCalledWith('Claim transaction submitted successfully.', 2);
    expect(mocks.refresh).toHaveBeenCalled();
    expect(screen.queryByText('#55-4')).toBeNull();
    expect(screen.getByText('19.56 USDD')).toBeTruthy();
  });

  it('auto-closes the modal once the period list becomes empty', async () => {
    vi.useFakeTimers();
    mocks.periods = [];
    const onClose = vi.fn();
    render(<MiningPeriodsModal visible={true} onClose={onClose} />);

    await act(async () => {
      vi.advanceTimersByTime(800);
      await Promise.resolve();
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders traditional Chinese period modal copy without raw keys', () => {
    mocks.locale = 'zh-TC';

    render(<MiningPeriodsModal visible={true} onClose={vi.fn()} />);

    expect(screen.getByText('領取收益')).toBeTruthy();
    expect(screen.getByText('當前可領取')).toBeTruthy();
    expect(screen.getByText('挖礦期數')).toBeTruthy();
    expect(screen.getByText('可領取')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: '領取' }).length).toBe(3);
    expect(screen.queryByText('v2.rewards.current_claimable')).toBeNull();
  });
});
