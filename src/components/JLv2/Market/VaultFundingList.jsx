// src/components/JLv2/Market/VaultFundingList.jsx
import React from 'react';
import { observer } from 'mobx-react';
import intl from 'react-intl-universal';
import { useHistory } from 'react-router-dom';
import Store from '../../../stores';
import { formatApyRate, formatCompactFiatValue } from '../../../utils/formatters';
import { emptyReactNodeNew } from '../../../utils/helper';
import { getIcons } from '../../../utils/constant';

const TokenIcon = ({ tokenSymbol }) => {
  const iconSrc = getIcons(tokenSymbol);
  return <img src={iconSrc} alt={tokenSymbol} width="24" height="24" style={{ borderRadius: '50%' }} />;
};

export const VaultFundingList = observer(() => {
  const { marketV2: marketStore } = Store;
  const { fundingVaults } = marketStore;
  const history = useHistory();

  return (
    <div className="funding-list panel-v2">
      <div className="panel-title vault-list">
        {intl.get('jlv2.market.vault_list')} <span className="panel-subtitle">{intl.get('jlv2.market.tips3')}</span>
      </div>
      <div className="funding-list-content">
        <div className="list-header">
          <div className="col-vault">{intl.get('jlv2.market.vault')}</div>
          <div className="col-creator">{intl.get('jlv2.market.curator')}</div>
          <div className="col-allocation-percent">{intl.get('jlv2.market.allocation_percent')}</div>
          <div className="col-allocation-usd">{intl.get('jlv2.market.allocation_amount')}</div>
        </div>
        <div className={'list-body ' + (fundingVaults?.length ? '' : 'empty-list')}>
          {fundingVaults.length
            ? fundingVaults.map(vault => (
                <div className="list-row" key={vault.vaultAddress} onClick={() => history.push(`/vault?address=${vault.vaultAddress}`)}>
                  <div className="col-vault">
                    <TokenIcon tokenSymbol={vault.assetTokenSymbol} />
                    <span>{vault.vaultName}</span>
                  </div>
                  <div className="col-creator">{vault.curator || '--'}</div>
                  <div className="col-allocation-percent">{formatApyRate(vault.allocateRatio)}</div>
                  <div className="col-allocation-usd">
                    {formatCompactFiatValue(vault.allocateUsd)}
                    <span className="allocation-token">
                      {formatCompactFiatValue(vault.allocateTokenAmount, '')} {vault.assetTokenSymbol}
                    </span>
                  </div>
                </div>
              ))
            : emptyReactNodeNew()}
        </div>
      </div>
    </div>
  );
});
