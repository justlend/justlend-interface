import { inject, observer } from 'mobx-react';
import React from 'react';
import intl from 'react-intl-universal';
import { Tooltip } from 'antd';
import Config from '../../../config';

@inject('network')
@inject('lend')
@observer
class BorrowButton extends React.Component {
  clickBorrow = text => {
    const { isConnected } = this.props.network;
    const jTokenData = this.props.jTokenData || {};
    const dataList = this.props.lend.marketList || this.props.lend.userList;
    const item = dataList[jTokenData.jtokenAddress] ? dataList[jTokenData.jtokenAddress] : {};
    if (!isConnected) {
      return this.props.network.connectWalletV2();
    }

    if (this.props.network.isRightChain === 0) {
      this.props.network.changeChain();
      return;
    }

    if (this.props.network.isMainNetwork === 0) {
      this.props.network.showNetworkErrorModal();
      return;
    }

    if (!this.props.lend.collateralValid(item.collateralSymbol)) return;

    this.props.lend.showBorrowModal(item, '1');
  };
  render() {
    const { lang, noService, riojBalance, theme } = this.props.lend;
    const { isConnected } = this.props.network;

    return (
      <>
        {/* {noService && (!riojBalance || !isConnected) && this.props.jTokenData.collateralSymbol === 'wstUSDT' ? ( */}
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
                this.props.lend.setData({ noServiceModalAllVisible: true });
              }}
            >
              {intl.get('v2.borrow')}
            </button>
          </Tooltip>
        ) : !!this.props.jTokenData?.borrowPaused ? (
          <Tooltip
            title={
              this.props.jTokenData?.collateralSymbol === 'SUNOLD'
                ? intl.getHTML('risk_tip.sunold_borrow')
                : this.props.jTokenData?.collateralSymbol === 'ETH'
                ? intl.get('risk_tip.ethold_borrow')
                : intl.get('risk_tip.busd_borrow')
            }
            placement={this.props.placement || 'bottom'}
            arrowPointAtCenter
            trigger={['hover', 'click']}
            overlayClassName="j-tooltip-dropdown j-market-tooltip-dropdown"
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
              window.gtag('event', 'click', { 'event_category': 'PC_V1.5', 'event_label': 'market-detail-new-borrow' });
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
