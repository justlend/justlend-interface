import { LoadingOutlined } from '@ant-design/icons';
import { Modal, Progress, Tooltip, Skeleton } from 'antd';
import bigNumber from 'bignumber.js';
import isMobileJs from 'ismobilejs';
import moment from 'moment';
import React from 'react';
import intl from 'react-intl-universal';
import CountUp from 'react-countup';
import Config from '../config';
import { ICONS_MAP } from './constant';

import { getCash, tronObj } from './blockchain';

import emptyImg from '../assets/images/tableNoData.svg';
import TransCancelledIcon from '../assets/images/TransactionCanceled.svg';
import TransSubmittedIcon from '../assets/images/TransactionSubmitted.svg';
const { rewardbBasePhaseForNewPeriod, miningSymbol, jtrxAddress } = Config;

let modalRef = null;

const tronWeb = tronObj.tronWeb;

bigNumber.config({ EXPONENTIAL_AT: 1e9 });
bigNumber.prototype._toFixed = function (...arg) {
  return new bigNumber(this.toFixed(...arg)).toString();
};
bigNumber.prototype._toFixedNew = function (...arg) {
  return new bigNumber(this).isNaN() ? '0' : new bigNumber(this.toFixed(...arg)).toString();
};
bigNumber.prototype._toBg = function () {
  return this;
};
bigNumber.prototype._toHex = function () {
  return `0x${this.toString(16)}`;
};

export const toBigNumber = tronWeb.toBigNumber;

// export const BigNumber = tronWeb.BigNumber;
export const BigNumber = bigNumber;

export const toDecimal = tronWeb.toDecimal;

export const getTrxBalance = async address => {
  return await tronWeb.trx.getUnconfirmedBalance(address);
};
export const getAccount = async address => {
  return await tronWeb.trx.getAccount(address);
};

export const toBigNumberNew = function (value) {
  if (typeof value === 'string') {
    value = value.replace(/,/g, '');
  }
  return new bigNumber(value);
};

export const _toFormat = function (value) {
  if (bigNumber(value).toFormat() === 'NaN') {
    return '';
  }
  if (typeof value === 'string') {
    value = value.replace(/,/g, '');
    const arr = value.split('.');
    const formatStr = bigNumber(arr[0]).toFormat();
    if (formatStr === 'NaN') {
      return '';
    }
    if (arr[1] !== undefined) {
      return `${formatStr}.${arr[1]}`;
    }
    return formatStr;
  }
  const formatStr = bigNumber(value).toFormat();

  return formatStr;
};

export const showEllipsis = (number, decimals) => {
  const numberStr = String(number);
  const numberArr = numberStr.split('.');
  if (numberArr.length === 0) return false;
  const decimalPart = numberArr[1] ? numberArr[1].replace(/0+?$/, '') : '';
  if (decimalPart.length > decimals) return true;
  return false;
};

export const tableClickRowToTransaction = (txId, target = '') => {
  const { tronscanUrl } = Config;
  if (txId) window.open(tronscanUrl + '/transaction/' + txId, target);
};

export const formatNumber = (
  number,
  decimals = false,
  {
    cutZero = true,
    miniText = false,
    miniTextValue = miniText,
    needDolar = false,
    round = false,
    per = false,
    uint = false,
    showNegative = false,
    defaultSymbol = false,
    reverseMiniTextDolarSymbolOrder = false,
    roundMode = '' //'ROUND_HALF_UP'
  } = {}
) => {
  if (number === '--' || BigNumber(number).isNaN()) return '--';
  if (defaultSymbol && !BigNumber(number).gt(0)) return '--';

  if (((!number && !BigNumber(number).eq(0)) || BigNumber(number).lt(0)) && !showNegative) {
    // if (!number || BigNumber(number).lte(0)) {
    if (needDolar) {
      if (reverseMiniTextDolarSymbolOrder) return '$< 0.01';
      return '< $0.01';
    } else if (per) {
      return '< 1';
    } else {
      return '< 0.001';
    }
  }

  if ((BigNumber(number).lt(0) && uint) || BigNumber(number).eq(0)) {
    return `${needDolar ? '$' : ''}0`;
  }

  if (miniText || miniText === 0) {
    // if (BigNumber(number).gte(0) && BigNumber(number).lt(miniText)) {
    if (!BigNumber(number).gte(miniText) && !showNegative) {
      if (reverseMiniTextDolarSymbolOrder)
        return `${needDolar ? '$' : ''}< ${miniTextValue ? miniTextValue : miniText}`;
      return `< ${needDolar ? '$' : ''}${miniTextValue ? miniTextValue : miniText}`;
    }
    if (showNegative) {
      const negativeMiniText = BigNumber(0).minus(miniText);
      if (!BigNumber(number).gte(miniText) && BigNumber(number).gt(negativeMiniText)) {
        if (reverseMiniTextDolarSymbolOrder)
          return `${needDolar ? '$' : ''}< ${miniTextValue ? miniTextValue : miniText}`;
        return `< ${needDolar ? '$' : ''}${miniTextValue ? miniTextValue : miniText}`;
      }
    }
  }

  tronWeb.BigNumber.config({
    ROUNDING_MODE: tronWeb.BigNumber.ROUND_HALF_UP,
    FORMAT: {
      decimalSeparator: '.',
      groupSeparator: per ? '' : ',',
      groupSize: 3
    }
  });
  let object = toBigNumber(number);

  // If rounding, use BigNumber's .toFormat() method
  // if (round) return decimals ? object.toFormat(decimals) : object.toFormat();

  if (decimals || decimals === 0) {
    decimals = Number(decimals);
    const d = toBigNumber(10).pow(decimals);
    let property = tronWeb.BigNumber.ROUND_DOWN;
    if (round) {
      property = tronWeb.BigNumber.ROUND_HALF_UP;
      if (roundMode) property = tronWeb.BigNumber[roundMode];
    }
    object = object.times(d).integerValue(property).div(d).toFixed(decimals);
  } else {
    object = object.valueOf();
  }
  const parts = object.toString().split('.');
  if (cutZero) {
    parts[1] = parts[1] ? parts[1].replace(/0+?$/, '') : '';
  }

  let res = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (parts[1] ? `.${parts[1]}` : '');

  if (per) {
    res = parts[0] + (parts[1] ? `.${parts[1]}` : '');
  }

  if (isNaN(parseFloat(res))) {
    res = 0;
  }

  if (needDolar && (((miniText || miniText === 0) && BigNumber(number).gte(miniText)) || !miniText)) {
    res = '$' + res;
  }

  return res;
};

export const toFixedDown = (num, decimals = 4) => {
  const d = toBigNumber(10).pow(decimals);
  return BigNumber(num).times(d).integerValue(BigNumber.ROUND_DOWN).div(d).toFixed(decimals);
};

export const fromHex = hexString => {
  return tronWeb.address.fromHex(hexString.replace('/^0x/', '0x41'));
};

export const addressToHex = addr => {
  return tronWeb.address.toHex(addr);
};

export const isAddress = address => {
  return tronWeb.isAddress(address);
};

export const tronscanAddress = (text, address) => {
  let lang = window.localStorage.getItem('lang') || 'en-US';

  return (
    <a
      className="typo-text-link hover"
      href={`${lang === 'en-US' ? Config.tronscanUrlEN : Config.tronscanUrlCN}/address/${address}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      {text}
    </a>
  );
};

export const tronscanTX = (text, tx, isNeedArrow, onClick = null) => {
  let lang = window.localStorage.getItem('lang') || 'en-US';

  return (
    <a
      className="typo-text-link"
      href={`${lang === 'en-US' ? Config.tronscanUrlEN : Config.tronscanUrlCN}/transaction/${tx}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
    >
      {text}
      {isNeedArrow && <span className="warning-icon"></span>}
    </a>
  );
};

export const tronscanTXStUsdt = (text, tx) => {
  let lang = window.localStorage.getItem('lang') || 'en-US';

  return (
    <a
      className="tronscan hover"
      href={`${lang === 'en-US' ? Config.tronscanUrlEN : Config.tronscanUrlCN}/transaction/${tx}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      {text}
    </a>
  );
};

export const tronscanTXEnergyRental = (text, tx, isNeedArrow, addOrderModalIsRenew = false) => {
  let lang = window.localStorage.getItem('lang') || 'en-US';

  return (
    <a
      className="typo-text-link hover"
      href={`${lang === 'en-US' ? Config.tronscanUrlEN : Config.tronscanUrlCN}/transaction/${tx}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        if (addOrderModalIsRenew) {
          window.gtag('event', 'energyrent_pro_retx_successpop_clickScan', {
            'event_category': 'energyrent',
            'event_label': 'energyrent_pro_retx_successpop_clickScan'
          });
        } else {
          window.gtag('event', 'energyrent_pro_tx_successpop_goScan', {
            'event_category': 'energyrent',
            'event_label': 'energyrent_pro_tx_successpop_goScan'
          });
        }
      }}
    >
      {text}
      {isNeedArrow && <span className="warning-icon"></span>}
    </a>
  );
};

export const copyToClipboard = (e, disBottom = '5px', p = false) => {
  let value = '';
  if (p) {
    value = document.getElementById(p).title;
  } else {
    value = e.target.title;
  }
  value = value.replace(/,/g, '');

  var aux = document.createElement('input');

  if (tronWeb.BigNumber.isBigNumber(value)) {
    aux.setAttribute('value', toBigNumber(value).valueOf());
  } else {
    aux.setAttribute('value', value.valueOf());
  }

  document.body.appendChild(aux);
  aux.select();
  document.execCommand('copy');
  document.body.removeChild(aux);
  const div = document.createElement('div');
  div.innerHTML = intl.get('account_modal.copied');
  div.className = 'copied-style-sp';
  Object.assign(div.style, {
    bottom: disBottom
  });
  if (p) {
    document.getElementById(p).appendChild(div);
  } else {
    e.target.appendChild(div);
  }
  const parent = p ? document.getElementById(p) : e.target;
  setTimeout(() => parent.removeChild(div), 1000);
};

export const SUPPORT_LOCALES = [
  {
    name: 'English',
    value: 'en-US'
  },
  {
    name: '繁體中文',
    value: 'zh-TC'
  }
];

export const cutMiddle = (text = '', left = 4, right = 4) => {
  if (text.length <= left + right) return text;
  if (typeof text !== 'string') {
    text = `${text}`;
  }
  return `${text?.substr(0, left).trim()}...${text?.substr(-right)}`;
};

export const shortenEmailAddress = (email = '', startEndCharLength = 1) => {
  const parts = email.split('@');

  if (parts.length == 2) {
    if (parts[0].length <= startEndCharLength * 2) {
      return parts[0] + '@' + parts[1];
    } else {
      return (
        parts[0].slice(0, startEndCharLength) +
        '***' +
        parts[0].slice(parts[0].length - startEndCharLength, parts[0].length) +
        '@' +
        parts[1]
      );
    }
  } else {
    return email;
  }
};

export const numberParser = (str, decimal) => {
  str = String(str);
  if (!str) return { valid: true, str: '' };

  let reg = new RegExp(`^(\\d+)(\\.\\d*)?$`);
  if (decimal !== undefined) {
    reg = new RegExp(`^(\\d+)(\\.\\d{0,${decimal}})?$`);
  }

  if (!reg.test(str)) {
    return { valid: false, str: '' };
  } else {
    return { valid: true, str: str.replace(/^0+(\d)/g, '$1') };
  }
};

