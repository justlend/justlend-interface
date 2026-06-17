import { inject, observer } from 'mobx-react';
import React from 'react';
import intl from 'react-intl-universal';
import { Tooltip } from 'antd';
import Config from '../../../config';
import { addToTronlink, getJTokenLogo, getLiquidJTokenLogo, isMobile } from '../../../utils/helper';
import { MarketTooltip } from './MarketTooltip';
import defaultIcon from '../../../assets/images/default.svg';
import { getLendIcons } from '../../../utils/constant';

@inject('network')
@inject('lend')
@observer
class JTokenInfo extends React.Component {
  constructor() {
    super();
    this.state = {
      mobile: isMobile().any
    };
  }
  addToTronlink = async address => {
    const { isConnected } = this.props.network;
    if (!isConnected) {
      return this.props.network.connectWalletV2();
    }

    addToTronlink(address);
  };

  render() {
    const { mobile } = this.state;
    const { jTokenData, lend, bttLogoUrl } = this.props;
    const { theme } = lend;
    const isWhite = theme === 'white';
    const lang = window.localStorage.getItem('lang') || 'en-US';
    const notTrx = jTokenData?.collateralSymbol?.toLocaleLowerCase() !== 'trx';
    const tronScanUrl = notTrx
      ? `${lang === 'en-US' ? Config.tronscanUrlEN : Config.tronscanUrlCN}/address/${
          jTokenData?.collateralSymbol !== '--' ? jTokenData?.collateralAddress : ''
        }`
      : `${Config.tronscanUrlEN}/token/0/transfers`;

    return (
      <div className="j-token-info flex">
        {mobile ? (
          <div className="flex-between">
            <div className="token-wrap">
              <img
                className={`token-img ${jTokenData?.collateralSymbol?.toLowerCase()}`}
                src={
                  jTokenData.collateralSymbol === 'WBTT' && !isWhite
                    ? bttLogoUrl
                    : jTokenData.logoUrl
                    ? jTokenData.logoUrl
                    : getLendIcons(jTokenData.collateralSymbol)
                }
                alt=""
                onError={e => {
                  e.target.onerror = null;
                  e.target.src = getLendIcons(jTokenData.collateralSymbol);
                }}
              />
              <span className="token-text color-primary">{jTokenData.collateralSymbol || '--'}</span>
            </div>
            <a
              className={`market-detail-tokenop-item typo-text-link primary-light`}
              href={tronScanUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className={`to-tronscan-icon ml-6 ${isWhite ? 'white' : 'black'}`}></span>
            </a>
          </div>
        ) : (
          <div className="flex-between">
            <MarketTooltip
              title={
                <div className="market-detail-tokenop-tooltip">
                  <div
                    className={`market-detail-tokenop-item${!notTrx ? ' disabled' : ''}`}
                    onClick={() => notTrx && this.addToTronlink(jTokenData.collateralAddress)}
                    style={{ cursor: notTrx ? 'pointer' : 'not-allowed' }}
                  >
                    <span className="addtoTronLink"></span>
                    <span className="text fs12 color-light hover-light">{intl.get('add_to_tronlink')}</span>
                  </div>
                  <a
                    className={`market-detail-tokenop-item typo-text-link primary-light`}
                    href={tronScanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className={`toTronscan ${isWhite ? 'white' : 'black'}`}></span>
                    <span className="text fs12 color-light hover-light">{intl.get('view_in_explorer')}</span>
                  </a>
                </div>
              }
              placement="bottom"
              overlayInnerStyle={{ width: 'unset' }}
            >
              <div className="token-wrap">
                <img
                  className={`token-img ${jTokenData?.collateralSymbol?.toLowerCase()}`}
                  src={
                    jTokenData.collateralSymbol === 'WBTT' && !isWhite
                      ? bttLogoUrl
                      : jTokenData.logoUrl
                      ? jTokenData.logoUrl
                      : getLendIcons(jTokenData.collateralSymbol)
                  }
                  alt=""
                  onError={e => {
                    e.target.onerror = null;
                    e.target.src = getLendIcons(jTokenData.collateralSymbol);
                  }}
                />
                <span className="token-text color-primary">{jTokenData.collateralSymbol || '--'}</span>
              </div>
            </MarketTooltip>
          </div>
        )}
        <div className="divider"></div>

        {mobile ? (
          <div className="flex-between aic">
            <div className="token-wrap">
              <img className="token-img" src={getLiquidJTokenLogo('j' + jTokenData.collateralSymbol)} alt="logo" />
              <span className="token-text color-primary">j{jTokenData.collateralSymbol || '--'}</span>
            </div>
            <a
              className="market-detail-tokenop-item typo-text-link color-light fs12"
              href={`${lang === 'en-US' ? Config.tronscanUrlEN : Config.tronscanUrlCN}/address/${
                jTokenData.jtokenAddress
              }`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className={`to-tronscan-icon ml-6 ${isWhite ? 'white' : 'black'}`}></span>
            </a>
          </div>
        ) : (
          <div className="flex-between aic">
            <MarketTooltip
              title={
                <div className="market-detail-tokenop-tooltip">
                  <div
                    className="market-detail-tokenop-item"
                    onClick={() => this.addToTronlink(jTokenData.jtokenAddress)}
                  >
                    <span className="addtoTronLink"></span>
                    <span className="text fs12 color-light over-light">{intl.get('add_to_tronlink')}</span>
                  </div>
                  <a
                    className="market-detail-tokenop-item typo-text-link color-light fs12"
                    href={`${lang === 'en-US' ? Config.tronscanUrlEN : Config.tronscanUrlCN}/address/${
                      jTokenData.jtokenAddress
                    }`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className={`toTronscan ${isWhite ? 'white' : 'black'}`}></span>
                    <span className="text fs12 color-light hover-light">{intl.get('view_in_explorer')}</span>
                  </a>
                </div>
              }
              placement="bottom"
              overlayInnerStyle={{ width: 'unset' }}
            >
              <div className="token-wrap">
                <img className="token-img" src={getLiquidJTokenLogo('j' + jTokenData.collateralSymbol)} alt="logo" />
                <span className="token-text color-primary">j{jTokenData.collateralSymbol || '--'}</span>
              </div>
            </MarketTooltip>
            {jTokenData?.collateralSymbol !== '--' && (
              <Tooltip
                overlayClassName="j-tooltip-dropdown"
                placement="bottom"
                arrowPointAtCenter
                title={intl.getHTML('v2.tip39', { token: jTokenData.collateralSymbol })}
                trigger="['hover','click']"
              >
                <span className="j-tooltip-icon ml-6"></span>
              </Tooltip>
            )}
          </div>
        )}
      </div>
    );
  }
}

export { JTokenInfo };
