import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useClaimMiningPeriod } from './useMining';

const mocks = vi.hoisted(() => ({
  config: {
    USE_MINING_MOCK: false,
    usdd: { token: 'USDD_TOKEN' },
    usddold: { token: 'USDD_OLD_TOKEN' },
    usddnew: { token: 'USDD_NEW_TOKEN' },
    merkleDistributorV2: 'V2_DISTRIBUTOR'
  },
  store: {
    network: { defaultAccount: 'TUSER' },
    system: {
      view: vi.fn(),
      getMultiReward: vi.fn(),
      waitForTxConfirmation: vi.fn()
    }
  },
  getV2UnClaimedAirDrop: vi.fn(),
  getTokenPrice: vi.fn()
}));

vi.mock('../../config', () => ({ default: mocks.config }));
vi.mock('../../stores', () => ({ default: mocks.store }));
vi.mock('../../service/mock/mining', () => ({
  fetchMockPendingRewards: vi.fn(),
  fetchMockPendingPeriods: vi.fn(),
  fetchMockMarketMiningApy: vi.fn(),
  fetchMockVaultMiningApy: vi.fn(),
  fetchMockUserPositionMining: vi.fn(),
  isMockVaultMiningEnabled: vi.fn(),
  isMockMarketMiningEnabled: vi.fn(),
  getMockDefaultVaultMiningEntry: vi.fn()
}));
vi.mock('../mock/miningContract', () => ({ sendMockClaimPeriod: vi.fn() }));
vi.mock('../backend', () => ({
  getV2TronBull: vi.fn(),
  getV2Tronbullish: vi.fn(),
  getV2UnClaimedAirDrop: (...args) => mocks.getV2UnClaimedAirDrop(...args),
  getTokenPrice: (...args) => mocks.getTokenPrice(...args)
}));
vi.mock('../../service/V2backend', () => ({
  getVaultInfo: vi.fn(),
  getVaultMyPosition: vi.fn(),
  getMyPosition: vi.fn()
}));

const ZERO_BYTES32 = `0x${'0'.repeat(64)}`;
const READY_ROOT = `0x${'1'.padStart(64, '0')}`;

// Backend always returns the v2 mining airdrop as a 2-slot array — second
// slot is zero when only one token is being distributed in this round —
// matching the merkle leaf encoding (index, account, uint256[] amounts).
const period = {
  periodKey: '2',
  merkleIndex: 1,
  index: 0,
  proof: [`0x${'2'.padStart(64, '0')}`, `0x${'3'.padStart(64, '0')}`],
  tokens: [
    {
      token: 'USDD',
      tokenAddress: 'USDD_TOKEN',
      amount: '32.4',
      amountRaw: '32400000000000000000'
    },
    {
      token: 'TRX',
      tokenAddress: 'TRX_TOKEN',
      amount: '0',
      amountRaw: '0'
    }
  ]
};

const HookHarness = ({ period }) => {
  const { claim, status, activeKey, error } = useClaimMiningPeriod();
  return (
    <div>
      <button type="button" onClick={() => claim(period).catch(() => {})}>
        claim
      </button>
      <span data-testid="status">{status}</span>
      <span data-testid="activeKey">{activeKey || ''}</span>
      <span data-testid="error">{error?.code || ''}</span>
      <span data-testid="errorMessage">{error?.message || ''}</span>
    </div>
  );
};

describe('useClaimMiningPeriod real claim guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    mocks.config.USE_MINING_MOCK = false;
    mocks.config.merkleDistributorV2 = 'V2_DISTRIBUTOR';
    mocks.getTokenPrice.mockResolvedValue({ success: true, priceTRX: 0.2 });
    mocks.getV2UnClaimedAirDrop.mockResolvedValue({
      success: true,
      data: {
        [period.periodKey]: { merkleIndex: period.merkleIndex, index: period.index, claimed: true }
      }
    });
    mocks.store.system.getMultiReward.mockResolvedValue('0xTX');
    mocks.store.system.waitForTxConfirmation.mockResolvedValue(true);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('blocks claim before wallet transaction when merkle root is empty', async () => {
    mocks.store.system.view.mockImplementation((_address, selector) => {
      if (selector === 'isClaimed(uint256,uint256)') return Promise.resolve(['0x0']);
      if (selector === 'merkleRoots(uint256)') return Promise.resolve([ZERO_BYTES32]);
      return Promise.resolve([]);
    });

    render(<HookHarness period={period} />);

    await act(async () => {
      screen.getByRole('button', { name: 'claim' }).click();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByTestId('status').textContent).toBe('failed');
    expect(screen.getByTestId('error').textContent).toBe('MERKLE_ROOT_NOT_READY');
    expect(mocks.store.system.getMultiReward).not.toHaveBeenCalled();
    expect(mocks.store.system.waitForTxConfirmation).not.toHaveBeenCalled();
  });

  it('blocks claim before wallet transaction when chain reports already claimed', async () => {
    mocks.store.system.view.mockImplementation((_address, selector) => {
      if (selector === 'isClaimed(uint256,uint256)') return Promise.resolve(['0x1']);
      if (selector === 'merkleRoots(uint256)') return Promise.resolve([READY_ROOT]);
      return Promise.resolve([]);
    });

    render(<HookHarness period={period} />);

    await act(async () => {
      screen.getByRole('button', { name: 'claim' }).click();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByTestId('status').textContent).toBe('failed');
    expect(screen.getByTestId('error').textContent).toBe('ALREADY_CLAIMED');
    expect(mocks.store.system.getMultiReward).not.toHaveBeenCalled();
  });

  it('aborts before wallet when v2 distributor is not configured for the env', async () => {
    mocks.config.merkleDistributorV2 = '';

    render(<HookHarness period={period} />);

    await act(async () => {
      screen.getByRole('button', { name: 'claim' }).click();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByTestId('status').textContent).toBe('failed');
    expect(screen.getByTestId('error').textContent).toBe('DISTRIBUTOR_NOT_CONFIGURED');
    expect(mocks.store.system.view).not.toHaveBeenCalled();
    expect(mocks.store.system.getMultiReward).not.toHaveBeenCalled();
  });

  it('routes every claim through merkleDistributorV2 with array-amount selector', async () => {
    mocks.store.system.view.mockImplementation((_address, selector) => {
      if (selector === 'isClaimed(uint256,uint256)') return Promise.resolve(['0x0']);
      if (selector === 'merkleRoots(uint256)') return Promise.resolve([READY_ROOT]);
      return Promise.resolve([]);
    });

    render(<HookHarness period={period} />);

    await act(async () => {
      screen.getByRole('button', { name: 'claim' }).click();
      for (let i = 0; i < 6; i++) await Promise.resolve();
    });

    expect(screen.getByTestId('errorMessage').textContent).toBe('');
    expect(screen.getByTestId('status').textContent).toBe('success');
    expect(mocks.store.system.getMultiReward).toHaveBeenCalledWith(
      [[[1, 0, ['32400000000000000000', '0'], period.proof]]],
      expect.any(Object),
      false,
      'V2_DISTRIBUTOR',
      'multiClaim((uint256,uint256,uint256[],bytes32[])[])'
    );
    expect(mocks.store.system.waitForTxConfirmation).toHaveBeenCalledWith('0xTX');
    expect(mocks.getV2UnClaimedAirDrop).toHaveBeenCalledWith('TUSER', false);
  });
});
