import React from 'react';
import { Link } from 'react-router-dom';
import intl from 'react-intl-universal';
import isMobile from 'ismobilejs';
import { inject, observer } from 'mobx-react';
import { Skeleton } from 'antd';
import Config from '../../config';
import Header from './Header';
import SeasonToolBar from './season/index';
import Footer from './Footer';
import Account from './account';
import UserList from './userList';
import HomeMarket from './HomeMarket';
import HomeM from './mobile/Home';
import DAW from '../Modals/v2/DAW';
import BorrowModal from '../Modals/v2/Borrow';
import WinterTheme from '../WinterTheme';
import DAWMobile from '../Modals/v2/DAWMobile';
import BorrowModalMobile from '../Modals/v2/BorrowMobile';
import CollateralLimit from '../Modals/v2/CollateralLimit';
import TransactionModal from '../Modals/v2/Transaction';

import { getAnnoucements } from '../../utils/backend';
import { getQueryObj } from '../../utils/helper';
import '../../assets/css/v2/home.scss';
import '../../assets/css/v2/theme.scss';

@inject('network')
@inject('lend')
@inject('system')
@inject('pool')
@observer
class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      mobile: isMobile(window.navigator).any,
      announcementList: {},
      didGetAnnouncements: false
    };
  }
  componentDidMount = async () => {
    // const { mobile } = this.state;
    // if (mobile) {
    //   window.location.href = window.location.origin + (window.location?.pathname || '') + '#/home';
    // }

    document.title = `JustLend DAO | JustLend DAO is the first official lending platform on TRON where users can borrow, lend, deposit assets
    and earn interests.`;
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    }, 2000);

    this.props.lend.setVariablesInterval();
    this.props.pool.setVariablesInterval();
    await this.props.network.getNowTime();
    this.props.network.getCountTime();
    let lang = 'en-US';
    // let lang = getQueryObj()?.lang || window.localStorage.getItem('lang') || intl.options.currentLocale || 'en-US';
    let announcementList = await getAnnoucements({ perPageCount: 3, lang });
    this.setState({ announcementList: announcementList[0], didGetAnnouncements: true });
  };

  componentWillUnmount() {
    this.props.lend.clearVariablesInterval();
    this.props.pool.clearVariablesInterval();
  }

  getUserData = async () => {
    this.props.lend.getRecomendToken();
    await this.props.lend.getMultiReward();
    await this.props.lend.getMintInfo();
    await this.props.lend.getUserData();
    await this.props.lend.getUserDataFromMarkets();
    await this.props.lend.getTokenBalanceInfo();
    await this.props.lend.getEnergyFee();
    if (this.props.network.isConnected) {
      this.props.lend.getRiojBalance();
      this.props.lend.getContinueDisabledStatus();
    }
  };

  getMarketData = async () => {
    this.props.lend.getRiojCheck();
    this.props.lend.getMintPaused();
    this.props.lend.getPaused();
    this.props.lend.getAmountLimit();
    await this.props.lend.getMintInfo();
    await this.props.lend.getMarketData();
    await this.props.lend.getDashboardData();
    await this.props.pool.getPoolData();
    await this.props.pool.getTronbullish();
  };

  render() {
    const { DAWPop, borrowModalInfo, theme, userDepositDataSource, marketDataSource, totalCollateralShow } =
      this.props.lend;
    const { mobile, announcementList, didGetAnnouncements, activeKey } = this.state;
    const { isConnected, initConnection } = this.props.network;

    let isLoading = !marketDataSource || !userDepositDataSource || !announcementList;
    if (mobile || (!isConnected && initConnection)) {
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
          <Header instantActions={this.getMarketData} mountedActions={this.getUserData}></Header>
          <SeasonToolBar pageName="home" />
          {!mobile ? (
            <>
              <div className="j-container j-home">
                <div className="j-subhead">
                  {!isLoading ? (
                    <div className="j-title">{intl.get('v2.lend_title')}</div>
                  ) : (
                    <Skeleton className="tall-skeleton" title={false} paragraph={{ rows: 1, width: '100px' }} active />
                  )}
                  <div className="info">
                    {!isLoading ? (
                      <div className="desc">{intl.get('strx.stake_home_desc')}</div>
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
                          >
                            {announcementList.title}（{announcementList?.created_at?.substr(0, 10)}）
                          </a>
                          <span className="announce-arrow-icon"></span>
                        </div>
                      )
                    ) : (
                      <div className="j-announce-skeleton">
                        <span className="announce-icon"></span>
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
              </div>
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
  }
}

export default Home;
