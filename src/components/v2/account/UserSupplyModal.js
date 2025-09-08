import React from 'react';
import { inject, observer } from 'mobx-react';
import intl from 'react-intl-universal';
import { Modal } from 'antd';
import ReactEcharts from 'echarts-for-react';
import UserSupplyTable from './UserSupplyTable';
import Config from '../../../config';
import { BigNumber, formatNumber, toFixedDown } from '../../../utils/helper';
import CloseIcon from '../../../assets/images/v2/account/white-close.svg';
import CloseIconWhite from '../../../assets/images/v2/white-theme/modal-close.svg';
import defaultDonutIcon from '../../../assets/images/v2/account/donut-default.svg';
import isMobile from 'ismobilejs';

@inject('network')
@inject('lend')
@inject('system')
@observer
class UserSupplyModal extends React.Component {
  constructor(props) {
    super();
    this.state = {
      mobile: isMobile(window.navigator).any
    };
  }

  getOption = () => {
    const { usddJtoken, usddoldJtoken } = Config;
    let { totalSupplyUsd, userDepositAndJustMortgateDataSource: dataSource, theme } = this.props.lend;
    const colors = [
      '#735ff6',
      '#4c54ff',
      '#9195fb',
      '#2b31c1',
      '#363971',
      '#2f1e96',
      '#4d0d90',
      '#6d00c3',
      '#9031dc',
      '#9d5ecf',
      '#ab7ece',
      '#cba6e9',
      '#d7b8f1',
      '#e047bf',
      '#bf37a1',
      '#ba6ea9'
    ];
    let pieData = [];
    // console.log(dataSource);
    let allJustMortgageStatus = true;
    let totalPer = BigNumber(0);
    dataSource = dataSource?.length > 0 && dataSource.filter(item => BigNumber(item.account_depositJtoken).gt(0));
    dataSource?.length > 0 &&
      dataSource.map((item, index) => {
        if (
          item.jtokenAddress === usddJtoken || item.jtokenAddress === usddoldJtoken
            ? item.deposited.gt(0)
            : item.deposited_usd.gt(0)
        ) {
          allJustMortgageStatus = false;
        }
        if (BigNumber(item.account_depositJtoken).gt(0)) {
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

          let itemData = {
            value,
            name: item?.collateralSymbol,
            itemStyle: { color: colors[index], borderWidth: 2, borderColor: theme === 'white' ? '#fff' : '#282931' },
            emphasis: { itemStyle: { color: colors[index] } }
          };
          pieData.push(itemData);
        }
      });

    // console.log(pieData);

    let option = {
      tooltip: {
        trigger: 'item',
        confine: true,
        formatter: function (params) {
          if (BigNumber(params.value).eq(0)) {
            return params.name + ' : < 0.01%';
          } else {
            return params.name + ' : ' + params.value + '%';
          }
        }
      },
      title: {
        text: '',
        x: 'center'
      },
      series: [
        {
          name: '',
          type: 'pie',
          radius: ['50%', '98%'],
          hoverAnimation: false,
          minAngle: 4,
          label: {
            show: false,
            position: 'center'
          },
          data: allJustMortgageStatus
            ? [
                {
                  value: '100',
                  name: 'justMorgage',
                  itemStyle: {
                    color: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 2,
                    borderColor: '#282931'
                  },
                  emphasis: { itemStyle: { color: 'rgba(255, 255, 255, 0.1)' } }
                }
              ]
            : pieData
        }
      ]
    };
    return option;
  };

