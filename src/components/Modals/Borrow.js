import React from 'react';
import isMobile from 'ismobilejs';
import { inject, observer } from 'mobx-react';
import {
  formatNumber,
  BigNumber,
  renderBalance,
  numberParser,
  gtBalance,
  renderPercent,
  renderProgress,
  getPercent,
  checkCash,
  getTotalApy
} from '../../utils/helper';
import { Modal, Tabs, Input, Button, Progress } from 'antd';
import intl from 'react-intl-universal';
import '../../assets/css/modal.scss';
import defaultIcon from '../../assets/images/default.svg';
import homeAuthodizeLogo from '../../assets/images/homeAuthodizeLogo.svg';
import { getCash, MAX_UINT256 } from '../../utils/blockchain';
const { TabPane } = Tabs;

import Config from '../../config';

@inject('network')
@inject('lend')
@inject('system')
@observer
class Borrow extends React.Component {
  constructor() {
    super();
    this.timerInterval = null;
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      borrowValue: '', // borrow input value
      repayValue: '', // repay input value
      errInfo1: {
        btnText: intl.get('borrow.enter_amount'),
        status: false
      },
      errInfo2: {
        btnText: intl.get('repay.enter_amount'),
        status: false
      },
      isClear: false,
      poolCash: null,
      totalBorrowUsdAfter: '',
      totalRepayUsdAfter: '',
      totalRepayAfter: ''
    };
  }

  componentDidMount = () => {
    this.startInterval();

    const { totalBorrowUsd } = this.props.lend;
    this.setState({
      totalBorrowUsdAfter: totalBorrowUsd,
      totalRepayUsdAfter: totalBorrowUsd
    });
  };

  componentWillUnmount() {
    clearInterval(this.timerInterval);
    this.timerInterval = null;
  }

  getCash = async () => {
    try {
      const { borrowModalInfo, userList, marketList } = this.props.lend;
      const { jtokenAddress } = borrowModalInfo;
      if (jtokenAddress) {
        const { balance = 0, success } = await getCash(jtokenAddress);
        if (success) {
          console.log();
          this.state.poolCash = BigNumber(balance);
        }
      }
    } catch (err) {
      console.log(err);
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
      if (Number(this.props.lend.borrowModalInfo.type) === 1) {
        return this.onChangeBorrow(this.state.borrowValue);
      }
      if (Number(this.props.lend.borrowModalInfo.type) === 2) {
        return this.onChangeRepay(this.state.repayValue);
      }
    }
  }

  clickSafeMax = popData => {
    // BigNumber(totalBorrowUsdAfter).div(borrowLimit) = 0.8
    try {
      const { borrowLimit, totalBorrowUsd, trxPrice } = this.props.lend;
      const totalBorrowUsdAfter = BigNumber(borrowLimit).times(Config.safeMaxRate);
      const { precision, collateralFactor, assetPrice, collateralDecimal } = popData;
      let borrowValue = totalBorrowUsdAfter
        .minus(totalBorrowUsd)
        .times(Config.tokenDefaultPrecision)
        .div(assetPrice)
        .times(Config.tokenDefaultPrecision)
        .div(trxPrice)
        .times(Config.defaultPrecision)
        .div(precision);
      borrowValue = borrowValue.lt(0) ? 0 : borrowValue._toFixed(collateralDecimal, 1);
      this.setState(
        {
          borrowValue,
          totalBorrowUsdAfter
        },
        () => {
          this.onChangeBorrow(borrowValue);
        }
      );
    } catch (err) {
      console.log('clickSafeMax: ', err);
    }
  };

  onChangeBorrow = async inputValue => {
    try {
      const { borrowModalInfo, userList, marketList, totalBorrowUsd, borrowLimit } = this.props.lend;
      const { jtokenAddress } = borrowModalInfo;
      const popData = userList[jtokenAddress] || marketList[jtokenAddress];
      const { valid, str } = numberParser(inputValue, popData.collateralDecimal);
      if (valid) {
        const totalBorrowUsdAfter = str === '' ? totalBorrowUsd : this.getTotalBorrowUsdAfter(str);
        this.setState({
          borrowValue: str,
          totalBorrowUsdAfter
        });
        let status = this.state.errInfo1.status;
        let btnText = this.state.errInfo1.btnText;

        const value = BigNumber(str);

        if (value.isNaN() || value.eq(0)) {
          status = false;
          btnText = intl.get('borrow.enter_amount');
        } else if (BigNumber(totalBorrowUsdAfter).div(borrowLimit).gte(1)) {
          status = false;
          btnText = intl.get('borrow.Insufficient_mortgage');
        } else if (this.timerInterval != null && value.times(popData.precision).gt(this.state.poolCash)) {
          status = false;
          btnText = intl.get('insufficient_tips');
        } else {
          status = true;
          btnText = intl.get('borrow.borrow');
        }
        this.setState({
          errInfo1: {
            status,
            btnText
          }
        });
      }
    } catch (err) {
      console.log('onChangeBorrow ', err);
    }
  };

  getUsd = (value, trxPrice, item, isRepay) => {
    let { precision, assetPrice, collateralFactor } = item;
    collateralFactor = BigNumber(item.collateralFactor).div(Config.tokenDefaultPrecision);
    return isRepay
      ? BigNumber(value)
        .times(precision)
        .times(assetPrice)
        .times(trxPrice)
        .div(Config.tokenDefaultPrecision)
        .div(Config.tokenDefaultPrecision)
        .div(Config.defaultPrecision)
      : BigNumber(value)
        .times(precision)
        .times(collateralFactor)
        .times(assetPrice)
        .times(trxPrice)
        .div(Config.tokenDefaultPrecision)
        .div(Config.tokenDefaultPrecision)
        .div(Config.defaultPrecision);
  };

  getTotalBorrowUsdAfter = (value = 0, isRepay) => {
    try {
      const { borrowModalInfo, userList, marketList, totalBorrowUsd, trxPrice } = this.props.lend;
      const { jtokenAddress } = borrowModalInfo;
      const item = userList[jtokenAddress] || marketList[jtokenAddress];
      // const { precision, assetPrice } = item;
      // const collateralFactor = BigNumber(item.collateralFactor).div(Config.tokenDefaultPrecision);
      const totalusd = this.getUsd(value, trxPrice, item, true);
      return isRepay ? BigNumber(totalBorrowUsd).minus(totalusd) : BigNumber(totalBorrowUsd).plus(totalusd);
    } catch (err) {
      console.log('getTotalBorrowUsdAfter ', err);
    }
  };

  onChangeRepay = (inputValue, fromInput = false) => {
    try {
      const { borrowModalInfo, userList, marketList, totalBorrowUsd, balanceInfo } = this.props.lend;
      const { jtokenAddress } = borrowModalInfo;
      const popData = userList[jtokenAddress] || marketList[jtokenAddress];
      const { precision, collateralSymbol = '', borrowBalanceNew = 0, collateralDecimal } = popData;
      const { valid, str } = numberParser(inputValue, popData.collateralDecimal);
      if (valid) {
        const isClear = this.state.isClear;
        const totalRepayUsdAfter = str === '' ? totalBorrowUsd : this.getTotalBorrowUsdAfter(str, true);
        this.setState({
          isClear: fromInput ? false : isClear,
          repayValue: str,
          totalRepayUsdAfter
        });
        const borrowBalanceNewValue = BigNumber(borrowBalanceNew).div(precision);
        const { balance } = balanceInfo[jtokenAddress] || {};
        const value = BigNumber(str);
        let status = this.state.errInfo2.status;
        let btnText = this.state.errInfo2.btnText;
        if (BigNumber(borrowBalanceNewValue).lte(0)) {
          status = false;
          btnText = intl.get('repay.no_debt');
        } else if (value.isNaN() || value.eq(0)) {
          status = false;
          btnText = intl.get('repay.enter_amount');
        } else if (value.gt(borrowBalanceNewValue)) {
          status = false;
          btnText = intl.get('repay.exceeded_amount_borrowed');
        } else if (gtBalance(value, balance, precision)) {
          status = false;
          btnText = intl.get('repay.Insufficient_wallet_balance');
        } else {
          status = true;
          btnText = intl.get('repay.repay');
        }
        this.setState({
          errInfo2: {
            status,
            btnText
          }
        });
      }
    } catch (err) {
      console.log('onChangeRepay ', err);
    }
  };

  toBorrow = async () => {
    const { borrowValue } = this.state;
    const { jtokenAddress } = this.props.lend.borrowModalInfo;
    const { marketList } = this.props.lend;
    const popData = marketList[jtokenAddress];

    if (!this.props.lend.collateralValid(popData.collateralSymbol)) return;

    // console.log(popData);
    const intlObj = {
      title: 'toast.ex',
      title2: 'deposit.transactionsent',
      title3: 'toast.ex_failed',
      title4: 'deposit.confirm_transaction',
      obj: {
        value: borrowValue,
        token: popData.collateralSymbol
      }
    };
    const txID = await this.props.system.borrow(
      popData,
      new BigNumber(borrowValue).times(popData.precision)._toHex(),
      intlObj
    );
  };

  renderBorrow = () => {
    const { totalBorrowUsd, borrowLimit, borrowModalInfo, userList, marketList } = this.props.lend;
    const {
      totalBorrowUsdAfter,
      borrowValue,
      errInfo1: { status, btnText }
    } = this.state;

    const { jtokenAddress } = borrowModalInfo;
    const popData = userList[jtokenAddress] || marketList[jtokenAddress];
    const { precision, collateralSymbol = '', borrowBalanceNew } = popData;
    const borrowBalanceNewValue = borrowBalanceNew ? borrowBalanceNew.div(precision) : BigNumber(0);
    const per1 = getPercent(totalBorrowUsd, borrowLimit); //BigNumber(totalBorrowUsd).div(borrowLimit).times(100);
    const per2 = getPercent(totalBorrowUsdAfter, borrowLimit); //BigNumber(totalBorrowUsdAfter).div(borrowLimit).times(100);
    const status1 = borrowValue != '' && (!BigNumber(totalBorrowUsd).eq(0) || !BigNumber(totalBorrowUsdAfter).eq(0));
    const status2 = borrowValue != '' && (!BigNumber(per1).eq(0) || !BigNumber(per2).eq(0));
    return (
      <div className="mt16">
        <div style={{ marginBottom: 16 }}>
          <Input
            onChange={e => this.onChangeBorrow(e.target.value)}
            addonAfter={
              <span
                className="pointer"
                onClick={() => {
                  this.clickSafeMax(popData);
                }}
              >
                {intl.get('withdraw.safemax')}
              </span>
            }
            value={borrowValue}
            placeholder={intl.get('borrow.enter_amount')}
          />
        </div>
        <div>
          <div className="flex-between mb16">
            <span className="c-84869E fs12">{intl.get('borrow.total_borrowing')}</span>
            <span className="c-0F134F fs14 fw700">
              <span className="c-84869E fw700">
                {formatNumber(totalBorrowUsd, 2, { miniText: 0.01, needDolar: true })}
              </span>
              {status1 && (
                <>
                  <span className="arrow-right"></span>
                  {formatNumber(totalBorrowUsdAfter, 2, { miniText: 0.01, needDolar: true })}
                </>
              )}
            </span>
          </div>
          <div className="flex-between">
            <span className="c-84869E fs12">{intl.get('borrow.limitused')}</span>
            <span className="c-0F134F fs14 fw700">
              <span className="c-84869E fw700">{renderPercent(per1, { keep0: true })}</span>
              {status2 && (
                <>
                  <span className="arrow-right"></span>
                  {renderPercent(per2, { keep0: true })}
                </>
              )}
            </span>
          </div>
          <div className="modal-progress">
            {renderProgress(per2, {
              showInfo: false,
              reverse: true
            })}
          </div>
          <div className="horizontal-line"></div>
        </div>
        <div>
          <div className="flex-between mb16">
            <span className="c-84869E fs12">{intl.get('index.markets_borrowapy')}</span>
            <span className="c-0F134F fs14 fw700">{renderPercent(popData.lendApy, { cutZero: false })}</span>
          </div>
          <div className="flex-between mb16">
            <span className="c-84869E fs12">{intl.get('borrow.borrowed', { value: collateralSymbol })}</span>
            <span className="c-0F134F fs14 fw700">
              {formatNumber(borrowBalanceNewValue, 3, { miniText: '0.001', round: true })} {collateralSymbol}
            </span>
          </div>
        </div>
        <div>
          <div className="borrow-tip">
            <span>!</span>
            {intl.get('borrow.tip')}
          </div>
          <Button className="modal-btn lend-btn" type="primary" disabled={!status} onClick={() => this.toBorrow()}>
            {btnText}
          </Button>
        </div>
      </div>
    );
  };

  clickMax = (borrowBalanceNewValue, collateralDecimal) => {
    const repayValue = borrowBalanceNewValue._toFixed(collateralDecimal, 1);
    this.setState(
      {
        isClear: true,
        repayValue
      },
      () => {
        this.onChangeRepay(repayValue);
      }
    );
  };

  approveContent = popData => {
    const { balanceInfo, assetList } = this.props.lend;
    const { lang } = this.state;
    const { totalApy } = getTotalApy(popData, assetList);

    return (
      <div className="deposit">
        <img
          // src={popData.tokenLogoUrl}
          src={homeAuthodizeLogo}
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
        <Button
          className="modal-btn deposit-btn"
          onClick={() => {
            this.props.system.approveToken(popData);
          }}
        >
          {intl.get('deposit.approve', { value: popData.collateralSymbol })}
        </Button>
      </div>
    );
  };

  renderRepay = () => {
    const {
      totalBorrowUsdAfter,
      repayValue,
      totalRepayUsdAfter,
      errInfo2: { status, btnText },
      isClear,
      lang
    } = this.state;
    const { borrowLimit, totalBorrowUsd, balanceInfo, userLendDataSource } = this.props.lend;

    const { userList, marketList } = this.props.lend;
    const { jtokenAddress } = this.props.lend.borrowModalInfo;
    const popData = userList[jtokenAddress] || marketList[jtokenAddress];
    const { precision, collateralSymbol = '', borrowBalanceNew, collateralDecimal } = popData;
    // console.log(borrowBalanceNew, 'fdgwdegf');
    const borrowBalanceNewValue = borrowBalanceNew ? borrowBalanceNew.div(precision) : BigNumber(0);
    // console.log(borrowBalanceNewValue, 'lllllll');
    const per1 = getPercent(totalBorrowUsd, borrowLimit); //BigNumber(totalBorrowUsd).div(borrowLimit).times(100);
    const isMax = userLendDataSource && userLendDataSource.length === 1 && isClear;
    const per2 = isMax ? 0 : getPercent(totalRepayUsdAfter, borrowLimit); //BigNumber(totalRepayUsdAfter).div(borrowLimit).times(100);
    const status1 = repayValue != '' && (!BigNumber(totalBorrowUsd).eq(0) || !BigNumber(borrowBalanceNewValue).eq(0));
    const status2 = repayValue != '' && (!BigNumber(per1).eq(0) || !BigNumber(per2).eq(0));
    return (
      <div>
        <div className="mt16">
          <Input
            prefix={isClear ? <span>~</span> : <span></span>}
            size="small"
            onChange={e => this.onChangeRepay(e.target.value, true)}
            addonAfter={
              <span
                className="pointer"
                onClick={() => {
                  this.clickMax(borrowBalanceNewValue, collateralDecimal);
                }}
              >
                {intl.get('deposit.max')}
              </span>
            }
            value={repayValue}
            placeholder={intl.get('repay.enter_amount')}
          />
        </div>
        <div style={{ marginTop: 16 }}>
          <div className="flex-between mb16">
            <span className="c-84869E fs12">{intl.get('borrow.borrowed', { value: collateralSymbol })}</span>
            <span className="c-0F134F fs14 fw700">
              {formatNumber(borrowBalanceNewValue, 3, { miniText: '0.001', round: true })} {collateralSymbol}
            </span>
          </div>
          <div className="flex-between mb16">
            <span className="c-84869E fs12">{intl.get('repay.borrowed_amount')}</span>
            <span className="c-0F134F fs14 fw700">
              <span className="c-84869E fw700">
                {formatNumber(totalBorrowUsd, 2, { miniText: 0.01, needDolar: true })}
              </span>
              {status1 && (
                <>
                  <span className="arrow-right"></span>
                  {formatNumber(isMax ? 0 : totalRepayUsdAfter, 2, { miniText: 0.01, needDolar: true })}
                </>
              )}
            </span>
          </div>
          <div>
            <div className="flex-between">
              <span className="c-84869E fs12">{intl.get('borrow.limitused')}</span>
              <span className="c-0F134F fs14 fw700">
                <span className="c-84869E fw700">{renderPercent(per1, { keep0: true })}</span>
                {status2 && (
                  <>
                    <span className="arrow-right"></span>

                    {renderPercent(per2, { keep0: true })}
                  </>
                )}
              </span>
            </div>
            <div className="modal-progress">
              {renderProgress(per2, {
                showInfo: false,
                reverse: true
              })}
            </div>
            <div className="horizontal-line"></div>
            <div className="flex-between mb16">
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
            </div>
          </div>

          <div>
            <Button
              className="modal-btn repay-btn"
              type="primary"
              disabled={!status}
              onClick={() => this.repayBorrow()}
            >
              {btnText}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  repayBorrow = async () => {
    const { marketList, userList } = this.props.lend;
    const { jtokenAddress } = this.props.lend.borrowModalInfo;
    const { repayValue, isClear } = this.state;
    const item = marketList[jtokenAddress] || userList[jtokenAddress];
    const { borrowratePerblock, precision, collateralDecimal } = item;
    const intlObj = {
      title: 'toast.ex',
      title2: 'deposit.transactionsent',
      title3: 'toast.ex_failed',
      title4: 'deposit.confirm_transaction',
      obj: {
        value: repayValue,
        token: item.collateralSymbol
      }
    };
    let amount = 0;
    let trxAmount = 0;
    if (isClear) {
      amount = MAX_UINT256;
      if (item.collateralAddress === Config.zeroAddr) {
        trxAmount = BigNumber(
          BigNumber(Config.tokenDefaultPrecision)
            .plus(BigNumber(borrowratePerblock).times(20))
            .times(repayValue)
            .div(Config.tokenDefaultPrecision)
            ._toFixed(collateralDecimal, 1)
        )
          .times(precision)
          ._toHex();
      }
    } else {
      amount = BigNumber(repayValue).times(precision)._toHex();
    }

    await this.props.system.repayBorrow(item, amount, intlObj, trxAmount, isClear);
  };

  changeTab = value => {
    const { jtokenAddress } = this.props.lend.borrowModalInfo;
    this.props.lend.setData({
      borrowModalInfo: {
        type: value,
        visible: true,
        jtokenAddress
      }
    });
    if (Number(value) === 1) {
      this.onChangeRepay('', true);
      return;
    }
    this.onChangeBorrow('', true);
  };

  renderContent = type => {
    const { borrowModalInfo, balanceInfo = {}, marketList, userList } = this.props.lend;
    const { jtokenAddress } = borrowModalInfo;
    const popData = marketList[jtokenAddress] || userList[jtokenAddress];
    const { collateralAddress } = popData;
    const approved = (balanceInfo[jtokenAddress] && BigNumber(balanceInfo[jtokenAddress].allowance).gt(0)) || false;
    // console.log(approved, collateralAddress, BigNumber(balanceInfo[jtokenAddress].allowance).gt(0), '1234');
    if (type === 1) {
      return this.renderBorrow();
    }
    if (popData && jtokenAddress && balanceInfo[jtokenAddress]) {
      return collateralAddress === Config.zeroAddr || approved
        ? type === 1
          ? this.renderBorrow()
          : this.renderRepay()
        : this.approveContent(popData);
    }
    return <></>;
  };

  render() {
    const { borrowModalInfo, marketList, userList } = this.props.lend;
    const { jtokenAddress, type, visible } = borrowModalInfo;
    const popData = marketList[jtokenAddress] || userList[jtokenAddress];
    const { collateralSymbol, logoUrl } = popData || {};
    return (
      <Modal
        title={
          <div>
            <img src={logoUrl} />
            {collateralSymbol || ''}
          </div>
        }
        maskClosable={false}
        visible={visible}
        closable={true}
        onCancel={() => this.props.lend.hideBorrowModal()}
        footer={null}
        className="borrow-modal"
        getContainer={() => document.querySelector('.main')}
      >
        {!!popData && (
          <Tabs
            className="tabs-lend"
            defaultActiveKey={type}
            activeKey={type}
            centered
            type="card"
            onChange={this.changeTab}
          >
            <TabPane className="tab-lend" tab={intl.get('borrow.borrow')} key="1">
              {this.renderContent(1)}
            </TabPane>
            <TabPane className="tab-repay" tab={intl.get('repay.repay')} key="2">
              {this.renderContent(2)}
            </TabPane>
          </Tabs>
        )}
      </Modal>
    );
  }
}

export default Borrow;
