import { inject, observer } from 'mobx-react';
import isMobile from 'ismobilejs';
import React from 'react';
import intl from 'react-intl-universal';
import { Tooltip } from 'antd';
import Config from '../../../config';

@inject('network')
@inject('lend')
@observer
class DepositButton extends React.Component {
  clickDeposit = () => {
    const jTokenData = this.props.jTokenData || {};
    const dataList = this.props.lend.marketList || this.props.lend.userList;
    const item = dataList[jTokenData.jtokenAddress] ? dataList[jTokenData.jtokenAddress] : {};
    const { isConnected } = this.props.network;
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

    this.showDAW(item, '1');
  };

  showDAW = (popData, activeKey) => {
    this.props.lend.setData({
      DAWPop: {
        show: true,
        activeKey,
        popData: popData
      }
    });
  };
  render() {
    const { lang, noService, riojBalance, theme } = this.props.lend;
    const { isConnected } = this.props.network;
    let isM = isMobile(window.navigator).any;
    const collateralSymbol = this.props.jTokenData?.collateralSymbol;

    const jTokenData = this.props.jTokenData || {};
    const dataList = this.props.lend.marketList || this.props.lend.userList;
    const item = dataList[jTokenData.jtokenAddress] ? dataList[jTokenData.jtokenAddress] : {};

    return (
      <>
        {/* {noService && (!riojBalance || !isConnected) && this.props.jTokenData.collateralSymbol === 'wstUSDT' ? ( */}
        {this.props.lend.serviceInnerStatus === 'disabled' ? (
          <Tooltip
            title={intl.getHTML('season.can_not_connect')}
            placement={this.props.placement || 'bottom'}
            arrowPointAtCenter
            trigger={['hover', 'click']}
            overlayClassName={'j-tooltip-dropdown season ' + theme}
          >
            <button
              className="btn j-btn j-supply j-not-used disabled season"
              onClick={() => {
                this.props.lend.setData({ noServiceModalAllVisible: true });
              }}
            >
              {intl.get('v2.deposit')}
            </button>
          </Tooltip>
        ) : !!item.mintPaused ? (
          <Tooltip
            title={() => (
              <>
                {/* {intl.get('v2.close_supply_tip_' + item?.collateralSymbol?.toLocaleLowerCase(), {
                  token: item?.collateralSymbol?.toLocaleUpperCase()
                })} */}
                <>
                  {Config.closeTokens.includes(item?.collateralSymbol)
                    ? intl.get('v2.close_supply_tip_' + item?.collateralSymbol?.toLocaleLowerCase(), {
                        token: item?.collateralSymbol?.toLocaleUpperCase()
                      })
                    : intl.getHTML('s7.supply_temporarily_disabled', { value: item.collateralSymbol })}
                  <span>{intl.get('s6.deposit_hover1')}</span>
                  <span
                    className="can-click c-9195fb hover"
                    onClick={() => {
                      if (this.props.network.routeName === 'home') {
                        let toTop = isM ? 780 : 0;
                        window.scrollTo(0, toTop);
                        document.body.scrollTop = toTop;
                        document.documentElement.scrollTop = toTop;
                        this.props.lend.setData({ activeKey: 'supply' });
                      } else {
                        window.location.href = window.location.origin + `/homeNew?lang=${lang}&activeKey=supply`;
                      }
                    }}
                  >
                    {intl.get('s6.deposit_hover2')}
                  </span>
                  <span>{intl.get('s6.deposit_hover3')}</span>
                  <span
                    className="can-click c-9195fb hover"
                    onClick={() => {
                      this.showDAW(item, '2');
                    }}
                  >
                    {intl.get('s6.deposit_hover4')}
                  </span>
                  <span>{intl.get('s6.deposit_hover5')}</span>
                </>
              </>
            )}
            placement={this.props.placement || 'bottom'}
            arrowPointAtCenter
            overlayClassName={
              'j-tooltip-dropdown' +
              (this.props.lend?.DAWPop?.show && ['BUSD', 'ETH'].includes(item?.collateralSymbol) && isM
                ? ' j-tooltip-dropdown-disabled'
                : '')
            }
          >
            <button
              onClick={e => {
                e.stopPropagation();
              }}
              className={'btn j-btn j-supply disabled ' + lang}
            >
              {intl.get('v2.deposit')}
            </button>
          </Tooltip>
        ) : collateralSymbol === 'SUNOLD' ? (
          <Tooltip
            title={intl.get('risk_tip.sunold_deposit')}
            placement="top"
            arrowPointAtCenter
            overlayClassName="j-tooltip-dropdown"
          >
            <button
              className={'btn j-btn j-supply ' + lang}
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                window.gtag('event', 'click', {
                  'event_category': 'PC_V1.5',
                  'event_label': 'market-detail-new-deposit'
                });
                this.clickDeposit();
              }}
            >
              {intl.get('v2.deposit')}
            </button>
          </Tooltip>
        ) : (
          <button
            className={'btn j-btn j-supply ' + lang}
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              window.gtag('event', 'click', {
                'event_category': 'PC_V1.5',
                'event_label': 'market-detail-new-deposit'
              });
              this.clickDeposit();
            }}
          >
            {intl.get('v2.deposit')}
          </button>
        )}
      </>
    );
  }
}
export { DepositButton };
