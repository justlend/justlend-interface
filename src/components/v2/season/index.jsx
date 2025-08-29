import React from 'react';
import { inject, observer } from 'mobx-react';
import intl from 'react-intl-universal';
import { Tooltip } from 'antd';
import { Config } from '../../../config';

@inject('network')
@inject('lend')
@observer
class SeasonToolBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale
    };
  }

  render() {
    const { isConnected } = this.props.network;
    return (
      <div className="pr">
        <section
          className="season-toolbar"
          style={{ display: this.props.lend.serviceInnerStatus === 'continue' && isConnected ? 'flex' : 'none' }}
        >
          {this.props.pageName === 'home' || this.props.pageName === 'market' || this.props.pageName === 'marketDetail'
            ? this.props.lend.continueWhileDisabled && isConnected
              ? intl.get('season.top_tip2')
              : intl.get('season.top_tip1')
            : intl.get('season.top_tip1')}
        </section>
        {!!Config.winterThemeVisible && (
          <div className="snow-bar">
            <div className="snow-bar-left"></div>
            <div className="snow-bar-right"></div>
          </div>
        )}
      </div>
    );
  }
}

export default SeasonToolBar;
