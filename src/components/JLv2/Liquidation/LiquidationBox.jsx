import React, { useState, useEffect } from 'react';
import { Modal, Tooltip, Button, Input, Drawer } from 'antd';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react';
import isMobile from 'ismobilejs';
import classNames from 'classnames';
import Stores from '../../../stores';
import { BigNumber, numberParser, formatNumberLend } from '../../../utils/helper';
import {
  formatDecimalNumber,
  formatFiatValue,
  formatTokenAmount,
} from '../../../utils/formatters';
import { getIconsJLv2 } from '../../../utils/constant';

import CloseIcon from '../../../assets/images/v2/account/white-close.svg';
import CloseIconWhite from '../../../assets/images/v2/white-theme/modal-close.svg';
import V2Icon from '../../../assets/images/JLv2/v2-icon.svg';
import WarningIcon from '../../../assets/images/JLv2/warning-icon.svg';
import labelTipIcon from '../../../assets/images/JLv2/label-tip-icon.svg';
import labelTipWhiteIcon from '../../../assets/images/JLv2/white-theme/label-tip-icon.svg';
import labelTipHoverIcon from '../../../assets/images/JLv2/label-tip-icon-hover.svg';
import labelTipHoverWhiteIcon from '../../../assets/images/JLv2/white-theme/label-tip-icon-hover.svg';

