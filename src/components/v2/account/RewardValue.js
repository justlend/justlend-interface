import React from 'react';
import { inject, observer } from 'mobx-react';
import intl from 'react-intl-universal';
import Config from '../../../config';
import CountUp from 'react-countup';
import isMobile from 'ismobilejs';
import { Skeleton, Tooltip } from 'antd';
import { formatNumber, BigNumber, getTotalMint, calcCurrentPhaseDisplay } from '../../../utils/helper';
import WaitingReward from '../../../assets/images/v2/account/reward-btn.svg';
import WaitingRewardWhite from '../../../assets/images/v2/white-theme/account/reward-btn.svg';
const { miningSymbol } = Config;
@inject('network')
@inject('lend')
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

  // getTotalMint = () => {
  //   const {
  //     inFreeze,
  //     transferringSoon,
  //     transferringSoonNum,
  //     inFreezeNum,
  //     allMiningInfo,
  //     globalSettlementStatus,
  //     totalReward
  //   } = this.props.lend;

  //   if (Object.keys(allMiningInfo).length > 0 && globalSettlementStatus) return '--';

  //   let totalMiningrewards = BigNumber(inFreezeNum).plus(transferringSoonNum).plus(totalReward);

  //   if (totalMiningrewards.gt(0) && Object.keys(allMiningInfo).length > 0) {
  //     let res = formatNumber(totalMiningrewards, 8, {
  //       cutZero: true,
  //       miniText: '0.00000001',
  //       round: true,
  //       needDolar: true
  //     });

  //     let totalMiningrewardsNew = BigNumber(totalMiningrewards)._toFixed(8, 1);

  //     return BigNumber(totalMiningrewardsNew).lte(0.001) ? (
  //       <span className="countup-int">{'< 0.001'}</span>
  //     ) : BigNumber(totalMiningrewardsNew).lte(0.1) ? (
  //       <>
  //         <span className="countup-int">{res.split('.')[0]}</span>
  //         <span className="countup-decimal">
  //           {totalMiningrewardsNew !== '--' &&
  //             (res.split('.')[1] && res.split('.')[1].length > 0 ? '.' : '') + res.split('.')[1]}
  //         </span>
  //       </>
  //     ) : (
  //       <>
  //         <span className="countup-int">
  //           <CountUp
  //             className="value-number"
  //             start={0}
  //             duration={1}
  //             redraw={true}
  //             separator=","
  //             decimal="."
  //             end={BigNumber(BigNumber(totalMiningrewardsNew).toString().split('.')[0]).toNumber()}
  //           />
  //         </span>

  // {totalMiningrewards !== '--' && res.split('.')[1] && res.split('.')[1].length > 0 && (
  //   <span className="countup-decimal">
  //     {'.'}
  //     {/^0/.test(res.split('.')[1]) ? (
  //       BigNumber(totalMiningrewardsNew).toString().split('.')[1]
  //     ) : (
  //       <CountUp
  //         className="value-number"
  //         start={0}
  //         duration={1}
  //         redraw={true}
  //         end={BigNumber(BigNumber(totalMiningrewardsNew).toString().split('.')[1]).toNumber()}
  //       />
  //     )}
  //   </span>
  // )}
  //       </>
  //     );
  //   } else if (!totalMiningrewards.gt(0) && Object.keys(allMiningInfo).length > 0) {
  //     return <span className="countup-int">{'0'}</span>;
  //   } else {
  //     return <span className="countup-int">{'--'}</span>;
  //   }
  // };

  getTotalMortgage = () => {
    const { userDepositDataSource } = this.props.lend;
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
    const {
      userDepositDataSource: supplyList,
      userLendDataSource: borrowingList,
      theme,
      isShowRecommendToken,
      isShowUSDDUpdateAd,
      inFreezeNum,
      transferringSoonNum,
      totalReward,
      USDDMiningStatus,
      currPhase,
      openMint
    } = this.props.lend;
    const { mobile } = this.state;

    const processingPhase = BigNumber(currPhase).minus(1).toString();

    const phaseDisplay = calcCurrentPhaseDisplay(processingPhase);

    const isWhite = theme === 'white';

    const recommendStr = window.localStorage.getItem('recommandToken');
    let recommandToken = {};
    if (recommendStr) recommandToken = JSON.parse(recommendStr);
    let isNodata =
      BigNumber(totalReward).lte(0) &&
      (!borrowingList || borrowingList.length === 0) &&
      (!supplyList || supplyList.length === 0);

    let totalMiningrewards = BigNumber(inFreezeNum).plus(transferringSoonNum).isNaN()
      ? totalReward
      : BigNumber(inFreezeNum).plus(transferringSoonNum).plus(totalReward);

    return isNodata && mobile ? null : (
      <div
        className={
          'more ' +
          (isNodata && !this.props.isLoading ? 'only-recommend' : '') +
          (Config.comingSoonBannerVisible
            ? !!isShowRecommendToken && !!isShowUSDDUpdateAd
              ? ' hide-only-recommend'
              : ''
            : !!isShowRecommendToken
            ? ' hide-only-recommend'
            : '')
        }
      >
        {isNodata && !this.props.isLoading ? (
          <div className="recommend-tip">{intl.get('v2.tip36')}</div>
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
                          this.props.network.setData({ miningRewardVisible: true });
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
                              this.props.network.setData({ miningRewardVisible: true });
                              // this.props.network.setData({ rewardModalShow: true });
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
                  <div className="value">{getTotalMint(this.props.lend, true)}</div>
                ) : (
                  <div className="value">
                    {getTotalMint(this.props.lend)} <span className="j-reward-unit fs-14">{miningSymbol}</span>
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
                      this.props.network.setData({ rewardVisible: true });
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

            {}
          </>
        )}
      </div>
    );
  }
}

export default RiskValue;
