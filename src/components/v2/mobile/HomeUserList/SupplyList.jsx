import React from 'react';
import isMobile from 'ismobilejs';
import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';
import { formatNumber, BigNumber, getLiquidJTokenLogo } from '../../../../utils/helper';
import { Tooltip } from 'antd';
import Config from '../../../../config';
import ToggleSwitch from '../../../Widget/ToggleSwitch';
import defaultIcon from '../../../../assets/images/default.svg';

@inject('network')
@inject('ui')
@inject('lend')
@inject('pool')
@inject('system')
@inject('market')
@inject('user')
@observer
class SupplyLists extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      mobile: isMobile(window.navigator).any
    };
  }

  clickRow = (row, e) => {
    window.gtag('event', 'H5_tab_supply_withdraw', { 'event_category': 'H5', 'event_label': 'tab_supply_withdraw' });

    if (!this.props.network.isConnected) {
      return this.props.network.connectWalletV2();
    }

    if (this.props.network.isRightChain === 0) {
      this.props.network.changeChain();
      return;
    }

    let classList = e.target.classList;
    if (classList) {
      let className = Array.prototype.slice.call(classList);
      if (className.includes('j-tooltip-m') || className.includes('new-switch') || className.includes('j-token'))
        return;
    }

    this.showDAW(row, '2');
  };

  showDAW = (popData, activeKey, cb) => {
    this.props.system.clearRejectError();
    this.props.market.setDAWPop({
      show: true,
      activeKey,
      popData: popData,
      cb
    });
  };

  onSwitchChange = (status, item) => {
    if (!this.props.network.isConnected) {
      return this.props.network.connectWalletV2();
    }

    if (this.props.network.isRightChain === 0) {
      this.props.network.changeChain();
      return;
    }

    if (!this.props.lend.collateralValid(item.collateralSymbol)) return;

    const { jtokenAddress } = item;
    this.props.system.setData({ transModalInfo: { declined: false } });

    this.props.lend.setMortgageModalInfo({ visible: true, type: status ? 2 : 1, jtokenAddress });
  };

  cardRender = () => {
    const { userDepositDataSource } = this.props.user;
    // let dataSource = userDepositDataSource?.filter(item => item.account_entered === 1);
    let dataSource = userDepositDataSource;
    const { lang = 'en-US', mobile } = this.state;
    const { usddJtoken, usddoldJtoken } = Config;

    return dataSource.map((item, index) => {
      return (
        <div
          className="j-home-supply-ele"
          onClick={e => {
            this.clickRow(item, e);
          }}
          key={item.collateralSymbol + index}
        >
          <div className="j-hse">
            <div className="j-hse-logo">
              <img
                src={getLiquidJTokenLogo('j' + item.collateralSymbol)}
                onError={e => {
                  e.target.onerror = null;
                  e.target.src = defaultIcon;
                }}
                alt=""
              />
              {mobile ? (
                <Tooltip
                  overlayClassName="j-tooltip-dropdown"
                  title={
                    BigNumber(item.collateralFactor).eq(0) || (item.mintPaused && item.borrowPaused)
                      ? item.collateralSymbol === 'USDDOLD'
                        ? item.account_entered === 1
                          ? intl.get('s11.market_closed_tips4')
                          : intl.get('s11.market_closed_tips3')
                        : item.account_entered === 1
                        ? intl.get('s11.market_closed_tips2')
                        : intl.get('s11.market_closed_tips1')
                      : item.account_entered === 1
                      ? intl.get('s6.collateral_open_hover')
                      : intl.get('s6.collateral_close_hover')
                  }
                  placement="topRight"
                  arrowPointAtCenter
                  trigger={['click']}
                >
                  <div className="j-token ">{item.collateralSymbol}</div>
                </Tooltip>
              ) : (
                <div className="j-token">{item.collateralSymbol}</div>
              )}
              {BigNumber(item.collateralFactor).eq(0) || (item.mintPaused && item.borrowPaused) ? (
                <div className="cannot-open">
                  <ToggleSwitch
                    on={item.account_entered === 1}
                    lang={lang}
                    onClick={() => {
                      if (item.account_entered === 1) {
                        return this.onSwitchChange(item.account_entered === 1, item);
                      }
                      return;
                    }}
                  ></ToggleSwitch>
                </div>
              ) : (
                <div>
                  <ToggleSwitch
                    on={item.account_entered === 1}
                    lang={lang}
                    onClick={() => {
                      this.onSwitchChange(item.account_entered === 1, item);
                    }}
                  ></ToggleSwitch>
                </div>
              )}
            </div>
            <div className="j-btn j-withdraw">{intl.get('s6.withdraw_btn')}</div>
          </div>

          <div className="j-hse">
            <div>
              <Tooltip
                overlayClassName="j-tooltip-dropdown"
                className="j-tooltip-m"
                title={intl.getHTML('v2.holder_tip')}
                placement="topRight"
                arrowPointAtCenter
                trigger={['click', 'hover']}
              >
                {intl.get('v2.holder')}
              </Tooltip>
            </div>
            <div className="j-hse-position">
              <div className="main-desc">
                {formatNumber(
                  BigNumber(
                    item.jtokenAddress === usddJtoken || item.jtokenAddress === usddoldJtoken
                      ? item.deposited
                      : item.deposited_usd
                  ),
                  2,
                  {
                    miniText: 0.01,
                    needDolar: true
                  }
                )}
              </div>
              <div className="sub-desc">
                {formatNumber(BigNumber(item.deposited), 3, { miniText: 0.001 })}
                {'  '}
                {item.collateralSymbol}
              </div>
            </div>
          </div>
        </div>
      );
    });
  };

  render() {
    return (
      <>
        <div className="j-home-supply-list">{this.cardRender()}</div>
      </>
    );
  }
}

export default SupplyLists;
