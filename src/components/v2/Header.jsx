import React from 'react';
import { Link } from 'react-router-dom';
import { inject, observer } from 'mobx-react';
import intl from 'react-intl-universal';
import isMobile from 'ismobilejs';
import { Button, Modal, Select, Tooltip, Popover, Dropdown, Menu, Radio } from 'antd';
import '../../assets/css/v2/header.scss';
import '../../assets/css/v2/energy-offer.scss';
import '../../assets/css/season.scss';
import '../../assets/css/userRecords.scss';

import { cutMiddle, getBrowserInfo, copyToClipboardNew, getAutoConnectIconClass } from '../../utils/helper';
import MobileHeader from './mobile/Header';
import Entry from '../Connect/V2/Entry';
import Fireblocks from '../Connect/V2/Fireblocks';
import Loading from '../Connect/V2/Loading';
import Account from '../Connect/V2/Account';
import Failure from '../Connect/V2/Failure';
import BetaModal from '../Modals/v2/Beta';
import ApplicationTipModal from '../Modals/v2/ApplicationTip';
import { NoServiceModalAll } from './no-service-modal/index.jsx';
import { StUSDTModal } from './stUSDT-modal/index';
import SettingsSignatureModal from '../../pages/settings/components/modals/SettingsSignatureModal';
import BindEmailModal from '../../pages/settings/components/modals/BindEmailModal';
import { isEmailValid } from '../../pages/settings/utils/helper';

import Config from '../../config';
import BigNumber from 'bignumber.js';
import classnames from 'classnames';

const { Option } = Select;
let timer = null;

