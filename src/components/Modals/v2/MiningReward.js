import React from 'react';
import isMobile from 'ismobilejs';
import { inject, observer } from 'mobx-react';
import { BigNumber, formatNumber, splitFormatNumber, getTotalMint } from '../../../utils/helper';
import { Modal, Tooltip, Checkbox, Button } from 'antd';
import intl from 'react-intl-universal';
import CountUp from 'react-countup';
import Config from '../../../config';
import { getMultiReward } from '../../../stores/system';
import { TooltipText } from '../../../components/v2/strx/TooltipText';

import '../../../assets/css/v2/modal.scss';
import '../../../assets/css/v2/vote-detail-modal.scss';
import { getLendIcons } from '../../../utils/constant';
const { miningSymbol } = Config;
@inject('network')
@inject('lend')
@inject('system')
@observer
class MiningRewardModal extends React.Component {
  constructor() {
    super();
    this.timerInterval = null;
    this.state = {
      mobile: isMobile(window.navigator).any,
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      collapse: true
    };
  }

  getTotalMint = data => {
    const { inFreezeNum, transferringSoonNum, allMiningInfo, globalSettlementStatus, totalReward } = this.props.lend;

    if (Object.keys(allMiningInfo).length > 0 && globalSettlementStatus) return '--';

    let totalMiningrewards = data ? data : BigNumber(inFreezeNum).plus(transferringSoonNum).plus(totalReward);

    if (totalMiningrewards.gt(0) && Object.keys(allMiningInfo).length > 0) {
      let res = formatNumber(totalMiningrewards, 8, {
        cutZero: true,
        miniText: '0.00000001',
        round: true,
        needDolar: true
      });
      let totalMiningrewardsNew = BigNumber(totalMiningrewards)._toFixed(8, 1);
      return splitFormatNumber(totalMiningrewardsNew, res, true);
    } else if (!totalMiningrewards.gt(0) && Object.keys(allMiningInfo).length > 0) {
      return <span className="countup-int">{'$0'}</span>;
    } else {
      return <span className="countup-int">{'$--'}</span>;
    }
  };

  getTotalRewards = (data, forNewUSDDMining) => {
    let decimal = 8;
    let miniText = 0.00000001;
    if (forNewUSDDMining) {
      decimal = 2;
      miniText = 0.01;
    }
    let res = formatNumber(data, decimal, {
      cutZero: true,
      miniText,
      round: true,
      needDolar: true,
      reverseMiniTextDolarSymbolOrder: true
    });
    let totalMiningrewardsNew = BigNumber(data)._toFixed(decimal, 1);
    if (forNewUSDDMining) totalMiningrewardsNew = BigNumber(data).decimalPlaces(decimal, BigNumber.ROUND_UP);

    return splitFormatNumber(totalMiningrewardsNew, res, forNewUSDDMining);
  };

  getRewardNewUSDD = () => {
    const { totalRewardUSDDNEW, USDDMiningStatus, inFreezeNum, transferringSoonNum } = this.props.lend;
    // console.log(
    //   'totalRewardUSDDNEW: ', totalRewardUSDDNEW.toString(),
    //   'USDDMiningStatus: ', USDDMiningStatus.toString(),
    //   'inFreezeNum: ', inFreezeNum.toString(),
    //   'transferringSoonNum: ', transferringSoonNum.toString()
    // )
    let gainNum = BigNumber(transferringSoonNum);
    if (USDDMiningStatus == 2) {
      gainNum = BigNumber(inFreezeNum).plus(transferringSoonNum);
    }
    // console.log('gainNum isNaN: ', gainNum.toString(), gainNum.isNaN());
    let USDDReward = BigNumber(totalRewardUSDDNEW);
    if (!gainNum.isNaN()) USDDReward = BigNumber(totalRewardUSDDNEW).plus(gainNum);
    return USDDReward?.gt(0) ? formatNumber(USDDReward, 6, { miniText: 0.01 }) : '< 0.01';
  };

