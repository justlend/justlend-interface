import isMobile from 'ismobilejs';
import justLend from '../assets/images/justLend.svg';
function isInOkex() {
  return typeof window !== 'undefined' && /okex/i.test(window.navigator.userAgent);
}
function isInTokenPocket() {
  return typeof window !== 'undefined' && /tokenpocket/i.test(window.navigator.userAgent);
}

function isInTrustWallet() {
  // 这里有个问题，okx 也会注入 window.trustwallet
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
    /**
     * 客户端会在url后面增加一个识别tronLink的参数，类似 utm_srouce=tronlink，
     * /#home             -->  /#home?utm_srouce=tronlink，
     * /?lang=en-UL#home  -->  /?lang=en-UL#home&utm_srouce=tronlink，
     *
     * 其中第二种情况会造成路由匹配失败，
     * 经观察发现客户端会往最后一个? 后面加参数，所以这里判断下hash是否包含 ? ，不包含的话手动加一个，防止报错
     */
    const url = origin + pathname + search + (hash.includes('?') ? hash : `${hash}?_=1`);
    const params = {
      action: 'open', // action 传空即可打开
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
      // 使用 iframe 加载，防止唤起失败时跳转到错误的页面，
      // 实际上更改 window.location.href 报错的话，用 iframe 也不会唤起
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
