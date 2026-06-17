import React, { useEffect, useRef } from 'react';
import isMobile from 'ismobilejs';
import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';
import { formatNumber, BigNumber, emptyReactNodeNew, getJTokenLogo, getTotalApy, getLogo } from '../../../utils/helper';
import { Tooltip, Table, Progress } from 'antd';
import Config from '../../../config';
import defaultIcon from '../../../assets/images/default.svg';
import { getLendIcons } from '../../../utils/constant';

@inject('network')
@inject('ui')
@inject('lend')
@inject('system')
@inject('user')
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
              src={item.logoUrl ? item.logoUrl : getLendIcons(item.collateralSymbol)}
              onError={e => {
                e.target.onerror = null;
                e.target.src = getLendIcons(item.collateralSymbol);
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

  clickRow = row => {
    window.gtag('event', 'PC_tab_borrow_repay', { 'event_category': 'PC_V1.5', 'event_label': 'tab_borrow_repay' });

    if (!this.props.network.isConnected) {
      return this.props.network.connectWalletV2();
    }

    if (this.props.network.isRightChain === 0) {
      this.props.network.changeChain();
      return;
    }

    this.props.system.clearRejectError();
    this.props.lend.showBorrowModal(row, '2');
  };

  onSwitchChange = (status, item) => {
    if (!this.props.lend.collateralValid(item.collateralSymbol)) return;

    const { jtokenAddress } = item;
    this.props.lend.setMortgageModalInfo({ visible: true, type: status ? 2 : 1, jtokenAddress });
  };

  render() {
    const { userLendDataSource } = this.props.user;

    return (
      <>
        <div className="bs-list j-borrow-list">
          <Table
            onRow={row => {
              return {
                onClick: () => {
                  this.clickRow(row);
                }
              };
            }}
            columns={this.getColumns()}
            dataSource={userLendDataSource}
            pagination={false}
            locale={{
              emptyText: emptyReactNodeNew()
            }}
          />
        </div>
      </>
    );
  }
}

export default BorrowLists;
