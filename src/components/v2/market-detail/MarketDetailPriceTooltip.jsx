import React from 'react';
import intl from 'react-intl-universal';
import { MarketTooltip } from './MarketTooltip';
import { TooltipText } from '../strx/TooltipText';
import { isMobile } from '../../../utils/helper';

class MarketDetailPriceTooltip extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mobile: isMobile().any
    };
  }

  render() {
    const { mobile } = this.state;

    return (
      <>
        {mobile ? (
          <span className="price-tooltip">
            <TooltipText
              title={intl.get('v2.price_tooltip')}
              placement="topLeft"
              trigger={['click']}
              overlayClassName="j-tooltip-dropdown"
            >
              <span className="fs12 price-tooltip-text color-light">{intl.get('v2.market_detail_price_text')}</span>
            </TooltipText>
          </span>
        ) : (
          <span className="price-tooltip">
            <span className="fs12 price-tooltip-text color-light">{intl.get('v2.market_detail_price_text')}</span>
            <MarketTooltip
              title={intl.get('v2.price_tooltip')}
              arrowPointAtCenter
              placement="bottomLeft"
              overlayInnerStyle={{ width: 341 }}
            ></MarketTooltip>
          </span>
        )}
      </>
    );
  }
}

export { MarketDetailPriceTooltip };
