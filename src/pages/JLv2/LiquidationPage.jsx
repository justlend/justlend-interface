import React, { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react';
import { Link } from 'react-router-dom';
import { Skeleton, Tooltip, Input, Button } from 'antd';
import isMobile from 'ismobilejs';
import moment from 'moment';
import Store from '../../stores';
import Header from '../../components/v2/Header';
import Footer from '../../components/v2/Footer';
import TabsBar from '../../components/v2/mobile/TabsBar';
import SeasonToolBar from '../../components/v2/season/index';
import { DropdownFilter } from '../../components/Common/DropdownFilter';
import { TransactionModal } from '../../components/JLv2/TransactionModal';
import { PendingList } from '../../components/JLv2/Liquidation/Pending';
import { PublicList } from '../../components/JLv2/Liquidation/Public';
import { BotList } from '../../components/JLv2/Liquidation/Bot';
import NoticeModal from '../../components/JLv2/Liquidation/NoticeModal';
import { numberParser, BigNumber } from '../../utils/helper';
import { getLendIcons } from '../../utils/constant';
import '../../assets/css/JLv2/common.scss';
import '../../assets/css/JLv2/liquidation.scss';
import '../../assets/css/v2/theme.scss';

const LiquidationPage = observer(() => {
  const { lend, liquidationV2 } = Store;
  const {
    activeTab,
    setActiveTab,
    getDataInterval,
    getInfo,
    updateTime,
    handleLoadMore,
    moreLoading,
    fetchSearchTokens,
    debtTokens,
    collateralTokens,
    setFilters,
    setPage,
    clearSearch,
    pendingLiquidationList = null,
    publicLiquidationList = null,
    botLiquidationList = null,
    listCount,
    listLoading,
  } = liquidationV2;

  const [mobile] = useState(isMobile(window.navigator).any);
  const [sdebtTokens, setSdebtTokens] = useState([]);
  const [scollateralTokens, setScollateralTokens] = useState([]);
  const [sminRiskLevel, setSminRiskLevel] = useState('');
  const [smaxRiskLevel, setSmaxRiskLevel] = useState('');
  const [minRiskError, setMinRiskError] = useState('');
  const [maxRiskError, setMaxRiskError] = useState('');

  useEffect(() => {
    fetchSearchTokens();
    lend.getCurrentBlock();
    // getDataInterval();

    const debtTokens = window.sessionStorage.getItem('liquidation_debtTokens');
    const collateralTokens = window.sessionStorage.getItem('liquidation_collateralTokens');

    if (debtTokens) {
      setSdebtTokens(JSON.parse(debtTokens));
      setFilters('debtTokens', JSON.parse(debtTokens), false);
    }

    if (collateralTokens) {
      setScollateralTokens(JSON.parse(collateralTokens));
      setFilters('collateralTokens', JSON.parse(collateralTokens), false);
    }

    setTimeout(() => {
      getInfo(activeTab);
    });

    return () => {
      clearSearch(false); 
    }
  }, []);

  const refreshDateFn = async () => {
    getInfo(activeTab);
  };

  const minRiskChange = (e) => {
    const value = e.target.value;
    const { valid, str } = numberParser(value, 2);

    if (valid) {
      setSminRiskLevel(str);

      let errMsg = '';
      if (BigNumber(str).isNaN()) {
        errMsg = '';
      } else if (BigNumber(str).lt(95)) {
        errMsg = intl.get('liquidate.risk.placeholder');
      } else {
        errMsg = '';
      }
      setMinRiskError(errMsg);

      if (!BigNumber(smaxRiskLevel).isNaN() && BigNumber(str).gt(smaxRiskLevel)) {
        let errMsg1 = intl.get('liquidate.risk.msg1', { number: str });
        setMaxRiskError(errMsg1);
      } else {
        setMaxRiskError('');
      }
    }
  };

  const maxRiskChange = (e) => {
    const value = e.target.value;
    const { valid, str } = numberParser(value, 2);

    if(valid) {
      setSmaxRiskLevel(str);

      let errMsg1 = '';
      if (BigNumber(str).isNaN()) {
        errMsg1 = '';
      } else if (BigNumber(str).lt(95)) {
        errMsg1 = intl.get('liquidate.risk.placeholder');
      } else if (!BigNumber(sminRiskLevel).isNaN() && BigNumber(str).lt(sminRiskLevel)) {
        errMsg1 = intl.get('liquidate.risk.msg1', { number: sminRiskLevel });
      } else {
        errMsg1 = '';
      }
      setMaxRiskError(errMsg1);
    }
  };

  const handleSearch = () => {
    setFilters('debtTokens', sdebtTokens, false);
    setFilters('collateralTokens', scollateralTokens, false);
    setFilters('minRiskLevel', sminRiskLevel, false);
    setFilters('maxRiskLevel', smaxRiskLevel, false);
    setPage(1);
  };

  const handleReset = () => {
    setMinRiskError('');
    setMaxRiskError('');
    setSdebtTokens([]);
    setScollateralTokens([]);
    setSminRiskLevel('');
    setSmaxRiskLevel('');
    clearSearch();
  };

  const isPendingTab =  activeTab === 'pending';
  const dataList = isPendingTab ? pendingLiquidationList : (activeTab === 'public' ? publicLiquidationList : botLiquidationList);

  return (
    <>
      <div className={'jlv2-bg liquidationv2 ' + lend.theme}>
        <Header instantActions={null} mountedActions={null} />
        <SeasonToolBar pageName="liquidationV2" />
        <div className="liquidationv2-page-container common-page-container">
          <div className="liquidationv2-page-content">
            <div className="liquidationv2-header">
              <div className="liquidationv2-title">{intl.get('jlv2.liquidation.title')} <em className="v2-icon"></em></div>
              <div className="liquidationv2-subtitle">{intl.get('jlv2.liquidation.desc')}</div>
            </div>
            {
              mobile && (
                <div className="j-refresh" onClick={refreshDateFn}>
                  <em></em>
                  {intl.getHTML('liquidate.liquidate_update_time', { time: moment(updateTime || Date.now()).format('YYYY-MM-DD HH:mm') })}
                </div>
              )
            }
            <div className="liquidationv2-content">
              <div className="liquidationv2-tabs-wrapper">
                <div className="liquidationv2-tabs">
                  <div>{intl.get('jlv2.liquidation.tab_pending')}</div>
                  {/* <div className={activeTab === 'public' ? "current" : ''} onClick={e => setActiveTab('public')}>Public liquidation Records</div>
                  <div className={activeTab === 'bot' ? "current" : ''} onClick={e => setActiveTab('bot')}>Bot liquidation Records</div> */}
                </div>
                {
                  !mobile && (
                    <div className="j-refresh" onClick={refreshDateFn}>
                      <em></em>
                      {intl.getHTML('liquidate.liquidate_update_time', { time: moment(updateTime || Date.now()).format('YYYY-MM-DD HH:mm') })}
                    </div>
                  )
                }
              </div>
              <div className="liquidationv2-filter filter-bar">
                <div className="fb-item">
                  <DropdownFilter
                    title={intl.get('jlv2.liquidation.search_collateral')}
                    selectedPrefix={<span className='dropdown-prefix'>{intl.get('jlv2.liquidation.search_collateral')}: </span>}
                    options={collateralTokens}
                    selectedOptions={scollateralTokens}
                    onChange={selection => setScollateralTokens(selection)}
                  />
                </div>
                <div className="fb-item">
                  <DropdownFilter
                    title={intl.get('jlv2.liquidation.search_debt')}
                    selectedPrefix={<span className='dropdown-prefix'>{intl.get('jlv2.liquidation.search_debt')}: </span>}
                    options={debtTokens}
                    selectedOptions={sdebtTokens}
                    onChange={selection => setSdebtTokens(selection)}
                  />
                </div>
                {activeTab === 'pending' && <div className="risk-filter">
                  <span className="filter-text">{intl.get('jlv2.liquidation.search_risk_level')}</span>
                  <Input
                    className={'j-input search-token ' + (minRiskError ? 'j-error-input' : '')}
                    placeholder={'95'}
                    value={sminRiskLevel}
                    onChange={minRiskChange}
                  />
                  <em></em>
                  <Input
                    className={'j-input search-token ' + (maxRiskError ? 'j-error-input' : '')}
                    placeholder={'999'}
                    value={smaxRiskLevel}
                    onChange={maxRiskChange}
                  />
                  {(minRiskError || maxRiskError) && (
                    <div className={'risk-error-msg ' + (lend.lang === 'en-US' ? 'en' : '')}>
                      <em></em>
                      <span>{minRiskError || maxRiskError}</span>
                    </div>
                  )}
                  <Button
                    className="details-btn bg-btn confirm-btn"
                    disabled={minRiskError || maxRiskError}
                    onClick={handleSearch}
                  >
                    {intl.get('jlv2.liquidation.search_btn_confirm')}
                  </Button>
                  <Button
                    className="details-btn reset-btn"
                    onClick={handleReset}
                  >
                    {intl.get('jlv2.liquidation.search_btn_reset')}
                  </Button>
                </div>}
              </div>
              {activeTab === 'pending' && <PendingList />}
              {/* {activeTab === 'public' && <PublicList />}
              {activeTab === 'bot' && <BotList />} */}
              {listCount > (dataList?.length || 0) && !listLoading && (
              <div className="load-more-v2">
                <div onClick={handleLoadMore}>
                  <span className="load-text">
                    {moreLoading ? intl.get('jlv2.home.loading') : intl.get('jlv2.home.load_more')}
                  </span>
                  <span className={`${moreLoading ? 'loading-icon' : 'load-icon'}`}></span>
                </div>
              </div>
              )}
            </div>
          </div>
          <TransactionModal />
          <NoticeModal />
        </div>
        <Footer />
      </div>
      <TabsBar theme={lend.theme} />
    </>
  );
});

export default LiquidationPage;
