import React from 'react';
import isMobile from 'ismobilejs';
import { inject, observer } from 'mobx-react';
import { BigNumber, formatNumber } from '../../../utils/helper';
import { Modal } from 'antd';
import intl from 'react-intl-universal';
import Config from '../../../config';

import '../../../assets/css/v2/modal.scss';
import '../../../assets/css/v2/vote-detail-modal.scss';

@inject('network')
@inject('lend')
@inject('system')
@observer
class VoteDetailModal extends React.Component {
  constructor() {
    super();
    this.timerInterval = null;
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      visible: false,
      clickProposalId: ''
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

  withdrawVotes = async proposalId => {
    // const { lockNum } = this.props.lend;
    // if (lockNum.lte(0)) return;

    window.gtag('event', 'PC_recycle_votes_modal', {
      'event_category': 'PC_V1.5',
      'event_label': 'recycle_votes_modal'
    });
    this.setState({
      clickProposalId: proposalId
    });
    this.props.system.clearRejectError();
    const { oldVoteLastId } = Config;
    const contractAddr = proposalId <= oldVoteLastId ? Config.contract.oldWJSTAddress : Config.contract.WJSTAddress;
    let token = {
      proposalId,
      contractAddr
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
      transType: 'withdrawVotes'
    };

    const contractAddress = token.contractAddr;
    let funcSelector = 'withdrawVotes(uint256)';
    let parameters = [{ type: 'uint256', value: token.proposalId }];
    const feeLimit = await this.props.system.getFeeLimitCommon(contractAddress, funcSelector, parameters);
    const options = { feeLimit };

    const txID = await this.props.system.withdrawVotes(token, intlObj, options);
    if (txID) {
      window.gtag('event', 'PC_recycle_votes_modal_success', {
        'event_category': 'PC_V1.5',
        'event_label': 'recycle_votes_modal_success'
      });
      //console.log('withdrawVotes complete:', txID);
      this.props.lend.setData({ redeemFromVotePop: false });
      this.setState({
        clickProposalId: ''
      });
    } else {
      this.setState({
        clickProposalId: ''
      });
    }
  };

  renderVoting = (data, canRetrieve = false) => {
    const { voteSourceData } = this.props.lend;
    const { lang, clickProposalId } = this.state;

    if (data?.length > 0) {
      return data?.map((item, index) => {
        const voteDisplayString = BigNumber(item.allVotes).eq(0)
          ? '0'
          : BigNumber(item.allVotes).lt(0.001)
          ? '< 0.001'
          : formatNumber(item.allVotes, 3);

        return (
          <div className="vote-detail-item" key={index}>
            <div className="hide-md">
              <div className="proposalId">#{item?.proposalId}</div>
              <div className={'title ' + (lang === 'en-US' ? '' : 'zh')}>
                {voteSourceData && voteSourceData[item?.proposalId]?.title
                  ? lang === 'en-US'
                    ? voteSourceData[item.proposalId].title.split('&&')[1]
                    : voteSourceData[item.proposalId].title.split('&&')[0]
                  : ''}
              </div>
              <div className="amount ellipsis" title={voteDisplayString}>
                {voteDisplayString}
              </div>
              {canRetrieve &&
                (!clickProposalId ? (
                  <div className="link" onClick={() => this.withdrawVotes(item.proposalId)}>
                    {intl.get('v2.vote.redeem_vote_btn')}
                  </div>
                ) : clickProposalId === item.proposalId ? (
                  <div className="link disabled">
                    <span className="siging-icon"></span>
                  </div>
                ) : (
                  <div className="link disabled">{intl.get('v2.vote.redeem_vote_btn')}</div>
                ))}
            </div>

            <div className="hide-pc">
              <div className="proposalId">#{item?.proposalId}</div>

              <div className="middle-part">
                <div className={'title ' + (lang === 'en-US' ? '' : 'zh')}>
                  {voteSourceData && voteSourceData[item?.proposalId]?.title
                    ? lang === 'en-US'
                      ? voteSourceData[item.proposalId].title.split('&&')[1]
                      : voteSourceData[item.proposalId].title.split('&&')[0]
                    : ''}
                </div>
                <div className="amount ellipsis" title={voteDisplayString}>
                  {voteDisplayString}
                </div>
              </div>

              {canRetrieve &&
                (!clickProposalId ? (
                  <div className="link" onClick={() => this.withdrawVotes(item.proposalId)}>
                    {intl.get('v2.vote.redeem_vote_btn')}
                  </div>
                ) : clickProposalId === item.proposalId ? (
                  <div className="link disabled">
                    <span className="siging-icon"></span>
                  </div>
                ) : (
                  <div className="link disabled">{intl.get('v2.vote.redeem_vote_btn')}</div>
                ))}
            </div>
          </div>
        );
      });
    }
  };

  render() {
    const { userCanRedeemVoteList, userVotingVote, voteDetailModalVisible, userCanRedeemVoteNum, theme } =
      this.props.lend;

    const { clickProposalId } = this.state;
    const { transModalInfo } = this.props.system;
    const { declined, transType } = transModalInfo;

    const canRedeemVoteNum = BigNumber(userCanRedeemVoteNum).eq(0)
      ? 0
      : formatNumber(userCanRedeemVoteNum, 3, {
          miniText: 0.001
        });

    return (
      <Modal
        title={intl.get('v2.vote.recovered_vote')}
        maskClosable={false}
        visible={voteDetailModalVisible}
        closable={true}
        onCancel={() => {
          this.props.system.clearRejectError();
          this.props.lend.setData({ voteDetailModalVisible: false });
          window.gtag('event', 'PC_recycle_votes_close', {
            'event_category': 'PC_V1.5',
            'event_label': 'recycle_votes_close'
          });
        }}
        footer={null}
        className={`vote-detail-modal-v2 ${theme}`}
        width={457}
        centered
        // getContainer={() => document.querySelector('.main')}
      >
        <div className="tick-vote-logo"></div>
        <p className="redeemNum">
          {intl.getHTML('v2.vote.recover_vote', {
            value: canRedeemVoteNum
          })}
        </p>
        {(userVotingVote && userVotingVote?.length > 0) ||
        (userCanRedeemVoteList && userCanRedeemVoteList?.length > 0) ? (
          <div className="vote-detail-container">
            {userCanRedeemVoteList.length > 4 && <div className="linear"></div>}
            {/*{userVotingVote.length > 0 && <div className="box full">{this.renderVoting(userVotingVote)}</div>}*/}
            {userCanRedeemVoteList && userCanRedeemVoteList?.length > 0 && (
              <>
                <div className="box">{this.renderVoting(userCanRedeemVoteList, true)}</div>
              </>
            )}

            {!clickProposalId ? (
              declined &&
              transType === 'withdrawVotes' && (
                <div className="info">
                  <div className="j-reject-tip">
                    <span className="j-reject-img mt-3"></span>
                    <span>{intl.get('v2.reject_in_wallet')}</span>
                  </div>
                </div>
              )
            ) : (
              <div className="info">
                <div className="j-sign-tip flex aic jcc">
                  {/* <span className="j-sign-img"></span> */}
                  <span className="j-warning-icon"></span>
                  <span>{intl.get('v2.sign_in_wallet')}</span>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    );
  }
}

export default VoteDetailModal;
