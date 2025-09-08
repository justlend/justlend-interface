import React from 'react';
import isMobile from 'ismobilejs';
import BigNumber from 'bignumber.js';
import { inject, observer } from 'mobx-react';
import {
  formatNumber,
  renderBalance,
  numberParser,
  checkEnteredMarket,
  gtBalance,
  renderPercent,
  renderProgress,
  getPercent,
  checkCash,
  eqBalance,
  getTotalApy,
  amountFormat,
  progressV2,
  setRiskValue,
  tooltip,
  addThousandSeparators,
  removeThousandSeparators
} from '../../../utils/helper';
import { getTRC20Balance, getCash, MAX_UINT256 } from '../../../utils/blockchain';
import { Modal, Tabs, Input, Progress, Button, Tooltip, Select, Spin } from 'antd';
import intl from 'react-intl-universal';
import '../../../assets/css/modal.scss';
import defaultIcon from '../../../assets/images/default.svg';
import shield from '../../../assets/images/shield.svg';
import warningImg from '../../../assets/images/v2/light-yellow.svg';
import Config from '../../../config';
import { TooltipText } from '../../v2/strx/TooltipText';
import { getLendIcons } from '../../../utils/constant';
const { jtrxAddress } = Config;
const { Option } = Select;
const { TabPane } = Tabs;
@inject('network')
@inject('lend')
@inject('system')
@observer
class depositeAndWithdrawMobile extends React.Component {
  constructor(props) {
    super(props);
    this.timerInterval = null;
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      approved: false,
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
      depositValue: '',
      withdrawValue: '',
      borrowLimitAfter: '',
      withdrawLimitAfter: '',
      trxFee: '',
      maxValue: -1
    };
  }
  componentDidMount = () => {
    this.startInterval();

    const { borrowLimit } = this.props.lend;
    const { popData } = this.props.lend.DAWPop;
    this.setState({
      borrowLimitAfter: borrowLimit,
      withdrawLimitAfter: borrowLimit
    });
  };

  componentWillUnmount() {
    clearInterval(this.timerInterval);
    this.timerInterval = null;
  }

  getCash = async () => {
    const { popData = {} } = this.props.lend.DAWPop;
    // console.log(popData);
    if (popData && popData.jtokenAddress) {
      const { balance = 0, success } = await getCash(popData.jtokenAddress);
      if (success) {
        this.state.poolCash = BigNumber(balance);
      }
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
      if (Number(this.props.lend.DAWPop.activeKey) === 1) {
        return this.depositChange(this.state.borrowValue);
      }
      if (Number(this.props.lend.DAWPop.activeKey) === 2) {
        return this.withdrawChange(this.state.withdrawValue);
      }
    }
  }

  clickMaxWithdraw = (popData = {}) => {
    const { deposited = 0, collateralDecimal } = popData;
    const withdrawValue = BigNumber(deposited)._toFixed(collateralDecimal, 1);
    try {
      this.setState(
        {
          withdrawValue
        },
        () => {
          this.withdrawChange(withdrawValue);
        }
      );
    } catch (err) {
      console.log('clickMaxWithdraw: ', err);
    }
  };

  clickSafeMax = popData => {
    try {
      const { borrowLimit, totalBorrowUsdForUSDD, trxPrice, userList, marketList } = this.props.lend;
      const {
        precision,
        collateralFactor,
        assetPrice,
        collateralDecimal,
        jtokenAddress,
        deposited_usd = 0,
        deposited = 0
      } = popData;
      const trxAssetPrice = userList[jtrxAddress]?.assetPrice || marketList[jtrxAddress]?.assetPrice;
      let withdrawBorrowUsd = BigNumber(0);
      if (jtokenAddress === Config.usddJtoken || jtokenAddress === Config.usddoldJtoken) {
        withdrawBorrowUsd = BigNumber(borrowLimit).minus(
          BigNumber(deposited).times(collateralFactor).div(Config.tokenDefaultPrecision)
        );
      } else {
        withdrawBorrowUsd = BigNumber(borrowLimit).minus(
          BigNumber(deposited_usd).times(collateralFactor).div(Config.tokenDefaultPrecision)
        );
      }

      if (!checkEnteredMarket(userList, jtokenAddress) || this.checkSafe(totalBorrowUsdForUSDD, withdrawBorrowUsd)) {
        this.setState({
          isClear: true
        });
        return this.clickMaxWithdraw(popData);
      }

      const withdrawLimitAfter = BigNumber(totalBorrowUsdForUSDD).div(Config.safeMaxRate);
      let withdrawValue = BigNumber(0);
      // if ([Config.usddJtoken, Config.usdtJtoken, Config.tusdJtoken, Config.usdcJtoken].includes(jtokenAddress)) {
      if (jtokenAddress === Config.usddJtoken || jtokenAddress === Config.usddoldJtoken) {
        withdrawValue = BigNumber(borrowLimit)
          .minus(withdrawLimitAfter)
          .div(collateralFactor)
          .times(Config.tokenDefaultPrecision);
      } else {
        withdrawValue = BigNumber(borrowLimit)
          .minus(withdrawLimitAfter)
          .times(Config.defaultPrecision)
          .div(trxPrice)
          .times(Config.tokenDefaultPrecision)
          .div(assetPrice)
          // .times(Config.tokenDefaultPrecision)
          .times(
            BigNumber(trxAssetPrice).gte(Config.oraclePricePrecision)
              ? Config.oraclePricePrecision
              : Config.tokenDefaultPrecision
          )
          .div(collateralFactor)
          .times(Config.tokenDefaultPrecision)
          .div(precision);
      }

      withdrawValue = withdrawValue.lt(0) ? 0 : withdrawValue._toFixed(collateralDecimal, 1);
      this.setState(
        {
          withdrawValue,
          withdrawLimitAfter
        },
        () => {
          this.withdrawChange(withdrawValue);
        }
      );
    } catch (err) {
      console.log('clickSafeMax: ', err);
    }
  };

  clickSafeMaxNew = (popData, safeMaxRate) => {
    try {
      const { borrowLimit, totalBorrowUsdForUSDD, trxPrice, userList, marketList } = this.props.lend;
      const {
        precision,
        collateralFactor,
        assetPrice,
        collateralDecimal,
        jtokenAddress,
        deposited_usd = 0,
        deposited = 0
      } = popData;
      const trxAssetPrice = userList[jtrxAddress]?.assetPrice || marketList[jtrxAddress]?.assetPrice;
      let withdrawBorrowUsd = BigNumber(0);
      if (jtokenAddress === Config.usddJtoken || jtokenAddress === Config.usddoldJtoken) {
        withdrawBorrowUsd = BigNumber(borrowLimit).minus(
          BigNumber(deposited).times(collateralFactor).div(Config.tokenDefaultPrecision)
        );
      } else {
        withdrawBorrowUsd = BigNumber(borrowLimit).minus(
          BigNumber(deposited_usd).times(collateralFactor).div(Config.tokenDefaultPrecision)
        );
      }

      // if (!checkEnteredMarket(userList, jtokenAddress) || this.checkSafe(totalBorrowUsdForUSDD, withdrawBorrowUsd)) {
      //   this.setState({
      //     isClear: true
      //   });
      //   return this.clickMaxWithdraw(popData);
      // }

      const withdrawLimitAfter = BigNumber(totalBorrowUsdForUSDD).div(safeMaxRate);
      let withdrawValue = BigNumber(0);
      // if ([Config.usddJtoken, Config.usdtJtoken, Config.tusdJtoken, Config.usdcJtoken].includes(jtokenAddress)) {
      if (jtokenAddress === Config.usddJtoken || jtokenAddress === Config.usddoldJtoken) {
        withdrawValue = BigNumber(borrowLimit)
          .minus(withdrawLimitAfter)
          .div(collateralFactor)
          .times(Config.tokenDefaultPrecision);
      } else {
        withdrawValue = BigNumber(borrowLimit)
          .minus(withdrawLimitAfter)
          .times(Config.defaultPrecision)
          .div(trxPrice)
          .times(Config.tokenDefaultPrecision)
          .div(assetPrice)
          // .times(Config.tokenDefaultPrecision)
          .times(
            BigNumber(trxAssetPrice).gte(Config.oraclePricePrecision)
              ? Config.oraclePricePrecision
              : Config.tokenDefaultPrecision
          )
          .div(collateralFactor)
          .times(Config.tokenDefaultPrecision)
          .div(precision);
      }

      withdrawValue = withdrawValue.lt(0) ? 0 : withdrawValue._toFixed(collateralDecimal, 1);
      this.setState(
        {
          withdrawValue,
          withdrawLimitAfter
        },
        () => {
          this.withdrawChange(withdrawValue);
        }
      );
    } catch (err) {
      console.log('clickSafeMax: ', err);
    }
  };

  clickMax = () => {
    try {
      const { balanceInfo } = this.props.lend;
      const { popData } = this.props.lend.DAWPop;
      const { precision, collateralDecimal, jtokenAddress, collateralAddress } = popData;

      // const tokenBalance = BigNumber(balance).div(precision)._toFixed(collateralDecimal, 1);
      let tokenBalance = BigNumber(balanceInfo[jtokenAddress].balance).div(precision);
      if (collateralAddress === Config.zeroAddr) {
        tokenBalance = tokenBalance.lt(0) ? 0 : tokenBalance._toFixed(collateralDecimal, 1);
      } else {
        tokenBalance = tokenBalance._toFixed(collateralDecimal, 1);
      }
      this.setState(
        {
          depositValue: tokenBalance
        },
        () => {
          this.depositChange(tokenBalance);
        }
      );
    } catch (err) {
      console.log('clickMax:', err);
    }
  };

  checkSafe = (totalBorrowUsdForUSDD, withdrawBorrowUsd) => {
    return (
      BigNumber(totalBorrowUsdForUSDD).eq(0) ||
      (BigNumber(totalBorrowUsdForUSDD).div(withdrawBorrowUsd).gte(0) &&
        BigNumber(totalBorrowUsdForUSDD).div(withdrawBorrowUsd).lt(Config.safeMaxRate))
    );
  };

  getSafeMaxText = popData => {
    try {
      const { borrowLimit, totalBorrowUsdForUSDD, userList } = this.props.lend;
      const { jtokenAddress, deposited_usd = 0, collateralFactor, deposited } = popData;
      const withdrawBorrowUsd = BigNumber(borrowLimit).minus(
        BigNumber(
          jtokenAddress === Config.usddJtoken || jtokenAddress === Config.usddoldJtoken ? deposited : deposited_usd
        )
          .times(collateralFactor)
          .div(Config.tokenDefaultPrecision)
      );
      if (!checkEnteredMarket(userList, jtokenAddress) || this.checkSafe(totalBorrowUsdForUSDD, withdrawBorrowUsd)) {
        return intl.get('deposit.max');
      }
      return intl.get('withdraw.safemax');
    } catch (err) {
      console.log('getSafeMaxText, ', err);
      return intl.get('withdraw.safemax');
    }
  };

  selectMax = (maxValue, popData) => {
    let safeMaxRate = 1;
    if (maxValue == 1) {
      safeMaxRate = 0.9;
      // this.setState({ safeMaxRate: 0.9 });
    } else {
      safeMaxRate = 0.8;
      // this.setState({ safeMaxRate: 0.8 });
    }
    this.setState({ maxValue });
    this.clickSafeMaxNew(popData, safeMaxRate);
  };

  maxRender = popData => {
    const { maxValue } = this.state;
    const { borrowLimit, totalBorrowUsdForUSDD, userList } = this.props.lend;
    const { jtokenAddress, deposited_usd = 0, collateralFactor, deposited } = popData;
    const withdrawBorrowUsd = BigNumber(borrowLimit).minus(
      BigNumber(
        jtokenAddress === Config.usddJtoken || jtokenAddress === Config.usddoldJtoken ? deposited : deposited_usd
      )
        .times(collateralFactor)
        .div(Config.tokenDefaultPrecision)
    );
    const safeMaxText = this.getSafeMaxText(popData);

    if (!checkEnteredMarket(userList, jtokenAddress) || this.checkSafe(totalBorrowUsdForUSDD, withdrawBorrowUsd)) {
      return (
        <span
          className="pointer"
          onClick={() => {
            this.clickSafeMax(popData);
            window.gtag('event', 'H5_withdraw_maxsafe', { 'event_category': 'H5', 'event_label': 'withdraw_maxsafe' });
          }}
        >
          {safeMaxText}
        </span>
      );
    } else {
      return (
        <span
          className="pointer"
          onClick={() => {
            this.selectMax(2, popData);
          }}
        >
          {safeMaxText}
        </span>
      );
      // return (
      //   <Select
      //     value={maxValue === -1 ? intl.get('v2.max_safe') : maxValue}
      //     onChange={e => this.selectMax(e, popData)}
      //     className="select-max"
      //     dropdownClassName="select-max-dropdown"
      //     getPopupContainer={() => document.querySelector('.j-wrapper')}
      //   >
      //     <Option value="1">{intl.get('limit_amount1')}</Option>
      //     <Option value="2">{intl.get('limit_amount')}</Option>
      //   </Select>
      // );
    }
  };

  withDrawContent = popData => {
    const {
      withdrawValue,
      withdrawLimitAfter,
      isClear,
      errInfo2: { btnText, status },
      approving
    } = this.state;
    // console.log(withdrawLimitAfter.toNumber())
    const {
      openMint,
      borrowLimit,
      totalBorrowUsdForUSDD,
      assetList,
      risk,
      totalBorrowValueInTrx,
      totalCollateralValueInTrx,
      userList,
      marketList
    } = this.props.lend;
    const trxAssetPrice = userList[jtrxAddress]?.assetPrice || marketList[jtrxAddress]?.assetPrice;
    // const per1 = getPercent(totalBorrowUsdForUSDD, borrowLimit); //BigNumber(totalBorrowUsd).div(borrowLimit).times(100);
    // const per2 = getPercent(totalBorrowUsdForUSDD, withdrawLimitAfter, false); // BigNumber(totalBorrowUsd).div(withdrawLimitAfter).times(100)
    const per1 = BigNumber(risk).times(100);
    let per2 = BigNumber(totalBorrowValueInTrx)
      .div(
        BigNumber(totalCollateralValueInTrx).minus(
          BigNumber(withdrawValue)
            .times(popData.assetPrice)
            .times(BigNumber(10).pow(popData.collateralDecimal))
            // .div(BigNumber(10).pow(24))
            .div(Config.defaultPrecision)
            .div(
              BigNumber(trxAssetPrice).gte(Config.oraclePricePrecision)
                ? Config.oraclePricePrecision
                : Config.tokenDefaultPrecision
            )
            .times(popData.collateralFactor)
            .div(Config.tokenDefaultPrecision)
        )
      )
      .times(100);
    if (BigNumber(per2).lt(0) || BigNumber(per2).gte(100)) {
      per2 = BigNumber(100);
    }

    const safeMaxText = this.getSafeMaxText(popData);
    const status1 =
      BigNumber(withdrawValue).gt(0) && (!BigNumber(borrowLimit).eq(0) || !BigNumber(withdrawLimitAfter).eq(0));
    const status2 = BigNumber(withdrawValue).gt(0) && (BigNumber(per2).gt(0) || BigNumber(per1).gt(0));

    const disableStatus = BigNumber(per2).gt(100);
    const { totalApy, depositApy, mintApyUSDD } = getTotalApy(popData, assetList);

    const { transModalInfo } = this.props.system;
    const { declined, transType } = transModalInfo;

    let borrowLimitAfter1 = 0;
    if (withdrawValue && BigNumber(withdrawValue).gte(0)) {
      borrowLimitAfter1 = this.getBorrowLimitAfter(withdrawValue, true);
    }

    return (
      <div className="deposit mt16">
        <div className="safe-input">
          <Input
            className={'j-input ' + (btnText ? 'j-error-input' : '')}
            prefix={isClear ? <span>~</span> : <span></span>}
            placeholder={intl.get('v2.enter_withdraw_amount')}
            size="small"
            allowClear
            addonAfter={this.maxRender(popData)}
            value={addThousandSeparators(withdrawValue)}
            onChange={e => {
              this.withdrawChange(removeThousandSeparators(e.target.value), true);
              this.setState({
                maxValue: -1
              });
            }}
            disabled={approving ? true : false}
          />
          {btnText && (
            <div className="j-error-tip">
              <span className="j-error-img"></span>
              <div>
                {disableStatus && status2 && popData.account_entered !== 0
                  ? intl.get('withdraw.Insufficient_mortgage')
                  : btnText}
              </div>
            </div>
          )}
        </div>
        <div className="j-modal-ele">
          <span className="j-title">{intl.get('deposit.Loanlimit')}</span>
          <span className="j-content ellipsis ml20">
            {BigNumber(withdrawValue).gt(0) ? (
              <>
                <span className="pre">{formatNumber(borrowLimit, 2, { miniText: 0.01, needDolar: true })}</span>
                {status1 && popData.account_entered == 1 && (
                  <>
                    <span className="arrow-right"></span>
                    {formatNumber(borrowLimitAfter1, 2, { miniText: 0.01, needDolar: true })}
                  </>
                )}
              </>
            ) : (
              formatNumber(borrowLimit, 2, { miniText: 0.01, needDolar: true })
            )}
            {/* <span>{formatNumber(borrowLimit, 2, { miniText: 0.01, needDolar: true })}</span>
            {status1 && popData.account_entered == 1 && (
              <>
                <span className="arrow-right"></span>
                {formatNumber(borrowLimitAfter1, 2, { miniText: 0.01, needDolar: true })}
              </>
            )} */}
          </span>
        </div>
        <div className="j-modal-ele">
          <span className="j-title">{intl.get('v2.risk_value')}</span>
          <span className="j-content">
            {BigNumber(withdrawValue).gt(0) ? (
              <>
                <span className="pre">{formatNumber(per1, 2)}</span>
                {status2 && popData.account_entered == 1 && (
                  <>
                    <span className="arrow-right"></span>
                    <span>{setRiskValue(per2, 2)}</span>
                  </>
                )}
              </>
            ) : (
              formatNumber(per1, 2)
            )}
            {/* <span>{formatNumber(per1, 2)}</span>
            {status2 && popData.account_entered == 1 && (
              <>
                <span className="arrow-right"></span>
                <span>{setRiskValue(per2, 2)}</span>
              </>
            )} */}
          </span>
        </div>
        <div className="modal-progress">
          {status2 && popData.account_entered && popData.account_entered !== 0 //popData.account_entered !== 0 has staked
            ? progressV2(per1, per2)
            : progressV2(per1)}
        </div>
        <div className="j-modal-ele">
          <span className="j-title flex jcsb aic">
            <TooltipText
              overlayClassName="j-tooltip-dropdown"
              className="j-tooltip-m"
              title={
                openMint
                  ? tooltip(intl.get('v2.tip1'), [
                      {
                        title: intl.get('v2.tip2')
                      },
                      { title: intl.get('v2.tip3') }
                    ])
                  : tooltip(intl.get('v2.tip1'), [
                      {
                        title: intl.get('v2.tip2')
                      }
                    ])
              }
              placement="topRight"
              arrowPointAtCenter
              trigger={['click', 'hover']}
            >
              {intl.get('v2.supply_apy')}
            </TooltipText>
          </span>
          <span className="j-content">
            {renderPercent(depositApy, { cutZero: false, useFull: false, defaultSymbol: true })} {' + '}
            {renderPercent(mintApyUSDD, { cutZero: false, useFull: false })}
          </span>
        </div>
        <div className="j-modal-ele">
          <span className="j-title">{intl.getHTML('v2.deposit_symbol', { symbol: popData.collateralSymbol })}</span>
          <span className="j-content  balance-change  ellipsis ml20">
            {BigNumber(withdrawValue).gt(0) ? (
              <>
                <span className="pre">
                  {BigNumber(popData.deposited).isNaN()
                    ? 0
                    : formatNumber(BigNumber(popData.deposited), 3, {
                        miniText: 0.01
                      })}
                </span>
                <span className="arrow-right"></span>

                {BigNumber(popData.deposited).minus(withdrawValue).lt(0)
                  ? '--'
                  : formatNumber(BigNumber(popData.deposited).minus(withdrawValue), 3)}
              </>
            ) : (
              <>{BigNumber(popData.deposited).isNaN() ? 0 : formatNumber(BigNumber(popData.deposited), 3)}</>
            )}
          </span>
        </div>
        {approving ? (
          <button className="j-large-btn j-supply j-signing" disabled>
            {intl.get('v2.sign_in_wallet')}
            <span className="siging-icon"></span>
          </button>
        ) : (
          <Button
            className="j-large-btn j-withdraw"
            disabled={!status || (disableStatus && popData.account_entered !== 0)}
            onClick={this.withdraw}
          >
            {intl.get('v2.modal_withdraw')}
            {/* {disableStatus && status2 && popData.account_entered !== 0
              ? intl.get('withdraw.Insufficient_mortgage')
              : btnText} */}
          </Button>
        )}
        {declined && transType === 'withdraw' && (
          <div className="j-error-tip wallet-reject">
            <span className="j-error-img"></span>
            <div>{intl.get('v2.reject_in_wallet')}</div>
          </div>
        )}
      </div>
    );
  };

  getBorrowLimitAfter = (depositValue = 0, isWithdraw) => {
    try {
      const { DAWPop, borrowLimit, trxPrice, userList, marketList } = this.props.lend;
      const { popData } = DAWPop;
      const trxAssetPrice = userList[jtrxAddress]?.assetPrice || marketList[jtrxAddress]?.assetPrice;
      const { precision, assetPrice, jtokenAddress } = popData;
      const collateralFactor = BigNumber(popData.collateralFactor).div(Config.tokenDefaultPrecision);
      let totalUsd = BigNumber(0);
      // if ([Config.usddJtoken, Config.usdtJtoken, Config.tusdJtoken, Config.usdcJtoken].includes(jtokenAddress)) {
      if (jtokenAddress === Config.usddJtoken || jtokenAddress === Config.usddoldJtoken) {
        totalUsd = BigNumber(depositValue).times(collateralFactor);
      } else {
        totalUsd = BigNumber(depositValue)
          .times(precision)
          .times(collateralFactor)
          .times(assetPrice)
          .times(trxPrice)
          // .div(Config.tokenDefaultPrecision)
          .div(
            BigNumber(trxAssetPrice).gte(Config.oraclePricePrecision)
              ? Config.oraclePricePrecision
              : Config.tokenDefaultPrecision
          )
          .div(Config.tokenDefaultPrecision)
          .div(Config.defaultPrecision);
      }

      return isWithdraw
        ? borrowLimit.minus(totalUsd).lt(0)
          ? BigNumber(0)
          : borrowLimit.minus(totalUsd)
        : borrowLimit.plus(totalUsd);
    } catch (err) {
      console.log(`getBorrowLimitAfter error: ${err}`);
    }
  };

  setSafeFee = () => {
    const { balanceInfo } = this.props.lend;
    const { popData } = this.props.lend.DAWPop;
    const { precision, collateralDecimal, jtokenAddress } = popData;
    let tokenBalance = BigNumber(balanceInfo[jtokenAddress].balance).div(precision);
    let depositValueNew = BigNumber(tokenBalance).minus(this.state.trxFee)._toFixed(collateralDecimal, 1);

    this.setState(
      {
        depositValue: depositValueNew
      },
      () => {
        this.depositChange(depositValueNew);
      }
    );
  };

  depositContent = popData => {
    const {
      userList,
      marketList,
      balanceInfo,
      borrowLimit,
      totalBorrowUsdForUSDD,
      assetList,
      risk,
      totalBorrowValueInTrx,
      totalCollateralValueInTrx,
      userDataSource,
      openMint
    } = this.props.lend;
    const trxAssetPrice = userList[jtrxAddress]?.assetPrice || marketList[jtrxAddress]?.assetPrice;

    let account_entered = -1;
    if (userDataSource && userDataSource.length > 0) {
      userDataSource.map(item => {
        if (popData.collateralSymbol === item.collateralSymbol) {
          account_entered = item.account_entered;
        }
      });
    }

    const {
      lang,
      depositValue,
      borrowLimitAfter,
      errInfo1: { btnText, status },
      approving
    } = this.state;
    // const per1 = getPercent(totalBorrowUsdForUSDD, borrowLimit); //BigNumber(totalBorrowUsd).div(borrowLimit).times(100);
    // const per2 = getPercent(totalBorrowUsdForUSDD, borrowLimitAfter); // BigNumber(totalBorrowUsd).div(borrowLimitAfter).times(100);
    const per1 = BigNumber(risk).times(100);
    const per2 = BigNumber(totalBorrowValueInTrx)
      .div(
        BigNumber(totalCollateralValueInTrx).plus(
          BigNumber(depositValue)
            .times(popData.assetPrice)
            .times(BigNumber(10).pow(popData.collateralDecimal))
            // .div(BigNumber(10).pow(24))
            .div(Config.defaultPrecision)
            .div(
              BigNumber(trxAssetPrice).gte(Config.oraclePricePrecision)
                ? Config.oraclePricePrecision
                : Config.tokenDefaultPrecision
            )
            .times(popData.collateralFactor)
            .div(Config.tokenDefaultPrecision)
        )
      )
      .times(100);

    const status1 = depositValue != '' && (!BigNumber(borrowLimit).eq(0) || !BigNumber(borrowLimitAfter).eq(0));
    const status2 = depositValue != '' && (BigNumber(per2).gt(0) || BigNumber(per1).gt(0));
    const { totalApy, depositApy, mintApyUSDD } = getTotalApy(popData, assetList);

    const { precision, collateralDecimal, jtokenAddress, collateralAddress } = popData;
    let tokenBalance = BigNumber(balanceInfo[jtokenAddress].balance).div(precision);

    const { transModalInfo } = this.props.system;
    const { declined, transType } = transModalInfo;

    let borrowLimitAfter1 = 0;
    if (depositValue && BigNumber(depositValue).gte(0)) {
      borrowLimitAfter1 = this.getBorrowLimitAfter(depositValue, false);
    }

    // const { DAWPop } = this.props.lend;
    // let { popData } = DAWPop;

    // if (userDataSource && userDataSource.length > 0) {
    //   userDataSource.map(item => {
    //     if (item.collateralSymbol === popData.collateralSymbol) {
    //       popData.account_entered = item.account_entered;
    //       popData.deposited = item.deposited;
    //       popData.deposited_usd = item.deposited_usd;
    //     }
    //   });
    // }
    let borrowLimitAfter2 = BigNumber(
      popData.jtokenAddress === Config.usddJtoken || popData.jtokenAddress === Config.usddoldJtoken
        ? popData.deposited
        : popData.deposited_usd
    )
      .times(popData.collateralFactor)
      .div(Config.tokenDefaultPrecision);

    borrowLimitAfter2 = BigNumber(borrowLimitAfter2).isNaN() ? 0 : borrowLimitAfter2;

    return (
      <div className="deposit mt10">
        <div className="j-wallet">
          <span>{intl.get('deposit.wallet_balance')}</span>
          {renderBalance(popData, balanceInfo, 3, true)}
          {/* <a
            className="j-link hover ml-4"
            href={`${Config.sunSwap}?lang=${lang}${
              popData.collateralSymbol === 'TRX' ? '' : `?tokenAddress=${popData.collateralAddress}&type=swap`
            }`}
            target="sunswap"
          >
            {intl.get('index.get')}
          </a> */}
        </div>
        <div className="safe-input">
          <Input
            className={'j-input ' + (btnText ? 'j-error-input' : '')}
            placeholder={intl.get('v2.enter_deposit_amount')}
            allowClear
            addonAfter={
              <span
                className="pointer"
                onClick={() => {
                  this.clickMax();
                }}
              >
                {intl.get('v2.max')}
              </span>
            }
            value={addThousandSeparators(depositValue)}
            onChange={e => this.depositChange(removeThousandSeparators(e.target.value))}
            disabled={approving ? true : false}
          />
          {btnText && (
            <div className="j-error-tip">
              <span className="j-error-img"></span>
              <div>{btnText}</div>
            </div>
          )}
          {status && BigNumber(tokenBalance).lte(this.state.trxFee) ? (
            <div className="j-safe-tip">
              <span className="j-safe-img"></span>
              <div className="j-safe-text">{intl.getHTML('v2.tip14', { value: this.state.trxFee })}</div>
            </div>
          ) : status && BigNumber(BigNumber(tokenBalance).minus(this.state.trxFee)).lt(depositValue) ? (
            <div className="j-safe-tip">
              <span className="j-safe-img"></span>
              <div className="j-safe-text">
                {intl.getHTML('v2.tip14', { value: this.state.trxFee })}
                <span className="safe-fee" onClick={e => this.setSafeFee()}>
                  {intl.get('v2.tip15')}
                </span>
              </div>
            </div>
          ) : (
            ''
          )}
        </div>
        <div className="j-modal-ele">
          <span className="j-title">
            {/* {intl.get('v2.borrow_limit')} */}
            {status1 && account_entered !== 1 ? (
              <TooltipText
                className="j-tooltip-m"
                overlayClassName="j-tooltip-dropdown"
                title={intl.getHTML('v2.tip13', {
                  value: formatNumber(BigNumber(borrowLimitAfter2).plus(borrowLimitAfter1), 2, {
                    miniText: 0.01,
                    needDolar: true
                  })
                })}
                placement="bottomLeft"
                arrowPointAtCenter
                trigger={['click', 'hover']}
                onOpen={window.gtag('event', 'H5_Collateral', { 'event_category': 'H5', 'event_label': 'Collateral' })}
              >
                {intl.get('v2.borrow_limit')}
              </TooltipText>
            ) : (
              intl.get('v2.borrow_limit')
            )}
          </span>
          <span className="j-content ellipsis ml20">
            {BigNumber(depositValue).gt(0) ? (
              <>
                <span className="pre">{formatNumber(borrowLimit, 2, { miniText: 0.01, needDolar: true })}</span>
                {status1 && account_entered === 1 && (
                  <>
                    <span className="arrow-right"></span>

                    {formatNumber(borrowLimitAfter1, 2, { miniText: 0.01, needDolar: true })}
                  </>
                )}
              </>
            ) : (
              formatNumber(borrowLimit, 2, { miniText: 0.01, needDolar: true })
            )}
            {/* <span className="pre">{formatNumber(borrowLimit, 2, { miniText: 0.01, needDolar: true })}</span>
            {status1 && account_entered === 1 && (
              <>
                <span className="arrow-right"></span>

                {formatNumber(borrowLimitAfter1, 2, { miniText: 0.01, needDolar: true })}
              </>
            )} */}
          </span>
        </div>
        <div className="j-modal-ele">
          <span className="j-title">{intl.get('v2.risk_value')}</span>
          <span className="j-content">
            {BigNumber(depositValue).gt(0) ? (
              <>
                <span className="pre">{formatNumber(per1, 2)}</span>
                {status2 && popData.account_entered == 1 && (
                  <>
                    <span className="arrow-right"></span>
                    {/* {renderPercent(per2)} */}
                    <span>{setRiskValue(per2, 2)}</span>
                  </>
                )}
              </>
            ) : (
              formatNumber(per1, 2)
            )}
            {/* <span className="pre">{formatNumber(per1, 2)}</span>
            {status2 && popData.account_entered == 1 && (
              <>
                <span className="arrow-right"></span>
                <span>{setRiskValue(per2, 2)}</span>
              </>
            )} */}
          </span>
        </div>
        <div className="modal-progress">
          {popData.account_entered === 1 ? progressV2(per1, per2) : progressV2(per1)}
          {/* {renderProgress(per2, { showInfo: false, reverse: true })} */}
        </div>

        <div className="j-modal-ele mt30">
          <span className="j-title flex jcsb aic">
            <TooltipText
              className="j-tooltip-m"
              overlayClassName="j-tooltip-dropdown"
              title={
                openMint
                  ? tooltip(intl.get('v2.tip1'), [
                      {
                        title: intl.get('v2.tip2')
                      },
                      { title: intl.get('v2.tip3') }
                    ])
                  : tooltip(intl.get('v2.tip1'), [
                      {
                        title: intl.get('v2.tip2')
                      }
                    ])
              }
              placement="topLeft"
              arrowPointAtCenter
              trigger={['click', 'hover']}
            >
              {intl.get('v2.supply_apy')}
            </TooltipText>
          </span>
          <span className="j-content">
            {renderPercent(depositApy, { cutZero: false, useFull: false, defaultSymbol: true })} {' + '}
            {renderPercent(mintApyUSDD, { cutZero: false, useFull: false })}
          </span>
        </div>
        <div className="j-modal-ele">
          <span className="j-title">{intl.getHTML('v2.deposit_symbol', { symbol: popData.collateralSymbol })}</span>
          <span className="j-content  balance-change ellipsis">
            {BigNumber(depositValue).gt(0) ? (
              <>
                <span className="pre">
                  {BigNumber(popData.deposited).isNaN()
                    ? 0
                    : formatNumber(BigNumber(popData.deposited), 3, {
                        miniText: 0.01
                      })}
                </span>
                <span className="arrow-right"></span>

                {formatNumber(
                  BigNumber(popData.deposited).isNaN() ? depositValue : BigNumber(popData.deposited).plus(depositValue),
                  3,
                  { miniText: 0.01 }
                )}
              </>
            ) : (
              <>
                {' '}
                {BigNumber(popData.deposited).isNaN()
                  ? 0
                  : formatNumber(BigNumber(popData.deposited), 3, { miniText: 0.01 })}
              </>
            )}
          </span>
        </div>
        {approving ? (
          <button className="j-large-btn j-supply j-signing" disabled>
            {intl.get('v2.sign_in_wallet')}
            <span className="siging-icon"></span>
          </button>
        ) : (
          <>
            {!!popData?.mintPaused ? (
              <Tooltip
                title={intl.get('v2.close_supply_tip_' + popData?.collateralSymbol?.toLocaleLowerCase(), {
                  token: popData?.collateralSymbol?.toLocaleUpperCase()
                })}
                placement="top"
                arrowPointAtCenter
                trigger={['click', 'hover']}
                overlayClassName="j-tooltip-dropdown"
              >
                <Button className="j-large-btn j-supply disabled">{intl.get('v2.modal_deposit')}</Button>
              </Tooltip>
            ) : (
              <Button className="j-large-btn j-supply" onClick={() => this.deposit()} disabled={!status}>
                {intl.get('v2.modal_deposit')}
              </Button>
            )}
          </>
        )}
        {declined && transType === 'deposit' && (
          <div className="j-error-tip wallet-reject">
            <span className="j-error-img"></span>
            <div>{intl.get('v2.reject_in_wallet')}</div>
          </div>
        )}
      </div>
    );
  };

  deposit = async () => {
    window.gtag('event', 'H5_supply_modal_supply_button', {
      'event_category': 'H5',
      'event_label': 'supply_modal_supply_button'
    });
    this.props.system.clearRejectError();

    const { depositValue, borrowLimitAfter } = this.state;
    const { DAWPop, userDataSource, borrowLimit, userList, marketList } = this.props.lend;
    let { popData } = DAWPop;

    if (userDataSource && userDataSource.length > 0) {
      userDataSource.map(item => {
        if (item.collateralSymbol === popData.collateralSymbol) {
          popData.account_entered = item.account_entered;
          popData.deposited = item.deposited;
          popData.deposited_usd = item.deposited_usd;
        }
      });
    }
    let borrowLimitAfter1 = BigNumber(
      popData.jtokenAddress === Config.usddJtoken || popData.jtokenAddress === Config.usddoldJtoken
        ? popData.deposited
        : popData.deposited_usd
    )
      .times(popData.collateralFactor)
      .div(Config.tokenDefaultPrecision);

    borrowLimitAfter1 = BigNumber(borrowLimitAfter1).isNaN() ? 0 : borrowLimitAfter1;

    const intlObj = {
      title: 'v2.transaction_confirm',
      title2: 'deposit.transactionsent',
      title3: 'v2.transaction_confirm_fail',
      title4: 'deposit.confirm_transaction',
      obj: {
        value: depositValue,
        token: popData.collateralSymbol || '',
        transInfo: {
          show: popData.account_entered !== 1,
          borrowLimitAfter: BigNumber(borrowLimitAfter).plus(borrowLimitAfter1),
          collateralFactor: BigNumber(popData.collateralFactor).div(Config.tokenDefaultPrecision).times(100),
          jtokenAddress: popData.jtokenAddress
        }
      },
      transType: 'deposit'
    };
    this.setState({ isSuccess: false, txID: '', approving: true });

    const amount = new BigNumber(depositValue).times(popData.precision)._toHex();
    const contractAddress = popData.jtokenAddress;
    let funcSelector = 'mint(uint256)';
    let parameters = [{ type: 'uint256', value: amount }];
    let preOptions = {};
    if (popData.collateralAddress === Config.zeroAddr) {
      funcSelector = 'mint()';
      parameters = [];
      preOptions = { callValue: amount };
    }
    const feeLimit = await this.props.system.getFeeLimitCommon(contractAddress, funcSelector, parameters, preOptions);
    const options = { feeLimit };

    const txID = await this.props.system.justMint(popData, amount, intlObj, options);
    if (txID) {
      window.gtag('event', 'H5_supply_modal_success', {
        'event_category': 'H5',
        'event_label': 'supply_modal_success'
      });
      setTimeout(() => {
        this.props.lend.getTokenBalanceInfo();
      }, 5000);
    }
    this.setState({ approving: false });
  };

  getDepositFee = async depositValue => {
    // const { depositValue } = this.state;
    const { DAWPop, energyFee, getEnergyFee } = this.props.lend;
    const { popData } = DAWPop;

    const intlObj = {
      title: 'v2.transaction_confirm',
      title2: 'deposit.transactionsent',
      title3: 'v2.transaction_confirm_fail',
      title4: 'deposit.confirm_transaction',
      obj: {
        value: depositValue,
        token: popData.collateralSymbol || ''
      }
    };

    const energy = await this.props.system.justMintValue(
      popData,
      new BigNumber(depositValue).times(popData.precision)._toHex(),
      intlObj
    );
    let fee = energyFee || (await getEnergyFee());
    const trxFee = BigNumber(BigNumber(energy).times(fee).div(1e6)._toFixed(0, 1)).plus(2).toNumber();
    this.setState({ trxFee });
  };

  withdraw = async () => {
    this.props.system.clearRejectError();

    window.gtag('event', 'H5_supply_modal_withdraw_button', {
      'event_category': 'H5',
      'event_label': 'supply_modal_withdraw_button'
    });

    const { withdrawValue, isClear } = this.state;
    const { popData } = this.props.lend.DAWPop;
    const { jtokenAddress } = popData;
    const intlObj = {
      title: 'v2.transaction_confirm',
      title2: 'deposit.transactionsent',
      title3: 'v2.transaction_confirm_fail',
      title4: 'deposit.confirm_transaction',
      obj: {
        value: withdrawValue,
        token: popData.collateralSymbol
      },
      transType: 'withdraw'
    };

    this.setState({ approving: true });
    if (isClear) {
      const { value } = await getTRC20Balance(jtokenAddress, window.defaultAccount);

      const contractAddress = popData.jtokenAddress;
      let funcSelector = 'redeem(uint256)';
      const amount = new BigNumber(value)._toHex();
      let parameters = [{ type: 'uint256', value: amount }];
      const feeLimit = await this.props.system.getFeeLimitCommon(contractAddress, funcSelector, parameters);
      const options = { feeLimit };

      await this.props.system.justRedeem(popData, amount, intlObj, true, options);
      this.setState({ approving: false });
      return;
    }

    const contractAddress = popData.jtokenAddress;
    let funcSelector = 'redeemUnderlying(uint256)';
    const amount = new BigNumber(withdrawValue).times(popData.precision)._toHex();
    let parameters = [{ type: 'uint256', value: amount }];
    const feeLimit = await this.props.system.getFeeLimitCommon(contractAddress, funcSelector, parameters);
    const options = { feeLimit };
    const txID = await this.props.system.justRedeem(popData, amount, intlObj, options);

    if (txID) {
      window.gtag('event', 'H5_supply_modal_withdraw_success', {
        'event_category': 'H5',
        'event_label': 'supply_modal_withdraw_success'
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

    this.setState({ approving: false });
  };

  approveContent = popData => {
    const { balanceInfo, assetList, theme, openMint } = this.props.lend;
    const { lang, approving } = this.state;
    const { totalApy, depositApy, mintApyUSDD } = getTotalApy(popData, assetList);
    popData.transType = 'approve';

    const isWhite = theme === 'white';

    const { transModalInfo } = this.props.system;
    const { declined, transType } = transModalInfo;

    return (
      <div className="approve-content">
        <div className="img">
          <div className="approve-icon"></div>
        </div>
        <div className="approve-tip">{intl.getHTML('deposit.explanation1', { value: popData.collateralSymbol })}</div>
        <div className="j-modal-ele approve-apy">
          <span className="j-title flex jcsb aic">
            <TooltipText
              className="j-tooltip-m"
              overlayClassName="j-tooltip-dropdown"
              title={
                openMint
                  ? tooltip(intl.get('v2.tip1'), [
                      {
                        title: intl.get('v2.tip2')
                      },
                      { title: intl.get('v2.tip3') }
                    ])
                  : tooltip(intl.get('v2.tip1'), [
                      {
                        title: intl.get('v2.tip2')
                      }
                    ])
              }
              placement="topLeft"
              arrowPointAtCenter
              trigger={['click', 'hover']}
            >
              {intl.get('v2.supply_apy')}
            </TooltipText>
          </span>
          <span className="j-content">
            {renderPercent(depositApy, { cutZero: false, useFull: false, defaultSymbol: true })} {' + '}
            {renderPercent(mintApyUSDD, { cutZero: false, useFull: false })}
          </span>
        </div>
        {approving ? (
          // <button className="j-large-btn j-supply" disabled>
          //   <div className="points">
          //     <span className="point"></span>
          //     <span className="point"></span>
          //     <span className="point"></span>
          //   </div>
          // </button>
          <button className="j-large-btn j-supply j-signing" disabled>
            {intl.get('v2.sign_in_wallet')}
            <span className="siging-icon"></span>
          </button>
        ) : (
          <button
            className="j-large-btn j-supply"
            onClick={async () => {
              this.props.system.clearRejectError();
              window.gtag('event', 'H5_supply_approve', { 'event_category': 'H5', 'event_label': 'supply_approve' });
              this.setState({
                approving: true
              });

              const contractAddress = popData.collateralAddress;
              let funcSelector = 'approve(address,uint256)';
              let parameters = [
                { type: 'address', value: popData.jtokenAddress },
                { type: 'uint256', value: MAX_UINT256 }
              ];
              const feeLimit = await this.props.system.getFeeLimitCommon(contractAddress, funcSelector, parameters);
              const options = { feeLimit };

              const txID = await this.props.system.approveToken(popData, false, options);
              if (txID) {
                window.gtag('event', 'H5_supply_approve_success', {
                  'event_category': 'H5',
                  'event_label': 'supply_approve_success'
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
          </button>
        )}
        {declined && transType === 'approve' && (
          <div className="j-error-tip wallet-reject">
            <span className="j-error-img"></span>
            <div>{intl.get('v2.reject_in_wallet')}</div>
          </div>
        )}
      </div>
    );
  };

  distribute = type => {
    if (type === 1) {
      window.gtag('event', 'H5_supply_modal_supply_tab', {
        'event_category': 'H5',
        'event_label': 'supply_modal_supply_tab'
      });
    } else if (type === 2) {
      window.gtag('event', 'H5_supply_modal_withdraw_tab', {
        'event_category': 'H5',
        'event_label': 'supply_modal_withdraw_tab'
      });
    }
    const { DAWPop, balanceInfo = {}, userList, marketList } = this.props.lend;
    let { popData } = DAWPop;
    const { jtokenAddress, collateralAddress } = popData;
    popData = userList[jtokenAddress] || marketList[jtokenAddress];
    const approved = (balanceInfo[jtokenAddress] && BigNumber(balanceInfo[jtokenAddress].allowance).gt(0)) || false;
    // console.log(approved, collateralAddress, BigNumber(balanceInfo[jtokenAddress].allowance).gt(0), '1234');

    if (popData && jtokenAddress && balanceInfo[jtokenAddress]) {
      return type === 1
        ? collateralAddress === Config.zeroAddr || approved
          ? this.depositContent(popData)
          : this.approveContent(popData)
        : this.withDrawContent(popData);
    }
    return (
      <div className="loading-box">
        <Spin size="large" />
      </div>
    );
  };

  // enter withdraw amount
  withdrawChange = async (inputValue, fromInput = false) => {
    try {
      const { DAWPop, balanceInfo, userList, marketList, risk, totalBorrowValueInTrx, totalCollateralValueInTrx } =
        this.props.lend;
      let { popData = {} } = DAWPop;
      const { jtokenAddress } = popData;
      popData = userList[jtokenAddress] || marketList[jtokenAddress];
      const trxAssetPrice = userList[jtrxAddress]?.assetPrice || marketList[jtrxAddress]?.assetPrice;
      const { deposited = 0, totalCash, collateralDecimal } = popData;
      const { valid, str } = numberParser(inputValue, popData.collateralDecimal);
      if (valid) {
        let status = this.state.errInfo2.status;
        let btnText = this.state.errInfo2.btnText;
        let isClear = this.state.isClear;
        this.setState({
          isClear: fromInput ? false : isClear,
          withdrawValue: str
        });
        if (popData.account_entered !== 2 && inputValue != 0) {
          this.setState({
            withdrawLimitAfter:
              str === '' || !checkEnteredMarket(userList, jtokenAddress) ? 0 : this.getBorrowLimitAfter(str, true)
          });
        }
        const value = BigNumber(str);
        let per2 = BigNumber(totalBorrowValueInTrx)
          .div(
            BigNumber(totalCollateralValueInTrx).minus(
              BigNumber(inputValue)
                .times(popData.assetPrice)
                .times(BigNumber(10).pow(popData.collateralDecimal))
                // .div(BigNumber(10).pow(24))
                .div(Config.defaultPrecision)
                .div(
                  BigNumber(trxAssetPrice).gte(Config.oraclePricePrecision)
                    ? Config.oraclePricePrecision
                    : Config.tokenDefaultPrecision
                )
                .times(popData.collateralFactor)
                .div(Config.tokenDefaultPrecision)
            )
          )
          .times(100);

        if (BigNumber(per2).lt(0) || BigNumber(per2).gte(100)) {
          per2 = BigNumber(100);
        }

        if (BigNumber(per2).gte(100)) {
          status = false;
          btnText = intl.get('withdraw.Insufficient_mortgage');
        } else if (gtBalance(value, deposited)) {
          status = false;
          // btnText = intl.get('withdraw.Insufficient_withdrawamount');
          btnText = intl.get('v2.tip25');
        } else if (value.isNaN() || value.eq(0)) {
          status = false;
          btnText = '';
          // btnText = intl.get('withdraw.enter_amount');
        } else if (BigNumber(value).gt(BigNumber(totalCash).div(BigNumber(10).pow(collateralDecimal)))) {
          status = false;
          btnText = intl.get('withdraw_lack');
        } else {
          status = true;
          btnText = '';
          // btnText = intl.get('deposit.withdraw');
        }
        this.setState({
          errInfo2: {
            status,
            btnText
          }
        });
      }
    } catch (error) {}
  };

  // enter deposit amount
  depositChange = inputValue => {
    try {
      const { DAWPop, balanceInfo, userList } = this.props.lend;
      const { popData = {} } = DAWPop;
      const { jtokenAddress, precision, collateralSymbol } = popData;
      const { balance } = balanceInfo[jtokenAddress] || {};
      const { valid, str } = numberParser(inputValue, popData.collateralDecimal);

      if (valid) {
        let status = this.state.errInfo1.status;
        let btnText = this.state.errInfo1.btnText;

        this.setState({
          depositValue: str,
          borrowLimitAfter: str === '' ? this.props.lend.borrowLimit : this.getBorrowLimitAfter(str)
        });
        const value = BigNumber(str);
        if (gtBalance(value, balance, precision)) {
          status = false;
          btnText = intl.get('deposit.amountout');
        } else if (value.isNaN() || value.eq(0)) {
          status = false;
          btnText = '';
          // btnText = intl.get('deposit.enteramount2');
        } else {
          status = true;
          btnText = '';
          // btnText = intl.get('deposit.deposit');
        }

        if (status && !this.state.trxFee && collateralSymbol === 'TRX') {
          this.getDepositFee(str);
        }

        this.setState({
          errInfo1: {
            status,
            btnText
          }
        });
      }
    } catch (error) {}
  };

  changeTab = activeKey => {
    this.props.system.clearRejectError();

    activeKey == 1 ? this.withdrawChange('', true) : this.depositChange('', true);
    const { DAWPop } = this.props.lend;
    const { popData } = DAWPop;
    this.props.lend.setData({
      DAWPop: {
        show: true,
        activeKey,
        popData
      }
    });
  };

  getDepositStatus = popData => {
    try {
      const { userList } = this.props.lend;
      const { jtokenAddress } = popData;
      const { borrowBalanceNew = 0 } = userList[jtokenAddress] || {};
      // console.log(BigNumber(borrowBalanceNew).gt(0));
      return BigNumber(borrowBalanceNew).gt(0);
    } catch (err) {
      return false;
    }
  };

  render() {
    const { DAWPop } = this.props.lend;
    const { popData = {} } = DAWPop;
    const { collateralSymbol, logoUrl } = popData;
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
        width={400}
        height={560}
        centered
        maskClosable={false}
        visible={DAWPop.show}
        closable={true}
        onCancel={() => {
          this.props.lend.hideDAWPop();
          this.props.system.clearRejectError();
          window.gtag('event', 'H5_supply_modal_close', {
            'event_category': 'H5',
            'event_label': 'supply_modal_close'
          });
        }}
        footer={null}
        className="j-modal j-daw-modal"
        getContainer={() => document.querySelector('.j-wrapper')}
      >
        <Tabs
          className="j-supply"
          defaultActiveKey={DAWPop.activeKey}
          activeKey={DAWPop.activeKey}
          centered
          type="card"
          onChange={this.changeTab}
        >
          <TabPane tab={intl.get('v2.modal_deposit')} key="1">
            {this.distribute(1)}
          </TabPane>
          <TabPane tab={intl.get('v2.modal_withdraw')} key="2">
            {this.distribute(2)}
          </TabPane>
        </Tabs>
      </Modal>
    );
  }
}

export default depositeAndWithdrawMobile;
