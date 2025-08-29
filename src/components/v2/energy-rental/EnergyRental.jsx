import React from 'react';

import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';
import classnames from 'classnames';
import BigNumber from 'bignumber.js';
import { Skeleton } from 'antd';

import { getQueryObj, goToPage } from '../../../utils/helper';

import Header from '../Header';
import SeasonToolBar from '../season/index';
import Footer from '../Footer';
import TabsBar from '../mobile/TabsBar';
import TransactionModal from '../../Modals/v2/Transaction';

import RentPausedModal from '../../Modals/strx/RentPaused';
import AllowanceModal from '../../Modals/strx/Allowance';

import EnergyRentalPageHeader from './EnergyRentalPageHeader';
import RentalForm from './RentalForm';
import RentalOrderMiniList from './RentalOrderMiniList';
import EnergySubsidyBar from './EnergySubsidyBar';
import RentalTips from './RentalTips';
import RentalMarketData from './RentalMarketData';

import FirstVisitModal from '../../Modals/v2/energy-rental/FirstVisitModal';
import DealNoteModal from '../../Modals/v2/energy-rental/DealNote';

import '../../../assets/css/v2/energy-rental/energy-rental.scss';
import '../../../assets/css/v2/theme.scss';

@inject('network')
@inject('lend')
@inject('system')
@inject('pool')
@inject('energyRental')
@observer
class EnergyRental extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: getQueryObj()?.lang || window.localStorage.getItem('lang') || intl.options.currentLocale
    };
  }

  componentDidMount = async () => {
    window.localStorage.setItem('lastVisitEnergyRentalPage', 'energyRental');

    const { isConnected } = this.props.network;

    await this.props.lend.getLatestBlockInfo();
    this.props.energyRental.setVariablesInterval();
    document.title = 'Energy Rental - JustLend DAO';

    if (isConnected) {
      this.props.energyRental.getMiniOrderList();
    } else {
      this.props.network.on('connect', async () => {
        this.props.energyRental.getMiniOrderList();
      });
    }
    window.gtag('event', 'energyrent_pro_PV', { 'event_category': 'energyrent', 'event_label': 'energyrent_pro_PV' });
    window.gtag('event', 'energyrent_pro_UV', { 'event_category': 'energyrent', 'event_label': 'energyrent_pro_UV' });

    // For public testing period only
    const didVisitNewRentalPage = window.localStorage.getItem('didVisitNewRentalPage');
    if (didVisitNewRentalPage == null || didVisitNewRentalPage == 'false') {
      window.localStorage.setItem('didVisitNewRentalPage', 'true');

      this.props.energyRental.setData({
        firstVisitModalVisible: true
      });
    }
  };

  componentWillUnmount() {
    this.props.system.clearRejectError();
    this.props.energyRental.clearVariablesInterval();
  }

  getUserData = async () => {
    await this.props.energyRental.getUserTrxBalance();
    await this.props.energyRental.getMultiReward();
    await this.props.energyRental.getUserData();
    await this.props.energyRental.getMiniOrderList();

    this.props.network.on('connect', async () => {
      await this.props.energyRental.getUserTrxBalance();
      await this.props.energyRental.getMultiReward();
      await this.props.energyRental.getUserData();
      await this.props.energyRental.getMiniOrderList();
    });

    this.props.network.on('chainChanged', async () => {
      await this.props.energyRental.getUserTrxBalance();
      await this.props.energyRental.getMultiReward();
      await this.props.energyRental.getUserData();
      await this.props.energyRental.getCommonRentInfos();
      await this.props.energyRental.getMiniOrderList();
    });
  };

  getMarketData = async () => {
    try {
      this.props.energyRental.getMarketData();
      this.props.energyRental.getCommonRentInfos();
    } catch (e) {
      console.log('error: getMarketData');
    }
  };

  render() {
    const { isConnected, finishedWalletInit } = this.props.network;
    const { theme } = this.props.lend;

    const { kink, marketData, isGettingMiniOrderList, orderListTotalCount, miniReceiverTotal } =
      this.props.energyRental;

    let orderListTotalCountNew =
      BigNumber(orderListTotalCount).isNaN() || BigNumber(orderListTotalCount).lt(0) ? 0 : orderListTotalCount;
    let miniReceiverTotalNew =
      BigNumber(miniReceiverTotal).isNaN() || BigNumber(miniReceiverTotal).lt(0) ? 0 : miniReceiverTotal;

    const haveExistingOrder = orderListTotalCountNew + miniReceiverTotalNew > 0;

    const currentItem = marketData && marketData.model && marketData.model.find(x => x.current === true);
    const utilizationRate = currentItem ? currentItem.base * 100 : '--';
    const isUtilizationAboveKink = utilizationRate !== '--' && BigNumber(utilizationRate).gte(kink);

    return (
      <>
        <div className={'j-wrapper ' + theme}>
          <div className="energy-rental-page-bg"></div>

          <Header
            instantActions={this.getMarketData}
            mountedActions={this.getUserData}
            classNames={'transparent-bg'}
          ></Header>
          <SeasonToolBar pageName="energyRental" />

          {!isGettingMiniOrderList || (finishedWalletInit && !isConnected) ? (
            <div
              className={
                'j-energy-rental-container modal-appender' +
                (this.props.energyRental.addOrderModalVisible ? ' high-level-container' : '')
              }
            >
              <EnergyRentalPageHeader wideLayout={haveExistingOrder} />

              <div className={classnames('rental-content-container', { 'show-mini-list': haveExistingOrder })}>
                <RentalForm
                  showSectionHeader={haveExistingOrder}
                  currentRentalPrice={marketData.trx1wEnergy * 100}
                  isUtilizationAboveKink={isUtilizationAboveKink}
                />
                {haveExistingOrder && <RentalOrderMiniList />}
              </div>

              <EnergySubsidyBar />
              <RentalTips />
              <RentalMarketData data={marketData} utilizationRate={utilizationRate}></RentalMarketData>
            </div>
          ) : (
            <div className="j-energy-rental-container energy-rental-skeleton">
              <div className="page-title-skeleton-container">
                <Skeleton title={false} paragraph={{ rows: 1, width: '50%' }} active />
                <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
              </div>
              <div className="rental-content-skeleton-group">
                <div className="rental-form-skeleton-container skeleton-container-background">
                  <div className="form-skeleton-bg"></div>
                  <div className="form-title-skeleton-row">
                    <Skeleton title={false} paragraph={{ rows: 1, width: '45%' }} active />
                  </div>
                  <div className="form-content-skeleton-group">
                    <div className="form-content-skeleton-row">
                      <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                      <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                    </div>

                    <Skeleton
                      title={false}
                      paragraph={{ rows: 1, width: '100%' }}
                      active
                      className="thick-skeleton dark"
                    />

                    <Skeleton title={false} paragraph={{ rows: 1, width: '50%' }} active />
                    <Skeleton title={false} paragraph={{ rows: 1, width: '50%' }} active />

                    <div className="form-content-skeleton-row tall-row">
                      <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                      <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                      <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                      <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                    </div>

                    <Skeleton title={false} paragraph={{ rows: 1, width: '50%' }} active />

                    <div className="rent-info-skeleton-group">
                      <Skeleton title={false} paragraph={{ rows: 2, width: '100%' }} active />
                      <Skeleton title={false} paragraph={{ rows: 2, width: '100%' }} active />
                    </div>

                    <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="thick-skeleton" />
                    <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="thick-skeleton" />
                  </div>
                </div>

                <div className="mini-list-skeleton-container skeleton-container-background">
                  <div className="list-title-skeleton-row">
                    <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                    <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                  </div>

                  <div className="order-skeleton-group">
                    <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                    <div className="order-content-skeleton-group">
                      <Skeleton title={false} paragraph={{ rows: 3, width: '100%' }} active />
                      <Skeleton title={false} paragraph={{ rows: 3, width: '100%' }} active />
                    </div>
                  </div>

                  <div className="order-skeleton-group">
                    <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                    <div className="order-content-skeleton-group">
                      <Skeleton title={false} paragraph={{ rows: 3, width: '100%' }} active />
                      <Skeleton title={false} paragraph={{ rows: 3, width: '100%' }} active />
                    </div>
                  </div>

                  <div className="list-link-skeleton-row">
                    <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                  </div>
                </div>
              </div>

              <div className="subsidies-skeleton-container skeleton-container-background">
                <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="left-skeleton" />
                <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="right-skeleton" />
              </div>

              <div className="tips-skeleton-container skeleton-container-background">
                <div className="tips-title-skeleton-row">
                  <Skeleton title={false} paragraph={{ rows: 1, width: '45%' }} active />
                </div>

                <div className="tips-content-skeleton-group">
                  <div className="left-group">
                    <Skeleton title={false} paragraph={{ rows: 2, width: '100%' }} active />
                  </div>
                  <div className="right-group">
                    <Skeleton title={false} paragraph={{ rows: 2, width: '100%' }} active />
                  </div>
                </div>
              </div>
              <div className="market-data-skeleton-container skeleton-container-background">
                <div className="price-and-chart-skeleton-group">
                  <div className="left-group">
                    <Skeleton title={false} paragraph={{ rows: 4, width: '100%' }} active />
                  </div>
                  <div className="right-group">
                    <Skeleton title={false} paragraph={{ rows: 2, width: '100%' }} active />
                  </div>
                </div>

                <div className="market-stat-skeleton">
                  <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                  <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                  <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                </div>
              </div>
            </div>
          )}
          <div
            className={
              'modal-appender j-deal-note-modal-appender' +
              (this.props.energyRental.dealNoteShow ? ' high-level-container' : '')
            }
          ></div>
          <Footer></Footer>
        </div>

        <RentPausedModal />
        <AllowanceModal store="energyRental" />
        {!this.props.energyRental.addOrderModalVisible && <TransactionModal />}
        <FirstVisitModal />
        <TabsBar theme={theme} />

        <DealNoteModal />
      </>
    );
  }
}

export default EnergyRental;
