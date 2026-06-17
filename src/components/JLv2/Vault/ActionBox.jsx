import React, { useCallback, useState } from 'react';
import { observer } from 'mobx-react';
import intl from 'react-intl-universal';
import { Input, Skeleton } from 'antd';
import Store from '../../../stores';
import { BigNumber, errorMessageTootip } from '../../../utils/helper';
import { formatTokenAmount, formatApyRate } from '../../../utils/formatters';
import { getIconsJLv2 } from '../../../utils/constant';
import { useVaultMiningApy } from '../../../utils/hooks/useMining';
import ApyBreakdownTooltip from '../Common/ApyBreakdownTooltip';
import EarningsBreakdownTooltip from '../Common/EarningsBreakdownTooltip';
import config from '../../../config';
const { tokenDefaultPrecision } = config;

export const ActionBox = observer(() => {
  const { vaultStore, network, lend, dashboardStore } = Store;
  const {
    activeActionTab,
    setActionTab,
    inputAmount,
    setInputAmount,
    executeSupply,
    executeWithdraw,
    isInputAmountValid,
    isActionInProgress,
    vaultDetails,
    walletBalance,
    availableAmount,
    inputError,
    withdrawWithShares,
    hasWarning,
    estimatedFee,
    showFeeSuggestion,
    handleMaxClick,
    estimatedDailyEarnings,
    setReservedFee,
    isLoading
  } = vaultStore;
  const [lang] = useState(window.localStorage.getItem('lang') || intl.options.currentLocale);
  const isSupply = activeActionTab === 'supply';
  const { enabled: miningEnabled, baseApy, miningApy, miningRate } = useVaultMiningApy(vaultDetails?.address);
  const displaySupplyApy = miningEnabled
    ? BigNumber(vaultDetails?.apy || 0)
        .plus(miningApy?.total || 0)
        .toString()
    : vaultDetails?.apy;

  // Estimated daily mining earnings = input/TVL × daily reward pool, with
  // both input and TVL denominated in the vault asset (vaultDetails.tvl is
  // already in asset units). Don't divide by tvlInUsd — that mixes units
  // for non-stablecoin vaults (e.g. on a TRX vault the share would be
  // off by ~1/trxPrice and the USDD reward number ballooned ~3×).
  const inputBn = BigNumber(inputAmount || 0);
  const vaultAsset = vaultDetails?.assetSymbol || '';
  const baseDaily = inputBn.times(baseApy || 0).div(365);
  const tvlAssetBn = BigNumber(vaultDetails?.tvl || 0);
  const userShare = miningEnabled && tvlAssetBn.gt(0) ? inputBn.div(tvlAssetBn) : BigNumber(0);
  const miningUsddDaily = miningEnabled ? userShare.times(miningRate?.usdd || 0) : BigNumber(0);
  const miningTrxDaily = miningEnabled ? userShare.times(miningRate?.trx || 0) : BigNumber(0);

  // Aggregate by token symbol for the outside display (e.g. "X TRX + Y USDD").
  const aggregateTokens = () => {
    const map = new Map();
    const add = (token, amount) => {
      if (!token || amount.lte(0)) return;
      map.set(token, (map.get(token) || BigNumber(0)).plus(amount));
    };
    add(vaultAsset, baseDaily);
    add('USDD', miningUsddDaily);
    add('TRX', miningTrxDaily);
    return Array.from(map.entries()).map(([token, amount]) => ({ token, amount: amount.toString() }));
  };

  // Tooltip ordering per design: non-vault-asset mining tokens first, then
  // base in vault asset, then vault-asset mining tokens.
  const buildTooltipItems = () => {
    const out = [];
    if (vaultAsset !== 'TRX' && miningTrxDaily.gt(0)) {
      out.push({ amount: miningTrxDaily.toString(), token: 'TRX', kind: 'mining' });
    }
    if (vaultAsset !== 'USDD' && miningUsddDaily.gt(0)) {
      out.push({ amount: miningUsddDaily.toString(), token: 'USDD', kind: 'mining' });
    }
    out.push({ amount: baseDaily.toString(), token: vaultAsset, kind: 'base' });
    if (vaultAsset === 'USDD' && miningUsddDaily.gt(0)) {
      out.push({ amount: miningUsddDaily.toString(), token: 'USDD', kind: 'mining' });
    }
    if (vaultAsset === 'TRX' && miningTrxDaily.gt(0)) {
      out.push({ amount: miningTrxDaily.toString(), token: 'TRX', kind: 'mining' });
    }
    return out;
  };

  const aggregatedTokens = aggregateTokens();
  const showMiningEarningsBreakdown = miningEnabled && (miningUsddDaily.gt(0) || miningTrxDaily.gt(0)) && inputBn.gt(0);
  const showConnectModal = useCallback(() => {
    if (lend.serviceInnerStatus === 'disabled') {
      lend.setNoServiceModalAllVisible(true);
    } else {
      network.connectWalletV2();
    }
  }, [lend, network]);

  return (
    <div className={'action-box-panel panel box-vault' + (dashboardStore.isFlashing ? ' is-flashing' : '')}>
      <div className="action-tabs">
        <button onClick={() => setActionTab('supply')} className={isSupply ? 'active' : ''}>
          {intl.get('jlv2.vault.supply_btn')}
        </button>
        <button onClick={() => setActionTab('withdraw')} className={!isSupply ? 'active' : ''}>
          {intl.get('jlv2.vault.withdraw_btn')}
        </button>
      </div>
      {isLoading ? (
        <div className="action-box-skeleton">
          <Skeleton title={false} paragraph={{ rows: 3, width: '100%' }} active />
          <button className={`main-action-btn btn-vault`} disabled>
            {intl.get('jlv2.vault.supply_btn')}
          </button>
        </div>
      ) : (
        <div className="action-box-content">
          <div
            className={'input-section' + (isSupply && showFeeSuggestion && estimatedFee ? ' input-fee-suggestion' : '')}
          >
            <div className={`input-group ${inputError ? 'has-error' : ''} ${hasWarning ? 'has-warning' : ''}`}>
              <div className="input-token">
                <img className="input-token-img" src={getIconsJLv2(vaultDetails?.assetSymbol)} />
                <span className="input-token-name">{vaultDetails?.assetSymbol || '-'}</span>
              </div>
              <Input
                className="j-input box-input"
                placeholder={
                  (isSupply ? intl.get('jlv2.market.balance') : intl.get('jlv2.withdrawable')) +
                  (lang === 'en-US' ? ' ' : '') +
                  (!network?.defaultAccount
                    ? '-'
                    : isSupply
                    ? formatTokenAmount(walletBalance, vaultDetails?.assetSymbol)
                    : formatTokenAmount(availableAmount, vaultDetails?.assetSymbol))
                }
                value={inputAmount}
                onChange={e => setInputAmount(e.target.value)}
                prefix={withdrawWithShares ? '~' : ' '}
                disabled={!network?.defaultAccount || isActionInProgress}
              />
              <div className="input-adornment">
                <button
                  className="max-btn"
                  disabled={!network?.defaultAccount || isActionInProgress}
                  onClick={handleMaxClick}
                >
                  {intl.get('jlv2.market.max')}
                </button>
              </div>
              {inputError
                ? errorMessageTootip(inputError)
                : hasWarning && (
                    <div className="input-tips input-warning-message">
                      {intl.get('jlv2.error.insufficient_liquidity')}
                    </div>
                  )}
            </div>
            {isSupply && !inputError && showFeeSuggestion && estimatedFee && estimatedFee !== '-' && (
              <div className="fee-suggestion">
                {intl.get('jlv2.market.suggest_reserve')}
                {/* <span onClick={setReservedFee}>
                  {' '}
                  {intl.get('jlv2.market.reserve')} {formatTokenAmount(estimatedFee)} TRX{' '}
                  {intl.get('jlv2.market.reserve_fee')}
                </span> */}
              </div>
            )}
          </div>

          <div className="dynamic-info">
            <div className="info-row">
              <span>{intl.get('jlv2.vault.supply_apy')}</span>
              <span>
                {!miningEnabled && vaultDetails?.tags?.includes('fire') && <span class="fire-v2-small mr-4"></span>}
                {vaultDetails?.apy ? formatApyRate(BigNumber(displaySupplyApy)) : '-'}
                {miningEnabled && (
                  <ApyBreakdownTooltip baseApy={baseApy} miningApy={miningApy} iconClassName="fire-v2-small" />
                )}
              </span>
            </div>
            {isSupply && (
              <div className="info-row">
                <span>{intl.get('jlv2.vault.daily_earning')}</span>
                <span className="flex aic">
                  {network?.defaultAccount && BigNumber(inputAmount)?.gte(0) ? (
                    showMiningEarningsBreakdown ? (
                      <>
                        {aggregatedTokens.map((t, i) => (
                          <React.Fragment key={t.token}>
                            {i > 0 && ' + '}
                            {formatTokenAmount(t.amount, t.token)}
                          </React.Fragment>
                        ))}
                        <EarningsBreakdownTooltip items={buildTooltipItems()} />
                      </>
                    ) : (
                      formatTokenAmount(estimatedDailyEarnings, vaultDetails?.assetSymbol)
                    )
                  ) : (
                    '-'
                  )}
                </span>
              </div>
            )}
          </div>

          <button
            className={`main-action-btn btn-vault ${isInputAmountValid || !network?.defaultAccount ? 'active' : ''}`}
            onClick={
              !network?.defaultAccount
                ? showConnectModal
                : network.isRightChain === 0
                ? network.changeChain
                : isSupply
                ? executeSupply
                : executeWithdraw
            }
            disabled={network?.defaultAccount && (!isInputAmountValid || isActionInProgress)}
          >
            {!network?.defaultAccount
              ? intl.get('navi.wallet_linkbtn')
              : isActionInProgress
              ? intl.get('jlv2.market.confirming') || 'Confirming...'
              : isSupply
              ? intl.get('jlv2.vault.supply_btn')
              : intl.get('jlv2.vault.withdraw_btn')}
          </button>
        </div>
      )}
    </div>
  );
});
