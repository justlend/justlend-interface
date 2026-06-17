import React from 'react';
import { inject, observer } from 'mobx-react';
import intl from 'react-intl-universal';
import CountUp from 'react-countup';
import Config from '../../config';
import Stores from '../../stores';
import { formatNumber, BigNumber } from '../../utils/helper';
import UserSupplyModal from './UserSupplyModal';
import UserBorrowModal from './UserBorrowModal';

const UserDataInfo = observer(() => {
  const { user, ui } = Stores;

  const getTotalDeposit = () => {
    const { usddJtoken, usddoldJtoken } = Config;
    const { userDepositDataSource } = user;
    let totalDeposit = BigNumber(0);

    if (userDepositDataSource && userDepositDataSource.length > 0) {
      userDepositDataSource.map((item, index) => {
        if (item.jtokenAddress === usddJtoken || item.jtokenAddress === usddoldJtoken) {
          totalDeposit = totalDeposit.plus(item.deposited);
        } else {
          totalDeposit = totalDeposit.plus(item.deposited_usd);
        }
      });

      let totalDepositNew = BigNumber(totalDeposit)._toFixed(2, 1);

      return BigNumber(totalDeposit).eq(0) ? (
        <span className="countup-int">{'$0'}</span>
      ) : BigNumber(totalDeposit).lt(0.01) && BigNumber(totalDeposit).gte(0) ? (
        <span className="countup-int">{'< $0.01'}</span>
      ) : BigNumber(totalDeposit).lte(0.1) ? (
        <>
          <span className="countup-int">
            {'$'}
            {totalDepositNew.split('.')[0]}
          </span>
          <span className="countup-decimal">
            {totalDeposit !== '--' &&
              totalDepositNew.split('.')[1] &&
              totalDepositNew.split('.')[1].length > 0 &&
              totalDepositNew.split('.')[1] != 0 &&
              '.' + totalDepositNew.split('.')[1]}
          </span>
        </>
      ) : (
        <>
          <span className="countup-int">
            {totalDeposit !== '--' && !BigNumber(totalDeposit).eq(0) ? (
              <CountUp
                className="value-number"
                start={0}
                duration={1}
                redraw={true}
                separator=","
                decimal="."
                prefix="$"
                end={BigNumber(BigNumber(totalDepositNew).toString().split('.')[0]).toNumber()}
              />
            ) : (
              totalDeposit === '--' && '--'
            )}
          </span>
          {totalDeposit !== '--' &&
            totalDepositNew.split('.')[1] &&
            totalDepositNew.split('.')[1].length > 0 &&
            totalDepositNew.split('.')[1] != 0 && (
              <span className="countup-decimal">
                {'.'}
                {/^0/.test(totalDepositNew.split('.')[1]) ? (
                  BigNumber(totalDepositNew).toString().split('.')[1]
                ) : (
                  <CountUp
                    className="value-number"
                    start={0}
                    duration={1}
                    redraw={true}
                    end={BigNumber(BigNumber(totalDepositNew).toString().split('.')[1]).toNumber()}
                  />
                )}
              </span>
            )}
        </>
      );
    } else if (userDepositDataSource) {
      return <span className="countup-int">{'$0'}</span>;
    } else {
      return <span className="countup-int">{'--'}</span>;
    }
  };

  const getTotalLend = () => {
    const { totalBorrowUsdForUSDD } = user;
    let totalBorrowUsdForUSDDNew = BigNumber(totalBorrowUsdForUSDD)._toFixed(2, 1);

    return BigNumber(totalBorrowUsdForUSDD).eq(0) ? (
      <span className="countup-int">{'$0'}</span>
    ) : BigNumber(totalBorrowUsdForUSDD).lt(0.01) && BigNumber(totalBorrowUsdForUSDD).gte(0) ? (
      <span className="countup-int">{'< $0.01'}</span>
    ) : BigNumber(totalBorrowUsdForUSDD).lte(0.1) ? (
      <>
        <span className="countup-int">
          {'$'}
          {totalBorrowUsdForUSDDNew.split('.')[0]}
        </span>
        <span className="countup-decimal">
          {totalBorrowUsdForUSDD !== '--' &&
            (totalBorrowUsdForUSDDNew.split('.')[1] && totalBorrowUsdForUSDDNew.split('.')[1].length > 0 ? '.' : '') +
              totalBorrowUsdForUSDDNew.split('.')[1]}
        </span>
      </>
    ) : (
      <>
        <span className="countup-int">
          {totalBorrowUsdForUSDD !== '--' ? (
            <CountUp
              className="value-number"
              start={0}
              duration={1}
              redraw={true}
              separator=","
              decimal="."
              prefix="$"
              end={BigNumber(BigNumber(totalBorrowUsdForUSDDNew).toString().split('.')[0]).toNumber()}
            />
          ) : (
            '--'
          )}
        </span>

        {totalBorrowUsdForUSDD !== '--' &&
          totalBorrowUsdForUSDDNew.split('.')[1] &&
          totalBorrowUsdForUSDDNew.split('.')[1].length > 0 &&
          totalBorrowUsdForUSDDNew.split('.')[1] != 0 && (
            <span className="countup-decimal">
              {'.'}
              {/^0/.test(totalBorrowUsdForUSDDNew.split('.')[1]) ? (
                totalBorrowUsdForUSDDNew.split('.')[1]
              ) : (
                <CountUp
                  className="value-number"
                  start={0}
                  duration={1}
                  redraw={true}
                  end={BigNumber(BigNumber(totalBorrowUsdForUSDDNew).toString().split('.')[1]).toNumber()}
                />
              )}
            </span>
          )}
      </>
    );
  };

  return (
    <>
      <div className="flexBA">
        <div>
          <div className="data-info-key">{intl.get('v2.total_supplied')}</div>
          <div className="data-info-value">{getTotalDeposit()}</div>
        </div>
        <button
          className="j-btn j-reward"
          onClick={() => {
            ui.setUserSupplyModalShow(true);
            window.gtag('event', 'PC_supply_detail_button', {
              'event_category': 'PC_V1.5',
              'event_label': 'supply_detail_button'
            });
          }}
        >
          {intl.get('v2.check_detail')}
        </button>
      </div>
      <div className="flexBA mt20">
        <div>
          <div className="data-info-key">{intl.get('v2.total_borrowing')}</div>
          <div className="data-info-value">{getTotalLend()}</div>
        </div>
        <button
          className="j-btn j-reward"
          onClick={() => {
            ui.setUserBorrowModalShow(true);
            window.gtag('event', 'PC_borrow_detail_button', {
              'event_category': 'PC_V1.5',
              'event_label': 'borrow_detail_button'
            });
          }}
        >
          {intl.get('v2.check_detail')}
        </button>
      </div>
      <UserSupplyModal />
      <UserBorrowModal />
    </>
  );
});

export default UserDataInfo;
