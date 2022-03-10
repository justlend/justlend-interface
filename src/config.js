import BigNumber from 'bignumber.js';
const env = process.env.REACT_APP_ENV;
const startTime = 1607344200000; // 2020-12-07 20:30:00 1607344200000
const realStartTime = 1636135200000; // 2021-11-06 02:00:00
const endTime = 1643374800000; // 2022-01-28 21:00:00
const tokenInfo = require(`./token.js`).default;
let devTokenInfo = {};
if (env === 'test') {
  devTokenInfo = require(`./token.${env}.js`).default;
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

const Config = {
  realStartTime: realStartTime,
  version: 'v 1.2.8',
  chain: {
    privateKey: '01',
    fullHost: 'https://api.trongrid.io'
  },
  trongrid: {
    host: 'https://api.trongrid.io',
    key: ''
  },
  service: {
    host: 'https://labc.ablesdxd.link',
    apilistHost: 'https://apilist.tronscan.org',
    marketsPath: '/justlend/markets',
    userPath: '/justlend/account',
    dashboardPath: '/dashboard',
    jtokenDetailsPath: '/jtokenDetails',
    govPath: '/justlend/gov',
    proposalListPath: '/proposalList',
    voteStatusPath: '/voteStatus',
    basePath: '/defi/baseInfo',
    balancePath: '/api/wallet/balance',
    getTime: '/defi/baseInfo',
    yieldInfos: '/justlend/yieldInfos',
    tronBull: '/sunProject/tronbull',
    tronbullish: '/sunProject/tronbullish',
    defitvl: '/api/defiTvl'
  },
  startTime: startTime,
  endTime: endTime,
  sunUrl: 'https://sun.io/',
  whitePaperEn: 'https://www.justlend.link/docs/justlend_whitepaper_en.pdf',
  whitePaperCn: 'https://www.justlend.link/docs/justlend_whitepaper_cn.pdf',
  reportEn: '',
  reportCn: '',
  noticeEn: 'https://justlendorg.zendesk.com/hc/en-us/articles/4515455230745',
  noticeCn: 'https://justlendorg.zendesk.com/hc/zh-cn/articles/4515455230745',
  APIEn: 'https://www.justlend.link/docs/justlend_api_en.pdf',
  APICn: 'https://www.justlend.link/docs/justlend_api_cn.pdf',
  helpEn: 'https://justlendorg.zendesk.com/hc/en-us',
  helpCn: 'https://justlendorg.zendesk.com/hc/zh-cn',
  twitter: 'http://twitter.com/DeFi_JUST',
  telegram: 'https://t.me/officialjustlend',
  learnMoreEn: 'https://justlendorg.zendesk.com/hc/en-us/articles/360053116771',
  learnMoreCn: 'https://justlendorg.zendesk.com/hc/zh-cn/articles/360053116771',
  activeSwaps: ['jstlp1'],
  tokenPriceUrl: 'https://c.tronlink.org/v1/cryptocurrency/getprice?symbol=TRX,WBTT,WIN,NFT,JST&convert=USD',
  contract: {
    unitroller: 'TGjYzgCyPobsNS9n6WcbdLVR9dH7mWqFx7',
    poly: 'TXTXGyhNLhELNZPDXsn5fCnGYLZoLwJvRC',
    JST: 'TCFLL5dx5ZJdKnWuesXxi1VPwjLVmWZZy9',
    WJSTAddress: 'TCczUFrX1u4v1mzjBVXsiVyehj1vCaNxDt',
    governorAlphaAddress: 'TH1SVVVU9NF1ans3CRBCJ5kW2yvn4sHP9b',
    jstlp1: genContractNew({
      pool: 'TUp1BWfAZidkNbWkoiCjJcf4ctE4PAR2Rg',
      lp: 'JST',
      start: startTime,
      end: endTime,
      rate: '60',
      id: 'jstlp1',
      giftKey: ['jst']
    }),
    poolPoly: 'THacLGjyfYqb8G2NtfAe8jtxVrAimCDaum',
    poly2: 'TQAz7fpCMFXUpdWNQ7yAGTHK6wArruJZYm'
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
    }
  ],
  sunSwap: 'https://sunswap.com/',
  zeroAddr: 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb',
  defaultAddress: 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb',
  blockPerYear: 10512000,
  defaultDecimal: 3,
  defaultDecimalForInput: 6,
  maxAPY: 9999.99,
  trxDecimal: 6,
  trxPrecision: 1e6,
  defaultPrecision: 1e6,
  tokenDefaultPrecision: 1e18,
  maxQueryLength: 10,
  maxQueryTimes: 10,
  maxBalanceLength: 4,
  voteMaxNum: 600000000,
  trxLeft: 40,
  safeMaxRate: 0.8,
  feeLimit: 200000000,
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
    }
  ],
  centuryRealStart: 1615208400000,
  startTime1: 1616418000000,
  voteDetailFilePath: 'voteDetailFiles',
  hideHomeBanner: 'hideHomeBannerMintJST',
  hideMarketMintIcon: ['SUNOLD'],
  fileLink: 'https://www.justlend.link/docs/'
};

