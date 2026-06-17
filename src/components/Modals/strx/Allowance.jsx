import React from 'react';
import isMobile from 'ismobilejs';
import { inject, observer } from 'mobx-react';
import { BigNumber, formatNumber } from '../../../utils/helper';
import { Modal, Checkbox, Button, Tooltip } from 'antd';
import intl from 'react-intl-universal';
import Config from '../../../config';

import '../../../assets/css/v2/modal.scss';
import '../../../assets/css/v2/vote-detail-modal.scss';

@inject('network')
@inject('ui')
@inject('strx')
@inject('energyRental')
@inject('system')
@observer
class AllowanceModal extends React.Component {
  constructor() {
    super();
    this.timerInterval = null;
    this.state = {
      mobile: isMobile(window.navigator).any,
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      approving: false,
      indeterminate: true,
      checkAll: true
    };
  }

  renderRewardList = () => {
    const { defaultValue, multiRewardData } = this.props[this.props.store];
    const { approving, lang } = this.state;
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
              className="j-checkbox blue"
              value={item}
              disabled={defaultValue.length >= Config.rewardNum && !defaultValue.includes(item)}
            >
              {intl.getHTML('v2.rewards.num', { value: item })}
            </Checkbox>{' '}
            <div className="tar">
              <span className="j-value">
                {formatNumber(BigNumber(multiRewardData[item]?.amount || 0).div(Config.tokenDefaultPrecision), 6, {
                  miniText: 0.001
                })}{' '}
              </span>
              <span className="j-reward-unit"> JST</span>
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

    this.props[this.props.store].filterReward(item);

    const { multiRewardData } = this.props[this.props.store];
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
      this.props[this.props.store].setData({ defaultValue: [], choosedTotalReward: 0 });
      window.gtag('event', 'PC_unselect_all_reward', {
        'event_category': 'PC_V1.5',
        'event_label': 'unselect_all_reward'
      });
    } else {
      const { multiRewardData } = this.props[this.props.store];

      this.props[this.props.store].filterReward(Object.keys(multiRewardData));

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

    window.gtag('event', 'PC_claim_confirm', { 'event_category': 'PC_V1.5', 'event_label': 'claim_confirm' });

    const { multiRewardData, defaultValue, choosedTotalReward } = this.props[this.props.store];
    const intlObj = {
      title: 'strx.energy_notification_reward_title',
      title2: 'deposit.transactionsent',
      title3: 'v2.transaction_confirm_fail',
      title4: 'deposit.confirm_transaction',
      obj: {
        value: formatNumber(choosedTotalReward, 6, {
          miniText: 0.001
        }),
        token: 'JST'
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

    const contractAddress = Config.sTRX.merkleDistributor;
    const funcSelector = 'multiClaim((uint256,uint256,uint256,bytes32[])[])';
    let parameters = [];
    const feeLimit = await this.props.system.getFeeLimitCommon(contractAddress, funcSelector, parameters);

    let txID = await this.props.system.getAllowanceMultiReward([parametersV2], intlObj, feeLimit);
    if (txID) {
      window.gtag('event', 'PC_claim_success', { 'event_category': 'PC_V1.5', 'event_label': 'claim_success' });
      this.props.ui.setAllowanceVisible(false);
      setTimeout(() => {
        this.props[this.props.store].getMultiReward();
      }, 5000);
    }
    this.setState({ approving: false });
  };

  render() {
    const { mobile, lang, checkAll, data, approving } = this.state;
    const { theme, multiRewardData, defaultValue, choosedTotalReward, totalReward, collapse } =
      this.props[this.props.store];
    const { allowanceVisible } = this.props.ui;
    const { transModalInfo } = this.props.system;
    const { declined, transType } = transModalInfo;

    return (
      <Modal
        title={intl.get('strx.energy_waiting_get_allowance')}
        maskClosable={false}
        visible={allowanceVisible}
        closable={true}
        onCancel={() => {
          this.props.system.clearRejectError();
          this.props.ui.setAllowanceVisible(false);
          this.props[this.props.store].collapseInit();
          this.props[this.props.store].filterReward();
          window.gtag('event', 'PC_reward_modal_close', {
            'event_category': 'PC_V1.5',
            'event_label': 'reward_modal_close'
          });
        }}
        footer={null}
        className="j-modal j-reward-modal j-allowance-modal header-border"
        width={450}
        // height={665}
        centered={!mobile}
        getContainer={() => document.querySelector('.j-wrapper')}
      >
        <div className="j-rewards j-allowance">
          <div className="rewards-icon"></div>
          <div className="rewards-title">{intl.get('v2.rewards.claiming')}</div>
          <div className="rewards-value">
            {BigNumber(choosedTotalReward).eq(0)
              ? '0'
              : formatNumber(choosedTotalReward, 6, {
                  miniText: 0.001
                })}{' '}
            JST
          </div>
          <div className="rewards-lists">
            <div className="rewards-list-top">
              <div className="flex aic">
                <Checkbox
                  className="j-checkbox blue"
                  disabled={approving}
                  onChange={this.onCheckAllChange}
                  checked={checkAll}
                >
                  {intl.get('strx.energy_rounds')} ({defaultValue.length}/{Object.keys(multiRewardData).length})
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
                  this.props[this.props.store].setData({ collapse: !collapse });
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
                {intl.get('strx.energy_allowance_detail')}
                <span className="j-collapse-icon"></span>
              </div>
            </div>
            {!collapse && (
              <>
                {/* <div className="rewards-list-title">
                  <span>{intl.get('v2.rewards.mining_round')}</span>
                  <span>{intl.get('v2.rewards.reward_balance')}</span>
                </div> */}
                <div className="pr">
                  <div className="rewards-list-content scroll-bar">{this.renderRewardList()}</div>
                  {Object.keys(multiRewardData).length > 3 && <div className="linear"></div>}
                </div>
              </>
            )}
          </div>

          <div
            className={
              'borrow-tip borrow-important-tip ' +
              (BigNumber(totalReward).minus(choosedTotalReward).gt(0) ? '' : 'opacity')
            }
          >
            {BigNumber(totalReward).minus(choosedTotalReward).gt(0) ? (
              <>
                <span className={lang === 'en-US' ? 'en' : ''}></span>

                {intl.getHTML('v2.rewards.have_reclaimed', {
                  value: formatNumber(BigNumber(totalReward).minus(choosedTotalReward), 8, {
                    miniText: 0.001
                  }),
                  token: 'JST'
                })}
              </>
            ) : (
              <>
                <span className={lang === 'en-US' ? 'en' : ''}></span>

                {intl.getHTML('v2.rewards.have_reclaimed', {
                  value: formatNumber(BigNumber(totalReward).minus(choosedTotalReward), 8, {
                    miniText: 0.001
                  }),
                  token: 'JST'
                })}
              </>
            )}
          </div>
          {approving ? (
            <button className="j-large-btn j-blue j-signing mt-0" disabled>
              {intl.get('v2.sign_in_wallet')}
              <span className="siging-icon"></span>
            </button>
          ) : (
            <Button className="j-large-btn j-blue mt-0" disabled={defaultValue?.length <= 0} onClick={this.getReward}>
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

export default AllowanceModal;
