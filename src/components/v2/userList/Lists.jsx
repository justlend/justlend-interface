import React, { useEffect, useRef } from 'react';
import isMobile from 'ismobilejs';
import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';
import SupplyList from './SupplyList';
import BorrowList from './BorrowList';
import RecommendToken from './RecommendToken';
import MiningRow from './MiningRow';
import { BigNumber, getParameterByName } from '../../../utils/helper';
import Config from '../../../config';
import { RecommendLiquidityStake } from './RecommendLiquidityStake.jsx';
const { adBannerVisible } = Config;
@inject('network')
@inject('lend')
@inject('pool')
@inject('user')
@observer
class Lists extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      activeKey: 'all',
      toast: !window.localStorage.getItem('hideWarningTipsV2')
    };
  }

  tabChange = activeKey => {
    this.props.lend.setActiveKey(activeKey);
  };

  hideToast = () => {
    window.gtag('event', 'PC_hide_toast', { 'event_category': 'PC_V1.5', 'event_label': 'hide_toast' });
    this.setState({ toast: false });
    window.localStorage.setItem('hideWarningTipsV2', true);
  };

  render() {
    const { activeKey: activeKeyLend } = this.props.lend;
    const { toast, lang } = this.state;
    const { isShowRecommendToken, isShowUSDDUpdateAd, userDepositDataSource, userLendDataSource } = this.props.user;
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
          <div className="j-records">
            <div className="j-tabs-outer">
              <div className="j-tabs-title">{intl.get('s6.my_position')}</div>
              <div className="j-tabs">
                <div
                  className={activeKey === 'all' ? 'current' : ''}
                  onClick={() => {
                    this.tabChange('all');
                    window.gtag('event', 'PC_tab_all', { 'event_category': 'PC_V1.5', 'event_label': 'tab_all' });
                  }}
                >
                  <span>{intl.get('v2.all')}</span>
                </div>
                <div
                  className={activeKey === 'supply' ? 'current' : ''}
                  onClick={() => {
                    this.tabChange('supply');
                    window.gtag('event', 'PC_tab_supply', { 'event_category': 'PC_V1.5', 'event_label': 'tab_supply' });
                  }}
                >
                  <span>{intl.get('s6.tab_deposit')}</span>
                  {dataSource && dataSource.length > 0 && <span className="j-num supply">{dataSource.length}</span>}
                </div>
                <div
                  className={activeKey === 'borrow' ? 'current' : ''}
                  onClick={() => {
                    this.tabChange('borrow');
                    window.gtag('event', 'PC_tab_borrow', { 'event_category': 'PC_V1.5', 'event_label': 'tab_borrow' });
                  }}
                >
                  <span>{intl.get('s6.tab_borrow')}</span>
                  {userLendDataSource && userLendDataSource.length > 0 && (
                    <span className="j-num borrow">{userLendDataSource.length}</span>
                  )}
                </div>
              </div>
            </div>
            <div
              className={
                'j-list-content' +
                (showRecommendToken || (!isShowUSDDUpdateAd && adBannerVisible) ? ' has-recommend-token' : '') +
                (!!hideWarningTipsV2 ? ' hide-warning-tips-V2' : '')
              }
            >
              <div>
                {['all', 'supply'].includes(activeKey) && <SupplyList />}
                {/* {['all'].includes(activeKey) && <div className="horizontal-line"></div>} */}
                {['all', 'borrow'].includes(activeKey) && <BorrowList />}

                {['all', 'supply'].includes(activeKey) &&
                  BigNumber(this.props.pool.poolData['jstlp1'].staked).gt(0) &&
                  Config.activeSwaps.map((id, index) => (
                    <MiningRow cardData={this.props.pool.poolData[id]} key={id + index} />
                  ))}

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
                <div className="linear"></div>
              </div>
            </div>
          </div>
        )}
        {!isShowUSDDUpdateAd && adBannerVisible ? (
          <RecommendLiquidityStake isUSDDUpdateBanner={true} />
        ) : (
          showRecommendToken && <RecommendLiquidityStake />
        )}
      </>
    );
  }
}

export default Lists;
