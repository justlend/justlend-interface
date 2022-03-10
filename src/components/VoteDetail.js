import React from 'react';
import intl from 'react-intl-universal';
import isMobile from 'ismobilejs';
import { Link } from 'react-router-dom';
import { Progress, Tooltip, Timeline, Modal, Input, Spin } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { inject, observer } from 'mobx-react';
import LeftMenu from './LeftMenu';
import Config from '../config';
import TransactionModal from './Modals/Transaction';
import { formatNumber, BigNumber, deduplication, numberParser, getParameterByName } from '../utils/helper';
import '../assets/css/vote.scss';
import timelineSuccessIcon from '../assets/images/timelineSuccessIcon.svg';
import timelineResolvingIcon from '../assets/images/timelineResolvingIcon.svg';
import failIcon from '../assets/images/TransactionCanceled.svg';

@inject('network')
@inject('system')
@inject('lend')
@observer
class VoteDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mobile: isMobile(window.navigator).any,
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      inputValue: '',
      proposalId: '',
      account: '',
      support: true,
      voteFor: '',
      toDeposit: false
    };
  }

  componentDidMount = () => {
    this.props.lend.setData({
      voteDetailData: null
    });
  };

  getProposalId = () => {
    this.props.lend.setData({ lockNum: BigNumber(0) });
    const pId = getParameterByName('proposalId');
    this.setState({ proposalId: pId }, () => {
      this.props.lend.getVoteDetail(pId);
    });
  };

  renderHeader() {
    const { lang } = this.state;
    const { voteDetailData } = this.props.lend;
    // console.log(voteDetailData);
    if (voteDetailData) {
      return (
        <div className="vote-header">
          <div className="fs30 c-0F134F fw600">
            {lang === 'en-US' ? voteDetailData.title.split('&&')[1] : voteDetailData.title.split('&&')[0]}
          </div>
          <div>
            <span className={voteDetailData.intl ? voteDetailData.intl.toLowerCase() + ' status' : 'status'}>
              {voteDetailData.intl}
            </span>
            <span className="c-5A5E89 fs12 ml16">
              # {voteDetailData.proposalId} |{' '}
              {voteDetailData.activeTime ? new Date(voteDetailData.activeTime).format('yyyy-MM-dd h:m:s') : '--'}
            </span>
          </div>
        </div>
      );
    } else {
      return (
        <div className="vote-header">
          <div className="fs30 c-0F134F fw600">--</div>
          <div>
            <span className="status active">--</span>
            <span className="c-5A5E89 fs12 ml16"># -- | --</span>
          </div>
        </div>
      );
    }
  }

  calcProgress = type => {
    const { voteDetailData } = this.props.lend;
    const forVotes = BigNumber(voteDetailData.forVotes).div(Config.tokenDefaultPrecision);
    const againstVotes = BigNumber(voteDetailData.againstVotes).div(Config.tokenDefaultPrecision);
    let forProgress = 0,
      againstProgress = 0,
      res;
    // console.log(forVotes.div(Config.tokenDefaultPrecision).toNumber())
    if (forVotes.gt(Config.voteMaxNum) || againstVotes.gt(Config.voteMaxNum)) {
      if (forVotes.gt(againstVotes)) {
        forProgress = 100;
        againstProgress = againstVotes.div(forVotes).times(100);
      } else {
        againstProgress = 100;
        forProgress = forVotes.div(againstVotes).times(100);
      }
    } else {
      forProgress = forVotes.div(Config.voteMaxNum).times(100);
      againstProgress = againstVotes.div(Config.voteMaxNum).times(100);
    }

    if (type === 1) res = forProgress;
    if (type === 2) res = againstProgress;
    return res;
  };

  renderProgress() {
    const { voteDetailData, lockNum, addVote } = this.props.lend;
    return (
      <div className="progress-info-container flex-between">
        <div className="progress-info">
          <div className="flex-between mb16">
            <span className="flex-between c-0F134F fs14 fw600">
              <span>{intl.getHTML('vote.detail_subtitle_for')}</span>
              {voteDetailData && (voteDetailData.state == '0' || voteDetailData.state == '1') && (
                <Tooltip placement="bottom" title={intl.getHTML('vote.detail_help_how2pass')} arrowPointAtCenter={true}>
                  <span className="tooltip-icon"></span>
                </Tooltip>
              )}
            </span>
            <span className="c-3D56D6 fs16 fw600">
              {voteDetailData
                ? formatNumber(BigNumber(voteDetailData.forVotes).div(Config.tokenDefaultPrecision)._toHex(), 3)
                : '--'}
            </span>
          </div>
          <Progress
            percent={voteDetailData ? voteDetailData.forVotes && this.calcProgress(1) : 0}
            showInfo={false}
            strokeColor="#3D56D6"
            className="mb16"
          />
          {voteDetailData && (voteDetailData.state == '0' || voteDetailData.state == '1') && (
            <button
              className="btn vote-btn blue mb16"
              disabled={addVote == 'no'}
              onClick={() => this.voteForClick(true)}
            >
              {BigNumber(lockNum).gt(0) && addVote == 'yes' ? (
                <>
                  {intl.get('vote.detail_subtitle_fored')}{' '}
                  {formatNumber(BigNumber(lockNum).div(Config.tokenDefaultPrecision), 3)}
                  {' JST'}
                </>
              ) : (
                intl.getHTML('vote.detail_subtitle_for')
              )}
            </button>
          )}
        </div>
        <div className="progress-info">
          <div className="flex-between mb16">
            <span className="c-0F134F fs14 fw600">{intl.getHTML('vote.detail_subtitle_against')}</span>
            <span className="c-FF8718 fs16">
              {voteDetailData
                ? formatNumber(BigNumber(voteDetailData.againstVotes).div(Config.tokenDefaultPrecision)._toHex(), 3)
                : '--'}
            </span>
          </div>
          <Progress
            percent={voteDetailData ? voteDetailData.againstVotes && this.calcProgress(2) : 0}
            showInfo={false}
            strokeColor="#FF8718"
            className="mb16"
          />
          {voteDetailData && (voteDetailData.state == '0' || voteDetailData.state == '1') && (
            <button
              className="btn vote-btn yellow mb16"
              disabled={addVote == 'yes'}
              onClick={() => this.voteForClick(false)}
            >
              {BigNumber(lockNum).gt(0) && addVote == 'no' ? (
                <>
                  {intl.get('vote.detail_subtitle_againsted')}{' '}
                  {formatNumber(BigNumber(lockNum).div(Config.tokenDefaultPrecision), 3)}
                  {' JST'}
                </>
              ) : (
                intl.getHTML('vote.detail_subtitle_against')
              )}
            </button>
          )}
        </div>
      </div>
    );
  }

  voteForClick = support => {
    this.setState({ voteFor: support ? 'yes' : 'no' });
    const { addVote } = this.props.lend;
    if ((addVote === 'yes' && !support) || (addVote === 'no' && support)) {
      return;
    } else {
      this.setState({
        support,
        voteForValue: '',
        toDeposit: false
      });
      this.props.lend.setData({
        voteForPop: true
      });
    }
  };

  // suffix MAX render
  maxRender = () => {
    return (
      <div className="c-0F134F fs12 fw500" onClick={this.chooseMax}>
        {intl.get('vote.voteto_input_max')}
      </div>
    );
  };

  chooseMax = () => {
    const { voteInfo } = this.props.lend;
    let voteForValue = formatNumber(voteInfo.surplusVotes.div(Config.tokenDefaultPrecision), 3, { per: true });
    this.setState({ voteForValue });
  };

  voteForChange = inputValue => {
    const { valid, str } = numberParser(inputValue, 3);
    if (valid) {
      this.setState({ voteForValue: str });
      const { voteInfo } = this.props.lend;
      if (voteInfo && voteInfo.success && voteInfo.surplusVotes.div(Config.tokenDefaultPrecision).lt(BigNumber(str))) {
        this.setState({
          toDeposit: true
        });
      } else {
        this.setState({
          toDeposit: false
        });
      }
    }
  };

  voteForSubmit = async () => {
    const { voteForValue, proposalId, support } = this.state;
    const { voteDetailData } = this.props.lend;
    let token = {
      proposalId: proposalId,
      support,
      votes: BigNumber(voteForValue).times(Config.tokenDefaultPrecision)._toHex(),
      contractAddr: Config.contract.governorAlphaAddress
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
      }
    };
    const txID = await this.props.system.castVote(token, intlObj);
    if (txID) {
      // console.log('castVote complete:', txID);
      this.props.lend.getVoteDetail(proposalId);
      // this.setState({ successPop: true, addVote: this.state.voteFor });
    }
  };

  withdrawVotes = async () => {
    const { lockNum } = this.props.lend;
    const { proposalId } = this.state;
    if (lockNum.lte(0)) return;
    let token = {
      proposalId: proposalId,
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
      }
    };
    const txID = await this.props.system.withdrawVotes(token, intlObj);
    if (txID) {
      console.log('withdrawVotes complete:', txID);
      this.props.lend.setData({ redeemFromVotePop: false });
    }
  };

  renderDetail() {
    const { lang } = this.state;
    const { voteDetailData } = this.props.lend;
    return (
      <div className="vote-detail-info">
        <div className="fs14 c-0F134F fw600">{intl.getHTML('vote.detail_subtitle_details')}</div>
        <div className="horizontal-line title mt13 mb16"></div>
        <div
          className="detail-text"
          dangerouslySetInnerHTML={{
            __html: voteDetailData
              ? lang === 'en-US'
                ? voteDetailData.content.split('&&&&&&&&')[0]
                : voteDetailData.content.split('&&&&&&&&')[1]
              : ''
          }}
        ></div>
      </div>
    );
  }

  renderTimeline() {
    const timelineSuccessIcon = this.renderTimelineSuccessIcon();
    const timelineResolvingIcon = this.renderTimelineResolvingIcon();
    const failedIcon = this.renderTimelineFailedIcon();
    const { voteDetailData } = this.props.lend;
    return (
      <div className="vote-detail-timeline">
        <div className="fs14 c-0F134F fw600">{intl.getHTML('vote.detail_subtitle_steps')}</div>
        <div className="horizontal-line mt13 mb20"></div>
        {voteDetailData && (
          <Timeline>
            <Timeline.Item dot={timelineSuccessIcon}>
              <p className="tl-title">{intl.getHTML('vote.detail_step1_create')}</p>
              <p className="tl-date">{new Date(voteDetailData.activeTime).format('yyyy-MM-dd h:m:s')}</p>
            </Timeline.Item>
            {voteDetailData.state != 2 && (
              <Timeline.Item dot={timelineSuccessIcon}>
                <p className="tl-title">{intl.getHTML('vote.detail_step2_startvote')}</p>
                <p className="tl-date">{new Date(voteDetailData.activeTime).format('yyyy-MM-dd h:m:s')}</p>
              </Timeline.Item>
            )}
            {voteDetailData.state == 2 && (
              <Timeline.Item dot={failedIcon}>
                <p className="tl-title">{intl.getHTML('vote.detail_cancel_create')}</p>
                <p className="tl-date">{new Date(voteDetailData.cancelTime).format('yyyy-MM-dd h:m:s')}</p>
              </Timeline.Item>
            )}
            {voteDetailData.state == 3 && (
              <Timeline.Item dot={failedIcon}>
                <p className="tl-title">{intl.getHTML('vote.detail_step3_faild')}</p>
                <p className="tl-date">{new Date(voteDetailData.endTime).format('yyyy-MM-dd h:m:s')}</p>
              </Timeline.Item>
            )}
            {voteDetailData.state > 3 && (
              <Timeline.Item dot={timelineSuccessIcon}>
                <p className="tl-title">{intl.getHTML('vote.detail_step3_pass')}</p>
                <p className="tl-date">{new Date(voteDetailData.endTime).format('yyyy-MM-dd h:m:s')}</p>
              </Timeline.Item>
            )}
            {voteDetailData.state == 5 && (
              <Timeline.Item dot={timelineResolvingIcon}>
                <p className="tl-title">{intl.getHTML('vote.detail_queuing')}</p>
                <p className="tl-date">{new Date(voteDetailData.queuedTime).format('yyyy-MM-dd h:m:s')}</p>
              </Timeline.Item>
            )}
            {voteDetailData.state > 5 && (
              <Timeline.Item dot={timelineSuccessIcon}>
                <p className="tl-title">{intl.getHTML('vote.detail_expired_queuing')}</p>
                <p className="tl-date">{new Date(voteDetailData.queuedTime).format('yyyy-MM-dd h:m:s')}</p>
              </Timeline.Item>
            )}
            {voteDetailData.state == 6 && (
              <Timeline.Item dot={failedIcon}>
                <p className="tl-title">{intl.getHTML('vote.detail_step5_expired')}</p>
                <p className="tl-date">
                  {new Date(voteDetailData.queuedTime + 3 * 24 * 3600 * 1000).format('yyyy-MM-dd h:m:s')}
                </p>
              </Timeline.Item>
            )}
            {voteDetailData.state == 7 && (
              <Timeline.Item dot={timelineSuccessIcon}>
                <p className="tl-title">{intl.getHTML('vote.detail_step5_executed')}</p>
                <p className="tl-date">{new Date(voteDetailData.executedTime).format('yyyy-MM-dd h:m:s')}</p>
              </Timeline.Item>
            )}
          </Timeline>
        )}
      </div>
    );
  }

  renderTimelineSuccessIcon() {
    return <img src={timelineSuccessIcon} />;
  }

  renderTimelineResolvingIcon() {
    return <img src={timelineResolvingIcon} />;
  }

  renderTimelineFailedIcon() {
    return <img src={failIcon} />;
  }

  renderRedeem = () => {
    const { lockNum } = this.props.lend;
    return (
      lockNum && (
        <div className="wait-withdraw flex-between" onClick={() => this.showRedeemFromVotePop()}>
          <span className="title">{intl.get('vote.detail_subtitle_back')}</span>
          <div>
            <span className="num">{formatNumber(lockNum.div(Config.tokenDefaultPrecision), 3)} JST</span>
            <span className="angle-right"> </span>
          </div>
        </div>
      )
    );
  };

  showRedeemFromVotePop = () => {
    this.props.lend.setData({ redeemFromVotePop: true });
  };

  renderVoteFor = () => {
    const { voteForValue, toDeposit, lang } = this.state;
    const { voteInfo, voteDetailData } = this.props.lend;
    return (
      <>
        <div className="c-84869E fs14 tac deep-span">
          {intl.getHTML('vote.voteto_subtitle', {
            d: '# ' + voteDetailData.proposalId,
            s: lang === 'en-US' ? voteDetailData.title.split('&&')[1] : voteDetailData.title.split('&&')[0]
          })}
        </div>
        <div className="horizontal-line"></div>
        <div className="c-84869E fs12 mb8">{intl.getHTML('vote.voteto_vote_amount2')}</div>
        <div className="detail">
          <Input
            value={voteForValue}
            placeholder={intl.get('vote.voteto_input_tips')}
            suffix={this.maxRender()}
            onChange={e => this.voteForChange(e.target.value)}
          />
        </div>
        <div className="horizontal-line"></div>
        <div className="flex-between mb16">
          <span className="c-84869E fs12">{intl.getHTML('vote.voteto_subtitle_votebal')}</span>
          <span className="c-0F134F fs14 fw600">
            {voteInfo &&
              voteInfo.success &&
              formatNumber(voteInfo.surplusVotes.div(Config.tokenDefaultPrecision), 3, { miniText: 0.001 })}{' '}
            <Link className="vote-deposit-link" to="./vote">
              {intl.get('vote.deposit_btn_deposit')}
            </Link>
          </span>
        </div>
        <button
          className="modal-btn authorize-btn"
          onClick={() => this.voteForSubmit()}
          disabled={
            (voteInfo &&
              voteInfo.success &&
              (voteInfo.surplusVotes.lte(0) ||
                voteInfo.surplusVotes.div(Config.tokenDefaultPrecision).lt(BigNumber(voteForValue)))) ||
            !BigNumber(voteForValue).gt(0)
          }
        >
          {BigNumber(voteForValue).gt(0)
            ? !toDeposit
              ? intl.getHTML('vote.voteto_btn')
              : intl.get('vote.voteto_vote_Insufficient')
            : intl.get('vote.voteto_input_tips')}
        </button>
      </>
    );
  };

  renderRedeemFrom = () => {
    const { lockNum } = this.props.lend;
    return (
      <>
        <div className="fs14 c-84869E mb16 tac">{intl.getHTML('vote.back_text')}</div>
        <div className="wait-detail flex-between mb16">
          <span>{intl.getHTML('vote.back_takeback')}</span>
          <span>{lockNum && formatNumber(lockNum.div(Config.tokenDefaultPrecision), 3)} JST</span>
        </div>
        <button
          className="modal-btn authorize-btn"
          disabled={lockNum && lockNum.lte(0)}
          onClick={() => this.withdrawVotes()}
        >
          {intl.getHTML('vote.back_btn')}
        </button>
      </>
    );
  };

  hideVoteDetailPop = () => {
    this.props.lend.setData({
      voteForPop: false,
      redeemFromVotePop: false
    });
  };

  render() {
    const { mobile } = this.state;
    const { voteForPop, redeemFromVotePop, voteDetailData, lockNum } = this.props.lend;
    const { isConnected, menuFlag } = this.props.network;
    let modalShow = voteForPop || redeemFromVotePop;
    let modalTitle = '';
    if (voteDetailData && voteDetailData.state != '1' && voteDetailData.state != '0') {
      modalTitle = intl.getHTML('vote.back_title');
    } else if (voteDetailData && (voteDetailData.state == '1' || voteDetailData.state == '0')) {
      modalTitle = intl.get('vote.voteto_title', { value: '# ' + voteDetailData.proposalId });
    }
    // console.log("voteDetailData: ", voteDetailData);
    return (
      <div className={mobile ? '' : 'flex-end'}>
        <LeftMenu mountedActions={this.getProposalId}></LeftMenu>
        <div
          className={
            mobile
              ? 'vote-detail-container right-container mobile-right-container'
              : menuFlag
                ? 'vote-detail-container right-container'
                : 'vote-detail-container right-container max-width'
          }
        >
          {voteDetailData || !isConnected ? (
            <>
              {this.renderHeader()}
              {this.renderProgress()}
              {voteDetailData &&
                voteDetailData.state != '1' &&
                voteDetailData.state != '0' &&
                lockNum &&
                lockNum.gt(0) &&
                this.renderRedeem()}
              {/* {this.renderRedeem()} */}
              <div className="vote-detail-info-container flex-between">
                {this.renderDetail()}
                {this.renderTimeline()}
              </div>
            </>
          ) : (
            <div className="please-login-first">
              <Spin />
            </div>
          )}
          <Modal
            visible={modalShow}
            title={modalTitle}
            width={400}
            footer={null}
            className="votefor-modal"
            onCancel={() => this.hideVoteDetailPop()}
          >
            {voteForPop ? this.renderVoteFor() : this.renderRedeemFrom()}
          </Modal>
        </div>
        <TransactionModal></TransactionModal>
      </div>
    );
  }
}

export default VoteDetail;
