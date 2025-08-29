import React from 'react';
import isMobile from 'ismobilejs';
import { inject, observer } from 'mobx-react';
import { Tabs, Select, Skeleton } from 'antd';
import intl from 'react-intl-universal';
import Header from '../../components/v2/Header';
import TabsBar from '../../components/v2/mobile/TabsBar';
import SeasonToolBar from '../../components/v2/season/index';
import DepositBorrowRecords from './components/depositBorrowRecords';
import CDPRecords from './components/CDPRecords';
import RentRecords from './components/rentRecords';
import StrxRecords from './components/strxRecords';
import VoteRecords from './components/voteRecords';
import LiquidationRecords from './components/liquidateRecords';
import Footer from '../../components/v2/Footer';
import { BigNumber, getParameterByName, goToPage } from '../../utils/helper';
import { updateLastSeenTime } from './utils/backend';
import '../../assets/css/userRecords.scss';
import '../../assets/css/userRecords-skeleton.scss';
const { TabPane } = Tabs;
const { Option } = Select;

let authTimer = null;
@inject('lend')
@inject('network')
@inject('settings')
@inject('userRecords')
@observer
class UserRecordsPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      mobile: isMobile(window.navigator).any,
      currentTabKey: getParameterByName('tab') === 'liquidate' ? '2' : '1',
      activeDataKey: getParameterByName('tab') === 'liquidate' ? '6' : '1',
      selectOpen: false,
      isMac: true
    };
  }
  componentDidMount = async () => {
    window.gtag('event', 'portfolio_records_PV', {
      'event_category': 'portfolio',
      'event_label': 'portfolio_records_PV'
    });
    window.gtag('event', 'portfolio_records_UV', {
      'event_category': 'portfolio',
      'event_label': 'portfolio_records_UV'
    });
    this.props.network.setData({ routeName: 'userRecords' });
    const { isConnected } = this.props.network;

    await this.props.userRecords.setVariablesInterval();
    document.title = 'Records - JustLend DAO';

    if (isConnected) {
      await this.props.userRecords.setVariablesInterval();
    } else {
      await this.props.network.on('connect', async () => {
        this.props.userRecords.setVariablesInterval();
      });
    }
    this.OSnow();

    this.props.network.on('finishedWalletInit', async () => {
      if (this.props.network.isConnected !== true) {
        goToPage('home');
      }
    });
  };

  authorityJudge = () => {
    const { lang } = this.state;
    const { hasSettingsBetaAuthority, applicationMap } = this.props.lend;

    if ((applicationMap?.settings?.phase === 1 && !hasSettingsBetaAuthority) || !applicationMap?.settings?.switchOn) {
      clearTimeout(authTimer);
      window.location.href = window.location.origin + `/homeNew?lang=${lang}`;
    }
  };

  getUserData = async () => {
    const { isConnected } = this.props.network;

    if (isConnected) {
      authTimer = setTimeout(() => {
        this.authorityJudge();
      }, 3000);
    }
  };

  getLiquidityData = async () => {
    await updateLastSeenTime({
      // accessToken: 'tronsmart',
      account: this.props.network.defaultAccount || window.defaultAccount,
      lastSeenTimestamp: new Date().getTime(),
      accessToken: await this.props.settings.encryptSignInfo('lend')
    });
    await this.props.userRecords.getLiquidityRecordsData();
  };

  componentWillUnmount() {
    this.props.userRecords.clearVariablesInterval();
  }

  OSnow = () => {
    let agent = navigator.userAgent.toLowerCase();
    let isMac = /macintosh|mac os x/i.test(navigator.userAgent);
    if (agent.indexOf('win32') >= 0 || agent.indexOf('wow32') >= 0) {
      this.setState({ isMac: false });
    }
    if (agent.indexOf('win64') >= 0 || agent.indexOf('wow64') >= 0) {
      this.setState({ isMac: false });
    }
    if (isMac) {
      this.setState({ isMac: true });
    }
  };

  tabChange = key => {
    if (key === '1') {
      window.gtag('event', 'portfolio_records_clickUserAuction', {
        'event_category': 'portfolio',
        'event_label': 'portfolio_records_clickUserAuction'
      });
    } else if (key === '2') {
      window.gtag('event', 'portfolio_records_clickLiquidation', {
        'event_category': 'portfolio',
        'event_label': 'portfolio_records_clickLiquidation'
      });
      window.gtag('event', 'portfolio_records_liquidation_PV', {
        'event_category': 'portfolio',
        'event_label': 'portfolio_records_liquidation_PV'
      });
      window.gtag('event', 'portfolio_records_liquidation_UV', {
        'event_category': 'portfolio',
        'event_label': 'portfolio_records_liquidation_UV'
      });
    }
    this.setState({ activeDataKey: key === '1' ? key : '6', currentTabKey: key });
    this.props.userRecords.setData({ currentPageNumber: 1 });
  };

  getRecordsLength = () => {
    const { activeDataKey } = this.state;
    const {
      depositBorrowTotalCount,
      liquidationTotalCount,
      CDPTotalCount,
      rentTotalCount,
      voteTotalCount,
      strxTotalCount
    } = this.props.userRecords;
    if (activeDataKey === '1') return depositBorrowTotalCount ?? 0;
    if (activeDataKey === '2') return strxTotalCount ?? 0;
    if (activeDataKey === '3') return rentTotalCount ?? 0;
    if (activeDataKey === '4') return voteTotalCount ?? 0;
    if (activeDataKey === '5') return CDPTotalCount ?? 0;
    if (activeDataKey === '6') return liquidationTotalCount ?? 0;
    return '--';
  };

  actionTypeSelectOnChange = key => {
    this.setState({ selectOpen: false, activeDataKey: key });
    this.props.userRecords.setData({ currentPageNumber: 1 });
  };

  renderActionRecords = () => {
    const { activeDataKey } = this.state;
    if (activeDataKey === '1') return <DepositBorrowRecords />;
    if (activeDataKey === '2') return <StrxRecords />;
    if (activeDataKey === '3') return <RentRecords />;
    if (activeDataKey === '4') return <VoteRecords />;
    if (activeDataKey === '5') return <CDPRecords />;
  };

  renderSkeleton = () => {
    const { mobile } = this.state;
    if (mobile) {
      return (
        <div className="j-user-records-skeleton mobile">
          <div className="top-title-skeleton-row">
            <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="title-skeleton" />
          </div>
          <div className="top-title-skeleton-row">
            <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="sec-skeleton" />
          </div>
          <div className="content-skeleton-row first">
            <div className="content-title-skeleton-row">
              <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="title-skeleton" />
              <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="title-skeleton sec" />
            </div>
            <div className="content-title-skeleton-row sec">
              <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="title-skeleton" />
              <div className="colomn">
                <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="title-skeleton" />
                <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="title-skeleton sec" />
              </div>
            </div>
          </div>
          <div className="content-skeleton-row">
            <div className="content-title-skeleton-row">
              <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="title-skeleton" />
              <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="title-skeleton sec" />
            </div>
            <div className="content-title-skeleton-row sec">
              <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="title-skeleton" />
              <div className="colomn">
                <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="title-skeleton" />
                <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="title-skeleton sec" />
              </div>
            </div>
          </div>
          <div className="content-skeleton-row">
            <div className="content-title-skeleton-row">
              <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="title-skeleton" />
              <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="title-skeleton sec" />
            </div>
            <div className="content-title-skeleton-row sec">
              <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="title-skeleton" />
              <div className="colomn">
                <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="title-skeleton" />
                <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="title-skeleton sec" />
              </div>
            </div>
          </div>
          <div className="content-skeleton-row">
            <div className="content-title-skeleton-row">
              <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="title-skeleton" />
              <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="title-skeleton sec" />
            </div>
            <div className="content-title-skeleton-row sec">
              <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="title-skeleton" />
              <div className="colomn">
                <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="title-skeleton" />
                <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="title-skeleton sec" />
              </div>
            </div>
          </div>
          <div className="top-title-skeleton-row mt-20">
            <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="title-skeleton" />
          </div>
        </div>
      );
    }
    return (
      <div className="j-user-records-skeleton">
        <div className="top-title-skeleton-row">
          <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="title-skeleton" />
        </div>
        <div className="content-skeleton-row">
          <div className="content-title-skeleton-row">
            <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="title-skeleton" />
            <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="title-skeleton" />
          </div>
          <div className="skeleton-space" />
          <Skeleton title={false} paragraph={{ rows: 7, width: '100%' }} active className="list-skeleton" />
        </div>
      </div>
    );
  };

  render() {
    const { activeDataKey, currentTabKey, mobile, selectOpen, isMac } = this.state;
    const { theme, lang } = this.props.lend;
    const { isLoading } = this.props.userRecords;
    const amount = this.getRecordsLength();

    return (
      <div className={'j-wrapper user-records-page ' + theme}>
        <Header
          // instantActions={this.getLiquidityData}
          mountedActions={this.getLiquidityData}
          classNames={'transparent-bg'}
          hideRecordSign={true}
        ></Header>
        {!isLoading ? (
          <div className="user-records-container">
            <SeasonToolBar pageName="userRecords" />
            <div className="user-records-title">{intl.get('user_records.records')}</div>
            <div className={'user-records-content ' + lang}>
              <Tabs activeKey={currentTabKey} onChange={this.tabChange} className="records-tab">
                <TabPane tab={intl.get('user_records.action_records')} key="1">
                  {mobile && BigNumber(amount).gt(0) && (
                    <span className="statistics">{intl.get('user_records.total_records', { amount })}</span>
                  )}
                  {this.renderActionRecords()}
                </TabPane>
                <TabPane tab={intl.get('liquidation_records.records')} key="2">
                  {mobile && BigNumber(amount).gt(0) && (
                    <span className="statistics">{intl.get('user_records.total_records', { amount })}</span>
                  )}
                  <LiquidationRecords />
                </TabPane>
              </Tabs>
              <div className={'action-types ' + (isMac ? '' : 'not-mac')}>
                {currentTabKey === '1' && (
                  <Select
                    value={activeDataKey}
                    open={selectOpen}
                    dropdownClassName={'user-records-select ' + theme}
                    dropdownMatchSelectWidth={156}
                    onMouseEnter={() => this.setState({ selectOpen: true })}
                    onMouseDown={() => this.setState({ selectOpen: true })}
                    onMouseLeave={() => this.setState({ selectOpen: false })}
                    onChange={e => this.actionTypeSelectOnChange(e)}
                    dropdownAlign={{ offset: [0, 10] }}
                  >
                    <Option value="1">{intl.get('supply_and_borrow_records.supply_and_borrow')}</Option>
                    <Option value="2">{intl.get('strx_records.strx')}</Option>
                    <Option value="3">{intl.get('energy_rental_records.energy_rental')}</Option>
                    <Option value="4">{intl.get('vote_records.vote')}</Option>
                    <Option value="5">{intl.get('cdp_records.cdp')}</Option>
                  </Select>
                )}
                {!mobile && BigNumber(amount).gt(0) && (
                  <span className="statistics">{intl.get('user_records.total_records', { amount })}</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          this.renderSkeleton()
        )}
        <Footer />
        <div>
          <TabsBar theme={theme} />
        </div>
      </div>
    );
  }
}

export default UserRecordsPage;
