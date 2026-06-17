import { observer } from 'mobx-react';
import React from 'react';
import Stores from '../../stores';
import Footer from './Footer';
import Header from './Header';
import SeasonToolBar from './season/index';
import Market from './market/index';
import TabsBar from './mobile/TabsBar';
import WinterTheme from '../WinterTheme';
import { Config } from '../../config';

import '../../assets/css/v2/home.scss';
import '../../assets/css/v2/modal.scss';
import '../../assets/css/v2/theme.scss';

const MarketHome = observer(() => {
  const { network, lend, user, market } = Stores;
  const { theme } = lend;

  const getUserData = async () => {
    await user.getUserData();
    await user.getUserDataFromMarkets();
    await market.getTokenBalanceInfo();
    if (network.isConnected) {
      market.getRiojBalance();
      market.getContinueDisabledStatus();
    }
  };

  const getMarketData = async () => {
    market.getRiojCheck();
  };

  return (
    <>
      <div className={'j-wrapper market ' + theme + (Config.winterThemeVisible ? ' snow-show' : '')}>
        {Config.winterThemeVisible && <WinterTheme fromPage="market" />}
        <Header hideBackBtn={true} instantActions={getMarketData} mountedActions={getUserData} />
        <SeasonToolBar pageName="market" />
        <div className="j-market">
          <Market />
        </div>
        <Footer />
      </div>
      <TabsBar theme={theme} />
    </>
  );
});

export default MarketHome;
