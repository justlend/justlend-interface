import React from 'react';
import isMobile from 'ismobilejs';
import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';
import { Table, Tooltip } from 'antd';
import Config from '../../../config';
import { emptyReactNode, formatNumber, BigNumber } from '../../../utils/helper';
import '../../../assets/css/home.scss';
import '../../../assets/css/home-m.scss';
import noDataIcon from '../../../assets/images/v2/nodata-icon.svg';
import noDataIconWhite from '../../../assets/images/v2/white-theme/nodata-icon.svg';
@inject('network')
@inject('lend')
@inject('pool')
@observer
class UserBorrowTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      mobile: isMobile(window.navigator).any
    };
  }

  columnTokenSymbol = () => {
    const { mobile } = this.state;
    return {
      title: intl.get('index.my_asset'),
      dataIndex: 'collateralSymbol',
      key: 'collateralSymbol',
      width: mobile ? 95 : 120,
      render: (text, item) => (
        <div className="collateralSymbol flexSTA">
          {/* <img
            src={item.logoUrl ? item.logoUrl : defaultIcon}
            onError={e => {
              e.target.onerror = null;
              e.target.src = defaultIcon;
            }}
            alt=""
          /> */}
          <div className="colorBlock"></div>
          <div className="tokenDetail">
            <div className="white12">{`${text}`}</div>
          </div>
        </div>
      )
    };
  };

  columnBorrowingUsd = () => {
    const { usddJtoken, usddoldJtoken } = Config;
    const { mobile } = this.state;
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

  columnBorrowingRate = () => {
    const { totalBorrowableUsd } = this.props.lend;
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

  getBorrowingColumns = () => {
    const columns = [this.columnTokenSymbol(), this.columnBorrowingUsd(), this.columnBorrowingRate()];
    return columns;
  };

  getY = () => {
    let bannerHeight = 41;
    const { hideHomeBanner } = this.props.pool;
    if (hideHomeBanner) {
      bannerHeight = 0;
    }
    return 294 - bannerHeight;
  };

  render() {
    const { userBorrowingAndRestBorrowableDataSource: dataSource, theme } = this.props.lend;
    const { mobile } = this.state;

    // dataSource = []; // for test
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
        columns={this.getBorrowingColumns()}
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
  }
}

export default UserBorrowTable;
