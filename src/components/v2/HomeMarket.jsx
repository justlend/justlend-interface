import React, { useState, useEffect } from 'react';
import isMobile from 'ismobilejs';
import { Table, Tooltip, Modal, Button, Checkbox, Input, Skeleton } from 'antd';
import intl from 'react-intl-universal';
import BigNumber from 'bignumber.js';
import Stores from '../../stores';
import Config from '../../config';
import {
  formatNumber,
  renderBalanceV2,
  emptyReactNodeNew,
  getTotalApy,
  amountFormat,
  marketLendAvailable,
  tooltip,
  goToPage,
  goToMarketDetailPage,
  marketListSort
} from '../../utils/helper';
import { getLendIcons } from '../../utils/constant';
import ToggleSwitch from '../Widget/ToggleSwitch';
import CanNotCollateral from '../Modals/v2/CanNotCollateral';
import MortgageModal from '../Modals/v2/Mortgage';
import { inject, observer } from 'mobx-react';
import SearchIcon from '../../assets/images/v2/search-icon.svg';
import SearchIconWhite from '../../assets/images/v2/white-theme/search-icon.svg';
import '../../assets/css/v2/home-market.scss';
import { LiquidityStakeTipButton } from '../Common/LiquidityStakeTipButton';
import { StUSDTStakeTipButton } from '../Common/StUSDTStakeTipButton';
import HomeMarketList, { getLiquidityTooltipTitle, getSupplyApyTooltipTitleNew } from './mobile/HomeMarketList';
import { SimpleLink } from '../Common/SimpleLink';
import { checkIfShouldShowMintApyDetail } from './market-detail/utils';
const { miningSymbol } = Config;

