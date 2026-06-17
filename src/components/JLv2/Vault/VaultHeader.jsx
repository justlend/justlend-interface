// src/components/Vault/JLv2/VaultHeader.jsx
import React from 'react';
import { observer } from 'mobx-react';
import intl from 'react-intl-universal';
import { Link } from 'react-router-dom';
import Store from '../../../stores';
import { getIconsJLv2 } from '../../../utils/constant';
import { isTrxToken } from '../../../utils/formatters';
import { clickRowToContract, clickToToken20 } from '../../../utils/helper';

// A simple tag component for displaying info tags
const InfoTag = ({ label, version = '' }) => <div className={`info-tag ${version}`}>{label}</div>;

export const VaultHeader = observer(() => {
  const { vaultStore, dashboardStore } = Store;
  const { vaultDetails } = vaultStore;

  // Determine the token symbol from the vault name, default to 'TRX' if not found
  const tokenSymbol = vaultDetails.assetSymbol;
  const largeIconSrc = getIconsJLv2(tokenSymbol);
  const lang = window.localStorage.getItem('lang') || intl.options.currentLocale;

  return (
    <>
      <div className="return-back-element">
        <Link onClick={() => dashboardStore.setHomeSearchparam('supply')} className="return-back" to="homeNew">
          {intl.get('jlv2.back_to_home')}
        </Link>
      </div>
      <div className="vault-header panel pr">
        <div className={'vault-token-pic ' + tokenSymbol?.toLowerCase()}></div>
        <div className="header-content-left">
          <div className="title-line">
            <img src={largeIconSrc} alt={vaultDetails?.name} className="title-icon" />
            <h1>{vaultDetails?.name || 'Vault Title'}</h1>
            <InfoTag label="" version="v2" />
            <div className="tronscan-links">
              <div className="to-tronscan" onClick={() => clickRowToContract(vaultDetails.address, 'vault')}>
                {tokenSymbol} {intl.get('jlv2.vault.v2_vault')}
                <Link className="to-tronscan-icon" to=""></Link>
              </div>
              <div
                className="to-tronscan"
                onClick={() => clickToToken20(vaultDetails.asset, 'vaultInfo', isTrxToken(vaultDetails.asset))}
              >
                {tokenSymbol} {intl.get('jlv2.vault.symbol_token')}
                <Link className="to-tronscan-icon" to=""></Link>
              </div>
            </div>
          </div>
          {lang === 'en-US' ? (
            vaultDetails.descEn ? (
              <p className="description">{vaultDetails.descEn}</p>
            ) : null
          ) : vaultDetails.descZh ? (
            <p className="description">{vaultDetails.descZh}</p>
          ) : null}
        </div>
      </div>
    </>
  );
});
