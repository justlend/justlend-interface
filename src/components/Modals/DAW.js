import React from 'react';
import isMobile from 'ismobilejs';
import BigNumber from 'bignumber.js';
import { inject, observer } from 'mobx-react';
import {
  formatNumber,
  renderBalance,
  numberParser,
  checkEnteredMarket,
  gtBalance,
  renderPercent,
  renderProgress,
  getPercent,
  checkCash,
  eqBalance,
  getTotalApy
} from '../../utils/helper';
import { getTRC20Balance, getCash } from '../../utils/blockchain';
import { Modal, Tabs, Input, Progress, Button } from 'antd';
import intl from 'react-intl-universal';
import '../../assets/css/modal.scss';
import defaultIcon from '../../assets/images/default.svg';
import shield from '../../assets/images/shield.svg';
import Config from '../../config';
const { TabPane } = Tabs;
@inject('network')
@inject('lend')
@inject('system')
@observer
class depositeAndWithdraw extends React.Component {
  constructor(props) {
    super(props);
    this.timerInterval = null;
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      approved: false,
      approving: false,
      errInfo1: {
        btnText: intl.get('deposit.enteramount2'),
        status: false
      },
      errInfo2: {
        btnText: intl.get('withdraw.enter_amount'),
        status: false
      },
      isClear: false,
      poolCash: null,
      depositValue: '',
      withdrawValue: '',
      borrowLimitAfter: '',
      withdrawLimitAfter: ''
    };
  }
  componentDidMount = () => {
    this.startInterval();

    const { borrowLimit } = this.props.lend;
    const { popData } = this.props.lend.DAWPop;
    this.setState({
      borrowLimitAfter: borrowLimit,
      withdrawLimitAfter: borrowLimit
    });
  };

  componentWillUnmount() {
    clearInterval(this.timerInterval);
    this.timerInterval = null;
  }

  getCash = async () => {
    const { popData = {} } = this.props.lend.DAWPop;
    // console.log(popData);
    if (popData && popData.jtokenAddress) {
      const { balance = 0, success } = await getCash(popData.jtokenAddress);
      if (success) {
        this.state.poolCash = BigNumber(balance);
      }
    }
  };

  startInterval = async () => {
    if (!this.timerInterval) {
      await this.getCash();
      this.timerInterval = setInterval(async () => {
        await this.getCash();
      }, 3000);
    }
  };

  componentDidUpdate(prevProps, prevState) {
    if (!BigNumber(prevProps.lend.borrowLimit).eq(this.props.lend.borrowLimit)) {
      if (Number(this.props.lend.DAWPop.activeKey) === 1) {
        return this.depositChange(this.state.borrowValue);
      }
      if (Number(this.props.lend.DAWPop.activeKey) === 2) {
        return this.withdrawChange(this.state.withdrawValue);
      }
    }
  }

  clickMaxWithdraw = (popData = {}) => {
    const { deposited = 0, collateralDecimal } = popData;
    const withdrawValue = BigNumber(deposited)._toFixed(collateralDecimal, 1);
    try {
      this.setState(
        {
          withdrawValue
        },
        () => {
          this.withdrawChange(withdrawValue);
        }
      );
    } catch (err) {
      console.log('clickMaxWithdraw: ', err);
    }
  };

  clickSafeMax = popData => {
    try {
      const { borrowLimit, totalBorrowUsd, trxPrice, userList } = this.props.lend;
      const { precision, collateralFactor, assetPrice, collateralDecimal, jtokenAddress, deposited_usd = 0 } = popData;
      const withdrawBorrowUsd = BigNumber(borrowLimit).minus(
        BigNumber(deposited_usd).times(collateralFactor).div(Config.tokenDefaultPrecision)
      );
      if (!checkEnteredMarket(userList, jtokenAddress) || this.checkSafe(totalBorrowUsd, withdrawBorrowUsd)) {
        this.setState({
          isClear: true
        });
        return this.clickMaxWithdraw(popData);
      }
      const withdrawLimitAfter = BigNumber(totalBorrowUsd).div(Config.safeMaxRate);
      let withdrawValue = BigNumber(borrowLimit)
        .minus(withdrawLimitAfter)
        .times(Config.defaultPrecision)
        .div(trxPrice)
        .times(Config.tokenDefaultPrecision)
        .div(assetPrice)
        .times(Config.tokenDefaultPrecision)
        .div(collateralFactor)
        .times(Config.tokenDefaultPrecision)
        .div(precision);
      withdrawValue = withdrawValue.lt(0) ? 0 : withdrawValue._toFixed(collateralDecimal, 1);
      this.setState(
        {
          withdrawValue,
          withdrawLimitAfter
        },
        () => {
          this.withdrawChange(withdrawValue);
        }
      );
    } catch (err) {
      console.log('clickSafeMax: ', err);
    }
  };

  clickMax = () => {
    try {
      const { balanceInfo } = this.props.lend;
      const { popData } = this.props.lend.DAWPop;
      const { precision, collateralDecimal, jtokenAddress, collateralAddress } = popData;

      // const tokenBalance = BigNumber(balance).div(precision)._toFixed(collateralDecimal, 1);
      let tokenBalance = BigNumber(balanceInfo[jtokenAddress].balance).div(precision);
      if (collateralAddress === Config.zeroAddr) {
        tokenBalance = tokenBalance.minus(Config.trxLeft).lt(0)
          ? 0
          : tokenBalance.minus(Config.trxLeft)._toFixed(collateralDecimal, 1);
      } else {
        tokenBalance = tokenBalance._toFixed(collateralDecimal, 1);
      }
      this.setState(
        {
          depositValue: tokenBalance
        },
        () => {
          this.depositChange(tokenBalance);
        }
      );
    } catch (err) {
      console.log('clickMax:', err);
    }
  };

  checkSafe = (totalBorrowUsd, withdrawBorrowUsd) => {
    return (
      BigNumber(totalBorrowUsd).eq(0) ||
      (BigNumber(totalBorrowUsd).div(withdrawBorrowUsd).gte(0) &&
        BigNumber(totalBorrowUsd).div(withdrawBorrowUsd).lt(Config.safeMaxRate))
    );
  };

  getSafeMaxText = popData => {
    try {
      const { borrowLimit, totalBorrowUsd, userList } = this.props.lend;
      const { jtokenAddress, deposited_usd = 0, collateralFactor } = popData;
      const withdrawBorrowUsd = BigNumber(borrowLimit).minus(
        BigNumber(deposited_usd).times(collateralFactor).div(Config.tokenDefaultPrecision)
      );
      if (!checkEnteredMarket(userList, jtokenAddress) || this.checkSafe(totalBorrowUsd, withdrawBorrowUsd)) {
        return intl.get('deposit.max');
      }
      return intl.get('withdraw.safemax');
    } catch (err) {
      console.log('getSafeMaxText, ', err);
      return intl.get('withdraw.safemax');
    }
  };

  withDrawContent = popData => {
    const {
      withdrawValue,
      withdrawLimitAfter,
      isClear,
      errInfo2: { btnText, status }
    } = this.state;
    // console.log(withdrawLimitAfter.toNumber())
    const { borrowLimit, totalBorrowUsd, assetList } = this.props.lend;
    const per1 = getPercent(totalBorrowUsd, borrowLimit); //BigNumber(totalBorrowUsd).div(borrowLimit).times(100);
    const per2 = getPercent(totalBorrowUsd, withdrawLimitAfter, false); // BigNumber(totalBorrowUsd).div(withdrawLimitAfter).times(100)
    const safeMaxText = this.getSafeMaxText(popData);
    const status1 = withdrawValue != '' && (!BigNumber(borrowLimit).eq(0) || !BigNumber(withdrawLimitAfter).eq(0));
    const status2 = withdrawValue != '' && (BigNumber(per2).gt(0) || BigNumber(per1).gt(0));
    const disableStatus = BigNumber(per2).gt(100);
    const { totalApy } = getTotalApy(popData, assetList);
    return (
      <div className="deposit mt16">
        <Input
          prefix={isClear ? <span>~</span> : <span></span>}
          placeholder={intl.get('withdraw.enteramount')}
          size="small"
          addonAfter={
            <span
              className="pointer"
              onClick={() => {
                this.clickSafeMax(popData);
              }}
            >
              {safeMaxText}
            </span>
          }
          value={withdrawValue}
          onChange={e => this.withdrawChange(e.target.value, true)}
        />
        <p className="flex-between mb16" style={{ marginTop: 16 }}>
          <span className="c-84869E fs12">{intl.get('deposit.Loanlimit')}</span>
          <span className="c-0F134F fs14 fw700">
            <span className="c-84869E fw700">{formatNumber(borrowLimit, 2, { miniText: 0.01, needDolar: true })}</span>
            {status1 && popData.account_entered !== 0 && (
              <>
                <span className="arrow-right"></span>
                {formatNumber(withdrawLimitAfter, 2, { miniText: 0.01, needDolar: true })}
              </>
            )}
          </span>
        </p>
        <p className="flex-between">
          <span className="c-84869E fs12">{intl.get('deposit.limitused')}</span>
          <span className="c-0F134F fs14 fw700">
            <span className="c-84869E fw700">{renderPercent(per1)}</span>
            {status2 && popData.account_entered !== 0 && (
              <>
                <span className="arrow-right"></span>
                {renderPercent(per2)}
              </>
            )}
          </span>
        </p>
        <div className="modal-progress">
          {status2 && popData.account_entered !== 0
            ? renderProgress(per2, { showInfo: false, reverse: true })
            : renderProgress(per1, { showInfo: false, reverse: true })}
        </div>
        <div className="horizontal-line"></div>
        <p className="flex-between mb16">
          <span className="c-84869E fs12">{intl.get('withdraw.withdrawamount')}</span>
          <span className="c-0F134F fs14 fw700">
            {formatNumber(BigNumber(popData.deposited), 3)} {popData.collateralSymbol}
          </span>
        </p>
        <p className="flex-between mb16">
          <span className="c-84869E fs12">{intl.get('deposit.depositapy')}</span>
          <span className="c-0F134F fs14 fw700">{renderPercent(totalApy, { cutZero: false })}</span>
        </p>
        <Button
          className="modal-btn withdraw-btn"
          disabled={!status || (disableStatus && popData.account_entered !== 0)}
          onClick={this.withdraw}
        >
          {disableStatus && status2 && popData.account_entered !== 0
            ? intl.get('withdraw.Insufficient_mortgage')
            : btnText}
        </Button>
      </div>
    );
  };

  getBorrowLimitAfter = (depositValue = 0, isWithdraw) => {
    try {
      const { DAWPop, borrowLimit, trxPrice } = this.props.lend;
      const { popData } = DAWPop;
      const { precision, assetPrice } = popData;
      const collateralFactor = BigNumber(popData.collateralFactor).div(Config.tokenDefaultPrecision);
      const totalUsd = BigNumber(depositValue)
        .times(precision)
        .times(collateralFactor)
        .times(assetPrice)
        .times(trxPrice)
        .div(Config.tokenDefaultPrecision)
        .div(Config.tokenDefaultPrecision)
        .div(Config.defaultPrecision);
      return isWithdraw
        ? borrowLimit.minus(totalUsd).lt(0)
          ? BigNumber(0)
          : borrowLimit.minus(totalUsd)
        : borrowLimit.plus(
          BigNumber(depositValue)
            .times(precision)
            .times(collateralFactor)
            .times(assetPrice)
            .times(trxPrice)
            .div(Config.tokenDefaultPrecision)
            .div(Config.tokenDefaultPrecision)
            .div(Config.defaultPrecision)
        );
    } catch (err) {
      console.log(`getBorrowLimitAfter error: ${err}`);
    }
  };

  depositContent = popData => {
    const { userList, marketList, balanceInfo, borrowLimit, totalBorrowUsd, assetList } = this.props.lend;

    const {
      depositValue,
      borrowLimitAfter,
      errInfo1: { btnText, status },
      lang
    } = this.state;

    // console.log(totalBorrowUsd, borrowLimit, BigNumber(totalBorrowUsd).div(borrowLimit).times(100));
    const per1 = getPercent(totalBorrowUsd, borrowLimit); //BigNumber(totalBorrowUsd).div(borrowLimit).times(100);
    const per2 = getPercent(totalBorrowUsd, borrowLimitAfter); // BigNumber(totalBorrowUsd).div(borrowLimitAfter).times(100);
    const status1 = depositValue != '' && (!BigNumber(borrowLimit).eq(0) || !BigNumber(borrowLimitAfter).eq(0));
    const status2 = depositValue != '' && (BigNumber(per2).gt(0) || BigNumber(per1).gt(0));
    const { totalApy } = getTotalApy(popData, assetList);

    return (
      <div className="deposit mt16">
        <Input
          className="mb16"
          placeholder={intl.get('deposit.enteramount')}
          addonAfter={
            <span
              className="pointer"
              onClick={() => {
                this.clickMax();
              }}
            >
              {intl.get('deposit.max')}
            </span>
          }
          value={depositValue}
          onChange={e => this.depositChange(e.target.value)}
        />
        <p className="flex-between mb16">
          <span className="c-84869E fs12">{intl.get('deposit.Loanlimit')}</span>
          <span className="c-0F134F fs14 fw700">
            <span className="c-84869E fw700">{formatNumber(borrowLimit, 2, { miniText: 0.01, needDolar: true })}</span>
            {status1 && popData.account_entered !== 0 && (
              <>
                <span className="arrow-right"></span>

                {formatNumber(borrowLimitAfter, 2, { miniText: 0.01, needDolar: true })}
              </>
            )}
          </span>
        </p>
        <div className="flex-between">
          <span className="c-84869E fs12">{intl.get('deposit.limitused')}</span>
          <span className="c-0F134F fs14 fw700">
            <span className="c-84869E fw700">{renderPercent(per1)}</span>
            {status2 && popData.account_entered !== 0 && (
              <>
                <span className="arrow-right"></span>
                {renderPercent(per2)}
              </>
            )}
          </span>
        </div>
        <div className="modal-progress">{renderProgress(per2, { showInfo: false, reverse: true })}</div>
        <div className="horizontal-line"></div>

        <p className="flex-between mb16">
          <span className="c-84869E fs12">{intl.get('deposit.deposited')}</span>
          <span className="c-0F134F fs14 fw700">
            {formatNumber(BigNumber(popData.deposited), 3)} {popData.collateralSymbol}
          </span>
        </p>
        <p className="flex-between mb16">
          <span className="c-84869E fs12">{intl.get('deposit.wallet_balance')}</span>
          <span className="c-0F134F fs14 fw700">
            {renderBalance(popData, balanceInfo, 3)}
            <a
              className="toSwap"
              href={`${Config.sunSwap}?lang=${lang}${popData.collateralSymbol === 'TRX' ? '' : `?tokenAddress=${popData.collateralAddress}&type=swap`
                }`}
              target="sunswap"
            >
              {intl.get('index.get')}
            </a>
          </span>
        </p>
        <p className="flex-between mb16">
          <span className="c-84869E fs12">{intl.get('deposit.depositapy')}</span>
          <span className="c-0F134F fs14 fw700">{renderPercent(totalApy, { cutZero: false })}</span>
        </p>
        <Button className="modal-btn deposit-btn" onClick={() => this.deposit()} disabled={!status}>
          {btnText}
        </Button>
      </div>
    );
  };

  deposit = async () => {
    const { depositValue } = this.state;
    const { DAWPop } = this.props.lend;
    const { popData } = DAWPop;

    const intlObj = {
      title: 'toast.ex',
      title2: 'deposit.transactionsent',
      title3: 'toast.ex_failed',
      title4: 'deposit.confirm_transaction',
      obj: {
        value: depositValue,
        token: popData.collateralSymbol || ''
      }
    };
    this.setState({ isSuccess: false, txID: '' });
    const txID = await this.props.system.justMint(
      popData,
      new BigNumber(depositValue).times(popData.precision)._toHex(),
      intlObj
    );
  };

  withdraw = async () => {
    const { withdrawValue, isClear } = this.state;
    const { popData } = this.props.lend.DAWPop;
    const { jtokenAddress } = popData;
    const intlObj = {
      title: 'toast.ex',
      title2: 'deposit.transactionsent',
      title3: 'toast.ex_failed',
      title4: 'deposit.confirm_transaction',
      obj: {
        value: withdrawValue,
        token: popData.collateralSymbol
      }
    };

    if (isClear) {
      const { value } = await getTRC20Balance(jtokenAddress, window.defaultAccount);
      return await this.props.system.justRedeem(popData, new BigNumber(value)._toHex(), intlObj, true);
    }
    const txID = await this.props.system.justRedeem(
      popData,
      new BigNumber(withdrawValue).times(popData.precision)._toHex(),
      intlObj
    );
  };

  approveContent = popData => {
    const { balanceInfo, assetList } = this.props.lend;
    const { lang, approving } = this.state;
    const { totalApy } = getTotalApy(popData, assetList);

    return (
      <div className="deposit">
        <img
          src={shield}
          alt="Token Logo"
          onError={e => {
            e.target.onerror = null;
            e.target.src = defaultIcon;
          }}
        />
        <div className="approve-tip">{intl.getHTML('deposit.explanation1', { value: popData.collateralSymbol })}</div>
        <div className="horizontal-line"></div>
        <p className="flex-between mb16">
          <span className="c-84869E fs12">{intl.get('deposit.wallet_balance')}</span>
          <span className="c-0F134F fs14 fw700">
            {renderBalance(popData, balanceInfo, 3)}
            <a
              className="toSwap"
              href={`${Config.sunSwap}?lang=${lang}${popData.collateralSymbol === 'TRX' ? '' : `?tokenAddress=${popData.collateralAddress}&type=swap`
                }`}
              target="sunswap"
            >
              {intl.get('index.get')}
            </a>
          </span>
        </p>
        <p className="flex-between mb16">
          <span className="c-84869E fs12">{intl.get('deposit.depositapy')}</span>
          <span className="c-0F134F fs14 fw700">{renderPercent(totalApy, { cutZero: false })}</span>
        </p>
        {approving ? (
          <button className="modal-btn deposit-btn" disabled>
            <div className="points">
              <span className="point"></span>
              <span className="point"></span>
              <span className="point"></span>
            </div>
          </button>
        ) : (
          <button
            className="modal-btn deposit-btn"
            onClick={() => {
              this.setState({
                approving: true
              });
              this.props.system.approveToken(popData);
            }}
          >
            {intl.get('deposit.approve', { value: popData.collateralSymbol })}
          </button>
        )}
      </div>
    );
  };

  distribute = type => {
    const { DAWPop, balanceInfo = {}, userList, marketList } = this.props.lend;
    let { popData } = DAWPop;
    const { jtokenAddress, collateralAddress } = popData;
    popData = userList[jtokenAddress] || marketList[jtokenAddress];
    const approved = (balanceInfo[jtokenAddress] && BigNumber(balanceInfo[jtokenAddress].allowance).gt(0)) || false;
    // console.log(approved, collateralAddress, BigNumber(balanceInfo[jtokenAddress].allowance).gt(0), '1234');
    if (popData && jtokenAddress && balanceInfo[jtokenAddress]) {
      return type === 1
        ? collateralAddress === Config.zeroAddr || approved
          ? this.depositContent(popData)
          : this.approveContent(popData)
        : this.withDrawContent(popData);
    }
    return <></>;
  };

  withdrawChange = async (inputValue, fromInput = false) => {
    try {
      const { DAWPop, balanceInfo, userList, marketList } = this.props.lend;
      let { popData = {} } = DAWPop;
      const { jtokenAddress } = popData;
      popData = userList[jtokenAddress] || marketList[jtokenAddress];
      const { deposited = 0 } = popData;
      const { valid, str } = numberParser(inputValue, popData.collateralDecimal);
      if (valid) {
        let status = this.state.errInfo2.status;
        let btnText = this.state.errInfo2.btnText;
        let isClear = this.state.isClear;
        this.setState({
          isClear: fromInput ? false : isClear,
          withdrawValue: inputValue,
          withdrawLimitAfter:
            str === '' || !checkEnteredMarket(userList, jtokenAddress) ? 0 : this.getBorrowLimitAfter(str, true)
        });
        const value = BigNumber(str);
        if (gtBalance(value, deposited)) {
          status = false;
          btnText = intl.get('withdraw.Insufficient_withdrawamount');
        } else if (value.isNaN() || value.eq(0)) {
          status = false;
          btnText = intl.get('withdraw.enter_amount');
        } else if (this.timerInterval != null && value.times(popData.precision).gt(this.state.poolCash)) {
          status = false;
          btnText = intl.get('insufficient_tips');
        } else {
          status = true;
          btnText = intl.get('deposit.withdraw');
        }
        this.setState({
          errInfo2: {
            status,
            btnText
          }
        });
      }
    } catch (error) { }
  };

  depositChange = inputValue => {
    try {
      const { DAWPop, balanceInfo, userList } = this.props.lend;
      const { popData = {} } = DAWPop;
      const { jtokenAddress, precision } = popData;
      const { balance } = balanceInfo[jtokenAddress] || {};
      const { valid, str } = numberParser(inputValue, popData.collateralDecimal);

      if (valid) {
        let status = this.state.errInfo1.status;
        let btnText = this.state.errInfo1.btnText;

        this.setState({
          depositValue: str,
          borrowLimitAfter:
            str === '' || !checkEnteredMarket(userList, jtokenAddress)
              ? this.props.lend.borrowLimit
              : this.getBorrowLimitAfter(str)
        });
        const value = BigNumber(str);
        if (gtBalance(value, balance, precision)) {
          status = false;
          btnText = intl.get('deposit.amountout');
        } else if (value.isNaN() || value.eq(0)) {
          status = false;
          btnText = intl.get('deposit.enteramount2');
        } else {
          status = true;
          btnText = intl.get('deposit.deposit');
        }
        this.setState({
          errInfo1: {
            status,
            btnText
          }
        });
      }
    } catch (error) { }
  };

  changeTab = activeKey => {
    activeKey == 1 ? this.withdrawChange('', true) : this.depositChange('', true);
    const { DAWPop } = this.props.lend;
    const { popData } = DAWPop;
    this.props.lend.setData({
      DAWPop: {
        show: true,
        activeKey,
        popData
      }
    });
  };

  getDepositStatus = popData => {
    try {
      const { userList } = this.props.lend;
      const { jtokenAddress } = popData;
      const { borrowBalanceNew = 0 } = userList[jtokenAddress] || {};
      // console.log(BigNumber(borrowBalanceNew).gt(0));
      return BigNumber(borrowBalanceNew).gt(0);
    } catch (err) {
      return false;
    }
  };

  render() {
    const { DAWPop } = this.props.lend;
    const { popData = {} } = DAWPop;
    const { collateralSymbol, logoUrl } = popData;
    return (
      <Modal
        title={
          <div>
            <img src={logoUrl} />
            {collateralSymbol || ''}
          </div>
        }
        maskClosable={false}
        visible={DAWPop.show}
        closable={true}
        onCancel={() => this.props.lend.hideDAWPop()}
        footer={null}
        className="DAWPop"
        getContainer={() => document.querySelector('.main')}
      >
        <Tabs
          className="tabs-deposit"
          defaultActiveKey={DAWPop.activeKey}
          activeKey={DAWPop.activeKey}
          centered
          type="card"
          onChange={this.changeTab}
        >
          <TabPane tab={intl.get('deposit.deposit')} key="1">
            {this.distribute(1)}
          </TabPane>
          <TabPane tab={intl.get('deposit.withdraw')} key="2">
            {this.distribute(2)}
          </TabPane>
        </Tabs>
      </Modal>
    );
  }
}

export default depositeAndWithdraw;
