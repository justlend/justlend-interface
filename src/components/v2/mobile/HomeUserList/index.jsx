import React, { useEffect, useRef } from 'react';
import isMobile from 'ismobilejs';
import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';
import NotConnect from './NotConnect';
import RecommendToken from './RecommendToken';
import Lists from './Lists';
import { RecommendLiquidityStake } from './RecommendLiquidityStake.jsx';
import { BigNumber } from '../../../../utils/helper';
import { Config } from '../../../../config.js';
const { adBannerVisible } = Config;
@inject('network')
@inject('lend')
@inject('pool')
@inject('user')
@observer
class UserList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale
    };
  }

  componentDidMount = async () => {
    const timer = setInterval(() => {
      const targetEl = document.querySelector('#mobile-my-position');
      if (targetEl) {
        clearInterval(timer);
        let isM = isMobile(window.navigator).any;
        if (window.location.hash === '#scrollToMobileTab') {
          const scrollTarget = isM ? 780 : 0;
          window.scrollTo(0, scrollTarget);
          document.body.scrollTop = scrollTarget;
          document.documentElement.scrollTop = scrollTarget;
        }
      }
    }, 1000);
  };

  render() {
    const { isConnected } = this.props.network;
    const { isShowRecommendToken, isShowUSDDUpdateAd, userDepositDataSource, userLendDataSource } = this.props.user;
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
        {depositNum > 0 && !isShowUSDDUpdateAd && adBannerVisible && (
          <RecommendLiquidityStake isUSDDUpdateBanner={true} isTop={true} />
        )}
        {isConnected && (
          <div
            className={
              'j-home-user-list' +
              (!isShowRecommendToken || !isShowUSDDUpdateAd ? '' : ' h-list') +
              (depositNum > 0 ? '' : ' new-user')
            }
          >
            {/*!isConnected && <NotConnect />*/}
            {/*isConnected && depositNum <= 0 && <NotConnect />*/}
            <Lists />
            {/* {isConnected && (depositNum <= 0 ? <NotConnect /> : <Lists />)} */}
            {/* {showRecommendToken && <RecommendToken />} */}
          </div>
        )}
      </>
    );
  }
}

export default UserList;
