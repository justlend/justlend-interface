import React from 'react';
import { observer } from 'mobx-react';
import intl from 'react-intl-universal';
import { Link } from 'react-router-dom';
import Store from '../../stores';
import Config from '../../config';
import { getLendIcons } from '../../utils/constant';
import { BigNumber } from '../../utils/helper';
import { formatFiatValue, formatApyRate } from '../../utils/formatters';

export const PositionV1Modal = observer(props => {
  const { dashboardStore, user, lend } = Store;
  const { isPositionModalShow, closePositionV1Modal } = dashboardStore;

  if (!isPositionModalShow) return null;

  const { usddJtoken, usddoldJtoken } = Config;
  const { userDepositDataSource, userLendDataSource, totalBorrowUsdForUSDD } = user;
  const supplyMarkets = userDepositDataSource?.length;
  const borrowMarkets = userLendDataSource?.length;
  let totalSupplyUsdForUSDD = BigNumber(0);

  if (userDepositDataSource && userDepositDataSource.length > 0) {
    userDepositDataSource.map((item, index) => {
      if (item.jtokenAddress === usddJtoken || item.jtokenAddress === usddoldJtoken) {
        totalSupplyUsdForUSDD = totalSupplyUsdForUSDD.plus(item.deposited);
      } else {
        totalSupplyUsdForUSDD = totalSupplyUsdForUSDD.plus(item.deposited_usd);
      }
    });
  }

  return (
    <div className="modal-overlay">
      <div className={'transaction-modal-v2 position-modal-v1' + (lend.theme === 'white' ? ' white' : '')}>
        <div className="modal-header">
          <div className="modal-header-title">{intl.get('jlv2.banner.my_position_v1')}</div>
          <div className="close-btn" onClick={closePositionV1Modal}></div>
        </div>
        <div className="position-desc">
          {intl.getHTML('jlv2.banner.v1_assets_desc', { supplyMarkets: supplyMarkets, borrowMarkets: borrowMarkets })}
          {}
        </div>
        <div className="position-list">
          <div className="list-item">
            <div>
              <div className="position-main-title">{intl.get('jlv2.banner.total_supply')}</div>
              <div className="position-subtitle">{formatFiatValue(totalSupplyUsdForUSDD)}</div>
            </div>
            <div>
              <div className="position-main-title">{intl.get('jlv2.banner.supply_token')}</div>
              <div className="position-tokens">
                {userDepositDataSource?.map((item, index) => {
                  if (index <= 2) {
                    return <img className="position-img" src={getLendIcons(item.collateralSymbol)} />;
                  }
                })}

                {userDepositDataSource?.length > 3 && <span>+{userDepositDataSource?.length - 3}</span>}
              </div>
            </div>
          </div>
          <div className="list-item">
            <div>
              <div className="position-main-title">{intl.get('jlv2.banner.total_borrow')}</div>
              <div className="position-subtitle">{formatFiatValue(totalBorrowUsdForUSDD)}</div>
            </div>
            <div>
              <div className="position-main-title">{intl.get('jlv2.banner.borrow_token')}</div>
              <div className="position-tokens">
                {userLendDataSource?.map((item, index) => {
                  if (index <= 2) {
                    return <img className="position-img" src={getLendIcons(item.collateralSymbol)} />;
                  }
                })}

                {userLendDataSource?.length > 3 && <span>+{userLendDataSource?.length - 3}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
