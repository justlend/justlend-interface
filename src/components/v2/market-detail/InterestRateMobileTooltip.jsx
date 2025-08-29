import React from 'react';
import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';
import { Config } from '../../../config';
import { BigNumber, formatNumber } from '../../../utils/helper';
import { tryFormatNumber } from './utils';

@inject('lend')
@observer
class InterestRateMobileTooltip extends React.Component {
  render() {
    const { jTokenData, showMintApy } = this.props;
    const { interestRateGraphIndex } = this.props.lend;
    const { borrowList, supplyList, mintApy, mintApyWithUSDD, collateralSymbol, current } = jTokenData;

    var params;
    let useRateDisplay, wstDepositBaseApyDisplay, wstApyDisplay;
    let baseDeposit = '--';
    let mint = Config.usddMint.includes(jTokenData.jtokenAddress) ? mintApyWithUSDD : mintApy;

    if (!showMintApy) {
      mint = 0;
    }

    let depositApyDisplay;

    if (borrowList && borrowList.length > 0 && supplyList && supplyList.length > 0 && interestRateGraphIndex >= 0) {
      const useRate = BigNumber(
        interestRateGraphIndex > jTokenData?.current.base
          ? jTokenData?.model[interestRateGraphIndex + 1].base
          : jTokenData?.model[interestRateGraphIndex + 1].base
      ).times(100);
      useRateDisplay = `${Number(tryFormatNumber(BigNumber(useRate).gt(100) ? 100 : useRate, 2))}%`;

      params = [
        {
          dataIndex: interestRateGraphIndex,
          value:
            interestRateGraphIndex > jTokenData?.current.base
              ? borrowList[interestRateGraphIndex]
              : borrowList[interestRateGraphIndex + 1]
        },
        {
          dataIndex: interestRateGraphIndex,
          value:
            interestRateGraphIndex > jTokenData?.current.base
              ? supplyList[interestRateGraphIndex]
              : supplyList[interestRateGraphIndex + 1]
        }
      ];

      wstDepositBaseApyDisplay = `${tryFormatNumber(
        BigNumber(jTokenData?.model[interestRateGraphIndex + 1].supply).times(100),
        2,
        {
          miniText: 0.01,
          per: true
        }
      )}%`;
      wstApyDisplay = `${tryFormatNumber(BigNumber(jTokenData?.underlyingIncrementApy).times(100), 2, {
        miniText: 0.01,
        per: true
      })}%`;

      baseDeposit = tryFormatNumber(BigNumber(params[1].value).minus(BigNumber(mint)._toFixed(2, 1)), 2);

      if (Config.holdingTokens.includes(collateralSymbol)) {
        let resultApy = BigNumber(BigNumber(jTokenData?.model[interestRateGraphIndex + 1].supply).plus(1))
          .times(BigNumber(jTokenData?.underlyingIncrementApy).plus(1))
          .minus(1);
        depositApyDisplay = `${tryFormatNumber(BigNumber(resultApy).times(100), 2, {
          miniText: 0.01,
          per: true
        })}%`;
      }
    } else {
      const useRate = BigNumber(jTokenData?.current?.base || 0);
      useRateDisplay = `${Number(tryFormatNumber(BigNumber(useRate).gt(100) ? 100 : useRate, 2))}%`;

      params = [
        { value: tryFormatNumber(jTokenData?.current?.borrow, 2, { miniText: 0.01, per: true }) || '--' },
        {
          value:
            tryFormatNumber(
              BigNumber(
                Config.holdingTokens.includes(collateralSymbol)
                  ? jTokenData?.current?.baseApyWithIncrement
                  : jTokenData?.current?.supply
              ).plus(BigNumber(mint)._toFixed(2, 1)),
              2,
              {
                miniText: 0.01,
                per: true
              }
            ) || '--'
        }
      ];

      wstDepositBaseApyDisplay = `${tryFormatNumber(jTokenData?.current.supply, 2, { miniText: 0.01, per: true })}%`;
      wstApyDisplay = `${tryFormatNumber(BigNumber(jTokenData?.underlyingIncrementApy).times(100), 2, {
        miniText: 0.01,
        per: true
      })}%`;

      baseDeposit = tryFormatNumber(jTokenData?.current?.supply, 2, { miniText: 0.01, per: true });
    }

    return (
      <div className="chart-tooltip chart-tooltip-fake interest-rate">
        <header className="chart-tooltip-header">
          <span className="color-light">{intl.get('use_rate')}</span>
          <span className="color-primary">{useRateDisplay}</span>
        </header>
        <main>
          <div className="item">
            <span className="label color-light">
              {intl.get('lend.depositapy')}&nbsp;
              {showMintApy && !Config.holdingTokens.includes(collateralSymbol) && (
                <span className="fs12">
                  {' '}
                  {'('}
                  {intl.get('v2.market_detail_base_apy')} + {intl.get('v2.market_detail_mint_apy')}
                  {')'}{' '}
                </span>
              )}
            </span>
            <div className="value-wrap">
              {showMintApy &&
                (Config.holdingTokens.includes(collateralSymbol) ? (
                  <span className="fire-icon extra-space"></span>
                ) : (
                  <span className="fire-icon"></span>
                ))}
              {Config.holdingTokens.includes(collateralSymbol) && <span className="compounded-reward-icon"></span>}
              <span className="value deposit fs12">
                {interestRateGraphIndex >= 0 && Config.holdingTokens.includes(collateralSymbol)
                  ? depositApyDisplay
                  : params[1].value + '%'}
              </span>
            </div>
          </div>

          {showMintApy && !Config.holdingTokens.includes(collateralSymbol) && (
            <div className="item mint-apy-item">
              <span className="label fs12 color-light"></span>
              <div className="value-wrap">
                <span className="detail color-primary fs12">
                  ({baseDeposit}% + {tryFormatNumber(mint, 2)}%)
                </span>
              </div>
            </div>
          )}

          {Config.holdingTokens.includes(collateralSymbol) && (
            <div className="wstusdt-apy-detail">
              <div className="item">
                <span className="label color-light">{intl.get('risk_tip.strx_apy1')}</span>
                <div className="value-wrap">
                  <span className="value fs12 color-primary">{wstDepositBaseApyDisplay}</span>
                </div>
              </div>
              <div className="item">
                <span className="label color-light">
                  {intl.get(collateralSymbol === 'sTRX' ? 'risk_tip.strx_apy3' : 'risk_tip.wstUSDT_apy1')}
                </span>
                <div className="value-wrap">
                  <span className="value fs12 color-primary">{wstApyDisplay}</span>
                </div>
              </div>
              {showMintApy && (
                <div className="item">
                  <span className="label color-light">{intl.get('v2.market_detail_mint_apy')}</span>
                  <div className="value-wrap">
                    <span className="value fs12 color-primary">{tryFormatNumber(mint, 2)}%</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="item">
            <span className="label color-light">{intl.get('market.borrow_apy')}</span>
            <div className="value-wrap">
              <span className="value borrow fs12">{params[0].value}%</span>
            </div>
          </div>
        </main>
      </div>
    );
  }
}

export { InterestRateMobileTooltip };
