import React, { useEffect, useRef } from 'react';
import isMobile from 'ismobilejs';
import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';
import { formatNumber, BigNumber, getQueryObj } from '../../../../utils/helper';
import { Tooltip } from 'antd';
import Config from '../../../../config';

@inject('network')
@inject('lend')
@observer
class NotConnect extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale
    };
  }

  render() {
    const lang = getQueryObj()?.lang || window.localStorage.getItem('lang') || intl.options.currentLocale || 'en-US';

    return (
      <div className={'j-ele j-user-list_not-connect' + (lang !== 'en-US' ? '' : ' en')}>
        <div className="nc-header flex aic">
          <span className={'j-logo' + (!Config.winterThemeVisible ? ' snow-hide' : '')}></span>
        </div>
        <div className="nc-progress">
          {/* <div className="nc-line"></div> */}

          <div>
            <div className="progress-ele">
              <span className="progress-img progress1"></span>
            </div>
            <div className="progress-text progress1">{intl.get('v2.tip40')}</div>
            <div className="progress-text1 progress1">{intl.get('v2.tip41')}</div>
          </div>
          <div className="nc-line"></div>
          <div>
            <div className="progress-ele">
              <span className="progress-img progress2"></span>
            </div>
            <div className="progress-text">{intl.get('v2.tip42')}</div>
            <div className="progress-text1 progress1">{intl.get('v2.tip43')}</div>
          </div>
          <div className="nc-line"></div>
          <div>
            <div className="progress-ele">
              <span className="progress-img progress3"></span>
            </div>
            <div className="progress-text">{intl.get('v2.tip44')}</div>
            <div className="progress-text1 progress1">{intl.get('v2.tip45')}</div>
          </div>
          {/* <div>
            <div className="progress-ele">
              <span className="progress-img progress4"></span>
            </div>
            <div className="progress-text progress4">{intl.get('v2.sitting_gains')}</div>
          </div> */}
        </div>
      </div>
    );
  }
}

export default NotConnect;
