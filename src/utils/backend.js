import axios from 'axios';
import Config from '../config';
import { BigNumber, randomSleep } from './helper';
const { service, yielders } = Config;
const {
  host,
  stusdtHost,
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
  multiReward,
  allowanceMultiReward,
  rentWhiteList,
  strxDashboard,
  strxStakeAccount,
  stUsdtDashboardPath,
  stUsdtAccountPath,
  stUsdtRebaseHistoryPath,
  strxRentPath,
  liquidatePath
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

/**
 * @returns {{ farmRewardUSD24h: number } & Record<string, any>}
 */
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
    return await getTokenPrice();
  }
};

export const getAnnoucements = async ({ perPageCount = 3, lang } = { perPageCount: 3 }) => {
  lang = lang || window.localStorage.getItem('lang') || 'en-us';
  lang = lang.toLowerCase();
  const urlCn = `https://justlendorg.zendesk.com/api/v2/help_center/zh-cn/categories/900001436023/articles.json?sort_by=created_at&sort_order=desc&per_page=${perPageCount}`;
  const urlEn = `https://justlendorg.zendesk.com/api/v2/help_center/en-us/categories/900001436023/articles.json?sort_by=created_at&sort_order=desc&per_page=${perPageCount}`;

  const { data } = await axios.get(lang === 'en-us' ? urlEn : urlCn);

  if (data?.articles && data?.articles.length > 0) {
    return data.articles.slice(0, perPageCount);
  }
  return [];
};

export const getMultiReward = async addr => {
  try {
    const url = `${host}${multiReward}`;
    let data = await axios.get(url, { params: { addr } });

    return {
      success: !!data.data.data,
      data: data.data.data
    };
  } catch (error) {
    console.log(`getMultiReward error: ${error}`);
    return { success: false };
  }
};

export const getAllowanceMultiReward = async addr => {
  try {
    const url = `${host}${allowanceMultiReward}`;
    let data = await axios.get(url, { params: { addr } });

    return {
      success: !!data.data.data,
      data: data.data.data
    };
  } catch (error) {
    console.log(`getAllowanceMultiReward error: ${error}`);
    return { success: false };
  }
};

export const getRentWhiteList = async addr => {
  try {
    const url = `${host}${rentWhiteList}`;
    let data = await axios.get(url, { params: { addr } });
    if (Number(data.data.code) !== 0) {
      return {
        success: false
      };
    }
    return {
      success: true,
      data: data.data.data
    };
  } catch (error) {
    console.log(`getRentWhiteList error: ${error}`);
    return { success: false };
  }
};

export const getSTrxDashboard = async () => {
  try {
    const url = `${host}${strxDashboard}`;
    let data = await axios.get(url);
    return {
      success: data?.data?.code === 0,
      data: data?.data?.data
    };
  } catch (error) {
    console.error(`getSTrxDashboard error: ${error}`);
    return { success: false };
  }
};

export const getSTrxStakeAccount = async addr => {
  try {
    const url = `${host}${strxStakeAccount}`;
    const data = await axios.get(url, { params: { addr } });
    return {
      success: data?.data?.code === 0,
      data: data?.data?.data
    };
  } catch (error) {
    console.error(`getSTrxStakeAccount error: ${error}`);
    return { success: false };
  }
};

export const postFinanceStat = async (data, options) => {
  try {
    const url = `${Config.tronLinkStatUrl}`;
    await axios.post(url, data, options);
  } catch (error) {
    console.error(`postFinanceStat error: ${error}`);
    return { success: false };
  }
};

export const getStUsdtDashboard = async () => {
  try {
    let url = `${stusdtHost}${stUsdtDashboardPath}`;
    let { data } = await axios.get(url);
    return {
      success: true,
      data: data.data
    };
  } catch (error) {
    console.log(error);
    await randomSleep();
    return await getStUsdtDashboard();
  }
};

export const getStUsdtUserAccount = async address => {
  try {
    const url = `${stusdtHost}${stUsdtAccountPath}`;
    const data = await axios.get(url, { params: { address } });
    return {
      success: data?.data?.code === 0,
      data: data?.data?.data
    };
  } catch (error) {
    console.error(`getStUsdtUserAccount error: ${error}`);
    return { success: false };
  }
};

// export const getStUSDTRebaseHistory = async () => {
//   try {
//     let url = `${stusdtHost}${rebaseHistoryPath}`;
//     let { data } = await axios.get(url);
//     return {
//       success: data?.code === 0,
//       data: data?.data
//     };
//   } catch (error) {
//     console.error(`getRebaseHistory error: ${error}`);
//     return { success: false };
//   }
// };

export const getStUsdtRebaseCharts = async () => {
  try {
    let url = `${stusdtHost}${stUsdtRebaseHistoryPath}`;
    let { data } = await axios.get(url, { params: { lineChat: true } });
    return {
      success: data?.code === 0,
      data: data?.data
    };
  } catch (error) {
    console.error(`getStUsdtRebaseCharts error: ${error}`);
    return { success: false };
  }
};

export const getRiojCheck = async () => {
  try {
    let url = 'https://rioj.ablesdxd.link/?time=' + Date.now();
    const data = await axios.get(url);
    if (data.status >= 200 && data.status < 400) {
      return {
        success: true
      };
    } else {
      return {
        success: false
      };
    }
  } catch (error) {
    console.error(`getRiojCheck error: ${error}`);
    return { success: false };
  }
};

export const getLiquidateInfo = async () => {
  try {
    let url = `${host}${liquidatePath}`;
    let isAll = window.location.search.indexOf('liquidate=all') > 0;
    let { data } = await axios.get(url, { params: { all: !!isAll } });
    return {
      success: data?.code === 0,
      data: data?.data
    };
  } catch (error) {
    console.error(`getLiquidateInfo error: ${error}`);
    return { success: false };
  }
};

export const getStrxRentAllOrderList = async ({
  renter,
  receiver,
  rentType = 1,
  orderBy = 0,
  page = 0,
  pageSize = 10
}) => {
  try {
    const url = `${host}${strxRentPath}/allOrderList`;
    let { data } = await axios.get(url, { params: { renter, receiver, rentType, orderBy, page, pageSize } });

    if (data?.data?.orders) {
      data.data.orders = data?.data?.orders.map((order, i) => ({ ...order, key: new Date() + i }));
    }
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

export const getReturnRentInfo = async (renter, receiver, rentType = 1) => {
  try {
    const url = `${host}${strxRentPath}/quit`;
    let { data } = await axios.get(url, { params: { renter, receiver, rentType } });

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

export const getBetaInfo = async address => {
  try {
    const url = `${host}/justlend/wl/g`;
    let { data } = await axios.get(url, { params: { addr: address } });
    return {
      success: data?.code === 0,
      data: data?.data
    };
  } catch (error) {
    return {
      success: false
    };
  }
};

export const updateBetaInfo = async data => {
  try {
    const url = `${host}/justlend/wl/s`;
    await axios.post(url, data);
  } catch (error) {
    console.log(error);
  }
};

export const getApplicationInfo = async () => {
  try {
    const url = `${host}/justlend/config`;
    let { data } = await axios.get(url);
    return {
      success: data?.code === 0,
      data: data?.data
    };
  } catch (error) {
    console.log(error);
  }
};
