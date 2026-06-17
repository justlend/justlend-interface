import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Modal, Tabs, Input, Tooltip } from 'antd';
import intl from 'react-intl-universal';
import Stores from '../../../stores';
import Config from '../../../config';
import { numberParser, BigNumber, formatNumber, getPoolTotalAPY, getMiningRewards } from '../../../utils/helper';
import { MAX_UINT256 } from '../../../utils/blockchain';
import '../../../assets/css/swap.scss';
import '../../../assets/css/swap-m.scss';
import tooltip from '../../../assets/images/tooltip.svg';
const { TabPane } = Tabs;

const SwapModal = observer(({ visible = false, cardData = {}, onCancel = () => {}, defaultKey = '1', end = '' }) => {
  const { system, pool } = Stores;
  const [lang, setLang] = useState(window.localStorage.getItem('lang') || intl.options.currentLocale);
  const [approving, setApproving] = useState(false);
  const [focuStatus, setFocuStatus] = useState(false);
  const [lockBtn, setLockBtn] = useState(intl.get('tab.lock'));
  const [collectBtn, setCollectBtn] = useState(intl.get('tab.unlock_btn'));
  const [lockBtnStatus, setLockBtnStatus] = useState(false);
  const [collectBtnStatus, setCollectBtnStatus] = useState(false);
  const [smallSize, setSmallSize] = useState(false);
  const [stakeValue, setStakeValue] = useState('');
  const [withdrawValue, setWithdrawValue] = useState('');

  const initModal = () => {
    this.setState({
      approving: false,
      focuStatus: false,
      smallSize: false,
      stakeValue: '',
      withdrawValue: ''
    });
  };

  const cancelModal = () => {
    onCancel && onCancel();
    initModal();
  };

  const getReward = async () => {
    try {
      const { gift, giftKey, decimal, trxClaimed = BigNumber(0), tokenClaimed = BigNumber(0) } = cardData;
      if (!trxClaimed.gt(0) && !tokenClaimed.gt(0)) return;

      let intlObj = {};

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

      const contractAddress = cardData.pool;
      let funcSelector = 'getReward()';
      let parameters = [];
      const feeLimit = await system.getFeeLimitCommon(contractAddress, funcSelector, parameters);
      const options = { feeLimit };

      const txID = await system.yamReward(cardData, intlObj, options);
      if (txID) {
        setTimeout(() => {
          pool.getPoolData();
          pool.getTronbullish();
        }, 5000);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const maxNumber = bg => {
    return BigNumber(bg.toFixed(Config.defaultDecimalForInput, 1)).toString();
  };

  const setMaxWithdraw = async () => {
    if (!BigNumber(cardData.staked).gt(0)) return;

    const withdrawValue = maxNumber(cardData.staked);
    this.setState({ withdrawValue }, () => {
      unlockChange(withdrawValue);
    });
  };

  const setMaxStake = async () => {
    if (
      !BigNumber(cardData.tokenBalance).gt(0) ||
      !(cardData.tokenAllowance._toBg().gt(0) && cardData.tokenBalance._toBg().gt(0))
    )
      return;

    const stakeValue = maxNumber(cardData.tokenBalance);
    this.setState({ stakeValue }, () => {
      stakeChange(stakeValue);
    });
  };

  const stakeChange = inputValue => {
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

  const unlockChange = inputValue => {
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

  const toDeposit = async () => {
    if (!lockBtnStatus) return;

    const intlObj = {
      title: 'lend.mint',
      obj: {
        value: stakeValue,
        token: `${cardData.lp}-TRX LP`
      }
    };

    const contractAddress = cardData.pool;
    const amount = new BigNumber(stakeValue).times(cardData.precision).toString();
    let funcSelector = 'stake(uint256)';
    let parameters = [{ type: 'uint256', value: amount }];
    let options = {};
    if (cardData.symbol === 'TRX') {
      funcSelector = 'stake()';
      parameters = [];
      options = { callValue: amount };
    } else if (cardData.vote === 'sunoldVote') {
      funcSelector = 'stake(uint256,address)';
      parameters = [
        { type: 'uint256', value: amount },
        { type: 'address', value: cardData.voteAddr }
      ];
    }
    const feeLimit = await system.getFeeLimitCommon(contractAddress, funcSelector, parameters, options);

    const txID = await system.yamDeposit(cardData, amount, intlObj, feeLimit);
    if (txID) {
      stakeChange('');

      setTimeout(() => {
        pool.getTokenBalanceOf(cardData);
        pool.getPoolData();
        pool.getTronbullish();
      }, 10000);
    }
  };

  const toApprove = async () => {
    if (approving) return;

    const intlObj = {
      title: 'lend.approve',
      obj: {
        token: `${cardData.lp}-TRX LP`
      }
    };
    try {
      const contractAddress = cardData.token;
      let funcSelector = 'approve(address,uint256)';
      let parameters = [
        { type: 'address', value: cardData.pool },
        { type: 'uint256', value: MAX_UINT256 }
      ];
      const feeLimit = await system.getFeeLimitCommon(contractAddress, funcSelector, parameters);
      const options = { feeLimit };

      const txID = await system.yamApprove(cardData, intlObj, options);
      if (txID) {
        this.setState({ approving: true });
        setTimeout(async () => {
          await pool.getTokenBalanceOf(cardData);
          this.setState({ approving: false });
        }, 5000);
      } else {
        this.setState({ approving: false });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const toWithDraw = async () => {
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

    const contractAddress = cardData.pool;
    let funcSelector = 'withdrawAndGetReward(uint256)';
    const amount = new BigNumber(withdrawValue).times(cardData.precision).toString();
    let parameters = [{ type: 'uint256', value: amount }];
    const feeLimit = await system.getFeeLimitCommon(contractAddress, funcSelector, parameters);
    const options = { feeLimit };

    const txID = await system.yamWithdraw(cardData, amount, intlObj, options);
    if (txID) {
      unlockChange('');

      setTimeout(() => {
        // this.refreshApy();
        pool.getTokenBalanceOf(cardData);
        pool.getPoolData();
      }, 5000);
    }
  };

  const focusOnchange = status => {
    this.setState({ focuStatus: status });
  };

  const renderDeposit = () => {
    const { tronBull, tronbullish, tokenPrices } = pool;

    return (
      <div className="lend-deposit">
        <Tabs
          defaultActiveKey={defaultKey}
          centered
          tabBarStyle={{ fontSize: '18px', fontFamily: 'PingFangSC-Medium' }}
        >
          <TabPane tab={intl.get('tab.lock')} key="1" disabled={end}>
            <div className="lend-deposit-pane">
              <div className="lend-deposit-amount">
                <div className="between a-center">
                  <span className="name c-333">{intl.get('tab.lock_num')}</span>
                  <span className="max" onClick={setMaxStake}>
                    MAX
                  </span>
                </div>
                <Input
                  suffix={`${cardData.lp}-TRX LP`}
                  value={stakeValue}
                  onChange={e => stakeChange(e.target.value)}
                  placeholder={focuStatus ? null : '0'}
                  onBlur={() => focusOnchange(false)}
                  onFocus={() => focusOnchange(true)}
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
                  <button disabled={!lockBtnStatus} onClick={() => toDeposit()}>
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
                  <span className="max" onClick={setMaxWithdraw}>
                    MAX
                  </span>
                </div>
                <Input
                  suffix={`${cardData.lp}-TRX LP`}
                  value={withdrawValue}
                  onChange={e => unlockChange(e.target.value)}
                  placeholder={focuStatus ? null : '0'}
                  onBlur={() => focusOnchange(false)}
                  onFocus={() => focusOnchange(true)}
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
                    <span className="link" onClick={() => getReward()}>
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
                </div>
                <div className="lend-modal-bottom">
                  <button disabled={!collectBtnStatus} onClick={() => toWithDraw()}>
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

  const renderApprove = () => {
    return (
      <div className="lend-approve">
        <div className="title">{intl.get('lend.approve')}</div>
        <div className="tip">{intl.getHTML('lend.approveDesc', { token: `${cardData.lp}-TRX LP` })}</div>
        <div>
          <button onClick={() => toApprove()}>
            {intl.get('lend.approve')} {`${cardData.lp}-TRX LP`}
          </button>
        </div>
      </div>
    );
  };

  return (
    <Modal
      getContainer={() => document.querySelector('body')}
      visible={visible}
      title={''}
      width={400}
      footer={null}
      className="lend-modal mining-row-modal"
      onCancel={cancelModal}
    >
      {cardData.tokenAllowance._toBg().gt(0) ? renderDeposit() : renderApprove()}
    </Modal>
  );
});

export default SwapModal;
