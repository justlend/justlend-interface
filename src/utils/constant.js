import { BigNumber } from './helper';
import Config from '../config';
const { contract, activeSwaps, lendContract, activeLends, voteList, activeVoteList } = Config;

export const getIcons = tokenName => {
  tokenName = tokenName?.toLowerCase();
  let icons = '';
  try {
    icons = require(`../assets/images/v2/icons/${tokenName}.png`);
  } catch (error) {
    try {
      icons = require(`../assets/images/v2/icons/${tokenName}.svg`);
    } catch (error) {
      try {
        icons = require(`../assets/images/v2/icons/${tokenName}.jpeg`);
      } catch (error) {
        icons = require(`../assets/images/v2/icons/trx.png`);
      }
      icons = require(`../assets/images/v2/icons/trx.png`);
    }
  }

  return icons;
};

export const ICONS_MAP = {
  trx: getIcons('trx'),
  sunold: getIcons('sunold'),
  jst: getIcons('jst'),
  wbtt: getIcons('wbtt'),
  win: getIcons('win'),
  usdt: getIcons('usdt'),
  usdj: getIcons('usdj'),
  btc: getIcons('btc'),
  eth: getIcons('eth'),
  btt: getIcons('btt'),
  btcst: getIcons('btcst'),
  tusd: getIcons('tusd'),
  nft: getIcons('nft'),
  yfx: getIcons('yfx'),
  usdd: getIcons('usdd')
};

export const getLendIcons = symbol => {
  let icons = '';
  try {
    icons = require(`../assets/images/liquidate/icons/${symbol}.png`);
  } catch (error) {
    try {
      icons = require(`../assets/images/liquidate/icons/${symbol}.svg`);
    } catch (error) {
      icons = require(`../assets/images/default.png`);
    }
  }
  return icons;
};

export const calcMineInfo = poolInfo => {
  let { sunoldSupply, end, start } = poolInfo;
  if (poolInfo && poolInfo.next && Date.now() > poolInfo.next.start) {
    sunoldSupply = poolInfo.next.sunoldSupply;
    end = poolInfo.next.end;
    start = poolInfo.next.start;
  }
  const speed = BigNumber(sunoldSupply).div(BigNumber(end).minus(start));
  let mined = BigNumber(new Date().getTime()).minus(start).times(speed);

  if (mined.gt(sunoldSupply)) {
    mined = BigNumber(sunoldSupply);
  }
  if (mined.lt(0)) {
    mined = BigNumber(0);
  }
  const toBeMined = BigNumber(sunoldSupply).minus(mined);

  return {
    mined,
    toBeMined
  };
};

export const initPoolData = () => {
  const poolData = {};
  const activeSwapsAll = activeSwaps;
  try {
    activeSwapsAll.map(id => {
      const { lp, symbol, gift } = contract[id];
      const { mined, toBeMined } = calcMineInfo(contract[id]);
      poolData[id] = {
        ...contract[id],
        total: '--',
        distributed: '--',
        tokenBalance: '--',
        tokenAllowance: '--',
        trxClaimed: '--',
        tokenClaimed: '--',
        trxApy: '--',
        tokenApy: '--',
        staked: '--',
        trxAmount: '--',
        tokenAmount: '--',
        totalUSD: '--',
        mined,
        toBeMined
      };
      if (lp) {
        poolData[id].lpIcon = getIcons(lp);
        poolData[id].icon = getIcons('trx');
      } else {
        poolData[id].icon = getIcons(symbol.toLowerCase());
      }
    });
    return poolData;
  } catch (error) {
    console.log(`initPoolData error: ${error}`);
    return {};
  }
};

export const VOTE_STATUS = {
  ws: 1, // will start
  s: 2, // running
  e: 3 // ended
};

export const initVoteData = () => {
  const voteData = {};
  try {
    activeVoteList.map(id => {
      voteData[id] = {
        voteBalance: '--',
        tokenAllowance: '--',
        tokenBalance: '--',
        totalVoted: BigNumber(0),
        voted: BigNumber(0),
        claimed: BigNumber(0),
        voteFor: '--',
        dataList: [],
        dataRankList: [],
        dataResultList: [],
        voteStatus: getStatus(voteList[id]),
        totalRank: 0,
        totalResult: 0
      };
    });
    return voteData;
  } catch (error) {
    console.log(`initVoteData error: ${error}`);
    return {};
  }
};
export const getStatus = v => {
  const { start, end } = v;
  const nowTime = Date.now();
  if (start >= nowTime) {
    return VOTE_STATUS.ws;
  }
  if (nowTime > start && nowTime < end) {
    return VOTE_STATUS.s;
  }
  if (end <= nowTime) {
    return VOTE_STATUS.e;
  }
};

export const initVoteList = () => {
  try {
    activeVoteList.map(key => {
      voteList[key].status = getStatus(voteList[key]);
    });
    return voteList;
  } catch (err) {
    console.log(`initVoteList error: ${err}`);
    return {};
  }
};

export const initLendData = () => {
  const lendData = {};
  try {
    activeLends.map(id => {
      const { symbol } = lendContract[id];
      const { mined, toBeMined } = calcMineInfo(lendContract[id]);
      lendData[id] = {
        ...lendContract[id],
        total: '--', // tvl
        totalUSD: '--', // usd tvl
        tokenBalance: '--', // user balance
        tokenAllowance: '--', // token approve
        hasJToken: false, // has JToken
        staked: BigNumber(0), // waiting for withdraw
        lendApy: '--', // borrow apy
        mintApy: '--', // mining apy
        earned: BigNumber(0), // earned
        gotSunOld: '--', // gained
        toBeGotSunOld: '--', // to be gained
        mined,
        toBeMined,
        icon: getLendIcons(symbol.toLowerCase())
      };
    });
    return lendData;
  } catch (error) {
    console.log(`initLendData error: ${error}`);
    return {};
  }
};
