import React from 'react';
import isMobile from 'ismobilejs';
import { inject, observer } from 'mobx-react';
import {
  formatNumber,
  BigNumber,
  renderBalance,
  numberParser,
  gtBalance,
  renderPercent,
  renderProgress,
  getPercent,
  checkCash,
  getTotalApy,
  amountFormat,
  marketLendAvailable,
  progressV2,
  setRiskValue,
  addThousandSeparators,
  removeThousandSeparators
} from '../../../utils/helper';
import { Modal, Tabs, Input, Button, Tooltip, Progress, Select, Spin } from 'antd';
import intl from 'react-intl-universal';
import Config from '../../../config';

import WstusdtInput from './WstusdtInput';

// import '../../../assets/css/modal.scss';
import defaultIcon from '../../../assets/images/default.svg';
import ApproveIcon from '../../../assets/images/v2/approve-icon.svg';
import ApproveIconWhite from '../../../assets/images/v2/white-theme/approve-icon.svg';
import warningImg from '../../../assets/images/warning-triangle.svg';
import NoRepayIcon from '../../../assets/images/v2/no-repay-icon.png';
import NoRepayIconWhite from '../../../assets/images/v2/white-theme/no-repay-icon.svg';
import { getCash, MAX_UINT256 } from '../../../utils/blockchain';
import { getLendIcons } from '../../../utils/constant';
const { Option } = Select;
const { TabPane } = Tabs;
const { jtrxAddress } = Config;