export const openTransModal = (intlObj = {}, { step = 0, txId = '' }) => {
  modalRef && modalRef.destroy();

  if (!step) return;

  const config = {
    title: '',
    className: 'trans-modal',
    icon: null,
    // width: 630,
    // style: { marginLeft: getModalLeft() },
    content: (
      <div className="trans-modal-body center">
        <div className="trans-modal-title">{intl.get(intlObj.title, intlObj.obj)}</div>
        {step == 1 ? (
          <React.Fragment>
            <div className="trans-modal-icon">
              <LoadingOutlined style={{ fontSize: '80px' }}></LoadingOutlined>
            </div>
            <div className="trans-modal-status trans-modal-wait-confirm">{intl.get('deposit.explanation2')}</div>
            {/* <div className="trans-modal-tips trans-modal-wait-confirm-tips">{intl.get('deposit.explanation2')}</div> */}
          </React.Fragment>
        ) : null}
        {step == 2 ? (
          <React.Fragment>
            <div className="trans-modal-icon">
              <img src={TransSubmittedIcon} alt="" style={{ width: '86px' }} />
            </div>
            {/* <div className="trans-modal-status trans-modal-submit">{intl.get('deposit.explanation4')}</div> */}
            <div className="trans-modal-tips trans-modal-submit-tips">
              {tronscanTX(intl.get('deposit.explanation4'), txId)}
            </div>
          </React.Fragment>
        ) : null}
        {step == 3 ? (
          <React.Fragment>
            <div className="trans-modal-icon">
              <img src={TransCancelledIcon} alt="" style={{ width: '86px' }} />
            </div>
            <div className="trans-modal-status trans-modal-cancel">{intl.get('deposit.explanation3')}</div>
          </React.Fragment>
        ) : null}
      </div>
    )
  };

  modalRef = Modal.info(config);
};

export const setTransactionsData = (tx, intlObj) => {
  let data = window.localStorage.getItem(window.defaultAccount) || '[]';
  let dataArr = JSON.parse(data);
  let item = {
    title: '',
    intlObj,
    tx,
    status: 1, // 1: pending, 2: confirmed, 3: failed
    checkCnt: 0,
    showPending: true
  };
  dataArr.unshift(item);
  window.localStorage.setItem(window.defaultAccount, JSON.stringify(dataArr.slice(0, 10)));
};

export const getModalLeft = () => {
  const element = document.getElementById('swap-tab');

  if (!element) return 0;

  let actualLeft = element.offsetLeft;
  let current = element.offsetParent;
  while (current !== null) {
    actualLeft += current.offsetLeft;
    current = current.offsetParent;
  }

  return actualLeft;
};

export const getParameterByName = (name, url) => {
  try {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
      results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  } catch (e) {
    console.error('GetParameterByName failed: ', e, name, url);
    return '';
  }
};

export function getUTCDay(unixDateParams) {
  let unix = moment(moment.unix(unixDateParams).utc().format('YYYY-MM-DD 00:00:00Z')).unix();
  return unix;
}

export function getLastUTCMinutes() {
  let unix = moment(moment().subtract(1, 'minutes').format('YYYY-MM-DD HH:mm:00')).utc().unix();
  return unix;
}

export function getCurrentMinutes() {
  let unix = moment(moment().format('YYYY-MM-DD HH:mm:00')).utc().unix();
  return unix;
}

export function getExpiryDurationInMS(seconds) {
  return BigNumber(seconds).times(1000).toNumber();
}

export const randomSleep = (time = 1000) => {
  return new Promise((reslove, reject) => {
    const timeout = parseInt(Math.random() * time);
    setTimeout(() => {
      reslove();
    }, timeout);
  });
};

export const reTry = async func => {
  try {
    await randomSleep(1000);
    return await func();
  } catch (error) {
    // console.log(error);
    await randomSleep(3000);
    return await reTry(func);
  }
};

export const addKey = (data = []) => {
  data.map((item, index) => {
    item.key = index;
  });
  return [...data];
};

export const emptyReactNode = type => {
  let centerStyle = {
    paddingTop: '50px',
    paddingBottom: '50px',
    position: 'relative'
  };
  let imgStyle = {
    width: '10%',
    maxWidth: '200px',
    minWidth: '100px'
  };
  let textStyle = {
    position: 'absolute',
    transform: 'translate(-50%)',
    top: '40%',
    left: '50%',
    color: '#84869E',
    fontSize: '12px'
  };
  return (
    <div className="center" style={centerStyle}>
      <div className="empty-img">
        <img src={emptyImg} alt="" style={imgStyle} />
        <span style={textStyle}>{type === 'mint' ? '' : intl.get('no_data')}</span>
      </div>
    </div>
  );
};

export const emptyReactNodeNew = () => {
  return (
    <div className="j-nodata">
      <div>
        <div className="nodata-img"></div>
        <div className="nodata-text">{intl.get('v2.na_data')}</div>
      </div>
    </div>
  );
};

export const getDepositApy = item => {
  return BigNumber(item.supplyratePerblock).div(Config.tokenDefaultPrecision).times(Config.blockPerYear).times(100);
};

export const getPrecision = decimal => {
  return BigNumber(10).pow(decimal);
};

export const getLendApy = item => {
  return BigNumber(item.borrowratePerblock).div(Config.tokenDefaultPrecision).times(Config.blockPerYear).times(100);
};

export const getBlockDelta = item => {
  // const nowBlock = await getCurrentBlock();
  const nowBlock = window.nowBlock || 0;
  const lastBlocknum = BigNumber(item.lastBlocknum);
  return BigNumber(nowBlock).minus(lastBlocknum).lt(0) ? 0 : BigNumber(nowBlock).minus(lastBlocknum);
};

export const getTotalBorrowsNew = item => {
  const borrowratePerblock = BigNumber(item.borrowratePerblock);
  const blockDelta = getBlockDelta(item);
  const totalBorrow = BigNumber(item.totalBorrow);

  return borrowratePerblock.times(blockDelta).times(totalBorrow).div(Config.tokenDefaultPrecision).plus(totalBorrow);
};

export const getTotalReservesNew = item => {
  const borrowratePerblock = BigNumber(item.borrowratePerblock);
  const blockDelta = getBlockDelta(item);
  const totalBorrow = BigNumber(item.totalBorrow);
  const reserveFactor = BigNumber(item.reserveFactor);
  const totalReserve = BigNumber(item.totalReserve);
  // console.log(totalReserve, blockDelta, 'block', borrowratePerblock.times(blockDelta).times(totalBorrow).div(Config.tokenDefaultPrecision).times(reserveFactor).div(Config.tokenDefaultPrecision).plus(totalReserve))
  return borrowratePerblock
    .times(blockDelta)
    .times(totalBorrow)
    .div(Config.tokenDefaultPrecision)
    .times(reserveFactor)
    .div(Config.tokenDefaultPrecision)
    .plus(totalReserve);
};

export const getExchangeRate = item => {
  const totalCash = BigNumber(item.totalCash);
  const totalBorrowsNew = getTotalBorrowsNew(item);
  const totalReservesNew = getTotalReservesNew(item);
  const totalSupply = BigNumber(item.totalSupply);
  // console.log(
  //   totalCash.toString(),
  //   totalBorrowsNew.toString(),
  //   totalReservesNew.toString(),
  //   totalSupply.toString(),
  //   toFixedDown(
  //     totalCash.plus(totalBorrowsNew).minus(totalReservesNew).div(totalSupply).times(Config.tokenDefaultPrecision),
  //     0
  //   ),
  //   'exchangeRate'
  // );
  return BigNumber(
    toFixedDown(
      totalCash.plus(totalBorrowsNew).minus(totalReservesNew).div(totalSupply).times(Config.tokenDefaultPrecision),
      0
    )
  );
};

export const getDeposit = item => {
  const exchangeRate = item.exchangeRate || getExchangeRate(item);
  const depositJtoken = BigNumber(item.account_depositJtoken);
  return depositJtoken
    .times(exchangeRate)
    .div(Config.tokenDefaultPrecision)
    .div(item.precision || getPrecision(item.collateralDecimal));
};

export const getDepositUsd = (item, trxPrice, trxAssetPrice) => {
  const deposited = getDeposit(item).times(item.precision || getPrecision(item.collateralDecimal));
  trxPrice = BigNumber(trxPrice).div(Config.tokenDefaultPrecision);
  // const assetPrice = BigNumber(item.assetPrice).div(Config.tokenDefaultPrecision);
  const assetPrice = BigNumber(item.assetPrice).div(
    BigNumber(trxAssetPrice).gte(Config.oraclePricePrecision)
      ? Config.oraclePricePrecision
      : Config.tokenDefaultPrecision
  );
  return deposited.times(assetPrice).times(trxPrice).div(Config.defaultPrecision);
};

export const getEarned = item => {
  const depositJtoken = BigNumber(item.account_depositJtoken);
  const exchangeRate = item.exchangeRate || getExchangeRate(item);
  const supplyAdded = BigNumber(item.account_supplyAdded);
  const redeemAdded = BigNumber(item.account_redeemAdded);
  const earned = depositJtoken
    .times(exchangeRate)
    .div(Config.tokenDefaultPrecision)
    .minus(supplyAdded)
    .plus(redeemAdded)
    .div(item.precision);
  return earned.lt(0) ? BigNumber(0) : earned;
};

export const getBorrowIndexNew = item => {
  const borrowratePerblock = BigNumber(item.borrowratePerblock);
  const blockDelta = getBlockDelta(item);
  const borrowIndex = BigNumber(item.borrowIndex);
  return borrowratePerblock.times(blockDelta).times(borrowIndex).div(Config.tokenDefaultPrecision).plus(borrowIndex);
};

export const getBorrowBalanceNew = item => {
  const borrowBalance = BigNumber(item.account_borrowBalance);
  const borrowIndex = BigNumber(item.account_borrowIndex);
  if (borrowIndex.eq(0)) return BigNumber(0);
  const borrowIndexNew = getBorrowIndexNew(item);
  // console.log(borrowBalance.toString(), borrowIndex.toString(), borrowIndexNew.toString(), 'getBorrowBalanceNew');
  return borrowBalance.times(borrowIndexNew).div(borrowIndex);
};

export const getBorrowBalanceNewUsd = (item, trxPrice, trxAssetPrice) => {
  // console.log('trxPrice:', BigNumber(trxPrice).toNumber());
  const borrowBalanceNew = item.borrowBalanceNew || getBorrowBalanceNew(item);
  trxPrice = BigNumber(trxPrice).div(Config.tokenDefaultPrecision);
  // const assetPrice = BigNumber(item.assetPrice).div(Config.tokenDefaultPrecision);
  const assetPrice = BigNumber(item.assetPrice).div(
    BigNumber(trxAssetPrice).gte(Config.oraclePricePrecision)
      ? Config.oraclePricePrecision
      : Config.tokenDefaultPrecision
  );
  return borrowBalanceNew.times(assetPrice).times(trxPrice).div(Config.defaultPrecision);
};

export const getInterest = item => {
  const borrowBalanceNew = item.borrowBalanceNew || getBorrowBalanceNew(item);
  const borrowBalance = BigNumber(item.account_borrowBalance);
  return borrowBalanceNew.minus(borrowBalance).div(item.precision);
};

export const getInterestOrEarnedUsd = (item, trxPrice, isEarned = false, trxAssetPrice) => {
  trxPrice = BigNumber(trxPrice).div(Config.tokenDefaultPrecision);
  const assetPrice = BigNumber(item.assetPrice)
    // .div(Config.tokenDefaultPrecision)
    .div(
      BigNumber(trxAssetPrice).gte(Config.oraclePricePrecision)
        ? Config.oraclePricePrecision
        : Config.tokenDefaultPrecision
    )
    .times(item.precision)
    .div(Config.defaultPrecision);
  // const assetPrice = BigNumber(item.assetPrice).div(Config.tokenDefaultPrecision);
  // temp is interest or earned
  let temp = 1;
  isEarned ? (temp = item.earned || getEarned(item)) : (temp = item.interest || getInterest(item));
  return temp.times(assetPrice).times(trxPrice);
};

export const getDepositJtokenAll = userDataList => {
  let depositJtokenAll = BigNumber(0);
  userDataList.map(item => {
    if (BigNumber(item.deposited_usd).gt(0)) {
      depositJtokenAll = depositJtokenAll.plus(item.deposited_usd);
    }
  });
  // console.log(depositJtokenAll, '4966666666');
  return depositJtokenAll;
};

