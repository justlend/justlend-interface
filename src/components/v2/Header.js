import React from 'react';
import { Link } from 'react-router-dom';
import { inject, observer } from 'mobx-react';
import intl from 'react-intl-universal';
import isMobile from 'ismobilejs';
import { Button, Modal, Select, Tooltip, Popover, Dropdown, Menu, Radio } from 'antd';
import '../../assets/css/v2/header.scss';
import '../../assets/css/v2/energy-offer.scss';
import '../../assets/css/season.scss';
import walletSuccess from '../../assets/images/v2/wallet-success.png';
import walletConnectSuccess from '../../assets/images/v2/walletconnect-success.png';
import BetaGifImg from '../../assets/images/v2/beta.gif';
import BetaGifWhiteImg from '../../assets/images/v2/white-theme/beta.gif';
import BetaImg from '../../assets/images/v2/beta.png';
import BetaWhiteImg from '../../assets/images/v2/white-theme/beta.png';
import BetaEnImg from '../../assets/images/v2/betaEn.png';
import BetaWhiteEnImg from '../../assets/images/v2/white-theme/betaEn.png';
import BetaImgM from '../../assets/images/v2/betaM.png';
import BetaWhiteImgM from '../../assets/images/v2/white-theme/betaM.png';
import BetaEnImgM from '../../assets/images/v2/betaEnM.png';
import BetaWhiteEnImgM from '../../assets/images/v2/white-theme/betaEnM.png';
import ledgerSuccess from '../../assets/images/mobile/ledger-success.svg';
import BetaNewIcon from '../../assets/images/v2/beta-new-icon.png';
import BetaNewWhiteIcon from '../../assets/images/v2/white-theme/beta-new-icon.png';
import NewIcon from '../../assets/images/header/new.svg';
import TLIcon from '../../assets/images/header/tl.svg';
import IMIcon from '../../assets/images/header/im_Symble_Rounded.svg';
import {
  cutMiddle,
  formatNumber,
  isWhiteAccount,
  shortenEmailAddress,
  goToPage,
  getBrowserInfo
} from '../../utils/helper';
import MobileHeader from './mobile/Header';
import Entry from '../Connect/V2/Entry';
import Fireblocks from '../Connect/V2/Fireblocks';
import Loading from '../Connect/V2/Loading';
import Account from '../Connect/V2/Account';
import Failure from '../Connect/V2/Failure';
import BetaModal from '../Modals/v2/Beta';
import ApplicationTipModal from '../Modals/v2/ApplicationTip';
import { EnergyPriceAdjustModal } from '../Modals/energy/EnergyPriceAdjust';
import { NoServiceModal, NoServiceModalAll } from './no-service-modal/index.jsx';
import { StUSDTModal } from './stUSDT-modal/index';
import SettingsSignatureModal from '../../pages/settings/components/modals/SettingsSignatureModal';
import BindEmailModal from '../../pages/settings/components/modals/BindEmailModal';
// import DisclaimerModal from '../Modals/v2/Disclaimer';
import { isEmailValid } from '../../pages/settings/utils/helper';

import Config from '../../config';
import BigNumber from 'bignumber.js';
import classnames from 'classnames';

const { Option } = Select;

