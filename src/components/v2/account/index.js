import { Skeleton } from 'antd';
import isMobile from 'ismobilejs';
import { inject, observer } from 'mobx-react';
import React from 'react';
import intl from 'react-intl-universal';
import '../../../assets/css/v2/account.scss';
import '../../../assets/css/v2/circle.scss';
import OuterCircleWhiteMobileDefault from '../../../assets/images/v2/white-theme/account/outer-circle-m-default.svg';
import MiningReward from '../../Modals/v2/MiningReward';
import Reward from '../../Modals/v2/Reward';
import RewardModal from './RewardModal';
import RewardValue from './RewardValue';
import RiskValue from './RiskValue';
import UserDataInfo from './UserDataInfo';

@inject('network')
@inject('lend')
@observer
class Account extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      angle: -0.25,
      hoverStatus: false
    };
  }

  render() {
    const { isConnected, rewardVisible, miningRewardVisible } = this.props.network;
    const { userDepositDataSource: supplyList, userLendDataSource: borrowingList, marketDataSource } = this.props.lend;
    return (
      <>
        <div className="account-v2-container">
          {!this.props.isLoading ? (
            <div
              className={
                'account-main-info' +
                (isConnected && (supplyList?.length > 0 || borrowingList?.length > 0) ? ' connected' : '')
              }
            >
              <div className="flexB title">
                <span className="content">{intl.get('v2.account_overview')}</span>
                {/* <Tooltip
                title={intl.getHTML('index.acc_helphover')}
                arrowPointAtCenter
                placement="bottomRight"
                overlayClassName="j-tooltip-dropdown"
              >
                <span className="j-tooltip-icon j-info-icon"></span>
              </Tooltip> */}
              </div>
              <RiskValue />
              {isConnected && (supplyList?.length > 0 || borrowingList?.length > 0) && (
                <section className="countDatas">
                  <UserDataInfo />
                </section>
              )}
            </div>
          ) : (
            <div className="skeleton-loader" style={{ borderRadius: '10px' }}>
              <Skeleton title={false} paragraph={{ rows: 1, width: '155px' }} active className="ant-skeleton-thin" />
              <div className="skeleton-chart">
                <div className="circle-bg">
                  <Skeleton title={0} paragraph={{ rows: 2, width: '100%' }} active />
                </div>
                <Skeleton title={0} paragraph={{ rows: 4, width: '100%' }} active />
              </div>
              <div className="skeleton-line" />
              <div className="skeleton-chart" style={{ borderRadius: '10px' }}>
                <Skeleton title={false} paragraph={{ rows: 4, width: '100%' }} active />
                <Skeleton title={false} paragraph={{ rows: 2 }} active className="ant-skeleton-thick" />
              </div>
            </div>
          )}
          {isConnected && <RewardValue isLoading={this.props.isLoading} />}
        </div>
        <RewardModal />
        {miningRewardVisible && <MiningReward />}
        {rewardVisible && <Reward />}
      </>
    );
  }
}

export default Account;
