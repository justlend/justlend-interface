import React from 'react';
import isMobile from 'ismobilejs';
import { inject, observer } from 'mobx-react';
import { BigNumber, formatNumber, renderSplitAmount } from '../../../utils/helper';
import { Modal, Tooltip } from 'antd';
import intl from 'react-intl-universal';
import Config from '../../../config';

import '../../../assets/css/v2/modal.scss';
import '../../../assets/css/v2/vote-detail-modal.scss';
import { getLendIcons } from '../../../utils/constant';

const { miningSymbol } = Config;


const toArray = val => {
  if (val === null || val === undefined) return [];
  return Array.isArray(val) ? val : [val];
};

@inject('network')
@inject('ui')
@inject('lend')
@inject('system')
@inject('user')
@inject('market')
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

  getClaimableMap = () => {
    const { multiRewardData } = this.props.user;
    let map = {};
    if (!multiRewardData) return map;

    Object.keys(multiRewardData).forEach(key => {
      const item = multiRewardData[key];
      if (!item) return;

      const amounts = toArray(item.amount);
      const symbols = toArray(item.tokenSymbol);
      const addresses = toArray(item.tokenAddress);

      amounts.forEach((amt, i) => {
        
        let sym = symbols[i];
        if (!sym) {
          sym = addresses[i] === Config.usdd.token ? 'USDD' : 'USDDOLD';
        }

        let precision = Config.tokenDefaultPrecision;
        if (sym === 'TRX') {
          precision = Config.trxPrecision;
        }

        
        const val = BigNumber(amt).div(precision);

        
        if (!map[sym]) map[sym] = BigNumber(0);
        map[sym] = map[sym].plus(val);
      });
    });
    return map;
  };

  renderBreakdown = breakdownMap => {
    if (!breakdownMap || Object.keys(breakdownMap).length === 0) {
      
      return renderSplitAmount('0.00', 'USDD');
    }

    const sortPriority = ['USDD', 'TRX', 'USDDOLD'];

    const keys = Object.keys(breakdownMap).sort((a, b) => {
      let indexA = sortPriority.indexOf(a);
      let indexB = sortPriority.indexOf(b);

      if (indexA === -1) indexA = 99;
      if (indexB === -1) indexB = 99;

      if (indexA !== indexB) {
        return indexA - indexB;
      }

      return a.localeCompare(b);
    });

    const validKeys = keys.filter(k => BigNumber(breakdownMap[k]).gt(0));
    const finalKeys = validKeys.length > 0 ? validKeys : keys.slice(0, 1);

    return finalKeys.map((symbol, index) => {
      const amount = breakdownMap[symbol];
      return (
        <React.Fragment key={symbol}>
          {index > 0 && ' + '}
          {renderSplitAmount(formatNumber(amount, 2, { miniText: 0.01 }), symbol, amount)}
        </React.Fragment>
      );
    });
  };

  render() {
    const { collapse, mobile } = this.state;
    const { miningRewardVisible } = this.props.ui;
    const { openMint, theme } = this.props.lend;

    const {
      allMiningInfo,
      globalSettlementStatus,
      totalReward, 
      transferringSoonNum, 
      transferringSoonBreakdown, 
      multiRewardData
    } = this.props.user;

    const { marketDataSource } = this.props.market;
    const tokens = Object.fromEntries(marketDataSource.map(item => [item.jtokenAddress, item]));

    
    const claimableMap = this.getClaimableMap();

    
    
    const pendingMap = transferringSoonBreakdown || {};

    
    const hasCurrEndTimeArr = Object.values(allMiningInfo)?.filter(
      item => BigNumber(item?.tokenGainLastAll)?.gt(0) || BigNumber(item?.tokenGainNewAll)?.gt(0)
    );

    
    let allDataSource = Object.values(allMiningInfo);
    let currentData =
      allDataSource.length > 0 ? allDataSource.filter(item => BigNumber(item.tokenGainNewAll).gt(0)) : [];

    return (
      <>
        <Modal
          title={intl.get('v2.rewards.mining_rewards')}
          maskClosable={false}
          visible={miningRewardVisible}
          closable={true}
          onCancel={() => {
            this.props.system.clearRejectError();
            this.props.ui.setMiningRewardVisible(false);
            window.gtag('event', 'PC_mining_rewards_close', {
              'event_category': 'PC_V1.5',
              'event_label': 'mining_rewards_close'
            });
          }}
          footer={null}
          className={`j-modal j-mining-reward-modal ${theme} ${
            !BigNumber(transferringSoonNum).gt(0) || globalSettlementStatus ? 'no-data' : ''
          }`}
          width={450}
          centered={!mobile}
          getContainer={() => document.querySelector('.j-wrapper')}
        >
          <div className={'j-mining-reward'}>
            <div className="j-mr-content">
              {}
              <div className="content-top">
                <div className="j-ele column">
                  <div className="j-ele-header flex jcsb aic">
                    <div className="j-title">
                      {intl.get('v2.rewards.waiting_rewards')}
                      <Tooltip
                        title={intl.getHTML('v2.rewards.tip37')}
                        placement={mobile ? 'top' : 'topLeft'}
                        arrowPointAtCenter
                        overlayClassName="j-tooltip-dropdown"
                        getPopupContainer={() => document.querySelector('.j-mining-reward-modal')}
                      >
                        <span className="j-tooltip-icon ml-4"></span>
                      </Tooltip>
                    </div>
                  </div>

                  {}
                  {Object.keys(claimableMap)?.length > 0 ? (
                    <div className="j-value format-reward">
                      <div className="j-value-detail">{this.renderBreakdown(claimableMap)}</div>
                    </div>
                  ) : (
                    <div className="j-value format-reward">{intl.get('v2.rewards.none')}</div>
                  )}
                </div>
                <button
                  disabled={!BigNumber(totalReward).gt(0)} 
                  className="j-btn j-reward flex aic jcc"
                  onClick={() => {
                    this.props.user.filterReward(Object.keys(multiRewardData));
                    this.props.ui.setRewardVisible(true);
                    this.props.ui.setMiningRewardVisible(false);
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

              {}
              <div className={'j-ele mt-10' + (!collapse ? ' top-radius' : '')}>
                <div className="flex aic jcsb">
                  <div>
                    <div className="j-title">{intl.get('v2.rewards.to_be_settled')}</div>
                    {globalSettlementStatus ? (
                      <div className="j-value format-reward">--</div>
                    ) : BigNumber(transferringSoonNum).gt(0) ? (
                      <div className="j-value format-reward">
                        <span>{this.renderBreakdown(pendingMap)}</span>
                      </div>
                    ) : (
                      <div className="j-value format-reward">{intl.get('v2.rewards.none')}</div>
                    )}
                  </div>

                  {globalSettlementStatus ? (
                    <div className="closure-time mt-0 tar">
                      {intl.getHTML('v2.settlement_time', { date: hasCurrEndTimeArr[0]?.tokenCurrEndTime })}
                    </div>
                  ) : BigNumber(transferringSoonNum).gt(0) ? (
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

              {}
              {!collapse && (
                <div
                  className={'j-ele j-reward-ele' + (!collapse ? ' bottom-radius' : '') + (openMint ? '' : ' close')}
                >
                  <div className="pr">
                    <div className="j-ele-list scroll-bar">
                      {Object.values(allMiningInfo).map(item => {
                        if (BigNumber(item.tokenGainNewAll).eq(0)) return null;

                        const itemBreakdownMap = {};
                        const rawBreakdown = item.breakdown || {};

                        if (Object.keys(rawBreakdown).length === 0 && BigNumber(item.tokenGainNewAll).gt(0)) {
                          
                        } else {
                          Object.keys(rawBreakdown).forEach(sym => {
                            itemBreakdownMap[sym] = rawBreakdown[sym].amountNew;
                          });
                        }

                        const tokenObj = tokens[item.tokenAddress];
                        const symbol = tokenObj ? tokenObj.collateralSymbol : 'Unknown';

                        return (
                          <div className={'rewards-box'} key={item.tokenAddress}>
                            <div className="rewards-title">
                              <img
                                className="rewards-img"
                                src={getLendIcons(symbol)}
                                alt={symbol}
                                onError={e => {
                                  e.target.onerror = null;
                                  e.target.src = getLendIcons('USDD'); // Fallback icon
                                }}
                              />
                              <span>{intl.get('deposit_mining', { 'symbol': symbol })}</span>
                            </div>
                            <div className="reward-value">
                              <span>{this.renderBreakdown(itemBreakdownMap)}</span>
                            </div>
                          </div>
                        );
                      })}
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

              <div className="des">
                <div>{intl.get('v2.reward_note')}</div>
                {intl.get('mining.sp_tip')}
              </div>
            </div>
          </div>
        </Modal>
      </>
    );
  }
}

export default MiningRewardModal;
