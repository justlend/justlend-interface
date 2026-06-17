import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { observer } from 'mobx-react';
import intl from 'react-intl-universal';
import { Drawer, Radio, Modal } from 'antd';
import classnames from 'classnames';
import Stores from '../../../stores';
import Config from '../../../config';
import '../../../assets/css/v2/header.scss';
import '../../../assets/css/v2/header-m.scss';
import closeIcon from '../../../assets/images/v2/mobile/close.svg';
import whiteThemeCloseIcon from '../../../assets/images/v2/mobile/white/close.svg';

const navLinks = [
  { to: '/strx', labelKey: 'strx.stake_trx_liquid_staking', routeMatch: 'LiquidityStake', iconClass: 'stake' },
  { to: '/energyRental', labelKey: 'strx.energy_rental', routeMatch: 'EnergyRent', iconClass: 'energy' },
  { to: '/homeNew', labelKey: 'v2.lend_title', routeMatch: 'home' },
  { to: '/voteNew', labelKey: 'navi.vote_btn', routeMatch: 'vote' }
];

const MobileHeader = observer(({ classNames, children, instantActions, mountedActions, renderRecordsLink }) => {
  const { network, lend, settings } = Stores;
  const location = useLocation();

  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
  const [isLanguageUpdating, setLanguageUpdating] = useState(false);

  const { routeName } = network;
  const { theme, lang } = lend;
  const isWhite = theme === 'white';

  useEffect(() => {
    instantActions?.();
    const handleConnect = () => mountedActions?.();
    network.on('connect', handleConnect);
    if (network.isConnected) {
      mountedActions?.();
    }
    return () => {
      network.off('connect', handleConnect);
    };
  }, [network, instantActions, mountedActions]);

  const handleLanguageChange = useCallback(
    async e => {
      if (isLanguageUpdating) return;

      setLanguageUpdating(true);
      const newLang = e.target.value;

      lend.setLang(newLang);
      window.localStorage.setItem('lang', newLang);

      if (network.isConnected && network.defaultAccount) {
        try {
          await settings.setLanguage(network.defaultAccount, newLang);
        } catch (error) {
          console.error('Failed to save language setting:', error);
        }
      }

      setTimeout(() => {
        const params = new URLSearchParams(window.location.search);
        params.set('lang', newLang);
        window.location.search = params.toString();
      }, 200);
    },
    [lend, settings, network, isLanguageUpdating]
  );

  const handleThemeChange = useCallback(
    e => {
      const newTheme = e.target.value;
      lend.setTheme(newTheme);
      window.localStorage.setItem('theme', newTheme);
    },
    [lend]
  );

  const toggleDrawer = useCallback(() => setDrawerOpen(prev => !prev), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const toggleSettingsModal = useCallback(() => setSettingsModalOpen(prev => !prev), []);
  const handleActionKeyDown = useCallback((event, action) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  }, []);

  return (
    <header
      className={classnames(
        'mobile-header-v2',
        'flex items-center',
        classNames,
        { 'white': isWhite && !routeName.includes('StUSDT') },
        { 'z-1101 setting-open': isSettingsModalOpen }
      )}
    >
      <div className="mobile-header-v2-inner flex justify-between items-center">
        <div className="logo-wrap flex">
          <div
            className="hamburger-menu-icon"
            onClick={toggleDrawer}
            onKeyDown={event => handleActionKeyDown(event, toggleDrawer)}
            role="button"
            tabIndex={0}
            aria-label={isDrawerOpen ? 'Close navigation menu' : 'Open navigation menu'}
          ></div>
          <a
            href={`${Config.portalLink}?lang=${lang}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mobile-logo flex-between"
            aria-label="JustLend DAO portal"
          >
            <span></span>
          </a>
        </div>

        <div className="connect-btn-wrap">{children}</div>

        <div
          onClick={toggleSettingsModal}
          onKeyDown={event => handleActionKeyDown(event, toggleSettingsModal)}
          className={classnames('category-icon', { 'close': isSettingsModalOpen })}
          role="button"
          tabIndex={0}
          aria-label={isSettingsModalOpen ? intl.get('close') : intl.get('settings.title')}
        ></div>
      </div>

      <Modal
        footer={null}
        title={null}
        closable={false}
        visible={isSettingsModalOpen}
        mask={false}
        className={classnames('m-header-settings-modal', { 'white': isWhite })}
        transitionName=""
      >
        <div className="m-settings">
          <div className="setting-list">{renderRecordsLink && renderRecordsLink()}</div>
          <div className="setting-list p10 mt-10">
            <div className="row-item language-row">
              <div className="row-title">{intl.get('settings.global_settings.language_title')}</div>
              <Radio.Group onChange={handleLanguageChange} value={lang} disabled={isLanguageUpdating}>
                <Radio value={'zh-TC'}>{intl.get('settings.global_settings.zh_tc_lang')}</Radio>
                <Radio value={'en-US'}>{intl.get('settings.global_settings.en_lang')}</Radio>
              </Radio.Group>
            </div>
            <div className="row-item theme-row">
              <div className="row-title">{intl.get('settings.global_settings.theme_title')}</div>
              <Radio.Group onChange={handleThemeChange} value={theme}>
                <Radio value={'white'}>{intl.get('settings.global_settings.light_theme')}</Radio>
                <Radio value={'black'}>{intl.get('settings.global_settings.dark_theme')}</Radio>
              </Radio.Group>
            </div>
          </div>
        </div>
      </Modal>

      <Drawer
        title={null}
        placement="left"
        className={classnames('mobile-menu-drawer-v2', { 'white': isWhite })}
        closable={true}
        onClose={closeDrawer}
        visible={isDrawerOpen}
        closeIcon={<img src={isWhite ? whiteThemeCloseIcon : closeIcon} alt="close" className="closeIconMobile" />}
        width="80%"
      >
        <nav className="mobile-menu-content" aria-label="Mobile navigation">
          <div className="link-list">
            {navLinks.map(link => (
              <Link
                key={link.to}
                className={classnames('link-list-item', {
                  'active': location.pathname.includes(link.to) || routeName?.includes(link.routeMatch)
                })}
                to={link.to}
                onClick={closeDrawer}
                aria-label={intl.get(link.labelKey)}
              >
                <span>
                  {intl.get(link.labelKey)}
                  {link.iconClass && <i className={link.iconClass}></i>}
                </span>
              </Link>
            ))}
          </div>
        </nav>
      </Drawer>
    </header>
  );
});

export default MobileHeader;
