import React, { useEffect, useState, useCallback } from 'react';
import { Skeleton, Tooltip } from 'antd';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react';
import isMobile from 'ismobilejs';
import { Link } from 'react-router-dom';
import Stores from '../../stores';
import Header from '../../components/v2/Header';
import Footer from '../../components/v2/Footer';
import TabsBar from '../../components/v2/mobile/TabsBar';
import SeasonToolBar from '../../components/v2/season/index';
import { MyPositionSummary } from '../../components/JLv2/Dashboard/MyPositionSummary';
import { BorrowingAndChart } from '../../components/JLv2/Dashboard/BorrowingAndChart';
import { MarketTabs } from '../../components/JLv2/Dashboard/MarketTabs';
import { RewardsClaimPanel } from '../../components/JLv2/Dashboard/RewardsClaimPanel';
import { PositionV1Modal } from '../../components/JLv2/PositionV1Modal';
import {
  preloadMiningResolver,
  useMiningRewards,
  useAccruingMining,
  hasClaimableRewards
} from '../../utils/hooks/useMining';
import '../../assets/css/JLv2/common.scss';
import '../../assets/css/JLv2/dashboard.scss';
import V2Dynamic from '../../assets/images/JLv2/v2.webm';
import { BigNumber, getParameterByName } from '../../utils/helper';
import Config from '../../config';