export const getBorrowLimit = (trxPrice, userDataList, trxAssetPrice) => {
  let depositUSDAll = BigNumber(0);
  userDataList.map(_ => {
    if (_.account_entered === 1) {
      let temp = BigNumber(0);
      if (_.jtokenAddress === Config.usddJtoken || _.jtokenAddress === Config.usddoldJtoken) {
        _.deposited = getDeposit(_); // done
        temp = BigNumber(_.deposited).times(_.collateralFactor).div(Config.tokenDefaultPrecision);
      } else {
        _.deposited_usd = getDepositUsd(_, trxPrice, trxAssetPrice);
        temp = BigNumber(_.deposited_usd).times(_.collateralFactor).div(Config.tokenDefaultPrecision);
      }
      depositUSDAll = depositUSDAll.plus(temp);
    }
  });
  return depositUSDAll;
};

export const getBorrowLimitAfter = (item, priceList, userDataList, tokenValue = BigNumber(0)) => {
  const borrowLimit = getBorrowLimit(priceList, userDataList);
  // console.log(borrowLimit, '5100000000000')
  // const assetPrice = BigNumber(getBorrowLimit[item.collateralAddress]).div(Config.tokenDefaultPrecision);
  const assetPrice = BigNumber(getBorrowLimit[item.collateralAddress]).div(Config.oraclePricePrecision);
  return borrowLimit.plus(tokenValue.times(item.collateralFactor).times(assetPrice));
};

export const getBorrowPercent = (item, trxPrice, borrowLimit) => {
  let balanceNewUsd = item.borrowBalanceNewUsd || getBorrowBalanceNewUsd(item, trxPrice);
  // const borrowLimit = item.borrowLimit || getBorrowLimit(trxPrice, userDataList);
  if (item.jtokenAddress === Config.usddJtoken || item.jtokenAddress === Config.usddoldJtoken) {
    balanceNewUsd = BigNumber(item.borrowBalanceNew).div(item.precision);
  }
  // console.log(balanceNewUsd.toString(), borrowLimit, borrowLimit.toString(), balanceNewUsd.div(borrowLimit).times(100));
  return balanceNewUsd.div(borrowLimit).times(100);
};

export const getTotalLendUsd = depositData => {
  let totalUsd = BigNumber(0);
  depositData.map(item => {
    totalUsd = totalUsd.plus(item.borrowBalanceNewUsd);
  });
  return totalUsd;
};

export const getBorrowableUsd = item => {
  const { usddJtoken, usddoldJtoken } = Config;
  if (!BigNumber(item.collateralFactor).eq(0)) {
    if (item.jtokenAddress === usddJtoken || item.jtokenAddress === usddoldJtoken) {
      return BigNumber(item.deposited).times(item.collateralFactor).div(Config.tokenDefaultPrecision);
    }
    return BigNumber(item.deposited_usd).times(item.collateralFactor).div(Config.tokenDefaultPrecision);
  } else {
    return BigNumber(0);
  }
};

export const getSuppliedOverview = supplyData => {
  let totalSupplyUsd = BigNumber(0);
  let totalBorrowableUsd = BigNumber(0);
  const { usddJtoken, usddoldJtoken } = Config;

  let mortgateUsd = BigNumber(0);
  let marketUsd = BigNumber(0);

  supplyData.map(item => {
    let supplyUsdWithDecimal = toFixedDown(item.deposited_usd, 18);
    if (item.jtokenAddress === usddJtoken || item.jtokenAddress === usddoldJtoken)
      supplyUsdWithDecimal = toFixedDown(item.deposited, 18);
    totalSupplyUsd = totalSupplyUsd.plus(BigNumber(supplyUsdWithDecimal));

    let borrowableUsdWithDecimal = toFixedDown(item.borrowableUsd, 18);
    if (BigNumber(item.account_entered).eq(1))
      totalBorrowableUsd = totalBorrowableUsd.plus(BigNumber(borrowableUsdWithDecimal));

    let marketItem = BigNumber(supplyUsdWithDecimal).times(item.collateralFactor).div(Config.tokenDefaultPrecision);
    marketUsd = marketUsd.plus(marketItem);
    // console.log('item data: ', item.collateralSymbol, BigNumber(marketItem).toString());
    if (BigNumber(item.account_depositJtoken).gt(0) && BigNumber(item.account_entered).eq(1)) {
      let mortgateItem = BigNumber(supplyUsdWithDecimal).times(item.collateralFactor).div(Config.tokenDefaultPrecision);
      mortgateUsd = mortgateUsd.plus(BigNumber(mortgateItem));
      // console.log('mortgate data: ', item.collateralSymbol, BigNumber(mortgateItem).toString(), mortgateUsd.toString());
    }
  });
  // const mortgageRate = formatNumber(mortgateUsd.div(marketUsd).times(100), 2);
  const mortgageRate = formatNumber(mortgateUsd.div(totalSupplyUsd).times(100), 2);
  // console.log(mortgateUsd.toString(), totalSupplyUsd.toString(), mortgageRate);
  return {
    totalSupplyUsd,
    mortgageRate,
    totalBorrowableUsd
  };
};

export const getTotalBorrowingUsd = borrowingData => {
  let totalBorrowingUsd = BigNumber(0);
  const { usddJtoken, usddoldJtoken } = Config;
  borrowingData.map(item => {
    let borrowingUsdWithDecimal = toFixedDown(item.borrowBalanceNewUsd, 18);
    if (item.jtokenAddress === usddJtoken || item.jtokenAddress === usddoldJtoken)
      borrowingUsdWithDecimal = toFixedDown(BigNumber(item.borrowBalanceNew).div(item.precision), 18);
    totalBorrowingUsd = totalBorrowingUsd.plus(BigNumber(borrowingUsdWithDecimal));
  });
  return totalBorrowingUsd;
};

export const getTotalLendUsdForUSDD = depositData => {
  let totalUsd = BigNumber(0);
  const { usddJtoken, usddoldJtoken } = Config;
  depositData.map(item => {
    if (item.jtokenAddress === usddJtoken || item.jtokenAddress === usddoldJtoken) {
      totalUsd = totalUsd.plus(BigNumber(item.borrowBalanceNew).div(item.precision));
    } else {
      totalUsd = totalUsd.plus(item.borrowBalanceNewUsd);
    }
  });
  return totalUsd;
};

export const amountFormat = (amount, decimal, { miniText = false, needDolar = false, cutZero } = {}) => {
  if (miniText || miniText === 0) {
    if (BigNumber(amount).gte(0) && BigNumber(amount).lt(miniText)) {
      return `< ${needDolar ? '$' : ''}${miniText}`;
    }
  }
  amount = BigNumber(amount);
  let precision = BigNumber(10).pow(decimal);
  let res = '';
  if (amount.gt(1e9)) {
    res = `${needDolar ? '$' : ''}${amount
      .div(1e9)
      .times(precision)
      .integerValue(tronWeb.BigNumber.ROUND_DOWN)
      .div(precision)
      .toFixed(decimal)}B`;
  } else if (amount.gt(1e6)) {
    res = `${needDolar ? '$' : ''}${amount
      .div(1e6)
      .times(precision)
      .integerValue(tronWeb.BigNumber.ROUND_DOWN)
      .div(precision)
      .toFixed(decimal)}M`;
  } else if (amount.gt(1e3)) {
    res = `${needDolar ? '$' : ''}${amount
      .div(1e3)
      .times(precision)
      .integerValue(tronWeb.BigNumber.ROUND_DOWN)
      .div(precision)
      .toFixed(decimal)}K`;
  } else {
    res = `${needDolar ? '$' : ''}${amount
      .times(precision)
      .integerValue(tronWeb.BigNumber.ROUND_DOWN)
      .div(precision)
      .toFixed(decimal)}`;
  }
  if (cutZero) {
    res = res.replace(/0+([BMK]?)$/, (m, p1) => p1 || '');
  }
  return res;
};

export const deduplication = (dataSource, value) => {
  let arr = dataSource.map(item => {
    let obj = {
      name: item[value],
      state: item['state']
    };
    return obj;
  });
  var newArr = [];
  for (var i = 0; i < arr.length; i++) {
    var temp = arr[i].name;
    var count = 0;
    for (var j = 0; j < arr.length; j++) {
      if (arr[j].name == temp) {
        count++;
        arr[j].name = -1;
      }
    }
    if (temp != -1) {
      let obj = {
        intl: temp,
        count,
        state: arr[i].state
      };
      newArr.push(obj);
    }
  }
  return newArr;
};

export const renderBalance = (item, balanceInfo, decimals = 6, noUnit = false) => {
  try {
    const { jtokenAddress, precision, collateralSymbol } = item;
    if (balanceInfo[jtokenAddress] && balanceInfo[jtokenAddress].balance) {
      if (noUnit) {
        return (
          <span className="repay-balance flex">
            <span className="repay-balance-value ellipsis">
              {formatNumber(balanceInfo[jtokenAddress].balance.div(precision), decimals, { miniText: 0.001 })}&nbsp;
            </span>
            {item.collateralSymbol}
          </span>
        );
      }
      return (
        <span>
          <span>{amountFormat(balanceInfo[jtokenAddress].balance.div(precision), decimals)}</span>{' '}
          {item.collateralSymbol}
        </span>
      );
    } else {
      return <span>--</span>;
    }
  } catch (err) {
    return <span>--</span>;
  }
};

export const renderBalanceNew = (item, balanceInfo, decimals = 6) => {
  try {
    const { jtokenAddress, precision, collateralSymbol } = item;
    if (balanceInfo[jtokenAddress] && balanceInfo[jtokenAddress].balance) {
      let balance = BigNumber(balanceInfo[jtokenAddress].balance).div(precision);
      return (
        <>
          <span>
            {BigNumber(balance).gt(1e6)
              ? formatNumber(balance, 0)
              : BigNumber(balance).gt(1e3)
              ? formatNumber(balance, 3)
              : formatNumber(balance, 6)}{' '}
          </span>
          <span>{collateralSymbol}</span>
        </>
      );
    } else {
      return <span>--</span>;
    }
  } catch (err) {
    return <span>--</span>;
  }
};

export const renderBalanceV2 = (item, balanceInfo, { decimals = 6, minText = false, showSymbol = true }) => {
  try {
    const { jtokenAddress, precision, _collateralSymbol } = item;
    const collateralSymbol = showSymbol ? _collateralSymbol : '';
    if (balanceInfo[jtokenAddress] && balanceInfo[jtokenAddress].balance) {
      let balance = BigNumber(balanceInfo[jtokenAddress].balance).div(precision);
      if (BigNumber(balance).eq(0)) {
        return <span className="can-click">0 {collateralSymbol}</span>;
      }
      if (minText && BigNumber(balance).lt(minText)) {
        return (
          <span className="can-click">
            {'<'}
            {minText} {collateralSymbol}
          </span>
        );
      }
      return (
        <span className="can-click">
          {BigNumber(balance).gt(1e6)
            ? formatNumber(balance, 0)
            : BigNumber(balance).gt(1e3)
            ? formatNumber(balance, 3)
            : formatNumber(balance, 6)}{' '}
          {collateralSymbol}
        </span>
      );
    } else {
      return <span className="can-click">--</span>;
    }
  } catch (err) {
    return <span className="can-click">--</span>;
  }
};

export const renderProgress = (per, { threshold = 80, showInfo = true, reverse = false } = {}) => {
  const colorBlue = '#3D56D6';
  const colorRed = '#ff1f70';
  const trailColor = '#F0F1F6';
  if (BigNumber(per).gte(threshold)) {
    return (
      <Progress
        percent={per}
        strokeColor={colorRed}
        trailColor={trailColor}
        format={percent => <span style={{ color: colorRed }}>{percent}%</span>}
        strokeWidth={4}
        showInfo={showInfo}
        className={reverse ? 'reverse' : ''}
      ></Progress>
    );
  }
  return (
    <Progress
      percent={per}
      strokeColor={colorBlue}
      trailColor={trailColor}
      format={percent => <span style={{ color: colorBlue }}>{percent}%</span>}
      strokeWidth={4}
      showInfo={showInfo}
      className={reverse ? 'reverse' : ''}
    ></Progress>
  );
};

