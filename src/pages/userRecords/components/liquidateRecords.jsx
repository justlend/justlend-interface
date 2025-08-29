import React from 'react';
import isMobile from 'ismobilejs';
import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';
import { Table, Tooltip } from 'antd';
import {
  emptyReactNodeNew,
  formatNumber,
  showEllipsis,
  tableClickRowToTransaction,
  BigNumber
} from '../../../utils/helper';
import '../../../assets/css/userRecords.scss';

@inject('network')
@inject('userRecords')
@observer
class LiquidateRecords extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mobile: isMobile(window.navigator).any
    };
  }
  componentDidMount = async () => {};

  getContextFromOpType = (opType, symbol, cdpId) => {
    const actions = {
      '1': intl.get('liquidation_records.recycle_energy'), // plus, trx
      '2': intl.get('liquidation_records.liquidate_token', { token: symbol || '--' }), // minus, usdt / token, jusdt / token
      '3': intl.get('liquidation_records.repay_token', { token: symbol || '--' }), // plus, usdd / token
      '4': intl.get('liquidation_records.liquidate_cdp', { number: cdpId || '--' }), // minus, trx / token
      '5': intl.get('liquidation_records.repay_cdp', { number: cdpId || '--' }) // plus, usdj / token
    };
    return actions[opType];
  };

  renderTokenAmount = item => {
    const { mobile } = this.state;
    const { tokenDecimal } = this.props.userRecords;
    const positiveSignList = [1, 3, 5];
    const negativeSignList = [2, 4];
    const whiteColorList = [4, 5];
    const liquidateTooltip = [4];

    if (!item.amount) return '--';
    const currentSign = positiveSignList.includes(item.opType)
      ? '+'
      : negativeSignList.includes(item.opType)
      ? '-'
      : '';

    return (
      <div
        className={
          'token-amount ' +
          (whiteColorList.includes(item.opType)
            ? 'white'
            : currentSign === '+'
            ? 'green'
            : currentSign === '-'
            ? 'red'
            : '')
        }
      >
        {(!mobile || (item.opType !== 1 && !liquidateTooltip.includes(item.opType))) && (
          <>
            <span>{currentSign}</span>
            <span>{formatNumber(item.amount, tokenDecimal, { miniText: '0.000001' })}</span>
            {BigNumber(item.amount).gt('0.000001') && showEllipsis(item.amount, tokenDecimal) && (
              <Tooltip
                overlayClassName="user-records-tooltip"
                title={formatNumber(item.amount)}
                arrowPointAtCenter
                placement={mobile ? 'topLeft' : 'top'}
              >
                {'...'}
              </Tooltip>
            )}
            <span>{' ' + (item.symbol || '--')}</span>
          </>
        )}
        {/* UI requirements */}
        {mobile
          ? item.opType === 1 && (
              <Tooltip
                overlayClassName="j-tooltip-dropdown liquidate-long-dropdown"
                title={intl.get('action_records_hover.rent_for', { address: item?.receiver })}
                placement="topLeft"
                arrowPointAtCenter
              >
                <span className="underline-dashed">
                  <span>{currentSign}</span>
                  <span>{formatNumber(item.amount, tokenDecimal, { miniText: '0.000001' })}</span>
                  {BigNumber(item.amount).gt('0.000001') && showEllipsis(item.amount, tokenDecimal) && (
                    <Tooltip
                      overlayClassName="user-records-tooltip"
                      title={formatNumber(item.amount)}
                      arrowPointAtCenter
                      placement="topLeft"
                    >
                      {'...'}
                    </Tooltip>
                  )}
                  <span>{' ' + (item.symbol || '--')}</span>
                </span>
              </Tooltip>
            )
          : item.opType === 1 && (
              <Tooltip
                overlayClassName="j-tooltip-dropdown liquidate-long-dropdown"
                title={intl.get('action_records_hover.rent_for', { address: item?.receiver })}
                placement="top"
                arrowPointAtCenter
              >
                <span className="j-tooltip-icon"></span>
              </Tooltip>
            )}
        {mobile
          ? liquidateTooltip.includes(item.opType) && (
              <Tooltip
                overlayClassName="j-tooltip-dropdown"
                title={intl.get('action_records_hover.liquidate_cdp')}
                placement="topLeft"
                arrowPointAtCenter
              >
                <span className="underline-dashed">
                  <span>{currentSign}</span>
                  <span>{formatNumber(item.amount, tokenDecimal, { miniText: '0.000001' })}</span>
                  {BigNumber(item.amount).gt('0.000001') && showEllipsis(item.amount, tokenDecimal) && (
                    <Tooltip
                      overlayClassName="user-records-tooltip"
                      title={formatNumber(item.amount)}
                      arrowPointAtCenter
                      placement="topLeft"
                    >
                      {'...'}
                    </Tooltip>
                  )}
                  <span>{' ' + (item.symbol || '--')}</span>
                </span>
              </Tooltip>
            )
          : liquidateTooltip.includes(item.opType) && (
              <Tooltip
                overlayClassName="j-tooltip-dropdown"
                title={intl.get('action_records_hover.liquidate_cdp')}
                placement="top"
                arrowPointAtCenter
              >
                <span className="j-tooltip-icon"></span>
              </Tooltip>
            )}
      </div>
    );
  };

  getInfoColumns = () => {
    const { mobile } = this.state;
    let columns = [
      {
        title: intl.get('user_records.type'),
        dataIndex: 'opType',
        key: '1',
        ellipsis: true,
        fixed: 'left',
        width: '30%',
        className: 'opType',
        render: (text, item) => {
          const showDescriptionList = [1];
          return (
            <div className="flex-center">
              {item?.status && (
                <span
                  className={'icon mr-10 ' + (item.status === 1 ? 'loading' : item.status === 2 ? 'success' : '')}
                ></span>
              )}
              <span className="mr-10">{this.getContextFromOpType(text, item?.symbol, item?.cdpId)}</span>
              {/**
               * Need to determine whether to trigger platform recycling
               * Currently, there is no corresponding field in the backend.
               * The front-end has adjusted it so that tooltips are not displayed uniformly.
               * TODO:
               * In the case of tooltip, there is a loading icon on the left. If there are corresponding fields in the backend, they need to be added together.
               */}
              {/* {showDescriptionList.includes(item.opType) && item.status === 2 && (
                <Tooltip
                  overlayClassName="j-tooltip-dropdown"
                  title={intl.get('action_records_hover.mandatory_recycling')}
                  placement="top"
                  arrowPointAtCenter
                >
                  <span className="j-tooltip-icon"></span>
                </Tooltip>
              )} */}
            </div>
          );
        }
      },
      {
        title: intl.get('user_records.time'),
        dataIndex: 'blockTimestamp',
        align: 'left',
        width: '30%',
        key: '2',
        render: (text, item) => {
          return (
            <div className="time">
              {text
                ? new Date(text).format('yyyy-MM-dd h:m:s')
                : item?.blocktimestamp
                ? new Date(item.blocktimestamp).format('yyyy-MM-dd h:m:s')
                : '--'}
            </div>
          );
        }
      },
      {
        title: intl.get('user_records.amount'),
        dataIndex: 'tokenAmount',
        align: 'left',
        key: '3',
        render: (text, item) => {
          return (
            <div className="mobile-card">
              {mobile && <span>{intl.get('user_records.amount')}</span>}
              <div className="flex-center flex-start">
                <div className={'detail ' + (mobile ? '' : 'mr-10')}>
                  {this.renderTokenAmount(item)}
                  {item?.opType !== 10 && item?.opType !== 11 && (
                    <div className="associate-usd">
                      {formatNumber(item.usd, 2, {
                        cutZero: true,
                        needDolar: true,
                        miniText: '0.01'
                      })}
                    </div>
                  )}
                </div>
                {/* {item.opType === 1 && (
                  <Tooltip
                    overlayClassName="j-tooltip-dropdown"
                    title={intl.get('action_records_hover.rent_for', { address: item?.receiver })}
                    placement="top"
                    arrowPointAtCenter
                  >
                    <span className="j-tooltip-icon"></span>
                  </Tooltip>
                )} */}
              </div>
            </div>
          );
        }
      },
      {
        title: '',
        dataIndex: 'txId',
        key: '5',
        width: 80,
        render: (text, item) => <span className="link-arrow"></span>
      }
    ];
    return columns;
  };

  getPageContent = currentPageNumber => {
    this.props.userRecords.setData({ currentPageNumber });
    this.props.userRecords.getLiquidityRecordsData();
  };

  render() {
    const { liquidationRecords, liquidationTotalCount, pageSize } = this.props.userRecords;
    return (
      <Table
        className="user-records-table"
        columns={this.getInfoColumns()}
        onRow={record => {
          return {
            onClick: () => {
              tableClickRowToTransaction(record?.txId, 'userRecord');
            }
          };
        }}
        dataSource={liquidationRecords}
        pagination={
          BigNumber(liquidationTotalCount).gt(pageSize)
            ? {
                total: liquidationTotalCount,
                pageSize,
                onChange: this.getPageContent,
                showQuickJumper: true,
                locale: { jump_to: intl.get('user_records.goto'), page: intl.get('user_records.page') }
              }
            : false
        }
        locale={{
          emptyText: emptyReactNodeNew
        }}
        rowKey={'id'}
      />
    );
  }
}

export default LiquidateRecords;
