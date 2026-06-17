import React from 'react';
import { Link } from 'react-router-dom';
import isMobile from 'ismobilejs';
import intl from 'react-intl-universal';
import { Progress, Tooltip, Table, Checkbox, Input } from 'antd';
import { inject, observer } from 'mobx-react';
import MarketSummaryV2 from './MobileSummary';
import { getMarketDashboardData, getAnnoucements } from '../../../utils/backend';
import {
  BigNumber,
  amountFormat,
  formatNumber,
  getTotalApy,
  marketLendAvailable,
  emptyReactNode,
  formatNumberLend,
  renderPercent,
  toFixedDown,
  getMaxAPY,
  tooltip,
  getQueryObj,
  goToMarketDetailPage,
  marketListSort,
  skeletonRender
} from '../../../utils/helper';
import { getSupplyApyTooltipTitleNew } from '../mobile/HomeMarketList';
import { checkIfShouldShowMintApyDetail } from '../market-detail/utils';

import SearchIcon from '../../../assets/images/v2/search-icon.svg';
import SearchIconWhite from '../../../assets/images/v2/white-theme/search-icon.svg';
import defaultIcon from '../../../assets/images/default.svg';
import announceWhiteIcon from '../../../assets/images/skeleton/white/announce-icon.svg';
import announceIcon from '../../../assets/images/skeleton/announce-icon.svg';

import Config from '../../../config';
import '../../../assets/css/v2/home-market.scss';
import '../../../assets/css/v2/market.scss';
import '../../../assets/css/v2/market-mobile.scss';

import { getLendIcons } from '../../../utils/constant';
import CelebrateIcon from '../../../assets/images/icon/celebrate.png';
import StarfaceIcon from '../../../assets/images/icon/star_face.png';
const PAGE_SIZE = 300;
const { miningSymbol, miningNewSymbol, jtrxAddress } = Config;

