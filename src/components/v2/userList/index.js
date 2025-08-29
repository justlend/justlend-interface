import React, { useEffect, useRef } from 'react';
import { Avatar, List, Skeleton, Switch } from 'antd';
import isMobile from 'ismobilejs';
import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';
import NotConnect from './NotConnect';
import RecommendToken from './RecommendToken';
import Lists from './Lists';
import { BigNumber } from '../../../utils/helper';
import '../../../assets/css/v2/userlist.scss';
import { Config } from '../../../config';

@inject('network')
@inject('lend')
@inject('pool')
@observer
class UserList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      mobile: isMobile(window.navigator).any
    };
  }

  render() {
    const { isConnected } = this.props.network;
    const { userDepositDataSource, userLendDataSource, isShowRecommendToken, isShowUSDDUpdateAd, marketDataSource } =
      this.props.lend;
    let depositNum = 0;
    let lendNum = 0;
    // let dataSource = userDepositDataSource?.filter(item => item.account_entered === 1);
    let dataSource = userDepositDataSource;

    if (dataSource && dataSource.length) {
      depositNum = dataSource.length;
    }
    if (userLendDataSource && userLendDataSource.length) {
      lendNum = userLendDataSource.length;
    }

    let lpNum = BigNumber(this.props.pool.poolData['jstlp1'].staked).gt(0) ? 1 : 0;
    let showRecommendToken = isConnected && !isShowRecommendToken && lpNum + depositNum + lendNum <= 3;
    return (
      <>
        {this.props.isLoading ? (
          // isConnected  ? (
          <div className={'j-user-list j-user-list-skeleton'}>
            <Skeleton title={false} paragraph={{ rows: 1, width: '30%' }} active className="top-skeleton"></Skeleton>
            <div className="j-supply-title"></div>
            <Skeleton title={false} paragraph={{ rows: isConnected ? 3 : 1, width: '100%' }} active></Skeleton>
            <div className="j-borrow-title"></div>
            <Skeleton
              title={false}
              paragraph={{ rows: 3, width: '100%' }}
              active
              className="bottom-skeleton"
            ></Skeleton>
          </div>
        ) : (
          <div
            className={
              'j-user-list ' +
              (!!Config.winterThemeVisible ? ' snow-ele-top ' : '') +
              (!isShowRecommendToken || !isShowUSDDUpdateAd ? '' : ' h-list')
            }
          >
            {!isConnected && <NotConnect />}
            {isConnected && depositNum <= 0 && <NotConnect />}
            {isConnected && <Lists />}
            {/* {isConnected && (depositNum <= 0 ? <NotConnect /> : <Lists />)} */}
            {/* {showRecommendToken && <RecommendToken />} */}
          </div>
        )}
      </>
    );
  }
}

export default UserList;
