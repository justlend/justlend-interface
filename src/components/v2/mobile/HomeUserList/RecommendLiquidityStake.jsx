import BigNumber from 'bignumber.js';
import { inject, observer } from 'mobx-react';
import React from 'react';
// import '../../../../assets/css/v2/home/recommend-liquidity-stake.scss';
import { goToPage, formatNumber } from '../../../../utils/helper';
import intl from 'react-intl-universal';
import config from '../../../../config';

@inject('network')
@inject('lend')
@inject('strx')
@inject('user')
@observer
class RecommendLiquidityStake extends React.Component {
  componentDidMount() {
    this.props.strx.getMarketData();
  }

  onClose = e => {
    e.stopPropagation();
    const addr = this.props.network.defaultAccount;
    if (this.props.isUSDDUpdateBanner) {
      window.localStorage.setItem('isShowUSDDUpdateAd_' + addr, '1');
      this.props.user.setUSDDUpdateAd('1');
      window.localStorage.setItem('isShowRecommendToken_' + addr, '1');
      this.props.user.setRecommendToken('1');
    } else {
      window.localStorage.setItem('isShowRecommendToken_' + addr, '1');
      this.props.user.setRecommendToken('1');
    }
  };
  onClick = () => {
    if (this.props.isUSDDUpdateBanner) {
      window.open(config.adLink);
      return;
    }
    goToPage('strx', this.props.type === 'old' ? '_blank' : '_self');
    window.gtag('event', 'H5_recommend_strx', { 'event_category': 'sTRX', 'event_label': 'recommend_strx' });
  };
  render() {
    const { theme: lendTheme, lang } = this.props.lend;
    const theme = this.props.type === 'old' ? 'white' : lendTheme;
    const { marketData } = this.props.strx;
    return (
      <div
        className={
          'recommend-liquidity-stake ' +
          theme +
          (this.props.isUSDDUpdateBanner ? ' usdd-update' : '') +
          ' ' +
          lang +
          (this.props.isTop ? ' top' : '')
        }
        onClick={this.onClick}
      >
        <p className={`title ${lang}`}>
          <span className="icon">NEW</span>
        </p>
        <p className={`text ${lang}`}>
          {intl.getHTML('strx.energy_banner_tip', {
            value: formatNumber(marketData.avgApy * 100, 2, { miniText: 0.01 }) + '% APY'
          })}
        </p>
        <i className="close" onClick={this.onClose}></i>
        <div className="bg"></div>
      </div>
    );
  }
}

export { RecommendLiquidityStake };
