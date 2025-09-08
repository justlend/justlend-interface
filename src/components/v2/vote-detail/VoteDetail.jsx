import React from 'react';
import intl from 'react-intl-universal';
import isMobile from 'ismobilejs';
import classnames from 'classnames';
import { inject, observer } from 'mobx-react';
import { Button, Input, Spin, Tooltip } from 'antd';
import { EditOutlined } from '@ant-design/icons';

import { Link } from 'react-router-dom';
import WinterTheme from '../../WinterTheme';
import Config from '../../../config';
import { BigNumber, getParameterByName, formatNumber, skeletonRender } from '../../../utils/helper';
import Footer from '../Footer.js';
import Header from '../Header.js';
import TabsBar from '../mobile/TabsBar';
import SeasonToolBar from '../season/index';

import RedeemVote from '../../Modals/v2/vote-detail/RedeemVote';
import Vote from '../../Modals/v2/vote-detail/Vote';
import SwapJstToVote from '../../Modals/v2/vote-detail/SwapJstToVote';
import TransactionModal from '../../Modals/v2/Transaction';
import VoteDetailModal from '../../Modals/v2/VoteDetail';

import '../../../assets/css/v2/vote-detail.scss';

const StatusIcon = {
  Succeeded: 'succeeded',
  Failed: 'failed',
  Pending: 'pending',
  Waiting: 'waiting'
};
@inject('network')
@inject('system')
@inject('lend')
@observer
class VoteDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isMobileLayout: window.innerWidth < 799,
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      proposalId: undefined,
      shouldExpandTimeline: false,
      mobile: isMobile(window.navigator).any,
      editMode: 0,
      previewDetailContent: null,
      env: process.env.REACT_APP_ENV
    };
  }

  componentDidMount = async () => {
    document.title = 'Vote - JustLend DAO';
    this.props.lend.setData({
      voteDetailData: null
    });

    this.getProposalIdFromUrl();
    this.startInterval();
    window.addEventListener('resize', this.handleResize);
  };

  startInterval = async () => {
    if (!this.timerInterval) {
      if (this.state.proposalId) {
        await this.props.lend.getVoteDetail(this.state.proposalId);
      }
      this.timerInterval = setInterval(async () => {
        if (this.state.proposalId) {
          await this.props.lend.getVoteDetail(this.state.proposalId);
        }
      }, 30000);
    }
  };

  componentWillUnmount() {
    clearInterval(this.timerInterval);
    this.timerInterval = null;

    window.removeEventListener('resize', this.handleResize);
  }

  handleResize = () => {
    this.setState({
      isMobileLayout: window.innerWidth < 799
    });
  };

  getProposalIdFromUrl = () => {
    this.props.lend.setData({ lockNum: BigNumber(0) });
    const pId = getParameterByName('proposalId');
    this.setState({ proposalId: pId }, () => {
      this.props.lend.getVoteDetail(pId);
    });
  };

  getFormattedTimeString = time => {
    return new Date(time).format('yyyy-MM-dd h:m:s');
  };

  showRedeemFromVotePop = () => {
    const { proposalId } = this.state;

    this.props.lend.setData({
      redeemFromVotePop: true,
      redeemFromVotePopProposalId: proposalId
    });

    // For dev
    // this.props.lend.setData({ lockNum: BigNumber(601000000000000000000) });
  };

  voteAgainstButtonOnClick = () => {
    const { proposalId } = this.state;
    const { addVote } = this.props.lend;

    if (this.props.network.isRightChain === 0) {
      this.props.network.changeChain();
      return;
    }

    if (this.props.network.isMainNetwork === 0) {
      this.props.network.showNetworkErrorModal();
      return;
    }

    if (addVote === 'yes') {
      return;
    }

    this.props.lend.setData({
      voteForPop: true,
      voteForPopIsFor: false,
      voteForPopProposalId: proposalId
    });
  };

  voteForButtonOnClick = () => {
    const { proposalId } = this.state;
    const { addVote } = this.props.lend;

    if (this.props.network.isRightChain === 0) {
      this.props.network.changeChain();
      return;
    }

    if (this.props.network.isMainNetwork === 0) {
      this.props.network.showNetworkErrorModal();
      return;
    }

    if (addVote === 'no') {
      return;
    }

    this.props.lend.setData({
      voteForPop: true,
      voteForPopIsFor: true,
      voteForPopProposalId: proposalId
    });
  };

  renderStatusItem = (history, expandable = false, collapsed = false, index) => {
    return (
      <div
        className={classnames('status-history', { 'expandable': expandable }, { 'collapsed': collapsed })}
        key={'history' + history.status + '_' + index}
      >
        <div
          className={classnames('expand-button', { 'visible': expandable })}
          onMouseEnter={() => {
            this.setState({ shouldExpandTimeline: true });
            window.gtag('event', 'PC_vote_detail_expand', {
              'event_category': 'PC_V1.5',
              'event_label': 'vote_detail_expand'
            });
          }}
          onMouseLeave={() => {
            this.setState({ shouldExpandTimeline: false });
          }}
        >
          {intl.get('v2.vote.status_expand_btn')}
        </div>
        <div
          className={classnames(
            'timeline-icon',
            { 'succeeded': history.icon === StatusIcon.Succeeded },
            { 'failed': history.icon === StatusIcon.Failed },
            { 'pending': history.icon === StatusIcon.Pending },
            { 'waiting': history.icon === StatusIcon.Waiting }
          )}
        ></div>
        <div className={classnames('status-title', { 'hover-enabled': history.hoverHint })}>
          {history.title}
          {history.hoverHint && <div className="hover-hint">{history.hoverHint}</div>}
        </div>
        <div className="status-time">{history.timeString}</div>
        <div className="timeline-dot"></div>
        <div className="timeline-arrow-dot"></div>
      </div>
    );
  };

  loadingRender = () => {
    const { theme } = this.props.lend;
    const { mobile } = this.state;
    return (
      <div className="vote-detail-skeleton">
        <div className="vote-detail">
          <div className="back-to-vote-button">{skeletonRender()}</div>
          <div className="vote-detail-header">
            <div className="vote-detail-title-container">
              <div className="vote-detail-title">{skeletonRender()}</div>
              <div className="vote-detail-links-row">{skeletonRender()}</div>
              <div className="vote-detail-title">{skeletonRender()}</div>
            </div>
            <div className="vote-detail-status-box content-container">
              {mobile ? (
                <>
                  {new Array(2).fill(1).map(() => {
                    return (
                      <div className="status-history">
                        <div className="timeline-icon circle "></div>
                        <div className="status-title">{skeletonRender()}</div>
                        <div className="status-time">{skeletonRender()}</div>
                      </div>
                    );
                  })}
                  <div className="status-history">
                    <div className="timeline-icon  circle"></div>
                    <div className="status-title">{skeletonRender()}</div>
                    <div className="status-time">{skeletonRender()}</div>
                  </div>
                </>
              ) : (
                new Array(3).fill(1).map(() => skeletonRender())
              )}
            </div>
          </div>
          <div className="progress-bar-container no-vote">
            <div className="support-progress-bar-container">
              <div className="progress-bar-title show-vote-icon">
                {skeletonRender()}
                {mobile && skeletonRender()}
              </div>

              <div className="progress-bar-background">
                <div className="progress-bar"></div>
              </div>
              <div className="progress-bar"></div>
              <div className="progress-bar square-upper-half"></div>
            </div>
            <div className="against-progress-bar-container zero-vote">
              <div className="progress-bar-title">
                {skeletonRender()}
                {mobile && skeletonRender()}
              </div>
              <div className="progress-bar-background">
                <div className="progress-bar"></div>
              </div>
              <div className="progress-bar"></div>
              <div className="progress-bar square-upper-half"></div>
            </div>
          </div>

          <div className="redeem-vote-bar content-container content-container-shadow">
            <div className="bar-title">{skeletonRender()}</div>
            <button className="bar-action-btn">{skeletonRender()}</button>
          </div>

          <div className="vote-detail-info-container content-container content-container-shadow">
            <div className="vote-detail-info-header">{skeletonRender()}</div>
            {mobile ? (
              <div className={'vote-detail-info-text ' + (theme !== 'white' ? 'dark' : '')}>
                {new Array(2).fill(1).map(() => skeletonRender())}
              </div>
            ) : (
              <div className={'vote-detail-info-text ' + (theme !== 'white' ? 'dark' : '')}>
                {new Array(6).fill(1).map(() => skeletonRender())}
                <div style={{ margin: '25px 0 20px' }}>{skeletonRender({ rows: 12 })}</div>
                {new Array(2).fill(1).map(() => skeletonRender())}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  editVoteDetail = () => {
    this.setState({ editMode: 1 });
  };

  previewVoteDetail = () => {
    this.setState({ editMode: 2 });
  };

  render() {
    const { lang, isMobileLayout, shouldExpandTimeline } = this.state;
    const { theme, voteDetailData, addVote, lockNum } = this.props.lend;

    const { isConnected } = this.props.network;

    const isEN = lang === 'en-US';
    var title, id, htmlContent;
    var statusHistoryArray = [];
    var shouldShowExpandableStatusBox = false;
    var shouldShowProgressBar;
    var isForVoteNonZero, isAgainstVoteNonZero, forVoteDisplayString, againstVoteDisplayString, supportPercentage;
    var shouldShowVoteCTA, isWalletVotedFor, isWalletVotedAgainst, walletVoteDisplayString;
    var shouldShowRedeemVoteBar;

    if (voteDetailData) {
      // console.log('voteDetailData: ', JSON.stringify(voteDetailData));

      // Header
      title = isEN ? voteDetailData.title.split('&&')[1] : voteDetailData.title.split('&&')[0];
      id = voteDetailData.proposalId;
      htmlContent = isEN ? voteDetailData.content.split('&&&&&&&&')[0] : voteDetailData.content.split('&&&&&&&&')[1];

      // Status history box
      const voteState = voteDetailData.state;
      statusHistoryArray.push({
        'status': 'creation',
        'icon': StatusIcon.Succeeded,
        'title': intl.get('v2.vote.status_created'),
        'timeString': this.getFormattedTimeString(voteDetailData.activeTime)
      });
      if (voteState != 2) {
        statusHistoryArray.push({
          'status': 'voting',
          'icon': StatusIcon.Succeeded,
          'title': intl.get('v2.vote.voting_begun'),
          'timeString': this.getFormattedTimeString(voteDetailData.activeTime)
        });
      }
      if (voteState < 2) {
        statusHistoryArray.push({
          'status': 'confirmingVotingResult',
          'icon': StatusIcon.Pending,
          'title': intl.get('v2.vote.status_result_confirm'),
          'timeString': this.getFormattedTimeString(voteDetailData.endTime)
        });
      }
      if (voteState == 2) {
        statusHistoryArray.push({
          'status': 'cancelCreation',
          'icon': StatusIcon.Failed,
          'title': intl.get('v2.vote.status_cancel_creation'),
          'timeString': this.getFormattedTimeString(voteDetailData.cancelTime)
        });
      }
      if (voteState == 3) {
        statusHistoryArray.push({
          'status': 'failed',
          'icon': StatusIcon.Failed,
          'title': intl.get('v2.vote.status_failed'),
          'hoverHint': intl.get('v2.vote.status_hint_insufficient_vote_count'),
          'timeString': this.getFormattedTimeString(voteDetailData.endTime)
        });
      }
      if (voteState > 3 && voteState != 6) {
        statusHistoryArray.push({
          'status': 'passed',
          'icon': StatusIcon.Succeeded,
          'title': intl.get('v2.vote.status_passed'),
          'timeString': this.getFormattedTimeString(voteDetailData.endTime)
        });
      }
      if (voteState == 4) {
        statusHistoryArray.push({
          'status': 'waitForQueue',
          'icon': StatusIcon.Pending,
          'title': intl.get('v2.vote.status_wait_for_queue'),
          'timeString': this.getFormattedTimeString(voteDetailData.endTime)
        });
      }
      if (voteState == 5 || voteState == 7) {
        statusHistoryArray.push({
          'status': 'queuing',
          'icon': StatusIcon.Succeeded,
          'title': intl.get('v2.vote.status_queuing'),
          'timeString': this.getFormattedTimeString(voteDetailData.queuedTime)
        });
      }
      if (voteState == 6) {
        statusHistoryArray.push({
          'status': 'cancelled',
          'icon': StatusIcon.Failed,
          'title': intl.get('v2.vote.status_expired'),
          'hoverHint': '',
          'timeString': this.getFormattedTimeString(voteDetailData.queuedTime + 3 * 24 * 3600 * 1000)
        });
      }
      if (voteState == 7) {
        statusHistoryArray.push({
          'status': 'executed',
          'icon': StatusIcon.Succeeded,
          'title': intl.get('v2.vote.status_executed'),
          'hoverHint': '',
          'timeString': this.getFormattedTimeString(voteDetailData.executedTime)
        });
      }
      shouldShowExpandableStatusBox = statusHistoryArray.length > 3 && !isMobileLayout;

      // For/Against vote
      shouldShowProgressBar = voteState != '6';
      const forVoteCount = BigNumber(voteDetailData.forVotes).div(Config.tokenDefaultPrecision);
      const againstVoteCount = BigNumber(voteDetailData.againstVotes).div(Config.tokenDefaultPrecision);
      isForVoteNonZero = forVoteCount.gt(0);
      isAgainstVoteNonZero = againstVoteCount.gt(0);
      forVoteDisplayString = BigNumber(forVoteCount).eq(0)
        ? '0'
        : BigNumber(forVoteCount).lt(0.001)
        ? '< 0.001'
        : formatNumber(forVoteCount, 3);
      againstVoteDisplayString = BigNumber(againstVoteCount).eq(0)
        ? '0'
        : BigNumber(againstVoteCount).lt(0.001)
        ? '< 0.001'
        : formatNumber(againstVoteCount, 3);
      if (forVoteCount <= 0 && againstVoteCount <= 0) {
        supportPercentage = -1;
      } else {
        if (forVoteCount <= 0) {
          supportPercentage = 0;
        } else if (againstVoteCount <= 0) {
          supportPercentage = 100;
        } else {
          var ratio = forVoteCount / againstVoteCount;
          supportPercentage = BigNumber((ratio / (1 + ratio)) * 100).integerValue(BigNumber.ROUND_HALF_UP);
        }
      }

      // Wallet vote and action button
      var isLockNumNonZero = BigNumber(lockNum).gt(0);
      shouldShowVoteCTA = voteState == 0 || voteState == 1;
      isWalletVotedAgainst = addVote == 'no' && isLockNumNonZero;
      isWalletVotedFor = addVote == 'yes' && isLockNumNonZero;
      const voteValue = BigNumber(lockNum).div(Config.tokenDefaultPrecision);
      walletVoteDisplayString = BigNumber(voteValue).eq(0)
        ? '0'
        : BigNumber(voteValue).lt(0.001)
        ? '< 0.001'
        : formatNumber(voteValue, 3);

      // Redeem
      shouldShowRedeemVoteBar = isConnected && voteState != '1' && voteState != '0' && isLockNumNonZero;

      // For Dev
      // shouldShowVoteCTA = true;
      // isWalletVotedFor = true;
      // isWalletVotedAgainst = true;
      // walletVoteDisplayString = "76.123";
      // shouldShowRedeemVoteBar = true;
    }
    let previewDetailContent = window.localStorage.getItem('previewDetailContent');

    return (
      <>
        <div className={'j-wrapper ' + theme + (Config.winterThemeVisible ? ' snow-show' : '')}>
          {Config.winterThemeVisible && <WinterTheme fromPage="voteDetail" />}
          <Header></Header>
          <SeasonToolBar pageName="voteDetail" />

          <div className="j-container">
            {voteDetailData ? (
              <div className="vote-detail">
                <Link className="back-to-vote-button" to="/voteNew">
                  {intl.get('v2.vote.back_to_vote_btn')}
                </Link>

                <div className="vote-detail-header">
                  <div className="vote-detail-title-container">
                    <div className="vote-detail-title">
                      {title}
                      <span className="proposal-id-tag">{'#' + id}</span>
                    </div>
                    <div className="vote-detail-links-row">
                      <a
                        className="link-item"
                        href={Config.tronscanUrl + '/address/' + voteDetailData?.proposer}
                        target="tronscan"
                        onClick={window.gtag('event', 'PC_vote_on_chain_info', {
                          'event_category': 'PC_V1.5',
                          'event_label': 'vote_on_chain_info'
                        })}
                      >
                        {intl.get('v2.vote.header_chain_info_link')}
                      </a>
                      {/* <a className="link-item" href={Config.github} target="_blank">
                  GitHub
                </a>
                <a className="link-item" href={Config.forum} target="_blank">
                  Forum
                </a> */}
                    </div>
                  </div>
                  <div
                    className={classnames('vote-detail-status-box content-container', {
                      'invisible-content': shouldShowExpandableStatusBox
                    })}
                  >
                    {shouldShowExpandableStatusBox
                      ? statusHistoryArray.map((history, index) => {
                          if (index === 0 || index > statusHistoryArray.length - 3) {
                            return this.renderStatusItem(history, index === 0, false, index);
                          }
                        })
                      : statusHistoryArray.map((history, index) => {
                          return this.renderStatusItem(history, false, false, index);
                        })}
                    {shouldShowExpandableStatusBox && (
                      <div
                        className={classnames('vote-detail-status-box content-container expandable-display', {
                          'expanding': shouldExpandTimeline
                        })}
                      >
                        {shouldExpandTimeline
                          ? statusHistoryArray.map((history, index) => {
                              return this.renderStatusItem(history, false, false, index);
                            })
                          : statusHistoryArray.map((history, index) => {
                              if (index === 0 || index > statusHistoryArray.length - 3) {
                                return this.renderStatusItem(history, index === 0, false, index);
                              } else {
                                return this.renderStatusItem(history, index === 0, true, index);
                              }
                            })}
                      </div>
                    )}
                  </div>
                </div>

                {shouldShowProgressBar && (
                  <div className={'progress-bar-container' + (!shouldShowVoteCTA ? ' no-vote' : '')}>
                    <div
                      className={classnames('support-progress-bar-container', { 'zero-vote': !isForVoteNonZero })}
                      style={{ flexBasis: supportPercentage + '%' }}
                    >
                      <div className={classnames('progress-bar-title', { 'show-vote-icon': isWalletVotedFor })}>
                        {intl.get('v2.vote.support')}
                        {isWalletVotedFor && <div className="vote-icon"></div>}
                      </div>
                      <div className="progress-bar-vote-string">{forVoteDisplayString}</div>

                      {isWalletVotedFor && (
                        <div className="wallet-vote-container">
                          <div className="vote-icon">
                            <div className="voted-hint">{intl.get('v2.vote.voted_before')}</div>
                          </div>
                          <div className="wallet-vote-count">{walletVoteDisplayString}</div>
                        </div>
                      )}
                      {shouldShowVoteCTA && (
                        <button
                          className="action-button"
                          disabled={!isConnected || isWalletVotedAgainst}
                          onClick={() => {
                            this.voteForButtonOnClick();
                            window.gtag('event', `${isWalletVotedFor ? 'PC_add_vote_for' : 'PC_vote_for'}`, {
                              'event_category': 'PC_V1.5',
                              'event_label': `${isWalletVotedFor ? 'add_vote' : 'vote'}`,
                              'value': 'for'
                            });
                          }}
                        >
                          {intl.get(isWalletVotedFor ? 'v2.vote.add_vote_btn' : 'v2.vote.support')}
                        </button>
                      )}

                      <div className="progress-bar-background">
                        <div className="progress-bar"></div>
                      </div>
                      <div className="progress-bar"></div>
                      <div className="progress-bar square-upper-half"></div>
                    </div>

                    <div
                      className={classnames('against-progress-bar-container', { 'zero-vote': !isAgainstVoteNonZero })}
                      style={{ flexBasis: 100 - supportPercentage + '%' }}
                    >
                      <div className={classnames('progress-bar-title', { 'show-vote-icon': isWalletVotedAgainst })}>
                        {intl.get('v2.vote.against')}
                        {isWalletVotedAgainst && <div className="vote-icon"></div>}
                      </div>
                      <div className="progress-bar-vote-string">{againstVoteDisplayString}</div>

                      {isWalletVotedAgainst && (
                        <div className="wallet-vote-container">
                          <div className="vote-icon">
                            <div className="voted-hint">{intl.get('v2.vote.voted_before')}</div>
                          </div>
                          <div className="wallet-vote-count">{walletVoteDisplayString}</div>
                        </div>
                      )}
                      {shouldShowVoteCTA && (
                        <button
                          className="action-button"
                          disabled={!isConnected || isWalletVotedFor}
                          onClick={() => {
                            this.voteAgainstButtonOnClick();
                            window.gtag(
                              'event',
                              `${isWalletVotedAgainst ? 'PC_add_vote_against' : 'PC_vote_against'}`,
                              {
                                'event_category': 'PC_V1.5',
                                'event_label': `${isWalletVotedAgainst ? 'add_vote' : 'vote'}`,
                                'value': 'against'
                              }
                            );
                          }}
                        >
                          {intl.get(isWalletVotedAgainst ? 'v2.vote.add_vote_btn' : 'v2.vote.against')}
                        </button>
                      )}

                      <div className="progress-bar-background">
                        <div className="progress-bar"></div>
                      </div>
                      <div className="progress-bar"></div>
                      <div className="progress-bar square-upper-half"></div>
                    </div>
                  </div>
                )}

                {!isConnected && (
                  <div className="connect-wallet-hint-bar content-container content-container-shadow">
                    <div className="bar-title">{intl.get('v2.vote.connect_wallet_title')}</div>
                    {this.props.lend.serviceInnerStatus === 'disabled' ? (
                      <Tooltip
                        title={intl.get('season.can_not_connect')}
                        overlayClassName={'j-tooltip-dropdown season ' + theme}
                        arrowPointAtCenter
                        placement="bottom"
                      >
                        <button
                          className="bar-action-btn season"
                          onClick={() => {
                            this.props.lend.setData({ noServiceModalAllVisible: true });
                          }}
                        >
                          {intl.get('v2.vote.connect_wallet_btn')}
                        </button>
                      </Tooltip>
                    ) : (
                      <button className="bar-action-btn" onClick={() => this.props.network.connectWalletV2()}>
                        {intl.get('v2.vote.connect_wallet_btn')}
                      </button>
                    )}
                  </div>
                )}

                {shouldShowRedeemVoteBar && (
                  <div className="redeem-vote-bar content-container content-container-shadow">
                    <div className="bar-title">
                      {intl.get('v2.vote.redeem_vote_title', {
                        value: walletVoteDisplayString
                      })}
                    </div>
                    <button
                      className="bar-action-btn"
                      disabled={!isConnected}
                      onClick={() => {
                        this.showRedeemFromVotePop();
                        window.gtag('event', 'PC_vote_detail_recycle', {
                          'event_category': 'PC_V1.5',
                          'event_label': 'vote_detail_recycle'
                        });
                      }}
                    >
                      {intl.get('v2.vote.redeem_vote_btn')}
                    </button>
                  </div>
                )}

                <div className="vote-detail-info-container content-container content-container-shadow">
                  <div className="vote-detail-info-header">
                    {intl.get('v2.vote.info_title')}
                    {this.state.env === 'test' && (
                      <>
                        <span className="ml-20 link" onClick={() => this.editVoteDetail()}>
                          Edit
                          <EditOutlined className="ml-5" />
                        </span>
                        {this.state.previewDetailContent && (
                          <Button
                            className="ml-20"
                            onClick={() =>
                              window.localStorage.setItem('previewDetailContent', this.state.previewDetailContent)
                            }
                          >
                            SaveToCache
                          </Button>
                        )}
                        {previewDetailContent && (
                          <Button
                            className="ml-10"
                            onClick={() => {
                              previewDetailContent = window.localStorage.getItem('previewDetailContent');
                              this.setState({ editMode: 2, previewDetailContent });
                            }}
                          >
                            RestoreFromCache
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                  {this.state.editMode === 1 && this.state.env === 'test' ? (
                    <div className={classnames('vote-detail-info-text', { 'dark': theme !== 'white' })}>
                      <Input.TextArea
                        value={this.state.previewDetailContent}
                        onChange={e => this.setState({ previewDetailContent: e.target.value })}
                        autoSize={{ minRows: 10 }}
                      />
                      <Button className="mt-10" onClick={() => this.previewVoteDetail()}>
                        Preview
                      </Button>
                    </div>
                  ) : this.state.editMode === 2 && this.state.env === 'test' ? (
                    <div
                      className={classnames('vote-detail-info-text', { 'dark': theme !== 'white' })}
                      dangerouslySetInnerHTML={{ __html: this.state.previewDetailContent }}
                    ></div>
                  ) : (
                    <div
                      className={classnames('vote-detail-info-text', { 'dark': theme !== 'white' })}
                      dangerouslySetInnerHTML={{ __html: htmlContent }}
                    ></div>
                  )}
                </div>
              </div>
            ) : (
              this.loadingRender()
            )}
          </div>
          <Footer />

          <RedeemVote />
          <Vote />
          <SwapJstToVote />
          <VoteDetailModal />
          <TransactionModal />
        </div>

        <TabsBar theme={theme} />
      </>
    );
  }
}

export default VoteDetail;
