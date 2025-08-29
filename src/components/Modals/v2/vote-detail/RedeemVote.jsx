import React from 'react';
import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';
import { Modal } from 'antd';
import classnames from 'classnames';

import Config from '../../../../config';
import { BigNumber, formatNumber } from '../../../../utils/helper';

import TransactionModal from '../../../Modals/v2/Transaction';
import '../../../../assets/css/v2/modal.scss';
import '../../../../assets/css/v2/vote-detail-modal.scss';

@inject('lend')
@inject('system')
@inject('vote')
@observer
class RedeemVote extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isSigning: false
    };
  }

  hideRedeemFromVotePop = () => {
    this.props.system.clearRejectError();

    this.setState({
      isSigning: false
    });

    this.props.vote.setRedeemFromVotePop(false);
    window.gtag('event', 'PC_vote_detail_recycle_close', {
      'event_category': 'PC_V1.5',
      'event_label': 'vote_detail_recycle_close'
    });
  };

  withdrawVotes = async () => {
    this.props.system.clearRejectError();
    window.gtag('event', 'PC_vote_detail_recycle_btn', {
      'event_category': 'PC_V1.5',
      'event_label': 'vote_detail_recycle_btn'
    });
    this.setState({
      isSigning: true
    });

    const { redeemFromVotePopProposalId } = this.props.vote;

    let token = {
      proposalId: redeemFromVotePopProposalId,
      contractAddr: Config.contract.WJSTAddress
    };
    const intlObj = {
      title: 'toast.ex',
      title2: 'deposit.transactionsent',
      title3: 'toast.ex_failed',
      title4: 'deposit.confirm_transaction',
      obj: {
        value: token.votes,
        token: token.proposalId || ''
      },
      transType: 'withdrawVote'
    };

    try {
      const txID = await this.props.system.withdrawVotes(token, intlObj);
      if (txID) {
        window.gtag('event', 'PC_vote_detail_recycle_success', {
          'event_category': 'PC_V1.5',
          'event_label': 'vote_detail_recycle_success'
        });
        this.hideRedeemFromVotePop();
      } else {
        this.setState({
          isSigning: false
        });
      }
    } catch {
      this.setState({
        isSigning: false
      });
    }
  };

  render() {
    const { redeemFromVotePop, lockNum } = this.props.vote;
    const { transModalInfo } = this.props.system;
    const { declined, transType } = transModalInfo;
    const { isSigning } = this.state;

    var buttonTitle;
    var walletVoteDisplayString = '--';

    if (lockNum && lockNum.gt(0)) {
      const voteValue = BigNumber(lockNum).div(Config.tokenDefaultPrecision);
      walletVoteDisplayString = BigNumber(voteValue).lt(0.001) ? '< 0.001' : formatNumber(voteValue, 3);
    }
    if (isSigning) {
      buttonTitle = intl.get('v2.sign_in_wallet');
    } else {
      buttonTitle = intl.get('v2.vote.redeem_vote_modal_btn');
    }

    return (
      <>
        <Modal
          visible={redeemFromVotePop}
          title={intl.get('v2.vote.redeem_vote_modal_title')}
          width={400}
          footer={null}
          className="j-modal header-border redeem-vote-pop"
          onCancel={() => this.hideRedeemFromVotePop()}
          closable={true}
          maskClosable={false}
          centered
          getContainer={() => document.querySelector('.j-wrapper')}
        >
          <div className="modal-content-container">
            <div className="content-icon"></div>
            <div className="content-title">
              {intl.getHTML('v2.vote.redeem_vote_modal_content_title', {
                value: walletVoteDisplayString
              })}
            </div>
            <div className="content-subtitle">{intl.get('v2.vote.redeem_vote_modal_content_subtitle')}</div>
          </div>

          <button
            className={classnames('j-large-btn', { 'is-signing': isSigning })}
            disabled={isSigning}
            onClick={() => {
              this.withdrawVotes();
            }}
          >
            {buttonTitle}
            <span className="siging-icon"></span>
          </button>

          {declined && transType === 'withdrawVote' && (
            <div className="j-error-tip wallet-reject">
              <span className="j-error-img"></span>
              <div>{intl.get('v2.reject_in_wallet')}</div>
            </div>
          )}
        </Modal>
        <TransactionModal></TransactionModal>
      </>
    );
  }
}

export default RedeemVote;
