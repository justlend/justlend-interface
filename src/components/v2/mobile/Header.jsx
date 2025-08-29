import React from 'react';
import { Link } from 'react-router-dom';
import { inject, observer } from 'mobx-react';
import intl from 'react-intl-universal';
import { Drawer, Radio, Modal } from 'antd';
import classnames from 'classnames';
import '../../../assets/css/v2/header-m.scss';
import closeIcon from '../../../assets/images/v2/mobile/close.svg';
import whiteThemeCloseIcon from '../../../assets/images/v2/mobile/white/close.svg';
import Config from '../../../config';
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

    const { defaultAccount, isConnected } = this.props.network;

    if (isConnected && defaultAccount) {
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

  openDrawer = () => {
    this.setState({ drawerVisible: true });
  };

  onClose = () => {
    this.setState({ drawerVisible: false });
  };

  render() {
    const { routeName = '' } = this.props.network;
    const { drawerVisible, settingsVisible, toBeLanguage } = this.state;
    const { theme, lang } = this.props.lend;
    const isWhite = theme === 'white';

    return (
      <div
        className={`mobile-header-v2 flex items-center ${this.props.classNames || ''} ${
          isWhite && !routeName.includes('StUSDT') ? 'white' : ''
        } ${this.props.showingWalletDropdown ? 'showing-wallet-dropdown' : ''} ${
          settingsVisible ? 'z-1101 setting-open' : ''
        }`}
      >
        <div className="mobile-header-v2-inner flex justify-between items-center">
          <div className="logo-wrap flex">
            <a href={Config.portalLink + '?lang=' + lang} target="portal" className="mobile-logo flex-between">
              <span></span>
            </a>
          </div>

          <div className="connect-btn-wrap">{this.props.children}</div>
          <div
            onClick={() => this.setState({ settingsVisible: !this.state.settingsVisible })}
            className={'category-icon' + (settingsVisible ? ' close' : '')}
          ></div>
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
              <Link className={`link-list-item${routeName.includes('vote') ? ' active' : ''}`} to="/voteNew">
                <span id={routeName.includes('vote') ? 'active' : ''}>{intl.get('navi.vote_btn')}</span>
              </Link>
            </div>
          </div>
        </Drawer>
      </div>
    );
  }
}

export default MobileHeader;
