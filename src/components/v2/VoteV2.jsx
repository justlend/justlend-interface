import { observer } from 'mobx-react';
import React from 'react';
import Footer from './Footer';
import Header from './Header';
import SeasonToolBar from './season/index';
import Vote from './vote/index';
import WinterTheme from '../WinterTheme';
import TabsBar from './mobile/TabsBar';
import { Config } from '../../config';
import Stores from '../../stores';
import '../../assets/css/v2/home.scss';
import '../../assets/css/v2/theme.scss';

const VoteHome = observer(() => {
  const { lend } = Stores;
  const { theme } = lend;

  return (
    <>
      <div className={'j-wrapper ' + theme + (Config.winterThemeVisible ? ' snow-show' : '')}>
        {Config.winterThemeVisible && <WinterTheme fromPage="vote" />}
        <Header />
        <SeasonToolBar pageName="vote" />
        <div className="j-container j-home">
          <Vote />
        </div>
        <Footer />
      </div>
      <TabsBar theme={theme} />
    </>
  );
});

export default VoteHome;
