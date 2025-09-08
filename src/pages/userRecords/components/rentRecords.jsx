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
  cutMiddle,
  BigNumber
} from '../../../utils/helper';
import '../../../assets/css/userRecords.scss';

@inject('network')
@inject('userRecords')
@observer
class RentRecords extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mobile: isMobile(window.navigator).any
    };
  }
  componentDidMount = async () => {};

  getContextFromActionType = actionType => {
    const actions = {
      '1': intl.get('energy_rental_records.rent'),
      /**
       * Demand changes: Renewal energy or duration, both display the "Renew"
       */
      '2': intl.get('energy_rental_records.renew'),
      '3': intl.get('energy_rental_records.renew'),
      '4': intl.get('energy_rental_records.end_rental'),
      '5': intl.get('energy_rental_records.recycle')
    };
    return actions[actionType];
  };

  renderTokenAmount = item => {
    const { mobile } = this.state;
    const { tokenDecimal } = this.props.userRecords;
    const positiveSignList = [4, 5];
    const negativeSignList = [1, 2, 3];
    const currentSign = positiveSignList.includes(item.actionType)
      ? '+'
      : negativeSignList.includes(item.actionType)
      ? '-'
      : '';
    if (!item.securityDeposit) return '--';

    return (
      <div className={'token-amount ' + (currentSign === '+' ? 'green' : currentSign === '-' ? 'red' : '')}>
        <span>{currentSign}</span>
        <span>{formatNumber(item.securityDeposit, tokenDecimal, { miniText: '0.000001' })}</span>
        {showEllipsis(item.securityDeposit, tokenDecimal) && (
          <Tooltip
            overlayClassName="user-records-tooltip"
            title={formatNumber(item.securityDeposit)}
            arrowPointAtCenter
            placement={mobile ? 'topLeft' : 'top'}
          >
            {'...'}
          </Tooltip>
        )}
        <span>{' TRX'}</span>
      </div>
    );
  };

  getInfoColumns = () => {
    const { mobile } = this.state;
    let columns = [
      {
        title: intl.get('user_records.type'),
        dataIndex: 'actionType',
        key: '1',
        ellipsis: true,
        fixed: 'left',
        width: '20%',
        className: 'actionType',
        render: (text, item) => {
          return (
            <div className="flex-center">
              {item?.status && (
                <span
                  className={'icon mr-10 ' + (item.status === 1 ? 'loading' : item.status === 2 ? 'success' : '')}
                ></span>
              )}
              <span>{this.getContextFromActionType(text)}</span>
            </div>
          );
        }
      },
      {
        title: intl.get('user_records.time'),
        dataIndex: 'blocktimestamp',
        align: 'left',
        width: '20%',
        key: '2',
        render: (text, item) => {
          return (
            <div className="time">
              {text
                ? new Date(text).format('yyyy-MM-dd h:m:s')
                : item?.blockTimestamp
                ? new Date(item.blockTimestamp).format('yyyy-MM-dd h:m:s')
                : '--'}
            </div>
          );
        }
      },
      {
        title: intl.get('energy_rental_records.receiving_address'),
        dataIndex: 'receiver',
        align: 'left',
        width: '30%',
        key: '3',
        render: (text, item) => {
          return mobile ? (
            <div className="mobile-card">
              {mobile && <span>{intl.get('energy_rental_records.receiving_address')}</span>}
              {cutMiddle(text, 10, 10)}
            </div>
          ) : (
            <div>{text}</div>
          );
        }
      },
      {
        title: intl.get('user_records.amount'),
        dataIndex: 'amount',
        align: 'left',
        width: '25%',
        key: '4',
        render: (text, item) => (
          <div className="mobile-card">
            {mobile && <span>{intl.get('user_records.amount')}</span>}
            <div className="detail">
              {this.renderTokenAmount(item)}
              <div className="associate-usd">
                {formatNumber(item.rentUsd, 2, {
                  cutZero: true,
                  needDolar: true,
                  miniText: '0.01'
                })}
              </div>
            </div>
          </div>
        )
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
    this.props.userRecords.getRentRecordsData();
  };

  render() {
    const { rentRecords, rentTotalCount, pageSize } = this.props.userRecords;
    return (
      <Table
        className="user-records-table rent"
        columns={this.getInfoColumns()}
        onRow={record => {
          return {
            onClick: () => {
              tableClickRowToTransaction(record?.txId, 'userRecord');
            }
          };
        }}
        dataSource={rentRecords}
        pagination={
          BigNumber(rentTotalCount).gt(pageSize)
            ? {
                total: rentTotalCount,
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

export default RentRecords;
