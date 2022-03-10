import axios from 'axios';
import Config from '../config';
import { BigNumber, randomSleep } from './helper';
const { service, yielders } = Config;
const {
  host,
  apilistHost,
  marketsPath,
  userPath,
  dashboardPath,
  jtokenDetailsPath,
  govPath,
  proposalListPath,
  voteStatusPath,
  basePath,
  balancePath,
  getTime,
  yieldInfos,
  tronBull,
  tronbullish,
  defitvl
} = service;
export const getTrxPrice = async () => {
  try {
    let url = `${Config.trxPriceUrl}`;
    let { data } = await axios.get(url);
    const { TRX } = data.data;
    const price = TRX.quote.USD.price;

    return {
      success: true,
      price: BigNumber(price)
    };
  } catch (error) {
    await randomSleep();
    return await getTrxPrice();
  }
};

export const getMarketData = async () => {
  try {
    let url = `${host}${marketsPath}`;
    let { data } = await axios.get(url);

    return {
      success: true,
      data: data.data
    };
  } catch (error) {
    return {
      success: false
    };
  }
};

export const getMarketDashboardData = async () => {
  try {
    let url = `${host}${marketsPath}${dashboardPath}`;
    let { data } = await axios.get(url);
    return {
      success: true,
      data: data.data
    };
  } catch (error) {
    console.log(error);
    await randomSleep();
    return await getMarketDashboardData();
  }
};

export const getJTokenDetails = async jtokenAddr => {
  try {
    let url = `${host}${marketsPath}${jtokenDetailsPath}`;
    let { data } = await axios.get(url, { params: { jtokenAddr } });
    return {
      success: true,
      data: data.data
    };
  } catch (error) {
    console.log(error);
    await randomSleep();
    return await getJTokenDetails();
  }
};

export const getTotalVoted = async contractAddr => {
  try {
    let url = `${backend.host}${backend.vote}`;
    let { data } = await axios.get(url, { params: { contractAddr } });
    return {
      success: !!data.data.collateralSymbol,
      data: data.data
    };
  } catch (error) {
    return {
      success: false
    };
  }
};

export const getVoteList = async block => {
  try {
    let url = `${host}${govPath}${proposalListPath}`;
    let { data } = await axios.get(url, { params: { block } });
    let proposalList = [];
    if (data.code === 0 || data.message === 'SUCCESS') {
      proposalList = data.data.proposalList;
      return {
        success: true,
        proposalList
      };
    } else {
      await randomSleep();
      let block = await this.rootStore.lend.getCurrentBlock();
      return await getVoteList(block);
    }
  } catch (error) {
    await randomSleep();
    let block = await this.rootStore.lend.getCurrentBlock();
    return await getVoteList(block);
  }
};

export const getUserDetail = async (account, block) => {
  try {
    let url = `${host}${govPath}${voteStatusPath}`;
    let { data } = await axios.get(url, { params: { account, block } });
    return {
      success: true,
      data: data.data
    };
  } catch (error) {
    await randomSleep();
    return await getUserDetail(account);
  }
};

export const getUserData = async params => {
  try {
    const confs = [];
    yielders.map(t => {
      confs.push(`${t.pool}$${t.sunSupply}$${t.day}`);
    });
    const config = confs.join(',');
    let url = `${host}${userPath}`;
    let { data } = await axios.get(url, { params: Object.assign(params, { config }) });
    return {
      success: true,
      data: data.data
    };
  } catch (error) {
    console.log(error, 'err');
    return {
      success: false
    };
  }
};

export const getBaseInfo = async (params = {}) => {
  try {
    let url = `${host}${basePath}`;
    let { data } = await axios.get(url, { params });
    if (Number(data.code) !== 0) {
      return {
        success: false
      };
    }
    return {
      success: true,
      number: data.data.blockNum,
      timestamp: data.data.blockTimeStamp
    };
  } catch (error) {
    console.log('getBaseInfo: ', error);
    return {
      success: false
    };
  }
};

export const getTimeNow = async (params = {}) => {
  try {
    let url = `${host}${getTime}`;
    let { data } = await axios.get(url, { params });
    if (Number(data.code) !== 0) {
      return {
        success: false
      };
    }
    return {
      success: true,
      time: Number(data.data.serverTimeStamp)
    };
  } catch (error) {
    console.log('getBaseInfo: ', error);
    return {
      success: false
    };
  }
};

export const getMintInfo = async addr => {
  try {
    const confs = [];
    yielders.map(t => {
      if (window.multyStart) {
        t.sunSupply = 0;
      }
      confs.push(`${t.pool}$${t.sunSupply}$${t.day}`);
    });
    const config = confs.join(',');
    const url = `${host}${yieldInfos}`;
    const { data } = await axios.get(url, { params: { addr, config } });
    return data.data ? { success: true, data: data.data } : { success: false };
  } catch (error) {
    console.log(`getMintInfo error: ${error}`);
    return { success: false };
  }
};

export const getTronBull = async (pool, tvl) => {
  try {
    const url = `${host}${tronBull}`;
    const { data } = await axios.get(url, { params: { pool, tvl } });
    return {
      success: !!data.data,
      data: data.data
    };
  } catch (error) {
    console.log(`getTronBull error: ${error}`);
    return { success: false };
  }
};

export const getTronbullish = async (pool, addr) => {
  try {
    const url = `${host}${tronbullish}`;
    let { data } = await axios.get(url, { params: { pool, addr } });
    return {
      success: !!data.data,
      data: data.data
    };
  } catch (error) {
    console.log(`getTronbullish error: ${error}`);
    return { success: false };
  }
};

export const getDefiTVL = async () => {
  try {
    const url = `${apilistHost}${defitvl}`;
    let { data } = await axios.get(url, { params: {} });

    return {
      success: !!data,
      data: data
    };
  } catch (error) {
    console.log(`getDefiTVL error: ${error}`);
    return { success: false };
  }
};

export const getTokenPrice = async () => {
  try {
    const url = `${Config.tokenPriceUrl}`;
    const { data } = await axios.get(url);
    const { WBTT, TRX, WIN, NFT, JST } = data.data;
    const priceBTT = BigNumber(WBTT.quote.USD.price);
    const priceTRX = BigNumber(TRX.quote.USD.price);
    const priceWIN = BigNumber(WIN.quote.USD.price);
    const priceNFT = BigNumber(NFT.quote.USD.price);
    const priceJST = BigNumber(JST.quote.USD.price);

    return {
      success: true,
      priceBTT,
      priceTRX,
      priceWIN,
      priceNFT,
      priceJST
    };
  } catch (error) {
    await randomSleep();
    return await getTrxPrice();
  }
};
