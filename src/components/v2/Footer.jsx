import { observer } from 'mobx-react';
import React, { useState, useEffect } from 'react';
import intl from 'react-intl-universal';
import Stores from '../../stores';
import '../../assets/css/v2/footer.scss';
import config from '../../config';

const HelpCenter = {
  'zh-CN': 'https://justlendorg.zendesk.com/hc/zh-cn',
  'en-US': 'https://justlendorg.zendesk.com/hc/en-us',
  'zh-TC': 'https://justlendorg.zendesk.com/hc/zh-cn'
};
const TermsOfService = {
  'zh-CN': 'https://www.justlend.org/docs/JustLend_Terms_of_Use_en.pdf',
  'en-US': 'https://www.justlend.org/docs/JustLend_Terms_of_Use_en.pdf',
  'zh-TC': 'https://www.justlend.org/docs/JustLend_Terms_of_Use_en.pdf'
};

const Footer = observer(() => {
  const { ui, lend } = Stores;
  let interval = null;
  const [lang, setLang] = useState(window.localStorage.getItem('lang') || intl.options.currentLocale);
  const [blockNumber, setBlockNumber] = useState('');
  const { showTabsBar } = ui;

  useEffect(() => {
    const bn = isNaN(Number(lend.latestBlockInfo?.number)) ? '--' : Number(lend.latestBlockInfo?.number);

    setBlockNumber(bn);
  }, [lend.latestBlockInfo]);

  useEffect(() => {
    interval = setInterval(() => {
      setBlockNumber(blockNumber + 1);
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [blockNumber]);

  const handleActionKeyDown = (event, action) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };

  return (
    <footer className={'j-footer ' + (showTabsBar ? ' ' : 'hideTabsBar')}>
      <div className="j-footer-content">
        <div className="left">
          <div className="block">
            <span className="dot"></span>
            <span
              className="pointer"
              onClick={() => {
                window.open(`${config.tronscanUrl}/blockchain/blocks`);
              }}
              onKeyDown={event =>
                handleActionKeyDown(event, () => window.open(`${config.tronscanUrl}/blockchain/blocks`))
              }
              role="button"
              tabIndex={0}
              aria-label={`${intl.get('v2.tip35')}: ${blockNumber}`}
            >
              {intl.get('v2.tip35')}: {blockNumber && !isNaN(blockNumber) && blockNumber}
            </span>
          </div>
          <nav className="links" aria-label="Footer links">
            <a
              href={lang === 'en-US' ? config.docsEn : config.docsCn}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={intl.get('footer.develop')}
            >
              {intl.get('footer.develop')}
            </a>
            <a
              href={'https://docs.justlend.org/ai_support/mcp_server/'}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={intl.get('footer.mcp_server')}
            >
              {intl.get('footer.mcp_server')}
            </a>
            <a
              href={'https://docs.justlend.org/ai_support/justlend_skills/'}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={intl.get('footer.skills')}
            >
              {intl.get('footer.skills')}
            </a>
            <a
              href={HelpCenter[lang]}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={intl.get('navi.helpCenter')}
            >
              {intl.get('navi.helpCenter')}
            </a>
            <a
              href={TermsOfService[lang]}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={intl.get('wallet.service')}
            >
              {intl.get('wallet.service')}
            </a>
          </nav>
        </div>
        <div className="right">
          <div className="social-icons">
            <a className="icon-wrap" href={config.twitter} target="twitter" aria-label="X">
              <span className="icon twitter" />
            </a>
            <a className="icon-wrap" href={config.telegram} target="telegram" aria-label="Telegram">
              <span className="icon telegram" />
            </a>
            <a className="icon-wrap" href={config.discord} target="discord" aria-label="Discord">
              <span className="icon discord" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
});

export default Footer;
