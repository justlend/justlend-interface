import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock heavy external deps before importing SystemStore. The trigger() method
// short-circuits in the catch block for every scenario under test, so we only
// need triggerSmartContract to return a shaped transaction — sendRawTransaction
// and the rest never execute for these cases.
vi.mock('../utils/blockchain', () => ({
  triggerSmartContract: vi.fn(() => Promise.resolve({ transaction: { transaction: { raw: 'x' } } })),
  sendRawTransaction: vi.fn(),
  MAX_UINT256: '0x0',
  tronObj: { tronWeb: {} }
}));

vi.mock('../utils/helper', () => ({
  addressToHex: a => a,
  BigNumber: () => ({ gt: () => false, lte: () => true, isNaN: () => false }),
  setTransactionsData: vi.fn(),
  getInjectedTronWeb: vi.fn()
}));

vi.mock('../utils/constant', () => ({
  WALLET_TYPES: {
    WALLETCONNECT: 'walletconnect',
    LEDGER: 'ledger',
    TOKENPOCKET: 'tokenpocket',
    BINANCE: 'binance',
    TRONLINK: 'tronlink'
  }
}));

vi.mock('../config', () => ({
  default: { feeLimit: 100 }
}));

vi.mock('antd', () => ({
  message: { warning: vi.fn() }
}));

vi.mock('react-intl-universal', () => ({
  default: { get: key => key }
}));

vi.mock('tronweb', () => ({
  utils: { abi: { encodeParamsV2ByABI: () => '' } }
}));

// Must come after vi.mock calls — vitest hoists mocks but explicit order helps readability.
import SystemStore from './system.jsx';
import { WALLET_TYPES } from '../utils/constant';

const makeStore = signTransactionImpl => {
  const rootStore = {
    connect: {
      client: { signTransaction: signTransactionImpl }
    },
    network: {
      isConnected: true,
      walletType: WALLET_TYPES.WALLETCONNECT,
      isLedgerConnected: false,
      adapters: {}
    },
    ledger: { client: null },
    transaction: { addTransaction: vi.fn() }
  };
  return new SystemStore(rootStore);
};

describe('SystemStore.trigger · WalletConnect sign error handling', () => {
  let reloadSpy;
  let storageSpy;

  beforeEach(() => {
    window.defaultAccount = 'T_DEFAULT_ADDR';
    // jsdom marks window.location.reload as "Not implemented"; replace the
    // whole location object via defineProperty so we can observe the call.
    reloadSpy = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload: reloadSpy }
    });
    storageSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
    // Silence the console.error we emit in the unknown-error branch.
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('opens step-3 modal WITHOUT declined flag on unknown sign error', async () => {
    const store = makeStore(() => Promise.reject(new Error('boom')));
    const spy = vi.spyOn(store, 'openTransModal');

    await store.trigger('0xaddr', 'fn()', [], {}, { title: 'deposit' });

    // Last openTransModal call is the one from the !signedTransaction guard.
    const args = spy.mock.calls[spy.mock.calls.length - 1][0];
    expect(args.step).toBe(3);
    expect(args.declined).toBeUndefined();
  });

  it('opens step-3 modal WITH declined=true when wallet returns code -32000', async () => {
    const err = { error: { code: -32000, message: '' } };
    const store = makeStore(() => Promise.reject(err));
    const spy = vi.spyOn(store, 'openTransModal');

    await store.trigger('0xaddr', 'fn()', [], {}, { title: 'deposit' });

    const args = spy.mock.calls[spy.mock.calls.length - 1][0];
    expect(args.step).toBe(3);
    expect(args.declined).toBe(true);
  });

  it('opens step-3 modal WITH declined=true when error message contains "Cancel"', async () => {
    const err = { message: 'User Cancelled the request' };
    const store = makeStore(() => Promise.reject(err));
    const spy = vi.spyOn(store, 'openTransModal');

    await store.trigger('0xaddr', 'fn()', [], {}, { title: 'deposit' });

    const args = spy.mock.calls[spy.mock.calls.length - 1][0];
    expect(args.step).toBe(3);
    expect(args.declined).toBe(true);
  });

  it('clears WalletConnect session and reloads on "No matching key"', async () => {
    const err = { error: { message: 'No matching key found' } };
    const store = makeStore(() => Promise.reject(err));
    const modalSpy = vi.spyOn(store, 'openTransModal');

    await store.trigger('0xaddr', 'fn()', [], {}, { title: 'deposit' });

    expect(storageSpy).toHaveBeenCalledWith('wc@2:client:0.3//session', '[]');
    expect(reloadSpy).toHaveBeenCalled();
    // After wiping session we reload — no step-3 modal should be opened.
    const lastArgs = modalSpy.mock.calls[modalSpy.mock.calls.length - 1][0];
    expect(lastArgs.step).not.toBe(3);
  });
});