export const checkEnteredMarket = (userList, jtokenAddress) => {
  try {
    return userList && userList[jtokenAddress] && userList[jtokenAddress].account_entered === 1;
  } catch (err) {
    return false;
  }
};

export const gtBalance = (value, balance, precision = 1) => {
  try {
    return BigNumber(value).gt(BigNumber(balance).div(precision));
  } catch (err) {
    return false;
  }
};

export const eqBalance = (value, balance, precision = 1) => {
  try {
    return BigNumber(value).eq(BigNumber(balance).div(precision));
  } catch (err) {
    return false;
  }
};

export const renderPercent = (
  value,
  {
    gt0 = true,
    multi100 = false,
    needPerSymbol = true,
    miniText = 0.01,
    decimal = 2,
    cutZero = true,
    keep0 = false,
    useFull = true,
    defaultSymbol = false
  } = {}
) => {
  try {
    if (defaultSymbol && !BigNumber(value).gt(0)) return '--';
    if (multi100) {
      value = BigNumber(value).times(100);
    }
    if (gt0 && BigNumber(value).gt(100) && useFull) {
      value = BigNumber(100);
    }
    if (keep0 && BigNumber(value).eq(0)) return 0 + (needPerSymbol ? '%' : '');
    return formatNumber(value, decimal, { miniText, per: true, cutZero }) + (needPerSymbol ? '%' : '');
  } catch (err) {
    return '';
  }
};

export const checkCash = async (value, popData) => {
  const { balance = 0, success } = await getCash(popData.jtokenAddress);
  if (success) {
    return BigNumber(value).times(popData.precision).gt(balance);
  }
  return false;
};

export const myLocal = {
  set: (key, value) => {
    if (!window.localStorage) {
      return false;
    }
    window.localStorage.setItem(key, JSON.stringify(value));
  },
  get: key => {
    try {
      if (!window.localStorage) {
        return false;
      }
      var cacheVal = window.localStorage.getItem(key);
      var result = JSON.parse(cacheVal);
      var now = new Date() - 1;
      if (!result) {
        return null;
      }
      if (now > result.exp) {
        window.localStorage.removeItem(key);
        return '';
      }
      return result.val;
    } catch (e) {
      window.localStorage.removeItem(key);
      return null;
    }
  }
};

export const getPercent = (v1, v2, flag = true) => {
  if (BigNumber(v1).eq(0)) {
    return BigNumber(0);
  }
  if (BigNumber(v2).eq(0)) {
    return flag ? BigNumber(0) : BigNumber(100);
  }
  return BigNumber(v1).div(v2).times(100);
};

export const getJTokenLogo = (collateralSymbol, { prefixJ = false } = {}) => {
  if (prefixJ) {
    collateralSymbol = String(collateralSymbol).substring(1);
  }

  collateralSymbol = String(collateralSymbol).toLowerCase();
  let icons = '';
  try {
    icons = require(`../assets/images/icons/lend_${collateralSymbol.toLowerCase()}.svg`);
  } catch (error) {
    icons = require(`../assets/images/default.svg`);
  }
  return icons;
};

export const getLogo = symbol => {
  // if (symbol === 'JSTNEW') {
  //   symbol = 'JST';
  // }
  symbol = symbol.replace('NEW', '');
  symbol = String(symbol).toLowerCase();
  let icons = '';
  try {
    icons = require(`../assets/images/icons/${symbol.toLowerCase()}.png`);
  } catch (error) {
    try {
      icons = require(`../assets/images/icons/${symbol.toLowerCase()}.svg`);
    } catch (error) {
      icons = require(`../assets/images/default.svg`);
    }
  }
  return icons;
};

export const getLiquidJTokenLogo = collateralSymbol => {
  let icons = '';
  try {
    icons = require(`../assets/images/liquidate/jtoken-icons/${collateralSymbol}.png`);
  } catch (error) {
    try {
      icons = require(`../assets/images/liquidate/jtoken-icons/${collateralSymbol}.svg`);
    } catch (error) {
      icons = require(`../assets/images/default.svg`);
    }
  }
  return icons;
};

export const getLiquidLogo = symbol => {
  let icons = '';
  try {
    icons = require(`../assets/images/liquidate/icons/${symbol}.png`);
  } catch (error) {
    try {
      icons = require(`../assets/images/liquidate/icons/${symbol}.svg`);
    } catch (error) {
      icons = require(`../assets/images/default.svg`);
    }
  }
  return icons;
};

export const getGainNewAndOldForMarkets = (depositData, usertronbullishData, currency) => {
  try {
    if (!usertronbullishData) {
      return {
        gainNewAll: '--',
        gainLastAll: '--',
        tokenInfo: {},
        price: '--'
      };
    }
    let gainNewAll = BigNumber(0);
    let gainLastAll = BigNumber(0);
    let price = BigNumber(0);
    let tokenInfo = {};

    let depositDataKeys = Object.keys(depositData);
    // console.log('1189 depositDataKeys: ', depositDataKeys, usertronbullishData);
    depositDataKeys.map((item, index) => {
      // console.log('1191 usertronbullishData[item]: ', usertronbullishData[item]);
      // console.log('1192 currency: ', currency);
      if (usertronbullishData[item] && usertronbullishData[item][currency]) {
        tokenInfo[item] = {
          tokenAddress: item,
          tokenGainLastAll: BigNumber(0),
          tokenGainNewAll: BigNumber(0),
          tokenLastEndTime: '',
          tokenCurrEndTime: '',
          tokenMiningStatus: '',
          currRewardStatus: ''
        };

        gainNewAll = gainNewAll.plus(BigNumber(usertronbullishData[item][currency].gainNew));
        gainLastAll = gainLastAll.plus(BigNumber(usertronbullishData[item][currency].gainLast));
        // if (index == 0) {
        // console.log('1205 usertronbullishData[item][currency]: ', usertronbullishData[item][currency]);
        price = BigNumber(usertronbullishData[item][currency].price);
        // }

        // console.log(item, 10444435, usertronbullishData, currency);
        tokenInfo[item].tokenGainLastAll = tokenInfo[item].tokenGainLastAll.plus(
          BigNumber(usertronbullishData[item][currency].gainLast)
        );
        tokenInfo[item].tokenGainNewAll = tokenInfo[item].tokenGainNewAll.plus(
          BigNumber(usertronbullishData[item][currency].gainNew)
        );
        // console.log('1214 tokenInfo[item].tokenGainNewAll: ', tokenInfo[item].tokenGainNewAll.toString())
        if (
          tokenInfo[item].tokenLastEndTime == '' &&
          usertronbullishData[item][currency].lastEndTime != '' &&
          usertronbullishData[item][currency].lastEndTime != '1970-01-01 08:00'
        ) {
          let temp = new Date(usertronbullishData[item][currency].lastEndTime.replace(/-/g, '/')).getTime();
          temp = temp + Config.feManualExtensionTime;
          temp = new Date(temp).format('yyyy-MM-dd h:m');
          // tokenInfo[item].tokenLastEndTime = usertronbullishData[item][currency].lastEndTime;
          tokenInfo[item].tokenLastEndTime = temp;
        }
        if (
          tokenInfo[item].tokenCurrEndTime == '' &&
          usertronbullishData[item][currency].currEndTime != '' &&
          usertronbullishData[item][currency].currEndTime != '1970-01-01 08:00'
        ) {
          tokenInfo[item].tokenCurrEndTime = usertronbullishData[item][currency].currEndTime;
        }
        if (
          currency === 'USDDNEW' &&
          tokenInfo[item].tokenMiningStatus == '' &&
          usertronbullishData[item][currency].currEndTime != '' &&
          usertronbullishData[item][currency].currEndTime != '1970-01-01 08:00'
        ) {
          // console.log(currency, usertronbullishData[item][currency].miningStatus);
          tokenInfo[item].tokenMiningStatus = usertronbullishData[item][currency].miningStatus;
        }
        if (
          currency === 'USDDNEW' &&
          tokenInfo[item].currRewardStatus == '' &&
          usertronbullishData[item][currency].currEndTime != '' &&
          usertronbullishData[item][currency].currEndTime != '1970-01-01 08:00'
        ) {
          tokenInfo[item].currRewardStatus = usertronbullishData[item][currency].currRewardStatus;
        }
      }
      // console.log('tokenInfo: ', tokenInfo, 10711111111111)
    });
    return {
      gainNewAll,
      gainLastAll,
      tokenInfo,
      price
    };
  } catch (err) {
    console.log('err', err);
    return {
      gainNewAll: '--',
      gainLastAll: '--',
      tokenInfo: {},
      price: '--'
    };
  }
};

export const getGainNewAndOld = (depositData, usertronbullishData, currency) => {
  try {
    if (!usertronbullishData) {
      return {
        gainNewAll: '--',
        gainLastAll: '--',
        otherGainLastAll: '--',
        otherGainNewAll: '--',
        otherMiningStatus: '--',
        otherLastEndTime: '--',
        otherCurrEndTime: '--',
        USDDGainLastAll: '--',
        USDDGainNewAll: '--',
        USDDMiningStatus: '--',
        USDDLastEndTime: '--',
        USDDCurrEndTime: '--',
        currPhase: '--',
        price: '--'
      };
    }
    let gainNewAll = BigNumber(0);
    let gainLastAll = BigNumber(0);
    let otherGainLastAll = BigNumber(0);
    let otherGainNewAll = BigNumber(0);
    let USDDGainLastAll = BigNumber(0);
    let USDDGainNewAll = BigNumber(0);
    let price = BigNumber(0);
    let otherLastEndTime = '';
    let otherCurrEndTime = '';
    let otherMiningStatus = '';
    let USDDLastEndTime = '';
    let USDDCurrEndTime = '';
    let USDDMiningStatus = '';
    let currPhase = '';

    let depositDataKeys = Object.keys(depositData);
    depositDataKeys.map((item, index) => {
      if (usertronbullishData[item] && usertronbullishData[item][currency]) {
        gainNewAll = gainNewAll.plus(BigNumber(usertronbullishData[item][currency].gainNew));
        gainLastAll = gainLastAll.plus(BigNumber(usertronbullishData[item][currency].gainLast));
        if (index == 0) {
          price = BigNumber(usertronbullishData[item][currency].price);
        }

        if (Config.usddMintForLastMining.indexOf(item) === -1) {
          // if (Config.usddMint.indexOf(item) === -1) {
          otherGainLastAll = otherGainLastAll.plus(BigNumber(usertronbullishData[item][currency].gainLast));
          otherGainNewAll = otherGainNewAll.plus(BigNumber(usertronbullishData[item][currency].gainNew));
          if (
            otherLastEndTime == '' &&
            usertronbullishData[item][currency].lastEndTime != '' &&
            usertronbullishData[item][currency].lastEndTime != '1970-01-01 08:00'
          ) {
            otherLastEndTime = usertronbullishData[item][currency].lastEndTime;
          }
          if (
            otherCurrEndTime == '' &&
            usertronbullishData[item][currency].currEndTime != '' &&
            usertronbullishData[item][currency].currEndTime != '1970-01-01 08:00'
          ) {
            otherCurrEndTime = usertronbullishData[item][currency].currEndTime;
          }
          if (
            otherMiningStatus == '' &&
            usertronbullishData[item][currency].currEndTime != '' &&
            usertronbullishData[item][currency].currEndTime != '1970-01-01 08:00'
          ) {
            otherMiningStatus = usertronbullishData[item][currency].miningStatus;
          }
        } else {
          USDDGainLastAll = USDDGainLastAll.plus(BigNumber(usertronbullishData[item][currency].gainLast));
          USDDGainNewAll = USDDGainNewAll.plus(BigNumber(usertronbullishData[item][currency].gainNew));
          if (
            USDDLastEndTime == '' &&
            usertronbullishData[item][currency].lastEndTime != '' &&
            usertronbullishData[item][currency].lastEndTime != '1970-01-01 08:00'
          ) {
            USDDLastEndTime = usertronbullishData[item][currency].lastEndTime;
          }
          if (
            USDDCurrEndTime == '' &&
            usertronbullishData[item][currency].currEndTime != '' &&
            usertronbullishData[item][currency].currEndTime != '1970-01-01 08:00'
          ) {
            USDDCurrEndTime = usertronbullishData[item][currency].currEndTime;
          }
          if (
            USDDMiningStatus == '' &&
            usertronbullishData[item][currency].currEndTime != '' &&
            usertronbullishData[item][currency].currEndTime != '1970-01-01 08:00'
          ) {
            USDDMiningStatus = usertronbullishData[item][currency].miningStatus;
            currPhase = Number(usertronbullishData[item][currency].currPhase - 1);
          }
        }
      }
    });
    return {
      gainNewAll,
      gainLastAll,
      otherGainLastAll,
      otherGainNewAll,
      otherMiningStatus,
      otherLastEndTime,
      otherCurrEndTime,
      USDDGainLastAll,
      USDDGainNewAll,
      USDDMiningStatus,
      USDDLastEndTime,
      USDDCurrEndTime,
      price,
      currPhase
    };
  } catch (err) {
    console.log('err', err);
    return {
      gainNewAll: '--',
      gainLastAll: '--',
      price: '--'
    };
  }
};

