import React from 'react';
import { observer } from 'mobx-react';
import intl from 'react-intl-universal';
import Config from '../../config';
import isMobile from 'ismobilejs';
import { Skeleton, Tooltip } from 'antd';
import Stores from '../../stores';
import { formatNumber, BigNumber, getTotalMint, calcCurrentPhaseDisplay, getParameterByName } from '../../utils/helper';
import WaitingReward from '../../assets/images/v2/account/reward-btn.svg';
import WaitingRewardWhite from '../../assets/images/v2/white-theme/account/reward-btn.svg';

const { miningSymbol } = Config;

const RewardValue = observer(({ isLoading }) => {
  const { ui, lend, user, pool } = Stores;

  const mobile = isMobile(window.navigator).any;

  const { theme, openMint, activeKey: activeKeyLend, openDualMint } = lend;

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
  } = user;
  const { userDepositDataSource, userLendDataSource } = user;

  const processingPhase = BigNumber(currPhase).minus(1).toString();
  const phaseDisplay = calcCurrentPhaseDisplay(processingPhase);
  const isWhite = theme === 'white';

  let totalRewardNew = BigNumber(totalReward).isNaN() ? 0 : totalReward;
  let inFreezeNumNew = BigNumber(inFreezeNum).isNaN() ? 0 : inFreezeNum;
  let transferringSoonNumNew = BigNumber(transferringSoonNum).isNaN() ? 0 : transferringSoonNum;

  const isValid = val => !BigNumber(val).isNaN();

  let rewards = BigNumber(isValid(totalRewardNew) ? totalRewardNew : 0)
    .plus(isValid(inFreezeNumNew) ? inFreezeNumNew : 0)
    .plus(isValid(transferringSoonNumNew) ? transferringSoonNumNew : 0);

  let isNodata = rewards.lte(0);

  const paramActiveKey = getParameterByName('activeKey');

  let activeKey = '';
  if (!paramActiveKey && !activeKeyLend) {
    activeKey = 'all';
  } else {
    activeKey = activeKeyLend || paramActiveKey;
  }

  let depositNum = 0;
  let lendNum = 0;
  let dataSource = userDepositDataSource;

  if (dataSource && dataSource.length) {
    depositNum = dataSource.length;
  }
  if (userLendDataSource && userLendDataSource.length) {
    lendNum = userLendDataSource.length;
  }

  let lpNum = BigNumber(pool.poolData['jstlp1'].staked).gt(0) ? 1 : 0;
  const hasExtraSpace =
    (activeKey === 'all' && lpNum + depositNum + lendNum <= 3) || (activeKey === 'supply' && lpNum + depositNum <= 3);
  let showRecommendToken = !isShowRecommendToken && hasExtraSpace;

  const getRewardNewUSDD = () => {
    const { USDDMiningStatus, inFreezeNum, transferringSoonNum, totalRewardUSDDNEW } = user;
    let gainNum = BigNumber(transferringSoonNum);

    if (USDDMiningStatus == 2) {
      gainNum = BigNumber(inFreezeNum).plus(transferringSoonNum);
    }
    let USDDReward = BigNumber(totalRewardUSDDNEW);
    if (!gainNum.isNaN()) USDDReward = BigNumber(totalRewardUSDDNEW).plus(gainNum);
    return USDDReward?.gt(0) ? formatNumber(USDDReward, 2, { miniText: 0.01 }) : '< 0.01';
  };

  return isNodata && mobile ? null : (
    <div
      className={
        'more ' +
        (isNodata && !isLoading ? 'only-recommend' : '') +
        (Config.adBannerVisible
          ? !!isShowRecommendToken && !!isShowUSDDUpdateAd
            ? ' hide-only-recommend'
            : ''
          : !!isShowRecommendToken
          ? ' hide-only-recommend'
          : '')
      }
    >
      {isNodata && !isLoading ? (
        showRecommendToken ? (
          <div className="recommend-tip">{intl.get('v2.tip36')}</div>
        ) : null
      ) : isLoading ? (
        <div className="more-bg">
          <Skeleton title={false} paragraph={{ rows: 2, width: '100%' }} active className="ant-skeleton-more" />
        </div>
      ) : (
        <>
          <div className="flex jcsb aic">
            <div>
              <div className="data-info-key">
                {intl.get('home.mining_rewards')}
                {mobile ? (
                  <img
                    className={'waiting-reward-icon ' + (openDualMint ? '' : 'disabled')}
                    src={isWhite ? WaitingRewardWhite : WaitingReward}
                    onClick={() => {
                      if (!openDualMint) return;
                      ui.setMiningRewardVisible(true);
                      window.gtag('event', 'H5_rewards_to_be_distributed', {
                        'event_category': 'H5',
                        'event_label': 'rewards_to_be_distributed'
                      });
                    }}
                    alt=""
                  />
                ) : openDualMint ? (
                  <Tooltip
                    overlayClassName="j-tooltip-dropdown"
                    placement="bottom"
                    arrowPointAtCenter
                    title={intl.get('v2.mining_rewards_detail_tip')}
                    trigger="['hover','click']"
                  >
                    {
                      <img
                        className={'waiting-reward-icon'}
                        src={isWhite ? WaitingRewardWhite : WaitingReward}
                        onClick={() => {
                          if (!openDualMint) return;
                          ui.setMiningRewardVisible(true);
                          window.gtag('event', 'PC_rewards_to_be_distributed', {
                            'event_category': 'PC_V1.5',
                            'event_label': 'rewards_to_be_distributed'
                          });
                        }}
                        alt=""
                      />
                    }
                  </Tooltip>
                ) : (
                  <img
                    className={'waiting-reward-icon disabled'}
                    src={isWhite ? WaitingRewardWhite : WaitingReward}
                    onClick={() => {
                      if (!openDualMint) return;
                      ui.setMiningRewardVisible(true);
                      window.gtag('event', 'PC_rewards_to_be_distributed', {
                        'event_category': 'PC_V1.5',
                        'event_label': 'rewards_to_be_distributed'
                      });
                    }}
                    alt=""
                  />
                )}
              </div>
              <div className="value">{getTotalMint(user, true)}</div>
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
                  className={'j-btn j-reward flex aic jcc ' + (openDualMint ? '' : 'disabled')}
                  onClick={() => {
                    if (!openDualMint) return;
                    ui.setRewardVisible(true);
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
});

export default RewardValue;
