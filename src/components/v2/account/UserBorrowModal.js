import React from 'react';
import { inject, observer } from 'mobx-react';
import intl from 'react-intl-universal';
import { Modal, Table } from 'antd';
import ReactEcharts from 'echarts-for-react';
import UserBorrowTable from './UserBorrowTable';
import Config from '../../../config';
import { BigNumber, formatNumber, toFixedDown } from '../../../utils/helper';
import CloseIcon from '../../../assets/images/v2/account/white-close.svg';
import CloseIconWhite from '../../../assets/images/v2/white-theme/modal-close.svg';
import defaultDonutIcon from '../../../assets/images/v2/account/donut-default.svg';
import defaultDonutIconWhite from '../../../assets/images/v2/account/default-donut-white.svg';
import isMobile from 'ismobilejs';

@inject('network')
@inject('lend')
@inject('system')
@observer
class UserBorrowModal extends React.Component {
  constructor(props) {
    super();
    this.state = {
      mobile: isMobile(window.navigator).any
    };
  }

  getOption = () => {
    const { totalBorrowableUsd, userBorrowingAndRestBorrowableDataSource: dataSource, theme } = this.props.lend;
    const colors = [
      '#1D443C',
      '#107A65',
      '#18C19F',
      '#81F5DE',
      '#C4FFF4',
      '#E3FFD6',
      '#ACE98F',
      '#6CA552',
      '#B6B263',
      '#8F8A18',
      '#a4d629',
      '#4dc215',
      '#338b09'
    ];
    const isWhite = theme === 'white';
    let pieData = [];
    // console.log(dataSource);
    dataSource?.length > 0 &&
      dataSource.map((item, index) => {
        let itemData = {
          value: toFixedDown(BigNumber(item?.borrowBalanceNewUsd).div(totalBorrowableUsd).times(100), 2),
          name: item?.collateralSymbol,
          itemStyle: {
            color:
              index === dataSource.length - 1
                ? isWhite
                  ? 'rgba(34, 35, 43, 0.1)'
                  : 'rgba(255, 255, 255, 0.1)'
                : colors[index],
            borderWidth: 2,
            borderColor: theme === 'white' ? '#fff' : '#282931'
          },
          emphasis: {
            itemStyle: {
              color:
                index === dataSource.length - 1
                  ? isWhite
                    ? 'rgba(34, 35, 43, 0.1)'
                    : 'rgba(255, 255, 255, 0.1)'
                  : colors[index]
            }
          }
        };
        pieData.push(itemData);
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
          data: pieData
        }
      ]
    };
    return option;
  };

  render() {
    const { mobile } = this.state;
    const {
      userBorrowingAndRestBorrowableDataSource: dataSource,
      userLendDataSource: borrowingList,
      totalBorrowableUsd,
      totalBorrowingRate,
      theme
    } = this.props.lend;
    const { userBorrowModalShow } = this.props.network;
    const isWhite = theme === 'white';
    // dataSource = []; // for test
    const width = mobile ? 80 : 104;
    const height = mobile ? 80 : 104;

    return (
      <Modal
        title={intl.get('v2.borrow_details')}
        footer={null}
        onCancel={() => this.props.network.setData({ userBorrowModalShow: false })}
        className={`account-invest-modal${isWhite ? ' white' : ''}`}
        visible={userBorrowModalShow}
        // 457px
        centered
        width={mobile ? 'calc(100vw - 40px)' : '457px'}
        closeIcon={<img alt="" src={isWhite ? CloseIconWhite : CloseIcon} />}
      >
        {!dataSource || dataSource.length === 0 ? (
          <>
            <div className="user-invest-modal-info no-data">
              <img src={isWhite ? defaultDonutIconWhite : defaultDonutIcon} alt="" />
              <p>{intl.get('no_data')}</p>
            </div>
            <UserBorrowTable />
          </>
        ) : (
          <>
            <div className="user-invest-modal-info">
              <ReactEcharts
                className="donut-chart"
                option={this.getOption()}
                style={{ width, height, minWidth: width }}
              />
              <div className="info-content borrow">
                <p>
                  {intl.getHTML('v2.borrow_amount', {
                    amount: borrowingList.length
                  })}
                </p>
              </div>
            </div>
            <UserBorrowTable />
            <div className="user-invest-modal-overview">
              <div className="flex jcsb aic">
                <p className="overview-key">{intl.get('v2.borrow_limit')}</p>
                <p className="overview-val">{`$${formatNumber(totalBorrowableUsd, 2, { miniText: '0.01' })}`}</p>
              </div>
              {/* <div className="right">
                <p className="overview-key">{intl.get('v2.borrow_ratio')}</p>
                <p className="overview-val">{`${formatNumber(totalBorrowingRate, 2, { miniText: '0.01' })}%`}</p>
              </div> */}
            </div>
          </>
        )}
      </Modal>
    );
  }
}

export default UserBorrowModal;