export const getUserGain = (jtokenAddress, usertronbullishData, currency = 'USDDNEW') => {
  try {
    if (!usertronbullishData) {
      return {
        rewardUSD: '--',
        rewardToken: '--'
      };
    }
    let gainNewAll = BigNumber(0);
    let gainLastAll = BigNumber(0);
    let price = BigNumber(0);
    if (usertronbullishData[jtokenAddress] && usertronbullishData[jtokenAddress][currency]) {
      gainNewAll = gainNewAll.plus(BigNumber(usertronbullishData[jtokenAddress][currency].gainNew));
      gainLastAll = gainLastAll.plus(BigNumber(usertronbullishData[jtokenAddress][currency].gainLast));
      price = BigNumber(usertronbullishData[jtokenAddress][currency].price);
    }
    const rewardToken = BigNumber(gainLastAll).plus(gainNewAll);
    const rewardUSD = BigNumber(rewardToken).times(price);
    return {
      rewardUSD,
      rewardToken
    };
  } catch (err) {
    console.log('err', err);
    return {
      rewardUSD: '--',
      rewardToken: '--'
    };
  }
};

export const getTransferringSoonAndInFreezeAllMarkets = (currencyData = {}) => {
  let globalSettlementStatus = false;
  let globalSettlementStatusForLastRound = false;

  try {
    if (currencyData.length) {
      let transferringSoon = BigNumber(0);
      let inFreeze = BigNumber(0);

      let allMiningInfo = {};

      const tokenInfo = currencyData[0].tokenInfo;
      const data = Object.values(tokenInfo);
      // console.log("1437 source data: ", data);
      // console.log("1438 currencyData[0].price: ", currencyData[0].price.toString())
      data.map(item => {
        allMiningInfo[item.tokenAddress] = {
          tokenGainLastAll: BigNumber(0),
          tokenGainNewAll: BigNumber(0),
          tokenLastEndTime: '',
          tokenCurrEndTime: '',
          tokenMiningStatus: '',
          currRewardStatus: '',
          tokenAddress: item.tokenAddress
        };

        transferringSoon = BigNumber(currencyData[0].gainNew).times(currencyData[0].price);
        inFreeze = BigNumber(currencyData[0].gainLast).times(currencyData[0].price);
        allMiningInfo[item.tokenAddress].tokenGainLastAll = BigNumber(item.tokenGainLastAll).times(
          currencyData[0].price
        );
        allMiningInfo[item.tokenAddress].tokenGainNewAll = BigNumber(item.tokenGainNewAll).times(currencyData[0].price);
        // console.log('1455 allMiningInfo[item.tokenAddress].tokenGainNewAll: ', allMiningInfo[item.tokenAddress].tokenGainNewAll.toString())
        if (allMiningInfo[item.tokenAddress].tokenMiningStatus == '' && item.tokenMiningStatus != '') {
          allMiningInfo[item.tokenAddress].tokenMiningStatus = item.tokenMiningStatus;
          if (allMiningInfo[item.tokenAddress].tokenMiningStatus === '2') {
            // console.log(allMiningInfo[item.tokenAddress], 127444444);
            globalSettlementStatusForLastRound = true;
          }
        }
        if (allMiningInfo[item.tokenAddress].tokenLastEndTime == '' && item.tokenLastEndTime != '') {
          allMiningInfo[item.tokenAddress].tokenLastEndTime = item.tokenLastEndTime;
        }
        if (allMiningInfo[item.tokenAddress].tokenCurrEndTime == '' && item.tokenCurrEndTime != '') {
          allMiningInfo[item.tokenAddress].tokenCurrEndTime = item.tokenCurrEndTime;
        }
        if (allMiningInfo[item.tokenAddress].currRewardStatus == '' && item.currRewardStatus != '') {
          allMiningInfo[item.tokenAddress].currRewardStatus = item.currRewardStatus;
          if (allMiningInfo[item.tokenAddress].currRewardStatus === '2') globalSettlementStatus = true;
        }
      });

      return {
        transferringSoon,
        inFreeze,
        allMiningInfo,
        globalSettlementStatus,
        globalSettlementStatusForLastRound,
        transferringSoonNum: BigNumber(currencyData[0].gainNew),
        inFreezeNum: BigNumber(currencyData[0].gainLast)
      };
    } else {
      return {
        transferringSoon: '--',
        inFreeze: '--',
        allMiningInfo: {},
        globalSettlementStatus,
        transferringSoonNum: '--',
        inFreezeNum: '--'
      };
    }
  } catch (error) {
    console.log('getTransferringSoonOrInFreeze error:', error);
    return {
      transferringSoon: '--',
      inFreeze: '--',
      allMiningInfo: {},
      transferringSoonNum: '--',
      inFreezeNum: '--'
    };
  }
};

export const getTransferringSoonAndInFreeze = (currencyData = {}) => {
  try {
    if (currencyData.length) {
      let transferringSoon = BigNumber(0);
      let inFreeze = BigNumber(0);
      let otherGainLastAll = BigNumber(0);
      let otherGainNewAll = BigNumber(0);
      let USDDGainLastAll = BigNumber(0);
      let USDDGainNewAll = BigNumber(0);
      let otherMiningStatus = '';
      let otherCurrEndTime = '';
      let otherLastEndTime = '';
      let USDDMiningStatus = '';
      let USDDLastEndTime = '';
      let USDDCurrEndTime = '';
      let currPhase = '';
      // console.log('currencyData', currencyData);
      currencyData.map(item => {
        transferringSoon = transferringSoon.plus(BigNumber(item.gainNew).times(item.price));
        inFreeze = inFreeze.plus(BigNumber(item.gainLast).times(item.price));
        otherGainLastAll = otherGainLastAll.plus(BigNumber(item.otherGainLastAll).times(item.price));
        otherGainNewAll = otherGainNewAll.plus(BigNumber(item.otherGainNewAll).times(item.price));
        USDDGainLastAll = USDDGainLastAll.plus(BigNumber(item.USDDGainLastAll).times(item.price));
        USDDGainNewAll = USDDGainNewAll.plus(BigNumber(item.USDDGainNewAll).times(item.price));
        if (otherMiningStatus == '' && item.otherMiningStatus != '') {
          otherMiningStatus = item.otherMiningStatus;
        }
        if (otherLastEndTime == '' && item.otherLastEndTime != '') {
          otherLastEndTime = item.otherLastEndTime;
        }
        if (otherCurrEndTime == '' && item.otherCurrEndTime != '') {
          otherCurrEndTime = item.otherCurrEndTime;
        }
        if (USDDMiningStatus == '' && item.USDDMiningStatus != '') {
          USDDMiningStatus = item.USDDMiningStatus;
          currPhase = item.currPhase;
        }
        if (USDDLastEndTime == '' && item.USDDLastEndTime != '') {
          USDDLastEndTime = item.USDDLastEndTime;
        }
        if (USDDCurrEndTime == '' && item.USDDCurrEndTime != '') {
          USDDCurrEndTime = item.USDDCurrEndTime;
        }
      });
      return {
        transferringSoon,
        inFreeze,
        otherGainLastAll,
        otherGainNewAll,
        USDDGainLastAll,
        USDDGainNewAll,
        otherMiningStatus,
        otherLastEndTime,
        otherCurrEndTime,
        USDDMiningStatus,
        USDDLastEndTime,
        USDDCurrEndTime,
        currPhase
      };
    } else {
      return {
        transferringSoon: '--',
        inFreeze: '--',
        otherGainLastAll: '--',
        otherGainNewAll: '--',
        USDDGainLastAll: '--',
        USDDGainNewAll: '--',
        otherMiningStatus: '--',
        otherLastEndTime: '--',
        otherCurrEndTime: '--',
        USDDMiningStatus: '--',
        USDDLastEndTime: '--',
        USDDCurrEndTime: '--'
      };
    }
  } catch (error) {
    console.log('getTransferringSoonOrInFreeze error:', error);
    return {
      transferringSoon: '--',
      inFreeze: '--',
      otherGainLastAll: '--',
      otherGainNewAll: '--',
      USDDGainLastAll: '--',
      USDDGainNewAll: '--',
      otherMiningStatus: '--',
      otherLastEndTime: '--',
      otherCurrEndTime: '--',
      USDDMiningStatus: '--',
      USDDLastEndTime: '--',
      USDDCurrEndTime: '--'
    };
  }
};

export const getNetAPY = (depositData = [], lendData = [], assetList = []) => {
  try {
    if (depositData.length && Object.keys(assetList).length) {
      let deposit = bigNumber(0);
      let lend = bigNumber(0);
      let depositTotalUsd = bigNumber(0);
      // let usddDeposit = false;
      // let usddMint = bigNumber(0);

      depositData.map(item => {
        let cumulativeAPY = bigNumber(assetList[item.jtokenAddress].totalAPYNEW)
          .plus(assetList[item.jtokenAddress].totalAPYNEWUSDD)
          .plus(item.depositApy)
          .div(100);
        if (Config.holdingTokens.includes(item.collateralSymbol)) {
          const { totalApy } = getTotalApy(item, assetList);
          cumulativeAPY = BigNumber(totalApy).div(100);
        }
        depositTotalUsd = depositTotalUsd.plus(bigNumber(item.deposited_usd));
        deposit = deposit.plus(item.deposited_usd.times(cumulativeAPY));
        // if (item.collateralSymbol === miningSymbol) {
        //   usddDeposit = true;
        // }
        // console.log('deposit item: ', item, deposit.toString());
        // console.log('depositTotalUsd: ', depositTotalUsd.toString());
      });

      if (depositTotalUsd.eq(0)) {
        return 0;
      }

      if (lendData.length) {
        lendData.map(item => {
          lend = lend.plus(item.borrowBalanceNewUsd.times(item.lendApy.div(100)));
          // if (item.collateralSymbol === miningSymbol) {
          //   const { mintApyWithUSDD } = getTotalApy(item, assetList);
          //   let mintBalanceUSD = item.borrowBalanceNewUsd;
          //   if (BigNumber(item.borrowBalanceNewUsd).gt(item.deposited_usd)) mintBalanceUSD = item.deposited_usd;
          //   usddMint = mintBalanceUSD.times(mintApyWithUSDD.div(100));
          // }
          // console.log('lend item: ', lendData, item, item.deposited_usd.toString());
          // console.log('usddMint: ', usddMint.toString());
        });
      }
      // return deposit.minus(lend).minus(usddMint).div(depositTotalUsd);
      return deposit.minus(lend).div(depositTotalUsd);
    }
  } catch (error) {
    console.log('getNetAPY error:', error);
    return 0;
  }
};

