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
import { formatTokenAmount, formatFiatValue } from '../../../utils/formatters';
import '../../../assets/css/userRecords.scss';

@inject('network')
@inject('userRecords')
@observer
class StrxRecords extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mobile: isMobile(window.navigator).any
    };
  }
  componentDidMount = async () => {};

  getContextFromOpType = opType => {
    const actions = {
      '1': intl.get('jlv2.record.stake'),
      '2': intl.get('jlv2.record.unstake'),
      '4': intl.get('jlv2.record.withdraw1'),
      '5': intl.get('jlv2.record.send1'),
      '6': intl.get('jlv2.record.receive2')
    };
    return actions[opType];
  };

  renderTokenAmount = item => {
    const { mobile } = this.state;
    const { tokenDecimal } = this.props.userRecords;
    const positiveSignList = [1, 4, 6];
    const negativeSignList = [2, 5];
    const trxSymbolList = [4];
    const strxSymbolList = [1, 2, 5, 6];
    const currentSign = positiveSignList.includes(item.opType)
      ? '+'
      : negativeSignList.includes(item.opType)
      ? '-'
      : '';

    if (!item.amount) return '--';

    return (
      <div className="token-amount">
        <span>
          {formatTokenAmount(
            item.amount,
            trxSymbolList.includes(item.opType) ? 'TRX' : strxSymbolList.includes(item.opType) ? 'sTRX' : '--'
          )}
        </span>
        {/* <span>{formatNumber(item.amount, tokenDecimal, { miniText: '0.000001' })}</span>
        {showEllipsis(item.amount, tokenDecimal) && (
          <Tooltip
            overlayClassName="user-records-tooltip"
            title={formatNumber(item.amount)}
            arrowPointAtCenter
            placement={mobile ? 'topLeft' : 'top'}
          >
            {'...'}
          </Tooltip>
        )}
        <span>
          {' ' + (trxSymbolList.includes(item.opType) ? 'TRX' : strxSymbolList.includes(item.opType) ? 'sTRX' : '--')}
        </span> */}
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
        render: (text, item) => 'Staked TRX'
      },
      {
        title: intl.get('jlv2.record.operation'),
        dataIndex: 'opType',
        ellipsis: true,
        width: '25%',
        className: 'opType',
        render: (text, item) => {
          const showDescriptionList = [5, 6];
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
                  showDescriptionList.includes(item.opType) ? (
                    <Tooltip
                      overlayClassName="j-tooltip-dropdown"
                      title={
                        item.opType === 6
                          ? intl.get('action_records_hover.received_strx')
                          : item.opType === 5
                          ? intl.get('action_records_hover.sent_strx')
                          : ''
                      }
                      placement="topRight"
                      arrowPointAtCenter
                    >
                      <span className="underline-dashed">{this.getContextFromOpType(text)}</span>
                    </Tooltip>
                  ) : (
                    <span className="mr-10">{this.getContextFromOpType(text)}</span>
                  )
                ) : (
                  <>
                    <span className="mr-10">{this.getContextFromOpType(text)}</span>
                    {showDescriptionList.includes(item.opType) && (
                      <Tooltip
                        overlayClassName="j-tooltip-dropdown"
                        title={
                          item.opType === 6
                            ? intl.get('action_records_hover.received_strx')
                            : item.opType === 5
                            ? intl.get('action_records_hover.sent_strx')
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
        dataIndex: 'amount',
        align: 'left',
        render: (text, item) => (
          <div className="mobile-card">
            {mobile && <span>{intl.get('user_records.amount')}</span>}
            <div >
              {this.renderTokenAmount(item)}
              <div className={"associate-usd" + (mobile ? ' tar' : '')}>
                {formatFiatValue(item.usd)}
                {/* {formatNumber(item.usd, 2, {
                  cutZero: true,
                  needDolar: true,
                  miniText: '0.01'
                })} */}
              </div>
            </div>
          </div>
        )
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
                this.props.userRecords.handleToDetail('Strx', item);
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
    this.props.userRecords.getStrxRecordsData();
  };

  render() {
    const { strxRecords, strxTotalCount, pageSize } = this.props.userRecords;
    return (
      <Table
        className="user-records-table"
        columns={this.getInfoColumns()}
        onRow={record => {
          if(this.state.mobile) return ;
          return {
            onClick: () => {
              this.props.userRecords.handleToDetail('Strx', record);
            }
          };
        }}
        dataSource={strxRecords}
        pagination={
          BigNumber(strxTotalCount).gt(pageSize)
            ? {
                total: strxTotalCount,
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
        rowKey={record => record.txId}
      />
    );
  }
}

export default StrxRecords;
