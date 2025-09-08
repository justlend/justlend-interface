import { inject, observer } from 'mobx-react';
import React from 'react';
import '../../../assets/css/v2/energy-rent.scss';
import '../../../assets/css/v2/liquidity-stake.scss';
import '../../../assets/css/v2/rent-order-list.scss';
import EndOrderModal from '../../Modals/v2/energy-rental/EndOrderModal';
import AddOrderModal from '../../Modals/v2/energy-rental/AddOrderModal';
import Footer from '../Footer';
import Header from '../Header';
import TabsBar from '../mobile/TabsBar';
import SeasonToolBar from '../season/index';
import OrderListTable from './OrderListTable';
import TransactionModal from '../../Modals/v2/Transaction';
import DealNoteModal from '../../Modals/v2/energy-rental/DealNote';
import { goToPage } from '../../../utils/helper';

@inject('network')
@inject('lend')
@inject('energyRental')
@observer
class EnergyRentOrderList extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount = async () => {
    const { isConnected } = this.props.network;

    await this.props.lend.getLatestBlockInfo();
    this.props.energyRental.setVariablesInterval();

    window.gtag('event', 'energyrent_pro_orderpage_PV', {
      'event_category': 'energyrent',
      'event_label': 'energyrent_pro_orderpage_PV'
    });
    window.gtag('event', 'energyrent_pro_orderpage_UV', {
      'event_category': 'energyrent',
      'event_label': 'energyrent_pro_orderpage_UV'
    });
  };

  componentWillUnmount() {
    this.props.energyRental.clearVariablesInterval();
  }

  getUserData = async () => {
    // await this.props.network.getNewRentVisible();
    // if (!this.props.network.newRentVisible) goToPage('energy');
    await this.props.energyRental.getUserTrxBalance();
    await this.props.energyRental.getUserData();

    this.props.network.on('connect', async () => {
      await this.props.energyRental.getUserTrxBalance();
      await this.props.energyRental.getUserData();
    });

    this.props.network.on('chainChanged', async () => {
      await this.props.energyRental.getUserTrxBalance();
      await this.props.energyRental.getUserData();
      await this.props.energyRental.getMarketData();
      await this.props.energyRental.getCommonRentInfos();
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
    const { theme } = this.props.lend;

    return (
      <div className={'j-wrapper ' + theme}>
        <Header instantActions={this.getMarketData} mountedActions={this.getUserData}></Header>
        <SeasonToolBar pageName="energyRent" />
        <div
          className={
            'j-stake-container j-energy-rent modal-appender' +
            (this.props.energyRental.addOrderModalVisible ? ' high-level-container' : '')
          }
        >
          <OrderListTable />
        </div>
        <div
          className={
            'modal-appender j-deal-note-modal-appender' +
            (this.props.energyRental.dealNoteShow ? ' high-level-container' : '')
          }
        ></div>
        <TabsBar theme={theme} />
        <Footer></Footer>

        {this.props.energyRental.endOrderModalVisible && <EndOrderModal />}
        {!this.props.energyRental.addOrderModalVisible && <TransactionModal />}
        {this.props.energyRental.addOrderModalVisible && <AddOrderModal />}
        <DealNoteModal />
      </div>
    );
  }
}

export default EnergyRentOrderList;
