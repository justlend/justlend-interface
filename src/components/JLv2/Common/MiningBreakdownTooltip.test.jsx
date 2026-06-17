import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { ApyBreakdownTooltip } from './ApyBreakdownTooltip';
import { EarningsBreakdownTooltip } from './EarningsBreakdownTooltip';

const mocks = vi.hoisted(() => ({
  isMobile: false,
  tooltipProps: []
}));

vi.mock('ismobilejs', () => ({
  default: () => ({ any: mocks.isMobile })
}));

vi.mock('antd', () => ({
  Tooltip: ({ title, trigger, children }) => {
    mocks.tooltipProps.push({ trigger });
    return (
      <div>
        <div data-testid="tooltip-title">{title}</div>
        {children}
      </div>
    );
  }
}));

vi.mock('react-intl-universal', () => ({
  default: {
    get: key =>
      ({
        'mining.breakdown.base_apy': 'Base APY',
        'mining.breakdown.mining_apy': 'Mining APY',
        'mining.breakdown.total_apy': 'Total APY',
        'mining.breakdown.base_label': 'Base',
        'mining.breakdown.mining_label': 'Mining'
      }[key] || key)
  }
}));

vi.mock('../../../utils/formatters', () => ({
  formatApyRate: value => `${value}%`,
  formatTokenAmount: (value, symbol) => (symbol ? `${value} ${symbol}` : `${value}`)
}));

describe('mining breakdown tooltips', () => {
  beforeEach(() => {
    mocks.isMobile = false;
    mocks.tooltipProps = [];
  });

  afterEach(() => {
    cleanup();
  });

  it('renders APY rows and uses hover trigger on desktop', () => {
    render(<ApyBreakdownTooltip baseApy={4.21} miningApy={3.12} />);

    expect(screen.getByText('Base APY')).toBeTruthy();
    expect(screen.getByText('Mining APY')).toBeTruthy();
    expect(screen.getByText('Total APY')).toBeTruthy();
    expect(screen.getByText('4.21%')).toBeTruthy();
    expect(screen.getByText('3.12%')).toBeTruthy();
    expect(screen.getByText('7.33%')).toBeTruthy();
    expect(mocks.tooltipProps[0].trigger).toEqual(['hover']);
  });

  it('renders inline earnings token breakdown and uses click trigger on mobile', () => {
    mocks.isMobile = true;

    render(
      <EarningsBreakdownTooltip baseAmount="66.2516" baseToken="USDD" miningAmount="12.2352" miningToken="USDD" />
    );

    expect(screen.getByText(/66.2516 USDD/)).toBeTruthy();
    expect(screen.getByText(/12.2352 USDD/)).toBeTruthy();
    expect(screen.getAllByText(/Base/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Mining/).length).toBeGreaterThan(0);
    expect(mocks.tooltipProps[0].trigger).toEqual(['click']);
  });
});
