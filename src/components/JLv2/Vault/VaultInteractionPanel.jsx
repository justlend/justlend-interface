// src/components/Vault/VaultInteractionPanel.jsx
import React from 'react';
import { observer } from 'mobx-react';
import intl from 'react-intl-universal';
import isMobile from 'ismobilejs';
import BigNumber from 'bignumber.js';
import Store from '../../../stores';
import { formatTokenAmount, formatFiatValue, formatApyRate } from '../../../utils/formatters';
import { useVaultMiningApy } from '../../../utils/hooks/useMining';
import ApyBreakdownTooltip from '../Common/ApyBreakdownTooltip';
import EarningsBreakdownTooltip from '../Common/EarningsBreakdownTooltip';

// --- MyPosition ---
export const MyVaultPosition = observer(() => {
  const { vaultStore, network, dashboardStore } = Store;
  const { isConnected } = network;
  const { myPosition, vaultDetails, setActionTab } = vaultStore;
  const { enabled: miningEnabled, baseApy, miningApy, dailyEarnings } = useVaultMiningApy(vaultDetails.address);
  const hasPosition = myPosition && Number(myPosition.depositAmount || 0) > 0;

  const miningTokens = [];
  if (dailyEarnings?.mining) {
    if (Number(dailyEarnings.mining.usdd) > 0) miningTokens.push({ amount: dailyEarnings.mining.usdd, token: 'USDD' });
    if (Number(dailyEarnings.mining.trx) > 0) miningTokens.push({ amount: dailyEarnings.mining.trx, token: 'TRX' });
  }

  // Daily earnings is shown in token units (matches ActionBox below) instead
  // of a USD aggregate, so a USDD vault reads "X USDD" rather than "$X". Base
  // earnings come from /vault/position (dailyInterestAmount, in vault asset);
  // mining tokens come from /index/position. We aggregate by token symbol so
  // a USDD vault with USDD mining shows a single USDD figure, while a vault
  // with cross-token mining (e.g. TRX vault + USDD mining) shows "X TRX + Y USDD".
  const baseAsset = vaultDetails?.assetSymbol || dailyEarnings?.base?.token || '';
  const baseAmount = dailyEarnings?.base?.amount ?? myPosition?.dailyInterestAmount ?? '0';
  const earningsByToken = new Map();
  const addTokenAmount = (token, amount) => {
    if (!token) return;
    const bn = new BigNumber(amount || 0);
    if (!bn.gt(0)) return;
    earningsByToken.set(token, (earningsByToken.get(token) || new BigNumber(0)).plus(bn));
  };
  addTokenAmount(baseAsset, baseAmount);
  if (miningEnabled) {
    for (const t of miningTokens) addTokenAmount(t.token, t.amount);
  }
  const dailyEarningsTokens = Array.from(earningsByToken.entries()).map(([token, amount]) => ({
    token,
    amount: amount.toString()
  }));

  const totalPositionApy = miningEnabled
    ? new BigNumber(myPosition?.apy || 0).plus(miningApy?.total || 0).toString()
    : myPosition?.apy;

  const handleToWithdraw = () => {
    dashboardStore.flashingEnd();
    setActionTab('withdraw');
    dashboardStore.flashingAnimation();

    if (isMobile(window.navigator).any) {
      const actionBox = document.getElementById('vaultAction');
      if (actionBox) {
        const elementRect = actionBox.getBoundingClientRect();
        const bodyRect = document.body.getBoundingClientRect();
        const distance = elementRect.top - bodyRect.top;

        window.scrollTo({
          top: distance - 100,
          left: 0,
          behavior: 'smooth'
        });
      }
    }
  };

  if (!isConnected || !hasPosition) return null;

  return (
    <div className="my-position-panel panel-v2">
      <div className="panel-title">
        {intl.get('jlv2.vault.my_position')}{' '}
        {vaultDetails.name ? (
          <span className="panel-subtitle">
            {intl.getHTML('jlv2.vault.vault_name', { vaultname: vaultDetails.name })}
          </span>
        ) : null}
      </div>
      <div className="position-section">
        <div className="position-item">
          <div className="label">{intl.get('jlv2.vault.supplied')}</div>
          <div className="amount-token flex-center">
            {formatTokenAmount(myPosition.depositAmount, vaultDetails?.assetSymbol)}
            <div className="btn-v2 btn-withdraw" onClick={handleToWithdraw}>
              {intl.get('jlv2.vault.withdraw')}
            </div>
          </div>
          <div className="amount-usd">≈ {formatFiatValue(myPosition.depositUsd)}</div>
        </div>
        <div className="position-item">
          <div className="label">{intl.get('jlv2.vault.daily_earning')}</div>
          <div className="amount-token">
            {dailyEarningsTokens.length > 0
              ? dailyEarningsTokens.map((t, i) => (
                  <React.Fragment key={t.token}>
                    {i > 0 && ' + '}
                    {formatTokenAmount(t.amount, t.token)}
                  </React.Fragment>
                ))
              : formatTokenAmount('0', baseAsset)}
            {miningEnabled && (
              <EarningsBreakdownTooltip
                baseAmount={dailyEarnings?.base?.amount}
                baseToken={dailyEarnings?.base?.token}
                miningTokens={miningTokens}
              />
            )}
          </div>
          <div className="amount-usd">
            {!miningEnabled && vaultDetails?.tags?.includes('fire') && <span class="fire-v2-small mr-4"></span>}
            {intl.get('jlv2.vault.supply_apy2')}: {formatApyRate(totalPositionApy)}
            {miningEnabled && (
              <ApyBreakdownTooltip baseApy={baseApy} miningApy={miningApy} iconClassName="fire-v2-small" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
