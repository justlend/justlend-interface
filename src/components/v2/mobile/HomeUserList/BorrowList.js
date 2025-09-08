import React, { useEffect, useRef } from 'react';
import isMobile from 'ismobilejs';
import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';
import {
  formatNumber,
  BigNumber,
  emptyReactNodeNew,
  getJTokenLogo,
  getTotalApy,
  getLogo
} from '../../../../utils/helper';
import { getIcons, getLendIcons } from '../../../../utils/constant';
import WBTTIcon from '../../../../assets/images/v2/new-icons/wbtt.png';
import { Tooltip, Table, Progress } from 'antd';
import Config from '../../../../config';
import defaultIcon from '../../../../assets/images/default.svg';

@inject('network')
@inject('lend')
@inject('system')
@observer
class BorrowLists extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale
    };
  }

  getColumns = () => {
    const { lang } = this.state;
    const { usddJtoken, usddoldJtoken } = Config;
    const columns = [
      {
        title: <span className="c-18c19f">{intl.get('v2.borrow_token')}</span>,
        dataIndex: 'collateralSymbol',
        key: 'collateralSymbol',
        width: '16%',
        render: (text, item) => (
          <div className={'j-list-logo' + (text === 'WBTT' ? ' wbtt' : text === 'ETH' ? ' eth' : '')}>
            <img
              src={item.logoUrl ? item.logoUrl : getLendIcons(item?.collateralSymbol)}
              onError={e => {
                e.target.onerror = null;
                e.target.src = getLendIcons(item?.collateralSymbol);
              }}
              alt=""
            />
            <div className="j-token">{`${text}`}</div>
          </div>
        )
      },
      {
        title: intl.get('v2.borrow_apy'),
        dataIndex: 'lendApy',
        sortDirections: ['descend', 'ascend'],
        sorter: (b, a) => b.lendApy - a.lendApy,
        showSorterTooltip: false,
        key: '4',
        width: '30%',
        render: (text, item) => {
          return (
            <div>
              <p className="fw500 single">{formatNumber(BigNumber(text), 2, { per: true, miniText: '0.01' })}%</p>
            </div>
          );
        }
      },

      {
        title: this.repayRender(),
        dataIndex: 'borrowBalanceNew',
        sortDirections: ['descend', 'ascend'],
        sorter: (b, a) => b.borrowBalanceNewUsd - a.borrowBalanceNewUsd,
        showSorterTooltip: false,
        key: '3',
        width: '30%',
        render: (text, item) => (
          <div>
            <div className="main-desc">
              {formatNumber(
                BigNumber(
                  item.jtokenAddress === usddJtoken || item.jtokenAddress === usddoldJtoken
                    ? BigNumber(text).div(item.precision)
                    : item.borrowBalanceNewUsd
                ),
                2,
                { miniText: 0.01, needDolar: true }
              )}
            </div>
            <div className="sub-desc">
              {formatNumber(BigNumber(text).div(item.precision), 3, { miniText: 0.001 })} {item.collateralSymbol}
            </div>
          </div>
        )
      },
      {
        title: ' ',
        dataIndex: 'per',
        key: '4',
        width: '25%',
        render: text => <div className="j-btn j-repay">{intl.get('v2.repay')}</div>
      }
    ];
    return columns;
  };

  repayRender = () => {
    return (
      <>
        <Tooltip
          overlayClassName="j-tooltip-dropdown"
          arrowPointAtCenter
          title={intl.get('v2.tip5')}
          placement="top"
          trigger="['hover','click']"
        >
          <span className="j-tooltip-icon j-info-icon mr-4"></span>
        </Tooltip>
        {intl.get('v2.debt')}
      </>
    );
  };

  clickRow = (row, e) => {
    window.gtag('event', 'H5_tab_borrow_repay', { 'event_category': 'H5', 'event_label': 'tab_borrow_repay' });

    if (!this.props.network.isConnected) {
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

    this.props.system.clearRejectError();

    let classList = e.target.classList;
    if (classList) {
      let className = Array.prototype.slice.call(classList);
      if (className.includes('j-tooltip-m')) return;
    }

    this.props.lend.showBorrowModal(row, '2');
  };

  onSwitchChange = (status, item) => {
    if (!this.props.lend.collateralValid(item.collateralSymbol)) return;

    const { jtokenAddress } = item;
    this.props.lend.setData({ visible: true, type: status ? 2 : 1, jtokenAddress }, 'mortgageModalInfo');
  };

  cardRender = () => {
    const { userLendDataSource, theme } = this.props.lend;
    const { activeKey } = this.props;
    const { usddJtoken, usddoldJtoken } = Config;

    return userLendDataSource.length > 0 ? (
      <div className="j-home-supply-list">
        {userLendDataSource.map(item => {
          return (
            <div
              className="j-home-supply-ele"
              onClick={e => {
                this.clickRow(item, e);
              }}
              key={item.collateralSymbol}
            >
              <div className="j-hse">
                <div className={'j-hse-logo ' + item?.collateralSymbol?.toLocaleLowerCase()}>
                  <img
                    src={
                      item.collateralSymbol === 'WBTT'
                        ? theme === 'white'
                          ? getIcons(item.collateralSymbol)
                          : WBTTIcon
                        : item.logoUrl
                        ? item.logoUrl
                        : getLendIcons(item?.collateralSymbol)
                    }
                    onError={e => {
                      e.target.onerror = null;
                      e.target.src = getLendIcons(item?.collateralSymbol);
                    }}
                    alt=""
                  />
                  <div className="j-token">{item.collateralSymbol}</div>
                </div>
                <div>
                  <div className="j-btn j-repay">{intl.get('v2.repay')}</div>
                </div>
              </div>

              <div className="j-hse">
                <div>
                  <Tooltip
                    overlayClassName="j-tooltip-dropdown"
                    className="j-tooltip-m"
                    arrowPointAtCenter
                    title={intl.get('v2.tip5')}
                    placement="topRight"
                    trigger="['hover','click']"
                  >
                    {intl.get('v2.debt')}
                  </Tooltip>
                </div>
                <div className="j-hse-position">
                  <div className="main-desc">
                    {formatNumber(
                      BigNumber(
                        item.jtokenAddress === usddJtoken || item.jtokenAddress === usddoldJtoken
                          ? BigNumber(item.borrowBalanceNew).div(item.precision)
                          : item.borrowBalanceNewUsd
                      ),
                      2,
                      { miniText: 0.01, needDolar: true }
                    )}
                  </div>
                  <div className="sub-desc">
                    {formatNumber(BigNumber(item.borrowBalanceNew).div(item.precision), 3, { miniText: 0.001 })}{' '}
                    {item.collateralSymbol}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    ) : activeKey === 'borrow' ? (
      <div className="j-home-supply-list">{emptyReactNodeNew()}</div>
    ) : null;
  };

  render() {
    return <>{this.cardRender()}</>;
  }
}

export default BorrowLists;