let devConfig = {};
if (env === 'test') {
  devConfig = {
    chain: {
      privateKey: '01',
      fullHost: 'https://api.nileex.io'
    },
    contract: {
      unitroller: 'TPdWn5nRLxx8n2WKbBZ3FkBejVdiTUGDVM',
      poly: 'TBj45kXsnXAr3DeC4Np3J6WDxDtVh9qESs',
      JST: 'TF17BgPaZYbz8oxbjhriubPDsA7ArKoLX3',
      WJSTAddress: 'THBZJT3heBUTqYdaDdPbhgasAoitDeojLG',
      governorAlphaAddress: 'TABdyfNoFcP1vkNoczy9qK8G8RiBf711K8',
      jstlp1: genContractNew({
        pool: 'TLaFULHHf9i8Ttmy2fxJY8E1FMN9z7UYE3',
        lp: 'JST',
        start: startTime,
        end: Date.now() + 30000,
        rate: '60',
        id: 'jstlp1',
        giftKey: ['jst']
      }),
      poolPoly: 'TU6VnkAAkw5DzaYBp5NCKpKP4smob4LLJG',
      poly2: 'TGFMgRa7FeD1UBShKvmw86156Z3vCWdEcA'
    },
    yielders: [
      {
        pool: 'TDchKqQ8T2BhGfL7m2DfWfxp5eqa1we5hu',
        sunSupply: 8400,
        day: 14
      },
      {
        pool: 'TTUtHMoRLR97C3kd6gyGPWb1ReCWDcRAyA',
        sunSupply: 8400,
        day: 14
      },
      {
        pool: 'TTYKZf1Vv3sKED5LSKGh9Yi2XwJxam9nqj',
        sunSupply: 2800,
        day: 14
      },
      {
        pool: 'TSdWpyV2Z8YdJmsLcwX3udZTTafohxZcVJ',
        sunSupply: 2800,
        day: 14
      },
      {
        pool: 'TJRXoWa5CiG7ZRf36ncEXDLUoMbEuH3ZJs',
        sunSupply: 2800,
        day: 14
      },
      {
        pool: 'TXjnpsP7FWCGZWzrFbXsQcpgyKd26v45dK',
        sunSupply: 2800,
        day: 14
      },
      {
        pool: 'TCby9165NKLydYDJEQ1RTUdJ3VoFXq8VVs',
        sunSupply: 2800,
        day: 14
      },
      {
        pool: 'TDYhBGVRwRCyvnfsnLrwtj1xWEsoPKVWKz',
        sunSupply: 2800,
        day: 14
      },
      {
        pool: 'TJg1msVTDbv5wma5t5wDJKqDHAH4BzC85i',
        sunSupply: 2800,
        day: 14
      }
    ],
    yieldersAddsun: [
      {
        pool: 'TDchKqQ8T2BhGfL7m2DfWfxp5eqa1we5hu',
        sunSupply: 8400,
        day: 14
      },
      {
        pool: 'TTUtHMoRLR97C3kd6gyGPWb1ReCWDcRAyA',
        sunSupply: 8400,
        day: 14
      },
      {
        pool: 'TTYKZf1Vv3sKED5LSKGh9Yi2XwJxam9nqj',
        sunSupply: 2800,
        day: 14
      },
      {
        pool: 'TSdWpyV2Z8YdJmsLcwX3udZTTafohxZcVJ',
        sunSupply: 2800,
        day: 14
      },
      {
        pool: 'TJRXoWa5CiG7ZRf36ncEXDLUoMbEuH3ZJs',
        sunSupply: 2800,
        day: 14
      },
      {
        pool: 'TXjnpsP7FWCGZWzrFbXsQcpgyKd26v45dK',
        sunSupply: 2800,
        day: 14
      },
      {
        pool: 'TCby9165NKLydYDJEQ1RTUdJ3VoFXq8VVs',
        sunSupply: 2800,
        day: 14
      },
      {
        pool: 'TDYhBGVRwRCyvnfsnLrwtj1xWEsoPKVWKz',
        sunSupply: 2800,
        day: 14
      },
      {
        pool: 'TJg1msVTDbv5wma5t5wDJKqDHAH4BzC85i',
        sunSupply: 2800,
        day: 14
      },
      {
        pool: 'TCmJeP41ySJmyehWCyJoeWJuLdZM4bW9KA',
        sunSupply: 0,
        day: 14
      },
      {
        pool: 'TVjbQ8CbNtibNsmkxdabF2W7sYAAoWR3vk',
        sunSupply: 0,
        day: 14
      }
    ],
    tronscanUrl: 'https://nile.tronscan.io/#',
    sunUrl: 'http://3.20.169.37:18108/',
    sunSwap: 'http://3.20.169.37:18100/',
    service: Object.assign(Config.service, {
      host: 'http://123.56.166.152:10088'
    }),
    startTime: 1607344200000,
    ethStartTime: 1608640200000,
    centuryRealStart: Date.now() - 60 * 1000,
    startTime1: Date.now() + 10000,
    defaultAddress: 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb',
    activeSwaps: ['jstlp1'],
    voteDetailFilePath: 'testVoteDetailFiles',
    feeLimit: 200000000
  };
}
export default Object.assign(Config, devConfig);
