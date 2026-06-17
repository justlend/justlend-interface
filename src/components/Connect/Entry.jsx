import React, { useCallback, useEffect } from 'react';
import { observer } from 'mobx-react';
import intl from 'react-intl-universal';
import { Modal, message } from 'antd';
import isMobile from 'ismobilejs';
import Stores from '../../stores';
import Config from '../../config';
import '../../assets/css/v2/connect-modal.scss';
import TronlinkImg from '../../assets/images/connect/tronlink.svg';
import BinanceImg from '../../assets/images/connect/binance.svg';
import OKXImg from '../../assets/images/connect/okx.svg';
import WalletConnectImg from '../../assets/images/connect/walletconnect.svg';
import LedgerImg from '../../assets/images/connect/ledger.svg';
import TokenPocketImg from '../../assets/images/connect/tokenpocket.svg';
import LoadingImg from '../../assets/images/s11/loading.png';
import LoadingWhiteImg from '../../assets/images/s11/white/loading.png';
import { checkShouldOpenTronLink, checkShouldOpenOkex, checkShouldOpenTokenPocket } from '../../utils/deeplink';
import { WALLET_TYPES } from '../../utils/constant';

const ConnectWalletModal = observer(({ loginModalVisible, handleCancel, mountedActions, unmountedActions }) => {
  const { network, connect, ledger, lend } = Stores;

  const lang = window.localStorage.getItem('lang') || intl.options.currentLocale;
  const isMobileDevice = isMobile(window.navigator).any;
  const { theme } = network.routeName === 'StUSDT' ? { theme: '' } : lend;

  const walletList = [
    {
      type: WALLET_TYPES.TRONLINK,
      name: 'TronLink',
      image: TronlinkImg,
      isExist: isMobileDevice
        ? window.tronLink && !window.tokenpocket && !window.okxwallet && !window.isBinance && !window.binancew3w
        : window.tronOfTronLink
    },
    { type: WALLET_TYPES.OKX, name: 'OKX', image: OKXImg, isExist: window.okxwallet },
    { type: WALLET_TYPES.TOKENPOCKET, name: 'TokenPocket', image: TokenPocketImg, isExist: window.tokenpocket },
    { type: WALLET_TYPES.WALLETCONNECT, name: 'WalletConnect', image: WalletConnectImg, isExist: true }, // don't need to check
    { type: WALLET_TYPES.BINANCE, name: 'Binance', image: BinanceImg, isExist: window.isBinance || window.binancew3w },
    { type: WALLET_TYPES.LEDGER, name: 'Ledger', image: LedgerImg, desktopOnly: true, isExist: true } // don't need to check
  ];

  useEffect(() => {
    window.gtag('event', 'conwallet_popup', { event_category: 'conwallet', event_label: 'conwallet_popup' });
  }, []);

  const handleConnect = async walletInfo => {
    const walletType = walletInfo.type;
    if (network.connectingWallet) return;
    network.setConnectingWallet(walletType);

    if (walletType !== WALLET_TYPES.LEDGER && walletType !== WALLET_TYPES.WALLETCONNECT) {
      if (!walletInfo.isExist) {
        network.setOneData('unInstalledWallet', walletType);
      }
      network.setLoginModalStepV2(2);
    }

    window.gtag('event', `conwallet_popup_click${walletType}`, {
      event_category: 'conwallet',
      event_label: `conwallet_popup_click${walletType}`
    });

    try {
      if (walletType === WALLET_TYPES.WALLETCONNECT) {
        await connect.connect();
      } else if (walletType === WALLET_TYPES.LEDGER) {
        network.setLoginModalVisibilityV2(false);
        await ledger.connectNewDevice(
          () => {
            mountedActions?.();
          },
          () => {
            unmountedActions?.();
          }
        );
      } else {
        switch (walletType) {
          case WALLET_TYPES.TRONLINK:
            await checkShouldOpenTronLink();
            // check tronlink app
            if (
              isMobileDevice &&
              !(window.tronLink && !window.tokenpocket && !window.okxwallet && !window.isBinance && !window.binancew3w)
            ) {
              throw new Error('TronLink Wallet not found');
            }
            // check tronlink pc
            if (!isMobileDevice && !window.tronOfTronLink) throw new Error('TronLink Wallet not found');

            break;
          case WALLET_TYPES.OKX:
            checkShouldOpenOkex();
            if (!window.okxwallet) throw new Error('OKX Wallet not found');
            break;
          case WALLET_TYPES.TOKENPOCKET:
            checkShouldOpenTokenPocket();
            if (!window.tokenpocket) throw new Error('TokenPocket Wallet not found');
            break;
          case WALLET_TYPES.BINANCE:
            if (!window.isBinance && !window.binancew3w) throw new Error('Binance Wallet not found');
            break;
        }
        await network.connect(walletType);
      }
    } catch (error) {
      console.error(`Failed to connect ${walletType}:`, error.message);
      unmountedActions?.();
      // network.setConnectingWallet(null);
      // network.setLoginModalStepV2(1);
    }
  };

  return (
    <Modal
      title={intl.get('navi.wallet_linkbtn')}
      maskClosable={false}
      visible={loginModalVisible}
      closable={true}
      onCancel={handleCancel}
      footer={null}
      centered
      className={`connect-modal-v2 entry-modal-v2${theme === 'white' ? ' white' : ''}`}
    >
      <div className="connect-element-v2 entry-ele-v2">
        <div className="top-tip">
          {intl.get('wallet.use_justlend')}
          <a className="j-link" href={Config.userGuideUrl} target="_blank" rel="noopener noreferrer">
            {intl.get('s11.user_guide')}
          </a>
        </div>
        <div className="entry-logos">
          {walletList.map(wallet => {
            if ((wallet.mobileOnly && !isMobileDevice) || (wallet.desktopOnly && isMobileDevice)) {
              return null;
            }
            const isLoading = network.connectingWallet === wallet.type;

            return (
              <div
                key={wallet.type}
                className={`entry-logo ${isLoading ? 'disabled' : ''}`}
                onClick={() => handleConnect(wallet)}
              >
                {/* {!wallet.isExist ? <div className="no-install">{intl.get('wallet.no_install')}</div> : null} */}
                {isLoading ? (
                  <img src={theme === 'white' ? LoadingWhiteImg : LoadingImg} alt="Loading" className="is-loading" />
                ) : (
                  <img src={wallet.image} alt={wallet.name} className="link" />
                )}
                <span>{wallet.name}</span>
              </div>
            );
          })}
        </div>
        <div className={`bottom-tip${lang === 'en-US' ? ' en' : ''}`}>
          <span className="accept-tips">{intl.get('wallet.accept_tips')} </span>
          <div>
            <a className="j-link" href={`${Config.fileLink}JustLend_Terms_of_Use_en.pdf`} target="_blank" rel="noopener noreferrer">
              {intl.get('wallet.service')}
            </a>
            <a className="j-link" href={`${Config.fileLink}JustLend_Privacy_Policy_en.pdf`} target="_blank" rel="noopener noreferrer">
              {intl.get('wallet.privacy')}
            </a>
          </div>
        </div>
        <div className="bottom-doc">
          <div className="bd-title">{intl.get('s11.tips1')}</div>
          <div className="bd-links">
            <a className="jl-links" href={Config.readDocUrl} target="_blank" rel="noopener noreferrer">
              {intl.get('s11.read_docs')}
            </a>
            <a className="jl-links" href={Config.contactUsUrl} target="_blank" rel="noopener noreferrer">
              {intl.get('s11.contact_us')}
            </a>
          </div>
        </div>
      </div>
    </Modal>
  );
});

export default ConnectWalletModal;
