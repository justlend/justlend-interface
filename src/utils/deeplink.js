import isMobile from 'ismobilejs';
import justLend from '../assets/images/justLend.svg';
function isInOkex() {
  return typeof window !== 'undefined' && /okex/i.test(window.navigator.userAgent);
}
function isInTokenPocket() {
  return typeof window !== 'undefined' && /tokenpocket/i.test(window.navigator.userAgent);
}

function isInTrustWallet() {
  return typeof window !== 'undefined' && !isInOkex() && window.trustwallet;
}
/**
 * Check if is in tronLink app by `window.iTron`
 * https://docs.tronlink.org/tronlink-app/dapp-support/dapp-explorer
 */
export const isInTronLinkApp = () => {
  return typeof window !== 'undefined' && window.iTron;
};
/**
 * Check should open TronLink app or not
 * @returns
 */
export const checkShouldOpenTronLink = () => {
  const mobileInfo = isMobile(window.navigator);
  if (mobileInfo.any && !isInTronLinkApp()) {
    const { origin, pathname, search, hash } = window.location;
    const url = origin + pathname + search + (hash.includes('?') ? hash : `${hash}?_=1`);
    const params = {
      action: 'open',
      actionId: Date.now() + '',
      callbackUrl: 'https://some-url.com', // no need callback
      dappIcon: justLend,
      dappName: 'Justlend DAO',
      url,
      protocol: 'TronLink',
      version: '1.0',
      chainId: '0x2b6653dc'
    };
    const link = `tronlinkoutside://pull.activity?param=${encodeURIComponent(JSON.stringify(params))}`;
    if (isInTokenPocket() || isInTrustWallet()) {
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
    return true;
  }
  return false;
};
