import React from 'react';
import { inject, observer } from 'mobx-react';
import { Tooltip } from 'antd';
import intl from 'react-intl-universal';
import defaultIcon from '../../../assets/images/default.svg';
import { marketListSort } from '../../../utils/helper';
import { getLendIcons } from '../../../utils/constant';

@inject('lend')
@observer
class MarketSelect extends React.Component {
  constructor() {
    super();
    this.state = {
      shouldScrollIntoView: false
    };
  }

  componentDidMount() {
    // this.setState({
    //   shouldScrollIntoView: true
    // });
  }

  componentWillUnmount() {
    this.setState({
      shouldScrollIntoView: false
    });
  }

  scroll2marketItem = () => {
    const element = document.getElementsByClassName('market-d-select-item active');
    if (element && element.length) {
      element[0].scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'start' });
    }
    this.setState({
      shouldScrollIntoView: false
    });
  };

  render() {
    const { shouldScrollIntoView } = this.state;
    const { value, onChange, className } = this.props;
    const { dashboardData, theme } = this.props.lend;
    let markets = dashboardData?.markets || [];
    let result = marketListSort(markets);
    markets = result.fullMarketList;

    if (shouldScrollIntoView && markets) {
      setTimeout(() => this.scroll2marketItem(), 1000);
    }

    var bttLogoUrl = defaultIcon;
    if (markets && markets.length > 0) {
      const bttMarketResult = markets.filter(market => market.collateralSymbol === 'BTT');
      if (bttMarketResult.length > 0) {
        bttLogoUrl = bttMarketResult[0].logoUrl;
      }
    }

    return (
      <div className={`section market-d-select${className ? ' ' + className : ''}`}>
        <div className="market-d-select-inner">
          {markets.map(market => {
            return (
              <div
                onClick={() => {
                  // this.setState({
                  //   shouldScrollIntoView: true
                  // });
                  onChange(market.jtokenAddress);
                }}
                key={market.id}
                className={`market-d-select-item${
                  value === market.jtokenAddress ? ' active' : ''
                } ${market?.collateralSymbol?.toLowerCase()}`}
              >
                <img
                  src={
                    market.collateralSymbol === 'WBTT'
                      ? bttLogoUrl
                      : market.logoUrl
                      ? market.logoUrl
                      : getLendIcons(market?.collateralSymbol)
                  }
                  alt={market.collateralSymbol}
                  onError={e => {
                    e.target.onerror = null;
                    e.target.src = getLendIcons(market?.collateralSymbol);
                  }}
                />
                {market.collateralSymbol === 'ETHB' || market.collateralSymbol === 'ETH' ? (
                  <Tooltip
                    title={
                      market.collateralSymbol === 'ETHB' ? intl.get('eth.origin_eth') : intl.get('eth.origin_ethold')
                    }
                    placement="top"
                    trigger="['hover','click']"
                    arrowPointAtCenter
                    overlayClassName={'j-tooltip-dropdown no-limit ' + theme}
                  >
                    <span>{market.collateralSymbol}</span>
                  </Tooltip>
                ) : (
                  <span>{market.collateralSymbol}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}

export { MarketSelect };
