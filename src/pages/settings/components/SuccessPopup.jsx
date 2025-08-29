import React from 'react';

import classnames from 'classnames';
import intl from 'react-intl-universal';

class SuccessPopup extends React.Component {
  constructor() {
    super();
  }

  render() {
    const { isVisible } = this.props;

    return (
      <div className={classnames('success-popup', { 'visible': isVisible })}>
        <span className="success-icon"></span>
        <div className="success-msg">{intl.get('settings.risk_warning.success_popup_msg')}</div>
      </div>
    );
  }
}

export default SuccessPopup;
