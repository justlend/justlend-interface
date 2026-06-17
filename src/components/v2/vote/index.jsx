import { Divider, Input, Modal, Tooltip } from 'antd';
import isMobile from 'ismobilejs';
import { inject, observer } from 'mobx-react';
import React from 'react';
import moment from 'moment';
import intl from 'react-intl-universal';
import '../../../assets/css/v2/vote.scss';
import Config from '../../../config';
import {
  BigNumber,
  emptyReactNodeNew,
  formatNumber,
  getQueryObj,
  numberParser,
  addThousandSeparators,
  removeThousandSeparators,
  skeletonRender
} from '../../../utils/helper';
import { MAX_UINT256 } from '../../../utils/blockchain';
import OldVoteWithdraw from '../../Modals/v2/OldVoteWithdraw';
import TransactionModal from '../../Modals/v2/Transaction';
import VoteDetailModal from '../../Modals/v2/VoteDetail';
import { TooltipText } from '../strx/TooltipText';
import VoteImg1 from '../../../assets/images/skeleton/vote-1.svg';
import VoteImgWhite1 from '../../../assets/images/skeleton/white/vote-1.svg';

const countDownDateStr = lastProposal => {
  const { endTime: futureTimestamp, state } = lastProposal;
  const now = new Date().getTime();
  if (now >= futureTimestamp && (state === 1 || state === -1)) {
    setTimeout(() => {
      window.location.reload();
    }, 60000);
  }

  const distance = futureTimestamp - now;
  const hours = Math.floor(distance / (1000 * 60 * 60));
  const minutes =
    Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)) > 0
      ? Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      : '<1';

  return `${hours > 0 ? `${hours}${intl.get(`v2.vote.hrs`)}:` : ''}${minutes}${intl.get(`v2.vote.min`)}`;
};

const StepsContainer = ({ lang, theme }) => (
  <div className="step-container">
    <div className="left-steps">
      {[...Array(3).keys()].map(i => {
        i++;
        return (
          <div className="step" key={i}>
            <div className="step-number">{i}</div>

            <div className="step-text-box">
              <div className={`step-title ${lang}`}>{intl.get(`v2.vote.step${i}_title`)}</div>
              <div className={'step-desc'}>{intl.get(`v2.vote.step${i}_desc`)}</div>
            </div>

            {i <= 2 && <div className="step-arrow" />}
          </div>
        );
      })}
    </div>

    <div className="right-forum">
      <div className="forum-title">{intl.get('v2.vote.forum_title')}</div>
      <span>
        <a
          href={'https://forum.justlend.org'}
          target="_blank"
          className="jl-links"
          onClick={window.gtag('event', 'PC_join_discussion', {
            'event_category': 'PC_V1.5',
            'event_label': 'join_discussion'
          })}
        >
          {intl.get('v2.vote.forum_desc')}
        </a>
      </span>
    </div>
  </div>
);

