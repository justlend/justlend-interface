import React from 'react';
import { Link } from 'react-router-dom';
import intl from 'react-intl-universal';
import isMobile from 'ismobilejs';
import { inject, observer } from 'mobx-react';
import moment from 'moment';
import Header from '../Header';
import SeasonToolBar from '../season/index';
import Footer from '../Footer';
import { Input, Tooltip, Select, Button } from 'antd';
import TransactionModal from '../../Modals/v2/Transaction';
import ReturnResourcenModal from '../../Modals/strx/ReturnResource';
import RentPausedModal from '../../Modals/strx/RentPaused';
import AllowanceModal from '../../Modals/strx/Allowance';
import TabsBar from '../mobile/TabsBar';
import EnergySubsidy from './EnergySubsidy';
import WinterTheme from '../../WinterTheme';
import {
  formatNumber,
  numberParser,
  transferTime,
  getQueryObj,
  tooltip,
  addThousandSeparators,
  removeThousandSeparators,
  trimNumberAfterDecimalPlace
} from '../../../utils/helper';
import '../../../assets/css/v2/liquidity-stake.scss';
import '../../../assets/css/v2/energy-rent.scss';
import '../../../assets/css/v2/theme.scss';
import BigNumber from 'bignumber.js';
import { MarketData } from './MarketData';
import { Config } from '../../../config';
import { TooltipText } from './TooltipText';
import { LinkButton } from '../../Common/LinkButton';