export const getMiningRewards = (cardData, tronbullish, type = false, { gt0 = true } = {}, tokenPrices) => {
  try {
    let { pool, trxClaimed = 0, tokenClaimed = 0, giftKey } = cardData;

    // const claimed = trxClaimed.plus(tokenClaimed);
    if (tronbullish && tokenPrices) {
      trxClaimed = BigNumber(trxClaimed).isNaN() ? BigNumber(0) : BigNumber(trxClaimed).times(tokenPrices['trx']);
      tokenClaimed = BigNumber(tokenClaimed).isNaN() ? BigNumber(0) : BigNumber(tokenClaimed);

      const p = tronbullish[pool] || {};
      let miningRewards = BigNumber(0);
      giftKey.map(k => {
        let key = `${k.toUpperCase()}NEW`;
        let { gainNew = 0, gainLast = 0, price = 0 } = p[key] || {};
        const temp = BigNumber(gainNew).plus(gainLast).times(price);
        if (k === 'trx') {
          miningRewards = miningRewards.plus(temp).plus(trxClaimed);
        } else {
          miningRewards = miningRewards.plus(temp).plus(tokenClaimed.times(tokenPrices[k]));
        }
        // gainNew = BigNumber(gainNew).plus(claimed);
        // const temp = BigNumber(gainNew).plus(gainLast).times(price);
        // miningRewards = miningRewards.plus(temp);
        // if (key === 'NFTNEW') {
        //   miningRewards = '--';
        // }
      });

      return <>{formatNumberLend(miningRewards, Config.defaultDecimal, { needDolar: true, miniText: '0.001', gt0 })}</>;
    }
    return intl.get('tab.calculating');
  } catch (err) {
    console.log(err);
    return intl.get('tab.calculating');
  }
};

export const renderGain = (cardData, nowTime, tronbullish, { gt0 = true } = {}) => {
  const { start = Config.startTime } = cardData;
  return (
    cardData.gift &&
    cardData.gift.map((item, index) => {
      const { giftStart = Config.startTime, giftEnd = Config.endTime } = item;
      return (
        nowTime >= giftStart &&
        start <= giftEnd && (
          <div className="item flexB" key={index}>
            <div>
              <img src={ICONS_MAP[item.symbol.toLowerCase()]} alt="" />
              <span className="symbol">{item.symbol}</span>
            </div>
            <div>
              <span className="account">{getClaimed(cardData, tronbullish, item.symbol, 'swap', { gt0 })}</span>
            </div>
            <div>
              <span className="account">{getClaiming(cardData, tronbullish, item.symbol, { gt0 })}</span>
            </div>
          </div>
        )
      );
    })
  );
};

export const renderGiftIcon = (cardData, nowTime) => {
  return (
    <div>
      {cardData.gift &&
        cardData.gift.map(item => {
          const { giftStart = Config.startTime, giftEnd = Config.endTime } = item;
          if (nowTime >= giftStart && nowTime <= giftEnd) {
            return <img className="item-icon" src={ICONS_MAP[item.symbol.toLowerCase()]} key={item.symbol}></img>;
          }
          return <React.Fragment key={item.symbol}></React.Fragment>;
        })}
    </div>
  );
};

export const getPoolTotalAPY = (cardData, tronBull) => {
  // console.log(cardData, tronBull);
  try {
    const { pool, id, giftKey } = cardData;
    const { realStartTime } = Config;
    const nowTime = Date.now();
    if (tronBull) {
      const poolBull = tronBull[pool] || {};
      let totalAPY = BigNumber(0);
      giftKey.map(k => {
        let key = `${k.toUpperCase()}NEW`;
        if (!isNaN(poolBull[key])) {
          totalAPY = totalAPY.plus(poolBull[key]);
        }
      });
      totalAPY = totalAPY.times(100).times(1.2);
      if (totalAPY.lte(0) && nowTime > realStartTime) {
        return (
          <>
            {'> '}
            {Config.maxAPY}
            {'%'}
          </>
        );
      }
      if (totalAPY.gt(Config.maxAPY) && nowTime > realStartTime) {
        return (
          <>
            {'> '}
            {Config.maxAPY}
            {'%'}
          </>
        );
      }
      return (
        <>
          {formatNumber(totalAPY, 2, { per: true, miniText: '0.01', gt0: true })}
          {'%'}
        </>
      );
    }
    return '--';
  } catch (err) {
    return '--';
  }
};

export const getClaimed = (cardData, tronbullish, symbol, type = false, { gt0 = true } = {}) => {
  try {
    let { pool, trxClaimed = 0, tokenClaimed = 0 } = cardData;
    trxClaimed = BigNumber(trxClaimed).isNaN() ? BigNumber(0) : BigNumber(trxClaimed);
    tokenClaimed = BigNumber(tokenClaimed).isNaN() ? BigNumber(0) : BigNumber(tokenClaimed);
    const claimed = symbol === 'TRX' ? trxClaimed : tokenClaimed;
    symbol = `${symbol}NEW`;
    if (tronbullish) {
      let gain = BigNumber(tronbullish[pool][symbol].gainNew);
      gain = BigNumber(tronbullish[pool][symbol].gainNew).plus(claimed);
      return <>{formatNumberLend(gain, Config.defaultDecimal, { miniText: '0.001', gt0 })}</>;
    }
    return '--';
  } catch (err) {
    return '--';
  }
};

export const getClaiming = (cardData, tronbullish, symbol, { gt0 = true } = {}) => {
  try {
    const { pool } = cardData;
    symbol = `${symbol}NEW`;
    if (tronbullish) {
      return (
        <>
          {formatNumberLend(BigNumber(tronbullish[pool][symbol].gainLast), Config.defaultDecimal, {
            miniText: '0.001',
            gt0
          })}
        </>
      );
    }
    return '--';
  } catch (err) {
    return '--';
  }
};

export const formatNumberLend = (
  number,
  decimals = false,
  {
    cutZero = true,
    miniText = false,
    miniTextValue = miniText,
    needDolar = false,
    round = false,
    per = false,
    uint = false,
    gt0 = false
  } = {}
) => {
  if (number === '--') return '--';
  if (isNaN(number) && !gt0) return '--';

  if ((isNaN(number) || BigNumber(number).lte(0)) && gt0) {
    return `< ${needDolar ? '$' : ''}${miniText}`;
  }

  if ((BigNumber(number).lt(0) && uint) || BigNumber(number).eq(0)) {
    return `${needDolar ? '$' : ''}0`;
  }

  if (miniText || miniText === 0) {
    // if (BigNumber(number).gte(0) && BigNumber(number).lt(miniText)) {
    if (!BigNumber(number).gte(miniText)) {
      return `< ${needDolar ? '$' : ''}${miniTextValue ? miniTextValue : miniText}`;
    }
  }

  tronWeb.BigNumber.config({
    ROUNDING_MODE: tronWeb.BigNumber.ROUND_HALF_UP,
    FORMAT: {
      decimalSeparator: '.',
      groupSeparator: per ? '' : ',',
      groupSize: 3
    }
  });
  let object = toBigNumber(number);

  // If rounding, use BigNumber's .toFormat() method
  // if (round) return decimals ? object.toFormat(decimals) : object.toFormat();

  if (decimals || decimals === 0) {
    decimals = Number(decimals);
    const d = toBigNumber(10).pow(decimals);
    let property = tronWeb.BigNumber.ROUND_DOWN;
    if (round) {
      property = tronWeb.BigNumber.ROUND_HALF_UP;
    }
    object = object.times(d).integerValue(property).div(d).toFixed(decimals);
  } else {
    object = object.valueOf();
  }
  const parts = object.toString().split('.');
  if (cutZero) {
    parts[1] = parts[1] ? parts[1].replace(/0+?$/, '') : '';
  }

  let res = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (parts[1] ? `.${parts[1]}` : '');

  if (per) {
    res = parts[0] + (parts[1] ? `.${parts[1]}` : '');
  }

  if (isNaN(parseFloat(res))) {
    res = 0;
  }

  if (needDolar && (((miniText || miniText === 0) && BigNumber(number).gt(miniText)) || !miniText)) {
    res = '$' + res;
  }

  return res;
};

export const marketLendAvailable = item => {
  const { borrowLimit, totalBorrow, totalCash, collateralDecimal } = item;
  let totalCashValue = BigNumber(totalCash).div(BigNumber(10).pow(collateralDecimal));

  if (BigNumber(borrowLimit).eq(0) || BigNumber(borrowLimit).eq(-1)) return totalCashValue;

  let totalBorrowValue = BigNumber(totalBorrow).div(BigNumber(10).pow(collateralDecimal));
  let borrowValue = BigNumber(borrowLimit).minus(totalBorrowValue);
  borrowValue = BigNumber(borrowValue).lt(0) ? 0 : borrowValue;

  return BigNumber(totalCashValue).gt(borrowValue) ? borrowValue : totalCashValue;
};

export const setRiskValue = (
  value,
  decimals = false,
  {
    cutZero = true,
    miniText = false,
    miniTextValue = miniText,
    needDolar = false,
    round = false,
    per = false,
    uint = false
  } = {}
) => {
  if (BigNumber(value).gt(100)) {
    value = 100;
  }

  if (BigNumber(value).eq(0)) {
    return <span className="j-risk low-risk">0</span>;
  } else if (BigNumber(value).gte(0) && BigNumber(value).lt(60)) {
    return (
      <span className="j-risk low-risk">
        {formatNumber(value, decimals, { cutZero, miniText, miniTextValue, needDolar, round, per, uint })}
      </span>
    );
  } else if (BigNumber(value).gte(60) && BigNumber(value).lt(80)) {
    return (
      <span className="j-risk mid-risk">
        {formatNumber(value, decimals, { cutZero, miniText, miniTextValue, needDolar, round, per, uint })}
      </span>
    );
  } else if (BigNumber(value).gte(80)) {
    return (
      <span className="j-risk high-risk">
        {formatNumber(value, decimals, { cutZero, miniText, miniTextValue, needDolar, round, per, uint })}
      </span>
    );
  }
};

export const progressV2 = (from, to) => {
  if (BigNumber(to).isNaN()) {
    to = from;
  }

  if (BigNumber(from).gt(100)) {
    from = 100;
  }

  if (BigNumber(to).gt(100)) {
    to = 100;
  }

  return (
    <div className={'j-progress'}>
      <div style={{ width: from + '%' }}></div>
      <div style={{ width: to + '%' }}></div>
      <Tooltip
        overlayClassName="j-tooltip-dropdown"
        arrowPointAtCenter
        title={<span className="block tac">{intl.get('v2.risk_value') + ': 80'}</span>}
        placement="top"
        trigger="['hover','click']"
      >
        <span className="j-block block-red"></span>
      </Tooltip>
    </div>
  );
};