const LiquidationModal = observer(({ visible, data = {}, onClose = () => { } }) => {
  const [mobile] = useState(isMobile(window.navigator).any);
  const [maxInput, setMaxInput] = useState('');
  const [maxType, setMaxType] = useState('');
  const [errorTip, setErrorTip] = useState('');
  const [isRequest, setIsRequest] = useState(false);
  const [open, setOpen] = useState(false);
  const [suggestTip, setSuggestTip] = useState(false);
  const [calcData, setCalcData] = useState({
    borrowUsd: '-',
    collateralAmount: '-',
    collateralUsd: '-',
    lifUsd: '-',
  });

  const { lend, liquidationV2, network } = Stores;
  const {
    inputAmount, setInputAmount, fetchMarketParams, executeLiquidate, getLoanTokenAmount,
    getTokenBalance, tokenBalance
  } = liquidationV2;

  const isWhite = lend.theme === 'white';

  useEffect(() => {
    if (visible) {
      fetchMarketParams(data.marketId);
      getTokenBalance(data.borrowAddress, data.borrowDecimal);
    } else {
      setInputAmount('');
      setMaxType('');
      setErrorTip('');
      setSuggestTip('');
      setIsRequest(false);
      setOpen(false);
      setCalcData({
        borrowUsd: '-',
        collateralAmount: '-',
        collateralUsd: '-',
        lifUsd: '-',
      })
    }
  }, [visible]);

  // max input = min(all collateral ÷ LIF × Pirce, all borrow, wallet balance)
  useEffect(() => {
    if (visible && tokenBalance) {
      const collateralToBorrowAmount = BigNumber(data.collateralUsd).div(data.lif).div(data.borrowPrice);
      const borrowAmount = BigNumber(data.borrowAmount);
      const walletBalance = tokenBalance;

      if (collateralToBorrowAmount.lt(borrowAmount) && collateralToBorrowAmount.lt(walletBalance)) {
        setMaxInput(collateralToBorrowAmount.decimalPlaces(data.borrowDecimal, BigNumber.ROUND_DOWN));
        setMaxType('collateral');
        console.log('MAX:', '全部抵押品', collateralToBorrowAmount.toString());
      }

      if (borrowAmount.lt(walletBalance) && borrowAmount.lt(collateralToBorrowAmount)) {
        setMaxInput(borrowAmount.decimalPlaces(data.borrowDecimal, BigNumber.ROUND_DOWN));
        setMaxType('borrow');
        console.log('MAX:', '全部债务', borrowAmount.toString());
      }

      if (walletBalance.lt(collateralToBorrowAmount) && walletBalance.lt(borrowAmount)) {
        setMaxInput(walletBalance.decimalPlaces(data.borrowDecimal, BigNumber.ROUND_DOWN));
        setMaxType('balance');
        console.log('MAX:', '钱包余额', walletBalance.toString());
      }
    }
  }, [visible, tokenBalance]);

  const handleInputChange = async (value, decimals = 2) => {
    const { valid, str } = numberParser(value, decimals);

    if (valid) {
      
      if (errorTip && str && BigNumber(str).gt(maxInput)) {
        return;
      }

      setErrorTip('');
      setSuggestTip('');

      setInputAmount(str);
      setCalcData({
        borrowUsd: str ? BigNumber(str).times(data.borrowPrice) : '-',
        collateralAmount: str ? BigNumber(str).times(data.borrowPrice).times(data.lif).div(data.collateralPrice) : '-',
        collateralUsd: str ? BigNumber(str).times(data.borrowPrice).times(data.lif) : '-',
        lifUsd: str ? BigNumber(data.lif).minus(1).times(BigNumber(str).times(data.borrowPrice)) : '-',
      })

      // check input value over max value, show error tip
      if (str && (BigNumber(str).gt(maxInput) || tokenBalance?.eq(0))) {
        setErrorTip(`${maxType}_error`);
      }
    }
  };

  // max = min(all collateral ÷ LIF × Pirce, all borrow, wallet balance)
  const handleMaxInput = () => {
    if (!network.defaultAccount || !tokenBalance) return;

    setInputAmount(maxInput);
    handleInputChange(maxInput, data.borrowDecimal);
  }

  const getSeizedAssets = (amount) => {
    const seizedAssets = BigNumber(amount).times(data.borrowPrice).times(data.lif).div(data.collateralPrice);
    
    const formatSeizedAssets = seizedAssets.decimalPlaces(data.collateralDecimal, BigNumber.ROUND_DOWN);
    return formatSeizedAssets;
  }

  const handleLiquidate = async () => {
    if (isRequest || BigNumber(inputAmount || 0).lte(0) || errorTip || !network.defaultAccount) return;
    
    
    
    
    

    let repaidShares = 0;
    let seizedAssets = 0;
    const isMaxInput = BigNumber(inputAmount).eq(maxInput);
    const walletBalance = tokenBalance;
    let amountToLiquidate = inputAmount;

    if (isMaxInput) {
      console.log('输入的是最大值，开始处理最大值的操作');
      if (maxType === 'collateral') { // rule 1
        seizedAssets = BigNumber(data.collateralAmount);
      } else if (maxType === 'borrow') {
        if (BigNumber(data.borrowAmount).times(1.00001).lt(walletBalance)) { // rule 2.1
          repaidShares = data.borrowShares;
        } else { // rule 2.2
          repaidShares = BigNumber(data.borrowShares).times(0.99999).integerValue(BigNumber.ROUND_DOWN).toString();
        }
      } else if (maxType === 'balance') { // rule 3
        seizedAssets = getSeizedAssets(walletBalance);
      }
    } else {
      seizedAssets = getSeizedAssets(inputAmount);
    }

    console.log('amountToLiquidate', amountToLiquidate.toString(), 'seizedAssets', seizedAssets.toString(), 'repaidShares', repaidShares);

    setIsRequest(true);

    
    if (BigNumber(seizedAssets).gt(0) && !(isMaxInput && maxType === 'collateral')) {
      let loanTokenAmountNeed = await getLoanTokenAmount(seizedAssets, repaidShares);
      const diff = loanTokenAmountNeed ? loanTokenAmountNeed.minus(amountToLiquidate) : BigNumber(0);
      const buffer = BigNumber(2).div(BigNumber(10).pow(data.borrowDecimal));

      if (diff.gt(0) && BigNumber(amountToLiquidate).gt(buffer)) {
        const newSeizedAssets = getSeizedAssets(BigNumber(amountToLiquidate).minus(buffer));
        if (BigNumber(newSeizedAssets).gt(0)) {
          seizedAssets = newSeizedAssets;
          loanTokenAmountNeed = await getLoanTokenAmount(seizedAssets, repaidShares);
        }
      }
    }

    
    if (BigNumber(seizedAssets).lte(0) && !repaidShares) {
      setErrorTip('amount_error');
      setIsRequest(false);
      return;
    }

    try {
      setIsRequest(true);
      await executeLiquidate(amountToLiquidate, seizedAssets, repaidShares);
      setIsRequest(false);
    } catch (error) {
      setIsRequest(false);
    }
  }


  const labelTipIconRender = () => {
    return (
      <img
        src={isWhite ? labelTipWhiteIcon : labelTipIcon}
        onMouseOver={e => (e.currentTarget.src = isWhite ? labelTipHoverWhiteIcon : labelTipHoverIcon)}
        onMouseOut={e => (e.currentTarget.src = isWhite ? labelTipWhiteIcon : labelTipIcon)}
        alt='warning icon'
        className="tip-icon wtrx-tip-icon ml-4"
      />
    )
  }

  const mainContentRender = () => {
    if (visible) {
      const error_tips = {
        'collateral_error': intl.get('jlv2.liquidation.collateral_not_enough'),
        'borrow_error': intl.get('jlv2.liquidation.over_max_debt', { amount: formatNumberLend(data?.borrowAmount, data?.borrowDecimal), token: data?.borrowSymbol }),
        'balance_error': intl.get('jlv2.liquidation.wallet_balance_not_enough'),
        'amount_error': intl.get('jlv2.liquidation.amount_not_enough'),
      }
      return (
        <div className="liquidation-container">
          <div className="liq-section">
            <div className="liq-row">
              <span className="label">{intl.get('jlv2.liquidation.borrower_address')}</span>
              <div className="value-wrap">
                <span className="value address">{data.userAddress}</span>
              </div>
            </div>
            <div className="liq-data-group">
              <div className="liq-row sub">
                <span className="label">{intl.get('jlv2.liquidation.table_debt')}</span>
                <div className="value-wrap">
                  <div className="main-val">{formatTokenAmount(data.borrowAmount, data.borrowSymbol)}</div>
                  <div className="sub-val">{formatFiatValue(data.borrowUsd)}</div>
                </div>
              </div>
              <div className="liq-row sub">
                <span className="label">{intl.get('jlv2.liquidation.table_colleral')}</span>
                <div className="value-wrap">
                  <div className="main-val">{formatTokenAmount(data.collateralAmount, data.collateralSymbol)}</div>
                  <div className="sub-val">{formatFiatValue(data.collateralUsd)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="liq-divider" />

          <div className="liq-section">
            <div className="liq-row">
              <span className="label">{intl.get('jlv2.liquidation.repay_debt_amount')}</span>
              <div className="value-wrap">
                <span className="value wallet">
                  <span>{intl.get('jlv2.liquidation.wallet_balance')}: </span>
                  <span className={classNames({ 'balance-error': errorTip === 'balance_error' })}>
                    {formatTokenAmount(tokenBalance, data.borrowSymbol)}
                  </span>
                  {
                    data.borrowSymbol === 'WTRX' ? (
                      <a className="exchange-to-wtrx jl-links" href="https://just.tronscan.org/#/trans" target="exchangeToWTRX">
                        {intl.get('jlv2.liquidation.exchange')}
                      </a>
                    ) : null
                  }
                </span>
              </div>
            </div>
            <div className="liq-input-container">
              <div className={classNames('liq-input-box', { 'liq-input-error': !!errorTip, 'open': !!open })}>
                <div className="token-info">
                  <img src={getIconsJLv2(data.borrowSymbol)} alt="usdt" className="token-icon" />
                  <Input
                    value={inputAmount}
                    onChange={e => handleInputChange(e.target.value, data.borrowDecimal)}
                    onBlur={() => inputAmount && setInputAmount(BigNumber(inputAmount).toString())}
                    disabled={!tokenBalance}
                    className="liq-input"
                    placeholder={intl.get("jlv2.market.enter_amount")}
                  />
                </div>
                <div className="input-right">
                  <span className="currency-unit">{data.borrowSymbol}</span>
                  <div className="max-btn" onClick={handleMaxInput}>MAX</div>
                </div>
              </div>
              {inputAmount && errorTip && <div className="error-tips">{error_tips[errorTip]}</div>}
              {inputAmount && !errorTip && suggestTip && <div className="suggest-tips">{suggestTip}</div>}
            </div>
          </div>

          <div className="liq-detail-rows">
            <div className="liq-row detail">
              <span className="label">{intl.get('jlv2.liquidation.withdraw_amount')}</span>
              <div className="value-wrap">
                <div className="main-val">{formatTokenAmount(inputAmount || '-', data.borrowSymbol)}</div>
                <div className="sub-val">{formatFiatValue(calcData.borrowUsd)}</div>
              </div>
            </div>
            <div className="liq-row detail">
              <span className="label">
                {intl.get('jlv2.liquidation.collateral_receive')}
                {data.collateralSymbol === 'WTRX' && <Tooltip
                  overlayClassName="j-tooltip-dropdown j-disclaimer"
                  title={() => {
                    return (
                      <>
                        {intl.get('jlv2.liquidation.exchange_to_wtrx')}
                        <a className="exchange-to-wtrx jl-links" href="https://just.tronscan.org/#/trans" target="exchangeToWTRX">
                          {intl.get('jlv2.liquidation.to_exchange')}
                        </a>
                        {lend.lang === 'en-US' ? '.' : ''}
                      </>
                    )
                  }}
                  placement="topLeft"
                  arrowPointAtCenter
                  trigger={mobile ? ['click'] : ['hover']}
                  getPopupContainer={triggerNode => triggerNode.parentNode}
                >
                  {labelTipIconRender()}
                </Tooltip>}
              </span>
              <div className="value-wrap">
                <div className="main-val">{formatTokenAmount(calcData.collateralAmount, data.collateralSymbol)}</div>
                <div className="sub-val">{formatFiatValue(calcData.collateralUsd)}</div>
              </div>
            </div>
            <div className="liq-row detail">
              <span className="label">
                {intl.get('jlv2.liquidation.liquidation_reward')}
                <Tooltip
                  overlayClassName="j-tooltip-dropdown j-disclaimer"
                  title={intl.get('jlv2.liquidation.table_lif_desc')}
                  placement="topLeft"
                  arrowPointAtCenter
                  trigger={mobile ? ['click'] : ['hover']}
                  getPopupContainer={triggerNode => triggerNode.parentNode}
                >
                  {labelTipIconRender()}
                </Tooltip>
              </span>
              <div className="value-wrap">
                <div className="main-val green">{formatDecimalNumber(data.lif, 4)}</div>
                <div className="sub-val">
                  {intl.getHTML('jlv2.liquidation.liquidation_reward_value', {
                    value: formatFiatValue(calcData.lifUsd),
                    rate: formatDecimalNumber(BigNumber(data.lif).minus(1), 4)
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="liq-divider" />

          <div className="liq-warning">
            <img src={WarningIcon} alt='warning icon' className="tip-icon" />
            <div className="warning-text">
              {intl.get('jlv2.liquidation.liquidation_warning')}
            </div>
          </div>

          {
            !data.allowPublic || BigNumber(data.risk).lt(100) ? (
              <Tooltip
                trigger={['hover']}
                overlayClassName="j-tooltip-dropdown"
                title={intl.get('jlv2.liquidation.cannot_liquidate')}
                placement="top"
                arrowPointAtCenter
                zIndex={1077}
              >
                <Button className="liq-submit-btn disabled" block>
                  {intl.get('jlv2.liquidation.liquidation_button')}
                </Button>
              </Tooltip>
            ) : (
              <Button
                block
                className={classNames("liq-submit-btn", {
                  "disabled": isRequest || BigNumber(inputAmount || 0).lte(0) || errorTip || !network.defaultAccount
                })}
                loading={isRequest}
                onClick={handleLiquidate}
              >
                {intl.get('jlv2.liquidation.liquidation_button')}
              </Button>
            )
          }
          {
            mobile && (!data.allowPublic || BigNumber(data.risk).lt(100)) ? (
              <div className='cannot-liquidate-tip'>{intl.get('jlv2.liquidation.cannot_liquidate')}</div>
            ) : null
          }
        </div>
      )
    }

    return null;
  }

  // use Modal in mobile
  if (mobile) {
    return (
      <Modal
        visible={visible}
        footer={null}
        centered
        title={
          <div className="liquidation-header">
            <span className="liquidation-title">{intl.get('jlv2.liquidation.title')}</span>
            <img className='v2-icon' src={V2Icon} alt="v2 icon" />
          </div>
        }
        zIndex={1081}
        maskClosable={false}
        closeIcon={<img alt="" src={isWhite ? CloseIconWhite : CloseIcon} />}
        onCancel={onClose}
        wrapClassName={`liquidationv2-modal ${lend.theme}`}
      >
        {mainContentRender()}
      </Modal>
    )
  }

  // in PC, use Drawer
  return (
    <Drawer
      visible={visible}
      footer={null}
      title={
        <div className="liquidation-header">
          <span className="liquidation-title">{intl.get('jlv2.liquidation.title')}</span>
          <img className='v2-icon' src={V2Icon} alt="v2 icon" />
        </div>
      }
      width={490}
      // maskClosable={false}
      closeIcon={<img alt="" src={isWhite ? CloseIconWhite : CloseIcon} />}
      onClose={onClose}
      className={`liquidationv2-drawer ${lend.theme}`}
    >
      {mainContentRender()}
    </Drawer>
  );
});

export default LiquidationModal;