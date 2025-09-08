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

@inject('lend')
@inject('network')
@inject('userRecords')
@observer
class VoteRecords extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mobile: isMobile(window.navigator).any
    };
  }
  componentDidMount = async () => {};

  getContextFromOpType = (opType, proposalId) => {
    const { lang } = this.props.lend;
    let proposalDetailLink = `/voteDetailNew?proposalId=${proposalId}&lang=${lang}`;
    if (!proposalId) proposalDetailLink = `/voteNew?lang=${lang}`;
    const actions = {
      '1': intl.get('vote_records.get_votes'),
      '2': (
        <div>
          {intl.get('vote_records.vote_for_proposal')}
          <a href={proposalDetailLink} className="to-proposal-detail hover" target="proposalDetail">
            {intl.get('vote_records.proposal', { number: proposalId || '--' })}
          </a>
        </div>
      ),
      '3': (
        <div>
          {intl.get('vote_records.vote_against_for_proposal')}
          <a href={proposalDetailLink} className="to-proposal-detail hover" target="proposalDetail">
            {intl.get('vote_records.proposal', { number: proposalId || '--' })}
          </a>
        </div>
      ),
      '4': (
        <div>
          {intl.get('vote_records.recycle_prefix')}
          <a href={proposalDetailLink} className="to-proposal-detail hover" target="proposalDetail">
            {intl.get('vote_records.proposal', { number: proposalId || '--' })}
          </a>
          {intl.get('vote_records.recycle_suffix')}
        </div>
      ),
      '5': intl.get('vote_records.convert_proposal'),
      '6': intl.get('vote_records.convert_to_jst')
    };
    return actions[opType];
  };

  renderTokenAmount = item => {
    const { mobile } = this.state;
    const { tokenDecimal } = this.props.userRecords;
    const voteTextList = [1, 2, 3, 4];
    const invalidTextList = [5];
    const jstTextList = [6];

    if (!item.amount) return '--';

    return (
      <div>
        <span>{formatNumber(item.amount, tokenDecimal, { miniText: '0.000001' })}</span>
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
          {' ' +
            (voteTextList.includes(item.opType)
              ? intl.get('vote_records.vote_amount', { amount: '' })
              : invalidTextList.includes(item.opType)
              ? intl.get('vote_records.invalid_vote_amount', { amount: '' })
              : jstTextList.includes(item.opType)
              ? 'JST'
              : '--')}
        </span>
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
          return (
            <div className="flex-center">
              {item?.status && (
                <span
                  className={'icon mr-10 ' + (item.status === 1 ? 'loading' : item.status === 2 ? 'success' : '')}
                ></span>
              )}
              <span className="mr-10">{this.getContextFromOpType(text, item?.proposalId)}</span>
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
        dataIndex: 'amount',
        align: 'left',
        key: '3',
        render: (text, item) => (
          <div className="mobile-card">
            {mobile && <span>{intl.get('user_records.amount')}</span>}
            <div className="detail">
              <div className="token-amount">{this.renderTokenAmount(item)}</div>
            </div>
          </div>
        )
      },
      {
        title: '',
        dataIndex: 'txId',
        width: 80,
        key: '5',
        render: (text, item) => <span className="link-arrow"></span>
      }
    ];
    return columns;
  };

  getPageContent = currentPageNumber => {
    this.props.userRecords.setData({ currentPageNumber });
    this.props.userRecords.getVoteRecordsData();
  };

  clickRow = (e, txId, target) => {
    try {
      if (e?.target?.className?.indexOf('to-proposal-detail') === -1) {
        tableClickRowToTransaction(txId, target);
      }
    } catch (e) {
      console.log(e);
    }
  };

  render() {
    const { voteRecords, voteTotalCount, pageSize } = this.props.userRecords;
    return (
      <Table
        className="user-records-table"
        columns={this.getInfoColumns()}
        onRow={record => {
          return {
            onClick: e => {
              this.clickRow(e, record?.txId, 'userRecord');
            }
          };
        }}
        dataSource={voteRecords}
        pagination={
          BigNumber(voteTotalCount).gt(pageSize)
            ? {
                total: voteTotalCount,
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

export default VoteRecords;
