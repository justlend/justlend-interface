import { inject, observer } from 'mobx-react';
import React from 'react';

import { Modal, Progress, Tooltip, Skeleton } from 'antd';
import { Link } from 'react-router-dom';
import { getJTokenDetails } from '../../../utils/backend.js';
import { getJTokenLogo, getParameterByName, isMobile, skeletonRender } from '../../../utils/helper.js';
import { MarketSelect } from './MarketSelect.jsx';
import intl from 'react-intl-universal';
import { MarketDetailPrice } from './MarketDetailPrice.jsx';
import { MarketDetailData } from './MarketDetailData.jsx';
import { processJTokenData } from './utils.js';
import { InterestRateModel } from './InterestRateModel.jsx';
import WinterTheme from '../../WinterTheme';
import { Config } from '../../../config';
import '../../../assets/css/v2/market/market-detail.scss';
import '../../../assets/css/v2/userlist.scss';
import '../../../assets/css/v2/theme.scss';
import '../../../assets/css/v2/modal.scss';
import { DepositDetailModel } from './DepositDetailModel.jsx';
import { BorrowDetailModel } from './BorrowDetailModel.jsx';
import DAW from '../../Modals/v2/DAW';
import BorrowModal from '../../Modals/v2/Borrow';
import MortgageModal from '../../Modals/v2/Mortgage';
import Footer from '../Footer.js';
import Header from '../Header.js';
import SeasonToolBar from '../season/index';
import CollateralLimit from '../../Modals/v2/CollateralLimit';
import TransactionModal from '../../Modals/v2/Transaction';
import defaultIcon from '../../../assets/images/default.svg';
import TabsBar from '../mobile/TabsBar.js';

import legendImg1 from '../../../assets/images/skeleton/legend-1.png';
import legendImg2 from '../../../assets/images/skeleton/legend-2.png';
import legendImg3 from '../../../assets/images/skeleton/legend-3.png';
import legendImgWhite1 from '../../../assets/images/skeleton/white/legend-1.png';
import legendImgWhite2 from '../../../assets/images/skeleton/white/legend-2.png';
import legendImgWhite3 from '../../../assets/images/skeleton/white/legend-3.png';
import { getLendIcons } from '../../../utils/constant.js';
const { miningSymbol } = Config;
const defaultJTokenData = {
  collateralName: '--',
  collateralSymbol: '--',
  priceUSD: '--',
  depositHeadcount: '--',
  borrowHeadcount: '--',
  borrowLimit: '--',
  earnUSDPerDay: '--',
  totalReserves: '--',
  reserveFactor: '--',
  collateralFactor: '--',
  totalSupply: '--',
  oneToExchangeRate: '--'
};

@inject('network')
@inject('lend')
@inject('pool')
@observer
class MarketDetailV2 extends React.Component {
  constructor(props) {
    super(props);
    document.title = 'Market - JustLend DAO';
    this.state = {
      jTokenData: processJTokenData({
        jTokenData: defaultJTokenData,
        jtokenAddress: '',
        checked: true
      }),
      showMintApy: true,
      showDepositMintApy: true,
      jtokenAddress: getParameterByName('jtokenAddress'),
      isFetchingTokenData: false,
      mobile: isMobile().any
    };
    this.timer = null;
  }
  async componentDidMount() {
    // if (this.state.mobile) {
    //   window.location.hash = window.location.hash.replace('/marketDetailNew', '/marketDetail');
    //   return;
    // }
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;

    await this.props.lend.getMintInfo();
    this.getJTokenData();
    await this.props.network.getNowTime();
    this.props.network.getCountTime();
    this.timer = setInterval(() => {
      this.getJTokenData();
    }, 30000);
    this.props.lend.setVariablesInterval();

    window.gtag('event', 'PC_market_detail_new', { 'event_category': 'PC_V1.5', 'event_label': 'market_detail_new' });
  }

  componentWillUnmount() {
    this.timer && clearInterval(this.timer);
    this.props.lend.clearVariablesInterval();
  }

