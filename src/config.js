import BigNumber from 'bignumber.js';
import packageJson from '../package.json';
import tokenInfo from './token.js';
import tokenTest from './token.test.js';

import tokenNile from './token.test.js';

const env = import.meta.env.VITE_ENV;
const startTime = 1607344200000; // 2020-12-07 20:30:00 1607344200000
const endTime = 1643374800000; // 2022-01-28 21:00:00

let devTokenInfo = {};


const TOKENS = Object.assign(tokenInfo, devTokenInfo);
export const GIFT_KEY = ['trx'];

export const genContract = newContract => {
  const start = newContract.start ? newContract.start : 0;
  const day = newContract.day ? newContract.day : 14;
  const end = start + day * 24 * 60 * 60 * 1000;
  let next = newContract.next || {};
  if (next.start) {
    const nextDay = next.day ? next.day : 14;
    next.end = next.start + nextDay * 24 * 60 * 60 * 1000;
    next.day = nextDay;
  }

  let tokenKey = '';
  if (newContract.lp) {
    tokenKey = `${newContract.lp.toLowerCase()}lp`;
  } else {
    tokenKey = newContract.symbol.toLowerCase();
  }

  const tokenInfo = TOKENS[tokenKey];
  const token = tokenInfo.token ? tokenInfo.token : '';
  const tokenAddress = tokenInfo.tokenAddress ? tokenInfo.tokenAddress : '';
  const jtokenAddress = tokenInfo.jtokenAddress ? tokenInfo.jtokenAddress : '';
  const symbol = tokenInfo.symbol ? tokenInfo.symbol : '';
  const lp = tokenInfo.lp ? tokenInfo.lp : '';
  const decimal = tokenInfo.decimal ? tokenInfo.decimal : 6;
  const tokenDecimal = tokenInfo.tokenDecimal ? tokenInfo.tokenDecimal : 6;
  const precision = BigNumber(10).pow(decimal);
  const tokenPrecision = BigNumber(10).pow(tokenDecimal);

  const defaultCt = {
    pool: '',
    token,
    tokenAddress,
    jtokenAddress,
    symbol,
    lp,
    decimal,
    precision,
    tokenDecimal,
    tokenPrecision,

    sunoldSupply: 0,
    start,
    end,
    day,

    rate: '',
    rateUpdate: 0,
    rateNew: '',

    id: '',
    from: '',
    to: '',
    next,
    isLend: false
  };

  return Object.assign(defaultCt, newContract);
};

export const genContractNew = newContract => {
  const c = genContract(newContract);
  if (!c.giftKey) {
    c.giftKey = GIFT_KEY;
  }
  c.gift = c.giftKey.map(key => {
    return TOKENS[key];
  });
  return c;
};

export const getTokenFromAddress = () => {
  const tokenInfo = Object.values(TOKENS);
  let tokensWithAddress = {};
  tokenInfo.map(item => {
    tokensWithAddress[item.token] = {
      tokenSymbol: item.symbol
    };
  });
  return tokensWithAddress;
};

