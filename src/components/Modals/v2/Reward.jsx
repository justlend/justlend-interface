import React from 'react';
import isMobile from 'ismobilejs';
import { inject, observer } from 'mobx-react';
import { BigNumber, calcCurrentPhaseDisplay, formatNumber } from '../../../utils/helper';
import { Modal, Checkbox, Button, Tooltip } from 'antd';
import intl from 'react-intl-universal';
import Config from '../../../config';

import '../../../assets/css/v2/modal.scss';
import '../../../assets/css/v2/vote-detail-modal.scss';
const { miningSymbol } = Config;

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
      indeterminate: true,
      checkAll: true,
      checkStatus: 1 // 1: usddnew checked, 2: usddold checked, 0: both unchecked
    };
  }

  renderRewardList = () => {
    const { openMint } = this.props.lend;
    const { defaultValue, multiRewardData } = this.props.user;
    const { approving, lang, checkStatus } = this.state;
    let dataArr = Object.keys(multiRewardData).reverse();

    return (
      <Checkbox.Group disabled={approving} defaultValue={defaultValue} onChange={this.onChange} value={defaultValue}>
        {dataArr.map(item => (
          <div
            className={
              'j-reward-item' +
              ((defaultValue.length >= Config.rewardNum && !defaultValue.includes(item)) || approving
                ? ' j-reward-item-disabled'
                : '')
            }
            key={item}
          >
            <Checkbox
              className="j-checkbox"
              value={item}
              disabled={
                (defaultValue.length >= Config.rewardNum && !defaultValue.includes(item)) ||
                (multiRewardData[item]?.tokenAddress === Config.usdd.token && checkStatus === 2) ||
                (multiRewardData[item]?.tokenAddress !== Config.usdd.token && checkStatus === 1)
              }
            >
              {intl.get('v2.rewards.mining_rewards')}
              {lang === 'en-US' ? ' ' : ' - '}
              {intl.getHTML('v2.rewards.num', { value: calcCurrentPhaseDisplay(item) })}
            </Checkbox>{' '}
            <div className="tar">
              <span className="j-value">
                {formatNumber(BigNumber(parseInt(multiRewardData[item].amount)).div(Config.tokenDefaultPrecision), 6, {
                  miniText: 0.001
                })}{' '}
              </span>
              <span className="j-reward-unit">
                {' '}
                {openMint && multiRewardData[item]?.tokenAddress === Config.usdd.token ? 'USDD' : 'USDDOLD'}
              </span>
            </div>
          </div>
        ))}
      </Checkbox.Group>
    );
  };

  onChange = item => {
    let length = item?.length;

    if (length > Config.rewardNum) {
      return;
    }

    const hasUSDDNew = this.props.user.filterReward(item);

    const { multiRewardData } = this.props.user;
    if (!length) {
      this.setState({ checkStatus: 0 });
    } else if (hasUSDDNew) {
      this.setState({ checkStatus: 1 });
    } else {
      this.setState({ checkStatus: 2 });
    }
    let dataLength = Object.keys(multiRewardData).length;

    if (length === Config.rewardNum || length === dataLength) {
      this.setState({ checkAll: true });
    } else if (length < Config.rewardNum) {
      this.setState({ checkAll: false });
    }
  };

  onCheckAllChange = e => {
    let checkAll = e.target.checked;
    if (!checkAll) {
      this.setState({ checkStatus: 0 });
      this.props.user.setDefaultValue([]);
      this.props.user.setChoosedTotalReward(0);
      window.gtag('event', 'PC_unselect_all_reward', {
        'event_category': 'PC_V1.5',
        'event_label': 'unselect_all_reward'
      });
    } else {
      const { multiRewardData } = this.props.user;
      const hasUSDDNew = this.props.user.filterReward(Object.keys(multiRewardData));
      if (hasUSDDNew) {
        this.setState({ checkStatus: 1 });
      } else {
        this.setState({ checkStatus: 2 });
      }
      window.gtag('event', 'PC_select_all_reward', { 'event_category': 'PC_V1.5', 'event_label': 'select_all_reward' });
    }
    this.setState({ checkAll });
  };

  getReward = async () => {
    this.props.system.clearRejectError();

    if (this.props.network.isRightChain === 0) {
      this.props.network.changeChain();
      return;
    }

    if (this.props.network.isMainNetwork === 0) {
      this.props.ui.showNetworkErrorModal();
      return;
    }

    window.gtag('event', 'PC_claim_confirm', { 'event_category': 'PC_V1.5', 'event_label': 'claim_confirm' });

    const { multiRewardData, defaultValue, choosedTotalReward } = this.props.user;
    const intlObj = {
      title: 'lend.withdraw',
      title2: 'deposit.transactionsent',
      title3: 'v2.transaction_confirm_fail',
      title4: 'deposit.confirm_transaction',
      obj: {
        value: formatNumber(choosedTotalReward, 6, {
          miniText: 0.001
        }),
        token: miningSymbol
      },
      transType: 'reward'
    };

    this.setState({ approving: true });

    let parametersV2 = [];

    defaultValue.map(item => {
      parametersV2.push([
        multiRewardData[item].merkleIndex,
        multiRewardData[item].index,
        multiRewardData[item].amount,
        multiRewardData[item].proof
      ]);
    });
    let firstIndex = defaultValue[0];
    // console.log(multiRewardData[firstIndex]?.tokenAddress, 111111)
    const contractAddress =
      multiRewardData[firstIndex]?.tokenAddress === Config.usdd.token
        ? Config.merkleDistributorNEWUSDD
        : Config.merkleDistributor;
    const funcSelector = 'multiClaim((uint256,uint256,uint256,bytes32[])[])';
    let parameters = [];
    const feeLimit = await this.props.system.getFeeLimitCommon(contractAddress, funcSelector, parameters);

    let txID = await this.props.system.getMultiReward([parametersV2], intlObj, feeLimit, contractAddress);
    if (txID) {
      window.gtag('event', 'PC_claim_success', { 'event_category': 'PC_V1.5', 'event_label': 'claim_success' });
      this.props.ui.setRewardVisible(false);
      setTimeout(() => {
        this.props.user.getMultiReward();
      }, 5000);
    }
    this.setState({ approving: false });
  };

  render() {
    const { mobile, lang, checkAll, checkStatus, approving } = this.state;
    const { theme, collapse, openMint } = this.props.lend;
    const { multiRewardData, defaultValue, choosedTotalReward, totalReward } = this.props.user;
    const { rewardVisible } = this.props.ui;
    const { transModalInfo } = this.props.system;
    const { declined, transType } = transModalInfo;

    return (
      <Modal
        title={intl.get('v2.rewards.claim_mining')}
        maskClosable={false}
        visible={rewardVisible}
        closable={true}
        onCancel={() => {
          this.props.system.clearRejectError();
          this.props.ui.setRewardVisible(false);
          this.props.lend.collapseInit();
          this.props.user.filterReward();
          window.gtag('event', 'PC_reward_modal_close', {
            'event_category': 'PC_V1.5',
            'event_label': 'reward_modal_close'
          });
        }}
        footer={null}
        className="j-modal j-reward-modal header-border"
        width={450}
        // height={650}
        centered={!mobile}
        getContainer={() => document.querySelector('.j-wrapper')}
      >
        <div className="j-rewards">
          <div className="rewards-icon"></div>
          <div className="rewards-title">{intl.get('v2.rewards.claiming')}</div>
          <div className="rewards-value">
            {BigNumber(choosedTotalReward).eq(0)
              ? openMint
                ? '$0'
                : '0'
              : formatNumber(choosedTotalReward, openMint ? 2 : 6, {
                  miniText: openMint ? 0.01 : 0.001,
                  cutZero: true,
                  round: openMint,
                  needDolar: openMint,
                  roundMode: openMint ? 'ROUND_UP' : ''
                })}{' '}
            {openMint ? '' : miningSymbol}
          </div>
          <div className="rewards-lists">
            <div className="rewards-list-top">
              <div className="flex aic">
                <Checkbox
                  className="j-checkbox"
                  disabled={approving}
                  onChange={this.onCheckAllChange}
                  checked={checkAll}
                >
                  {intl.get('v2.rewards.reward_breakdown')} ({defaultValue.length}/{Object.keys(multiRewardData).length}
                  )
                </Checkbox>
                {Object.keys(multiRewardData).length > 3 && (
                  <Tooltip
                    title={intl.get('v2.rewards.most_can_claim')}
                    placement="top"
                    arrowPointAtCenter
                    overlayClassName="j-tooltip-dropdown"
                    getPopupContainer={() => document.querySelector('.j-reward-modal')}
                  >
                    <span className="j-tooltip-icon"></span>
                  </Tooltip>
                )}
              </div>
              <div
                className={'j-collapse' + (!collapse ? ' active' : '')}
                onClick={() => {
                  this.props.lend.setCollapse(!collapse);
                  if (collapse) {
                    window.gtag('event', 'PC_rewards_uncollapse', {
                      'event_category': 'PC_V1.5',
                      'event_label': 'rewards_uncollapse'
                    });
                  } else {
                    window.gtag('event', 'PC_rewards_collapse', {
                      'event_category': 'PC_V1.5',
                      'event_label': 'rewards_collapse'
                    });
                  }
                }}
              >
                {!collapse ? intl.get('v2.rewards.collapse') : intl.get('v2.rewards.expand')}{' '}
                <span className="j-collapse-icon"></span>
              </div>
            </div>
            {!collapse && (
              <>
                <div className="rewards-list-title">
                  <span>{intl.get('v2.rewards.mining_round')}</span>
                  <span>{intl.get('v2.rewards.reward_balance')}</span>
                </div>
                <div className="pr">
                  <div className="rewards-list-content scroll-bar">{this.renderRewardList()}</div>
                  {Object.keys(multiRewardData).length > 3 && <div className="linear"></div>}
                </div>
              </>
            )}
          </div>

          <div className="borrow-tip borrow-important-tip">
            {BigNumber(totalReward).minus(choosedTotalReward).gt(0) && (
              <>
                <div className="j-warning-icon"></div>
                {intl.getHTML('v2.rewards.have_reclaimed', {
                  value: formatNumber(BigNumber(totalReward).minus(choosedTotalReward), openMint ? 2 : 8, {
                    miniText: openMint ? 0.01 : 0.001,
                    cutZero: true,
                    round: openMint,
                    needDolar: openMint,
                    roundMode: openMint ? 'ROUND_UP' : ''
                  }),
                  token: openMint ? '' : miningSymbol
                })}
              </>
            )}
          </div>
          {approving ? (
            <button className="j-large-btn j-supply j-signing mt-0" disabled>
              {intl.get('v2.sign_in_wallet')}
              <span className="siging-icon"></span>
            </button>
          ) : (
            <Button className="j-large-btn j-supply mt-0" disabled={defaultValue?.length <= 0} onClick={this.getReward}>
              {intl.get('v2.rewards.claim_confirm')}
            </Button>
          )}
          {declined && transType === 'reward' && (
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
