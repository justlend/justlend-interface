import React from 'react';
import isMobile from 'ismobilejs';
import { Link } from 'react-router-dom';
import { Table, Tooltip } from 'antd';
import intl from 'react-intl-universal';
import BigNumber from 'bignumber.js';
import Config from '../config';
import { formatNumber, getDepositApy, renderBalance, emptyReactNode, getTotalApy } from '../utils/helper';
import { inject, observer } from 'mobx-react';
import defaultIcon from '../assets/images/default.svg';

@inject('network')
@inject('lend')
@observer
class InfoList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      mobile: isMobile(window.navigator).any
    };
  }
  componentDidMount = () => {
  };

  clickDeposit = item => {
    const { isConnected } = this.props.network;
    if (!isConnected) {
      return this.props.network.connectWallet();
    }
    this.showDAW(item, '1');
  };

  clickBorrow = (text, item) => {
    const { isConnected } = this.props.network;
    if (!isConnected) {
      return this.props.network.connectWallet();
    }

    if (!this.props.lend.collateralValid(item.collateralSymbol)) return;

    this.props.lend.showBorrowModal(item, '1');
  };

  getBorrowValue = item => {
    const { jtokenAddress } = item;
    const { userList } = this.props.lend;
    const { borrowBalanceNew, deposited } = userList[jtokenAddress] || { borrowBalanceNew: 0, deposited: 0 };
    return { borrowBalanceNew, deposited };
  };

  depositApyTooltipRender = () => {
    return (
      <>
        {intl.get('market.deposit_apy')}
        <Tooltip title={intl.get('market.deposit_tip')} placement="bottom">
          <span className="tooltip-icon info-icon"></span>
        </Tooltip>
      </>
    );
  };

  getInfoColumns = balanceInfo => {
    const { lang } = this.state;
    // const { balanceInfo } = this.props.lend;
    let columns = [
      {
        title: intl.get('market.asset'),
        dataIndex: 'collateralSymbol',
        key: '1',
        ellipsis: true,
        fixed: 'left',
        width: isMobile(window.navigator).any ? 60 : 'auto',
        render: (text, item) => (
          <div className="collateralSymbol">
            <img
              src={item.logoUrl ? item.logoUrl : defaultIcon}
              onError={e => {
                e.target.onerror = null;
                e.target.src = defaultIcon;
              }}
            />
            <div className="tokenDetail">
              <div className="token-names fw500">{`${text}`}</div>
              <div className="description">{`${item.collateralName}`}</div>
            </div>
          </div>
          // </a>
        )
      },
      {
        title: this.depositApyTooltipRender(),
        dataIndex: 'depositApy',
        key: '2',
        render: (text, item) => {
          const { assetList } = this.props.lend;
          const { depositApy, mintApy, totalApy } = getTotalApy(item, assetList);
          return (
            <Tooltip
              title={
                <div className="info-tooltip">
                  {/* <div>
                    {intl.get('market.sun_mining')} + {intl.get('market.deposit_apy')}
                  </div> */}
                  <div>
                    {intl.get('market.deposit_base_nex')} :{' '}
                    {formatNumber(depositApy, 2, { per: true, miniText: '0.01' })}%
                  </div>
                  <div>
                    {intl.get('market.sun_mining_nex')} : {formatNumber(mintApy, 2, { per: true, miniText: '0.01' })}%
                  </div>
                </div>
              }
              placement="bottom"
            >
              {/* <span className={"fw500 "}> */}
              <span
                className={
                  'fw500 ' + (Config.hideMarketMintIcon.indexOf(item.collateralSymbol) > -1 ? 'hide-icon' : '')
                }
              >
                {formatNumber(totalApy, 2, { cutZero: false, miniText: 0.01, per: true })}
                {'%'}
              </span>
            </Tooltip>
          );
        }
      },
      {
        title: intl.get('market.borrow_apy'),
        dataIndex: 'lendApy',
        key: '3',
        render: text => (
          <div className="fw500">
            {formatNumber(BigNumber(text), 2, { cutZero: false, miniText: 0.01, per: true })}
            {'%'}
          </div>
        )
      },
      {
        title: intl.get('index.markets_wallet'),
        dataIndex: 'balance',
        key: '4',
        ellipsis: true,
        render: (text, item) => {
          return (
            <div className="fw500">
              {renderBalance(item, balanceInfo)}
            </div>
          );
        }
      },
      {
        title: intl.get('index.my_operating'),
        dataIndex: '',
        key: '5',
        ellipsis: true,
        fixed: 'right',
        width: 170,
        render: (text, item) => {
          // const { borrowBalanceNew, deposited } = this.getBorrowValue(item);
          return (
            <>
              <button
                className="table-btn deposit-btn custom-btn"
                // disabled={BigNumber(borrowBalanceNew).gt(0)}
                onClick={() => this.clickDeposit(item)}
              >
                {intl.get('index.markets_deposit')}
              </button>
              <button
                className="table-btn lend-btn ml12"
                // disabled={BigNumber(deposited).gt(0)}
                onClick={() => {
                  this.clickBorrow(text, item);
                }}
              >
                {intl.get('index.markets_withdraw')}
              </button>
            </>
          );
        }
      }
    ];
    if (isMobile(window.navigator).any) {
      columns.splice(1, 2);
    }
    return columns;
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

  filterUserEmptySunOld = (marketDataSource, isUserSunOldEmpty) => {
    if (marketDataSource) {
      let filterMarketDataSource = [...marketDataSource];
      marketDataSource.map((item, index) => {
        if (isUserSunOldEmpty && item.collateralSymbol.toLowerCase() === 'sunold') {
          filterMarketDataSource.splice(index, 1);
        }
      });
      return filterMarketDataSource;
    }
  };

  render() {
    let { marketDataSource, balanceInfo, isUserSunOldEmpty } = this.props.lend;
    // console.log('===', JSON.stringify(userDataSource));
    const { mobile } = this.state;
    const { multyRealStart } = this.props.network;
    marketDataSource = this.filterUserEmptySunOld(marketDataSource, isUserSunOldEmpty);
    return (
      <div
        className={
          'infoList-container ' + (multyRealStart ? 'multy-start' : '') + (mobile ? ' infoList-container-mobile' : '')
        }
      >
        <div className="title">
          {intl.get('index.markets_title')}
          {mobile && (
            <Tooltip title={intl.get('market.deposit_tip')} arrowPointAtCenter placement="bottomLeft">
              <span className="tooltip-icon info-icon"></span>
            </Tooltip>
          )}
        </div>
        <Table
          columns={this.getInfoColumns(balanceInfo)}
          dataSource={marketDataSource}
          pagination={false}
          locale={{
            emptyText: emptyReactNode
          }}
          scroll={{ x: isMobile(window.navigator).any ? 300 : 770 }}
        />
      </div>
    );
  }
}

export default InfoList;
