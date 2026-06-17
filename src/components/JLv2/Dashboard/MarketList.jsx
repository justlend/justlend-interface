import React, { useState, useEffect } from 'react';
import intl from 'react-intl-universal';
import { Tooltip } from 'antd';
import { observer } from 'mobx-react';
import isMobile from 'ismobilejs';
import { useHistory } from 'react-router-dom';
import classnames from 'classnames';
import Stores from '../../../stores';
import { formatApyRate, formatTokenAmount, formatFiatValue } from '../../../utils/formatters';
import { getIconsJLv2 } from '../../../utils/constant';
import { highlightText } from '../../../utils/formatters';
import { BigNumber, emptyReactNodeNew } from '../../../utils/helper';
import { useVaultMiningResolver } from '../../../utils/hooks/useMining';
import ApyBreakdownTooltip from '../Common/ApyBreakdownTooltip';

const TokenIcon = ({ iconUrl, tokenSymbol }) => {
  const localFallbackIcon = getIconsJLv2(tokenSymbol);
  const [imgSrc, setImgSrc] = useState(iconUrl || localFallbackIcon);

  useEffect(() => {
    setImgSrc(iconUrl || localFallbackIcon);
  }, [iconUrl, localFallbackIcon]);

  const handleImageError = () => {
    if (imgSrc !== localFallbackIcon) {
      setImgSrc(localFallbackIcon);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={tokenSymbol}
      onError={handleImageError}
      width="24"
      height="24"
      style={{ borderRadius: '50%' }}
    />
  );
};

const CollateralIcons = ({ collaterals = [] }) => (
  <div className="collateral-icons">
    {!collaterals.length && '--'}
    {collaterals.slice(0, 5).map(collateral => (
      <TokenIcon key={collateral.address} iconUrl={collateral.icon} tokenSymbol={collateral.symbol} />
    ))}
    {collaterals.length > 5 && <span className="collateral-sum">+{collaterals.length - 5}</span>}
  </div>
);

const riskCheck = risk => {
  const riskValue = BigNumber(risk).times(100).toNumber();
  let text = 'low';

  if (riskValue >= 80) {
    text = 'high';
  } else if (riskValue >= 60 && riskValue < 80) {
    text = 'medium';
  } else if (riskValue >= 35 && riskValue < 60) {
    text = 'low';
  }

  return text;
};

const MarketList = observer(({ listSkeletonRender = () => null }) => {
  const { dashboardStore, network } = Stores;

  const {
    allVaults,
    userVaults,
    allMarkets,
    userMarkets,
    allVaultsCount,
    allMarketsCount,
    activeTab,
    listLoading,
    filters,
    sorter,
    moreLoading,
    userBalances,
    myVaultFold,
    myMarketFold,
    setMyVaultFold,
    setMyMarketFold,
    setHomeSearchparam,
    setActiveTab,
    isFlashing
  } = dashboardStore;
  const { isConnected } = network;
  const vaultMiningResolver = useVaultMiningResolver();
  const history = useHistory();
  const [sortKey, setSortKey] = useState('');
  const [hideZero, setHideZero] = useState(false);
  const [sort, setSort] = useState(''); 
  const [mobile] = useState(isMobile(window.navigator).any);

  const isVaultTab = activeTab === 'supply';
  const fold = isVaultTab ? myVaultFold : myMarketFold;

  useEffect(() => {
    setHideZero(false);
    setSortKey('');
    setSort('');
  }, [activeTab]);

  useEffect(() => {
    if (sortKey) {
      if (sort) {
        dashboardStore.setSorter(sortKey, sort);
      } else {
        dashboardStore.setSorter();
      }
    }
  }, [sortKey, sort]);

  const handleSort = key => {
    if (sortKey !== key) {
      // init when click new tab
      setSortKey(key);
      setSort('asc');
    } else {
      // click the same tab
      if (sort === 'asc') {
        setSort('desc');
      } else if (sort === 'desc') {
        setSort('');
      } else if (sort === '') {
        setSort('asc');
      }
    }
  };

  
  const handleDetailsClick = (item, type) => {
    dashboardStore.setClearAll();

    if (type === 'supply') {
      history.push(`/vault?address=${item.vaultAddress}`);
    } else {
      history.push(`/marketV2?id=${item.id}`);
    }
  };

  
  const getWalletBalance = (address, decimals) => {
    return userBalances?.[address] ? userBalances[address]?.div(10 ** decimals) : new BigNumber(0);
  };

  const renderSupplyHeader = () => (
    <div className="list-header">
      <div className="col-vault">{intl.get('jlv2.home.vault')}</div>
      <div className="col-apy">{intl.get('jlv2.home.supply_apy')}</div>
      <div className="col-amount col-amount-header">{intl.get('jlv2.home.supplied_amount')}</div>
      <div className="col-collateral">{intl.get('jlv2.home.collateral')}</div>
      <div className="col-balance">
        <span className="col-span nowrap">{intl.get('jlv2.home.wallet_balance')}</span>
      </div>
      <div className="col-op">{intl.get('jlv2.home.action')}</div>
      <div className="list-line"></div>
    </div>
  );

  const renderAllSupplyHeader = () => (
    <div className="list-header">
      <div className="col-vault">{intl.get('jlv2.home.vault')}</div>
      <div className="col-apy cursor-pointer col-sort" onClick={() => handleSort('apy')}>
        {intl.get('jlv2.home.supply_apy')}
        <div className="table-sort">
          <span className={'sort-asc' + (sortKey === 'apy' && sort === 'asc' ? ' current' : '')}></span>
          <span className={'sort-desc' + (sortKey === 'apy' && sort === 'desc' ? ' current' : '')}></span>
        </div>
      </div>
      <div className="col-amount col-amount-header cursor-pointer col-sort" onClick={() => handleSort('tvl')}>
        {intl.get('jlv2.home.total_supply')}
        <div className="table-sort">
          <span className={'sort-asc' + (sortKey === 'tvl' && sort === 'asc' ? ' current' : '')}></span>
          <span className={'sort-desc' + (sortKey === 'tvl' && sort === 'desc' ? ' current' : '')}></span>
        </div>
      </div>
      <div className="col-collateral">{intl.get('jlv2.home.collateral')}</div>
      <div className="col-balance">
        <span className="col-span nowrap">{intl.get('jlv2.home.wallet_balance')}</span>
      </div>
      <div className="col-op">{intl.get('jlv2.home.action')}</div>
      <div className="list-line"></div>
    </div>
  );

  const hideZeroOnChange = () => {
    setHideZero(!hideZero);
  };

  const handleLoadMore = () => {
    if (moreLoading) return;
    const page = dashboardStore.currentPage + 1;
    dashboardStore.setPage(page);
  };

  const renderBorrowHeader = () => (
    <div className="list-header">
      <div className="col-market">{intl.get('jlv2.home.borrow_token')}</div>
      <div className="col-apy">{intl.get('jlv2.home.borrow_apy')}</div>
      <div className="col-amount">{intl.get('jlv2.market.collateral')}</div>
      <div className="col-lltv">
        {intl.get('jlv2.home.risk_level')}
        <Tooltip
          title={intl.get('jlv2.home.risk_level_tooltip')}
          placement="top"
          trigger={mobile ? ['click'] : ['hover']}
          arrowPointAtCenter
          overlayClassName="j-tooltip-dropdown"
        >
          <span className="j-tooltip-icon ml-4"></span>
        </Tooltip>
      </div>
      <div>{intl.get('jlv2.home.debt_amount')}</div>
      <div>{intl.get('jlv2.home.collateral_value')}</div>
      <div className="col-op">{intl.get('jlv2.home.action')}</div>
      <div className="list-line"></div>
    </div>
  );

  const renderAllBorrowHeader = () => (
    <div className="list-header">
      <div className="col-market">{intl.get('jlv2.home.lend_token')}</div>
      <div className="col-apy cursor-pointer col-sort" onClick={() => handleSort('borrowRate')}>
        {intl.get('jlv2.home.borrow_apy')}
        <div className="table-sort">
          <span className={'sort-asc' + (sortKey === 'borrowRate' && sort === 'asc' ? ' current' : '')}></span>
          <span className={'sort-desc' + (sortKey === 'borrowRate' && sort === 'desc' ? ' current' : '')}></span>
        </div>
      </div>
      <div className="col-amount">{intl.get('jlv2.market.collateral')}</div>
      <div className="col-lltv cursor-pointer col-sort" onClick={() => handleSort('lltv')}>
        {intl.get('jlv2.market.lltv')}
        <div className="table-sort">
          <span className={'sort-asc' + (sortKey === 'lltv' && sort === 'asc' ? ' current' : '')}></span>
          <span className={'sort-desc' + (sortKey === 'lltv' && sort === 'desc' ? ' current' : '')}></span>
        </div>
      </div>
      <div className="col-liquidity cursor-pointer col-sort" onClick={() => handleSort('liquidityUsd')}>
        {intl.get('jlv2.home.liquidity')}
        <div className="table-sort">
          <span className={'sort-asc' + (sortKey === 'liquidityUsd' && sort === 'asc' ? ' current' : '')}></span>
          <span className={'sort-desc' + (sortKey === 'liquidityUsd' && sort === 'desc' ? ' current' : '')}></span>
        </div>
      </div>
      <div>{intl.get('jlv2.home.available_collateral')}</div>
      <div className="col-op">{intl.get('jlv2.home.action')}</div>
      <div className="list-line"></div>
    </div>
  );

  const renderSupplyRow = (type, item) => {
    const miningEntry = vaultMiningResolver.getEntry(item.vaultAddress);
    const hasMining = !!(miningEntry && miningEntry.miningApy?.total > 0);
    const displayApy = hasMining
      ? BigNumber(item.apy || 0)
          .plus(miningEntry.miningApy.total)
          .toString()
      : item.apy;
    return (
      <div
        key={item.vaultAddress}
        className="list-row"
        onClick={() => {
          window.gtag('event', 'PC_markets_detail_button', {
            'event_category': 'PC_V2',
            'event_label': 'markets_detail_button'
          });
          handleDetailsClick(item, 'supply');
        }}
      >
        <div className="col-vault">
          <TokenIcon iconUrl={item.icon} tokenSymbol={item.assetSymbol} />
          <div>
            <div className="vault-name vault-symbol">{highlightText(item.assetSymbol, filters.keyword)}</div>
            <div className="vault-item-name">
              {highlightText(item.vaultName, filters.keyword)}
              {item.tags?.includes('alpha') && <span className="alpha-leaf"></span>}
            </div>
          </div>
        </div>
        <div className="col-apy">
          {formatApyRate(displayApy)}
          {hasMining ? (
            <ApyBreakdownTooltip baseApy={item.apy} miningApy={miningEntry.miningApy} iconClassName="fire-lista" />
          ) : (
            item.tags?.includes('fire') && <span className="fire-lista"></span>
          )}
        </div>
        <div className="col-amount">
          <div className="token-amount">
            {formatTokenAmount(type === 'user' ? item.userSupplyAmount : item.totalSupplyAmount)} {item.assetSymbol}
          </div>
          <div className="fiat-value">{formatFiatValue(type === 'user' ? item.userSupplyUsd : item.tvl)}</div>
        </div>
        <div className="col-collateral">
          <CollateralIcons collaterals={item.collateralTokens} />
        </div>
        <div className="col-balance">
          {isConnected
            ? formatTokenAmount(getWalletBalance(item.assetAddress, item.assetDecimals), item.assetSymbol)
            : '--'}
        </div>
        <div className="col-op">
          <button
            className="details-btn"
            // onClick={() => {
            //   window.gtag('event', 'PC_markets_detail_button', { 'event_category': 'PC_V2', 'event_label': 'markets_detail_button' });
            //   // setHomeSearchparam('');
            //   // setActiveTab('supply');
            //   handleDetailsClick(item, 'supply');
            // }}
          >
            {intl.get('jlv2.home.details')}
          </button>
        </div>
      </div>
    );
  };

  const renderBorrowRow = (type, item = {}) => (
    <div
      key={item.id}
      className="list-row"
      onClick={() => {
        window.gtag('event', 'PC_vault_detail_button', {
          'event_category': 'PC_V2',
          'event_label': 'vault_detail_button'
        });
        handleDetailsClick(item, 'borrow');
      }}
    >
      <div className="col-vault">
        <TokenIcon iconUrl={item.loanIcon} tokenSymbol={item.loanSymbol} />
        <div className="vault-name">{highlightText(item.loanSymbol, filters.keyword)}</div>
      </div>
      <div className="col-apy">{formatApyRate(item.borrowRate)}</div>
      <div className="col-vault vault-token">
        <TokenIcon iconUrl={item.collateralIcon} tokenSymbol={item.collateralSymbol || item.name} />
        <div className="vault-name">{highlightText(item.collateralSymbol, filters.keyword)}</div>
      </div>
      {type === 'user' ? (
        <>
          <div className="col-lltv flex-direction-column" style={{ alignItems: 'flex-start' }}>
            <span className={`risk-level ${riskCheck(item.risk)}`}>{formatApyRate(item.risk)}</span>
            <div className="fiat-value">
              {formatApyRate(item.ltv)} / {formatApyRate(item.lltv)}
            </div>
          </div>
          <div className="col-amount">
            <div className="token-amount">
              {formatTokenAmount(item.loanAmount)} {item.loanSymbol}
            </div>
            <div className="fiat-value">{formatFiatValue(item.loanUsd)}</div>
          </div>
          <div className="col-collateralizing">
            <div className="token-amount">
              {formatTokenAmount(item.collateralAmount)} {item.collateralSymbol}
            </div>
            <div className="fiat-value">{formatFiatValue(item.collateralUsd)}</div>
          </div>
        </>
      ) : (
        <>
          <div className="col-lltv">{formatApyRate(item.lltv)}</div>
          <div className="col-amount">
            <div className="token-amount">
              {formatTokenAmount(item.liquidity)} {item.loanSymbol}
            </div>
            <div className="fiat-value">{formatFiatValue(item.liquidityUsd)}</div>
          </div>
          <div className="col-collateralizing">
            <div className="token-amount">
              {isConnected
                ? formatTokenAmount(
                    getWalletBalance(item.collateralAddress, item.collateralDecimals),
                    item.collateralSymbol
                  )
                : '--'}
            </div>
          </div>
        </>
      )}
      <div className="col-op">
        <button
          className="details-btn"
          // onClick={() => {
          //   window.gtag('event', 'PC_vault_detail_button', { 'event_category': 'PC_V2', 'event_label': 'vault_detail_button' });
          //   // setHomeSearchparam('');
          //   // setActiveTab('borrow');
          //   handleDetailsClick(item, 'borrow');
          // }}
        >
          {intl.get('jlv2.home.details')}
        </button>
      </div>
    </div>
  );

  let allData = [],
    userData = [],
    allCount = 0;

  if (isVaultTab) {
    allData = allVaults.filter(item =>
      hideZero ? getWalletBalance(item.assetAddress, item.assetDecimals)?.gt(0) : true
    );
    userData = userVaults;
    allCount = allVaultsCount;
  } else {
    allData = allMarkets;
    userData = userMarkets;
    allCount = allMarketsCount;
  }

  const handleMyAssetFold = () => {
    isVaultTab ? setMyVaultFold(!myVaultFold) : setMyMarketFold(!myMarketFold);
  };

  // loading skeleton
  if (listLoading) {
    return <div className="market-skeleton list-content-skeleton">{listSkeletonRender?.()}</div>;
  }

  return (
    <div className="home-list-wrap pr">
      <div className={'market-list-container' + (isVaultTab ? '' : ' borrow-list')}>
        <div className={classnames('list-title star', { 'fold-list-title': fold })}>
          <span className="flex aic">
            {isVaultTab ? intl.get('jlv2.home.my_supply') : intl.get('jlv2.home.my_debts')}
            <span className={classnames('fold-btn', { 'fold': fold })} onClick={handleMyAssetFold}></span>
          </span>
        </div>
        {fold ? null : (
          <>
            <div
              className={classnames('mobile-list-content-wrap my-list', {
                'no-list-content-wrap': !userData?.length,
                'is-flashing-list': dashboardStore.isFlashing && mobile
              })}
            >
              <div
                className={'list-content my-vault' + (dashboardStore.isFlashing && !mobile ? ' is-flashing-list' : '')}
              >
                {isVaultTab ? renderSupplyHeader() : renderBorrowHeader()}
                <div className={classnames('list-body', { 'no-list-body': !userData?.length })}>
                  {userData?.length
                    ? userData.map(item => (isVaultTab ? renderSupplyRow('user', item) : renderBorrowRow('user', item)))
                    : mobile
                    ? null
                    : emptyReactNodeNew()}
                </div>
              </div>
            </div>
            {mobile && <div className="list-content-m-bg"></div>}
            {!userData?.length && mobile ? emptyReactNodeNew() : null}
          </>
        )}
      </div>

      <div className={'market-list-container' + (isVaultTab ? '' : ' borrow-list all-borrow-list')}>
        <div className="list-title leaf">
          <span>{isVaultTab ? intl.get('jlv2.home.all_supply_vault') : intl.get('jlv2.home.all_lending_market')}</span>
          {isVaultTab && (
            <div className="flex aic pointer" onClick={hideZeroOnChange}>
              <span className={'col-checkbox' + (hideZero ? ' checked' : '')}></span>
              <span className={'hide-zero' + (hideZero ? ' checked' : '')}>
                {' '}
                {intl.get('jlv2.home.hide_zero_balance')}
              </span>
            </div>
          )}
        </div>
        <div className="mobile-list-content-wrap">
          <div className="list-content all-list-content">
            {isVaultTab ? renderAllSupplyHeader() : renderAllBorrowHeader()}
            <div className={classnames('list-body', { 'no-list-body': !allData?.length })}>
              {allData?.length
                ? allData.map(item => (isVaultTab ? renderSupplyRow('all', item) : renderBorrowRow('all', item)))
                : mobile
                ? null
                : emptyReactNodeNew()}
            </div>
          </div>
        </div>
        {!allData?.length && mobile ? emptyReactNodeNew() : null}
        {allCount > allData?.length && !hideZero && (
          <div className="load-more-v2" onClick={handleLoadMore}>
            <div>
              <span className="load-text">
                {moreLoading ? intl.get('jlv2.home.loading') : intl.get('jlv2.home.load_more')}
              </span>
              <span className={`${moreLoading ? 'loading-icon' : 'load-icon'}`}></span>
            </div>
          </div>
        )}
      </div>
      {/* {listLoading && <div className="data-loading">{intl.get('jlv2.home.loading')}...</div>} */}
    </div>
  );
});

export default MarketList;
