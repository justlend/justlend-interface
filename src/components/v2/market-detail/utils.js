import {
  amountFormat as _amountFormat,
  BigNumber,
  formatNumber,
  formatNumber as _formatNumber,
  getTotalApy,
  marketLendAvailable,
  renderPercent
} from '../../../utils/helper';
import RootStore from '../../../stores/index';
import { Config } from '../../../config';
import * as Intl from 'react-intl-universal';
import dayjs from 'dayjs';
import { format } from 'prettier';
export function tryFormatNumber(...args) {
  try {
    return _formatNumber(...args);
  } catch (e) {
    console.error('Format number error: ', e);
    return '--';
  }
}
export function tryAmountFormat(...args) {
  try {
    return _amountFormat(...args);
  } catch (e) {
    console.error('Format amount error: ', e);
  }
}
export function processJTokenData({ jTokenData, showMintApy }) {
  const emptyData = {
    ...(jTokenData || {}),
    isReady: false,
    depositAPYDisplay: '--',
    depositTotalAPYDisplay: '--',
    depositBaseAPYDisplay: '--',
    underlyingIncrementApyDisplay: '--',
    depositMiningAPYDisplay: '--',
    borrowAPyDisplay: '--',
    depositSizeDisplay: '--',
    depositCountDisplay: '--',
    borrowSizeDisplay: '--',
    borrowCountDisplay: '--',
    borrowLimitDisplay: '--',
    collateralDisplay: '--',
    totalReservesDisplay: '--',
    reserveFactorDisplay: '--',
    dailyinterestDisplay: '--',
    supplyDisplay: '--',
    exchangeRateDisplay: '--',
    liquidityDisplay: '--',
    farmRewardUSD24hDisplay: '--',

    // 利率模型图标中使用的数据
    borrowList: [],
    supplyList: [],
    baseList: [],
    mintList: [],
    current: {
      base: '--',
      borrow: '--',
      supply: '--',
      baseApyWithIncrement: '--'
    }
  };
  if (!jTokenData?.model || !Array.isArray(jTokenData.model)) {
    return emptyData;
  }
  try {
    const currentModel = jTokenData.model.find(item => item.current);
    const current = currentModel
      ? {
          base: BigNumber(currentModel.base).times(100),
          borrow: BigNumber(currentModel.borrow).times(100),
          supply: BigNumber(currentModel.supply).times(100),
          baseApyWithIncrement: BigNumber(currentModel.baseApyWithIncrement).times(100)
        }
      : {
          base: '--',
          borrow: '--',
          supply: '--',
          baseApyWithIncrement: '--'
        };
    const { assetList } = RootStore.lend;
    const { totalApy, mintApy, mintApyWithUSDD, underlyingIncrementApy } = getTotalApy(jTokenData, assetList);
    //存款APY
    const depositAPYDisplay = `${
      tryFormatNumber(
        BigNumber(tryFormatNumber(current.supply, 2, { miniText: 0.01, per: true })).plus(
          tryFormatNumber(mintApy, 2, { miniText: 0.01, per: true })
        ),
        2,
        { miniText: 0.01, per: true }
      ) === '--'
        ? tryFormatNumber(totalApy, 2, {
            cutZero: false,
            miniText: 0.01,
            needDolar: false,
            per: true
          })
        : tryFormatNumber(
            BigNumber(tryFormatNumber(current.supply, 2, { miniText: 0.01, per: true })).plus(
              tryFormatNumber(mintApy, 2, { miniText: 0.01, per: true })
            ),
            2,
            { miniText: 0.01, per: true }
          )
    }%`;
    //存款基础APY（原币种）
    const depositBaseAPYDisplay = `${tryFormatNumber(current.supply, 2, {
      per: true,
      miniText: '0.01',
      defaultSymbol: true
    })}%`;
    //wstUSDT基础APY（原币种）
    const underlyingIncrementApyDisplay = `${tryFormatNumber(underlyingIncrementApy, 2, {
      per: true,
      miniText: '0.01'
    })}%`;
    const depositTotalAPYDisplay = `${tryFormatNumber(totalApy, 2, { miniText: 0.01, per: true })}%`;
    // 存款挖矿APY（奖励USDD）
    const depositMiningAPYDisplay = `${
      Config.usddMint.includes(jTokenData.jtokenAddress)
        ? `${tryFormatNumber(mintApyWithUSDD, 2, { per: true, miniText: '0.01' })}`
        : tryFormatNumber(mintApy, 2, { per: true, miniText: '0.01' })
    }%`;
    // 借款APy
    const borrowAPyDisplay = `${tryFormatNumber(BigNumber(jTokenData.borrowedAPY).times(1e2), 2, {
      miniText: 0.01,
      per: true
    })}%`;
    // 存款规模
    const depositSizeDisplay = `${
      BigNumber(jTokenData.depositedUSD).isNaN()
        ? '--'
        : BigNumber(jTokenData.depositedUSD).gte(1e3)
        ? tryAmountFormat(jTokenData.depositedUSD, 2, { miniText: 0.01, needDolar: true, cutZero: true })
        : formatNumber(jTokenData.depositedUSD, 2, { miniText: 0.01, needDolar: true, cutZero: true })
    }`;
    //存款人数
    const depositCountDisplay = jTokenData.depositHeadcount == 0 ? 0 : formatNumber(jTokenData.depositHeadcount, 0);
    // 借款规模
    const borrowSizeDisplay = `${
      BigNumber(jTokenData.borrowedUSD).isNaN()
        ? '--'
        : BigNumber(jTokenData.depositedUSD).gte(1e3)
        ? tryAmountFormat(jTokenData.borrowedUSD, 2, { miniText: 0.01, needDolar: true })
        : formatNumber(jTokenData.borrowedUSD, 2, { miniText: 0.01, needDolar: true })
    }`;
    // 借款人数
    const borrowCountDisplay = jTokenData.borrowHeadcount == 0 ? 0 : formatNumber(jTokenData.borrowHeadcount, 0);
    // 借款上限
    const borrowLimitDisplay = `${
      BigNumber(jTokenData.borrowLimit).gt(0)
        ? tryFormatNumber(jTokenData.borrowLimit, 0) + ' ' + jTokenData.collateralSymbol
        : Intl.get('market.detail_none')
    }`;
    // 流动性--市场可借
    const liquidityDisplay = `${
      BigNumber(marketLendAvailable(jTokenData)).gte(1)
        ? tryFormatNumber(marketLendAvailable(jTokenData), 0)
        : tryFormatNumber(marketLendAvailable(jTokenData), 2, {
            miniText: 0.01
          })
    } ${jTokenData.collateralSymbol}`;
    // 抵押因子
    const collateralDisplay = `${renderPercent(jTokenData.collateralFactor, {
      decimal: 16,
      miniText: '0.0000000000000001',
      multi100: true
    })}`;
    // 储备金量
    const totalReservesDisplay = `${tryFormatNumber(jTokenData.totalReserves, 6, { miniText: 0.000001 })} ${
      jTokenData.collateralSymbol
    }`;
    // 储备金比例
    const reserveFactorDisplay = `${renderPercent(jTokenData.reserveFactor, {
      decimal: 16,
      miniText: '0.0000000000000001',
      multi100: true
    })}`;
    // 总利息/日
    const dailyinterestDisplay = `${tryFormatNumber(jTokenData.earnUSDPerDay, 2, { miniText: 0.01, needDolar: true })}`;
    // 发行量
    const supplyDisplay = `${tryFormatNumber(jTokenData.totalSupply, 0, { miniText: 1 })} j${
      jTokenData.collateralSymbol
    }`;
    // 兑换率
    const exchangeRateDisplay = `${
      BigNumber(jTokenData.oneToExchangeRate).lt(BigNumber(1).div(Config.tokenDefaultPrecision))
        ? '--'
        : '1 ' +
          jTokenData.collateralSymbol +
          ' = ' +
          tryFormatNumber(jTokenData.oneToExchangeRate, 18) +
          ' j' +
          jTokenData.collateralSymbol
    }`;

    let mintApyResult = 0;
    if (BigNumber(mintApy).gte(0)) {
      mintApyResult = mintApy;
    }
    if (Config.usddMint.includes(jTokenData.jtokenAddress)) {
      mintApyResult = mintApyWithUSDD;
    }
    if (!checkIfShouldShowMintApyDetail(showMintApy, jTokenData.collateralSymbol, mintApyResult)) {
      mintApyResult = BigNumber(0);
    }
    const borrowList = [],
      supplyList = [],
      mintList = [],
      baseList = [];

    const { collateralSymbol } = jTokenData;
    jTokenData.model.forEach(item => {
      if (item.current) {
        return;
      }
      borrowList.push(tryFormatNumber(BigNumber(item.borrow).times(100), 2, { miniText: 0.01, per: true }));
      supplyList.push(
        tryFormatNumber(
          BigNumber(collateralSymbol === 'wstUSDT' ? item.baseApyWithIncrement : item.supply)
            .times(100)
            .plus(BigNumber(mintApyResult)._toFixed(2, 1)),
          2,
          {
            miniText: 0.01,
            per: true
          }
        )
      );
      mintList.push(tryFormatNumber(mintApyResult, 2, { miniText: 0.01, per: true }));

      baseList.push(tryFormatNumber(BigNumber(item.base).times(100), 2, { miniText: 0.01, per: true }));
    });

    const borrowDetail = addFakeData(jTokenData.borrowDetail);
    const depositDetail = addFakeData(jTokenData.depositDetail);
    return {
      ...jTokenData,
      borrowDetail,
      depositDetail,
      isReady: true,
      depositAPYDisplay,
      depositTotalAPYDisplay,
      depositBaseAPYDisplay,
      underlyingIncrementApyDisplay,
      depositMiningAPYDisplay,
      borrowAPyDisplay,
      depositSizeDisplay,
      depositCountDisplay,
      borrowSizeDisplay,
      borrowCountDisplay,
      borrowLimitDisplay,
      collateralDisplay,
      totalReservesDisplay,
      reserveFactorDisplay,
      dailyinterestDisplay,
      supplyDisplay,
      exchangeRateDisplay,
      liquidityDisplay,
      farmRewardUSD24hDisplay:
        jTokenData.farmRewardUSD24h === undefined
          ? '--'
          : tryFormatNumber(jTokenData.farmRewardUSD24h, 0, { needDolar: true }),

      // 利率模型图标中使用的数据
      current,
      supplyList,
      borrowList,
      baseList,
      mintList,

      mintApy,
      mintApyWithUSDD
    };
  } catch (e) {
    console.error('Process jTokeData failed: ', e, jTokenData);
    return emptyData;
  }
}

function addFakeData(dataList) {
  if (!Array.isArray(dataList)) {
    dataList = [];
  }
  try {
    let startDate = dayjs(Date.now()).add(1, 'day');
    if (dataList.length > 0) {
      startDate = dayjs(dataList[0].date);
    }
    const times = 30 - dataList.length;
    for (let i = 1; i <= times; i++) {
      dataList.unshift({
        isFake: true,
        date: startDate.subtract(i, 'day').format('YYYY-MM-DD'),
        borrowedAPY: '0',
        borrowedUSD: '0',
        depositedAPY: '0',
        depositedUSD: '0',
        farmApy: '0'
      });
    }
  } catch {
    console.error('addFakeData to dataList failed.');
  }
  return dataList;
}

export function checkIfShouldShowMintApyDetail(toggle = true, collateralSymbol, mintApy) {
  return (
    toggle &&
    !Config.hideMarketMintIcon.includes(collateralSymbol) &&
    mintApy !== '--' &&
    mintApy !== '0%' &&
    mintApy !== '0' &&
    mintApy !== 0 &&
    (BigNumber(mintApy).isNaN() || BigNumber(mintApy).gt(0))
  );
}
