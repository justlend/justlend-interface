import { Skeleton } from 'antd';
import { observer } from 'mobx-react';
import React from 'react';
import Stores from '../../stores';
import intl from 'react-intl-universal';
import '../../assets/css/v2/account.scss';
import '../../assets/css/v2/circle.scss';
import MiningReward from '../Modals/v2/MiningReward';
import Reward from '../Modals/v2/Reward';
import RewardModal from './RewardModal';
import RewardValue from './RewardValue';
import RiskValue from './RiskValue';
import UserDataInfo from './UserDataInfo';

const Account = observer(({ isLoading }) => {
  const { network, ui, lend, user } = Stores;

  const { rewardVisible, miningRewardVisible } = ui;
  const { isConnected } = network;
  const { userDepositDataSource: supplyList, userLendDataSource: borrowingList } = user;

  return (
    <>
      <div className="account-v2-container">
        {!isLoading ? (
          <div
            className={
              'account-main-info' +
              (isConnected && (supplyList?.length > 0 || borrowingList?.length > 0) ? ' connected' : '')
            }
          >
            <div className="flexB title">
              <span className="content">{intl.get('v2.account_overview')}</span>
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
        {isConnected && <RewardValue isLoading={isLoading} />}
      </div>
      <RewardModal />
      {miningRewardVisible && <MiningReward />}
      {rewardVisible && <Reward />}
    </>
  );
});

export default Account;
