import React from 'react';
import isMobile from 'ismobilejs';
import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';
import '../assets/css/home.scss';
import Countdown from './countdown';

@inject('network')
@observer
class Intro extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      mobile: isMobile(window.navigator).any
    };
  }
  render() {
    const { lang, mobile } = this.state;
    return (
      <div className="intro-container">
        <div className={'intro-bg ' + (mobile ? 'intro-bg-mobile' : '')}>
          <div className="intro-image"></div>
          <div className={'intro-text' + (lang === 'en-US' ? ' english-text' : '')}>
            <p className="intro-title">
              <span></span>
              {/* <span>JustLend</span> */}
            </p>
            <p className="intro-subtitle">{intl.getHTML('index.my_introduction1')}</p>
          </div>
        </div>
        <Countdown
          title={intl.get('index_centurymining_banner1')}
          desc={intl.get('index_centurymining_banner2')}
          lang={lang}
        />
      </div>
    );
  }
}

export default Intro;