  getJTokenData = async () => {
    try {
      const { jtokenAddress, isFetchingTokenData } = this.state;
      if (isFetchingTokenData) {
        return;
      }
      this.setState({
        isFetchingTokenData: true
      });
      const res = await getJTokenDetails(jtokenAddress);
      this.setState({
        isFetchingTokenData: false
      });
      if (!res.success) {
        return;
      }
      this.setState({ jTokenData: res.data || {} });
    } catch (err) {
      console.error('getJTokenData', err);
    }
  };
  getUserData = async () => {
    await this.props.lend.getUserData();
    await this.props.lend.getUserDataFromMarkets();
    await this.props.lend.getTokenBalanceInfo();
    if (this.props.network.isConnected) {
      this.props.lend.getContinueDisabledStatus();
      this.props.lend.getRiojBalance();
    }
  };

  getMarketData = async () => {
    this.props.lend.getRiojCheck();
    this.props.lend.getMintPaused();
    this.props.lend.getPaused();
    this.props.lend.getAmountLimit();
    await this.props.lend.getMarketData();
    await this.props.lend.getMintInfo();
    this.props.lend.getDashboardData();
  };

  onMarketChange = async jtokenAddress => {
    this.setState(
      {
        jtokenAddress,
        showMintApy: true,
        showDepositMintApy: true
      },
      async () => {
        // await this.getJTokenData();
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.set('jtokenAddress', jtokenAddress);
        window.location.search = `${searchParams.toString()}`;
      }
    );
  };
  onShowMintApyChange = async showMintApy => {
    this.setState({
      showMintApy
    });
  };
  onShowDepositMintApyChange = async showDepositMintApy => {
    this.setState({
      showDepositMintApy
    });
  };

