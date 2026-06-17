import React from 'react';
import isMobile from 'ismobilejs';
import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';
import { Table, Tooltip } from 'antd';
import { getAuthorizedMaximumNumberOfImpressions } from '../utils/config';
import {
  emptyReactNodeNew,
  formatNumber,
  showEllipsis,
  tableClickRowToTransaction,
  BigNumber
} from '../../../utils/helper';
import { formatTokenAmount, formatFiatValue } from '../../../utils/formatters';
import '../../../assets/css/userRecords.scss';

@inject('network')
@inject('userRecords')
@observer
class DepositBorrowRecords extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mobile: isMobile(window.navigator).any
    };
  }
  componentDidMount = async () => {};

  getContextFromActionType = (actionType, symbol) => {
    const actions = {
      '1': intl.get('supply_and_borrow_records.supply') + ' ' + symbol,
      '2': intl.get('supply_and_borrow_records.withdraw') + ' ' + symbol,
      '3': intl.get('supply_and_borrow_records.borrow') + ' ' + symbol,
      '4': intl.get('supply_and_borrow_records.repay') + ' ' + symbol,
      '5': intl.get('jlv2.record.liquidate_reward'),
      '6': intl.get('jlv2.record.as_liquidator'),
      // '5': intl.get('supply_and_borrow_records.liquidate', { token: symbol || '--' }),
      // '6': intl.get('supply_and_borrow_records.repay_liquidate', { token: symbol || '--' }),
      '7': intl.get('supply_and_borrow_records.receive_jtoken'),
      '8': intl.get('supply_and_borrow_records.send_jtoken'),
      '9': intl.get('supply_and_borrow_records.approve', { title: symbol || '--' }),
      '10': intl.get('supply_and_borrow_records.enable_collateral', { title: symbol || '--' }),
      '11': intl.get('supply_and_borrow_records.disable_collateral', { title: symbol || '--' })
    };
    return actions[actionType];
  };

  renderTokenAmount = item => {
    const { mobile } = this.state;
    const { tokenDecimal } = this.props.userRecords;
    const doNotDisplayList = [10, 11];
    const noLimitList = [9];
    const useJTokenSymbolList = [5, 7, 8]; 
    const manuallyAddJSymbolList = [7, 8]; 
    const positiveSignList = [1, 3, 5, 7];
    const negativeSignList = [2, 4, 6, 8];
    const currentSign = positiveSignList.includes(item.actionType)
      ? '+'
      : negativeSignList.includes(item.actionType)
      ? '-'
      : '';

    if (doNotDisplayList.includes(item.actionType)) return '-';
    /**
     * Different from the initial discussion conclusion,
     * since the backend cannot filter unofficial authorizations,
     * added a new authorized maximum display quantity and related logic:
     * 1. Default display authorization quantity;
     * 2. Displays exceeding this quantity will be “unlimited".
     */
    if (noLimitList.includes(item.actionType)) {
      const authorizedMaximumNumberOfImpressions = getAuthorizedMaximumNumberOfImpressions();
      if (BigNumber(item.tokenAmount).gt(authorizedMaximumNumberOfImpressions)) {
        return intl.get('supply_and_borrow_records.no_limit');
      }
      return (
        // <div className={'token-amount green'}>
        <div className={'token-amount'}>
          <span>{currentSign}</span>
          <span>{formatTokenAmount(item.tokenAmount, item.symbol)}</span>
          {/* <span>{formatNumber(item.tokenAmount, tokenDecimal, { miniText: '0.000001' })}</span>
          {showEllipsis(item.tokenAmount, tokenDecimal) && (
            <Tooltip
              overlayClassName="user-records-tooltip"
              title={formatNumber(item.tokenAmount)}
              arrowPointAtCenter
              placement={mobile ? 'topLeft' : 'top'}
            >
              {'...'}
            </Tooltip>
          )} 
          <span>{' ' + (item.symbol || '--')}</span>*/}
        </div>
      );
    }
    if (!item.tokenAmount && !item.jtokenAmount) return '--';
    if (useJTokenSymbolList.includes(item.actionType)) {
      return (
        // <div className={'token-amount ' + (currentSign === '+' ? 'green' : currentSign === '-' ? 'red' : '')}>
        //   <span>{currentSign}</span>
        <div className={'token-amount'}>
          <span>
            {formatTokenAmount(
              item.jtokenAmount,
              (manuallyAddJSymbolList.includes(item.actionType) ? 'j' : '') + (item.symbol || '--')
            )}
          </span>
          {/* <span>{formatNumber(item.jtokenAmount, tokenDecimal, { miniText: '0.000001' })}</span>
          {showEllipsis(item.jtokenAmount, tokenDecimal) && (
            <Tooltip
              overlayClassName="user-records-tooltip"
              title={formatNumber(item.jtokenAmount)}
              arrowPointAtCenter
              placement={mobile ? 'topLeft' : 'top'}
            >
              {'...'}
            </Tooltip>
          )} 
          <span>{' ' + (manuallyAddJSymbolList.includes(item.actionType) ? 'j' : '') + (item.symbol || '--')}</span>*/}
        </div>
      );
    }

    return (
      // <div className={'token-amount ' + (currentSign === '+' ? 'green' : currentSign === '-' ? 'red' : '')}>
      //   <span>{currentSign}</span>
      <div className={'token-amount'}>
        <span>{formatTokenAmount(item.tokenAmount, item.symbol)}</span>
        {/* <span>{formatNumber(item.tokenAmount, tokenDecimal, { miniText: '0.000001' })}</span>
        {showEllipsis(item.tokenAmount, tokenDecimal) && (
          <Tooltip
            overlayClassName="user-records-tooltip"
            title={formatNumber(item.tokenAmount)}
            arrowPointAtCenter
            placement={mobile ? 'topLeft' : 'top'}
          >
            {'...'}
          </Tooltip>
        )}
        <span>{' ' + (item.symbol || '--')}</span> */}
      </div>
    );
  };

  getInfoColumns = () => {
    const { mobile } = this.state;
    let columns = [
      {
        title: intl.get('user_records.time'),
        dataIndex: 'blockTimestamp',
        align: 'left',
        fixed: 'left',
        width: '20%',
        render: (text, item) => {
          return <div className="time">{text ? new Date(text).format('yyyy-MM-dd h:m:s') : '--'}</div>;
        }
      },
      {
        title: intl.get('jlv2.record.protocol'),
        dataIndex: 'protocol',
        align: 'left',
        width: '15%',
        render: (text, item) => 'SBM V1'
      },
      {
        title: intl.get('jlv2.record.operation'),
        dataIndex: 'actionType',
        ellipsis: true,
        width: '25%',
        className: 'actionType',
        render: (text, item) => {
          const showDescriptionList = [7, 8];
          return (
            <div className="mobile-card">
              {mobile && <span>{intl.get('jlv2.record.operation')}</span>}
              <div className="flex-center">
                {item?.status && (
                  <span
                    className={'icon mr-10 ' + (item.status === 1 ? 'loading' : item.status === 2 ? 'success' : '')}
                  ></span>
                )}
                {mobile ? (
                  showDescriptionList.includes(item.actionType) ? (
                    <Tooltip
                      overlayClassName="j-tooltip-dropdown"
                      title={
                        item.actionType === 7
                          ? intl.get('action_records_hover.received_jtoken')
                          : item.actionType === 8
                          ? intl.get('action_records_hover.sent_jtoken')
                          : ''
                      }
                      placement="topRight"
                      arrowPointAtCenter
                    >
                      <span className="underline-dashed">{this.getContextFromActionType(text, item.symbol)}</span>
                    </Tooltip>
                  ) : (
                    <span>{this.getContextFromActionType(text, item.symbol)}</span>
                  )
                ) : (
                  <>
                    <span>{this.getContextFromActionType(text, item.symbol)}</span>
                    {showDescriptionList.includes(item.actionType) && (
                      <Tooltip
                        overlayClassName="j-tooltip-dropdown"
                        title={
                          item.actionType === 7
                            ? intl.get('action_records_hover.received_jtoken')
                            : item.actionType === 8
                            ? intl.get('action_records_hover.sent_jtoken')
                            : ''
                        }
                        placement="topRight"
                        arrowPointAtCenter
                      >
                        <span className="j-tooltip-icon"></span>
                      </Tooltip>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        }
      },
      {
        title: intl.get('user_records.amount'),
        dataIndex: 'tokenAmount',
        align: 'left',
        render: (text, item) => {
          const hideUsdList = [9, 10, 11];
          return (
            <div className="mobile-card">
              {mobile && <span>{intl.get('user_records.amount')}</span>}
              <div className="detail">
                {this.renderTokenAmount(item)}
                {!hideUsdList.includes(item?.actionType) && (
                  <div className="associate-usd">
                    {formatFiatValue(item.associateUsd)}
                    {/* {formatNumber(item.associateUsd, 2, {
                      cutZero: true,
                      needDolar: true,
                      miniText: '0.01'
                    })} */}
                  </div>
                )}
              </div>
            </div>
          );
        }
      },
      {
        title: intl.get('jlv2.record.action'),
        dataIndex: 'txId',
        width: '12%',
        // render: (text, item) => <span className="link-arrow"></span>
        render: (text, item) => (
          this.state.mobile ? (
            <span
              className="records-link"
              onClick={e => {
                e.stopPropagation();
                this.props.userRecords.handleToDetail('SBMV1', item);
              }}
            >
              {intl.get('jlv2.record.details')}
            </span>
          ) : (
            <span className="records-link">{intl.get('jlv2.record.details')}</span>
          )
        )
      }
    ];
    return columns;
  };

  getPageContent = currentPageNumber => {
    this.props.userRecords.setOneData('currentPageNumber', currentPageNumber);
    this.props.userRecords.getDepositBorrowRecordsData();
  };

  render() {
    const { depositBorrowRecords, depositBorrowTotalCount, pageSize } = this.props.userRecords;
    return (
      <Table
        className="user-records-table"
        columns={this.getInfoColumns()}
        onRow={record => {
          if(this.state.mobile) return ;
          return {
            onClick: () => {
              this.props.userRecords.handleToDetail('SBMV1', record);
            }
          };
        }}
        dataSource={depositBorrowRecords}
        pagination={
          BigNumber(depositBorrowTotalCount).gt(pageSize)
            ? {
                total: depositBorrowTotalCount,
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
        rowKey={record => record.id}
      />
    );
  }
}

export default DepositBorrowRecords;
