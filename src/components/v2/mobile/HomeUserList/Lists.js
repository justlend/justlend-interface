import React, { useEffect, useRef } from 'react';
import isMobile from 'ismobilejs';
import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';
import SupplyList from './SupplyList';
import BorrowList from './BorrowList';
import RecommendToken from './RecommendToken';
import MiningRow from './MiningRow';
import { BigNumber, getParameterByName } from '../../../../utils/helper';
import Config from '../../../../config';
import { RecommendLiquidityStake } from './RecommendLiquidityStake.jsx';
import topArrowWhiteIcon from '../../../../assets/images/mobile/arrow-top-white-v2.svg';
import topArrowIcon from '../../../../assets/images/mobile/arrow-top-v2.svg';
const { comingSoonBannerVisible } = Config;
@inject('network')
@inject('lend')
@inject('pool')
@observer
class Lists extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      toast: !window.localStorage.getItem('hideWarningTipsV2'),
      scrollTop: 0
    };
  }

  tabChange = activeKey => {
    this.props.lend.setData({ activeKey });
  };

  hideToast = () => {
    window.gtag('event', 'H5_hide_toast', { 'event_category': 'PC_V1.5', 'event_label': 'hide_toast' });
    this.setState({ toast: false });
    window.localStorage.setItem('hideWarningTipsV2', true);
  };

  scrollTop = (bool, type) => {
    if (bool) {
      let scrollTop = document.getElementsByClassName('show-more-info')[0].offsetTop + 520;
      this.setState({ scrollTop });
    } else {
      const { scrollTop } = this.state;
      document.documentElement.scrollTop = scrollTop;
    }

    const { isDepositShowMore, isLendShowMore, isShowMoreV2 } = this.props.network;
    if (type === 'isShowMoreV2') {
      this.props.network.setData({ isShowMoreV2: !isShowMoreV2 });
    } else if (type === 'isDepositShowMore') {
      this.props.network.setData({ isDepositShowMore: !isDepositShowMore });
    } else if (type === 'isLendShowMore') {
      this.props.network.setData({ isLendShowMore: !isLendShowMore });
    }
  };

  render() {
    const { isDepositShowMore, isLendShowMore, isShowMoreV2 } = this.props.network;
    const {
      userDepositDataSource,
      userLendDataSource,
      isShowRecommendToken,
      isShowUSDDUpdateAd,
      theme,
      activeKey: activeKeyLend
    } = this.props.lend;
    const { toast, lang } = this.state;

    const paramActiveKey = getParameterByName('activeKey');
    let activeKey = '';
    if (!paramActiveKey && !activeKeyLend) {
      activeKey = 'all';
    } else {
      activeKey = activeKeyLend || paramActiveKey;
    }

    let depositNum = 0;
    let lendNum = 0;
    // let dataSource = userDepositDataSource?.filter(item => item.account_entered === 1);
    let dataSource = userDepositDataSource;

    if (dataSource && dataSource.length) {
      depositNum = dataSource.length;
    }
    if (userLendDataSource && userLendDataSource.length) {
      lendNum = userLendDataSource.length;
    }

    let lpNum = BigNumber(this.props.pool.poolData['jstlp1'].staked).gt(0) ? 1 : 0;
    const hasExtraSpace =
      (activeKey === 'all' && lpNum + depositNum + lendNum <= 3) || (activeKey === 'supply' && lpNum + depositNum <= 3);
    let showRecommendToken = !isShowRecommendToken && hasExtraSpace;
    let hideWarningTipsV2 = window.localStorage.getItem('hideWarningTipsV2');

    return (
      <>
        {depositNum > 0 && (
          <div className="j-home-records">
            <div className="j-tabs-title">{intl.get('s6.my_position')}</div>
            <div className="j-home-user-list-tabs">
              <div
                className={activeKey === 'all' ? 'current' : ''}
                onClick={() => {
                  this.tabChange('all');
                  window.gtag('event', 'H5_tab_all', { 'event_category': 'H5', 'event_label': 'tab_all' });
                }}
              >
                <span className="j-tab-text">{intl.get('v2.all')}</span>
              </div>
              <div
                className={activeKey === 'supply' ? 'current' : ''}
                onClick={() => {
                  this.tabChange('supply');
                  window.gtag('event', 'H5_tab_supply', { 'event_category': 'H5', 'event_label': 'tab_supply' });
                }}
              >
                <span className="j-tab-text">{intl.get('s6.tab_deposit')}</span>
                {dataSource && dataSource.length > 0 && <span className="j-tab-num supply">{dataSource.length}</span>}
              </div>
              <div
                className={activeKey === 'borrow' ? 'current' : ''}
                onClick={() => {
                  this.tabChange('borrow');
                  window.gtag('event', 'H5_tab_borrow', { 'event_category': 'H5', 'event_label': 'tab_borrow' });
                }}
              >
                <span className="j-tab-text">{intl.get('s6.tab_borrow')}</span>
                {userLendDataSource && userLendDataSource.length > 0 && (
                  <span className="j-tab-num borrow">{userLendDataSource.length}</span>
                )}
              </div>
            </div>
            {['all', 'supply'].includes(activeKey) && toast === true && (
              <div className="j-warning-tip">
                <div>
                  <span className="j-warning-icon"></span>
                  {intl.get('v2.tip7')}
                  {/* <a href={lang === 'en-US' ? Config.learnMoreEn : Config.learnMoreCn} target="learnMore">
                    {intl.get('toast.warning_tip_more')}
                  </a> */}
                </div>
                <div className="clear-icon" onClick={this.hideToast}></div>
              </div>
            )}
            <div
              className={
                'j-list-content' +
                // (showRecommendToken ? ' has-recommend-token' : '') +
                (!!hideWarningTipsV2 ? ' hide-warning-tips-V2' : '') +
                ((activeKey === 'all' && lpNum + depositNum + lendNum > 5 && !isShowMoreV2) ||
                (activeKey === 'supply' && lpNum + depositNum > 5 && !isDepositShowMore) ||
                (activeKey === 'borrow' && lendNum > 5 && !isLendShowMore)
                  ? ' is-all-current'
                  : '') +
                ((activeKey === 'supply' && depositNum <= 0) || (activeKey === 'borrow' && lendNum <= 0)
                  ? ' no-data'
                  : '')
              }
            >
              <div>
                {['all', 'supply'].includes(activeKey) && <SupplyList />}
                {['all', 'supply'].includes(activeKey) &&
                  BigNumber(this.props.pool.poolData['jstlp1'].staked).gt(0) &&
                  Config.activeSwaps.map((id, index) => (
                    <MiningRow cardData={this.props.pool.poolData[id]} key={id + index} />
                  ))}
                {['all', 'borrow'].includes(activeKey) && <BorrowList activeKey={activeKey} />}

                {((activeKey === 'all' && lpNum + depositNum + lendNum > 5 && !isShowMoreV2) ||
                  (activeKey === 'supply' && lpNum + depositNum > 5 && !isDepositShowMore) ||
                  (activeKey === 'borrow' && lendNum > 5 && !isLendShowMore)) && <div className="linear"></div>}
              </div>
            </div>

            {activeKey === 'all' && lpNum + depositNum + lendNum > 5 && (
              <div
                className={'show-more-info' + (!!isShowMoreV2 ? ' active' : '')}
                onClick={() => this.scrollTop(!isShowMoreV2, 'isShowMoreV2')}
              >
                {isShowMoreV2 ? intl.get('slide_up') : intl.get('v2.rewards.expand')}
                <img src={theme === 'white' ? topArrowWhiteIcon : topArrowIcon} />
              </div>
            )}

            {activeKey === 'supply' && lpNum + depositNum > 5 && (
              <div
                className={'show-more-info' + (!!isDepositShowMore ? ' active' : '')}
                onClick={() => this.scrollTop(!isDepositShowMore, 'isDepositShowMore')}
              >
                {isDepositShowMore ? intl.get('slide_up') : intl.get('v2.rewards.expand')}
                <img src={theme === 'white' ? topArrowWhiteIcon : topArrowIcon} />
              </div>
            )}

            {activeKey === 'borrow' && lendNum > 5 && (
              <div
                className={'show-more-info' + (!!isLendShowMore ? ' active' : '')}
                onClick={() => this.scrollTop(!isLendShowMore, 'isLendShowMore')}
              >
                {isLendShowMore ? intl.get('slide_up') : intl.get('v2.rewards.expand')}
                <img src={theme === 'white' ? topArrowWhiteIcon : topArrowIcon} />
              </div>
            )}
          </div>
        )}
        {!depositNum > 0 && !isShowUSDDUpdateAd && comingSoonBannerVisible && (
          <RecommendLiquidityStake isUSDDUpdateBanner={true} depositNum={depositNum} />
        )}
        {/* {showRecommendToken && <RecommendLiquidityStake />} */}
      </>
    );
  }
}

export default Lists;