  loadingRender = () => {
    const { theme } = this.props.lend;
    const { mobile } = this.state;

    return (
      <>
        <div className="market-d skeleton">
          <div className="market-d-head">
            <div className="market-d-go-back">{skeletonRender()}</div>
            <div className="market-d-title flex">{skeletonRender()}</div>
          </div>
          <div className="market-d-body">
            {mobile ? (
              <>
                <div style={{ width: '48%', marginBottom: '20px' }}>{skeletonRender()}</div>
                <div style={{ width: '48%', marginBottom: '10px' }}>{skeletonRender()}</div>
              </>
            ) : (
              <div className="section market-d-select">
                <div className="market-d-select-inner">{Config.totalDebtTokenArr.map(item => skeletonRender())}</div>
              </div>
            )}

            <div className="ml-base market-d-main">
              {!mobile && <div className="skeleton-block">{skeletonRender()}</div>}
              <div className="market-d-main-content-wrap flex mt-base">
                <div className="market-d-main-content flex-col">
                  <div className="skeleton-block">
                    <div className="flex jcsb">
                      <div style={{ width: '48%' }}>{skeletonRender()}</div>
                      <div style={{ width: '48%' }}>{skeletonRender()}</div>
                    </div>
                    <img className="legend legend-1" src={theme === 'white' ? legendImgWhite1 : legendImg1} />
                    {skeletonRender()}
                  </div>

                  <div className="skeleton-block">
                    <div className="flex jcsb">
                      <div style={{ width: '48%' }}>{skeletonRender()}</div>
                      <div style={{ width: '48%' }}></div>
                    </div>
                    <img className="legend legend-2" src={theme === 'white' ? legendImgWhite2 : legendImg2} />
                    <img className="legend legend-3" src={theme === 'white' ? legendImgWhite3 : legendImg3} />
                    {skeletonRender()}
                  </div>

                  <div className="skeleton-block">
                    <div className="flex jcsb">
                      <div style={{ width: '48%' }}>{skeletonRender()}</div>
                      <div style={{ width: '48%' }}></div>
                    </div>
                    <img className="legend legend-2" src={theme === 'white' ? legendImgWhite2 : legendImg2} />
                    <img className="legend legend-3" src={theme === 'white' ? legendImgWhite3 : legendImg3} />
                    {skeletonRender()}
                  </div>
                </div>
                <div className="market-d-main-data ml-base ">
                  <div className="skeleton-block">
                    <div>{skeletonRender()}</div>
                    <div className="mb-10">{skeletonRender()}</div>
                    {!mobile && <div>{skeletonRender()}</div>}
                  </div>
                  {!mobile && (
                    <>
                      <div className="skeleton-block">
                        <div>{skeletonRender()}</div>
                        <div className="mb-10">{skeletonRender()}</div>
                        <div className="mb-10">{skeletonRender({ rows: 3 })}</div>
                        <div>
                          {new Array(7).fill(1).map(() => (
                            <div>{skeletonRender()}</div>
                          ))}
                        </div>
                      </div>

                      <div className="skeleton-block">
                        <div>
                          {new Array(9).fill(1).map(() => (
                            <div>{skeletonRender()}</div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                  {mobile && (
                    <>
                      <div className="md-fir skeleton-block border-bottom">
                        <div>{skeletonRender()}</div>
                      </div>
                      <div className="md-sec skeleton-block">
                        <div className="mb-10">{skeletonRender()}</div>
                        <div className="two-part">
                          {new Array(2).fill(1).map(() => (
                            <div>{skeletonRender({ rows: 2 })}</div>
                          ))}
                        </div>
                      </div>
                      <div className="half-part">{skeletonRender()} </div>
                      <div className="skeleton-block">
                        {new Array(2).fill(1).map(() => (
                          <div>{skeletonRender()}</div>
                        ))}
                      </div>
                      <div className="half-part">{skeletonRender()} </div>
                      <div className="md-fir skeleton-block">
                        {new Array(3).fill(1).map(() => (
                          <div>{skeletonRender()}</div>
                        ))}
                      </div>
                      <div className="skeleton-space-block"></div>
                      <div className="md-sec skeleton-block border-bottom">
                        {new Array(2).fill(1).map(() => (
                          <div>{skeletonRender()}</div>
                        ))}
                      </div>
                      <div className="md-thi skeleton-block border-bottom">
                        {new Array(7).fill(1).map(() => (
                          <div>{skeletonRender()}</div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  riskMarketsTipRender = jTokenData => {
    return (
      (Config.riskMarkets.includes(jTokenData?.collateralSymbol) ||
        jTokenData?.collateralSymbol === 'WBTT' ||
        (jTokenData?.collateralSymbol === 'USDDOLD' && miningSymbol === 'USDD')) && (
        <div
          className={
            jTokenData?.collateralSymbol === 'USDDOLD' && miningSymbol === 'USDD'
              ? 'market-head-tips usdd-update'
              : 'market-head-tips'
          }
        >
          <em className="not-used-icon"></em>
          <div>
            {intl.getHTML(
              jTokenData?.collateralSymbol === 'SUNOLD'
                ? 'risk_tip.sunold_borrow'
                : jTokenData?.collateralSymbol === 'BUSD'
                ? 'risk_tip.busd_icon'
                : jTokenData?.collateralSymbol === 'WBTT'
                ? 'risk_tip.wbtt_icon'
                : jTokenData?.collateralSymbol === 'USDDOLD' && miningSymbol === 'USDD'
                ? 'usdd_update.tip'
                : 'risk_tip.eth_icon',
              { link: Config.announceLink }
            )}
          </div>
        </div>
      )
    );
  };

  render() {
    const {
      theme,
      borrowModalInfo,
      DAWPop,
      lang,
      mortgageModalInfo,
      userDepositDataSource,
      dashboardData,
      totalCollateralShow
    } = this.props.lend;
    const { jtokenAddress, showMintApy, showDepositMintApy, mobile } = this.state;
    const jTokenData = processJTokenData({ jTokenData: this.state.jTokenData, jtokenAddress, showMintApy });
    const markets = dashboardData?.markets || [];

    var bttLogoUrl = defaultIcon;
    if (markets && markets.length > 0) {
      const bttMarketResult = markets.filter(market => market.collateralSymbol === 'BTT');
      if (bttMarketResult.length > 0) {
        bttLogoUrl = bttMarketResult[0].logoUrl;
      }
    }

    let isLoading = true;
    if (dashboardData?.markets?.length) {
      isLoading = false;
    }
    return (
      <>
        <div className={'j-wrapper ' + theme + (Config.winterThemeVisible ? ' snow-show' : '')}>
          {Config.winterThemeVisible && <WinterTheme fromPage="marketDetail" />}
          <Header hideBackBtn={true} instantActions={this.getMarketData} mountedActions={this.getUserData}></Header>
          <SeasonToolBar pageName="marketDetail" />
          {isLoading ? (
            this.loadingRender()
          ) : (
            <div className={`market-d ${lang}`}>
              {mobile &&
                (Config.riskMarkets.includes(jTokenData?.collateralSymbol) ||
                  jTokenData?.collateralSymbol === 'WBTT' ||
                  (jTokenData?.collateralSymbol === 'USDDOLD' && miningSymbol === 'USDD')) &&
                this.riskMarketsTipRender(jTokenData)}
              <div className="market-d-head">
                <Link
                  className="market-d-go-back"
                  to={`${getParameterByName('_from')}?lang=${lang}` || `/homeNew?lang=${lang}`}
                >
                  <span className="color-primary fs14">{intl.get('v2.back')}</span>
                </Link>
                <div className="market-d-title flex">
                  <img
                    src={
                      jTokenData.collateralSymbol === 'WBTT' && theme !== 'white'
                        ? bttLogoUrl
                        : jTokenData.logoUrl
                        ? jTokenData.logoUrl
                        : getLendIcons(jTokenData.collateralSymbol)
                    }
                    alt="logo"
                    className={jTokenData.collateralSymbol === 'ETHB' && 'add-white-bg'}
                    onError={e => {
                      e.target.onerror = null;
                      e.target.src = getLendIcons(jTokenData.collateralSymbol);
                    }}
                  />
                  <h2 className="color-primary market-name">{`${jTokenData.collateralName} (${
                    jTokenData.collateralSymbol
                  }) ${intl.get('v2.market_detail')}`}</h2>
                  {jTokenData.collateralSymbol === 'ETHB' && (
                    <span className={'detail-title-des ' + theme}>({intl.get('eth.origin_eth')})</span>
                  )}
                  {jTokenData.collateralSymbol === 'ETH' && (
                    <span className={'detail-title-des ' + theme}>({intl.get('eth.origin_ethold')})</span>
                  )}
                </div>
              </div>
              <div className="market-d-head-mobile">
                <Link
                  className="market-d-go-back"
                  to={`${getParameterByName('_from')}?lang=${lang}` || `/homeNew?lang=${lang}`}
                >
                  <span className="color-primary fs12">{intl.get('v2.back')}</span>
                </Link>
                <div className="market-d-head-mobile-title">
                  <span className="indicator"></span>
                  <span className="text color-primary">{intl.get('v2.market_detail')}</span>
                </div>
              </div>
              <div className="market-d-body">
                <MarketSelect value={jtokenAddress} onChange={this.onMarketChange}></MarketSelect>
                <div className="ml-base market-d-main">
                  {!mobile &&
                    (Config.riskMarkets.includes(jTokenData?.collateralSymbol) ||
                      jTokenData?.collateralSymbol === 'WBTT' ||
                      (jTokenData?.collateralSymbol === 'USDDOLD' && miningSymbol === 'USDD')) &&
                    this.riskMarketsTipRender(jTokenData)}
                  <MarketDetailPrice jTokenData={jTokenData} bttLogoUrl={bttLogoUrl}></MarketDetailPrice>
                  <div className="market-d-main-content-wrap flex mt-base">
                    {}
                    <div className="market-d-main-content flex-col">
                      <InterestRateModel
                        showMintApy={showMintApy}
                        onShowMintApyChange={this.onShowMintApyChange}
                        jTokenData={jTokenData}
                      ></InterestRateModel>
                      <DepositDetailModel
                        dataList={jTokenData.depositDetail || []}
                        jTokenData={jTokenData}
                      ></DepositDetailModel>
                      <BorrowDetailModel
                        dataList={jTokenData.borrowDetail || []}
                        jTokenData={jTokenData}
                      ></BorrowDetailModel>
                    </div>
                    <MarketDetailData jTokenData={jTokenData}></MarketDetailData>
                  </div>
                </div>
              </div>
            </div>
          )}
          <Footer></Footer>
          {DAWPop.show && <DAW />}
          {borrowModalInfo.visible && <BorrowModal></BorrowModal>}
          <TransactionModal></TransactionModal>
          {totalCollateralShow && <CollateralLimit />}
          {mortgageModalInfo.visible && <MortgageModal dataSource={userDepositDataSource}></MortgageModal>}
        </div>
        <TabsBar theme={theme} />
      </>
    );
  }
}

export default MarketDetailV2;