@inject('network')
@inject('system')
@inject('lend')
@inject('strx')
@inject('stusdt')
@inject('settings')
@inject('userRecords')
@observer
class Header extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      mobile: isMobile(window.navigator).any,
      collapsed: false,
      accountModal: false,
      topBarShow: true,
      isInStUsdt: window.location.hash.slice(1).startsWith('/stUSDT'),
      showWalletDropdown: false,
      showCopySuccessHint: false,
      applyReaded: true,
      isUpdatingLanguage: false,
      toBeLanguage: ''
    };
  }

  componentDidMount = async () => {
    await this.props.lend.getApplicationInfo();
    this.props.instantActions && this.props.instantActions();

    if (this.props.network.isConnected) {
      await this.commonRequests();
    }
    this.props.network.on('connect', async () => {
      await this.commonRequests();
    });

    // this.props.network.on('accountsChanged', async () => {
    //   window.location.reload();
    // });

    this.props.stusdt.getDashboardData();

    setTimeout(() => {
      const hideEnergyPriceAdjustModal = window.localStorage.getItem('hideEnergyPriceAdjustModal');
      if (!hideEnergyPriceAdjustModal || hideEnergyPriceAdjustModal !== 'true') {
        this.props.lend.setData({
          hideEnergyPriceAdjustModal: false
        });
      }
    }, 200);

    const browserInfo = getBrowserInfo();
    if (browserInfo.appName === 'imToken Wallet') {
      this.props.network.setData({ browserType: 2 });
    } else {
      this.props.network.setData({ browserType: 1 });
    }

    const applyStatus = window.localStorage.getItem('apply_readed');
    if (applyStatus) {
      this.setState({ applyReaded: true });
    } else {
      this.setState({ applyReaded: false });
    }

    this.onClickOutside();
  };

  onClickOutside = () => {
    document.addEventListener('click', e => {
      if (e.target.className === 'setting-icon') {
        this.setState({ showWalletDropdown: true });
      } else {
        this.setState({ showWalletDropdown: false });
      }
    });
  };

  onChangeLanguageRadio = async e => {
    const { isUpdatingLanguage } = this.state;

    if (isUpdatingLanguage) {
      return;
    }

    if (e.target.value === 'en-US') {
      window.gtag('event', 'portfolio_setting_globalsetting_clickEnglish', {
        'event_category': 'portfolio',
        'event_label': 'portfolio_setting_globalsetting_clickEnglish'
      });
    } else {
      window.gtag('event', 'portfolio_setting_globalsetting_clickZh', {
        'event_category': 'portfolio',
        'event_label': 'portfolio_setting_globalsetting_clickZh'
      });
    }
    this.setState({
      isUpdatingLanguage: true,
      toBeLanguage: e.target.value
    });

    const { defaultAccount } = this.props.network;

    const code = await this.props.settings.setLanguage(defaultAccount, e.target.value);

    if (code === 0) {
      this.props.lend.setData({ lang: e.target.value });
      window.localStorage.setItem('lang', e.target.value);

      setTimeout(() => {
        let search = window.location.search;
        let params = new URLSearchParams(search);
        let paramName = 'lang';
        let paramValue = e.target.value;
        if (params.has(paramName)) {
          params.set(paramName, paramValue);
        } else {
          params.append(paramName, paramValue);
        }
        search = params.toString();
        window.location.search = search;
      }, 200);
    } else {
      this.setState({
        isUpdatingLanguage: false
      });
    }
  };

  onChangeThemeRadio = e => {
    if (e.target.value === 'white') {
      window.gtag('event', 'portfolio_setting_globalsetting_clickLight', {
        'event_category': 'portfolio',
        'event_label': 'portfolio_setting_globalsetting_clickLight'
      });
    } else {
      window.gtag('event', 'portfolio_setting_globalsetting_clickDark', {
        'event_category': 'portfolio',
        'event_label': 'portfolio_setting_globalsetting_clickDark'
      });
    }
    this.props.lend.setData({ theme: e.target.value });
    window.localStorage.setItem('theme', e.target.value);
  };

  commonRequests = async () => {
    await this.props.lend.getBetaInfo(this.props.network.defaultAccount); // get beta info
    this.props.mountedActions && this.props.mountedActions();
    // this.props.network.getNewRentVisible();
    const { hasSettingsBetaAuthority, applicationMap } = this.props.lend;
    const mainSettingsAuthority =
      applicationMap['settings']?.switchOn && (hasSettingsBetaAuthority || applicationMap['settings']?.phase === 2);
    if (mainSettingsAuthority) {
      this.getWalletSettingsInfo();
    }
    await this.props.userRecords.getLiquidityRecordsData();
  };

  renderRecordsLink = () => {
    const { isConnected, defaultAccount } = this.props.network;
    const { theme, hasSettingsBetaAuthority, applicationMap } = this.props.lend;
    const { unReadCount } = this.props.userRecords;
    const isWhite = theme === 'white';
    if (isConnected && defaultAccount) {
      // if (
      //   applicationMap['settings']?.switchOn &&
      //   (hasSettingsBetaAuthority || applicationMap['settings']?.phase === 2)
      // ) {
      let isRead = true;
      if (BigNumber(unReadCount).gt(0) && unReadCount !== '--') isRead = false;
      if (isRead || this.props?.hideRecordSign)
        return (
          <Link
            to={'/userRecords'}
            target="userRecords"
            rel="noopener noreferrer"
            className="user-records-link"
            onClick={() => {
              window.gtag('event', 'portfolio_records_click', {
                'event_category': 'portfolio',
                'event_label': 'portfolio_records_click'
              });
            }}
          >
            {this.state.mobile ? (
              <div className="flex-between">
                <span className="records-default-icon">{intl.get('user_records.action_records')}</span>
                <span className={'unread-amount-for-m '}></span>
              </div>
            ) : (
              <span className="records-default-icon"></span>
            )}
          </Link>
        );
      return (
        <Link
          to={'/userRecords?tab=liquidate'}
          target="userRecords"
          rel="noopener noreferrer"
          className="user-records-link pr"
          onClick={() => {
            window.gtag('event', 'portfolio_records_click', {
              'event_category': 'portfolio',
              'event_label': 'portfolio_records_click'
            });
          }}
        >
          {this.state.mobile ? (
            <div className="flex-between">
              <span className="records-default-icon">{intl.get('user_records.action_records')}</span>
              <span className={'unread-amount-for-m '}>{unReadCount}</span>
            </div>
          ) : (
            <>
              <span className="records-default-icon"></span>
              <span className={'unread-amount ' + (BigNumber(unReadCount)?.gt(10) ? 'lot' : '')}>{unReadCount}</span>
            </>
          )}
        </Link>
      );
      // } else {
      //   return null;
      // }
    } else {
      return null;
    }
  };

  themeChange = () => {
    const { theme } = this.props.lend;
    if (!theme) {
      this.props.lend.setData({ theme: 'white' });
      window.localStorage.setItem('theme', 'white');
    } else {
      this.props.lend.setData({ theme: '' });
      window.localStorage.setItem('theme', '');
    }
  };

  showLoginModal = e => {
    if (this.props.lend.serviceInnerStatus === 'disabled') {
      this.props.lend.setData({ noServiceModalAllVisible: true });
    } else {
      this.props.network.connectWalletV2();
    }
  };

  handleCancel = () => {
    this.props.network.setData({ loginModalVisibleV2: false });
  };

  showAccountInfo = () => {
    this.setState({ accountModal: true });
  };

  handleCancelAccount = () => {
    this.setState({ accountModal: false });
  };

  closeNetworkErrorModal = () => {
    this.props.network.closeNetworkErrorModal();
  };

  setNile = env => {
    setTimeout(() => {
      if (env === 'Mainnet') window.open('https://app.justlend.org');
    }, 200);
  };

  closeTopBar = e => {
    this.setState({
      topBarShow: false
    });
    window.gtag('event', 'gasOff_topBarClose', {
      'event_category': 'PC_V1.5',
      'event_label': 'gasOff_topBarClose'
    });
    e.preventDefault();
  };

  getAnnouncementUrl = () => {
    const { lang } = this.state;

    const announcementUrl =
      lang && lang.includes('en')
        ? 'https://justlendorg.zendesk.com/hc/en-us/articles/18496749460377'
        : 'https://justlendorg.zendesk.com/hc/zh-cn/articles/18496749460377';
    return announcementUrl;
  };

  bsRender = () => {
    const { routeName, defaultAccount } = this.props.network;
    const { applicationMap, theme, showGif, pre } = this.props.lend;
    const { lang } = this.state;
    const isWhite = theme === 'white';
    const isEn = lang === 'en-US';

    return (
      <>
        <Link to="/homeNew" className={routeName === 'home' ? 'current' : ''}>
          <span>{intl.get('v2.lend_title')}</span>
        </Link>
        <Link to="/marketNew" className={routeName === 'market' ? 'current' : ''}>
          <span>{intl.get('liquidate.liquidate_market_list')}</span>
        </Link>
        <a
          onClick={e => this.switchToLiquidate(e.target.className)}
          className={
            'flex aic' + (this.state.lang === 'en-US' ? ' en' : '') + (routeName === 'liquidate' ? ' current' : '')
          }
        >
          <span>{intl.get('liquidate.liquidate_liquidation_list')}</span>
        </a>
        {/* {applicationMap['liquidate']?.switchOn && (
          <a
            onClick={e => this.switchToLiquidate(e.target.className)}
            className={
              'flex aic' + (this.state.lang === 'en-US' ? ' en' : '') + (routeName === 'liquidate' ? ' current' : '')
            }
          >
            <span>{intl.get('liquidate.liquidate_liquidation_list')}</span>
          </a>
        )} */}
      </>
    );
  };

  moreRender = () => {
    const { routeName } = this.props.network;
    const { lang, applyReaded } = this.state;
    return (
      <>
        <a
          href={Config.juststable}
          onClick={e => {
            // window.gtag('event', 'nav_stUSDT', { 'event_category': 'PC', 'event_label': 'nav_stUSDT' });
          }}
          target="juststable"
        >
          <span>{intl.get('navi.juststable')}</span>
        </a>
        <a
          href="#"
          className={routeName === 'StUSDT' ? 'current nav-stUsdt' : 'nav-stUsdt'}
          onClick={e => {
            this.props.lend.setData({
              stUSDTModalShow: true
            });
            window.gtag('event', 'nav_stUSDT', { 'event_category': 'PC', 'event_label': 'nav_stUSDT' });
            e.preventDefault();
          }}
        >
          <span>{intl.get('stUsdt_top_nav')}</span>
        </a>
      </>
    );
  };

  betaCloseCallback = () => {
    this.props.lend.setData({ showGif: true });
    let timer = setTimeout(() => {
      this.props.lend.setData({ showGif: false });
      clearTimeout(timer);
    }, 3000); //800
  };

  shouldGoToNewRentalPage = () => {
    const lastVisitValue = window.localStorage.getItem('lastVisitEnergyRentalPage');
    if (lastVisitValue == null || lastVisitValue == 'energyRental') {
      return true;
    } else {
      return false;
    }
  };

  switchToLiquidate = className => {
    const { lang } = this.state;
    if (className === 'app-close-btn') return;
    if (className.indexOf('beta-img-s9') > -1) {
      const href = window.location.origin + `/application?lang=${lang}`;
      window.location.href = href;
      return;
    }
    // const { isConnected } = this.props.network;
    // if (!isConnected) {
    //   return this.props.network.connectWalletV2();
    // }

    if (this.props.network.isRightChain === 0) {
      this.props.network.changeChain();
      return;
    }

    if (this.props.network.isMainNetwork === 0) {
      this.props.network.showNetworkErrorModal();
      return;
    }

    // const { defaultAccount } = this.props.network;

    // const browserInfo = getBrowserInfo();
    // const isStoraged = window.localStorage.getItem(
    //   defaultAccount + (browserInfo.browser !== 'Unknown' ? browserInfo.browser : browserInfo.appName)
    // );
    // if (!isStoraged) {
    //   this.props.lend.setData({ disclaimerShow: true, isDisclaimerStoraged: false });
    //   return;
    // }

    // const { hasLiquidateBetaAuthority, applicationMap } = this.props.lend;
    // const phase = applicationMap['liquidate']?.phase;
    const href = window.location.origin + `/liquidate?lang=${lang}`;

    // if (phase === 1 && !hasLiquidateBetaAuthority) {
    //   this.props.lend.setData({ applocationTipShow: true, pre: 'liquidate' });
    // } else {
    //   window.location.href = href;
    // }
    window.location.href = href;
  };

  getWalletSettingsInfo = async () => {
    const { defaultAccount } = this.props.network;

    this.props.settings.getNotiSettings(defaultAccount);
    this.props.settings.getEmailBindInfo(defaultAccount);
    // this.props.userRecords.setVariablesInterval();
  };

  copyWalletAddress = () => {
    const { defaultAccount } = this.props.network;

    // Copy wallet address
    var aux = document.createElement('input');
    aux.setAttribute('value', defaultAccount.valueOf());
    document.body.appendChild(aux);
    aux.select();
    document.execCommand('copy');
    document.body.removeChild(aux);

    this.setState({ showCopySuccessHint: true });

    setTimeout(() => {
      this.setState({ showCopySuccessHint: false });
    }, 1000);
  };

  render() {
    const {
      isConnected,
      isWalletConnected,
      isLedgerConnected,
      defaultAccount,
      routeName,
      loginModalVisibleV2,
      loginModalStepV2,
      wsModalVisible,
      wsFailureModal,
      networkErrorModalVisible,
      browserType
    } = this.props.network;
    const {
      accountModal,
      lang,
      mobile,
      topBarShow,
      isInStUsdt,
      showWalletDropdown,
      showCopySuccessHint,
      applyReaded,
      toBeLanguage
    } = this.state;
    const {
      theme,
      betaInfo,
      showAccountBeta,
      hasLiquidateBetaAuthority,
      hasEnergyBetaAuthority,
      hasSettingsBetaAuthority,
      applicationMap,
      showGif
    } = this.props.lend;

    const showAccountBetaFlag = applicationMap?.canApply ? showAccountBeta : false;

    const isWhite = theme === 'white';
    const isEn = lang === 'en-US';

    const { bindedEmail, snbRiskAlertOn, rentalRiskAlertOn, cdpRiskAlertOn, walletHaveCdpPosition } =
      this.props.settings;

    const finishGettingBindInfo = bindedEmail !== '--';
    const isBindedEmailValid = isEmailValid(bindedEmail);

    const mainSettingsAuthority =
      applicationMap['settings']?.switchOn && (hasSettingsBetaAuthority || applicationMap['settings']?.phase === 2);

    const ConnectButton =
      isConnected && defaultAccount ? (
        <div className={classnames({ 'show-wallet-dropdown': showWalletDropdown })}>
          <div className={classnames('j-wallet-info')}>
            <div className="wallet-info-content" onClick={() => this.showAccountInfo()}>
              {/* <span className="address-head-icon"></span> */}
              <img src={browserType === 1 ? TLIcon : IMIcon} alt="wallet_icon" className="wallet-icon" />
              <span className="address">{cutMiddle(defaultAccount, 6, 6)}</span>
              {/* {!mobile && showAccountBeta && applicationMap?.canApply && (
                <img
                  className={'beta-img' + (showGif ? ' animation' : '')}
                  src={isEn ? (isWhite ? BetaWhiteEnImg : BetaEnImg) : isWhite ? BetaWhiteImg : BetaImg}
                />
              )} */}
              {/* {mainSettingsAuthority && (
                <span className="arrow-down-icon">
                  <span className="arrow-down-hover-icon"></span>
                </span>
              )} */}
            </div>
          </div>
          {/* {mobile && showAccountBeta && applicationMap?.canApply && (
            <img
              className={'beta-img' + (showGif ? ' animation' : '')}
              src={isEn ? (isWhite ? BetaWhiteEnImgM : BetaEnImgM) : isWhite ? BetaWhiteImgM : BetaImgM}
              onClick={() => {
                this.showAccountInfo();
              }}
            />
          )} */}
          <div className="wallet-dropdown">
            {/* <div className={classnames('row-item', 'wallet-row')} onClick={() => {}}>
              <div className="row-title">{intl.get('header.wallet')}</div>
              <div className="row-value">
                <div className="row-value-content">
                  <div className="value-text">{cutMiddle(defaultAccount, 6, 6)}</div>
                  <span
                    className="copy-btn"
                    onClick={() => {
                      this.copyWalletAddress();
                      window.gtag('event', 'portfolio_setting_clickwallet', {
                        'event_category': 'portfolio',
                        'event_label': 'portfolio_setting_clickwallet'
                      });
                    }}
                  ></span>
                </div>
              </div>
            </div> */}

            {/* <Link
              className={classnames('row-item', 'settings-row')}
              to={'/settings'}
              onClick={() => {
                window.gtag('event', 'portfolio_setting_clicksetting', {
                  'event_category': 'portfolio',
                  'event_label': 'portfolio_setting_clicksetting'
                });
              }}
            >
              <div className="row-title">{intl.get('header.settings')}</div>
              <div className="row-value">
                <div
                  className={classnames('row-value-content', {
                    'show-email-hover': finishGettingBindInfo && isBindedEmailValid
                  })}
                >
                  <div className="value-text">
                    {finishGettingBindInfo &&
                      (isBindedEmailValid ? shortenEmailAddress(bindedEmail) : intl.get('header.notification_off'))}
                  </div>
                  <div
                    className="full-email-tooltip"
                    onClick={e => {
                      e.stopPropagation();
                    }}
                  >
                    {bindedEmail}
                  </div>

                  {finishGettingBindInfo && <span className="arrow-right-icon"></span>}
                </div>
              </div>
            </Link> */}
            <Link
              className={classnames('row-item', 'settings-row', 's9')}
              to={'/settings'}
              onClick={() => {
                window.gtag('event', 'portfolio_setting_clicksetting', {
                  'event_category': 'portfolio',
                  'event_label': 'portfolio_setting_clicksetting'
                });
              }}
            >
              <div className="row-title">{intl.get('settings.risk_warning.title')}</div>
              <div className="row-value">
                {!snbRiskAlertOn && !rentalRiskAlertOn && !cdpRiskAlertOn && (
                  <span className="risk-off">{intl.get('settings.risk_warning.off')}</span>
                )}
                <span className="arrow-right-icon"></span>
              </div>
            </Link>

            <div className="row-item language-row">
              <div className="row-title">{intl.get('settings.global_settings.language_title')}</div>
              <Radio.Group
                className="language-option-radio"
                onChange={this.onChangeLanguageRadio}
                value={toBeLanguage === '' ? lang : toBeLanguage}
              >
                <Radio value={'zh-TC'}>{intl.get('settings.global_settings.zh_tc_lang')}</Radio>
                <Radio value={'en-US'}>{intl.get('settings.global_settings.en_lang')}</Radio>
              </Radio.Group>
            </div>

            <div className="row-item theme-row">
              <div className="row-title">{intl.get('settings.global_settings.theme_title')}</div>
              <Radio.Group className="theme-option-radio" onChange={this.onChangeThemeRadio} value={theme}>
                <Radio value={'white'}>{intl.get('settings.global_settings.light_theme')}</Radio>
                <Radio value={'black'}>{intl.get('settings.global_settings.dark_theme')}</Radio>
              </Radio.Group>
            </div>

            {/* {finishGettingBindInfo && !isBindedEmailValid && (
              <div className="link-email-hint">
                <span className="alert-icon"></span>
                {intl.get('header.link_email_hint')}
              </div>
            )}

            <div className={classnames('copy-success-hint', { 'visible': showCopySuccessHint })}>
              <span className="success-icon"></span>
              {intl.get('header.copied')}
            </div> */}
          </div>
        </div>
      ) : this.props.lend.serviceInnerStatus === 'disabled' ? (
        <Tooltip
          title={intl.get('season.can_not_connect')}
          overlayClassName={'j-tooltip-dropdown defaultOpen season ' + (isWhite ? 'white' : '')}
          arrowPointAtCenter
          placement="bottom"
        >
          <div
            className={
              'connect-wallet-v2 ' +
              (this.props.lend.serviceInnerStatus === 'disabled'
                ? ' season_default_btn'
                : this.props.lend.serviceInnerStatus)
            }
            onClick={e => {
              this.showLoginModal(e);
            }}
          >
            {intl.get('navi.wallet_linkbtn')}
            {mobile && (
              <div
                class={
                  'ant-tooltip j-tooltip-dropdown defaultOpen season  ant-tooltip-placement-bottom ' +
                  (isWhite ? 'white' : '')
                }
              >
                <div class="ant-tooltip-content">
                  <div class="ant-tooltip-arrow">
                    <span class="ant-tooltip-arrow-content"></span>
                  </div>
                  <div class="ant-tooltip-inner" role="tooltip">
                    You cannot connect the wallet or use this feature in the current region.
                  </div>
                </div>
              </div>
            )}
          </div>
        </Tooltip>
      ) : (
        <div
          className={
            'connect-wallet-v2 ' +
            (this.props.lend.serviceInnerStatus === 'disabled'
              ? ' season_default_btn'
              : this.props.lend.serviceInnerStatus)
          }
          onClick={e => {
            this.showLoginModal(e);
          }}
        >
          {intl.get('navi.wallet_linkbtn')}
        </div>
      );

    const { origin } = window.location;
    const { userList, marketList } = this.props.lend;
    const { jtrxAddress } = Config;
    const trxAssetPrice = userList[jtrxAddress]?.assetPrice || marketList[jtrxAddress]?.assetPrice;

    return (
      <>
        {!mobile ? (
          <>
            <div className={classnames('j-header', { 'showing-wallet-dropdown': showWalletDropdown })}>
              <div className="flex aic">
                {/* <span className="j-logo"></span> */}
                {Config.nile ? (
                  <span className={'j-logo' + (!Config.winterThemeVisible ? ' snow-hide' : '')}></span>
                ) : (
                  <a
                    className={'j-logo' + (!Config.winterThemeVisible ? ' snow-hide' : '')}
                    href={Config.portalLink + '?lang=' + lang}
                    target="potal"
                    // onClick={window.gtag('event', 'click', { 'event_category': 'PC', 'event_label': 'portal_logo' })}
                  >
                    &nbsp;
                  </a>
                )}
                <div className="version-info">{Config.versionForHeader}</div>

                {Config.nile ? (
                  <div className={`nile-select${isWhite ? ' white' : ''}`}>
                    <Select
                      value={'Nile'}
                      style={{ width: 76 }}
                      onChange={this.setNile}
                      dropdownClassName={`nile-select-item${isWhite ? ' ' : ''}`}
                      getPopupContainer={() => document.querySelector('.nile-select')}
                    >
                      <Option value="Mainnet">Mainnet</Option>
                      <Option value="Nile">Nile</Option>
                    </Select>
                  </div>
                ) : (
                  <span style={{ marginLeft: 10 }}></span>
                )}
              </div>
              <div className="j-links">
                {!Config.nile && (
                  <Popover
                    placement="bottom"
                    title={''}
                    content={this.bsRender()}
                    trigger="hover"
                    overlayClassName={'header-bs-pop' + (isWhite ? ' white' : '')}
                  >
                    <span className="flex-center pr-50">
                      <Link
                        to={'/homeNew?lang=' + lang}
                        className={
                          'bs-route lend ' + (['home', 'market', 'liquidate'].includes(routeName) ? ' current' : '')
                        }
                      >
                        {intl.get('v2.lend_title_s9')}
                      </Link>
                      <em className="bs-arrow"></em>
                    </span>
                  </Popover>
                )}

                <Link
                  to={'/strx?lang=' + lang}
                  className={routeName === 'LiquidityStake' ? 'current' : ''}
                  onClick={window.gtag('event', 'PC_nav_strx', { 'event_category': 'sTRX', 'event_label': 'nav_strx' })}
                >
                  <span>{intl.get('strx.stake_trx_liquid_staking')}</span>
                  <div className="header-icon j-stake"></div>
                </Link>
                <Link
                  to={(this.shouldGoToNewRentalPage() ? '/energyRental' : '/energy') + ('?lang=' + lang)}
                  className={'bs-route ' + (routeName === 'EnergyRent' ? 'current' : '')}
                  onClick={window.gtag('event', 'PC_nav_energy', {
                    'event_category': 'sTRX',
                    'event_label': 'nav_energy'
                  })}
                >
                  <span>{intl.get('strx.energy_rental')}</span>
                </Link>
                {!Config.nile && (
                  <Link to={'/voteNew?lang=' + lang} className={routeName === 'vote' ? 'current' : ''}>
                    <span>{intl.get('navi.vote_btn')}</span>
                  </Link>
                )}

                <Popover
                  placement="bottom"
                  title={''}
                  content={this.moreRender()}
                  trigger="hover"
                  overlayClassName={'header-bs-pop' + (isWhite ? ' white' : '')}
                  className="pr"
                >
                  <a className="bs-route">
                    {intl.get('navi.more')}
                    <em className="bs-arrow"></em>
                  </a>
                  {/* {!applyReaded && <img className="new-icon" src={NewIcon} alt="new_icon" />} */}
                </Popover>
              </div>
              <div className="j-wallet">
                {/* {!mainSettingsAuthority && (
                  <div
                    className={routeName === 'StUSDT' ? 'j-theme-logo disabled' : 'j-theme-logo'}
                    onClick={routeName === 'StUSDT' ? null : this.themeChange}
                  ></div>
                )} */}
                {ConnectButton}
                {this.props.network.defaultAccount && this.renderRecordsLink()}
                {showWalletDropdown && <span className="before-setting-db-box"></span>}
                <span className={'setting-icon' + (showWalletDropdown ? ' active' : '')}></span>
                {showWalletDropdown && <span className="after-setting-db-box"></span>}
              </div>
            </div>
            {Config.nile && (
              <div className={`nile-test-bar${isWhite ? ' white' : ''}`}>
                {intl.get('v2.nile_desc')}
                <a href="https://nileex.io/join/getJoinPage" target="_blank" rel="noopener noreferrer">
                  {intl.get('v2.nile_link')} <em></em>
                </a>
              </div>
            )}
          </>
        ) : (
          <MobileHeader
            classNames={this.props.classNames}
            hideThemeToggle={this.props.hideThemeToggle}
            hideBackBtn={this.props.hideBackBtn}
            mountedActions={this.props.mountedActions}
            showingWalletDropdown={showWalletDropdown}
            renderRecordsLink={this.renderRecordsLink}
          >
            {ConnectButton}
          </MobileHeader>
        )}

        {loginModalVisibleV2 ? (
          loginModalStepV2 === 1 ? (
            <Entry
              loginModalVisible={loginModalVisibleV2}
              handleCancel={this.handleCancel}
              mountedActions={this.props.mountedActions}
              unmountedActions={this.props.unmountedActions}
            />
          ) : (
            <Loading loginModalVisible={loginModalVisibleV2} handleCancel={this.handleCancel} />
          )
        ) : null}

        {wsModalVisible ? <Fireblocks /> : null}

        {accountModal ? <Account handleCancelAccount={this.handleCancelAccount} accountModal={accountModal} /> : null}

        {wsFailureModal ? (
          <Failure mountedActions={this.props.mountedActions} unmountedActions={this.props.unmountedActions} />
        ) : null}

        <Modal
          title={' '}
          footer={null}
          onCancel={this.closeNetworkErrorModal}
          className="j-modal header-border j-network-error-modal"
          visible={networkErrorModalVisible}
          centered
          width={350}
          getContainer={() => document.querySelector('.j-wrapper')}
        >
          <div className="network-error">{intl.get('network_error')}</div>
          <Button className="j-large-btn j-supply" type="primary" onClick={this.closeNetworkErrorModal}>
            {intl.get('got_it')}
          </Button>
        </Modal>

        {Config.noServiceModalVisible && (
          <NoServiceModalAll
            dark={window.location.pathname.includes('/stUSDT') || theme !== 'white'}
          ></NoServiceModalAll>
        )}
        {/* <EnergyPriceAdjustModal /> */}
        <StUSDTModal />
        <BetaModal betaCloseCallback={this.betaCloseCallback} />
        <ApplicationTipModal />
        {/* <DisclaimerModal /> */}

        {this.props.settings.settingsSignatureModalVisible && <SettingsSignatureModal />}
        {this.props.settings.bindEmailModalVisible && <BindEmailModal />}
      </>
    );
  }
}

export default Header;