const Config = {
  USE_MINING_MOCK: false,
  CHAIN_ID_NILE: '0xcd8690dc',
  rewardbBasePhaseForNewPeriod: 49,
  miningSymbol: 'USDD',
  miningNewSymbol: 'TRX',
  usddV1MiningEndTime: 1737896400000, // 2025-01-26 21:00:00
  usddV2MiningStartTime: 1738411200000, // 2025-02-01 20:00:00
  dualMiningStartTime: 1764041700000,
  adBannerVisible: true,
  adLink: 'https://app.usdd.io/',
  allowAutoConnectInMobile: ['imToken Wallet'],
  tokenUncutZeroInDetailPage: ['USDDOLD', 'USDD', 'TUSD', 'USDT', 'BUSDOLD'],
  announcements: 'https://support.justlend.org/hc/en-us/sections/900001080386-%E5%85%AC%E5%91%8A',
  usddV2MiningAnnoucement:
    'https://support.justlend.org/hc/en-us/articles/55566919202841-JustLend-DAO-Launches-USDD-V2-0-Market-Supply-Mining-Activity-XV',
  suspensionAnnoucement:
    'https://support.justlend.org/hc/en-us/articles/37275939067161-Announcement-on-the-Suspension-of-Supply-Mining-Activity',
  wbtcMiningAnnoucement:
    'https://support.justlend.org/hc/en-us/articles/54740066620569-Announcement-on-the-launch-of-the-WBTC-Market-Supply-Mining-Activity-on-JustLend-DAO',
  noServiceModalVisible: true,
  winterThemeVisible: false,
  nile: false,
  rentOnlyWhiteList: true,
  version: `v ${packageJson.version}`,
  appVersion: `v ${packageJson.appVersion}`,
  versionForHeader: `v${packageJson.version}`,
  blockId: '00000000000000001ebf88508a03865c71d452e25f4d51194196a1d22b6653dc', // main chain blockId
  chain: {
    privateKey: '01',
    fullHost: 'https://api.trongrid.io'
  },
  trongrid: {
    host: 'https://api.trongrid.io',
    key: import.meta.env.VITE_TRONGRID_KEY || ''
  },
  service: {
    host: 'https://labc.ablesdxd.link', // 'https://lendapi.just.network'
    stableHost: 'https://abc.ablesdxd.link',
    stusdtHost: 'https://api.stusdt.org',
    messageApiHost: 'https://abm.ablesdxd.link',
    marketsPath: '/justlend/markets',
    userPath: '/justlend/account',
    dashboardPath: '/dashboard',
    jtokenDetailsPath: '/jtokenDetails',
    govPath: '/justlend/gov',
    depositBorrowRecord: '/justlend/record/depositBorrow',
    strxRecord: '/justlend/record/strx',
    rentRecord: '/justlend/record/rent',
    voteRecord: '/justlend/record/vote',
    liquidateRecord: '/justlend/record/liquidate',
    updateLastSeen: '/justlend/record/update-last-seen',
    proposalListPath: '/proposalList',
    voteStatusPath: '/voteStatus',
    basePath: '/defi/baseInfo',
    balancePath: '/api/wallet/balance',
    getTime: '/defi/baseInfo',
    yieldInfos: '/justlend/yieldInfos',
    tronBull: '/sunProject/tronbull',
    tronbullish: '/sunProject/tronbullish',
    multiReward: '/sunProject/getAllUnClaimedAirDrop',
    v2TronBull: '/v2/tronbull',
    v2Tronbullish: '/v2/tronbullish',
    v2MultiReward: '/v2/getAllUnClaimedAirDrop',
    allowanceMultiReward: '/strx/rent/getAllUnClaimedAirDrop',
    rentWhiteList: '/strx/rent/wl',
    strxDashboard: '/strx/dashboard',
    strxRentPath: '/strx/rent',
    strxStakeAccount: '/strx/stake/account',
    stUsdtDashboardPath: '/stusdt/dashboard',
    stUsdtAccountPath: '/stusdt/account',
    stUsdtRebaseHistoryPath: '/stusdt/rebase/history',
    liquidatePath: '/justlend/liquidate/highRiskAccountList',
    marketHistory: '/strx/rent/market_history',
    settingsService: {
      setLanguagePath: '/notice/language',
      setSignPath: '/notice/sign',
      getEmailOtpPath: '/notice/code',
      verifyEmailOtpPath: '/notice/verify',
      getEmailBindInfoPath: '/notice/bindInfo',
      getNotiSettingsPath: '/notice/settings',
      updateNotiSettingsPath: '/notice/settings/switch'
    }
  },
  feedbackUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSc7KLXJcEaXeGbxrFH7cG0ZhGP5kFjxFL0HGVyf_3TaviT2Ow/viewform',
  safeValueTRX: 10,
  estimatedEnergyPerTx: 40000,
  energyRental: {
    newOrderMinEnergyValue: 100000,
    newOrderDefaultEnergyValue: 300000,
    renewOrderMinEnergyValue: 50000,
    renewOrderDefaultEnergyValue: 100000
  },
  feManualExtensionTime: 604800000, // 7 days
  oldVoteLastId: 13,
  tronscanUrl: 'https://tronscan.org/#',
  tronscanUrlCN: 'https://tronscan.org/#',
  tronscanUrlEN: 'https://tronscan.org/#',
  sunUrl: 'https://sun.io/',
  whitePaperEn: 'https://www.justlend.link/docs/justlend_whitepaper_en.pdf',
  whitePaperCn: 'https://www.justlend.link/docs/justlend_whitepaper_en.pdf',
  whitePaperTc: 'https://www.justlend.link/docs/justlend_whitepaper_en.pdf',
  docsEn: 'https://docs.justlend.org/',
  docsCn: 'https://docs.justlend.org/',
  forum: 'https://forum.justlend.org',
  github: 'https://github.com/justlend',
  juststable: 'https://just.tronscan.org',
  APIEn: 'https://www.justlend.link/docs/JustLend-api-en.pdf',
  APICn: 'https://www.justlend.link/docs/JustLend-api-cn.pdf',
  APITc: 'https://www.justlend.link/docs/JustLend-api-tc.pdf',
  helpEn: 'https://justlendorg.zendesk.com/hc/en-us',
  helpCn: 'https://justlendorg.zendesk.com/hc/zh-cn',
  feedbackCn: 'https://forms.gle/eAgxkxWdJXQjxN7aA',
  feedbackEn: 'https://forms.gle/5P1RKkcBvQra799L7',
  auditEn: 'https://www.justlend.link/docs/justlend_audit_en.pdf',
  bountyLink: 'https://immunefi.com/bounty/justlenddao/',
  twitter: 'https://twitter.com/DeFi_JUST',
  discord: 'https://discord.com/invite/2KdByBgBA3',
  telegram: 'https://t.me/officialjustlend',
  learnMoreEn: 'https://justlendorg.zendesk.com/hc/en-us/articles/360053116771',
  learnMoreCn: 'https://justlendorg.zendesk.com/hc/zh-cn/articles/360053116771',
  activeSwaps: ['jstlp1'],
  tokenPriceUrl: 'https://c.tronlink.org/v1/cryptocurrency/getprice?symbol=TRX,WBTT,WIN,NFT,JST&convert=USD',
  sbfFaqDoc: 'https://docs.justlend.org/getting-started/faq/supply-and-borrow-market',
  contract: {
    unitroller: 'TGjYzgCyPobsNS9n6WcbdLVR9dH7mWqFx7',
    poly: 'TXTXGyhNLhELNZPDXsn5fCnGYLZoLwJvRC',
    JST: 'TCFLL5dx5ZJdKnWuesXxi1VPwjLVmWZZy9',
    WJSTAddress: 'TXk9LnTnLN7oH96H3sKxJayMxLxR9M4ZD6',
    governorAlphaAddress: 'TEqiF5JbhDPD77yjEfnEMncGRZNDt2uogD',
    oldWJSTAddress: 'TCczUFrX1u4v1mzjBVXsiVyehj1vCaNxDt',
    oldGovernorAlphaAddress: 'TH1SVVVU9NF1ans3CRBCJ5kW2yvn4sHP9b',
    // justlend period 1，jst lp pool
    jstlp1: genContractNew({
      pool: 'TUp1BWfAZidkNbWkoiCjJcf4ctE4PAR2Rg',
      lp: 'JST',
      start: startTime,
      end: endTime,
      rate: '60',
      id: 'jstlp1',
      giftKey: ['jst'],
      subtitle: 'SUNSWAP-JST-TRX'
    }),
    poolPoly: 'THacLGjyfYqb8G2NtfAe8jtxVrAimCDaum',
    poly2: 'TQAz7fpCMFXUpdWNQ7yAGTHK6wArruJZYm',
    sTRXProxyContract: 'TU3kjFuhtEo42tsCBtfYUAZxoqQ4yuSLQ5',
    marketProxyContract: 'TU2MJ5Veik1LRAgjeSzEdvmDYx7mefJZvd',
    energyRateModelContract: 'TXA2WjFc5f86deJcZZCdbdpkpUTKTA3VDM'
  },
  yielders: [
    {
      pool: 'TE2RzoSV3wFK99w6J9UnnZ4vLfXYoxvRwP',
      sunSupply: 8400,
      day: 14
    },
    {
      pool: 'TXJgMdjVX5dKiQaUi9QobwNxtSQaFqccvd',
      sunSupply: 8400,
      day: 14
    },
    {
      pool: 'TL5x9MtSnDy537FXKx53yAaHRRNdg9TkkA',
      sunSupply: 2800,
      day: 14
    },
    {
      pool: 'TGBr8uh9jBVHJhhkwSJvQN2ZAKzVkxDmno',
      sunSupply: 2800,
      day: 14
    },
    {
      pool: 'TRg6MnpsFXc82ymUPgf5qbj59ibxiEDWvv',
      sunSupply: 2800,
      day: 14
    },
    {
      pool: 'TLeEu311Cbw63BcmMHDgDLu7fnk9fqGcqT',
      sunSupply: 2800,
      day: 14
    },
    {
      pool: 'TWQhCXaWz4eHK4Kd1ErSDHjMFPoPc9czts',
      sunSupply: 2800,
      day: 14
    },
    {
      pool: 'TUY54PVeH6WCcYCd6ZXXoBDsHytN9V5PXt',
      sunSupply: 2800,
      day: 14
    },
    {
      pool: 'TR7BUFRQeq1w5jAZf1FKx85SHuX6PfMqsV',
      sunSupply: 2100,
      day: 14
    },
    {
      pool: 'TFpPyDCKvNFgos3g3WVsAqMrdqhB81JXHE',
      sunSupply: 2100,
      day: 14
    }
  ],
  // mining pools，need add jtokenAddress
  yieldersAddsun: [
    {
      pool: 'TE2RzoSV3wFK99w6J9UnnZ4vLfXYoxvRwP',
      sunSupply: 8400,
      day: 14
    },
    {
      pool: 'TXJgMdjVX5dKiQaUi9QobwNxtSQaFqccvd',
      sunSupply: 8400,
      day: 14
    },
    {
      pool: 'TL5x9MtSnDy537FXKx53yAaHRRNdg9TkkA',
      sunSupply: 2800,
      day: 14
    },
    {
      pool: 'TGBr8uh9jBVHJhhkwSJvQN2ZAKzVkxDmno',
      sunSupply: 2800,
      day: 14
    },
    {
      pool: 'TRg6MnpsFXc82ymUPgf5qbj59ibxiEDWvv',
      sunSupply: 2800,
      day: 14
    },
    {
      pool: 'TLeEu311Cbw63BcmMHDgDLu7fnk9fqGcqT',
      sunSupply: 2800,
      day: 14
    },
    {
      pool: 'TWQhCXaWz4eHK4Kd1ErSDHjMFPoPc9czts',
      sunSupply: 2800,
      day: 14
    },
    {
      pool: 'TUY54PVeH6WCcYCd6ZXXoBDsHytN9V5PXt',
      sunSupply: 2800,
      day: 14
    },
    {
      pool: 'TR7BUFRQeq1w5jAZf1FKx85SHuX6PfMqsV',
      sunSupply: 2100,
      day: 14
    },
    {
      pool: 'TFpPyDCKvNFgos3g3WVsAqMrdqhB81JXHE',
      sunSupply: 2100,
      day: 14
    },
    {
      pool: 'TPXDpkg9e3eZzxqxAUyke9S4z4pGJBJw9e',
      sunSupply: 2100,
      day: 14
    },
    {
      pool: 'TNSBA6KvSvMoTqQcEgpVK7VhHT3z7wifxy',
      sunSupply: 2100,
      day: 14
    },
    {
      pool: 'TSXv71Fy5XdL3Rh2QfBoUu3NAaM4sMif8R',
      sunSupply: 2100,
      day: 14
    },
    {
      pool: 'TUaUHU9Dy8x5yNi1pKnFYqHWojot61Jfto',
      sunSupply: 0,
      day: 14
    },
    {
      pool: 'TX7kybeP6UwTBRHLNPYmswFESHfyjm9bAS',
      sunSupply: 0,
      day: 14
    },
    {
      pool: 'TJQ9rbVe9ei3nNtyGgBL22Fuu2xYjZaLAQ', // jstrx
      sunSupply: 0,
      day: 14
    },
    {
      pool: 'TKFRELGGoRgiayhwJTNNLqCNjFoLBh3Mnf', // jusdd
      sunSupply: 0,
      day: 14
    },
    {
      pool: 'TVyvpmaVmz25z2GaXBDDjzLZi5iR5dBzGd', // jwbtc
      sunSupply: 0,
      day: 14
    }
  ],
  // USDD mining
  usddMint: [],
  usddMintForLastMining: ['TX7kybeP6UwTBRHLNPYmswFESHfyjm9bAS'],
  sunSwap: 'https://sunswap.com/',
  zeroAddr: 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb',
  defaultAddress: 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb',
  jtrxAddress: 'TE2RzoSV3wFK99w6J9UnnZ4vLfXYoxvRwP',
  blockPerYear: 10512000,
  defaultDecimal: 3,
  defaultDecimalForInput: 6,
  maxAPY: 9999.99,
  trxDecimal: 6,
  trxPrecision: 1e6,
  defaultPrecision: 1e6,
  tokenDefaultPrecision: 1e18,
  oraclePricePrecision: 1e27,
  maxQueryLength: 10,
  maxQueryTimes: 10,
  maxBalanceLength: 4,
  maxTotalCollateral: 11,
  voteMaxNum: 600000000,
  trxLeft: 40,
  safeMaxRate: 0.8,
  feeLimit: 200000000,
  feeLimitForReturnResourceDefault: 100000000,
  currency: [
    {
      symbol: 'WBTT',
      name: 'Wrapped BTT'
    },
    {
      symbol: 'JST',
      name: 'JUST'
    },
    {
      symbol: 'JSTNEW',
      name: 'JUST'
    },
    {
      symbol: 'TRX',
      name: 'TRON'
    },
    {
      symbol: 'SUNOLD',
      name: 'SUNOLD'
    },
    {
      symbol: 'WIN',
      name: 'WINK'
    },
    {
      symbol: 'BTCST',
      name: 'Bitcoin Standard Hashrate Token'
    },
    {
      symbol: 'NFT',
      name: 'APENFT'
    },
    {
      symbol: 'YFX',
      name: 'YFX'
    },
    {
      symbol: 'USDDNEW',
      name: 'Decentralized USD'
    },
    {
      symbol: 'WBTC',
      name: 'Wrapped BTC'
    }
  ],
  voteDetailFilePath: 'voteDetailFiles',
  hideHomeBanner: 'hideHomeBannerMintJST',
  hideMarketList: ['SUNOLD', 'BUSDOLD', 'USDCOLD'],
  hideMarketMap: {
    'SUNOLD': 0,
    'USDCOLD': 1,
    'BUSDOLD': 2,
    'ETH': 3
  },
  hideMarketMintIcon: [
    'BTC',
    'TRX',
    'sTRX',
    'SUNOLD',
    'WBTT',
    'ETHB',
    'ETH',
    'BUSD',
    'TUSD',
    'USDC',
    'USDT',
    'USDJ',
    'wstUSDT'
  ],
  fileLink: 'https://www.justlend.link/docs/',
  usddJtoken: 'TKFRELGGoRgiayhwJTNNLqCNjFoLBh3Mnf',
  usddoldJtoken: 'TX7kybeP6UwTBRHLNPYmswFESHfyjm9bAS',
  // usdtJtoken: 'TXJgMdjVX5dKiQaUi9QobwNxtSQaFqccvd',
  // tusdJtoken: 'TSXv71Fy5XdL3Rh2QfBoUu3NAaM4sMif8R',
  // usdcJtoken: 'TNSBA6KvSvMoTqQcEgpVK7VhHT3z7wifxy',
  trx: genContractNew({ symbol: 'trx' }),
  usdd: genContractNew({ symbol: 'usdd' }),
  usddold: genContractNew({ symbol: 'usddold' }),
  usdt: genContractNew({ symbol: 'usdt' }),
  sun: genContractNew({ symbol: 'sun' }),
  sunold: genContractNew({ symbol: 'sunold' }),
  btt: genContractNew({ symbol: 'btt' }),
  nft: genContractNew({ symbol: 'nft' }),
  jst: genContractNew({ symbol: 'jst' }),
  win: genContractNew({ symbol: 'win' }),
  u: genContractNew({ symbol: 'u' }),
  htx: genContractNew({ symbol: 'htx' }),
  usdj: genContractNew({ symbol: 'usdj' }),
  usdc: genContractNew({ symbol: 'usdc' }),
  usdcold: genContractNew({ symbol: 'usdcold' }),
  tusd: genContractNew({ symbol: 'tusd' }),
  usd1: genContractNew({ symbol: 'usd1' }),
  btc: genContractNew({ symbol: 'btc' }),
  eth: genContractNew({ symbol: 'eth' }),
  ethb: genContractNew({ symbol: 'ethb' }),
  ethold: genContractNew({ symbol: 'ethold' }),
  wbtt: genContractNew({ symbol: 'wbtt' }),
  busd: genContractNew({ symbol: 'busd' }),
  // strx: genContractNew({ symbol: 'strx' }),
  stusdt: genContract({ symbol: 'stusdt' }),
  wstusdt: genContract({ symbol: 'wstusdt' }),
  strx: genContract({ symbol: 'strx' }),
  jwstusdtJtoken: 'TD5SdLw5scR6mXgyMK2xKrFJpauDjpKqrW',
  portalLink: 'https://portal.justlend.org/',
  stusdtLink: 'https://stusdt.io/',
  tokens: getTokenFromAddress(),
  WalletConnectChainID: 'tron:0x2b6653dc',
  rewardNum: 3,
  usdtRewardNum: 100,
  multiMerkleDistributor: 'TUsyCPRyQdMsn9WnJcssBFXtzg6bUVbty6',
  merkleDistributor: 'TQoiXqruw4SqYPwHAd6QiNZ3ES4rLsejAj',
  merkleDistributorNEWUSDD: 'TYxJzmeDyxuxFbaGywjivfkft75qLeS485',
  merkleDistributorV2: 'TRiE1tGxBitNAMUazZ6Kk7GA36hpPdzUSL',
  marketContract: '',
  network: 'Mainnet',
  closeTokens: ['SUNOLD'],
  sTRX: {
    stakeLimitMin: 0.000001,
    stakeLimitMax: 10000000000,
    safeValueMin: 10,
    merkleDistributor: 'TKQ5VVJPsoZDD7NqQ8ffhFwzeRp45XLSGt'
  },
  StUSDTProxy: 'TThzxNRLrW2Brp9DcTQU8i4Wd9udCWEdZ3',
  UnstUSDTProxy: 'TURYwFtG6gvpEyPSm55FyjJWpgQQ2rDm5e',
  minterProxy: 'TVh1PF9xr4zC5uAqRcCbxF1By6ucp95G4i',
  ValuesAggregator: 'TPsypxvELDhdQRE1yGdfLJhowY2qnZEbkc',
  wstUSDTProxy: 'TGkxzkDKyMeq2T7edKnyjZoFypyzjkkssq',
  SwapRouter: 'TP4UqDEQqUaf9k8cvyAtp8vbZSXNuMD6hJ',
  tronsecretkey: 'tronsecretkey',
  unstakeDetailLinkCN: 'https://support.justlend.org/hc/zh-cn/articles/20134457290777',
  unstakeDetailLinkEN: 'https://support.justlend.org/hc/en-us/articles/20134457290777',
  introductionLinkCN: 'https://support.justlend.org/hc/zh-cn/articles/20134645757337',
  introductionLinkEN: 'https://support.justlend.org/hc/en-us/articles/20134645757337',
  rentEnergyLink: 'https://app.justlend.org/',
  howToStakeLinkCN: 'https://support.justlend.org/hc/zh-cn/articles/20134217458585',
  howToStakeLinkEN: 'https://support.justlend.org/hc/en-us/articles/20134217458585',
  howToUnstakeLinkCN: 'https://support.justlend.org/hc/zh-cn/articles/20134457290777',
  howToUnstakeLinkEN: 'https://support.justlend.org/hc/en-us/articles/20134457290777',
  helpCenterLinkCN: 'https://stusdt.zendesk.com/hc/zh-cn',
  helpCenterLinkEN: 'https://stusdt.zendesk.com/hc/en-us',
  announceLinkCN: 'https://stusdt.zendesk.com/hc/zh-cn/articles/20169925464601',
  announceLinkEN: 'https://stusdt.zendesk.com/hc/en-us/articles/20169925464601',
  tetherLink: 'https://tether.to/en/transparency',
  totalDebtTokenArrOnline: [
    'TRX',
    'USDD',
    'USDT',
    'wstUSDT',
    'sTRX',
    'SUN',
    'BTT',
    'NFT',
    'JST',
    'WIN',
    'HTX',
    // 'U',
    'TUSD',
    'WBTC',
    'BTC',
    'ETH',
    'ETHB',
    'USDDOLD',
    'USDJ',
    'WBTT',
    'SUNOLD',
    'USDCOLD',
    'BUSDOLD'
  ],
  totalDebtTokenArrAfterProposal: [
    'TRX',
    'USDD',
    'USDT',
    'wstUSDT',
    'sTRX',
    'SUN',
    'BTT',
    'NFT',
    'JST',
    'WIN',
    'HTX',
    // 'U',
    'USD1',
    'TUSD',
    'WBTC',
    'BTC',
    'ETH',
    'ETHB',
    'USDDOLD',
    'USDJ',
    'WBTT',
    'SUNOLD',
    'USDCOLD',
    'BUSDOLD'
  ],
  riskMarkets: ['SUNOLD', 'BUSD', 'USDCOLD', 'BUSDOLD'],
  holdingTokens: ['wstUSDT', 'sTRX'],
  // https://support.justlend.org/hc/en-us/articles/32539144305305 old
  announceForUSDDSTRX:
    'https://medium.com/@usddio/announcement-on-the-launch-of-the-strx-vault-on-usdd-protocol-unlock-enhanced-capital-efficiency-033b8bc7568a',
  announceForUSDDSTRXNew:
    'https://medium.com/@usddio/mint-usdd-with-strx-trx-vaults-to-enjoy-0-5-stability-fee-plus-5-000-usdd-rewards-f6bb006952f1?postPublishedType=repub',
  announceForUSDCOLD:
    'https://support.justlend.org/hc/en-us/articles/37303927145497-Announcement-on-Suspending-the-Supply-and-Borrow-of-USDC-Market',
  announceLink:
    'https://www.binance.com/en/support/announcement/binance-encourages-users-to-convert-busd-to-other-stablecoins-prior-to-february-2024-d392843e81fd4bc3a5f7e219aa01f34d',
  userGuideUrl: 'https://support.justlend.org/hc/en-us/articles/360052662052-How-to-link-a-wallet',
  readDocUrl: 'https://docs.justlend.org/links/community-resources/wallet-integration-cooperation',
  // contactUsUrl: 'mailto:support@justlend.org',
  contactUsUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSdjPg-nxz-Lq_zWq7bMBrozYB6YXYruNZ3T9ODGRyIJA5pb2g/viewform',
  // tronlinkWalletUrl:
  //   'https://chrome.google.com/webstore/detail/tronlink%EF%BC%88%E6%B3%A2%E5%AE%9D%E9%92%B1%E5%8C%85%EF%BC%89/ibnejdfjmmkpcnlpebklmnkoeoihofec',
  tronlinkWalletUrl: 'https://www.tronlink.org/',
  okxWalletUrl: 'https://www.okx.com/download',
  tokenPocketWalletUrl: 'https://www.tokenpocket.pro/en/download/app',
  approveLink: 'https://docs.justlend.org/getting_started/faqs/spending_cap_issue/',
  binanceWalletUrl: 'https://chromewebstore.google.com/detail/binance-wallet/cadiboklkpojfamcoggejbbdjcoiljjk',
  binanceWalletMobileUrl: 'https://www.binance.com/en/binancewallet',
  netAPYLink: 'https://support.justlend.org/hc/en-us/articles/43813165783961-Introduction-to-Net-APY-and-Net-Worth',
  rentCalculateLink:
    'https://support.justlend.org/hc/en-us/articles/31228571004569-What-are-the-rules-for-rent-calculation'
};

let devConfig = {};






const config = Object.assign(Config, devConfig);
export default config;
export { config as Config };
