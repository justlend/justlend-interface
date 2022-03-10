import React from 'react';
import { Link } from 'react-router-dom';
import { inject, observer } from 'mobx-react';
import intl from 'react-intl-universal';
import { Menu } from 'antd';
import { DesktopOutlined, PieChartOutlined } from '@ant-design/icons';

const { SubMenu } = Menu;

import Config from '../config';
import '../assets/css/Menu.scss';
import arrow from '../assets/images/down-arrow.svg';

@inject('network')
@observer
class MenuBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      collapsed: false
    };
  }

  componentDidMount() {}

  setLanguage = () => {
    let langVal;
    let { lang } = this.state;
    if (lang === 'en-US') {
      langVal = 'zh-CN';
    } else {
      langVal = 'en-US';
    }
    window.localStorage.setItem('lang', langVal);
    window.location.search = `?lang=${langVal}`;
  };

  render() {
    const { lang, collapsed } = this.state;
    return (
      <div className="menu-container">
        <div className="features">
          <span>{intl.get('navi.wallet_linkbtn')}</span>
          <Link to="./home">{intl.get('navi.index_btn')}</Link>
          <Link to="./market">{intl.get('navi.market_btn')}</Link>
          <Link to="./vote">{intl.get('navi.vote_btn')}</Link>
        </div>
        <div className="links">
          <a href={lang === 'en-US' ? Config.whitePaperEn : Config.whitePaperCn} target="whitePaper">
            {intl.get('navi.white_paper')}
          </a>
          {/* <a href={lang === 'en-US' ? Config.reportEn : Config.reportCn} target="report">
            {intl.get('navi.report')}
          </a> */}
          <span
            className={lang === 'en-US' ? 'en' : 'zh'}
            onClick={() => {
              this.setLanguage();
            }}
          >
            {lang === 'en-US' ? 'EN' : '中文'}
          </span>
          <a href={Config.twitter} target="twitter">
            {intl.get('navi.twitter')}
          </a>
          <a href={Config.telegram} target="telegram">
            {intl.get('navi.telegram')}
          </a>
        </div>
      </div>
    );
  }
}

export default MenuBar;
