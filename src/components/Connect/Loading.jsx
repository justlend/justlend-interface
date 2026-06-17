import React, { useEffect, useState, useRef, useContext } from 'react';
import { inject, observer } from 'mobx-react';
import intl from 'react-intl-universal';
import isMobile from 'ismobilejs';
import { Modal } from 'antd';
import Config from '../../config';
import { WALLET_TYPES } from '../../utils/constant';
import { StoreContext } from '../Context/StoreContext';
import '../../assets/css/connect-modal.scss';
import LoadingImg from '../../assets/images/connect/loading.png';
import TronlinkImg from '../../assets/images/connect/tronlink.svg';
import BinanceImg from '../../assets/images/connect/binance.svg';
import OKXImg from '../../assets/images/connect/okx.svg';
import TokenPocketImg from '../../assets/images/connect/tokenpocket.svg';
import UninstallImg from '../../assets/images/connect/uninstall_wallet_warn.svg';
import UninstallWhiteImg from '../../assets/images/connect/uninstall_wallet_warn_white.svg';

const WALLET_IMGS = {
  [WALLET_TYPES.TRONLINK]: TronlinkImg,
  [WALLET_TYPES.OKX]: OKXImg,
  [WALLET_TYPES.BINANCE]: BinanceImg,
  [WALLET_TYPES.TOKENPOCKET]: TokenPocketImg
};

const Loading = observer(({ handleCancel }) => {
  const { lend, network } = useContext(StoreContext);
  const mobile = isMobile(window.navigator).any;

  const { routeName, connectingWallet, isTokenPocketNoAddress, unInstalledWallet } = network;
  const { theme } = routeName === 'StUSDT' ? { theme: '' } : lend;

  return (
    <Modal
      title={intl.get('navi.wallet_linkbtn')}
      maskClosable={false}
      visible={true}
      closable={true}
      onCancel={handleCancel}
      footer={null}
      centered
      className={`connect-modal-v2 loading-modal-v2${theme === 'white' ? ' white' : ''}`}
    >
      <div className="connect-element-v2">
        {unInstalledWallet || isTokenPocketNoAddress ? (
          <div className="no-wallet-wrap">
            <img
              src={unInstalledWallet ? WALLET_IMGS[unInstalledWallet] : TokenPocketImg}
              alt=""
              className="no-wallet"
            />
            <img src={theme === 'white' ? UninstallWhiteImg : UninstallImg} alt="" className="no-wallet-warn" />
            <p className="title">
              {intl.get(unInstalledWallet ? 'wallet.no_install_title' : 'wallet.address_not_found')}
            </p>
            <p className="desc">
              {unInstalledWallet ? (
                <>
                  {intl.get('wallet.no_install_desc')}
                  <br />
                </>
              ) : null}
              {intl.getHTML(unInstalledWallet ? 'wallet.no_install_reload' : 'wallet.need_to_create_address')}
            </p>
          </div>
        ) : (
          <div>
            <img src={LoadingImg} alt="" className="loading" />
            <p className="title">{intl.get('account_modal.connecting')}</p>
            <p className="desc">{intl.get('account_modal.confirm')}</p>
          </div>
        )}
        <div
          className="tips tips1"
          style={{ visibility: unInstalledWallet || isTokenPocketNoAddress ? 'visible' : 'hidden' }}
        >
          <span>
            {connectingWallet === 'tronlink'
              ? intl.get('wallet.no_wallet')
              : connectingWallet === 'okx'
              ? intl.getHTML('s11.no_wallet', { token: 'OKX' })
              : connectingWallet === 'tokenpocket'
              ? intl.getHTML('s11.no_wallet', { token: 'TokenPocket' })
              : connectingWallet === 'binance'
              ? intl.getHTML('s11.no_wallet', { token: 'Binance' })
              : ''}{' '}
          </span>

          <a
            target="_blank"
            rel="noopener noreferrer"
            href={
              connectingWallet === 'tronlink'
                ? Config.tronlinkWalletUrl
                : connectingWallet === 'okx'
                ? Config.okxWalletUrl
                : connectingWallet === 'binance'
                ? (mobile ? Config.binanceWalletMobileUrl : Config.binanceWalletUrl)
                : connectingWallet === 'tokenpocket' && Config.tokenPocketWalletUrl
            }
          >
            {connectingWallet === 'tronlink'
              ? intl.get('wallet.click_to_get')
              : connectingWallet === 'okx'
              ? intl.get('wallet.click_to_get_okx')
              : connectingWallet === 'tokenpocket'
              ? intl.get('wallet.click_to_get_wallet', { token: 'TokenPocket' })
              : connectingWallet === 'binance'
              ? intl.get('wallet.click_to_get_wallet', { token: 'Binance' })
              : ''}
            <em></em>
          </a>
        </div>
        <div className="tips">
          <span>{intl.get(mobile || unInstalledWallet ? 's11.connect_trouble' : 's11.connect_trouble_pc')} </span>
          <a target="_blank" rel="noopener noreferrer" href={Config.userGuideUrl}>
            {intl.get('s11.help_doc')}
            <em></em>
          </a>
        </div>
      </div>
    </Modal>
  );
});

export default Loading;
