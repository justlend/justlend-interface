import React from 'react';
import isMobile from 'ismobilejs';
import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';
import { Statistic } from 'antd';
import '../assets/css/pre.scss';
import Config from '../config';
import featureImg1 from '../assets/images/pre/block1_img.png';
import featureImg2 from '../assets/images/pre/block2_img.png';
import featureImg3 from '../assets/images/pre/block3_img.png';
import head_logo from '../assets/images/pre/head_logo.png';
const locales = {
  'zh-CN': require('../locales/zh-CN.json'),
  'en-US': require('../locales/en-US.json'),
  'zh-TC': require('../locales/zh-TC.json')
};
const SUPPOER_LOCALES = [
  {
    name: 'English',
    value: 'en-US'
  },
  {
    name: '简体中文',
    value: 'zh-CN'
  },
  {
    name: '繁体中文',
    value: 'zh-TC'
  }
];
import { getTimeNow } from '../utils/backend';
@inject('network')
@observer
class PrePage extends React.Component {
  constructor(props) {
    super(props);
    this.unmount = false;
    this.nowTime = null;
    this.state = {
      mobile: isMobile(window.navigator).any,
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      h: '',
      m: '',
      s: ''
    };
  }

  componentDidMount = async () => {
    this.unmount = false;
    this.timer();
  };

  setLanguage = lang => {
    if (lang === 'en-US') {
      lang = 'zh-CN';
    } else {
      lang = 'en-US';
    }
    this.setState({ lang });
    window.localStorage.setItem('lang', lang);
    window.location.search = `?lang=${lang}`;
  };

  timer = () => {
    try {
      let h, m, s;
      const end = Config.startTime;
      const { nowTime } = this.props.network;
      const time = end - nowTime;
      if (nowTime) {
        if (time > 0) {
          h = Math.floor(time / 1000 / 60 / 60);
          m = Math.floor((time / 1000 / 60) % 60);
          s = Math.floor((time / 1000) % 60);

          h = h < 10 ? '0' + h : h + ''; //hour
          m = m < 10 ? '0' + m : m + ''; //minutes
          s = s < 10 ? '0' + s : s + ''; //second

          this.setState({
            h,
            m,
            s
          });
        } else {
          this.props.network.setData({
            start: true
          });
        }
      }
      if (time > 0) {
        setTimeout(this.timer, 1000);
      }
    } catch (err) {
      setTimeout(this.timer, 1000);
      console.log(err);
    }
  };

  render() {
    const { lang, mobile, h, m, s } = this.state;
    return (
      <div className="pre-container">
        <span
          className="pre-lang"
          onClick={() => {
            this.setLanguage(lang);
          }}
        >
          <span className={'lg-text ' + (lang === 'en-US' ? 'lg-active' : '')}>English</span>
          <span className="slice-lg"> / </span>
          <span className={'lg-text ' + (lang === 'zh-CN' ? 'lg-active' : '')}>中文</span>
        </span>
        <div className="pre-header">
          <div className="inner-box">
            <div className="info">
              <div className="pre-title">{intl.get('pre.title')}</div>
              <div className="pre-sec-title">{intl.getHTML('pre.sec_title')}</div>
              <div className="border"></div>
              {h && (
                <div className="content">
                  <span id="h">{h}</span>
                  {' : '}
                  <span id="m">{m}</span>
                  {' : '}
                  <span id="s">{s}</span>
                </div>
              )}
            </div>
            <div className="logo">
              <img src={head_logo} alt="" />
            </div>
          </div>
        </div>
        <div className="pre-features inner-box">
          <div className="title">{intl.getHTML('pre.features_title')}</div>
          <div className="tip">{intl.getHTML('pre.features_tip')}</div>
          <ul>
            <li>
              <img src={featureImg1} alt="" />
              <div className="feature-text">
                <div className="ft-title">{intl.getHTML('pre.feature1')}</div>
                <div className="ft-tip">{intl.getHTML('pre.feature1_tip')}</div>
              </div>
            </li>
            {mobile ? (
              <li>
                <img src={featureImg2} alt="" />
                <div className="feature-text">
                  <div className="ft-title">{intl.getHTML('pre.feature2')}</div>
                  <div className="ft-tip">{intl.getHTML('pre.feature2_tip')}</div>
                </div>
              </li>
            ) : (
              <li>
                <div className="feature-text">
                  <div className="ft-title">{intl.getHTML('pre.feature2')}</div>
                  <div className="ft-tip">{intl.getHTML('pre.feature2_tip')}</div>
                </div>
                <img src={featureImg2} alt="" />
              </li>
            )}
            <li>
              <img src={featureImg3} alt="" />
              <div className="feature-text">
                <div className="ft-title">{intl.getHTML('pre.feature3')}</div>
                <div className="ft-tip">{intl.getHTML('pre.feature3_tip')}</div>
              </div>
            </li>
          </ul>
        </div>
        <div className="pre-footer inner-box">
          <span>{intl.getHTML('pre.footer_text')}</span>
          <span>
            <a href={Config.twitter} target="twitter">
              {intl.get('navi.twitter')}
            </a>
          </span>{' '}
          <span>|</span>{' '}
          <span>
            <a href={Config.telegram} target="telegram">
              {intl.get('navi.telegram')}
            </a>
          </span>
        </div>
      </div>
    );
  }
}

export default PrePage;
