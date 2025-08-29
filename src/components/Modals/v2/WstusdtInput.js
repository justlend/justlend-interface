import React from 'react';
import isMobile from 'ismobilejs';
import { inject, observer } from 'mobx-react';
import {
  BigNumber,
  formatNumber,
  numberParser,
  gtBalance,
  renderBalance,
  addThousandSeparators,
  removeThousandSeparators
} from '../../../utils/helper';
import { getBalanceStUsdtInfo, getWrapRate } from '../../../utils/blockchain';
import { Modal, Input, Tooltip } from 'antd';
import intl from 'react-intl-universal';
import Config from '../../../config';
import WstusdtImg from '../../../assets/images/wst/wstusdt.svg';
import StusdtImg from '../../../assets/images/wst/stusdt.svg';
import StusdtImgWhite from '../../../assets/images/wst/white-theme/stusdt.svg';
import UsdtImg from '../../../assets/images/wst/usdt.svg';
import '../../../assets/css/v2/wstusdt/modal.scss';

const tokenUnit = {
  'usdt': 'USDT',
  'stusdt': 'stUSDT',
  'wstusdt': 'wstUSDT'
};

@inject('network')
@inject('lend')
@inject('system')
@observer
class WstusdtInput extends React.Component {
  constructor(props) {
    super();
    this.interval = null;
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      open: false,
      inputValue: '',
      token: 'wstusdt',
      wrapRate: '',
      depositValue: '--',
      repayValue: '--',
      btnText: '',
      mobile: isMobile(window.navigator).any
    };
    this.handleClick = this.handleClick.bind(this);
  }

  componentDidMount = () => {
    document.addEventListener('click', this.handleClick, true);
    this.startInterval();
    this.getWrapRate();
  };

  handleClick(e) {
    let className = Array.prototype.slice.call(e.target.classList);
    if (!className.includes('token-select')) {
      this.setState({ open: false });
    }
  }

  startInterval = async () => {
    if (!this.interval) {
      await this.props.lend.getWstUSDTBalanceInfo(
        this.props.network.defaultAccount,
        [Config['usdt'].token, Config['stusdt'].token, Config['wstusdt'].token],
        [Config.SwapRouter, Config.SwapRouter, Config.SwapRouter]
      );
      this.interval = setInterval(async () => {
        //todo
        await this.props.lend.getWstUSDTBalanceInfo(
          this.props.network.defaultAccount,
          [Config['usdt'].token, Config['stusdt'].token, Config['wstusdt'].token],
          [Config.SwapRouter, Config.SwapRouter, Config.SwapRouter]
        );
      }, 60000);
    }
  };

  componentWillUnmount() {
    clearInterval(this.interval);
    this.interval = null;

    document.removeEventListener('click', this.handleClick);
  }

  depositWstUSDTChange = (inputValue, token = this.state.token) => {
    try {
      const { wstUSDTbalanceInfo, minStakeAmount } = this.props.lend;
      const { wrapRate } = this.state;
      const { valid, str } = numberParser(inputValue, Config[token].decimal);

      if (valid) {
        let status = '';
        let btnText = '';

        // console.log(valid, str);

        this.setState({
          inputValue: str
          //borrowLimitAfter: str === '' ? this.props.lend.borrowLimit : this.getBorrowLimitAfter(str)
        });
        let depositValue = str;

        if (token !== 'wstusdt') {
          depositValue = BigNumber(BigNumber(str).times(wrapRate))._toFixed(Config[token].decimal, 1);
          if (BigNumber(depositValue).isNaN()) {
            depositValue = '';
          }
        }

        const value = BigNumber(str);

        if (BigNumber(inputValue).lt(minStakeAmount) && token === 'usdt') {
          status = false;
          btnText = intl.get('wst.wst_error_deposit_wst_at_least1') + ' ' + formatNumber(minStakeAmount, 0) + ' USDT';
        } else if (gtBalance(value, wstUSDTbalanceInfo[Config[token].token]?.balance, Config[token].precision)) {
          status = false;
          btnText = intl.get('deposit.amountout');
        } else if (value.isNaN() || value.eq(0) || BigNumber(depositValue).isNaN() || BigNumber(depositValue).eq(0)) {
          status = false;
          btnText = '';
        } else {
          status = true;
          btnText = '';
        }

        const errInfo1 = {
          status,
          btnText
        };

        this.props.depositWstUSDTChange(token, depositValue, str, errInfo1);
        this.setState({ depositValue, btnText });
      }
    } catch (error) {}
  };

  onChangeWstUSDTRepay = (inputValue, token = this.state.token, fromInput = false, isClear = false) => {
    try {
      const { borrowModalInfo, userList, marketList, balanceInfo, minStakeAmount } = this.props.lend;
      const { jtokenAddress } = borrowModalInfo;
      const popData = userList[jtokenAddress] || marketList[jtokenAddress];
      const { precision, collateralSymbol = '', borrowBalanceNew = 0, collateralDecimal } = popData;
      const { wstUSDTbalanceInfo } = this.props.lend;
      const { wrapRate } = this.state;
      const { valid, str } = numberParser(inputValue, Config[token].decimal);

      if (valid) {
        // const isClear = this.state.isClear;
        // const totalRepayUsdAfter = str === '' ? totalBorrowUsdForUSDD : this.getTotalBorrowUsdAfter(str, true);

        // this.setState({
        //   isClear: fromInput ? false : isClear,
        //   repayValue: str
        // });
        // if (inputValue != 0) {
        //   this.setState({ totalRepayUsdAfter });
        // }

        this.setState({
          inputValue: str
        });

        let repayValue = str;

        if (token !== 'wstusdt') {
          repayValue = BigNumber(BigNumber(str).times(wrapRate))._toFixed(Config[token].decimal, 1);
          if (BigNumber(repayValue).isNaN()) {
            repayValue = '';
          }
        }

        const borrowBalanceNewValue = BigNumber(borrowBalanceNew).div(precision);
        let value = BigNumber(str);
        // let value = BigNumber(repayValue);
        let status = '';
        let btnText = '';
        if (BigNumber(inputValue).lt(minStakeAmount) && token === 'usdt') {
          status = false;
          btnText = intl.get('wst.wst_error_repay_wst_at_least1') + ' ' + formatNumber(minStakeAmount, 0) + ' USDT';
        } else if (BigNumber(borrowBalanceNewValue).lte(0)) {
          status = false;
          btnText = intl.get('repay.no_debt');
        } else if (value.isNaN() || value.eq(0) || BigNumber(repayValue).isNaN() || BigNumber(repayValue).eq(0)) {
          status = false;
          btnText = '';
          // btnText = intl.get('repay.enter_amount');
        } else if (
          (token === 'wstusdt' && value.gt(borrowBalanceNewValue)) ||
          (token !== 'wstusdt' && BigNumber(repayValue).gt(borrowBalanceNewValue))
        ) {
          status = false;
          btnText = intl.get('repay.exceeded_amount_borrowed');
        } else if (gtBalance(value, wstUSDTbalanceInfo[Config[token].token]?.balance, Config[token].precision)) {
          status = false;
          btnText = intl.get('repay.Insufficient_wallet_balance');
        } else {
          status = true;
          btnText = '';
          // btnText = intl.get('repay.repay');
        }

        const errInfo2 = {
          status,
          btnText
        };

        this.props.onChangeWstUSDTRepay(token, repayValue, str, errInfo2, isClear);
        this.setState({ repayValue, btnText });
      }
    } catch (err) {
      console.log('onChangeRepay ', err);
    }
  };

  getWrapRate = async () => {
    try {
      const res = await getWrapRate();
      if (res.success) {
        this.setState({
          wrapRate: BigNumber(res.wrapRate).div(1e18).toString()
        });
      }
    } catch (err) {
      console.log('getWrapRate', err);
    }
  };

  isChooseTokenDisabled = () => {
    // borrowBalanceNewValue lt 1 = disabled
    const { type, borrowBalanceNewValue } = this.props;
    const { minStakeAmount, paused, mintPaused } = this.props.lend;

    let obj = { minDisabled: false, pausedDisabled: false };

    if (BigNumber(borrowBalanceNewValue).lt(minStakeAmount)) {
      obj.minDisabled = true;
    }
    if (BigNumber(mintPaused).eq(1) || BigNumber(paused).eq(1)) {
      obj.pausedDisabled = true;
    }

    return obj;
  };

  contentRender = () => {
    const { theme, wstUSDTbalanceInfo, minStakeAmount } = this.props.lend;
    const { token } = this.state;

    const { minDisabled, pausedDisabled } = this.isChooseTokenDisabled();

    return (
      <div className="token-options">
        <div className="token-title">
          <div>{intl.get('wst.wst_deposit_token')}</div>
          <div>{intl.get('wst.wst_wallet_balance')}</div>
        </div>
        <div className="token-list" onClick={() => this.chooseToken('wstusdt')}>
          <div>
            <img src={WstusdtImg} alt="" /> <span className="token-list-text">wstUSDT</span>{' '}
            <span className={'selected-icon' + (token === 'wstusdt' ? ' show' : '')}></span>
          </div>
          <div>
            {formatNumber(
              BigNumber(wstUSDTbalanceInfo[Config['wstusdt'].token]?.balance).div(Config['wstusdt'].precision),
              3,
              { miniText: 0.001 }
            )}
          </div>
        </div>
        <div className="token-list" onClick={() => this.chooseToken('stusdt')}>
          <div>
            <img src={theme === 'white' ? StusdtImgWhite : StusdtImg} alt="" />{' '}
            <span className="token-list-text">stUSDT</span>{' '}
            <span className={'selected-icon' + (token === 'stusdt' ? ' show' : '')}></span>
          </div>
          <div>
            {formatNumber(
              BigNumber(wstUSDTbalanceInfo[Config['stusdt'].token]?.balance).div(Config['stusdt'].precision),
              3,
              {
                miniText: 0.001
              }
            )}
          </div>
        </div>
        <div
          className={'token-list' + (minDisabled || pausedDisabled ? ' disabled' : '')}
          onClick={() => this.chooseToken('usdt')}
        >
          <div>
            <img src={UsdtImg} alt="" /> <span className="token-list-text">USDT</span>{' '}
            {(minDisabled || pausedDisabled) && (
              <Tooltip
                overlayClassName="j-tooltip-dropdown"
                title={
                  pausedDisabled
                    ? intl.getHTML('wst.wst_stake_paused', {
                        type: this.props.type === 'repay' ? intl.get('v2.modal_repay') : intl.get('v2.modal_deposit')
                      })
                    : intl.getHTML('wst.wst_error_repay_wst_at_least', { amount: formatNumber(minStakeAmount, 0) })
                }
                placement="bottom"
                arrowPointAtCenter
              >
                <span className="j-tooltip-icon "></span>
              </Tooltip>
            )}
            <span className={'selected-icon' + (token === 'usdt' ? ' show' : '')}></span>
          </div>
          <div>
            {formatNumber(
              BigNumber(wstUSDTbalanceInfo[Config['usdt'].token]?.balance).div(Config['usdt'].precision),
              3,
              {
                miniText: 0.001
              }
            )}
          </div>
        </div>
      </div>
    );
  };

  chooseToken = token => {
    document.getElementById('wst-input').blur();
    this.props.system.clearRejectError();

    const { minDisabled, pausedDisabled } = this.isChooseTokenDisabled();

    if ((minDisabled || pausedDisabled) && token === 'usdt') return;

    this.setState({ open: false, token, inputValue: '' });
    if (this.props.type === 'deposit') {
      this.depositWstUSDTChange('', token);
    } else if (this.props.type === 'repay') {
      this.onChangeWstUSDTRepay('', token);
    }
  };

  titleRender = () => {
    const { theme } = this.props.lend;
    const { token } = this.state;

    if (token === 'wstusdt') {
      return (
        <>
          <img src={WstusdtImg} alt="" /> <span>wstUSDT</span>
        </>
      );
    } else if (token === 'stusdt') {
      return (
        <>
          <img src={theme === 'white' ? StusdtImgWhite : StusdtImg} alt="" /> <span>stUSDT</span>
        </>
      );
    } else if (token === 'usdt') {
      return (
        <>
          <img src={UsdtImg} alt="" /> <span>USDT</span>
        </>
      );
    }
  };

  prefixRender = () => {
    return (
      <div className={'token-select' + (this.state.open ? ' open' : '')}>
        <div
          className="token-select-value"
          onClick={e => {
            document.getElementById('wst-input').blur();
            this.setState({ open: !this.state.open });
          }}
        >
          {this.titleRender()}
        </div>
        {this.contentRender()}
      </div>
    );
  };

  clickMax = () => {
    try {
      const { token } = this.state;
      const { wstUSDTbalanceInfo } = this.props.lend;
      let tokenBalance = BigNumber(wstUSDTbalanceInfo[Config[token].token]?.balance).div(Config[token].precision);

      tokenBalance = !tokenBalance.gte(0) ? 0 : tokenBalance._toFixed(Config[token].decimal, 1);

      this.setState(
        {
          inputValue: tokenBalance
        },
        () => {
          this.depositWstUSDTChange(tokenBalance);
        }
      );
    } catch (err) {
      console.log('clickMax:', err);
    }
  };

  clickMaxRepay = () => {
    const { wstUSDTbalanceInfo } = this.props.lend;
    const { token } = this.state;
    let isClear = true;

    let repayValue = BigNumber(this.props.borrowBalanceNewValue);
    const { wrapRate } = this.state;
    let inputValue = BigNumber(repayValue)._toFixed(Config[token].decimal, 1);
    if (token !== 'wstusdt') {
      inputValue = BigNumber(BigNumber(repayValue).div(wrapRate))._toFixed(Config[token].decimal, 1);
    }

    let walletBalance = BigNumber(wstUSDTbalanceInfo[Config[token].token]?.balance).div(Config[token].precision);
    // let borrowValueResult = repayValue;

    if (BigNumber(walletBalance).lt(0)) {
      walletBalance = BigNumber(0);
    }
    if (BigNumber(walletBalance).lte(repayValue)) {
      repayValue = walletBalance;
      // if (token !== 'wstusdt') {
      //   inputValue = BigNumber(walletBalance)._toFixed(Config[token].decimal, 1);
      //   // repayValue =
      // }

      inputValue = BigNumber(walletBalance)._toFixed(Config[token].decimal, 1);
      isClear = false;
    }

    repayValue = BigNumber(repayValue)._toFixed(Config[token].decimal, 1);
    this.setState(
      {
        // isClear: true,
        repayValue
      },
      () => {
        console.log('isClear: ', isClear);
        this.onChangeWstUSDTRepay(inputValue, token, false, isClear);
      }
    );

    // fixed
    // this.props.clickMax(BigNumber(repayValue), Config['wstusdt'].decimal);
  };

  render() {
    const { userList, marketList, borrowModalInfo, wstUSDTbalanceInfo, minStakeAmount } = this.props.lend;
    const { jtokenAddress } = borrowModalInfo;
    const popData = userList[jtokenAddress] || marketList[jtokenAddress];
    const { token, inputValue, depositValue, btnText, repayValue, lang, mobile } = this.state;

    return (
      <>
        <div className="j-wallet">
          <span>{intl.get('deposit.wallet_balance')}</span>
          <span className="repay-balance flex">
            <span className="repay-balance-value ellipsis">
              {formatNumber(
                BigNumber(wstUSDTbalanceInfo[Config[token].token]?.balance).div(Config[token].precision),
                3,
                {
                  miniText: 0.001
                }
              )}
            </span>
            &nbsp;
            {tokenUnit[token]}
          </span>

          {/* {renderBalance(popData, balanceInfo, 3, true)} */}
        </div>
        <div
          className={
            'wst-input-wrap' +
            (['usdt', 'stusdt'].includes(token) && !BigNumber(inputValue).isNaN() ? ' j-usdt-input-wrap' : '')
          }
        >
          <Input
            id="wst-input"
            className={
              'j-input ' +
              // (token === 'usdt' && !BigNumber(this.props.value).isNaN() ? ' j-usdt-input' : '') +
              (btnText ? 'j-error-input' : '')
            }
            autoComplete="off"
            placeholder={
              token === 'usdt' && !BigNumber(minStakeAmount).eq(0)
                ? (lang !== 'en-US' ? formatNumber(minStakeAmount, 0) + ' USDT' : '') +
                  (this.props.type === 'repay'
                    ? intl.get('wst.wst_repay_placeholder1')
                    : intl.get('wst.wst_deposit_placeholder1')) +
                  (lang === 'en-US' ? formatNumber(minStakeAmount, 0) + ' USDT' : '')
                : this.props.type === 'repay'
                ? intl.get('repay.enter_amount')
                : intl.get('v2.enter_deposit_amount')
            }
            allowClear={mobile && token !== 'wstusdt' ? false : true}
            prefix={this.prefixRender()}
            addonAfter={
              <span
                className="pointer"
                onClick={() => {
                  if (this.props.type === 'repay') {
                    this.clickMaxRepay();
                  } else {
                    this.clickMax();
                  }
                }}
              >
                {intl.get('v2.max')}
              </span>
            }
            value={addThousandSeparators(inputValue)}
            // onChange={e => this.props.change(e.target.value, this.props.type === 'repay')}
            onChange={e => {
              this.props.system.clearRejectError();
              if (this.props.type === 'deposit') {
                this.depositWstUSDTChange(removeThousandSeparators(e.target.value));
              } else if (this.props.type === 'repay') {
                this.onChangeWstUSDTRepay(removeThousandSeparators(e.target.value));
              }
            }}
            disabled={this.props.disabled}
          />

          {
            <div className="wst-transfer">
              <Tooltip
                overlayClassName="j-tooltip-dropdown "
                title={`≈${formatNumber(this.props.type === 'deposit' ? depositValue : repayValue, 6, {
                  miniText: 0.000001
                })} wstUSDT`}
                placement="bottom"
                arrowPointAtCenter
              >
                <div className="flex">
                  <span className="wst-transfer-text">
                    {' '}
                    ≈
                    {formatNumber(this.props.type === 'deposit' ? depositValue : repayValue, 6, {
                      miniText: 0.000001
                    })}{' '}
                  </span>
                  <span className="wst-transfer-unit">wstUSDT</span>
                </div>
              </Tooltip>

              <Tooltip
                overlayClassName="j-tooltip-dropdown"
                title={
                  <>
                    {' '}
                    {this.props.type === 'repay'
                      ? token === 'usdt'
                        ? intl.get('wst.wst_tip4')
                        : intl.get('wst.wst_tip5')
                      : token === 'usdt'
                      ? intl.get('wst.wst_tip1')
                      : intl.get('wst.wst_tip3')}
                    {this.props.type === 'deposit' && token === 'usdt' && (
                      <a className="j-tooltip-link j-link hover" href={Config.stusdtLink}>
                        {intl.get('wst.wst_tip2')}
                      </a>
                    )}
                  </>
                }
                placement="bottom"
                arrowPointAtCenter
              >
                <span className="j-tooltip-icon "></span>
              </Tooltip>
            </div>
          }
        </div>
        {btnText && (
          <div className="j-error-tip">
            <span className="j-error-img"></span>
            <div>{btnText}</div>
          </div>
        )}
      </>
    );
  }
}

export default WstusdtInput;
