import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { observer } from 'mobx-react';
import intl from 'react-intl-universal';
import isMobile from 'ismobilejs';
import { Button, Modal, Popover } from 'antd';
import classnames from 'classnames';
import BigNumber from 'bignumber.js';
import MobileHeader from './mobile/Header';
import Entry from '../Connect/Entry';
import Loading from '../Connect/Loading';
import BetaModal from '../Modals/v2/Beta';
import ApplicationTipModal from '../Modals/v2/ApplicationTip';
import { NoServiceModalAll } from './no-service-modal/index.jsx';
import { StUSDTModal } from './stUSDT-modal/index';
import SettingsSignatureModal from '../../pages/settings/components/modals/SettingsSignatureModal';
import BindEmailModal from '../../pages/settings/components/modals/BindEmailModal';
import WalletDropdown from './WalletDropdown';
import SettingsDropdown from './SettingsDropdown';
import useClickOutside from '../../stores/useClickOutside';
import Stores from '../../stores';
import { cutMiddle, getAutoConnectIconClass, getParameterByName } from '../../utils/helper';
import Config from '../../config';
import ConfigV2 from '../../config/v2config';
import '../../assets/css/v2/header.scss';
import '../../assets/css/v2/energy-offer.scss';
import '../../assets/css/season.scss';
import '../../assets/css/userRecords.scss';

