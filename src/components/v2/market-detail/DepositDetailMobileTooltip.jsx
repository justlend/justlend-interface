import React from 'react';
import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';
import { checkIfShouldShowMintApyDetail } from './utils';
import { Config } from '../../../config';

@inject('lend')
@observer
class DepositDetailMobileTooltip extends React.Component {
  render() {
    const { dataList, getTooltipData, collateralSymbol } = this.props;
    const { lang, depositDetailGraphIndex, openMint } = this.props.lend;

    const dataIndex = dataList.length - 1;
    var params = [{ dataIndex }, { dataIndex }];

    if (dataList && dataList.length > 0 && depositDetailGraphIndex > 0) {
      const data = dataList[depositDetailGraphIndex];
      params = [
        {
          axisValue: data.date,
          value: data.depositedAPY,
          dataIndex: depositDetailGraphIndex
        },
        {
          axisValue: data.date,
          value: data.depositedUSD,
          dataIndex: depositDetailGraphIndex
        }
      ];
    }

    const {
      dateText,
      depositedAPY,
      wstUSDTDepositApyWithIncrement,
      depositedUSD,
      totalAPY,
      farmApy,
      underlyingIncrementApy
    } = getTooltipData({
      params,
      lang,
      dataList,
      collateralSymbol
    });

    const shouldShowMintApyDetail = checkIfShouldShowMintApyDetail(true, collateralSymbol, farmApy);

    return (
      <div className="chart-tooltip chart-tooltip-fake interest-rate">
        <main>
          <div className="item">
            <span className="label color-light">{intl.get('market.detail_date')}</span>
            <div className="value-wrap">
              <span className="value color-primary fs12">{dateText}</span>
            </div>
          </div>
          <div className="item">
            <span className={`label color-light ${lang}`}>
              <span className="fs12">{intl.get('lend.depositapy')}&nbsp;</span>

              {shouldShowMintApyDetail && collateralSymbol !== 'wstUSDT' && (
                <span className="mint-text fs12">
                  ({intl.get('v2.market_detail_base_apy')}
                  <span className="fs12"> + {intl.get('v2.market_detail_mint_apy')}</span>)
                </span>
              )}
            </span>
            <div className="value-wrap">
              {shouldShowMintApyDetail &&
                (Config.holdingTokens.includes(collateralSymbol) ? (
                  <span className="fire-icon extra-space"></span>
                ) : (
                  <span className="fire-icon"></span>
                ))}
              {Config.holdingTokens.includes(collateralSymbol) && <span className="compounded-reward-icon"></span>}
              <span className="value deposit color-primary fs12">
                {shouldShowMintApyDetail
                  ? totalAPY
                  : Config.holdingTokens.includes(collateralSymbol)
                  ? wstUSDTDepositApyWithIncrement
                  : depositedAPY}
                %
              </span>
            </div>
          </div>

          {shouldShowMintApyDetail && !Config.holdingTokens.includes(collateralSymbol) && (
            <div className="item mint-apy-item">
              <span className="label fs12 color-light"></span>
              <div className="value-wrap">
                <span className="detail color-primary fs12">
                  ({depositedAPY}% + {farmApy}%)
                </span>
              </div>
            </div>
          )}

          {Config.holdingTokens.includes(collateralSymbol) && (
            <div className="wstusdt-apy-detail">
              <div className="item">
                <span className="label color-light">{intl.get('risk_tip.strx_apy1')}</span>
                <div className="value-wrap">
                  <span className="value fs12 color-primary">{depositedAPY + '%'}</span>
                </div>
              </div>
              <div className="item">
                <span className="label color-light">
                  {intl.get(collateralSymbol === 'sTRX' ? 'risk_tip.strx_apy3' : 'risk_tip.wstUSDT_apy1')}
                </span>
                <div className="value-wrap">
                  <span className="value fs12 color-primary">{underlyingIncrementApy + '%'}</span>
                </div>
              </div>
              {shouldShowMintApyDetail && (
                <div className="item">
                  <span className="label color-light">{intl.get('v2.market_detail_mint_apy')}</span>
                  <div className="value-wrap">
                    <span className="value fs12 color-primary">{farmApy}%</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="item">
            <span className="label color-light">{intl.get('market.deposit_size')}</span>
            <div className="value-wrap">
              <span className="value color-primary fs12">{depositedUSD}</span>
            </div>
          </div>
        </main>
      </div>
    );
  }
}

export { DepositDetailMobileTooltip };