export const progressV2Old = (from, to) => {
  let max = from;
  let min = to;
  let classNames = '';

  if (!BigNumber(to).isNaN() && BigNumber(to).gt(from)) {
    [min, max] = [from, to];
  }

  if (BigNumber(max).gt(100)) {
    max = 100;
  }

  if (BigNumber(max).gt(0) && BigNumber(max).lt(60)) {
    classNames = 'low-risk';
  } else if (BigNumber(max).gte(60) && BigNumber(max).lt(80)) {
    classNames = 'mid-risk';
  } else if (BigNumber(max).gte(80)) {
    classNames = 'high-risk';
  }

  if (BigNumber(to).isNaN() || BigNumber(from).eq(to)) {
    return (
      <div className={'j-progress ' + classNames}>
        <div style={{ width: max + '%' }}></div>
        <Tooltip
          overlayClassName="j-tooltip-dropdown"
          arrowPointAtCenter
          title={intl.get('v2.risk_value') + ': 60'}
          placement="top"
          trigger="['hover','click']"
        >
          <span className="j-block block-blue"></span>
        </Tooltip>
        <Tooltip
          overlayClassName="j-tooltip-dropdown"
          arrowPointAtCenter
          title={intl.get('v2.risk_value') + ': 80'}
          placement="top"
          trigger="['hover','click']"
        >
          <span className="j-block block-red"></span>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className={'j-progress ' + classNames}>
      <div style={{ width: max + '%' }}></div>
      <div style={{ width: min + '%' }}></div>
      <Tooltip
        overlayClassName="j-tooltip-dropdown"
        arrowPointAtCenter
        title={intl.get('v2.risk_value') + ': 60'}
        placement="top"
        trigger="['hover','click']"
      >
        <span className="j-block block-blue"></span>
      </Tooltip>
      <Tooltip
        overlayClassName="j-tooltip-dropdown"
        arrowPointAtCenter
        title={intl.get('v2.risk_value') + ': 80'}
        placement="top"
        trigger="['hover','click']"
      >
        <span className="j-block block-red"></span>
      </Tooltip>
    </div>
  );
};

export const tooltip = (title, contentArr, linkObj) => {
  let lang = window.localStorage.getItem('lang') || 'en-US';
  return (
    <div className="j-tooltip-special">
      {title && <div className="special-title">{title}</div>}
      {contentArr.length > 0 &&
        contentArr.map((item, index) => {
          if (item.title) {
            return (
              <div className="special-ele" key={index}>
                <div className="s-title flex jcsb">
                  {item.title}
                  <span>{item.value}</span>
                </div>
                {item.content && <div className="s-content">{item.content}</div>}
                {item.iconContent &&
                  item.iconContent.map(({ content, icon }) => (
                    <div key={content}>
                      {content}
                      {icon && <img src={icon} alt="" className="s-icon" />}
                    </div>
                  ))}
                {item.link && (
                  <a className="link-button  hover" href={item.link} target={item.link}>
                    <span
                      className="link-button__text"
                      style={{ textWrap: 'no-wrap', width: lang === 'en-US' ? '62px' : 'auto' }}
                    >
                      {item.linkText}
                    </span>
                    <img src={item.linkIcon} alt="" className="arrow-icon" />
                  </a>
                )}
              </div>
            );
          } else {
            return null;
          }
        })}
      {linkObj && (
        <div className="special-ele">
          <a className="link-button  hover" href={linkObj.link} target={linkObj.link}>
            <span className="link-button__text">{linkObj.content}</span>
          </a>
        </div>
      )}
    </div>
  );
};

export const getTotalApy = (item, assetList) => {
  let depositApy = '--';
  let wstUSDTDepositApyWithIncrement = '--';
  let mintApy = '--';
  let mintApyUSDD = '--';
  let mintApyWithUSDD = '--';
  let totalApy = '--';
  let totalCash = '--';
  let underlyingIncrementApy = '--';
  // const miningStart = true;
  try {
    depositApy = item.depositedAPY ? BigNumber(item.depositedAPY).times(100) : getDepositApy(item);
    underlyingIncrementApy = item.underlyingIncrementApy ? BigNumber(item.underlyingIncrementApy).times(100) : 0;
    // if (miningStart) {

    //mintApy = assetList[item.jtokenAddress] ? assetList[item.jtokenAddress].totalAPYNEW : '--';
    mintApy = assetList[item.jtokenAddress] ? assetList[item.jtokenAddress].totalAPYNEWUSDD : '--';
    mintApyUSDD = assetList[item.jtokenAddress] ? assetList[item.jtokenAddress].totalAPYNEWUSDD : '--';
    mintApyWithUSDD = mintApyUSDD;
    totalCash = assetList[item.jtokenAddress]?.totalCash;

    // } else {
    //   mintApy = assetList[item.jtokenAddress] ? assetList[item.jtokenAddress].apy : '--';
    // }
    totalApy = depositApy;
    // if (mintApy !== '--') {
    //   totalApy = totalApy.plus(mintApy);
    // }
    if (Config.holdingTokens.includes(item.collateralSymbol)) {
      // totalApy = underlyingIncrementApy;
      // totalApy = BigNumber(underlyingIncrementApy).plus(depositApy);

      wstUSDTDepositApyWithIncrement = BigNumber(
        BigNumber(BigNumber(item.depositedAPY).plus(1)).times(BigNumber(item.underlyingIncrementApy).plus(1)).minus(1)
        // .plus(mintApyWithUSDD)
      ).times(100);
      totalApy = wstUSDTDepositApyWithIncrement;
    }
    if (mintApyUSDD !== '--' && !Config.hideMarketMintIcon.includes(item.collateralSymbol)) {
      // totalApy = totalApy.plus(mintApyUSDD);
      let totalApyPlus = BigNumber(formatNumber(totalApy, 2, { miniText: 0.01, per: true })).plus(
        formatNumber(mintApyUSDD, 2, { miniText: 0.01, per: true })
      );
      if (totalApyPlus.toString() === 'NaN') {
        totalApy = totalApy.plus(mintApyUSDD);
      } else {
        totalApy = totalApyPlus;
      }
      // console.log(totalApy.toString());
    }
  } catch (error) {
    console.log(`getTotalApy error:`, error);
  }

  return {
    depositApy,
    wstUSDTDepositApyWithIncrement,
    underlyingIncrementApy,
    mintApy,
    mintApyUSDD,
    mintApyWithUSDD,
    totalApy,
    totalCash
  };
};

export const tooltipSTRX = (depositApy, underlyingIncrementApy, mintApy, shouldShowMiningApyDetail) => {
  return (
    <div className="j-tooltip-special j-tooltip-special-wst">
      <div className="special-title">{intl.get('risk_tip.strx_apy')}</div>
      <div className="special-ele">
        <div className="s-title flex jcsb">
          {intl.get('risk_tip.strx_apy1')}
          <span>
            {' '}
            {BigNumber(depositApy).gt(0) ? formatNumber(depositApy, 2, { per: true, miniText: '0.01' }) + '%' : '--'}
          </span>
        </div>
        <div className="s-subcontent">{intl.get('risk_tip.strx_apy2')}</div>
        <div className="s-title flex jcsb">
          {intl.get('risk_tip.strx_apy3')}
          <span> {formatNumber(underlyingIncrementApy, 2, { per: true, miniText: '0.01' }) + '%'}</span>
        </div>
        <div className="s-subcontent">{intl.get('risk_tip.strx_apy4')}</div>
      </div>
      {shouldShowMiningApyDetail && (
        <div className="special-ele">
          <div className="s-title flex jcsb">
            {intl.get('wst.wst_tooltip_mining_apy', { miningSymbol })}
            <span> {formatNumber(mintApy, 2, { per: true, miniText: '0.01' }) + '%'}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export const tooltipNew = (depositApy, underlyingIncrementApy, mintApy, shouldShowMiningApyDetail) => {
  return (
    <div className="j-tooltip-special j-tooltip-special-wst">
      <div className="special-title">
        {intl.get('risk_tip.wstUSDT_apy')}
        {/* {shouldShowMiningApyDetail ? intl.get('wst.wst_tooltip1_with_mining') : intl.get('risk_tip.wstUSDT_apy')} */}
      </div>
      <div className="special-ele">
        {/* <div className="s-title">{intl.get('wst.wst_tooltip2')}</div> */}
        <div className="s-title flex jcsb">
          {intl.get('risk_tip.strx_apy1')}
          <span>
            {' '}
            {BigNumber(depositApy).gt(0) ? formatNumber(depositApy, 2, { per: true, miniText: '0.01' }) + '%' : '--'}
          </span>
        </div>
        <div className="s-subcontent">{intl.get('risk_tip.strx_apy2')}</div>
        <div className="s-title flex jcsb">
          {intl.get('risk_tip.wstUSDT_apy1')}
          <span> {formatNumber(underlyingIncrementApy, 2, { per: true, miniText: '0.01' }) + '%'}</span>
        </div>
        <div className="s-subcontent">{intl.get('risk_tip.wstUSDT_apy2')}</div>
      </div>
      {shouldShowMiningApyDetail && (
        <div className="special-ele">
          <div className="s-title flex jcsb">
            {intl.get('wst.wst_tooltip_mining_apy', { miningSymbol })}
            <span> {formatNumber(mintApy, 2, { per: true, miniText: '0.01' }) + '%'}</span>
          </div>
        </div>
      )}
      <div className="special-ele">
        <div className="s-content s-instruction">{intl.get('risk_tip.wstUSDT_apy3')}</div>
        <div className="s-subcontent s-item">{intl.get('risk_tip.wstUSDT_apy4')}</div>
        <div className="s-subcontent s-item">{intl.get('risk_tip.wstUSDT_apy5')}</div>
      </div>
    </div>
  );
};

export const isMobile = () => {
  return isMobileJs(window.navigator);
};

export const getQueryObj = query => {
  try {
    if (typeof query === 'undefined') {
      query = window.location.search;
    }
    const search = query.includes('?') ? query.split('?')[1] : query;
    if (!search.length) {
      return {};
    }
    const pairs = search.split('&').filter(v => v);
    return pairs.reduce((acc, cur) => {
      const [k, v] = cur.split('=');
      acc[decodeURIComponent(k)] = decodeURIComponent(v);
      return acc;
    }, {});
  } catch (e) {
    return {};
  }
};

export const getMaxAPY = (marketDataSource, assetList) => {
  try {
    let apy = BigNumber(0);
    marketDataSource.map(item => {
      const { mintApyWithUSDD } = getTotalApy(item, assetList);
      if (BigNumber(mintApyWithUSDD).gt(apy)) {
        apy = mintApyWithUSDD;
      }
    });
    return apy;
  } catch (err) {
    return '--';
  }
};

export const getTotalMint = (LendStore, forNewUSDDMining = false) => {
  try {
    const {
      transferringSoonNum,
      inFreezeNum,
      allMiningInfo,
      globalSettlementStatus,
      totalReward,
      USDDMiningStatus,
      totalRewardUSDDNEW,
      totalRewardUSDDOLD
    } = LendStore;
    let miniText = 0.00000001;
    let miniTextShow = 0.001;
    let needDolar = false;
    let decimal = 8;
    let roundMode = '';
    if (forNewUSDDMining) {
      miniText = 0.01;
      miniTextShow = 0.01;
      needDolar = true;
      decimal = 2;
      roundMode = 'ROUND_UP';
    }
    // if ((Object.keys(allMiningInfo).length > 0 && globalSettlementStatus) || Object.keys(allMiningInfo).length <= 0) {
    if (Object.keys(allMiningInfo).length <= 0) {
      if (BigNumber(totalReward).isNaN()) {
        return (
          <span className="fs24 fw500 countup-int">
            <span className="value-number">{'--'}</span>
          </span>
        );
      } else if (BigNumber(totalReward).lte(miniText)) {
        // console.log('rbd allMiningInfo: ', allMiningInfo)
        // console.log('rbd globalSettlementStatus: ', globalSettlementStatus)
        // console.log('rbd: ', totalReward.toString())
        return (
          <span className="fs24 fw500 countup-int">
            <span className="value-number">
              {needDolar ? '$' : ''}
              {BigNumber(totalReward).lt(miniText) ? '< ' : ''}
              {miniTextShow}
            </span>
          </span>
        );
      } else {
        // console.log('allMiningInfo: ', allMiningInfo)
        // console.log('globalSettlementStatus: ', globalSettlementStatus)
        return splitFormatNumber(
          // BigNumber(totalReward)._toFixed(decimal, 1),
          BigNumber(totalReward).decimalPlaces(decimal, BigNumber.ROUND_UP),
          formatNumber(totalReward, decimal, {
            cutZero: true,
            miniText,
            round: true,
            needDolar,
            roundMode,
            reverseMiniTextDolarSymbolOrder: true
          }),
          needDolar
        );
      }
    }

    let totalMiningrewards = '--';

    let gainNum = BigNumber(transferringSoonNum);
    if (USDDMiningStatus == 2) {
      gainNum = BigNumber(inFreezeNum).plus(transferringSoonNum);
    }

    if (gainNum.isNaN()) {
      if (BigNumber(totalReward).isNaN()) {
        return (
          <span className="fs24 fw500 countup-int">
            <span className="value-number">{'--'}</span>
          </span>
        );
      } else {
        totalMiningrewards = totalReward;
      }
    } else {
      if (BigNumber(totalReward).isNaN()) {
        totalMiningrewards = gainNum;
      } else {
        totalMiningrewards = gainNum.plus(totalReward);
      }
    }

    // let totalMiningrewards = gainNum.plus(totalReward);

    if (totalMiningrewards.gt(0) && Object.keys(allMiningInfo).length > 0) {
      let res = formatNumber(totalMiningrewards, decimal, {
        cutZero: true,
        miniText,
        round: true,
        needDolar,
        reverseMiniTextDolarSymbolOrder: true
      });

      // let totalMiningrewardsNew = BigNumber(totalMiningrewards)._toFixed(decimal, 1);
      let totalMiningrewardsNew = BigNumber(totalMiningrewards).decimalPlaces(decimal, BigNumber.ROUND_UP);
      return splitFormatNumber(totalMiningrewardsNew, res, needDolar);
    } else if (!totalMiningrewards.gt(0) && Object.keys(allMiningInfo).length > 0) {
      return (
        <span className="fs24 fw500 countup-int">
          <span className="value-number">
            {needDolar ? '$' : ''}
            {'0'}
          </span>
        </span>
      );
    } else {
      return (
        <span className="fs24 fw500 countup-int">
          <span className="value-number">{'--'}</span>
        </span>
      );
    }
  } catch (e) {
    return '--';
  }
};

export const getTotalMintStatus = LendStore => {
  try {
    const { transferringSoonNum, inFreezeNum, allMiningInfo, globalSettlementStatus, totalReward } = LendStore;
    if ((Object.keys(allMiningInfo).length > 0 && globalSettlementStatus) || Object.keys(allMiningInfo).length <= 0) {
      if (BigNumber(totalReward).isNaN()) {
        return false;
      } else if (BigNumber(totalReward).lte(0.00000001)) {
        return true;
      } else {
        return true;
      }
    }

    let totalMiningrewards = '--';

    if (BigNumber(inFreezeNum).plus(transferringSoonNum).isNaN()) {
      if (BigNumber(totalReward).isNaN()) {
        return false;
      } else {
        totalMiningrewards = totalReward;
      }
    } else {
      if (BigNumber(totalReward).isNaN()) {
        totalMiningrewards = BigNumber(inFreezeNum).plus(transferringSoonNum);
      } else {
        totalMiningrewards = BigNumber(inFreezeNum).plus(transferringSoonNum).plus(totalReward);
      }
    }
    if (totalMiningrewards.gt(0) && Object.keys(allMiningInfo).length > 0) {
      return true;
    } else if (!totalMiningrewards.gt(0) && Object.keys(allMiningInfo).length > 0) {
      return false;
    } else {
      return false;
    }
  } catch (e) {
    return false;
  }
};

export const splitFormatNumber = (toFixedData, originalData, needDolar = false) => {
  try {
    if (BigNumber(toFixedData).eq(0))
      return (
        <span className="fs24 fw500 countup-int">
          <span className="value-number">
            {needDolar ? '$' : ''}
            {'0'}
          </span>
        </span>
      );
    return BigNumber(toFixedData).lt(0.001) ? (
      <span className="fs24 fw500 countup-int">
        <span className="value-number">
          {needDolar ? '$' : ''}
          {'< 0.001'}
        </span>
      </span>
    ) : BigNumber(toFixedData).lt(0.01) ? (
      <span className="fs24 fw500 countup-int">
        <span className="value-number">
          {needDolar ? '$' : ''}
          {'< 0.01'}
        </span>
      </span>
    ) : BigNumber(toFixedData).lte(0.1) ? (
      <>
        <span className="fs24 fw500 countup-int">
          <span className="value-number">{originalData.split('.')[0]}</span>
        </span>
        <span className="countup-decimal">
          <span className="value-number">
            {toFixedData !== '--' &&
              (originalData.split('.')[1] && originalData.split('.')[1].length > 0 ? '.' : '') +
                originalData.split('.')[1]}
          </span>
        </span>
      </>
    ) : (
      <>
        <span className="fs24 fw500 countup-int">
          <CountUp
            className="value-number"
            start={0}
            duration={1}
            redraw={true}
            separator=","
            decimal="."
            prefix={needDolar ? '$' : ''}
            end={BigNumber(BigNumber(toFixedData).toString().split('.')[0]).toNumber()}
          />
        </span>

        {toFixedData !== '--' && originalData.split('.')[1] && originalData.split('.')[1].length > 0 && (
          <span className="countup-decimal">
            {'.'}
            {/^0/.test(originalData.split('.')[1]) ? (
              <span className="value-number">{BigNumber(toFixedData).toString().split('.')[1]}</span>
            ) : (
              <CountUp
                className="value-number"
                start={0}
                duration={1}
                redraw={true}
                end={BigNumber(BigNumber(toFixedData).toString().split('.')[1]).toNumber()}
              />
            )}
          </span>
        )}
      </>
    );
  } catch (e) {
    return '--';
  }
};

export const addToTronlink = async address => {
  // window.tron.tronWeb !== window.tronWeb
  const walletTronWeb = window.tronWeb;
  if (walletTronWeb && walletTronWeb.defaultAddress?.base58) {
    await walletTronWeb.request({
      method: 'wallet_watchAsset',
      params: { type: 'trc20', options: { address } }
    });
  }
};

export const getWalletTronWeb = () => {
  return window.tron?.tronWeb || window.tronLink?.tronWeb || window.tronWeb || window?.okxwallet?.tronLink?.tronWeb;
};

export const transferTime = n => {
  var timestamp = n ? BigNumber(n).toNumber() : new Date().getTime();
  const now = Date.now();
  const duration = (timestamp - now) / 1000;
  const days = Math.floor(duration / 60 / 60 / 24);
  const hours = Math.floor((duration / 60 / 60) % 24);
  const mins = Math.floor((duration / 60) % 60);
  const seconds = Math.floor(duration % 60);

  return {
    days,
    hours,
    mins,
    seconds
  };
};

export const formatTime = n => {
  var timestamp = n ? BigNumber(n).toNumber() : new Date().getTime();
  let date = new Date(timestamp);
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  month = month < 10 ? '0' + month : month;
  let day = date.getDate();
  day = day < 10 ? '0' + day : day;
  let h = date.getHours();
  h = h < 10 ? '0' + h : h;
  let m = date.getMinutes();
  m = m < 10 ? '0' + m : m;
  return year + '.' + month + '.' + day + ' ' + h + ':' + m;
};

export function goToPage(pageHashRouter, target = '_self') {
  const { origin, pathname, search } = window.location;
  const url = `${origin}/${pageHashRouter}${search}`;
  window.open(url, target);
}

export const goToMarketDetailPage = jtokenAddress => {
  let { origin, pathname, search } = window.location;
  let lang = window.localStorage.getItem('lang') || 'en-US';
  let params = new URLSearchParams(search);
  let paramName = 'lang';
  let paramValue = lang;
  if (params.has(paramName)) {
    params.set(paramName, paramValue);
  } else {
    params.append(paramName, paramValue);
  }
  search = params.toString();
  // if (search.indexOf('?') === 0) {
  //   search = '&' + search.slice(1);
  // }
  const url = `${origin}/${`marketDetailNew?jtokenAddress=${jtokenAddress}&_from=${pathname}&`}${search}`;
  window.open(url, '_self');
};

export const isWhiteAccount = accountAddress => {
  if (Config.whiteAccounts.includes(accountAddress)) {
    return true;
  }
  return false;
};

export const marketListSort = marketDataSource => {
  const { hideMarketMap } = Config;
  let activeMarketList = [],
    hiddenMarketList = [],
    fullMarketList = [];

  marketDataSource.forEach(item => {
    if (Config.hideMarketList.includes(item.collateralSymbol.toUpperCase())) {
      hiddenMarketList[hideMarketMap[item.collateralSymbol]] = item;
    } else {
      activeMarketList.push(item);
    }
  });

  fullMarketList = activeMarketList.concat(hiddenMarketList);

  return {
    activeMarketList,
    hiddenMarketList,
    fullMarketList
  };
};

export const addThousandSeparators = value => {
  if (BigNumber(value).isNaN()) {
    return value;
  } else {
    const parts = value.toString().split('.');
    const haveDot = value.toString().indexOf('.') > -1;

    return (
      parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (haveDot ? '.' : '') + (haveDot && parts[1] ? parts[1] : '')
    );
  }
};

export const removeThousandSeparators = value => {
  return value.replace(/\$\s?|(,*)/g, '');
};

export const trimNumberAfterDecimalPlace = (value, dp) => {
  const parts = value.toString().split('.');
  const haveDot = value.toString().indexOf('.') > -1;

  return parts[0] + (dp > 0 && haveDot ? '.' : '') + (haveDot && parts[1] ? parts[1].slice(0, dp) : '');
};

export const skeletonRender = ({ title = false, rows = 1, width = '100%' } = {}) => {
  return <Skeleton title={title} paragraph={{ rows, width }} active />;
};

export const getBrowserInfo = () => {
  var userAgent = navigator.userAgent;
  var appInfo = {
    userAgent: userAgent,
    isMobile: /Mobile|Android|iP(hone|od|ad)|IEMobile|BlackBerry|Opera Mini/i.test(userAgent),
    isDesktop: !/Mobile|Android|iP(hone|od|ad)|IEMobile|BlackBerry|Opera Mini/i.test(userAgent)
  };

  if (/FBAV|FBAN/.test(userAgent)) {
    appInfo.appName = 'Facebook';
  } else if (/Instagram/.test(userAgent)) {
    appInfo.appName = 'Instagram';
  } else if (/WhatsApp/.test(userAgent)) {
    appInfo.appName = 'WhatsApp';
  } else if (/Twitter/.test(userAgent)) {
    appInfo.appName = 'Twitter';
  } else if (/TikTok/.test(userAgent)) {
    appInfo.appName = 'TikTok';
  } else if (/imToken/.test(userAgent)) {
    appInfo.appName = 'imToken Wallet';
  } else if (/TronLink/.test(userAgent)) {
    appInfo.appName = 'TronLink Wallet';
  } else {
    appInfo.appName = 'Unknown';
  }

  if (/Windows/.test(userAgent)) {
    appInfo.platform = 'Windows';
    if (/Edge/.test(userAgent)) {
      appInfo.browser = 'Microsoft Edge';
    } else if (/Chrome/.test(userAgent)) {
      appInfo.browser = 'Google Chrome';
    } else if (/Firefox/.test(userAgent)) {
      appInfo.browser = 'Mozilla Firefox';
    } else if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) {
      appInfo.browser = 'Safari';
    } else {
      appInfo.browser = 'Unknown Windows Browser';
    }
  } else if (/Macintosh|Mac OS X/.test(userAgent)) {
    appInfo.platform = 'Mac';
    if (/Edge/.test(userAgent)) {
      appInfo.browser = 'Microsoft Edge';
    } else if (/Chrome/.test(userAgent)) {
      appInfo.browser = 'Google Chrome';
    } else if (/Firefox/.test(userAgent)) {
      appInfo.browser = 'Mozilla Firefox';
    } else if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) {
      appInfo.browser = 'Safari';
    } else {
      appInfo.browser = 'Unknown Mac Browser';
    }
  } else {
    appInfo.platform = 'Unknown';
    appInfo.browser = 'Unknown';
  }

  return appInfo;
};

export const calcCurrentPhaseDisplay = currPhase => {
  try {
    let basePhase = rewardbBasePhaseForNewPeriod;
    if (!currPhase || currPhase === '--' || !BigNumber(currPhase)?.gte(basePhase)) return currPhase;
    let subPhase = BigNumber(currPhase).minus(basePhase).mod(4).plus(1);
    let suffixPhase = toFixedDown(BigNumber(currPhase).minus(basePhase).div(4), 0);
    // console.log('calcCurrentPhaseDisplay result: ', BigNumber(basePhase).plus(suffixPhase).toString() + '-' + subPhase.toString());
    return BigNumber(basePhase).plus(suffixPhase).toString() + '-' + subPhase.toString();
  } catch (error) {
    console.log('calcCurrentPhaseDisplay error: ', error);
  }
};