const Header = observer(
  ({
    classNames = '',
    hideThemeToggle = false,
    hideBackBtn = false,
    instantActions = () => { },
    mountedActions = () => { },
    unmountedActions = () => { }
  }) => {
    const { network, lend, ui, settings, userRecords, dashboardStore } = Stores;
    const [lang, setLang] = useState(window.localStorage.getItem('lang') || intl.options.currentLocale);
    const [isWalletDropdownOpen, setWalletDropdownOpen] = useState(false);
    const [isSettingsDropdownOpen, setSettingsDropdownOpen] = useState(false);
    const [isSBMV1DropdownOpen, setIsSBMV1DropdownOpen] = useState(false);
    const [isSBMV2DropdownOpen, setIsSBMV2DropdownOpen] = useState(false);
    // const [subItem, setSubItem] = useState('v2');
    const location = useLocation();

    const walletToggleRef = useRef(null);
    const walletDropdownContainerRef = useRef(null);
    const settingsToggleRef = useRef(null);
    const settingsDropdownContainerRef = useRef(null);

    useClickOutside(walletDropdownContainerRef, () => setWalletDropdownOpen(false), walletToggleRef);
    useClickOutside(settingsDropdownContainerRef, () => setSettingsDropdownOpen(false), settingsToggleRef);

    const { defaultAccount, isConnected, routeName, loginModalVisibleV2, loginModalStepV2, currentAppName } = network;
    const { networkErrorModalVisible, wsModalVisible } = ui;
    const { settingsSignatureModalVisible, bindEmailModalVisible } = settings;
    const { theme } = lend;
    const { unReadCount } = userRecords;
    const isMobileDevice = useMemo(() => isMobile(window.navigator).any, []);

    useEffect(() => {
      if (location.pathname !== '/liquidationV2') {
        window.sessionStorage.removeItem('liquidation_debtTokens');
        window.sessionStorage.removeItem('liquidation_collateralTokens');
      }
    }, []);

    useEffect(() => {
      lend.getFullNodeInfo();
      const timer = setInterval(() => lend.getFullNodeInfo(), 60000);
      lend.getApplicationInfo();
      instantActions?.();

      const commonRequests = async () => {
        if (!network.defaultAccount) return;
        // await lend.getBetaInfo(network.defaultAccount);
        mountedActions?.();
        const settingsAuthority = lend.applicationMap['settings']?.switchOn;
        if (settingsAuthority) {
          settings.getNotiSettings(network.defaultAccount);
          settings.getEmailBindInfo(network.defaultAccount);
        }
        await userRecords.getLiquidityRecordsData();
      };

      const handleConnect = () => commonRequests();
      network.on('connect', handleConnect);
      if (isConnected) {
        commonRequests();
      }

      return () => {
        clearInterval(timer);
        network.off('connect', handleConnect);
      };
    }, [network, lend, settings, userRecords, isConnected, instantActions, mountedActions]);

    const handleSwitchToLiquidate = useCallback(() => {
      if (network.isRightChain === 0) {
        network.changeChain();
        return;
      }
      const href = `${window.location.origin}/liquidate?lang=${lang}`;
      window.location.href = href;
    }, [network, ui, lang]);

    const handleLanguageChange = useCallback(
      async e => {
        const newLang = e.target.value;
        lend.setLang(newLang);
        window.localStorage.setItem('lang', newLang);
        if (isConnected && defaultAccount) {
          try {
            settings.setLanguage(defaultAccount, newLang);
          } catch (error) {
            console.error('Failed to save language preference:', error);
          }
        }
        const params = new URLSearchParams(window.location.search);
        params.set('lang', newLang);
        window.location.search = params.toString();
      },
      [lend, settings, isConnected, defaultAccount]
    );

    const handleThemeChange = useCallback(
      e => {
        const newTheme = e.target.value;
        lend.setTheme(newTheme);
        window.localStorage.setItem('theme', newTheme);
      },
      [lend]
    );

    const showConnectModal = useCallback(() => {
      if (lend.serviceInnerStatus === 'disabled') {
        lend.setNoServiceModalAllVisible(true);
      } else {
        network.connectWalletV2();
      }
    }, [lend, network]);

    const handleCancelLoginModal = useCallback(() => {
      network.setLoginModalVisibilityV2(false);
      network.setConnectingWallet(null);
      network.setOneData('unInstalledWallet', null);
      network.setOneData('isTokenPocketNoAddress', false);
    }, [network]);
    const closeNetworkErrorModal = useCallback(() => ui.closeNetworkErrorModal(), [ui]);
    const betaCloseCallback = useCallback(() => {
      lend.setShowGif(true);
      let timer = setTimeout(() => {
        lend.setShowGif(false);
        clearTimeout(timer);
      }, 3000);
    }, [lend]);

    const handleActionKeyDown = useCallback((event, action) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        action();
      }
    }, []);

    const shouldGoToNewRentalPage = useMemo(() => {
      const lastVisit = window.localStorage.getItem('lastVisitEnergyRentalPage');
      return lastVisit == null || lastVisit === 'energyRental';
    }, []);

    const renderLendMenu = () => (
      <>
        <Link to="/homeV1" className={routeName === 'home' ? 'current' : ''}>
          <span>{intl.get('v2.lend_title')}</span>
        </Link>
        <Link
          to="/marketNew"
          className={routeName === 'market' ? 'current' : ''}
          aria-label={intl.get('liquidate.liquidate_market_list')}
        >
          <span>{intl.get('liquidate.liquidate_market_list')}</span>
        </Link>
        <a
          onClick={handleSwitchToLiquidate}
          onKeyDown={e => handleActionKeyDown(e, handleSwitchToLiquidate)}
          className={classnames('flex aic', { current: routeName === 'liquidate' })}
          role="button"
          tabIndex={0}
          aria-label={intl.get('liquidate.liquidate_liquidation_list')}
        >
          <span>{intl.get('liquidate.liquidate_liquidation_list')}</span>
        </a>
      </>
    );

    const renderMoreMenu = () => (
      <>
        {/* <a href={Config.juststable} target="_blank" rel="noopener noreferrer">
          <span>{intl.get('navi.juststable')}</span>
        </a> */}
        <a
          className="header-token stusdt"
          href="#"
          onClick={e => {
            e.preventDefault();
            lend.setStUSDTModalShow(true);
          }}
          aria-label={intl.get('stUsdt_top_nav')}
        >
          <span>{intl.get('stUsdt_top_nav')}</span>
        </a>
      </>
    );

    const renderRecordsLink = useCallback(() => {
      if (!isConnected || !defaultAccount) return null;
      const hasUnread = BigNumber(unReadCount).gt(0) && unReadCount !== '--';
      let linkTo = hasUnread ? '/userRecords?tab=Liquidate' : '/userRecords';

      return (
        <Link to={linkTo} className="user-records-link" aria-label={intl.get('jlv2.record.transaction_record')}>
          {isMobileDevice ? (
            <div className="flex-between">
              <span className="records-default-icon">{intl.get('jlv2.record.transaction_record')}</span>
              {hasUnread && <span className={'unread-amount-for-m'}>{unReadCount}</span>}
            </div>
          ) : (
            <>
              <span className="records-default-icon"></span>
              {hasUnread && (
                <span className={'unread-amount ' + (BigNumber(unReadCount)?.gt(10) ? 'lot' : '')}>{unReadCount}</span>
              )}
            </>
          )}
        </Link>
      );
    }, [isConnected, defaultAccount, unReadCount, isMobileDevice]);

    const onSBMV1MouseLeave = () => {
      setIsSBMV1DropdownOpen(false);
      // setSubItem('v2');
    };

    const onSBMV1MouseEnter = () => {
      setIsSBMV1DropdownOpen(true);
    };

    const onSBMV2MouseLeave = () => {
      setIsSBMV2DropdownOpen(false);
      // setSubItem('v2');
    };

    const onSBMV2MouseEnter = () => {
      setIsSBMV2DropdownOpen(true);
    };

    const sbmV1DropdownRender = () => {
      return (
        <div className={'header-dropdown-v2' + (lang === 'en-US' ? ' en' : '')}>
          <div className="dropdown-inner">
            <div className="dropdown-inner-content">
              <div className="sub-item v1">
                <Link
                  onClick={() =>
                    window.gtag('event', 'PC_navi_sbm_v1', { 'event_category': 'PC_V2', 'event_label': 'navi_sbm_v1' })
                  }
                  to={`/homeV1`}
                  className={'item-title header-v2-icon sbm-v2' + (routeName === 'homev1' ? ' current' : '')}
                >
                  <div>{intl.get('jlv2.navibar.supply_borrow_v1')}</div>
                </Link>
                <Link
                  onClick={() =>
                    window.gtag('event', 'PC_navi_market_v1', {
                      'event_category': 'PC_V2',
                      'event_label': 'navi_market_v1'
                    })
                  }
                  to="/marketNew"
                  className={'item-title header-v2-icon market-data-v1' + (routeName === 'market' ? ' current' : '')}
                >
                  <div>{intl.get('jlv2.navibar.markets')}</div>
                </Link>
                <a
                  onClick={() => {
                    window.gtag('event', 'PC_navi_liq_v1', { 'event_category': 'PC_V2', 'event_label': 'navi_liq_v1' });
                    handleSwitchToLiquidate();
                  }}
                  className={'item-title header-v2-icon liquidate-v1' + (routeName === 'liquidate' ? ' current' : '')}
                >
                  <div>{intl.get('jlv2.navibar.liquidation')}</div>
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    };

    const sbmV1LinkRender = () => {
      return (
        <div
          className={
            'flex-center navi-sbm' +
            (lang === 'en-US' ? ' en' : '') +
            (!isSBMV1DropdownOpen ? ' oh' : '') +
            (['homev1', 'market', 'liquidate'].includes(routeName) ? ' current' : '')
          }
          onMouseLeave={onSBMV1MouseLeave}
          onMouseEnter={onSBMV1MouseEnter}
        >
          {/* <Link
            to={`/homeNew?lang=${lang}`}
            className={classnames('bs-route lend', {
              current: ['home', 'market', 'liquidate'].includes(routeName)
            })}
          >
            {intl.get('v2.lend_title_s9')}. 
          </Link> */}
          <a>{intl.get('jlv2.navibar.sbm_v1')}</a>
          <em className="bs-arrow"></em>
          {/* <div className="header-sbm-v2 v1"></div> */}
          {sbmV1DropdownRender()}
        </div>
      );
    };

    const sbmV2DropdownRender = () => {
      return (
        <div className={'header-dropdown-v2' + (lang === 'en-US' ? ' en' : '')}>
          <div className="dropdown-inner">
            <div className="dropdown-inner-content">
              <div className="sub-item">
                <Link
                  onClick={() => {
                    dashboardStore.setHomeSearchparam('supply');
                    window.gtag('event', 'PC_navi_vault_v2', {
                      'event_category': 'PC_V2',
                      'event_label': 'navi_vault_v2'
                    });
                  }}
                  to={`/homeNew`}
                  className={
                    'item-title header-v2-icon supply-v2' +
                    (routeName === 'dashboard' && dashboardStore.homeSearchparam === 'supply' ? ' current' : '')
                  }
                >
                  <div>{intl.get('jlv2.navibar.supply_earn')}</div>
                  {/* <div className='market-name'>{intl.get('jlv2.navibar.supply_vault')}</div> */}
                </Link>
                <Link
                  onClick={() => {
                    dashboardStore.setHomeSearchparam('borrow');
                    window.gtag('event', 'PC_navi_market_v2', {
                      'event_category': 'PC_V2',
                      'event_label': 'navi_market_v2'
                    });
                  }}
                  to={`/homeNew`}
                  className={
                    'item-title header-v2-icon borrow-v2' +
                    (routeName === 'dashboard' && dashboardStore.homeSearchparam === 'borrow' ? ' current' : '')
                  }
                >
                  <div>{intl.get('jlv2.navibar.borrow_collateral')}</div>
                  {/* <div className='market-name'>{intl.get('jlv2.navibar.lending_market')}</div> */}
                </Link>
                <Link
                  to={`/liquidationV2`}
                  className={
                    'item-title header-v2-icon liquidate-v1' + (routeName === 'liquidationV2' ? ' current' : '')
                  }
                >
                  <div>{intl.get('jlv2.navibar.liquidation_v2')}</div>
                  {/* <div className='market-name'>{intl.get('jlv2.navibar.liquidation_record')}</div> */}
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    };

    const sbmV2LinkRender = () => {
      return (
        <div
          className={
            'flex-center navi-sbm' +
            (!isSBMV2DropdownOpen ? ' oh' : '') +
            (['dashboard', 'marketV2', 'vault', 'liquidationV2'].includes(routeName) ? ' current' : '')
          }
          onMouseLeave={onSBMV2MouseLeave}
          onMouseEnter={onSBMV2MouseEnter}
        >
          {/* <Link
            to={`/homeNew?lang=${lang}`}
            className={classnames('bs-route lend', {
              current: ['home', 'market', 'liquidate'].includes(routeName)
            })}
          >
            {intl.get('v2.lend_title_s9')}. 
          </Link> */}
          <a>{intl.get('jlv2.navibar.sbm_v2')}</a>
          <em className="bs-arrow"></em>
          {/* <div className="header-sbm-v2"></div> */}
          {sbmV2DropdownRender()}
        </div>
      );
    };

    let mainContent;

    if (isMobileDevice) {
      const ConnectButtonMobile =
        (isConnected && defaultAccount) ||
          (Config.allowAutoConnectInMobile.includes(currentAppName) &&
            (defaultAccount || window?.tronWeb?.defaultAddress?.base58)) ? (
          <div
            ref={walletToggleRef}
            className={classnames('j-wallet-info', 'j-wallet-clickable', {
              'j-wallet-info-active': isWalletDropdownOpen
            })}
            onClick={() => setWalletDropdownOpen(prev => !prev)}
            onKeyDown={e => handleActionKeyDown(e, () => setWalletDropdownOpen(prev => !prev))}
            role="button"
            tabIndex={0}
            aria-haspopup="menu"
            aria-expanded={isWalletDropdownOpen}
            aria-label={`${intl.get('navi.wallet_linkbtn')}: ${cutMiddle(defaultAccount, 6, 6)}`}
          >
            <div className="wallet-info-content j-wallet-clickable">
              <div className={`wallet-icon j-wallet-clickable ${getAutoConnectIconClass(currentAppName)}`}></div>
              <span className="address j-wallet-clickable">
                {cutMiddle(defaultAccount || window.tronWeb.defaultAddress.base58, 6, 6)}
              </span>
            </div>
          </div>
        ) : (
          <div
            className={`connect-wallet-v2 j-wallet-clickable`}
            onClick={showConnectModal}
            onKeyDown={e => handleActionKeyDown(e, showConnectModal)}
            role="button"
            tabIndex={0}
            aria-label={intl.get('navi.wallet_linkbtn')}
          >
            {intl.get('navi.wallet_linkbtn')}
          </div>
        );

      const walletDropdownMenu = isConnected && isWalletDropdownOpen && (
        <div className="j-header j-header-m">
          <div className="j-wallet" ref={walletDropdownContainerRef}>
            <WalletDropdown
              show={isWalletDropdownOpen}
              defaultAccount={defaultAccount}
              connectedWallet={
                Config.allowAutoConnectInMobile.includes(currentAppName) ? 'imtoken' : network.walletType
              }
              onSwitch={() => {
                setWalletDropdownOpen(false);
                setTimeout(() => showConnectModal(), 100);
              }}
              onDisconnect={() => {
                setWalletDropdownOpen(false);
                network.disconnect();
              }}
            />
          </div>
        </div>
      );

      mainContent = (
        <>
          {walletDropdownMenu}
          <MobileHeader
            classNames={classNames}
            hideThemeToggle={hideThemeToggle}
            hideBackBtn={hideBackBtn}
            mountedActions={mountedActions}
            instantActions={instantActions}
            renderRecordsLink={renderRecordsLink}
          >
            {ConnectButtonMobile}
          </MobileHeader>
        </>
      );
    } else {
      mainContent = (
        <div className={classnames('j-header', { 'showing-wallet-dropdown': isSettingsDropdownOpen })} role="banner">
          <div className="flex aic">
            <a className="j-logo snow-hide" href={Config.portalLink} target="_blank" rel="noopener noreferrer"></a>
          </div>
          <nav className="j-links">
            {sbmV1LinkRender()}
            {sbmV2LinkRender()}
            <Link to={`/strx?lang=${lang}`} className={routeName === 'LiquidityStake' ? 'current' : ''}>
              <span>{intl.get('strx.stake_trx_liquid_staking')}</span>
              <div className="header-icon j-stake"></div>
            </Link>
            <Link
              to={`${shouldGoToNewRentalPage ? '/energyRental' : '/energy'}?lang=${lang}`}
              className={routeName === 'EnergyRent' ? 'current' : ''}
              aria-label={intl.get('strx.energy_rental')}
            >
              <span>{intl.get('strx.energy_rental')}</span>
            </Link>
            <Link
              to={`/voteNew?lang=${lang}`}
              className={routeName === 'vote' ? 'current' : ''}
              aria-label={intl.get('navi.vote_btn')}
            >
              <span>{intl.get('navi.vote_btn')}</span>
            </Link>
            <Popover
              placement="bottom"
              content={renderMoreMenu()}
              trigger="hover"
              overlayClassName={`header-bs-pop pc-pop ${theme === 'white' ? 'white' : ''}`}
              className="pr"
            >
              <a
                className="bs-route"
                role="button"
                tabIndex={0}
                aria-haspopup="menu"
                aria-label={intl.get('navi.more')}
              >
                {intl.get('navi.more')}
                <em className="bs-arrow"></em>
              </a>
            </Popover>
          </nav>
          <div className="j-wallet">
            {!isConnected ? (
              <div
                className="connect-wallet-v2 j-wallet-clickable"
                onClick={showConnectModal}
                onKeyDown={e => handleActionKeyDown(e, showConnectModal)}
                role="button"
                tabIndex={0}
                aria-label={intl.get('navi.wallet_linkbtn')}
              >
                {intl.get('navi.wallet_linkbtn')}
              </div>
            ) : (
              <div
                ref={walletToggleRef}
                className={classnames('j-wallet-info j-wallet-clickable', {
                  'j-wallet-info-active': isWalletDropdownOpen
                })}
                onClick={() => setWalletDropdownOpen(prev => !prev)}
                onKeyDown={e => handleActionKeyDown(e, () => setWalletDropdownOpen(prev => !prev))}
                role="button"
                tabIndex={0}
                aria-haspopup="menu"
                aria-expanded={isWalletDropdownOpen}
                aria-label={`${intl.get('navi.wallet_linkbtn')}: ${cutMiddle(defaultAccount, 6, 6)}`}
              >
                <div className="wallet-info-content j-wallet-clickable">
                  <div
                    className={`wallet-icon j-wallet-clickable ${getAutoConnectIconClass(network.currentAppName)}`}
                  ></div>
                  <span className="address j-wallet-clickable">{cutMiddle(defaultAccount, 6, 6)}</span>
                </div>
              </div>
            )}
            <WalletDropdown
              ref={walletDropdownContainerRef}
              show={isWalletDropdownOpen}
              defaultAccount={defaultAccount}
              connectedWallet={network.walletType}
              onSwitch={() => {
                setWalletDropdownOpen(false);
                setTimeout(() => {
                  showConnectModal();
                }, 100);
              }}
              onDisconnect={() => {
                setWalletDropdownOpen(false);
                network.disconnect();
              }}
            />
            {renderRecordsLink()}
            <div ref={settingsDropdownContainerRef} className="flex">
              <span
                ref={settingsToggleRef}
                className={`setting-icon ${isSettingsDropdownOpen ? ' active' : ''}`}
                onClick={() => setSettingsDropdownOpen(prev => !prev)}
                onKeyDown={e => handleActionKeyDown(e, () => setSettingsDropdownOpen(prev => !prev))}
                role="button"
                tabIndex={0}
                aria-haspopup="menu"
                aria-expanded={isSettingsDropdownOpen}
                aria-label={intl.get('settings.title')}
              ></span>
              <SettingsDropdown
                show={isSettingsDropdownOpen}
                lang={lang}
                theme={theme}
                onLangChange={handleLanguageChange}
                onThemeChange={handleThemeChange}
              />
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        {mainContent}

        {loginModalVisibleV2 &&
          (loginModalStepV2 === 1 ? (
            <Entry
              loginModalVisible={loginModalVisibleV2}
              handleCancel={handleCancelLoginModal}
              mountedActions={mountedActions}
              unmountedActions={unmountedActions}
            />
          ) : (
            <Loading loginModalVisible={loginModalVisibleV2} handleCancel={handleCancelLoginModal} />
          ))}
        {networkErrorModalVisible && (
          <Modal
            title=" "
            footer={null}
            onCancel={closeNetworkErrorModal}
            className="j-modal header-border j-network-error-modal"
            visible={networkErrorModalVisible}
            centered
            width={350}
            getContainer={() => document.querySelector('.j-wrapper')}
          >
            <div className="network-error">{intl.get('network_error')}</div>
            <Button className="j-large-btn j-supply" type="primary" onClick={closeNetworkErrorModal}>
              {intl.get('got_it')}
            </Button>
          </Modal>
        )}
        {Config.noServiceModalVisible && (
          <NoServiceModalAll dark={window.location.pathname.includes('/stUSDT') || theme !== 'white'} />
        )}
        <StUSDTModal />
        {/* <BetaModal betaCloseCallback={betaCloseCallback} /> */}
        <ApplicationTipModal />
        {settingsSignatureModalVisible && <SettingsSignatureModal />}
        {bindEmailModalVisible && <BindEmailModal />}
      </>
    );
  }
);

export default Header;
