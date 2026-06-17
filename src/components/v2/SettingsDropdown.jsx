import React, { memo } from 'react';
import intl from 'react-intl-universal';
import { Radio } from 'antd';
import classnames from 'classnames';

const SettingsDropdown = memo(({ show, lang, theme, onLangChange, onThemeChange }) => {
  return (
    <div className={classnames({ 'show-wallet-dropdown': show })}>
      <div className="wallet-dropdown">
        <div className="row-item language-row">
          <div className="row-title">{intl.get('settings.global_settings.language_title')}</div>
          <Radio.Group className="language-option-radio" onChange={onLangChange} value={lang}>
            <Radio value={'zh-TC'}>{intl.get('settings.global_settings.zh_tc_lang')}</Radio>
            <Radio value={'en-US'}>{intl.get('settings.global_settings.en_lang')}</Radio>
          </Radio.Group>
        </div>
        <div className="row-item theme-row">
          <div className="row-title">{intl.get('settings.global_settings.theme_title')}</div>
          <Radio.Group className="theme-option-radio" onChange={onThemeChange} value={theme}>
            <Radio value={'white'}>{intl.get('settings.global_settings.light_theme')}</Radio>
            <Radio value={'black'}>{intl.get('settings.global_settings.dark_theme')}</Radio>
          </Radio.Group>
        </div>
      </div>
    </div>
  );
});

export default SettingsDropdown;
