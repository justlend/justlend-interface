import React, { useCallback, useState } from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react';
import { Tooltip, Input } from 'antd';
import isMobile from 'ismobilejs';
import Store from '../../../stores';
import { formatTokenAmount, formatFiatValue, formatApyRate } from '../../../utils/formatters';
import { BigNumber, errorMessageTootip } from '../../../utils/helper';
import { getIconsJLv2 } from '../../../utils/constant';
import config from '../../../config';
const { tokenDefaultPrecision } = config;
const mobile = isMobile(window.navigator).any;

const LtvProgressBar = observer(() => {
  const { marketV2: marketStore } = Store;
  const { myPosition, safePercent, collateralInputUsdValue, borrowLimitUSD } = marketStore;
  if (!myPosition) return null;

  let collateralRisk = 0;
  if (BigNumber(collateralInputUsdValue).gt(0)) {
    collateralRisk = BigNumber(collateralInputUsdValue)
      .div(BigNumber(collateralInputUsdValue).plus(myPosition.collateralUsd))
      .times(100)
      .toString();
  }

  return (
    <div className="ltv-bar-container">
      <div className="ltv-bar-labels">
        <div>
          {intl.get('jlv2.market.borrowing')}
          <Tooltip
            overlayClassName="j-tooltip-dropdown"
            title={formatFiatValue(myPosition.borrowUsd)}
            placement="top"
            arrowPointAtCenter
            trigger={mobile ? ['click'] : ['hover']}
            getPopupContainer={triggerNode => triggerNode.parentNode}
          >
            <span>{formatFiatValue(myPosition.borrowUsd)}</span>
          </Tooltip>
        </div>
        <div>
          {intl.get('jlv2.market.borrow_limit')}{' '}
          <Tooltip
            overlayClassName="j-tooltip-dropdown"
            title={formatFiatValue(borrowLimitUSD)}
            placement="top"
            arrowPointAtCenter
            trigger={mobile ? ['click'] : ['hover']}
            getPopupContainer={triggerNode => triggerNode.parentNode}
          >
            <span>{formatFiatValue(borrowLimitUSD)}</span>
          </Tooltip>
        </div>
      </div>
      <div className="ltv-bar-track">
        <div className="ltv-bar-fill grey" style={{ width: `${collateralRisk}%` }}></div>
        <div
          className={
            'ltv-bar-fill' + (safePercent >= 60 && safePercent < 80 ? ' yellow' : safePercent >= 80 ? ' red' : '')
          }
          style={{ width: `${BigNumber(safePercent).isNaN() ? 0 : safePercent}%` }}
        ></div>
        <div className="ltv-bar-marker" style={{ left: '80%' }}></div>
      </div>
    </div>
  );
});

