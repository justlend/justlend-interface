import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import intl from 'react-intl-universal';
import isMobile from 'ismobilejs';
import { Link } from 'react-router-dom';
import { Tooltip } from 'antd';
import Store from '../../../stores';
import {
  formatApyRate,
  formatCompactFiatValue,
  formatFiatValue,
  formatTokenAmount,
  isTrxToken
} from '../../../utils/formatters';
import { cutMiddle, formatDate, formatNumber, emptyReactNodeNew, BigNumber } from '../../../utils/helper';
import { getIconsJLv2 } from '../../../utils/constant';
import Config from '../../../config'

export const BotList = observer(() => {
    const { tronscanUrl } = Config;
    const { network, lend, dashboardStore, liquidationV2 } = Store;
    const { botLiquidationList, getBotLiquidationInfo, sortKey, sort, handleSort } = liquidationV2;
    const [mobile] = useState(isMobile(window.navigator).any);
    // const [sortKey, setSortKey] = useState('');
    

    useEffect(() => {
        if(botLiquidationList === null) {
            getBotLiquidationInfo();
        }
    }, [botLiquidationList]);

  return (
    <div className="liquidationv2-list">
        <div className="list-header">
            <div className="list-row">
                <div className="list-td">Time</div>
                <div className="list-td">Seized Collateral</div>
                <div className="list-td">Repay Debt</div>
                <div className="list-td">Liquidated Address</div>
                <div className="list-td">Action</div>
            </div>
        </div>
        <div className="list-body">
            {botLiquidationList?.map(item => (
                <div className="list-row">
                    <div className="list-td">
                        <div>
                            <p>{formatDate(item.blockTimestamp, false, true)}</p>
                        </div>
                    </div>
                    <div className="list-td">
                        <img src={getIconsJLv2(item.collateralSymbol)} />
                        <div>
                            <p>{formatTokenAmount(item.collateralAmount)} {item.collateralSymbol}</p>
                            <p className="row-usd">{formatFiatValue(item.collateralUsd)}</p>
                        </div>
                    </div>
                    <div className="list-td">
                        <img src={getIconsJLv2(item.debtSymbol)} />
                        <div>
                            <p>{formatTokenAmount(item.debtAmount)} {item.debtSymbol}</p>
                            <p className="row-usd">{formatFiatValue(item.debtUsd)}</p>
                        </div>
                    </div>
                    <div className="list-td">
                        <div>
                            <p className="liquidation-address">{cutMiddle(item.userAddress, 3, 3)}</p>
                        </div>
                    </div>
                    <div className="list-td">
                        <div>
                            <a 
                                className="liquidation-address address-link" 
                                href={`${tronscanUrl}/transaction/${item.txId}`}
                            >
                                Hash <em className="link-arrow"></em>
                            </a>
                        </div>
                    </div>
                </div>
            ))}
            
        </div>
    </div>
  );
});
