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
  BigNumber,
  actionTypeTransfer
} from '../../../utils/helper';
import { getAuthorizedMaximumNumberOfImpressions } from '../utils/config';
import { formatTokenAmount, formatFiatValue } from '../../../utils/formatters';
import '../../../assets/css/userRecords.scss';
import Config from '../../../config/v2config';

const { tokens } = Config;
const { WTRX: WTRXAddress } = tokens;

@inject('network')
@inject('userRecords')
@observer
class SBMV2tRecords extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mobile: isMobile(window.navigator).any
    };
  }

  getInfoColumns = () => {
    const { mobile } = this.state;
    const { userRecords } = this.props;
    let columns = [
      {
        title: intl.get('jlv2.record.time'),
        dataIndex: 'blockTimestamp',
        align: 'left',
        fixed: 'left',
        width: '15%',
        render: (text, item) => {
          return <div className="time">{text ? new Date(text).format('yyyy-MM-dd h:m:s') : '--'}</div>;
        }
      },
      {
        title: intl.get('jlv2.record.protocol'),
        dataIndex: 'protocol',
        align: 'left',
        width: '20%',
        render: (text, item) => {
          if (mobile) {
            return (
              <Tooltip
                overlayClassName="j-tooltip-dropdown"
                title={text}
                trigger="['hover','click']"
                placement="top"
                arrowPointAtCenter
              >
                <div
                  className='ellipsis v2-protocol'
                  onClick={e => {e.preventDefault(); e.stopPropagation()}}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {text}
                </div>
              </Tooltip>
            )
          } else {
            return <div>{text}</div>;
          }
        }
      },
      {
        title: intl.get('jlv2.record.operation'),
        dataIndex: 'actionType',
        ellipsis: true,
        width: '12%',
        className: 'actionType',
        render: (text, item) => {
          return (
            <div className="mobile-card">
              {mobile && <span>{intl.get('jlv2.record.operation')}</span>}
              <div className="flex-center">
                {item?.status && (
                  <span
                    className={'icon mr-10 ' + (item.status === 1 ? 'loading' : item.status === 2 ? 'success' : '')}
                  ></span>
                )}
                {
                  ['Liquidate', 'Liquidated'].includes(text) ? actionTypeTransfer(text) : (
                    <span>
                      {`${actionTypeTransfer(text)} ${item.tokenAddress === WTRXAddress
                        ? 'TRX'
                        : actionTypeTransfer(text) === 'Collateral'
                          ? item.collateralSymbol
                          : item.tokenSymbol
                      }`}
                    </span>
                  )
                }
              </div>
            </div>
          );
        }
      },
      {
        title: intl.get('jlv2.record.amount'),
        dataIndex: 'amount',
        align: 'left',
        width: '18%',
        render: (text, item) => (
          <div className="mobile-card">
            {mobile && <span>{intl.get('jlv2.record.amount')}</span>}
            <div>
              <div className="token-amount">
                <span>
                  {['VaultApproval', 'TokenMoolahApproval', 'TokenVaultApproval'].includes(item.actionType) &&
                    BigNumber(item.tokenAmount).gt(getAuthorizedMaximumNumberOfImpressions())
                    ? intl.get('supply_and_borrow_records.no_limit')
                    : formatTokenAmount(item.tokenAmount, item.tokenAddress === WTRXAddress && !['Liquidate', 'Liquidated'].includes(item.actionType) ? 'TRX' : item.tokenSymbol)}
                </span>
              </div>
              {!['VaultApproval', 'TokenMoolahApproval', 'TokenVaultApproval'].includes(item.actionType) && (
                <div className={"associate-usd" + (mobile ? ' tar' : '')}>{formatFiatValue(item.associateUsd)}</div>
              )}
            </div>
          </div>
        )
      },
      {
        title: intl.get('jlv2.record.associated_address'),
        dataIndex: 'counterparty',
        align: 'left',
        width: '20%',
        render: (text, item) => {
          return mobile ? (
            <div className="mobile-card">
              {mobile && <span>{intl.get('jlv2.record.associated_address')}</span>}
              {!text ? '-' : cutMiddle(text, 10, 10)}
            </div>
          ) : (
            <div className="mobile-card">{text || '-'}</div>
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
                this.props.userRecords.handleToDetail('SBMV2', item);
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
    this.props.userRecords.getSBMV2RecordsData();
  };

  render() {
    const { SBMV2Records, SBMV2TotalCount, pageSize } = this.props.userRecords;
    return (
      <Table
        className="user-records-table"
        columns={this.getInfoColumns()}
        onRow={record => {
          if (this.state.mobile) return;
          return {
            onClick: () => {
              this.props.userRecords.handleToDetail('SBMV2', record);
            }
          };
        }}
        dataSource={SBMV2Records}
        pagination={
          BigNumber(SBMV2TotalCount).gt(pageSize)
            ? {
              total: SBMV2TotalCount,
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

export default SBMV2tRecords;
