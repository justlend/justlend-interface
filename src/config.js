import BigNumber from 'bignumber.js';
import packageJson from '../package.json';
const env = process.env.REACT_APP_ENV;
const startTime = 1607344200000; // 2020-12-07 20:30:00 1607344200000
const realStartTime = 1636135200000; // 2021-11-06 02:00:00
const endTime = 1643374800000; // 2022-01-28 21:00:00
const tokenInfo = require(`./token.js`).default;
let devTokenInfo = {};
if (env === 'test' || env === 'qaTest') {
  devTokenInfo = require(`./token.${env}.js`).default;
}

if (env === 'nile') {
  devTokenInfo = require(`./token.test.js`).default;
}
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
  rewardbBasePhaseForNewPeriod: 49,
  miningSymbol: 'USDD',
  usddV1MiningEndTime: 1737896400000, // 2025-01-26 21:00:00
  usddV2MiningStartTime: 1738411200000, // 2025-02-01 20:00:00
  comingSoonBannerVisible: false,
  tokenUncutZeroInDetailPage: ['USDDOLD', 'USDD', 'TUSD', 'USDT', 'BUSDOLD'],
  announcements: 'https://support.justlend.org/hc/en-us/sections/900001080386-%E5%85%AC%E5%91%8A',
  usddV2MiningAnnoucement:
    'https://support.justlend.org/hc/en-us/articles/42993620002201-Announcement-on-Launching-the-USDD-V2-0-Market-Supply-Mining-Activity-I',
  suspensionAnnoucement:
    'https://support.justlend.org/hc/en-us/articles/37275939067161-Announcement-on-the-Suspension-of-Supply-Mining-Activity',
  noServiceModalVisible: true,
  winterThemeVisible: false,
  nile: false,
  rentOnlyWhiteList: true,
  realStartTime: realStartTime,
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
    key: ''
  },
  service: {
    host: 'https://labc.ablesdxd.link', // 'https://lendapi.just.network'
    stableHost: 'https://abc.ablesdxd.link',
    stusdtHost: 'https://api.stusdt.org',
    messageApiHost: 'https://abm.ablesdxd.link',
    messageApiAccessToken: '',
    messageApiToken: '',
    lendApiToken: '',
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
    cdpRecord: '/justlend/record/cdp',
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
    allowanceMultiReward: '/strx/rent/getAllUnClaimedAirDrop',
    rentWhiteList: '/strx/rent/wl',
    strxDashboard: '/strx/dashboard',
    strxRentPath: '/strx/rent',
    strxStakeAccount: '/strx/stake/account',
    stUsdtDashboardPath: '/stusdt/dashboard',
    stUsdtAccountPath: '/stusdt/account',
    stUsdtRebaseHistoryPath: '/stusdt/rebase/history',
    liquidatePath: '/justlend/liquidate/highRiskAccountList',
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
  startTime: startTime, // 2020-12-07 20:30:00 1607344200000
  endTime: endTime, // 2021-07-09 21:00:00,
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
  // auditCn: 'https://www.justlend.link/docs/justlend_audit_cn.pdf',
  // auditTc: 'https://www.justlend.link/docs/justlend_audit_tc.pdf',
  bountyLink: 'https://immunefi.com/bounty/justlenddao/',
  twitter: 'http://twitter.com/DeFi_JUST',
  discord: 'https://discord.com/invite/2KdByBgBA3',
  telegram: 'https://t.me/officialjustlend',
  learnMoreEn: 'https://justlendorg.zendesk.com/hc/en-us/articles/360053116771',
  learnMoreCn: 'https://justlendorg.zendesk.com/hc/zh-cn/articles/360053116771',
  activeSwaps: ['jstlp1'],
  tokenPriceUrl: 'https://c.tronlink.org/v1/cryptocurrency/getprice?symbol=TRX,WBTT,WIN,NFT,JST&convert=USD',
  tronLinkStatUrl: 'https://list.tronlink.org/api/stat/action',
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
  // oraclePricePrecision: 1e18,
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
  ethStartTime: 1608640200000,
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
    }
  ],
  startTime1: 1616418000000,
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
  usdj: genContractNew({ symbol: 'usdj' }),
  usdc: genContractNew({ symbol: 'usdc' }),
  usdcold: genContractNew({ symbol: 'usdcold' }),
  tusd: genContractNew({ symbol: 'tusd' }),
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
  merkleDistributor: 'TQoiXqruw4SqYPwHAd6QiNZ3ES4rLsejAj',
  merkleDistributorNEWUSDD: 'TC5Sk9XFmZPHZoeoA7KVG8iD7bcLQnHNgo',
  marketContract: '',
  network: 'Mainnet',
  closeTokens: ['SUNOLD', 'BUSD', 'WBTT'], //Token Name
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
  tronsecretkey: '',
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
  totalDebtTokenArr: [
    'TRX',
    'USDD',
    'USDDOLD',
    'USDT',
    'wstUSDT',
    'sTRX',
    'SUN',
    'BTT',
    'NFT',
    'JST',
    'WIN',
    'USDJ',
    'USDCOLD',
    'TUSD',
    'BTC',
    'ETHB',
    'WBTT',
    'BUSDOLD',
    'SUNOLD',
    'ETH'
  ],
  settingsTokenArray1: '',
  settingsTokenArray2: '',
  riskMarkets: ['SUNOLD', 'BUSD', 'USDCOLD', 'BUSDOLD'],
  holdingTokens: ['wstUSDT', 'sTRX'],
  announceForUSDCOLD:
    'https://support.justlend.org/hc/en-us/articles/37303927145497-Announcement-on-Suspending-the-Supply-and-Borrow-of-USDC-Market',
  announceLink:
    'https://www.binance.com/en/support/announcement/binance-encourages-users-to-convert-busd-to-other-stablecoins-prior-to-february-2024-d392843e81fd4bc3a5f7e219aa01f34d'
};

