import React from 'react';
import { Tooltip } from 'antd';
import { omit } from 'lodash';
import { inject, observer } from 'mobx-react';

@inject('lend')
@observer
class MarketTooltip extends React.Component {
  render() {
    const { props, overlayClassName } = this;
    const { lang } = this.props.lend;
    return (
      <Tooltip
        {...omit(props, ['overlayInnerStyle'])}
        overlayClassName={`markey-detail-tooltip market-tooltip-overlay ${lang}${
          overlayClassName ? ` ${overlayClassName}` : ''
        }`}
        overlayInnerStyle={{
          width: 240,
          ...(props.overlayInnerStyle || {})
        }}
      >
        {props.children || <span className="question-icon icon"></span>}
      </Tooltip>
    );
  }
}

export { MarketTooltip };
