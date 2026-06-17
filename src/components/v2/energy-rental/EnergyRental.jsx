import React from 'react';

import { inject, observer } from 'mobx-react';
import classnames from 'classnames';
import BigNumber from 'bignumber.js';
import { Skeleton } from 'antd';
import isMobile from 'ismobilejs';

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

import PriceSkeletonImg from '../../../assets/images/v2/energy-rental/energy-price-skeleton.svg';
import PriceWhiteSkeletonImg from '../../../assets/images/v2/energy-rental/energy-price-skeleton-white.svg';
import PoolSkeletonImg from '../../../assets/images/v2/energy-rental/energy-pool-skeleton.svg';
import PoolWhiteSkeletonImg from '../../../assets/images/v2/energy-rental/energy-pool-skeleton-white.svg';

import DealNoteModal from '../../Modals/v2/energy-rental/DealNote';
import '../../../assets/css/v2/userlist.scss';
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
      mobile: isMobile(window.navigator).any
    };
  }

  componentDidMount = async () => {
    window.localStorage.setItem('lastVisitEnergyRentalPage', 'energyRental');

    const { isConnected } = this.props.network;

    await this.props.lend.getLatestBlockInfo();
    await this.props.energyRental.getUsageChargeRatioData();
    this.props.energyRental.setVariablesInterval();
    document.title = 'Energy Rental - JustLend DAO';

    if (isConnected) {
      this.props.energyRental.getMiniOrderList();
    } else {
      this.props.energyRental.setData({ isGettingMiniOrderList: false });
      this.props.network.on('connect', async () => {
        this.props.energyRental.getMiniOrderList();
      });
    }
    window.gtag('event', 'energyrent_pro_PV', { 'event_category': 'energyrent', 'event_label': 'energyrent_pro_PV' });
    window.gtag('event', 'energyrent_pro_UV', { 'event_category': 'energyrent', 'event_label': 'energyrent_pro_UV' });
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
    const { mobile } = this.state;
    const { theme, lang } = this.props.lend;

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
    const isWhiteTheme = theme === 'white';

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
          {!isGettingMiniOrderList ? (
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
                <div className="flex-between">
                  <Skeleton title={false} paragraph={{ rows: 1, width: '30%' }} active />
                  <Skeleton title={false} paragraph={{ rows: 1, width: '20%' }} active />
                </div>
                <div className="flex-between">
                  <Skeleton title={false} paragraph={{ rows: 1, width: '70%' }} active />
                  <Skeleton title={false} paragraph={{ rows: 1, width: '50%' }} active />
                </div>
              </div>
              <div className={`rental-content-skeleton-group ${isUtilizationAboveKink ? 'tip-skeleton' : ''}`}>
                <div className="rental-form-skeleton-container skeleton-container-background">
                  <div className="form-skeleton-bg"></div>
                  <div className="form-title-skeleton-row">
                    <Skeleton title={false} paragraph={{ rows: 1, width: '15%' }} active />
                  </div>
                  <div className="form-content-skeleton-group">
                    <Skeleton
                      title={false}
                      paragraph={{ rows: 1, width: '100%' }}
                      active
                      className="thick-skeleton dark"
                    />
                    <Skeleton title={false} paragraph={{ rows: 1, width: '10%' }} active />
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
                    {isUtilizationAboveKink && <Skeleton title={false} paragraph={{ rows: 1, width: '30%' }} active />}
                    <Skeleton
                      title={false}
                      paragraph={{ rows: 1, width: '100%' }}
                      active
                      className="thick-skeleton large-btn-skeleton"
                    />
                  </div>
                </div>
              </div>

              <div className={`tips-skeleton-container skeleton-container-background ${lang === 'en-US' ? 'en' : ''}`}>
                <div className="tips-title-skeleton-row">
                  <Skeleton title={false} paragraph={{ rows: 1, width: '20%' }} active />
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
                <div className="market-data-title-skeleton-row">
                  <Skeleton title={false} paragraph={{ rows: 1, width: 200 }} active />
                </div>
                <div className="price-and-chart-skeleton-group">
                  <div className="left-group">
                    <Skeleton title={false} paragraph={{ rows: 3, width: '100%' }} active />
                  </div>
                  <div className="right-group">
                    <img src={isWhiteTheme ? PriceWhiteSkeletonImg : PriceSkeletonImg} />
                  </div>
                </div>

                <div className="market-stat-skeleton">
                  {/* <div className="market-stat-skeleton-tabs">
                    <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                    <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                  </div> */}
                  <div className="flex-center">
                    <div className="market-stat-skeleton-left">
                      <div className="market-stat-skeleton-top">
                        <div>
                          <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                          <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                          <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                        </div>
                        <div className="flex">
                          <div>
                            <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                            <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                          </div>
                          <div>
                            <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                            <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                          </div>
                          <div>
                            <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                            <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                          </div>
                        </div>
                      </div>
                      <div className="market-stat-skeleton-bottom">
                        <img src={isWhiteTheme ? PoolWhiteSkeletonImg : PoolSkeletonImg} />
                        <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                      </div>
                      {mobile && (
                        <div className="market-stat-skeleton-legend">
                          <div className="market-stat-skeleton-legend-item">
                            <Skeleton title={false} paragraph={{ rows: 1, width: '70%' }} active />
                            <Skeleton title={false} paragraph={{ rows: 1, width: '90%' }} active />
                          </div>
                          <div className="market-stat-skeleton-legend-item">
                            <Skeleton title={false} paragraph={{ rows: 1, width: '70%' }} active />
                            <Skeleton title={false} paragraph={{ rows: 1, width: '90%' }} active />
                          </div>
                          <div className="market-stat-skeleton-legend-item">
                            <Skeleton title={false} paragraph={{ rows: 1, width: '70%' }} active />
                            <Skeleton title={false} paragraph={{ rows: 1, width: '90%' }} active />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="market-stat-skeleton-right">
                      <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                      <div className="user-info-skeleton-item">
                        <div>
                          <Skeleton.Avatar active shape="square" size={35} />
                          <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                          <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                        </div>
                        <div>
                          <Skeleton.Avatar active shape="square" size={35} />
                          <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                          <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active />
                        </div>
                      </div>
                    </div>
                  </div>
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
        {/* <FirstVisitModal /> */}
        <TabsBar theme={theme} />

        <DealNoteModal />
      </>
    );
  }
}

export default EnergyRental;
