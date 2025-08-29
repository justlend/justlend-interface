import React from 'react';

import { Link } from 'react-router-dom';
import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';
import classnames from 'classnames';

import { Skeleton } from 'antd';

import { goToPage } from '../../utils/helper';

import Header from '../../components/v2/Header';
import Footer from '../../components/v2/Footer';
import TabsBar from '../../components/v2/mobile/TabsBar';

import RiskWarning from './components/RiskWarning';
import GlobalSettings from './components/GlobalSettings';
import SuccessPopup from './components/SuccessPopup';

import { isEmailValid } from './utils/helper';

import ToggleSwitch from '../../components/Widget/ToggleSwitch';
import '../../assets/css/settings.scss';
import '../../assets/css/settings-skeleton.scss';
import '../../assets/css/v2/theme.scss';

let authTimer = null;
@inject('network')
@inject('lend')
@inject('settings')
@observer
class SettingsPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      currSection: 'riskWarning',
      shouldShowSuccessPopup: false
    };
  }

  componentDidMount = () => {
    window.gtag('event', 'portfolio_setting_globalsetting_PV', {
      'event_category': 'portfolio',
      'event_label': 'portfolio_setting_globalsetting_PV'
    });
    window.gtag('event', 'portfolio_setting_globalsetting_UV', {
      'event_category': 'portfolio',
      'event_label': 'portfolio_setting_globalsetting_UV'
    });

    this.props.network.setRouteName('settings');

    this.props.network.on('finishedWalletInit', async () => {
      if (this.props.network.isConnected !== true) {
        goToPage('home');
      }
    });
  };

  showSuccessPopup = () => {
    window.gtag('event', 'portfolio_setting_riskAlert_signSuccess', {
      'event_category': 'portfolio',
      'event_label': 'portfolio_setting_riskAlert_signSuccess'
    });
    this.setState({ shouldShowSuccessPopup: true });

    setTimeout(() => {
      this.setState({ shouldShowSuccessPopup: false });
    }, 1000);
  };

  authorityJudge = () => {
    const { lang } = this.state;
    const { hasSettingsBetaAuthority, applicationMap } = this.props.lend;

    if ((applicationMap?.settings?.phase === 1 && !hasSettingsBetaAuthority) || !applicationMap?.settings?.switchOn) {
      clearTimeout(authTimer);
      window.location.href = window.location.origin + `/homeNew?lang=${lang}`;
    }
  };

  getUserData = async () => {
    const { isConnected } = this.props.network;

    if (isConnected) {
      authTimer = setTimeout(() => {
        this.authorityJudge();
      }, 3000);
    }
  };

  getMarketData = async () => {};

  render() {
    const { isConnected } = this.props.network;
    const { theme } = this.props.lend;
    const { currSection, shouldShowSuccessPopup } = this.state;
    const { bindedEmail, snbRiskAlertOn, rentalRiskAlertOn, cdpRiskAlertOn, walletHaveCdpPosition } =
      this.props.settings;

    const finishGettingBindInfo = bindedEmail !== '--';
    const isBindedEmailValid = isEmailValid(bindedEmail);

    const haveActiveAlertOn = snbRiskAlertOn || rentalRiskAlertOn || (walletHaveCdpPosition && cdpRiskAlertOn);
    const showSkeleton = !isConnected;
    // !isConnected ||
    // !finishGettingBindInfo ||
    // snbRiskAlertOn === null ||
    // rentalRiskAlertOn === null ||
    // cdpRiskAlertOn === null ||
    // walletHaveCdpPosition === null;

    return (
      <>
        <div className={'j-wrapper ' + theme}>
          <Header
            instantActions={this.getMarketData}
            // mountedActions={this.getUserData}
          ></Header>

          <div className="j-settings-container">
            <div className="settings-nav-bar">
              <div className="nav-bar-bg"></div>
              <div
                className={classnames(
                  'nav-bar-bg-icon',
                  { 'risk-warning-bg-icon': currSection === 'riskWarning' },
                  { 'global-settings-bg-icon': currSection === 'globalSettings' }
                )}
              ></div>

              {showSkeleton ? (
                <div className="settings-nav-bar-skeleton-container">
                  <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                  <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                  <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                </div>
              ) : (
                <div className="nav-bar-content">
                  <div className="nav-bar-title">{intl.get('settings.title')}</div>

                  <div className="item-list">
                    <div
                      className={classnames('settings-item', 'risk-warning-item', {
                        'active': currSection === 'riskWarning'
                      })}
                      onClick={() => this.setState({ currSection: 'riskWarning' })}
                    >
                      <Link to="/settings" className="item-title">
                        {intl.get('settings.risk_warning.title')}
                      </Link>
                      {!haveActiveAlertOn && <div className="item-hint">{intl.get('settings.risk_warning.off')}</div>}
                    </div>
                    <div
                      className={classnames('settings-item', 'global-settings-item', {
                        'active': currSection === 'globalSettings'
                      })}
                      onClick={() => this.setState({ currSection: 'globalSettings' })}
                    >
                      <Link to="/settings" className="item-title">
                        {intl.get('settings.global_settings.title')}
                      </Link>
                      {finishGettingBindInfo && !isBindedEmailValid && (
                        <div className="item-hint">{intl.get('settings.global_settings.no_email_linked')}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="settings-content">
              {showSkeleton ? (
                <>
                  <div className="settings-content-skeleton-container">
                    <div className="settings-content-header-skeleton-container">
                      <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                      <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                    </div>
                    <div className="settings-content-option-skeleton-container">
                      <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                      <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                      <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                    </div>
                  </div>
                  <div className="settings-content-mobile-skeleton-container">
                    <div className="settings-content-header-skeleton-container">
                      <Skeleton title={false} paragraph={{ rows: 1, width: '50%' }} active />
                      <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                    </div>
                    <div className="settings-content-option-skeleton-container">
                      <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />

                      <div className="settings-content-mobile-option-skeleton">
                        <div className="settings-content-mobile-option-icon-skeleton"></div>
                        <div className="settings-content-mobile-option-text-skeleton">
                          <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                          <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                          <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                        </div>
                        <ToggleSwitch on={false} onClick={() => {}} />
                      </div>
                      <div className="settings-content-mobile-option-skeleton">
                        <div className="settings-content-mobile-option-icon-skeleton"></div>
                        <div className="settings-content-mobile-option-text-skeleton">
                          <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                          <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                          <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                        </div>
                        <ToggleSwitch on={false} onClick={() => {}} />
                      </div>
                      <div className="settings-content-mobile-option-skeleton">
                        <div className="settings-content-mobile-option-icon-skeleton"></div>
                        <div className="settings-content-mobile-option-text-skeleton">
                          <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                          <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                          <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                        </div>
                        <ToggleSwitch on={false} onClick={() => {}} />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {currSection === 'riskWarning' && <RiskWarning showSuccessPopup={this.showSuccessPopup} />}
                  {currSection === 'globalSettings' && <GlobalSettings />}
                </>
              )}
            </div>

            <SuccessPopup isVisible={shouldShowSuccessPopup} />
          </div>

          {/* <Footer></Footer> */}

          <div>
            <TabsBar theme={theme} />
          </div>
        </div>
      </>
    );
  }
}

export default SettingsPage;
