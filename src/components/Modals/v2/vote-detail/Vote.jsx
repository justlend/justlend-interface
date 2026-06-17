import React from 'react';
import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';
import { Modal, Input } from 'antd';
import classnames from 'classnames';

import Config from '../../../../config';
import {
  BigNumber,
  formatNumber,
  numberParser,
  addThousandSeparators,
  removeThousandSeparators
} from '../../../../utils/helper';

import '../../../../assets/css/v2/modal.scss';
import '../../../../assets/css/v2/vote-detail-modal.scss';

@inject('lend')
@inject('system')
@inject('network')
@inject('vote')
@observer
class Vote extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      isSigning: false,
      voteInputValue: '',
      inputErrorText: ''
    };
  }

  componentDidMount = async () => {
    if (this.props.network.isConnected) {
      this.getMountedData();
    }
    this.props.network.on('connect', () => {
      this.getMountedData();
    });
  };

  getMountedData = async () => {
    await this.props.vote.getUserWithdrawInfo();
  };

  hideVoteForPop = () => {
    this.setState({
      isSigning: false,
      voteInputValue: '',
      inputErrorText: ''
    });
    this.props.vote.setVoteForPop(false);
  };

  getRedeemableVote = () => {
    this.props.vote.setVoteDetailModalVisible(true);

    this.hideVoteForPop();
    window.gtag('event', 'PC_vote_detail_redeem_votes', {
      'event_category': 'PC_V1.5',
      'event_label': 'vote_detail_redeem_votes'
    });
  };
  getVote = () => {
    this.props.system.clearRejectError();
    this.props.vote.setSwapJstToVoteModalVisible(true);

    this.hideVoteForPop();
    window.gtag('event', 'PC_vote_detail_get_votes', {
      'event_category': 'PC_V1.5',
      'event_label': 'vote_detail_get_votes'
    });
  };
  getJst = () => {
    window.open(
      `${Config.sunSwap}?lang=${this.state.lang}?tokenAddress=${Config.contract.JST}&type=swap`,
      '_blank',
      'noreferrer'
    );
    this.hideVoteForPop();
    window.gtag('event', 'PC_vote_detail_get_JST', {
      'event_category': 'PC_V1.5',
      'event_label': 'vote_detail_get_JST'
    });
  };

  maxRender = () => {
    return (
      <div className="max-value-button" onClick={this.chooseMax}>
        {intl.get('v2.max')}
      </div>
    );
  };

  chooseMax = () => {
    const { voteInfo } = this.props.vote;
    let maxValue = formatNumber(voteInfo.surplusVotes.div(Config.tokenDefaultPrecision), 3, { per: true });
    this.setState({ voteInputValue: maxValue });
  };

  voteInputValueOnChange = inputValue => {
    const { valid, str } = numberParser(inputValue, 3);
    if (valid) {
      this.setState({ voteInputValue: str });

      const { voteInfo } = this.props.vote;
      if (voteInfo && voteInfo.success && voteInfo.surplusVotes.div(Config.tokenDefaultPrecision).lt(BigNumber(str))) {
        this.setState({
          inputErrorText: intl.get('v2.vote.vote_modal_insufficient_vote')
        });
      } else {
        this.setState({
          inputErrorText: ''
        });
      }
    }
  };

  vote = async () => {
    this.props.system.clearRejectError();
    this.setState({
      isSigning: true
    });

    const { voteInputValue } = this.state;
    const { lockNum, voteForPopIsFor, voteForPopProposalId } = this.props.vote;

    var isLockNumNonZero = lockNum && BigNumber(lockNum).gt(0);
    if (isLockNumNonZero) {
      window.gtag('event', 'PC_vote_btn', { 'event_category': 'PC_V1.5', 'event_label': 'vote_btn' });
    } else {
      window.gtag('event', 'PC_add_vote_btn', { 'event_category': 'PC_V1.5', 'event_label': 'add_vote_btn' });
    }

    let token = {
      proposalId: voteForPopProposalId,
      support: voteForPopIsFor,
      votes: BigNumber(voteInputValue).times(Config.tokenDefaultPrecision)._toHex(),
      contractAddr: Config.contract.governorAlphaAddress,
      totalVotes: BigNumber(voteInputValue).times(Config.tokenDefaultPrecision).plus(lockNum)._toHex()
    };
    const intlObj = {
      title: 'toast.ex',
      title2: 'deposit.transactionsent',
      title3: 'toast.ex_failed',
      title4: 'deposit.confirm_transaction',
      needCallAgain: 'getVoteDetail',
      obj: {
        value: token.votes,
        token: token.proposalId || ''
      },
      transType: 'vote'
    };

    try {
      const txID = await this.props.system.castVote(token, intlObj);
      if (txID) {
        window.gtag('event', 'PC_vote_success', { 'event_category': 'PC_V1.5', 'event_label': 'vote_success' });
        this.hideVoteForPop();
        setTimeout(() => {
          this.props.vote.getVoteDetail(voteForPopProposalId);
        }, 5000);
      } else {
        this.setState({
          isSigning: false
        });
      }
    } catch (error) {
      this.setState({
        isSigning: false
      });
    }
  };

  render() {
    const { voteForPop, voteForPopIsFor, voteForPopProposalId, lockNum, voteInfo, userCanRedeemVoteNum } =
      this.props.vote;
    const { transModalInfo } = this.props.system;
    const { declined, transType } = transModalInfo;
    const { isSigning, voteInputValue, inputErrorText } = this.state;

    var modalTitle, contentTitle, contentSubtitle, buttonTitle;
    var shouldShowInput;

    var walletHaveVote = false;
    var walletHaveJst = false;
    var walletHaveRedeemableVote = false;
    var voteDisplayString = '--';
    var jstDisplayString = '--';
    var redeemableVoteDisplayString = '--';

    var isLockNumNonZero = lockNum && BigNumber(lockNum).gt(0);
    var walletVoteDisplayString = '--';

    if (voteInfo && voteInfo.success) {
      const vote = BigNumber(voteInfo.surplusVotes);
      const jst = BigNumber(voteInfo.jstBalance);
      const redeemableVote = BigNumber(userCanRedeemVoteNum);
      walletHaveVote = vote.gt(0);
      walletHaveJst = jst.gt(0);
      walletHaveRedeemableVote = redeemableVote.gt(0);
      voteDisplayString = formatNumber(vote.div(Config.tokenDefaultPrecision), 3, {
        miniText: 0.001
      });
      jstDisplayString = formatNumber(jst.div(Config.tokenDefaultPrecision), 3, {
        miniText: 0.001
      });
      redeemableVoteDisplayString = BigNumber(userCanRedeemVoteNum).eq(0)
        ? 0
        : formatNumber(userCanRedeemVoteNum, 3, {
            miniText: 0.001
          });
    }
    if (isLockNumNonZero) {
      const voteValue = BigNumber(lockNum).div(Config.tokenDefaultPrecision);
      walletVoteDisplayString = BigNumber(voteValue).lt(0.001) ? '< 0.001' : formatNumber(voteValue, 3);
    }

    // For dev
    // walletHaveVote = false;
    // walletHaveJst = true;
    // walletHaveRedeemableVote = true;
    // voteDisplayString = '0.123';
    // jstDisplayString = '1800.233';
    // redeemableVoteDisplayString = '200.500';
    // isLockNumNonZero = true;
    // walletVoteDisplayString = '76.123';

    if (!walletHaveVote) {
      modalTitle = intl.get('v2.vote.vote_modal_title_no_vote');
      shouldShowInput = false;
      if (walletHaveRedeemableVote) {
        contentTitle = intl.getHTML('v2.vote.vote_modal_content_title_vote_to_redeem', {
          value: redeemableVoteDisplayString
        });
        buttonTitle = intl.get('v2.vote.vote_modal_action_btn_vote_to_redeem');
        contentSubtitle = intl.get('v2.vote.vote_modal_redeem_vote');
      } else if (walletHaveJst) {
        contentTitle = intl.getHTML('v2.vote.vote_modal_content_title_no_vote', { value: jstDisplayString });
        buttonTitle = intl.get('v2.vote.vote_modal_action_btn_no_vote');
        contentSubtitle = intl.get('v2.vote.vote_modal_swap_jst');
      } else {
        contentTitle = intl.get('v2.vote.vote_modal_content_title_no_jst');
        buttonTitle = intl.get('v2.vote.vote_modal_action_btn_no_jst');
        contentSubtitle = '';
      }
    } else {
      modalTitle = intl.get('v2.vote.vote_modal_title', { value: voteForPopProposalId });
      shouldShowInput = true;

      if (isLockNumNonZero) {
        contentTitle = <span className="vote-title">{walletVoteDisplayString}</span>;
        if (voteForPopIsFor) {
          contentSubtitle = intl.get('v2.vote.vote_modal_content_title_voted_for', {
            value: voteForPopProposalId
          });
        } else {
          contentSubtitle = intl.get('v2.vote.vote_modal_content_title_voted_against', {
            value: voteForPopProposalId
          });
        }
      } else {
        if (voteForPopIsFor) {
          contentTitle = intl.getHTML('v2.vote.vote_modal_content_title_will_vote_for', {
            value: voteForPopProposalId
          });
        } else {
          contentTitle = intl.getHTML('v2.vote.vote_modal_content_title_will_vote_against', {
            value: voteForPopProposalId
          });
        }
        contentSubtitle = '';
      }

      if (isSigning) {
        buttonTitle = intl.get('v2.sign_in_wallet');
      } else if (voteForPopIsFor) {
        buttonTitle = intl.get('v2.vote.cast_for_votes');
      } else {
        buttonTitle = intl.get('v2.vote.cast_against_votes');
      }
    }

    return (
      <Modal
        visible={voteForPop}
        title={modalTitle}
        width={400}
        footer={null}
        className="j-modal header-border vote-pop"
        onCancel={() => {
          this.props.system.clearRejectError();
          this.hideVoteForPop();
          window.gtag('event', 'PC_vote_detail_vote_close', {
            'event_category': 'PC_V1.5',
            'event_label': 'vote_detail_vote_close'
          });
        }}
        closable={true}
        maskClosable={false}
        centered
        getContainer={() => document.querySelector('.j-wrapper')}
      >
        <div className={classnames('modal-content-container', { 'have-input': walletHaveVote })}>
          <div
            className={classnames('content-icon', { 'no-vote': !walletHaveVote && !walletHaveRedeemableVote })}
          ></div>
          <div className="content-title">{contentTitle}</div>
          {contentSubtitle && <div className="content-subtitle">{contentSubtitle}</div>}

          {shouldShowInput && (
            <div className="input-container">
              <div className="input-header">
                <div className="input-title">
                  {isLockNumNonZero
                    ? intl.getHTML('v2.vote.vote_modal_add_vote_count')
                    : intl.getHTML('v2.vote.vote_modal_vote_count')}
                </div>

                <div className="remaining-votes">
                  <div className="text">{intl.get('v2.vote.vote_modal_remaining_vote')}</div>
                  <div className="balance">{voteDisplayString}</div>
                </div>
              </div>
              <Input
                className={'j-input ' + (inputErrorText ? 'j-error-input' : '')}
                value={addThousandSeparators(voteInputValue)}
                placeholder={
                  voteForPopIsFor
                    ? intl.get('v2.vote.vote_modal_input_hint')
                    : intl.get('v2.vote.vote_modal_input_against_hint')
                }
                addonAfter={this.maxRender()}
                onChange={e => this.voteInputValueOnChange(removeThousandSeparators(e.target.value))}
                allowClear
                disabled={isSigning ? true : false}
              />
              <div className={classnames('j-error-tip', { 'show-error': inputErrorText })}>
                <span className="j-error-img"></span>
                <div>{inputErrorText}</div>
              </div>
            </div>
          )}
        </div>

        <button
          className={classnames('j-large-btn', { 'is-signing': walletHaveVote && isSigning })}
          disabled={walletHaveVote && (isSigning || inputErrorText || !voteInputValue || voteInputValue == '0')}
          onClick={() => {
            if (!walletHaveVote) {
              if (walletHaveRedeemableVote) {
                this.getRedeemableVote();
              } else if (walletHaveJst) {
                this.getVote();
              } else {
                this.getJst();
              }
            } else {
              this.vote();
            }
          }}
        >
          {buttonTitle}
          <span className="siging-icon"></span>
        </button>

        {declined && transType === 'vote' && (
          <div className="j-error-tip wallet-reject">
            <span className="j-error-img"></span>
            <div>{intl.get('v2.reject_in_wallet')}</div>
          </div>
        )}
      </Modal>
    );
  }
}

export default Vote;