const DashboardPage = observer(() => {
  const { dashboardStore, network, user, lend } = Stores;
  const {
    positionData,
    fetchPosition,
    getDataInterval,
    positionLoading,
    listLoading,
    chartLoading,
    fetchVaultList,
    fetchMarketList,
    allUserTokens,
    getUserBalance,
    fetchChartData,
    showPositionV1Modal,
    setHomeSearchparam,
    setActiveTab
  } = dashboardStore;
  const { isConnected, defaultAccount } = network;
  const userAddress = defaultAccount;
  const [totalAssetsV1, setTotalAssetsV1] = useState(BigNumber(0));
  const [totalAssetsV2, setTotalAssetsV2] = useState(BigNumber(0));
  const [isInit, setIsInit] = useState(true);
  const [mobile] = useState(isMobile(window.navigator).any);
  const lang = window.localStorage.getItem('lang') || intl.options.currentLocale;

  // Empty-position users with claimable / accruing / settling mining must still
  // see the rewards module on Dashboard. Without these signals the totalAssets
  // gate below routes them to bannerRender and RewardsClaimPanel never mounts,
  // so the panel's own visibility logic can never run.
  const { rewards: miningRewards, loading: rewardsLoading } = useMiningRewards();
  const { accruingUsd, settlingUsd, loading: accruingLoading } = useAccruingMining();
  const hasMiningActivity =
    (!rewardsLoading && hasClaimableRewards(miningRewards)) ||
    BigNumber(accruingUsd || 0).gt(0) ||
    BigNumber(settlingUsd || 0).gt(0);
  // Mining still loading — defer the empty-position banner gate so users with
  // accruing/settling/claimable mining don't see a flash of bannerRender
  // before hasMiningActivity flips true.
  const miningGateLoading = rewardsLoading || accruingLoading;

  useEffect(() => {
    document.title = 'SBM V2- JustLend DAO';
    document.querySelector('html').style.scrollPaddingTop = mobile ? '20px' : '84px';
    preloadMiningResolver();

    return () => {
      document.querySelector('html').style.scrollPaddingTop = '0px';
    };
  }, []);

  useEffect(() => {
    fetchPosition();
    fetchChartData();
    if (dashboardStore.activeTab === 'supply') {
      fetchVaultList();
      // fetchMarketList(false);
    } else {
      // fetchVaultList(false);
      fetchMarketList();
    }

    if (!userAddress) {
      lend.getCurrentBlock();
    }

    // add listen user address to get user balance
    if (userAddress) {
      getUserBalance(allUserTokens);
    }
  }, [userAddress]);

  useEffect(() => {
    network.on('connect', () => window.gtag('event', 'login', { 'event_category': 'PC_V2', 'event_label': 'login' }));
    network.off('connect', () =>
      window.gtag('event', 'not_login', { 'event_category': 'PC_V2', 'event_label': 'not_login' })
    );
    if (isConnected) {
      window.gtag('event', 'login', { 'event_category': 'PC_V2', 'event_label': 'login' });
    } else {
      window.gtag('event', 'not_login', { 'event_category': 'PC_V2', 'event_label': 'not_login' });
    }
  }, [network, isConnected]);

  useEffect(() => {
    if (isInit && !positionLoading && !listLoading && !chartLoading && !miningGateLoading) {
      setIsInit(false);
    }
  }, [positionLoading, listLoading, chartLoading, miningGateLoading]);

  useEffect(() => {
    if (user.totalBorrowUsdForUSDD !== '--') {
      getTotalAssetsV1();
    }
  }, [user.totalBorrowUsdForUSDD]);

  useEffect(() => {
    setTotalAssetsV2(
      BigNumber(positionData.totalSupplyUsd).plus(positionData.totalBorrowUsd).plus(positionData.totalCollateralUsd)
    );
  }, [positionData?.totalSupplyUsd, positionData?.totalBorrowUsd, positionData?.totalCollateralUsd]);

  const getTotalAssetsV1 = () => {
    const { usddJtoken, usddoldJtoken } = Config;
    const { userDepositDataSource, totalBorrowUsdForUSDD } = user;
    let totalSupplyUsdForUSDD = BigNumber(0);

    if (userDepositDataSource && userDepositDataSource.length > 0) {
      userDepositDataSource.map((item, index) => {
        if (item.jtokenAddress === usddJtoken || item.jtokenAddress === usddoldJtoken) {
          totalSupplyUsdForUSDD = totalSupplyUsdForUSDD.plus(item.deposited);
        } else {
          totalSupplyUsdForUSDD = totalSupplyUsdForUSDD.plus(item.deposited_usd);
        }
      });
    }
    setTotalAssetsV1(BigNumber(totalSupplyUsdForUSDD).plus(totalBorrowUsdForUSDD));
  };

  const showConnectModal = useCallback(() => {
    if (lend.serviceInnerStatus === 'disabled') {
      lend.setNoServiceModalAllVisible(true);
    } else {
      network.connectWalletV2();
    }
  }, [lend, network]);

  const bannerRender = ({ isNewV2 = false } = {}) => {
    return (
      <div className={'my-position-banner' + (lang === 'en-US' ? ' en' : '')}>
        <div className="mpb-left">
          <div>
            <div className="mpb-protocol">
              <span>{intl.get('jlv2.banner.protocol1')}</span>
              {intl.get('jlv2.banner.protocol2')}
            </div>
            <div className="all-upgrade">V2</div>
          </div>
          <div className="mpb-charactor">
            <span>{intl.get('jlv2.banner.independent')}</span>
            <span>{intl.get('jlv2.banner.separate')}</span>
          </div>
        </div>
        <div className="mpb-right">
          {/* <div className="fit-for">{intl.getHTML('jlv2.banner.choose_better')}</div> */}
          {!isConnected ? (
            <div className="banner-btn" onClick={showConnectModal}>
              {intl.get('navi.wallet_linkbtn')}
              <span className="banner-arrow"></span>
            </div>
          ) : (
            <a
              className="banner-btn"
              href={Config.portalLink + '?scroll=whatsnew'}
              target="_blank"
              rel="noopener noreferrer"
            >
              {intl.get('jlv2.banner.expore')}
              <span className="banner-arrow"></span>
            </a>
          )}
          {isNewV2 && (
            <span className="check-v1" onClick={showPositionV1Modal}>
              {intl.get('jlv2.banner.position_v1')}
            </span>
          )}
        </div>
      </div>
    );
  };

  useEffect(() => {
    let timer = getDataInterval();

    return () => {
      clearInterval(timer);
      timer = null;
    };
  }, [userAddress]);

  useEffect(() => {
    if (!isInit && !listLoading && dashboardStore.homeSearchparam) {
      const ele = document.getElementById('market-section');
      ele.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => {
        dashboardStore.setHomeSearchparam('');
      }, 500);
    }
  }, [isInit, dashboardStore.listLoading]);

  useEffect(() => {
    let timer = null;

    if (!isInit) {
      const { homeSearchparam } = dashboardStore;

      if (['supply', 'borrow'].includes(homeSearchparam)) {
        if (homeSearchparam === 'supply') {
          dashboardStore.setActiveTab('supply');
        } else if (homeSearchparam === 'borrow') {
          dashboardStore.setActiveTab('borrow');
        }
      }
    }
    return () => {
      clearInterval(timer);
      timer = null;
    };
  }, [isInit, dashboardStore.homeSearchparam]);

  const positionSkeletonRender = () => {
    return (
      <div className="summary-section">
        <div className="h-default" style={{ marginBottom: '28px' }}>
          <Skeleton
            title={false}
            paragraph={{ rows: 1, width: mobile ? '30%' : '10%' }}
            active
            className="ant-skeleton-thin"
          />
        </div>

        <div className="flex jcsb">
          <div className="data-skeleton">
            <div className="flex h-default" style={{ margin: '10px 0 40px 0' }}>
              <Skeleton
                title={false}
                paragraph={{ rows: 1, width: mobile ? '50%' : '40%' }}
                active
                className="ant-skeleton-thin"
              />
              <Skeleton
                title={false}
                paragraph={{ rows: 1, width: mobile ? '50%' : '40%' }}
                active
                className="ant-skeleton-thin"
              />
            </div>
            <div className="flex h-36" style={{ marginBottom: '50px' }}>
              <Skeleton
                title={false}
                paragraph={{ rows: 1, width: mobile ? '90%' : '70%' }}
                active
                className="ant-skeleton-thin"
              />
              <Skeleton
                title={false}
                paragraph={{ rows: 1, width: mobile ? '90%' : '70%' }}
                active
                className="ant-skeleton-thin"
              />
            </div>
            <div className="flex h-36">
              <Skeleton
                title={false}
                paragraph={{ rows: 1, width: mobile ? '90%' : '70%' }}
                active
                className="ant-skeleton-thin"
              />
              <Skeleton
                title={false}
                paragraph={{ rows: 1, width: mobile ? '90%' : '70%' }}
                active
                className="ant-skeleton-thin"
              />
            </div>
          </div>
          <div className="echart-skeleton">
            <div></div>
          </div>
        </div>
      </div>
    );
  };

  const marketSkeletonRender = () => {
    return (
      <div className="market-skeleton">
        <div className="market-header h-default">
          <Skeleton
            title={false}
            paragraph={{ rows: 1, width: mobile ? '50%' : '30%' }}
            active
            className="ant-skeleton-thin"
          />
          <Skeleton
            title={false}
            paragraph={{ rows: 1, width: mobile ? '80%' : '50%' }}
            active
            className="ant-skeleton-thin"
          />
        </div>
        {listSkeletonRender()}
      </div>
    );
  };

  const listSkeletonRender = () => {
    return (
      <div className="market-content">
        <div className="h-default">
          <Skeleton
            title={false}
            paragraph={{ rows: 1, width: mobile ? '30%' : '15%' }}
            active
            className="ant-skeleton-thin"
          />
        </div>
        <div className="h-default">
          <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="ant-skeleton-thin" />
        </div>
        <div className="h-default">
          <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="ant-skeleton-thin" />
        </div>
        <div className="h-default" style={{ marginBottom: '50px' }}>
          <Skeleton
            title={false}
            paragraph={{ rows: 1, width: mobile ? '30%' : '15%' }}
            active
            className="ant-skeleton-thin"
          />
        </div>
        <div className="h-default" style={{ marginBottom: '30px' }}>
          <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="ant-skeleton-thin" />
        </div>
        <div className="h-default">
          <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="ant-skeleton-thin" />
        </div>
        <div className="h-default">
          <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="ant-skeleton-thin" />
        </div>
        <div className="h-default">
          <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="ant-skeleton-thin" />
        </div>
        <div className="h-default">
          <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="ant-skeleton-thin" />
        </div>
        <div className="h-default">
          <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="ant-skeleton-thin" />
        </div>
        <div className="h-default">
          <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="ant-skeleton-thin" />
        </div>
        <div className="h-default">
          <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="ant-skeleton-thin" />
        </div>
        <div className="h-default">
          <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="ant-skeleton-thin" />
        </div>
        <div className="h-default">
          <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="ant-skeleton-thin" />
        </div>
        <div className="h-default">
          <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="ant-skeleton-thin" />
        </div>
        <div className="h-default">
          <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="ant-skeleton-thin" />
        </div>
        <div className="h-default">
          <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="ant-skeleton-thin" />
        </div>
      </div>
    );
  };

  const initLoading = isInit && (positionLoading || listLoading || chartLoading || miningGateLoading);

  return (
    <>
      <div className={'jlv2-bg home-bg' + (lend.theme === 'white' ? ' white' : '')}>
        <Header instantActions={null} mountedActions={null} />
        <SeasonToolBar pageName="dashboard" />
        <div className="dashboard-banner-bg">
          <div className="dashboard-banner common-container">
            <div className="bs-title">
              <div className="bs-title-text">{intl.get('jlv2.extra.sbmv2')}</div>
              {!mobile ? (
                <video autoPlay="autoPlay" loop="loop" muted playsInline className="v2" id="grants-ip-animation">
                  <source src={V2Dynamic} type="video/webm" />
                </video>
              ) : (
                <div className="v2 v2-icon"></div>
              )}
            </div>
            <div className="bs-des">{intl.get('jlv2.switch_v2_tip')}</div>
            <Link
              to="homeV1"
              className="exchange-btn"
              onClick={() => {
                window.gtag('event', 'PC_back_to_v1', { 'event_category': 'PC_V2', 'event_label': 'back_to_v1' });
                setHomeSearchparam('');
                setActiveTab('supply');
              }}
            >
              {intl.get('jlv2.extra.switch_to_v1')}
              {!mobile && (
                <Tooltip
                  overlayClassName="j-tooltip-dropdown"
                  title={intl.get('jlv2.switch_v1_tip')}
                  placement="top"
                  arrowPointAtCenter
                >
                  <span className="j-tooltip-icon j-info-icon ml-4"></span>
                </Tooltip>
              )}
              {/* <em className="exchange-icon"></em> */}
            </Link>
          </div>
        </div>
        <div className="dashboard-container position-container">
          <div className="common-container">
            {initLoading ? (
              positionSkeletonRender()
            ) : !isConnected ||
              (!BigNumber(totalAssetsV1).gt(0) && !BigNumber(totalAssetsV2).gt(0) && !hasMiningActivity) ? (
              bannerRender()
            ) : !BigNumber(totalAssetsV1).lte(0) && positionData.vaultNew && positionData.borrowNew ? (
              bannerRender({ isNewV2: true })
            ) : (
              <div className="summary-section">
                <div className="summar-title">{intl.get('jlv2.home.my_positions')}</div>
                <div className="summary-version"></div>
                <div className="summary-content">
                  <MyPositionSummary totalAssetsV1={totalAssetsV1} />
                  <RewardsClaimPanel />
                  <BorrowingAndChart totalAssetsV1={totalAssetsV1} />
                </div>
              </div>
            )}
            <div id="market-section">
              {initLoading ? (
                marketSkeletonRender()
              ) : (
                <div className="market-section">
                  <MarketTabs listSkeletonRender={listSkeletonRender} />
                </div>
              )}
            </div>
          </div>
        </div>
        <Footer />
      </div>
      <TabsBar theme={lend.theme} />
      <PositionV1Modal />
    </>
  );
});

export default DashboardPage;
