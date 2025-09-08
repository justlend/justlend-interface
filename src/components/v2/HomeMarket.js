import React from 'react';
import isMobile from 'ismobilejs';
import { Link } from 'react-router-dom';
import { Table, Tooltip, Modal, Button, Checkbox, Input, Skeleton } from 'antd';
import intl from 'react-intl-universal';
import BigNumber from 'bignumber.js';
import Config from '../../config';
import {
  formatNumber,
  getDepositApy,
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
import defaultIcon from '../../assets/images/default.svg';
import SearchIcon from '../../assets/images/v2/search-icon.svg';
import SearchIconWhite from '../../assets/images/v2/white-theme/search-icon.svg';
import '../../assets/css/v2/home-market.scss';
import { LiquidityStakeTipButton } from '../Common/LiquidityStakeTipButton';
import { StUSDTStakeTipButton } from '../Common/StUSDTStakeTipButton';
import HomeMarketList, { getLiquidityTooltipTitle, getSupplyApyTooltipTitleNew } from './mobile/HomeMarketList';
import { SimpleLink } from '../Common/SimpleLink';
import { checkIfShouldShowMintApyDetail } from './market-detail/utils';
import { TooltipText } from './strx/TooltipText';
const { miningSymbol } = Config;
@inject('network')
@inject('lend')
@inject('system')
@observer
class HomeMarket extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      mobile: isMobile(window.navigator).any,
      checked: false,
      seachValue: '',
      showHiddenMarket: false
    };
  }
  componentDidMount = () => {
    // const { marketList } = this.props.lend;
    // this.props.lend.getHomeData({ ...marketList });
    // const { infoData } = this.props.lend;
    // await this.props.lend.getHomeData({ ...infoData });
  };

  clickDeposit = item => {
    const { isConnected } = this.props.network;
    if (!isConnected) {
      return this.props.network.connectWalletV2();
    }

    if (this.props.network.isRightChain === 0) {
      this.props.network.changeChain();
      return;
    }

    if (this.props.network.isMainNetwork === 0) {
      this.props.network.showNetworkErrorModal();
      return;
    }

    this.props.system.clearRejectError();

    this.showDAW(item, '1');
  };

  clickBorrow = (text, item) => {
    const { isConnected } = this.props.network;
    if (!isConnected) {
      return this.props.network.connectWalletV2();
    }

    if (this.props.network.isRightChain === 0) {
      this.props.network.changeChain();
      return;
    }

    if (this.props.network.isMainNetwork === 0) {
      this.props.network.showNetworkErrorModal();
      return;
    }

    if (!this.props.lend.collateralValid(item.collateralSymbol)) return;

    this.props.system.clearRejectError();
    this.props.lend.showBorrowModal(item, '1');
  };

  getBorrowValue = item => {
    const { jtokenAddress } = item;
    const { userList } = this.props.lend;
    const { borrowBalanceNew, deposited } = userList[jtokenAddress] || { borrowBalanceNew: 0, deposited: 0 };
    return { borrowBalanceNew, deposited };
  };

  depositApyTooltipRender = () => {
    const { openMint } = this.props.lend;
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

  marketLendTooltipRender = () => {
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

  onSwitchChange = (status, item) => {
    const { isConnected } = this.props.network;
    if (!isConnected) {
      return this.props.network.connectWalletV2();
    }

    if (this.props.network.isRightChain === 0) {
      this.props.network.changeChain();
      return;
    }

    if (this.props.network.isMainNetwork === 0) {
      this.props.network.showNetworkErrorModal();
      return;
    }

    if (!this.props.lend.collateralValid(item.collateralSymbol)) return;

    if (!status && !BigNumber(item.account_depositJtoken).gt(0)) {
      this.props.lend.setData({ openCollateralShow: true });
      return;
    }

    const { jtokenAddress } = item;

    this.props.system.setData({ transModalInfo: { declined: false } });
    this.props.lend.setData(
      { visible: true, type: status ? 2 : 1, jtokenAddress, collateralSymbol: item.collateralSymbol },
      'mortgageModalInfo'
    );

    if (status) {
      window.gtag('event', 'PC_disable_mortgage', { 'event_category': 'PC_V1.5', 'event_label': 'disable_mortgage' });
    } else {
      window.gtag('event', 'PC_enable_mortgage', { 'event_category': 'PC_V1.5', 'event_label': 'enable_mortgage' });
    }
  };

  getInfoColumns = balanceInfo => {
    const { lang, mobile } = this.state;
    const { isConnected } = this.props.network;
    const { noService, riojBalance, theme, openMint } = this.props.lend;
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
          // <a
          //   href={`${Config.sunSwap}?lang=${lang}#/home?tokenAddress=${item.collateralAddress}&type=swap`}
          //   target="sunswap"
          // >
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
                  {text === 'USDDOLD' && miningSymbol === 'USDD' && (
                    <Tooltip
                      overlayClassName={'j-tooltip-dropdown ' + theme}
                      title={intl.get('usdd_update.tip')}
                      placement="top"
                      arrowPointAtCenter
                    >
                      <span className={'tip'}></span>
                    </Tooltip>
                  )}
                  {text === 'ETH' && <span className={'des ' + theme}>({intl.get('eth.origin_ethold')})</span>}
                  {text === 'ETHB' && <span className={'des ' + theme}>({intl.get('eth.origin_eth')})</span>}
                </div>
              )}
              <div className="description">{`${item.collateralName}`}</div>
            </div>
          </div>
          // </a>
        )
      },
      {
        title: this.depositApyTooltipRender(),
        className: 'deposit-apy-cell',
        dataIndex: 'depositApy',
        key: '2',
        sortDirections: ['descend', 'ascend'],
        sorter: (b, a) => {
          const { assetList } = this.props.lend;
          let t1 = getTotalApy(a, assetList);
          let t2 = getTotalApy(b, assetList);
          return t2.totalApy - t1.totalApy;
        },
        showSorterTooltip: false,
        render: (text, item) => {
          const { assetList, openMint } = this.props.lend;
          const { totalApy, mintApy, depositApy, wstUSDTDepositApyWithIncrement } = getTotalApy(item, assetList);
          const shouldShowMiningApyDetail =
            checkIfShouldShowMintApyDetail(true, item.collateralSymbol, mintApy) && openMint;

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
        title: this.marketLendTooltipRender(),
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
          return text === 2 ? (
            <Tooltip
              title={intl.get('index.not_support')}
              placement="top"
              arrowPointAtCenter
              overlayClassName="j-tooltip-dropdown"
            >
              <ToggleSwitch
                on={false}
                lang={lang}
                onClick={() => {
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
                this.onSwitchChange(text === 1, item);
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
              {this.props.lend.serviceInnerStatus === 'disabled' ? (
                <div className="btn-wrap season">
                  <Tooltip
                    title={intl.getHTML('season.can_not_connect')}
                    placement="bottomRight"
                    overlayClassName={'j-tooltip-dropdown season ' + theme}
                  >
                    <button
                      className="j-btn j-supply j-not-used disabled"
                      onClick={() => {
                        this.props.lend.setData({ noServiceModalAllVisible: true });
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
                        this.props.lend.setData({ noServiceModalAllVisible: true });
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
                                window.scrollTo(0, 0);
                                document.body.scrollTop = 0;
                                document.documentElement.scrollTop = 0;
                                this.props.lend.setData({ activeKey: 'supply' });
                              }}
                            >
                              {intl.get('s6.deposit_hover2')}
                            </span>
                            <span>{intl.get('s6.deposit_hover3')}</span>
                            <span
                              className="can-click c-9195fb hover"
                              onClick={() => {
                                this.showDAW(item, '2');
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
                        'j-tooltip-dropdown' +
                        (this.props.lend?.DAWPop?.show && ['BUSD', 'ETH'].includes(item?.collateralSymbol) && mobile
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
                            this.clickDeposit(item);
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
                            this.clickDeposit(item);
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
                        this.clickDeposit(item);
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
                      title={
                        item?.collateralSymbol === 'SUNOLD'
                          ? intl.getHTML('risk_tip.sunold_borrow')
                          : item?.collateralSymbol === 'ETH'
                          ? intl.get('risk_tip.ethold_borrow')
                          : intl.get('risk_tip.busd_borrow')
                      }
                      placement="topRight"
                      arrowPointAtCenter
                      overlayClassName="j-tooltip-dropdown j-market-tooltip-dropdown"
                    >
                      <button className="j-btn j-borrow disabled">{intl.get('v2.borrow')}</button>
                    </Tooltip>
                  ) : (
                    <button
                      className="j-btn j-borrow"
                      onClick={e => {
                        e.preventDefault();
                        this.clickBorrow(text, item);
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

  showDAW = (popData, activeKey) => {
    // this.props.system.setData({ transModalInfo: { declined: false } });
    this.props.lend.setData({
      DAWPop: {
        show: true,
        activeKey,
        popData: popData
      }
    });
  };

  filterUserEmptySunOld = (marketDataSource, isUserSunOldEmpty) => {
    if (marketDataSource) {
      let filterMarketDataSource = [...marketDataSource];
      marketDataSource.map((item, index) => {
        if (isUserSunOldEmpty && item?.collateralSymbol?.toLowerCase() === 'sunold') {
          filterMarketDataSource.splice(index, 1);
        }
      });
      return filterMarketDataSource;
    }
  };

  clickRow = (e, record) => {
    const { lang } = this.state;
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

  onChange = checked => {
    if (checked) {
      window.gtag('event', 'PC_show_balance', { 'event_category': 'PC_V1.5', 'event_label': 'show_balance' });
    }
    this.setState({ checked });
  };

  searchChange = e => {
    window.gtag('event', 'PC_search_market', { 'event_category': 'PC_V1.5', 'event_label': 'search_market' });
    this.setState({ seachValue: ('' + e.target.value).trim() });
  };
  onMobileSearchChange = e => {
    window.gtag('event', 'H5_search_market', { 'event_category': 'H5', 'event_label': 'search_market' });
    this.setState({ seachValue: ('' + e.target.value).trim() });
  };

  onClickStake(e) {
    e.stopPropagation();
    goToPage('strx');
  }

  onClickShowMore() {
    this.setState({ showHiddenMarket: true });
  }

  render() {
    let { marketDataSource, balanceInfo, isUserSunOldEmpty, userDataSource, mortgageModalInfo, userDepositDataSource } =
      this.props.lend;
    // console.log('===', JSON.stringify(userDataSource));
    const { mobile, checked, seachValue, showHiddenMarket } = this.state;
    const { multyRealStart, isConnected } = this.props.network;
    const { theme, lang } = this.props.lend;

    const isWhite = theme === 'white';
    // marketDataSource = this.filterUserEmptySunOld(marketDataSource, isUserSunOldEmpty);

    if (checked) {
      marketDataSource = marketDataSource.filter(item => {
        if (BigNumber(balanceInfo[item.jtokenAddress]?.balance).isNaN()) {
          return true;
        } else {
          return BigNumber(balanceInfo[item.jtokenAddress]?.balance).gt(0);
        }
      });
    }

    if (seachValue) {
      marketDataSource = marketDataSource.filter(
        item =>
          item?.collateralName?.toLowerCase().indexOf(seachValue.toLowerCase()) > -1 ||
          item?.collateralSymbol?.toLowerCase()?.indexOf(seachValue.toLowerCase()) > -1
      );
    }
    if (userDataSource && userDataSource.length > 0) {
      marketDataSource = marketDataSource.map(items => {
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
    let haveHiddenMarket = marketDataSource
      .map(x => x.collateralSymbol)
      .some(sym => Config.hideMarketList.includes(sym.toUpperCase()));
    let activeMarketList = [],
      hiddenMarketList = [],
      fullMarketList = [];

    if (haveHiddenMarket) {
      let result = marketListSort(marketDataSource);
      activeMarketList = result.activeMarketList;
      hiddenMarketList = result.hiddenMarketList;
      fullMarketList = result.fullMarketList;
    } else {
      activeMarketList = marketDataSource;
      fullMarketList = marketDataSource;
    }

    return (
      <>
        {mobile ? (
          <HomeMarketList
            marketList={marketDataSource}
            checked={checked}
            onSearchValueChange={this.onMobileSearchChange}
            onCheckedChanged={this.onChange}
            onSwitchChange={this.onSwitchChange}
          ></HomeMarketList>
        ) : !this.props.isLoading ? (
          <div className="bs-list j-market-list">
            <div className="market-top">
              <div>{intl.get('v2.markets')}</div>
              <div className="market-right">
                {isConnected ? (
                  <Checkbox checked={checked} onChange={e => this.onChange(e.target.checked)} className="show-balance">
                    {intl.get('v2.show_balance')}
                  </Checkbox>
                ) : null}

                <Input
                  className="search-token"
                  prefix={<img src={isWhite ? SearchIconWhite : SearchIcon} alt="search" />}
                  placeholder={intl.get('v2.search_market')}
                  value={seachValue}
                  onChange={this.searchChange}
                  allowClear
                />

                <SimpleLink href={`/marketNew?lang=${lang}`}>{intl.get('more')}</SimpleLink>
              </div>
            </div>
            <Table
              onRow={record => {
                return {
                  onClick: e => {
                    this.clickRow(e, record);
                  }
                };
              }}
              columns={this.getInfoColumns(balanceInfo)}
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
                        <a className="load-more-btn" onClick={() => this.onClickShowMore()}>
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
  }
}

export default HomeMarket;
