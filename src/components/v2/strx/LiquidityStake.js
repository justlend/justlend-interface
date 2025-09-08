import React from 'react';
import { Input, Tooltip, Popover } from 'antd';
import intl from 'react-intl-universal';
import isMobile from 'ismobilejs';
import { inject, observer } from 'mobx-react';
import BigNumber from 'bignumber.js';
import Header from '../Header';
import SeasonToolBar from '../season/index';
import Footer from '../Footer';
import TransactionModal from '../../Modals/v2/Transaction';
import { getAnnoucements, getSTrxDashboard, getSTrxStakeAccount } from '../../../utils/backend';
import {
  getQueryObj,
  formatNumber,
  numberParser,
  addThousandSeparators,
  removeThousandSeparators
} from '../../../utils/helper';
import { financeStat } from '../../../utils/stat';
import '../../../assets/css/v2/liquidity-stake.scss';
import '../../../assets/css/v2/theme.scss';
import { MarketData } from './MarketData';
import UnlockDetailModal from './UnlockDetailModal';
import RoundSize from './RoundSize';
import TabsBar from '../mobile/TabsBar';
import WinterTheme from '../../WinterTheme';
import { TooltipText } from './TooltipText';
import { Config } from '../../../config';
import { LinkButton } from '../../Common/LinkButton';

import '../../../assets/css/v2/liquidity-stake.scss';
import '../../../assets/css/v2/theme.scss';

