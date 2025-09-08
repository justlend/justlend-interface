import React from 'react';
import isMobile from 'ismobilejs';
import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';
import { ConfigProvider, Table, Tooltip, Checkbox } from 'antd';
import Config from '../../../config';
import { formatNumber, BigNumber, toFixedDown } from '../../../utils/helper';
import '../../../assets/css/home.scss';
import '../../../assets/css/home-m.scss';
import noDataIcon from '../../../assets/images/v2/account/no-data.png';

@inject('network')
@inject('lend')
@inject('pool')
@observer
class UserSupplyTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      detailColors: [
        '#735FF6',
        '#4C54FF',
        '#9195FB',
        '#2B31C1',
        '#363971',
        '#2F1E96',
        '#4D0D90',
        '#6D00C3',
        '#9031DC',
        '#9D5ECF'
      ],
      mobile: isMobile(window.navigator).any,
      showNotMortgage: false
    };
  }

  columnTokenSymbol = () => {
    const { mobile } = this.state;
    return {
      title: intl.get('index.my_asset'),
      dataIndex: 'collateralSymbol',
      key: '1',
      //width: mobile ? 120 : 150,
      render: (text, item) => (
        <div className="collateralSymbol flexSTA">
          {/* <img
            src={getJTokenLogo(item.collateralSymbol)}
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

  columnSuppliedUsd = () => {
    const { usddJtoken, usddoldJtoken } = Config;
    const { mobile } = this.state;
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

  columnSuppliedRate = () => {
    const { usddJtoken, usddoldJtoken } = Config;
    return {
      title: <div className="nowrap">{intl.get('v2.percentage')}</div>,
      dataIndex: 'deposited_usd',
      key: '4',
      render: (text, item) => {
        const { totalSupplyUsd } = this.props.lend;
        const deposited =
          item.jtokenAddress === usddJtoken || item.jtokenAddress === usddoldJtoken
            ? item.deposited
            : item?.deposited_usd;
        const depositedPer = BigNumber(deposited).div(totalSupplyUsd).times(100);
        return (
          <div>
            <p className="proportion">
              {/* {BigNumber(depositedPer).gt(100) ? 100 : formatNumber(depositedPer, 2, { per: true, miniText: '0.01' })}% */}
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

  columnCollateral = () => {
    return {
      title: <div className="nowrap">{intl.get('index.my_usedto')}</div>,
      dataIndex: 'account_entered',
      key: 'account_entered',
      render: (text, item) => {
        return text === 2 ? (
          <span className="colleteral">{intl.get('index.not_support')}</span>
        ) : text === 1 ? (
          <span className="colleteral">{intl.get('v2.yes')}</span>
        ) : (
          <span className="colleteral">{intl.get('v2.no')}</span>
        );
      }
    };
  };

  getSupplyColumns = () => {
    const { mobile } = this.state;
    if (mobile) {
      return [this.columnTokenSymbol(), this.columnSuppliedUsd(), this.columnSuppliedRate()];
    } else {
      return [this.columnTokenSymbol(), this.columnSuppliedUsd(), this.columnSuppliedRate(), this.columnCollateral()];
    }
  };

  onSwitchChange = (status, item) => {
    if (!this.props.lend.collateralValid(item.collateralSymbol)) return;

    const { jtokenAddress } = item;
    this.props.lend.setData({ visible: true, type: status ? 2 : 1, jtokenAddress }, 'mortgageModalInfo');
  };

  getY = () => {
    let bannerHeight = 41;
    const { hideHomeBanner } = this.props.pool;
    if (hideHomeBanner) {
      bannerHeight = 0;
    }
    const h = BigNumber(this.props.pool.poolData['jstlp1'].staked).gt(0) ? 0 : 68;
    return 294 + h - bannerHeight;
  };

  showNotMortgage = e => {
    let value = e.target.checked;
    if (value) {
      this.setState({ showNotMortgage: true });
    } else {
      this.setState({ showNotMortgage: false });
    }
  };

  tableEmptyRender = () => {
    return (
      <div className="market-summary-list">
        <div className="market-empty">
          <div className="icon"></div>
          <div className="text color-light">{intl.get('v2.na_data')}</div>
        </div>
      </div>
    );
  };

  render() {
    let { userDepositAndJustMortgateDataSource: dataSource, totalSupplyUsd } = this.props.lend;
    const { usddJtoken, usddoldJtoken } = Config;

    let { lang, mobile, showNotMortgage } = this.state;
    // dataSource = []; // for test
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
            <Checkbox className="j-checkbox" onChange={this.showNotMortgage}>
              {intl.get('v2.rewards.hide_collateral')}
            </Checkbox>
          </div>
        )}
        <ConfigProvider renderEmpty={this.tableEmptyRender}>
          <Table
            className="modal-info-table-v2 mobile-supply"
            rowClassName={record => {
              return !BigNumber(record.account_depositJtoken).gt(0) && 'gray-row';
            }}
            columns={this.getSupplyColumns()}
            dataSource={dataSource}
            pagination={false}
            scroll={{ x, y }}
          />
        </ConfigProvider>
        {lessThanZeroArr.length > 0 && lang !== 'en-US' && (
          <div className="table-tips">{intl.get('v2.rewards.tip38', { symbol: lessThanZeroArr.join('、') })}</div>
        )}
        {lessThanZeroArr.length > 0 && lang === 'en-US' && (
          <div className="table-tips">
            {intl.get('v2.rewards.tip38', { symbol: lessThanZeroArr.join(', ') + ', ' })}
          </div>
        )}
      </>
    );
  }
}

export default UserSupplyTable;
