import React from 'react';
import { Link } from 'react-router-dom';
import { inject, observer } from 'mobx-react';
import intl from 'react-intl-universal';
import { Drawer, Radio, Modal } from 'antd';
import classnames from 'classnames';
import '../../../assets/css/v2/header-m.scss';
import closeIcon from '../../../assets/images/v2/mobile/close.svg';
import whiteThemeCloseIcon from '../../../assets/images/v2/mobile/white/close.svg';

@inject('network')
@inject('lend')
@inject('settings')
@observer
class MobileHeader extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      drawerVisible: false,
      settingsVisible: false,
      toBeLanguage: ''
    };
  }

  componentDidMount() {
    this.props.instantActions && this.props.instantActions();
    if (this.props.network.isConnected) {
      this.props.mountedActions && this.props.mountedActions();
    }
    this.props.network.on('connect', () => {
      console.log('connected event trigger');
      this.props.mountedActions && this.props.mountedActions();
    });
  }

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

  themeChange = () => {
    this.props.lend.changeTheme();
  };

  // themeChangeMobile = v => {
  //   const { theme } = this.props.lend;
  //   const isWhite = theme === 'white';

  //   if ((v === 'sun' && isWhite) || (v === 'moon' && !isWhite)) {
  //     return;
  //   } else {
  //     this.props.lend.changeTheme();
  //   }
  // };

  openDrawer = () => {
    this.setState({ drawerVisible: true });
  };

  onClose = () => {
    this.setState({ drawerVisible: false });
  };

  render() {
    const { routeName = '' } = this.props.network;
    //console.log(routeName);
    const { drawerVisible, settingsVisible, toBeLanguage } = this.state;
    const { theme, lang, hasSettingsBetaAuthority, applicationMap } = this.props.lend;
    const mainSettingsAuthority =
      applicationMap['settings']?.switchOn && (hasSettingsBetaAuthority || applicationMap['settings']?.phase === 2);
    const isWhite = theme === 'white';
    const { snbRiskAlertOn, rentalRiskAlertOn, cdpRiskAlertOn } = this.props.settings;
    return (
      <div
        className={`mobile-header-v2 flex items-center ${this.props.classNames || ''} ${
          isWhite && !routeName.includes('StUSDT') ? 'white' : ''
        } ${this.props.showingWalletDropdown ? 'showing-wallet-dropdown' : ''} ${
          settingsVisible ? 'z-1001 setting-open' : ''
        }`}
      >
        <div className="mobile-header-v2-inner flex justify-between items-center">
          <div className="logo-wrap flex">
            <a href={`/?lang=${lang}/homeNew`} className="mobile-logo flex-between">
              <span></span>
            </a>
          </div>

          <div className="connect-btn-wrap">{this.props.children}</div>
          {/* {!mainSettingsAuthority &&
            (this.props.hideThemeToggle || routeName.includes('StUSDT') ? null : (
              <div className="mobile-theme">
                <div className={isWhite ? 'current' : ''} onClick={() => this.themeChangeMobile('sun')}>
                  sun
                </div>
                <div className={isWhite ? '' : 'current'} onClick={() => this.themeChangeMobile('moon')}>
                  moon
                </div>
              </div>
            ))} */}

          {/* {this.props.network.defaultAccount && this.props.renderRecordsLink()} */}
          {settingsVisible ? (
            <svg
              className="menu"
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              onClick={() => this.setState({ settingsVisible: false })}
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.94682 6.88396L0 12.9221L1.05255 13.9908L6.99937 7.95267L12.9473 13.992L13.9999 12.9233L8.05192 6.88396L13.7792 1.06871L12.7267 0L6.99937 5.81525L1.27321 0.00117754L0.220661 1.06989L5.94682 6.88396Z"
                fill={isWhite ? '#22232B' : 'white'}
              />
            </svg>
          ) : (
            <svg
              className="menu"
              width="18"
              height="16"
              viewBox="0 0 18 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              onClick={() => this.setState({ settingsVisible: true })}
            >
              <path d="M0 1.63682H18" stroke={isWhite ? '#22232B' : 'white'} strokeWidth="1.5" />
              <path d="M9 14.4173H18" stroke={isWhite ? '#22232B' : 'white'} strokeWidth="1.5" />
              <path d="M0 7.9997H18" stroke={isWhite ? '#22232B' : 'white'} strokeWidth="1.5" />
            </svg>
          )}
        </div>

        <Modal
          footer={null}
          title={null}
          closable={null}
          visible={settingsVisible}
          mask={null}
          top={0}
          className={'m-header-settings-modal ' + (isWhite ? 'white' : '')}
          transitionName=""
        >
          <div className="m-settings">
            <div className="setting-list">{this.props.renderRecordsLink()}</div>
            <div className="setting-list p10 mt-10">
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
            </div>
          </div>
        </Modal>

        <Drawer
          title={null}
          placement="top"
          className={`mobile-menu-drawer-v2${isWhite ? ' white' : ''}`}
          closable={true}
          height="300px"
          onClose={this.onClose}
          visible={drawerVisible}
          closeIcon={
            <img src={isWhite ? whiteThemeCloseIcon : closeIcon} alt="close" className="closeIconMobile"></img>
          }
        >
          <div className="mobile-menu-content">
            <div className="link-list">
              <Link
                className={`link-list-item${routeName?.includes('LiquidityStake') ? ' active' : ''}`}
                to="/strx"
                onClick={window.gtag('event', 'H5_nav_strx', {
                  'event_category': 'sTRX',
                  'event_label': 'mobile_nav_strx'
                })}
              >
                <span id={routeName?.includes('LiquidityStake') ? 'active' : ''}>
                  {intl.get('strx.stake_trx_liquid_staking')}
                  <i className="stake"></i>
                </span>
              </Link>
              <Link
                className={`link-list-item${routeName?.includes('EnergyRent') ? ' active' : ''}`}
                to="/energyRental"
                onClick={window.gtag('event', 'H5_nav_energy', {
                  'event_category': 'sTRX',
                  'event_label': 'mobile_nav_energy'
                })}
              >
                <span id={routeName?.includes('EnergyRent') ? 'active' : ''}>
                  {intl.get('strx.energy_rental')}
                  <i className="energy"></i>
                </span>
              </Link>
              <Link className={`link-list-item${routeName.includes('home') ? ' active' : ''}`} to="/homeNew">
                <span id={routeName.includes('home') ? 'active' : ''}>{intl.get('v2.lend_title')}</span>
              </Link>
              {/* <Link className={`link-list-item${routeName?.includes('market') ? ' active' : ''}`} to="/market">
                <span id={routeName?.includes('market') ? 'active' : ''}>{intl.get('navi.market_btn')}</span>
              </Link> */}
              <Link className={`link-list-item${routeName.includes('vote') ? ' active' : ''}`} to="/voteNew">
                <span id={routeName.includes('vote') ? 'active' : ''}>{intl.get('navi.vote_btn')}</span>
              </Link>
              {/* <div className="link-list-item theme-toggle">
                <button
                  disabled={isWhite}
                  className={`btn btn-light${isWhite ? ' active' : ''}`}
                  onClick={this.themeChange}
                ></button>
                <button
                  disabled={theme !== 'white'}
                  className={`btn btn-dark${theme !== 'white' ? ' active' : ''}`}
                  onClick={this.themeChange}
                ></button>
              </div> */}
              {/* <div className="go-old">Go back to the old version</div> */}
            </div>
          </div>
        </Drawer>
      </div>
    );
  }
}

export default MobileHeader;
