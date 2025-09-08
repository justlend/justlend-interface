import React from 'react';
import isMobile from 'ismobilejs';
import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';
import { Modal, Select, Tooltip, Input } from 'antd';
import { TooltipText } from '../strx/TooltipText';
import ToggleSwitch from '../../Widget/ToggleSwitch';
import Config from '../../../config';
import {
  formatNumber,
  BigNumber,
  emptyReactNodeNew,
  getLiquidJTokenLogo,
  getLiquidLogo,
  numberParser,
  toBigNumberNew,
  addThousandSeparators,
  removeThousandSeparators
} from '../../../utils/helper';
import { tokenBalanceOf } from '../../../utils/blockchain';
import '../../../assets/css/v2/liquidate-modal.scss';

const { Option } = Select;
@inject('lend')
@inject('system')
@inject('network')
@observer
class LiquidateModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      mobile: isMobile(window.navigator).any,
      switchValue: !!window.localStorage.getItem('stableCoinsFirst'),
      getSelectValue: '',
      repaySelectValue: '',
      collateralTokenMap: {},
      borrowTokenMap: {},
      repayValue: '',
      errMsg: '',
      approving: false,
      hasApproved: false,
      maxRepayAmountLimit: '--'
    };
  }
  componentDidMount = () => {
    this.listInit();
    window.gtag('event', 'liquidate_liquidatepop', {
      'event_category': 'liquidate',
      'event_label': 'liquidate_liquidatepop'
    });
  };

  listInit = (switchValue = this.state.switchValue) => {
    const { borrowTokenList: borrowTokenListNew, collateralTokenList: collateralTokenListNew } = this.props.dataInfo;

    const { jtokens } = this.props.lend.liquidateInfo;
    const collateralTokenMap = {};
    collateralTokenListNew.map(item => {
      collateralTokenMap[item.symbol] = item;
    });
    const borrowTokenMap = {};
    borrowTokenListNew.map(item => {
      borrowTokenMap[item.symbol] = item;
    });

    // let collateralTokenList = collateralTokenListNew;
    let collateralTokenList = this.collateralTokenListSort(collateralTokenListNew, switchValue);
    let borrowTokenList = borrowTokenListNew.sort((a, b) => b.valueUsd - a.valueUsd);

    // if (switchValue) {
    //   collateralTokenList = collateralTokenListNew.sort((a, b) => b.valueUsd - a.valueUsd);
    // }

    const collateralSymbol = collateralTokenList[0].symbol;
    const repaySymbol = borrowTokenList[0].symbol;

    this.setState(
      {
        collateralTokenMap,
        borrowTokenMap,
        getSelectValue: collateralSymbol,
        repaySelectValue: repaySymbol
      },
      () => {
        this.maxRepayAmountFilter({
          collateralTokenMap,
          borrowTokenMap,
          repaySelectValue: repaySymbol,
          getSelectValue: collateralSymbol
        });
        // this.getBalanceInfo(
        //   borrowTokenList[0].tokenAddress,
        //   jtokens['j' + repaySymbol],
        //   this.props.network.defaultAccount,
        //   repaySymbol //repaySelectValue
        // );
      }
    );
  };

  getBalanceInfo = async (
    tokenAddress,
    jtokenAddress,
    accountAddress = this.props.network.defaultAccount,
    repaySelectValue = this.state.repaySelectValue
  ) => {
    try {
      // const { repaySelectValue } = this.state;
      // console.log(tokenAddress, 'tokenAddress', jtokenAddress, 'jtokenAddress');
      const balanceInfo = await tokenBalanceOf(
        {
          token: tokenAddress,
          jtokenAddress,
          precision: Config[('' + repaySelectValue).toLocaleLowerCase()].precision
        },
        accountAddress
      );
      this.setState({ balanceInfo });
      // console.log(
      //   balanceInfo,
      //   'balanceInfo',
      //   BigNumber(balanceInfo.balance).toString(),
      //   BigNumber(Config[('' + repaySelectValue).toLocaleLowerCase()].precision).toString(),
      //   '11111'
      // );
      this.maxRepayAmountFilter({ balanceInfo, repaySelectValue });
    } catch (err) {
      console.log('repayChange ', err);
    }
  };

  maxRepayAmountFilter = (
    {
      getSelectValue = this.state.getSelectValue,
      repaySelectValue = this.state.repaySelectValue,
      collateralTokenMap = this.state.collateralTokenMap,
      borrowTokenMap = this.state.borrowTokenMap,
      balanceInfo = this.state.balanceInfo
      // ignoreBalance = false
    } = {},
    noSet = false
  ) => {
    try {
      if (!repaySelectValue) return '--';

      const { balanceMap } = this.props.lend;
      const debt = BigNumber(borrowTokenMap[repaySelectValue]?.valueUsd).times(0.5);
      const collateral = BigNumber(collateralTokenMap[getSelectValue]?.valueUsd).div(1.08);
      const balance = balanceMap[repaySelectValue]?.balance;
      // const balance = balanceInfo?.balance;

      // console.log(
      //   BigNumber(debt).toString(),
      //   'debt',
      //   BigNumber(collateral).toString(),
      //   'collateral',
      //   BigNumber(balance).toString(),
      //   'balance',
      //   borrowTokenMap[repaySelectValue].price,
      //   'price'
      // );
      let maxRepayAmountLimit = BigNumber(debt).div(borrowTokenMap[repaySelectValue]?.price);
      if (BigNumber(collateral).lt(debt)) {
        maxRepayAmountLimit = BigNumber(collateral).div(borrowTokenMap[repaySelectValue].price);
      }
      // maxRepayAmountLimit = BigNumber(maxRepayAmountLimit).div(1);
      // if (!ignoreBalance && BigNumber(balance).lt(maxRepayAmountLimit)) {
      if (BigNumber(balance).lt(maxRepayAmountLimit)) {
        maxRepayAmountLimit = balance;
      }

      maxRepayAmountLimit = BigNumber(maxRepayAmountLimit)._toFixed(
        Config[('' + repaySelectValue).toLocaleLowerCase()].decimal,
        1
      );

      if (!noSet) {
        this.setState({ maxRepayAmountLimit });
      }

      return maxRepayAmountLimit;
    } catch (err) {
      console.log('maxRepayAmountFilter ', err);
    }
  };

  liquidateHide = () => {
    this.props.lend.setData({ liquidateShow: false });
    window.gtag('event', 'click', {
      'event_category': 'liquidate',
      'event_label': 'liquidate_liquidatepop_click_Stable'
    });
  };

  onSwitchChange = switchValue => {
    if (switchValue) {
      window.localStorage.setItem('stableCoinsFirst', 'true');
      window.gtag('event', 'click', {
        'event_category': 'liquidate',
        'event_label': 'liquidate_liquidatepop_click_Stable'
      });
    } else {
      window.localStorage.setItem('stableCoinsFirst', '');
    }
    this.setState({ switchValue });
    this.listInit(switchValue);
  };

  getSelectChange = getSelectValue => {
    this.setState({ getSelectValue, repayValue: '' });
    this.repayChange('');
    this.maxRepayAmountFilter({ getSelectValue });
  };

  repaySelectChange = repaySelectValue => {
    const { borrowTokenMap } = this.state;
    const { jtokens } = this.props.lend.liquidateInfo;

    this.setState({ repaySelectValue, repayValue: '' });
    this.repayChange('');
    this.maxRepayAmountFilter({ repaySelectValue });
    // this.getBalanceInfo(
    //   borrowTokenMap[repaySelectValue].tokenAddress,

    //   jtokens['j' + borrowTokenMap[repaySelectValue].symbol],
    //   this.props.network.defaultAccount,
    //   repaySelectValue
    // );
  };

  repayChange = inputValue => {
    try {
      this.props.system.clearRejectError();

      let { repaySelectValue, borrowTokenMap, maxRepayAmountLimit } = this.state;
      const { valid, str } = numberParser(inputValue, Config[repaySelectValue.toLocaleLowerCase()].decimal);

      if (valid) {
        this.setState({
          repayValue: str
        });

        // const maxRepayAmount = borrowTokenMap[repaySelectValue]?.amount;
        let errMsg = '';
        if (BigNumber(str).isNaN() || BigNumber(str).eq(0)) {
          errMsg = '';
        } else if (BigNumber(str).gt(maxRepayAmountLimit)) {
          errMsg = intl.get('liquidate.liquidate_tip13');
        } else {
          errMsg = '';
        }
        this.setState({ errMsg });
      }
    } catch (err) {
      console.log('repayChange ', err);
    }
  };

  clickMax = () => {
    const { repaySelectValue, borrowTokenMap, maxRepayAmountLimit } = this.state;
    // const amount = formatNumber(
    //   borrowTokenMap[repaySelectValue]?.amount,
    //   Config[('' + repaySelectValue).toLocaleLowerCase()].decimal
    // );
    this.setState({ repayValue: maxRepayAmountLimit }, () => {
      this.repayChange(maxRepayAmountLimit);
    });
    window.gtag('event', 'click', {
      'event_category': 'liquidate',
      'event_label': 'liquidate_liquidatepop_click_inputMax'
    });
  };

  approve = async (token = this.state.repaySelectValue) => {
    try {
      this.props.system.clearRejectError();

      const { borrowTokenMap, collateralTokenMap } = this.state;
      const { jtokens } = this.props.lend.liquidateInfo;

      this.setState({ approving: true });

      const txID = await this.props.system.approveToken({
        collateralAddress: borrowTokenMap[token].tokenAddress,
        jtokenAddress: jtokens['j' + token],
        // jtokenAddress: collateralTokenMap['j' + token].jtokenAddress,
        transType: 'approve'
      });
      if (txID) {
        this.setState({ hasApproved: true });
        window.gtag('event', 'click', {
          'event_category': 'liquidate',
          'event_label': 'liquidate_liquidatepop_click_Approve'
        });
      }
      this.setState({ approving: false });
      // console.log(txID, 'txID-approve');
    } catch (e) {
      console.log('Error: approve error');
    }
  };

  submit = async () => {
    try {
      this.props.system.clearRejectError();
      window.gtag('event', 'click', {
        'event_category': 'liquidate',
        'event_label': 'liquidate_liquidatepop_click_Liquidate'
      });

      const {
        lang,
        switchValue,
        getSelectValue,
        repaySelectValue,
        repayValue,
        collateralTokenMap,
        borrowTokenMap,
        errMsg
      } = this.state;
      const { borrower } = this.props.dataInfo;
      const { jtokens } = this.props.lend.liquidateInfo;

      // const { inputValue } = props.stakeInfo;
      const intlObj = {
        title: 'notification.transaction_confirm',
        title2: 'notification.transactionsent',
        title3: 'notification.transaction_confirm_fail',
        title4: 'notification.confirm_transaction',
        obj: {
          value: repayValue,
          // value: formatNumber(
          // BigNumber(repayValue).times(Config[repaySelectValue?.toLocaleLowerCase()].precision)._toFixed(0, 1),
          // Config[repaySelectValue?.toLocaleLowerCase()].decimal
          // ),
          token: repaySelectValue
        },
        transType: 'liquidate'
      };

      this.setState({ approving: true });

      let txID = '';

      const contractAddress = jtokens['j' + repaySelectValue];
      const jTokenCollateral = collateralTokenMap[getSelectValue].jtokenAddress;
      const repayAmount = BigNumber(repayValue)
        .times(Config[repaySelectValue?.toLocaleLowerCase()].precision)
        ._toFixed(0, 1);

      if (repaySelectValue === 'TRX') {
        let funcSelector = 'liquidateBorrow(address,address)';
        let parameters = [
          { type: 'address', value: borrower },
          { type: 'address', value: jTokenCollateral }
        ];
        const feeLimit = await this.props.system.getFeeLimitCommon(contractAddress, funcSelector, parameters);
        const options = { feeLimit };

        txID = await this.props.system.liquidateBorrowJtrx(
          contractAddress,
          borrower,
          jTokenCollateral,
          repayAmount,
          intlObj,
          options
        );
      } else {
        let funcSelector = 'liquidateBorrow(address,uint256,address)';
        let parameters = [
          { type: 'address', value: borrower },
          { type: 'uint256', value: repayAmount },
          { type: 'address', value: jTokenCollateral }
        ];
        const feeLimit = await this.props.system.getFeeLimitCommon(contractAddress, funcSelector, parameters);
        const options = { feeLimit };

        txID = await this.props.system.liquidateBorrow(
          contractAddress,
          borrower,
          jTokenCollateral,
          repayAmount,
          intlObj,
          options
        );
      }
      if (txID === -1) {
        window.gtag('event', 'click', { 'event_category': 'liquidate', 'event_label': 'liquidate_errorpop' });
        this.props.lend.setData({ exceptionVisible: true });
        this.setState({ approving: false });
        return;
      }
      // if (!(this.props.system.transModalInfo.declined && this.props.system.transModalInfo.transType === 'liquidate')) {
      //   props.close();
      // }
      // console.log(txID, 'txID');
      if (txID) {
        this.liquidateHide();
        setTimeout(() => {
          this.props.lend.getLiquidateInfo();
        }, 5000);
        window.gtag('event', 'click', { 'event_category': 'liquidate', 'event_label': 'liquidate_success_pop' });
      } else {
        window.gtag('event', 'click', { 'event_category': 'liquidate', 'event_label': 'liquidate_timeout_pop' });
      }

      this.setState({ approving: false });
    } catch (e) {
      console.log('Error: liquidateBorrow error');
      window.gtag('event', 'click', { 'event_category': 'liquidate', 'event_label': 'liquidate_failed_pop' });
      this.setState({ approving: false });
    }
  };

  collateralTokenListSort = (collateralTokenList, switchValue = this.state.switchValue) => {
    // const { switchValue } = this.state;

    collateralTokenList = collateralTokenList.sort((a, b) => b.valueUsd - a.valueUsd);

    if (switchValue) {
      // usdd usdt tusd usdc usdj busd wstUSDT
      let stableTokenList = ['jUSDD', 'jUSDT', 'jTUSD', 'jUSDC', 'jUSDJ', 'jBUSD', 'jwstUSDT'];

      let stableTempList = [];
      let unstableTempList = [];

      collateralTokenList.map(item => {
        if (stableTokenList.includes(item.symbol)) {
          stableTempList.push(item);
        } else {
          unstableTempList.push(item);
        }
      });

      return [...stableTempList, ...unstableTempList];
    } else {
      return collateralTokenList;
    }
  };

  render() {
    const { borrowTokenList: borrowTokenListNew, collateralTokenList: collateralTokenListNew } = this.props.dataInfo;
    let collateralTokenList = this.collateralTokenListSort(collateralTokenListNew);
    // const borrowTokenList = borrowTokenListNew.sort((a, b) => b.valueUsd - a.valueUsd);
    const { liquidateShow } = this.props.lend;
    const {
      lang,
      switchValue,
      getSelectValue,
      repaySelectValue,
      repayValue,
      collateralTokenMap,
      borrowTokenMap,
      errMsg,
      approving,
      hasApproved,
      maxRepayAmountLimit,
      balanceInfo,
      mobile
    } = this.state;

    const { balanceMap } = this.props.lend;

    // let collateralTokenList = collateralTokenListNew;
    let borrowTokenList = borrowTokenListNew.sort((a, b) => b.valueUsd - a.valueUsd);

    // if (switchValue) {
    //   collateralTokenList = collateralTokenListNew.sort((a, b) => b.valueUsd - a.valueUsd);
    // }

    const colleralPrice = getSelectValue ? collateralTokenMap[getSelectValue].price : 0;
    const repayPrice = repaySelectValue ? borrowTokenMap[repaySelectValue].price : 0;
    const collateralAmount = toBigNumberNew(repayValue).times(repayPrice).div(colleralPrice);
    const collateralUsd = BigNumber(collateralAmount).times(colleralPrice);
    const benefitAmount = BigNumber(collateralAmount).times(0.08);
    const benefitUsd = BigNumber(benefitAmount).times(colleralPrice);
    const totalGetAmount = BigNumber(collateralAmount).plus(benefitAmount);
    const totalGetUsd = BigNumber(collateralUsd).plus(benefitUsd);

    // console.log(borrowTokenMap, 'repaySelectValue', repaySelectValue);

    const { transModalInfo } = this.props.system;
    const { declined, transType } = transModalInfo;

    // console.log(declined, transType, 'declined, transType');
    let isLessThanAllowance = true;
    if (repaySelectValue) {
      isLessThanAllowance = BigNumber(
        BigNumber(repayValue).times(Config[('' + repaySelectValue).toLocaleLowerCase()]?.precision)
      ).lte(balanceMap[repaySelectValue]?.allowance);
    }

    return (
      <Modal
        visible={true}
        title={intl.get('liquidate.liquidate_liquidate')}
        width={400}
        centered
        maskClosable={false}
        footer={null}
        className={'j-modal header-border j-liquidate-modal ' + (mobile ? ' j-liquidate-m-modal' : '')}
        onCancel={() => this.liquidateHide()}
        getContainer={() => document.querySelector('.j-wrapper')}
      >
        <div className="j-liquidate-content">
          <div className="jc-main flex aic jcsb">
            <div className="flex aic">
              <span className="lc-title">{intl.get('liquidate.liquidate_get')}</span>
              <span className="lc-subtitle">({intl.get('liquidate.liquidate_tip3')})</span>
            </div>
            <div className="bs-list flex aic">
              <span className="lc-subtitle">{intl.get('liquidate.liquidate_tip5')}</span>
              <ToggleSwitch
                on={switchValue}
                lang={lang}
                onClick={() => {
                  this.onSwitchChange(!switchValue);
                }}
              ></ToggleSwitch>
            </div>
          </div>
          <div className="liquidate-select liquidate-select-get pr">
            <Select
              value={getSelectValue}
              onChange={this.getSelectChange}
              dropdownClassName={
                `liquidate-select-dropdown` + (collateralTokenList.length <= 3 ? ' liquidate-select-dropdown-hide' : '')
              }
              getPopupContainer={() => document.querySelector('.liquidate-select-get')}
            >
              <Option disabled key={'getSelectTitle'} className="get-select-title">
                <div>
                  <div className="get-select-subtile">{intl.get('liquidate.liquidate_collateral')}</div>
                  <div className="flex aic">
                    {mobile ? (
                      <TooltipText
                        overlayClassName="j-tooltip-dropdown"
                        title={intl.get('liquidate.liquidate_tip4')}
                        placement="topRight"
                        arrowPointAtCenter
                        getPopupContainer={() => document.querySelector('.j-liquidate-modal')}
                      >
                        <span className="get-select-subtile">{intl.get('liquidate.liquidate_collateral_value')}</span>
                      </TooltipText>
                    ) : (
                      <>
                        <Tooltip
                          overlayClassName="j-tooltip-dropdown"
                          title={intl.get('liquidate.liquidate_tip4')}
                          placement="top"
                          arrowPointAtCenter
                          getPopupContainer={() => document.querySelector('.liquidate-select-get')}
                        >
                          <span className="j-tooltip-icon lower-icon"></span>
                        </Tooltip>

                        <span className="get-select-subtile ml-8">
                          {intl.get('liquidate.liquidate_collateral_value')}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </Option>
              {collateralTokenList.map(item => (
                <Option value={item.symbol} key={item.jtokenAddress}>
                  <div className="flex aic jcsb">
                    <div className="flex aic">
                      <img className="jc-logo" src={getLiquidJTokenLogo(item.symbol)} alt="" />
                      <span className="jc-text">{item.symbol}</span>
                      <em className={'jc-selected-sign' + (item.symbol === getSelectValue ? ' selected' : '')}></em>
                    </div>
                    <div className="jc-values">
                      <div
                        className="jc-select-value"
                        title={formatNumber(BigNumber(item.valueUsd), BigNumber(item.valueUsd).lt(0.01) ? 18 : 2, {
                          needDolar: true,
                          cutZero: true
                        })}
                      >
                        {formatNumber(BigNumber(item.valueUsd), BigNumber(item.valueUsd).lt(0.01) ? 18 : 2, {
                          needDolar: true,
                          cutZero: true
                        })}
                      </div>
                      <div
                        className="jc-select-amount"
                        title={formatNumber(item.amount, BigNumber(item.amount).lt(1) ? 18 : 2, { cutZero: true })}
                      >
                        {formatNumber(item.amount, BigNumber(item.amount).lt(1) ? 18 : 2, { cutZero: true })}
                      </div>
                    </div>
                  </div>
                </Option>
              ))}
            </Select>
          </div>
          <div className="jc-main flex aic">
            <span className="lc-title">{intl.get('liquidate.liquidate_repay')}</span>
            <span className="lc-subtitle">({intl.get('liquidate.liquidate_tip6')})</span>
          </div>
          <div className="liquidate-select liquidate-select-repay pr">
            <Select
              value={repaySelectValue}
              onChange={this.repaySelectChange}
              dropdownClassName={
                `liquidate-select-dropdown` + (borrowTokenList.length <= 3 ? ' liquidate-select-dropdown-hide' : '')
              }
              getPopupContainer={() => document.querySelector('.liquidate-select-repay')}
            >
              <Option disabled key={'repaySelectTitle'} className="get-select-title">
                <div className="j-option-ele">
                  <div className="get-select-subtile">{intl.get('liquidate.liquidate_debt')}</div>
                  <div className="get-select-subtile opacity-5">{intl.get('liquidate.risk.total_debt')}</div>
                  <div className="flex aic">
                    {mobile ? (
                      <TooltipText
                        overlayClassName="j-tooltip-dropdown"
                        title={intl.get('liquidate.liquidate_tip7')}
                        placement="topLeft"
                        arrowPointAtCenter
                        getPopupContainer={() => document.querySelector('.j-liquidate-modal')}
                      >
                        <span className="get-select-subtile">{intl.get('liquidate.liquidate_max')}</span>
                      </TooltipText>
                    ) : (
                      <>
                        <Tooltip
                          overlayClassName="j-tooltip-dropdown"
                          title={intl.get('liquidate.liquidate_tip7')}
                          placement="top"
                          arrowPointAtCenter
                          getPopupContainer={() => document.querySelector('.liquidate-select-get')}
                        >
                          <span className="j-tooltip-icon lower-icon"></span>
                        </Tooltip>

                        <span className="get-select-subtile ml-8">{intl.get('liquidate.liquidate_max')}</span>
                      </>
                    )}
                  </div>
                </div>
              </Option>

              {borrowTokenList.map(item => (
                <Option value={item.symbol} key={item.tokenAddress}>
                  <div className="flex aic jcsb j-option-ele">
                    <div className="flex aic">
                      <img className="jc-logo" src={getLiquidLogo(item.symbol)} alt="" />
                      <span className="jc-text">{item.symbol}</span>
                      <em className={'jc-selected-sign' + (item.symbol === repaySelectValue ? ' selected' : '')}></em>
                    </div>
                    <div className="jc-values jc-ellipsis jc-values-hide opacity-5">
                      <div
                        className="jc-select-value"
                        title={formatNumber(item.valueUsd, BigNumber(item.valueUsd).lt(0.01) ? 18 : 2, {
                          cutZero: true,
                          needDolar: true
                        })}
                      >
                        {formatNumber(item.valueUsd, BigNumber(item.valueUsd).lt(0.01) ? 18 : 2, {
                          cutZero: true,
                          needDolar: true
                        })}
                      </div>
                      <div
                        className="jc-select-amount"
                        title={formatNumber(item.amount, BigNumber(item.amount).lt(1) ? 18 : 2, { cutZero: true })}
                      >
                        {formatNumber(item.amount, BigNumber(item.amount).lt(1) ? 18 : 2, { cutZero: true })}
                      </div>
                    </div>
                    <div className="jc-values jc-ellipsis">
                      <div
                        className="jc-select-value"
                        title={formatNumber(
                          Object.keys(borrowTokenMap).length <= 0
                            ? '--'
                            : BigNumber(item.price).times(
                                this.maxRepayAmountFilter(
                                  {
                                    repaySelectValue: item.symbol,
                                    getSelectValue: getSelectValue || collateralTokenList[0].symbol
                                    // ignoreBalance: true
                                  },
                                  true
                                )
                              ),
                          BigNumber(item.price)
                            .times(
                              this.maxRepayAmountFilter(
                                {
                                  repaySelectValue: item.symbol,
                                  getSelectValue: getSelectValue || collateralTokenList[0].symbol
                                  // ignoreBalance: true
                                },
                                true
                              )
                            )
                            .lt(0.01)
                            ? 18
                            : 2,
                          { cutZero: true, needDolar: true }
                        )}
                      >
                        {formatNumber(
                          Object.keys(borrowTokenMap).length <= 0
                            ? '--'
                            : BigNumber(item.price).times(
                                this.maxRepayAmountFilter(
                                  {
                                    repaySelectValue: item.symbol,
                                    getSelectValue: getSelectValue || collateralTokenList[0].symbol
                                    // ignoreBalance: true
                                  },
                                  true
                                )
                              ),
                          BigNumber(item.price)
                            .times(
                              this.maxRepayAmountFilter(
                                {
                                  repaySelectValue: item.symbol,
                                  getSelectValue: getSelectValue || collateralTokenList[0].symbol
                                  // ignoreBalance: true
                                },
                                true
                              )
                            )
                            .lt(0.01)
                            ? 18
                            : 2,
                          { cutZero: true, needDolar: true }
                        )}
                        {/* {formatNumber(item.valueUsd, 2, { miniText: 0.01, needDolar: true })} */}
                      </div>
                      <div
                        className="jc-select-amount"
                        title={formatNumber(
                          Object.keys(borrowTokenMap).length <= 0
                            ? '--'
                            : this.maxRepayAmountFilter(
                                {
                                  repaySelectValue: item.symbol,
                                  getSelectValue: getSelectValue || collateralTokenList[0].symbol
                                },
                                true
                              ),
                          BigNumber(
                            this.maxRepayAmountFilter(
                              {
                                repaySelectValue: item.symbol,
                                getSelectValue: getSelectValue || collateralTokenList[0].symbol
                              },
                              true
                            )
                          ).lt(1)
                            ? 18
                            : 2,
                          { cutZero: true }
                        )}
                      >
                        {formatNumber(
                          Object.keys(borrowTokenMap).length <= 0
                            ? '--'
                            : this.maxRepayAmountFilter(
                                {
                                  repaySelectValue: item.symbol,
                                  getSelectValue: getSelectValue || collateralTokenList[0].symbol
                                },
                                true
                              ),
                          BigNumber(
                            this.maxRepayAmountFilter(
                              {
                                repaySelectValue: item.symbol,
                                getSelectValue: getSelectValue || collateralTokenList[0].symbol
                              },
                              true
                            )
                          ).lt(1)
                            ? 18
                            : 2,
                          { cutZero: true }
                        )}
                      </div>
                      {/* <div className="jc-select-amount">{formatNumber(item.amount, 2, { miniText: 0.01 })}</div> */}
                    </div>
                  </div>
                </Option>
              ))}
            </Select>
          </div>

          <div className="jc-main flex aic jcsb">
            <div className="flex aic">
              <span className="lc-title">{intl.get('liquidate.liquidate_repay_amount')}</span>
            </div>
            <div className="bs-list flex aic liquidate-max-title">
              {mobile ? (
                <TooltipText
                  overlayClassName="j-tooltip-dropdown ad-right"
                  title={intl.get('liquidate.liquidate_tip7')}
                  placement="top"
                  arrowPointAtCenter
                  // getPopupContainer={() => document.querySelector('.j-liquidate-modal')}
                >
                  <span className="lc-subtitle">{intl.get('liquidate.liquidate_max')}</span>
                </TooltipText>
              ) : (
                <>
                  <span className="lc-subtitle">{intl.get('liquidate.liquidate_max')}</span>
                  <Tooltip
                    overlayClassName="j-tooltip-dropdown"
                    title={intl.get('liquidate.liquidate_tip7')}
                    placement="top"
                    arrowPointAtCenter
                    getPopupContainer={() => document.querySelector('.j-liquidate-modal')}
                  >
                    <span className="j-tooltip-icon"></span>
                  </Tooltip>
                </>
              )}

              <span
                className="jc-amount"
                title={formatNumber(maxRepayAmountLimit, BigNumber(maxRepayAmountLimit).lt(1) ? 18 : 2, {
                  cutZero: true,
                  showNegative: true
                })}
              >
                {formatNumber(maxRepayAmountLimit, BigNumber(maxRepayAmountLimit).lt(1) ? 18 : 2, {
                  cutZero: true,
                  showNegative: true
                })}
                {/* {repaySelectValue
                  ? formatNumber(borrowTokenMap[repaySelectValue]?.amount, 2, { miniText: 0.01 })
                  : '--'}{' '} */}{' '}
                {repaySelectValue}
              </span>
            </div>
          </div>

          <div className={'jc-input pr' + (!BigNumber(repayValue).isNaN() ? ' jc-input-repay' : '')}>
            <Input
              className={'j-input ' + (errMsg ? 'j-error-input' : '')}
              placeholder={intl.get('liquidate.liquidate_enter_repay_amount')}
              allowClear
              addonAfter={
                <>
                  <span className="j-input-token">{repaySelectValue}</span>

                  <span
                    className="j-max pointer"
                    onClick={() => {
                      this.clickMax();
                    }}
                  >
                    {intl.get('v2.max')}
                  </span>
                </>
              }
              value={addThousandSeparators(repayValue)}
              onChange={e => {
                this.repayChange(removeThousandSeparators(e.target.value));
                if (e.type === 'click') {
                  // clear icon is clicked
                  window.gtag('event', 'click', {
                    'event_category': 'liquidate',
                    'event_label': 'liquidate_liquidatepop_click_inputClose'
                  });
                }
              }}
              // disabled={approving ? true : false}
            />
            {errMsg && (
              <div className="j-error-tip">
                <span className="j-error-img"></span>
                <div>{errMsg}</div>
              </div>
            )}

            <div className="jc-input-value">
              {formatNumber(
                BigNumber(repayValue).times(repayPrice),
                BigNumber(BigNumber(repayValue).times(repayPrice)).lt(0.01) ? 18 : 2,
                { cutZero: true, needDolar: true }
              )}
            </div>
          </div>

          <div className="jc-tips flex aic jcsb">
            <div className="flex aic">
              {mobile ? (
                <TooltipText
                  overlayClassName="j-tooltip-dropdown"
                  title={intl.get('liquidate.risk.tip1')}
                  // title={intl.get('liquidate.liquidate_tip9')}
                  placement="topRight"
                  arrowPointAtCenter
                  getPopupContainer={() => document.querySelector('.j-liquidate-modal')}
                >
                  <span className="lc-subtitle can-get">{intl.get('liquidate.risk.can_get')}</span>
                  {/* <span className="lc-subtitle">{intl.get('liquidate.liquidate_tip8')}</span> */}
                </TooltipText>
              ) : (
                <>
                  <span className="lc-subtitle can-get">{intl.get('liquidate.risk.can_get')}</span>
                  {/* <span className="lc-subtitle">{intl.get('liquidate.liquidate_tip8')}</span> */}
                  <Tooltip
                    overlayClassName="j-tooltip-dropdown"
                    title={intl.get('liquidate.risk.tip1')}
                    // title={intl.get('liquidate.liquidate_tip9')}
                    placement="top"
                    arrowPointAtCenter
                    getPopupContainer={() => document.querySelector('.j-liquidate-modal')}
                  >
                    <span className="j-tooltip-icon ml-8"></span>
                  </Tooltip>
                </>
              )}
            </div>
            <div className="">
              <div
                className="jc-token"
                title={
                  BigNumber(repayValue).isNaN()
                    ? '--'
                    : formatNumber(totalGetAmount, BigNumber(totalGetAmount).lt(1) ? 18 : 2, { cutZero: true }) +
                      ` ${getSelectValue}`
                }
              >
                {BigNumber(repayValue).isNaN()
                  ? '--'
                  : formatNumber(totalGetAmount, BigNumber(totalGetAmount).lt(1) ? 18 : 2, { cutZero: true }) +
                    ` ${getSelectValue}`}
              </div>
              <div
                className="jc-value"
                title={
                  BigNumber(repayValue).isNaN()
                    ? '--'
                    : `$` + formatNumber(totalGetUsd, BigNumber(totalGetUsd).lt(0.01) ? 18 : 2, { cutZero: true })
                }
              >
                {' '}
                {BigNumber(repayValue).isNaN()
                  ? '--'
                  : `~ $` + formatNumber(totalGetUsd, BigNumber(totalGetUsd).lt(0.01) ? 18 : 2, { cutZero: true })}
              </div>
              <Tooltip
                overlayClassName="j-tooltip-dropdown"
                title={intl.get('liquidate.liquidate_reward', {
                  amount: BigNumber(repayValue).isNaN()
                    ? '--'
                    : formatNumber(benefitAmount, BigNumber(benefitAmount).lt(1) ? 18 : 2, { cutZero: true }),
                  symbol: getSelectValue
                })}
                placement="bottom"
                arrowPointAtCenter
                getPopupContainer={() => document.querySelector('.j-liquidate-modal')}
              >
                <div className="liquidate-reward">
                  {intl.get('liquidate.liquidate_reward', {
                    amount: BigNumber(repayValue).isNaN()
                      ? '--'
                      : formatNumber(benefitAmount, BigNumber(benefitAmount).lt(1) ? 18 : 2, { cutZero: true }),
                    symbol: getSelectValue
                  })}
                </div>
              </Tooltip>
            </div>
          </div>

          {/* <div className="jc-tips flex aic jcsb">
            <div className="flex aic">
              <span className="lc-subtitle">{intl.get('liquidate.risk.tip2')}</span>
            </div>
            <div className="">
              <div
                className="jc-token"
                title={
                  BigNumber(repayValue).isNaN()
                    ? '--'
                    : formatNumber(benefitAmount, BigNumber(benefitAmount).lt(1) ? 18 : 2, { cutZero: true }) +
                    ` ${getSelectValue}`
                }
              >
                {BigNumber(repayValue).isNaN()
                  ? '--'
                  : formatNumber(benefitAmount, BigNumber(benefitAmount).lt(1) ? 18 : 2, { cutZero: true }) +
                  ` ${getSelectValue}`}
              </div>
              <div
                className="jc-value"
                title={
                  BigNumber(repayValue).isNaN()
                    ? '--'
                    : `$` + formatNumber(benefitUsd, BigNumber(benefitUsd).lt(0.01) ? 18 : 2, { cutZero: true })
                }
              >
                {' '}
                {BigNumber(repayValue).isNaN()
                  ? '--'
                  : `$` + formatNumber(benefitUsd, BigNumber(benefitUsd).lt(0.01) ? 18 : 2, { cutZero: true })}
              </div>
            </div>
          </div> */}

          {/* <div className="jc-warning">
            <em></em>
            {intl.get(['jETH'].includes(getSelectValue) ? 'risk_tip.liquidate_ethold' : 'liquidate.liquidate_tip12')}
          </div> */}

          <div className="liquidate-tips">
            <div className="liquidate-tip">{intl.get('liquidate.modal_tip1')}</div>
          </div>

          {BigNumber(this.props.dataInfo.risk).lt(1) ? (
            <Tooltip
              overlayClassName="j-tooltip-dropdown"
              title={intl.get('liquidate.can_not_liquidate_tip')}
              placement="top"
              arrowPointAtCenter
            >
              <button className="j-large-btn j-supply disabled">{intl.get('liquidate.liquidate_submit')}</button>
            </Tooltip>
          ) : approving ? (
            <button className="j-large-btn j-supply j-signing" disabled>
              {intl.get('v2.sign_in_wallet')}
              <span className="siging-icon"></span>
            </button>
          ) : (isLessThanAllowance && BigNumber(balanceMap[repaySelectValue]?.allowance).gt(0)) || hasApproved ? (
            <button
              className="j-large-btn j-supply"
              disabled={
                errMsg ||
                BigNumber(repayValue).isNaN() ||
                BigNumber(repayValue).eq(0) ||
                BigNumber(this.props.dataInfo.risk).lt(1)
              }
              onClick={() => this.submit()}
            >
              {declined && transType === 'liquidate'
                ? intl.get('liquidate.liquidate_submit_again')
                : intl.get('liquidate.liquidate_submit')}
            </button>
          ) : (
            <button
              className="j-large-btn j-supply"
              disabled={
                errMsg ||
                BigNumber(repayValue).isNaN() ||
                BigNumber(repayValue).eq(0) ||
                BigNumber(this.props.dataInfo.risk).lt(1)
              }
              onClick={() => this.approve()}
            >
              {intl.getHTML('stake.approve', { token: repaySelectValue })}
            </button>
          )}
          {declined && (transType === 'liquidate' || transType === 'approve') && (
            <div className="j-error-tip wallet-reject">
              <span className="j-error-img"></span>
              <div>{intl.get('v2.reject_in_wallet')}</div>
            </div>
          )}
        </div>
      </Modal>
    );
  }
}

export default LiquidateModal;
