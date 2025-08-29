import React, { useEffect, useRef } from 'react';
import isMobile from 'ismobilejs';
import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';
import { formatNumber, BigNumber, getTotalApy, renderBalanceNew } from '../../../../utils/helper';
import { ICONS_MAP } from '../../../../utils/constant';
import DefaultImg from '../../../../assets/images/v2/default-icon.svg';
import DefaultWhiteImg from '../../../../assets/images/v2/white-theme/default-icon.svg';

@inject('network')
@inject('lend')
@inject('system')
@observer
class RecommendToken extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      tokenSymbol: 'TRX'
    };
  }

  filterUserEmptySunOld = (marketDataSource, isUserSunOldEmpty) => {
    if (marketDataSource) {
      let filterMarketDataSource = [...marketDataSource];
      marketDataSource.map((item, index) => {
        if (isUserSunOldEmpty && item?.collateralSymbol?.toLowerCase() === 'sunold') {
          filterMarketDataSource.splice(index, 1);
        }
      });
      return filterMarketDataSource;
    }
  };

  clickRow = row => {
    const { isConnected } = this.props.network;
    if (!isConnected) {
      return this.props.network.connectWallet();
    }

    if (this.props.network.isRightChain === 0) {
      this.props.network.changeChain();
      return;
    }

    if (this.props.network.isMainNetwork === 0) {
      this.props.network.showNetworkErrorModal();
      return;
    }

    // window.gtag('event', 'click', { 'event_category': 'PC', 'event_label': 'My Supply' });
    this.showDAW(row, '1');
  };

  showDAW = (popData, activeKey, cb) => {
    this.props.system.setData({ transModalInfo: { declined: false } });
    this.props.lend.setData({
      DAWPop: {
        show: true,
        activeKey,
        popData: popData,
        cb
      }
    });
  };

  closeRecommend = () => {
    window.gtag('event', 'H5_close_recommend', { 'event_category': 'H5', 'event_label': 'close_recommend' });
    const addr = this.props.network.defaultAccount;
    window.localStorage.setItem('isShowRecommendToken_' + addr, '1');
    this.props.lend.setData({ isShowRecommendToken: '1' });
  };

  recommendToken = () => {
    const { lang } = this.state;
    let { marketDataSource, balanceInfo, isUserSunOldEmpty, assetList, isShowRecommendToken, theme } = this.props.lend;
    marketDataSource = this.filterUserEmptySunOld(marketDataSource, isUserSunOldEmpty);

    let tokenSymbol = '';
    let tokenApy = '--';
    let balance = 0;
    let obj = null;

    marketDataSource.map(item => {
      const { jtokenAddress, precision, collateralSymbol } = item;
      if (balanceInfo[jtokenAddress] && balanceInfo[jtokenAddress].balance) {
        let balances = BigNumber(balanceInfo[jtokenAddress].balance).div(precision);
        if (collateralSymbol?.toLowerCase() === 'usdd') {
          balance = balances;
          tokenSymbol = collateralSymbol;
          const { totalApy } = getTotalApy(item, assetList);
          tokenApy = totalApy;
          obj = item;
        }
        // if (BigNumber(balances).gt(balance)) {
        //   balance = balances;
        //   tokenSymbol = collateralSymbol;
        //   const { totalApy } = getTotalApy(item, assetList);
        //   tokenApy = totalApy;
        //   obj = item;
        // }
      }
    });
    return (
      !isShowRecommendToken && (
        <div className={'j-ele j-recommend ' + tokenSymbol.toLowerCase() + (lang === 'en-US' ? ' en' : '')}>
          <div>
            <div className="recommend-token">
              <img
                src={
                  tokenSymbol ? ICONS_MAP[tokenSymbol.toLowerCase()] : theme === 'white' ? DefaultWhiteImg : DefaultImg
                }
                className="token-img"
                alt=""
              />
              <span className="token-text">{tokenSymbol}</span>
              <div className="recommend-ele">
                <span className="recommend-img"></span>
                <div>{intl.get('v2.recommended')}</div>
              </div>
            </div>
          </div>
          <div>
            <div className="recommend-info">
              <div>{intl.get('depositapy')}</div>
              <div>{formatNumber(tokenApy, 2, { cutZero: false, miniText: 0.01, per: true })}%</div>
            </div>
          </div>
          <div>
            <div className="recommend-info">
              <div>{intl.get('deposit.wallet_balance')}</div>
              <div>{renderBalanceNew(obj, balanceInfo)}</div>
            </div>
          </div>
          <div>
            <div>
              {tokenSymbol && (
                <div className="recommend-btn" onClick={() => this.clickRow(obj)}>
                  {intl.get('deposit.deposit')}
                </div>
              )}
            </div>
          </div>
          <span className="clear-icon" onClick={this.closeRecommend}></span>
        </div>
      )
    );
  };

  render() {
    return <>{this.recommendToken()}</>;
  }
}

export default RecommendToken;
