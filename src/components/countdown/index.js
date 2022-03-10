import React from 'react';
import bigNumber, { BigNumber } from 'bignumber.js';
import { inject, observer } from 'mobx-react';
import { getTimeNow } from '../../utils/backend';
import '../../assets/css/countdown.scss';
import Count from './Count';
import Config from '../../config';
import { formatNumber, fromHex } from '../../utils/helper';
import intl from 'react-intl-universal';

import bannerMainTitleIcon from '../../assets/images/bannerTitle.svg';

@inject('network')
@inject('lend')
@inject('pool')
@observer
class CountDown extends React.Component {
  constructor(props) {
    super(props);
    this.nowTime = null;
    this.state = {
      h: '',
      m: '',
      s: '',
      show: !window.localStorage.getItem(Config.hideHomeBanner)
    };
  }

  getNowTime = async () => {
    try {
      const res = await getTimeNow();
      if (res.success) {
        const start = res.time;
        const end = Config.centuryRealStart;
        this.setState({
          start,
          end
        });
      }
    } catch (error) {
      console.log('get time error', error);
      setTimeout(() => {
        this.getNowTime();
      }, 3000);
    }
  };

  componentDidMount = async () => {
    this.getNowTime();
  };

  getMaxMintAPY = () => {
    const { assetList } = this.props.lend;
    const { marketDataSource } = this.props.lend;

    let arr = [];
    marketDataSource.map(item => {
      arr.push(BigNumber(item.depositApy).plus(BigNumber(assetList[item.jtokenAddress].totalAPYNEW)));
    });
    return bigNumber.maximum(...arr);
  };

  toSun = () => {
    const { multyRealStart } = this.props.network;
    const lang = this.props.lang || 'en-US';
    const defaultLang = window.localStorage.getItem('lang');
    if (multyRealStart) {
      window.location.href = `${Config.sunUrl}?lang=${defaultLang}#/stake`;
      // window.open(`${Config.sunUrl}?lang=${lang}#/sun`, 'sunswap');
    }
  };
  hideBanner = e => {
    this.setState({
      show: false
    });

    this.props.pool.hideBanner();
    e.stopPropagation();
  };

  render() {
    const { start, end } = this.state;
    const { lang, title, desc } = this.props;
    const { multyRealStart } = this.props.network;
    const maxMintAPY = this.getMaxMintAPY();
    return this.state.show ? (
      <div className="banner" onClick={() => this.toSun()}>
        <i className="close" onClick={e => this.hideBanner(e)}></i>
        <div className="banner-title">
          <div className="main-title">
            {lang === 'zh-CN' ? <img src={bannerMainTitleIcon} /> : intl.get('home.banner_title')}
          </div>
          <div className="sub-title">{intl.get('home.banner_context')}</div>
        </div>
      </div>
    ) : null;
  }
}

export default CountDown;
