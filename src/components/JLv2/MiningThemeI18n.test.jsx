import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { RewardsClaimPanel } from './Dashboard/RewardsClaimPanel';

const translations = {
  'en-US': {
    'mining.rewards.title': 'Mining Rewards',
    'mining.rewards.claim': 'Claim',
    'mining.rewards.connect_tip': 'Connect your wallet to view and claim mining rewards.',
    'mining.rewards.empty_tip': 'No mining rewards to claim yet.',
    'mining.rewards.no_position_tip': 'You have unclaimed mining rewards',
    'mining.rewards.claim_success': 'Claim transaction submitted successfully.',
    'mining.rewards.claim_failed': 'Claim failed. Please try again.',
    'mining.breakdown.base_apy': 'Base APY',
    'mining.breakdown.mining_apy': 'Mining APY',
    'mining.breakdown.total_apy': 'Total APY',
    'mining.breakdown.base_earnings': 'Base Earnings',
    'mining.breakdown.mining_earnings': 'Mining Earnings',
    'mining.breakdown.total_earnings': 'Total Earnings',
    'mining.rate.title': 'Mining Rate',
    'mining.rate.unit': 'USDD/day',
    'mining.sp_tip': 'After the rewards are settled, it will take 3 – 5 days before they can be claimed.',
    'v2.rewards.mining_rewards': 'Mining Rewards',
    'v2.rewards.waiting_rewards': 'Waiting Rewards',
    'v2.rewards.to_be_settled': 'To Be Settled',
    'v2.rewards.none': 'None',
    'v2.rewards.claim': 'Claim',
    'v2.reward_note': 'Reward note',
    'jlv2.market.confirming': 'Confirming',
    'navi.wallet_linkbtn': 'Connect Wallet'
  },
  'zh-CN': {
    'mining.rewards.title': '挖矿奖励',
    'mining.rewards.claim': '领取',
    'mining.rewards.connect_tip': '连接钱包以查看并领取挖矿奖励。',
    'mining.rewards.empty_tip': '暂无可领取的挖矿奖励。',
    'mining.rewards.no_position_tip': '您有未领取的挖矿奖励',
    'mining.rewards.claim_success': '领取交易已提交。',
    'mining.rewards.claim_failed': '领取失败，请稍后再试。',
    'mining.breakdown.base_apy': '基础 APY',
    'mining.breakdown.mining_apy': '挖矿 APY',
    'mining.breakdown.total_apy': '总 APY',
    'mining.breakdown.base_earnings': '基础收益',
    'mining.breakdown.mining_earnings': '挖矿收益',
    'mining.breakdown.total_earnings': '总收益',
    'mining.rate.title': '矿速',
    'mining.rate.unit': 'USDD / 天',
    'mining.sp_tip': '收益结算后需等待 3 – 5 天进入可领取状态，其间本期已结算收益将暂不显示',
    'v2.rewards.mining_rewards': '挖矿奖励',
    'v2.rewards.waiting_rewards': '待领取收益',
    'v2.rewards.to_be_settled': '待结算',
    'v2.rewards.none': '无',
    'v2.rewards.claim': '领取',
    'v2.reward_note': '说明',
    'jlv2.market.confirming': '确认中',
    'navi.wallet_linkbtn': '连接钱包'
  },
  'zh-TC': {
    'mining.rewards.title': '挖礦獎勵',
    'mining.rewards.claim': '領取',
    'mining.rewards.connect_tip': '連接錢包以查看並領取挖礦獎勵。',
    'mining.rewards.empty_tip': '暫無可領取的挖礦獎勵。',
    'mining.rewards.no_position_tip': '您有未領取的挖礦獎勵',
    'mining.rewards.claim_success': '領取交易已提交。',
    'mining.rewards.claim_failed': '領取失敗，請稍後再試。',
    'mining.breakdown.base_apy': '基礎 APY',
    'mining.breakdown.mining_apy': '挖礦 APY',
    'mining.breakdown.total_apy': '總 APY',
    'mining.breakdown.base_earnings': '基礎收益',
    'mining.breakdown.mining_earnings': '挖礦收益',
    'mining.breakdown.total_earnings': '總收益',
    'mining.rate.title': '礦速',
    'mining.rate.unit': 'USDD / 天',
    'mining.sp_tip': '收益結算後需等待 3 – 5 天進入可領取狀態，其間本期已結算收益將暫不顯示',
    'v2.rewards.mining_rewards': '挖礦獎勵',
    'v2.rewards.waiting_rewards': '待領取收益',
    'v2.rewards.to_be_settled': '待結算',
    'v2.rewards.none': '無',
    'v2.rewards.claim': '領取',
    'v2.reward_note': '說明',
    'jlv2.market.confirming': '確認中',
    'navi.wallet_linkbtn': '連接錢包'
  }
};

