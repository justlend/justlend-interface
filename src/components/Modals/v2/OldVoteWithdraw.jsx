import React from 'react';
import isMobile from 'ismobilejs';
import { inject, observer } from 'mobx-react';
import { Link } from 'react-router-dom';
import { BigNumber } from '../../../utils/helper';
import { Modal } from 'antd';
import intl from 'react-intl-universal';
import Config from '../../../config';

import '../../../assets/css/v2/modal.scss';
import '../../../assets/css/v2/vote-detail-modal.scss';

@inject('network')
@inject('lend')
@inject('system')
@inject('vote')
@observer
class OldVoteWithdraw extends React.Component {
  constructor() {
    super();
    this.timerInterval = null;
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      visible: false,
      approving: false
    };
  }

  startInterval = async () => {
    if (!this.timerInterval) {
      //   await this.getCash();
      this.timerInterval = setInterval(async () => {
        // await this.getCash();
      }, 3000);
    }
  };

  componentDidMount = () => {
    this.startInterval();
  };

  componentWillUnmount() {
    clearInterval(this.timerInterval);
    this.timerInterval = null;
  }

  closeOldAndOpenNewModal = () => {
    this.props.vote.setVoteOldWithdrawModalVisible(false);
    window.gtag('event', 'PC_invalid_vote_close', { 'event_category': 'PC_V1.5', 'event_label': 'invalid_vote_close' });
  };

  toWithdraw = async value => {
    window.gtag('event', 'PC_invalid_vote_btn', { 'event_category': 'PC_V1.5', 'event_label': 'invalid_vote_btn' });
    const popData = {
      collateralAddress: Config.contract.JST,
      jtokenAddress: Config.contract.oldWJSTAddress,
      amount: BigNumber(value).times(Config.tokenDefaultPrecision)._toHex()
    };

    const intlObj = {
      title: 'toast.ex',
      title2: 'deposit.transactionsent',
      title3: 'toast.ex_failed',
      title4: 'deposit.confirm_transaction',
      obj: {
        value: popData.collateralSymbol
      },
      transType: 'voteWithdraw'
    };
    this.setState({ isSuccess: false, txID: '', approving: true });

    const contractAddress = popData.jtokenAddress;
    let funcSelector = 'withdraw(uint256)';
    let parameters = [{ type: 'uint256', value: popData.amount }];
    const feeLimit = await this.props.system.getFeeLimitCommon(contractAddress, funcSelector, parameters);
    let options = { feeLimit };
    if (popData.collateralAddress === Config.zeroAddr) {
      funcSelector = 'mint()';
      parameters = [];
      options = { callValue: popData.amount, feeLimit };
    }

    const txID = await this.props.system.voteWithdraw(popData, intlObj, options);
    if (txID) {
      this.props.vote.setVoteOldWithdrawModalVisible(false);
    }
    this.setState({ approving: false });
  };

  render() {
    const { theme } = this.props.lend;
    const { approving } = this.state;
    const { transModalInfo } = this.props.system;
    const { voteOldWithdrawModalVisible, oldVoteInfo } = this.props.vote;
    const { declined, transType } = transModalInfo;

    return (
      <Modal
        title={intl.get('v2.vote.redeem_votes')}
        maskClosable={false}
        visible={voteOldWithdrawModalVisible}
        closable={true}
        onCancel={() => {
          this.props.system.clearRejectError();
          this.closeOldAndOpenNewModal();
        }}
        footer={null}
        width={400}
        centered
        className={`vote-old-withdraw-modal-v2 ${theme}`}
        // getContainer={() => document.querySelector('.main')}
      >
        <div className="vote-old-withdraw-content">
          <div className="tick-vote-logo"></div>
          <div className="title">{intl.get('v2.vote.redeem_to_get')}</div>
          <div className="amount">
            {oldVoteInfo &&
              oldVoteInfo.success &&
              oldVoteInfo?.surplusVotes.div(Config.tokenDefaultPrecision).toString()}{' '}
            JST
          </div>
          <div className="desc">{intl.get('v2.vote.redeem_invalid_vote')}</div>
          {approving ? (
            <button className="j-large-btn j-supply j-signing" disabled>
              {intl.get('v2.sign_in_wallet')}
              <span className="siging-icon"></span>
            </button>
          ) : (
            <button
              className="j-large-btn j-supply"
              onClick={() =>
                this.toWithdraw(
                  oldVoteInfo && oldVoteInfo.success && oldVoteInfo?.surplusVotes.div(Config.tokenDefaultPrecision)
                )
              }
            >
              {intl.get('v2.vote.redeem_now')}
            </button>
          )}
          {declined && transType === 'voteWithdraw' && (
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

export default OldVoteWithdraw;
