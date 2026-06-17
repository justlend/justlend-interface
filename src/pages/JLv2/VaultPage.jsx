// src/pages/VaultPage.jsx
import React, { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react';
import { Link } from 'react-router-dom';
import { Skeleton } from 'antd';
import isMobile from 'ismobilejs';
import { useLocation } from 'react-router-dom';
import Store from '../../stores';

import Header from '../../components/v2/Header';
import Footer from '../../components/v2/Footer';
import TabsBar from '../../components/v2/mobile/TabsBar';
import SeasonToolBar from '../../components/v2/season/index';
import { VaultHeader } from '../../components/JLv2/Vault/VaultHeader';
import { VaultOverviewStat } from '../../components/JLv2/Vault/VaultOverviewStat';
import { MyVaultPosition } from '../../components/JLv2/Vault/VaultInteractionPanel';
import { VaultHistoricalChart } from '../../components/JLv2/Vault/VaultHistoricalChart';
import { MarketAllocationList } from '../../components/JLv2/Vault/MarketAllocationList';
import { VaultInfo } from '../../components/JLv2/Vault/VaultInfo';
import { ActionBox } from '../../components/JLv2/Vault/ActionBox';
import { TransactionModal } from '../../components/JLv2/TransactionModal';
import { preloadMiningResolver } from '../../utils/hooks/useMining';
import ChartSkeleton from '../../assets/images/JLv2/vault/chart-skeleton.svg';
import ChartWhiteSkeleton from '../../assets/images/JLv2/vault/chart-skeleton-white.svg';
import { emptyReactNodeNew } from '../../utils/helper';
import '../../assets/css/JLv2/common.scss';
import '../../assets/css/JLv2/vault.scss';
import '../../assets/css/v2/theme.scss';

const VaultPage = observer(() => {
  const { vaultStore, network, lend, dashboardStore } = Store;
  const location = useLocation();
  const userAddress = network?.defaultAccount || window?.defaultAccount;

  const [positionFixed, setPositionFixed] = useState(false);
  const [mobile] = useState(isMobile(window.navigator).any);

  useEffect(() => {
    document.title = 'Vault V2- JustLend DAO';
    window.gtag('event', 'PC_vault_detail', { 'event_category': 'PC_V2', 'event_label': 'vault_detail' });
    lend.getCurrentBlock();
    preloadMiningResolver();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const vaultAddress = params.get('address');

    if (vaultAddress) {
      vaultStore.fetchAllVaultData(vaultAddress, userAddress);
    }

    let timer = vaultStore.getDataInterval(vaultAddress, userAddress);

    return () => {
      clearInterval(timer);
      timer = null;
    };
  }, [vaultStore, location.search, userAddress]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const scrollEvent = () => {
      const rects = document.querySelector('.mp-content')?.getClientRects();

      if (rects?.[0]?.top <= 84) {
        setPositionFixed(true);
      } else {
        setPositionFixed(false);
      }
    };
    window.addEventListener('scroll', scrollEvent);
    return () => window.removeEventListener('scroll', scrollEvent);
  }, []);

  const renderSkeleton = () => {
    return (
      <div className="common-page-content common-page-skeleton">
        <div className="vault-detail-skeletons">
          <div className="skeleton-row title-skeleton-row">
            <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="title-skeleton" />
            <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="normal-skeleton" />
          </div>
          <div className="skeleton-row data-skeleton-row">
            <Skeleton title={false} paragraph={{ rows: 2, width: '100%' }} active className="normal-skeleton" />
          </div>
          {mobile && (
            <div id="vaultAction" className={'mp-action-content' + (positionFixed ? ' fixed' : '')}>
              <ActionBox />
            </div>
          )}
          <div className="content-skeleton-row">
            <div className="skeleton-row content-title-skeleton-row">
              <Skeleton
                title={false}
                paragraph={{ rows: 1, width: '100%' }}
                active
                className="normal-skeleton content-title-skeleton"
              />
              <div className="border-line" />
              <Skeleton title={false} paragraph={{ rows: 3, width: '100%' }} active className="normal-skeleton" />
            </div>
          </div>
          <div className="content-skeleton-row">
            <div className="skeleton-row content-title-skeleton-row">
              <Skeleton
                title={false}
                paragraph={{ rows: 1, width: '100%' }}
                active
                className="normal-skeleton content-title-skeleton"
              />
              <div className="border-line" />
              <Skeleton title={false} paragraph={{ rows: 2, width: '100%' }} active className="normal-skeleton" />
              <img
                className="chart-skeleton"
                src={lend.theme === 'white' ? ChartWhiteSkeleton : ChartSkeleton}
                alt=""
              />
            </div>
          </div>
          <div className="content-skeleton-row big-content-skeleton-row">
            <div className="skeleton-row content-title-skeleton-row">
              <Skeleton
                title={false}
                paragraph={{ rows: 1, width: '100%' }}
                active
                className="content-title-skeleton"
              />
              <div className="border-line" />
              <Skeleton title={false} paragraph={{ rows: 5, width: '100%' }} active className="normal-skeleton" />
            </div>
          </div>
          <div className="content-skeleton-row big-content-skeleton-row">
            <div className="skeleton-row content-title-skeleton-row">
              <Skeleton
                title={false}
                paragraph={{ rows: 1, width: '100%' }}
                active
                className="content-title-skeleton"
              />
              <div className="border-line" />
              <Skeleton title={false} paragraph={{ rows: 7, width: '100%' }} active className="normal-skeleton" />
            </div>
          </div>
        </div>
        {!mobile && (
          <div id="vaultAction" className={'mp-action-content' + (positionFixed ? ' fixed' : '')}>
            <ActionBox />
          </div>
        )}
      </div>
    );
  };

  if (vaultStore.isLoading) {
    return (
      <div className={'jlv2-bg vault-bg ' + lend.theme}>
        <Header instantActions={null} mountedActions={null} />
        <SeasonToolBar pageName="vault" />
        <div className="vault-page-container common-page-container">
          <Link onClick={() => dashboardStore.setHomeSearchparam('supply')} className="return-back" to="homeNew">
            {intl.get('jlv2.back_to_home')}
          </Link>
          {renderSkeleton()}
        </div>
      </div>
    );
  }

  if (vaultStore.vaultAddressError) {
    return (
      <div className={'jlv2-bg vault-bg jlv2-error-bg ' + lend.theme}>
        <Header instantActions={null} mountedActions={null} />
        <SeasonToolBar pageName="vault" />
        <div className="vault-page-container common-page-container">
          <Link onClick={() => dashboardStore.setHomeSearchparam('supply')} className="return-back" to="homeNew">
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
      <div className={'jlv2-bg vault-bg ' + lend.theme}>
        <Header instantActions={null} mountedActions={null} />
        <SeasonToolBar pageName="vault" />
        <div className="vault-page-container common-page-container">
          <VaultHeader />
          <VaultOverviewStat />
          <div className="common-page-content vault-page-content">
            <div className="mp-content">
              <MyVaultPosition />
              <VaultHistoricalChart />
              <MarketAllocationList />
              <VaultInfo />
            </div>
            <div id="vaultAction" className={'mp-action-content' + (positionFixed ? ' fixed' : '')}>
              <ActionBox />
            </div>
          </div>
          <TransactionModal />
        </div>
        <Footer />
      </div>
      <TabsBar theme={lend.theme} />
    </>
  );
});

export default VaultPage;
