import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MiningEarningsBreakdownTooltip } from './MiningEarningsBreakdownTooltip';

vi.mock('ismobilejs', () => ({ default: () => ({ any: false }) }));

vi.mock('antd', () => ({
  Tooltip: ({ title, children }) => (
    <div>
      <div data-testid="tooltip-body">{title}</div>
      {children}
    </div>
  )
}));

vi.mock('react-intl-universal', () => ({
  default: {
    get: key =>
      ({
        'v2.rewards.waiting_rewards': '待领取收益',
        'v2.rewards.to_be_settled': '待结算收益',
        'v2.rewards.none': '暂无',
        'v2.reward_note': '特别说明：',
        'mining.sp_tip': '收益结算后需等待 3 – 5 天进入可领取状态'
      }[key] || key),
    getHTML: (key, vars) => {
      if (key === 'v2.settlement_time') return `预计将于 ${vars?.date} (UTC+8) 结算`;
      return key;
    }
  }
}));

vi.mock('../../../utils/formatters', () => ({
  formatTokenAmount: (value, symbol) => (symbol ? `${value} ${symbol}` : `${value}`)
}));

describe('MiningEarningsBreakdownTooltip', () => {
  afterEach(() => cleanup());

  it('renders claimable + settling rows with the settlement time line', () => {
    render(
      <MiningEarningsBreakdownTooltip
        claimableTokens={[{ token: 'USDD', amount: '123.45' }]}
        settlingTokens={[{ token: 'USDD', amount: '67.89' }]}
        settlementTime="2026-08-23 00:00"
      />
    );

    const body = screen.getByTestId('tooltip-body').textContent;
    expect(body).toContain('待领取收益');
    expect(body).toContain('123.45 USDD');
    expect(body).toContain('待结算收益');
    expect(body).toContain('67.89 USDD');
    expect(body).toContain('预计将于 2026-08-23 00:00 (UTC+8) 结算');
    expect(body).toContain('特别说明');
    expect(body).toContain('3 – 5 天');
  });

  it('hides the settlement-time line when there are no settling tokens', () => {
    render(
      <MiningEarningsBreakdownTooltip
        claimableTokens={[{ token: 'USDD', amount: '5' }]}
        settlingTokens={[]}
        settlementTime="2026-08-23 00:00"
      />
    );

    const body = screen.getByTestId('tooltip-body').textContent;
    expect(body).toContain('待结算收益');
    expect(body).toContain('暂无');
    expect(body).not.toContain('预计将于');
  });

  it('shows -- and the settlement-time line when globalSettlementStatus is set', () => {
    render(
      <MiningEarningsBreakdownTooltip
        claimableTokens={[{ token: 'USDD', amount: '5' }]}
        settlingTokens={[{ token: 'USDD', amount: '99' }]}
        settlementTime="2026-08-23 00:00"
        globalSettlementStatus
      />
    );

    const body = screen.getByTestId('tooltip-body').textContent;
    expect(body).toContain('待结算收益');
    expect(body).toContain('--');
    expect(body).not.toContain('99 USDD');
    expect(body).toContain('预计将于 2026-08-23 00:00 (UTC+8) 结算');
  });

  it('falls back to "none" when no claimable or settling tokens are provided', () => {
    render(<MiningEarningsBreakdownTooltip claimableTokens={[]} settlingTokens={[]} settlementTime="" />);

    const body = screen.getByTestId('tooltip-body').textContent;
    
    expect(body.match(/暂无/g)?.length).toBeGreaterThanOrEqual(2);
    expect(body).not.toContain('预计将于');
  });
});
