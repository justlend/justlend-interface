// src/pages/MarketPage.jsx
import React, { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import Store from '../../stores';

import Header from '../../components/v2/Header';
import Footer from '../../components/v2/Footer';
import TabsBar from '../../components/v2/mobile/TabsBar';
import SeasonToolBar from '../../components/v2/season/index';
import { MarketHeader } from '../../components/JLv2/Market/MarketHeader';
import { MyMarketPosition } from '../../components/JLv2/Market/MarketInteractionPanel';
import { MarketHistoricalChart } from '../../components/JLv2/Market/MarketHistoricalChart';
import { VaultFundingList } from '../../components/JLv2/Market/VaultFundingList';
import { MarketInterestInfo } from '../../components/JLv2/Market/MarketInterestInfo';
import { ActionBox } from '../../components/JLv2/Market/ActionBox';
import { TransactionModal } from '../../components/JLv2/TransactionModal';
import MarketSkeleton from '../../components/JLv2/Market/MarketSkeleton';
import { emptyReactNodeNew } from '../../utils/helper';
import '../../assets/css/JLv2/common.scss';
import '../../assets/css/JLv2/market.scss';
import '../../assets/css/v2/theme.scss';
import '../../assets/css/v2/footer.scss';

const MarketPage = observer(() => {
  const { marketV2: marketStore, network, lend, dashboardStore } = Store;
  const { theme } = lend;
  const location = useLocation();
  const userAddress = network?.defaultAccount || window?.defaultAccount;
  const [positionFixed, setPositionFixed] = useState(false);
  const isWhite = theme === 'white';

  useEffect(() => {
    document.title = 'Market V2- JustLend DAO';
    window.gtag('event', 'PC_markets_detail', { 'event_category': 'PC_V2', 'event_label': 'markets_detail' });
    lend.getCurrentBlock();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const marketId = params.get('id');

    if (marketId) {
      marketStore.fetchAllMarketData(marketId, userAddress);
    }

    let timer = marketStore.getDataInterval(marketId, userAddress);

    return () => {
      clearInterval(timer);
      timer = null;
    };
  }, [marketStore, location.search, userAddress]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const scrollEvent = () => {
      if (window.pageYOffset >= 321) {
        setPositionFixed(true);
      } else {
        setPositionFixed(false);
      }
    };
    window.addEventListener('scroll', scrollEvent);
    return () => window.removeEventListener('scroll', scrollEvent);
  }, []);

  if (marketStore.isLoading) {
    return (
      <div className={'jlv2-bg borrow-bg ' + (isWhite ? 'white' : '')}>
        <Header instantActions={null} mountedActions={null} />
        <SeasonToolBar pageName="marketV2" />
        <div className="market-page-container common-page-container">
          <MarketSkeleton />
        </div>
      </div>
    );
  }

  if (marketStore.marketIdError) {
    return (
      <div className={'jlv2-bg borrow-bg jlv2-error-bg ' + (isWhite ? 'white' : '')}>
        <Header instantActions={null} mountedActions={null} />
        <SeasonToolBar pageName="marketV2" />
        <div className="market-page-container common-page-container">
          <Link onClick={() => dashboardStore.setHomeSearchparam('borrow')} className="return-back" to="homeNew">
            {intl.get('jlv2.back_to_home')}
          </Link>
          {emptyReactNodeNew()}
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <div className={'jlv2-bg borrow-bg ' + (isWhite ? 'white' : '')}>
        <Header instantActions={null} mountedActions={null} />
        <SeasonToolBar pageName="marketV2" />
        <div className="market-page-container common-page-container">
          <MarketHeader />
          <div className="common-page-content market-page-content">
            <div className="mp-content">
              <MyMarketPosition />
              <MarketHistoricalChart />
              <VaultFundingList />
              <MarketInterestInfo />
            </div>
            <div id="marketAction" className={'mp-action-content' + (positionFixed ? ' fixed' : '')}>
              <ActionBox />
            </div>
          </div>
          <TransactionModal />
          {/* <h1>Market Page for {marketStore.marketDetails?.name}</h1> */}
        </div>
        <Footer />
      </div>
      <TabsBar theme={lend.theme} />
    </>
  );
});

export default MarketPage;