  render() {
    const { lang, collapse, mobile } = this.state;
    const { miningRewardVisible } = this.props.network;

    const {
      theme,
      inFreezeNum,
      transferringSoonNum,
      allMiningInfo,
      globalSettlementStatus,
      totalReward,
      marketDataSource,
      multiRewardData,
      USDDMiningStatus,
      openMint
    } = this.props.lend;
    const tokens = Object.fromEntries(marketDataSource.map(item => [item.jtokenAddress, item]));
    // console.log('allMiningInfo: ', Object.values(allMiningInfo)[0])
    const hasCurrEndTimeArr = Object.values(allMiningInfo)?.filter(
      item => BigNumber(item?.tokenGainLastAll)?.gt(0) || BigNumber(item?.tokenGainNewAll)?.gt(0)
    );
    // console.log('hasCurrEndTimeArr: ', hasCurrEndTimeArr);
    let allDataSource = Object.values(allMiningInfo);
    let currentData =
      allDataSource.length > 0 ? allDataSource.filter(item => BigNumber(item.tokenGainNewAll).gt(0)) : [];

    let gainCurr = BigNumber(transferringSoonNum);
    if (USDDMiningStatus == 2) {
      gainCurr = BigNumber(inFreezeNum).plus(transferringSoonNum);
    }
    return (
      <>
        <Modal
          title={intl.get('v2.rewards.mining_rewards')}
          maskClosable={false}
          visible={miningRewardVisible}
          closable={true}
          onCancel={() => {
            this.props.system.clearRejectError();
            this.props.network.setData({ miningRewardVisible: false });
            window.gtag('event', 'PC_mining_rewards_close', {
              'event_category': 'PC_V1.5',
              'event_label': 'mining_rewards_close'
            });
          }}
          footer={null}
          className={`j-modal j-mining-reward-modal ${theme}`}
          width={450}
          // height={560}
          centered
          getContainer={() => document.querySelector('.j-wrapper')}
        >
          <div className={'j-mining-reward'}>
            <div className="j-mr-content">
              <div className="j-top">
                <div className="j-title flex aic">
                  <TooltipText
                    title={intl.getHTML('v2.rewards.tip37')}
                    placement="topLeft"
                    arrowPointAtCenter
                    overlayClassName="j-tooltip-dropdown"
                    getPopupContainer={() => document.querySelector('.j-mining-reward-modal')}
                  >
                    <span>{intl.get('v2.rewards.to_be_laimed')}</span>
                  </TooltipText>
                  {mobile ? null : (
                    <Tooltip
                      title={intl.getHTML('v2.rewards.tip37')}
                      placement="topLeft"
                      arrowPointAtCenter
                      overlayClassName="j-tooltip-dropdown"
                      getPopupContainer={() => document.querySelector('.j-mining-reward-modal')}
                    >
                      <span className="j-tooltip-icon ml-4"></span>
                    </Tooltip>
                  )}
                </div>
                {openMint ? (
                  <div className="j-value">{getTotalMint(this.props.lend, true)}</div>
                ) : (
                  <div className="j-value">
                    {getTotalMint(this.props.lend)}
                    <span className="j-reward-unit"> {miningSymbol}</span>
                  </div>
                )}
                {openMint && (
                  <div className="j-value-detail">
                    {'~ '}
                    {this.getRewardNewUSDD()}
                    {' USDD + '}
                    {BigNumber(this.props.lend.totalRewardUSDDOLD)?.gt(0)
                      ? formatNumber(this.props.lend.totalRewardUSDDOLD, 6, { miniText: 0.01 })
                      : '< 0.01'}
                    {' USDDOLD'}
                  </div>
                )}
              </div>
              <div className="j-ele flex aic jcsb">
                <div>
                  <div className="j-title">{intl.get('v2.rewards.reward_balance')}</div>
                  <div className="j-value format-reward">
                    {BigNumber(totalReward).gt(0) ? (
                      openMint ? (
                        <>{this.getTotalRewards(totalReward, true)}</>
                      ) : (
                        <>
                          {this.getTotalRewards(totalReward)}
                          <span className="j-reward-unit"> {miningSymbol}</span>
                        </>
                      )
                    ) : USDDMiningStatus == 2 ? (
                      <div className="j-accuring">{intl.get('v2.processing')}</div>
                    ) : openMint ? (
                      <>{'$0'}</>
                    ) : (
                      <>
                        0<span className="j-reward-unit"> {miningSymbol}</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  disabled={!BigNumber(totalReward).gt(0)}
                  className="j-btn j-reward flex aic jcc"
                  onClick={() => {
                    this.props.lend.filterReward(Object.keys(multiRewardData));
                    this.props.network.setData({ rewardVisible: true });
                    this.props.network.setData({ miningRewardVisible: false });
                    window.gtag('event', 'PC_mining_rewards_claim', {
                      'event_category': 'PC_V1.5',
                      'event_label': 'mining_rewards_claim'
                    });
                  }}
                >
                  <span className="j-reward-btn-icon mr-5"></span>
                  {intl.get('v2.rewards.claim')}
                </button>
              </div>

              <div className={'j-ele mt-10' + (!collapse ? ' top-radius' : '')}>
                <div className="flex aic jcsb">
                  <div>
                    <div className="j-title">{intl.get('v2.rewards.accruing')}</div>
                    <div className="j-value format-reward">
                      {USDDMiningStatus == 2
                        ? this.getTotalMint(BigNumber(inFreezeNum).plus(transferringSoonNum))
                        : this.getTotalMint(BigNumber(transferringSoonNum))}
                      {/* {globalSettlementStatus
                         ? '--'
                         : this.getTotalMint(BigNumber(inFreezeNum).plus(transferringSoonNum))} */}
                      {!openMint && <span className="j-reward-unit"> {miningSymbol}</span>}
                    </div>
                  </div>
                  {globalSettlementStatus && openMint ? (
                    <div className="closure-time mt-0 tar">
                      {intl.getHTML('v2.settlement_time', { date: hasCurrEndTimeArr[0]?.tokenCurrEndTime })}
                    </div>
                  ) : BigNumber(inFreezeNum).plus(transferringSoonNum).gt(0) ? (
                    <div
                      className={'j-collapse' + (!collapse ? ' active' : '')}
                      onClick={() => {
                        this.setState({ collapse: !this.state.collapse });
                        if (collapse) {
                          window.gtag('event', 'PC_mining_rewards_uncollapse', {
                            'event_category': 'PC_V1.5',
                            'event_label': 'mining_rewards_uncollapse'
                          });
                        } else {
                          window.gtag('event', 'PC_mining_rewards_collapse', {
                            'event_category': 'PC_V1.5',
                            'event_label': 'mining_rewards_collapse'
                          });
                        }
                      }}
                    >
                      {!collapse ? intl.get('v2.rewards.collapse') : intl.get('v2.rewards.expand')}{' '}
                      <span className="j-collapse-icon"></span>
                    </div>
                  ) : (
                    ''
                  )}
                </div>
              </div>

              {!collapse && (
                <div
                  className={'j-ele j-reward-ele' + (!collapse ? ' bottom-radius' : '') + (openMint ? '' : ' close')}
                >
                  <div className="pr">
                    <div className="j-ele-list scroll-bar">
                      {/* {Object.keys(allMiningInfo).length > 0 && currentData?.length > 0 ? (
                        <>
                          {!globalSettlementStatus &&
                            Object.values(allMiningInfo).map((item, index) => {
                              const { tokenGainNewAll, tokenAddress, tokenGainLastAll } = item;
                              let gainTotal = BigNumber(tokenGainNewAll);
                              if (USDDMiningStatus == 2) {
                                gainTotal = BigNumber(tokenGainNewAll).plus(tokenGainLastAll);
                              }
                              if (BigNumber(gainTotal).gt(0))
                                return (
                                  <div className={'rewards-box'} key={index}>
                                    <div className="rewards-title">
                                      <img
                                        className="rewards-img"
                                        src={tokens[tokenAddress]?.logoUrl}
                                        alt={tokens[tokenAddress]?.collateralSymbol}
                                        onError={e => {
                                          e.target.onerror = null;
                                          e.target.src = getLendIcons(tokens[tokenAddress]?.collateralSymbol);
                                        }}
                                      />
                                      <span>
                                        {intl.get('deposit_mining', {
                                          'symbol': tokens[tokenAddress]?.collateralSymbol
                                        })}
                                      </span>
                                    </div>
                                    <div className="reward-value">
                                      <span>{formatNumber(gainTotal, 3, { miniText: '0.001' })}</span> {miningSymbol}
                                    </div>
                                  </div>
                                );
                            })}
                        </>
                      ) : ( */}
                      {gainCurr.gt(0) && (
                        <div className={'rewards-box'}>
                          <div className="rewards-title">
                            <img
                              className="rewards-img"
                              src={getLendIcons('USDD')}
                              alt={tokens[Config.usdd.token]?.collateralSymbol}
                              onError={e => {
                                e.target.onerror = null;
                                e.target.src = getLendIcons('USDD');
                              }}
                            />
                            <span>
                              {intl.get('deposit_mining', {
                                'symbol': 'USDD'
                              })}
                            </span>
                          </div>
                          <div className="reward-value">
                            {/* {openMint ? '$' : ''} */}
                            <span>
                              {formatNumber(gainCurr, 3, {
                                miniText: '0.001'
                              })}
                            </span>
                            {' ' + miningSymbol}
                            {/* {openMint ? '' : ' ' + miningSymbol} */}
                          </div>
                        </div>
                      )}
                    </div>
                    {Object.keys(currentData).length > 3 && <div className="linear"></div>}
                  </div>
                  {openMint && BigNumber(transferringSoonNum)?.gt(0) && (
                    <div className="closure-time w100">
                      {intl.getHTML('v2.settlement_time', { date: hasCurrEndTimeArr[0]?.tokenCurrEndTime })}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="j-mr-bottom flex">
              <div className="j-warning-icon"></div>
              {intl.getHTML('waiting_reward_footer')}
            </div>
          </div>
        </Modal>
      </>
    );
  }
}

export default MiningRewardModal;
