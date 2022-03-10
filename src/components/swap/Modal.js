import React from 'react';
import isMobile from 'ismobilejs';
import { inject, observer } from 'mobx-react';
import { Modal, Tabs, Input, Tooltip } from 'antd';
import intl from 'react-intl-universal';
import Config from '../../config';
import {
  numberParser,
  BigNumber,
  formatNumber,
  getClaimed,
  getClaiming,
  getPoolTotalAPY,
  getMiningRewards,
  renderGain
} from '../../utils/helper';
// import { yamApprove, yamDeposit, yamReward, yamWithdraw } from '../../utils/blockchain';
import '../../assets/css/swap.scss';
import { ICONS_MAP } from '../../utils/constant';
const { TabPane } = Tabs;
import tooltip from '../../assets/images/tooltip.svg';

@inject('network')
@inject('system')
@inject('pool')
@observer
class SwapModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      approving: false,
      focuStatus: false,
      lockBtn: intl.get('tab.lock'),
      collectBtn: intl.get('tab.unlock_btn'),
      lockBtnStatus: false,
      collectBtnStatus: false,
      smallSize: false,
      stakeValue: '',
      withdrawValue: ''
    };
  }

  componentDidMount = () => { };

  initModal = () => {
    this.setState({
      approving: false,
      focuStatus: false,
      smallSize: false,
      stakeValue: '',
      withdrawValue: ''
    });
  };

  cancelModal = () => {
    this.props.onCancel && this.props.onCancel();

    this.initModal();
  };

  getReward = async () => {
    try {
      let { cardData } = this.props;
      const { gift, giftKey, decimal, trxClaimed = BigNumber(0), tokenClaimed = BigNumber(0) } = cardData;
      if (!trxClaimed.gt(0) && !tokenClaimed.gt(0)) return;

      let intlObj = {};
      // console.log(gift, giftKey);
      if (giftKey.length === 2) {
        intlObj = {
          title: 'stake.all_claim',
          obj: {
            value1: formatNumber(tokenClaimed, Config.defaultDecimal),
            value2: formatNumber(trxClaimed, Config.defaultDecimal),
            token1: giftKey[0].toUpperCase(),
            token2: giftKey[1].toUpperCase()
          }
        };
      } else {
        intlObj = {
          title: 'stake.token_claim',
          obj: {
            value1: formatNumber(giftKey[0] === 'trx' ? trxClaimed : tokenClaimed, Config.defaultDecimal),
            token1: giftKey[0].toUpperCase()
          }
        };
      }
      this.setState({ isSuccess: false, txID: '' });
      const txID = await this.props.system.yamReward(cardData, intlObj);
      if (txID) {
        setTimeout(() => {
          this.props.pool.getPoolData();
          this.props.pool.getTronbullish();
        }, 5000);
      }
    } catch (err) {
      console.log(err);
    }
  };

  maxNumber = bg => {
    return BigNumber(bg.toFixed(Config.defaultDecimalForInput, 1)).toString();
  };

  setMaxWithdraw = async () => {
    let { cardData } = this.props;
    if (!cardData.staked.gt(0)) return;

    const withdrawValue = this.maxNumber(cardData.staked);
    this.setState({ withdrawValue }, () => {
      this.unlockChange(withdrawValue);
    });
  };

  setMaxStake = async () => {
    let { cardData } = this.props;
    const nowTime = Date.now();
    const endTime = cardData.end;
    if (
      !BigNumber(cardData.tokenBalance).gt(0) ||
      !(cardData.tokenAllowance._toBg().gt(0) && cardData.tokenBalance._toBg().gt(0))
    )
      return;

    const stakeValue = this.maxNumber(cardData.tokenBalance);
    this.setState({ stakeValue }, () => {
      this.stakeChange(stakeValue);
    });
  };

  stakeChange = inputValue => {
    const { cardData } = this.props;
    const tokenBalance = cardData.tokenBalance;
    const { valid, str } = numberParser(inputValue, Config.defaultDecimalForInput);
    if (valid) {
      this.setState({ stakeValue: str });
      if (!BigNumber(str).gt(0)) {
        this.setState({
          lockBtn: intl.get('tab.lock'),
          lockBtnStatus: false
        });
      } else if (BigNumber(str).gt(tokenBalance)) {
        this.setState({
          lockBtn: intl.get('tab.not_enough'),
          lockBtnStatus: false
        });
      } else {
        this.setState({
          lockBtn: intl.get('tab.lock'),
          lockBtnStatus: true
        });
      }

      if (str.length > 10) {
        this.setState({ smallSize: true });
      } else {
        this.setState({ smallSize: false });
      }
    }
  };

  unlockChange = inputValue => {
    const { cardData } = this.props;
    const { valid, str } = numberParser(inputValue, Config.defaultDecimalForInput);
    if (valid) {
      this.setState({ withdrawValue: str });
      if (!BigNumber(str).gt(0)) {
        this.setState({
          collectBtn: intl.get('tab.unlock_btn'),
          collectBtnStatus: false
        });
      } else if (BigNumber(str).gt(cardData.staked)) {
        this.setState({
          collectBtn: intl.get('tab.not_enough'),
          collectBtnStatus: false
        });
      } else {
        this.setState({
          collectBtn: intl.get('tab.unlock_btn'),
          collectBtnStatus: true
        });
      }

      if (str.length > 10) {
        this.setState({ smallSize: true });
      } else {
        this.setState({ smallSize: false });
      }
    }
  };

  gotojustlend = () => {
  };

  toDeposit = async () => {
    const { lockBtnStatus, stakeValue } = this.state;
    let { cardData } = this.props;

    if (!lockBtnStatus) return;

    const intlObj = {
      title: 'lend.mint',
      obj: {
        value: stakeValue,
        token: `${cardData.lp}-TRX LP`
      }
    };
    const txID = await this.props.system.yamDeposit(
      cardData,
      new BigNumber(stakeValue).times(cardData.precision).toString(),
      intlObj
    );
    if (txID) {
      this.stakeChange('');

      setTimeout(() => {
        this.props.pool.getTokenBalanceOf(cardData);
        this.props.pool.getPoolData();
        this.props.pool.getTronbullish();
      }, 10000);
    }
  };

  toApprove = async () => {
    const { cardData } = this.props;
    const { approving } = this.state;

    // if (Date.now() > cardData.end) return;
    if (approving) return;

    const intlObj = {
      title: 'lend.approve',
      obj: {
        token: `${cardData.lp}-TRX LP`
      }
    };
    try {
      const txID = await this.props.system.yamApprove(cardData, intlObj);
      if (txID) {
        this.setState({ approving: true });
        setTimeout(async () => {
          await this.props.pool.getTokenBalanceOf(cardData);
          this.setState({ approving: false });
        }, 5000);
      } else {
        this.setState({ approving: false });
      }
    } catch (error) {
      console.log(error);
    }
  };

  toWithDraw = async () => {
    const { withdrawValue, collectBtnStatus } = this.state;
    if (!collectBtnStatus) return;

    let { cardData } = this.props;
    const intlObj = {
      title: 'stake.unstake',
      obj: {
        value: withdrawValue,
        token: `${cardData.lp}-TRX LP`
      }
    };
    this.setState({ isSuccess: false, txID: '' });
    const txID = await this.props.system.yamWithdraw(
      cardData,
      new BigNumber(withdrawValue).times(cardData.precision).toString(),
      intlObj
    );
    if (txID) {
      this.unlockChange('');

      setTimeout(() => {
        // this.refreshApy();
        this.props.pool.getTokenBalanceOf(cardData);
        this.props.pool.getPoolData();
      }, 5000);
    }
  };

  focusOnchange = status => {
    this.setState({ focuStatus: status });
  };

  renderDeposit = () => {
    const { cardData, defaultKey } = this.props;
    if (defaultKey == 1) {
      // window.gtag('event', 'page_view', {
      //   page_title: 'supply_window_counts',
      //   send_to: 'UA-177464249-8'
      // });
    } else if (defaultKey == 2) {
      // window.gtag('event', 'page_view', {
      //   page_title: 'withdraw_window_counts',
      //   send_to: 'UA-177464249-8'
      // });
    }
    const { nowTime } = this.props.network;
    const { tronBull, tronbullish, tokenPrices } = this.props.pool;
    const {
      focuStatus,
      smallSize,
      stakeValue,
      lang,
      lockBtn,
      lockBtnStatus,
      collectBtn,
      collectBtnStatus,
      withdrawValue
    } = this.state;

    return (
      <div className="lend-deposit">
        <Tabs
          defaultActiveKey={defaultKey}
          centered
          tabBarStyle={{ fontSize: '18px', fontFamily: 'PingFangSC-Medium' }}
        >
          <TabPane tab={intl.get('tab.lock')} key="1" disabled={this.props.end}>
            <div className="lend-deposit-pane">
              <div className="lend-deposit-amount">
                <div className="between a-center">
                  <span className="name c-333">{intl.get('tab.lock_num')}</span>
                  <span className="max" onClick={this.setMaxStake}>
                    MAX
                  </span>
                </div>
                <Input
                  suffix={`${cardData.lp}-TRX LP`}
                  value={stakeValue}
                  onChange={e => this.stakeChange(e.target.value)}
                  placeholder={focuStatus ? null : '0'}
                  onBlur={() => this.focusOnchange(false)}
                  onFocus={() => this.focusOnchange(true)}
                  className={'depositInput ' + (smallSize ? 'small' : '')}
                />
                <div className="between">
                  <span className="name">{intl.get('tab.locked')}</span>
                  <span className="name">
                    <span className="value">{formatNumber(cardData.staked, Config.defaultDecimal)}</span> {cardData.lp}
                    {'-TRX LP'}
                  </span>
                </div>
                <div className="between">
                  <span className="name">{intl.get('lend.balance')}</span>
                  <span className="name">
                    <span className="value">{formatNumber(cardData.tokenBalance, Config.defaultDecimal)}</span>{' '}
                    {`${cardData.lp}-TRX LP`}
                  </span>
                </div>
                <div className="between">
                  <span className="name">{'APY'}</span>
                  <span className="name apy">{getPoolTotalAPY(cardData, tronBull)}</span>
                </div>
                <div className="lend-modal-bottom">
                  <button disabled={!lockBtnStatus} onClick={() => this.toDeposit()}>
                    {lockBtn}
                  </button>
                </div>
              </div>
            </div>
          </TabPane>
          <TabPane tab={intl.get('tab.collect')} key="2">
            <div className="lend-withdraw-pane">
              <div className="lend-withdraw-amount">
                <div className="between a-center">
                  <span className="name c-333">{intl.get('tab.unlock_num')}</span>
                  <span className="max" onClick={this.setMaxWithdraw}>
                    MAX
                  </span>
                </div>
                <Input
                  suffix={`${cardData.lp}-TRX LP`}
                  value={withdrawValue}
                  onChange={e => this.unlockChange(e.target.value)}
                  placeholder={focuStatus ? null : '0'}
                  onBlur={() => this.focusOnchange(false)}
                  onFocus={() => this.focusOnchange(true)}
                  className={'depositInput ' + (smallSize ? 'small' : '')}
                />
                <div className="between">
                  <span className="name">{intl.get('tab.unlock_title')}</span>
                  <span className="name">
                    <span className="value">{formatNumber(cardData.staked, Config.defaultDecimal)}</span> {cardData.lp}
                    {'-TRX LP'}
                  </span>
                </div>
                <div className="between">
                  <span className="name">{intl.get('card_modal_add.aClaim')}</span>
                  <span className="name">
                    {cardData.gift &&
                      cardData.gift.map((item, index) => {
                        return (
                          <span className="value" key={index}>
                            {item.symbol === 'TRX'
                              ? formatNumber(cardData.trxClaimed, Config.defaultDecimal)
                              : formatNumber(cardData.tokenClaimed, Config.defaultDecimal)}
                            {` ${item.symbol} `} {index !== cardData.gift.length - 1 ? '+ ' : ''}
                          </span>
                        );
                      })}
                    <span className="link" onClick={() => this.getReward()}>
                      {intl.get('tab.claim_btn')}
                    </span>
                  </span>
                </div>
                <div className="name big c-333 mt">{intl.get('tab.my_withdrawn')}</div>
                <div className="between">
                  <span className="name">{intl.get('tab.claim_title')}</span>
                  <span className="name">
                    <span className="value">{getMiningRewards(cardData, tronbullish, 'swap', {}, tokenPrices)}</span>
                  </span>
                </div>
                <div className="claim-detail">
                  <div className="flexB claim-title">
                    <span>{intl.get('card_modal_add.currency')}</span>
                    <span className="align-center">
                      <span>{intl.get('card_modal_add.upcoming')}</span>
                      <Tooltip
                        title={intl.get('card_modal_add.upcoming_tip')}
                        arrowPointAtCenter
                        placement="top"
                        overlayClassName="modal-tooltip"
                      >
                        <img src={tooltip} />
                      </Tooltip>
                    </span>
                    <span className="align-center">
                      <span>{intl.get('card_modal_add.frozen')}</span>
                      <Tooltip
                        title={intl.get('card_modal_add.frozen_tip')}
                        arrowPointAtCenter
                        placement="topRight"
                        overlayClassName="modal-tooltip"
                      >
                        <img src={tooltip} />
                      </Tooltip>
                    </span>
                  </div>
                  {renderGain(cardData, nowTime, tronbullish)}
                </div>
                <div className="lend-modal-bottom">
                  <button disabled={!collectBtnStatus} onClick={() => this.toWithDraw()}>
                    {collectBtn}
                  </button>
                </div>
              </div>
            </div>
          </TabPane>
        </Tabs>
      </div>
    );
  };

  renderGiftList = () => {
    const { cardData } = this.props;
    let giftList = cardData.gift.map((item, index) => {
      return (
        <span className="value" key={index}>
          {item.symbol === 'TRX'
            ? formatNumber(cardData.trxClaimed, item.decimal)
            : formatNumber(cardData.tokenClaimed, item.decimal)}
          {` ${item.symbol} `} {index !== cardData.gift.length - 1 ? '+' : ''}
        </span>
      );
    });

    return giftList;
  };

  renderApprove = () => {
    const { cardData } = this.props;
    return (
      <div className="lend-approve">
        <div className="title">{intl.get('lend.approve')}</div>
        <div className="tip">{intl.getHTML('lend.approveDesc', { token: `${cardData.lp}-TRX LP` })}</div>
        <div>
          <button onClick={() => this.toApprove()}>
            {intl.get('lend.approve')} {`${cardData.lp}-TRX LP`}
          </button>
        </div>
      </div>
    );
  };

  render() {
    const { visible, cardData } = this.props;
    return (
      <Modal
        getContainer={() => document.querySelector('.pool-container')}
        visible={visible}
        title={''}
        width={400}
        footer={null}
        className="lend-modal"
        onCancel={this.cancelModal}
      >
        {cardData.tokenAllowance._toBg().gt(0) ? this.renderDeposit() : this.renderApprove()}
      </Modal>
    );
  }
}

export default SwapModal;
