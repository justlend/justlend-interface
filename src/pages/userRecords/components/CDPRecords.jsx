import React from 'react';
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
class CDPRecords extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  componentDidMount = async () => {};

  getContextFromOpType = opType => {
    const actions = {
      '1': intl.get('cdp_records.open'), // --
      '2': intl.get('cdp_records.give'), // --
      '3': intl.get('cdp_records.lock'), // mimus, trx
      '4': intl.get('cdp_records.draw'), // plus, usdj
      '5': intl.get('cdp_records.wipe'), // minus, usdj
      '6': intl.get('cdp_records.free'), // plus, trx
      '7': intl.get('cdp_records.bite'),
      '8': intl.get('cdp_records.close') // --
    };
    return actions[opType];
  };

  renderTokenAmount = item => {
    // const { tokenDecimal } = this.props.userRecords;
    const defaultDisplayList = [1, 2, 8];
    const positiveSignList = [4, 6];
    const negativeSignList = [3, 5];
    const trxSymbolList = [3, 6];
    const usdjSymbolList = [4, 5];
    const currentSign = positiveSignList.includes(item.opType)
      ? '+'
      : negativeSignList.includes(item.opType)
      ? '-'
      : '';

    if (defaultDisplayList.includes(item.opType)) return '--';
    if (trxSymbolList.includes(item.opType) && !item?.currTrx) return '--';
    if (usdjSymbolList.includes(item.opType) && !item?.currUsdj) return '--';

    const tokenAmount = trxSymbolList.includes(item.opType)
      ? item.currTrx
      : usdjSymbolList.includes(item.opType)
      ? item.currUsdj
      : '--';
    const symbol = trxSymbolList.includes(item.opType) ? 'TRX' : usdjSymbolList.includes(item.opType) ? 'USDJ' : '--';
    const cdpDecimal = 3;

    return (
      <div className={'token-amount ' + (currentSign === '+' ? 'green' : currentSign === '-' ? 'red' : '')}>
        <span>{currentSign}</span>
        <span>{formatNumber(tokenAmount, cdpDecimal, { miniText: '0.000001', round: true })}</span>
        {/* {showEllipsis(tokenAmount, cdpDecimal) && (
          <Tooltip
            overlayClassName="user-records-tooltip"
            title={formatNumber(tokenAmount, { round: true, roundMode: 'ROUND_HALF_UP' })}
            arrowPointAtCenter
            placement="top"
          >
            {'...'}
          </Tooltip>
        )} */}
        <span>{' ' + (symbol || '--')}</span>
      </div>
    );
  };

  renderOpType = (text, item) => {
    return (
      <div className="flex-center action">
        {item?.status && (
          <span className={'icon mr-10 ' + (item.status === 1 ? 'loading' : item.status === 2 ? 'success' : '')}></span>
        )}
        <div>
          <div>
            <span className="mr-10">{this.getContextFromOpType(text)}</span>
            {/* <span className='des'>{`CDP#${item.cdpId}`}</span> */}
          </div>
          <div className="cdp-time">
            {item?.blockTimestamp
              ? new Date(item.blockTimestamp).format('yyyy-MM-dd h:m:s')
              : item?.blocktimestamp
              ? new Date(item.blocktimestamp).format('yyyy-MM-dd h:m:s')
              : '--'}
          </div>
        </div>
      </div>
    );
  };

  getInfoColumns = () => {
    const usdDecimal = 2;
    let columns = [
      {
        title: '',
        dataIndex: 'opType',
        key: '1',
        ellipsis: true,
        fixed: 'left',
        width: '46%',
        className: 'opType',
        render: (text, item) => {
          if (item?.cdpFirst) {
            return (
              <div>
                <div className="first-title">{intl.get('cdp_records.cdp_number', { number: item.cdpId })}</div>
                {this.renderOpType(text, item)}
              </div>
            );
          }
          return this.renderOpType(text, item);
        }
      },
      {
        title: '',
        dataIndex: 'tokenAmount',
        align: 'left',
        key: '3',
        render: (text, item) => {
          const usdList = [3, 4, 5, 6];
          const defaultDisplayList = [1, 2, 8];
          return (
            <div className="fw500">
              {item?.cdpFirst && <div className="first-title"></div>}
              <div className={'action ' + (defaultDisplayList.includes(item.opType) ? 'default' : '')}>
                {this.renderTokenAmount(item)}
                {usdList.includes(item.opType) && (
                  <div className="associate-usd">
                    {formatNumber(item.currUsd, usdDecimal, {
                      cutZero: true,
                      needDolar: true,
                      miniText: '0.01'
                    })}
                  </div>
                )}
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
        render: (text, item) => (
          <div>
            {item?.cdpFirst && <div className="first-title"></div>}
            <div className="action arrow">
              <span className="link-arrow"></span>
            </div>
          </div>
        )
      }
    ];
    return columns;
  };

  getPageContent = currentPageNumber => {
    this.props.userRecords.setData({ currentPageNumber });
    this.props.userRecords.getCDPRecordsData();
  };

  setClassName = item => {
    if (item.cdpFirst) return 'cdp-first';
    if (item.cdpLast) return 'cdp-last';
    return '';
  };

  render() {
    const { CDPRecords, CDPTotalCount, pageSize } = this.props.userRecords;
    return (
      <Table
        className="user-records-table cdp"
        columns={this.getInfoColumns()}
        showHeader={false}
        onRow={record => {
          return {
            onClick: () => {
              tableClickRowToTransaction(record?.txId, 'userRecord');
            }
          };
        }}
        dataSource={CDPRecords}
        pagination={
          BigNumber(CDPTotalCount).gt(pageSize)
            ? {
                total: CDPTotalCount,
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
        rowClassName={this.setClassName}
      />
    );
  }
}

export default CDPRecords;
