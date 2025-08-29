import { inject, observer } from 'mobx-react';
import React from 'react';
import Footer from './Footer';
import Header from './Header';
import SeasonToolBar from './season/index';
import Market from './market/index';
import TabsBar from './mobile/TabsBar';
import WinterTheme from '../WinterTheme';
import { Config } from '../../config';
import isMobile from 'ismobilejs';

import '../../assets/css/v2/home.scss';
import '../../assets/css/v2/modal.scss';
import '../../assets/css/v2/theme.scss';

@inject('network')
@inject('lend')
@inject('system')
@inject('pool')
@inject('user')
@inject('market')
@observer
class Home extends React.Component {
  getUserData = async () => {
    await this.props.user.getUserData();
    await this.props.user.getUserDataFromMarkets();
    await this.props.market.getTokenBalanceInfo();
    if (this.props.network.isConnected) {
      this.props.market.getRiojBalance();
      this.props.market.getContinueDisabledStatus();
    }
  };

  getMarketData = async () => {
    this.props.market.getRiojCheck();
  };

  render() {
    const { theme } = this.props.lend;

    return (
      <>
        <div className={'j-wrapper market ' + theme + (Config.winterThemeVisible ? ' snow-show' : '')}>
          {Config.winterThemeVisible && <WinterTheme fromPage="market" />}
          <Header hideBackBtn={true} instantActions={this.getMarketData} mountedActions={this.getUserData} />
          <SeasonToolBar pageName="market" />
          {/* <Header hideBackBtn={true} /> */}
          <div className="j-market">
            <Market />
          </div>
          <Footer />
        </div>
        <TabsBar theme={theme} />
      </>
    );
  }
}

export default Home;