export const ActionBox = observer(() => {
  const { marketV2: marketStore, system, network, lend, dashboardStore } = Store;
  const {
    activeActionTab,
    setActionTab,
    isActionInProgress,
    borrowInputAmount,
    setBorrowInput,
    borrowInputError,
    borrowWarningMsg,
    borrowInputUsdValue,
    collateralInputAmount,
    setCollateralInput,
    collateralInputError,
    collateralInputUsdValue,
    repayInputAmount,
    setRepayInput,
    repayInputError,
    redeemInputAmount,
    setRedeemInput,
    redeemWarningMsg,
    redeemInputError,
    actionButtonText,
    executeAction,
    walletBalances,
    availableToBorrow,
    myPosition,
    marketDetails,
    handleBorrowMaxClick,
    handleCollateralMaxClick,
    handleRedeemMaxClick,
    handleRepayMaxClick,
    showFeeSuggestionForCollateral,
    showFeeSuggestionForRepay,
    estimatedFeeForCollateral,
    estimatedFeeForRepay,
    safePercent,
    estimatedDailyInterest,
    setCollateralReservedFee,
    setRepayReservedFee,
    repayInputUsdValue,
    withdrawInputUsdValue,
    userBorrowMaxAmount,
    userRedeemMaxAmount,
    repayWithShares
  } = marketStore;
  const [lang] = useState(window.localStorage.getItem('lang') || intl.options.currentLocale);

  const { transactionStateV2 } = system;
  const { defaultAccount } = network;
  const isCollateral = activeActionTab === 'borrow_collateral';
  const showConnectModal = useCallback(() => {
    if (lend.serviceInnerStatus === 'disabled') {
      lend.setNoServiceModalAllVisible(true);
    } else {
      network.connectWalletV2();
    }
  }, [lend, network]);

  // --- Tab: Borrow / Collateral ---
  const renderBorrowCollateralTab = () => {
    const userBorrowedAmount = myPosition ? new BigNumber(myPosition.borrowAmount || 0) : new BigNumber(0);
    const minBorrowBN = new BigNumber(marketDetails?.minLoanValue || 0);
    const liquidity = new BigNumber(marketDetails?.liquidity || 0);
    const liquidityTipVisible = liquidity.plus(userBorrowedAmount).lt(minBorrowBN) || liquidity.eq(0);
    const isBorrowDisabled =
      // liquidityTipVisible || !BigNumber(availableToBorrow).gt(0) || !BigNumber(userBorrowMaxAmount).gt(0);
      liquidityTipVisible || !BigNumber(availableToBorrow).gt(0);
    let availableDisplay = availableToBorrow;
    if (BigNumber(userBorrowMaxAmount).lt(availableToBorrow)) availableDisplay = userBorrowMaxAmount;
    if (liquidityTipVisible) availableDisplay = '-';

    return (
      <>
        <div className="input-section">
          <div className="section-label">
            <span className="label-left">
              {intl.get('jlv2.market.borrow_borrow_token')} {marketDetails?.borrowSymbol}
            </span>
            <Tooltip
              overlayClassName="j-tooltip-dropdown"
              title={formatFiatValue(borrowInputUsdValue)}
              placement="top"
              arrowPointAtCenter
              trigger={mobile ? ['click'] : ['hover']}
              getPopupContainer={triggerNode => triggerNode.parentNode}
            >
              <span className="label-right">~ {formatFiatValue(borrowInputUsdValue)}</span>
            </Tooltip>
          </div>
          {liquidityTipVisible ? (
            <Tooltip
              overlayClassName="j-tooltip-dropdown"
              title={intl.get('jlv2.error.insufficient_liquidity_short')}
              placement="top"
              arrowPointAtCenter
              trigger={mobile ? ['click'] : ['hover']}
              getPopupContainer={triggerNode => triggerNode.parentNode}
            >
              <div className={`input-group ${borrowInputError ? 'has-error' : borrowWarningMsg ? 'has-warning' : ''}`}>
                <div className="input-token">
                  <img className="input-token-img" src={getIconsJLv2(marketDetails?.borrowSymbol)} />
                  <span className="input-token-name">{marketDetails?.borrowSymbol || '-'}</span>
                </div>
                <div className="j-input box-input input-placeholder">{intl.get('jlv2.borrowable') + ' -'}</div>
                <div className="input-adornment">
                  <div className="max-btn safe-max disabled">{intl.get('jlv2.market.safe_max')}</div>
                </div>
              </div>
            </Tooltip>
          ) : (
            <div className={`input-group ${borrowInputError ? 'has-error' : borrowWarningMsg ? 'has-warning' : ''}`}>
              <div className="input-token">
                <img className="input-token-img" src={getIconsJLv2(marketDetails?.borrowSymbol)} />
                <span className="input-token-name">{marketDetails?.borrowSymbol || '-'}</span>
              </div>
              <Input
                className="j-input box-input"
                placeholder={
                  intl.get('jlv2.borrowable') +
                  (lang === 'en-US' ? ' ' : '') +
                  formatTokenAmount(availableDisplay, marketDetails?.borrowSymbol)
                }
                value={borrowInputAmount}
                onChange={e => setBorrowInput(e.target.value)}
                disabled={isBorrowDisabled || isActionInProgress || !defaultAccount || safePercent === '-'}
              />
              <div className="input-adornment">
                <button
                  className="max-btn safe-max"
                  disabled={isBorrowDisabled || isActionInProgress || !defaultAccount || safePercent === '-'}
                  onClick={handleBorrowMaxClick}
                >
                  {intl.get('jlv2.market.safe_max')}
                </button>
              </div>
              {borrowInputError
                ? errorMessageTootip(borrowInputError)
                : borrowWarningMsg && <div className="input-tips input-warning-message">{borrowWarningMsg}</div>}
            </div>
          )}
        </div>

        <div className="input-section">
          <div className="section-label">
            <span className="label-left">
              {intl.get('jlv2.market.collateralize_token')} {marketDetails?.collateralSymbol}
            </span>
            <Tooltip
              overlayClassName="j-tooltip-dropdown"
              title={formatFiatValue(collateralInputUsdValue)}
              placement="top"
              arrowPointAtCenter
              trigger={mobile ? ['click'] : ['hover']}
              getPopupContainer={triggerNode => triggerNode.parentNode}
            >
              <span className="label-right">~ {formatFiatValue(collateralInputUsdValue)}</span>
            </Tooltip>
          </div>
          <div className={`input-group ${collateralInputError ? 'has-error' : ''}`}>
            <div className="input-token">
              <img className="input-token-img" src={getIconsJLv2(marketDetails?.collateralSymbol)} />
              <span className="input-token-name">{marketDetails?.collateralSymbol || '-'}</span>
            </div>
            <Input
              className="j-input box-input"
              placeholder={
                intl.get('jlv2.market.balance') +
                (lang === 'en-US' ? ' ' : '') +
                formatTokenAmount(walletBalances.collateralToken, marketDetails?.collateralSymbol)
              }
              value={collateralInputAmount}
              onChange={e => setCollateralInput(e.target.value)}
              disabled={isActionInProgress || !defaultAccount || safePercent === '-'}
            />
            <div className="input-adornment">
              <button
                className="max-btn"
                onClick={handleCollateralMaxClick}
                disabled={isActionInProgress || !defaultAccount || safePercent === '-'}
              >
                {intl.get('jlv2.market.max')}
              </button>
            </div>

            {collateralInputError && errorMessageTootip(collateralInputError)}
          </div>
          {!collateralInputError && isCollateral && showFeeSuggestionForCollateral && estimatedFeeForCollateral && (
            <div className="fee-suggestion">
              {intl.get('jlv2.market.suggest_reserve')}
              {/* <span onClick={setCollateralReservedFee}>
                {' '}
                {intl.get('jlv2.market.reserve')} {formatTokenAmount(estimatedFeeForCollateral)} TRX{' '}
                {intl.get('jlv2.market.reserve_fee')}
              </span> */}
            </div>
          )}
        </div>
      </>
    );
  };

  // --- Tab: Repay / Redeem ---
  const renderRepayRedeemTab = () => (
    <>
      <div className="input-section">
        <div className="section-label">
          <span className="label-left">
            {intl.get('jlv2.market.repay_repay_token')} {marketDetails?.borrowSymbol}
          </span>
          <Tooltip
            overlayClassName="j-tooltip-dropdown"
            title={formatFiatValue(repayInputUsdValue)}
            placement="top"
            arrowPointAtCenter
            trigger={mobile ? ['click'] : ['hover']}
            getPopupContainer={triggerNode => triggerNode.parentNode}
          >
            <span className="label-right">~ {formatFiatValue(repayInputUsdValue)}</span>
          </Tooltip>
        </div>
        <div className={`input-group ${repayInputError ? 'has-error' : ''}`}>
          <div className="input-token">
            <img className="input-token-img" src={getIconsJLv2(marketDetails?.borrowSymbol)} />
            <span className="input-token-name">{marketDetails?.borrowSymbol || '-'}</span>
          </div>
          <Input
            className="j-input box-input"
            placeholder={
              intl.get('jlv2.market.balance') +
              (lang === 'en-US' ? ' ' : '') +
              formatTokenAmount(walletBalances.loanToken, marketDetails?.borrowSymbol)
            }
            value={repayInputAmount}
            onChange={e => setRepayInput(e.target.value)}
            prefix={repayWithShares ? '~' : ' '}
            disabled={isActionInProgress || !defaultAccount || safePercent === '-'}
          />
          <div className="input-adornment">
            <button
              className="max-btn"
              onClick={handleRepayMaxClick}
              disabled={isActionInProgress || !defaultAccount || safePercent === '-'}
            >
              {intl.get('jlv2.market.max')}
            </button>
          </div>
          {repayInputError && errorMessageTootip(repayInputError)}
        </div>
        {!isCollateral && !repayInputError && showFeeSuggestionForRepay && estimatedFeeForRepay && (
          <div className="fee-suggestion">
            {intl.get('jlv2.market.suggest_reserve')}
            {/* <span onClick={setRepayReservedFee}>
              {' '}
              {intl.get('jlv2.market.reserve')} {formatTokenAmount(estimatedFeeForRepay)} TRX{' '}
              {intl.get('jlv2.market.reserve_fee')}
            </span> */}
          </div>
        )}
      </div>

      <div className="input-section">
        <div className="section-label">
          <span className="label-left">
            {intl.get('jlv2.market.redeem_redeem_token')} {marketDetails?.collateralSymbol}
          </span>
          <Tooltip
            overlayClassName="j-tooltip-dropdown"
            title={formatFiatValue(withdrawInputUsdValue)}
            placement="top"
            arrowPointAtCenter
            trigger={mobile ? ['click'] : ['hover']}
            getPopupContainer={triggerNode => triggerNode.parentNode}
          >
            <span className="label-right">~ {formatFiatValue(withdrawInputUsdValue)}</span>
          </Tooltip>
        </div>
        <div className={`input-group ${redeemInputError ? 'has-error' : redeemWarningMsg ? 'has-warning' : ''}`}>
          {/* <div className="input-group"> */}
          <div className="input-token">
            <img className="input-token-img" src={getIconsJLv2(marketDetails?.collateralSymbol)} />
            <span className="input-token-name">{marketDetails?.collateralSymbol || '-'}</span>
          </div>
          <Input
            placeholder={
              intl.get('jlv2.reddemable') +
              ' ' +
              formatTokenAmount(userRedeemMaxAmount, marketDetails?.collateralSymbol)
            }
            value={redeemInputAmount}
            onChange={e => setRedeemInput(e.target.value)}
            disabled={isActionInProgress || !defaultAccount || safePercent === '-'}
          />
          <div className="input-adornment">
            <button
              className="max-btn safe-max"
              disabled={isActionInProgress || !defaultAccount || safePercent === '-'}
              onClick={handleRedeemMaxClick}
            >
              {intl.get('jlv2.market.safe_max')}
            </button>
          </div>
          {redeemInputError
            ? errorMessageTootip(redeemInputError)
            : redeemWarningMsg && <div className="input-tips input-warning-message">{redeemWarningMsg}</div>}
        </div>
      </div>
    </>
  );

  const isButtonActive =
    (!BigNumber(borrowInputAmount).gt(0) && BigNumber(collateralInputAmount).gt(0) && !collateralInputError) ||
    (BigNumber(repayInputAmount).gt(0) && !BigNumber(redeemInputAmount).gt(0) && !repayInputError) ||
    (actionButtonText !== intl.get('jlv2.market.enter_amount') &&
      !borrowInputError &&
      !collateralInputError &&
      !repayInputError &&
      !redeemInputError &&
      safePercent !== '-' &&
      BigNumber(safePercent).lte(99.99));

  return (
    <div className={'panel action-box-panel box-borrow' + (dashboardStore.isFlashing ? ' is-flashing' : '')}>
      <div className="action-tabs">
        <button
          onClick={() => {
            setActionTab('borrow_collateral');
            dashboardStore.flashingEnd();
          }}
          className={activeActionTab === 'borrow_collateral' ? 'active' : ''}
        >
          {intl.get('jlv2.market.borrow_collateral')}
        </button>
        <button
          onClick={() => setActionTab('repay_redeem')}
          className={activeActionTab !== 'borrow_collateral' ? 'active' : ''}
        >
          {intl.get('jlv2.market.repay_redeem')}
        </button>
      </div>
      <div className="action-box-content">
        <div className="tab-content">
          {activeActionTab === 'borrow_collateral' ? renderBorrowCollateralTab() : renderRepayRedeemTab()}
        </div>
        <div className="dynamic-info">
          <LtvProgressBar />
          <div className="info-row">
            <span>
              {intl.get('jlv2.market.risk_level')}
              <Tooltip
                overlayClassName="j-tooltip-dropdown"
                title={intl.get('jlv2.market.to_liquidate')}
                placement="top"
                arrowPointAtCenter
                trigger={mobile ? ['click'] : ['hover']}
                getPopupContainer={triggerNode => triggerNode.parentNode}
              >
                <span className="j-tooltip-icon ml-4"></span>
              </Tooltip>
            </span>
            {BigNumber(safePercent).isNaN() ? (
              '-'
            ) : (
              <span
                className={
                  'healthy' + (safePercent >= 60 && safePercent < 80 ? ' yellow' : safePercent >= 80 ? ' red' : '')
                }
              >
                {formatApyRate(safePercent, true)?.replace('%', '')}{' '}
                {safePercent >= 60 && safePercent < 80
                  ? intl.get('jlv2.market.moderate')
                  : safePercent >= 80
                  ? intl.get('jlv2.market.high')
                  : intl.get('jlv2.market.minimal')}
              </span>
            )}
          </div>
          <div className="info-row">
            <span>{intl.get('jlv2.market.borrow_rate')}</span>
            <span>{marketDetails?.borrowApy ? formatApyRate(BigNumber(marketDetails?.borrowApy)) : '-'}</span>
          </div>
          {activeActionTab === 'borrow_collateral' && (
            <div className="info-row">
              <span>{intl.get('jlv2.market.daily_interest')}</span>
              <span>
                {borrowInputAmount || repayInputAmount
                  ? formatTokenAmount(estimatedDailyInterest, marketDetails?.borrowSymbol)
                  : '-'}
              </span>
            </div>
          )}
        </div>
        <button
          className={`main-action-btn btn-borrow ${isButtonActive ? 'active' : ''}`}
          onClick={
            !defaultAccount ? showConnectModal : network.isRightChain === 0 ? network.changeChain : executeAction
          }
          disabled={defaultAccount && (!isButtonActive || isActionInProgress)}
        >
          {isActionInProgress ? intl.get('jlv2.market.confirming') : actionButtonText}
        </button>
      </div>
    </div>
  );
});
