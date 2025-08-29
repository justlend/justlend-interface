import { Select } from 'antd';
import { inject, observer } from 'mobx-react';
import React from 'react';
import intl from 'react-intl-universal';
import '../../assets/css/v2/footer.scss';
import Logo from '../../assets/images/v2/logo.svg';
import LogoWhite from '../../assets/images/v2/white-theme/logo.svg';
import { getQueryObj } from '../../utils/helper';
import config from '../../config';

const { Option } = Select;
const LandToWhitePaper = {
  'en-US': config.whitePaperEn,
  'zh-TC': config.whitePaperTc,
  'zh-CN': config.whitePaperCn
};
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
const PrivacyPolicy = {
  'zh-CN': 'https://www.justlend.org/docs/JustLend_Privacy_Policy_en.pdf',
  'en-US': 'https://www.justlend.org/docs/JustLend_Privacy_Policy_en.pdf',
  'zh-TC': 'https://www.justlend.org/docs/JustLend_Privacy_Policy_en.pdf'
};
const AuditReport = {
  'zh-CN': 'https://www.justlend.org/docs/justlend_audit_en.pdf',
  'en-US': 'https://www.justlend.org/docs/justlend_audit_en.pdf',
  'zh-TC': 'https://www.justlend.org/docs/justlend_audit_en.pdf'
};
@inject('network')
@inject('lend')
@observer
class Footer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale
    };
  }

  componentDidMount() {}

  setLanguage = lang => {
    this.props.network.setData({ lang });
    this.setState({ lang });
    window.localStorage.setItem('lang', lang);
    //window.location.search = `?lang=${lang}`;
    let search = window.location.search;
    let params = new URLSearchParams(search);
    let paramName = 'lang';
    let paramValue = lang;
    if (params.has(paramName)) {
      params.set(paramName, paramValue);
    } else {
      params.append(paramName, paramValue);
    }
    search = params.toString();
    window.location.search = search;
  };

  render() {
    const { theme } = this.props.lend;
    const isWhite = theme === 'white';
    const { showTabsBar } = this.props.network;
    const lang = getQueryObj()?.lang || window.localStorage.getItem('lang') || intl.options.currentLocale || 'en-US';
    return (
      <div className={'j-footer ' + (showTabsBar ? ' ' : 'hideTabsBar')}>
        <div>
          <div className="j-footer-logo">
            <img src={isWhite ? LogoWhite : Logo} alt="Justlend DAO" />
            {/* <div>{intl.get('index.my_introduction9')}</div> */}
            <div className="social-icons">
              <a className="icon-wrap" href={config.twitter} target="twitter">
                <span className="icon twitter" />
              </a>
              <a className="icon-wrap" href={config.telegram} target="telegram">
                <span className="icon telegram" />
              </a>
              {/* todo: 这里是不是github */}
              <a className="icon-wrap" href={config.github} target="discord">
                <span className="icon discord" />
              </a>
            </div>
          </div>
          <div className="j-footer-links">
            <div>
              <span>{intl.get('navi.aboutUs')}</span>
              <a href={`${config.portalLink}?lang=${lang}`}>Protal</a>
              <a href={`${config.portalLink}?lang=${lang}#/dao`}>DAO</a>
              <a href={LandToWhitePaper[lang]}>{intl.get('navi.white_paper')}</a>
            </div>
            <div>
              <span>App</span>
              <a href="#/home">Lend</a>
              <a href="#/market">{intl.get('navi.market_btn')}</a>
              <a href="#/vote">{intl.get('navi.vote_btn')}</a>
            </div>
            <div>
              <span>{intl.get('navi.support')}</span>
              <a href={lang === 'en-US' ? config.docsEn : config.docsCn}>Docs</a>
              <a href={config.github}>Github</a>
              <a href="https://immunefi.com/bounty/justlenddao/">{intl.get('navi.bug_bounty')}</a>
              <a href={AuditReport[lang]}>{intl.get('navi.auditReport')}</a>
            </div>
            <div>
              <span>{intl.get('navi.developer')}</span>
              <a href={HelpCenter[lang]}>{intl.get('navi.helpCenter')}</a>
              <a href={TermsOfService[lang]}>{intl.get('wallet.service')}</a>
              <a href={PrivacyPolicy[lang]}>{intl.get('wallet.privacy')}</a>
            </div>
          </div>
          <div className="j-footer-lang">
            <Select
              defaultValue={lang}
              style={{ width: 108 }}
              onChange={this.setLanguage}
              dropdownClassName={`lang-select${isWhite ? ' white' : ''}`}
            >
              <Option value="en-US">English</Option>
              <Option value="zh-TC">繁體中文</Option>
            </Select>
          </div>
        </div>
      </div>
    );
  }
}

export default Footer;
