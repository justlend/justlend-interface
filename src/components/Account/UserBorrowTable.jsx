import React, { useState } from 'react';
import isMobile from 'ismobilejs';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react';
import { Table } from 'antd';
import Stores from '../../stores';
import Config from '../../config';
import { emptyReactNode, formatNumber, BigNumber } from '../../utils/helper';
import '../../assets/css/home.scss';
import '../../assets/css/home-m.scss';
import noDataIcon from '../../assets/images/v2/nodata-icon.svg';
import noDataIconWhite from '../../assets/images/v2/white-theme/nodata-icon.svg';

const UserBorrowTable = observer(({}) => {
  const [mobile] = useState(isMobile(window.navigator).any);
  const { user, lend } = Stores;

  const columnTokenSymbol = () => {
    return {
      title: intl.get('index.my_asset'),
      dataIndex: 'collateralSymbol',
      key: 'collateralSymbol',
      width: mobile ? 95 : 120,
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

  const columnBorrowingUsd = () => {
    const { usddJtoken, usddoldJtoken } = Config;
    return {
      title: intl.get('v2.tab_borrow'),
      dataIndex: 'borrowBalanceNewUsd',
      key: '2',
      width: mobile ? 120 : 150,
      render: (text, item) => (
        <div className="white12 ellipsis w-100">
          {formatNumber(
            BigNumber(
              item.jtokenAddress === usddJtoken || item.jtokenAddress === usddoldJtoken
                ? item.borrowBalanceNew.div(item.precision)
                : text
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

  const columnBorrowingRate = () => {
    const { totalBorrowableUsd } = user;
    return {
      title: intl.get('v2.percentage'),
      dataIndex: 'borrowBalanceNewUsd',
      key: '4',
      render: (text, item) => {
        return (
          <div>
            <p className="proportion borrow">
              {BigNumber(text).div(totalBorrowableUsd).times(100).gt(100)
                ? 100
                : formatNumber(BigNumber(text).div(totalBorrowableUsd).times(100), 2, { per: true, miniText: '0.01' })}
              %
            </p>
          </div>
        );
      }
    };
  };

  const getBorrowingColumns = () => {
    const columns = [columnTokenSymbol(), columnBorrowingUsd(), columnBorrowingRate()];
    return columns;
  };

  const { theme } = lend;
  const { userBorrowingAndRestBorrowableDataSource: dataSource } = user;

  if (!dataSource || dataSource.length === 0) {
    return (
      <div className="table-nodata">
        <img src={theme === 'white' ? noDataIconWhite : noDataIcon} alt="" />
        <p>{intl.get('no_data')}</p>
      </div>
    );
  }

  let x = mobile ? 250 : 400;
  let y = mobile ? 166 : 185;

  return (
    <Table
      className={'borrow modal-info-table-v2'}
      rowClassName={(record, index) => {}}
      columns={getBorrowingColumns()}
      rowKey={'collateralSymbol'}
      dataSource={dataSource}
      pagination={false}
      locale={{
        emptyText: emptyReactNode('lend')
      }}
      scroll={{
        x,
        y
      }}
    />
  );
});

export default UserBorrowTable;