const mocks = vi.hoisted(() => ({
  locale: 'en-US',
  store: {
    network: {
      isConnected: true,
      connectWalletV2: vi.fn()
    },
    lend: {
      serviceInnerStatus: 'enabled',
      setNoServiceModalAllVisible: vi.fn(),
      theme: 'light'
    },
    dashboardStore: {
      positionData: {
        totalSupplyUsd: '0',
        totalBorrowUsd: '0',
        totalCollateralUsd: '0'
      }
    }
  },
  rewards: [{ token: 'USDD', tokenAddress: '0x1', amount: '12.345678', priceUsd: 1 }],
  totalUsd: 12.345678,
  loading: false
}));

vi.mock('../../stores', () => ({
  default: mocks.store
}));

vi.mock('../../utils/hooks/useMining', () => ({
  hasClaimableRewards: rewards => Array.isArray(rewards) && rewards.some(reward => Number(reward?.amount || 0) > 0),
  useMiningRewards: () => ({
    rewards: mocks.rewards,
    totalUsd: mocks.totalUsd,
    loading: mocks.loading,
    refresh: vi.fn()
  }),
  useAccruingMining: () => ({ totalUsd: 0, loading: false }),
  useUserPositionMining: () => ({ enabled: false, baseApy: 0, miningApy: { total: 0 } })
}));

vi.mock('../Modals/JLv2/MiningPeriods', () => ({
  default: () => null
}));

vi.mock('../../utils/constant', () => ({
  getIconsJLv2: () => '/mock-icon.png'
}));

vi.mock('../../utils/formatters', () => ({
  formatTokenAmount: (value, symbol) => `${value} ${symbol}`,
  formatFiatValue: value => `$${value}`,
  formatApyRate: value => `${value}%`
}));

vi.mock('ismobilejs', () => ({
  default: () => ({ any: false })
}));

vi.mock('react-intl-universal', () => ({
  default: {
    get: key => translations[mocks.locale][key] || key,
    getHTML: key => translations[mocks.locale][key] || key
  }
}));

vi.mock('antd', () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
  Modal: ({ visible, title, onCancel, className, children }) =>
    visible ? (
      <div data-testid="mining-modal" className={className}>
        <div>{title}</div>
        <button type="button" aria-label="close" onClick={onCancel}>
          x
        </button>
        {children}
      </div>
    ) : null,
  Tooltip: ({ title, children }) => (
    <div>
      <div>{title}</div>
      {children}
    </div>
  ),
  message: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

describe('mining theme and i18n', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.locale = 'en-US';
    mocks.store.lend.theme = 'light';
  });

  afterEach(() => {
    cleanup();
  });

  it('renders English mining copy without raw keys', () => {
    mocks.locale = 'en-US';
    render(<RewardsClaimPanel />);

    expect(screen.getByText('Mining Rewards')).toBeTruthy();
    expect(screen.getByText('Claim')).toBeTruthy();
    expect(screen.queryByText('mining.rewards.title')).toBeNull();
    expect(screen.queryByText('mining.rewards.claim')).toBeNull();
  });

  it('renders simplified Chinese mining copy without raw keys', () => {
    mocks.locale = 'zh-CN';
    render(<RewardsClaimPanel />);

    expect(screen.getByText('挖矿奖励')).toBeTruthy();
    expect(screen.getByText('领取')).toBeTruthy();
    expect(screen.queryByText('mining.rewards.title')).toBeNull();
    expect(screen.queryByText('mining.rewards.claim')).toBeNull();
  });

  it('renders traditional Chinese mining copy without raw keys', () => {
    mocks.locale = 'zh-TC';
    render(<RewardsClaimPanel />);

    expect(screen.getByText('挖礦獎勵')).toBeTruthy();
    expect(screen.getByText('領取')).toBeTruthy();
    expect(screen.queryByText('mining.rewards.title')).toBeNull();
    expect(screen.queryByText('mining.rewards.claim')).toBeNull();
  });
});
