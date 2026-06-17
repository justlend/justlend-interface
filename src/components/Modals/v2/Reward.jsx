import React from 'react';
import isMobile from 'ismobilejs';
import { inject, observer } from 'mobx-react';
import { BigNumber, calcCurrentPhaseDisplay, formatNumber, renderSplitAmount } from '../../../utils/helper';
import { Modal, Tooltip } from 'antd';
import intl from 'react-intl-universal';
import Config from '../../../config';

import '../../../assets/css/v2/modal.scss';
import '../../../assets/css/v2/vote-detail-modal.scss';


const toArray = val => {
  if (val === null || val === undefined) return [];
  return Array.isArray(val) ? val : [val];
};

@inject('network')
@inject('ui')
@inject('lend')
@inject('system')
@inject('user')
@observer
class RewardModal extends React.Component {
  constructor() {
    super();
    this.timerInterval = null;
    this.state = {
      mobile: isMobile(window.navigator).any,
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      approving: false,
      activeKey: null 
    };
  }

  
  renderTotalClaimable = () => {
    const { multiRewardData } = this.props.user;
    if (!multiRewardData) return renderSplitAmount('0.00', 'USDD');

    let totalMap = {};

    Object.keys(multiRewardData).forEach(key => {
      const item = multiRewardData[key];
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

        if (!totalMap[sym]) totalMap[sym] = BigNumber(0);
        totalMap[sym] = totalMap[sym].plus(BigNumber(amt).div(precision));
      });
    });

    const sortPriority = ['USDD', 'TRX', 'USDDOLD'];

    const keys = Object.keys(totalMap).sort((a, b) => {
      let indexA = sortPriority.indexOf(a);
      let indexB = sortPriority.indexOf(b);

      if (indexA === -1) indexA = 99;
      if (indexB === -1) indexB = 99;

      if (indexA !== indexB) {
        return indexA - indexB;
      }
      return a.localeCompare(b);
    });

    if (keys.length === 0) return renderSplitAmount('0.00', 'USDD');

    return keys
      .filter(sym => Number(totalMap[sym]) > 0)
      .map((sym, index) => (
        <React.Fragment key={sym}>
          {index > 0 && ' + '}
          {renderSplitAmount(formatNumber(totalMap[sym], 2, { miniText: 0.01 }), sym, totalMap[sym])}
        </React.Fragment>
      ));
  };

  renderRewardList = () => {
    const { multiRewardData } = this.props.user;
    const { approving, activeKey } = this.state;
    if (!multiRewardData) return null;

    let dataArr = Object.keys(multiRewardData).reverse();

    return (
      <div className="reward-list-container">
        {dataArr.map(key => {
          const itemData = multiRewardData[key];
          if (!itemData) return null;

          const amounts = toArray(itemData.amount);
          const symbols = toArray(itemData.tokenSymbol);
          const addresses = toArray(itemData.tokenAddress);

          let validItems = [];
          if (amounts && amounts.length > 0) {
            validItems = amounts
              .map((amt, i) => {
                let symbol = symbols[i];
                if (!symbol) {
                  symbol = addresses[i] === Config.usdd.token ? 'USDD' : 'USDDOLD';
                }
                let precision = Config.tokenDefaultPrecision;

                if (symbol === 'TRX') {
                  precision = 1e6;
                }

                const val = BigNumber(amt).div(precision);
                const fmtVal = formatNumber(val, 2, { miniText: 0.01 });

                return {
                  key: symbol + i,
                  val,
                  fmtVal,
                  symbol
                };
              })
              .filter(item => {
                return item.val.gt(0) && item.fmtVal !== '0' && item.fmtVal !== '0.00';
              });
          }

          if (!validItems || validItems.length === 0) {
            return null;
          }

          return (
            <div className="j-reward-item" key={key}>
              <div className="j-checkbox">
                {intl.getHTML('v2.rewards.num', { value: calcCurrentPhaseDisplay(key) })}
              </div>

              <div className="reward-amount-col">
                {validItems.length > 0 ? (
                  validItems.map((item, index) => (
                    <div key={item.key} className="j-value">
                      {index > 0 && <span>+</span>}
                      {renderSplitAmount(item.fmtVal, item.symbol, item.val)}
                    </div>
                  ))
                ) : (
                  <div className="j-value">--</div>
                )}
              </div>

              <div className="claim-btn-col">
                {approving && activeKey === key ? (
                  <button className="j-btn j-supply j-signing" disabled>
                    {intl.get('v2.rewards.claim')}
                  </button>
                ) : (
                  <button
                    className="j-btn j-supply"
                    onClick={() => {
                      this.getReward(key);
                    }}
                  >
                    {intl.get('v2.rewards.claim')}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  getReward = async key => {
    this.props.system.clearRejectError();
    if (this.props.network.isRightChain === 0) {
      this.props.network.changeChain();
      return;
    }

    window.gtag('event', 'PC_claim_confirm', { 'event_category': 'PC_V1.5', 'event_label': 'claim_confirm' });

    const { multiRewardData } = this.props.user;
    const itemData = multiRewardData[key];

    const intlObj = {
      title: 'lend.withdraw',
      title2: 'deposit.transactionsent',
      title3: 'v2.transaction_confirm_fail',
      title4: 'deposit.confirm_transaction',
      obj: {
        value: '',
        token: 'Rewards'
      },
      transType: 'reward'
    };

    this.setState({ approving: true, activeKey: key });

    try {
      const MULTI_CONTRACT_ADDRESS = Config.multiMerkleDistributor;

      const isMultiReward = Array.isArray(itemData.amount);

      let contractAddress;
      let funcSelector;
      let finalAmount;

      if (isMultiReward) {
        contractAddress = MULTI_CONTRACT_ADDRESS;
        funcSelector = 'multiClaim((uint256,uint256,uint256[],bytes32[])[])';
        finalAmount = itemData.amount;
      } else {
        funcSelector = 'multiClaim((uint256,uint256,uint256,bytes32[])[])';
        finalAmount = Array.isArray(itemData.amount) ? itemData.amount[0] : itemData.amount;

        const currentTokenAddress = Array.isArray(itemData.tokenAddress)
          ? itemData.tokenAddress[0]
          : itemData.tokenAddress;

        if (currentTokenAddress === Config.usdd.token) {
          contractAddress = Config.merkleDistributorNEWUSDD;
        } else {
          contractAddress = Config.merkleDistributor;
        }
      }

      let parametersV2 = [[itemData.merkleIndex, itemData.index, finalAmount, itemData.proof]];

      const feeLimit = await this.props.system.getFeeLimitCommon(contractAddress, funcSelector, [parametersV2]);

      let txID = await this.props.system.getMultiReward(
        [parametersV2],
        intlObj,
        feeLimit,
        contractAddress,
        funcSelector
      );

      if (txID) {
        window.gtag('event', 'PC_claim_success', { 'event_category': 'PC_V1.5', 'event_label': 'claim_success' });
        this.props.ui.setRewardVisible(false);
        setTimeout(() => {
          this.props.user.getMultiReward();
        }, 5000);
      }
    } catch (e) {
      console.error('Claim Error:', e);
    } finally {
      this.setState({ approving: false, activeKey: null });
    }
  };

  render() {
    const { mobile } = this.state;
    const { rewardVisible } = this.props.ui;
    const { transModalInfo } = this.props.system;

    const isDeclined = transModalInfo?.declined || false;
    const transType = transModalInfo?.transType;

    return (
      <Modal
        title={intl.get('v2.rewards.claim_mining')}
        maskClosable={false}
        visible={rewardVisible}
        closable={true}
        onCancel={() => {
          this.props.system.clearRejectError();
          this.props.ui.setRewardVisible(false);
          
          this.props.user.filterReward();
          window.gtag('event', 'PC_reward_modal_close', {
            'event_category': 'PC_V1.5',
            'event_label': 'reward_modal_close'
          });
        }}
        footer={null}
        className="j-modal j-reward-modal claim header-border"
        width={450}
        centered={!mobile}
        getContainer={() => document.querySelector('.j-wrapper')}
      >
        <div className="j-rewards">
          <div className="rewards-icon"></div>
          <div className="rewards-title">{intl.get('v2.rewards.claiming')}</div>

          <div className="rewards-value">
            {}
            {intl.get('v2.rewards.current_claimable')}
            <div className="rewards-total-num">{this.renderTotalClaimable()}</div>
          </div>

          <div className="rewards-lists">
            <div className="rewards-list-title">
              <span>{intl.get('v2.rewards.mining_round')}</span>
              <span>{intl.get('v2.rewards.reward_balance')}</span>
              <span></span>
            </div>

            <div className="pr">
              <div className="rewards-list-content scroll-bar">{this.renderRewardList()}</div>
            </div>
          </div>

          {isDeclined && transType === 'reward' && (
            <div className="j-error-tip wallet-reject">
              <span className="j-error-img"></span>
              <div>{intl.get('v2.reject_in_wallet')}</div>
            </div>
          )}
        </div>
      </Modal>
    );
  }
}

export default RewardModal;
