import React from 'react';
import { observer } from 'mobx-react';
import intl from 'react-intl-universal';
import { Drawer } from 'antd';
import Store from '../../../stores';
import {
  formatNumber,
  showEllipsis,
  tableClickRowToTransaction,
  clickRowToAddress,
  cutMiddle,
  BigNumber,
  actionTypeTransfer,
  getLiquidJTokenLogo,
} from '../../../utils/helper';
import { getAuthorizedMaximumNumberOfImpressions } from '../utils/config';
import { formatTokenAmount, formatFiatValue } from '../../../utils/formatters';
import { getLendIcons } from '../../../utils/constant';

const PROTOCOL_MAP = {
  SBMV1: 'SBM V1',
  Strx: 'Staked TRX',
  Rent: 'Energy Rental',
  Vote: 'Governance'
};

const RecordDetail = observer(() => {
  const { userRecords, network, lend } = Store;
  const { detailInfo, detailOpen } = userRecords;
  const { recordType, actionType, opType } = detailInfo;
  let lang = window.localStorage.getItem('lang') || 'en-US';

  const onClose = () => {
    userRecords.closeDetailModal();
  };

  const transferWtrx = symbol => {
    if (!symbol) return '-';

    return symbol === 'WTRX' ? 'TRX' : symbol;
  };

  const getSBMV1ActionType = (actionType, { symbol }) => {
    symbol = transferWtrx(symbol);
    const actions = {
      '1': intl.get('supply_and_borrow_records.supply') + ' ' + symbol,
      '2': intl.get('supply_and_borrow_records.withdraw') + ' ' + symbol,
      '3': intl.get('supply_and_borrow_records.borrow') + ' ' + symbol,
      '4': intl.get('supply_and_borrow_records.repay') + ' ' + symbol,
      '5': intl.get('jlv2.record.liquidate_reward'),
      '6': intl.get('jlv2.record.as_liquidator'),
      '7': intl.get('supply_and_borrow_records.receive_jtoken'),
      '8': intl.get('supply_and_borrow_records.send_jtoken'),
      '9': intl.get('supply_and_borrow_records.approve', { title: symbol || '--' }),
      '10': intl.get('supply_and_borrow_records.enable_collateral', { title: symbol || '--' }),
      '11': intl.get('supply_and_borrow_records.disable_collateral', { title: symbol || '--' })
    };
    return actions[actionType];
  };

  const getStrxActionType = opType => {
    const actions = {
      '1': intl.get('jlv2.record.stake'),
      '2': intl.get('jlv2.record.unstake'),
      '4': intl.get('jlv2.record.withdraw1'),
      '5': intl.get('jlv2.record.send1'),
      '6': intl.get('jlv2.record.receive2')
    };
    return actions[opType];
  };

  const getRentActionType = actionType => {
    const actions = {
      '1': intl.get('jlv2.record.rent_energy'),
      '2': intl.get('jlv2.record.extend_rental'),
      '3': intl.get('jlv2.record.rent_more_energy'),
      '4': intl.get('jlv2.record.end_rental'),
      '5': intl.get('energy_rental_records.recycle')
    };
    return actions[actionType];
  };

  const getVoteActiontype = (opType, { proposalId }) => {
    let proposalDetailLink = `/voteDetailNew?proposalId=${proposalId}&lang=${lend.lang}`;
    if (!proposalId) proposalDetailLink = `/voteNew?lang=${lend.lang}`;
    const actions = {
      '1': intl.get('jlv2.record.get_vote'),
      '2': (
        <div>
          {intl.get('jlv2.record.vote_for')}
          <a href={proposalDetailLink} className="to-proposal-detail hover" target="_self">
            {intl.get('vote_records.proposal', { number: proposalId || '--' })}
          </a>
        </div>
      ),
      '3': (
        <div>
          {intl.get('jlv2.record.vote_against')}
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
      '5': intl.get('jlv2.record.convert_back_vote'),
      '6': intl.get('jlv2.record.convert_back_vote')
    };
    return actions[opType];
  };

  const getLiquidateActionType = (opType, { symbol, cdpId }) => {
    const actions = {
      '1': intl.get('liquidation_records.recycle_energy'), // plus, trx
      '2': intl.get('liquidation_records.liquidate_token'), // minus, usdt / token, jusdt / token
      '3': intl.get('liquidation_records.repay_token'), // plus, usdd / token
      '4': intl.get('liquidation_records.liquidate_cdp', { number: cdpId || '--' }), // minus, trx / token
      '5': intl.get('liquidation_records.repay_cdp', { number: cdpId || '--' }) // plus, usdj / token
    };
    return actions[opType];
  };

  const getProtocol = () => {
    if (recordType === 'SBMV2') {
      return detailInfo.protocol;
    }
    if (recordType === 'Liquidate') {
      return detailInfo.opType === 1 ? PROTOCOL_MAP['Rent'] : PROTOCOL_MAP['SBMV1'];
    }
    return PROTOCOL_MAP[recordType];
  };

  const getActionType = () => {
    if (recordType === 'SBMV1') {
      return getSBMV1ActionType(actionType, detailInfo);
    }
    if (recordType === 'SBMV2') {
      return actionTypeTransfer(actionType) + (['Liquidate', 'Liquidated'].includes(actionType) ? '' : ` ${transferWtrx(detailInfo.tokenSymbol)}`);
    }
    if (recordType === 'Strx') {
      return getStrxActionType(opType);
    }
    if (recordType === 'Rent') {
      return getRentActionType(actionType);
    }
    if (recordType === 'Vote') {
      return getVoteActiontype(opType, detailInfo);
    }
    if (recordType === 'Liquidate') {
      return getLiquidateActionType(opType, detailInfo);
    }
    return actionType;
  };

  const baseContent = [
    {
      label: intl.get('jlv2.record.detal_hash'),
      value: (
        <div className="flex aic">
          <span>{cutMiddle(detailInfo.txId, 15, 15)}</span>
          <span onClick={() => tableClickRowToTransaction(detailInfo.txId, detailInfo.txId)} className="link-to"></span>
        </div>
      )
    },
    {
      label: intl.get('jlv2.record.time'),
      value: (
        <span>
          {new Date(detailInfo.blockTimestamp).format('yyyy-MM-dd h:m:s')}
          {' (Local)'}
        </span>
      )
    },
    {
      label: intl.get('jlv2.record.protocol'),
      value: getProtocol()
    },
    {
      label: intl.get('index.my_operating'),
      value: getActionType()
    },
    {
      label: intl.get('jlv2.record.owner_address'),
      value: (
        <div className="flex aic">
          <span className="owner-address">{cutMiddle(network.defaultAccount, 6, 6)}</span>
          <span
            onClick={() => clickRowToAddress(network.defaultAccount, network.defaultAccount)}
            className="link-to"
          ></span>
        </div>
      )
    }
  ];

  const baseItem = (item, index) => (
    <div className="record-detail-item" key={index}>
      <div className="label">{item.label}</div>
      <div className="value">{item.value}</div>
    </div>
  );

  const amountContent = (label, { tokenAmount, tokenSymbol, associateUsd, isJToken }) => (
    <div className="record-detail-item">
      <div className="label">{label}</div>
      {['VaultApproval', 'TokenMoolahApproval', 'TokenVaultApproval'].includes(detailInfo.actionType) &&
      BigNumber(detailInfo.tokenAmount).gt(getAuthorizedMaximumNumberOfImpressions()) ? (
        <div className="value"> {intl.get('supply_and_borrow_records.no_limit')} </div>
      ) : (
        <div className="value">
          <div className="flex-center">
            <img className="token-icon" src={isJToken ? getLiquidJTokenLogo(tokenSymbol) : getLendIcons(tokenSymbol, true)} alt="" width={16} height={16} />
            {/* <img className="token-icon" src={TRX} alt="" width={16} height={16} /> */}
            <span className="token-amount">{tokenAmount}</span>
            <span className="token-symbol">{tokenSymbol}</span>
          </div>
          {!['VaultApproval', 'TokenMoolahApproval', 'TokenVaultApproval'].includes(detailInfo.actionType) &&
            associateUsd && <div className="token-usd">≈ {associateUsd}</div>}
        </div>
      )}
    </div>
  );

  const doNotDisplayList = [10, 11];
  const noLimitList = [9];
  const useJTokenSymbolList = [5, 7, 8];
  const manuallyAddJSymbolList = [7, 8];
  const approvalList = [9, 10, 11]

  return (
    <Drawer
      title={
        <div className="pr">
          <div className="detail-title">{intl.get('jlv2.record.transaction_detail')}</div>
          <div className="detail-desc">
            {recordType === 'Vote' ? (
              <>
                {lang === 'en-US' ? (
                  <>
                    {getActionType()} {intl.get('jlv2.record.action_in_type_vote', { protocol: getProtocol() })}
                  </>
                ) : (
                  <>
                    {intl.getHTML('jlv2.record.action_in_type_vote', { protocol: getProtocol() })} {getActionType()}{' '}
                  </>
                )}
              </>
            ) : (
              intl.getHTML('jlv2.record.action_in_type', { protocol: getProtocol(), action: getActionType() })
            )}
          </div>
          <div className="detail-close" onClick={onClose}></div>
        </div>
      }
      width={550}
      className={'record-detail-drawer' + (lend.theme === 'white' ? ' white' : '')}
      placement={'right'}
      closable={false}
      onClose={onClose}
      visible={detailOpen}
    >
      {baseContent.map(baseItem)}
      {}
      {}
      {/* {((recordType === 'SBMV1' && [1, 2, 3, 4].includes(actionType)) || (recordType === 'Strx' && opType === 1)) && (
        <>
          {amountContent('Amount of expenditure', {
            tokenAmount: '0.000000',
            tokenSymbol: 'USDT',
            associateUsd: '0.00'
          })}
          {amountContent('Amount of income', { tokenAmount: '0.000000', tokenSymbol: 'USDT', associateUsd: '0.00' })}
        </>
      )} */}
      {}

      {recordType === 'SBMV1' && (
        doNotDisplayList.includes(actionType) ? (
          baseItem(
            {
              label: intl.get('jlv2.record.amount'),
              value: (
                <div className="flex aic">
                  <span>-</span>
                </div>
              )
            },
            'receiveAddress'
          )
        ) : noLimitList.includes(actionType) && BigNumber(detailInfo.tokenAmount).gt(9999999) ? (
          baseItem(
            {
              label: intl.get('jlv2.record.amount'),
              value: (
                <div className="flex aic">
                  <span>{intl.get('supply_and_borrow_records.no_limit')}</span>
                </div>
              )
            },
            'receiveAddress'
          )
        ) : !detailInfo.tokenAmount && !detailInfo.jtokenAmount ? (
          baseItem(
            {
              label: intl.get('jlv2.record.amount'),
              value: (
                <div className="flex aic">
                  <span>-</span>
                </div>
              )
            },
            'receiveAddress'
          )
        ) : useJTokenSymbolList.includes(actionType) ? (
          amountContent(intl.get('jlv2.record.amount'), {
            tokenAmount: formatTokenAmount(detailInfo.jtokenAmount),
            tokenSymbol: transferWtrx((manuallyAddJSymbolList.includes(actionType) ? 'j' : '') + (detailInfo.symbol || '--')),
            associateUsd: approvalList.includes(actionType) ? '' : formatFiatValue(detailInfo.associateUsd),
            isJToken: true 
          })
        ) : amountContent(intl.get('jlv2.record.amount'), {
            tokenAmount: formatTokenAmount(detailInfo.tokenAmount),
            tokenSymbol: transferWtrx(detailInfo.symbol),
            associateUsd: approvalList.includes(actionType) ? '' : formatFiatValue(detailInfo.associateUsd)
          }))}
      
      {}
      {/* ['Supply', 'Withdraw', 'Borrow', 'Repay', 'Collateral', 'Approve', 'Redeem', 'Send', 'Recieve'].includes(
        actionTypeTransfer(actionType)
      ) */}
      {recordType === 'SBMV2' && !['Liquidate', 'Liquidated'].includes(actionType) && (
        <>
          {amountContent(intl.get('jlv2.record.amount'), {
            tokenAmount: formatTokenAmount(detailInfo.tokenAmount),
            tokenSymbol: transferWtrx(detailInfo.tokenSymbol),
            associateUsd: formatFiatValue(detailInfo.associateUsd),
            actionType: detailInfo.actionType
          })}
        </>
      )}
      {}
      {recordType === 'Strx' && (
        <>
          {amountContent(intl.get('jlv2.record.amount'), {
            tokenAmount: formatTokenAmount(detailInfo.amount),
            tokenSymbol: detailInfo.opType == 4 ? 'TRX' : 'sTRX',
            associateUsd: formatFiatValue(detailInfo.usd)
          })}
        </>
      )}

      {}
      {/* {((recordType === 'SBMV1' && [5, 6].includes(actionType)) || */}
      {recordType === 'SBMV2' && ['Liquidate', 'Liquidated'].includes(actionType) && (
        <>
          {baseItem(
            {
              label: intl.get('jlv2.record.liquidate_address'),
              value: (
                <div className="flex aic">
                  <span className="owner-address">{cutMiddle(detailInfo.counterparty, 6, 6)}</span>
                  <span
                    onClick={() => clickRowToAddress(detailInfo.counterparty, 'userRecord')}
                    className="link-to"
                  ></span>
                </div>
              )
            },
            'liquidatedAddress'
          )}
          {amountContent(intl.get('jlv2.record.repaid'), {
            tokenAmount: formatTokenAmount(detailInfo.tokenAmount),
            tokenSymbol: detailInfo.tokenSymbol,
            associateUsd: formatFiatValue(detailInfo.associateUsd)
          })}
          {amountContent(intl.get('jlv2.record.collateral_liquidate'), {
            tokenAmount: formatTokenAmount(detailInfo.collateralAmount),
            tokenSymbol: detailInfo.collateralSymbol,
            associateUsd: formatFiatValue(detailInfo.collateralUsd)
          })}
        </>
      )}
      {}
      {recordType === 'Rent' && (
        <>
          {baseItem(
            {
              label: intl.get('jlv2.record.receive_address'),
              value: (
                <div className="flex aic">
                  <span>{cutMiddle(detailInfo.receiver, 6, 6)}</span>
                  <span onClick={() => clickRowToAddress(detailInfo.receiver, 'userRecord')} className="link-to"></span>
                </div>
              )
            },
            'receiveAddress'
          )}
          {baseItem({
            label: [1, 2, 3].includes(actionType)
              ? intl.get('jlv2.record.delegate_via_rental')
              : intl.get('jlv2.record.reclaim_by_ending_rental'),
            value: BigNumber(detailInfo.delegateTrxAmount).isNaN() ? (
              '-'
            ) : (
              <span>{`${formatTokenAmount(detailInfo.delegateTrxAmount)} TRX`}</span>
            )
          })}
          {amountContent(
            [1, 2, 3].includes(actionType)
              ? intl.get('jlv2.record.security_deposit')
              : intl.get('jlv2.record.security_deposit_returned'),
            {
              tokenAmount: formatTokenAmount(detailInfo.securityDeposit),
              tokenSymbol: 'TRX',
              associateUsd: formatFiatValue(detailInfo.rentUsd)
            }
          )}
        </>
      )}
      {}
      {recordType === 'Liquidate' && (
        <>
          {amountContent(intl.get('jlv2.record.amount'), {
            tokenAmount: formatTokenAmount(detailInfo.amount),
            tokenSymbol: transferWtrx(detailInfo.symbol),
            associateUsd: formatFiatValue(detailInfo.usd),
            isJToken: detailInfo.opType == 2 
          })}
        {/* {amountContent('Liquidation Fee', { tokenAmount: '20', tokenSymbol: 'TRX', associateUsd: '6.62' })}
          {baseItem({
            label: 'Return delegate amount',
            value: <span>{'100,000 TRX delegated'}</span>
          })}
          {amountContent('Return security deposit', {
            tokenAmount: '1,200.123456',
            tokenSymbol: 'TRX',
            associateUsd: '832.34'
          })} */}
        </>
      )}
      {}
      {/* {recordType === 'SBMV1' &&
        [5, 7, 8].includes(actionType) &&
        amountContent(intl.get('jlv2.record.amount'), {
          isJToken: actionType == 5,
          tokenAmount: formatTokenAmount(detailInfo.jtokenAmount),
          tokenSymbol: transferWtrx(detailInfo.symbol),
          associateUsd: formatFiatValue(detailInfo.associateUsd)
        })
      } */}
      {}
      {}
      {/* {recordType === 'SBMV1' &&
        ![5, 7, 8, 9].includes(actionType) &&
        amountContent(intl.get('jlv2.record.amount'), {
          tokenAmount: formatTokenAmount(detailInfo.tokenAmount),
          tokenSymbol: transferWtrx(detailInfo.symbol),
          associateUsd: formatFiatValue(detailInfo.associateUsd)
        })
      } */}
      {}
      {recordType === 'Vote' &&
        baseItem(
          {
            label: intl.get('jlv2.record.vote_amount'),
            value: (
              <div className="flex aic">
                <span>{formatTokenAmount(detailInfo.amount)} WJST</span>
              </div>
            )
          },
          'receiveAddress'
        )}
      {}
      {/* {recordType === 'Vote' &&
        [2, 3, 4].includes(opType) &&
        amountContent(intl.get("jlv2.record.vote_amount"), {
          tokenAmount: formatTokenAmount(detailInfo.amount),
          tokenSymbol: 'JST',
          associateUsd: ''
        })} */}
      {}
      {/* {recordType === 'Vote' &&
        [1, 5, 6].includes(opType) &&
        <>
          {amountContent('Repay amount', { tokenAmount: formatTokenAmount(detailInfo.amount), tokenSymbol: 'JST', associateUsd: '' })}
          {amountContent('Receive amount', { tokenAmount: formatTokenAmount(detailInfo.amount), tokenSymbol: 'JST', associateUsd: '' })}
        </>
      } */}
    </Drawer>
  );
});

export default RecordDetail;