@inject('network')
@inject('lend')
@inject('system')
@observer
class Borrow extends React.Component {
  constructor() {
    super();
    this.timerInterval = null;
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      borrowValue: '', // borrow input value
      repayValue: '', // repay input value
      approving: false,
      errInfo1: {
        btnText: '',
        status: false
      },
      errInfo2: {
        btnText: '',
        status: false
      },
      isClear: false,
      poolCash: null,
      totalBorrowUsdAfter: '',
      totalRepayUsdAfter: '',
      totalRepayAfter: '',
      trxFee: '',
      maxValue: -1,
      wstUSDTInputValue: '',
      wstUSDTSelectedToken: 'wstusdt',
      mobile: isMobile(window.navigator).any
    };
  }

  componentDidMount = () => {
    this.startInterval();

    const { totalBorrowUsdForUSDD } = this.props.lend;
    this.setState({
      totalBorrowUsdAfter: totalBorrowUsdForUSDD,
      totalRepayUsdAfter: totalBorrowUsdForUSDD
    });
    document.body.style.overflow = 'hidden';
  };

  componentWillUnmount() {
    clearInterval(this.timerInterval);
    this.timerInterval = null;
    document.body.style.overflow = 'auto';
  }

  getCash = async () => {
    try {
      const { borrowModalInfo, userList, marketList } = this.props.lend;
      const { jtokenAddress } = borrowModalInfo;
      if (jtokenAddress) {
        const { balance = 0, success } = await getCash(jtokenAddress);
        if (success) {
          this.state.poolCash = BigNumber(balance);
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  startInterval = async () => {
    if (!this.timerInterval) {
      await this.getCash();
      this.timerInterval = setInterval(async () => {
        await this.getCash();
      }, 3000);
    }
  };

  componentDidUpdate(prevProps, prevState) {
    if (!BigNumber(prevProps.lend.borrowLimit).eq(this.props.lend.borrowLimit)) {
      if (Number(this.props.lend.borrowModalInfo.type) === 1) {
        return this.onChangeBorrow(this.state.borrowValue);
      }
      if (Number(this.props.lend.borrowModalInfo.type) === 2) {
        return this.onChangeRepay(this.state.repayValue);
      }
    }
  }

  selectMax = maxValue => {
    let safeMaxRate = 1;
    if (maxValue == 1) {
      safeMaxRate = 0.9;
    } else {
      safeMaxRate = 0.8;
    }
    this.setState({ maxValue });
    this.clickSafeMax(safeMaxRate);
  };

  clickSafeMax = safeMaxRate => {
    // BigNumber(totalBorrowUsdAfter).div(borrowLimit) = 0.8
    const { borrowModalInfo, userList, marketList } = this.props.lend;
    const { jtokenAddress } = borrowModalInfo;
    const popData = userList[jtokenAddress] || marketList[jtokenAddress];
    const trxAssetPrice = userList[jtrxAddress]?.assetPrice || marketList[jtrxAddress]?.assetPrice;

    try {
      const { borrowLimit, totalBorrowUsdForUSDD, trxPrice } = this.props.lend;
      const {
        precision,
        collateralFactor,
        assetPrice,
        collateralDecimal,
        jtokenAddress,
        account_entered,
        deposited,
        deposited_usd
      } = popData;
      let borrowLimit2 = borrowLimit;

      if (account_entered === 0) {
        if (jtokenAddress === Config.usddJtoken || jtokenAddress === Config.usddoldJtoken) {
          borrowLimit2 = BigNumber(borrowLimit2).plus(
            BigNumber(deposited).times(collateralFactor).div(Config.tokenDefaultPrecision)
          );
        } else {
          borrowLimit2 = BigNumber(borrowLimit2).plus(
            BigNumber(deposited_usd).times(collateralFactor).div(Config.tokenDefaultPrecision)
          );
        }
      }

      // const totalBorrowUsdAfter = BigNumber(borrowLimit2).times(Config.safeMaxRate);
      const totalBorrowUsdAfter = BigNumber(borrowLimit2).times(safeMaxRate);
      let borrowValue = BigNumber(0);

      if (jtokenAddress === Config.usddJtoken || jtokenAddress === Config.usddoldJtoken) {
        borrowValue = BigNumber(totalBorrowUsdAfter).minus(totalBorrowUsdForUSDD);
      } else {
        borrowValue = totalBorrowUsdAfter
          .minus(totalBorrowUsdForUSDD)
          .times(Config.tokenDefaultPrecision)
          .div(assetPrice)
          // .times(Config.tokenDefaultPrecision)
          .times(
            BigNumber(trxAssetPrice).gte(Config.oraclePricePrecision)
              ? Config.oraclePricePrecision
              : Config.tokenDefaultPrecision
          )
          .div(trxPrice)
          .times(Config.defaultPrecision)
          .div(precision);
      }

      borrowValue = borrowValue.lt(0) ? 0 : borrowValue._toFixed(collateralDecimal, 1);
      this.setState(
        {
          borrowValue,
          totalBorrowUsdAfter
        },
        () => {
          this.onChangeBorrow(borrowValue);
        }
      );
    } catch (err) {
      console.log('clickSafeMax: ', err);
    }
  };

  onChangeBorrow = async (inputValue, maxValue = this.state.maxValue) => {
    try {
      this.props.system.clearRejectError();

      const {
        borrowModalInfo,
        userList,
        marketList,
        totalBorrowUsdForUSDD,
        borrowLimit,
        totalBorrowValueInTrx,
        totalCollateralValueInTrx
      } = this.props.lend;
      const { jtokenAddress } = borrowModalInfo;
      const popData = userList[jtokenAddress] || marketList[jtokenAddress];
      const { valid, str } = numberParser(inputValue, popData.collateralDecimal);
      const { collateralDecimal, borrowPaused } = popData;
      const totalCashNew = marketLendAvailable(marketList[jtokenAddress]);
      const trxAssetPrice = userList[jtrxAddress]?.assetPrice || marketList[jtrxAddress]?.assetPrice;

      if (valid) {
        const totalBorrowUsdAfter = str === '' ? totalBorrowUsdForUSDD : this.getTotalBorrowUsdAfter(str);
        this.setState({
          borrowValue: str,
          totalBorrowUsdAfter
        });
        let status = this.state.errInfo1.status;
        let btnText = this.state.errInfo1.btnText;

        const value = BigNumber(str);

        let borrowLimit2 = borrowLimit;

        if (popData.account_entered === 0) {
          if (popData.jtokenAddress === Config.usddJtoken || popData.jtokenAddress === Config.usddoldJtoken) {
            borrowLimit2 = BigNumber(borrowLimit2).plus(
              BigNumber(popData.deposited).times(popData.collateralFactor).div(Config.tokenDefaultPrecision)
            );
          } else {
            borrowLimit2 = BigNumber(borrowLimit2).plus(
              BigNumber(popData.deposited_usd).times(popData.collateralFactor).div(Config.tokenDefaultPrecision)
            );
          }
        }

        let extraLimitInTrx =
          popData.account_entered === 0
            ? BigNumber(popData.deposited)
                .times(popData.assetPrice)
                .times(BigNumber(10).pow(popData.collateralDecimal))
                // .div(BigNumber(10).pow(24)) // 6 + 18
                .div(Config.defaultPrecision)
                .div(
                  BigNumber(trxAssetPrice).gte(Config.oraclePricePrecision)
                    ? Config.oraclePricePrecision
                    : Config.tokenDefaultPrecision
                )
                .times(popData.collateralFactor)
                .div(Config.tokenDefaultPrecision)
            : 0;

        const per2 = BigNumber(totalBorrowValueInTrx)
          .plus(
            BigNumber(str)
              .times(popData.assetPrice)
              .times(BigNumber(10).pow(popData.collateralDecimal))
              // .div(BigNumber(10).pow(24)) // 6 + 18
              .div(Config.defaultPrecision)
              .div(
                BigNumber(trxAssetPrice).gte(Config.oraclePricePrecision)
                  ? Config.oraclePricePrecision
                  : Config.tokenDefaultPrecision
              )
          )
          .div(BigNumber(totalCollateralValueInTrx).plus(extraLimitInTrx))
          // .div(totalCollateralValueInTrx)
          .times(100);

        if (value.isNaN() || value.eq(0)) {
          status = false;
          btnText = '';
          // btnText = intl.get('borrow.enter_amount');
        } else if (BigNumber(per2).gte(100)) {
          if (BigNumber(totalCollateralValueInTrx).eq(0)) {
            status = false;
            btnText = intl.get('v2.tip27');
          } else {
            status = false;
            btnText = intl.get('withdraw.Insufficient_mortgage');
          }
        } else if (BigNumber(value).gt(totalCashNew)) {
          status = false;
          btnText = intl.get('lend_lack');
        } else if (maxValue == 1) {
          status = true;
          btnText = intl.get('v2.tip20');
        } else {
          status = true;
          // btnText = intl.get('borrow.borrow');
          btnText = '';
        }
        this.setState({
          errInfo1: {
            status,
            btnText
          }
        });
      }
    } catch (err) {
      console.log('onChangeBorrow ', err);
    }
  };

  getUsd = (value, trxPrice, item, isRepay) => {
    let { precision, assetPrice, collateralFactor } = item;
    collateralFactor = BigNumber(item.collateralFactor).div(Config.tokenDefaultPrecision);

    const { userList, marketList } = this.props.lend;
    const trxAssetPrice = userList[jtrxAddress]?.assetPrice || marketList[jtrxAddress]?.assetPrice;
    // return [Config.usddJtoken, Config.usdtJtoken, Config.tusdJtoken, Config.usdcJtoken].includes(item.jtokenAddress)
    return item.jtokenAddress === Config.usddJtoken || item.jtokenAddress === Config.usddoldJtoken
      ? BigNumber(value)
      : isRepay
      ? BigNumber(value)
          .times(precision)
          .times(assetPrice)
          .times(trxPrice)
          .div(Config.tokenDefaultPrecision)
          // .div(Config.tokenDefaultPrecision)
          .div(
            BigNumber(trxAssetPrice).gte(Config.oraclePricePrecision)
              ? Config.oraclePricePrecision
              : Config.tokenDefaultPrecision
          )
          .div(Config.defaultPrecision)
      : BigNumber(value)
          .times(precision)
          // .times(collateralFactor)
          .times(assetPrice)
          .times(trxPrice)
          .div(Config.tokenDefaultPrecision)
          // .div(Config.tokenDefaultPrecision)
          .div(
            BigNumber(trxAssetPrice).gte(Config.oraclePricePrecision)
              ? Config.oraclePricePrecision
              : Config.tokenDefaultPrecision
          )
          .div(Config.defaultPrecision);
  };

  getTotalBorrowUsdAfter = (value = 0, isRepay) => {
    try {
      const { borrowModalInfo, userList, marketList, totalBorrowUsdForUSDD, trxPrice } = this.props.lend;
      const { jtokenAddress } = borrowModalInfo;
      const item = userList[jtokenAddress] || marketList[jtokenAddress];
      let totalusd = this.getUsd(value, trxPrice, item, isRepay);

      return isRepay
        ? BigNumber(totalBorrowUsdForUSDD).minus(totalusd)
        : BigNumber(totalBorrowUsdForUSDD).plus(totalusd);
    } catch (err) {
      console.log('getTotalBorrowUsdAfter ', err);
    }
  };

  onChangeRepay = (inputValue, fromInput = false) => {
    try {
      this.props.system.clearRejectError();

      const { borrowModalInfo, userList, marketList, totalBorrowUsdForUSDD, balanceInfo } = this.props.lend;
      const { jtokenAddress } = borrowModalInfo;
      const popData = userList[jtokenAddress] || marketList[jtokenAddress];
      const { precision, collateralSymbol = '', borrowBalanceNew = 0, collateralDecimal } = popData;
      const { valid, str } = numberParser(inputValue, popData.collateralDecimal);
      if (valid) {
        const isClear = this.state.isClear;
        const totalRepayUsdAfter = str === '' ? totalBorrowUsdForUSDD : this.getTotalBorrowUsdAfter(str, true);

        this.setState({
          isClear: fromInput ? false : isClear,
          repayValue: str
        });
        if (inputValue != 0) {
          this.setState({ totalRepayUsdAfter });
        }
        const borrowBalanceNewValue = BigNumber(borrowBalanceNew).div(precision);
        const { balance } = balanceInfo[jtokenAddress] || {};
        const value = BigNumber(str);
        let status = this.state.errInfo2.status;
        let btnText = this.state.errInfo2.btnText;
        if (value.gte(0) && BigNumber(borrowBalanceNewValue).lte(0)) {
          status = false;
          btnText = intl.get('repay.no_debt');
        } else if (value.isNaN() || value.eq(0)) {
          status = false;
          btnText = '';
          // btnText = intl.get('repay.enter_amount');
        } else if (value.gt(borrowBalanceNewValue)) {
          status = false;
          btnText = intl.get('repay.exceeded_amount_borrowed');
        } else if (gtBalance(value, balance, precision)) {
          status = false;
          btnText = intl.get('repay.Insufficient_wallet_balance');
        } else {
          status = true;
          btnText = '';
          // btnText = intl.get('repay.repay');
        }
        if (status && !this.state.trxFee && collateralSymbol === 'TRX') {
          this.getRepayBorrowFee(str);
        }

        this.setState({
          errInfo2: {
            status,
            btnText
          }
        });
      }
    } catch (err) {
      console.log('onChangeRepay ', err);
    }
  };

  toBorrow = async () => {
    window.gtag('event', 'PC_borrow_modal_borrow_button', {
      'event_category': 'PC_V1.5',
      'event_label': 'borrow_modal_borrow_button'
    });
    this.props.system.clearRejectError();

    const { borrowValue } = this.state;
    const { jtokenAddress } = this.props.lend.borrowModalInfo;
    const { marketList } = this.props.lend;
    const popData = marketList[jtokenAddress];

    if (!this.props.lend.collateralValid(popData.collateralSymbol)) return;

    // console.log(popData);
    const intlObj = {
      title: 'v2.transaction_confirm',
      title2: 'deposit.transactionsent',
      title3: 'v2.transaction_confirm_fail',
      title4: 'deposit.confirm_transaction',
      obj: {
        value: borrowValue,
        token: popData.collateralSymbol
      },
      transType: 'borrow'
    };
    this.setState({ approving: true });

    const amount = new BigNumber(borrowValue).times(popData.precision)._toHex();
    const contractAddress = popData.jtokenAddress;
    let funcSelector = 'borrow(uint256)';
    let parameters = [{ type: 'uint256', value: amount }];
    const feeLimit = await this.props.system.getFeeLimitCommon(contractAddress, funcSelector, parameters);
    const options = { feeLimit };

    const txID = await this.props.system.borrow(popData, amount, intlObj, options);
    if (txID) {
      window.gtag('event', 'PC_borrow_modal_borrow_success', {
        'event_category': 'PC_V1.5',
        'event_label': 'borrow_modal_borrow_success'
      });
      setTimeout(() => {
        this.props.lend.getTokenBalanceInfo();
      }, 5000);
    }
    this.setState({ approving: false });
  };

  maxRender = popData => {
    return (
      <span
        className="pointer"
        onClick={() => {
          this.selectMax(2, popData);
        }}
      >
        {intl.get('v2.max_safe')}
      </span>
    );

    // const { maxValue } = this.state;
    // return (
    //   <Select
    //     value={maxValue === -1 ? intl.get('v2.max_safe') : maxValue}
    //     onChange={this.selectMax}
    //     className="select-max"
    //     dropdownClassName="select-max-dropdown"
    //     getPopupContainer={() => document.querySelector('.j-wrapper')}
    //   >
    //     <Option value="1">{intl.get('limit_amount1')}</Option>
    //     <Option value="2">{intl.get('limit_amount')}</Option>
    //   </Select>
    // );
  };

  renderBorrow = () => {
    const {
      totalBorrowUsd,
      borrowLimit,
      borrowModalInfo,
      userList,
      marketList,
      totalBorrowUsdForUSDD,
      risk,
      totalBorrowValueInTrx,
      totalCollateralValueInTrx,
      userDataSource,
      userDepositDataSource,
      theme,
      noService,
      riojBalance
    } = this.props.lend;
    const { isConnected } = this.props.network;
    const {
      totalBorrowUsdAfter,
      borrowValue,
      errInfo1: { status, btnText },
      maxValue,
      approving,
      lang
    } = this.state;

    const { jtokenAddress } = borrowModalInfo;
    const popData = userList[jtokenAddress] || marketList[jtokenAddress];
    const totalCashNew = marketLendAvailable(marketList[jtokenAddress]);
    const { precision, collateralSymbol = '', borrowBalanceNew } = popData;
    const borrowBalanceNewValue = borrowBalanceNew ? borrowBalanceNew.div(precision) : BigNumber(0);
    const trxAssetPrice = userList[jtrxAddress]?.assetPrice || marketList[jtrxAddress]?.assetPrice;
    // let borrowLimit1 = borrowLimit;
    let borrowLimit2 = borrowLimit;

    if (popData.account_entered === 0) {
      if (popData.jtokenAddress === Config.usddJtoken || popData.jtokenAddress === Config.usddoldJtoken) {
        borrowLimit2 = BigNumber(borrowLimit2).plus(
          BigNumber(popData.deposited).times(popData.collateralFactor).div(Config.tokenDefaultPrecision)
        );
      } else {
        borrowLimit2 = BigNumber(borrowLimit2).plus(
          BigNumber(popData.deposited_usd).times(popData.collateralFactor).div(Config.tokenDefaultPrecision)
        );
      }
    }

    // const per1 = getPercent(totalBorrowUsdForUSDD, borrowLimit); //BigNumber(totalBorrowUsdForUSDD).div(borrowLimit).times(100);
    // const per2 = getPercent(totalBorrowUsdAfter, borrowLimit2); //BigNumber(totalBorrowUsdAfter).div(borrowLimit).times(100);
    let extraLimitInTrx =
      popData.account_entered === 0
        ? BigNumber(popData.deposited)
            .times(popData.assetPrice)
            .times(BigNumber(10).pow(popData.collateralDecimal))
            // .div(BigNumber(10).pow(24)) // 6 + 18
            .div(Config.defaultPrecision)
            .div(
              BigNumber(trxAssetPrice).gte(Config.oraclePricePrecision)
                ? Config.oraclePricePrecision
                : Config.tokenDefaultPrecision
            )
            .times(popData.collateralFactor)
            .div(Config.tokenDefaultPrecision)
        : 0;
    const per1 = BigNumber(risk).times(100);
    const per2 = BigNumber(totalBorrowValueInTrx)
      .plus(
        BigNumber(borrowValue)
          .times(popData.assetPrice)
          .times(BigNumber(10).pow(popData.collateralDecimal))
          // .div(BigNumber(10).pow(24)) // 6 + 18
          .div(Config.defaultPrecision)
          .div(
            BigNumber(trxAssetPrice).gte(Config.oraclePricePrecision)
              ? Config.oraclePricePrecision
              : Config.tokenDefaultPrecision
          )
      )
      .div(BigNumber(totalCollateralValueInTrx).plus(extraLimitInTrx))
      .times(100);

    const status1 =
      BigNumber(borrowValue).gt(0) &&
      (!BigNumber(totalBorrowUsdForUSDD).eq(0) || !BigNumber(totalBorrowUsdAfter).eq(0));
    const status2 = BigNumber(borrowValue).gt(0) && (!BigNumber(per1).eq(0) || !BigNumber(per2).eq(0));

    const { transModalInfo } = this.props.system;
    const { declined, transType } = transModalInfo;

    let borrowLimitAfter1 = 0;
    if (borrowValue && BigNumber(borrowValue).gte(0)) {
      borrowLimitAfter1 = this.getTotalBorrowUsdAfter(borrowValue, false);
    }

    let account_entered = -1;
    if (userDataSource && userDataSource.length > 0) {
      userDataSource.map(item => {
        if (item.collateralSymbol === popData.collateralSymbol) {
          account_entered = item.account_entered;
          if (item.account_entered !== 1) {
            // openCollateral = true;
          }
        }
      });
    }

    let openCollateral = false;
    let depositMax = 0;
    let mortgageInfo = {};
    if (userDepositDataSource && userDepositDataSource.length > 0) {
      userDepositDataSource.map(item => {
        if (item.account_entered !== 1) {
          openCollateral = true;
          let deposted =
            item.jtokenAddress === Config.usddJtoken || item.jtokenAddress === Config.usddoldJtoken
              ? item.deposited
              : item.deposited_usd;
          if (BigNumber(deposted).gt(depositMax)) {
            depositMax = deposted;
            mortgageInfo = item;
          }
        }
      });
    }

    return (
      <div className="mt16 mt10-m">
        <div>
          <div className="safe-input">
            <Input
              className={'j-input ' + (btnText ? 'j-error-input' : '')}
              style={{ minWidth: 100 }}
              onChange={e => {
                this.onChangeBorrow(removeThousandSeparators(e.target.value), -1);
                this.setState({ maxValue: -1 });
              }}
              allowClear
              addonAfter={this.maxRender(popData)}
              value={addThousandSeparators(borrowValue)}
              placeholder={intl.get('v2.enter_borrow_amount')}
              disabled={approving ? true : false}
            />
            {btnText && (
              <div className="j-error-tip">
                <span className="j-error-img"></span>
                <div>{btnText}</div>
              </div>
            )}
          </div>
        </div>
        <div>
          <div className="j-modal-ele">
            <span className="j-title">{intl.get('v2.total_borrow')}</span>
            <span className="j-content">
              <span>{formatNumber(totalBorrowUsdForUSDD, 2, { miniText: 0.01, needDolar: true })}</span>
              {status1 && (
                <>
                  <span className="arrow-right"></span>
                  {formatNumber(borrowLimitAfter1, 2, { miniText: 0.01, needDolar: true })}
                </>
              )}
            </span>
          </div>
          <div className="j-modal-ele">
            <span className="j-title">{intl.get('v2.risk_value')}</span>
            <span className="j-content">
              <span>{formatNumber(per1, 2)}</span>
              {status2 && BigNumber(borrowValue).gt(0) && (
                <>
                  <span className="arrow-right"></span>
                  <span>{setRiskValue(per2, 2)}</span>
                </>
              )}
            </span>
          </div>
          <div className="modal-progress">
            {progressV2(per1, per2)}
            {/* {renderProgress(per2, {
              showInfo: false,
              reverse: true
            })} */}
          </div>
        </div>
        <div>
          <div className="j-modal-ele">
            <span className="j-title">{intl.get('v2.borrow_apy')}</span>
            <span className="j-content">{renderPercent(popData.lendApy, { cutZero: false, useFull: false })}</span>
          </div>
          <div className="j-modal-ele">
            <span className="j-title">{intl.get('v2.borrowed', { symbol: collateralSymbol })}</span>
            <span className="j-content balance-change ellipsis">
              {BigNumber(borrowValue).gt(0) ? (
                <>
                  <span className="pre">
                    {BigNumber(borrowBalanceNewValue).isNaN()
                      ? 0
                      : formatNumber(borrowBalanceNewValue, 3, { miniText: '0.001', round: false })}
                  </span>
                  <span className="arrow-right"></span>

                  {formatNumber(
                    BigNumber(borrowBalanceNewValue).isNaN()
                      ? borrowValue
                      : BigNumber(borrowBalanceNewValue).plus(borrowValue),
                    3,
                    { miniText: 0.001 }
                  )}
                </>
              ) : (
                <>
                  {BigNumber(borrowBalanceNewValue).isNaN()
                    ? 0
                    : formatNumber(borrowBalanceNewValue, 3, { miniText: '0.001', round: false })}
                </>
              )}
            </span>
          </div>
        </div>
        <div className="mt-50">
          {/* {BigNumber(borrowValue).gt(0) && (BigNumber(totalCollateralValueInTrx).eq(0) || BigNumber(per2).gt(100)) ? (
            <div className="borrow-tip borrow-important-tip">
              <span className={lang === 'en-US' ? 'en' : ''}></span>
              <span>
                {intl.get('v2.tip23')}
                {openCollateral && (
                  <a className="hover" onClick={() => this.collateralOn(mortgageInfo)}>
                    {intl.get('v2.tip28')}
                    <span className="warning-icon"></span>
                  </a>
                )}
              </span>
            </div>
          ) : account_entered !== 1 ? (
            <div className="borrow-tip borrow-important-tip">
              <span className={lang === 'en-US' ? 'en' : ''}></span>
              <span>{intl.get('v2.borrow_tip')}</span>
            </div>
          ) : (
            ''
          )} */}

          {BigNumber(borrowValue).gt(0) && (BigNumber(totalCollateralValueInTrx).eq(0) || BigNumber(per2).gt(100)) ? (
            <div className="borrow-tip borrow-important-tip">
              <span className={lang === 'en-US' ? 'en' : ''}></span>
              <span>{intl.get('v2.tip23')}</span>
            </div>
          ) : account_entered !== 1 ? (
            <div className="borrow-tip borrow-important-tip">
              <span className={lang === 'en-US' ? 'en' : ''}></span>
              <span>{intl.get('v2.tip22')}</span>
            </div>
          ) : (
            ''
          )}

          {approving ? (
            <button className="j-large-btn j-borrow mt-0 j-signing" disabled>
              {intl.get('v2.sign_in_wallet')}
              <span className="siging-icon"></span>
            </button>
          ) : this.props.lend.continueWhileDisabled && isConnected ? (
            <Tooltip
              title={intl.get('season.not_awailable')}
              overlayClassName={'j-tooltip-dropdown season season-l ' + theme}
              arrowPointAtCenter
              placement="top"
              getPopupContainer={() => document.querySelector('.ant-btn.j-large-btn.j-borrow, .j-large-btn.j-borrow')}
            >
              <Button className="j-large-btn j-borrow mt-0 disabled season">{intl.get('v2.modal_borrow')}</Button>
            </Tooltip>
          ) : noService &&
            (!riojBalance || !isConnected) &&
            popData?.collateralSymbol === 'wstUSDT' &&
            Config.noServiceModalVisible ? (
            <Tooltip
              title={intl.getHTML('home.market_not_useful1')}
              overlayClassName={'j-tooltip-dropdown season season-l ' + theme}
              arrowPointAtCenter
              placement="top"
              getPopupContainer={() => document.querySelector('.ant-btn.j-large-btn.j-borrow, .j-large-btn.j-borrow')}
            >
              <Button className="j-large-btn j-borrow mt-0 disabled season">{intl.get('v2.modal_borrow')}</Button>
            </Tooltip>
          ) : !!popData?.borrowPaused ? (
            <Button className="j-large-btn j-borrow mt-0 disabled">{intl.get('risk_tip.borrow_disabled')}</Button>
          ) : (
            <Button
              className="j-large-btn j-borrow mt-0"
              type="primary"
              disabled={!status}
              onClick={() => this.toBorrow()}
            >
              {intl.get('v2.modal_borrow')}
            </Button>
          )}
          {declined && transType === 'borrow' && (
            <div className="j-error-tip wallet-reject">
              <span className="j-error-img"></span>
              <div>{intl.get('v2.reject_in_wallet')}</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  collateralOn = async transInfo => {
    this.props.lend.hideBorrowModal();

    const { marketList } = this.props.lend;

    if (!this.props.lend.collateralValid(marketList[transInfo?.jtokenAddress]?.collateralSymbol)) return;

    this.props.lend.setData({ visible: true, type: 1, jtokenAddress: transInfo?.jtokenAddress }, 'mortgageModalInfo');
  };

  clickMax = (borrowBalanceNewValue, collateralDecimal) => {
    const repayValue = borrowBalanceNewValue._toFixed(collateralDecimal, 1);
    this.setState(
      {
        isClear: true,
        repayValue
      },
      () => {
        this.onChangeRepay(repayValue);
      }
    );
  };

  setSafeFee = () => {
    const { balanceInfo } = this.props.lend;
    const { userList, marketList } = this.props.lend;
    const { jtokenAddress } = this.props.lend.borrowModalInfo;
    const popData = userList[jtokenAddress] || marketList[jtokenAddress];
    const { precision, collateralDecimal } = popData;
    let tokenBalance = BigNumber(balanceInfo[jtokenAddress].balance).div(precision);
    let repayValueNew = BigNumber(tokenBalance).minus(this.state.trxFee)._toFixed(collateralDecimal, 1);

    this.setState(
      {
        repayValue: repayValueNew
      },
      () => {
        this.onChangeRepay(repayValueNew, true);
      }
    );
  };

  renderRepay = () => {
    const {
      totalBorrowUsdAfter,
      repayValue,
      totalRepayUsdAfter,
      errInfo2: { status, btnText },
      isClear,
      lang,
      approving,
      wstUSDTSelectedToken,
      wstUSDTInputValue
    } = this.state;
    const {
      borrowLimit,
      totalBorrowUsd,
      balanceInfo,
      userLendDataSource,
      totalBorrowUsdForUSDD,
      risk,
      totalBorrowValueInTrx,
      totalCollateralValueInTrx,
      theme,
      wstUSDTbalanceInfo,
      noService,
      riojBalance
    } = this.props.lend;
    const { isConnected } = this.props.network;

    const isWhite = theme === 'white';
    const { userList, marketList } = this.props.lend;
    const { jtokenAddress } = this.props.lend.borrowModalInfo;
    const popData = userList[jtokenAddress] || marketList[jtokenAddress];
    const {
      precision,
      collateralSymbol = '',
      borrowBalanceNew,
      collateralDecimal,
      lendApy,
      collateralAddress
    } = popData;
    let borrowBalanceNewValue = borrowBalanceNew ? borrowBalanceNew.div(precision) : BigNumber(0);
    const trxAssetPrice = userList[jtrxAddress]?.assetPrice || marketList[jtrxAddress]?.assetPrice;

    if (BigNumber(borrowBalanceNewValue).eq(0)) {
      return (
        <div className="no-repay">
          <img src={isWhite ? NoRepayIconWhite : NoRepayIcon} alt={intl.get('repay.no_debt')} />
          <div>{intl.get('repay.no_debt')}</div>
          {this.props.lend.continueWhileDisabled && isConnected ? (
            <Tooltip
              title={intl.get('season.not_awailable')}
              overlayClassName={'j-tooltip-dropdown season season-l ' + theme}
              arrowPointAtCenter
              placement="top"
              getPopupContainer={() => document.querySelector('.j-wrapper .j-repay')}
            >
              <Button className="j-large-btn j-repay disabled season" type="primary">
                {intl.get('repay.repay')}
              </Button>
            </Tooltip>
          ) : noService &&
            (!riojBalance || !isConnected) &&
            popData?.collateralSymbol === 'wstUSDT' &&
            Config.noServiceModalVisible ? (
            <Tooltip
              title={intl.getHTML('home.market_not_useful1')}
              overlayClassName={'j-tooltip-dropdown season season-l ' + theme}
              arrowPointAtCenter
              placement="top"
              getPopupContainer={() => document.querySelector('.ant-btn.j-large-btn.j-repay, .j-large-btn.j-repay')}
            >
              <Button className="j-large-btn j-repay disabled season" type="primary">
                {intl.get('repay.repay')}
              </Button>
            </Tooltip>
          ) : (
            <Button className="j-large-btn j-repay" type="primary" disabled>
              {intl.get('repay.repay')}
            </Button>
          )}
        </div>
      );
    }

    const tokenUnit = {
      'usdt': 'USDT',
      'stusdt': 'stUSDT',
      'wstusdt': 'wstUSDT'
    };

    let approved = false;

    if (popData.collateralSymbol !== 'wstUSDT') {
      approved = balanceInfo[jtokenAddress] && BigNumber(balanceInfo[jtokenAddress].allowance).gt(0);
    } else {
      if (wstUSDTSelectedToken === 'wstusdt') {
        approved = balanceInfo[jtokenAddress] && BigNumber(balanceInfo[jtokenAddress].allowance).gt(0);
      } else {
        let allowance = wstUSDTbalanceInfo[Config[wstUSDTSelectedToken].token]?.allowance;
        approved =
          BigNumber(allowance)?.gt(0) &&
          BigNumber(allowance)?.gte(
            BigNumber(BigNumber(wstUSDTInputValue).isNaN() ? 0 : wstUSDTInputValue).times(
              Config[wstUSDTSelectedToken].precision
            )
          );
      }
    }

    let walletBalance =
      balanceInfo[jtokenAddress] &&
      balanceInfo[jtokenAddress].balance &&
      balanceInfo[jtokenAddress].balance.div(precision);
    let borrowValueResult = borrowBalanceNewValue;

    // if (collateralSymbol === 'TRX') {
    //   walletBalance = BigNumber(walletBalance).minus(50);
    //   if (BigNumber(walletBalance).lt(0)) {
    //     walletBalance = BigNumber(0);
    //   }
    // }
    if (BigNumber(walletBalance).lt(0)) {
      walletBalance = BigNumber(0);
    }
    if (BigNumber(walletBalance).lte(borrowBalanceNewValue)) {
      borrowValueResult = walletBalance;
      // this.setState({ isClear: false });
    }

    const per1 = BigNumber(risk).times(100);
    const isMax =
      userLendDataSource && userLendDataSource.length === 1 && BigNumber(repayValue).gte(borrowBalanceNewValue);
    let per2 =
      isMax && repayValue != 0
        ? 0
        : BigNumber(totalBorrowValueInTrx)
            .minus(
              BigNumber(repayValue)
                .times(popData.assetPrice)
                .times(BigNumber(10).pow(popData.collateralDecimal))
                // .div(BigNumber(10).pow(24)) // 6 + 18
                .div(Config.defaultPrecision)
                .div(
                  BigNumber(trxAssetPrice).gte(Config.oraclePricePrecision)
                    ? Config.oraclePricePrecision
                    : Config.tokenDefaultPrecision
                )
            )
            .div(totalCollateralValueInTrx)
            .times(100);
    per2 = BigNumber(per2).lte(0) ? 0 : per2;
    const status1 =
      repayValue != '' &&
      repayValue != 0 &&
      (!BigNumber(totalBorrowUsdForUSDD).eq(0) || !BigNumber(borrowValueResult).eq(0));
    const status2 = repayValue != '' && repayValue != 0 && (!BigNumber(per1).eq(0) || !BigNumber(per2).eq(0));

    let tokenBalance = BigNumber(balanceInfo[jtokenAddress].balance).div(precision);
    if (wstUSDTSelectedToken !== 'wstusdt') {
      const { wstUSDTbalanceInfo } = this.props.lend;
      tokenBalance = BigNumber(wstUSDTbalanceInfo[Config[wstUSDTSelectedToken]?.token]?.balance).div(
        Config[wstUSDTSelectedToken]?.precision
      );
    }
    const { transModalInfo } = this.props.system;
    const { declined, transType } = transModalInfo;

    let borrowLimitAfter1 = 0;
    if (repayValue && BigNumber(repayValue).gte(0)) {
      borrowLimitAfter1 = this.getTotalBorrowUsdAfter(repayValue, true);
    }

    return (
      <div>
        <div className="mt10">
          <div
            className={
              'safe-input safe-input-with-wallet' +
              (popData.collateralSymbol === 'wstUSDT' ? ' safe-input-wstusdt' : '')
            }
          >
            {popData.collateralSymbol === 'wstUSDT' ? (
              <WstusdtInput
                value={repayValue}
                onChangeWstUSDTRepay={this.onChangeWstUSDTRepay}
                disabled={approving ? true : false}
                clickMax={this.clickMax}
                type="repay"
                disabledTkens="usdt"
                borrowBalanceNewValue={borrowBalanceNewValue}
                prefix={isClear && BigNumber(walletBalance).gt(borrowBalanceNewValue) ? <span>~</span> : <span></span>}
              />
            ) : (
              <>
                <div className="j-wallet">
                  <span>{intl.get('deposit.wallet_balance')}</span>
                  {renderBalance(popData, balanceInfo, 3, true)}
                </div>
                <Input
                  className={'j-input ' + (btnText ? 'j-error-input' : '')}
                  prefix={
                    isClear && BigNumber(walletBalance).gt(borrowBalanceNewValue) ? <span>~</span> : <span></span>
                  }
                  size="small"
                  allowClear
                  onChange={e => this.onChangeRepay(removeThousandSeparators(e.target.value), true)}
                  addonAfter={
                    <span
                      className="pointer"
                      onClick={() => {
                        this.clickMax(borrowValueResult, collateralDecimal);
                        window.gtag('event', 'PC_repay_maxsafe', {
                          'event_category': 'PC_V1.5',
                          'event_label': 'repay_maxsafe'
                        });
                      }}
                    >
                      {intl.get('deposit.max')}
                    </span>
                  }
                  value={addThousandSeparators(repayValue)}
                  placeholder={intl.get('repay.enter_amount')}
                  disabled={approving ? true : false}
                />
                {btnText && (
                  <div className="j-error-tip">
                    <span className="j-error-img"></span>
                    <div>{btnText}</div>
                  </div>
                )}
              </>
            )}

            {status && BigNumber(tokenBalance).lte(this.state.trxFee) ? (
              <div className="j-safe-tip">
                <span className="j-safe-img"></span>
                <div className="j-safe-text">{intl.getHTML('safe_tip', { value: this.state.trxFee })}</div>
              </div>
            ) : status && BigNumber(BigNumber(tokenBalance).minus(this.state.trxFee)).lt(repayValue) ? (
              <div className="j-safe-tip">
                <span className="j-safe-img"></span>
                <div className="j-safe-text">
                  {intl.getHTML('safe_tip', { value: this.state.trxFee })}{' '}
                  <span className="safe-fee" onClick={e => this.setSafeFee()}>
                    {intl.get('safe_fee')}
                  </span>
                </div>
              </div>
            ) : (
              ''
            )}
          </div>
        </div>
        <div>
          <div className="j-modal-ele">
            <span className="j-title">{intl.get('repay.borrowed_amount')}</span>
            <span className="j-content">
              <span className="c-545669 fw700">
                {formatNumber(totalBorrowUsdForUSDD, 2, { miniText: 0.01, needDolar: true })}
              </span>
              {status1 && (
                <>
                  <span className="arrow-right"></span>
                  {formatNumber(isMax ? 0 : borrowLimitAfter1, 2, { miniText: 0.01, needDolar: true })}
                </>
              )}
            </span>
          </div>
          <div>
            <div className="j-modal-ele">
              <span className="j-title">{intl.get('v2.risk_value')}</span>
              <span className="j-content">
                <span className="c-84869E fw700">{formatNumber(per1, 2)}</span>
                {status2 && (
                  <>
                    <span className="arrow-right"></span>

                    {setRiskValue(per2, 2)}
                  </>
                )}
              </span>
            </div>
            <div className="modal-progress">
              {progressV2(per1, per2)}
              {/* {renderProgress(per2, {
                showInfo: false,
                reverse: true
              })} */}
            </div>
          </div>
          <div className="j-modal-ele">
            <span className="j-title">{intl.get('v2.borrow_apy')}</span>
            <span className="j-content">{formatNumber(BigNumber(lendApy), 2, { per: true, miniText: '0.01' })}%</span>
          </div>
          <div className="j-modal-ele">
            <span className="j-title">{intl.get('v2.borrowed', { symbol: collateralSymbol })}</span>
            <span className="j-content balance-change ellipsis">
              {BigNumber(repayValue).gt(0) ? (
                <>
                  <span className="pre">
                    {BigNumber(borrowBalanceNewValue).isNaN()
                      ? 0
                      : formatNumber(borrowBalanceNewValue, 3, { miniText: '0.001', round: false })}
                  </span>
                  <span className="arrow-right"></span>
                  {isClear && BigNumber(tokenBalance).gt(borrowBalanceNewValue)
                    ? 0
                    : formatNumber(BigNumber(borrowBalanceNewValue).minus(repayValue), 3, { miniText: 0.001 })}
                </>
              ) : (
                <>
                  {BigNumber(borrowBalanceNewValue).isNaN()
                    ? 0
                    : formatNumber(borrowBalanceNewValue, 3, { miniText: '0.001', round: false })}
                </>
              )}
            </span>
          </div>
          <div>
            {!(collateralAddress === Config.zeroAddr || approved) && (
              <div className="borrow-tip borrow-important-tip">
                <span></span>
                {intl.getHTML('deposit.explanation1', {
                  value:
                    popData.collateralSymbol === 'wstUSDT' ? tokenUnit[wstUSDTSelectedToken] : popData.collateralSymbol
                })}
              </div>
            )}

            {approving ? (
              <button className="j-large-btn j-supply j-signing" disabled>
                {intl.get('v2.sign_in_wallet')}
                <span className="siging-icon"></span>
              </button>
            ) : this.props.lend.continueWhileDisabled && isConnected ? (
              <Tooltip
                title={intl.get('season.not_awailable')}
                overlayClassName={'j-tooltip-dropdown season season-l ' + theme}
                arrowPointAtCenter
                placement="top"
                getPopupContainer={() => document.querySelector('.j-wrapper .j-repay')}
              >
                {approved ? (
                  <Button className="j-large-btn j-repay disabled season">{intl.get('v2.modal_repay')}</Button>
                ) : (
                  <Button className="j-large-btn j-repay disabled season">
                    {intl.get('deposit.approve', { value: tokenUnit[wstUSDTSelectedToken] })}
                  </Button>
                )}
              </Tooltip>
            ) : noService &&
              (!riojBalance || !isConnected) &&
              popData.collateralSymbol === 'wstUSDT' &&
              Config.noServiceModalVisible ? (
              <Tooltip
                title={intl.getHTML('home.market_not_useful1')}
                overlayClassName={'j-tooltip-dropdown season season-l ' + theme}
                arrowPointAtCenter
                placement="top"
                getPopupContainer={() => document.querySelector('.j-wrapper .j-repay')}
              >
                {approved ? (
                  <Button className="j-large-btn j-repay disabled season">{intl.get('v2.modal_repay')}</Button>
                ) : (
                  <Button className="j-large-btn j-repay disabled season">
                    {intl.get('deposit.approve', { value: tokenUnit[wstUSDTSelectedToken] })}
                  </Button>
                )}
              </Tooltip>
            ) : collateralAddress === Config.zeroAddr || approved ? (
              <Button
                className="j-large-btn j-repay"
                type="primary"
                disabled={!status}
                onClick={() => this.repayBorrow()}
              >
                {intl.get('v2.modal_repay')}
              </Button>
            ) : popData.collateralSymbol === 'wstUSDT' && wstUSDTSelectedToken !== 'wstusdt' ? (
              <>
                <Button
                  className="j-large-btn j-repay"
                  onClick={async () => {
                    this.props.system.clearRejectError();
                    popData.transType = 'approve';
                    window.gtag('event', 'PC_borrow_approve', {
                      'event_category': 'PC_V1.5',
                      'event_label': 'borrow_approve'
                    });
                    this.setState({
                      approving: true
                    });

                    const contractAddress = Config[wstUSDTSelectedToken].token;
                    let funcSelector = 'approve(address,uint256)';
                    let parameters = [
                      { type: 'address', value: Config.SwapRouter },
                      { type: 'uint256', value: MAX_UINT256 }
                    ];
                    const feeLimit = await this.props.system.getFeeLimitCommon(
                      contractAddress,
                      funcSelector,
                      parameters
                    );
                    const options = { feeLimit };

                    const txID = await this.props.system.approveWstUSDTToken(popData, contractAddress, false, options);
                    if (txID) {
                      window.gtag('event', 'PC_borrow_approve_success', {
                        'event_category': 'PC_V1.5',
                        'event_label': 'borrow_approve_success'
                      });
                      this.props.lend.getTokenBalanceInfo();
                      this.props.lend.getWstUSDTBalanceInfo(
                        this.props.network.defaultAccount,
                        [Config['usdt'].token, Config['stusdt'].token, Config['wstusdt'].token],
                        [Config.SwapRouter, Config.SwapRouter, Config.SwapRouter]
                      );
                      if (this.props.detailInfo) {
                        this.props.lend.getUserData();
                        this.props.lend.getUserDataFromMarkets();
                        this.props.lend.getMarketData();
                      }
                    }
                    this.setState({
                      approving: false
                    });
                  }}
                >
                  {intl.get('deposit.approve', { value: tokenUnit[wstUSDTSelectedToken] })}
                </Button>
              </>
            ) : (
              <>
                <Button
                  className="j-large-btn j-repay"
                  onClick={async () => {
                    this.props.system.clearRejectError();
                    popData.transType = 'approve';
                    window.gtag('event', 'PC_borrow_approve', {
                      'event_category': 'PC_V1.5',
                      'event_label': 'borrow_approve'
                    });
                    this.setState({
                      approving: true
                    });

                    const contractAddress = popData.collateralAddress;
                    let funcSelector = 'approve(address,uint256)';
                    let parameters = [
                      { type: 'address', value: popData.jtokenAddress },
                      { type: 'uint256', value: MAX_UINT256 }
                    ];
                    const feeLimit = await this.props.system.getFeeLimitCommon(
                      contractAddress,
                      funcSelector,
                      parameters
                    );
                    const options = { feeLimit };

                    const txID = await this.props.system.approveToken(popData, false, options);
                    if (txID) {
                      window.gtag('event', 'PC_borrow_approve_success', {
                        'event_category': 'PC_V1.5',
                        'event_label': 'borrow_approve_success'
                      });
                      this.props.lend.getTokenBalanceInfo();
                      if (this.props.detailInfo) {
                        this.props.lend.getUserData();
                        this.props.lend.getUserDataFromMarkets();
                        this.props.lend.getMarketData();
                      }
                    }
                    this.setState({
                      approving: false
                    });
                  }}
                >
                  {intl.get('deposit.approve', { value: popData.collateralSymbol })}
                </Button>
              </>
            )}
            {declined && (transType === 'repay' || transType === 'approve') && (
              <div className="j-error-tip wallet-reject">
                <span className="j-error-img"></span>
                <div>{intl.get('v2.reject_in_wallet')}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  repayBorrow = async () => {
    window.gtag('event', 'PC_borrow_modal_repay_button', {
      'event_category': 'PC_V1.5',
      'event_label': 'borrow_modal_repay_button'
    });
    this.props.system.clearRejectError();

    const { marketList, userList, balanceInfo } = this.props.lend;
    const { jtokenAddress } = this.props.lend.borrowModalInfo;
    const { repayValue, isClear, wstUSDTSelectedToken, wstUSDTInputValue } = this.state;
    const item = userList[jtokenAddress] || marketList[jtokenAddress];

    const { borrowratePerblock, precision, collateralDecimal, collateralSymbol, borrowBalanceNew } = item;
    let borrowBalanceNewValue = borrowBalanceNew ? borrowBalanceNew.div(precision) : BigNumber(0);
    let walletBalance = balanceInfo[jtokenAddress] && balanceInfo[jtokenAddress].balance.div(precision);
    if (collateralSymbol === 'TRX') {
      walletBalance = BigNumber(walletBalance).minus(50);
      if (BigNumber(walletBalance).lt(0)) {
        walletBalance = BigNumber(0);
      }
    }

    const intlObj = {
      title: 'v2.transaction_confirm',
      title2: 'deposit.transactionsent',
      title3: 'v2.transaction_confirm_fail',
      title4: 'deposit.confirm_transaction',
      obj: {
        value: repayValue,
        token: item.collateralSymbol
      },
      transType: 'repay'
    };
    let amount = 0;
    let trxAmount = 0;
    // if (isClear && BigNumber(walletBalance).gt(borrowBalanceNewValue)) {
    //   amount = MAX_UINT256;
    //   if (item.collateralAddress === Config.zeroAddr) {
    //     trxAmount = BigNumber(
    //       BigNumber(Config.tokenDefaultPrecision)
    //         .plus(BigNumber(borrowratePerblock).times(20))
    //         .times(repayValue)
    //         .div(Config.tokenDefaultPrecision)
    //         ._toFixed(collateralDecimal, 1)
    //     )
    //       .times(precision)
    //       ._toHex();
    //   }
    // }
    if (isClear) {
      if (wstUSDTSelectedToken !== 'wstusdt') {
        amount = BigNumber(repayValue).plus(1).times(precision)._toHex();
      } else if (BigNumber(walletBalance).gt(borrowBalanceNewValue)) {
        amount = MAX_UINT256;
        if (item.collateralAddress === Config.zeroAddr) {
          trxAmount = BigNumber(
            BigNumber(Config.tokenDefaultPrecision)
              .plus(BigNumber(borrowratePerblock).times(20))
              .times(repayValue)
              .div(Config.tokenDefaultPrecision)
              ._toFixed(collateralDecimal, 1)
          )
            .times(precision)
            ._toHex();
        }
      } else {
        amount = BigNumber(repayValue).times(precision)._toHex();
      }
    } else {
      amount = BigNumber(repayValue).times(precision)._toHex();
    }

    this.setState({ approving: true });

    if (wstUSDTSelectedToken !== 'wstusdt') {
      const repayAmount = isClear
        ? new BigNumber(wstUSDTInputValue).plus(1).times(Config[wstUSDTSelectedToken].precision)._toHex()
        : new BigNumber(wstUSDTInputValue).times(Config[wstUSDTSelectedToken].precision)._toHex();

      const contractAddress = Config.SwapRouter;
      let funcSelector = '';
      if (wstUSDTSelectedToken === 'usdt') {
        funcSelector = 'repayByUSDT(uint256)';
      } else {
        funcSelector = 'repayByStUSDT(uint256)';
      }
      let parameters = [{ type: 'uint256', value: repayAmount }];
      const feeLimit = await this.props.system.getFeeLimitCommon(contractAddress, funcSelector, parameters);
      const options = { feeLimit };

      let txID = await this.props.system.repayBorrowWstUSDT(
        wstUSDTSelectedToken,
        repayAmount,
        intlObj,
        trxAmount,
        isClear && BigNumber(walletBalance).gt(borrowBalanceNewValue),
        options
      );
      if (txID) {
        window.gtag('event', 'PC_borrow_modal_repay_success', {
          'event_category': 'PC_V1.5',
          'event_label': 'borrow_modal_repay_success'
        });
        setTimeout(() => {
          this.props.lend.getTokenBalanceInfo();
          if (this.props.detailInfo) {
            this.props.lend.getUserData();
            this.props.lend.getUserDataFromMarkets();
            this.props.lend.getMarketData();
          }
        }, 5000);
      }
    } else {
      const contractAddress = item.jtokenAddress;
      let funcSelector = 'repayBorrow(uint256)';
      let parameters = [{ type: 'uint256', value: amount }];
      const feeLimit = await this.props.system.getFeeLimitCommon(contractAddress, funcSelector, parameters);
      const options = { feeLimit };

      let txID = await this.props.system.repayBorrow(
        item,
        amount,
        intlObj,
        trxAmount,
        isClear && BigNumber(walletBalance).gt(borrowBalanceNewValue),
        options
      );
      if (txID) {
        window.gtag('event', 'PC_borrow_modal_repay_success', {
          'event_category': 'PC_V1.5',
          'event_label': 'borrow_modal_repay_success'
        });
        setTimeout(() => {
          this.props.lend.getTokenBalanceInfo();
          if (this.props.detailInfo) {
            this.props.lend.getUserData();
            this.props.lend.getUserDataFromMarkets();
            this.props.lend.getMarketData();
          }
        }, 5000);
      }
    }

    this.setState({ approving: false });
  };

  getRepayBorrowFee = async repayValue => {
    const { marketList, userList, balanceInfo, energyFee, getEnergyFee } = this.props.lend;
    const { jtokenAddress } = this.props.lend.borrowModalInfo;
    const { isClear } = this.state;
    const item = userList[jtokenAddress] || marketList[jtokenAddress];

    const { borrowratePerblock, precision, collateralDecimal, collateralSymbol, borrowBalanceNew } = item;
    let borrowBalanceNewValue = borrowBalanceNew ? borrowBalanceNew.div(precision) : BigNumber(0);
    let walletBalance = balanceInfo[jtokenAddress] && balanceInfo[jtokenAddress].balance.div(precision);
    if (collateralSymbol === 'TRX') {
      walletBalance = BigNumber(walletBalance).minus(50);
      if (BigNumber(walletBalance).lt(0)) {
        walletBalance = BigNumber(0);
      }
    }

    const intlObj = {
      title: 'v2.transaction_confirm',
      title2: 'deposit.transactionsent',
      title3: 'v2.transaction_confirm_fail',
      title4: 'deposit.confirm_transaction',
      obj: {
        value: repayValue,
        token: item.collateralSymbol
      }
    };
    let amount = 0;
    let trxAmount = 0;
    if (isClear && BigNumber(walletBalance).gt(borrowBalanceNewValue)) {
      amount = MAX_UINT256;
      if (item.collateralAddress === Config.zeroAddr) {
        trxAmount = BigNumber(
          BigNumber(Config.tokenDefaultPrecision)
            .plus(BigNumber(borrowratePerblock).times(20))
            .times(repayValue)
            .div(Config.tokenDefaultPrecision)
            ._toFixed(collateralDecimal, 1)
        )
          .times(precision)
          ._toHex();
      }
    } else {
      amount = BigNumber(repayValue).times(precision)._toHex();
    }

    const energy = await this.props.system.repayBorrowValue(item, intlObj, trxAmount);
    let fee = energyFee || (await getEnergyFee());
    const trxFee = BigNumber(BigNumber(energy).times(fee).div(1e6)._toFixed(0, 1)).plus(2).toNumber();
    this.setState({ trxFee });
  };

  changeTab = value => {
    this.props.system.clearRejectError();

    const { borrowModalInfo, balanceInfo = {}, marketList, userList } = this.props.lend;
    const { jtokenAddress } = borrowModalInfo;
    const popData = userList[jtokenAddress] || marketList[jtokenAddress];
    if (popData && jtokenAddress && balanceInfo[jtokenAddress]) {
      this.props.lend.setData({
        borrowModalInfo: {
          type: value,
          visible: true,
          jtokenAddress
        }
      });
    }

    if (Number(value) === 1) {
      this.onChangeRepay('', true);
      return;
    }
    this.onChangeBorrow('', true);
  };

  renderContent = type => {
    if (type === 1) {
      window.gtag('event', 'PC_borrow_modal_borrow_tab', {
        'event_category': 'PC_V1.5',
        'event_label': 'borrow_modal_borrow_tab'
      });
    } else if (type === 2) {
      window.gtag('event', 'PC_borrow_modal_repay_tab', {
        'event_category': 'PC_V1.5',
        'event_label': 'borrow_modal_repay_tab'
      });
    }
    const { borrowModalInfo, balanceInfo = {}, marketList, userList } = this.props.lend;
    const { jtokenAddress } = borrowModalInfo;
    const popData = userList[jtokenAddress] || marketList[jtokenAddress];

    // if (type === 1) {
    //   return this.renderBorrow();
    // }
    if (popData && jtokenAddress && balanceInfo[jtokenAddress]) {
      return type === 1 ? this.renderBorrow() : this.renderRepay();
    }
    return (
      <div className="loading-box">
        <Spin size="large" />
      </div>
    );
  };

  //wstUSDT
  onChangeWstUSDTRepay = (wstUSDTSelectedToken, repayValue, wstUSDTInputValue, errInfo2, isClear) => {
    try {
      this.setState({
        wstUSDTSelectedToken,
        repayValue,
        wstUSDTInputValue,
        errInfo2,
        isClear
      });
    } catch (error) {}
  };

  render() {
    const { borrowModalInfo, marketList, userList, theme } = this.props.lend;
    const { jtokenAddress, type, visible } = borrowModalInfo;
    const { mobile } = this.state;
    const popData = userList[jtokenAddress] || marketList[jtokenAddress];
    const { collateralSymbol, logoUrl } = popData || {};
    return (
      <Modal
        title={
          <>
            <img
              src={logoUrl}
              alt=""
              className={collateralSymbol.toLocaleLowerCase()}
              onError={e => {
                e.target.onerror = null;
                e.target.src = getLendIcons(collateralSymbol);
              }}
            />
            {collateralSymbol || ''}
          </>
        }
        width={mobile ? 'calc(100% - 40px)' : 400}
        height={mobile ? 509 : 560}
        maskClosable={false}
        visible={visible}
        centered
        closable={true}
        onCancel={() => {
          this.props.lend.hideBorrowModal();
          this.props.system.clearRejectError();
          window.gtag('event', 'PC_borrow_modal_close', {
            'event_category': 'PC_V1.5',
            'event_label': 'borrow_modal_close'
          });
        }}
        footer={null}
        className={`j-modal j-borrow-modal ${theme}`}
        getContainer={() => document.querySelector('.j-wrapper')}
      >
        {!!popData && (
          <Tabs
            className="j-borrow"
            defaultActiveKey={type}
            activeKey={type}
            centered
            type="card"
            onChange={this.changeTab}
          >
            <TabPane tab={intl.get('v2.modal_borrow')} key="1">
              {this.renderContent(1)}
            </TabPane>
            <TabPane tab={intl.get('v2.modal_repay')} key="2">
              {this.renderContent(2)}
            </TabPane>
          </Tabs>
        )}
      </Modal>
    );
  }
}

export default Borrow;