  getTotalDeposit = () => {
    const { usddJtoken, usddoldJtoken } = Config;
    const { userDepositDataSource } = this.props.lend;
    let totalDeposit = BigNumber(0);

    if (userDepositDataSource && userDepositDataSource.length > 0) {
      userDepositDataSource.map((item, index) => {
        if (item.jtokenAddress === usddJtoken || item.jtokenAddress === usddoldJtoken) {
          totalDeposit = totalDeposit.plus(item.deposited);
        } else {
          totalDeposit = totalDeposit.plus(item.deposited_usd);
        }
      });

      let res = formatNumber(totalDeposit, 8, {
        cutZero: true,
        miniText: '0.01',
        miniTextValue: 0,
        round: true
      });
      let totalDepositNew = BigNumber(totalDeposit)._toFixed(8, 1);

      return BigNumber(totalDeposit).eq(0) ? (
        <span className="countup-int">{'$0'}</span>
      ) : BigNumber(totalDeposit).lt(0.01) && BigNumber(totalDeposit).gte(0) ? (
        <span className="countup-int">{'< $0.01'}</span>
      ) : BigNumber(totalDeposit).lte(0.1) ? (
        <>
          <span className="countup-int">${res.split('.')[0]}</span>
          <span className="countup-decimal">
            {totalDeposit !== '--' &&
              (res.split('.')[1] && res.split('.')[1].length > 0 ? '.' : '') + res.split('.')[1]}
          </span>
        </>
      ) : (
        <>
          <span className="countup-int">
            {totalDeposit !== '--' && !BigNumber(totalDeposit).eq(0)
              ? formatNumber(BigNumber(BigNumber(totalDepositNew).toString().split('.')[0]), 0, { needDolar: true })
              : totalDeposit === '--' && '--'}
          </span>
          {totalDeposit !== '--' &&
            totalDepositNew.split('.')[1] &&
            totalDepositNew.split('.')[1].length > 0 &&
            !BigNumber(totalDepositNew.split('.')[1]).eq(0) && (
              <span className="countup-decimal">
                {'.'}
                {BigNumber(totalDepositNew).toString().split('.')[1]}
                {/* {/^0/.test(totalDepositNew.split('.')[1])
                ? BigNumber(totalDepositNew).toString().split('.')[1]
                : formatNumber(BigNumber(totalDepositNew).toString().split('.')[1], 0)} */}
              </span>
            )}
        </>
      );
    } else if (userDepositDataSource) {
      return (
        <>
          <span className="countup-int">{'$0'}</span>
        </>
      );
    } else {
      return (
        <>
          <span className="countup-int">{'--'}</span>
        </>
      );
    }
  };

  render() {
    const { userSupplyModalShow } = this.props.network;
    const { mobile } = this.state;
    let {
      userDepositAndJustMortgateDataSource: dataSource,
      userDepositDataSource: supplyList,
      depositAndMortgageLength,
      justMortgageData,
      totalSupplyUsd,
      mortgageRate,
      theme
    } = this.props.lend;
    const isWhite = theme === 'white';
    // dataSource = []; // for test
    // supplyList = []; // for test

    const width = mobile ? 80 : 104;
    const height = mobile ? 80 : 104;
    return (
      <Modal
        title={intl.get('v2.supply_details')}
        footer={null}
        onCancel={() => this.props.network.setData({ userSupplyModalShow: false })}
        className={`account-invest-modal${isWhite ? ' white' : ''}`}
        visible={userSupplyModalShow}
        // 457px
        centered
        width={mobile ? 'calc(100vw - 40px)' : '457px'}
        closeIcon={<img alt="" src={isWhite ? CloseIconWhite : CloseIcon} />}
        destroyOnClose={true}
      >
        {!dataSource || dataSource.length === 0 ? (
          <>
            <div className="user-invest-modal-info no-data">
              <img src={defaultDonutIcon} alt="" />
              <p>{intl.get('no_data')}</p>
            </div>
            <UserSupplyTable />
          </>
        ) : (
          <>
            <div className="user-invest-modal-info">
              {supplyList?.length > 0 ? (
                <ReactEcharts
                  className="donut-chart"
                  option={this.getOption()}
                  style={{ width, height, minWidth: width }}
                />
              ) : (
                <img src={defaultDonutIcon} alt="" className="donut-chart" />
              )}
              <div className="info-content">
                {intl.getHTML('v2.supply_amount', { amount: supplyList?.length ? supplyList?.length : '--' })}
                {intl.getHTML('v2.collateral_amount', { amount: depositAndMortgageLength })}
                {/* {intl.getHTML('v2.collateral_no_supply_amount', { amount: justMortgageData?.length })} */}
              </div>
            </div>
            <UserSupplyTable />
            {supplyList?.length > 0 && (
              <div className="user-invest-modal-overview flexBA">
                <div>
                  <p className="overview-key">{intl.get('v2.total_supply')}</p>
                  {/* <p className="overview-val">${formatNumber(totalSupplyUsd, 2, { miniText: '0.01' })}</p> */}
                  <p className="overview-val">{this.getTotalDeposit()}</p>
                </div>
                <div className="right">
                  <p className="overview-key">{intl.get('v2.collateral_ratio')}</p>
                  <p className="overview-val">{mortgageRate}%</p>
                </div>
              </div>
            )}
          </>
        )}
      </Modal>
    );
  }
}

export default UserSupplyModal;
