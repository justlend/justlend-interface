// Libraries
import React, { useEffect, useState, useCallback } from 'react';
import intl from 'react-intl-universal';
import isMobile from 'ismobilejs';
import { observer } from 'mobx-react';
import { Skeleton, Tooltip } from 'antd';
import { Link } from 'react-router-dom';
import Stores from '../../stores';
import Config from '../../config';

import Header from './Header';
import SeasonToolBar from './season/index';
import Footer from './Footer';
import Account from '../Account';
import UserList from './userList';
import HomeMarket from './HomeMarket';
import HomeM from './mobile/Home';
import DAW from '../Modals/v2/DAW';
import BorrowModal from '../Modals/v2/Borrow';
import WinterTheme from '../WinterTheme';
import CollateralLimit from '../Modals/v2/CollateralLimit';
import TransactionModal from '../Modals/v2/Transaction';
import { getAnnoucements } from '../../utils/backend';
import '../../assets/css/v2/home.scss';
import '../../assets/css/v2/theme.scss';

const Home = () => {
  const { network, lend, pool, app, user, market } = Stores;

  const [lang, setLang] = useState(window.localStorage.getItem('lang') || intl.options.currentLocale);
  const [mobile, setMobile] = useState(isMobile(window.navigator).any);
  const [announcementList, setAnnouncementList] = useState({});

  useEffect(() => {
    document.title = `SBM V1 - JustLend DAO`;

    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 2000);

    lend.setVariablesInterval();
    pool.setVariablesInterval();

    const initialFetch = async () => {
      app.init();
      const currentLang = 'en-US';
      const announcements = await getAnnoucements({ perPageCount: 3, lang: currentLang });
      setAnnouncementList(announcements[0]);
    };

    initialFetch();

    return () => {
      clearTimeout(timer);
      lend.clearVariablesInterval();
      pool.clearVariablesInterval();
    };
  }, [lend, network, pool]);

  const getUserData = useCallback(async () => {
    user.getRecomendToken();
    await user.getMultiReward();
    await market.getMintInfo();
    await user.getUserData();
    await user.getUserDataFromMarkets();
    await market.getTokenBalanceInfo();
    await lend.getEnergyFee();
    if (network.isConnected) {
      market.getRiojBalance();
      market.getContinueDisabledStatus();
    }
  }, [lend, user, market, network.isConnected]);

  const getMarketData = useCallback(async () => {
    market.getRiojCheck();
    lend.getMintPaused();
    lend.getPaused();
    lend.getAmountLimit();
    // don't change those requests order, getMintInfo is depended on getMarketData
    await market.getMarketData();
    await market.getMintInfo();

    await market.getDashboardData();
    await pool.getPoolData();
    await pool.getTronbullish();
  }, [lend, market, pool]);

  const { borrowModalInfo, theme, totalCollateralShow } = lend;
  const { userDepositDataSource } = user;
  const { marketDataSource, DAWPop } = market;
  const { isConnected, finishedWalletInit } = network;

  let isLoading = !marketDataSource || !userDepositDataSource || !announcementList;
  if (mobile || (!isConnected && finishedWalletInit)) {
    isLoading = false;
  }

  return (
    <>
      <div
        className={
          'j-wrapper ' + theme + (mobile ? ' j-wrapper-m' : '') + (Config.winterThemeVisible ? ' snow-show' : '')
        }
      >
        {Config.winterThemeVisible && <WinterTheme fromPage="home" />}
        <Header instantActions={getMarketData} mountedActions={getUserData}></Header>
        <SeasonToolBar pageName="home" />
        {!mobile ? (
          <>
            <main className="j-container j-home">
              <div className="j-subhead">
                {!isLoading ? (
                  <div className="j-title">
                    {intl.get('jlv2.extra.sbmv1')}
                    <Link
                      onClick={() => {
                        window.gtag('event', 'PC_back_to_v2', {
                          'event_category': 'PC_V2',
                          'event_label': 'back_to_v2'
                        });
                      }}
                      className="experience-new"
                      to="/home"
                    >
                      <span>{intl.get('jlv2.extra.explore_v2')}</span>
                      <Tooltip
                        title={intl.get('jlv2.switch_v2_tip')}
                        placement="top"
                        arrowPointAtCenter
                        overlayClassName="j-tooltip-dropdown"
                      >
                        <span className="j-tooltip-icon j-info-icon ml-4"></span>
                      </Tooltip>
                    </Link>
                  </div>
                ) : (
                  <Skeleton className="tall-skeleton" title={false} paragraph={{ rows: 1, width: '100px' }} active />
                )}
                <div className="info">
                  {!isLoading ? (
                    <div className="desc">{intl.get('jlv2.switch_v1_tip')}</div>
                  ) : (
                    <Skeleton title={false} paragraph={{ rows: 1, width: '200px' }} active />
                  )}
                  {!isLoading ? (
                    Object.keys(announcementList).length > 0 && (
                      <div className="j-announce">
                        <span className="announce-icon"></span>
                        <a
                          className="announce-content"
                          href={`${announcementList?.html_url}`}
                          target="announce"
                          rel="noreferrer"
                          aria-label={`${announcementList.title} ${announcementList?.created_at?.substr(0, 10)}`}
                        >
                          {announcementList.title}（{announcementList?.created_at?.substr(0, 10)}）
                        </a>
                        <span className="announce-arrow-icon"></span>
                      </div>
                    )
                  ) : (
                    <div className="j-announce-skeleton">
                      <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                    </div>
                  )}
                </div>
              </div>

              <div className="j-infos">
                <Account isLoading={isLoading} />
                <UserList isLoading={isLoading} />
              </div>
              <HomeMarket isLoading={isLoading} />
            </main>
            <Footer></Footer>
          </>
        ) : (
          <HomeM />
        )}
      </div>
      {DAWPop.show && <DAW />}
      {borrowModalInfo.visible && <BorrowModal></BorrowModal>}
      <TransactionModal></TransactionModal>
      {totalCollateralShow && <CollateralLimit />}
    </>
  );
};

export default observer(Home);
