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
const { comingSoonBannerVisible } = Config;
@inject('network')
@inject('lend')
@inject('pool')
@observer
class UserList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale
    };
  }

  render() {
    const { isConnected } = this.props.network;
    const { userDepositDataSource, userLendDataSource, isShowRecommendToken, isShowUSDDUpdateAd } = this.props.lend;
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
        {depositNum > 0 && !isShowUSDDUpdateAd && comingSoonBannerVisible && (
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
