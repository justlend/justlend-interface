import React from 'react';
import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';
import { Modal, Input, Divider } from 'antd';
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
class SwapJstToVote extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      isSigning: false,
      jstInputValue: '',
      inputErrorText: '',
      approveStatus: null,
      approving: false
    };
  }

  hideSwapJstToVotePop = () => {
    this.setState({
      isSigning: false,
      jstInputValue: '',
      inputErrorText: ''
    });
    this.props.vote.setSwapJstToVoteModalVisible(false);

    window.gtag('event', 'PC_vote_detail_get_votes_close', {
      'event_category': 'PC_V1.5',
      'event_label': 'vote_detail_get_votes_close'
    });
  };

  componentDidMount = async () => {
    if (this.props.network.isConnected) {
      this.getMountedData();
    }
    this.props.network.on('connect', () => {
      this.getMountedData();
    });
  };

  getMountedData = async () => {
    let approveStatus = await this.getApprove();
    this.setState(
      {
        approveStatus,
        approving: false
      },
      () => {
        this.props.vote.getBalanceForVote();
        this.props.vote.getOldWjstBalanceForVote();
      }
    );
  };

  getApprove = async () => {
    try {
      let voteData = {
        collateralAddress: Config.contract.JST,
        jtokenAddress: Config.contract.WJSTAddress,
        precision: Config.tokenDefaultPrecision
      };
      let allowance = await this.props.vote.getVoteBalanceOf(voteData);
      return BigNumber(allowance).gt(0);
    } catch (err) {
      console.log('getApprove, ', err);
      return false;
    }
  };

  maxRender = () => {
    return (
      <div className="max-value-button" onClick={this.chooseMax}>
        {intl.get('vote.voteto_input_max')}
      </div>
    );
  };

  chooseMax = () => {
    const { voteInfo } = this.props.vote;
    let maxValue = formatNumber(voteInfo.jstBalance.div(Config.tokenDefaultPrecision), 3, { per: true });
    this.setState({ jstInputValue: maxValue });
  };

  jstInputValueOnChange = inputValue => {
    const { valid, str } = numberParser(inputValue, 3);
    if (valid) {
      this.setState({ jstInputValue: str });

      const { voteInfo } = this.props.vote;
      if (voteInfo && voteInfo.success && voteInfo.jstBalance.div(Config.tokenDefaultPrecision).lt(BigNumber(str))) {
        this.setState({
          inputErrorText: intl.get('tab.not_enough')
        });
      } else {
        this.setState({
          inputErrorText: ''
        });
      }
    }
  };

  swap = async () => {
    this.props.system.clearRejectError();
    const { jstInputValue } = this.state;

    this.setState({
      isSigning: true
    });

    const popData = {
      collateralAddress: Config.contract.JST,
      jtokenAddress: Config.contract.WJSTAddress,
      amount: BigNumber(jstInputValue).times(Config.tokenDefaultPrecision)._toHex()
    };

    const intlObj = {
      title: 'toast.ex',
      title2: 'deposit.transactionsent',
      title3: 'toast.ex_failed',
      title4: 'deposit.confirm_transaction',
      obj: {
        value: popData.collateralSymbol
      },
      transType: 'swapVote'
    };
    try {
      const txID = await this.props.system.voteDeposit(popData, intlObj);
      if (txID) {
        this.hideSwapJstToVotePop();
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

  toApprove = async () => {
    this.props.system.clearRejectError();

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
    const txID = await this.props.system.approveToken(popData, [['vote/hideAuthorizePop']]);

    if (txID) {
      this.setState({
        approveStatus: true
      });
    }
    this.setState({ approving: false });
  };

  renderSwapPop = () => {
    const { voteInfo } = this.props.vote;
    const { isSigning, jstInputValue, inputErrorText } = this.state;
    const { transModalInfo } = this.props.system;
    const { declined, transType } = transModalInfo;

    let contentTitle, buttonTitle;

    let jstDisplayString = '--';

    if (voteInfo && voteInfo.success) {
      const jst = BigNumber(voteInfo.jstBalance);
      jstDisplayString = formatNumber(jst.div(Config.tokenDefaultPrecision), 3, {
        miniText: 0.001
      });
    }

    contentTitle = intl.getHTML('v2.vote.get_vote_modal_text');
    if (isSigning) {
      buttonTitle = intl.get('v2.sign_in_wallet');
    } else {
      buttonTitle = intl.get('v2.vote.deposit_now');
    }

    // For dev
    // jstDisplayString = '1800.233';

    return (
      <>
        <div className={classnames('modal-content-container', 'have-input')}>
          <div className="content-icon"></div>
          <div className="content-title">{contentTitle}</div>

          <div className="input-container">
            <div className="input-header">
              <div className="input-title">{intl.getHTML('vote.deposit_amount')}</div>

              <div className="remaining-votes">
                <div className="text">{intl.get('wallet_ballance')}</div>
                <div className="balance">{jstDisplayString}</div>
              </div>
              <a
                className="get-jst-link"
                target="_blank"
                rel="noopener noreferrer"
                href={`${Config.sunSwap}?lang=${this.state.lang}?tokenAddress=${Config.contract.JST}&type=swap`}
              >
                {intl.get('lend.get')}
              </a>
            </div>
            <Input
              className={'j-input ' + (inputErrorText ? 'j-error-input' : '')}
              value={addThousandSeparators(jstInputValue)}
              placeholder={intl.get('vote.convert_input_tips')}
              addonAfter={this.maxRender()}
              onChange={e => this.jstInputValueOnChange(removeThousandSeparators(e.target.value))}
              allowClear
              disabled={isSigning ? true : false}
            />
            <div className={classnames('j-error-tip', { 'show-error': inputErrorText })}>
              <span className="j-error-img"></span>
              <div>{inputErrorText}</div>
            </div>
          </div>
        </div>

        <button
          className={classnames('j-large-btn', { 'is-signing': isSigning })}
          disabled={isSigning || inputErrorText || !jstInputValue || jstInputValue == '0'}
          onClick={() => {
            this.swap();
          }}
        >
          {buttonTitle}
          <span className="siging-icon"></span>
        </button>

        {declined && transType === 'swapVote' && (
          <div className="j-error-tip wallet-reject">
            <span className="j-error-img"></span>
            <div>{intl.get('v2.reject_in_wallet')}</div>
          </div>
        )}
      </>
    );
  };

  renderApprovePop = () => {
    const { approving } = this.state;
    const { transModalInfo } = this.props.system;
    const { declined, transType } = transModalInfo;

    return (
      <>
        <div className="modal-content-container">
          <div className="vote-authorize-logo"></div>
          <div className="content-title">{intl.getHTML('vote.approve_text')}</div>
        </div>
        {approving ? (
          <button className="j-large-btn is-valid" disabled>
            {intl.get('v2.sign_in_wallet')}
            <span className="siging-icon"></span>
          </button>
        ) : (
          <button className="j-large-btn is-valid" onClick={this.toApprove}>
            {intl.get('vote.approve_btn')}
          </button>
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

  render() {
    const { swapJstToVoteModalVisible } = this.props.vote;
    const { approveStatus } = this.state;

    let modalTitle = approveStatus ? intl.get('vote.myvote_deposit') : intl.get('deposit.confirm_approve');

    return (
      <Modal
        visible={swapJstToVoteModalVisible}
        title={modalTitle}
        width={400}
        footer={null}
        className="j-modal header-border swap-jst-to-vote-pop"
        onCancel={() => this.hideSwapJstToVotePop()}
        closable={true}
        maskClosable={false}
        centered
        getContainer={() => document.querySelector('.j-wrapper')}
      >
        {approveStatus ? this.renderSwapPop() : this.renderApprovePop()}
      </Modal>
    );
  }
}

export default SwapJstToVote;
