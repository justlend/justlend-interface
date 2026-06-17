import React, { memo, forwardRef } from 'react';
import { Link } from 'react-router-dom';
import intl from 'react-intl-universal';
import classnames from 'classnames';
import Config from '../../config';
import { cutMiddle, copyToClipboardNew } from '../../utils/helper';

const WalletDropdown = memo(
  forwardRef(({ defaultAccount, connectedWallet, show, onSwitch, onDisconnect }, ref) => {
    if (!show) return null;

    const handleActionKeyDown = (event, action) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        action();
      }
    };

    const handleCopy = value => {
      copyToClipboardNew(value, () => {
        const div = document.createElement('div');
        const em = document.createElement('em');
        const text = document.createTextNode(intl.get('account_modal.copied'));
        div.appendChild(em);
        div.appendChild(text);
        div.className = 'copied-v2';
        document.getElementsByClassName('new-wallet-dropdown')[0].appendChild(div);
        const parent = document.getElementsByClassName('new-wallet-dropdown')[0];
        setTimeout(() => parent.removeChild(div), 2000);
      });
    };

    return (
      <div className="wallet-dropdown new-wallet-dropdown" ref={ref}>
        <div className="row-item wallet-row">
          <div className={`row-title ${connectedWallet}`}></div>
          <div className="row-value">
            <div className="row-value-content">
              <div className="value-text" title={defaultAccount}>
                {cutMiddle(defaultAccount, 8, 8)}
              </div>
              <span
                className="copy-btn"
                onClick={() => handleCopy(defaultAccount)}
                onKeyDown={event => handleActionKeyDown(event, () => handleCopy(defaultAccount))}
                role="button"
                tabIndex={0}
                aria-label={intl.get('wallet.copy')}
              ></span>
              <a
                className="to-tronscan-btn"
                target="_blank"
                href={`${Config.tronscanUrl}/address/${defaultAccount}`}
                rel="noopener noreferrer"
                aria-label="View wallet address on TRONSCAN"
              ></a>
            </div>
            <div className="row-value-content">
              <div
                className="wallet-btn switch-btn"
                onClick={onSwitch}
                onKeyDown={event => handleActionKeyDown(event, onSwitch)}
                role="button"
                tabIndex={0}
                aria-label={intl.get('s11.switch_wallet')}
              >
                {intl.get('s11.switch_wallet')}
              </div>
              <div
                className="wallet-btn disconnect-btn"
                onClick={onDisconnect}
                onKeyDown={event => handleActionKeyDown(event, onDisconnect)}
                role="button"
                tabIndex={0}
                aria-label={intl.get('s11.disconnect')}
              >
                {intl.get('s11.disconnect')}
              </div>
            </div>
          </div>
        </div>
        <Link
          className="row-item settings-row s9"
          to={'/settings'}
          aria-label={intl.get('settings.risk_warning.title')}
        >
          <div className="row-title">{intl.get('settings.risk_warning.title')}</div>
          <div className="row-value">
            <span className="arrow-right-icon"></span>
          </div>
        </Link>
      </div>
    );
  })
);

export default WalletDropdown;
