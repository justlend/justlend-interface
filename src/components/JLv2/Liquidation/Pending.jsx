import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import intl from 'react-intl-universal';
import isMobile from 'ismobilejs';
import { Tooltip, Skeleton } from 'antd';
import Store from '../../../stores';
import {
  formatApyRate,
  formatDecimalNumber,
  formatFiatValue,
  formatTokenAmount,
  isTrxToken
} from '../../../utils/formatters';
import { cutMiddle, formatNumber, emptyReactNodeNew, BigNumber } from '../../../utils/helper';
import { getIconsJLv2 } from '../../../utils/constant';
import LiquidationBox from './LiquidationBox';

export const PendingList = observer(() => {
  const [mobile] = useState(isMobile(window.navigator).any);

  const { liquidationV2 } = Store;
  const {
    pendingLiquidationList, sortKey, sort, handleSort, liquidationBoxVisible,
    setLiquidationDetail, liquidationDetail, listLoading, setLiquidationBoxVisible
  } = liquidationV2;

  useEffect(() => {
    setLiquidationBoxVisible(false);
  }, []);

  const handleLiquidationModal = (data) => {
    setLiquidationDetail(data);
    setLiquidationBoxVisible(true);
  };

  const handleModalClose = () => {
    setLiquidationDetail(null);
    setLiquidationBoxVisible(false);
  };

  // loading skeleton
  if (listLoading) {
    return (
      <div className="liquidationv2-list liquidationv2-skeleton">
        <Skeleton active title={false} paragraph={{ rows: 10, width: '100%' }} />
      </div>
    )
  }

  let mainContent;

  if (mobile) {
    mainContent = (
      <div className="liquidationv2-mobile-list">
        {
          pendingLiquidationList?.length ?
            pendingLiquidationList.map((item, index) => (
              <div className="list-box" key={index}>
                <div className="list-box-item">
                  <span className='list-box-label'>{intl.get('jlv2.liquidation.table_colleral')}</span>
                  <div className='list-box-item-value'>
                    <div>
                      <img className='token-icon' src={getIconsJLv2(item.collateralSymbol)} />
                      {formatTokenAmount(item.collateralAmount, item.collateralSymbol)}
                    </div>
                    <div className="row-usd">{formatFiatValue(item.collateralUsd)}</div>
                  </div>
                </div>
                <div className="list-box-item">
                  <span className='list-box-label'>{intl.get('jlv2.liquidation.table_debt')}</span>
                  <div className='list-box-item-value'>
                    <div>
                      <img className='token-icon' src={getIconsJLv2(item.borrowSymbol)} />
                      {formatTokenAmount(item.borrowAmount, item.borrowSymbol)}
                    </div>
                    <div className="row-usd">{formatFiatValue(item.borrowUsd)}</div>
                  </div>
                </div>
                <div className="list-box-item">
                  <div>
                    <Tooltip
                      trigger={['click']}
                      overlayClassName="j-tooltip-dropdown"
                      title={
                        <>
                          <div>{intl.get('jlv2.liquidation.table_risk_level_desc1')}</div>
                          <div>{intl.get('jlv2.liquidation.table_risk_level_desc2')}</div>
                          <div>{intl.get('jlv2.liquidation.table_risk_level_desc3')}</div>
                        </>
                      }
                      placement="topRight"
                      arrowPointAtCenter
                    >
                      <span className='list-box-label value-tooltip'>{intl.get('jlv2.liquidation.table_risk_level')}</span>
                    </Tooltip>
                  </div>
                  <div className='list-box-item-value'>
                    <div className={BigNumber(item.risk).gte(100) && item.allowPublic ? "c-FF2A43" : ''}>{formatApyRate(item.risk, true)?.replace('%', '')}</div>
                    <div className="row-usd">{formatApyRate(item.ltv)} / {formatApyRate(item.lltv)}</div>
                  </div>
                </div>
                <div className="list-box-item">
                  <Tooltip
                    trigger={['click']}
                    overlayClassName="j-tooltip-dropdown"
                    title={intl.get('jlv2.liquidation.table_lif_desc')}
                    placement="topRight"
                    arrowPointAtCenter
                  >
                    <span className='list-box-label value-tooltip'>{intl.get('jlv2.liquidation.table_lif')}</span>
                  </Tooltip>
                  <div className='list-box-item-value'>{formatDecimalNumber(item.lif, 4)}</div>
                </div>
                <div className="list-box-item">
                  <span className='list-box-label'>{intl.get('jlv2.liquidation.table_address')}</span>
                  <div className='list-box-item-value'>{cutMiddle(item.userAddress, 3, 3)}</div>
                </div>
                <div className="list-box-item">
                  {
                    !item.allowPublic ? (
                      <Tooltip
                        trigger={['click']}
                        overlayClassName="j-tooltip-dropdown"
                        title={intl.get('jlv2.liquidation.cannot_liquidate')}
                        placement="top"
                        arrowPointAtCenter
                      >
                        <div className="details-btn" onClick={() => handleLiquidationModal(item)}>{intl.get('jlv2.liquidation.table_button')}</div>
                      </Tooltip>
                    ) : (
                      <div className="details-btn" onClick={() => handleLiquidationModal(item)}>{intl.get('jlv2.liquidation.table_button')}</div>
                    )
                  }
                </div>
              </div>
            )) : emptyReactNodeNew()
        }
      </div>
    )
  } else {
    mainContent = (
      <div className="liquidationv2-list">
        <div className="list-header">
          <div className="list-row">
            <div className="list-td cursor-pointer" onClick={() => handleSort('collateral')}>
              {intl.get('jlv2.liquidation.table_colleral')}
              <div className="table-sort">
                <span className={'sort-asc' + (sortKey === 'collateral' && sort === 'asc' ? ' current' : '')}></span>
                <span className={'sort-desc' + (sortKey === 'collateral' && sort === 'desc' ? ' current' : '')}></span>
              </div>
            </div>
            <div className="list-td cursor-pointer" onClick={() => handleSort('debt')}>
              {intl.get('jlv2.liquidation.table_debt')}
              <div className="table-sort">
                <span className={'sort-asc' + (sortKey === 'debt' && sort === 'asc' ? ' current' : '')}></span>
                <span className={'sort-desc' + (sortKey === 'debt' && sort === 'desc' ? ' current' : '')}></span>
              </div>
            </div>
            <div className="list-td cursor-pointer" onClick={() => handleSort('riskLevel')}>
              <Tooltip
                trigger={['hover']}
                overlayClassName="j-tooltip-dropdown"
                title={
                  <>
                    <div>{intl.get('jlv2.liquidation.table_risk_level_desc1')}</div>
                    <div>{intl.get('jlv2.liquidation.table_risk_level_desc2')}</div>
                    <div>{intl.get('jlv2.liquidation.table_risk_level_desc3')}</div>
                  </>
                }
                placement="top"
                arrowPointAtCenter
              >
                <div className="value value-tooltip">{intl.get('jlv2.liquidation.table_risk_level')}</div>
              </Tooltip>
              <div className="table-sort">
                <span className={'sort-asc' + (sortKey === 'riskLevel' && sort === 'asc' ? ' current' : '')}></span>
                <span className={'sort-desc' + (sortKey === 'riskLevel' && sort === 'desc' ? ' current' : '')}></span>
              </div>
            </div>
            <div className="list-td cursor-pointer" onClick={() => handleSort('LIF')}>
              <Tooltip
                trigger={['hover']}
                overlayClassName="j-tooltip-dropdown"
                title={intl.get('jlv2.liquidation.table_lif_desc')}
                placement="top"
                arrowPointAtCenter
              >
                <div className="value value-tooltip">{intl.get('jlv2.liquidation.table_lif')}</div>
              </Tooltip>
              <div className="table-sort">
                <span className={'sort-asc' + (sortKey === 'LIF' && sort === 'asc' ? ' current' : '')}></span>
                <span className={'sort-desc' + (sortKey === 'LIF' && sort === 'desc' ? ' current' : '')}></span>
              </div>
            </div>
            <div className="list-td">{intl.get('jlv2.liquidation.table_address')}</div>
            <div className="list-td">{intl.get('jlv2.liquidation.table_action')}</div>
          </div>
        </div>
        <div className="list-body">
          {
            pendingLiquidationList?.length ?
              pendingLiquidationList.map((item, index) => (
                <div className="list-row" key={index}>
                  <div className="list-td">
                    <img src={getIconsJLv2(item.collateralSymbol)} alt={item.collateralSymbol} />
                    <div>
                      <div>{formatTokenAmount(item.collateralAmount, item.collateralSymbol)}</div>
                      <div className="row-usd">{formatFiatValue(item.collateralUsd)}</div>
                    </div>
                  </div>
                  <div className="list-td">
                    <img src={getIconsJLv2(item.borrowSymbol)} alt={item.borrowSymbol} />
                    <div>
                      <div>{formatTokenAmount(item.borrowAmount, item.borrowSymbol)}</div>
                      <div className="row-usd">{formatFiatValue(item.borrowUsd)}</div>
                    </div>
                  </div>
                  <div className="list-td">
                    <div>
                      <div className={BigNumber(item.risk).gte(100) && item.allowPublic ? "c-FF2A43" : ''}>{formatApyRate(item.risk, true)?.replace('%', '')}</div>
                      <div className="row-usd">{formatApyRate(item.ltv)} / {formatApyRate(item.lltv)}</div>
                    </div>
                  </div>
                  <div className="list-td">
                    <div>
                      <div>{formatDecimalNumber(item.lif, 4)}</div>
                    </div>
                  </div>
                  <div className="list-td">
                    <div>
                      <div>{cutMiddle(item.userAddress, 3, 3)}</div>
                    </div>
                  </div>
                  <div className="list-td">
                    {
                      !item.allowPublic ? (
                        <Tooltip
                          trigger={['hover']}
                          overlayClassName="j-tooltip-dropdown"
                          title={intl.get('jlv2.liquidation.cannot_liquidate')}
                          placement="top"
                          arrowPointAtCenter
                        >
                          <div className="details-btn" onClick={() => handleLiquidationModal(item)}>{intl.get('jlv2.liquidation.table_button')}</div>
                        </Tooltip>
                      ) : (
                        <div className="details-btn" onClick={() => handleLiquidationModal(item)}>{intl.get('jlv2.liquidation.table_button')}</div>
                      )
                    }
                  </div>
                </div>
              )) : emptyReactNodeNew()
          }
        </div>
      </div>
    )
  }

  return (
    <>
      {mainContent}
      <LiquidationBox
        visible={liquidationBoxVisible}
        data={liquidationDetail || {}}
        onClose={handleModalClose}
      />
    </>
  );
});
