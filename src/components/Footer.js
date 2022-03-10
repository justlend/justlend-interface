import React from 'react';
import isMobile from 'ismobilejs';
import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';
import Config from '../config';
import '../assets/css/home.scss';

@inject('network')
@observer
class FooterPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale
    };
  }
  render() {
    const { lang } = this.state;
    return (
      <div className="footer-container">
        <span className="version">{Config.version}</span>
        <span className="line">|</span>
        <a href={lang === 'en-US' ? Config.APIEn : Config.APICn} target="guide">
          {intl.get('footer.develop')}
        </a>
        <span className="line">|</span>
        <a
          href={`${Config.fileLink}JustLend_Terms_of_Use_${lang === 'en-US' ? 'en' : lang === 'zh-CN' ? 'cn' : 'tc'
            }.pdf`}
          target="walletService"
        >
          {intl.get('wallet.service')}
        </a>
        <span className="line">|</span>
        <a
          href={`${Config.fileLink}JustLend_Privacy_Policy_${lang === 'en-US' ? 'en' : lang === 'zh-CN' ? 'cn' : 'tc'
            }.pdf`}
          target="walletPrivacy"
        >
          {intl.get('wallet.privacy')}
        </a>
      </div>
    );
  }
}

export default FooterPage;
