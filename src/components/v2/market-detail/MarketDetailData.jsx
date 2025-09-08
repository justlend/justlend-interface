import { inject, observer } from 'mobx-react';
import React from 'react';
import intl from 'react-intl-universal';
import { Config } from '../../../config';
import { BigNumber, tooltip, isMobile, formatNumber } from '../../../utils/helper';
import { MarketTooltip } from './MarketTooltip';
import { TooltipText } from '../strx/TooltipText';
import { LinkButton } from '../../Common/LinkButton';
import { checkIfShouldShowMintApyDetail } from './utils';
const { miningSymbol } = Config;
@inject('lend')
@observer
class MarketDetailData extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mobile: isMobile().any
    };
  }

  render() {
    const { mobile } = this.state;
    const { jTokenData } = this.props;
    const { lang, openMint } = this.props.lend;
    const collateralSymbol = jTokenData.collateralSymbol;
    const shouldShowMintApyDetail =
      checkIfShouldShowMintApyDetail(true, collateralSymbol, jTokenData.depositMiningAPYDisplay) && openMint;
    const announcementUrl = Config.usddV2MiningAnnoucement;
    // lang && lang.includes('en')
    //   ? 'https://justlendorg.zendesk.com/hc/en-us/sections/900001080386-Announcements'
    //   : 'https://justlendorg.zendesk.com/hc/zh-cn/sections/900001080386-%E5%85%AC%E5%91%8A';

    return (
      <div className="market-d-main-data ml-base">
        {shouldShowMintApyDetail ? (
          <div className="section">
            <div className="title-wrap">
              <span className="title color-primary">{intl.get('v2.market_detail_mining_rewards')}</span>
              <i className="fire-icon" style={{ marginLeft: 6, height: 13.82, width: 11, marginTop: -1 }}></i>
            </div>
            <div className="section-content">
              <div className="item mint-reward-item">
                <div className="label color-light">{intl.get('v2.market_detail_mint_tip', { miningSymbol })}</div>
                <div className="value color-primary">
                  <LinkButton
                    href={announcementUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mint-info-link"
                  >
                    {intl.get('v2.detail')}
                  </LinkButton>
                </div>
              </div>
              <div className="item">
                <div className="label color-light">{intl.get('v2.daily_rewards')}</div>
                <div className="value reward strong">{jTokenData.farmRewardUSD24hDisplay}</div>
              </div>
            </div>
          </div>
        ) : null}
        <div className={`section${shouldShowMintApyDetail ? ' mt-base' : ''}`}>
          <div className="title-wrap">
            <span className="title color-primary">{intl.get('v2.market_info')}</span>
          </div>
          <div className="section-content">
            <div className="item mt-base">
              <div className="label color-light">{intl.get('market.deposit_apy')}</div>
              <div className="value deposit strong">
                {shouldShowMintApyDetail && <i className="fire-icon icon"></i>}
                {Config.holdingTokens.includes(collateralSymbol) && <i className="compounded-reward-icon icon"></i>}
                {Config.holdingTokens.includes(collateralSymbol)
                  ? jTokenData.depositTotalAPYDisplay
                  : shouldShowMintApyDetail
                  ? jTokenData.depositAPYDisplay
                  : jTokenData.depositBaseAPYDisplay}
              </div>
            </div>
            {shouldShowMintApyDetail && !Config.holdingTokens.includes(collateralSymbol) ? (
              <div className="mint-apy-info">
                <div className="item">
                  <div className="label color-light">{`- ${intl.get('risk_tip.basic_apy1')}`}</div>
                  <div className="value color-primary">{jTokenData.depositBaseAPYDisplay}</div>
                </div>
                <div className="item">
                  <div className="label color-light">{`- ${intl.get('risk_tip.mining_apy2', { miningSymbol })}`}</div>
                  <div className="value color-primary">{jTokenData.depositMiningAPYDisplay}</div>
                </div>
              </div>
            ) : null}
            {Config.holdingTokens.includes(collateralSymbol) ? (
              <div className="wstusdt-apy-info">
                <div className="item">
                  <div className="label color-light">{`- ${intl.get('risk_tip.strx_apy1')}`}</div>
                  <div className="value color-primary">{jTokenData.depositBaseAPYDisplay}</div>
                </div>
                <div className="item">
                  <div className="label color-light">{`- ${intl.get(
                    collateralSymbol === 'sTRX' ? 'risk_tip.strx_apy3' : 'risk_tip.wstUSDT_apy1'
                  )}`}</div>
                  <div className="value color-primary">
                    {formatNumber(BigNumber(jTokenData.underlyingIncrementApy).times(100), 2, {
                      per: true,
                      miniText: '0.01'
                    }) + '%'}
                  </div>
                </div>
                {shouldShowMintApyDetail && (
                  <div className="item">
                    <div className="label color-light">{`- ${intl.get('wst.wst_apy_wstusdt_mining_apy')}`}</div>
                    <div className="value color-primary">{jTokenData.depositMiningAPYDisplay}</div>
                  </div>
                )}
              </div>
            ) : null}
            <div className="item mt-base">
              <div className="label color-light">{intl.get('market.borrow_apy')}</div>
              <div className="value borrow strong">{jTokenData.borrowAPyDisplay}</div>
            </div>
            <div className="divider-h mobile-only"></div>
            <div className="item mt-base">
              <div className="label color-light">{intl.get('market.deposit_size')}</div>
              <div className="value color-primary">{jTokenData.depositSizeDisplay}</div>
            </div>
            <div className="item">
              <div className="label color-light">{intl.get('market.detail_number_of_deposit_accounts')}</div>
              <div className="value color-primary">{jTokenData.depositCountDisplay}</div>
            </div>
            <div className="item">
              <div className="label color-light">{intl.get('market.borrow_overview')}</div>
              <div className="value color-primary">{jTokenData.borrowSizeDisplay}</div>
            </div>
            <div className="item">
              <div className="label color-light">{intl.get('market.detail_number_of_borrow_accounts')}</div>
              <div className="value color-primary">{jTokenData.borrowCountDisplay}</div>
            </div>
            <div className="item">
              <div className="label color-light">{intl.get('market.detail_dailyinterest')}</div>
              <div className="value color-primary">{jTokenData.dailyinterestDisplay}</div>
            </div>
            <div className="item">
              {mobile ? (
                <TooltipText
                  title={tooltip(intl.get('v2.tip8'), [
                    {
                      title: intl.get('v2.tip9')
                    },
                    { title: intl.get('v2.tip10') }
                  ])}
                  placement="topRight"
                  trigger={['click']}
                  overlayClassName="j-tooltip-dropdown"
                >
                  <div className="label color-light flex">{intl.get('v2.liquidity')}</div>
                </TooltipText>
              ) : (
                <div className="label color-light flex">
                  {intl.get('v2.liquidity')}
                  <MarketTooltip
                    overlayInnerStyle={{ width: 330 }}
                    placement="bottomRight"
                    title={tooltip(intl.get('v2.tip8'), [
                      {
                        title: intl.get('v2.tip9')
                      },
                      { title: intl.get('v2.tip10') }
                    ])}
                    arrowPointAtCenter
                    trigger={['click', 'hover']}
                    overlayClassName="j-tooltip-dropdown"
                  ></MarketTooltip>
                </div>
              )}
              <div className="value color-primary">{jTokenData.liquidityDisplay}</div>
            </div>
          </div>
        </div>
        <div
          className="section mt-base market-parameter-section"
          style={{ height: shouldShowMintApyDetail ? 376 : 'auto' }}
        >
          <div className="title-wrap">
            <span className="title color-primary">{intl.get('v2.market_parameters')}</span>
          </div>
          {}

          <div className="section-content">
            <div className="item mt-base">
              {mobile ? (
                <TooltipText
                  title={intl.get('v2.market_detail_collateral_tip')}
                  placement="topRight"
                  trigger={['click']}
                  overlayClassName="j-tooltip-dropdown"
                >
                  <div className="label color-light">{intl.get('market.detail_collateral')}</div>
                </TooltipText>
              ) : (
                <div className="label color-light">
                  {intl.get('market.detail_collateral')}
                  <MarketTooltip
                    title={intl.get('v2.market_detail_collateral_tip')}
                    arrowPointAtCenter
                    overlayInnerStyle={{ width: 330 }}
                    placement="bottomRight"
                  ></MarketTooltip>
                </div>
              )}
              <div className="value color-primary">{jTokenData.collateralDisplay}</div>
            </div>
            {}
            <div className="item">
              <div className="label color-light">{intl.get('market.detail_reserves')}</div>
              <div className="value color-primary">{jTokenData.totalReservesDisplay}</div>
            </div>
            {}
            <div className="item">
              <div className="label color-light">{intl.get('market.detail_factor')}</div>
              <div className="value color-primary">{jTokenData.reserveFactorDisplay}</div>
            </div>
            <div className="item">
              <div className="label color-light">{intl.get('v2.detail_limitmax')}</div>
              <div className="value color-primary">{jTokenData.borrowLimitDisplay}</div>
            </div>
            <div className="item">
              <div className="label color-light">
                {intl.getHTML('market.detail_jminted', { value: 'j' + collateralSymbol })}
              </div>
              <div className="value color-primary">{jTokenData.supplyDisplay}</div>
            </div>
            <div className="item">
              <div className="label color-light">
                {intl.getHTML('market.detail_jexchangerate', { value: 'j' + collateralSymbol })}
              </div>
              <div className="value color-primary">{jTokenData.exchangeRateDisplay}</div>
            </div>
          </div>
        </div>
        {/* <div className={`empty-bg ${true ? 'show' : 'hide'}`}></div> */}
      </div>
    );
  }
}

export { MarketDetailData };
