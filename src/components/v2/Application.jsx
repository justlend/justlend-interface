import React from 'react';
import intl from 'react-intl-universal';
import isMobile from 'ismobilejs';
import { inject, observer } from 'mobx-react';
import Config from '../../config';
import Header from './Header';
import Footer from './Footer';
import TabsBar from './mobile/TabsBar';

import { getQueryObj } from '../../utils/helper';
import '../../assets/css/v2/application.scss';
import '../../assets/css/v2/theme.scss';
import backIconWhite from '../../assets/images/v2/energy-rental/arrow-left-white.svg';
import backIcon from '../../assets/images/v2/energy-rental/arrow-left.svg';

@inject('network')
@inject('ui')
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
    const { theme } = this.props.lend;

    return (
      <>
        <div className={'j-wrapper ' + theme + (Config.winterThemeVisible ? ' snow-show' : '')}>
          <Header instantActions={this.getMarketData} mountedActions={this.getUserData}></Header>{' '}
          {/* TODO: getUserData 未定义方法（或属性） */}
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
          </div>
          <Footer />
        </div>
        <TabsBar theme={theme} />
      </>
    );
  }
}

export default Application;