@inject('network')
@inject('ui')
@inject('app')
@inject('lend')
@inject('market')
@inject('user')
@observer
class Market extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mobile: isMobile(window.navigator).any,
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      marketData: { markets: [] },
      pagination: {
        size: 'small',
        pageSize: PAGE_SIZE,
        simple: false,
        showSizeChanger: false,
        hideOnSinglePage: true
      },
      announcement: {},
      seachValue: ''
    };
  }

  componentDidMount = async () => {
    document.title = 'Market V1 - JustLend DAO';
    this.getMarketData();
    await this.props.market.getMarketData();
    this.props.market.getMintInfo();
    this.props.app.init();
    this.props.lend.setVariablesInterval();
    const announcementList = await getAnnoucements({ perPageCount: 20, lang: 'en-US' });
    this.setState({ announcement: announcementList?.[0] || {} });

    window.gtag('event', 'PC_market_new', { 'event_category': 'PC_V1.5', 'event_label': 'market_new' });
  };

  componentWillUnmount() {
    this.props.lend.clearVariablesInterval();
  }

  renderSummaryHeader(title = '', amount = 0, top = '', percent = 0) {
    return (
      <>
        <div className="market-summary-wrap">
          <div className="block-title">{title}</div>
          <div className="block-money">${amount === '--' ? '--' : formatNumber(amount, 0)}</div>
        </div>
      </>
    );
  }

  renderProgress({ text, percent = 0, key = 0, strokeType = true }) {
    return (
      <div key={key}>
        <div className="block-process flex-between">
          <span className="process-title">{text}</span>
          <span className="process-text">{this.percentFormat(percent)}</span>
        </div>
        <Progress className={strokeType ? 'deposit-stroke' : 'lend-stroke'} percent={percent * 100} showInfo={false} />
      </div>
    );
  }

  percentFormat(percent) {
    let num = BigNumber(percent * 100).toFormat(2);
    return num < 0.01 ? '< 0.01%' : num + '%';
  }

  renderSummaryFooter(leftTitle = '', rightTitle = '', leftAmount = 0, rightAmount = 0) {
    return (
      <div className="mp-15">
        <div className="summary-footer flex-between">
          <div className="">{leftTitle}</div>
          <div className="">{rightTitle}</div>
        </div>
        <div className="summary-footer flex-between second">
          <div className="num">{formatNumber(leftAmount, 0, { needDolar: true })}</div>
          <div className="num">{formatNumber(rightAmount, 0)}</div>
        </div>
      </div>
    );
  }

  renderDeposit() {
    const { marketData } = this.state;
    if (marketData && marketData.totalDepositedUSD) {
      return (
        <div className="market-summary-block">
          {this.renderSummaryHeader(intl.get('market.deposit_size'), marketData.totalDepositedUSD)}
          {this.renderSummaryFooter(
            intl.get('market.24hr_deposited'),
            intl.get('market.detail_number_of_deposit_accounts'),
            marketData.totalDepositedUSD24H,
            marketData.depositUser
          )}
        </div>
      );
    } else {
      return (
        <div className="market-summary-block">
          {this.renderSummaryHeader(intl.get('market.deposit_size'), '--')}
          {this.renderSummaryFooter(
            intl.get('market.24hr_deposited'),
            intl.get('market.detail_number_of_deposit_accounts'),
            '--',
            '--'
          )}
        </div>
      );
    }
  }

  renderLend() {
    const { marketData } = this.state;
    if (marketData && marketData.totalBorrowedUSD) {
      return (
        <div className="market-summary-block lend-block">
          {this.renderSummaryHeader(intl.get('market.borrow_overview'), marketData.totalBorrowedUSD)}
          {this.renderSummaryFooter(
            intl.get('market.24hr_borrowed'),
            intl.get('market.detail_number_of_borrow_accounts'),
            marketData.totalBorrowUSD24H,
            marketData.borrowUser
          )}
        </div>
      );
    } else {
      return (
        <div className="market-summary-block lend-block">
          {this.renderSummaryHeader(intl.get('market.borrow_overview'), '--')}
          {this.renderSummaryFooter(
            intl.get('market.24hr_borrowed'),
            intl.get('market.detail_number_of_borrow_accounts'),
            '--',
            '--'
          )}
        </div>
      );
    }
  }

  renderRewards() {
    const { marketData } = this.state;
    const { openMint } = this.props.lend;
    return (
      <div className={'market-summary-block reward-block ' + (openMint ? '' : 'csc-box')}>
        <div className="block-title">{intl.get('v2.daily_rewards')}</div>
        {openMint ? (
          <div className="mt-12 reward-amount-box">
            {Number(marketData?.farmRewardUsddAmount24h) > 0 ? (
              <div className="reward-amount">
                {formatNumber(marketData?.farmRewardUsddAmount24h, 0, { round: true })}{' '}
                <span className="token-name">{miningSymbol}</span>
              </div>
            ) : null}
            {Number(marketData?.farmRewardUsddAmount24h) > 0 && Number(marketData?.farmRewardTrxAmount24h) > 0 ? (
              <div className="plus-symbol">{'+'}</div>
            ) : null}
            {Number(marketData?.farmRewardTrxAmount24h) > 0 ? (
              <div className="reward-amount no-mt">
                {formatNumber(marketData?.farmRewardTrxAmount24h, 0, { round: true })}{' '}
                <span className="token-name">{miningNewSymbol}</span>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="coming-soon-container">
            <img className="coming-soon-icon csi-right" src={CelebrateIcon} alt="celebrate icon" />
            <img className="coming-soon-icon csi-left" src={StarfaceIcon} alt="star face icon" />
            <div className="coming-soon-inner-bg">
              <div className="coming-soon-title">{intl.get('mining.usdd_v2')}</div>
              <div className="coming-soon-text">{intl.get('mining.coming_soon')}</div>
            </div>
          </div>
        )}
      </div>
    );
  }

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

  tooltipHeadRender = (text, title) => {
    return (
      <>
        <Tooltip
          overlayClassName="market-tooltip-overlay"
          title={title}
          placement="topRight"
          trigger={['click', 'hover']}
          align={{
            offset: [14, 0]
          }}
        >
          <span className="j-tooltip-icon j-info-icon mr-4"></span>
        </Tooltip>
        <span>{text}</span>
      </>
    );
  };

  marketLendTooltipRender = () => {
    return (
      <>
        <Tooltip
          title={tooltip(intl.get('v2.tip8'), [
            {
              title: intl.get('v2.tip9')
            },
            { title: intl.get('v2.tip10') }
          ])}
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

  searchChange = e => {
    window.gtag('event', 'PC_search_market', { 'event_category': 'PC_V1.5', 'event_label': 'search_market' });
    this.setState({ seachValue: ('' + e.target.value).trim() });
  };

  renderMarketSummary = () => {
    const { marketData, seachValue } = this.state;
    let markets = marketData.markets;
    const isWhite = this.props.lend.theme === 'white';
    let result = marketListSort(markets);
    markets = result.fullMarketList;

    if (seachValue) {
      markets = markets.filter(
        item =>
          item?.collateralName?.toLowerCase().indexOf(seachValue?.toLowerCase()) > -1 ||
          item?.collateralSymbol?.toLowerCase()?.indexOf(seachValue?.toLowerCase()) > -1
      );
    }

    return (
      <div className="bs-v2-list">
        <div className="market-top">
          <div>{intl.get('v2.markets')}</div>
          <div className="market-right">
            <Input
              className="search-token"
              prefix={<img src={isWhite ? SearchIconWhite : SearchIcon} alt="search" />}
              placeholder={intl.get('v2.search_market')}
              value={seachValue}
              onChange={this.searchChange}
              allowClear
            />
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
          columns={this.getInfoColumns()}
          dataSource={markets}
          pagination={false}
          locale={{
            emptyText: emptyReactNode
          }}
          scroll={{ x: isMobile(window.navigator).any ? 500 : 770 }}
        />
      </div>
    );
  };

  clickRow = (e, record) => {
    window.gtag('event', `PC_market_${record?.collateralSymbol?.toLocaleLowerCase()}`, {
      'event_category': 'PC_V1.5',
      'event_label': `market_${record?.collateralSymbol?.toLocaleLowerCase()}`
    });

    const classNames = e?.target?.className;

    try {
      if (classNames?.indexOf('inline-block') === -1 && classNames?.indexOf('can-click') === -1) {
        goToMarketDetailPage(record.jtokenAddress);
      }
    } catch (e) {
      console.log(e);
    }
  };

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
      this.setState({ marketData: res.data });
    } catch (err) {
      console.log('getMarketData', err);
    }
  };

  getInfoColumns = () => {
    const { isConnected } = this.props.network;
    const { theme, openMint } = this.props.lend;
    const { userList } = this.props.user;
    const { isUSDJDisabled, isUSDDOLDDisabled, marketList, trxPrice, assetList, noService, riojBalance } =
      this.props.market;
    const trxAssetPrice = userList[jtrxAddress]?.assetPrice || marketList[jtrxAddress]?.assetPrice;
    let columns = [
      {
        title: intl.get('market.asset'),
        dataIndex: 'collateralSymbol',
        key: '1',
        ellipsis: true,
        fixed: 'left',
        width: isMobile(window.navigator).any ? 60 : 'auto',
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
                            link: text === 'USDCOLD' ? Config.announceForUSDCOLD : Config.announceLink
                          })
                    }
                    placement="top"
                    trigger="['hover','click']"
                    arrowPointAtCenter
                    overlayClassName={'j-tooltip-dropdown not-used ' + theme}
                  >
                    <em className="not-used-icon ml-6"></em>
                  </Tooltip>
                </div>
              ) : (
                <div className="token-names">
                  {`${text}`}
                  {text === 'USDJ' && isUSDJDisabled && (
                    <Tooltip
                      title={intl.get('risk_tip.usdj_icon')}
                      placement="top"
                      trigger="['hover','click']"
                      arrowPointAtCenter
                      overlayClassName={'j-tooltip-dropdown light ' + theme}
                    >
                      <em className="not-used-icon y-3 ml-6"></em>
                    </Tooltip>
                  )}
                  {text === 'USDDOLD' && miningSymbol === 'USDD' && (
                    <Tooltip
                      overlayClassName={'j-tooltip-dropdown ' + theme}
                      title={isUSDDOLDDisabled ? intl.getHTML('usdd_update.migrate') : intl.get('usdd_update.tip')}
                      placement="top"
                      arrowPointAtCenter
                    >
                      <span className={isUSDDOLDDisabled ? 'not-used-icon y-3 ml-6' : 'tip'}></span>
                    </Tooltip>
                  )}
                  {text === 'ETH' && <span className={'des ' + theme}>({intl.get('eth.origin_ethold')})</span>}
                  {text === 'ETHB' && <span className={'des ' + theme}>({intl.get('eth.origin_eth')})</span>}
                </div>
              )}
              <div className="description">{`${item.collateralName}`}</div>
            </div>
          </div>
        )
      },
      {
        title: intl.get('market.deposit_size'),
        dataIndex: 'depositApy',
        key: '2',
        width: isMobile(window.navigator).any ? 160 : 'auto',
        sortDirections: ['descend', 'ascend'],
        sorter: (b, a) => b.depositedUSD - a.depositedUSD,
        showSorterTooltip: false,
        render: (text, item) => {
          return (
            <div className="fw500 inline-block">
              {amountFormat(item.depositedUSD, 2, { miniText: 0.01, needDolar: true })}
            </div>
          );
        }
      },
      {
        title: this.depositApyTooltipRender(),
        dataIndex: 'depositedAPY',
        key: '3',
        width: isMobile(window.navigator).any ? 140 : 'auto',
        sortDirections: ['descend', 'ascend'],
        sorter: (b, a) => {
          const { assetList } = this.props.market;
          let t1 = getTotalApy(a, assetList);
          let t2 = getTotalApy(b, assetList);
          return t2.totalApy - t1.totalApy;
        },
        showSorterTooltip: false,
        className: 'deposit-apy-cell',
        render: (text, item) => {
          const { mintApy, mintApyTRX, totalApy } = getTotalApy(item, assetList);
          const apy = mintApy !== '--' && BigNumber(mintApy).gt(0) ? mintApy : mintApyTRX;
          const shouldShowMiningApyDetail =
            checkIfShouldShowMintApyDetail(true, item.collateralSymbol, apy) && openMint;

          return (
            <div className="fw500 right">
              <Tooltip
                overlayClassName="j-tooltip-dropdown market-tooltip-overlay short"
                overlayInnerStyle={{ width: 300 }}
                title={getSupplyApyTooltipTitleNew(item, assetList, openMint)}
                placement="bottom"
              >
                <span className="inline-flex jce pr j-deposit-apy">
                  <span className="fw500 j-deposit-apy inline-block">
                    {formatNumber(totalApy, 2, {
                      cutZero: false,
                      miniText: 0.01,
                      needDolar: false,
                      per: true
                    })}
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
            </div>
          );
        }
      },
      {
        title: intl.get('market.borrow_overview'),
        dataIndex: 'totalCashNew',
        key: '5',
        width: isMobile(window.navigator).any ? 160 : 'auto',
        sortDirections: ['descend', 'ascend'],
        sorter: (b, a) => b.borrowedUSD - a.borrowedUSD,
        showSorterTooltip: false,
        render: (text, item) => (
          <div className="fw500 inline-block">
            {amountFormat(item.borrowedUSD, 2, { miniText: 0.01, needDolar: true })}
          </div>
        )
      },
      {
        title: intl.get('market.borrow_apy'),
        dataIndex: 'balance',
        key: '4',
        width: isMobile(window.navigator).any ? 140 : 'auto',
        sortDirections: ['descend', 'ascend'],
        sorter: (b, a) => b.borrowedAPY - a.borrowedAPY,
        showSorterTooltip: false,
        ellipsis: true,
        render: (text, item) => {
          return (
            <div className="fw500 inline-block mr-6">
              {formatNumber(BigNumber(item.borrowedAPY).times(1e2), 2, {
                cutZero: false,
                miniText: 0.01,
                needDolar: false,
                per: true
              })}
              %
            </div>
          );
        }
      },
      {
        title: this.tooltipHeadRender(intl.get('v2.detail_collateral'), intl.get('v2.market_detail_collateral_tip')),
        dataIndex: 'collateralFactor',
        key: '6',
        sortDirections: ['descend', 'ascend'],
        sorter: (b, a) => b.collateralFactor - a.collateralFactor,
        showSorterTooltip: false,
        ellipsis: true,
        // fixed: 'right',
        width: 140,
        render: (text, item) => {
          return (
            <div className="fw500 inline-block">
              {renderPercent(BigNumber(text).div(Config.tokenDefaultPrecision), {
                decimal: 16,
                miniText: '0.0000000000000001',
                multi100: true
              })}
            </div>
          );
        }
      },
      {
        title: this.marketLendTooltipRender(),
        dataIndex: '',
        key: '7',
        ellipsis: true,
        // fixed: 'right',
        sortDirections: ['descend', 'ascend'],
        sorter: (b, a) => {
          if (marketList[b.jtokenAddress] && marketList[a.jtokenAddress])
            return marketLendAvailable(marketList[b.jtokenAddress]) - marketLendAvailable(marketList[a.jtokenAddress]);
        },
        showSorterTooltip: false,
        // width: 170,
        render: (text, item) => {
          // const { borrowBalanceNew, deposited } = this.getBorrowValue(item);
          const total = marketList[item.jtokenAddress]
            ? BigNumber(marketList[item.jtokenAddress].totalCash)
                .plus(marketList[item.jtokenAddress].totalBorrow)
                .minus(marketList[item.jtokenAddress].totalReserve)
            : '--';
          return (
            <div className="utilization-cell-wrap">
              <div className="utilization-cell-inner">
                <div className="fw500 utilization-cell inline-block">
                  {marketList[item.jtokenAddress]
                    ? amountFormat(marketLendAvailable(marketList[item.jtokenAddress]), 2, {
                        miniText: 0.01
                      })
                    : ''}{' '}
                  {item.collateralSymbol}
                </div>
                {marketList[item.jtokenAddress] && (
                  <Tooltip
                    overlayClassName="market-tooltip-overlay short right"
                    className="pt-8"
                    placement="bottom"
                    title={`${intl.get('v2.utilization_rate')} ${
                      marketList[item.jtokenAddress]
                        ? BigNumber(total).eq(0)
                          ? 0
                          : toFixedDown(BigNumber(marketList[item.jtokenAddress].totalBorrow).div(total).times(100), 2)
                        : '--'
                    }%`}
                  >
                    <div>
                      <div className="pipe">
                        <div
                          className="active-bar inline-block"
                          style={{
                            width:
                              toFixedDown(
                                BigNumber(marketList[item.jtokenAddress].borrowedUSD)
                                  .div(marketList[item.jtokenAddress].depositedUSD)
                                  .times(100),
                                2
                              ) + '%'
                          }}
                        ></div>
                      </div>
                    </div>
                  </Tooltip>
                )}
              </div>
            </div>
          );
        }
      },
      {
        title: this.tooltipHeadRender(intl.get('v2.market_detail_price_text'), intl.get('v2.price_tooltip')),
        dataIndex: '',
        key: '8',
        ellipsis: true,
        // fixed: 'right',
        sortDirections: ['descend', 'ascend'],
        sorter: (b, a) => {
          if (marketList[b.jtokenAddress] && marketList[a.jtokenAddress]) {
            const priceDivisor = BigNumber(trxAssetPrice).gte(Config.oraclePricePrecision)
              ? Config.oraclePricePrecision
              : Config.tokenDefaultPrecision;
            const getUsdPrice = (jtokenAddress) => {
              if (jtokenAddress === Config.usddJtoken || jtokenAddress === Config.usddoldJtoken) {
                return BigNumber(1);
              }
              return BigNumber(marketList[jtokenAddress].assetPrice)
                .times(trxPrice)
                .times(BigNumber(10).pow(marketList[jtokenAddress].collateralDecimal))
                .div(Config.tokenDefaultPrecision)
                .div(priceDivisor)
                .div(Config.defaultPrecision);
            };
            return getUsdPrice(b.jtokenAddress).minus(getUsdPrice(a.jtokenAddress));
          }
        },
        showSorterTooltip: false,
        // width: 170,
        render: (text, item) => {
          const isUsdd =
            item.jtokenAddress === Config.usddJtoken || item.jtokenAddress === Config.usddoldJtoken;
          return (
            <div className="fw500 inline-block">
              {marketList[item.jtokenAddress] &&
                formatNumberLend(
                  isUsdd
                    ? BigNumber(1)
                    : BigNumber(marketList[item.jtokenAddress].assetPrice)
                        .times(trxPrice)
                        .times(BigNumber(10).pow(marketList[item.jtokenAddress].collateralDecimal))
                        .div(Config.tokenDefaultPrecision)
                        // .div(Config.tokenDefaultPrecision)
                        .div(
                          BigNumber(trxAssetPrice).gte(Config.oraclePricePrecision)
                            ? Config.oraclePricePrecision
                            : Config.tokenDefaultPrecision
                        )
                        .div(Config.defaultPrecision),
                  6,
                  {
                    needDolar: true,
                    miniText: '0.000001'
                  }
                )}
            </div>
          );
        }
      }
    ];
    return columns;
  };

  loadingRender = () => {
    const { mobile } = this.state;
    const { theme } = this.props.lend;

    return (
      <div className="j-market market-container market-new-skeleton">
        <div className="s-top">
          <div>
            <div>{skeletonRender()}</div>
            <div className="skeleton-block">
              <div className="s-top-inner">
                <div className="flex">
                  <div>{skeletonRender()}</div>
                  <div>{skeletonRender()}</div>
                </div>
                <div className="flex">
                  <div>{skeletonRender()}</div>
                  <div>{skeletonRender()}</div>
                </div>
                <div className="flex">
                  <div>{skeletonRender()}</div>
                  <div>{skeletonRender()}</div>
                </div>
              </div>
            </div>
          </div>
          <div>
            {!mobile ? <div>{skeletonRender()}</div> : <span></span>}
            <div className="s-top-right">
              <div className="skeleton-block">
                <div className="s-top-inner">
                  <div className="flex">
                    <div>{skeletonRender()}</div>
                    <div>{skeletonRender()}</div>
                  </div>
                  <div className="flex">
                    <div>{skeletonRender()}</div>
                    <div>{skeletonRender()}</div>
                  </div>
                  <div className="flex">
                    <div>{skeletonRender()}</div>
                    <div>{skeletonRender()}</div>
                  </div>
                </div>
              </div>

              <div className="skeleton-block">
                <div>{skeletonRender()}</div>
                <div>{skeletonRender({ rows: 2 })}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="s-content-top skeleton-block">
          <div>{skeletonRender()}</div>
          <div>{skeletonRender()}</div>
        </div>
        <div className="skeleton-space-block"></div>
        {mobile ? (
          <div className="s-list skeleton-block">
            <div className="flex ">
              <img src={theme === 'white' ? announceWhiteIcon : announceIcon} />
              <div>
                {new Array(3).fill(1).map((item, index) => (
                  <div key={index}>{skeletonRender()}</div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="s-list skeleton-block">
            {new Array(20).fill(1).map((item, index) => (
              <div key={index}>{skeletonRender()}</div>
            ))}
          </div>
        )}

        {mobile && (
          <>
            <div className="s-content-mid">
              <div>{skeletonRender()}</div>
              <div>{skeletonRender()}</div>
            </div>
            <div className="s-content-bottom-1 skeleton-block">
              <div className="scb-top">{skeletonRender()}</div>
            </div>
            <div className="s-content-bottom-2 skeleton-block">
              {new Array(6).fill(1).map(() => (
                <div>
                  <div>{skeletonRender()}</div>
                  <div>{skeletonRender()}</div>
                </div>
              ))}
              <div>
                <div>{skeletonRender()}</div>
                <div></div>
              </div>
              <div>
                <div>{skeletonRender()}</div>
                <div></div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  render() {
    const { mobile, announcement } = this.state;
    let { openMint } = this.props.lend;
    const { marketDataSource } = this.props.market;

    let isLoading = true;
    if (Object.keys(announcement).length && marketDataSource.length) {
      isLoading = false;
    }

    return isLoading ? (
      this.loadingRender()
    ) : (
      <div className={'j-market ' + (mobile ? 'market-container mobile-right-container' : 'market-container')}>
        <div className="flexSPA top-header">
          <div className="j-navi">
            <div className="j-navi-content">
              <span className="current">{intl.get('liquidate.liquidate_market_list')}</span>
            </div>
          </div>
          {Object.keys(announcement).length > 0 && (
            <div className="j-announce">
              <span className="announce-icon"></span>
              <a
                className="announce-content"
                href={`${announcement?.html_url}`}
                target="announce"
                rel="noopener noreferrer"
              >
                {announcement.title}（{announcement?.created_at?.substr(0, 10)}）
              </a>
              {!mobile && openMint && <span className="market-up"></span>}
              <span className="announce-arrow-icon"></span>
            </div>
          )}
        </div>
        {/* <div className={'market-v2-summary-blocks ' + (Config.openMint ? '' : 'close')}> */}
        <div className={'market-v2-summary-blocks '}>
          {this.renderDeposit()}
          {this.renderLend()}
          {/* {openMint && this.renderRewards()} */}
          {this.renderRewards()}
        </div>
        {!mobile ? this.renderMarketSummary() : <MarketSummaryV2 />}
      </div>
    );
  }
}

export default Market;