let devConfig = {};
if (env === 'test') {
  devConfig = {
    rewardbBasePhaseForNewPeriod: 32,
    usddV1MiningEndTime: 1737864000000, // 2025-01-26 12:00:00
    usddV2MiningStartTime: 1737959400000, // 2025-01-27 14:30:00
    tokenUncutZeroInDetailPage: ['USDDOLD', 'USDD', 'TUSD', 'USDT', 'BUSDOLD', 'BUSDqa1', 'BUSDqa2'],
    chain: {
      privateKey: '01',
      fullHost: 'https://api.nileex.io'
    },
    contract: {
      unitroller: 'TJUCStq3WqfKqZLuZje5v7z6Ua6iBry1P6',
      poly: 'TFbotxCdaph4U4YheVg2tmCyNGheFEGw4N',
      JST: 'TJqk3ChKSjmpoNm3gaqSEatNsueD37NGDK',
      oldWJSTAddress: 'TFYQKuC9N3ibDWATpSDCSAyaBa1kBuUFbQ',
      oldGovernorAlphaAddress: 'TTQoEH7bdcZYyrCjD6Zg1WiDWXFBQAwPwP',
      // WJSTAddress: 'TDuQFvoB7cKaA7DGgj5QZFNYSyq2KFMtsr',
      // governorAlphaAddress: 'TGGGJ223Xcp6gYphkVFAB15Gy5fWfEcL2w',
      WJSTAddress: 'TCxA1eNhsAV3gvUwLjLtREW9f775V4h1h7',
      governorAlphaAddress: 'TYCNENqt2oJK7eiwubi6YXXt8RHR1BnzBs',
      jstlp1: genContractNew({
        pool: 'TMXkqc9RtGa3KB3Sx46bmrdTy9Xgi2cmTu',
        lp: 'JST',
        start: startTime,
        end: Date.now() + 30000,
        rate: '60',
        id: 'jstlp1',
        giftKey: ['jst'],
        subtitle: 'SUNSWAP-JST-TRX'
      }),
      poolPoly: 'TU6VnkAAkw5DzaYBp5NCKpKP4smob4LLJG',
      poly2: 'TGFMgRa7FeD1UBShKvmw86156Z3vCWdEcA',
      sTRXProxyContract: 'TZ8du1HkatTWDbS6FLZei4dQfjfpSm9mxp',
      marketProxyContract: 'TSos1xxjqMrGKBxycVmtgrnFvv9M6FDFUX',
      energyRateModelContract: 'TFHzFfBCS8hWV19v1psMZPg4TcWNc1W5LB'
    },
    yielders: [
      {
        pool: 'TKM7w4qFmkXQLEF2MgrQroBYpd5TY7i1pq',
        sunSupply: 8400,
        day: 14
      },
      {
        pool: 'TT6Qk1qrBM4MgyskYZx5pjeJjvv3fdL2ih',
        sunSupply: 8400,
        day: 14
      },
      {
        pool: 'TLBoPBNAfrBPxq3rTQzSKzTXrRjjAqaiJ6',
        sunSupply: 2800,
        day: 14
      },
      {
        pool: 'TYf16sZLR9uXpm63bXsRCNQMQFvqqvXQ2t',
        sunSupply: 2800,
        day: 14
      },
      {
        pool: 'TZ51C31Zh3qBSRBnTmbcuRX1rqyhzoCe8Q',
        sunSupply: 2800,
        day: 14
      },
      {
        pool: 'TBGCExAC3iRk5EXAVXEer3bwhTi9EN9rht',
        sunSupply: 2800,
        day: 14
      },
      {
        pool: 'TXNg6MoDTDEZKwPzTAdnzdQwfTF4LdU1QW',
        sunSupply: 2800,
        day: 14
      },
      {
        pool: 'TAj5XxJtkrEDvTT7mTsS3uqMcvSCp82cnR',
        sunSupply: 2800,
        day: 14
      },
      {
        pool: 'TYVr8QECrDkf6EAiKehok5FF3ckWV5Ds7k',
        sunSupply: 2800,
        day: 14
      }
    ],
    yieldersAddsun: [
      {
        pool: 'TKM7w4qFmkXQLEF2MgrQroBYpd5TY7i1pq', // jtrx
        sunSupply: 8400,
        day: 14
      },
      {
        pool: 'TT6Qk1qrBM4MgyskYZx5pjeJjvv3fdL2ih', //jusdt
        sunSupply: 8400,
        day: 14
      },
      {
        pool: 'TLBoPBNAfrBPxq3rTQzSKzTXrRjjAqaiJ6', //jusdj
        sunSupply: 2800,
        day: 14
      },
      {
        pool: 'TYf16sZLR9uXpm63bXsRCNQMQFvqqvXQ2t', // jsun
        sunSupply: 2800,
        day: 14
      },
      {
        pool: 'TZ51C31Zh3qBSRBnTmbcuRX1rqyhzoCe8Q', //jwin
        sunSupply: 2800,
        day: 14
      },
      {
        pool: 'TBGCExAC3iRk5EXAVXEer3bwhTi9EN9rht', // jbtc
        sunSupply: 2800,
        day: 14
      },
      {
        pool: 'TXNg6MoDTDEZKwPzTAdnzdQwfTF4LdU1QW', // jjst
        sunSupply: 2800,
        day: 14
      },
      {
        pool: 'TAj5XxJtkrEDvTT7mTsS3uqMcvSCp82cnR', // jwbtt
        sunSupply: 2800,
        day: 14
      },
      {
        pool: 'TYVr8QECrDkf6EAiKehok5FF3ckWV5Ds7k', // jeth
        sunSupply: 2800,
        day: 14
      },
      {
        pool: 'TQ7JUeFHWAxNru1Yp8YjPP3c7guZSe4e2E', // jSUNOLD
        sunSupply: 0,
        day: 14
      },
      {
        pool: 'TMsoCkr2yhukcGnvjhVk8Gj541BCQPEHwm', // jusdc
        sunSupply: 0,
        day: 14
      },
      {
        pool: 'TPovsintcLMh9udvXgt45jvb1RYQ86imnL', // jbtt
        sunSupply: 0,
        day: 14
      },
      {
        pool: 'TRM3faiTDB9D4Vq4mwezUeo5rQLzCDqGSE', // jusddold
        sunSupply: 0,
        day: 14
      },
      {
        pool: 'TBUYv5QnyVV4uV2RYjoouHhmsHMGqr8vj7', // jstrx
        sunSupply: 0,
        day: 14
      },
      {
        pool: 'TBqtwZhjP49heKsoTHeX5MhKBJMmyuP88b', // jusdd
        sunSupply: 0,
        day: 14
      }
    ],
    usddMint: [],
    usddMintForLastMining: ['TRM3faiTDB9D4Vq4mwezUeo5rQLzCDqGSE'],
    tronscanUrl: 'https://nile.tronscan.io/#',
    tronscanUrlCN: 'https://nile.tronscan.io/#',
    tronscanUrlEN: 'https://nile.tronscan.org/#',
    sunUrl: 'http://3.20.169.37:18108/',
    sunSwap: 'http://3.20.169.37:18100/',
    service: Object.assign(Config.service, {
      host: 'https://apitest.justlend.org',
      stableHost: 'https://apidev-v1.justlend.org',
      // host: 'http://3.131.2.8:10091/',
      // host: 'https://apidev.justlend.org',
      stusdtHost: 'https://testapi.stusdt.io',
      messageApiHost: 'https://qa-message.justlend.org',
      messageApiAccessToken: '',
      messageApiToken: '',
      lendApiToken: ''
    }),
    tronLinkStatUrl: 'https://niletest.tronlink.org/api/stat/action',
    oldVoteLastId: 2,
    startTime: 1607344200000,
    ethStartTime: 1608640200000,
    startTime1: Date.now() + 10000,
    defaultAddress: 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb',
    jtrxAddress: 'TKM7w4qFmkXQLEF2MgrQroBYpd5TY7i1pq',
    activeSwaps: ['jstlp1'],
    voteDetailFilePath: 'testVoteDetailFiles',
    feeLimit: 200000000,
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
    usddJtoken: 'TBqtwZhjP49heKsoTHeX5MhKBJMmyuP88b',
    usddoldJtoken: 'TRM3faiTDB9D4Vq4mwezUeo5rQLzCDqGSE',
    // usdtJtoken: 'TT6Qk1qrBM4MgyskYZx5pjeJjvv3fdL2ih',
    // tusdJtoken: 'TWsDk477G3tJA7gUTksLTcc3jDDEbpFuTS',
    // usdcJtoken: 'TMsoCkr2yhukcGnvjhVk8Gj541BCQPEHwm',
    trx: genContractNew({ symbol: 'trx' }),
    usdd: genContractNew({ symbol: 'usdd' }),
    usdt: genContractNew({ symbol: 'usdt' }),
    sun: genContractNew({ symbol: 'sun' }),
    sunold: genContractNew({ symbol: 'sunold' }),
    btt: genContractNew({ symbol: 'btt' }),
    nft: genContractNew({ symbol: 'nft' }),
    jst: genContractNew({ symbol: 'jst' }),
    win: genContractNew({ symbol: 'win' }),
    usdj: genContractNew({ symbol: 'usdj' }),
    usdc: genContractNew({ symbol: 'usdc' }),
    tusd: genContractNew({ symbol: 'tusd' }),
    btc: genContractNew({ symbol: 'btc' }),
    eth: genContractNew({ symbol: 'eth' }),
    ethold: genContractNew({ symbol: 'ethold' }),
    wbtt: genContractNew({ symbol: 'wbtt' }),
    busd: genContractNew({ symbol: 'busd' }),
    stusdt: genContract({ symbol: 'stusdt' }),
    wstusdt: genContract({ symbol: 'wstusdt' }),
    strx: genContract({ symbol: 'strx' }),
    jwstusdtJtoken: 'TLxZWG4C9AmTjw5KTF24pDwD8DBt6o7gpP',
    portalLink: 'http://3.20.169.37:18141/',
    stusdtLink: 'http://test.stusdt.io/',
    tokens: getTokenFromAddress(),
    WalletConnectChainID: 'tron:0xcd8690dc',
    merkleDistributor: 'TUQb328PQfbredVY3qUD9NZ6DipFxSRZ84',
    merkleDistributorNEWUSDD: 'TFyCdTuYSSZqC83zNY7VCot2zDzshDpDHP',
    marketContract: 'TT941BbkFsp2w8gPtiUPZ78u8vkQXMfgED',
    network: 'Nile', // shasta is 'Shasta',
    sTRX: {
      stakeLimitMin: 0.000001,
      stakeLimitMax: 10000000000,
      safeValueMin: 10,
      merkleDistributor: 'TZETgfTfiPdGm1HkoBktAnpWNjNx4c4did'
    },
    StUSDTProxy: 'TVUGRzuUBoUmFvuHFfgyrFS39PDtEDHfX9',
    UnstUSDTProxy: 'TVqzeEEX1qkNr4jxZCo8g3xbSdBForBR7n',
    minterProxy: 'TJNuCgiy68xssHojMSnjt86RbzFBmFqREr',
    ValuesAggregator: 'TLDWaSofLrChSjR9ErGyQdRFqHeRg8Ecw7',
    SwapRouter: 'TUrbVyQLdjXMBRcAECxb5hLTE1wmGv2vey',
    wstUSDTProxy: 'TQuaRvcTVquWNKWGiA4zVgcy1ChXNX7p54'
  };
}