const FaqContainer = ({ lang }) => {
  const langIsEng = lang === 'en-US';
  const langIsTC = lang === 'zh-TC';

  const faqList = [
    {
      url: isEng => `https://justlendorg.zendesk.com/hc/${isEng ? 'en-us' : 'zh-cn'}/articles/360053116731`,
      title: (isEng, isTC) => (isEng ? 'How to get more votes?' : isTC ? '如何兌換選票？' : '如何兑换选票？')
    },
    {
      url: isEng => `https://justlendorg.zendesk.com/hc/${isEng ? 'en-us' : 'zh-cn'}/articles/360053116751`,
      title: (isEng, isTC) => (isEng ? 'How to vote on a proposal?' : isTC ? '如何進行投票？' : '如何进行投票？')
    },
    {
      url: isEng => `https://justlendorg.zendesk.com/hc/${isEng ? 'en-us' : 'zh-cn'}/articles/360052662212`,
      title: (isEng, isTC) =>
        isEng ? 'How to convert my votes back to JST?' : isTC ? '如何贖回選票？' : '如何赎回选票？'
    }
  ];

  return (
    <div className="faq-container">
      <div className="faq-header">
        <div className="faq-title">{intl.get('v2.vote.faq')}</div>

        <a
          target="_blank"
          rel="noopener noreferrer"
          href={`https://justlendorg.zendesk.com/hc/${langIsEng ? 'en-us' : 'zh-cn'}/sections/360011296312`}
          className="faq-more"
          onClick={window.gtag('event', 'PC_vote_faq_more', {
            'event_category': 'PC_V1.5',
            'event_label': 'vote_faq_more'
          })}
        >
          {intl.get('more')}
        </a>
      </div>

      <Divider />

      <div className="faq-body">
        <ul>
          {faqList.map((faq, i) => (
            <li key={i}>
              <a
                href={faq.url(langIsEng)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={window.gtag('event', 'PC_vote_faq_link', {
                  'event_category': 'PC_V1.5',
                  'event_label': 'vote_faq_link'
                })}
              >
                {faq.title(langIsEng, langIsTC)}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const getVotePercent = num => {
  const v = (num * 100).toFixed(2);

  if (v == 0 && num != 0) {
    return '<0.01';
  } else if (v == 100 && num != 1) {
    return '99.99';
  } else {
    return v;
  }
};

const VoteBoard = ({ forVotes, againstVotes }) => {
  forVotes = parseInt(forVotes);
  againstVotes = parseInt(againstVotes);
  const totalVotes = forVotes + againstVotes;

  /*
    total length = 172
    least length for each side is 22

    adjustable part will be 172 - 22 - 22 = 128
    width will be (128 * percentage) + 22

    for mobile 130 - 12.5 - 12.5 = 105
  */

  return (
    <>
      <div className="p-vote-bar hide-md">
        <div className="p-for hide-md ">{totalVotes === 0 ? `0%` : getVotePercent(forVotes / totalVotes) + '%'}</div>
        {forVotes !== 0 && (
          <div
            className={'p-for-bar hide-md ' + (forVotes / totalVotes >= 1 ? ' per100' : '')}
            style={{ width: `${22 + (forVotes / totalVotes) * 128}px` }}
          />
        )}
        {againstVotes !== 0 && (
          <div
            className={'p-against-bar hide-md ' + (againstVotes / totalVotes >= 1 ? ' per100' : '')}
            style={{ width: `${22 + (againstVotes / totalVotes) * 128}px` }}
          />
        )}
        {forVotes === 0 && againstVotes === 0 && <div className={'p-default-bar hide-md'} style={{ width: `150px` }} />}

        <div className="p-against hide-md ">
          {totalVotes === 0 ? `0%` : getVotePercent(againstVotes / totalVotes) + '%'}
        </div>
      </div>

      <div className="p-vote-bar hide-lg">
        <div className="bar-first-row hide-lg">
          <div className="p-for">{totalVotes === 0 ? `0%` : getVotePercent(forVotes / totalVotes) + '%'}</div>
          <div className="p-against">{totalVotes === 0 ? `0%` : getVotePercent(againstVotes / totalVotes) + '%'}</div>
        </div>
        <div className="bar-second-row">
          {forVotes === 0 && againstVotes === 0 ? (
            <div className={'p-default-bar hide-lg'} style={{ width: `128px` }} />
          ) : (
            <>
              <div
                className="p-for-bar hide-lg"
                style={{
                  width:
                    forVotes === 0 ? '0px' : againstVotes === 0 ? '128px' : `${12 + (forVotes / totalVotes) * 105}px`,
                  transform: againstVotes === 0 && 'none'
                }}
              />
              <div
                className="p-against-bar hide-lg"
                style={{
                  width:
                    againstVotes === 0
                      ? '0px'
                      : forVotes === 0
                      ? '128px'
                      : `${12 + (againstVotes / totalVotes) * 105}px`,
                  transform: forVotes === 0 && 'none'
                }}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
};

@inject('network')
@inject('ui')
@inject('system')
@inject('lend')
@inject('vote')
@observer
class Vote extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dataList: [],
      page: 0,
      showProposalSectionForMobile: true,
      approveStatus: null,
      approveAmount: 0,
      exchangeVoteValue: '',
      withdrawValue: '',
      isSuccess: false,
      txID: '',
      lang: getQueryObj()?.lang || window.localStorage.getItem('lang') || intl.options.currentLocale,
      isTxSigning: false,
      approving: false,
      mobile: isMobile(window.navigator).any,
      isActive: false,
      stateMap: {
        '-1': {
          'title': intl.get('s7.open_for_voting'),
          'time': 'activeTime'
        },
        '0': {
          'title': intl.get('s7.created'),
          'time': 'activeTime'
        },
        '1': {
          'title': intl.get('s7.open_for_voting'),
          'time': 'activeTime'
        },
        '2': {
          'title': intl.get('s7.cancelled'),
          'time': 'cancelTime'
        },
        '3': {
          'title': intl.get('s7.rejected'),
          'time': 'endTime'
        },
        '4': {
          'title': intl.get('s7.passed'),
          'time': 'endTime'
        },
        '5': {
          'title': intl.get('s7.for_execution'),
          'time': 'queuedTime'
        },
        '6': {
          'title': intl.get('s7.expired'),
          'time': 'queuedTime' // need to add 3 days
        },
        '7': {
          'title': intl.get('s7.executed'),
          'time': 'executedTime'
        }
      }
    };
  }

  componentDidMount = async () => {
    document.title = 'Vote - JustLend DAO';

    this.props.vote.setVoteForPop(false);
    this.props.vote.setRedeemFromVotePop(false);

    try {
      let block = await this.props.lend.getCurrentBlock();
      let res = await this.props.vote.getVoteList(block);
      this.setState({
        dataList: res.arr
      });
      const lastProposal = res.arr?.[0];

      this.props.vote.getVoteDetail(lastProposal?.id);
    } catch (error) {
      console.log('getVoteList: ', error);
    }
    this.props.network.on('connect', () => {
      this.getMountedData();
    });
    if (this.props.network.isConnected) {
      this.getMountedData();
    }

    window.gtag('event', 'PC_vote_new', { 'event_category': 'PC_V1.5', 'event_label': 'vote_new' });

    if (this.props.vote.authorizePop) {
      window.gtag('event', 'PC_getvotes_approve1tips', {
        'event_category': 'PC_V1.7.6',
        'event_label': 'getvotes_approve1tips'
      });
    }
  };

  getMountedData = async () => {
    try {
      let approveStatus = await this.getApprove();
      this.setState(
        {
          approveStatus
        },
        () => {
          this.props.vote.getBalanceForVote();
          this.props.vote.getOldWjstBalanceForVote();
          this.startInterval();
        }
      );
    } catch (error) {
      console.log('getVoteDataError: ', error);
    }

    await this.props.vote.getUserWithdrawInfo();
  };

  startInterval = async () => {
    if (!this.timerInterval) {
      this.timerInterval = setInterval(async () => {
        let approveStatus = await this.getApprove();
        this.setState({ approveStatus });

        await this.props.vote.getBalanceForVote();
        await this.props.vote.getOldWjstBalanceForVote();
        await this.props.vote.getUserWithdrawInfo();
      }, 60000);
    }
  };

  getApprove = async () => {
    try {
      let voteData = {
        collateralAddress: Config.contract.JST,
        jtokenAddress: Config.contract.WJSTAddress,
        precision: Config.tokenDefaultPrecision
      };
      let allowance = await this.props.vote.getVoteBalanceOf(voteData);
      this.setState({ approveAmount: allowance });
      return BigNumber(allowance).gt(0);
    } catch (err) {
      console.log('getApprove, ', err);
      return false;
    }
  };

  toggleShowProposalSectionForMobile = id => {
    if (id === 1 && this.state.showProposalSectionForMobile) return;
    if (id === 2 && !this.state.showProposalSectionForMobile) return;
    this.setState(d => ({ ...d, showProposalSectionForMobile: !d.showProposalSectionForMobile }));
  };

  openModal = hasVoted => {
    const { isConnected } = this.props.network;
    const { approveStatus } = this.state;
    this.props.system.clearRejectError();

    if (this.props.network.isRightChain === 0) {
      this.props.network.changeChain();
      return;
    }

    this.setState({ isTxSigning: false });

    if (!isConnected) {
      this.props.network.connectWallet();
    } else if (approveStatus || hasVoted) {
      this.authorize();

      window.gtag('event', 'PC_get_votes', { 'event_category': 'PC_V1.5', 'event_label': 'get_votes' });
    } else {
      this.props.vote.setAuthorizePop(true);
    }
  };

  withdrawClick = () => {
    const { isConnected } = this.props.network;

    this.setState({ isTxSigning: false });

    if (!isConnected) {
      this.props.network.connectWalletV2();
    } else {
      this.setState({
        exchangeVoteValue: '',
        withdrawValue: ''
      });
      this.props.vote.setWithdrawPop(true);
      window.gtag('event', 'PC_redeem_votes', { 'event_category': 'PC_V1.5', 'event_label': 'redeem_votes' });
    }
  };

  authorize = () => {
    this.setState({
      exchangeVoteValue: ''
    });
    this.props.vote.setExchangeVotePop(true);
    this.props.vote.setAuthorizePop(false);
  };

  toApprove = async () => {
    this.props.system.clearRejectError();

    window.gtag('event', 'PC_getvotes_approveclick', {
      'event_category': 'PC_V1.7.6',
      'event_label': 'getvotes_approveclick'
    });

    const popData = {
      collateralAddress: Config.contract.JST,
      jtokenAddress: Config.contract.WJSTAddress,
      transType: 'approve'
    };

    const intlObj = {
      title: 'deposit.confirm_approve',
      // title2: 'deposit.transactionsent',
      // title3: 'toast.ex_failed',
      obj: {
        value: popData.collateralSymbol
      }
    };
    this.setState({ isSuccess: false, txID: '', approving: true });

    const contractAddress = popData.collateralAddress;
    let funcSelector = 'approve(address,uint256)';
    let parameters = [
      { type: 'address', value: popData.jtokenAddress },
      { type: 'uint256', value: MAX_UINT256 }
    ];
    const feeLimit = await this.props.system.getFeeLimitCommon(contractAddress, funcSelector, parameters);
    const options = { feeLimit };

    const txID = await this.props.system.approveToken(popData, [['vote/hideAuthorizePop']], options);

    if (txID) {
      this.setState(
        {
          approveStatus: true
        },
        () => {
          this.getApprove();
          this.authorize();
        }
      );
    }
    this.setState({ approving: false });
  };

  renderApprovePop = () => {
    const { approving } = this.state;
    const { transModalInfo } = this.props.system;
    const { declined, transType } = transModalInfo;

    return (
      <>
        <div className="v-title">{intl.get('deposit.confirm_approve')}</div>
        <Divider />

        <div className="vote-authorize-logo"></div>
        <div className="v-desc">{intl.getHTML('vote.approve_text')}</div>
        {approving ? (
          <button className="modal-btn is-valid" disabled>
            {intl.get('v2.sign_in_wallet')}
            <span className="siging-icon"></span>
          </button>
        ) : (
          <div className="modal-btn is-valid" onClick={this.toApprove}>
            {intl.get('vote.approve_btn')}
          </div>
        )}
        {declined && transType === 'approve' && (
          <div className="j-error-tip wallet-reject">
            <span className="j-error-img"></span>
            <div>{intl.get('v2.reject_in_wallet')}</div>
          </div>
        )}
      </>
    );
  };

  chooseMax = () => {
    const { voteInfo } = this.props.vote;
    let maxValue = formatNumber(voteInfo.jstBalance.div(Config.tokenDefaultPrecision), 3, {
      per: true
    });
    this.setState({ exchangeVoteValue: maxValue });
  };

  chooseWithdrawMax = () => {
    const { voteInfo } = this.props.vote;
    let maxValue = formatNumber(voteInfo.surplusVotes.div(Config.tokenDefaultPrecision), 3, {
      per: true
    });
    this.setState({ withdrawValue: maxValue });
  };

  // suffix MAX render
  maxRender = item => {
    if (item === 1) {
      return (
        <div className="v-max-btn" onClick={this.chooseMax}>
          {intl.get('vote.voteto_input_max')}
        </div>
      );
    } else if (item === 2) {
      return (
        <div className="v-max-btn" onClick={this.chooseWithdrawMax}>
          {intl.get('vote.voteto_input_max')}
        </div>
      );
    }
  };

  exchangeVoteChange = value => {
    const { valid, str } = numberParser(value, 3);
    if (valid) {
      this.setState({ exchangeVoteValue: str });
      const { isNeedApprove } = this.getApprovedLimit(str);
      if (isNeedApprove) {
        window.gtag('event', 'PC_getvotes_approve2tips', {
          'event_category': 'PC_V1.7.6',
          'event_label': 'getvotes_approve2tips'
        });
      }
    }
  };

  toDeposit = async () => {
    this.props.system.clearRejectError();
    window.gtag('event', 'PC_get_votes_modal', { 'event_category': 'PC_V1.5', 'event_label': 'get_votes_modal' });
    const { voteInfo } = this.props.vote;
    this.setState({ isTxSigning: true });

    const maxValue = formatNumber(voteInfo.jstBalance.div(Config.tokenDefaultPrecision), 3, {
      per: true
    });
    const { exchangeVoteValue } = this.state;
    if (BigNumber(maxValue).lt(BigNumber(exchangeVoteValue))) return;

    const popData = {
      collateralAddress: Config.contract.JST,
      jtokenAddress: Config.contract.WJSTAddress,
      amount: BigNumber(exchangeVoteValue).times(Config.tokenDefaultPrecision)._toHex()
    };

    const intlObj = {
      title: 'toast.ex',
      title2: 'deposit.transactionsent',
      title3: 'toast.ex_failed',
      title4: 'deposit.confirm_transaction',
      obj: {
        value: popData.collateralSymbol
      },
      transType: 'depositVote'
    };
    try {
      const contractAddress = popData.jtokenAddress;
      let funcSelector = 'deposit(uint256)';
      let parameters = [{ type: 'uint256', value: popData.amount }];
      let preOptions = {};
      if (popData.collateralAddress === Config.zeroAddr) {
        funcSelector = 'mint()';
        parameters = [];
        preOptions = { callValue: popData.amount };
      }
      const feeLimit = await this.props.system.getFeeLimitCommon(contractAddress, funcSelector, parameters, preOptions);

      const txID = await this.props.system.voteDeposit(popData, intlObj, feeLimit);
      if (txID) {
        window.gtag('event', 'PC_get_votes_modal_success', {
          'event_category': 'PC_V1.5',
          'event_label': 'get_votes_modal_success'
        });
        this.setState({ isSuccess: true, txID: txID, isTxSigning: false });
        this.getApprove();
        this.props.vote.setAuthorizePop(false);
        this.props.vote.setExchangeVotePop(false);
        this.props.vote.setWithdrawPop(false);
      } else {
        this.setState({ isSuccess: false, txID: txID, isTxSigning: false });
      }
    } catch {
      this.setState({ isSuccess: false, isTxSigning: false });
    }
  };

  getApprovedLimit = value => {
    const { approveAmount, exchangeVoteValue } = this.state;
    const eValue = value || exchangeVoteValue;

    const isNeedApprove =
      BigNumber(approveAmount).lte(0) ||
      BigNumber(approveAmount)
        .div(Config.tokenDefaultPrecision)
        .lt(BigNumber(+eValue || 0));

    return { isNeedApprove };
  };

  renderDepositPop = theme => {
    const { voteInfo } = this.props.vote;
    const { transModalInfo } = this.props.system;
    const { declined, transType } = transModalInfo;
    const { approveAmount, exchangeVoteValue, approving } = this.state;

    let maxValue;
    if (voteInfo && voteInfo.success) {
      maxValue = formatNumber(voteInfo.jstBalance.div(Config.tokenDefaultPrecision), 3, {
        per: true
      });
    }

    const enoughRemainVotes = BigNumber(maxValue).gte(BigNumber(this.state.exchangeVoteValue));
    const inputVoteGt0 = BigNumber(this.state.exchangeVoteValue).gt(0);
    const showWarning = !enoughRemainVotes && inputVoteGt0;

    const { isNeedApprove } = this.getApprovedLimit();

    return (
      <>
        <div className="v-title">{intl.get('vote.myvote_deposit')}</div>
        <Divider />

        <div className="tick-vote-logo" />
        <div className="v-desc">{intl.getHTML('v2.vote.get_vote_modal_text')}</div>

        <div className="v-desc2">
          <div className="v-amount">{intl.get('vote.deposit_amount')}</div>

          <div className="v-right">
            <div className="v-text">{intl.get('wallet_ballance')}</div>

            {voteInfo && voteInfo.success && (
              <div className="v-balance">
                {formatNumber(voteInfo.jstBalance.div(Config.tokenDefaultPrecision), 3, { miniText: 0.001 })} JST
              </div>
            )}

            <a
              className="v-get-btn hover"
              target="_blank"
              rel="noopener noreferrer"
              href={`${Config.sunSwap}?lang=${this.state.lang}?tokenAddress=${Config.contract.JST}&type=swap`}
              onClick={window.gtag('PC_get_jst_btn', 'click', {
                'event_category': 'PC_V1.5',
                'event_label': 'get_jst_btn'
              })}
            >
              {intl.get('lend.get')}
            </a>
            <span className={`v-arrow ${theme}`} />
          </div>
        </div>

        <Input
          allowClear
          className={`vote-input ${showWarning ? 'invalid' : ''}`}
          value={addThousandSeparators(this.state.exchangeVoteValue)}
          placeholder={intl.get('vote.convert_input_tips')}
          suffix={this.maxRender(1)}
          onChange={e => this.exchangeVoteChange(removeThousandSeparators(e.target.value), true)}
          disabled={this.state.isTxSigning ? true : false}
        />

        {showWarning && (
          <>
            <div className="exceed-remain-votes">{intl.get('tab.not_enough')}</div>
          </>
        )}
        {isNeedApprove && (
          <div className="approve-tip">
            <span></span>
            <span>{intl.get('v2.vote.approve_tip')}</span>
            <Tooltip
              overlayClassName="j-tooltip-dropdown"
              title={
                <>
                  <span class="mr-5">{intl.get('deposit.approve_tip')}</span>
                  <a
                    class="jl-links"
                    style={{ fontSize: 12 }}
                    href={Config.approveLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {intl.get('toast.warning_tip_more')}
                  </a>
                </>
              }
              placement="top"
              arrowPointAtCenter
              getPopupContainer={triggerNode => triggerNode.parentNode}
            >
              <span className="j-tooltip-icon"></span>
            </Tooltip>
          </div>
        )}

        {this.state.isTxSigning ? (
          <div className={`modal-btn`}>
            {intl.get('v2.sign_in_wallet')}
            <span className="siging-icon"></span>
          </div>
        ) : isNeedApprove ? (
          approving ? (
            <button className="modal-btn is-valid" disabled>
              {intl.get('v2.sign_in_wallet')}
              <span className="siging-icon"></span>
            </button>
          ) : (
            <div className="modal-btn is-valid" onClick={this.toApprove}>
              {intl.get('vote.approve_btn')}
            </div>
          )
        ) : (
          <div
            onClick={(!showWarning && inputVoteGt0 && this.toDeposit) || undefined}
            className={`modal-btn ${!showWarning && inputVoteGt0 ? 'is-valid' : ''}`}
          >
            {intl.get('v2.vote.deposit_now')}
          </div>
        )}

        {declined && (transType === 'depositVote' || transType === 'approve') && (
          <div className="tx-failed">
            <span className="error-img"></span>
            {intl.get('v2.reject_in_wallet')}
          </div>
        )}
      </>
    );
  };

  withdrawChange = value => {
    const { valid, str } = numberParser(value, 3);
    if (valid) {
      this.setState({ withdrawValue: str });
    }
  };

  toWithdraw = async value => {
    const popData = {
      collateralAddress: Config.contract.JST,
      jtokenAddress: Config.contract.WJSTAddress,
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
      transType: 'withdrawVote'
    };
    try {
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
        window.gtag('event', 'PC_redeem_votes_modal_success', {
          'event_category': 'PC_V1.5',
          'event_label': 'redeem_votes_modal_success'
        });
        this.setState({ isSuccess: true, txID: txID, isTxSigning: false });

        this.props.vote.setAuthorizePop(false);
        this.props.vote.setExchangeVotePop(false);
        this.props.vote.setWithdrawPop(false);
      } else {
        this.setState({ isSuccess: false, txID: txID, isTxSigning: false });
      }
    } catch {
      this.setState({ isSuccess: false, isTxSigning: false });
    }
  };

  withdrawSubmit = () => {
    window.gtag('event', 'PC_redeem_votes_modal', { 'event_category': 'PC_V1.5', 'event_label': 'redeem_votes_modal' });
    this.props.system.clearRejectError();
    const { withdrawValue } = this.state;
    this.setState({ isTxSigning: true });
    this.toWithdraw(withdrawValue);
    //this.setState({ isTxSigning: false });
  };

  renderWithdrawPop = () => {
    const { voteInfo } = this.props.vote;
    const { transModalInfo } = this.props.system;
    const { declined, transType } = transModalInfo;
    let wMaxValue;
    if (voteInfo && voteInfo.success) {
      wMaxValue = formatNumber(voteInfo.surplusVotes.div(Config.tokenDefaultPrecision), 3, {
        miniText: 0.001,
        per: true
      });
    }

    const enoughRemainVotes = BigNumber(wMaxValue).gte(BigNumber(this.state.withdrawValue));
    const inputVoteGt0 = BigNumber(this.state.withdrawValue).gt(0);

    const showWarning = !enoughRemainVotes && inputVoteGt0;

    return (
      <>
        <div className="v-title">{intl.get('v2.vote.redeem_votes')}</div>
        <Divider />
        <div className="tick-vote-logo" />
        <div className="v-desc">{intl.getHTML('v2.vote.vote_modal_convert_jst')}</div>

        <div className="v-desc2">
          <div className="v-amount">{intl.getHTML('v2.vote.redeem_count')}</div>

          <div className="v-right">
            <div className="v-text">{intl.get('v2.vote.surplus_votes')}</div>
            <div className="v-balance">{formatNumber(wMaxValue)}</div>
          </div>
        </div>

        <Input
          allowClear
          className={`vote-input ${showWarning ? 'invalid' : ''}`}
          value={addThousandSeparators(this.state.withdrawValue)}
          placeholder={intl.get('v2.vote.votes_amount')}
          suffix={this.maxRender(2)}
          onChange={e => this.withdrawChange(removeThousandSeparators(e.target.value), true)}
          disabled={this.state.isTxSigning ? true : false}
        />

        {showWarning && (
          <>
            <div className="exceed-remain-votes">{intl.get('tab.not_enough')}</div>
          </>
        )}

        {this.state.isTxSigning ? (
          <div className={`modal-btn`}>
            {intl.get('v2.sign_in_wallet')}
            <span className="siging-icon"></span>
          </div>
        ) : (
          <div
            onClick={(!showWarning && inputVoteGt0 && this.withdrawSubmit) || undefined}
            className={`modal-btn ${!showWarning && inputVoteGt0 ? 'is-valid' : ''}`}
          >
            {intl.get('v2.vote.redeem_now')}
          </div>
        )}

        {declined && transType === 'withdrawVote' && (
          <div className="tx-failed">
            <span className="error-img"></span>
            {intl.get('v2.reject_in_wallet')}
          </div>
        )}
      </>
    );
  };

  hideDepositPop = () => {
    const { withdrawPop, exchangeVotePop } = this.props.vote;
    if (withdrawPop) {
      window.gtag('event', 'PC_redeem_votes_close', {
        'event_category': 'PC_V1.5',
        'event_label': 'redeem_votes_close'
      });
    } else if (exchangeVotePop) {
      window.gtag('event', 'PC_get_votes_close', { 'event_category': 'PC_V1.5', 'event_label': 'get_votes_close' });
    }

    this.props.vote.setAuthorizePop(false);
    this.props.vote.setExchangeVotePop(false);
    this.props.vote.setWithdrawPop(false);
  };

  renderMobileMenu = () => {
    const { page, dataList, showProposalSectionForMobile, lang } = this.state;
    const lastProposal = dataList?.[0];

    return (
      <div className="mobile-menu">
        <span
          onClick={() => this.toggleShowProposalSectionForMobile(1)}
          className={showProposalSectionForMobile ? 'menu-item current' : 'menu-item'}
        >
          <div className="p-left">
            <div className="p-title">{intl.get('v2.vote.proposal')}</div>
            {lastProposal && <div className="p-count">{dataList.length}</div>}
          </div>
        </span>
        <span
          onClick={() => this.toggleShowProposalSectionForMobile(2)}
          className={showProposalSectionForMobile ? 'menu-item' : 'menu-item current'}
        >
          {intl.get('v2.vote.my_vote_header')}
        </span>
      </div>
    );
  };

  renderMyVote = theme => {
    const { voteInfo, oldVoteInfo, userCanRedeemVoteNum, userVotingVoteNum } = this.props.vote;
    const canRedeemVoteNum = BigNumber(userCanRedeemVoteNum).eq(0)
      ? 0
      : formatNumber(userCanRedeemVoteNum, 3, {
          miniText: 0.001
        });

    const votingVoteNum = BigNumber(userVotingVoteNum).eq(0)
      ? 0
      : formatNumber(userVotingVoteNum, 3, {
          miniText: 0.001
        });

    const castVotes =
      (voteInfo &&
        voteInfo.success &&
        oldVoteInfo &&
        oldVoteInfo.success &&
        formatNumber(voteInfo.castVote.plus(oldVoteInfo.castVote).div(Config.tokenDefaultPrecision), 3, {
          miniText: 0.001,
          per: true
        })) ||
      0;

    const totalVotes =
      (voteInfo &&
        voteInfo.success &&
        oldVoteInfo &&
        oldVoteInfo.success &&
        formatNumber(voteInfo.totalVote.plus(oldVoteInfo.totalVote).div(Config.tokenDefaultPrecision), 3, {
          miniText: 0.001,
          per: true
        })) ||
      0;

    let surplusVotes =
      (voteInfo &&
        voteInfo.success &&
        formatNumber(voteInfo.surplusVotes.div(Config.tokenDefaultPrecision), 3, { miniText: 0.001, per: true })) ||
      0;

    // // todo uncoment the following line to see how it changed
    // surplusVotes = 1;

    let invalidVote =
      (oldVoteInfo &&
        oldVoteInfo.success &&
        formatNumber(oldVoteInfo.surplusVotes.div(Config.tokenDefaultPrecision), 3, { miniText: 0.001, per: true })) ||
      0;
    let hasVoted =
      (BigNumber(castVotes).gt(0) || BigNumber(totalVotes).gt(0) || BigNumber(surplusVotes).gt(0)) &&
      BigNumber(totalVotes).gt(BigNumber(invalidVote));
    // invalidVote = 2; // todo change this >0 to show invalid vote text

    let setIsActive = status => this.setState({ isActive: status });

    return (
      <div className="my-vote-container">
        {this.renderMobileMenu()}

        <div className="my-vote-header">{intl.get('v2.vote.my_vote_header')}</div>

        <Divider className="proposal-title my-vote-title" />
        <div className="space-60" />
        {this.props.network.isConnected ? (
          hasVoted || BigNumber(surplusVotes).gt(0) ? (
            <>
              <TooltipText
                className={'hide-lg total-votes'}
                overlayClassName="j-tooltip-dropdown"
                title={intl.get('vote.myvote_help')}
                placement="top"
                arrowPointAtCenter
                setIsActive={setIsActive}
              >
                <span className={`total-votes hide-lg ${theme} ${this.state.isActive ? 'active' : ''}`}>
                  {intl.get('vote.myvote_total')}
                </span>
              </TooltipText>

              <div className="total-votes hide-md">
                {intl.get('vote.myvote_total')}

                <Tooltip
                  overlayClassName="j-tooltip-dropdown"
                  title={intl.get('vote.myvote_help')}
                  arrowPointAtCenter
                  placement="top"
                  trigger={['click', 'hover']}
                >
                  <span className="j-tooltip-icon"></span>
                </Tooltip>
              </div>

              <div className="total-votes-amount">{formatNumber(totalVotes)}</div>

              <div className="vote-info-box">
                <div className="vote-info-row">
                  <div className="vote-info-text">{intl.get('v2.vote.surplus')}</div>
                  <div className="vote-info-amount">{formatNumber(surplusVotes)}</div>
                </div>
                <div className="vote-info-row">
                  <div className="vote-info-text">{intl.get('v2.vote.recycle_votes')}</div>
                  {BigNumber(userCanRedeemVoteNum).gt(0) ? (
                    <div
                      className="vote-info-amount clickable hover"
                      onClick={() => {
                        this.props.system.clearRejectError();
                        this.props.vote.setVoteDetailModalVisible(true);
                        window.gtag('event', 'PC_recycle_votes', {
                          'event_category': 'PC_V1.5',
                          'event_label': 'recycle_votes'
                        });
                      }}
                    >
                      {canRedeemVoteNum}
                    </div>
                  ) : (
                    <div className="vote-info-amount">{canRedeemVoteNum}</div>
                  )}
                </div>
                <div className="vote-info-row">
                  <div className="vote-info-text">{intl.get('v2.vote.cast_votes')}</div>
                  <div className="vote-info-amount">{votingVoteNum}</div>
                </div>
              </div>

              <div className="my-vote-btn-wrapper2">
                <div className="my-vote-btn2" onClick={() => this.withdrawClick()}>
                  {intl.get('v2.vote.redeem_votes')}
                </div>
                <div className="my-vote-btn" onClick={() => this.openModal(hasVoted)}>
                  {intl.get('vote.myvote_deposit')}
                </div>
              </div>

              {oldVoteInfo && oldVoteInfo.success && oldVoteInfo?.surplusVotes.gt(0) && (
                <div
                  className="invalid-vote hover"
                  onClick={() => {
                    this.props.system.clearRejectError();
                    this.props.vote.setVoteOldWithdrawModalVisible(true);
                    window.gtag('event', 'PC_invalid_vote', {
                      'event_category': 'PC_V1.5',
                      'event_label': 'invalid_vote'
                    });
                  }}
                >
                  {intl.getHTML('v2.vote.invalid_vote', {
                    value: invalidVote
                  })}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="tick-vote-logo" />
              <div className="my-vote-text">{intl.get('v2.vote.get_vote')}</div>
              <div className="my-vote-btn-wrapper">
                <div className="my-vote-btn" onClick={() => this.openModal()}>
                  {intl.get('vote.myvote_deposit')}
                </div>
              </div>
              {oldVoteInfo && oldVoteInfo.success && oldVoteInfo?.surplusVotes.gt(0) && (
                <div
                  className="invalid-vote hover"
                  onClick={() => {
                    this.props.system.clearRejectError();
                    this.props.vote.setVoteOldWithdrawModalVisible(true);
                    window.gtag('event', 'PC_invalid_vote', {
                      'event_category': 'PC_V1.5',
                      'event_label': 'invalid_vote'
                    });
                  }}
                >
                  {intl.getHTML('v2.vote.invalid_vote', {
                    value: invalidVote
                  })}
                  {/* <div className="purple-right-arrow2" /> */}
                </div>
              )}
            </>
          )
        ) : (
          <>
            <div className="unconnected-wallet-logo" />
            <div className="my-vote-text">{intl.get('v2.vote.unconnected_wallet')}</div>
            <div className="my-vote-btn-wrapper">
              {this.props.lend.serviceInnerStatus === 'disabled' ? (
                <Tooltip
                  title={intl.get('season.can_not_connect')}
                  overlayClassName={'j-tooltip-dropdown season season-l ' + theme}
                  arrowPointAtCenter
                  placement="bottom"
                  getPopupContainer={() =>
                    document.querySelector('.vote-container .right-panel .my-vote-container .my-vote-btn')
                  }
                >
                  <div
                    className="my-vote-btn season"
                    onClick={() => {
                      this.props.lend.setNoServiceModalAllVisible(true);
                    }}
                  >
                    {intl.get('navi.wallet_linkbtn')}
                  </div>
                </Tooltip>
              ) : (
                <div className="my-vote-btn" onClick={() => this.props.network.connectWalletV2()}>
                  {intl.get('navi.wallet_linkbtn')}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  loadingRender = () => {
    const { theme } = this.props.lend;
    const { mobile } = this.state;

    return (
      <div className="vote-skeleton">
        <div className={`vote-container ${theme}`}>
          <div className="common-flex">{skeletonRender()}</div>
          {mobile && <div className="common-flex">{skeletonRender()}</div>}
          <div className="step-container">
            <div className="left-steps">
              <div className="step">
                <div className="step-number">1</div>
                <div className="step-text-box">
                  <div className="step-title en-US">{skeletonRender()}</div>
                  <div className="step-desc">{skeletonRender()}</div>
                </div>
                <div className="step-arrow"></div>
              </div>
              <div className="step">
                <div className="step-number">2</div>
                <div className="step-text-box">
                  <div className="step-title en-US">{skeletonRender()}</div>
                  <div className="step-desc">{skeletonRender()}</div>
                </div>
                <div className="step-arrow"></div>
              </div>
              <div className="step">
                <div className="step-number">3</div>
                <div className="step-text-box">
                  <div className="step-title en-US">{skeletonRender()}</div>
                  <div className="step-desc">{skeletonRender()}</div>
                </div>
              </div>
            </div>
            <div className="right-forum">
              <div className="forum-title">{skeletonRender()}</div>
              <span>
                <a href="" target="_blank" className="forum-desc hover">
                  {skeletonRender()}
                </a>
              </span>
            </div>
          </div>
          <div className="body-container">
            <div className="proposal-container ">
              <div className="proposal-header">
                <div className="proposal-left">{skeletonRender()}</div>
                <div className="proposal-right">{skeletonRender()}</div>
              </div>
              <Divider className="proposal-title my-vote-title" />
              {mobile && <div className="proposal-right-btm">{skeletonRender()}</div>}
              <div className="no-new-proposal">
                <div className="proposal1">
                  <div>{skeletonRender()}</div>
                  <div>{skeletonRender()}</div>
                </div>
                <div className="proposal2">
                  <div>{skeletonRender()}</div>
                  <div>{skeletonRender()}</div>
                </div>
              </div>
              <Divider className="proposal-title my-vote-title" />
              {mobile ? (
                <div className="past-proposal-list">
                  <a href="" rel="noopener noreferrer">
                    <div className="p-item">
                      <div className="first-row">
                        <span className="p-title">{skeletonRender()}</span>
                        <div className="p-green-tick"></div>
                      </div>
                      <div className="second-row">
                        <div className="p-left">{skeletonRender()}</div>
                        <div className="p-status">{skeletonRender()}</div>
                      </div>
                    </div>
                  </a>
                  <a href="" rel="noopener noreferrer">
                    <div className="p-item">
                      <div className="first-row">
                        <span className="p-title">{skeletonRender()}</span>
                        <div className="p-red-exclamation"></div>
                      </div>
                      <div className="second-row">
                        <div className="p-left">{skeletonRender()}</div>
                        <div className="p-status">{skeletonRender()}</div>
                      </div>
                    </div>
                  </a>
                </div>
              ) : (
                <div className="past-proposal-list">
                  {new Array(6).fill(1).map((item, index) => (
                    <a href="" rel="noopener noreferrer" key={index}>
                      <div className="p-item">
                        <div className="first-row">
                          <span className="p-title">{skeletonRender()}</span>
                          <div className="p-green-tick"></div>
                        </div>
                        <div className="second-row">
                          <div className="p-left">{skeletonRender()}</div>
                          <div className="p-status">{skeletonRender()}</div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
            <div className="right-panel hide-md">
              <div className="my-vote-container">
                <div className="my-vote-header">{skeletonRender()}</div>
                <Divider className="proposal-title my-vote-title" />
                <img className="vote-skeleton-img" src={theme === 'white' ? VoteImgWhite1 : VoteImg1} />
                <div className="vote-info-box">
                  <div className="per-100 mb-40">{skeletonRender()}</div>
                  <div className="per-100">{skeletonRender({ rows: 2 })}</div>
                </div>
              </div>
              <div className="faq-container">
                <div className="faq-header">
                  <div className="faq-title">{skeletonRender()}</div>
                  <a rel="noopener noreferrer" href="" className="faq-more">
                    {skeletonRender()}
                  </a>
                </div>
                <div className="ant-divider ant-divider-horizontal" role="separator"></div>
                <div className="faq-body">
                  <ul>
                    <li>
                      <a href="" rel="noopener noreferrer">
                        {skeletonRender()}
                      </a>
                    </li>
                    <li>
                      <a href="" rel="noopener noreferrer">
                        {skeletonRender()}
                      </a>
                    </li>
                    <li>
                      <a href="" rel="noopener noreferrer">
                        {skeletonRender()}
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  isISOTime(timeStr) {
    return moment(timeStr, moment.ISO_8601, true).isValid();
  }

  transferTime(time) {
    if (this.isISOTime(time)) {
      return new Date(time).getTime();
    }
    return time;
  }
  render() {
    const { page, dataList, showProposalSectionForMobile, lang, mobile, stateMap } = this.state;
    let lastProposal = dataList?.[0];
    const activeProposal = dataList.filter(item => item.state === 1 || item.state === -1);
    const isLastInProgress = lastProposal?.state === 1 || lastProposal?.state === -1;
    const slicedData = dataList.slice(isLastInProgress ? activeProposal.length : 0, (page + 1) * 20);
    const langIsEng = lang === 'en-US';
    const { theme } = this.props.lend;
    const { exchangeVotePop, authorizePop, withdrawPop, votedList } = this.props.vote;
    const { defaultAccount } = this.props.network;
    let popShow = authorizePop || exchangeVotePop || withdrawPop;
    let isLoading = true;
    if (lastProposal && slicedData.length > 0) {
      isLoading = false;
    }

    let outdateTime = 10 * 60 * 1000;

    return isLoading ? (
      this.loadingRender()
    ) : (
      <div className={`vote-container ${theme}`}>
        <div className="common-flex">
          <div className="common-title">{intl.get('vote.title')}</div>
          <div className="common-desc">{intl.get('v2.vote.top_desc')}</div>
        </div>

        <StepsContainer lang={lang} theme={theme} />

        <div className="body-container">
          <div className={`proposal-container ${showProposalSectionForMobile ? '' : 'hide-md'}`}>
            {this.renderMobileMenu()}

            <div className="proposal-header">
              <div className="proposal-left">
                <div className="proposal-title">{intl.get('v2.vote.proposal')}</div>
                {lastProposal && <div className="proposal-count">{dataList.length}</div>}
              </div>

              {lastProposal && (
                <div className="proposal-right">
                  <div className="new-proposal">
                    <span className="bell" />
                    {[6, 7].includes(lastProposal.state) &&
                    new Date().getTime() - this.transferTime(lastProposal[stateMap[lastProposal?.state]?.time]) >
                      outdateTime ? (
                      <div className="proposal-desc-bell">
                        {intl.getHTML('s7.default_proposal', { value: lastProposal.proposalId })}
                      </div>
                    ) : (
                      <div className="proposal-desc-bell">
                        {intl.get('s7.new_proposal')}
                        {stateMap[lastProposal.state]?.title}{' '}
                        {this.isISOTime(lastProposal[stateMap[lastProposal.state]?.time])
                          ? lastProposal.state === 6
                            ? moment(lastProposal[stateMap[lastProposal.state]?.time])
                                .add(3, 'days')
                                .format('MM-DD HH:mm')
                            : moment(lastProposal[stateMap[lastProposal.state]?.time]).format('MM-DD HH:mm')
                          : moment(
                              lastProposal[stateMap[lastProposal.state]?.time] +
                                (lastProposal.state === 6 ? 3 * 24 * 3600 * 1000 : 0)
                            ).format('MM-DD HH:mm')}{' '}
                        <a
                          href={Config.tronscanUrl + '/address/' + lastProposal?.proposer}
                          target={'_blank'}
                          className="jl-links"
                        >
                          {intl.get('s7.learn_more')}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Divider className={`proposal-title ${showProposalSectionForMobile ? 'hide-md' : ''}`} />

            {activeProposal?.length > 0 ? (
              activeProposal.map((item, index) => {
                return (
                  <div className="active-proposal" key={index}>
                    <div className="corner-tag">{intl.get('v2.vote.ongoing')}</div>

                    <div className="p-body">
                      <div className="p-first-row">
                        <div className="p-title">
                          {item?.title
                            ? item.title.split('&&')?.length > 1
                              ? item.title.split('&&')[[langIsEng ? 1 : 0]]
                              : item.title
                            : 'Proposal #' + item?.proposalId}
                          {item?.notValid &&
                            (mobile ? (
                              <Tooltip
                                overlayClassName="j-tooltip-dropdown right-warning"
                                title={intl.get('vote.unknown_proposal_tip')}
                                arrowPointAtCenter
                                placement="topRight"
                                trigger={['click', 'hover']}
                                defaultVisible={false}
                                getPopupContainer={() => document.querySelector('.vote-container .active-proposal')}
                              >
                                <span className="warning-tag">{intl.get('vote.unknown_proposal')}</span>
                              </Tooltip>
                            ) : (
                              <Tooltip
                                overlayClassName="j-tooltip-dropdown left-warning"
                                title={intl.get('vote.unknown_proposal_tip')}
                                arrowPointAtCenter
                                placement="topLeft"
                                trigger={['click', 'hover']}
                                defaultVisible={false}
                                getPopupContainer={() =>
                                  document.querySelector(
                                    '.vote-container .active-proposal .p-first-row .p-title .warning-tag'
                                  )
                                }
                              >
                                <span className="warning-tag">{intl.get('vote.unknown_proposal')}</span>
                              </Tooltip>
                            ))}
                        </div>
                        {item?.notValid ? (
                          <a
                            href={Config.tronscanUrl + `/contract/${item?.proposer}`}
                            className="vote-btn hide-md ml-50"
                            target="tronscan"
                          >
                            {intl.get('vote.view_on_chain')}
                          </a>
                        ) : (
                          <a
                            href={`/voteDetailNew?proposalId=${item?.proposalId}&lang=${lang}`}
                            className="vote-btn hide-md ml-50"
                            onClick={window.gtag('event', 'join_vote', {
                              'event_category': 'PC_V1.5',
                              'event_label': 'join_vote'
                            })}
                            target="_self"
                          >
                            {intl.get('v2.vote.join_vote')}
                          </a>
                        )}
                      </div>

                      <div className="p-second-row">
                        <div className="p-desc">
                          <div className="p-id">#{item.id}</div>

                          {defaultAccount && votedList && votedList.indexOf(item.proposalId) != -1 && (
                            <Tooltip
                              overlayClassName="j-tooltip-dropdown"
                              title={intl.get('v2.vote.voted_before')}
                              arrowPointAtCenter
                              placement="topLeft"
                              trigger={['click', 'hover']}
                              defaultVisible={false}
                            >
                              <span className="ticket-icon"></span>
                            </Tooltip>
                          )}

                          <div className="p-countdown-text">{intl.get('v2.vote.countdown_text')}</div>
                          <div className="p-countdown-date">{countDownDateStr(item)}</div>
                        </div>

                        <div className="p-right-mobile">
                          <VoteBoard forVotes={item.forVotes} againstVotes={item.againstVotes} />
                          {item?.notValid ? (
                            <a
                              href={Config.tronscanUrl + `/contract/${item?.proposer}`}
                              className="vote-btn hide-lg"
                              target="tronscan"
                            >
                              {intl.get('vote.view_on_chain')}
                            </a>
                          ) : (
                            <a
                              href={`/voteDetailNew?proposalId=${item?.proposalId}&lang=${lang}`}
                              className="vote-btn hide-lg"
                              target="_self"
                            >
                              {intl.get('v2.vote.join_vote')}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-new-proposal">
                <div className="proposal-title">{intl.get('v2.vote.no_new_proposal_title')}</div>
                <span>
                  <a
                    href={'https://forum.justlend.org'}
                    className="jl-links"
                    onClick={window.gtag('event', 'PC_no_new_proposal_join_discussion', {
                      'event_category': 'PC_V1.5',
                      'event_label': 'no_new_proposal_join_discussion'
                    })}
                  >
                    {intl.get('v2.vote.no_new_proposal_desc')}
                  </a>
                  {/* <span className={`purple-right-arrow${theme === 'white' ? '2' : '3'}`} /> */}
                </span>
              </div>
            )}

            <Divider style={{ padding: '0 30px' }}>{intl.get('v2.vote.previous_voting')}</Divider>

            <div className="past-proposal-list">
              {lastProposal && slicedData.length > 0
                ? slicedData.map(p =>
                    p?.notValid ? (
                      <div key={p.id}>
                        <div className="p-item" key={p.id}>
                          <div className="first-row">
                            <span className="p-title">
                              {p?.title
                                ? p.title?.split('&&') && p.title.split('&&')?.length > 1
                                  ? p.title.split('&&')[langIsEng ? 1 : 0]
                                  : p.title
                                : 'Proposal #' + p?.id}
                              <span className="arrow-right" />
                            </span>

                            <div className={p.state >= 4 ? 'p-green-tick' : 'p-red-exclamation'} />
                          </div>

                          <div className="second-row">
                            <div className="p-left">
                              <div className="p-id">#{p.id}</div>
                              {votedList && votedList.indexOf(p.proposalId) != -1 && (
                                <Tooltip
                                  overlayClassName="j-tooltip-dropdown"
                                  title={intl.get('v2.vote.voted_before')}
                                  arrowPointAtCenter
                                  placement="top"
                                  trigger={['click', 'hover']}
                                >
                                  <span className="ticket-icon"></span>
                                </Tooltip>
                              )}
                              <div className="p-date">{new Date(p.endTime).format('yyyy-MM-dd h:m:s')}</div>
                            </div>

                            <div className="p-status">{p.exIntl ? p.exIntl : p.intl}</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <a
                        href={`/voteDetailNew?proposalId=${p.proposalId}&lang=${lang}`}
                        target="_self"
                        rel="noopener noreferrer"
                        key={p.id}
                        onClick={window.gtag('event', 'PC_vote_proposal_list', {
                          'event_category': 'PC_V1.5',
                          'event_label': 'vote_proposal_list'
                        })}
                      >
                        <div className="p-item" key={p.id}>
                          <div className="first-row">
                            <span className="p-title">
                              {p?.title
                                ? p.title?.split('&&') && p.title.split('&&')?.length > 1
                                  ? p.title.split('&&')[langIsEng ? 1 : 0]
                                  : p.title
                                : 'Proposal #' + p?.id}
                              <span className="arrow-right" />
                            </span>

                            <div className={p.state >= 4 ? 'p-green-tick' : 'p-red-exclamation'} />
                          </div>

                          <div className="second-row">
                            <div className="p-left">
                              <div className="p-id">#{p.id}</div>
                              {votedList && votedList.indexOf(p.proposalId) != -1 && (
                                <Tooltip
                                  overlayClassName="j-tooltip-dropdown"
                                  title={intl.get('v2.vote.voted_before')}
                                  arrowPointAtCenter
                                  placement="top"
                                  trigger={['click', 'hover']}
                                >
                                  <span className="ticket-icon"></span>
                                </Tooltip>
                              )}
                              <div className="p-date">{new Date(p.endTime).format('yyyy-MM-dd h:m:s')}</div>
                            </div>

                            <div className="p-status">{p.exIntl ? p.exIntl : p.intl}</div>
                          </div>
                        </div>
                      </a>
                    )
                  )
                : emptyReactNodeNew()}
            </div>

            {dataList.length > 20 && slicedData.length < dataList.length && (
              <>
                <Divider className="proposal-title mb20" />
                <div className="load-more mb4" onClick={() => this.setState(s => ({ ...s, page: s.page + 1 }))}>
                  {intl.get('load_more')}
                </div>
              </>
            )}
          </div>

          <div className={`right-panel ${showProposalSectionForMobile ? 'hide-md' : ''}`}>
            {this.renderMyVote(theme)}

            <FaqContainer lang={lang} />
          </div>
        </div>

        <Modal
          visible={popShow}
          // title={popTitle}
          width={mobile ? 'calc(100% - 40px)' : 400}
          footer={null}
          className={`vote-modal ${theme}`}
          centered
          onCancel={() => {
            this.props.system.clearRejectError();
            this.hideDepositPop();
          }}
          getContainer={() => document.querySelector('.j-wrapper')}
        >
          {authorizePop
            ? this.renderApprovePop()
            : exchangeVotePop
            ? this.renderDepositPop(theme)
            : this.renderWithdrawPop()}
        </Modal>
        <TransactionModal></TransactionModal>
        <VoteDetailModal />
        <OldVoteWithdraw />
      </div>
    );
  }
}

export default Vote;
