import React, { useState, useEffect } from 'react';
import intl from 'react-intl-universal';
import isMobile from 'ismobilejs';
import { observer } from 'mobx-react';
import Stores from '../../stores';
import Config from '../../config';
import Header from './Header';
import Footer from './Footer';
import TabsBar from './mobile/TabsBar';

import { getQueryObj } from '../../utils/helper';
import '../../assets/css/v2/application.scss';
import '../../assets/css/v2/theme.scss';
import backIconWhite from '../../assets/images/v2/energy-rental/arrow-left-white.svg';
import backIcon from '../../assets/images/v2/energy-rental/arrow-left.svg';

const Application = observer(() => {
  const { lend } = Stores;
  const [lang, setLang] = useState(window.localStorage.getItem('lang') || intl.options.currentLocale);

  useEffect(() => {
    document.title = `JustLend DAO | JustLend DAO is the first official lending platform on TRON where users can borrow, lend, deposit assets
    and earn interests.`;

    lend.getLatestBlockInfo();
  }, []);

  const goBack = e => {
    // Prevent the default anchor navigation (href="#" would otherwise
    // scroll to top / push a history entry). Keeps anchor styling while
    // avoiding the javascript: protocol (CSP-incompatible, XSS-adjacent).
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    let { from } = getQueryObj();

    if (from === 'portal') {
      window.location.href = window.location.origin + `/homeNew?lang=${lang}`;
    } else {
      window.history.back(-1);
    }
  };

  const { theme } = lend;

  return (
    <>
      <div className={'j-wrapper ' + theme + (Config.winterThemeVisible ? ' snow-show' : '')}>
        <Header instantActions={() => {}} mountedActions={() => {}}></Header>
        <div className="j-application">
          <div className="app-header">
            <a className="back-btn app-back-btn" href="#" onClick={goBack}>
              <img className="back-icon" src={theme === 'white' ? backIconWhite : backIcon} alt="" />
              {intl.get('strx.rent_list_back')}
            </a>
            <div className="app-title">{intl.get('application.title')}</div>
            <div className="app-subtitle">{intl.get('application.subtitle')}</div>
          </div>
          <div className="disclaimer-app">
            <div className="disclaimer-app-icon"></div>
            <div className="disclaimer-app-desc">
              {intl.getHTML('disclaimer.notester', { link: 'http://twitter.com/DeFi_JUST' })}
            </div>
          </div>
        </div>
        <Footer />
      </div>
      <TabsBar theme={theme} />
    </>
  );
});

export default Application;
