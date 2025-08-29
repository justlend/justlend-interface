import React from 'react';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';
import { Tooltip } from 'antd';

@inject('lend')
@observer
class ToggleSwitch extends React.Component {
  constructor() {
    super();
    this.state = {};
  }

  onClick = e => {
    if (this.props?.disabled) return;
    e.stopPropagation();
    this.props.onClick && this.props.onClick();
  };

  render() {
    const { on = false, lang = 'en-US', disabled = false } = this.props;
    const { theme } = this.props.lend;
    const isWhite = theme === 'white';
    return this.props.lend.serviceInnerStatus === 'disabled' ? (
      <Tooltip
        title={intl.get('season.can_not_connect')}
        overlayClassName={'j-tooltip-dropdown season ' + (isWhite ? 'white' : '')}
        arrowPointAtCenter
        placement="top"
      >
        <div
          className={'new-switch season' + (on ? ' switch-on' : '') + (disabled ? ' disabled' : '')}
          onClick={e => {
            e.stopPropagation();
            this.props.lend.setData({ noServiceModalAllVisible: true });
          }}
        >
          <span className="switch-line"></span>
          <span className="switch-circle"></span>
        </div>
      </Tooltip>
    ) : (
      <div className={'new-switch' + (on ? ' switch-on' : '') + (disabled ? ' disabled' : '')} onClick={this.onClick}>
        <span className="switch-line"></span>
        <span className="switch-circle"></span>
      </div>
    );
  }
}

export default ToggleSwitch;
