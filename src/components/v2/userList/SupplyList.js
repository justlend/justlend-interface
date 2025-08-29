import React, { useEffect, useRef } from 'react';
import isMobile from 'ismobilejs';
import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';
import { formatNumber, BigNumber, emptyReactNodeNew, getJTokenLogo, getTotalApy, tooltip } from '../../../utils/helper';
import { Tooltip, Table } from 'antd';
import defaultIcon from '../../../assets/images/default.svg';
import Config from '../../../config';
import ToggleSwitch from '../../Widget/ToggleSwitch';
import MortgageModal from '../../Modals/v2/Mortgage';

@inject('network')
@inject('lend')
@inject('pool')
@inject('system')
@observer
class SupplyLists extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale
    };
  }

  getColumns = () => {
    const { lang = 'en-US' } = this.state;
    const { theme, openMint } = this.props.lend;
    const { usddJtoken, usddoldJtoken } = Config;
    const columns = [
      {
        title: <span className={theme === 'white' ? 'c-4c54ff' : 'c-9195fb'}>{intl.get('v2.deposit_token')}</span>,
        dataIndex: 'collateralSymbol',
        key: '1',
        width: '16%',
        render: (text, item) => (
          <div className="j-list-logo">
            <img
              src={getJTokenLogo(item.collateralSymbol)}
              onError={e => {
                e.target.onerror = null;
                e.target.src = defaultIcon;
              }}
              alt=""
            />
            <div className="j-token">{`${text}`}</div>
            {item.account_entered === 2 ? (
              <span className="colleteral">{intl.get('index.not_support')}</span>
            ) : (
              <Tooltip
                overlayClassName="j-tooltip-dropdown"
                title={
                  item.account_entered === 1
                    ? intl.get('s6.collateral_open_hover')
                    : intl.get('s6.collateral_close_hover')
                }
                placement="top"
                arrowPointAtCenter
                trigger={['hover']}
              >
                <div>
                  <ToggleSwitch
                    on={item.account_entered === 1}
                    lang={lang}
                    onClick={() => {
                      this.onSwitchChange(item.account_entered === 1, item);
                    }}
                  ></ToggleSwitch>
                </div>
              </Tooltip>
            )}
          </div>
        )
      },
      {
        title: (
          <>
            <Tooltip
              overlayClassName="j-tooltip-dropdown"
              title={
                openMint
                  ? tooltip(intl.get('risk_tip.header_apy'), [
                      { title: intl.get('v2.tip2') },
                      { title: intl.get('risk_tip.header_deposit') },
                      { title: intl.get('v2.tip3') }
                    ])
                  : tooltip(intl.get('risk_tip.header_apy_no_mint'), [
                      { title: intl.get('v2.tip2') },
                      { title: intl.get('risk_tip.header_deposit') }
                    ])
              }
              placement="top"
              arrowPointAtCenter
            >
              <span className="j-tooltip-icon j-info-icon mr-4"></span>
            </Tooltip>
            {intl.get('v2.deposit_apy')}
          </>
        ),
        dataIndex: 'depositApy',
        key: '4',
        sortDirections: ['descend', 'ascend'],
        sorter: (b, a) => {
          const { assetList } = this.props.lend;
          let t1 = getTotalApy(a, assetList);
          let t2 = getTotalApy(b, assetList);
          return t2.totalApy - t1.totalApy;
        },
        showSorterTooltip: false,
        width: '30%',
        render: (text, item) => {
          const { assetList } = this.props.lend;
          const { totalApy } = getTotalApy(item, assetList);
          return (
            <div>
              <p className="fw500 single">{formatNumber(BigNumber(totalApy), 2, { per: true, miniText: '0.01' })}%</p>
            </div>
          );
        }
      },
      {
        title: (
          <>
            <Tooltip
              overlayClassName="j-tooltip-dropdown"
              title={intl.getHTML('v2.holder_tip')}
              placement="top"
              arrowPointAtCenter
            >
              <span className="j-tooltip-icon j-info-icon mr-4"></span>
            </Tooltip>
            {intl.get('v2.holder')}
          </>
        ),
        dataIndex: 'deposited_usd',
        key: '3',
        sortDirections: ['descend', 'ascend'],
        sorter: (b, a) => b.deposited_usd - a.deposited_usd,
        showSorterTooltip: false,
        width: '30%',
        render: (text, item) => (
          <div>
            <div className="main-desc">
              {formatNumber(
                BigNumber(
                  item.jtokenAddress === usddJtoken || item.jtokenAddress === usddoldJtoken ? item.deposited : text
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
        )
      },
      {
        title: ' ',
        dataIndex: 'per',
        key: '4',
        width: '25%',
        render: text => <div className="j-btn j-withdraw">{intl.get('s6.withdraw_btn')}</div>
      }
    ];
    return columns;
  };

  clickRow = row => {
    window.gtag('event', 'PC_tab_supply_withdraw', { 'event_category': 'PC', 'event_label': 'tab_supply_withdraw' });

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

    this.showDAW(row, '2');
  };

  showDAW = (popData, activeKey, cb) => {
    this.props.system.clearRejectError();
    this.props.lend.setData({
      DAWPop: {
        show: true,
        activeKey,
        popData: popData,
        cb
      }
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

    if (this.props.network.isMainNetwork === 0) {
      this.props.network.showNetworkErrorModal();
      return;
    }

    if (!this.props.lend.collateralValid(item.collateralSymbol)) return;

    const { jtokenAddress } = item;
    this.props.system.setData({ transModalInfo: { declined: false } });
    this.props.lend.setData({ visible: true, type: status ? 2 : 1, jtokenAddress }, 'mortgageModalInfo');
  };

  render() {
    const { userDepositDataSource, mortgageModalInfo } = this.props.lend;
    // let dataSource = userDepositDataSource?.filter(item => item.account_entered === 1);
    let dataSource = userDepositDataSource;

    return (
      <>
        <div className="bs-list j-supply-list">
          <Table
            onRow={(row, index) => {
              return {
                onClick: e => {
                  this.clickRow(row);
                }
              };
            }}
            columns={this.getColumns()}
            dataSource={dataSource}
            pagination={false}
            locale={{
              emptyText: emptyReactNodeNew()
            }}
          />
          {mortgageModalInfo.visible && <MortgageModal dataSource={dataSource}></MortgageModal>}
        </div>
      </>
    );
  }
}

export default SupplyLists;
