import React from 'react';
import { Link } from 'react-router-dom';
import intl from 'react-intl-universal';
import isMobile from 'ismobilejs';
import { inject, observer } from 'mobx-react';
import { Skeleton } from 'antd';
import Config from '../../config';
import Header from './Header';
import Footer from './Footer';
import TabsBar from './mobile/TabsBar';

import { getAnnoucements } from '../../utils/backend';
import { getQueryObj } from '../../utils/helper';
import '../../assets/css/v2/application.scss';
import '../../assets/css/v2/theme.scss';
import backIconWhite from '../../assets/images/v2/energy-rental/arrow-left-white.svg';
import backIcon from '../../assets/images/v2/energy-rental/arrow-left.svg';
import LightImg from '../../assets/images/v2/light-gray.svg';
import NoAppIcon from '../../assets/images/v2/no-app-icon.png';
import NoAppIconWhite from '../../assets/images/v2/white-theme/no-app-icon.png';

@inject('network')
@inject('lend')
@inject('system')
@inject('pool')
@observer
class Application extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      mobile: isMobile(window.navigator).any,
      rentSwitch: false,
      liquidateSwitch: false,
      settingsSwitch: false
    };
  }
  componentDidMount = async () => {
    document.title = `JustLend DAO | JustLend DAO is the first official lending platform on TRON where users can borrow, lend, deposit assets
    and earn interests.`;

    await this.props.lend.getLatestBlockInfo();

    let { pre } = getQueryObj();

    if (pre === 'EnergyRent') {
      this.setState({ rentSwitch: true });
    } else if (pre === 'liquidate') {
      this.setState({ liquidateSwitch: true });
    } else if (pre === 'settings') {
      this.setState({ settingsSwitch: true });
    } else {
      this.setState({ rentSwitch: true, liquidateSwitch: true, settingsSwitch: true });
    }
  };

  switch = (e, type) => {
    let classList = e.target.classList;
    if (classList) {
      let className = Array.prototype.slice.call(classList);
      if (className.includes('j-rent-renew') || className.includes('jl-links')) return;
    }
    this.setState({ [type + 'Switch']: !this.state[type + 'Switch'] });
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
      this.props.network.showNetworkErrorModal();
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

  goBack = () => {
    let { from } = getQueryObj();

    if (from === 'portal') {
      const { lang } = this.state;
      window.location.href = window.location.origin + `/homeNew?lang=${lang}`;
    } else {
      window.history.back(-1);
    }
  };

  render() {
    const { mobile, rentSwitch, liquidateSwitch, settingsSwitch } = this.state;
    const { theme, applicationMap, hasLiquidateBetaAuthority, hasEnergyBetaAuthority, hasSettingsBetaAuthority } =
      this.props.lend;

    return (
      <>
        <div className={'j-wrapper ' + theme + (Config.winterThemeVisible ? ' snow-show' : '')}>
          <Header instantActions={this.getMarketData} mountedActions={this.getUserData}></Header>
          <div className="j-application">
            <div className="app-header">
              <a className="back-btn app-back-btn" href="javascript:;" onClick={this.goBack}>
                <img className="back-icon" src={theme === 'white' ? backIconWhite : backIcon} alt="" />
                {intl.get('strx.rent_list_back')}
              </a>
              <div className="app-title">{intl.get('application.title')}</div>
              <div className="app-subtitle">{intl.get('application.subtitle')}</div>
            </div>
            <div className="disclaimer-app">
              <div className="disclaimer-app-icon"></div>
              <div className="disclaimer-app-desc">
                {intl.getHTML('disclaimer.notester', { link: 'http://twitter.com/DeFi_JUST' })}
              </div>
            </div>
            {/* {!applicationMap?.canApply ? (
              <div className="app-content no-app">
                <img src={theme === 'white' ? NoAppIconWhite : NoAppIcon} />
                <div className="no-app-desc">{intl.get('application.no_application')}</div>
              </div>
            ) : (
              <div className="app-content">
                <div className="app-content-title">{intl.get('application.tip2')}</div>
                {applicationMap?.rent?.switchOn && applicationMap?.rent?.phase === 1 && (
                  <div
                    className={'app-beta rent-switch' + (rentSwitch ? ' current' : '')}
                    onClick={e => this.switch(e, 'rent')}
                  >
                    <div>
                      <div className="beta-title">
                        {intl.get('application.new_rent')}
                        <span className="beta-icon">{intl.get('application.test')}</span>
                      </div>
                      <div className="beta-content">{intl.get('application.tip3')}</div>
                      <div className="beta-btns">
                        {!hasEnergyBetaAuthority ? (
                          <span className="j-btn j-rent-renew" onClick={() => this.exceptionExcution('rent')}>
                            {intl.get('application.explore_btn')}
                          </span>
                        ) : (
                          <>
                            <button className="j-btn j-rent-renew" disabled>
                              {intl.get('application.approved')}
                            </button>
                            <div className="flex jcc ">
                              <Link className="jl-links" to="/energyRental">
                                {intl.get('application.try_now')}
                              </Link>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="switch-arrow"></div>
                    </div>
                  </div>
                )}
                {applicationMap?.liquidate?.switchOn && applicationMap?.liquidate?.phase === 1 && (
                  <div
                    className={'app-beta liquidate-switch' + (liquidateSwitch ? ' current' : '')}
                    onClick={e => this.switch(e, 'liquidate')}
                  >
                    <div>
                      <div className="beta-title">
                        {intl.get('application.liquidation')}
                        <span className="beta-icon">{intl.get('application.test')}</span>
                      </div>
                      <div className="beta-content">
                        {intl.get('application.des1')}
                        <a className="jl-links" href={Config.sbfFaqDoc} target="liquidations">
                          {intl.get('application.title1')}
                        </a>
                      </div>

                      {!mobile && (
                        <div className="beta-tips">
                          <img className="light-img" src={LightImg} />
                          <span>{intl.get('application.des3')}</span>
                        </div>
                      )}
                      <div className="beta-btns">
                        {!hasLiquidateBetaAuthority ? (
                          <span className="j-btn j-rent-renew" onClick={() => this.exceptionExcution('liquidate')}>
                            {intl.get('application.explore_btn')}
                          </span>
                        ) : (
                          <>
                            <button className="j-btn j-rent-renew" disabled>
                              {intl.get('application.approved')}
                            </button>
                            <div className="flex jcc ">
                              <Link className="jl-links" to="/liquidate">
                                {intl.get('application.try_now')}
                              </Link>
                            </div>
                          </>
                        )}
                      </div>
                      {mobile && (
                        <div className="beta-tips">
                          <img className="light-img" src={LightImg} />
                          <span>{intl.get('application.des3')}</span>
                        </div>
                      )}
                      <div className="switch-arrow"></div>
                    </div>
                  </div>
                )}
                {applicationMap?.settings?.switchOn && applicationMap?.settings?.phase === 1 && (
                  <div
                    className={'app-beta settings-switch' + (settingsSwitch ? ' current' : '')}
                    onClick={e => this.switch(e, 'settings')}
                  >
                    <div>
                      <div className="beta-title">
                        {intl.get('settings.application_beta_title')}
                        <span className="beta-icon">{intl.get('application.test')}</span>
                      </div>
                      <div className="beta-content">{intl.get('settings.application_beta_content')}</div>

                      <div className="beta-btns">
                        {!hasSettingsBetaAuthority ? (
                          <span className="j-btn j-rent-renew" onClick={() => this.exceptionExcution('settings')}>
                            {intl.get('application.explore_btn')}
                          </span>
                        ) : (
                          <>
                            <button className="j-btn j-rent-renew" disabled>
                              {intl.get('application.approved')}
                            </button>
                            <div className="flex jcc ">
                              <Link className="jl-links" to="/settings">
                                {intl.get('application.try_now')}
                              </Link>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="switch-arrow"></div>
                    </div>
                  </div>
                )}
              </div>
            )} */}
          </div>
          <Footer />
        </div>
        <TabsBar theme={theme} />
      </>
    );
  }
}

export default Application;
