import React from 'react';
import isMobile from 'ismobilejs';
import { Link } from 'react-router-dom';
import { inject, observer } from 'mobx-react';
import { Dropdown, Menu, Input, Tooltip } from 'antd';
import intl from 'react-intl-universal';
import { getMarketDashboardData } from '../../../utils/backend';
import { LiquidityStakeTipButton } from '../../Common/LiquidityStakeTipButton';
import { StUSDTStakeTipButton } from '../../Common/StUSDTStakeTipButton';
import {
  BigNumber,
  amountFormat,
  formatNumber,
  getTotalApy,
  goToPage,
  tooltip,
  tooltipNew,
  tooltipSTRX,
  marketLendAvailable,
  renderBalanceV2,
  goToMarketDetailPage,
  marketListSort
} from '../../../utils/helper';
import Config from '../../../config';
import '../../../assets/css/v2/home/home-market-m.scss';
import { getIcons, getLendIcons } from '../../../utils/constant';
import WBTTIcon from '../../../assets/images/v2/new-icons/wbtt.png';
import defaultIcon from '../../../assets/images/default.svg';
import { TooltipText } from '../strx/TooltipText';
import ToggleSwitch from '../../Widget/ToggleSwitch';
import { DepositButton } from '../market-detail/DepositButton';
import { BorrowButton } from '../market-detail/BorrowButton';
import { SimpleLink } from '../../Common/SimpleLink';
import { checkIfShouldShowMintApyDetail } from '../market-detail/utils';
const { miningSymbol, miningNewSymbol } = Config;

export const getLiquidityTooltipTitle = () =>
  tooltip(intl.get('v2.tip8'), [
    {
      title: intl.get('v2.tip9')
    },
    { title: intl.get('v2.tip10') }
  ]);

export const getSupplyApyTooltipTitle = (item, assetList) => {
  const { depositApy, mintApy, mintApyWithUSDD } = getTotalApy(item, assetList);
  return tooltip(intl.get('v2.deposit_apy_hover'), [
    {
      title: intl.get('v2.deposit_basic_apy') + (formatNumber(depositApy, 2, { per: true, miniText: '0.01' }) + '%')
    },
    {
      title: Config.usddMint.includes(item.jtokenAddress)
        ? intl.get('v2.deposit_mining_apy', { miningSymbol }) +
          formatNumber(mintApyWithUSDD, 2, { per: true, miniText: '0.01' }) +
          '%'
        : intl.get('v2.deposit_mining_apy', { miningSymbol }) +
          formatNumber(mintApy, 2, { per: true, miniText: '0.01' }) +
          '%'
    },
    {
      title: Config.usddMint.includes(item.jtokenAddress) && (
        <div>{intl.get('risk_tip.usdd_supply_apy', { miningSymbol })}</div>
      )
    }
  ]);
};

export const getSupplyApyTooltipTitleNew = (item, assetList, openMint) => {
  const { depositApy, underlyingIncrementApy, mintApy, mintApyWithUSDD, mintApyTRX } = getTotalApy(item, assetList);
  const finalMintApy = Config.usddMint.includes(item.jtokenAddress) ? mintApyWithUSDD : mintApy;
  const apy = (mintApy !== '--' && BigNumber(mintApy).gt(0)) ? mintApy : mintApyTRX;

  const shouldShowMiningApyDetail =
    checkIfShouldShowMintApyDetail(true, item.collateralSymbol, apy) && openMint;

  if (item.collateralSymbol === 'sTRX') {
    return tooltipSTRX(depositApy, underlyingIncrementApy, mintApy, shouldShowMiningApyDetail);
  } else if (item.collateralSymbol === 'wstUSDT') {
    return tooltipNew(depositApy, underlyingIncrementApy, mintApy, shouldShowMiningApyDetail);
  } else {
    let apyArr = [];

    apyArr.push({
      title: intl.get('risk_tip.basic_apy1'),
      value: formatNumber(depositApy, 2, { per: true, miniText: '0.01' }) + '%'
    });

    if (shouldShowMiningApyDetail) {
      if (BigNumber(finalMintApy).gt(0)) {
        apyArr.push({
          title: intl.get('risk_tip.mining_apy2', { miningSymbol }),
          value: formatNumber(finalMintApy, 2, { per: true, miniText: '0.01' }) + '%'
        });
      }
      // add TRX mining reward APY
      if (BigNumber(mintApyTRX).gt(0)) {
        apyArr.push({
          title: intl.get('risk_tip.mining_apy2', { miningSymbol: miningNewSymbol }),
          value: formatNumber(mintApyTRX, 2, { per: true, miniText: '0.01' }) + '%'
        });
      }
    }

    if (Config.usddMint.includes(item.jtokenAddress)) {
      apyArr.push({
        title: <div>{intl.get('risk_tip.usdd_supply_apy', { miningSymbol })}</div>
      });
    }

    return tooltip(
      item.collateralSymbol === 'sTRX'
        ? intl.get('risk_tip.strx_apy')
        : shouldShowMiningApyDetail
        ? openMint
          ? intl.get('risk_tip.mining_apy')
          : intl.get('risk_tip.mining_apy_no_mint')
        : intl.get('risk_tip.basic_apy'),
      apyArr,
      null
    );
  }
};