@inject('network')
@inject('lend')
@inject('system')
@inject('pool')
@inject('strx')
@observer
class LiquidityStake extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      mobile: isMobile(window.navigator).any,
      marketData: {
        model: []
      },
      userData: {
        roundDetails: []
      },
      percentSelected: 0,
      inputTRX: '',
      TRX2sTRX: '--',
      sTRX2TRX: '--',
      inputsTRX: '',
      showStrxBalance: false, // true strx, false trx,
      stakeTab: 1, // deposit 1, withdraw 2,
      unlockModalVisible: false,
      roundSizeModalVisible: false,
      trxDollar: '',
      strxDollar: '',
      errorFlag: 0,
      submitting: false,
      claimSubmit: false,
      fromFinance: false
    };
  }
  componentDidMount = async () => {
    // const { mobile } = this.state;
    // if (mobile) {
    //   window.location.href = window.location.origin + (window.location?.pathname || '') + '#/strx';
    // }
    await this.props.lend.getLatestBlockInfo();
    this.props.strx.setVariablesInterval();
    document.title = 'Staked TRX - JustLend DAO';

    const { hash, search } = window.location;

    if (hash.includes('source=finance') || search.includes('source=finance')) {
      this.setState({ fromFinance: true });
    }

    window.gtag('event', 'PC_page_strx', { 'event_category': 'sTRX', 'event_label': 'page_strx' });
  };

  componentWillUnmount() {
    this.props.system.clearRejectError();
    this.props.strx.clearVariablesInterval();
  }

  getUserData = async address => {
    const res = await getSTrxStakeAccount(address);
    if (res.success) {
      this.setState({
        userData: res.data
      });
    }
  };

  deposit = async () => {
    this.props.system.clearRejectError();

    window.gtag('event', 'PC_stake_stake_button', { 'event_category': 'sTRX', 'event_label': 'stake_stake_button' });

    if (this.props.network.isRightChain === 0) {
      this.props.network.changeChain();
      return;
    }

    const { inputTRX, fromFinance, mobile } = this.state;
    const { defaultAccount } = this.props.network;

    let input = BigNumber(inputTRX).eq(0) || BigNumber(inputTRX).isNaN() ? 1000 : inputTRX;

    const intlObj = {
      title: 'v2.transaction_confirm',
      title2: 'deposit.transactionsent',
      title3: 'v2.transaction_confirm_fail',
      title4: 'strx.stake_stake',
      obj: {
        value: BigNumber(inputTRX).eq(0) || BigNumber(inputTRX).isNaN() ? 1000 : inputTRX,
        token: 'TRX'
      },
      transType: 'depositsTRX'
    };
    this.setState({ submitting: true });

    const contractAddress = Config.contract.sTRXProxyContract;
    let funcSelector = 'deposit()';
    const amount = new BigNumber(input).times(1e6)._toHex();
    let parameters = [];
    let options = { callValue: amount };
    const feeLimit = await this.props.system.getFeeLimitCommon(contractAddress, funcSelector, parameters, options);

    const txID = await this.props.system.strxDeposit(amount, intlObj, feeLimit);
    if (txID) {
      setTimeout(async () => {
        await this.props.strx.getUserData();
        await this.props.strx.getUserTrxBalance();
        this.resetData();

        if (mobile && fromFinance) {
          const data = {
            actionType: 9,
            actionTime: new Date().getTime(),
            'tokenId': '_',
            'amount': new BigNumber(input).times(1e6)._toFixed(0, 1)
          };
        }
      }, 5000);
      window.gtag('event', 'PC_stake_stake_success', {
        'event_category': 'sTRX',
        'event_label': 'stake_stake_success'
      });
    }
    this.setState({ submitting: false });
  };

  withdraw = async () => {
    this.props.system.clearRejectError();

    window.gtag('event', 'PC_stake_unstake_button', {
      'event_category': 'sTRX',
      'event_label': 'stake_unstake_button'
    });

    if (this.props.network.isRightChain === 0) {
      this.props.network.changeChain();
      return;
    }

    const { userData, marketData } = this.props.strx;
    const { accountSupply, processingRoundSize } = userData;
    const { inputsTRX, percentSelected, mobile, fromFinance } = this.state;
    const { exchangeRate } = marketData;
    const { defaultAccount } = this.props.network;

    if (processingRoundSize > 32) {
      this.setState({
        roundSizeModalVisible: true
      });
      return;
    }

    let input =
      BigNumber(inputsTRX).eq(0) || BigNumber(inputsTRX).isNaN()
        ? 1000
        : percentSelected === 4
        ? accountSupply
        : inputsTRX;

    const intlObj = {
      title: 'v2.transaction_confirm',
      title2: 'deposit.transactionsent',
      title3: 'v2.transaction_confirm_fail',
      title4: 'strx.stake_unstake',
      obj: {
        value: BigNumber(inputsTRX).isNaN() ? 1000 : inputsTRX,
        token: 'sTRX'
      },
      transType: 'withdrawStrx'
    };
    this.setState({ submitting: true });

    const contractAddress = Config.contract.sTRXProxyContract;
    const amount = new BigNumber(input).times(1e18)._toHex();
    let funcSelector = 'withdraw(uint256)';
    let parameters = [{ type: 'uint256', value: amount }];
    const feeLimit = await this.props.system.getFeeLimitCommon(contractAddress, funcSelector, parameters);
    const options = { feeLimit };

    const txID = await this.props.system.strWithdraw(amount, intlObj, options);

    if (txID) {
      setTimeout(async () => {
        await this.props.strx.getMarketData();
        await this.props.strx.getUserData();
        await this.props.strx.getUserTrxBalance();
        this.resetData();

        if (mobile && fromFinance) {
          const data = {
            actionType: 10,
            actionTime: new Date().getTime(),
            'tokenId': '_',
            'amount': new BigNumber(input).times(exchangeRate).div(1e12)._toFixed(0, 1)
          };
        }
      }, 5000);
      window.gtag('event', 'PC_stake_unstake_success', {
        'event_category': 'sTRX',
        'event_label': 'stake_unstake_success'
      });
    }
    this.setState({ submitting: false });
  };

  claimAll = async () => {
    this.props.system.clearRejectError();

    window.gtag('event', 'PC_stake_claim_button', { 'event_category': 'sTRX', 'event_label': 'stake_claim_button' });

    if (this.props.network.isRightChain === 0) {
      this.props.network.changeChain();
      return;
    }

    const { userData } = this.props.strx;

    const { accountCanClaimAmount } = userData;

    const intlObj = {
      title: 'v2.transaction_confirm',
      title2: 'deposit.transactionsent',
      title3: 'v2.transaction_confirm_fail',
      title4: 'lend.withdraw',
      obj: {
        value: accountCanClaimAmount,
        token: 'sTRX'
      },
      transType: 'claimStrx'
    };
    this.setState({ claimSubmit: true });

    const contractAddress = Config.contract.sTRXProxyContract;
    let funcSelector = 'claimAll()';
    let parameters = [];
    const feeLimit = await this.props.system.getFeeLimitCommon(contractAddress, funcSelector, parameters);
    const options = { feeLimit };

    const txID = await this.props.system.claimAll(intlObj, options);
    if (txID) {
      setTimeout(async () => {
        await this.props.strx.getMarketData();
        await this.props.strx.getUserData();
        await this.props.strx.getUserTrxBalance();
        this.resetData();
      }, 5000);
      window.gtag('event', 'PC_stake_claim_success', {
        'event_category': 'sTRX',
        'event_label': 'stake_claim_success'
      });
    }
    this.setState({ claimSubmit: false });
  };

  onChangeInputTRX = async (value, from = 'input') => {
    const { valid, str } = numberParser(value, 6);
    this.props.system.clearRejectError();
    if (valid) {
      const { marketData, trxBalance, energyFee, getEnergyFee } = this.props.strx;
      const { exchangeRate, trxPrice } = marketData;
      const { errorFlag } = this.setState;
      let TRX2sTRX = BigNumber(str).times(1e18).div(exchangeRate);
      let trxDollar =
        BigNumber(str).eq(0) || str === '' || BigNumber(str).times(trxPrice).lt(0.01)
          ? ''
          : '≈ $' + formatNumber(BigNumber(str).times(trxPrice), 2);

      if (from === 'percent') {
        this.setState({
          inputTRX: str,
          TRX2sTRX,
          trxDollar
        });
      } else {
        this.setState({
          percentSelected: 0,
          inputTRX: str,
          TRX2sTRX,
          trxDollar
        });
      }

      let flag = errorFlag;

      // Calculate safe value
      let safeValue;
      try {
        const trxValue = BigNumber(value).eq(0) || BigNumber(value).isNaN() ? 1000 : value;
        const energyUsed = await this.props.system.getStrxDepositEnergyReqired(
          new BigNumber(trxValue).times(1e6)._toHex()
        );
        let eFee = energyFee || (await getEnergyFee());
        safeValue = BigNumber(BigNumber(energyUsed).times(eFee).div(1e6)._toFixed(0, 1)).plus(2).toNumber();
        safeValue = safeValue < Config.sTRX.safeValueMin ? Config.sTRX.safeValueMin : safeValue;
      } catch (e) {
        console.log('error: calculate safe max');
      }

      if (BigNumber(str).gt(BigNumber(trxBalance).div(1e6))) {
        flag = 1;
      } else if (BigNumber(str).lt(BigNumber(Config.sTRX.stakeLimitMin))) {
        flag = 4;
      } else if (BigNumber(str).gt(BigNumber(Config.sTRX.stakeLimitMax))) {
        flag = 5;
      } else if (
        BigNumber(trxBalance).div(1e6).gt(safeValue) &&
        BigNumber(trxBalance).div(1e6).minus(BigNumber(str)).lt(safeValue)
      ) {
        flag = 2;
      } else if (BigNumber(trxBalance).div(1e6).lte(safeValue) && str !== '') {
        flag = 3;
      }

      this.setState({
        errorFlag: flag,
        safeValue
      });
    }
  };

  onChangeInputsTRX = (value, from = 'input') => {
    const { valid, str } = numberParser(value, 18);
    this.props.system.clearRejectError();
    //console.log(valid, str);
    if (valid) {
      const { marketData, userData } = this.props.strx;
      const { exchangeRate, trxPrice, totalUnfreezable, balanceToUnfreeze } = marketData;
      const { accountSupply } = userData;
      const { errorFlag } = this.setState;
      let sTRX2TRX = BigNumber(str).times(exchangeRate).div(1e18);
      let strxDollar =
        BigNumber(str).eq(0) || str === '' || BigNumber(sTRX2TRX).times(trxPrice).lt(0.01)
          ? ''
          : '≈ $' + formatNumber(BigNumber(sTRX2TRX).times(trxPrice), 2);
      let flag = errorFlag;
      if (BigNumber(str).gt(accountSupply)) {
        flag = 1;
      } else if (BigNumber(str).lt(BigNumber(Config.sTRX.stakeLimitMin))) {
        flag = 4;
      } else if (
        BigNumber(str).gt(BigNumber(totalUnfreezable).minus(balanceToUnfreeze).times(1e18).div(exchangeRate))
      ) {
        flag = 5;
      }
      if (from === 'percent') {
        this.setState({
          inputsTRX: str,
          errorFlag: flag,
          sTRX2TRX,
          strxDollar
        });
      } else {
        this.setState({
          percentSelected: 0,
          inputsTRX: str,
          errorFlag: flag,
          sTRX2TRX,
          strxDollar
        });
      }
    }
  };

  setPercent = value => {
    const { stakeTab } = this.state;
    const { userData, trxBalance } = this.props.strx;
    const { accountSupply } = userData;
    const { isConnected } = this.props.network;
    if (isConnected) {
      if (stakeTab === 1) {
        let v = BigNumber(trxBalance)
          .div(1e6)
          .times(value / 4);
        v = v._toFixed(18, 1);
        this.setState({
          percentSelected: value
        });
        this.onChangeInputTRX(v, 'percent');

        window.gtag('event', 'PC_stake_percent' + value, {
          'event_category': 'sTRX',
          'event_label': 'stake_percent' + value
        });
      } else {
        let v = BigNumber(accountSupply).times(value / 4);
        v = v._toFixed(18, 1);
        this.setState({
          percentSelected: value
        });
        this.onChangeInputsTRX(v, 'percent');
        window.gtag('event', 'PC_unstake_percent' + value, {
          'event_category': 'sTRX',
          'event_label': 'unstake_percent' + value
        });
      }
    }
  };

  getInstantData = async () => {
    await this.props.strx.getMarketData();
  };

  getMountedData = async () => {
    await this.props.strx.getUserData();
    await this.props.strx.getUserTrxBalance();

    this.props.network.on('connect', async () => {
      this.props.system.clearRejectError();
      await this.props.strx.getUserData();
      await this.props.strx.getUserTrxBalance();
      this.resetData();
    });
  };

  exchangeShowStrxBalance = () => {
    const { showStrxBalance } = this.state;
    this.setState({
      showStrxBalance: !showStrxBalance
    });

    window.gtag('event', 'PC_stake_exchange_balance', {
      'event_category': 'sTRX',
      'event_label': 'stake_exchange_balance'
    });
  };

  changeStakeTab = value => {
    this.props.system.clearRejectError();

    this.setState({
      stakeTab: value,
      percentSelected: 0,
      errorFlag: 0,
      submitting: false,
      inputTRX: '',
      inputsTRX: '',
      trxDollar: '',
      strxDollar: ''
    });

    if (value === 1) {
      window.gtag('event', 'PC_stake_stake_tab', { 'event_category': 'sTRX', 'event_label': 'stake_stake_tab' });
    } else if (value === 2) {
      window.gtag('event', 'PC_stake_unstake_tab', { 'event_category': 'sTRX', 'event_label': 'stake_unstake_tab' });
    }
  };

  setUnlockModalVisible = value => {
    this.props.system.clearRejectError();

    this.setState({
      unlockModalVisible: value
    });

    if (value) {
      window.gtag('event', 'PC_stake_show_detail', { 'event_category': 'sTRX', 'event_label': 'stake_show_detail' });
    }
  };

  setRoundSizeVisible = value => {
    this.setState({
      roundSizeModalVisible: value
    });
  };

  onConnect = () => {
    this.props.network.connectWalletV2();

    window.gtag('event', 'PC_stake_connect_wallet', {
      'event_category': 'sTRX',
      'event_label': 'stake_connect_wallet'
    });
  };

  reserveTrx = () => {
    const { trxBalance } = this.props.strx;
    this.onChangeInputTRX(BigNumber(trxBalance).div(1e6).minus(this.state.safeValue));

    window.gtag('event', 'PC_stake_reserve_trx', { 'event_category': 'sTRX', 'event_label': 'stake_reserve_trx' });
  };

  resetData = () => {
    this.setState({
      percentSelected: 0,
      errorFlag: 0,
      submitting: false,
      inputTRX: '',
      inputsTRX: '',
      trxDollar: '',
      strxDollar: ''
    });
  };

  getAnnouncementUrl = () => {
    const { lang } = this.state;
    const announcementUrlNile =
      lang && lang.includes('en')
        ? 'https://justlendorg.zendesk.com/hc/en-us/articles/17080985061657'
        : 'https://justlendorg.zendesk.com/hc/zh-cn/articles/17080985061657';

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
        ? 'https://justlendorg.zendesk.com/hc/en-us/articles/16512826805785'
        : 'https://justlendorg.zendesk.com/hc/zh-cn/articles/16512826805785';

    const learnUrl =
      lang && lang.includes('en')
        ? 'https://justlendorg.zendesk.com/hc/en-us/articles/17525391458329'
        : 'https://justlendorg.zendesk.com/hc/zh-cn/articles/17525391458329';

    return Config.nile ? learnUrlNile : learnUrl;
  };

  render() {
    const { theme } = this.props.lend;
    const { isConnected } = this.props.network;
    const { marketData, userData, trxBalance } = this.props.strx;
    const { transModalInfo } = this.props.system;
    const { declined, transType } = transModalInfo;
    const {
      percentSelected,
      inputTRX,
      TRX2sTRX,
      sTRX2TRX,
      showStrxBalance,
      stakeTab,
      inputsTRX,
      unlockModalVisible,
      roundSizeModalVisible,
      trxDollar,
      strxDollar,
      errorFlag,
      submitting,
      lang,
      claimSubmit,
      mobile
    } = this.state;

    const { exchangeRate, trxPrice, totalApy, avgApy, unfreezeDelayDays, totalUnfreezable, balanceToUnfreeze } =
      marketData;

    const { accountCanClaimAmount, accountSupply, accountWithDrawAmount, accountIncome } = userData;

    const learnUrl = this.getLearnUrl();
    const announcementUrl = this.getAnnouncementUrl();

    return (
      <>
        <div className={'j-wrapper ' + theme + (Config.winterThemeVisible ? ' snow-show' : '')}>
          {Config.winterThemeVisible && <WinterTheme fromPage="liquidityStake" />}
          <Header instantActions={this.getInstantData} mountedActions={this.getMountedData}></Header>
          <SeasonToolBar pageName="liquidityStake" />
          <div className="j-main j-stake-container j-liquidity-stake">
            <div className="top-header">
              <div className="title">{intl.get('strx.stake_trx_liquid_staking')}</div>
              <div className="info">
                <div className="desc">
                  {intl.get('strx.stake_info')}
                  <LinkButton
                    href={learnUrl}
                    target="_portal"
                    className="learn-more"
                    onClick={window.gtag('event', 'PC_stake_about_strx', {
                      'event_category': 'sTRX',
                      'event_label': 'stake_about_strx'
                    })}
                  >
                    {intl.get('strx.stake_about_strx')}
                  </LinkButton>
                </div>
                <div className="j-announce">
                  <span className="announce-icon"></span>
                  <a
                    className="announce-content"
                    onClick={window.gtag('event', 'PC_stake_annoucement', {
                      'event_category': 'sTRX',
                      'event_label': 'stake_annoucement'
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

            <div className="j-liquidity-stake-content">
              {isConnected ? (
                BigNumber(accountSupply).eq(0) &&
                BigNumber(accountWithDrawAmount).eq(0) &&
                BigNumber(accountCanClaimAmount).eq(0) ? (
                  <div className="apy-box-nostake">
                    <div className="apy-title tooltip-text-wrap">
                      <TooltipText
                        overlayClassName="j-tooltip-dropdown"
                        title={
                          <>
                            {intl.get('strx.stake_staking_apy_tip2')}{' '}
                            <LinkButton
                              href={learnUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="learn-more"
                            >
                              {intl.get('strx.stake_staking_apy_link')}
                            </LinkButton>
                          </>
                        }
                        placement="topRight"
                        arrowPointAtCenter
                      >
                        {intl.get('strx.stake_staking_apy')}
                      </TooltipText>
                      <Tooltip
                        overlayClassName="j-tooltip-dropdown"
                        title={
                          <>
                            {intl.get('strx.stake_staking_apy_tip2')}{' '}
                            <LinkButton
                              href={learnUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="learn-more"
                            >
                              {intl.get('strx.stake_staking_apy_link')}
                            </LinkButton>
                          </>
                        }
                        placement="top"
                        arrowPointAtCenter
                      >
                        <span
                          className="j-tooltip-icon"
                          onMouseEnter={() => {
                            window.gtag('event', 'PC_stake_staking_apy_hover', {
                              'event_category': 'sTRX',
                              'event_label': 'stake_staking_apy_hover'
                            });
                          }}
                        ></span>
                      </Tooltip>
                    </div>
                    <div className="apy-value">{formatNumber(avgApy * 100, 2, { miniText: 0.01 })}%</div>
                    <div className="apy-desc">{intl.get('strx.stake_rewards_desc')}</div>
                    <div className="redeem">
                      <section>
                        <div>{intl.get('strx.stake_strx_balance')} </div>
                        <p>
                          <strong>{formatNumber(BigNumber(accountSupply), 3)}</strong>sTRX
                        </p>
                      </section>
                      {BigNumber(accountIncome).gt(0) && (
                        <section>
                          <div className="title tooltip-text-wrap">
                            <TooltipText
                              overlayClassName="j-tooltip-dropdown"
                              title={intl.get('strx.stake_accumulated_tip')}
                              placement="topRight"
                              arrowPointAtCenter
                            >
                              {intl.get('strx.stake_accumulated')}
                            </TooltipText>
                            <Tooltip
                              overlayClassName="j-tooltip-dropdown"
                              title={intl.get('strx.stake_accumulated_tip')}
                              placement="top"
                              arrowPointAtCenter
                            >
                              <span
                                className="j-tooltip-icon"
                                // onMouseEnter={() => {
                                //   window.gtag('event', 'click', {
                                //     'event_category': 'sTRX',
                                //     'event_label': 'stake_staking_apy_hover'
                                //   });
                                // }}
                              ></span>
                            </Tooltip>
                          </div>
                          <strong className="value">
                            {BigNumber(accountIncome).gte(0.01) ? <span className="pre">≈ </span> : ''}
                            {BigNumber(accountIncome).gte(1000000) ? (
                              <Tooltip
                                overlayClassName="j-tooltip-dropdown"
                                title={formatNumber(accountIncome, 2, { miniText: 0.01 })}
                                placement="top"
                                arrowPointAtCenter
                              >
                                <span className="income">{formatNumber(accountIncome, 2, { miniText: 0.01 })}</span>
                              </Tooltip>
                            ) : (
                              <span className="income">{formatNumber(accountIncome, 2, { miniText: 0.01 })}</span>
                            )}
                            <span className="postfix">TRX</span>
                          </strong>
                        </section>
                      )}
                    </div>
                    <div className="apy-img"></div>
                  </div>
                ) : (
                  <div
                    className={`apy-box-stake${
                      !(BigNumber(accountWithDrawAmount).eq(0) && BigNumber(accountCanClaimAmount).eq(0))
                        ? ''
                        : ' no-stake'
                    }`}
                  >
                    <div
                      className={
                        'balance-info' +
                        (BigNumber(accountWithDrawAmount).eq(0) && BigNumber(accountCanClaimAmount).eq(0)
                          ? ' only-stake'
                          : ' ')
                      }
                    >
                      <div className="balance-label" onClick={() => this.exchangeShowStrxBalance()}>
                        {showStrxBalance ? intl.get('strx.stake_strx_balance') : intl.get('strx.stake_trx_staked')}
                        {mobile ? (
                          <span className="exchange"></span>
                        ) : (
                          <Tooltip
                            title={
                              showStrxBalance
                                ? intl.get('strx.stake_exchange_label_trx')
                                : intl.get('strx.stake_exchange_label_strx')
                            }
                            placement="top"
                            overlayClassName="j-tooltip-dropdown"
                            arrowPointAtCenter
                          >
                            <span className="exchange"></span>
                          </Tooltip>
                        )}
                      </div>
                      <div className="balance">
                        {showStrxBalance
                          ? `${formatNumber(accountSupply, 3, { miniText: 0.001 })}`
                          : `${formatNumber(BigNumber(accountSupply).times(exchangeRate).div(1e18), 3, {
                              miniText: 0.001
                            })}`}
                        <span className="postfix">{showStrxBalance ? 'sTRX' : 'TRX'}</span>
                      </div>
                      <div className="money">
                        {BigNumber(accountSupply).times(exchangeRate).div(1e18).times(trxPrice).gte(0.01) ? '≈ ' : ''}

                        {formatNumber(BigNumber(accountSupply).times(exchangeRate).div(1e18).times(trxPrice), 2, {
                          miniText: 0.01,
                          needDolar: true
                        })}
                      </div>
                    </div>
                    {BigNumber(accountWithDrawAmount).eq(0) && BigNumber(accountCanClaimAmount).eq(0) ? (
                      <div className="apy-only-stake">
                        <div className="column">
                          <div className="title tooltip-text-wrap">
                            <TooltipText
                              overlayClassName="j-tooltip-dropdown"
                              title={
                                <>
                                  {intl.get('strx.stake_staking_apy_tip2')}{' '}
                                  <LinkButton
                                    href={learnUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="learn-more"
                                  >
                                    {intl.get('strx.stake_staking_apy_link')}
                                  </LinkButton>
                                </>
                              }
                              placement="topRight"
                              arrowPointAtCenter
                            >
                              {intl.get('strx.stake_staking_apy')}
                            </TooltipText>
                            <Tooltip
                              overlayClassName="j-tooltip-dropdown"
                              title={
                                <>
                                  {intl.get('strx.stake_staking_apy_tip2')}{' '}
                                  <LinkButton
                                    href={learnUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="learn-more"
                                  >
                                    {intl.get('strx.stake_staking_apy_link')}
                                  </LinkButton>
                                </>
                              }
                              placement="top"
                              arrowPointAtCenter
                            >
                              <span
                                className="j-tooltip-icon"
                                onMouseEnter={() => {
                                  window.gtag('event', 'PC_stake_staking_apy_hover', {
                                    'event_category': 'sTRX',
                                    'event_label': 'stake_staking_apy_hover'
                                  });
                                }}
                              ></span>
                            </Tooltip>
                          </div>
                          <strong className="value">{formatNumber(avgApy * 100, 2, { miniText: 0.01 })}%</strong>
                        </div>
                        <div className="column">
                          <div className="title">
                            {intl.get('strx.stake_daily_rewards')}
                            <em></em>
                          </div>
                          <strong className="value">
                            {formatNumber(
                              BigNumber(accountSupply).times(exchangeRate).div(1e18).times(totalApy).div(365),
                              3,
                              { miniText: 0.001 }
                            )}
                            <span className="postfix">TRX</span>
                          </strong>
                        </div>
                        <div className="column">
                          <div className="title tooltip-text-wrap">
                            <TooltipText
                              overlayClassName="j-tooltip-dropdown"
                              title={intl.get('strx.stake_accumulated_tip')}
                              placement="topRight"
                              arrowPointAtCenter
                            >
                              {intl.get('strx.stake_accumulated')}
                            </TooltipText>
                            <Tooltip
                              overlayClassName="j-tooltip-dropdown"
                              title={intl.get('strx.stake_accumulated_tip')}
                              placement="top"
                              arrowPointAtCenter
                            >
                              <span
                                className="j-tooltip-icon"
                                // onMouseEnter={() => {
                                //   window.gtag('event', 'click', {
                                //     'event_category': 'sTRX',
                                //     'event_label': 'stake_staking_apy_hover'
                                //   });
                                // }}
                              ></span>
                            </Tooltip>
                          </div>
                          <strong className="value">
                            {BigNumber(accountIncome).gte(0.01) ? <span className="pre">≈ </span> : ''}
                            {BigNumber(accountIncome).gte(1000000) ? (
                              <Tooltip
                                overlayClassName="j-tooltip-dropdown"
                                title={formatNumber(accountIncome, 2, { miniText: 0.01 })}
                                placement="top"
                                arrowPointAtCenter
                              >
                                <span className="income">{formatNumber(accountIncome, 2, { miniText: 0.01 })}</span>
                              </Tooltip>
                            ) : (
                              <span className="income">{formatNumber(accountIncome, 2, { miniText: 0.01 })}</span>
                            )}
                            <span className="postfix">TRX</span>
                          </strong>
                        </div>
                      </div>
                    ) : (
                      <div className="user-stake-info">
                        <div className="withdraw-label tooltip-text-wrap">
                          <TooltipText
                            overlayClassName="j-tooltip-dropdown"
                            title={intl.get('strx.stake_avaiable_withdraw_tip', { value: unfreezeDelayDays })}
                            placement="topLeft"
                            arrowPointAtCenter
                          >
                            {intl.get('strx.stake_avaiable_withdraw')}
                          </TooltipText>
                          <Tooltip
                            overlayClassName="j-tooltip-dropdown"
                            title={intl.get('strx.stake_avaiable_withdraw_tip', { value: unfreezeDelayDays })}
                            placement="top"
                            arrowPointAtCenter
                          >
                            <span
                              className="j-tooltip-icon"
                              onMouseEnter={() => {
                                window.gtag('event', 'PC_stake_avaiable_withdraw_hover', {
                                  'event_category': 'sTRX',
                                  'event_label': 'stake_avaiable_withdraw_hover'
                                });
                              }}
                            ></span>
                          </Tooltip>
                        </div>
                        <div className="withdraw-balance">
                          <strong>{formatNumber(BigNumber(accountCanClaimAmount), 3, { miniText: 0.001 })}</strong>TRX
                        </div>
                        {BigNumber(accountWithDrawAmount).gt(0) ? (
                          <div className="unlock-bar">
                            {intl.getHTML('strx.stake_strx_unstaking', {
                              value: formatNumber(BigNumber(accountWithDrawAmount), 3, { miniText: 0.001 })
                            })}
                            <LinkButton showArrow={false} onClick={this.setUnlockModalVisible} className="detail">
                              {intl.get('strx.stake_details')}
                            </LinkButton>
                          </div>
                        ) : null}

                        <div
                          className={`apy-info ${
                            !BigNumber(accountWithDrawAmount).gt(0) ? 'show-widthdraw' : 'no-withdraw'
                          }`}
                        >
                          <div className="column">
                            <div className="title tooltip-text-wrap">
                              <TooltipText
                                overlayClassName="j-tooltip-dropdown"
                                title={
                                  <>
                                    {intl.get('strx.stake_staking_apy_tip2')}{' '}
                                    <LinkButton
                                      href={learnUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="learn-more"
                                    >
                                      {intl.get('strx.stake_staking_apy_link')}
                                    </LinkButton>
                                  </>
                                }
                                placement="topRight"
                                arrowPointAtCenter
                              >
                                {intl.get('strx.stake_staking_apy')}
                              </TooltipText>
                              <Tooltip
                                overlayClassName="j-tooltip-dropdown"
                                title={
                                  <>
                                    {intl.get('strx.stake_staking_apy_tip2')}{' '}
                                    <LinkButton
                                      href={learnUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="learn-more"
                                    >
                                      {intl.get('strx.stake_staking_apy_link')}
                                    </LinkButton>
                                  </>
                                }
                                placement="top"
                                arrowPointAtCenter
                              >
                                <span
                                  className="j-tooltip-icon"
                                  onMouseEnter={() => {
                                    window.gtag('event', 'PC_stake_staking_apy_hover', {
                                      'event_category': 'sTRX',
                                      'event_label': 'stake_staking_apy_hover'
                                    });
                                  }}
                                ></span>
                              </Tooltip>
                            </div>
                            <strong className="value">{formatNumber(avgApy * 100, 2, { miniText: 0.01 })}%</strong>
                          </div>
                          <div className="column">
                            <div className="title">
                              {intl.get('strx.stake_daily_rewards')}
                              <em></em>
                            </div>
                            <strong className="value">
                              {formatNumber(
                                BigNumber(accountSupply).times(exchangeRate).div(1e18).times(totalApy).div(365),
                                3,
                                { miniText: 0.001 }
                              )}
                              <span className="postfix">TRX</span>
                            </strong>
                          </div>
                          <div className="column">
                            <div className="title tooltip-text-wrap">
                              <TooltipText
                                overlayClassName="j-tooltip-dropdown"
                                title={intl.get('strx.stake_accumulated_tip')}
                                placement="topRight"
                                arrowPointAtCenter
                              >
                                {intl.get('strx.stake_accumulated')}
                              </TooltipText>
                              <Tooltip
                                overlayClassName="j-tooltip-dropdown"
                                title={intl.get('strx.stake_accumulated_tip')}
                                placement="top"
                                arrowPointAtCenter
                              >
                                <span
                                  className="j-tooltip-icon"
                                  // onMouseEnter={() => {
                                  //   window.gtag('event', 'click', {
                                  //     'event_category': 'sTRX',
                                  //     'event_label': 'stake_staking_apy_hover'
                                  //   });
                                  // }}
                                ></span>
                              </Tooltip>
                            </div>
                            <strong className="value">
                              {BigNumber(accountIncome).gte(0.01) ? <span className="pre">≈ </span> : ''}
                              {BigNumber(accountIncome).gte(1000000) ? (
                                <Tooltip
                                  overlayClassName="j-tooltip-dropdown"
                                  title={formatNumber(accountIncome, 2, { miniText: 0.01 })}
                                  placement="top"
                                  arrowPointAtCenter
                                >
                                  <span className="income">{formatNumber(accountIncome, 2, { miniText: 0.01 })}</span>
                                </Tooltip>
                              ) : (
                                <span className="income">{formatNumber(accountIncome, 2, { miniText: 0.01 })}</span>
                              )}
                              <span className="postfix">TRX</span>
                            </strong>
                          </div>
                        </div>
                        {BigNumber(accountCanClaimAmount).gt(0) ? (
                          claimSubmit ? (
                            <div className="withdraw disabled">
                              {intl.get('strx.stake_withdraw')}
                              <span className="siging-icon"></span>
                            </div>
                          ) : (
                            <div className="withdraw j-large-btn j-supply" onClick={() => this.claimAll()}>
                              {intl.get('strx.stake_withdraw')}
                            </div>
                          )
                        ) : (
                          <Tooltip
                            overlayClassName="j-tooltip-dropdown"
                            title={intl.get('strx.stake_no_withdraw_amount')}
                            placement="top"
                            arrowPointAtCenter
                          >
                            <div className="withdraw disabled">{intl.get('strx.stake_withdraw')}</div>
                          </Tooltip>
                        )}

                        {declined && transType === 'claimStrx' && (
                          <div className="reject-info j-error-tip">
                            {intl.get('v2.reject_in_wallet')}
                            <span className="j-error-img"></span>
                          </div>
                        )}
                      </div>
                    )}

                    <div
                      className={
                        'img-bg' +
                        (BigNumber(accountWithDrawAmount).eq(0) && BigNumber(accountCanClaimAmount).eq(0)
                          ? ' only-stake'
                          : ' ')
                      }
                    ></div>
                  </div>
                )
              ) : (
                <div className="apy-box-nostake disconnect">
                  <div className="apy-title tooltip-text-wrap">
                    <TooltipText
                      overlayClassName="j-tooltip-dropdown"
                      title={
                        <>
                          {intl.get('strx.stake_staking_apy_tip2')}{' '}
                          <LinkButton href={learnUrl} target="_blank" rel="noopener noreferrer" className="learn-more">
                            {intl.get('strx.stake_staking_apy_link')}
                          </LinkButton>
                        </>
                      }
                      placement="topRight"
                      arrowPointAtCenter
                    >
                      {/* APY */}
                      {intl.get('strx.stake_staking_apy')}
                    </TooltipText>
                    <Tooltip
                      overlayClassName="j-tooltip-dropdown"
                      title={
                        <>
                          {intl.get('strx.stake_staking_apy_tip2')}{' '}
                          <LinkButton href={learnUrl} target="_blank" rel="noopener noreferrer" className="learn-more">
                            {intl.get('strx.stake_staking_apy_link')}
                          </LinkButton>
                        </>
                      }
                      placement="top"
                      arrowPointAtCenter
                    >
                      <span
                        className="j-tooltip-icon"
                        onMouseEnter={() => {
                          window.gtag('event', 'PC_stake_apy_hover', {
                            'event_category': 'sTRX',
                            'event_label': 'stake_apy_hover'
                          });
                        }}
                      ></span>
                    </Tooltip>
                  </div>
                  <div className="apy-value">{formatNumber(avgApy * 100, 2, { miniText: 0.01 })}%</div>
                  <div className="apy-desc">{intl.get('strx.stake_rewards_desc')}</div>
                  <div className="connect-btn" onClick={this.onConnect}>
                    {intl.get('strx.stake_connect_wallet')}
                  </div>
                  <div className="apy-img"></div>
                </div>
              )}

              <div className={'stake-box ' + (!!Config.winterThemeVisible ? 'snow-ele-top' : '')}>
                <div className="tabs">
                  <span className={`${stakeTab === 1 ? 'active' : ''} ${lang}`} onClick={() => this.changeStakeTab(1)}>
                    {intl.get('strx.stake_stake')}
                  </span>
                  <span className={`${stakeTab === 2 ? 'active' : ''} ${lang}`} onClick={() => this.changeStakeTab(2)}>
                    {intl.get('strx.stake_unstake')}
                  </span>
                </div>
                {stakeTab === 1 ? (
                  <>
                    <div className="lock-content">
                      <div className={`balance-info ${lang}`}>
                        <span className="balance-label">{intl.get('strx.stake_staking_amount')}</span>
                        <span className="balance">
                          <span className="balance-title">{intl.get('strx.stake_balance')}</span>
                          <strong className="balance-value-number">
                            {formatNumber(BigNumber(trxBalance).div(1e6), 6)}
                          </strong>
                          <strong className="balance-postfix">TRX</strong>
                        </span>
                      </div>
                      <div className={'input-wrap' + (errorFlag ? ' j-error-stake' : '')}>
                        <Input
                          className={
                            'j-input stake-input ' +
                            (errorFlag > 1 ? 'j-error-input j-info-input' : errorFlag === 1 ? 'j-error-input' : '')
                          }
                          onChange={e => this.onChangeInputTRX(removeThousandSeparators(e.target.value))}
                          onFocus={() => {
                            window.gtag('event', 'PC_stake_stake_input_focus', {
                              'event_category': 'sTRX',
                              'event_label': 'stake_stake_input_focus'
                            });
                          }}
                          placeholder="1,000"
                          value={addThousandSeparators(inputTRX)}
                          addonAfter={<span className="stake-trx">TRX</span>}
                        />
                        <div className="inputDollar">
                          {BigNumber(inputTRX).isNaN()
                            ? '≈ $' + formatNumber(BigNumber(1000).times(trxPrice), 2)
                            : trxDollar}
                        </div>
                        {errorFlag === 1 && (
                          <div className="j-error-tip">
                            <span className="j-error-img"></span>
                            <div>{intl.get('strx.stake_insufficient_balance')}</div>
                          </div>
                        )}
                        {errorFlag === 2 && (
                          <div className="j-error-tip j-info-tip">
                            <span className="j-error-img"></span>
                            <div className="j-error-text-wrap">
                              <div className="j-error-text">
                                {intl.get('strx.stake_enough_trx2', { value: this.state.safeValue })}
                              </div>
                              <LinkButton
                                showArrow={false}
                                className="reserve-enough-btn"
                                onClick={() => this.reserveTrx()}
                              >
                                {intl.get('strx.stake_reserve_trx2')}
                              </LinkButton>
                            </div>
                          </div>
                        )}
                        {errorFlag === 3 && (
                          <div className="j-error-tip j-info-tip">
                            <span className="j-error-img"></span>
                            <div>{intl.get('strx.stake_enough_resources')}</div>
                          </div>
                        )}
                        {errorFlag === 4 && (
                          <div className="j-error-tip">
                            <span className="j-error-img"></span>
                            <div>
                              {intl.get('strx.stake_stake_min_amount', {
                                value: Config.sTRX.stakeLimitMin
                              })}
                            </div>
                          </div>
                        )}
                        {errorFlag === 5 && (
                          <div className="j-error-tip">
                            <span className="j-error-img"></span>
                            <div>
                              {intl.get('strx.stake_stake_max_amount', {
                                value: formatNumber(Config.sTRX.stakeLimitMax, 6)
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="percent">
                        <div className={percentSelected === 1 ? 'selected' : ''} onClick={() => this.setPercent(1)}>
                          25%
                        </div>
                        <div className={percentSelected === 2 ? 'selected' : ''} onClick={() => this.setPercent(2)}>
                          50%
                        </div>
                        <div className={percentSelected === 3 ? 'selected' : ''} onClick={() => this.setPercent(3)}>
                          75%
                        </div>
                        <div className={percentSelected === 4 ? 'selected' : ''} onClick={() => this.setPercent(4)}>
                          100%
                        </div>
                      </div>
                      <div className="info">
                        <div>{intl.get('strx.stake_will_get')}</div>
                        <div className="available">
                          {BigNumber(inputTRX).isNaN()
                            ? formatNumber(BigNumber(1000).times(1e18).div(exchangeRate), 6, { miniText: 0.000001 })
                            : formatNumber(TRX2sTRX, 6, { miniText: 0.000001 })}
                          <span className="strx">sTRX</span>
                        </div>
                      </div>
                      <div className="info">
                        <div>{intl.get('strx.stake_ratio')}</div>
                        <div className="rate">1 TRX = {formatNumber(BigNumber(1e18).div(exchangeRate), 6)} sTRX</div>
                      </div>
                    </div>
                    {isConnected ? (
                      submitting ? (
                        <button className="j-large-btn j-supply" disabled>
                          {intl.get('v2.sign_in_wallet')}
                          <span className="siging-icon"></span>
                        </button>
                      ) : (
                        <button
                          className="j-large-btn j-supply"
                          onClick={() => this.deposit()}
                          disabled={
                            errorFlag === 1 ||
                            errorFlag === 4 ||
                            errorFlag === 5 ||
                            (BigNumber(inputTRX).isNaN() && BigNumber(trxBalance).div(1e6).lt(1000)) ||
                            BigNumber(inputTRX).eq(0) ||
                            BigNumber(trxBalance).eq(0)
                          }
                        >
                          {intl.get('strx.stake_stake_btn')}
                        </button>
                      )
                    ) : this.props.lend.serviceInnerStatus === 'disabled' ? (
                      <Tooltip
                        title={intl.get('season.can_not_connect')}
                        overlayClassName={'j-tooltip-dropdown season season-l ' + theme}
                        arrowPointAtCenter
                        placement="bottom"
                        getPopupContainer={() =>
                          document.querySelector('.j-liquidity-stake-content .stake-box .j-large-btn')
                        }
                      >
                        <button
                          className="j-large-btn j-supply season"
                          onClick={() => {
                            this.props.lend.setData({ noServiceModalAllVisible: true });
                          }}
                        >
                          {intl.get('strx.stake_connect_wallet2')}
                        </button>
                      </Tooltip>
                    ) : (
                      <button className="j-large-btn j-supply" onClick={this.onConnect}>
                        {intl.get('strx.stake_connect_wallet2')}
                      </button>
                    )}
                    {declined && transType === 'depositsTRX' ? (
                      <div className="j-error-tip wallet-reject">
                        <span className="j-error-img"></span>
                        <div>{intl.get('v2.reject_in_wallet')}</div>
                      </div>
                    ) : (
                      <div className="j-error-tip wallet-reject j-info-tip">
                        <span className="j-error-img"></span>
                        <div>{intl.get('strx.stake_wait_days2', { value: unfreezeDelayDays })}</div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="lock-content">
                      <div className={`balance-info ${lang}`}>
                        <span className="balance-label">{intl.get('strx.stake_unstaking_amount')}</span>
                        <span className="balance">
                          <span className="balance-title">{intl.get('strx.stake_balance')}</span>
                          <strong className="balance-value-number">
                            {isConnected ? formatNumber(BigNumber(accountSupply), 18) : '--'}
                          </strong>
                          <strong className="balance-value-postfix">sTRX</strong>
                        </span>
                      </div>
                      <div className={'input-wrap' + (errorFlag ? ' j-error-stake' : '')}>
                        <Input
                          className={
                            'j-input stake-input ' +
                            (errorFlag > 1 ? 'j-error-input j-info-input' : errorFlag === 1 ? 'j-error-input' : '')
                          }
                          onChange={e => this.onChangeInputsTRX(removeThousandSeparators(e.target.value))}
                          onFocus={() => {
                            window.gtag('event', 'PC_stake_unstake_input_focus', {
                              'event_category': 'sTRX',
                              'event_label': 'stake_unstake_input_focus'
                            });
                          }}
                          placeholder="1,000"
                          value={addThousandSeparators(inputsTRX)}
                          addonAfter={<span className="stake-trx stake-strx">sTRX</span>}
                        />
                        <div className="inputDollar strx">
                          {BigNumber(inputsTRX).isNaN()
                            ? '≈ $' + formatNumber(BigNumber(1000).times(exchangeRate).div(1e18).times(trxPrice), 2)
                            : strxDollar}
                        </div>
                        {errorFlag === 1 && (
                          <div className="j-error-tip">
                            <span className="j-error-img"></span>
                            <div>{intl.get('strx.stake_insufficient_balance')}</div>
                          </div>
                        )}
                        {errorFlag === 4 && (
                          <div className="j-error-tip">
                            <span className="j-error-img"></span>
                            <div>
                              {intl.get('strx.stake_unstake_min_amount', {
                                value: Config.sTRX.stakeLimitMin
                              })}
                            </div>
                          </div>
                        )}
                        {errorFlag === 5 && (
                          <div className="j-error-tip">
                            <span className="j-error-img"></span>
                            <div>
                              {intl.get('strx.stake_unstake_max_amount', {
                                value: formatNumber(
                                  BigNumber(totalUnfreezable).minus(balanceToUnfreeze).times(1e18).div(exchangeRate),
                                  6
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="percent">
                        <div className={percentSelected === 1 ? 'selected' : ''} onClick={() => this.setPercent(1)}>
                          25%
                        </div>
                        <div className={percentSelected === 2 ? 'selected' : ''} onClick={() => this.setPercent(2)}>
                          50%
                        </div>
                        <div className={percentSelected === 3 ? 'selected' : ''} onClick={() => this.setPercent(3)}>
                          75%
                        </div>
                        <div className={percentSelected === 4 ? 'selected' : ''} onClick={() => this.setPercent(4)}>
                          100%
                        </div>
                      </div>
                      <div className="info">
                        <div>{intl.get('strx.stake_will_get')}</div>
                        <div className="available second">
                          {BigNumber(inputsTRX).isNaN()
                            ? formatNumber(BigNumber(1000).times(exchangeRate).div(1e18), 6, { miniText: 0.000001 })
                            : formatNumber(sTRX2TRX, 6, { miniText: 0.000001 })}
                          <span className="trx">TRX</span>
                        </div>
                      </div>
                      <div className="info">
                        <div>{intl.get('strx.stake_ratio')}</div>
                        <div className="rate">1 sTRX = {formatNumber(BigNumber(exchangeRate).div(1e18), 6)} TRX</div>
                      </div>
                    </div>

                    {isConnected ? (
                      submitting ? (
                        <button className="j-large-btn j-supply" disabled>
                          {intl.get('v2.sign_in_wallet')}
                          <span className="siging-icon"></span>
                        </button>
                      ) : (
                        <button
                          className="j-large-btn j-supply"
                          onClick={() => this.withdraw()}
                          disabled={
                            !!errorFlag ||
                            (BigNumber(inputsTRX).isNaN() && BigNumber(accountSupply).lt(1000)) ||
                            BigNumber(inputsTRX).eq(0) ||
                            BigNumber(accountSupply).eq(0)
                          }
                        >
                          {intl.get('strx.stake_unstake_btn')}
                        </button>
                      )
                    ) : this.props.lend.serviceInnerStatus === 'disabled' ? (
                      <Tooltip
                        title={intl.get('season.can_not_connect')}
                        overlayClassName={'j-tooltip-dropdown season season-l ' + theme}
                        arrowPointAtCenter
                        placement="bottom"
                        getPopupContainer={() =>
                          document.querySelector('.j-liquidity-stake-content .stake-box .j-large-btn')
                        }
                      >
                        <button
                          className="j-large-btn j-supply season"
                          onClick={() => {
                            this.props.lend.setData({ noServiceModalAllVisible: true });
                          }}
                        >
                          {intl.get('strx.stake_connect_wallet2')}
                        </button>
                      </Tooltip>
                    ) : (
                      <button className="j-large-btn j-supply" onClick={this.onConnect}>
                        {intl.get('strx.stake_connect_wallet2')}
                      </button>
                    )}
                    {declined && transType === 'withdrawStrx' ? (
                      <div className="j-error-tip wallet-reject">
                        <span className="j-error-img"></span>
                        <div>{intl.get('v2.reject_in_wallet')}</div>
                      </div>
                    ) : (
                      <div className="j-error-tip wallet-reject j-info-tip">
                        <span className="j-error-img"></span>
                        <div>{intl.get('strx.stake_wait_days2', { value: unfreezeDelayDays })}</div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <MarketData data={marketData} type="stake"></MarketData>
          </div>
          <Footer></Footer>
        </div>
        <UnlockDetailModal visible={unlockModalVisible} setUnlockModalVisible={this.setUnlockModalVisible} />
        <RoundSize visible={roundSizeModalVisible} setRoundModalVisible={this.setRoundSizeVisible} />
        <TransactionModal></TransactionModal>
        <TabsBar theme={theme} />
      </>
    );
  }
}

export default LiquidityStake;