@inject('connect')
@inject('network')
@inject('ui')
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
      toBeLanguage: '',
      walletDropDownShow: false
    };
  }

  componentDidMount = async () => {
    await this.props.lend.getFullNodeInfo();
    timer = setInterval(async () => {
      await this.props.lend.getFullNodeInfo();
    }, 60000);

    await this.props.lend.getApplicationInfo();
    this.props.instantActions && this.props.instantActions();
    // console.log('this.props.network.isConnected: ', this.props.network.isConnected);
    if (this.props.network.isConnected) {
      await this.commonRequests();
    }
    this.props.network.on('connect', async () => {
      await this.commonRequests();
    });

    setTimeout(() => {
      const hideEnergyPriceAdjustModal = window.localStorage.getItem('hideEnergyPriceAdjustModal');
      if (!hideEnergyPriceAdjustModal || hideEnergyPriceAdjustModal !== 'true') {
        this.props.lend.setHideEnergyPriceAdjustModal(false);
      }
    }, 200);

    const browserInfo = getBrowserInfo();

    if (browserInfo?.appName) {
      this.props.network.setCurrentAppName(browserInfo.appName);
    }

    const applyStatus = window.localStorage.getItem('apply_readed');
    if (applyStatus) {
      this.setState({ applyReaded: true });
    } else {
      this.setState({ applyReaded: false });
    }

    this.onClickOutside();
  };

  componentWillUnmount() {
    clearInterval(timer);
  }

  onClickOutside = () => {
    document.addEventListener('click', e => {
      if (e?.target?.className === 'setting-icon') {
        this.setState({ showWalletDropdown: true, walletDropDownShow: false });
      } else {
        this.setState({ showWalletDropdown: false });
      }

      if (e?.target?.className?.indexOf('j-wallet-clickable') > -1 || e?.target?.className?.indexOf('copy-btn') > -1) {
        this.setState({ walletDropDownShow: true, showWalletDropdown: false });
      } else {
        this.setState({ walletDropDownShow: false });
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

    const { defaultAccount, isConnected } = this.props.network;

    if (isConnected && defaultAccount) {
      try {
        const code = await this.props.settings.setLanguage(defaultAccount, e.target.value);

        if (code === 0) {
          this.props.lend.setLang(e.target.value);
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

          this.props.lend.setLang(e.target.value);
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
        }
      } catch (error) {
        this.props.lend.setLang(e.target.value);
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
      }
    } else {
      this.props.lend.setLang(e.target.value);
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
    this.props.lend.setTheme(e.target.value);
    window.localStorage.setItem('theme', e.target.value);
  };

  commonRequests = async () => {
    await this.props.lend.getBetaInfo(this.props.network.defaultAccount); // get beta info
    this.props.mountedActions && this.props.mountedActions();
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
    const { unReadCount } = this.props.userRecords;
    if (isConnected && defaultAccount) {
      let isRead = true;
      if (BigNumber(unReadCount).gt(0) && unReadCount !== '--') isRead = false;
      if (isRead || this.props?.hideRecordSign)
        return (
          <Link
            to={'/userRecords'}
            target={this.state.mobile ? '_self' : 'userRecords'}
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
          target={this.state.mobile ? '_self' : 'userRecords'}
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
    } else {
      return null;
    }
  };

  themeChange = () => {
    const { theme } = this.props.lend;
    if (!theme) {
      this.props.lend.setTheme('white');
      window.localStorage.setItem('theme', 'white');
    } else {
      this.props.lend.setTheme('');
      window.localStorage.setItem('theme', '');
    }
  };

  showLoginModal = e => {
    if (this.props.lend.serviceInnerStatus === 'disabled') {
      this.props.lend.setNoServiceModalAllVisible(true);
    } else {
      this.props.network.connectWalletV2();
    }
  };

  handleCancel = () => {
    this.props.network.setLoginModalVisibilityV2(false);
  };

  showAccountInfo = () => {
    this.setState({ accountModal: true });
  };

  handleCancelAccount = () => {
    this.setState({ accountModal: false });
  };

  closeNetworkErrorModal = () => {
    this.props.ui.closeNetworkErrorModal();
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
      </>
    );
  };

  moreRender = () => {
    const { routeName } = this.props.network;
    return (
      <>
        <a href={Config.juststable} target="juststable">
          <span>{intl.get('navi.juststable')}</span>
        </a>
        <a
          href="#"
          className={routeName === 'StUSDT' ? 'current nav-stUsdt' : 'nav-stUsdt'}
          onClick={e => {
            this.props.lend.setStUSDTModalShow(true);
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
    this.props.lend.setShowGif(true);
    let timer = setTimeout(() => {
      this.props.lend.setShowGif(false);
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

    if (this.props.network.isRightChain === 0) {
      this.props.network.changeChain();
      return;
    }

    if (this.props.network.isMainNetwork === 0) {
      this.props.ui.showNetworkErrorModal();
      return;
    }
    const href = window.location.origin + `/liquidate?lang=${lang}`;
    window.location.href = href;
  };

  getWalletSettingsInfo = async () => {
    const { defaultAccount } = this.props.network;

    this.props.settings.getNotiSettings(defaultAccount);
    this.props.settings.getEmailBindInfo(defaultAccount);
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

  walletClick = () => {
    if (this.props.lend.serviceInnerStatus === 'disabled') {
      this.props.lend.setNoServiceModalAllVisible(true);
    } else {
      this.setState({ walletDropDownShow: true });
      // this.props.network.connectWalletV2();
    }
  };

  disconnectWallet = async () => {
    await this.props.network.disconnect();
  };

  exceptionExcution = type => {
    const { isConnected } = this.props.network;
    if (!isConnected) {
      return this.props.network.connectWalletV2();
    }

    if (this.props.network.isRightChain === 0) {
      this.props.network.changeChain();
      return;
    }

    if (this.props.network.isMainNetwork === 0) {
      this.props.ui.showNetworkErrorModal();
      return;
    }

    let url = '';
    if (type === 'rent') {
      url = 'https://docs.google.com/forms/d/e/1FAIpQLSfzHRRqY9Nz6Lju7UzaCb3WKRcWeK2kW-j3Q-_NdO5y71BuMg/viewform';
    } else if (type === 'liquidate') {
      url = 'https://docs.google.com/forms/d/e/1FAIpQLSdEHdWYniUlE7haEmHpxHtN6TiHiBQQbVgyaQeTArtUt1a4YQ/viewform';
    } else if (type === 'settings') {
      url = 'https://docs.google.com/forms/d/e/1FAIpQLSeOrF9-hSld3btFRuJD6uEAwfmat9SLkMCUfXnQ6F0qOqQJVQ/viewform';
    }
    window.open(url);
  };

  copyToClipboard = (e, disBottom = '5px', p = false) => {
    let value = '';
    if (p) {
      value = document.getElementById(p).title;
    } else {
      value = e.target.title;
    }
    value = value.replace(/,/g, '');

    copyToClipboardNew(value, () => {
      const div = document.createElement('div');
      const content = '<em></em>' + intl.get('account_modal.copied');
      div.innerHTML = content;
      div.className = 'copied-v2';
      document.getElementsByClassName('new-wallet-dropdown')[0].appendChild(div);
      const parent = document.getElementsByClassName('new-wallet-dropdown')[0];
      setTimeout(() => parent.removeChild(div), 2000);
    });
  };

  walletDropDownRender = () => {
    const { isConnected, defaultAccount, connectedWallet } = this.props.network;
    const { snbRiskAlertOn, rentalRiskAlertOn, cdpRiskAlertOn, walletHaveCdpPosition } = this.props.settings;

    if (isConnected) {
      return (
        <div className="wallet-dropdown new-wallet-dropdown">
          <div className={classnames('row-item', 'wallet-row')} onClick={() => {}}>
            <div className={'row-title ' + connectedWallet}></div>
            <div className="row-value">
              <div className="row-value-content">
                <div className="value-text">{cutMiddle(defaultAccount, 8, 8)}</div>
                <span
                  className="copy-btn"
                  onClick={e => {
                    this.copyToClipboard(e, '', 'copyAccount');
                  }}
                  title={defaultAccount}
                  id="copyAccount"
                ></span>
                <a
                  className="to-tronscan-btn"
                  target="tronscanUrl"
                  href={Config.tronscanUrl + '/address/' + defaultAccount}
                >
                  &nbsp;
                </a>
              </div>
              <div className="row-value-content">
                <div
                  className="wallet-btn switch-btn"
                  onClick={() => {
                    this.showLoginModal();
                    window.gtag('event', 'conwallet_connected_switch', {
                      'event_category': connectedWallet === 'tokenpocket' ? 'TokenPocket' : connectedWallet,
                      'event_label': 'conwallet_connected_switch'
                    });
                  }}
                >
                  {intl.get('s11.switch_wallet')}
                </div>
                <div
                  className="wallet-btn disconnect-btn"
                  onClick={() => {
                    this.disconnectWallet();
                    window.gtag('event', 'conwallet_connected_disconnect', {
                      'event_category': connectedWallet === 'tokenpocket' ? 'TokenPocket' : connectedWallet,
                      'event_label': 'conwallet_connected_disconnect'
                    });
                  }}
                >
                  {intl.get('s11.disconnect')}
                </div>
              </div>
            </div>
          </div>

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
        </div>
      );
    }
  };
  settingsDropDownRender = () => {
    const { isConnected, defaultAccount, currentAppName } = this.props.network;
    const { lang, showWalletDropdown, toBeLanguage, walletDropDownShow } = this.state;
    const { theme } = this.props.lend;

    return (
      <div className={classnames({ 'show-wallet-dropdown': showWalletDropdown })}>
        {isConnected && (
          <div
            className={classnames('j-wallet-info', 'j-wallet-clickable', {
              'j-wallet-info-active': walletDropDownShow
            })}
          >
            <div className="wallet-info-content j-wallet-clickable" onClick={() => this.walletClick()}>
              <div className={'wallet-icon j-wallet-clickable ' + getAutoConnectIconClass(currentAppName)}></div>
              <span className="address j-wallet-clickable">{cutMiddle(defaultAccount, 6, 6)}</span>
            </div>
          </div>
        )}

        <div className="wallet-dropdown">
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
        </div>
      </div>
    );
  };

  render() {
    const { isConnected, defaultAccount, routeName, loginModalVisibleV2, loginModalStepV2, currentAppName } =
      this.props.network;
    const { networkErrorModalVisible, wsModalVisible, wsFailureModal } = this.props.ui;
    const { accountModal, lang, mobile, showWalletDropdown, walletDropDownShow } = this.state;
    const { theme } = this.props.lend;

    const isWhite = theme === 'white';

    const ConnectButton =
      this.props.lend.serviceInnerStatus === 'disabled' ? (
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
              this.walletClick();
              // this.showLoginModal(e);
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
      ) : !isConnected ? (
        <div
          className={
            'connect-wallet-v2 j-wallet-clickable ' +
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
      ) : null;

    const ConnectButtonMobile =
      isConnected && defaultAccount ? (
        Config.allowAutoConnectInMobile.includes(currentAppName) && mobile ? (
          <div className={'j-wallet-info'}>
            <div className="wallet-info-content">
              <div className={'wallet-icon ' + getAutoConnectIconClass(currentAppName)}></div>
              <span className="address">{cutMiddle(defaultAccount, 6, 6)}</span>
            </div>
          </div>
        ) : (
          <div
            className={classnames('j-wallet-info', 'j-wallet-clickable', {
              'j-wallet-info-active': walletDropDownShow
            })}
          >
            <div className="wallet-info-content j-wallet-clickable" onClick={() => this.walletClick()}>
              <div className={'wallet-icon j-wallet-clickable ' + getAutoConnectIconClass(currentAppName)}></div>
              <span className="address j-wallet-clickable">{cutMiddle(defaultAccount, 6, 6)}</span>
            </div>
          </div>
        )
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
          </div>
        </Tooltip>
      ) : Config.allowAutoConnectInMobile.includes(currentAppName) && mobile ? (
        <div className={'j-wallet-info'}>
          <div className="wallet-info-content">
            <span className="address ml-0">{'--'}</span>
          </div>
        </div>
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
                    target="portal"
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
                {this.settingsDropDownRender()}
                {walletDropDownShow && this.walletDropDownRender()}
                {this.props.network.defaultAccount && this.renderRecordsLink()}
                <span className={'setting-icon' + (showWalletDropdown ? ' active' : '')}></span>
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
          <>
            {walletDropDownShow && (
              <div className="j-header j-header-m">
                <div className="j-wallet">{this.walletDropDownRender()}</div>
              </div>
            )}
            <MobileHeader
              classNames={this.props.classNames}
              hideThemeToggle={this.props.hideThemeToggle}
              hideBackBtn={this.props.hideBackBtn}
              mountedActions={this.props.mountedActions}
              showingWalletDropdown={showWalletDropdown}
              renderRecordsLink={this.renderRecordsLink}
              walletDropDownShow={walletDropDownShow}
            >
              <>{ConnectButtonMobile}</>
            </MobileHeader>
          </>
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

        {networkErrorModalVisible && (
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
        )}

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