if (env === 'nile') {
  devConfig = {
    nile: true,
    chain: {
      privateKey: '01',
      fullHost: 'https://api.nileex.io'
    },
    contract: {
      unitroller: 'TJUCStq3WqfKqZLuZje5v7z6Ua6iBry1P6',
      poly: 'TFbotxCdaph4U4YheVg2tmCyNGheFEGw4N',
      JST: 'TJqk3ChKSjmpoNm3gaqSEatNsueD37NGDK',
      oldWJSTAddress: 'TFYQKuC9N3ibDWATpSDCSAyaBa1kBuUFbQ',
      oldGovernorAlphaAddress: 'TTQoEH7bdcZYyrCjD6Zg1WiDWXFBQAwPwP',
      WJSTAddress: 'TCxA1eNhsAV3gvUwLjLtREW9f775V4h1h7',
      governorAlphaAddress: 'TYCNENqt2oJK7eiwubi6YXXt8RHR1BnzBs',
      jstlp1: genContractNew({
        pool: 'TMXkqc9RtGa3KB3Sx46bmrdTy9Xgi2cmTu',
        lp: 'JST',
        start: startTime,
        end: Date.now() + 30000,
        rate: '60',
        id: 'jstlp1',
        giftKey: ['jst'],
        subtitle: 'SUNSWAP-JST-TRX'
      }),
      //nile
      poolPoly: 'TU6VnkAAkw5DzaYBp5NCKpKP4smob4LLJG',
      poly2: 'TGFMgRa7FeD1UBShKvmw86156Z3vCWdEcA',
      sTRXProxyContract: 'TJaRfuzcxEKGN8sWrkqRUfg9hARNzNajLS',
      marketProxyContract: 'TPNcdjfGLjgxh7wVLv6NuLsAcUTzUuEE55',
      energyRateModelContract: 'TXm1R4t86DR8rL2r535dKVDwifp1eFXPb5'
    },
    yielders: [
      {
        pool: 'TKM7w4qFmkXQLEF2MgrQroBYpd5TY7i1pq',
        sunSupply: 8400,
        day: 14
      },
      {
        pool: 'TT6Qk1qrBM4MgyskYZx5pjeJjvv3fdL2ih',
        sunSupply: 8400,
        day: 14
      },
      {
        pool: 'TLBoPBNAfrBPxq3rTQzSKzTXrRjjAqaiJ6',
        sunSupply: 2800,
        day: 14
      },
      {
        pool: 'TYf16sZLR9uXpm63bXsRCNQMQFvqqvXQ2t',
        sunSupply: 2800,
        day: 14
      },
      {
        pool: 'TZ51C31Zh3qBSRBnTmbcuRX1rqyhzoCe8Q',
        sunSupply: 2800,
        day: 14
      },
      {
        pool: 'TBGCExAC3iRk5EXAVXEer3bwhTi9EN9rht',
        sunSupply: 2800,
        day: 14
      },
      {
        pool: 'TXNg6MoDTDEZKwPzTAdnzdQwfTF4LdU1QW',
        sunSupply: 2800,
        day: 14
      },
      {
        pool: 'TAj5XxJtkrEDvTT7mTsS3uqMcvSCp82cnR',
        sunSupply: 2800,
        day: 14
      },
      {
        pool: 'TYVr8QECrDkf6EAiKehok5FF3ckWV5Ds7k',
        sunSupply: 2800,
        day: 14
      }
    ],
    yieldersAddsun: [
      {
        pool: 'TKM7w4qFmkXQLEF2MgrQroBYpd5TY7i1pq', // jtrx
        sunSupply: 8400,
        day: 14
      },
      {
        pool: 'TT6Qk1qrBM4MgyskYZx5pjeJjvv3fdL2ih', //jusdt
        sunSupply: 8400,
        day: 14
      },
      {
        pool: 'TLBoPBNAfrBPxq3rTQzSKzTXrRjjAqaiJ6', //jusdj
        sunSupply: 2800,
        day: 14
      },
      {
        pool: 'TYf16sZLR9uXpm63bXsRCNQMQFvqqvXQ2t', // jsun
        sunSupply: 2800,
        day: 14
      },
      {
        pool: 'TZ51C31Zh3qBSRBnTmbcuRX1rqyhzoCe8Q', //jwin
        sunSupply: 2800,
        day: 14
      },
      {
        pool: 'TBGCExAC3iRk5EXAVXEer3bwhTi9EN9rht', // jbtc
        sunSupply: 2800,
        day: 14
      },
      {
        pool: 'TXNg6MoDTDEZKwPzTAdnzdQwfTF4LdU1QW', // jjst
        sunSupply: 2800,
        day: 14
      },
      {
        pool: 'TAj5XxJtkrEDvTT7mTsS3uqMcvSCp82cnR', // jwbtt
        sunSupply: 2800,
        day: 14
      },
      {
        pool: 'TYVr8QECrDkf6EAiKehok5FF3ckWV5Ds7k', // jeth
        sunSupply: 2800,
        day: 14
      },
      {
        pool: 'TQ7JUeFHWAxNru1Yp8YjPP3c7guZSe4e2E', // jSUNOLD
        sunSupply: 0,
        day: 14
      },
      {
        pool: 'TMsoCkr2yhukcGnvjhVk8Gj541BCQPEHwm', // jusdc
        sunSupply: 0,
        day: 14
      },
      {
        pool: 'TPovsintcLMh9udvXgt45jvb1RYQ86imnL', // jbtt
        sunSupply: 0,
        day: 14
      },
      {
        pool: 'TRM3faiTDB9D4Vq4mwezUeo5rQLzCDqGSE', // jusdd
        sunSupply: 0,
        day: 14
      },
      {
        pool: 'TBUYv5QnyVV4uV2RYjoouHhmsHMGqr8vj7', // jstrx
        sunSupply: 0,
        day: 14
      },
      {
        pool: 'TBqtwZhjP49heKsoTHeX5MhKBJMmyuP88b', // jusdd
        sunSupply: 0,
        day: 14
      }
    ],
    usddMint: [],
    usddMintForLastMining: ['TRM3faiTDB9D4Vq4mwezUeo5rQLzCDqGSE'],
    tronscanUrl: 'https://nile.tronscan.io/#',
    tronscanUrlCN: 'https://nile.tronscan.io/#',
    tronscanUrlEN: 'https://nile.tronscan.org/#',
    sunUrl: 'http://3.20.169.37:18108/',
    sunSwap: 'http://3.20.169.37:18100/',
    service: Object.assign(Config.service, {
      //nile
      host: 'https://nileapi.justlend.org',
      //host: 'http://123.56.166.152:10079'
      stusdtHost: 'https://testapi.stusdt.io'
    }),
    feedbackCn: 'https://forms.gle/u2W3CE4ay7Z3izLg6',
    feedbackEn: 'https://forms.gle/TBEst1yanGWkpzek9',
    oldVoteLastId: 2,
    startTime: 1607344200000,
    ethStartTime: 1608640200000,
    startTime1: Date.now() + 10000,
    defaultAddress: 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb',
    jtrxAddress: 'TKM7w4qFmkXQLEF2MgrQroBYpd5TY7i1pq',
    activeSwaps: ['jstlp1'],
    voteDetailFilePath: 'testVoteDetailFiles',
    feeLimit: 200000000,
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
    usddJtoken: 'TBqtwZhjP49heKsoTHeX5MhKBJMmyuP88b',
    usddoldJtoken: 'TRM3faiTDB9D4Vq4mwezUeo5rQLzCDqGSE',
    trx: genContractNew({ symbol: 'trx' }),
    usdd: genContractNew({ symbol: 'usdd' }),
    usdt: genContractNew({ symbol: 'usdt' }),
    sun: genContractNew({ symbol: 'sun' }),
    sunold: genContractNew({ symbol: 'sunold' }),
    btt: genContractNew({ symbol: 'btt' }),
    nft: genContractNew({ symbol: 'nft' }),
    jst: genContractNew({ symbol: 'jst' }),
    win: genContractNew({ symbol: 'win' }),
    usdj: genContractNew({ symbol: 'usdj' }),
    usdc: genContractNew({ symbol: 'usdc' }),
    tusd: genContractNew({ symbol: 'tusd' }),
    btc: genContractNew({ symbol: 'btc' }),
    eth: genContractNew({ symbol: 'eth' }),
    wbtt: genContractNew({ symbol: 'wbtt' }),
    portalLink: 'http://3.20.169.37:18141/',
    stusdtLink: 'http://3.20.169.37:18151/',
    tokens: getTokenFromAddress(),
    WalletConnectChainID: 'tron:0xcd8690dc',
    merkleDistributor: 'TUQb328PQfbredVY3qUD9NZ6DipFxSRZ84',
    merkleDistributorNEWUSDD: 'TFyCdTuYSSZqC83zNY7VCot2zDzshDpDHP',
    marketContract: 'TT941BbkFsp2w8gPtiUPZ78u8vkQXMfgED',
    network: 'Nile', // shasta is 'Shasta',
    sTRX: {
      stakeLimitMin: 0.000001,
      stakeLimitMax: 10000000000,
      safeValueMin: 10,
      merkleDistributor: 'TZETgfTfiPdGm1HkoBktAnpWNjNx4c4did'
    }
  };
}

if (env === 'backendPro') {
  devConfig = {
    service: Object.assign(Config.service, {
      host: 'https://grey-justlend.ablesdxd.link',
      stableHost: 'https://grey-defiv1.ablesdxd.link',
      stusdtHost: 'https://api.stusdt.org',
      messageApiHost: 'https://grey-message.ablesdxd.link',
      messageApiAccessToken: '',
      messageApiToken: '',
      lendApiToken: ''
    })
  };
}
const config = Object.assign(Config, devConfig);
export default config;
export { config as Config };
