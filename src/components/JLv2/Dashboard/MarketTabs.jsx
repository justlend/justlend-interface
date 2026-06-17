import React, { useState, useEffect, useCallback } from 'react';
import intl from 'react-intl-universal';
import isMobile from 'ismobilejs';
import { observer } from 'mobx-react';
import Stores from '../../../stores';
import MarketList from './MarketList';
import FilterBar from './FilterBar';

let initOffsetTop = 0;
let targetTop = 0;

/**
 * check target element is sticky
 */
function checkIfSticky(element) {
  const style = window.getComputedStyle(element);

  if (style.position !== 'sticky') {
    return false;
  }
  const cssTopValue = parseFloat(style.top);
  const rectTop = element.getBoundingClientRect().top;
  const isStuck = Math.abs(rectTop - cssTopValue) < 1;
  const pageScrolledEnough = window.scrollY > 0;

  return isStuck && pageScrolledEnough;
}

export const MarketTabs = observer(({ listSkeletonRender }) => {
  const { dashboardStore, network, lend } = Stores;
  const { defaultAccount } = network;
  const { homeSearchparam, listLoading, activeTab, setActiveTab, supplyCount, borrowCount, setHomeSearchparam } = dashboardStore;

  const [mobile] = useState(isMobile(window.navigator).any);
  const [isTabScroll, setIsTabScroll] = useState(false);

  useEffect(() => {
    const tabsNavElement = document.querySelector('#tabsV2');
    initOffsetTop = tabsNavElement.getBoundingClientRect().top;
  }, [defaultAccount]);

  useEffect(() => {
    const stickyScrollCheck = () => {
      const tabsNavElement = document.querySelector('.all-list-content .list-header');
      if (tabsNavElement && checkIfSticky(tabsNavElement)) {
        
        if (!tabsNavElement.classList?.contains('list-header-sticky')) {
          tabsNavElement.classList?.add('list-header-sticky');
          document.querySelector('.leaf').classList?.add('after-have-bg');
        }
      } else {
        if (tabsNavElement?.classList?.contains('list-header-sticky')) {
          tabsNavElement.classList?.remove('list-header-sticky');
          document.querySelector('.leaf').classList?.remove('after-have-bg');
        }
      }
    }
    window.addEventListener('scroll', stickyScrollCheck);

    return () => {
      window.removeEventListener('scroll', stickyScrollCheck);
    }
  }, []);


  useEffect(() => {
    if (!mobile && isTabScroll && !listLoading && targetTop >= 84) {
      window.scrollTo({
        top: initOffsetTop - targetTop,
        behavior: 'auto'
      });

      setIsTabScroll(false);
    }
  }, [listLoading, isTabScroll]);

  const handleTabsChange = type => {
    const tabsNavElement = document.querySelector('#tabsV2');
    targetTop = tabsNavElement.getBoundingClientRect().top;

    setIsTabScroll(true);
    setActiveTab(type);
  };

  return (
    <>
      <div className="tabs-v2" id="tabsV2">
        <div className='tabs-v2-bg'></div>
        <div className="tabs-v2-content">
          <div className="tabs-btns">
            <button
              onClick={() => handleTabsChange('supply')}
              className={activeTab === 'supply' ? 'active' : ''}
            >
              {intl.get('jlv2.home.supply_vault')}{' '}
              {supplyCount > 0 ? (
                <span className="tabs-count count-supply">{supplyCount}</span>
              ) : (
                ''
              )}
            </button>
            <button
              onClick={() => handleTabsChange('borrow')}
              className={activeTab === 'borrow' ? 'active' : ''}
            >
              {intl.get('jlv2.home.lending_market')}{' '}
              {borrowCount > 0 ? (
                <span className="tabs-count count-borrow">{borrowCount}</span>
              ) : (
                ''
              )}
            </button>
          </div>
          <FilterBar />
        </div>
      </div>
      <MarketList listSkeletonRender={listSkeletonRender} />
    </>
  );
});
