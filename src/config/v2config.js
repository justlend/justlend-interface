const env = import.meta.env.VITE_ENV;
const MAINNET_CONTRACTS = {
  Moolah: 'TKEiKtSaqUboeBmZxcSp8Z2CJUDGk4BT3a',
  MoolahProxy: 'TDH4dhmVQQNc1ZNudJwWzBcs2h6ahhWrpp',
  MoolahVaultV1: 'TVE5y9aSf1f7CiRjPJM4MgYXgCqBoJGE9z',
  MoolahVaultFactory: 'TTt6eWpEPZPBE5HiCRsgrjFfAh21kmFRcT',
  MoolahVaultFactoryProxy: 'TYoUEF2jB5WdTSVKRTmbUtC9iieVUPY1XK',
  InterestRateModel: 'TM96c8n7FrF9rGVg6h4MatA1ghY6tjneWD',
  IrmProxy: 'TSsuwbvUKAVgRmSghXT7i38PgHWpW12wQ1',
  BoundValidator: 'TUQJWn72TV5NuAy7oCV95mRcJgrrFjxhdc',
  BoundValidatorProxy: 'TEfEgB5LjkQJXYhrKp4j14xUGLGD1NK4zC',
  ResilientOracle: 'TN6B7nsKYySF7sqD9xzZPiPmXyoX3ZpbGD',
  ResilientOracleProxy: 'TUDXEUA6hNiWPm54cMifoxCZU28zRu6bPc',
  LendingFeeRecipient: 'TAqxyXczXXFpQQiycoSDVopgBCMDmgKrK2',
  LendingFeeRecipientProxy: 'TMzGb5Ma85oYMcnmVFjhvS1HYr6MRSspmE',
  TRXProvider: 'TDsc5u5h9AjYfnH3zh92SH5dJouHSxiim2',
  TrxProviderProxy: 'TMDENHFSiRzmJNSEBAFmrDbLkQ672iPN8H',
  Liquidator: 'TJHdh4LG9eLiGq5qW7NnyczuFU48YUCyhh',
  PublicLiquidator: 'TUM8vMhR3MN5jmqYPxvwEV3erwJy374f6c',
  LiquidatorProxy: 'TKX8nUY8otA4d9qV1tDuN5BLSrxkr9pWa6',
  PublicLiquidatorProxy: 'TGDuQaHtvadVL5z9PMM874CaehQnwf3qJi',
  MoolahQueryHelper: 'TYDyabbGXcmPKSEftQLhkEn44VmJbHKAmp',
  Manager: 'TCN2hHmLRBvw5C6QP8CsFogRLerAyAFmmC',
  ManagerProxy: 'TKKX9qYdRvnTmAaxEYv8VfFpzXzt3PEe2w',
  UsdtVaultProxy: 'TXejU9jmd1ooQyY3Zmpo15yN7MjSFYUESg',
  UsddVaultProxy: 'TA3q7XjdBQWb4qFxaPULUsnjvVZGgC9Brz',
  TrxVaultProxy: 'THpxp8RpCUGk55dV7oL1LfxDeP9QvouxmM'
};

const Config = {
  chain: {
    privateKey: '01',
    fullHost: 'https://api.trongrid.io'
  },
  service: {
    v2host: 'https://zenvora.ablesdxd.link',
    // --- Index ---
    myPositionPath: '/index/position',
    indexHistoryPath: '/index/history-records',
    indexVaultListPath: '/index/vault/list',
    indexMarketListPath: '/index/market/list',
    // --- Vault ---
    vaultInfoPath: '/vault/info',
    vaultApyHistoryPath: '/vault/history-data',
    vaultAllocationPath: '/vault/allocation',
    vaultMyPositionPath: '/vault/position',
    // --- Market/Borrow ---
    marketInfoPath: '/market/marketInfo',
    marketBorrowHistoryPath: '/market/history-data',
    marketVaultListPath: '/market/vault-list',
    marketMyPositionPath: '/market/position',
    // --- record ----
    recordSBMv2Path: '/record/lend',
    // --- liquidation ---
    pendingLiquidationsPath: '/liquidate/pendingLiquidations',
    liquidationTokensPath: '/liquidate/tokenList',
    liquidationRecordsPath: '/liquidate/records'
  },
  contracts: Object.assign(
    {
      WtrxContractProxy: 'TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR'
    },
    MAINNET_CONTRACTS
  ),
  tokens: {
    WTRX: 'TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR',
    TRX: 'TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR',
    USDT: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    USDD: 'TXDk8mbtRbXeYuMNS83CfKPaYYT8XWv9Hz',
    BTC: 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9',
    STRX: 'TU3kjFuhtEo42tsCBtfYUAZxoqQ4yuSLQ5'
  },
  markets: {},
  trxDecimal: 6,
  trxPrecision: 1e6,
  trc20Decimal: 18,
  trc20Precision: 1e18,
  defaultReserveFee: 30,
  defaultAddedFeeBuffer: 2,
  callValueRate: 1.0001,
  additionalCallBackTime: 3000,
  additionalCallBackTimeForVault: 12000
};

