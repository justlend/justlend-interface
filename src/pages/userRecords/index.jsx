import React from 'react';
import isMobile from 'ismobilejs';
import { inject, observer } from 'mobx-react';
import { Tabs, Select, Skeleton } from 'antd';
import intl from 'react-intl-universal';
import Header from '../../components/v2/Header';
import TabsBar from '../../components/v2/mobile/TabsBar';
import SeasonToolBar from '../../components/v2/season/index';
import DepositBorrowRecords from './components/depositBorrowRecords';
import SBMV2Records from './components/SBMV2Records';
import RentRecords from './components/rentRecords';
import StrxRecords from './components/strxRecords';
import VoteRecords from './components/voteRecords';
import RecordDetail from './components/RecordDetail';
import LiquidationRecords from './components/liquidateRecords';
import Footer from '../../components/v2/Footer';
import { BigNumber, getParameterByName, goToPage } from '../../utils/helper';
import { updateLastSeenTime } from './utils/backend';
import '../../assets/css/userRecords.scss';
import '../../assets/css/userRecords-skeleton.scss';
import '../../assets/css/v2/theme.scss';
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
      activeTab:
        (['SBMV1', 'SBMV2', 'Strx', 'Rent', 'Vote', 'Liquidate'].includes(getParameterByName('tab')) &&
          getParameterByName('tab')) ||
        'SBMV1',
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

    this.props.network.setRouteName('userRecords');
    const { isConnected } = this.props.network;

    // await this.props.userRecords.setVariablesInterval();
    document.title = 'Records - JustLend DAO';

    if (isConnected) {
      await this.props.userRecords.setVariablesInterval();
    } else {
      this.props.lend.getCurrentBlock();
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
    // await this.props.userRecords.getLiquidityRecordsData();
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
    // if (key === '1') {
    window.gtag('event', 'portfolio_records_clickUserAuction', {
      'event_category': 'portfolio',
      'event_label': 'portfolio_records_clickUserAuction'
    });
    
    // } else if (key === '2') {
    //   window.gtag('event', 'portfolio_records_clickLiquidation', {
    //     'event_category': 'portfolio',
    //     'event_label': 'portfolio_records_clickLiquidation'
    //   });
    //   window.gtag('event', 'portfolio_records_liquidation_PV', {
    //     'event_category': 'portfolio',
    //     'event_label': 'portfolio_records_liquidation_PV'
    //   });
    //   window.gtag('event', 'portfolio_records_liquidation_UV', {
    //     'event_category': 'portfolio',
    //     'event_label': 'portfolio_records_liquidation_UV'
    //   });
    // }
    this.setState({ activeTab: key });
    this.props.userRecords.setOneData('currentPageNumber', 1);
  };

  getRecordsLength = () => {
    const { activeTab } = this.state;
    const {
      depositBorrowTotalCount,
      liquidationTotalCount,
      rentTotalCount,
      voteTotalCount,
      strxTotalCount,
      SBMV2TotalCount
    } = this.props.userRecords;
    if (activeTab === 'SBMV1') return depositBorrowTotalCount ?? 0;
    if (activeTab === 'SBMV2') return SBMV2TotalCount ?? 0;
    if (activeTab === 'Strx') return strxTotalCount ?? 0;
    if (activeTab === 'Rent') return rentTotalCount ?? 0;
    if (activeTab === 'Vote') return voteTotalCount ?? 0;
    if (activeTab === 'Liquidate') return liquidationTotalCount ?? 0;
    return '--';
  };

  renderActionRecords = () => {
    const { activeTab } = this.state;
    if (activeTab === 'SBMV1') return <DepositBorrowRecords />;
    if (activeTab === 'SBMV2') return <SBMV2Records />;
    if (activeTab === 'Strx') return <StrxRecords />;
    if (activeTab === 'Rent') return <RentRecords />;
    if (activeTab === 'Vote') return <VoteRecords />;
    if (activeTab === 'Liquidate') return <LiquidationRecords />;
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
            <Skeleton title={false} paragraph={{ rows: 1, width: '120%' }} active className="title-skeleton" />
            <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="title-skeleton" />
          </div>
          <div className="skeleton-space" />
          <Skeleton title={false} paragraph={{ rows: 7, width: '100%' }} active className="list-skeleton" />
        </div>
      </div>
    );
  };

  getTabItems = () => {
    const tabItems = [
      {
        key: 'SBMV1',
        label: intl.get('jlv2.record.sbmv1'),
        desc: intl.getHTML('jlv2.record.record_tips1')
      },
      {
        key: 'SBMV2',
        label: (
          <div className="pr">
            {intl.get('jlv2.record.sbmv2')}
            <em className="records-v2"></em>
          </div>
        ),
        desc: intl.getHTML('jlv2.record.record_tips2'),
        icon: 'JLv2'
      },
      {
        key: 'Strx',
        label: intl.get('jlv2.record.strx'),
        desc: intl.getHTML('jlv2.record.record_tips3')
      },
      {
        key: 'Rent',
        label: intl.get('jlv2.record.tron_resource'),
        desc: intl.getHTML('jlv2.record.record_tips4')
      },
      {
        key: 'Vote',
        label: intl.get('jlv2.record.vote'),
        desc: intl.getHTML('jlv2.record.record_tips5')
      },
      {
        key: 'Liquidate',
        label: intl.get('jlv2.record.liquidate_penalty'),
        desc: intl.getHTML('jlv2.record.record_tips6')
      }
    ];

    return tabItems;
  };

  render() {
    const { activeTab, mobile, selectOpen, isMac } = this.state;
    const { theme, lang } = this.props.lend;
    const { isLoading } = this.props.userRecords;
    const amount = this.getRecordsLength();

    return (
      <div className={'j-wrapper user-records-page ' + theme}>
        <Header
          mountedActions={this.getLiquidityData}
          instantActions={null}
          classNames={'transparent-bg'}
          hideRecordSign={true}
        />
        {!isLoading ? (
          <div className="user-records-container">
            <SeasonToolBar pageName="userRecords" />
            <div className="user-records-title">{intl.get('jlv2.record.transaction_record')}</div>
            <div className={'user-records-content ' + lang}>
              <Tabs activeKey={activeTab} onChange={this.tabChange} className="records-tab">
                {this.getTabItems().map(item => (
                  <TabPane tab={item.label} key={item.key}>
                    <div className="record-desc">{item.desc}</div>
                    {this.renderActionRecords()}
                  </TabPane>
                ))}
              </Tabs>
              {BigNumber(amount).gt(0) && (
                <span className="statistics">{intl.get('user_records.total_records', { amount })}</span>
              )}
            </div>
          </div>
        ) : (
          this.renderSkeleton()
        )}
        <RecordDetail />
        <Footer />
        <div>
          <TabsBar theme={theme} />
        </div>
      </div>
    );
  }
}

export default UserRecordsPage;