@inject('network')
@inject('lend')
@inject('system')
@inject('pool')
@inject('strx')
@inject('energyRental')
@observer
class EnergyRent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      marketData: {
        trx1wEnergy: '--',
        model: []
      },
      lang: getQueryObj()?.lang || window.localStorage.getItem('lang') || intl.options.currentLocale,
      mobile: isMobile(window.navigator).any,
      rentInfo: {},
      tabValue: 'energy',
      rentAmountsSelectValue: '0',
      rentAmountsEnergyInputValue: '',
      rentAmountsEnergyInputDecimal: 0,
      rentAmountsStakeInputValue: '',
      rentAmountsStakeInputDecimal: 0,
      rentWaysSelectValue: '2',
      rentWaysTimeInputValue: '',
      rentWaysTimeInputDecimal: 1,
      rentWaysRentInputValue: '',
      rentWaysRentInputDecimal: 6,
      rentPerDay: 0,
      rentYjn: 0,
      rentDaysArray: [1, 30],
      rentDaysLeftStatus: true,
      approving: false,
      rentAmountsErrorMsg: '',
      rentWaysErrorMsg: '',
      defaultRent: '',
      showBalanceError: false,
      energyFocused: false,
      energyUsed: '--'
    };
  }
  componentDidMount = async () => {
    window.localStorage.setItem('lastVisitEnergyRentalPage', 'energy');

    // const { mobile } = this.state;
    // if (mobile) {
    //   window.location.href = window.location.origin + (window.location?.pathname || '') + '#/energy';
    // }
    await this.props.lend.getLatestBlockInfo();
    this.props.strx.setVariablesInterval();

    document.title = 'Energy Rental - JustLend DAO';

    window.gtag('event', 'PC_page_energy', { 'event_category': 'sTRX', 'event_label': 'page_energy' });
    window.gtag('event', 'energyrent_old_PV', { 'event_category': 'energyrent', 'event_label': 'energyrent_old_PV' });
    window.gtag('event', 'energyrent_old_UV', { 'event_category': 'energyrent', 'event_label': 'energyrent_old_UV' });

    // Get energy rental order list
    const { isConnected } = this.props.network;
    if (isConnected) {
      this.props.energyRental.getMiniOrderList();
    } else {
      this.props.network.on('connect', async () => {
        this.props.energyRental.getMiniOrderList();
      });
    }
  };

  componentWillUnmount() {
    this.props.system.clearRejectError();
    this.props.strx.clearVariablesInterval();
  }

  getUserData = async () => {
    await this.props.strx.getUserTrxBalance();
    await this.props.strx.getAccountRentInfos();
    await this.props.strx.getMultiReward();
    await this.props.strx.getUserData();
    await this.props.strx.getReturnRentInfo();

    this.props.network.on('connect', async () => {
      await this.props.strx.getUserTrxBalance();
      await this.props.strx.getAccountRentInfos();
      await this.props.strx.getMultiReward();
      await this.props.strx.getUserData();
      await this.props.strx.getReturnRentInfo();
      await this.getEnergyUsed();
    });

    this.props.network.on('chainChanged', async () => {
      await this.props.strx.getUserTrxBalance();
      await this.props.strx.getAccountRentInfos();
      await this.props.strx.getMultiReward();
      await this.props.strx.getUserData();
      await this.props.strx.getNotAccountRentInfos();
      await this.props.strx.getReturnRentInfo();
      await this.getEnergyUsed();
    });
  };

  initForm = () => {
    this.setState({
      rentAmountsEnergyInputValue: '',
      rentAmountsStakeInputValue: '',
      rentWaysTimeInputValue: '',
      rentWaysRentInputValue: ''
    });
  };

  getEnergyUsed = async () => {
    try {
      // const { energyFee, getEnergyFee } = this.props.strx;
      const rentTrx = this.energyToTrx();
      const { needToPayTrx } = this.getDynamicInfos(rentTrx, BigNumber(1).times(86400), 'notLogin');
      // let feeLimit = Config.feeLimit;
      const energyUsed = await this.props.system.getRentFeeLimit(
        window.defaultAccount || 'TVNevinkBb9JytBHhK2ZMsnWX5sWqJu9fx',
        BigNumber(rentTrx).times(Config.trxPrecision)._toFixed(0, 1),
        1,
        BigNumber(needToPayTrx).times(Config.trxPrecision)._toFixed(0, 1)
      );
      this.setState({ energyUsed });
      // let fee = energyFee || (await getEnergyFee());
      // feeLimit = BigNumber(BigNumber(energy).times(fee).div(1e6)._toFixed(0, 1)).plus(2).toNumber();
    } catch (e) {
      console.log('error: getEnergyUsed');
    }
  };

  getMarketData = async () => {
    try {
      this.props.strx.getMarketData();
      await this.props.strx.getNotAccountRentInfos();
      await this.getEnergyUsed();

      let defaultRent = this.timeToRent('', true);
      this.setState({ defaultRent });
    } catch (e) {
      console.log('error: getMarketData');
    }
  };

  getAnnouncementUrl = () => {
    const { lang } = this.state;
    const announcementUrlNile =
      lang && lang.includes('en')
        ? 'https://justlendorg.zendesk.com/hc/en-us/articles/17080698112537'
        : 'https://justlendorg.zendesk.com/hc/zh-cn/articles/17080698112537';

    const announcementUrl = 'https://support.justlend.org/hc/en-us/articles/32539144305305';
    // lang && lang.includes('en')
    //   ? 'https://justlendorg.zendesk.com/hc/en-us/articles/17525313120281'
    //   : 'https://justlendorg.zendesk.com/hc/zh-cn/articles/17525313120281';
    return Config.nile ? announcementUrlNile : announcementUrl;
  };

  getLearnUrl = () => {
    const { lang } = this.state;
    const learnUrlNile =
      lang && lang.includes('en')
        ? 'https://justlendorg.zendesk.com/hc/en-us/articles/16512503468057'
        : 'https://justlendorg.zendesk.com/hc/zh-cn/articles/16512503468057';

    const learnUrl =
      lang && lang.includes('en')
        ? 'https://justlendorg.zendesk.com/hc/en-us/articles/17526112107417'
        : 'https://justlendorg.zendesk.com/hc/zh-cn/articles/17526112107417';

    return Config.nile ? learnUrlNile : learnUrl;
  };

  tutorialUrl = () => {
    const { lang } = this.state;
    return lang.includes('en')
      ? 'https://justlendorg.zendesk.com/hc/en-us/articles/18581604307737'
      : 'https://justlendorg.zendesk.com/hc/zh-cn/articles/18581604307737';
  };

  subsidyUrl = () => {
    const { lang } = this.state;
    return lang.includes('en')
      ? 'https://support.justlend.org/hc/en-us/articles/19326031593497'
      : 'https://support.justlend.org/hc/zh-cn/articles/19326031593497';
  };

  getOfferUrl = () => {
    const { lang } = this.state;

    const offerUrl =
      lang && lang.includes('en')
        ? 'https://justlendorg.zendesk.com/hc/en-us/articles/18496749460377'
        : 'https://justlendorg.zendesk.com/hc/zh-cn/articles/18496749460377';
    return offerUrl;
  };

  getDefaultEnergyValue = () => {
    return BigNumber(this.props.strx.rentBalance).gt(0)
      ? Config.energyRental.renewOrderDefaultEnergyValue
      : Config.energyRental.newOrderDefaultEnergyValue;
  };

  getCurrentInfos = () => {
    try {
      const { rentBalance, securityDeposit, feeRatio, minFee, liquidateThreshold, basicRate: rate } = this.props.strx;

      let fee = Math.max(minFee, BigNumber(BigNumber(rentBalance).times(feeRatio)));
      let rentMoney = BigNumber(rentBalance).times(rate).times(BigNumber(86400).plus(liquidateThreshold));
      let needToPayTrx = BigNumber(rentMoney).plus(fee).minus(securityDeposit);
      let rentPerDay = BigNumber(rentBalance).times(rate).times(86400);
      let rentDaysLeft = BigNumber(BigNumber(securityDeposit).minus(fee).minus(rentMoney))
        .div(BigNumber(rentBalance).times(rate))
        .times(1000);
      let dateTime = new Date().getTime();
      return {
        fee,
        rentMoney,
        needToPayTrx,
        rentPerDay,
        rentDaysLeft: BigNumber(Math.abs(rentDaysLeft)).plus(dateTime),
        rentDaysLeftTrue: BigNumber(rentDaysLeft).plus(dateTime),
        rentDaysLeftSecs: BigNumber(Math.abs(rentDaysLeft)).div(1000)
      };
    } catch (e) {
      console.log('error: getCurrentInfos');
    }
  };

  getDynamicInfos = (amount = 0, second = 0, type) => {
    try {
      const { rentBalance, securityDeposit, feeRatio, minFee, liquidateThreshold, rate, basicRate } = this.props.strx;
      const { rentDaysLeftSecs } = this.getCurrentInfos();

      let fee = Math.max(minFee, BigNumber(amount).times(feeRatio));
      let rentMoney = BigNumber(amount).times(rate).times(BigNumber(86400).plus(liquidateThreshold));
      let needToPayTrx = 0;
      if (type === 'addEnergy') {
        rentMoney = BigNumber(amount).minus(rentBalance).times(rate).times(BigNumber(rentDaysLeftSecs));

        let rentMoneyTotal = BigNumber(amount)
          .times(rate)
          .times(BigNumber(rentDaysLeftSecs).plus(86400).plus(liquidateThreshold));

        needToPayTrx = BigNumber(rentMoneyTotal).plus(fee).minus(securityDeposit);
      } else if (type === 'addTime') {
        needToPayTrx = BigNumber(rentBalance).times(basicRate).times(second);
      } else if (type === 'notLogin') {
        let rentMoney = BigNumber(amount).times(rate).times(BigNumber(second).plus(86400).plus(liquidateThreshold));
        needToPayTrx = BigNumber(rentMoney).plus(fee);
      }
      let rentPerDay = BigNumber(amount).times(rate).times(86400);
      let rentDaysLeft = BigNumber(BigNumber(securityDeposit).minus(fee).minus(rentMoney))
        .div(BigNumber(amount).times(rate))
        .times(1000);

      return {
        fee,
        rentMoney,
        needToPayTrx,
        rentPerDay,
        rentDaysLeft: BigNumber(rentDaysLeft).plus(new Date().getTime())
      };
    } catch (e) {
      console.log('error: getDynamicInfos');
    }
  };

  rentToTime = (needToPayTrx = this.state.rentWaysRentInputValue, justGetTime = false, rentWaysRentInputValue = 1) => {
    try {
      const { rentBalance, securityDeposit, feeRatio, minFee, liquidateThreshold, rate, basicRate } = this.props.strx;
      let second = 0;
      let day = '--';

      if (!BigNumber(rate).isNaN()) {
        if (BigNumber(rentBalance).gt(0)) {
          second = BigNumber(needToPayTrx).div(rentBalance).div(basicRate);
        } else {
          const { rentAmountsStakeInputValue } = this.state;

          let fee = Math.max(minFee, BigNumber(rentAmountsStakeInputValue || this.energyToTrx()).times(feeRatio));
          let rentMoney = BigNumber(needToPayTrx).plus(securityDeposit).minus(fee);
          second = BigNumber(rentMoney)
            .div(rentAmountsStakeInputValue || this.energyToTrx())
            .div(rate)
            .minus(liquidateThreshold)
            .minus(86400);
        }

        const { isExpired } = this.judgeExpiredClear();
        const { rentDaysLeft } = this.getCurrentInfos();

        if (isExpired) {
          second = BigNumber(second).minus(BigNumber(rentDaysLeft).minus(new Date().getTime()).div(1000));
        }

        day = BigNumber(second).div(86400)._toFixed(1, 1);

        if (!BigNumber(day).gt(0)) {
          day = 0;
        }
      }
      if (justGetTime) {
        return day;
      }
      this.setState({
        rentWaysTimeInputValue: !rentWaysRentInputValue && BigNumber(day).eq(1) ? '' : day
      });
    } catch (e) {
      console.log('error: rentToTime');
    }
  };

  timeToRent = (time = this.state.rentWaysTimeInputValue, justGetMaxRent = false) => {
    try {
      const { rentBalance } = this.props.strx;
      const { rentAmountsEnergyInputValue, rentAmountsStakeInputValue } = this.state;
      const rentWaysTimeInputValues = time || 1;
      // const rentWaysTimeInputValues = 30;
      const rentAmountsStakeInputValues = rentAmountsStakeInputValue || this.energyToTrx();
      const { isExpired } = this.judgeExpiredClear();
      const { rentDaysLeft } = this.getCurrentInfos();
      let needToPayTrx = 0;

      if (BigNumber(rentBalance).gt(0)) {
        const timeFinal = isExpired
          ? BigNumber(rentDaysLeft)
              .minus(new Date().getTime())
              .plus(BigNumber(rentWaysTimeInputValues).times(86400 * 1000))
              .div(1000)
          : BigNumber(rentWaysTimeInputValues).times(86400);
        const info = this.getDynamicInfos(0, timeFinal, 'addTime');
        needToPayTrx = info.needToPayTrx;
      } else {
        const info = this.getDynamicInfos(
          rentAmountsStakeInputValues,
          BigNumber(rentWaysTimeInputValues).times(86400),
          'notLogin'
        );
        needToPayTrx = info.needToPayTrx;
      }

      if (justGetMaxRent) {
        return needToPayTrx;
      }

      this.setState({
        rentWaysRentInputValue:
          BigNumber(needToPayTrx).isNaN() ||
          (!this.state.rentWaysTimeInputValue && BigNumber(needToPayTrx).eq(this.state.defaultRent))
            ? ''
            : BigNumber(needToPayTrx)._toFixed(Config.trxDecimal, 1)
      });
    } catch (e) {
      console.log('error: timeToRent');
    }
  };

  trxMax = () => {
    try {
      this.props.system.clearRejectError();

      const { isConnected } = this.props.network;
      if (!isConnected) {
        return this.props.network.connectWalletV2();
      }

      window.gtag('event', 'PC_energy_trx_max', { 'event_category': 'sTRX', 'event_label': 'energy_trx_max' });

      let { trxBalance } = this.props.strx;
      trxBalance = BigNumber(trxBalance).div(Config.trxPrecision);

      const day = this.rentToTime(trxBalance, true);
      let maxTime = this.state.rentDaysArray[1];
      if (BigNumber(day).gt(maxTime)) {
        this.timeToRent(maxTime);
        this.setState({ rentWaysTimeInputValue: maxTime });
      } else {
        this.timeToRent(day);
        this.setState({ rentWaysTimeInputValue: day, rentWaysRentInputValue: trxBalance });
      }

      setTimeout(() => {
        this.rentWaysRentInputValid();
      });
    } catch (e) {
      console.log('error: trxMax');
    }
  };

  timeMax = () => {
    try {
      this.props.system.clearRejectError();

      const { isConnected } = this.props.network;
      if (!isConnected) {
        return this.props.network.connectWalletV2();
      }
      let { trxBalance } = this.props.strx;
      trxBalance = BigNumber(trxBalance).div(Config.trxPrecision);

      const day = this.rentToTime(trxBalance, true);
      let maxTime = this.state.rentDaysArray[1];
      if (BigNumber(day).gt(maxTime)) {
        this.setState({ rentWaysTimeInputValue: maxTime });
      } else {
        this.rentToTime(trxBalance);
      }
      setTimeout(() => {
        this.rentWaysTimeInputValid();
      });

      window.gtag('event', 'PC_energy_time_max', { 'event_category': 'sTRX', 'event_label': 'energy_time_max' });
    } catch (e) {
      console.log('error: timeMax');
    }
  };

  returnRuleTipRender = () => {
    const learnUrl = this.getLearnUrl();
    return (
      <div className="return-rule-tip">
        <span className="return-rule-tip-text">{intl.get('strx.return_rule_tip')}</span>
        <LinkButton
          className="learn-more learn-more-btn"
          href={learnUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            window.gtag('event', 'PC_energy_fee_compute_rule', {
              'event_category': 'sTRX',
              'event_label': 'energy_fee_compute_rule'
            });
          }}
        >
          {intl.get('strx.learn_more')}
        </LinkButton>
      </div>
    );
  };

  energyInfoRender = () => {
    let { trxBalance } = this.props.strx;
    trxBalance = BigNumber(trxBalance).div(Config.trxPrecision);
    const {
      rentWaysTimeInputValue,
      rentAmountsStakeInputValue,
      rentWaysRentInputValue,
      rentWaysSelectValue,
      defaultRent
    } = this.state;
    const { maxRentableOfType, marketData } = this.props.strx;
    const { lang, theme } = this.props.lend;
    let time = rentWaysTimeInputValue || 1;
    // const defaultRent = this.timeToRent(3, true);
    let rent = rentWaysRentInputValue || defaultRent;
    let rentAmountsStakeInputValues = rentAmountsStakeInputValue || this.energyToTrx();
    const { rentMoney, fee, needToPayTrx } = this.getDynamicInfos(
      rentAmountsStakeInputValues,
      BigNumber(time).times(86400),
      'notLogin'
    );

    const needToPayTrxNew = rentWaysSelectValue === '3' ? rent : needToPayTrx;

    return (
      <div className="energy-info energy-info-item">
        <div className={`info-subtitle flex ${lang}`}>
          {intl.get('strx.total_prepayment')}
          <br />
          {intl.get('strx.return_early')}
        </div>

        <div className="pay-amount-sub ellipsis dashed pay-amount-sub-calc">
          <Tooltip
            width="314"
            title={
              <div className="rent-fee-detail">
                <div className="flexB flexA rent-fee-detail-item">
                  <div className="name">{intl.get('strx.energy_prepay_tips1')}</div>
                  <div className="value ellipsis">
                    {BigNumber(needToPayTrxNew).minus(rentMoney).minus(fee).eq(0)
                      ? 0
                      : formatNumber(BigNumber(needToPayTrxNew).minus(rentMoney).minus(fee), Config.trxDecimal)}{' '}
                    TRX
                  </div>
                </div>

                <div className="flexB flexA rent-fee-detail-item">
                  <div className="name">{intl.get('strx.energy_rent_money_tips1')}</div>
                  <div className="value ellipsis">
                    {BigNumber(rentMoney).plus(fee).eq(0)
                      ? 0
                      : formatNumber(BigNumber(rentMoney).plus(fee), Config.trxDecimal)}{' '}
                    TRX
                  </div>
                </div>

                {this.returnRuleTipRender()}
              </div>
            }
            placement="bottomRight"
            arrowPointAtCenter
            getPopupContainer={() => document.body.querySelector('.rent-content')}
            overlayClassName="j-tooltip-dropdown triangle-icon w314 pay-amount-sub-arrow"
            onMouseEnter={() => {
              try {
                setTimeout(() => {
                  const calcDom = document.querySelector('.pay-amount-sub-calc');
                  const half_w = calcDom.offsetWidth / 2;
                  const arrow = document.querySelector('.pay-amount-sub-arrow .ant-tooltip-arrow');
                  arrow.style.right = half_w + 8 + 'px';
                }, 200);
              } catch (error) {}
            }}
          >
            {formatNumber(needToPayTrxNew, Config.trxDecimal)} TRX
          </Tooltip>
        </div>
      </div>
    );
  };

  energyTransactionUsedEnergyRender = () => {
    let { trxBalance, energyHold, energyDependingValue } = this.props.strx;
    trxBalance = BigNumber(trxBalance).div(Config.trxPrecision);

    const { energyUsed, mobile } = this.state;
    const energyUsedReal = BigNumber(BigNumber(energyUsed).div(1000)._toFixed(0, 1)).plus(1).div(10);
    const { lang } = this.props.lend;
    const offerUrl = this.getOfferUrl();

    return (
      <div className="energy-info energy-info-item">
        <div className={`info-subtitle flex ${lang} energy-consumed aic`}>
          <span className="">{intl.get('strx.energy_transaction_used_energy')}</span>
        </div>
        <div className="pay-amount-sub ellipsis flex aic">
          {!BigNumber(energyHold).gte(energyDependingValue) ? (
            !BigNumber(trxBalance).isNaN() && BigNumber(trxBalance).lt(110) ? (
              <>
                <div className="energy-used">≈ 85.8K</div>
              </>
            ) : BigNumber(energyUsed).isNaN() ? (
              <div className="energy-used">{intl.get('strx.energy_computing')}</div>
            ) : (
              <div className="energy-used">≈{formatNumber(BigNumber(energyUsed).div(1000), 1)}K</div>
            )
          ) : !BigNumber(trxBalance).isNaN() && BigNumber(trxBalance).lt(110) ? (
            <>
              <div className="energy-used-ignore">≈ 85.8K</div>
              <div className="energy-used">≈ 8.6K</div>
              <div className="energy-used-unit">{intl.get('strx.energy_energy')}</div>
            </>
          ) : BigNumber(energyUsed).isNaN() ? (
            <div className="energy-used">{intl.get('strx.energy_computing')}</div>
          ) : (
            <>
              <div className="energy-used-ignore">≈ {formatNumber(BigNumber(energyUsed).div(1000), 1)}K</div>
              <div className="energy-used">≈ {formatNumber(energyUsedReal, 1)}K</div>
              <div className="energy-used-unit">{intl.get('strx.energy_energy')}</div>
            </>
          )}
        </div>
      </div>
    );
  };

  energyUsedTipRender = () => {
    const { energyHold, energyDependingValue } = this.props.strx;

    return BigNumber(energyHold).isNaN() ? (
      <div className="j-important-tip"></div>
    ) : (
      <div className="j-important-tip">
        <span></span>
        {BigNumber(energyHold).gte(energyDependingValue) ? (
          <span>
            <span className="mr-6">{intl.get('strx.energy_used_tip')}</span>
            <LinkButton className="learn-more" href={this.tutorialUrl()} target="_blank" rel="noopener noreferrer">
              {intl.get('strx.energy_used_tip_link')}
            </LinkButton>
          </span>
        ) : (
          <span className="energy-used-tip">{intl.get('strx.energy_used_tip_new')}</span>
        )}
      </div>
    );
  };

  rentInfoNotLogin = () => {
    const { marketData, userData, multiRewardData } = this.props.strx;
    const { isConnected } = this.props.network;
    const { lang } = this.state;

    const { rewardMap } = userData;
    const unclaimShow =
      isConnected &&
      (BigNumber(rewardMap.gainNew).gt(0) ||
        Object.keys(multiRewardData).length > 0 ||
        (BigNumber(rewardMap.gainLast).gt(0) && rewardMap.miningStatus == '2'));

    return (
      // <div className={'my-rent-info not-login-info' + (unclaimShow ? ' pt40' : '')}>
      <div className={'my-rent-info not-login-info'}>
        {}
        <div className={'energy-info not-login-info ' + (unclaimShow ? ' unclaim' : '')}>
          <div className="energy-info-top">{intl.get('strx.energy_get_same_energy')}</div>
          <div className="energy-info-content">
            <div className="need-stake">
              <div className="icon"></div>
              <div className="title">{intl.get('strx.energy_need_stake_trx')}</div>
              <div className="value">
                {formatNumber(BigNumber(100000).div(marketData.energyStakePerTrx), 0, { miniText: '1' })}
                <span>TRX</span>
              </div>
            </div>
            <div className="need-burn">
              <div className="icon"></div>
              <div className="title">{intl.get('strx.energy_need_burn_trx')}</div>
              <div className="value">
                {formatNumber(BigNumber(100000).div(marketData.energyBurnPerTrx), 3, { miniText: '0.001' })}
                <span>TRX</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  rentFormNotLogin = () => {
    const { isConnected } = this.props.network;
    let { trxBalance } = this.props.strx;
    trxBalance = BigNumber(trxBalance).div(Config.trxPrecision);
    const {
      approving,
      rentWaysTimeInputValue,
      rentAmountsEnergyInputValue,
      rentAmountsStakeInputValue,
      rentWaysRentInputValue,
      rentWaysSelectValue,
      defaultRent,
      showBalanceError,
      energyUsed,
      mobile
    } = this.state;
    const { maxRentableOfType, marketData } = this.props.strx;
    const { energyStakePerTrx } = marketData;
    const { lang, theme } = this.props.lend;
    const energyUsedReal = BigNumber(BigNumber(energyUsed).div(1000)._toFixed(0, 1)).plus(1).div(10);
    let time = rentWaysTimeInputValue || 1;
    // const defaultRent = this.timeToRent(3, true);
    let rent = rentWaysRentInputValue || defaultRent;
    let rentAmountsStakeInputValues = rentAmountsStakeInputValue || this.energyToTrx();
    const { rentMoney, fee, needToPayTrx } = this.getDynamicInfos(
      rentAmountsStakeInputValues,
      BigNumber(time).times(86400),
      'notLogin'
    );

    const needToPayTrxNew = rentWaysSelectValue === '3' ? rent : needToPayTrx;
    const learnUrl = this.getLearnUrl();
    const offerUrl = this.getOfferUrl();

    const { transModalInfo } = this.props.system;
    const { declined, transType } = transModalInfo;

    const maxTrx = maxRentableOfType;
    const maxAmount = BigNumber(maxTrx).times(energyStakePerTrx);
    const minAmount = BigNumber(100000);

    return (
      <div className={'rent-form ' + (!!Config.winterThemeVisible ? 'snow-ele-top' : '')}>
        <div className="rent-form-tabs rent">
          <span className="single-tab">
            {intl.get('strx.energy_rent_energy')}
            {/* <span className={lang === 'en-US' ? 'en' : ''}>
              <em>{intl.get('strx.energy_subsidy_jst')}</em>
            </span> */}
          </span>
        </div>
        <div className="rent-content">
          {this.rentAmountsRender('1')}
          {this.rentWaysRender('1')}

          <div className="energy-infos energy-infos-new mt20">
            {this.energyInfoRender()}
            {this.energyTransactionUsedEnergyRender()}
          </div>

          {this.energyUsedTipRender()}

          {approving ? (
            <button className="j-large-btn j-supply rent-now j-signing energy_config_extend" disabled>
              {intl.get('v2.sign_in_wallet')}
              <span className="siging-icon"></span>
            </button>
          ) : !!isConnected ? (
            <button
              className="j-large-btn j-supply rent-now gas-less-btn"
              disabled={
                (BigNumber(maxAmount).lt(minAmount) ||
                  this.state.rentAmountsErrorMsg ||
                  (this.state.rentWaysErrorMsg && !['-1', '-2', '-3'].includes(this.state.rentWaysErrorMsg)) ||
                  BigNumber(needToPayTrxNew).gt(trxBalance)) &&
                showBalanceError
              }
              onClick={() =>
                this.rentResourceValid(
                  BigNumber(maxAmount).lt(minAmount) ||
                    this.state.rentAmountsErrorMsg ||
                    (this.state.rentWaysErrorMsg && !['-1', '-2', '-3'].includes(this.state.rentWaysErrorMsg)) ||
                    BigNumber(needToPayTrxNew).gt(trxBalance),
                  rentAmountsStakeInputValues,
                  needToPayTrxNew
                )
              }
              // onClick={() => this.rentResource(rentAmountsStakeInputValues, needToPayTrxNew)}
            >
              {intl.get('strx.energy_rent_now')}
              {/* <div className={'gas-off-tip' + (lang === 'en-US' ? ' en' : lang === 'zh-TC' ? ' tc' : '')}></div> */}
            </button>
          ) : this.props.lend.serviceInnerStatus === 'disabled' ? (
            <Tooltip
              title={intl.get('season.can_not_connect')}
              overlayClassName={'j-tooltip-dropdown season season-l ' + theme}
              arrowPointAtCenter
              placement="bottom"
              getPopupContainer={() =>
                document.querySelector('#root .j-wrapper .j-large-btn.j-supply.gas-less-btn.season')
              }
            >
              <button
                className="j-large-btn j-supply rent-now gas-less-btn connect season"
                onClick={() => {
                  this.props.lend.setData({ noServiceModalAllVisible: true });
                }}
              >
                {intl.get('strx.energy_connect_to_rent')}
              </button>
            </Tooltip>
          ) : (
            <button
              className="j-large-btn j-supply rent-now gas-less-btn connect"
              onClick={() => {
                this.props.network.connectWalletV2();
                window.gtag('event', 'PC_energy_connect_wallet', {
                  'event_category': 'sTRX',
                  'event_label': 'energy_connect_wallet'
                });
              }}
            >
              {intl.get('strx.energy_connect_to_rent')}
            </button>
          )}
          {declined && transType === 'rentResource' && (
            <div className="j-error-tip wallet-reject">
              <span className="j-error-img"></span>
              <div>{intl.get('v2.reject_in_wallet')}</div>
            </div>
          )}
          {BigNumber(needToPayTrxNew).gt(trxBalance) && showBalanceError && (
            <div className="j-error-tip wallet-reject">
              <span className="j-error-img"></span>
              <div>
                {intl.getHTML('strx.energy_insufficient_balance', {
                  value: formatNumber(trxBalance, Config.trxDecimal)
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  rentInfo = () => {
    const { rentDaysLeftStatus, mobile, lang } = this.state;

    const { securityDeposit, rentBalance, returnResourceEnergy, marketData, returnRentInfo } = this.props.strx;
    const { fee, rate, rentPerDay, rentDaysLeft, rentMoney, rentDaysLeftTrue } = this.getCurrentInfos();
    const { days, hours, mins } = transferTime(rentDaysLeft);
    const learnUrl = this.getLearnUrl();

    let diff = 0;
    if (!BigNumber(returnResourceEnergy).isNaN()) {
      diff = BigNumber(returnResourceEnergy).gt(securityDeposit)
        ? BigNumber(returnResourceEnergy).minus(securityDeposit)
        : BigNumber(securityDeposit).minus(returnResourceEnergy);
    }
    const totalFee = BigNumber(rentMoney).plus(fee).minus(diff);

    const { userData, multiRewardData } = this.props.strx;
    const { isConnected } = this.props.network;

    const { rewardMap } = userData;

    const unclaimShow =
      isConnected &&
      (BigNumber(rewardMap.gainNew).gt(0) ||
        Object.keys(multiRewardData).length > 0 ||
        (BigNumber(rewardMap.gainLast).gt(0) && rewardMap.miningStatus == '2'));

    let unrecoveredEnergyAmount = BigNumber(returnRentInfo.unrecoveredEnergyAmount).plus(10000);
    let unrecoveredEnergyFee = BigNumber(returnRentInfo.dailyRent)
      .times(BigNumber(unrecoveredEnergyAmount).div(returnRentInfo.rentAmount))
      .times(0.5);
    let rentRemainAndsecurityDeposit = BigNumber(returnRentInfo.rentRemain).plus(returnRentInfo.securityDeposit);

    unrecoveredEnergyFee = BigNumber(unrecoveredEnergyFee).gt(rentRemainAndsecurityDeposit)
      ? rentRemainAndsecurityDeposit
      : unrecoveredEnergyFee;

    return (
      <div className="my-rent-info login">
        <div className="rent-info-top">
          <div className="rent-info-content">
            <div className="rent-info-title">{intl.get('strx.energy_rental_amount')}</div>
            <div className="rent-energy-amount not-login flex">
              <div className="flexA">
                <span className="equal-alike-a">{'≈ '}</span>
                <Tooltip
                  title={intl.get('strx.energy_trx_energy_desc')}
                  placement={mobile ? 'topLeft' : 'top'}
                  arrowPointAtCenter
                  overlayClassName="j-tooltip-dropdown"
                >
                  <span className="rent-amount underline">
                    {formatNumber(BigNumber(rentBalance).times(marketData.energyStakePerTrx), 0)}
                  </span>
                </Tooltip>
                <span className="rent-unit">{intl.get('strx.energy_energy_day')}</span>
              </div>
            </div>
            <div className="rent-delegate-amount flex aic">
              {intl.getHTML('strx.energy_subsidy_rent_price_day', {
                value: formatNumber(rentPerDay, 3, { miniText: '0.001' })
              })}
            </div>
          </div>
          <div className={'rent-info-icon' + (lang === 'en-US' ? ' en' : '')}></div>
        </div>
        <div>
          {unclaimShow && <EnergySubsidy />}
          <div className="energy-info">
            <div className="rent-left">
              <div>
                <div
                  className="rent-left-label"
                  onClick={() => {
                    this.setState({ rentDaysLeftStatus: !rentDaysLeftStatus });
                    window.gtag('event', 'PC_energy_exchange_icon', {
                      'event_category': 'sTRX',
                      'event_label': 'energy_exchange_icon'
                    });
                  }}
                >
                  {rentDaysLeftStatus
                    ? intl.get('strx.energy_expire_date')
                    : intl.get('strx.energy_remaining_duration')}
                  <span className="j-exchange-icon"></span>
                </div>

                <div className="rent-left-time">
                  {!BigNumber(rentDaysLeftTrue).isNaN() && (
                    <>
                      <span className="rent-left-wavyline"></span>
                      {!BigNumber(securityDeposit).minus(rentMoney).minus(fee).gt(0)
                        ? rentDaysLeftStatus
                          ? moment(BigNumber(rentDaysLeftTrue).toNumber()).format('YYYY-MM-DD HH:mm')
                          : intl.getHTML('strx.energy_d_h_m', { value1: 0, value2: 0, value3: 0 })
                        : BigNumber(rentDaysLeft).isNaN()
                        ? '--'
                        : rentDaysLeftStatus
                        ? moment(BigNumber(rentDaysLeftTrue).toNumber()).format('YYYY-MM-DD HH:mm')
                        : intl.getHTML('strx.energy_d_h_m', {
                            value1: days,
                            value2: hours,
                            value3: mins
                          })}
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="energy-info-content login flexB flexA">
              <div className="energy-info-content-item">
                <div className="title flex items-center">{intl.get('strx.refund_amount_now')}</div>
                <div className="item-return">
                  <Tooltip
                    placement="bottomLeft"
                    arrowPointAtCenter
                    overlayClassName="j-tooltip-dropdown triangle-icon w254 value-return-arrow"
                    getPopupContainer={() => document.body.querySelector('.item-return')}
                    width={254}
                    onMouseEnter={() => {
                      try {
                        setTimeout(() => {
                          const calcDom = document.querySelector('.value-return');
                          const half_w = calcDom.offsetWidth / 2;
                          const arrow = document.querySelector('.value-return-arrow .ant-tooltip-arrow');
                          arrow.style.left = half_w + 'px';
                        }, 200);
                      } catch (error) {}
                    }}
                    title={
                      <>
                        <div className="flexB remain">
                          <div className="key">{intl.get('strx.energy_remaining_rent')}</div>
                          <div className="val">
                            {formatNumber(returnRentInfo.rentRemain, 6)}
                            <span> TRX</span>
                          </div>
                        </div>

                        <div className="flexB rent-money">
                          <div className="key">{intl.get('strx.energy_rent_money')}</div>
                          <div className="val">
                            {formatNumber(returnRentInfo.securityDeposit, 6)}
                            <span> TRX</span>
                          </div>
                        </div>
                      </>
                    }
                  >
                    <span className="value-return">
                      {formatNumber(
                        BigNumber(returnRentInfo.rentRemain)
                          .plus(returnRentInfo.securityDeposit)
                          .minus(unrecoveredEnergyFee),
                        6
                      )}
                    </span>
                  </Tooltip>
                  <span className="value-symbol"> TRX</span>
                </div>
              </div>
              <Button className="rent-back" onClick={this.returnSource}>
                {intl.get('strx.energy_end_now')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  rentForm = () => {
    const { tabValue } = this.state;

    return (
      <div className="rent-form">
        <div className="rent-form-tabs">
          <span
            className={tabValue === 'energy' ? 'current' : ''}
            onClick={() => {
              this.setState({ tabValue: 'energy' });
              this.props.system.clearRejectError();
              window.gtag('event', 'PC_energy_rent_more', {
                'event_category': 'sTRX',
                'event_label': 'energy_rent_more'
              });
            }}
          >
            {intl.get('strx.energy_rent_more')}
          </span>
          <span
            className={tabValue === 'time' ? 'current' : ''}
            onClick={() => {
              this.setState({ tabValue: 'time' });
              this.props.system.clearRejectError();
              window.gtag('event', 'PC_energy_rent_time', {
                'event_category': 'sTRX',
                'event_label': 'energy_rent_time'
              });
            }}
          >
            {intl.get('strx.energy_extend_rent_duration')}
          </span>
        </div>
        {tabValue === 'energy' ? this.energyAddRender() : this.timeAddRender()}
      </div>
    );
  };

  rentAmountsSelectChange = item => {
    try {
      this.props.system.clearRejectError();

      this.setState({ rentAmountsSelectValue: item });

      setTimeout(() => {
        if (item === '0') {
          this.rentAmountsEnergyInputValid();
          window.gtag('event', 'PC_energy_select_energy', {
            'event_category': 'sTRX',
            'event_label': 'energy_select_energy'
          });
        } else if (item === '1') {
          this.rentAmountsStakeInputValid();
          window.gtag('event', 'PC_energy_select_trx', {
            'event_category': 'sTRX',
            'event_label': 'energy_select_trx'
          });
        }
      });
    } catch (e) {
      console.log('error: rentAmountsSelectChange');
    }
  };

  setRate = async stakeAmount => {
    try {
      stakeAmount =
        BigNumber(stakeAmount).isNaN() || (!stakeAmount && !BigNumber(stakeAmount).eq(0))
          ? this.energyToTrx()
          : stakeAmount;
      this.props.strx.setData({ stakeAmount });
      this.props.strx.rentalRate(stakeAmount);
    } catch (e) {
      console.log('error: setRate');
    }
  };

  energyToTrx = energy => {
    try {
      const { marketData } = this.props.strx;
      const { energyStakePerTrx } = marketData;

      if (!energy || energy <= 0) {
        energy = this.getDefaultEnergyValue();
      }

      return BigNumber(BigNumber(energy).div(energyStakePerTrx)._toFixed(0, 1)).plus(1);
    } catch (e) {
      console.log('error: energyToTrx');
    }
  };
  rentAmountsEnergyInputChange = async value => {
    try {
      this.props.system.clearRejectError();

      const { rentAmountsEnergyInputDecimal } = this.state;
      const { marketData } = this.props.strx;
      const { energyStakePerTrx } = marketData;

      var isInputValueValid = false;
      var finalInputValue = '';
      var trxAmount = '';

      if (value === '') {
        isInputValueValid = true;
        finalInputValue = '';
        trxAmount = '';
      } else if (BigNumber(value).eq(0)) {
        isInputValueValid = true;
        finalInputValue = trimNumberAfterDecimalPlace(value, rentAmountsEnergyInputDecimal);
        trxAmount = '0';
      } else {
        const { valid, str } = numberParser('' + value, rentAmountsEnergyInputDecimal);

        if (valid && /^\d*$/.test(str)) {
          isInputValueValid = true;
          finalInputValue = str;
          trxAmount = !str ? '' : BigNumber(BigNumber(str).div(energyStakePerTrx)._toFixed(0, 1)).plus(1);
        }
      }

      if (isInputValueValid) {
        this.setState({
          rentAmountsEnergyInputValue: finalInputValue,
          rentAmountsStakeInputValue: trxAmount
        });

        this.rentAmountsEnergyInputValid(finalInputValue);
        this.setRate(trxAmount);
        setTimeout(() => {
          this.commonSelectChange();
        });
      }
    } catch (e) {
      console.log('error: rentAmountsEnergyInputChange');
      console.log(e);
    }
  };

  rentAmountsEnergyInputValid = (str = this.state.rentAmountsEnergyInputValue) => {
    const { maxRentableOfType, marketData } = this.props.strx;
    const { energyStakePerTrx } = marketData;
    const maxTrx = maxRentableOfType;
    const maxAmount = BigNumber(maxTrx).times(energyStakePerTrx)._toFixed(0, 1);
    const minAmount = BigNumber(100000);
    // const minAmount = BigNumber(BigNumber(1000).times(energyStakePerTrx))._toFixed(0, 1);

    if (!str && !BigNumber(str).eq(0)) {
      this.setState({ rentAmountsErrorMsg: `` });
    } else if (BigNumber(BigNumber(maxTrx).times(energyStakePerTrx)).lt(minAmount)) {
      this.setState({ rentAmountsErrorMsg: intl.get('strx.energy_no_balance') });
    } else if (BigNumber(str).lt(minAmount)) {
      this.setState({
        rentAmountsErrorMsg: intl.getHTML('strx.energy_energy_min_amount', {
          value: formatNumber(minAmount)
        })
      });
    } else if (BigNumber(str).gt(maxAmount)) {
      this.setState({
        rentAmountsErrorMsg: intl.getHTML('strx.energy_energy_max_amount', {
          value: formatNumber(maxAmount)
        })
      });
    } else {
      this.setState({ rentAmountsErrorMsg: `` });
    }

    // if (!str && !BigNumber(str).eq(0)) {
    //   this.setState({ rentAmountsErrorMsg: `` });
    // } else if (BigNumber(BigNumber(maxTrx).times(energyStakePerTrx)).lt(minAmount)) {
    //   this.setState({ rentAmountsErrorMsg: intl.get('strx.energy_no_balance') });
    // } else if (BigNumber(str).lt(minAmount) || BigNumber(str).gt(maxAmount)) {
    //   this.setState({
    //     rentAmountsErrorMsg: intl.get('strx.energy_out_of_range', {
    //       value1: formatNumber(minAmount),
    //       value2: formatNumber(maxAmount)
    //     })
    //   });
    // } else {
    //   this.setState({ rentAmountsErrorMsg: `` });
    // }
  };

  rentAmountsStakeInputChange = async value => {
    try {
      this.props.system.clearRejectError();

      const { rentAmountsStakeInputDecimal, rentAmountsEnergyInputDecimal, rentWaysTimeInputValue } = this.state;
      const { valid, str } = numberParser('' + value, rentAmountsStakeInputDecimal);
      const { marketData } = this.props.strx;
      const { energyStakePerTrx } = marketData;

      if (valid && /^\d*$/.test(str)) {
        let energy = !str ? '' : BigNumber(str).times(energyStakePerTrx)._toFixed(rentAmountsEnergyInputDecimal, 1);

        this.setState({
          rentAmountsStakeInputValue: str,
          rentAmountsEnergyInputValue: energy
        });

        this.rentAmountsStakeInputValid(str);
        this.setRate(str);
        setTimeout(() => {
          this.commonSelectChange();
        });
      }
    } catch (e) {
      console.log('error: rentAmountsStakeInputChange');
    }
  };

  rentAmountsStakeInputValid = (str = this.state.rentAmountsStakeInputValue) => {
    let { trxBalance, maxRentableOfType, marketData } = this.props.strx;
    trxBalance = BigNumber(trxBalance).div(Config.trxPrecision);
    let maxTrx = maxRentableOfType;

    const maxAmount = BigNumber(maxTrx)._toFixed(0, 1);
    // const minAmount = 1000;
    const minAmount = this.energyToTrx();

    if (!str && !BigNumber(str).eq(0)) {
      this.setState({ rentAmountsErrorMsg: `` });
    } else if (BigNumber(maxTrx).lt(minAmount)) {
      this.setState({ rentAmountsErrorMsg: intl.get('strx.energy_no_balance') });
    } else if (BigNumber(str).lt(minAmount) || BigNumber(str).gt(maxAmount)) {
      this.setState({
        rentAmountsErrorMsg: intl.get('strx.energy_out_of_range', {
          value1: formatNumber(minAmount),
          value2: formatNumber(maxAmount)
        })
      });
    } else {
      this.setState({ rentAmountsErrorMsg: `` });
    }
  };

  rentWaysSelectChange = item => {
    try {
      this.props.system.clearRejectError();

      this.setState({ rentWaysSelectValue: item });

      setTimeout(() => {
        if (item === '2') {
          this.rentWaysTimeInputValid();

          window.gtag('event', 'PC_energy_select_duration', {
            'event_category': 'sTRX',
            'event_label': 'energy_select_duration'
          });
        } else {
          this.timeToRent();
          this.rentWaysRentInputValid();

          window.gtag('event', 'PC_energy_select_rent', {
            'event_category': 'sTRX',
            'event_label': 'energy_select_rent'
          });
        }
      });
    } catch (e) {
      console.log('error: rentWaysSelectChange');
    }
  };

  commonSelectChange = () => {
    const { rentWaysSelectValue, rentWaysRentInputValue, defaultRent } = this.state;

    if (rentWaysSelectValue === '2') {
      this.timeToRent();
    } else {
      this.rentToTime(rentWaysRentInputValue || defaultRent);
    }
  };

  rentWaysTimeInputChange = value => {
    try {
      this.props.system.clearRejectError();

      const { rentWaysTimeInputDecimal } = this.state;

      var isInputValueValid = false;
      var finalInputValue = '';

      if (value === '' || BigNumber(value).eq(0)) {
        isInputValueValid = true;
        finalInputValue = trimNumberAfterDecimalPlace(value, rentWaysTimeInputDecimal);
      } else {
        const { valid, str } = numberParser(value, rentWaysTimeInputDecimal);
        if (valid && /^\d*(.|.[0-9]){0,1}$/.test(str)) {
          isInputValueValid = true;
          finalInputValue = str;
        }
      }

      if (isInputValueValid) {
        this.setState({ rentWaysTimeInputValue: finalInputValue });
        this.rentWaysTimeInputValid(finalInputValue);
      }
    } catch (e) {
      console.log('error: rentWaysTimeInputChange');
    }
  };

  rentWaysTimeInputValid = (str = this.state.rentWaysTimeInputValue) => {
    let { trxBalance } = this.props.strx;
    trxBalance = BigNumber(trxBalance).div(Config.trxPrecision);

    let maxAmount = 30;
    let minAmount = 1;
    let dayLimit = this.rentToTime(BigNumber(trxBalance).minus(Config.safeValueTRX), true);
    let rent = this.timeToRent(str, true);

    if ((!str && !BigNumber(str).eq(0)) || BigNumber(rent).gt(trxBalance)) {
      this.setState({ rentWaysErrorMsg: `` });
    } else if (BigNumber(str).lt(minAmount) || BigNumber(str).gt(maxAmount)) {
      this.setState({
        rentWaysErrorMsg: intl.get('strx.energy_out_of_days', {
          value1: formatNumber(minAmount),
          value2: formatNumber(maxAmount)
        })
      });
    } else if (BigNumber(trxBalance).lt(Config.safeValueTRX)) {
      this.setState({
        rentWaysErrorMsg: '-2'
      });
    } else if (BigNumber(dayLimit).lt(str)) {
      this.setState({
        rentWaysErrorMsg: '-3'
      });
    } else {
      this.setState({ rentWaysErrorMsg: `` });
    }
  };

  rentWaysRentInputChange = value => {
    try {
      this.props.system.clearRejectError();

      const { valid, str } = numberParser(value, Config.trxDecimal);
      if (valid) {
        this.setState({ rentWaysRentInputValue: str });

        this.rentWaysRentInputValid(str);
        if (!str) {
          let { defaultRent } = this.state;
          this.rentToTime(defaultRent, false, str);
        } else {
          this.rentToTime(str);
        }
      }
    } catch (e) {
      console.log('error: rentWaysRentInputChange');
    }
  };

  rentWaysRentInputValid = (str = this.state.rentWaysRentInputValue) => {
    let { rentBalance, trxBalance } = this.props.strx;
    trxBalance = BigNumber(trxBalance).div(Config.trxPrecision);

    const { rentDaysArray } = this.state;
    const minAmount = BigNumber(this.timeToRent(rentDaysArray[0], true))._toFixed(6, 1);
    const rent = this.timeToRent(rentDaysArray[1], true);
    let maxAmount = BigNumber(BigNumber(rent).gt(trxBalance) ? trxBalance : rent)._toFixed(6, 1);
    maxAmount = BigNumber(maxAmount).lt(minAmount) ? BigNumber(rent)._toFixed(6, 1) : maxAmount;

    if ((!str && !BigNumber(str).eq(0)) || BigNumber(str).gt(trxBalance)) {
      this.setState({ rentWaysErrorMsg: `` });
    } else if (BigNumber(str).lt(minAmount) || BigNumber(str).gt(maxAmount)) {
      let localeStr = BigNumber(rentBalance).gt(0) ? 'strx.energy_out_of_extend_trx' : 'strx.energy_out_of_extend_trx1';
      this.setState({
        rentWaysErrorMsg: intl.get(localeStr, {
          value1: formatNumber(minAmount, 6),
          value2: formatNumber(maxAmount, 6)
        })
      });
    } else if (BigNumber(trxBalance).lt(Config.safeValueTRX)) {
      this.setState({
        rentWaysErrorMsg: '-2'
      });
    } else if (BigNumber(trxBalance).minus(Config.safeValueTRX).lt(str)) {
      this.setState({
        rentWaysErrorMsg: '-1'
      });
    } else {
      this.setState({ rentWaysErrorMsg: `` });
    }
  };

  rentAmountsRender = type => {
    const {
      rentAmountsSelectValue,
      rentAmountsEnergyInputValue,
      rentAmountsStakeInputValue,
      rentAmountsErrorMsg,
      energyFocused
    } = this.state;
    const { marketData } = this.props.strx;
    let { trxBalance } = this.props.strx;
    trxBalance = BigNumber(trxBalance).div(Config.trxPrecision);

    const { isConnected } = this.props.network;
    const { energyStakePerTrx } = marketData;
    const isRentMore = type !== '1';

    return (
      <>
        <div className="rent-labels">
          <TooltipText
            title={intl.get('strx.energy_tips_2')}
            placement="topLeft"
            arrowPointAtCenter
            overlayClassName="j-tooltip-dropdown"
          >
            <span className="rent-label-text">{intl.get('strx.energy_rent_amount')}</span>
          </TooltipText>
          <span>
            <span className="rent-days-title">{intl.get('strx.energy_available_balance')}:</span>
            <span className="rent-days-value">
              {!isConnected ? '--' : formatNumber(trxBalance, Config.trxDecimal)} TRX
            </span>
          </span>
        </div>
        <Input.Group compact className={'mt-10 ' + (rentAmountsErrorMsg ? ' j-error-input-group' : '')}>
          <div className="j-select-alike j-select-alike-energy">
            <Tooltip
              title={() => {
                return (
                  <div>
                    <div className="tal">{intl.get('strx.energy_tips_2')}</div>
                  </div>
                );
              }}
              placement="top"
              arrowPointAtCenter
              overlayClassName="j-tooltip-dropdown"
            >
              <span
                className="j-tooltip-icon mr-6"
                onMouseEnter={() => {
                  let v = type === '1' ? '1' : '';
                  window.gtag('event', 'click', {
                    'event_category': 'sTRX',
                    'event_label': 'energy_rent_hover' + v
                  });
                }}
              ></span>
            </Tooltip>
            <div className="j-alike-text">{intl.get('strx.energy_rent_amount')}</div>
          </div>
          {rentAmountsSelectValue === '0' ? (
            <Input
              className="j-input energy-input"
              placeholder={isRentMore ? '100,000' : '300,000'}
              // placeholder={formatNumber(BigNumber(1000).times(energyStakePerTrx), 0)}
              allowClear
              addonAfter={
                <>
                  <span className="energy-unit">{intl.get('strx.energy_energy_day')}</span>
                  <span className="exchange" onClick={() => this.rentAmountsSelectChange('1')}></span>{' '}
                </>
              }
              value={addThousandSeparators(rentAmountsEnergyInputValue)}
              onChange={e => this.rentAmountsEnergyInputChange(removeThousandSeparators(e.target.value))}
              onFocus={() => {
                this.setState({ energyFocused: true });
                this.inputFocus();
                window.gtag('event', 'PC_energy_rent_energy_focus' + Number(isRentMore), {
                  'event_category': 'sTRX',
                  'event_label': 'energy_rent_energy_focus' + Number(isRentMore)
                });
              }}
              onBlur={() => {
                this.setState({ energyFocused: false });
              }}
            />
          ) : (
            <Input
              className="j-input energy-input"
              placeholder="100,000"
              allowClear
              addonAfter={
                <>
                  <span className="stake-trx">TRX</span>
                  <span className="exchange" onClick={() => this.rentAmountsSelectChange('0')}></span>
                </>
              }
              value={addThousandSeparators(rentAmountsStakeInputValue)}
              onChange={e => this.rentAmountsStakeInputChange(removeThousandSeparators(e.target.value))}
              onFocus={() => {
                this.inputFocus();
                window.gtag('event', 'PC_energy_rent_trx_focus' + Number(isRentMore), {
                  'event_category': 'sTRX',
                  'event_label': 'energy_rent_trx_focus' + Number(isRentMore)
                });
              }}
            />
          )}
          {rentAmountsErrorMsg ? (
            <div className="j-error-tip">
              <span className="j-error-img"></span>
              <div className="j-safe-text">{rentAmountsErrorMsg}</div>
            </div>
          ) : BigNumber(rentAmountsEnergyInputValue).gte(0) && energyFocused ? (
            <div className="j-error-tip ways-warning">
              <span className="j-warning-icon"></span>
              <div>
                {intl.getHTML('strx.energy_acquire_info', {
                  value: formatNumber(this.energyToTrx(rentAmountsEnergyInputValue || this.getDefaultEnergyValue()), 0)
                })}
              </div>
            </div>
          ) : null}
        </Input.Group>
      </>
    );
  };

  rentWaysRender = type => {
    const {
      rentWaysSelectValue,
      rentWaysTimeInputValue,
      rentWaysRentInputValue,
      rentWaysErrorMsg,
      defaultRent,
      mobile
    } = this.state;
    const { isConnected } = this.props.network;
    const { theme } = this.props.lend;
    let { trxBalance, rentBalance } = this.props.strx;
    trxBalance = BigNumber(trxBalance).div(Config.trxPrecision);

    let feeLimitToHour = '--';
    if (rentWaysErrorMsg === '-3') {
      let dayLimit = this.rentToTime(BigNumber(trxBalance).minus(Config.safeValueTRX), true);
      const feeLimitToDay = BigNumber(rentWaysTimeInputValue).minus(dayLimit);
      feeLimitToHour = BigNumber(feeLimitToDay).times(24);
    }

    return (
      <>
        <div className="rent-labels rent-labels-time">
          <TooltipText
            title={intl.get('strx.energy_tips_3')}
            placement="topLeft"
            arrowPointAtCenter
            overlayClassName="j-tooltip-dropdown"
          >
            <span className="rent-label-text">{intl.get('strx.energy_rent_time')}</span>
          </TooltipText>
          {mobile && (
            <div className="rent-labels jce">
              <span className="rent-days-title">{intl.get('strx.energy_available_balance')}:</span>
              <span className="rent-days-value">
                {!isConnected ? '--' : formatNumber(trxBalance, Config.trxDecimal)} TRX
              </span>
            </div>
          )}
        </div>
        <Input.Group
          compact
          className={
            'mt-10 ' +
            (rentWaysErrorMsg && !['-1', '-2', '-3'].includes(rentWaysErrorMsg) ? ' j-error-input-group' : '')
          }
        >
          <div className="j-select-alike j-select-alike-energy">
            <Tooltip
              title={() => {
                return (
                  <div>
                    <div className="tal">{intl.get('strx.energy_tips_3')}</div>
                  </div>
                );
              }}
              placement="top"
              arrowPointAtCenter
              overlayClassName="j-tooltip-dropdown"
            >
              <span
                className="j-tooltip-icon mr-6"
                onMouseEnter={() => {
                  let isRentMore = type !== '1';
                  window.gtag('event', 'energy_rental_calculation_hover' + Number(isRentMore), {
                    'event_category': 'sTRX',
                    'event_label': 'energy_rental_calculation_hover' + Number(isRentMore)
                  });
                }}
              ></span>
            </Tooltip>
            <div className="j-alike-text">{intl.get('strx.energy_rent_time')}</div>
          </div>
          {rentWaysSelectValue === '2' ? (
            <Input
              className="j-input energy-input "
              placeholder="1"
              allowClear
              addonAfter={
                <div className="flex aic">
                  <span className="energy-unit">{intl.get('strx.energy_day')}</span>
                  {this.props.lend.serviceInnerStatus === 'disabled' ? (
                    <Tooltip
                      title={intl.get('season.can_not_connect')}
                      overlayClassName={'j-tooltip-dropdown season ' + theme}
                      arrowPointAtCenter
                      placement="bottomRight"
                    >
                      <div
                        className="energy-max season"
                        onClick={() => {
                          this.props.lend.setData({ noServiceModalAllVisible: true });
                        }}
                      >
                        {intl.get('strx.energy_max')}
                      </div>
                    </Tooltip>
                  ) : (
                    <div className="energy-max" onClick={this.timeMax}>
                      {intl.get('strx.energy_max')}
                    </div>
                  )}
                </div>
              }
              value={addThousandSeparators(rentWaysTimeInputValue)}
              onChange={e => this.rentWaysTimeInputChange(removeThousandSeparators(e.target.value))}
              onFocus={() => {
                this.inputFocus();
                let isRentMore = type !== '1';
                window.gtag('event', 'PC_energy_rent_duration_focus' + Number(isRentMore), {
                  'event_category': 'sTRX',
                  'event_label': 'energy_rent_duration_focus' + Number(isRentMore)
                });
              }}
            />
          ) : (
            <Input
              className="j-input energy-input "
              placeholder={formatNumber(defaultRent, Config.trxDecimal)}
              allowClear
              addonAfter={
                <>
                  <span className="stake-trx">TRX</span>
                  {/* <span className="exchange" onClick={() => this.rentWaysSelectChange('2')}></span> */}
                </>
              }
              value={addThousandSeparators(rentWaysRentInputValue)}
              onChange={e => this.rentWaysRentInputChange(removeThousandSeparators(e.target.value))}
              onFocus={() => {
                this.inputFocus();
                let isRentMore = type !== '1';
                window.gtag('event', 'PC_energy_rent_focus' + Number(isRentMore), {
                  'event_category': 'sTRX',
                  'event_label': 'energy_rent_focus' + Number(isRentMore)
                });
              }}
            />
          )}
          {rentWaysErrorMsg &&
            (rentWaysErrorMsg === '-1' ? (
              <div className="j-error-tip ways-warning">
                <span className="j-warning-icon"></span>
                <div>
                  {intl.get('strx.stake_enough_trx')}
                  <span className="set-max" onClick={() => this.reserveTrx()}>
                    {intl.get('strx.stake_reserve_trx', { value: Config.safeValueTRX })}
                    <em></em>
                  </span>
                </div>
              </div>
            ) : rentWaysErrorMsg === '-2' ? (
              <div className="j-error-tip ways-warning">
                <span className="j-warning-icon"></span>
                <div>{intl.get('strx.stake_enough_resources')}</div>
              </div>
            ) : rentWaysErrorMsg === '-3' ? (
              <div className="j-error-tip ways-warning">
                <span className="j-warning-icon"></span>
                <div>
                  {intl.get('strx.stake_adjust_trx')}
                  <span className="set-max" onClick={() => this.adjustTrx()}>
                    {intl.getHTML('strx.stake_adjust_trx_btn', {
                      value1: formatNumber(feeLimitToHour, 2),
                      value2: Config.safeValueTRX
                    })}
                    <em></em>
                  </span>
                </div>
              </div>
            ) : (
              <div className="j-error-tip">
                <span className="j-error-img"></span>
                <div className="j-safe-text">{rentWaysErrorMsg}</div>
              </div>
            ))}
        </Input.Group>
        {!BigNumber(rentBalance).gt(0) && (
          <div className="j-time-tips">
            {intl.getHTML('strx.energy_tips_1', {
              value: moment(
                BigNumber(rentWaysTimeInputValue || 1)
                  .times(86400 * 1000)
                  .plus(new Date().getTime())
                  .toNumber()
              ).format('YYYY-MM-DD HH:mm')
            })}
          </div>
        )}
      </>
    );
  };

  inputFocus = () => {
    this.setState({ showBalanceError: true });
  };

  reserveTrx = () => {
    let { trxBalance } = this.props.strx;
    trxBalance = BigNumber(trxBalance).div(Config.trxPrecision);

    this.rentWaysRentInputChange(BigNumber(trxBalance).minus(Config.safeValueTRX));
  };

  adjustTrx = () => {
    let { trxBalance } = this.props.strx;
    trxBalance = BigNumber(trxBalance).div(Config.trxPrecision);

    let day = this.rentToTime(BigNumber(trxBalance).minus(Config.safeValueTRX), true);
    this.rentWaysTimeInputChange(day);
  };

  judgeExpiredClear = () => {
    const { rentBalance, securityDeposit } = this.props.strx;
    const { fee, rentMoney } = this.getCurrentInfos();
    const isExpired = BigNumber(rentBalance).gt(0) && !BigNumber(securityDeposit).minus(rentMoney).minus(fee).gt(0);
    const isClear = BigNumber(rentBalance).gt(0) && BigNumber(securityDeposit).eq(0);
    return { isExpired, isClear };
  };

  energyAddRender = () => {
    const { rentAmountsStakeInputValue, rentAmountsEnergyInputValue, approving, showBalanceError, energyUsed, mobile } =
      this.state;
    const { marketData } = this.props.strx;
    const { energyStakePerTrx } = marketData;
    const { rentBalance } = this.props.strx;
    let { trxBalance } = this.props.strx;
    trxBalance = BigNumber(trxBalance).div(Config.trxPrecision);
    const energyUsedReal = BigNumber(BigNumber(energyUsed).div(1000)._toFixed(0, 1)).plus(1).div(10);
    const rentAmountsStakeInputValues = rentAmountsStakeInputValue || this.energyToTrx();
    const rentAmountsEnergyInputValues = rentAmountsEnergyInputValue
      ? rentAmountsEnergyInputValue
      : BigNumber(rentAmountsStakeInputValues).times(energyStakePerTrx);
    const { rentMoney, fee, needToPayTrx } = this.getDynamicInfos(
      BigNumber(rentAmountsStakeInputValues).plus(rentBalance),
      0,
      'addEnergy'
    );
    const { rentDaysLeft, rentDaysLeftTrue } = this.getCurrentInfos();
    const days = BigNumber(rentDaysLeftTrue)
      .minus(new Date().getTime())
      .div(86400 * 1000);

    const { isExpired } = this.judgeExpiredClear();
    const offerUrl = this.getOfferUrl();
    const learnUrl = this.getLearnUrl();

    const { transModalInfo } = this.props.system;
    const { lang, theme } = this.props.lend;
    const { declined, transType } = transModalInfo;

    return (
      <>
        <div className="rent-content">
          {this.rentAmountsRender()}
          <div className="energy-infos no-padding">
            <div className="add-after">
              <div>
                <div className="after-title">
                  {formatNumber(BigNumber(rentBalance).times(energyStakePerTrx), 0)}{' '}
                  {intl.get('strx.energy_energy_day')}
                </div>
                <div className="after-subtitle date">
                  {intl.getHTML('strx.energy_withhold', { value: formatNumber(rentBalance, 0) })}
                </div>
              </div>
              <div className="add-to-icon"></div>
              <div className="after-rent">
                <div className="after-title pr append-icon">
                  {formatNumber(BigNumber(rentBalance).times(energyStakePerTrx).plus(rentAmountsEnergyInputValues), 0)}{' '}
                  {intl.get('strx.energy_energy_day')}
                  {/* <span className="go-up-icon"></span> */}
                </div>
                <div className="after-subtitle date">
                  {intl.getHTML('strx.energy_withhold', {
                    value: formatNumber(BigNumber(rentBalance).plus(rentAmountsStakeInputValues), 0)
                  })}
                </div>
              </div>
            </div>
          </div>
          <div className="j-time-tips">
            {isExpired
              ? intl.get('strx.energy_rental_expired')
              : intl.getHTML('strx.energy_tips_1', {
                  value: BigNumber(rentDaysLeftTrue).isNaN()
                    ? '--'
                    : moment(BigNumber(rentDaysLeftTrue).toNumber()).format('YYYY-MM-DD HH:mm')
                })}
          </div>

          <div className="energy-infos energy-infos-new mt20">
            <div className="energy-info">
              <div className={`info-subtitle flex ${lang}`}>
                {intl.get('strx.total_prepayment')}
                <br />
                {intl.get('strx.return_early')}
              </div>

              <div className="pay-amount-sub ellipsis dashed pay-amount-sub-calc">
                <Tooltip
                  width="314"
                  title={
                    <div className="rent-fee-detail">
                      <div className="flexB flexA rent-fee-detail-item">
                        <div className="name">{intl.get('strx.energy_prepay_tips1')}</div>
                        <div className="value ellipsis">
                          {BigNumber(rentMoney).eq(0) ? 0 : formatNumber(rentMoney, Config.trxDecimal)} TRX
                        </div>
                      </div>

                      <div className="flexB flexA rent-fee-detail-item">
                        <div className="name">{intl.getHTML('strx.energy_rent_money_tips')}</div>
                        <div className="value ellipsis">
                          {BigNumber(needToPayTrx).minus(rentMoney).eq(0)
                            ? 0
                            : formatNumber(BigNumber(needToPayTrx).minus(rentMoney), Config.trxDecimal)}{' '}
                          TRX
                        </div>
                      </div>

                      {this.returnRuleTipRender()}
                    </div>
                  }
                  placement="bottomRight"
                  arrowPointAtCenter
                  getPopupContainer={() => document.body.querySelector('.rent-content')}
                  overlayClassName="j-tooltip-dropdown triangle-icon w314 pay-amount-sub-arrow"
                  onMouseEnter={() => {
                    try {
                      setTimeout(() => {
                        const calcDom = document.querySelector('.pay-amount-sub-calc');
                        const half_w = calcDom.offsetWidth / 2;
                        const arrow = document.querySelector('.pay-amount-sub-arrow .ant-tooltip-arrow');
                        arrow.style.right = half_w + 8 + 'px';
                      }, 200);
                    } catch (error) {}
                  }}
                >
                  {formatNumber(needToPayTrx, Config.trxDecimal)} TRX
                </Tooltip>
              </div>
            </div>
            {this.energyTransactionUsedEnergyRender()}
          </div>

          {this.energyUsedTipRender()}

          {approving ? (
            <button className="j-large-btn j-supply rent-now j-signing energy_config_extend" disabled>
              {intl.get('v2.sign_in_wallet')}
              <span className="siging-icon"></span>
            </button>
          ) : (
            <button
              className="j-large-btn j-supply rent-now gas-less-btn energy_config_extend"
              disabled={
                this.state.rentAmountsErrorMsg ||
                (BigNumber(needToPayTrx).gt(trxBalance) && showBalanceError) ||
                isExpired
              }
              onClick={() =>
                this.rentResourceValid(
                  this.state.rentAmountsErrorMsg || BigNumber(needToPayTrx).gt(trxBalance) || isExpired,
                  rentAmountsStakeInputValues,
                  needToPayTrx,
                  'addEnergy'
                )
              }
            >
              {intl.get('strx.energy_config_extend')}
            </button>
          )}
          {declined && transType === 'addEnergy' && (
            <div className="j-error-tip wallet-reject">
              <span className="j-error-img"></span>
              <div>{intl.get('v2.reject_in_wallet')}</div>
            </div>
          )}

          {isExpired ? (
            <div className="j-error-tip wallet-reject">
              <span className="j-error-img"></span>
              <div>{intl.get('strx.expired_tip')}</div>
            </div>
          ) : (
            BigNumber(needToPayTrx).gt(trxBalance) &&
            showBalanceError && (
              <div className="j-error-tip wallet-reject">
                <span className="j-error-img"></span>
                <div>
                  {intl.getHTML('strx.energy_insufficient_balance', {
                    value: formatNumber(trxBalance, Config.trxDecimal)
                  })}
                </div>
              </div>
            )
          )}
        </div>
      </>
    );
  };

  timeAddRender = () => {
    const { isExpired } = this.judgeExpiredClear();
    const {
      rentWaysTimeInputValue,
      rentWaysRentInputValue,
      approving,
      rentWaysSelectValue,
      defaultRent,
      showBalanceError,
      energyUsed,
      mobile
    } = this.state;
    const { isConnected } = this.props.network;
    const { marketData } = this.props.strx;
    let { trxBalance } = this.props.strx;
    trxBalance = BigNumber(trxBalance).div(Config.trxPrecision);
    const rentWaysTimeInputValues = rentWaysTimeInputValue || 1;
    const rentWaysRentInputValues = rentWaysRentInputValue || defaultRent;
    const { fee, rate, rentPerDay, rentDaysLeft, rentDaysLeftTrue, rentMoney } = this.getCurrentInfos();
    const timeFinal = isExpired
      ? BigNumber(rentDaysLeft)
          .minus(new Date().getTime())
          .plus(BigNumber(rentWaysTimeInputValues).times(86400 * 1000))
          .div(1000)
      : BigNumber(rentWaysTimeInputValues).times(86400);

    const { needToPayTrx } = this.getDynamicInfos(0, timeFinal, 'addTime');
    const needToPayTrxNew = rentWaysSelectValue === '3' ? rentWaysRentInputValues : needToPayTrx;
    const rentDaysLefts = isExpired
      ? BigNumber(new Date().getTime()).plus(BigNumber(rentWaysTimeInputValues).times(86400 * 1000))
      : BigNumber(rentDaysLeft).plus(BigNumber(rentWaysTimeInputValues).times(86400 * 1000));
    const { days, hours, mins } = transferTime(isExpired ? new Date().getTime() : BigNumber(rentDaysLeft));
    const { days: daysAfter, hours: hoursAfter, mins: minsAfter } = transferTime(rentDaysLefts);
    const { transModalInfo } = this.props.system;
    const { lang, theme } = this.props.lend;
    const { declined, transType } = transModalInfo;

    return (
      <>
        <div className="rent-content">
          {!mobile && (
            <div className="rent-labels jce">
              <span className="rent-days-title">{intl.get('strx.energy_available_balance')}:</span>
              <span className="rent-days-value">
                {!isConnected ? '--' : formatNumber(trxBalance, Config.trxDecimal)} TRX
              </span>
            </div>
          )}
          {this.rentWaysRender()}
          <div className="energy-infos no-padding">
            <div className="add-after">
              <div>
                <div className="after-title">
                  {BigNumber(rentDaysLeft).isNaN()
                    ? '--'
                    : intl.getHTML('strx.energy_d_h_m', { value1: days, value2: hours, value3: mins })}
                </div>
                <div className="after-subtitle date">
                  {intl.getHTML('strx.energy_expired', {
                    value: BigNumber(rentDaysLeftTrue).isNaN()
                      ? '--'
                      : moment(BigNumber(rentDaysLeftTrue).toNumber()).format('YYYY-MM-DD HH:mm')
                  })}
                </div>
              </div>
              <div className="add-to-icon"></div>
              <div className="after-rent">
                <div className="after-title">
                  <div className="after-title-with-go-up">
                    {BigNumber(rentDaysLeft).isNaN()
                      ? '--'
                      : intl.getHTML('strx.energy_d_h_m', {
                          value1: daysAfter,
                          value2: hoursAfter,
                          value3: minsAfter
                        })}{' '}
                    {/* <span className="go-up-icon"></span> */}
                  </div>
                </div>
                <div className="after-subtitle date">
                  {intl.getHTML('strx.energy_expired', {
                    value: BigNumber(rentDaysLeft).isNaN()
                      ? '--'
                      : moment(isExpired ? new Date().getTime() : BigNumber(rentDaysLeft).toNumber())
                          .add(BigNumber(rentWaysTimeInputValues).times(86400 * 1000), 'milliseconds')
                          .format('YYYY-MM-DD HH:mm')
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="energy-infos energy-infos-new mt20">
            <div className="energy-info">
              <div className={`info-subtitle flex ${lang}`}>
                {intl.get('strx.total_prepayment')}
                <br />
                {intl.get('strx.return_early')}
              </div>

              <div className="pay-amount-sub ellipsis dashed pay-amount-sub-calc">
                <Tooltip
                  title={
                    <div className="rent-fee-detail">
                      <div className="flexB flexA rent-fee-detail-item">
                        <div className="name">{intl.get('strx.energy_prepay_tips1')}</div>
                        <div className="value ellipsis">
                          {BigNumber(needToPayTrxNew).eq(0) ? 0 : formatNumber(needToPayTrxNew, Config.trxDecimal)} TRX
                        </div>
                      </div>

                      <div className="flexB flexA rent-fee-detail-item">
                        <div className="name">{intl.getHTML('strx.energy_rent_money_tips')}</div>
                        <div className="value">{intl.get('strx.energy_no_need_pay')}</div>
                      </div>

                      {this.returnRuleTipRender()}
                    </div>
                  }
                  placement="bottomRight"
                  arrowPointAtCenter
                  getPopupContainer={() => document.body.querySelector('.rent-content')}
                  overlayClassName="j-tooltip-dropdown triangle-icon w314 pay-amount-sub-arrow"
                  onMouseEnter={() => {
                    try {
                      setTimeout(() => {
                        const calcDom = document.querySelector('.pay-amount-sub-calc');
                        const half_w = calcDom.offsetWidth / 2;
                        const arrow = document.querySelector('.pay-amount-sub-arrow .ant-tooltip-arrow');
                        arrow.style.right = half_w + 8 + 'px';
                      }, 200);
                    } catch (error) {}
                  }}
                >
                  {formatNumber(needToPayTrx, Config.trxDecimal)} TRX
                </Tooltip>
              </div>
            </div>
            {this.energyTransactionUsedEnergyRender()}
          </div>

          {this.energyUsedTipRender()}

          {approving ? (
            <button className="j-large-btn j-supply rent-now j-signing energy_config_extend" disabled>
              {intl.get('v2.sign_in_wallet')}
              <span className="siging-icon"></span>
            </button>
          ) : (
            <button
              className="j-large-btn j-supply rent-now  gas-less-btn energy_config_extend"
              disabled={
                ((this.state.rentWaysErrorMsg && !['-1', '-2', '-3'].includes(this.state.rentWaysErrorMsg)) ||
                  BigNumber(needToPayTrxNew).gt(trxBalance)) &&
                showBalanceError
              }
              onClick={() =>
                this.rentResourceValid(
                  (this.state.rentWaysErrorMsg && !['-1', '-2', '-3'].includes(this.state.rentWaysErrorMsg)) ||
                    BigNumber(needToPayTrxNew).gt(trxBalance),
                  0,
                  needToPayTrxNew,
                  'addTime'
                )
              }
            >
              {intl.get('strx.energy_config_extend')}
            </button>
          )}
          {declined && transType === 'addTime' && (
            <div className="j-error-tip wallet-reject">
              <span className="j-error-img"></span>
              <div>{intl.get('v2.reject_in_wallet')}</div>
            </div>
          )}
          {BigNumber(needToPayTrxNew).gt(trxBalance) && showBalanceError && (
            <div className="j-error-tip wallet-reject">
              <span className="j-error-img"></span>
              <div>
                {intl.getHTML('strx.energy_insufficient_balance', {
                  value: formatNumber(trxBalance, Config.trxDecimal)
                })}
              </div>
            </div>
          )}
        </div>
      </>
    );
  };

  energyRender = () => {
    const { rentBalance } = this.props.strx;
    const { isConnected, defaultAccount } = this.props.network;
    return !BigNumber(rentBalance).gt(0) || !isConnected ? (
      <>
        {this.rentInfoNotLogin()}
        {this.rentFormNotLogin()}
      </>
    ) : (
      <>
        {this.rentInfo()}
        {this.rentForm()}
      </>
    );
  };

  rentResourceValid = (isInvalid, stakeAmount, needToPayTrx, type) => {
    this.setState({ showBalanceError: true });
    if (isInvalid) {
      return;
    }
    this.rentResource(stakeAmount, needToPayTrx, type);
  };

  rentResource = async (stakeAmount, needToPayTrx, type) => {
    try {
      if (type === 'addTime') {
        window.gtag('event', 'PC_energy_rent_extend_time_button', {
          'event_category': 'sTRX',
          'event_label': 'energy_rent_extend_time_button'
        });
      } else if (type === 'addEnergy') {
        window.gtag('event', 'PC_energy_rent_extend_energy_button', {
          'event_category': 'sTRX',
          'event_label': 'energy_rent_extend_energy_button'
        });
      } else {
        window.gtag('event', 'PC_energy_rent_button', {
          'event_category': 'sTRX',
          'event_label': 'energy_rent_button'
        });
      }

      if (this.props.network.isRightChain === 0) {
        this.props.network.changeChain();
        return;
      }

      if (this.props.strx.rentPaused) {
        return this.props.strx.setData({ rentPausedVisible: true });
      }

      this.props.system.clearRejectError();

      const intlObj = {
        title: 'v2.transaction_confirm',
        title2: 'deposit.transactionsent',
        title3: 'v2.transaction_confirm_fail',
        title4: 'deposit.confirm_transaction',
        obj: {
          value: formatNumber(needToPayTrx, Config.trxDecimal),
          token: 'TRX'
        },
        transType: type ? type : 'rentResource'
      };

      this.setState({ approving: true });

      const contractAddress = Config.contract.marketProxyContract;
      let funcSelector = 'rentResource(address,uint256,uint256)';
      const amount = BigNumber(stakeAmount).times(Config.trxPrecision)._toFixed(0, 1);
      let parameters = [
        { type: 'address', value: window.defaultAccount },
        { type: 'uint256', value: amount },
        { type: 'uint256', value: 1 }
      ];
      const feeLimit = await this.props.system.getFeeLimitCommon(contractAddress, funcSelector, parameters);

      const txID = await this.props.system.rentResource(
        window.defaultAccount,
        amount,
        1,
        new BigNumber(needToPayTrx).times(Config.trxPrecision)._toFixed(0, 1),
        intlObj,
        feeLimit
      );

      if (txID) {
        if (type === 'addTime') {
          window.gtag('event', 'PC_energy_rent_extend_time_success', {
            'event_category': 'sTRX',
            'event_label': 'energy_rent_extend_time_success'
          });
        } else if (type === 'addEnergy') {
          window.gtag('event', 'PC_energy_rent_extend_energy_success', {
            'event_category': 'sTRX',
            'event_label': 'energy_rent_extend_energy_success'
          });
        } else {
          window.gtag('event', 'PC_energy_rent_success', {
            'event_category': 'sTRX',
            'event_label': 'energy_rent_success'
          });
        }
        setTimeout(() => {
          this.initForm();
          this.props.strx.getUserTrxBalance();
          this.props.strx.getAccountRentInfos();
          this.props.strx.getNotAccountRentInfos();
          this.props.strx.getReturnRentInfo();
        }, 5000);
      }
      this.setState({ approving: false });
    } catch (e) {
      console.log('error: rentResource');
    }
  };

  returnSource = () => {
    try {
      window.gtag('event', 'PC_energy_return_source', {
        'event_category': 'sTRX',
        'event_label': 'energy_return_source'
      });

      if (this.props.network.isRightChain === 0) {
        this.props.network.changeChain();
        return;
      }

      this.props.strx.setData({ returnResourceVisible: true });
    } catch (e) {
      console.log('error: returnSource');
    }
  };

  render() {
    const { allowanceVisible } = this.props.network;
    const { theme, applicationMap } = this.props.lend;
    const { returnSourceInfo, lang, mobile, hideNewVersionHint } = this.state;
    const { marketData } = this.props.strx;
    const announcementUrl = this.getAnnouncementUrl();
    const learnUrl = this.getLearnUrl();
    const { orderListTotalCount, miniReceiverTotal } = this.props.energyRental;

    return (
      <>
        <div className={'j-wrapper ' + theme + (Config.winterThemeVisible ? ' snow-show' : '')}>
          {Config.winterThemeVisible && <WinterTheme fromPage="energyRent" />}
          <Header instantActions={this.getMarketData} mountedActions={this.getUserData}></Header>
          <SeasonToolBar pageName="energyRent" />
          <div className="j-stake-container j-energy-rent">
            <div className="j-liquidity-stake ">
              <div className="top-header">
                <div className="flexA">
                  <div className="title energy-rent-title">{intl.get('strx.energy_rental')}</div>
                  <Link
                    to={'/energyRental?lang=' + lang}
                    className="new-version-link green"
                    href={'/energyRental?lang=' + lang}
                    onClick={() => {
                      window.gtag('event', 'click', {
                        'event_category': 'energyrent',
                        'event_label': 'energyrent_old_click_swicthtoPro'
                      });
                    }}
                  >
                    {intl.get('energy_rental.page_header.new_version_btn')}
                  </Link>
                  {orderListTotalCount + miniReceiverTotal <= 1 && !hideNewVersionHint && (
                    <div className={'new-version-hint' + (lang === 'en-US' ? ' en' : '')}>
                      {intl.get('s7.try_new_version')}
                      <span
                        className="close-btn"
                        onClick={() => {
                          this.setState({ hideNewVersionHint: true });
                        }}
                      ></span>
                    </div>
                  )}
                  {orderListTotalCount + miniReceiverTotal > 1 && !hideNewVersionHint && (
                    <div className={'new-version-hint' + (lang === 'en-US' ? ' en' : '')}>
                      {intl.get('energy_rental.page_header.new_version_hint')}
                      <span
                        className="close-btn"
                        onClick={() => {
                          this.setState({ hideNewVersionHint: true });
                        }}
                      ></span>
                    </div>
                  )}
                </div>
                <div className="info">
                  <div className="desc">
                    {intl.get('strx.energy_rental_desc')}
                    <LinkButton
                      href={learnUrl}
                      target="_blank"
                      className="learn-more"
                      onClick={() => {
                        window.gtag('event', 'PC_energy_learn_more', {
                          'event_category': 'sTRX',
                          'event_label': 'energy_learn_more'
                        });
                      }}
                    >
                      {intl.get('strx.energy_lerna_more')}
                    </LinkButton>
                  </div>
                  <div className="j-announce">
                    <span className="announce-icon"></span>
                    <a
                      className="announce-content"
                      onClick={window.gtag('event', 'PC_energy_announce', {
                        'event_category': 'sTRX',
                        'event_label': 'energy_announce'
                      })}
                      href={announcementUrl}
                      target="announce"
                      rel="noopener noreferrer"
                    >
                      {intl.get('strx.stake_annoucement_2')}
                    </a>
                    <span className="announce-arrow-icon"></span>
                  </div>
                </div>
              </div>
            </div>
            <div className={'j-eles' + (lang === 'en-US' ? ' en' : '')}>{this.energyRender()}</div>
            <MarketData data={marketData} type="energy"></MarketData>
          </div>
          <Footer></Footer>
        </div>
        <ReturnResourcenModal callback={this.initForm} />
        <RentPausedModal />
        <TransactionModal />
        {allowanceVisible && <AllowanceModal store="strx" />}
        <TabsBar theme={theme} />
      </>
    );
  }
}

export default EnergyRent;
