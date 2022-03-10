import React from 'react';
import isMobile from 'ismobilejs';
import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';
import LeftMenu from './LeftMenu';
import SwapCard from './swap/Card';
import TransactionModal from './Modals/Transaction';
import FooterPage from '../components/Footer';
import Config from '../config';
import { getTimeNow } from '../utils/backend';
import '../assets/css/miningPool.scss';
import '../assets/css/modal.scss';
import bannerMainTitle from '../assets/images/bannerTitle.svg';
import config from '../config';

@inject('network')
@inject('pool')
@observer
class MiningPool extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      lendActive: true, 
      mobile: isMobile(window.navigator).any
    };
  }

  componentDidMount = async () => {
    const { mobile } = this.state;
    this.props.network.setData({ routeName: 'pools' });
    this.props.pool.setData({ migrateRef: this.migrateRef });
    this.props.pool.getPoolData();
    this.props.pool.getTronbullish();

    await this.getNowTime();
    this.getCountTime();
  };

  getNowTime = async () => {
    try {
      let { multyStart } = this.props.network;
      const res = await getTimeNow();
      if (res.success) {
        const nowTime = res.time;
        if (nowTime < Config.startTime) {
          multyStart = false;
        } else if (nowTime >= Config.startTime) {
          multyStart = true;
        }
        this.props.network.setData({ nowTime, multyStart });

        if (nowTime >= Config.latestStartTime + 10000) {
          window.localStorage.setItem('nowTime', nowTime);
          return;
        }
      }
      setTimeout(() => {
        this.getNowTime();
      }, 3000);
    } catch (error) {
      console.log('get time error', error);
      setTimeout(() => {
        this.getNowTime();
      }, 3000);
    }
  };

  getCountTime = async () => {
    if (this.props.network.nowTime >= Config.latestStartTime + 10000) {
      window.localStorage.setItem('nowTime', this.props.network.nowTime);
      return;
    }
    if (this.props.network.nowTime === null) {
      await this.getNowTime();
    } else {
      const nowTime = this.props.network.nowTime + 1000;
      this.props.network.setData({
        nowTime,
        multyStart: nowTime > Config.startTime
      });
    }
    setTimeout(async () => {
      this.getCountTime();
    }, 1000);
  };

  mountedActions = () => {
    this.props.pool.getPoolData();
    this.props.pool.getTronbullish();
  };

  render() {
    const { nowTime, menuFlag } = this.props.network;
    const { lang, mobile } = this.state;
    const { activeSwaps } = Config;

    const { poolData = {} } = this.props.pool;

    let endStatus = nowTime > poolData[activeSwaps[0]].end;

    return (
      <div className={mobile ? '' : 'flex-end'}>
        <LeftMenu mountedActions={this.mountedActions} />
        <div
          className={
            'sunold-container ' +
            (mobile
              ? 'pool-container right-container mobile-right-container'
              : menuFlag
              ? 'pool-container right-container'
              : 'pool-container right-container max-width')
          }
        >
          <div className="pool-bg">
            <div className="pool-bg-left"></div>
            <div className="pool-bg-right"></div>
          </div>
          <div className="banner-title">
            {lang === 'zh-CN' ? (
              <img className="banner-main-title" src={bannerMainTitle}></img>
            ) : (
              <h1 className="banner-main-title-text">{intl.get('home.banner_title')}</h1>
            )}
            <p className="banner-sub-title">
              {endStatus ? intl.getHTML('home.banner_context_end') : intl.getHTML('home.banner_context')}
            </p>
          </div>
          <div className="multiple-claimed-cards">
            {activeSwaps.map(id => (
              <SwapCard cardData={poolData[id]} key={id} />
            ))}
          </div>
          <TransactionModal></TransactionModal>
          <FooterPage></FooterPage>
        </div>
      </div>
    );
  }
}

export default MiningPool;
