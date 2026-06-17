// src/components/JLv2/Vault/VaultInfo.jsx
import React from 'react';
import { observer } from 'mobx-react';
import intl from 'react-intl-universal';
import isMobile from 'ismobilejs';
import Store from '../../../stores';
import { formatDate, formatTokenAmount, isTrxToken, formatApyRate } from '../../../utils/formatters';
import Config from '../../../config';
import { cutMiddle, BigNumber, copyToClipboardNew } from '../../../utils/helper';

const { tronscanUrl } = Config;

const InfoRow = ({ label, children }) => (
  <div className="param-row">
    <span className="label">{label}</span>
    <span className="value">{children}</span>
  </div>
);

const handleCopy = value => {
  copyToClipboardNew(value, () => {
    const copyEle = document.getElementsByClassName(`copy-${value || ''}`)[0];
    copyEle.classList.add('copied-icon');
    setTimeout(() => {
      copyEle.classList.remove('copied-icon');
    }, 1000);
  });
};

const AddressLink = ({ address, copy, text = '', type = 'address', isTrx }) => {
  const mobile = isMobile(window.navigator).any;
  // const count = mobile ? 4 : 8;
  const count = 6;
  return (
    <>
      <span>
        {isTrx ? '' : cutMiddle(address, count, count)}
        {text}
      </span>
      {copy && !isTrx && <span className={`copy-v2 copy-${address || ''}`} onClick={() => handleCopy(address)}></span>}
      <a
        href={isTrx ? `${tronscanUrl}/token/0` : `${tronscanUrl}/${type}/${address}`}
        target="_blank"
        rel="noopener noreferrer"
        title="View on TRONSCAN"
        className="link-to"
      ></a>
    </>
  );
};

export const VaultInfo = observer(() => {
  const { vaultStore } = Store;
  const { vaultDetails } = vaultStore;

  return (
    <div className="vault-info panel-v2">
      <div className="panel-title">{intl.get('jlv2.vault.vault_info')}</div>
      <div className="content-grid">
        <div className="params-list">
          <InfoRow label={intl.get('jlv2.vault.cault_address')}>
            <AddressLink address={vaultDetails.address || '--'} copy type="contract" />
          </InfoRow>
          <InfoRow label={intl.get('jlv2.vault.underlying_token')}>
            <AddressLink
              address={vaultDetails.asset}
              copy
              text={isTrxToken(vaultDetails.asset) ? `${vaultDetails.assetSymbol}` : ` (${vaultDetails.assetSymbol || '--'})`}
              type="token20"
              isTrx={isTrxToken(vaultDetails.asset)}
            />
          </InfoRow>
          <InfoRow label={intl.get('jlv2.vault.create_on')}>{formatDate(vaultDetails.createAt)}</InfoRow>
          <InfoRow label={intl.get('jlv2.vault.curator')}>{vaultDetails.curator || '--'}</InfoRow>
          <InfoRow label={intl.get('jlv2.vault.supplier')}>
            {vaultDetails?.supplyHeadCount?.toLocaleString('en-US') || '--'}
          </InfoRow>
          <InfoRow label={intl.get('jlv2.vault.performance_fee')}>
            {formatApyRate(vaultDetails.fee)}
          </InfoRow>
          <InfoRow label={intl.get('jlv2.vault.fee_recipient')}>
            <AddressLink address={vaultDetails.feeRecipient} type="address" />
          </InfoRow>
          <InfoRow label={intl.get('jlv2.vault.share_value')}>
            {formatTokenAmount(vaultDetails.shareValue)} {vaultDetails.assetSymbol} /{' '}
            <span className="share-light">{intl.get('jlv2.vault.share_unit')}</span>
          </InfoRow>
          <div className="info-warning">
            <div>
              <em className="warning-v2"></em>
              {intl.getHTML('jlv2.vault.tips6', { href: (tronscanUrl + '/token20/' + vaultDetails.address) })}
            </div>
          </div>
          {
            vaultDetails.timelock ? (
              <InfoRow label={intl.get('jlv2.vault.timelock')}>
                {formatApyRate(new BigNumber(vaultDetails.timelock).div(86400).toNumber(), true)?.replace('%', '')}
                {` ${intl.get('jlv2.vault.timelock_unit')}`}
              </InfoRow>
            ) : null
          }
        </div>
      </div>
    </div>
  );
});
