import React from 'react';
import { inject, observer } from 'mobx-react';
import intl from 'react-intl-universal';
import Config from '../../../config';
import isMobile from 'ismobilejs';
import { Skeleton, Tooltip } from 'antd';
import {
  formatNumber,
  BigNumber,
  getTotalMint,
  calcCurrentPhaseDisplay,
  getParameterByName
} from '../../../utils/helper';
import WaitingReward from '../../../assets/images/v2/account/reward-btn.svg';
import WaitingRewardWhite from '../../../assets/images/v2/white-theme/account/reward-btn.svg';
const { miningSymbol } = Config;

@inject('network')
@inject('ui')
@inject('lend')
@inject('pool')
@inject('user')
@observer
class RiskValue extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      mobile: isMobile(window.navigator).any,
      collapsed: false
    };
  }

  getTotalMortgage = () => {
    const { userDepositDataSource } = this.props.user;
    let totalMortgage = BigNumber(0);
    if (userDepositDataSource && userDepositDataSource.length > 0) {
      userDepositDataSource.map((item, index) => {
        if (item.account_entered) {
          totalMortgage = totalMortgage.plus(BigNumber(item.deposited_usd));
        }
      });
    }
    return formatNumber(totalMortgage, 3, { miniText: 0.001, needDolar: true });
  };

  render() {
    const { theme, openMint } = this.props.lend;
    const {
      isShowRecommendToken,
      isShowUSDDUpdateAd,
      userDepositDataSource: supplyList,
      userLendDataSource: borrowingList,
      inFreezeNum,
      transferringSoonNum,
      USDDMiningStatus,
      currPhase,
      totalReward
    } = this.props.user;
    const { mobile } = this.state;

    const processingPhase = BigNumber(currPhase).minus(1).toString();

    const phaseDisplay = calcCurrentPhaseDisplay(processingPhase);

    const isWhite = theme === 'white';

    const recommendStr = window.localStorage.getItem('recommandToken');
    let recommandToken = {};
    if (recommendStr) recommandToken = JSON.parse(recommendStr);

    let totalRewardNew = BigNumber(totalReward).isNaN() ? 0 : totalReward;
    let inFreezeNumNew = BigNumber(inFreezeNum).isNaN() ? 0 : inFreezeNum;
    let transferringSoonNumNew = BigNumber(transferringSoonNum).isNaN() ? 0 : transferringSoonNum;

    let rewards = BigNumber(totalRewardNew).plus(inFreezeNumNew).plus(transferringSoonNumNew);
    let isNodata =
      BigNumber(rewards).lte(0) &&
      (!borrowingList || borrowingList.length === 0) &&
      (!supplyList || supplyList.length === 0);

    const { activeKey: activeKeyLend } = this.props.lend;
    const { userDepositDataSource, userLendDataSource } = this.props.user;
    const paramActiveKey = getParameterByName('activeKey');

    let activeKey = '';
    if (!paramActiveKey && !activeKeyLend) {
      activeKey = 'all';
    } else {
      activeKey = activeKeyLend || paramActiveKey;
    }

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
    const hasExtraSpace =
      (activeKey === 'all' && lpNum + depositNum + lendNum <= 3) || (activeKey === 'supply' && lpNum + depositNum <= 3);
    let showRecommendToken = !isShowRecommendToken && hasExtraSpace;

    return isNodata && mobile ? null : (
      <div
        className={
          'more ' +
          (isNodata && !this.props.isLoading ? 'only-recommend' : '') +
          (Config.adBannerVisible
            ? !!isShowRecommendToken && !!isShowUSDDUpdateAd
              ? ' hide-only-recommend'
              : ''
            : !!isShowRecommendToken
            ? ' hide-only-recommend'
            : '')
        }
      >
        {isNodata && !this.props.isLoading ? (
          showRecommendToken ? (
            <div className="recommend-tip">{intl.get('v2.tip36')}</div>
          ) : null
        ) : this.props.isLoading ? (
          <div className="more-bg">
            <Skeleton title={false} paragraph={{ rows: 2, width: '100%' }} active className="ant-skeleton-more" />
          </div>
        ) : (
          <>
            <div className="flex jcsb aic">
              <div>
                <div className="data-info-key">
                  {intl.get('home.mining_rewards')}
                  {openMint ? (
                    mobile ? (
                      <img
                        className="waiting-reward-icon"
                        src={isWhite ? WaitingRewardWhite : WaitingReward}
                        onClick={() => {
                          this.props.ui.setMiningRewardVisible(true);
                          window.gtag('event', 'H5_rewards_to_be_distributed', {
                            'event_category': 'H5',
                            'event_label': 'rewards_to_be_distributed'
                          });
                        }}
                        alt=""
                      />
                    ) : (
                      <Tooltip
                        overlayClassName="j-tooltip-dropdown"
                        placement="bottom"
                        arrowPointAtCenter
                        title={intl.get('v2.mining_rewards_detail_tip')}
                        trigger="['hover','click']"
                      >
                        {
                          <img
                            className="waiting-reward-icon"
                            src={isWhite ? WaitingRewardWhite : WaitingReward}
                            onClick={() => {
                              this.props.ui.setMiningRewardVisible(true);
                              window.gtag('event', 'PC_rewards_to_be_distributed', {
                                'event_category': 'PC_V1.5',
                                'event_label': 'rewards_to_be_distributed'
                              });
                            }}
                            alt=""
                          />
                        }
                      </Tooltip>
                    )
                  ) : (
                    <></>
                  )}
                </div>
                {openMint ? (
                  <div className="value">{getTotalMint(this.props.user, true)}</div>
                ) : (
                  <div className="value">
                    {getTotalMint(this.props.user)} <span className="j-reward-unit fs-14">{miningSymbol}</span>
                  </div>
                )}
              </div>
              <div>
                {!BigNumber(totalReward).gt(0) ? (
                  USDDMiningStatus == 2 ? (
                    <Tooltip
                      className=""
                      overlayClassName="j-tooltip-dropdown"
                      placement="bottom"
                      arrowPointAtCenter
                      title={intl.getHTML('v2.rewards.processing', { value: phaseDisplay })}
                      trigger="['hover','click']"
                    >
                      <div>
                        <button className="j-btn j-reward flex aic jcc disabled">
                          <span className="j-reward-btn-icon"></span>
                          {intl.get('v2.rewards.claim')}
                        </button>
                      </div>
                    </Tooltip>
                  ) : (
                    <button className="j-btn j-reward flex aic jcc disabled">
                      <span className="j-reward-btn-icon"></span>
                      {intl.get('v2.rewarding')}
                    </button>
                  )
                ) : (
                  <button
                    className="j-btn j-reward flex aic jcc"
                    onClick={() => {
                      this.props.ui.setRewardVisible(true);
                      window.gtag('event', 'PC_rewards_claim', {
                        'event_category': 'PC_V1.5',
                        'event_label': 'rewards_claim'
                      });
                    }}
                  >
                    <span className="j-reward-btn-icon"></span>
                    {intl.get('v2.rewards.claim')}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }
}

export default RiskValue;
