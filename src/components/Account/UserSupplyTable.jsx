import React, { useState } from 'react';
import isMobile from 'ismobilejs';
import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';
import { ConfigProvider, Table, Checkbox } from 'antd';
import Config from '../../config';
import Stores from '../../stores';
import { formatNumber, BigNumber, toFixedDown } from '../../utils/helper';
import '../../assets/css/home.scss';
import '../../assets/css/home-m.scss';
import noDataIcon from '../../assets/images/v2/account/no-data.png';

const UserSupplyTable = observer(({}) => {
  const [mobile] = useState(isMobile(window.navigator).any);
  const [lang] = useState(window.localStorage.getItem('lang') || intl.options.currentLocale);
  const [showNotMortgage, setShowNotMortgage] = useState(false);
  const { user } = Stores;

  const columnTokenSymbol = () => {
    return {
      title: intl.get('index.my_asset'),
      dataIndex: 'collateralSymbol',
      key: '1',
      render: (text, item) => (
        <div className="collateralSymbol flexSTA">
          <div className="colorBlock"></div>
          <div className="tokenDetail">
            <div className="white12">{`${text}`}</div>
          </div>
        </div>
      )
    };
  };

  const columnSuppliedUsd = () => {
    const { usddJtoken, usddoldJtoken } = Config;
    return {
      title: <>{intl.get('v2.tab_deposit')}</>,
      dataIndex: 'deposited_usd',
      key: '3',
      width: mobile ? 120 : 150,
      render: (text, item) => (
        <div className="white12 ellipsis w-100">
          {formatNumber(
            BigNumber(
              item.jtokenAddress === usddJtoken || item.jtokenAddress === usddoldJtoken ? item.deposited : text
            ),
            2,
            {
              miniText: 0.01,
              needDolar: true
            }
          )}
        </div>
      )
    };
  };

  const columnSuppliedRate = () => {
    const { usddJtoken, usddoldJtoken } = Config;
    return {
      title: <div className="nowrap">{intl.get('v2.percentage')}</div>,
      dataIndex: 'deposited_usd',
      key: '4',
      render: (text, item) => {
        return (
          <div>
            <p className="proportion">
              {BigNumber(item.percent).gt(100)
                ? 100
                : BigNumber(item.percent).eq(0)
                ? '<0.01'
                : formatNumber(item.percent, 2, { per: true, miniText: '0.01' })}
              %
            </p>
          </div>
        );
      }
    };
  };

  const columnCollateral = () => {
    return {
      title: <div className="nowrap">{intl.get('index.my_usedto')}</div>,
      dataIndex: 'account_entered',
      key: 'account_entered',
      render: (text, item) => {
        return BigNumber(item.collateralFactor).eq(0) ? (
          <span className="colleteral">{intl.get('index.not_support')}</span>
        ) : text === 1 ? (
          <span className="colleteral">{intl.get('v2.yes')}</span>
        ) : (
          <span className="colleteral">{intl.get('v2.no')}</span>
        );
      }
    };
  };

  const getSupplyColumns = () => {
    if (mobile) {
      return [columnTokenSymbol(), columnSuppliedUsd(), columnSuppliedRate()];
    } else {
      return [columnTokenSymbol(), columnSuppliedUsd(), columnSuppliedRate(), columnCollateral()];
    }
  };

  const showNotMortgageChange = e => {
    let value = e.target.checked;
    if (value) {
      setShowNotMortgage(true);
    } else {
      setShowNotMortgage(false);
    }
  };

  const tableEmptyRender = () => {
    return (
      <div className="market-summary-list">
        <div className="market-empty">
          <div className="icon"></div>
          <div className="text color-light">{intl.get('v2.na_data')}</div>
        </div>
      </div>
    );
  };

  let { userDepositAndJustMortgateDataSource: dataSource, totalSupplyUsd } = user;
  const { usddJtoken, usddoldJtoken } = Config;

  if (!dataSource || dataSource.length === 0) {
    return (
      <div className="table-nodata">
        <img src={noDataIcon} alt="" />
        <p>{intl.get('no_data')}</p>
      </div>
    );
  }

  let x = mobile ? 250 : 400;
  let y = mobile ? 108 : 215;

  let lessThanZeroArr = [];
  dataSource.map(item => {
    if (!BigNumber(item.account_depositJtoken).gt(0)) {
      lessThanZeroArr.push(item.collateralSymbol);
    }
  });
  dataSource = dataSource.filter(item => BigNumber(item.account_depositJtoken).gt(0));
  if (mobile && showNotMortgage) {
    dataSource = dataSource.filter(item => BigNumber(item.account_entered).eq(0));
  }

  let totalPer = BigNumber(0);
  dataSource =
    dataSource?.length > 0
      ? dataSource.map((item, index) => {
          let value = 0;
          if (dataSource?.length === 1) {
            value = 100;
          } else {
            if (index < dataSource?.length - 1) {
              value = toFixedDown(
                BigNumber(
                  item.jtokenAddress === usddJtoken || item.jtokenAddress === usddoldJtoken
                    ? item.deposited
                    : item?.deposited_usd
                )
                  .div(totalSupplyUsd)
                  .times(100),
                2
              );
              totalPer = BigNumber(totalPer).plus(value);
            } else {
              value = toFixedDown(BigNumber(100).minus(totalPer), 2);
            }
          }

          return {
            ...item,
            percent: value
          };
        })
      : [];

  return (
    <>
      {mobile && (
        <div className="show-not-mortgage">
          <Checkbox className="j-checkbox" onChange={showNotMortgageChange}>
            {intl.get('v2.rewards.hide_collateral')}
          </Checkbox>
        </div>
      )}
      <ConfigProvider renderEmpty={tableEmptyRender}>
        <Table
          className="modal-info-table-v2 mobile-supply"
          rowClassName={record => {
            return !BigNumber(record.account_depositJtoken).gt(0) && 'gray-row';
          }}
          columns={getSupplyColumns()}
          dataSource={dataSource}
          pagination={false}
          scroll={{ x, y }}
        />
      </ConfigProvider>
      {lessThanZeroArr.length > 0 && lang !== 'en-US' && (
        <div className="table-tips">{intl.get('v2.rewards.tip38', { symbol: lessThanZeroArr.join('、') })}</div>
      )}
      {lessThanZeroArr.length > 0 && lang === 'en-US' && (
        <div className="table-tips">{intl.get('v2.rewards.tip38', { symbol: lessThanZeroArr.join(', ') + ', ' })}</div>
      )}
    </>
  );
});

export default UserSupplyTable;
