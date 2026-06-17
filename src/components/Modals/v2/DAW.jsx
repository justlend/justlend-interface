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
  getTotalApy,
  progressV2,
  setRiskValue,
  tooltip,
  addThousandSeparators,
  removeThousandSeparators,
  toFixedUp
} from '../../../utils/helper';
import { getTRC20Balance, getCash, MAX_UINT256 } from '../../../utils/blockchain';
import { Modal, Tabs, Input, Progress, Button, Tooltip, Select, Spin } from 'antd';
import intl from 'react-intl-universal';
import '../../../assets/css/modal.scss';
import Config from '../../../config';
import { TooltipText } from '../../v2/strx/TooltipText';
import WstusdtInput from './WstusdtInput';
import { checkIfShouldShowMintApyDetail } from '../../v2/market-detail/utils';
import { getLendIcons } from '../../../utils/constant';

const { jtrxAddress } = Config;
const { TabPane } = Tabs;
@inject('network')
@inject('lend')
@inject('system')
@inject('user')
@inject('market')
@observer
class depositeAndWithdraw extends React.Component {
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
      maxValue: -1,
      wstUSDTInputValue: '',
      wstUSDTSelectedToken: 'wstusdt',
      mobile: isMobile(window.navigator).any
    };
  }
  componentDidMount = () => {
    this.startInterval();

    const { borrowLimit } = this.props.user;
    const { activeKey } = this.props.market.DAWPop;

    this.setState({
      borrowLimitAfter: borrowLimit,
      withdrawLimitAfter: borrowLimit
    });

    document.body.style.overflow = 'hidden';

    if (activeKey === '1') {
      const { hasApproved } = this.getApprovedLimit();
      if (!hasApproved) {
        window.gtag('event', 'PC_supply_approve1tips', {
          'event_category': 'PC_V1.7.6',
          'event_label': 'supply_approve1tips'
        });
      }
    }
  };

  componentWillUnmount() {
    clearInterval(this.timerInterval);
    this.timerInterval = null;
    document.body.style.overflow = 'auto';
  }

  getCash = async () => {
    const { popData = {} } = this.props.market.DAWPop;

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
    if (!BigNumber(prevProps.user.borrowLimit).eq(this.props.user.borrowLimit)) {
      if (Number(this.props.market.DAWPop.activeKey) === 1) {
        return this.depositChange(this.state.depositValue);
      }
      if (Number(this.props.market.DAWPop.activeKey) === 2) {
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
      const { userList, borrowLimit, totalBorrowUsdForUSDD } = this.props.user;
      const { marketList, trxPrice } = this.props.market;
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
      const { userList, borrowLimit, totalBorrowUsdForUSDD } = this.props.user;
      const { marketList, trxPrice } = this.props.market;
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
      const { balanceInfo } = this.props.market;
      const { popData } = this.props.market.DAWPop;
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
      const { userList, borrowLimit, totalBorrowUsdForUSDD } = this.props.user;
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
    const { userList, borrowLimit, totalBorrowUsdForUSDD } = this.props.user;
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
            window.gtag('event', 'PC_withdraw_maxsafe', {
              'event_category': 'PC_V1.5',
              'event_label': 'withdraw_maxsafe'
            });
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
    }
  };

  withDrawContent = popData => {
    const {
      withdrawValue,
      withdrawLimitAfter,
      isClear,
      errInfo2: { btnText, status },
      approving,
      mobile
    } = this.state;
    const { theme, openMint } = this.props.lend;
    const { risk, userList, totalBorrowValueInTrx, totalCollateralValueInTrx, borrowLimit } = this.props.user;
    const { marketList, assetList, noService, riojBalance } = this.props.market;
    const trxAssetPrice = userList[jtrxAddress]?.assetPrice || marketList[jtrxAddress]?.assetPrice;
    const { isConnected } = this.props.network;

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
    const { totalApy, depositApy, mintApyUSDD, underlyingIncrementApy } = getTotalApy(popData, assetList);

    const { transModalInfo } = this.props.system;
    const { declined, transType } = transModalInfo;

    let borrowLimitAfter1 = 0;
    if (withdrawValue && BigNumber(withdrawValue).gte(0)) {
      borrowLimitAfter1 = this.getBorrowLimitAfter(withdrawValue, true);
    }

    const shouldShowMiningApyDetail =
      checkIfShouldShowMintApyDetail(true, popData.collateralSymbol, mintApyUSDD) && openMint;

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
          <span className="j-content">
            <span>{formatNumber(borrowLimit, 2, { miniText: 0.01, needDolar: true })}</span>
            {status1 && popData.account_entered == 1 && (
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
            {status2 && popData.account_entered == 1 && (
              <>
                <span className="arrow-right"></span>
                <span>{setRiskValue(per2, 2)}</span>
              </>
            )}
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
              title={this.depositApyTootipRender(popData, shouldShowMiningApyDetail)}
              placement="topLeft"
              arrowPointAtCenter
            >
              <span>{intl.get('v2.supply_apy')}</span>
            </TooltipText>
            {mobile ? null : (
              <Tooltip
                overlayClassName="j-tooltip-dropdown"
                title={this.depositApyTootipRender(popData, shouldShowMiningApyDetail)}
                placement="top"
                arrowPointAtCenter
              >
                <span className="j-tooltip-icon ml-4"></span>
              </Tooltip>
            )}
          </span>
          <span className="j-content">
            {Config.holdingTokens.includes(popData.collateralSymbol)
              ? renderPercent(BigNumber(depositApy), { cutZero: false, useFull: false, defaultSymbol: true })
              : renderPercent(BigNumber(depositApy).plus(underlyingIncrementApy), {
                  cutZero: false,
                  useFull: false,
                  defaultSymbol: true
                })}
            {Config.holdingTokens.includes(popData.collateralSymbol) &&
              ' + ' + renderPercent(underlyingIncrementApy, { cutZero: false, useFull: false })}
            {shouldShowMiningApyDetail && ' + ' + renderPercent(mintApyUSDD, { cutZero: false, useFull: false })}
          </span>
        </div>
        <div className="j-modal-ele">
          <span className="j-title">{intl.getHTML('v2.deposit_symbol', { symbol: popData.collateralSymbol })}</span>
          <span className="j-content balance-change ellipsis">
            {BigNumber(withdrawValue).gt(0) ? (
              <>
                <span className="pre">
                  {BigNumber(popData.deposited).isNaN()
                    ? 0
                    : formatNumber(BigNumber(popData.deposited), 3, {
                        miniText: 0.001
                      })}
                </span>
                <span className="arrow-right"></span>

                {BigNumber(popData.deposited).minus(withdrawValue).lt(0)
                  ? '--'
                  : formatNumber(BigNumber(popData.deposited).minus(withdrawValue), 3)}
              </>
            ) : (
              <>
                {BigNumber(popData.deposited).isNaN()
                  ? 0
                  : formatNumber(BigNumber(popData.deposited), 3, {
                      miniText: 0.001
                    })}
              </>
            )}
          </span>
        </div>
        {approving ? (
          <button className="j-large-btn j-supply j-signing" disabled>
            {intl.get('v2.sign_in_wallet')}
            <span className="siging-icon"></span>
          </button>
        ) : this.props.market.continueWhileDisabled && isConnected ? (
          <Tooltip
            title={intl.get('season.not_awailable')}
            overlayClassName={'j-tooltip-dropdown season season-l ' + theme}
            arrowPointAtCenter
            placement="top"
            getPopupContainer={() => document.querySelector('.ant-btn.j-large-btn.j-withdraw, .j-large-btn.j-withdraw')}
          >
            <Button className="j-large-btn j-withdraw disabled season">{intl.get('v2.modal_withdraw')}</Button>
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
            getPopupContainer={() => document.querySelector('.ant-btn.j-large-btn.j-withdraw, .j-large-btn.j-withdraw')}
          >
            <Button className="j-large-btn j-withdraw disabled season">{intl.get('v2.modal_withdraw')}</Button>
          </Tooltip>
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
      const { userList, borrowLimit } = this.props.user;
      const { marketList, trxPrice, DAWPop } = this.props.market;
      const { popData } = DAWPop;
      const { precision, assetPrice, jtokenAddress } = popData;
      const trxAssetPrice = userList[jtrxAddress]?.assetPrice || marketList[jtrxAddress]?.assetPrice;
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
    const { balanceInfo, DAWPop } = this.props.market;
    const { popData } = DAWPop;
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

  depositApyTootipRender = (popData, shouldShowMiningApyDetail) => {
    let depositApy, underlyingIncrementApy;
    if (Config.holdingTokens.includes(popData.collateralSymbol)) {
      depositApy = popData.depositedAPY
        ? BigNumber(popData.depositedAPY).times(100)
        : BigNumber(popData.supplyratePerblock).div(Config.tokenDefaultPrecision).times(Config.blockPerYear).times(100);
      underlyingIncrementApy = popData.underlyingIncrementApy
        ? BigNumber(popData.underlyingIncrementApy).times(100)
        : 0;

      depositApy =
        formatNumber(depositApy, 2, {
          per: true,
          miniText: '0.01',
          defaultSymbol: true
        }) + '%';
      underlyingIncrementApy =
        formatNumber(underlyingIncrementApy, 2, {
          per: true,
          miniText: '0.01',
          defaultSymbol: true
        }) + '%';
    }

    // title
    let title = intl.get('risk_tip.basic_apy');
    if (popData.collateralSymbol === 'wstUSDT') {
      title = intl.get('risk_tip.wstUSDT_apy');
    }
    if (popData.collateralSymbol === 'sTRX') {
      title = intl.get('risk_tip.strx_apy');
    }
    if (shouldShowMiningApyDetail) {
      title = title + intl.get('apy_formula.plus') + intl.get('apy_formula.mining_apy');
    }

    // content
    let tipsArr = [
      {
        title:
          popData.collateralSymbol === 'wstUSDT'
            ? intl.get('risk_tip.wstUSDT_modal1', { depositApy, underlyingIncrementApy })
            : popData.collateralSymbol === 'sTRX'
            ? intl.get('risk_tip.sTRX_modal1', { depositApy, underlyingIncrementApy })
            : intl.get('v2.tip2')
      }
    ];

    if (popData.collateralSymbol === 'wstUSDT') {
      tipsArr.push({ title: intl.get('risk_tip.wstUSDT_modal2') });
    } else if (popData.collateralSymbol === 'sTRX') {
      tipsArr.push({ title: intl.get('risk_tip.sTRX_modal2') });
    }

    if (shouldShowMiningApyDetail) {
      tipsArr.push({ title: intl.get('v2.tip3') });
    }

    return tooltip(title, tipsArr);
  };

  getApprovedLimit = (token, value1, value2) => {
    const { wstUSDTSelectedToken, depositValue, wstUSDTInputValue } = this.state;
    const { wstUSDTbalanceInfo } = this.props.lend;
    const { userList } = this.props.user;
    const { balanceInfo, marketList, DAWPop } = this.props.market;
    let { popData } = DAWPop;
    const { jtokenAddress } = popData;
    popData = userList[jtokenAddress] || marketList[jtokenAddress];
    const wsToken = token || wstUSDTSelectedToken;
    const dValue = value1 || depositValue;
    const wValue = value2 || wstUSDTInputValue;

    let approved = false;
    let hasApproved = false;

    if (popData.collateralSymbol !== 'wstUSDT' || wsToken === 'wstusdt') {
      const allowance = balanceInfo[jtokenAddress]?.allowance;

      hasApproved = allowance && BigNumber(allowance)?.gt(0);
      approved =
        allowance &&
        BigNumber(allowance).gt(0) &&
        BigNumber(allowance)?.gte(BigNumber(BigNumber(dValue).isNaN() ? 0 : dValue).times(popData.precision));
    } else {
      let allowance = wstUSDTbalanceInfo[Config[wsToken].token]?.allowance;
      hasApproved = BigNumber(allowance)?.gt(0);
      approved =
        BigNumber(allowance).gt(0) &&
        BigNumber(allowance)?.gte(BigNumber(BigNumber(wValue).isNaN() ? 0 : wValue).times(Config[wsToken].precision));
    }

    return { approved, hasApproved };
  };

  depositContent = popData => {
    const { theme, openMint } = this.props.lend;
    const { risk, userList, totalBorrowValueInTrx, totalCollateralValueInTrx, userDataSource, borrowLimit } =
      this.props.user;
    const { marketList, balanceInfo, assetList, noService, riojBalance } = this.props.market;
    const trxAssetPrice = userList[jtrxAddress]?.assetPrice || marketList[jtrxAddress]?.assetPrice;
    const { isConnected } = this.props.network;

    let account_entered = -1;
    if (userDataSource && userDataSource.length > 0) {
      userDataSource.map(item => {
        if (popData.collateralSymbol === item.collateralSymbol) {
          account_entered = item.account_entered;
        }
      });
    }

    const tokenUnit = {
      'usdt': 'USDT',
      'stusdt': 'stUSDT',
      'wstusdt': 'wstUSDT'
    };

    const {
      lang,
      depositValue,
      borrowLimitAfter,
      errInfo1: { btnText, status },
      approving,
      mobile,
      wstUSDTSelectedToken,
      wstUSDTInputValue
    } = this.state;

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
    const { totalApy, depositApy, mintApyUSDD, underlyingIncrementApy } = getTotalApy(popData, assetList);

    const { precision, collateralDecimal, jtokenAddress, collateralAddress } = popData;
    let tokenBalance = BigNumber(balanceInfo[jtokenAddress].balance).div(precision);

    const { transModalInfo } = this.props.system;
    const { declined, transType } = transModalInfo;

    let borrowLimitAfter1 = 0;
    if (depositValue && BigNumber(depositValue).gte(0)) {
      borrowLimitAfter1 = this.getBorrowLimitAfter(depositValue, false);
    }

    let borrowLimitAfter2 = BigNumber(
      popData.jtokenAddress === Config.usddJtoken || popData.jtokenAddress === Config.usddoldJtoken
        ? popData.deposited
        : popData.deposited_usd
    )
      .times(popData.collateralFactor)
      .div(Config.tokenDefaultPrecision);

    borrowLimitAfter2 = BigNumber(borrowLimitAfter2).isNaN() ? 0 : borrowLimitAfter2;

    const { approved, hasApproved } = this.getApprovedLimit();

    const isSunoldEn = popData.collateralSymbol === 'SUNOLD' && lang === 'en-US';
    const shouldShowMiningApyDetail =
      checkIfShouldShowMintApyDetail(true, popData.collateralSymbol, mintApyUSDD) && openMint;

    return (
      <div className="deposit mt10">
        <div
          className={
            'safe-input safe-input-with-wallet' + (popData.collateralSymbol === 'wstUSDT' ? ' safe-input-wstusdt' : '')
          }
        >
          {popData.collateralSymbol === 'wstUSDT' ? (
            <WstusdtInput
              value={depositValue}
              depositWstUSDTChange={this.depositWstUSDTChange}
              disabled={approving ? true : false}
              clickMax={this.clickMax}
              type="deposit"
            />
          ) : (
            <>
              <div className="j-wallet">
                <span>{intl.get('deposit.wallet_balance')}</span>
                {renderBalance(popData, balanceInfo, 3, true)}
              </div>
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
            </>
          )}
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
            {intl.get('v2.borrow_limit')}
            {status1 && account_entered !== 1 && (
              <Tooltip
                overlayClassName="j-tooltip-dropdown"
                title={intl.getHTML('v2.tip13', {
                  value: formatNumber(BigNumber(borrowLimitAfter2).plus(borrowLimitAfter1), 2, {
                    miniText: 0.01,
                    needDolar: true
                  })
                })}
                placement="bottomLeft"
                arrowPointAtCenter
                onOpenChange={window.gtag('event', 'PC_Collateral', {
                  'event_category': 'PC',
                  'event_label': 'Collateral'
                })}
              >
                <span className="j-light ml-6"></span>
              </Tooltip>
            )}
          </span>
          <span className="j-content ellipsis ml20">
            <span>{formatNumber(borrowLimit, 2, { miniText: 0.01, needDolar: true })}</span>
            {status1 && account_entered === 1 && (
              <>
                <span className="arrow-right"></span>

                {formatNumber(borrowLimitAfter1, 2, { miniText: 0.01, needDolar: true })}
              </>
            )}
          </span>
        </div>
        <div className="j-modal-ele">
          <span className="j-title">{intl.get('v2.risk_value')}</span>
          <span className="j-content ellipsis ml20">
            {/* <span>{renderPercent(per1)}</span> */}
            <span>{formatNumber(per1, 2)}</span>
            {status2 && popData.account_entered == 1 && (
              <>
                <span className="arrow-right"></span>
                {/* {renderPercent(per2)} */}
                <span>{setRiskValue(per2, 2)}</span>
              </>
            )}
          </span>
        </div>
        <div className="modal-progress">
          {popData.account_entered === 1 ? progressV2(per1, per2) : progressV2(per1)}
          {/* {renderProgress(per2, { showInfo: false, reverse: true })} */}
        </div>

        <div className="j-modal-ele mt30">
          <span className="j-title flex jcsb aic">
            <TooltipText
              overlayClassName="j-tooltip-dropdown"
              title={this.depositApyTootipRender(popData, shouldShowMiningApyDetail)}
              placement="topLeft"
              arrowPointAtCenter
            >
              <span>{intl.get('v2.supply_apy')}</span>
            </TooltipText>
            {mobile ? null : (
              <Tooltip
                overlayClassName="j-tooltip-dropdown"
                title={this.depositApyTootipRender(popData, shouldShowMiningApyDetail)}
                placement="top"
                arrowPointAtCenter
              >
                <span className="j-tooltip-icon ml-4"></span>
              </Tooltip>
            )}
          </span>
          <span className="j-content">
            {Config.holdingTokens.includes(popData.collateralSymbol)
              ? renderPercent(BigNumber(depositApy), { cutZero: false, useFull: false, defaultSymbol: true })
              : renderPercent(BigNumber(depositApy).plus(underlyingIncrementApy), {
                  cutZero: false,
                  useFull: false,
                  defaultSymbol: true
                })}
            {Config.holdingTokens.includes(popData.collateralSymbol) &&
              ' + ' + renderPercent(underlyingIncrementApy, { cutZero: false, useFull: false })}
            {shouldShowMiningApyDetail && ' + ' + renderPercent(mintApyUSDD, { cutZero: false, useFull: false })}
          </span>
        </div>
        <div className="j-modal-ele">
          <span className="j-title">{intl.getHTML('v2.deposit_symbol', { symbol: popData.collateralSymbol })}</span>
          <span className="j-content balance-change ellipsis">
            {BigNumber(depositValue).gt(0) ? (
              <>
                <span className="pre">
                  {BigNumber(popData.deposited).isNaN()
                    ? 0
                    : formatNumber(BigNumber(popData.deposited), 3, {
                        miniText: 0.001
                      })}
                </span>
                <span className="arrow-right"></span>

                {formatNumber(
                  BigNumber(popData.deposited).isNaN() ? depositValue : BigNumber(popData.deposited).plus(depositValue),
                  3,
                  { miniText: 0.001 }
                )}
              </>
            ) : (
              <>
                {' '}
                {BigNumber(popData.deposited).isNaN()
                  ? 0
                  : formatNumber(BigNumber(popData.deposited), 3, { miniText: 0.001 })}
              </>
            )}
          </span>
        </div>

        {!(
          (!!popData?.mintPaused && popData?.collateralSymbol !== 'SUNOLD') ||
          collateralAddress === Config.zeroAddr ||
          approved
        ) ? (
          <div className="borrow-tip borrow-important-tip">
            <span></span>
            <div className="approve-wrap">
              <span>
                {hasApproved
                  ? intl.get('v2.vote.approve_tip')
                  : intl.get('deposit.explanation1', {
                      value:
                        popData.collateralSymbol === 'wstUSDT'
                          ? tokenUnit[wstUSDTSelectedToken]
                          : popData.collateralSymbol
                    })}
              </span>
              {hasApproved && (
                <Tooltip
                  overlayClassName="j-tooltip-dropdown"
                  title={
                    <>
                      <span class="mr-5">{intl.get('deposit.approve_tip')}</span>
                      <a
                        class="jl-links"
                        style={{ fontSize: 12 }}
                        href={Config.approveLink}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {intl.get('toast.warning_tip_more')}
                      </a>
                    </>
                  }
                  placement={'top'}
                  arrowPointAtCenter
                >
                  <span className="j-tooltip-icon"></span>
                </Tooltip>
              )}
            </div>
          </div>
        ) : popData?.collateralSymbol === 'SUNOLD' && mobile ? (
          <div className="borrow-tip borrow-important-tip">
            <span></span>
            {intl.getHTML('v2.close_supply_tip_sunold')}
          </div>
        ) : (
          ''
        )}

        {approving ? (
          <button className="j-large-btn j-supply j-signing" disabled>
            {intl.get('v2.sign_in_wallet')}
            <span className="siging-icon"></span>
          </button>
        ) : (
          <>
            {this.props.market.continueWhileDisabled && isConnected ? (
              <Tooltip
                title={intl.get('season.not_awailable')}
                overlayClassName={'j-tooltip-dropdown season season-l ' + theme}
                arrowPointAtCenter
                placement="top"
                getPopupContainer={() => document.querySelector('.ant-btn.j-large-btn.j-supply, .j-large-btn.j-supply')}
              >
                {approved ? (
                  <Button className="j-large-btn j-supply disabled season">{intl.get('v2.modal_deposit')}</Button>
                ) : (
                  <Button className="j-large-btn j-supply disabled season">
                    {intl.get('deposit.approve', { value: popData.collateralSymbol })}
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
                getPopupContainer={() => document.querySelector('.ant-btn.j-large-btn.j-supply, .j-large-btn.j-supply')}
              >
                {approved ? (
                  <Button className="j-large-btn j-supply disabled season">{intl.get('v2.modal_deposit')}</Button>
                ) : (
                  <Button className="j-large-btn j-supply disabled season">
                    {intl.get('deposit.approve', { value: popData.collateralSymbol })}
                  </Button>
                )}
              </Tooltip>
            ) : !!popData?.mintPaused ? (
              <Button className="j-large-btn j-supply disabled">{intl.get('risk_tip.deposit_disabled')}</Button>
            ) : collateralAddress === Config.zeroAddr || approved ? (
              <Button className="j-large-btn j-supply" onClick={() => this.deposit()} disabled={!status}>
                {intl.get('v2.modal_deposit')}
              </Button>
            ) : wstUSDTSelectedToken !== 'wstusdt' ? (
              <>
                <button
                  className="j-large-btn j-supply"
                  onClick={async () => {
                    this.props.system.clearRejectError();
                    popData.transType = 'approve';
                    window.gtag('event', 'PC_supply_approve', {
                      'event_category': 'PC_V1.5',
                      'event_label': 'supply_approve'
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

                    // TRC-20 USDT approve race guard: pass current allowance so
                    // safeApprove can reset to 0 first when needed.
                    const currentAllowance =
                      this.props.lend.wstUSDTbalanceInfo?.[contractAddress]?.allowance;
                    const txID = await this.props.system.approveWstUSDTToken(
                      popData,
                      contractAddress,
                      false,
                      options,
                      { symbol: wstUSDTSelectedToken, currentAllowance }
                    );
                    if (txID) {
                      window.gtag('event', 'PC_supply_approve_success', {
                        'event_category': 'PC_V1.5',
                        'event_label': 'supply_approve_success'
                      });
                      this.props.market.getTokenBalanceInfo();
                      this.props.lend.getWstUSDTBalanceInfo(
                        this.props.network.defaultAccount,
                        [Config['usdt'].token, Config['stusdt'].token, Config['wstusdt'].token],
                        [Config.SwapRouter, Config.SwapRouter, Config.SwapRouter]
                      );
                      if (this.props.detailInfo) {
                        this.props.user.getUserData();
                        this.props.user.getUserDataFromMarkets();
                        this.props.market.getMarketData();
                      }
                    }
                    this.setState({
                      approving: false
                    });
                  }}
                >
                  {intl.get('deposit.approve', { value: tokenUnit[wstUSDTSelectedToken] })}
                </button>
              </>
            ) : (
              <>
                <button className="j-large-btn j-supply" onClick={async () => this.approveToken(popData)}>
                  {intl.get('deposit.approve', { value: popData.collateralSymbol })}
                </button>
              </>
            )}
          </>
        )}
        {declined && (transType === 'deposit' || transType === 'approve') && (
          <div className="j-error-tip wallet-reject">
            <span className="j-error-img"></span>
            <div>{intl.get('v2.reject_in_wallet')}</div>
          </div>
        )}
      </div>
    );
  };

  approveToken = async popData => {
    this.props.system.clearRejectError();
    popData.transType = 'approve';
    window.gtag('event', 'PC_supply_approve', {
      'event_category': 'PC_V1.5',
      'event_label': 'supply_approve'
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
    const feeLimit = await this.props.system.getFeeLimitCommon(contractAddress, funcSelector, parameters);
    const options = { feeLimit };

    // TRC-20 USDT approve race guard: thread the current allowance onto popData
    // so lendApprove/safeApprove can issue approve(0) first when required.
    popData.currentAllowance = this.props.market.balanceInfo?.[popData.jtokenAddress]?.allowance;
    const txID = await this.props.system.approveToken(popData, false, options);
    if (txID) {
      window.gtag('event', 'PC_supply_approve_success', {
        'event_category': 'PC_V1.5',
        'event_label': 'supply_approve_success'
      });
      this.props.market.getTokenBalanceInfo();
      if (this.props.detailInfo) {
        this.props.user.getUserData();
        this.props.user.getUserDataFromMarkets();
        this.props.market.getMarketData();
      }
    }
    this.setState({
      approving: false
    });
  };

  deposit = async () => {
    window.gtag('event', 'PC_supply_modal_supply_button', {
      'event_category': 'PC_V1.5',
      'event_label': 'supply_modal_supply_button'
    });
    this.props.system.clearRejectError();

    const { depositValue, borrowLimitAfter, wstUSDTSelectedToken, wstUSDTInputValue } = this.state;
    const { DAWPop } = this.props.market;
    const { userDataSource } = this.props.user;
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

    if (wstUSDTSelectedToken !== 'wstusdt') {
      const amount = new BigNumber(wstUSDTInputValue).times(Config[wstUSDTSelectedToken].precision)._toHex();
      const contractAddress = Config.SwapRouter;
      let funcSelector = '';
      if (wstUSDTSelectedToken === 'usdt') {
        funcSelector = 'usdtToJwstUSDT(uint256)';
      } else {
        funcSelector = 'stUSDTToJwstUSDT(uint256)';
      }
      let parameters = [{ type: 'uint256', value: amount }];
      const feeLimit = await this.props.system.getFeeLimitCommon(contractAddress, funcSelector, parameters);
      const options = { feeLimit };

      const txID = await this.props.system.justMintWstUSDT(wstUSDTSelectedToken, amount, intlObj, options);
      if (txID) {
        window.gtag('event', 'PC_supply_modal_success', {
          'event_category': 'PC_V1.5',
          'event_label': 'supply_modal_success'
        });
        setTimeout(() => {
          this.props.market.getTokenBalanceInfo();
        }, 5000);
      }
    } else {
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
        window.gtag('event', 'PC_supply_modal_success', {
          'event_category': 'PC_V1.5',
          'event_label': 'supply_modal_success'
        });
        setTimeout(() => {
          this.props.market.getTokenBalanceInfo();
        }, 5000);
      }
    }

    this.setState({ approving: false });
  };

  getDepositFee = async depositValue => {
    const { energyFee, getEnergyFee } = this.props.lend;
    const { DAWPop } = this.props.market;
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
    const trxFee = BigNumber(toFixedUp(BigNumber(energy).times(fee).div(1e6), 0))
      .plus(2)
      .toNumber();
    this.setState({ trxFee });
  };

  withdraw = async () => {
    this.props.system.clearRejectError();

    window.gtag('event', 'PC_supply_modal_withdraw_button', {
      'event_category': 'PC_V1.5',
      'event_label': 'supply_modal_withdraw_button'
    });

    const { withdrawValue, isClear } = this.state;
    const { popData } = this.props.market.DAWPop;
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
    const txID = await this.props.system.justRedeem(popData, amount, intlObj, false, options);

    if (txID) {
      window.gtag('event', 'PC_supply_modal_withdraw_success', {
        'event_category': 'PC_V1.5',
        'event_label': 'supply_modal_withdraw_success'
      });
      setTimeout(() => {
        this.props.market.getTokenBalanceInfo();
        if (this.props.detailInfo) {
          this.props.user.getUserData();
          this.props.user.getUserDataFromMarkets();
          this.props.market.getMarketData();
        }
      }, 5000);
    }

    this.setState({ approving: false });
  };

  distribute = type => {
    if (type === 1) {
      window.gtag('event', 'PC_supply_modal_supply_tab', {
        'event_category': 'PC_V1.5',
        'event_label': 'supply_modal_supply_tab'
      });
    } else if (type === 2) {
      window.gtag('event', 'PC_supply_modal_withdraw_tab', {
        'event_category': 'PC_V1.5',
        'event_label': 'supply_modal_withdraw_tab'
      });
    }
    const { userList } = this.props.user;
    const { marketList, balanceInfo = {}, DAWPop } = this.props.market;
    let { popData } = DAWPop;
    const { jtokenAddress, collateralAddress } = popData;
    popData = userList[jtokenAddress] || marketList[jtokenAddress];

    if (popData && jtokenAddress && balanceInfo[jtokenAddress]) {
      return type === 1 ? this.depositContent(popData) : this.withDrawContent(popData);
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
      this.props.system.clearRejectError();

      const { risk, userList, totalBorrowValueInTrx, totalCollateralValueInTrx } = this.props.user;
      const { marketList, balanceInfo, DAWPop } = this.props.market;
      let { popData = {} } = DAWPop;
      const { jtokenAddress } = popData;
      const trxAssetPrice = userList[jtrxAddress]?.assetPrice || marketList[jtrxAddress]?.assetPrice;
      popData = userList[jtokenAddress] || marketList[jtokenAddress];
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

        const per1 = BigNumber(risk).times(100);
        let per2 = per1;

        if (popData.account_entered === 1) {
          per2 = BigNumber(totalBorrowValueInTrx)
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
        }

        if (gtBalance(value, deposited)) {
          status = false;
          // btnText = intl.get('withdraw.Insufficient_withdrawamount');
          btnText = intl.get('v2.tip25');
        } else if (BigNumber(per2).gte(100)) {
          status = false;
          btnText = intl.get('withdraw.Insufficient_mortgage');
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
    } catch (error) {
      console.error('withdraw operation failed:', error);
    }
  };

  // enter deposit amount
  depositChange = inputValue => {
    try {
      this.props.system.clearRejectError();

      const { balanceInfo, DAWPop } = this.props.market;
      const { popData = {} } = DAWPop;
      const { jtokenAddress, precision, collateralSymbol } = popData;
      const { balance } = balanceInfo[jtokenAddress] || {};
      const { valid, str } = numberParser(inputValue, popData.collateralDecimal);

      if (valid) {
        let status = this.state.errInfo1.status;
        let btnText = this.state.errInfo1.btnText;

        const { approved } = this.getApprovedLimit(undefined, str);
        if (!approved) {
          window.gtag('event', 'PC_supply_approve2tips', {
            'event_category': 'PC_V1.7.6',
            'event_label': 'supply_approve2tips'
          });
        }

        this.setState({
          depositValue: str,
          borrowLimitAfter: str === '' ? this.props.user.borrowLimit : this.getBorrowLimitAfter(str)
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
    } catch (error) {
      console.error('deposit operation failed:', error);
    }
  };

  changeTab = activeKey => {
    this.props.system.clearRejectError();

    activeKey == 1 ? this.withdrawChange('', true) : this.depositChange('', true);
    const { balanceInfo = {}, DAWPop } = this.props.market;
    const { popData } = DAWPop;
    const { jtokenAddress } = popData;
    if (popData && jtokenAddress && balanceInfo[jtokenAddress]) {
      this.props.market.setDAWPop({
        show: true,
        activeKey,
        popData
      });
    }
  };

  getDepositStatus = popData => {
    try {
      const { userList } = this.props.user;
      const { jtokenAddress } = popData;
      const { borrowBalanceNew = 0 } = userList[jtokenAddress] || {};

      return BigNumber(borrowBalanceNew).gt(0);
    } catch (err) {
      return false;
    }
  };

  // wstusdt
  depositWstUSDTChange = (wstUSDTSelectedToken, depositValue, wstUSDTInputValue, errInfo1) => {
    try {
      this.setState({
        wstUSDTSelectedToken,
        depositValue,
        wstUSDTInputValue,
        errInfo1
      });
      const { approved } = this.getApprovedLimit(wstUSDTSelectedToken, depositValue, wstUSDTInputValue);
      if (!approved) {
        window.gtag('event', 'PC_supply_approve2tips', {
          'event_category': 'PC_V1.7.6',
          'event_label': 'supply_approve2tips'
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  render() {
    const { DAWPop } = this.props.market;
    const { popData = {} } = DAWPop;
    const { collateralSymbol, logoUrl } = popData;
    const { mobile, lang } = this.state;
    const isSunoldEn = collateralSymbol === 'SUNOLD' && lang === 'en-US';

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
        height={mobile ? (isSunoldEn ? 540 : 509) : 560}
        centered
        maskClosable={false}
        visible={DAWPop.show}
        closable={true}
        onCancel={() => {
          this.props.market.hideDAWPop();
          this.props.system.clearRejectError();
          window.gtag('event', 'PC_supply_modal_close', {
            'event_category': 'PC_V1.5',
            'event_label': 'supply_modal_close'
          });
        }}
        footer={null}
        className={'j-modal j-daw-modal' + (isSunoldEn && mobile ? ' sunold-m-modal' : '')}
        getContainer={() => document.querySelector('.j-wrapper')}
      >
        <Tabs
          className={'j-supply' + (lang === 'en-US' ? ' j-tab-en' : '')}
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

export default depositeAndWithdraw;
