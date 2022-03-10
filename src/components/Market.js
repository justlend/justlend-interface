import React from 'react';
import isMobile from 'ismobilejs';
import intl from 'react-intl-universal';
import { Progress, Tooltip } from 'antd';
import { Link } from 'react-router-dom';
import { inject, observer } from 'mobx-react';
import LeftMenu from './LeftMenu';
import { getMarketDashboardData } from '../utils/backend';
import { BigNumber, amountFormat, formatNumber, getTotalApy } from '../utils/helper';
import Config from '../config';
import '../assets/css/market.scss';
import FooterPage from '../components/Footer';
import logoSingle from '../assets/images/logoSingle.png';

const PAGE_SIZE = 300;

@inject('network')
@inject('lend')
@observer
class Market extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mobile: isMobile(window.navigator).any,
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      marketData: null,
      pagination: {
        size: 'small',
        pageSize: PAGE_SIZE,
        simple: false,
        showSizeChanger: false,
        hideOnSinglePage: true
      }
    };
  }

  componentDidMount = async () => {
    this.getMarketData();
    this.props.lend.getMintInfo();
    await this.props.network.getNowTime();
    this.props.network.getCountTime();
  };

  renderSummaryHeader(title = '', amount = 0, top = '', percent = 0) {
    return (
      <>
        <div className="block-title">{title}</div>
        <div className="block-money">
          ${amount === '--' ? '--' : formatNumber(amount, 0)}
          {/* <span className="block-percent">
            {percent < 0.00005 ? '0.00%' : '+' + BigNumber(percent * 100).toFormat(2) + '%'}
          </span> */}
        </div>
        <div className="block-subtitle">{top}</div>
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
      <>
        <div className="summary-footer flex-between">
          <div className="c-84869E fs12">{leftTitle}</div>
          <div className="c-84869E fs12">{rightTitle}</div>
        </div>
        <div className="summary-footer flex-between mt12">
          <div className="c-0F134F fs14">{formatNumber(leftAmount, 0, { needDolar: true })}</div>
          <div className="c-0F134F fs14">{formatNumber(rightAmount, 0)}</div>
        </div>
      </>
    );
  }

  renderDeposit() {
    const { marketData } = this.state;
    if (marketData && marketData.depositTop3) {
      const list = marketData.depositTop3;
      return (
        <div className="market-summary-block">
          {this.renderSummaryHeader(
            intl.get('market.deposit_size'),
            marketData.totalDepositedUSD,
            intl.get('market.top')
          )}
          {list &&
            list.map((item, index) => {
              return this.renderProgress({
                text: item.collateralSymbol,
                percent: item.percent,
                key: item.collateralSymbol,
                strokeType: true
              });
            })}
          {this.renderSummaryFooter(
            intl.get('market.24hr_deposited'),
            intl.get('market.people_amount'),
            marketData.totalDepositedUSD24H,
            marketData.depositUser
          )}
        </div>
      );
    } else {
      const list = [{}, {}, {}];
      return (
        <div className="market-summary-block">
          {this.renderSummaryHeader(intl.get('market.deposit_size'), '--', intl.get('market.top'))}
          {list &&
            list.map((item, index) => {
              return this.renderProgress({
                text: '--',
                percent: 0,
                key: index,
                strokeType: true
              });
            })}
          {this.renderSummaryFooter(intl.get('market.24hr_deposited'), intl.get('market.people_amount'), '--', '--')}
        </div>
      );
    }
  }

  renderLend() {
    const { marketData } = this.state;
    if (marketData && marketData.depositTop3) {
      return (
        <div className="market-summary-block lend-block">
          {this.renderSummaryHeader(
            intl.get('market.borrow_size'),
            marketData.totalBorrowedUSD,
            intl.get('market.top')
          )}
          {marketData.borrowTop3 &&
            marketData.borrowTop3.map(item => {
              return this.renderProgress({
                text: item.collateralSymbol,
                percent: item.percent,
                key: item.collateralSymbol,
                strokeType: false
              });
            })}
          {this.renderSummaryFooter(
            intl.get('market.24hr_borrowed'),
            intl.get('market.people_amount'),
            marketData.totalBorrowUSD24H,
            marketData.borrowUser
          )}
        </div>
      );
    } else {
      const list = [{}, {}, {}];
      return (
        <div className="market-summary-block lend-block">
          {this.renderSummaryHeader(intl.get('market.borrow_size'), '--', intl.get('market.top'))}
          {list &&
            list.map((item, index) => {
              return this.renderProgress({
                text: '--',
                percent: 0,
                key: index,
                strokeType: true
              });
            })}
          {this.renderSummaryFooter(intl.get('market.24hr_borrowed'), intl.get('market.people_amount'), '--', '--')}
        </div>
      );
    }
  }
  depositApyTooltipRender = () => {
    return (
      <>
        {intl.get('market.deposit_apy')}
        <Tooltip title={intl.get('market.deposit_tip')} placement="bottom">
          <span className="tooltip-icon info-icon"></span>
        </Tooltip>
      </>
    );
  };
  
  renderMarketSummary() {
    const { marketData } = this.state;
    const { assetList } = this.props.lend;
    const { multyRealStart } = this.props.network;

    if (marketData && marketData.markets) {
      const markets = marketData.markets;
      let renderList =
        markets &&
        markets.map(item => {
          const { depositApy, mintApy, totalApy } = getTotalApy(item, assetList);

          return (
            <Link to={{ pathname: '/marketDetail', search: '?jtokenAddress=' + item.jtokenAddress }} key={item.id}>
              <div className="table-alike table-row">
                <div>
                  <img src={item.logoUrl} />
                  <p className="token-names fw500">{item.collateralSymbol}</p>
                  <p className="description" title={item.collateralName}>
                    {item.collateralName}
                  </p>
                </div>
                <div className="fw500">{amountFormat(item.depositedUSD, 2, { miniText: 0.01, needDolar: true })}</div>
                <div
                  className={
                    'fw500 ' +
                    (multyRealStart && !(Config.hideMarketMintIcon.indexOf(item.collateralSymbol) > -1) ? 'fire' : '')
                  }
                >
                  <Tooltip
                    title={
                      <div className="info-tooltip">
                        <div>
                          {intl.get('market.deposit_base_nex')} :{' '}
                          {formatNumber(depositApy, 2, { per: true, miniText: '0.01' })}%
                        </div>
                        <div>
                          {intl.get('market.sun_mining_nex')} :{' '}
                          {formatNumber(mintApy, 2, { per: true, miniText: '0.01' })}%
                        </div>
                      </div>
                    }
                    placement="bottom"
                  >
                    <span className="fw500">
                      {formatNumber(totalApy, 2, {
                        cutZero: false,
                        miniText: 0.01,
                        needDolar: false,
                        round: true,
                        per: true
                      })}
                      {'%'}
                    </span>
                  </Tooltip>
                </div>
                <div className="fw500">{amountFormat(item.borrowedUSD, 2, { miniText: 0.01, needDolar: true })}</div>
                <div className="fw500">
                  {formatNumber(BigNumber(item.borrowedAPY).times(1e2), 2, {
                    cutZero: false,
                    miniText: 0.01,
                    needDolar: false,
                    round: true,
                    per: true
                  })}
                  %
                </div>
              </div>
            </Link>
          );
        });
      return (
        <div className="market-summary-list">
          <div className="c-0F134F fs14 fw600">
            {intl.get('market.overview')}
            {/* <Tooltip title={intl.getHTML('market.introduction5')} placement="bottom">
              <span className="tooltip-icon info-icon t3"></span>
            </Tooltip> */}
          </div>
          <div className="table-alike table-header">
            <div>{intl.get('market.asset')}</div>
            <div>{intl.get('market.deposit_size')}</div>
            <div>{this.depositApyTooltipRender()}</div>
            <div>{intl.get('market.borrow_size')}</div>
            <div>{intl.get('market.borrow_apy')}</div>
          </div>
          {renderList}
        </div>
      );
    } else {
      return (
        <div className="market-summary-list">
          <div className="c-0F134F fs14 fw600">
            {intl.get('market.overview')}
            {/* <Tooltip title={intl.getHTML('market.introduction5')} placement="bottom">
              <span className="tooltip-icon info-icon"></span>
            </Tooltip> */}
          </div>
          <div className="table-alike table-header">
            <div>{intl.get('market.asset')}</div>
            <div>{intl.get('market.deposit_size')}</div>
            <div>{this.depositApyTooltipRender()}</div>
            <div>{intl.get('market.borrow_size')}</div>
            <div>{intl.get('market.borrow_apy')}</div>
          </div>
          <div className="table-alike table-row">
            <div>--</div>
            <div>--</div>
            <div>--</div>
            <div>--</div>
            <div>--</div>
          </div>
        </div>
      );
    }
  }

  getMarketData = async () => {
    try {
      const res = await getMarketDashboardData();
      if (!res.success) {
        return;
      }
      this.setState({ marketData: res.data });
    } catch (err) {
      console.log('getMarketData', err);
    }
  };

  render() {
    const { mobile } = this.state;
    const { menuFlag } = this.props.network;
    return (
      <div className={mobile ? '' : 'flex-end'}>
        <LeftMenu></LeftMenu>
        <div
          className={
            mobile
              ? 'market-container right-container mobile-right-container'
              : menuFlag
              ? 'market-container right-container'
              : 'market-container right-container max-width'
          }
        >
          <div className="common-title">{intl.get('market.data_overview')}</div>
          <div className="market-summary-blocks">
            {this.renderDeposit()}
            {this.renderLend()}
          </div>
          {this.renderMarketSummary()}
          <FooterPage></FooterPage>
        </div>
      </div>
    );
  }
}

export default Market;
