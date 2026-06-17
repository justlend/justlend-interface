import { inject, observer } from 'mobx-react';
import isMobile from 'ismobilejs';
import React from 'react';
import intl from 'react-intl-universal';
import { Tooltip } from 'antd';
import Config from '../../../config';

@inject('network')
@inject('ui')
@inject('lend')
@inject('user')
@inject('market')
@observer
class BorrowButton extends React.Component {
  clickBorrow = text => {
    const { isConnected } = this.props.network;
    const jTokenData = this.props.jTokenData || {};
    const dataList = this.props.market.marketList || this.props.user.userList;
    const item = dataList[jTokenData.jtokenAddress] ? dataList[jTokenData.jtokenAddress] : {};
    if (!isConnected) {
      return this.props.network.connectWalletV2();
    }

    if (this.props.network.isRightChain === 0) {
      this.props.network.changeChain();
      return;
    }

    if (!this.props.lend.collateralValid(item.collateralSymbol)) return;

    this.props.lend.showBorrowModal(item, '1');
  };
  render() {
    const { lang, theme } = this.props.lend;
    const { isUSDJDisabled, isUSDDOLDDisabled } = this.props.market;
    const { isConnected } = this.props.network;
    let isM = isMobile(window.navigator).any;

    return (
      <>
        {this.props.lend.serviceInnerStatus === 'disabled' ? (
          <Tooltip
            title={intl.getHTML('season.can_not_connect')}
            placement={this.props.placement || 'bottom'}
            arrowPointAtCenter
            trigger={['click']}
            overlayClassName={'j-tooltip-dropdown season ' + theme}
          >
            <button
              className="btn j-btn j-borrow j-not-used disabled j-not-used-ml-20 season"
              onClick={() => {
                this.props.lend.setNoServiceModalAllVisible(true);
              }}
            >
              {intl.get('v2.borrow')}
            </button>
          </Tooltip>
        ) : !!this.props.jTokenData?.borrowPaused ? (
          <Tooltip
            title={() => (
              <>
                {this.props.jTokenData?.collateralSymbol === 'SUNOLD'
                  ? intl.getHTML('risk_tip.sunold_borrow')
                  : intl.getHTML('s7.borrow_temporarily_disabled', {
                      value: this.props.jTokenData?.collateralSymbol
                    })}{' '}
                <span>{intl.get('s6.borrow_hover1')}</span>
                <span
                  className="can-click c-9195fb hover"
                  onClick={() => {
                    if (!isConnected) {
                      this.props.network.connectWalletV2();
                    } else if (this.props.network.routeName === 'home') {
                      let toTop = isM ? 780 : 0;
                      window.scrollTo(0, toTop);
                      document.body.scrollTop = toTop;
                      document.documentElement.scrollTop = toTop;
                      this.props.lend.setActiveKey('borrow');
                    } else {
                      if (isM) {
                        window.location.href =
                          window.location.origin + `/homeNew?lang=${lang}&activeKey=borrow#scrollToMobileTab`;
                      } else {
                        window.location.href = window.location.origin + `/homeNew?lang=${lang}&activeKey=borrow`;
                      }
                    }
                  }}
                >
                  {intl.get('s6.borrow_hover2')}
                </span>
                <span>{intl.get('s6.borrow_hover3')}</span>
                <span
                  className="can-click c-9195fb hover"
                  onClick={() => {
                    if (!isConnected) {
                      this.props.network.connectWalletV2();
                    } else {
                      this.props.lend.showBorrowModal(this.props.jTokenData, '2');
                    }
                  }}
                >
                  {intl.get('s6.borrow_hover4')}
                </span>
                <span>{intl.get('s6.borrow_hover5')}</span>
              </>
            )}
            placement={this.props.placement || 'bottom'}
            arrowPointAtCenter
            trigger={['hover', 'click']}
            overlayClassName={
              'j-tooltip-dropdown j-market-tooltip-dropdown light ' +
              ((isUSDJDisabled && this.props.jTokenData?.collateralSymbol === 'USDJ') ||
              (isUSDDOLDDisabled && this.props.jTokenData?.collateralSymbol === 'USDDOLD') ||
              this.props.jTokenData?.collateralSymbol === 'SUNOLD'
                ? 'mobile-r-30'
                : '')
            }
            getPopupContainer={triggerNode => triggerNode.parentNode}
          >
            <button
              onClick={e => {
                e.stopPropagation();
              }}
              className={'btn j-btn j-borrow disabled ' + lang}
            >
              {intl.get('v2.borrow')}
            </button>
          </Tooltip>
        ) : (
          <button
            className={'btn j-btn j-borrow ' + lang}
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              window.gtag('event', 'market-detail-new-borrow', { 'event_category': 'PC_V1.5', 'event_label': 'market-detail-new-borrow' });
              this.clickBorrow();
            }}
            disabled={this.props.disabled}
          >
            {intl.get('v2.borrow')}
          </button>
        )}
      </>
    );
  }
}

export { BorrowButton };