const HomeMarket = observer(({ isLoading = true }) => {
  const { network, lend, system, user, market } = Stores;
  const [lang, setLang] = useState(window.localStorage.getItem('lang') || intl.options.currentLocale);
  const [mobile, setMobile] = useState(isMobile(window.navigator).any);
  const [checked, setChecked] = useState(false);
  const [seachValue, setSeachValue] = useState('');
  const [showHiddenMarket, setShowHiddenMarket] = useState(false);

  const clickDeposit = item => {
    const { isConnected } = network;
    if (!isConnected) {
      return network.connectWalletV2();
    }

    if (network.isRightChain === 0) {
      network.changeChain();
      return;
    }

    system.clearRejectError();

    showDAW(item, '1');
  };

  const clickBorrow = (text, item) => {
    const { isConnected } = network;
    if (!isConnected) {
      return network.connectWalletV2();
    }

    if (network.isRightChain === 0) {
      network.changeChain();
      return;
    }

    if (!lend.collateralValid(item.collateralSymbol)) return;

    system.clearRejectError();
    lend.showBorrowModal(item, '1');
  };

  const depositApyTooltipRender = () => {
    const { openMint } = lend;
    return (
      <>
        <Tooltip
          title={
            openMint
              ? tooltip(intl.get('risk_tip.header_apy'), [
                  { title: intl.get('v2.tip2') },
                  { title: intl.get('risk_tip.header_deposit') },
                  { title: intl.get('v2.tip3') }
                ])
              : tooltip(intl.get('risk_tip.header_apy_no_mint'), [
                  { title: intl.get('v2.tip2') },
                  { title: intl.get('risk_tip.header_deposit') }
                ])
          }
          placement="top"
          arrowPointAtCenter
          overlayClassName="j-tooltip-dropdown"
        >
          <span className="j-tooltip-icon j-info-icon mr-4"></span>
        </Tooltip>
        <span>{intl.get('v2.deposit_apy')}</span>
      </>
    );
  };

  const marketLendTooltipRender = () => {
    return (
      <>
        <Tooltip
          title={getLiquidityTooltipTitle()}
          placement="top"
          arrowPointAtCenter
          trigger={['click', 'hover']}
          overlayClassName="j-tooltip-dropdown"
        >
          <span className="j-tooltip-icon j-info-icon mr-4"></span>
        </Tooltip>
        {intl.get('v2.liquidity')}
      </>
    );
  };

  const onSwitchChange = (status, item) => {
    const { isConnected } = network;
    if (!isConnected) {
      return network.connectWalletV2();
    }

    if (network.isRightChain === 0) {
      network.changeChain();
      return;
    }

    if (!lend.collateralValid(item.collateralSymbol)) return;

    if (!status && !BigNumber(item.account_depositJtoken).gt(0)) {
      lend.setOpenCollateralShow(true);
      return;
    }

    const { jtokenAddress } = item;

    system.setData({ transModalInfo: { declined: false } });
    lend.setMortgageModalInfo({
      visible: true,
      type: status ? 2 : 1,
      jtokenAddress,
      collateralSymbol: item.collateralSymbol
    });

    if (status) {
      window.gtag('event', 'PC_disable_mortgage', { 'event_category': 'PC_V1.5', 'event_label': 'disable_mortgage' });
    } else {
      window.gtag('event', 'PC_enable_mortgage', { 'event_category': 'PC_V1.5', 'event_label': 'enable_mortgage' });
    }
  };

  const getInfoColumns = balanceInfo => {
    const { isConnected } = network;
    const { theme, openMint } = lend;
    const { isUSDDOLDDisabled, noService, riojBalance, assetList } = market;

    let columns = [
      {
        title: intl.get('v2.asset'),
        dataIndex: 'collateralSymbol',
        key: '1',
        ellipsis: true,
        fixed: 'left',
        width: isMobile(window.navigator).any ? 60 : 210,
        className: 'token-symbol',
        render: (text, item) => (
          <div className={'j-list-logo ' + item?.collateralSymbol?.toLocaleLowerCase()}>
            <img
              src={item.logoUrl ? item.logoUrl : getLendIcons(item?.collateralSymbol)}
              onError={e => {
                e.target.onerror = null;
                e.target.src = getLendIcons(item?.collateralSymbol);
              }}
              alt=""
            />
            <div className="j-token">
              {noService && text === 'wstUSDT' ? (
                <div className="token-names flex aic">
                  {`${text}`}
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
                    <em className="not-used-icon ml-6"></em>
                  </Tooltip>
                </div>
              ) : (Config.riskMarkets.includes(text) && text !== 'ETH') || text === 'WBTT' ? (
                <div className="token-names flex aic">
                  {`${text}`}
                  <Tooltip
                    title={
                      text === 'SUNOLD'
                        ? intl.getHTML('risk_tip.sunold_borrow')
                        : intl.getHTML(`risk_tip.${text?.toLocaleLowerCase()}_icon`, {
                            link: item.collateralSymbol === 'USDCOLD' ? Config.announceForUSDCOLD : Config.announceLink
                          })
                    }
                    placement="top"
                    trigger="['hover','click']"
                    arrowPointAtCenter
                    overlayClassName={'j-tooltip-dropdown ' + theme}
                  >
                    <em className="not-used-icon ml-6"></em>
                  </Tooltip>
                </div>
              ) : (
                <div className="token-names">
                  {`${text}`}
                  {text === 'USDJ' && item.mintPaused && item.borrowPaused ? (
                    <Tooltip
                      title={intl.get('risk_tip.usdj_icon')}
                      placement="top"
                      trigger="['hover','click']"
                      arrowPointAtCenter
                      overlayClassName={'j-tooltip-dropdown light ' + theme}
                    >
                      <em className="not-used-icon yf-1 ml-6"></em>
                    </Tooltip>
                  ) : (
                    ''
                  )}
                  {text === 'USDDOLD' && miningSymbol === 'USDD' && (
                    <Tooltip
                      overlayClassName={'j-tooltip-dropdown ' + theme}
                      title={isUSDDOLDDisabled ? intl.getHTML('usdd_update.migrate') : intl.get('usdd_update.tip')}
                      placement="top"
                      arrowPointAtCenter
                    >
                      <span className={isUSDDOLDDisabled ? 'not-used-icon yf-1 ml-6' : 'tip'}></span>
                    </Tooltip>
                  )}
                  {text === 'ETH' && (
                    <span className={'des ' + theme}>
                      {'('}
                      {intl.get('eth.origin_ethold')}
                      {')'}
                    </span>
                  )}
                  {text === 'ETHB' && (
                    <span className={'des ' + theme}>
                      {'('}
                      {intl.get('eth.origin_eth')}
                      {')'}
                    </span>
                  )}
                </div>
              )}
              <div className="description">{`${item.collateralName}`}</div>
            </div>
          </div>
          // </a>
        )
      },
      {
        title: depositApyTooltipRender(),
        className: 'deposit-apy-cell',
        dataIndex: 'depositApy',
        key: '2',
        sortDirections: ['descend', 'ascend'],
        sorter: (b, a) => {
          let t1 = getTotalApy(a, assetList);
          let t2 = getTotalApy(b, assetList);
          return t2.totalApy - t1.totalApy;
        },
        showSorterTooltip: false,
        render: (text, item) => {
          const { openMint } = lend;
          const { totalApy, mintApy, mintApyTRX, depositApy, wstUSDTDepositApyWithIncrement } = getTotalApy(
            item,
            assetList
          );
          const apy = mintApy !== '--' && BigNumber(mintApy).gt(0) ? mintApy : mintApyTRX;

          const shouldShowMiningApyDetail =
            checkIfShouldShowMintApyDetail(true, item.collateralSymbol, apy) && openMint;

          return (
            <Tooltip
              overlayClassName="j-tooltip-dropdown"
              title={
                getSupplyApyTooltipTitleNew(item, assetList, openMint)
                // getSupplyApyTooltipTitle(item, assetList)
              }
              placement="bottom"
            >
              <span className="inline-flex jce pr j-deposit-apy">
                <span className="can-click">
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
                      per: true
                    }
                  )}
                  {'%'}
                </span>
                {Config.holdingTokens.includes(item.collateralSymbol) && (
                  <span className="compounded-reward-icon can-click"></span>
                )}
                <span
                  className={
                    'can-click ' +
                    (shouldShowMiningApyDetail ? 'fire-icon ' : '') +
                    (Config.holdingTokens.includes(item.collateralSymbol) ? 'extra-space ' : ' ')
                  }
                ></span>
              </span>
            </Tooltip>
          );
        }
      },
      {
        title: intl.get('v2.borrow_apy'),
        dataIndex: 'borrowedAPY',
        key: '3',
        sortDirections: ['descend', 'ascend'],
        sorter: (b, a) => b.borrowedAPY - a.borrowedAPY,
        showSorterTooltip: false,
        render: text => (
          <div className="fw500 can-click">
            {formatNumber(BigNumber(text).times(100), 2, { cutZero: false, miniText: 0.01, per: true })}
            {'%'}
          </div>
        )
      },
      {
        title: marketLendTooltipRender(),
        dataIndex: 'totalCashNew',
        key: '5',
        sortDirections: ['descend', 'ascend'],
        sorter: (b, a) => marketLendAvailable(b) - marketLendAvailable(a),
        showSorterTooltip: false,
        render: (text, item) => (
          <div className="fw500 can-click">
            {amountFormat(marketLendAvailable(item), 2, {
              miniText: 0.01
            })}{' '}
            {item.collateralSymbol}
          </div>
        )
      },
      {
        title: <div className="ant-table-column-title">{intl.get('v2.wallet_balance')}</div>,
        dataIndex: 'balance',
        key: '4',
        ellipsis: true,
        width: isMobile(window.navigator).any ? 160 : 'auto',
        render: (text, item) => {
          // const { balance = '--' } = balanceInfo[item.jtokenAddress] ? balanceInfo[item.jtokenAddress].balance
          return (
            <div className="fw500 can-click">
              {!isConnected ? '-- ' + item.collateralSymbol : renderBalanceV2(item, balanceInfo, { minText: 0.001 })}
              {/* {formatNumber(BigNumber(balanceInfo[item.jtokenAddress].balance).div(item.precision), 6)}{' '} */}
              {/* {item.collateralSymbol} */}
            </div>
          );
        }
      },
      {
        title: (
          <div className="ant-table-column-title">
            <Tooltip
              overlayClassName="j-tooltip-dropdown"
              title={intl.get('v2.tip4')}
              placement="topRight"
              arrowPointAtCenter
              onOpenChange={window.gtag('event', 'PC_Collateral', {
                'event_category': 'PC',
                'event_label': 'Collateral'
              })}
            >
              <span className="j-tooltip-icon j-info-icon j-info-icon1 mr-4"></span>
            </Tooltip>
            {intl.get('v2.collateral')}
          </div>
        ),
        width: '10%',
        dataIndex: 'account_entered',
        key: 'account_entered',
        render: (text, item) => {
          return BigNumber(item.collateralFactor).eq(0) || (item.mintPaused && item.borrowPaused) ? (
            <Tooltip
              title={
                item.collateralSymbol === 'USDDOLD'
                  ? text === 1
                    ? intl.get('s11.market_closed_tips4')
                    : intl.get('s11.market_closed_tips3')
                  : text === 1
                  ? intl.get('s11.market_closed_tips2')
                  : intl.get('s11.market_closed_tips1')
              }
              placement="top"
              arrowPointAtCenter
              overlayClassName="j-tooltip-dropdown"
              className="cannot-open"
            >
              <ToggleSwitch
                on={text === 1}
                lang={lang}
                onClick={() => {
                  if (text === 1) {
                    return onSwitchChange(text === 1, item);
                  }
                  return;
                }}
              ></ToggleSwitch>
              {''}
            </Tooltip>
          ) : (
            <ToggleSwitch
              on={text === 1}
              lang={lang}
              onClick={() => {
                onSwitchChange(text === 1, item);
              }}
            ></ToggleSwitch>
          );
        }
      },
      {
        // title: intl.get('index.my_operating'),
        title: ' ',
        dataIndex: '',
        key: '6',
        ellipsis: true,
        fixed: 'right',
        width: isMobile(window.navigator).any ? 90 : 170,
        render: (text, item) => {
          const isTrx = item?.collateralSymbol?.toLocaleLowerCase() === 'trx';
          const isUsdt = item?.collateralSymbol?.toLocaleLowerCase() === 'usdt';

          return (
            <div className={isTrx ? 'show-stake' : ''}>
              {lend.serviceInnerStatus === 'disabled' ? (
                <div className="btn-wrap season">
                  <Tooltip
                    title={intl.getHTML('season.can_not_connect')}
                    placement="bottomRight"
                    overlayClassName={'j-tooltip-dropdown season ' + theme}
                  >
                    <button
                      className="j-btn j-supply j-not-used disabled"
                      onClick={() => {
                        lend.setNoServiceModalAllVisible(true);
                      }}
                    >
                      {intl.get('v2.deposit')}
                    </button>
                  </Tooltip>

                  <Tooltip
                    title={intl.getHTML('season.can_not_connect')}
                    placement="bottomRight"
                    overlayClassName={'j-tooltip-dropdown season ' + theme}
                  >
                    <button
                      className="j-btn j-borrow j-not-used disabled"
                      onClick={() => {
                        lend.setNoServiceModalAllVisible(true);
                      }}
                    >
                      {intl.get('v2.borrow')}
                    </button>
                  </Tooltip>
                </div>
              ) : (
                <div className="btn-wrap">
                  {!!item.mintPaused ? (
                    <Tooltip
                      title={() => (
                        <>
                          <>
                            {Config.closeTokens.includes(item?.collateralSymbol)
                              ? intl.get('v2.close_supply_tip_' + item?.collateralSymbol?.toLocaleLowerCase(), {
                                  token: item?.collateralSymbol?.toLocaleUpperCase()
                                })
                              : intl.getHTML('s7.supply_temporarily_disabled', { value: item.collateralSymbol })}
                            <span>{intl.get('s6.deposit_hover1')}</span>
                            <span
                              className="can-click c-9195fb hover"
                              onClick={() => {
                                if (!isConnected) {
                                  network.connectWalletV2();
                                } else {
                                  window.scrollTo(0, 0);
                                  document.body.scrollTop = 0;
                                  document.documentElement.scrollTop = 0;
                                  lend.setActiveKey('supply');
                                }
                              }}
                            >
                              {intl.get('s6.deposit_hover2')}
                            </span>
                            <span>{intl.get('s6.deposit_hover3')}</span>
                            <span
                              className="can-click c-9195fb hover"
                              onClick={() => {
                                if (!isConnected) {
                                  network.connectWalletV2();
                                } else {
                                  showDAW(item, '2');
                                }
                              }}
                            >
                              {intl.get('s6.deposit_hover4')}
                            </span>
                            <span>{intl.get('s6.deposit_hover5')}</span>
                          </>
                        </>
                      )}
                      placement="top"
                      arrowPointAtCenter
                      overlayClassName={
                        'j-tooltip-dropdown light' +
                        (market?.DAWPop?.show && ['BUSD', 'ETH'].includes(item?.collateralSymbol) && mobile
                          ? ' j-tooltip-dropdown-disabled'
                          : '')
                      }
                    >
                      <div>
                        <button
                          className="j-btn j-supply"
                          disabled={!!item.mintPaused}
                          onClick={e => {
                            e.preventDefault();
                            clickDeposit(item);
                            window.gtag(
                              'event',
                              'PC_home_market_supply_' + item?.collateralSymbol?.toLocaleLowerCase(),
                              {
                                'event_category': 'PC_V1.5',
                                'event_label': 'home_market_supply_' + item?.collateralSymbol?.toLocaleLowerCase()
                              }
                            );
                          }}
                        >
                          {intl.get('v2.deposit')}
                        </button>
                      </div>
                    </Tooltip>
                  ) : item.collateralSymbol === 'SUNOLD' ? (
                    <Tooltip
                      title={intl.get('risk_tip.sunold_deposit')}
                      placement="top"
                      arrowPointAtCenter
                      overlayClassName="j-tooltip-dropdown"
                    >
                      <div>
                        <button
                          className="j-btn j-supply"
                          onClick={e => {
                            e.preventDefault();
                            clickDeposit(item);
                            window.gtag(
                              'event',
                              'PC_home_market_supply_' + item?.collateralSymbol?.toLocaleLowerCase(),
                              {
                                'event_category': 'PC_V1.5',
                                'event_label': 'home_market_supply_' + item?.collateralSymbol?.toLocaleLowerCase()
                              }
                            );
                          }}
                        >
                          {intl.get('v2.deposit')}
                        </button>
                      </div>
                    </Tooltip>
                  ) : (
                    <button
                      className="j-btn j-supply"
                      onClick={e => {
                        e.preventDefault();
                        clickDeposit(item);
                        window.gtag('event', 'PC_home_market_supply_' + item?.collateralSymbol?.toLocaleLowerCase(), {
                          'event_category': 'PC_V1.5',
                          'event_label': 'home_market_supply_' + item?.collateralSymbol?.toLocaleLowerCase()
                        });
                      }}
                    >
                      {intl.get('v2.deposit')}
                    </button>
                  )}

                  {!!item.borrowPaused ? (
                    <Tooltip
                      title={() => (
                        <>
                          {item?.collateralSymbol === 'SUNOLD'
                            ? intl.getHTML('risk_tip.sunold_borrow')
                            : intl.getHTML('s7.borrow_temporarily_disabled', { value: item.collateralSymbol })}{' '}
                          <span>{intl.get('s6.borrow_hover1')}</span>
                          <span
                            className="can-click c-9195fb hover"
                            onClick={() => {
                              if (!isConnected) {
                                network.connectWalletV2();
                              } else {
                                window.scrollTo(0, 0);
                                document.body.scrollTop = 0;
                                document.documentElement.scrollTop = 0;
                                lend.setActiveKey('borrow');
                              }
                            }}
                          >
                            {intl.get('s6.borrow_hover2')}
                          </span>
                          <span>{intl.get('s6.borrow_hover3')}</span>
                          <span
                            className="can-click c-9195fb hover"
                            onClick={() => {
                              if (!isConnected) {
                                network.connectWalletV2();
                              } else {
                                lend.showBorrowModal(item, '2');
                              }
                            }}
                          >
                            {intl.get('s6.borrow_hover4')}
                          </span>
                          <span>{intl.get('s6.borrow_hover5')}</span>
                        </>
                      )}
                      placement="topRight"
                      arrowPointAtCenter
                      overlayClassName="j-tooltip-dropdown j-market-tooltip-dropdown light"
                    >
                      <button className="j-btn j-borrow disabled">{intl.get('v2.borrow')}</button>
                    </Tooltip>
                  ) : (
                    <button
                      className="j-btn j-borrow"
                      onClick={e => {
                        e.preventDefault();
                        clickBorrow(text, item);
                        window.gtag('event', 'PC_home_market_borrow_' + item?.collateralSymbol?.toLocaleLowerCase(), {
                          'event_category': 'PC_V1.5',
                          'event_label': 'home_market_borrow_' + item?.collateralSymbol?.toLocaleLowerCase()
                        });
                      }}
                    >
                      {intl.get('v2.borrow')}
                    </button>
                  )}
                </div>
              )}

              {isTrx && <LiquidityStakeTipButton></LiquidityStakeTipButton>}
              {isUsdt && <StUSDTStakeTipButton />}
            </div>
          );
        }
      }
    ];
    return columns;
  };

  const showDAW = (popData, activeKey) => {
    market.setDAWPop({
      show: true,
      activeKey,
      popData: popData
    });
  };

  const clickRow = (e, record) => {
    const classNames = e?.target?.className;

    try {
      if (
        classNames?.indexOf('j-btn') === -1 &&
        classNames?.indexOf('ant-table-cell-fix-right') === -1 &&
        classNames?.indexOf('can-click') === -1
      ) {
        goToMarketDetailPage(record.jtokenAddress);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const onChange = checked => {
    if (checked) {
      window.gtag('event', 'PC_show_balance', { 'event_category': 'PC_V1.5', 'event_label': 'show_balance' });
    }
    setChecked(checked);
  };

  const searchChange = e => {
    window.gtag('event', 'PC_search_market', { 'event_category': 'PC_V1.5', 'event_label': 'search_market' });
    setSeachValue(('' + e.target.value).trim());
  };

  const onMobileSearchChange = e => {
    window.gtag('event', 'H5_search_market', { 'event_category': 'H5', 'event_label': 'search_market' });
    setSeachValue(('' + e.target.value).trim());
  };

  const onClickShowMore = () => {
    setShowHiddenMarket(true);
  };

  const { marketDataSource, balanceInfo } = market;
  const { userDepositDataSource, userDataSource } = user;
  const { isConnected } = network;
  const { theme, mortgageModalInfo } = lend;
  const isWhite = theme === 'white';
  let marketDataSourceNew = marketDataSource;

  if (checked) {
    marketDataSourceNew = marketDataSourceNew.filter(item => {
      if (BigNumber(balanceInfo[item.jtokenAddress]?.balance).isNaN()) {
        return true;
      } else {
        return BigNumber(balanceInfo[item.jtokenAddress]?.balance).gt(0);
      }
    });
  }

  if (seachValue) {
    marketDataSourceNew = marketDataSourceNew.filter(
      item =>
        item?.collateralName?.toLowerCase().indexOf(seachValue.toLowerCase()) > -1 ||
        item?.collateralSymbol?.toLowerCase()?.indexOf(seachValue.toLowerCase()) > -1
    );
  }

  if (userDataSource && userDataSource.length > 0) {
    marketDataSourceNew = marketDataSourceNew.map(items => {
      const newItems = { ...items };
      userDataSource.forEach(item => {
        if (newItems.collateralSymbol === item.collateralSymbol) {
          newItems.account_entered = item.account_entered;
          newItems.account_depositJtoken = item.account_depositJtoken;
        }
      });
      return newItems;
    });
  }

  // Hide some market
  let haveHiddenMarket = marketDataSourceNew
    .map(x => x.collateralSymbol)
    .some(sym => Config.hideMarketList.includes(sym.toUpperCase()));
  let activeMarketList = [],
    hiddenMarketList = [],
    fullMarketList = [];

  if (haveHiddenMarket) {
    let result = marketListSort(marketDataSourceNew);
    activeMarketList = result.activeMarketList;
    hiddenMarketList = result.hiddenMarketList;
    fullMarketList = result.fullMarketList;
  } else {
    activeMarketList = marketDataSourceNew;
    fullMarketList = marketDataSourceNew;
  }

  return (
    <>
      {mobile ? (
        <HomeMarketList
          marketList={marketDataSourceNew}
          checked={checked}
          onSearchValueChange={onMobileSearchChange}
          onCheckedChanged={onChange}
          onSwitchChange={onSwitchChange}
        ></HomeMarketList>
      ) : !isLoading ? (
        <div className="bs-list j-market-list">
          <div className="market-top">
            <div>{intl.get('v2.markets')}</div>
            <div className="market-right">
              {isConnected ? (
                <Checkbox checked={checked} onChange={e => onChange(e.target.checked)} className="show-balance">
                  {intl.get('v2.show_balance')}
                </Checkbox>
              ) : null}

              <Input
                className="search-token"
                prefix={<img src={isWhite ? SearchIconWhite : SearchIcon} alt="search" />}
                placeholder={intl.get('v2.search_market')}
                value={seachValue}
                onChange={searchChange}
                allowClear
              />

              <SimpleLink href={`/marketNew?lang=${lang}`}>{intl.get('more')}</SimpleLink>
            </div>
          </div>
          <Table
            onRow={record => {
              return {
                onClick: e => {
                  clickRow(e, record);
                }
              };
            }}
            columns={getInfoColumns(balanceInfo)}
            dataSource={showHiddenMarket ? fullMarketList : activeMarketList}
            pagination={false}
            locale={{
              emptyText: emptyReactNodeNew
            }}
            scroll={{ x: isMobile(window.navigator).any ? 750 : 1100 }}
            footer={
              haveHiddenMarket && !showHiddenMarket
                ? () => {
                    return (
                      <a className="load-more-btn" onClick={() => onClickShowMore()}>
                        {intl.get('load_more')}
                      </a>
                    );
                  }
                : undefined
            }
          />
        </div>
      ) : (
        <div className="j-market-list-skeleton">
          <div className="market-title-skeleton-row">
            <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="title-skeleton" />
            <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="search-input-skeleton" />
          </div>
          <div className="skeleton-space" />
          <Skeleton title={false} paragraph={{ rows: 16, width: '100%' }} active className="list-skeleton" />
        </div>
      )}
      <CanNotCollateral />
      {mortgageModalInfo.visible && <MortgageModal dataSource={userDepositDataSource}></MortgageModal>}
    </>
  );
});

export default HomeMarket;
