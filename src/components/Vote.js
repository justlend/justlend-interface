import React from 'react';
import { Tooltip, Pagination, Modal, Input, Select } from 'antd';
import { Link } from 'react-router-dom';
import LeftMenu from './LeftMenu';
import isMobile from 'ismobilejs';
import intl from 'react-intl-universal';
import '../assets/css/vote.scss';
import { formatNumber, BigNumber, deduplication, numberParser, emptyReactNode } from '../utils/helper';
// import { getVoteList, getUserDetail } from '../utils/backend';
import Config from '../config';
import { inject, observer } from 'mobx-react';
import TransactionModal from './Modals/Transaction';
import FooterPage from '../components/Footer';
const { Option } = Select;
@inject('network')
@inject('system')
@inject('lend')
@observer
class Vote extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mobile: isMobile(window.navigator).any,
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      dataList: [{}],
      voteSourceList: [{}],
      pagination: {
        size: 'small',
        pageSize: 1,
        simple: false,
        showSizeChanger: false,
        hideOnSinglePage: true
      },
      selectKey: 'all',
      selectValue: intl.get('vote.allcase_picker_all'),
      exchangeVoteValue: '',
      withdrawValue: '',
      approveStatus: null
      // voteInfo: {}
    };
  }

  componentDidMount = async () => {
    this.props.lend.setData({
      voteForPop: false,
      redeemFromVotePop: false
    });
    try {
      let block = await this.props.lend.getCurrentBlock();
      let res = await this.props.lend.getVoteList(block);
      this.setState({
        dataList: res.arr
        // dataList: []
      });
    } catch (error) {
      console.log('getVoteList: ', error);
    }
  };

  renderVoteHeader() {
    return (
      <div className="vote-header">
        <h1 className="fs30 c-0F134F fw600">{intl.get('vote.title')}</h1>
        <h2 className="fs12 c-5A5E89">{intl.get('vote.subtitle')}</h2>
      </div>
    );
  }

  renderVoteLeft() {
    const { dataList, selectValue } = this.state;
    let { voteSourceList } = this.props.lend;
    const countData = deduplication(voteSourceList, 'intl');
    // console.log(countData, 'countData');
    return (
      <div className="vote-left">
        <div className="vl-header flex-between block-header">
          <span className="c-0F134F fw600">{intl.get('vote.allcase.title')}</span>
          <Select className="vote-select" defaultValue="all" onChange={this.getFilterData}>
            <Option value="all">
              {selectValue}({voteSourceList.length})
            </Option>
            {countData &&
              countData.length > 0 &&
              countData.map((item, index) => {
                return (
                  <Option value={item.state} key={index}>
                    {item.intl}({item.count})
                  </Option>
                );
              })}
          </Select>
        </div>
        <div className="vl-list">
          {countData && countData.length > 0 ? this.renderVoteList() : emptyReactNode()}
          {/* <Pagination defaultCurrent={1} total={50} onChange={this.pageChange} /> */}
        </div>
      </div>
    );
  }

  pageChange = currentPage => { };

  renderVoteList = () => {
    const { dataList } = this.state;
    const { isConnected } = this.props.network;
    if (!dataList || !dataList.length) return <div className="">{emptyReactNode()}</div>;
    let cardList = dataList.map((item, index) => {
      return item && item.state ? (
        isConnected ? (
          <Link to={{ pathname: '/voteDetail', search: `?proposalId=${item.proposalId}` }} key={index}>
            {this.renderVoteInfo(item)}
          </Link>
        ) : (
          <a key={index} onClick={() => this.props.network.connectWallet()}>
            {this.renderVoteInfo(item)}
          </a>
        )
      ) : null;
    });
    return <>{cardList}</>;
  };

  renderVoteInfo = item => {
    const { lang } = this.state;
    return (
      <div className="card-list">
        <div className="flex-between">
          <span className="c-0F134F fs14 proposal-title">
            {item.title ? (lang === 'en-US' ? item.title.split('&&')[1] : item.title.split('&&')[0]) : ''}
          </span>
          <span className="c-84869E fs12 proposal-id"># {item.proposalId}</span>
        </div>
        <div className="flex-between mt13">
          <div className="cl-footer-left">
            {/* <span className={'status sta' + item.state}>{item.intl}</span> */}
            <span className={'status sta' + item.state}>{item && item.intl}</span>
            {item.state === 1 ? (
              <>
                <span>
                  {intl.get('vote.detail_subtitle_for')}：
                  <span className="c-0F134F fs12 fw500">
                    {formatNumber(BigNumber(item.forVotes).div(Config.tokenDefaultPrecision)._toHex(), 0)}
                  </span>
                </span>
                <span>
                  {intl.get('vote.detail_subtitle_against')}：
                  <span className="c-0F134F fs12 fw500">
                    {formatNumber(BigNumber(item.againstVotes).div(Config.tokenDefaultPrecision)._toHex(), 0)}
                  </span>
                </span>
              </>
            ) : (
              <span className={'ex-' + item.state}>{item.exIntl}</span>
            )}
          </div>
          <span className="fs12">
            {intl.get('vote.case_info_endtime')} &nbsp;&nbsp;
            <span className="c-84869E fs12">{new Date(item.endTime).format('yyyy-MM-dd h:m:s')}</span>
          </span>
        </div>
      </div>
    );
  };

  renderVoteRight() {
    return (
      <div className="vote-right">
        {this.renderMyWallet()}
        {this.renderMyVote()}
        {/* {this.renderVoteAddressSum()} */}
      </div>
    );
  }

  renderMyWallet() {
    const { voteInfo } = this.props.lend;
    return (
      <div className="vr-info">
        <div className="vr-header flex-between block-header">
          <span className="c-0F134F fw600">
            <span>{intl.get('vote.mywallet_title')}</span>
            <Tooltip title={intl.get('vote.mywallet_help')} arrowPointAtCenter placement="bottomLeft">
              <span className="tooltip-icon"></span>
            </Tooltip>
          </span>
          <a
            className="btn btn-small btn-getjst"
            target="swap"
            href={`${Config.sunSwap}?lang=${this.state.lang}?tokenAddress=${Config.contract.JST}&type=swap`}
          >
            {intl.get('vote.mywallet_btn_getjst')}
          </a>
        </div>
        <div className="vr-content">
          <div className="flex-between">
            <span className="c-84869E fs12">{intl.get('vote.mywallet_jstbalance')}</span>
            <span className="c-0F134F fs14">
              {voteInfo &&
                voteInfo.success &&
                formatNumber(voteInfo.jstBalance.div(Config.tokenDefaultPrecision), 3, {
                  miniText: 0.001
                })}{' '}
              JST
            </span>
          </div>
        </div>
      </div>
    );
  }

  renderMyVote = () => {
    const { voteInfo } = this.props.lend;
    return (
      <div className="vr-info">
        <div className="vr-header flex-between block-header">
          <span className="c-0F134F fw600">
            <span>{intl.get('vote.myvote_title')}</span>
            <Tooltip title={intl.get('vote.myvote_help')} arrowPointAtCenter placement="bottomLeft">
              <span className="tooltip-icon"></span>
            </Tooltip>
          </span>
        </div>
        <div className="vr-content">
          <div className="flex-between mb16">
            <span>{intl.get('vote.myvote_balance')}</span>
            <span className="fs14 c-0F134F">
              {voteInfo &&
                voteInfo.success &&
                formatNumber(voteInfo.surplusVotes.div(Config.tokenDefaultPrecision), 3, { miniText: 0.001 })}
            </span>
          </div>
          <div className="vote-detail">
            <div className="flex-between">
              <span>{intl.get('vote.myvote_total')}</span>
              <span>
                {voteInfo &&
                  voteInfo.success &&
                  formatNumber(voteInfo.totalVote.div(Config.tokenDefaultPrecision), 3, { miniText: 0.001 })}
              </span>
            </div>
            <div className="flex-between">
              <span>{intl.get('vote.myvote_voted')}</span>
              <span>
                {voteInfo &&
                  voteInfo.success &&
                  formatNumber(voteInfo.castVote.div(Config.tokenDefaultPrecision), 3, { miniText: 0.001 })}
              </span>
            </div>
            {/* <div className="flex-between">
              <span>已赎回选票</span>
              <span>{formatNumber(12345678.12375, 3, { miniText: 0.001 })}</span>
            </div> */}
          </div>
        </div>
        <div className="vr-footer flex-between">
          <span className="btn" onClick={() => this.openModal()}>
            {intl.get('vote.myvote_deposit')}
          </span>
          <span className="btn" onClick={() => this.withdrawClick()}>
            {intl.get('vote.myvote_withdraw')}
          </span>
        </div>
      </div>
    );
  };

  renderVoteAddressSum() {
    return (
      <div className="vr-info flex-between">
        <span className="fs14 c-84869E">{intl.get('vote.myvote_address')}</span>
        <span className="fs14 c-0F134F">{formatNumber(12345678.12375, 0)} </span>
      </div>
    );
  }

  getFilterData = async state => {
    let dataList = await this.props.lend.voteSourceList;
    let arr = [...dataList];
    // console.log(state, arr);
    if (state !== 'all') {
      dataList = arr.filter(item => (BigNumber(state).gte(4) ? BigNumber(item.state).gte(4) : item.state == state));
    }
    this.setState({
      dataList: dataList
    });
  };

  withdrawClick = () => {
    const { isConnected } = this.props.network;
    if (!isConnected) {
      this.props.network.connectWallet();
    } else {
      this.setState({
        exchangeVoteValue: '',
        withdrawValue: ''
      });
      this.props.lend.setData({ withdrawPop: true });
    }
  };

  exchangeVoteChange = e => {
    const { valid, str } = numberParser(e.target.value, 3);
    if (valid) {
      this.setState({ exchangeVoteValue: str });
    }
  };

  withdrawChange = e => {
    const { valid, str } = numberParser(e.target.value, 3);
    if (valid) {
      this.setState({ withdrawValue: str });
    }
  };

  // suffix MAX render
  maxRender = item => {
    if (item === 1) {
      return (
        <div className="c-0F134F fs12 fw500" onClick={this.chooseMax}>
          {intl.get('vote.voteto_input_max')}
        </div>
      );
    } else if (item === 2) {
      return (
        <div className="c-0F134F fs12 fw500" onClick={this.chooseWithdrawMax}>
          {intl.get('vote.voteto_input_max')}
        </div>
      );
    }
  };

  chooseMax = () => {
    const { voteInfo } = this.props.lend;
    let maxValue = formatNumber(voteInfo.jstBalance.div(Config.tokenDefaultPrecision), 3, {
      per: true
    });
    this.setState({ exchangeVoteValue: maxValue });
  };

  chooseWithdrawMax = () => {
    const { voteInfo } = this.props.lend;
    let maxValue = formatNumber(voteInfo.surplusVotes.div(Config.tokenDefaultPrecision), 3, {
      per: true
    });
    this.setState({ withdrawValue: maxValue });
  };

  withdrawSubmit = () => {
    const { withdrawValue } = this.state;
    this.toWithdraw(withdrawValue);
  };

  toDeposit = async () => {
    const { exchangeVoteValue } = this.state;
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
      }
    };
    this.setState({ isSuccess: false, txID: '' });
    const txID = await this.props.system.voteDeposit(popData, intlObj);
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
      }
    };
    this.setState({ isSuccess: false, txID: '' });
    const txID = await this.props.system.voteWithdraw(popData, intlObj);
    // console.log('toWithdrawwwwwwwwwwww' ,txID);
  };

  getApprove = async () => {
    try {
      let voteData = {
        collateralAddress: Config.contract.JST,
        jtokenAddress: Config.contract.WJSTAddress,
        precision: Config.tokenDefaultPrecision
      };
      let allowance = await this.props.lend.getVoteBalanceOf(voteData);
      return BigNumber(allowance).gt(0);
    } catch (err) {
      console.log('getApprove, ', err);
      return false;
    }
  };

  openModal = () => {
    const { isConnected } = this.props.network;
    const { approveStatus } = this.state;
    if (!isConnected) {
      this.props.network.connectWallet();
    } else if (approveStatus) {
      this.authorize();
    } else {
      this.props.lend.setData({
        authorizePop: true
      });
    }
  };

  toApprove = async () => {
    const popData = {
      collateralAddress: Config.contract.JST,
      jtokenAddress: Config.contract.WJSTAddress
    };

    const intlObj = {
      title: 'deposit.confirm_approve',
      obj: {
        value: popData.collateralSymbol
      }
    };
    this.setState({ isSuccess: false, txID: '' });
    const txID = await this.props.system.approveToken(popData, [['lend/hideAuthorizePop']]);
    // console.log(txID);
    if (txID) {
      this.setState(
        {
          approveStatus: true
        },
        () => {
          this.authorize();
        }
      );
    }
  };

  authorize = () => {
    this.setState({
      exchangeVoteValue: ''
    });
    this.props.lend.setData({
      exchangeVotePop: true,
      authorizePop: false
    });
  };

  hideDepositPop = () => {
    this.props.lend.setData({
      authorizePop: false,
      exchangeVotePop: false,
      withdrawPop: false
    });
  };

  renderApprovePop = () => {
    return (
      <>
        <div className="vote-authorize-logo"></div>
        <div className="tac margin-0-auto fs14 c-0F134F vote-text">{intl.get('vote.approve_text')}</div>
        <div className="modal-btn authorize-btn mt40" onClick={() => this.toApprove()}>
          {intl.get('vote.approve_btn')}
        </div>
      </>
    );
  };

  renderDepositPop = () => {
    const { lang } = this.state;
    const { voteInfo } = this.props.lend;
    let maxValue;
    if (voteInfo && voteInfo.success) {
      maxValue = formatNumber(voteInfo.jstBalance.div(Config.tokenDefaultPrecision), 3, {
        per: true
      });
    }

    return (
      <>
        <div className="flex-between mb16">
          <span className="c-84869E fs12">{intl.get('vote.deposit_amount')}</span>
        </div>
        <Input
          className="mb8"
          value={this.state.exchangeVoteValue}
          placeholder={intl.get('vote.convert_input_tips')}
          suffix={this.maxRender(1)}
          onChange={this.exchangeVoteChange}
        />
        <div className="c-0F134F fs14 flexB">
          <span className="c-84869E fs12">{intl.get('vote.deposit_balance')}</span>
          <div>
            {voteInfo &&
              voteInfo.success &&
              formatNumber(voteInfo.jstBalance.div(Config.tokenDefaultPrecision), 3, {
                miniText: 0.001
              })}{' '}
            JST
            <a
              className="toSwap"
              href={`${Config.sunSwap}?lang=${lang}?tokenAddress=${Config.contract.JST}&type=swap`}
              target="sunswap"
            >
              {intl.get('index.get')}
            </a>
          </div>
        </div>
        <div className="c-84869E fs12 mb16">{intl.get('vote.deposit_tips')}</div>
        {this.state.exchangeVoteValue > 0 ? (
          <button
            className="modal-btn authorize-btn"
            onClick={() => this.toDeposit()}
            disabled={BigNumber(this.state.exchangeVoteValue).gt(maxValue)}
          >
            {BigNumber(this.state.exchangeVoteValue).gt(maxValue)
              ? intl.get('vote.voteto_insufficient_vote_balance')
              : intl.get('vote.deposit_btn_deposit')}
          </button>
        ) : (
          <button className="modal-btn no-use-btn">{intl.get('vote.convert_input_tips')}</button>
        )}
      </>
    );
  };

  renderWithdrawPop = () => {
    const { voteInfo } = this.props.lend;
    let wMaxValue;
    if (voteInfo && voteInfo.success) {
      wMaxValue = formatNumber(voteInfo.surplusVotes.div(Config.tokenDefaultPrecision), 3, {
        miniText: 0.001
      });
    }
    return (
      <>
        <div className="flex-between mb16">
          <span className="c-84869E fs12">{intl.get('vote.withdraw_amount')}</span>
        </div>
        <Input
          className="mb8"
          value={this.state.withdrawValue}
          placeholder={intl.get('vote.withdraw_input_tip')}
          suffix={this.maxRender(2)}
          onChange={this.withdrawChange}
        />
        <div className="c-0F134F fs14 flexB">
          <span className="c-84869E fs12">{intl.get('vote.voteto_subtitle_votebal')}</span>
          <span>
            {voteInfo &&
              voteInfo.success &&
              formatNumber(voteInfo.surplusVotes.div(Config.tokenDefaultPrecision), 3, {
                miniText: 0.001
              })}{' '}
            JST
          </span>
        </div>
        <div className="c-84869E fs12 mb16">{intl.get('vote.deposit_tips')}</div>
        {this.state.withdrawValue > 0 ? (
          <button
            className="modal-btn authorize-btn"
            onClick={() => this.withdrawSubmit()}
            disabled={BigNumber(this.state.withdrawValue).gt(wMaxValue)}
          >
            {BigNumber(this.state.withdrawValue).gt(wMaxValue)
              ? intl.get('vote.voteto_insufficient_vote_balance')
              : intl.get('index.my_withdraw')}
          </button>
        ) : (
          <button className="modal-btn no-use-btn">{intl.get('index.my_withdraw')}</button>
        )}
      </>
    );
  };

  getMountedData = async () => {
    try {
      let approveStatus = await this.getApprove();
      this.setState(
        {
          approveStatus
        },
        () => {
          this.props.lend.getBalanceForVote();
        }
      );
    } catch (error) {
      console.log('getVoteDataError: ', error);
    }
  };

  render() {
    const { mobile } = this.state;
    const { menuFlag } = this.props.network;
    const { exchangeVotePop, authorizePop, withdrawPop } = this.props.lend;
    let popShow = authorizePop || exchangeVotePop || withdrawPop;
    let popTitle = '';

    if (authorizePop) {
      popTitle = intl.get('vote.approve_title');
    } else if (exchangeVotePop) {
      popTitle = intl.get('vote.deposit_title');
    } else if (withdrawPop) {
      popTitle = intl.get('vote.withdraw_title');
    }

    return (
      <div className={mobile ? '' : 'flex-end'}>
        <LeftMenu mountedActions={this.getMountedData}></LeftMenu>
        <div
          className={
            mobile
              ? 'vote-container right-container mobile-right-container'
              : menuFlag
                ? 'vote-container right-container'
                : 'vote-container right-container max-width'
          }
        >
          {this.renderVoteHeader()}
          <div className="vote-content flex-between">
            {this.renderVoteLeft()}
            {this.renderVoteRight()}
          </div>

          <Modal
            visible={popShow}
            title={popTitle}
            width={400}
            footer={null}
            className={'vote-deposit' + (exchangeVotePop ? ' border-bottom-header' : '')}
            onCancel={() => this.hideDepositPop()}
          >
            {authorizePop
              ? this.renderApprovePop()
              : exchangeVotePop
                ? this.renderDepositPop()
                : this.renderWithdrawPop()}
          </Modal>
          <TransactionModal></TransactionModal>
          <FooterPage></FooterPage>
        </div>
      </div>
    );
  }
}

export default Vote;
