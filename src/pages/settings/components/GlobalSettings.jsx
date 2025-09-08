import React from 'react';
import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';
import classnames from 'classnames';

import { Radio } from 'antd';

import { isEmailValid } from '../utils/helper';

@inject('lend')
@inject('settings')
@inject('network')
@observer
class GlobalSettings extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isUpdatingLanguage: false,
      toBeLanguage: ''
    };
  }

  onClickLinkEmailButton = async () => {
    const { bindedEmail } = this.props.settings;
    const isBindedEmailValid = isEmailValid(bindedEmail);

    if (isBindedEmailValid) {
      window.gtag('event', 'portfolio_setting_globalsetting_clickChangeEmail', {
        'event_category': 'portfolio',
        'event_label': 'portfolio_setting_globalsetting_clickChangeEmail'
      });
    } else {
      window.gtag('event', 'portfolio_setting_globalsetting_clickNewEmail', {
        'event_category': 'portfolio',
        'event_label': 'portfolio_setting_globalsetting_clickNewEmail'
      });
    }

    this.props.settings.setData({
      bindEmailModalVisible: true,
      bindEmailModalIsChangingEmail: isEmailValid(bindedEmail),
      bindEmailModalStep: 1
    });
  };

  onChangeThemeRadio = e => {
    if (e.target.value === 'white') {
      window.gtag('event', 'portfolio_setting_globalsetting_clickLight', {
        'event_category': 'portfolio',
        'event_label': 'portfolio_setting_globalsetting_clickLight'
      });
    } else {
      window.gtag('event', 'portfolio_setting_globalsetting_clickDark', {
        'event_category': 'portfolio',
        'event_label': 'portfolio_setting_globalsetting_clickDark'
      });
    }
    this.props.lend.setData({ theme: e.target.value });
    window.localStorage.setItem('theme', e.target.value);
  };

  onChangeLanguageRadio = async e => {
    const { isUpdatingLanguage } = this.state;

    if (isUpdatingLanguage) {
      return;
    }

    if (e.target.value === 'en-US') {
      window.gtag('event', 'portfolio_setting_globalsetting_clickEnglish', {
        'event_category': 'portfolio',
        'event_label': 'portfolio_setting_globalsetting_clickEnglish'
      });
    } else {
      window.gtag('event', 'portfolio_setting_globalsetting_clickZh', {
        'event_category': 'portfolio',
        'event_label': 'portfolio_setting_globalsetting_clickZh'
      });
    }
    this.setState({
      isUpdatingLanguage: true,
      toBeLanguage: e.target.value
    });

    const { defaultAccount } = this.props.network;

    const code = await this.props.settings.setLanguage(defaultAccount, e.target.value);

    if (code === 0) {
      this.props.lend.setData({ lang: e.target.value });
      window.localStorage.setItem('lang', e.target.value);

      setTimeout(() => {
        let search = window.location.search;
        let params = new URLSearchParams(search);
        let paramName = 'lang';
        let paramValue = e.target.value;
        if (params.has(paramName)) {
          params.set(paramName, paramValue);
        } else {
          params.append(paramName, paramValue);
        }
        search = params.toString();
        window.location.search = search;
      }, 200);
    } else {
      this.setState({
        isUpdatingLanguage: false
      });
    }
  };

  render() {
    const { toBeLanguage } = this.state;
    const { theme, lang } = this.props.lend;
    const { bindedEmail } = this.props.settings;

    const isBindedEmailValid = isEmailValid(bindedEmail);

    return (
      <div className="settings-section">
        <div className="settings-main-content">
          <div className="settings-section-title">
            <div className="title-text">{intl.get('settings.global_settings.title')}</div>

            <div className=""></div>
          </div>

          <div className="settings-section-content">
            <div className="settings-option-list">
              <div className="option-list-title">{intl.get('settings.global_settings.email_linking_title')}</div>

              <div
                className={classnames('settings-option', 'link-email-option', { 'email-linked': isBindedEmailValid })}
              >
                <span className="option-icon"></span>
                <div className="option-content">
                  <div className="option-title">
                    {isBindedEmailValid ? bindedEmail : intl.get('settings.global_settings.unlinked')}
                  </div>
                  <div className="option-subtitle">
                    <div className="subtitle-text">
                      {isBindedEmailValid
                        ? intl.get('settings.global_settings.whitelist_hint')
                        : intl.get('settings.global_settings.link_email_hint')}
                    </div>
                  </div>
                </div>
                <div className="option-action-wrapper desktop-only">
                  <button className="link-btn" onClick={() => this.onClickLinkEmailButton()}>
                    {isBindedEmailValid
                      ? intl.get('settings.global_settings.edit_btn')
                      : intl.get('settings.global_settings.link_btn')}
                  </button>
                </div>
              </div>

              <div className="option-action-wrapper mobile-only new-row-btn">
                <button className="link-btn" onClick={() => this.onClickLinkEmailButton()}>
                  {isBindedEmailValid
                    ? intl.get('settings.global_settings.edit_btn')
                    : intl.get('settings.global_settings.link_btn')}
                </button>
              </div>
            </div>
            <div className="settings-option-list">
              <div className="option-list-title">{intl.get('settings.global_settings.preferences_title')}</div>

              <div className="settings-option theme-option">
                <span className="option-icon"></span>
                <div className="option-content">
                  <div className="option-title">{intl.get('settings.global_settings.theme_title')}</div>
                </div>
                <div className="option-action-wrapper">
                  <Radio.Group className="theme-option-radio" onChange={this.onChangeThemeRadio} value={theme}>
                    <Radio value={'white'}>{intl.get('settings.global_settings.light_theme')}</Radio>
                    <Radio value={'black'}>{intl.get('settings.global_settings.dark_theme')}</Radio>
                    {/* <Radio value={'system'}>{intl.get('settings.global_settings.auto_theme')}</Radio> */}
                  </Radio.Group>
                </div>
              </div>

              <div className="settings-option langugage-option">
                <span className="option-icon"></span>
                <div className="option-content">
                  <div className="option-title">{intl.get('settings.global_settings.language_title')}</div>
                </div>
                <div className="option-action-wrapper">
                  <Radio.Group
                    className="language-option-radio"
                    onChange={this.onChangeLanguageRadio}
                    value={toBeLanguage === '' ? lang : toBeLanguage}
                  >
                    <Radio value={'zh-TC'}>{intl.get('settings.global_settings.zh_tc_lang')}</Radio>
                    <Radio value={'en-US'}>{intl.get('settings.global_settings.en_lang')}</Radio>
                  </Radio.Group>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default GlobalSettings;
