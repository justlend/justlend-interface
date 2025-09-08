import { inject, observer } from 'mobx-react';

import isMobile from 'ismobilejs';
import React from 'react';
import intl from 'react-intl-universal';
import { Tooltip } from 'antd';
import Config from '../../../config';
import { amountFormat, formatNumber } from '../../../utils/helper';
import { BorrowButton } from './BorrowButton';
import { DepositButton } from './DepositButton';
import { JTokenInfo } from './JTokenInfo';
import { MarketDetailPriceTooltip } from './MarketDetailPriceTooltip';
import { MarketTooltip } from './MarketTooltip';
const { miningSymbol, tokenUncutZeroInDetailPage } = Config;
@inject('lend')
@inject('network')
@observer
class MarketDetailPrice extends React.Component {
  render() {
    const { lang, theme } = this.props.lend;
    const { isConnected } = this.props.network;
    const isWhite = theme === 'white';
    const { jTokenData, bttLogoUrl } = this.props;
    const mobile = isMobile(window.navigator).any;
    return (
      <div className="market-d-profile flex section">
        <div className="section-content">
          <div className="price-wrap">
            <div className="flex" style={{ alignItems: 'center' }}>
              <div className="price-wrap-inner">
                <MarketDetailPriceTooltip></MarketDetailPriceTooltip>
                <div className="number-wrap">
                  <span className="main-price color-primary">
                    {jTokenData.priceUSD === '--'
                      ? '--'
                      : formatNumber(
                          jTokenData.priceUSD,
                          tokenUncutZeroInDetailPage.includes(jTokenData.collateralSymbol)
                            ? // jTokenData.collateralSymbol === miningSymbol
                              2
                            : ['BTT', 'NFT'].includes(jTokenData.collateralSymbol)
                            ? 10
                            : 6,
                          {
                            miniText: ['BTT', 'NFT'].includes(jTokenData.collateralSymbol)
                              ? '0.0000000001'
                              : '0.000001',
                            needDolar: true,
                            cutZero: !tokenUncutZeroInDetailPage.includes(jTokenData.collateralSymbol)
                            // cutZero: jTokenData.collateralSymbol !== miningSymbol
                          }
                        )}
                  </span>
                </div>
              </div>
              <JTokenInfo jTokenData={jTokenData} bttLogoUrl={bttLogoUrl}></JTokenInfo>
            </div>
          </div>
          {this.props.lend.serviceInnerStatus === 'disabled' ? (
            <div className="btn-wrap flex season">
              <Tooltip
                title={intl.getHTML('season.can_not_connect')}
                placement="bottom"
                arrowPointAtCenter
                overlayClassName={'markey-detail-tooltip market-tooltip-overlay j-tooltip-dropdown season ' + theme}
              >
                <button
                  className={'btn j-btn j-supply disabled j-not-used season ' + lang}
                  onClick={() => {
                    this.props.lend.setData({ noServiceModalAllVisible: true });
                  }}
                >
                  {intl.get('v2.deposit')}
                </button>
              </Tooltip>

              <Tooltip
                title={intl.getHTML('season.can_not_connect')}
                placement="bottom"
                arrowPointAtCenter
                overlayClassName={'markey-detail-tooltip market-tooltip-overlay j-tooltip-dropdown season ' + theme}
              >
                <button
                  className={'btn j-btn j-borrow disabled j-not-used season ' + lang}
                  onClick={() => {
                    this.props.lend.setData({ noServiceModalAllVisible: true });
                  }}
                >
                  {intl.get('v2.borrow')}
                </button>
              </Tooltip>
            </div>
          ) : (
            // jTokenData.collateralName === 'SUNOLD' ? (
            //   <div className="btn-wrap flex">
            //     <Tooltip
            //       title={intl.getHTML('v2.close_supply_tip_sunold')}
            //       placement="bottom"
            //       arrowPointAtCenter
            //       overlayClassName="markey-detail-tooltip market-tooltip-overlay j-tooltip-dropdown"
            //     >
            //       <DepositButton
            //         mobile={mobile}
            //         jTokenData={jTokenData}
            //         disabled={jTokenData?.collateralSymbol == '--'}
            //       ></DepositButton>
            //       {/* <button className={'btn j-btn j-supply disabled ' + lang}>{intl.get('v2.deposit')}</button> */}
            //     </Tooltip>
            //     <Tooltip
            //       title={intl.getHTML('v2.market_sunold_disabled_tip')}
            //       placement="bottom"
            //       arrowPointAtCenter
            //       overlayClassName="markey-detail-tooltip market-tooltip-overlay j-tooltip-dropdown"
            //     >
            //       <button className={'btn j-btn j-borrow disabled ' + lang}>{intl.get('v2.borrow')}</button>
            //     </Tooltip>
            //   </div>
            // ) :
            <div className="btn-wrap flex">
              <DepositButton
                mobile={mobile}
                jTokenData={jTokenData}
                disabled={jTokenData?.collateralSymbol == '--'}
              ></DepositButton>
              <BorrowButton
                mobile={mobile}
                jTokenData={jTokenData}
                disabled={jTokenData?.collateralSymbol == '--'}
              ></BorrowButton>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export { MarketDetailPrice };
