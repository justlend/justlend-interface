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
import '../../assets/css/v2/theme.scss';

@inject('network')
@inject('lend')
@inject('system')
@inject('pool')
@observer
class Home extends React.Component {
  getUserData = async () => {
    await this.props.lend.getUserData();
    await this.props.lend.getUserDataFromMarkets();
    await this.props.lend.getTokenBalanceInfo();
    if (this.props.network.isConnected) {
      this.props.lend.getRiojBalance();
      this.props.lend.getContinueDisabledStatus();
    }
  };

  getMarketData = async () => {
    this.props.lend.getRiojCheck();
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
