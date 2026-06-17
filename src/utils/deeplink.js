import isMobile from 'ismobilejs';
import justLend from '../assets/images/justLend.svg';
function isInOkex() {
  return typeof window !== 'undefined' && /okex/i.test(window.navigator.userAgent);
}
function isInTokenPocket() {
  return typeof window !== 'undefined' && /tokenpocket/i.test(window.navigator.userAgent);
}

function isInBinance() {
  return typeof window !== 'undefined' && window.isBinance;
}

function isInTrustWallet() {
  return typeof window !== 'undefined' && !isInOkex() && window.trustwallet;
}

function triggerDeepLink(frameCheck, link) {
  if (frameCheck) {
    let iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = link;
    document.body.append(iframe);

    setTimeout(() => {
      iframe.remove();
      iframe = null;
    }, 5000);
  } else {
    window.location.href = link;
  }
}

/**
 * Check if is in tronLink app by `window.iTron`
 * https://docs.tronlink.org/tronlink-app/dapp-support/dapp-explorer
 */
export const isInTronLinkApp = () => {
  return typeof window !== 'undefined' && (window.iTron || window.tron);
};
/**
 * Check should open TronLink app or not
 * @returns
 */
export const checkShouldOpenTronLink = () => {
  const mobileInfo = isMobile(window.navigator);
  if (mobileInfo.any && !isInTronLinkApp() && !isInBinance()) {
    const { origin, pathname, search, hash } = window.location;
    const safeCallbackUrl = origin;
    /**
     * utm_srouce=tronlink，
     * /#home             -->  /#home?utm_srouce=tronlink，
     * /?lang=en-UL#home  -->  /?lang=en-UL#home&utm_srouce=tronlink，
     */
    const url = origin + pathname + search + (hash.includes('?') ? hash : `${hash}?_=1`);
    const params = {
      action: 'open', // action
      actionId: Date.now() + '',
      callbackUrl: safeCallbackUrl,
      dappIcon: justLend,
      dappName: 'Justlend DAO',
      url,
      protocol: 'TronLink',
      version: '1.0',
      chainId: '0x2b6653dc'
    };
    const link = `tronlinkoutside://pull.activity?param=${encodeURIComponent(JSON.stringify(params))}`;

    triggerDeepLink(isInOkex() || isInTokenPocket() || isInTrustWallet(), link);

    return true;
  }
  return false;
};

/**
 * Check should open Okex app or not
 * @returns
 */
export const checkShouldOpenOkex = () => {
  const mobileInfo = isMobile(window.navigator);
  if (mobileInfo.any && !isInOkex() && !isInBinance()) {
    const link = 'okx://';
    triggerDeepLink(isInTronLinkApp() || isInTokenPocket() || isInTrustWallet(), link);
  }
};

/**
 * Check should open TokenPocket app or not
 * @returns
 */
export const checkShouldOpenTokenPocket = () => {
  const mobileInfo = isMobile(window.navigator);
  if (mobileInfo.any && !isInTokenPocket()) {
    const safeCallbackUrl = window.location.origin;
    const params = {
      callbackUrl: safeCallbackUrl,
      action: 'login',
      actionId: '1648522106711',
      blockchains: [
        {
          'chainId': '728126428',
          'network': 'tron'
        }
      ],
      dappIcon: justLend,
      dappName: 'Justlend DAO',
      protocol: 'TokenPocket',
      version: '2.0'
    };
    const link = `tpoutside://pull.activity?param=${encodeURIComponent(JSON.stringify(params))}`;
    triggerDeepLink(isInTronLinkApp() || isInOkex() || isInTrustWallet(), link);
  }
};