@inject('network')
@inject('lend')
@inject('system')
@inject('pool')
@inject('market')
@observer
class HomeMarketList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      mobile: isMobile(window.navigator).any,
      markets: [],
      defaultMarkets: [],
      sortField: 'default',
      sortType: '',
      sortSelectShow: false,
      searchValue: '',
      checked: false,
      showHiddenMarket: false
    };
  }

  componentDidMount() {
    // this.getMarketData();
  }

  getMarketData = async () => {
    try {
      let res = await getMarketDashboardData();
      if (!res.success) {
        return;
      }

      let markets = res.data.markets.map(item => {
        return { ...item, key: item.id };
      });

      res.data.markets = markets;
      this.setState({ marketData: res.data, markets, defaultMarkets: markets });
    } catch (err) {
      console.log('getMarketData', err);
    }
  };

  onSortVisibleChange = sortSelectShow => {
    this.setState({
      sortSelectShow
    });
  };
  onSortBlur = () => {
    this.setState({
      sortSelectShow: false
    });
  };
  onSortChange = newSortField => {
    const { sortType, sortField } = this.state;
    const newSortType = newSortField !== sortField ? 'desc' : sortType === 'desc' ? 'asc' : 'desc';
    this.onSortBlur();
    this.setState({
      sortField: newSortField,
      sortType: newSortType
    });
  };

  sortRender = () => {
    const { theme } = this.props.lend;
    const { sortField, sortType, sortSelectShow } = this.state;
    const options = [
      {
        key: 'deposit',
        label: intl.get('v2.deposit_apy')
      },
      {
        key: 'borrow',
        label: intl.get('v2.borrow_apy')
      },
      {
        key: 'liquidity',
        label: intl.get('v2.liquidity')
      },
      {
        key: 'default',
        label: intl.get('show_current')
      }
    ];
    const menu = (
      <Menu>
        {options.map(item => {
          return (
            <Menu.Item key={item.key} onClick={() => this.onSortChange(item.key)}>
              <span className={`sort-item ${sortField === item.key ? 'active' : ''}`}>
                <span className="sort-item-text">{item.label}</span>
                <span className={`sort-item-icon ${sortType} ${item.key === 'default' ? 'default' : ''}`}></span>
              </span>
            </Menu.Item>
          );
        })}
      </Menu>
    );
    return (
      <Dropdown
        overlayClassName={`${theme} home-market-sort`}
        placement="bottomRight"
        overlay={menu}
        trigger="click"
        onVisibleChange={this.onSortVisibleChange}
      >
        <button className={`sort-m ${sortSelectShow ? 'active' : ''}`} onBlur={this.onSortBlur}>
          <span className="icon prefix-icon"></span>
          <span className="text">{intl.get('sort')}</span>
          <span className="icon postfix-icon"></span>
        </button>
      </Dropdown>
    );
  };

  stopPropagation = e => {
    e.stopPropagation();
  };

  marketCardRender = dataSource => {
    const { isConnected } = this.props.network;
    const { lang, theme, openMint } = this.props.lend;
    const { isUSDDOLDDisabled, balanceInfo, assetList, noService, riojBalance } = this.props.market;
    const { mobile } = this.state;

    return (
      <div className="market-cards">
        {dataSource.map(item => {
          const isTrx = item?.collateralSymbol?.toLocaleLowerCase() === 'trx';
          const isUsdt = item?.collateralSymbol?.toLocaleLowerCase() === 'usdt';

          const { totalApy, mintApy, mintApyTRX, depositApy, wstUSDTDepositApyWithIncrement } = getTotalApy(item, assetList);
          const apy = (mintApy !== '--' && BigNumber(mintApy).gt(0)) ? mintApy : mintApyTRX;
          const shouldShowMiningApyDetail =
            checkIfShouldShowMintApyDetail(true, item.collateralSymbol, apy) && openMint;

          return (
            <div
              key={item.jtokenAddress}
              className="market-card-wrap"
              onClick={e => {
                let classList = e.target.classList;
                if (classList) {
                  let className = Array.prototype.slice.call(classList);
                  if (
                    className.includes('j-not-used') ||
                    className.includes('not-used-icon') ||
                    className.includes('can-click')
                  )
                    return;
                }
                goToMarketDetailPage(item.jtokenAddress);
              }}
            >
              <div
                className="market-card bg-primary"
                onClick={e => {
                  window.gtag('event', `market_${item?.collateralSymbol?.toLocaleLowerCase()}`, {
                    'event_category': 'H5',
                    'event_label': `market_${item?.collateralSymbol?.toLocaleLowerCase()}`
                  });
                }}
              >
                <div className="card-top">
                  <div className="name-wrap">
                    <img
                      className={'mc-logo ' + item?.collateralSymbol?.toLocaleLowerCase()}
                      src={
                        item.collateralSymbol === 'WBTT'
                          ? theme === 'white'
                            ? getIcons(item.collateralSymbol)
                            : WBTTIcon
                          : item.logoUrl
                          ? item.logoUrl
                          : getLendIcons(item?.collateralSymbol)
                      }
                      onError={e => {
                        e.target.onerror = null;
                        e.target.src = getLendIcons(item?.collateralSymbol);
                      }}
                      alt=""
                    />
                    <div className="text-wrap text-wrap-m">
                      {noService && item.collateralSymbol === 'wstUSDT' ? (
                        <div className="token-names flex aic">
                          <span className="mc-symbol color-primary">{item.collateralSymbol}</span>
                          <Tooltip
                            title={
                              !riojBalance || !isConnected
                                ? intl.get('home.market_not_useful')
                                : intl.get('home.market_not_useful2')
                            }
                            placement="top"
                            trigger="['hover','click']"
                            arrowPointAtCenter
                            overlayClassName={'j-tooltip-dropdown not-used ' + theme}
                          >
                            <em className="not-used-icon ml-2"></em>
                          </Tooltip>
                        </div>
                      ) : (
                        <span className="mc-symbol color-primary">
                          {item.collateralSymbol}
                          {item.collateralSymbol === 'USDDOLD' && miningSymbol === 'USDD' && (
                            <Tooltip
                              overlayClassName={'j-tooltip-dropdown ' + theme}
                              title={
                                isUSDDOLDDisabled ? intl.getHTML('usdd_update.migrate') : intl.get('usdd_update.tip')
                              }
                              trigger="['hover','click']"
                              placement="top"
                              arrowPointAtCenter
                            >
                              <span className={isUSDDOLDDisabled ? 'not-used-icon y-2 ml-6' : 'tip'}></span>
                            </Tooltip>
                          )}
                          {item.collateralSymbol === 'USDJ' && item.mintPaused && item.borrowPaused ? (
                            <Tooltip
                              title={intl.get('risk_tip.usdj_icon')}
                              placement="top"
                              trigger="['hover','click']"
                              arrowPointAtCenter
                              overlayClassName={'j-tooltip-dropdown light ' + theme}
                            >
                              <em className="not-used-icon y-2 ml-6"></em>
                            </Tooltip>
                          ) : (
                            ''
                          )}
                          {(Config.riskMarkets.includes(item.collateralSymbol) || item.collateralSymbol === 'WBTT') && (
                            <Tooltip
                              title={
                                item.collateralSymbol === 'SUNOLD'
                                  ? intl.getHTML('risk_tip.sunold_borrow')
                                  : intl.getHTML(`risk_tip.${item.collateralSymbol?.toLocaleLowerCase()}_icon`, {
                                      link:
                                        item.collateralSymbol === 'USDCOLD'
                                          ? Config.announceForUSDCOLD
                                          : Config.announceLink
                                    })
                              }
                              placement="top"
                              trigger="['hover','click']"
                              arrowPointAtCenter
                              overlayClassName={'j-tooltip-dropdown light ' + theme}
                            >
                              <em className="not-used-icon y-2 ml-6"></em>
                            </Tooltip>
                          )}
                        </span>
                      )}

                      <div className="flex">
                        <span className="mc-subtitle color-light">{item.collateralName}</span>
                        {(item.collateralSymbol === 'ETHB' || item.collateralSymbol === 'ETH') && (
                          <div className={'mc-des ' + theme}>
                            {item.collateralSymbol === 'ETHB'
                              ? `(${intl.get('eth.origin_eth')})`
                              : `(${intl.get('eth.origin_ethold')})`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {BigNumber(item.collateralFactor).eq(0) || (item.mintPaused && item.borrowPaused) ? (
                    <>
                      <div className="collateral color-light" onClick={this.stopPropagation}>
                        <TooltipText
                          title={
                            item.collateralSymbol === 'USDDOLD'
                              ? item.account_entered === 1
                                ? intl.get('s11.market_closed_tips4')
                                : intl.get('s11.market_closed_tips3')
                              : item.account_entered === 1
                              ? intl.get('s11.market_closed_tips2')
                              : intl.get('s11.market_closed_tips1')
                          }
                          placement="topLeft"
                          arrowPointAtCenter
                          overlayClassName="j-tooltip-dropdown light"
                        >
                          {intl.get('v2.collateral')}

                          {''}
                        </TooltipText>
                        <div className="cannot-open">
                          <ToggleSwitch
                            on={item.account_entered === 1}
                            lang={lang}
                            onClick={() => {
                              if (item.account_entered === 1) {
                                return this.props.onSwitchChange(item.account_entered === 1, item);
                              }
                              return;
                            }}
                          ></ToggleSwitch>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="collateral color-light" onClick={this.stopPropagation}>
                      <div className="tooltip-text no-border-bottom">{intl.get('v2.collateral')}</div>
                      <ToggleSwitch
                        on={item.account_entered === 1}
                        lang={lang}
                        onClick={() => {
                          this.props.onSwitchChange(item.account_entered === 1, item);
                        }}
                      ></ToggleSwitch>
                    </div>
                  )}
                </div>
                <div className="card-bottom">
                  <div className="card-item flex aic jcsb">
                    <div className="cb-ele">
                      <div className="cb-title color-light">
                        <TooltipText
                          title={getSupplyApyTooltipTitleNew(item, assetList, openMint)}
                          placement="topRight"
                          arrowPointAtCenter
                          trigger={['click']}
                          overlayClassName="j-tooltip-dropdown"
                        >
                          {intl.get('market.deposit_apy')}
                        </TooltipText>
                      </div>
                      <div className="cb-value  color-primary">
                        {formatNumber(
                          shouldShowMiningApyDetail
                            ? totalApy
                            : Config.holdingTokens.includes(item.collateralSymbol)
                            ? wstUSDTDepositApyWithIncrement
                            : depositApy,
                          2,
                          {
                            cutZero: false,
                            miniText: 0.01,
                            needDolar: false,
                            per: true
                          }
                        )}
                        {'%'}
                        {Config.holdingTokens.includes(item.collateralSymbol) && (
                          <span className="ic-compounded-reward"></span>
                        )}
                        {shouldShowMiningApyDetail && <span className="ic-fire"></span>}
                      </div>
                    </div>
                    <div className="cb-ele cb-right">
                      <div className="cb-title color-light">{`${intl.get('v2.wallet_balance')} (${
                        item.collateralSymbol
                      })`}</div>
                      <div className="cb-value color-primary">
                        {!isConnected
                          ? '-- ' + item.collateralSymbol
                          : renderBalanceV2(item, balanceInfo, { minText: 0.001, showSymbol: false })}
                      </div>
                    </div>
                  </div>
                  <div className="card-item flex aic jcsb">
                    <div className="cb-ele">
                      <div className="cb-title color-light">{intl.get('market.borrow_apy')}</div>
                      <div className="cb-value color-primary">
                        {formatNumber(BigNumber(item.borrowedAPY).times(1e2), 2, {
                          cutZero: false,
                          miniText: 0.01,
                          needDolar: false,
                          per: true
                        })}
                        %
                      </div>
                      <div className="btn-wrap left">
                        <DepositButton
                          jTokenData={item}
                          mobile={this.state.mobile}
                          placement={'bottom'}
                        ></DepositButton>
                      </div>
                    </div>
                    <div className="cb-ele cb-right">
                      <div className="cb-title color-light">
                        <TooltipText
                          title={getLiquidityTooltipTitle()}
                          arrowPointAtCenter
                          trigger={['hover', 'click']}
                          overlayClassName="j-tooltip-dropdown"
                        >
                          {intl.get('v2.liquidity')}
                        </TooltipText>
                      </div>
                      <div className="cb-value color-primary">
                        {amountFormat(marketLendAvailable(item), 2, {
                          miniText: 0.01
                        })}{' '}
                        {item.collateralSymbol}
                      </div>
                      <div className="btn-wrap right">
                        <BorrowButton jTokenData={item} mobile={this.state.mobile} placement={'bottom'}></BorrowButton>
                      </div>
                    </div>
                  </div>
                  {isTrx && <LiquidityStakeTipButton></LiquidityStakeTipButton>}
                  {isUsdt && <StUSDTStakeTipButton />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  onSearchChange = e => {
    this.setState({
      searchValue: e.target.value
    });
    this.props.onSearchValueChange(e);
  };
  onCheckedChanged = () => {
    const checked = !this.props.checked;
    this.props.onCheckedChanged(checked);
  };

  onClickShowMore = () => {
    this.setState({ showHiddenMarket: true });
  };

  render() {
    const { marketList, checked } = this.props;
    const { searchValue, sortField } = this.state;
    const { isConnected } = this.props.network;
    const { sortType, showHiddenMarket } = this.state;
    const { assetList } = this.props.market;
    const { lang } = this.props.lend;

    let dataArr = [];
    let marketsNew = marketList.map(item => {
      const { depositApy, mintApy, totalApy } = getTotalApy(item, assetList);
      return {
        ...item,
        depositSortApy: totalApy
        // depositSortApy: BigNumber(depositApy).plus(mintApy).toNumber()
      };
    });

    if (sortField === 'deposit') {
      dataArr = marketsNew
        .slice()
        .sort((a, b) =>
          sortType === 'asc' ? a.depositSortApy - b.depositSortApy : b.depositSortApy - a.depositSortApy
        );
    } else if (sortField === 'borrow') {
      dataArr = marketsNew
        .slice()
        .sort((a, b) => (sortType === 'asc' ? a.borrowedAPY - b.borrowedAPY : b.borrowedAPY - a.borrowedAPY));
    } else if (sortField === 'liquidity') {
      dataArr = marketsNew
        .slice()
        .sort((a, b) =>
          sortType === 'asc'
            ? marketLendAvailable(a) - marketLendAvailable(b)
            : marketLendAvailable(b) - marketLendAvailable(a)
        );
    } else {
      dataArr = marketList;
    }

    // Hide some market
    let haveHiddenMarket = dataArr
      .map(x => x.collateralSymbol)
      .some(sym => Config.hideMarketList.includes(sym.toUpperCase()));
    let activeMarketList = [],
      hiddenMarketList = [],
      fullMarketList = [];

    if (haveHiddenMarket) {
      let result = marketListSort(dataArr);
      activeMarketList = result.activeMarketList;
      hiddenMarketList = result.hiddenMarketList;
      fullMarketList = result.fullMarketList;
    } else {
      activeMarketList = dataArr;
      fullMarketList = dataArr;
    }

    return (
      <div className="market-summary-list">
        <div className="msl-title flex aic jcsb">
          <div className="flex aic jcsb title-text color-primary">
            {intl.get('index.markets_title')}

            {this.sortRender()}
          </div>

          <SimpleLink href={`/marketNew?lang=${lang}`}>{intl.get('more')}</SimpleLink>
        </div>
        <div className="operation-wrap">
          <Input
            value={searchValue}
            size="large"
            placeholder={intl.get('v2.search_market')}
            onChange={this.onSearchChange}
          />
          <span className="search-icon"></span>
          {isConnected ? (
            <div className={`checkbox ${checked ? 'checked' : ''}`} onClick={this.onCheckedChanged}>
              <span className="icon"></span>
              <span className="text color-light">{intl.get('v2.show_balance')}</span>
            </div>
          ) : null}
        </div>
        {fullMarketList.length > 0 ? (
          this.marketCardRender(showHiddenMarket ? fullMarketList : activeMarketList)
        ) : (
          <Empty></Empty>
        )}
        {haveHiddenMarket && !showHiddenMarket && (
          <a className="load-more-btn" onClick={() => this.onClickShowMore()}>
            {intl.get('load_more')}
          </a>
        )}
      </div>
    );
  }
}

export default HomeMarketList;

function Empty() {
  return (
    <div className="market-empty">
      <div className="icon"></div>
      <div className="text color-light">{intl.get('v2.na_data')}</div>
    </div>
  );
}