const TESTNET_V2_CONFIG = {
  chain: {
    privateKey: '01',
    fullHost: 'https://api.nileex.io'
  },
  contracts: {
    MoolahProxy: 'TFgrgsd8c37ByaZx1YxpBzazJS8bHsoP5c',
    PublicLiquidatorProxy: 'TLvPrXHVQCA54gLQjLfoNi5XQ6WqhXCEps',
    WtrxContractProxy: 'TYsbWxNnyTgsZaTFaue9hqpxkU3Fkco94a',
    MoolahVaultFactoryProxy: 'TYBHjJ5cLnA76mLk6S6cCwUw8kR3r2mSYu',
    IrmProxy: 'TQYeFiTVNfJ6jfqjyfL2s93VLG1huaMEzC',
    ResilientOracleProxy: 'TFYLvDFSEW6dKSnWb3mt76hkHAgxPktrnG',
    TrxProviderProxy: 'TMRZwenUVHPvnxhwDDQLY4SEmmwXvtKRjz',
    WtrxVaultProxy: 'TWxWVxUv6FvJtWELhLmdKWQRf9eMoVs2ki',
    UsdtVaultProxy: 'TXfQWrF4mkq5XFaoRYv3crdhjiKkhdMEx5'
  },
  tokens: {
    WTRX: 'TYsbWxNnyTgsZaTFaue9hqpxkU3Fkco94a',
    USDT: 'TPYwAC9Y4uUcT2QH3WPPjqxzJSJWymMoMS',
    USDD: 'THfS8gUDH5Cx1FnwvdQ2QfBdCHyeNDaKzs',
    STRX: 'TZ8du1HkatTWDbS6FLZei4dQfjfpSm9mxp'
  },
  markets: {
    'WTRX_USDT': {
      id: '0x91f4a0be8d8c99a62f5f9b77d7a2d19906e4a06794a0ca79c4547fbf02aa09ca',
      params: {
        loanToken: 'TYsbWxNnyTgsZaTFaue9hqpxkU3Fkco94a', // WTRX
        collateralToken: 'TPYwAC9Y4uUcT2QH3WPPjqxzJSJWymMoMS', // USDT
        oracle: 'TFYLvDFSEW6dKSnWb3mt76hkHAgxPktrnG', // ResilientOracleProxy
        irm: 'TQYeFiTVNfJ6jfqjyfL2s93VLG1huaMEzC', // IrmProxy
        lltv: '750000000000000000'
      }
    },
    'USDT_WTRX': {
      id: '0x42649f561525d32fb1552f39111e1037185ca36f15ca19fe6f31bf2710164bb4',
      params: {
        loanToken: 'TPYwAC9Y4uUcT2QH3WPPjqxzJSJWymMoMS', // USDT
        collateralToken: 'TYsbWxNnyTgsZaTFaue9hqpxkU3Fkco94a', // WTRX
        oracle: 'TFYLvDFSEW6dKSnWb3mt76hkHAgxPktrnG', // ResilientOracleProxy
        irm: 'TQYeFiTVNfJ6jfqjyfL2s93VLG1huaMEzC', // IrmProxy
        lltv: '750000000000000000'
      }
    }
  }
};

let devConfig = {};


export default Object.assign(Config, devConfig);
