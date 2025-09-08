import { Tooltip } from 'antd';
import BigNumber from 'bignumber.js';
import classnames from 'classnames';
import isMobile from 'ismobilejs';
import { toJS } from 'mobx';
import { inject, observer } from 'mobx-react';
import React from 'react';
import intl from 'react-intl-universal';
import { Link } from 'react-router-dom';
import { cutMiddle, formatNumber, getQueryObj } from '../../../utils/helper';
import { TooltipText } from './TooltipText';
import { dateAfterSecondsToISO, toDayHourMinString } from './utils';
import EndRentalTipModal from '../../Modals/v2/energy-rental/EndRentalTip';

import '../../../assets/css/v2/energy-rental/rental-order-mini-list.scss';
import '../../../assets/css/v2/rent-order-list.scss';

@inject('energyRental')
@inject('network')
@inject('system')
@observer
class RentalOrderMiniList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: getQueryObj()?.lang || window.localStorage.getItem('lang') || intl.options.currentLocale,
      mobile: isMobile(window.navigator).any,

      orderListByExpirationTime: true,
      durationUnitSwitch: true,

      orderListAtBottom: false,
      mobileListDisplay: true,
      order: {},
      othersOrderListAtBottom: false
    };

    this.orderListRef = null;
  }

  componentDidMount = () => {
    this.handleScroll();
    this.orderListRef.addEventListener('scroll', this.handleScroll);
  };

  componentWillUnmount() {
    this.orderListRef.removeEventListener('scroll', this.handleScroll);
  }

  handleScroll = () => {
    this.setState({
      orderListAtBottom: this.orderListRef.scrollHeight - 340 - this.orderListRef.scrollTop < 15.0
    });
  };

  onClickOrderListSelectOption = byExpirationTime => {
    this.setState({ orderListByExpirationTime: byExpirationTime, mobileListDisplay: false });
    this.props.energyRental.getMiniOrderList(byExpirationTime ? 0 : 1);
  };

  onClickEndButton = async order => {
    if (this.props.network.isRightChain === 0) {
      this.props.network.changeChain();
      return;
    }

    this.props.energyRental.setData({
      endOrderModalVisible: true,
      endOrderModalInfo: order
    });
    this.props.system.clearRejectError();
  };

  onClickRenewButton = async order => {
    if (this.props.network.isRightChain === 0) {
      this.props.network.changeChain();
      return;
    }
    if (this.props.energyRental.rentPaused) {
      return this.props.energyRental.setData({ rentPausedVisible: true });
    }

    this.props.energyRental.setData({
      addOrderModalVisible: true,
      isAddOrderModalApprovingTrans: false,
      addOrderModalIsRenew: true,
      renewOrderShouldUseSavedInfo: false,
      addOrderModalStep: 2,
      renewOrderExistingRemainingSeconds: order.canRentSeconds
    });

    this.props.energyRental.getExistingRentalOrderInfo(
      order.receiver,
      order.canRentSeconds > 0 ? 100000 : 0,
      0,
      order.canRentSeconds > 0 ? true : false
    );
  };

  othersForMeList = () => {
    const { orderListByExpirationTime, durationUnitSwitch, lang, mobile, othersOrderListAtBottom, mobileListDisplay } =
      this.state;
    const { miniReceiverTotal, miniReceiverOrdersList } = this.props.energyRental;
    const { defaultAccount } = this.props.network;

    // console.log(miniReceiverOrdersList, 'miniReceiverOrdersList');

    return miniReceiverOrdersList?.map((order, id) => {
      let renter = toJS(miniReceiverOrdersList[id].renter);
      let receiver = toJS(miniReceiverOrdersList[id].receiver);
      const returnRentInfo = toJS(this.props.energyRental.returnRentInfo);
      let isSelf = order.receiver === defaultAccount;

      let unrecoveredEnergyAmount = isSelf
        ? BigNumber(returnRentInfo.unrecoveredEnergyAmount).plus(10000)
        : returnRentInfo.unrecoveredEnergyAmount;
      let unrecoveredEnergyFee = BigNumber(returnRentInfo.dailyRent)
        .times(BigNumber(unrecoveredEnergyAmount).div(returnRentInfo.rentAmount))
        .times(0.5);
      let rentRemainAndsecurityDeposit = BigNumber(returnRentInfo.rentRemain).plus(returnRentInfo.securityDeposit);

      unrecoveredEnergyFee = BigNumber(unrecoveredEnergyFee).gt(rentRemainAndsecurityDeposit)
        ? rentRemainAndsecurityDeposit
        : unrecoveredEnergyFee;

      let toBeLiquidated = order.canRentSeconds < 5 * 60;

      let redAlert = order.canRentSeconds >= 5 * 60 && order.canRentSeconds < 40 * 60;

      let yellowWarning = order.canRentSeconds >= 40 * 60 && order.canRentSeconds < 24 * 60 * 60;

      return (
        <div className="order-item" key={id}>
          <div className="order-header">
            {intl.get('s7.from')} {cutMiddle(order.renter, 6, 6)}
          </div>

          <div className="order-detail">
            <div className="detail-row energy-row">
              <div className="field">
                <Tooltip
                  title={() => {
                    return intl.getHTML('energy_rental.mini_list.energy_amount_hint', {
                      value: formatNumber(BigNumber(order.delegateTrxAmount)._toFixed(0, 0), 0)
                    });
                  }}
                  placement="topLeft"
                  arrowPointAtCenter
                  overlayClassName="j-tooltip-dropdown energy-rental-tooltip"
                  onMouseEnter={() => {
                    window.gtag('event', 'energyrent_pro_orderlist_hoverenergy', {
                      'event_category': 'energyrent',
                      'event_label': 'energyrent_pro_orderlist_hoverenergy'
                    });
                  }}
                >
                  <div className="j-tooltip-icon"></div>
                </Tooltip>

                <TooltipText
                  title={() => {
                    return intl.getHTML('energy_rental.mini_list.energy_amount_hint', {
                      value: formatNumber(BigNumber(order.delegateTrxAmount)._toFixed(0, 0), 0)
                    });
                  }}
                  placement="topLeft"
                  overlayClassName="j-tooltip-dropdown energy-rental-tooltip"
                  onMouseEnter={() => {
                    window.gtag('event', 'energyrent_pro_orderlist_hoverenergy', {
                      'event_category': 'energyrent',
                      'event_label': 'energyrent_pro_orderlist_hoverenergy'
                    });
                  }}
                >
                  {intl.get('energy_rental.mini_list.energy_amount_title')}
                </TooltipText>
              </div>
              <div className="value">
                <span>{formatNumber(BigNumber(order.energyAmount), 0)}</span>
                <div className="energy-icon"></div>
              </div>
            </div>
            <div className={toBeLiquidated ? 'warning-box' : ''}>
              <div className={'tip-box ' + (redAlert ? 'alert' : yellowWarning ? 'warning' : '')}>
                <div className="detail-row time-row">
                  <div className="field">
                    <Tooltip
                      title={() => {
                        return intl.getHTML('energy_rental.mini_list.rental_time_hint');
                      }}
                      placement="topLeft"
                      arrowPointAtCenter
                      overlayClassName="j-tooltip-dropdown energy-rental-tooltip"
                      onMouseEnter={() => {
                        window.gtag('event', 'energyrent_pro_orderlist_hovertime', {
                          'event_category': 'energyrent',
                          'event_label': 'energyrent_pro_orderlist_hovertime'
                        });
                      }}
                    >
                      <div className="j-tooltip-icon"></div>
                    </Tooltip>

                    <TooltipText
                      title={() => {
                        return intl.getHTML('energy_rental.mini_list.rental_time_hint');
                      }}
                      placement="topLeft"
                      overlayClassName="j-tooltip-dropdown energy-rental-tooltip"
                      onMouseEnter={() => {
                        window.gtag('event', 'energyrent_pro_orderlist_hovertime', {
                          'event_category': 'energyrent',
                          'event_label': 'energyrent_pro_orderlist_hovertime'
                        });
                      }}
                    >
                      {durationUnitSwitch
                        ? intl.get('energy_rental.mini_list.rental_time_title_remaining')
                        : intl.get('energy_rental.mini_list.rental_time_title_expiration')}
                    </TooltipText>
                  </div>
                  <div className="inline-flex">
                    <Tooltip
                      placement="bottomRight"
                      arrowPointAtCenter
                      overlayInnerStyle={{ padding: toBeLiquidated ? 12 : 0 }}
                      onMouseEnter={() => {
                        this.props.energyRental.getReturnRentInfo(renter, receiver);
                        window.gtag('event', 'energyrent_pro_orderlist_hoverRemainTRX', {
                          'event_category': 'energyrent',
                          'event_label': 'energyrent_pro_orderlist_hoverRemainTRX'
                        });
                      }}
                      overlayClassName="j-tooltip-dropdown j-tooltip-dropdown-receiver"
                      title={
                        toBeLiquidated ? (
                          intl.get('s7.tips3')
                        ) : (
                          <div className="rent-info-tooltip">
                            <div className="detail-row">
                              <div className="row-title2">
                                {intl.get('energy_rental.end_order_modal.remaining_trx')}
                              </div>
                              <div className="row-value2">
                                {formatNumber(
                                  BigNumber(returnRentInfo.rentRemain)
                                    .plus(returnRentInfo.securityDeposit)
                                    .minus(unrecoveredEnergyFee),
                                  6
                                )}{' '}
                                TRX
                              </div>
                            </div>
                            <div className="divider-line" />
                            <div className="detail-row">
                              <div className="row-title">
                                {intl.get('energy_rental.end_order_modal.remaining_rent')}
                              </div>
                              <div className="row-value">{formatNumber(returnRentInfo.rentRemain, 6)} TRX</div>
                            </div>
                            <div className="detail-row">
                              <div className="row-title">
                                {intl.get('energy_rental.end_order_modal.security_deposit')}
                              </div>
                              <div className="row-value">{formatNumber(returnRentInfo.securityDeposit, 6)} TRX</div>
                            </div>
                            <div className="detail-row" style={{ alignItems: 'flex-start' }}>
                              <div className="row-title">
                                <div style={{ textAlign: 'start' }}>
                                  {intl.get('energy_rental.end_order_modal.deducted_unrecovered_energy_hint')}
                                </div>
                                <div style={{ textAlign: 'start' }}>
                                  {intl.get('energy_rental.end_order_modal.deducted_unrecovered_energy_detail', {
                                    value: formatNumber(unrecoveredEnergyAmount, 0)
                                  })}
                                </div>
                              </div>
                              <div className="row-value">- {formatNumber(unrecoveredEnergyFee, 6)} TRX</div>
                            </div>
                          </div>
                        )
                      }
                    >
                      <div
                        className={
                          'value value-dash inline-flex' +
                          (toBeLiquidated || redAlert ? ' red' : yellowWarning ? ' yellow' : '')
                        }
                      >
                        <span className={toBeLiquidated ? '' : 'mr-15'}>
                          {!toBeLiquidated
                            ? durationUnitSwitch
                              ? toDayHourMinString(order.canRentSeconds)
                              : dateAfterSecondsToISO(order.canRentSeconds)
                            : intl.get('s7.to_be_liquidated')}
                        </span>

                        {!toBeLiquidated &&
                          (mobile ? (
                            <div
                              className="switch-icon"
                              onClick={() => {
                                this.setState({ durationUnitSwitch: !durationUnitSwitch });
                                window.gtag('event', 'energyrent_pro_orderlist_clicktime', {
                                  'event_category': 'energyrent',
                                  'event_label': 'energyrent_pro_orderlist_clicktime'
                                });
                              }}
                            ></div>
                          ) : (
                            <Tooltip
                              title={() => {
                                return intl.getHTML('energy_rental.mini_list.rental_time_display_switch_hint');
                              }}
                              placement="topRight"
                              arrowPointAtCenter
                              overlayClassName="j-tooltip-dropdown energy-rental-tooltip"
                            >
                              <div
                                className="switch-icon"
                                onClick={() => {
                                  this.setState({ durationUnitSwitch: !durationUnitSwitch });
                                  window.gtag('event', 'energyrent_pro_orderlist_clicktime', {
                                    'event_category': 'energyrent',
                                    'event_label': 'energyrent_pro_orderlist_clicktime'
                                  });
                                }}
                              ></div>
                            </Tooltip>
                          ))}
                      </div>
                    </Tooltip>
                    {toBeLiquidated && (
                      <Tooltip
                        placement="bottomRight"
                        arrowPointAtCenter
                        overlayInnerStyle={{ width: 300 }}
                        overlayClassName="j-tooltip-dropdown"
                        title={
                          <div className="rent-info-tooltip">
                            <div className="detail-row">
                              <div className="row-title2">
                                {intl.get('energy_rental.end_order_modal.remaining_trx')}
                              </div>
                              <div className="row-value2">
                                {formatNumber(
                                  BigNumber(returnRentInfo.rentRemain)
                                    .plus(returnRentInfo.securityDeposit)
                                    .minus(unrecoveredEnergyFee),
                                  6
                                )}{' '}
                                TRX
                              </div>
                            </div>
                            <div className="divider-line" />
                            <div className="detail-row">
                              <div className="row-title">
                                {intl.get('energy_rental.end_order_modal.remaining_rent')}
                              </div>
                              <div className="row-value">{formatNumber(returnRentInfo.rentRemain, 6)} TRX</div>
                            </div>
                            <div className="detail-row">
                              <div className="row-title">
                                {intl.get('energy_rental.end_order_modal.security_deposit')}
                              </div>
                              <div className="row-value">{formatNumber(returnRentInfo.securityDeposit, 6)} TRX</div>
                            </div>
                            <div className="detail-row" style={{ alignItems: 'flex-start' }}>
                              <div className="row-title">
                                <div style={{ textAlign: 'start' }}>
                                  {intl.get('energy_rental.end_order_modal.deducted_unrecovered_energy_hint')}
                                </div>
                                <div style={{ textAlign: 'start' }}>
                                  {intl.get('energy_rental.end_order_modal.deducted_unrecovered_energy_detail', {
                                    value: formatNumber(unrecoveredEnergyAmount, 0)
                                  })}
                                </div>
                              </div>
                              <div className="row-value">- {formatNumber(unrecoveredEnergyFee, 6)} TRX</div>
                            </div>
                          </div>
                        }
                        trigger={['hover', 'click']}
                      >
                        <span className="j-tooltip-icon ml-4"></span>
                      </Tooltip>
                    )}
                  </div>
                </div>
                {(redAlert || yellowWarning) && (
                  <div className="detail-row">
                    <div className={'warning-box ' + (yellowWarning ? 'none' : '')}>
                      {redAlert ? (
                        <svg width="12" height="11" viewBox="0 0 12 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            fill="#FF5266"
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M7.53593 0.95513L11.7597 8.27099C12.4424 9.45335 11.5891 10.9313 10.2238 10.9313H1.77619C0.410912 10.9313 -0.44238 9.45335 0.240255 8.27099L4.46407 0.95513C5.14671 -0.227232 6.8533 -0.227229 7.53593 0.95513ZM6.76797 1.39852C6.42665 0.807335 5.57335 0.807335 5.23203 1.39851L1.00822 8.71437C0.666903 9.30555 1.09355 10.0445 1.77619 10.0445H10.2238C10.9064 10.0445 11.3331 9.30555 10.9918 8.71437L6.76797 1.39852Z"
                          />
                          <path
                            fill="#FF5266"
                            d="M6.5 8.02381C6.5 8.2868 6.2868 8.5 6.02381 8.5H5.97619C5.7132 8.5 5.5 8.2868 5.5 8.02381C5.5 7.76082 5.7132 7.54762 5.97619 7.54762H6.02381C6.2868 7.54762 6.5 7.76082 6.5 8.02381ZM6 6.83333C5.72386 6.83333 5.5 6.60948 5.5 6.33333V4C5.5 3.72386 5.72386 3.5 6 3.5C6.27614 3.5 6.5 3.72386 6.5 4V6.33333C6.5 6.60948 6.27614 6.83333 6 6.83333Z"
                          />
                        </svg>
                      ) : (
                        <svg width="12" height="13" viewBox="0 0 12 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="6" cy="6.5" r="5.5" stroke="#F58721" />
                          <path
                            fill="#F58721"
                            d="M6.76365 8.95452C6.76365 9.25577 6.51944 9.49998 6.2182 9.49998H6.00001C5.69877 9.49998 5.45456 9.25577 5.45456 8.95452C5.45456 8.65328 5.69877 8.40907 6.00001 8.40907H6.2182C6.51944 8.40907 6.76365 8.65328 6.76365 8.95452ZM6.10911 7.59089C5.74761 7.59089 5.45456 7.29784 5.45456 6.93634V4.42725C5.45456 4.06575 5.74761 3.77271 6.10911 3.77271C6.4706 3.77271 6.76365 4.06576 6.76365 4.42725V6.93634C6.76365 7.29784 6.4706 7.59089 6.10911 7.59089Z"
                          />
                        </svg>
                      )}

                      <span className={redAlert ? 'red-tip' : 'yellow-tip'}>
                        {redAlert ? intl.get('s9.duration_lt_40m_for_list') : intl.get('s9.duration_lt_24h_for_list')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              {toBeLiquidated && (
                <div className="tobe-liquidated-warning flex-center">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      fill-rule="evenodd"
                      clip-rule="evenodd"
                      d="M7.53593 1.45537L11.7597 8.77123C12.4424 9.95359 11.5891 11.4315 10.2238 11.4315H1.77619C0.410912 11.4315 -0.44238 9.95359 0.240255 8.77123L4.46407 1.45537C5.14671 0.273012 6.8533 0.273015 7.53593 1.45537ZM6.76797 1.89876C6.42665 1.30758 5.57335 1.30758 5.23203 1.89876L1.00822 9.21462C0.666903 9.8058 1.09355 10.5448 1.77619 10.5448H10.2238C10.9064 10.5448 11.3331 9.8058 10.9918 9.21462L6.76797 1.89876Z"
                      fill="#FF5266"
                    />
                    <path
                      d="M6.5 8.52381C6.5 8.7868 6.2868 9 6.02381 9H5.97619C5.7132 9 5.5 8.7868 5.5 8.52381C5.5 8.26082 5.7132 8.04762 5.97619 8.04762H6.02381C6.2868 8.04762 6.5 8.26082 6.5 8.52381ZM6 7.33333C5.72386 7.33333 5.5 7.10948 5.5 6.83333V4.5C5.5 4.22386 5.72386 4 6 4C6.27614 4 6.5 4.22386 6.5 4.5V6.83333C6.5 7.10948 6.27614 7.33333 6 7.33333Z"
                      fill="#FF5266"
                    />
                  </svg>
                  <span className="red">{intl.get('s7.tips3')}</span>
                </div>
              )}
            </div>
          </div>

          <div className="action-btns">
            <button
              className="action-btn end-btn"
              onClick={() => {
                this.setState({ order });
                this.props.energyRental.setData({ endRentalTipShow: true, endOrderType: 'receiver' });
                // this.onClickEndButton(order);
                window.gtag('event', 'click', {
                  'event_category': 'energyrent',
                  'event_label': 'energyrent_pro_orderlist_clickEnd'
                });
              }}
            >
              {intl.get('energy_rental.mini_list.end_btn')}
            </button>
            <Tooltip
              placement={mobile ? 'bottomRight' : 'bottom'}
              arrowPointAtCenter
              overlayClassName="j-tooltip-dropdown j-tooltip-dropdown-receiver"
              title={intl.get('s7.tips2')}
            >
              <div className="action-btn">
                <button className="j-btn j-rent-renew" disabled>
                  {intl.get('energy_rental.mini_list.renew_btn')}
                </button>
              </div>
            </Tooltip>
          </div>
        </div>
      );
    });
  };

  render() {
    const { orderListByExpirationTime, durationUnitSwitch, lang, mobile, orderListAtBottom, mobileListDisplay } =
      this.state;
    const { orderListTotalCount, miniOrderList, miniReceiverTotal } = this.props.energyRental;
    const { defaultAccount } = this.props.network;

    let totalCount = orderListTotalCount;
    if (isNaN(orderListTotalCount)) {
      totalCount = miniReceiverTotal;
    } else if (!isNaN(orderListTotalCount) && isNaN(miniReceiverTotal)) {
      totalCount = orderListTotalCount;
    } else if (isNaN(orderListTotalCount) && isNaN(miniReceiverTotal)) {
      totalCount = 0;
    } else if (!isNaN(orderListTotalCount) && isNaN(miniReceiverTotal)) {
      totalCount = orderListTotalCount + miniReceiverTotal;
    }

    const showAllOrderLink = totalCount > 1;
    const showOrderListBlurFilter = totalCount > 2;

    return (
      <div className="rental-order-mini-list section-content-container">
        <div className="list-wrapper">
          <div className="list-header">
            <div className="list-header-title">
              <div className="title-cotent">
                {intl.get(
                  orderListTotalCount + miniReceiverTotal > 1
                    ? 'energy_rental.mini_list.list_title_plural'
                    : 'energy_rental.mini_list.list_title'
                )}
                {orderListTotalCount + miniReceiverTotal > 1 && (
                  <div className="order-count-rect">{orderListTotalCount + miniReceiverTotal}</div>
                )}
              </div>

              {orderListTotalCount > 1 && (
                <div
                  className="list-order-select"
                  onTouchStart={() => this.setState({ mobileListDisplay: true })}
                  onMouseEnter={() => this.setState({ mobileListDisplay: true })}
                >
                  {orderListByExpirationTime
                    ? intl.get('energy_rental.mini_list.order_by_expiration_time')
                    : intl.get('energy_rental.mini_list.order_by_rental_start')}

                  <div className={'list-content ' + (mobileListDisplay ? '' : 'hide')}>
                    <div
                      className={classnames('order-option', { 'active': orderListByExpirationTime })}
                      onClick={() => {
                        this.onClickOrderListSelectOption(true);
                        window.gtag('event', 'click', {
                          'event_category': 'energyrent',
                          'event_label': 'energyrent_pro_orderlist_clickchangeSort'
                        });
                      }}
                    >
                      {intl.get('energy_rental.mini_list.order_by_expiration_time')}
                    </div>
                    <div
                      className={classnames('order-option', { 'active': !orderListByExpirationTime })}
                      onClick={() => {
                        this.onClickOrderListSelectOption(false);
                        window.gtag('event', 'click', {
                          'event_category': 'energyrent',
                          'event_label': 'energyrent_pro_orderlist_clickchangeSort'
                        });
                      }}
                    >
                      {intl.get('energy_rental.mini_list.order_by_rental_start')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div>
            <div
              className="order-list"
              ref={ref => {
                this.orderListRef = ref;
              }}
            >
              {miniOrderList.map((order, id) => {
                let renter = toJS(miniOrderList[id].renter);
                let receiver = toJS(miniOrderList[id].receiver);
                const returnRentInfo = toJS(this.props.energyRental.returnRentInfo);
                let isSelf = order.receiver === defaultAccount;

                let unrecoveredEnergyAmount = isSelf
                  ? BigNumber(returnRentInfo.unrecoveredEnergyAmount).plus(10000)
                  : returnRentInfo.unrecoveredEnergyAmount;
                let unrecoveredEnergyFee = BigNumber(returnRentInfo.dailyRent)
                  .times(BigNumber(unrecoveredEnergyAmount).div(returnRentInfo.rentAmount))
                  .times(0.5);
                let rentRemainAndsecurityDeposit = BigNumber(returnRentInfo.rentRemain).plus(
                  returnRentInfo.securityDeposit
                );

                unrecoveredEnergyFee = BigNumber(unrecoveredEnergyFee).gt(rentRemainAndsecurityDeposit)
                  ? rentRemainAndsecurityDeposit
                  : unrecoveredEnergyFee;

                let toBeLiquidated = order.canRentSeconds < 5 * 60;

                let redAlert = order.canRentSeconds >= 5 * 60 && order.canRentSeconds < 40 * 60;

                let yellowWarning = order.canRentSeconds >= 40 * 60 && order.canRentSeconds < 24 * 60 * 60;

                return (
                  <div className="order-item renter" key={id}>
                    <div className="order-header">
                      {intl.get('energy_rental.mini_list.order_title', { value: cutMiddle(order.receiver, 6, 6) })}

                      {order.receiver == defaultAccount ? (
                        <div className="rent-for-self-tips">
                          {intl.get('energy_rental.mini_list.self_address_tips')}
                        </div>
                      ) : (
                        <div className="rent-for-others-tips">
                          {intl.get('energy_rental.mini_list.other_address_tips')}
                        </div>
                      )}
                    </div>

                    <div className="order-detail">
                      <div className="detail-row energy-row">
                        <div className="field">
                          <Tooltip
                            title={() => {
                              return intl.getHTML('energy_rental.mini_list.energy_amount_hint', {
                                value: formatNumber(BigNumber(order.delegateTrxAmount)._toFixed(0, 0), 0)
                              });
                            }}
                            placement="topLeft"
                            arrowPointAtCenter
                            overlayClassName="j-tooltip-dropdown energy-rental-tooltip"
                            onMouseEnter={() => {
                              window.gtag('event', 'energyrent_pro_orderlist_hoverenergy', {
                                'event_category': 'energyrent',
                                'event_label': 'energyrent_pro_orderlist_hoverenergy'
                              });
                            }}
                          >
                            <div className="j-tooltip-icon"></div>
                          </Tooltip>

                          <TooltipText
                            title={() => {
                              return intl.getHTML('energy_rental.mini_list.energy_amount_hint', {
                                value: formatNumber(BigNumber(order.delegateTrxAmount)._toFixed(0, 0), 0)
                              });
                            }}
                            placement="topLeft"
                            overlayClassName="j-tooltip-dropdown energy-rental-tooltip"
                            onMouseEnter={() => {
                              window.gtag('event', 'energyrent_pro_orderlist_hoverenergy', {
                                'event_category': 'energyrent',
                                'event_label': 'energyrent_pro_orderlist_hoverenergy'
                              });
                            }}
                          >
                            {intl.get('energy_rental.mini_list.energy_amount_title')}
                          </TooltipText>
                        </div>
                        <div className="value">
                          <span>{formatNumber(BigNumber(order.energyAmount), 0)}</span>
                          <div className="energy-icon"></div>
                        </div>
                      </div>
                      <div className={toBeLiquidated ? 'warning-box' : ''}>
                        <div className={'tip-box ' + (redAlert ? 'alert' : yellowWarning ? 'warning' : '')}>
                          <div className="detail-row time-row">
                            <div className="field">
                              <Tooltip
                                title={() => {
                                  return intl.getHTML('energy_rental.mini_list.rental_time_hint');
                                }}
                                placement="topLeft"
                                arrowPointAtCenter
                                overlayClassName="j-tooltip-dropdown energy-rental-tooltip"
                                onMouseEnter={() => {
                                  window.gtag('event', 'energyrent_pro_orderlist_hovertime', {
                                    'event_category': 'energyrent',
                                    'event_label': 'energyrent_pro_orderlist_hovertime'
                                  });
                                }}
                              >
                                <div className="j-tooltip-icon"></div>
                              </Tooltip>

                              <TooltipText
                                title={() => {
                                  return intl.getHTML('energy_rental.mini_list.rental_time_hint');
                                }}
                                placement="topLeft"
                                overlayClassName="j-tooltip-dropdown energy-rental-tooltip"
                                onMouseEnter={() => {
                                  window.gtag('event', 'energyrent_pro_orderlist_hovertime', {
                                    'event_category': 'energyrent',
                                    'event_label': 'energyrent_pro_orderlist_hovertime'
                                  });
                                }}
                              >
                                {durationUnitSwitch
                                  ? intl.get('energy_rental.mini_list.rental_time_title_remaining')
                                  : intl.get('energy_rental.mini_list.rental_time_title_expiration')}
                              </TooltipText>
                            </div>
                            <div className="flex-center">
                              {toBeLiquidated ? (
                                <div>
                                  <div className={'value value-dash red'}>{intl.get('s7.to_be_liquidated')}</div>
                                </div>
                              ) : (
                                <Tooltip
                                  placement="bottomRight"
                                  arrowPointAtCenter
                                  overlayInnerStyle={{ padding: 0 }}
                                  onMouseEnter={() => {
                                    this.props.energyRental.getReturnRentInfo(renter, receiver);
                                    window.gtag('event', 'energyrent_pro_orderlist_hoverRemainTRX', {
                                      'event_category': 'energyrent',
                                      'event_label': 'energyrent_pro_orderlist_hoverRemainTRX'
                                    });
                                  }}
                                  overlayClassName="j-tooltip-dropdown j-tooltip-dropdown-receiver"
                                  title={
                                    <div className="rent-info-tooltip">
                                      <div className="detail-row">
                                        <div className="row-title2">
                                          {intl.get('energy_rental.end_order_modal.remaining_trx')}
                                        </div>
                                        <div className="row-value2">
                                          {formatNumber(
                                            BigNumber(returnRentInfo.rentRemain)
                                              .plus(returnRentInfo.securityDeposit)
                                              .minus(unrecoveredEnergyFee),
                                            6
                                          )}{' '}
                                          TRX
                                        </div>
                                      </div>
                                      <div className="divider-line" />
                                      <div className="detail-row">
                                        <div className="row-title">
                                          {intl.get('energy_rental.end_order_modal.remaining_rent')}
                                        </div>
                                        <div className="row-value">
                                          {formatNumber(returnRentInfo.rentRemain, 6)} TRX
                                        </div>
                                      </div>
                                      <div className="detail-row">
                                        <div className="row-title">
                                          {intl.get('energy_rental.end_order_modal.security_deposit')}
                                        </div>
                                        <div className="row-value">
                                          {formatNumber(returnRentInfo.securityDeposit, 6)} TRX
                                        </div>
                                      </div>
                                      <div className="detail-row" style={{ alignItems: 'flex-start' }}>
                                        <div className="row-title">
                                          <div style={{ textAlign: 'start' }}>
                                            {intl.get('energy_rental.end_order_modal.deducted_unrecovered_energy_hint')}
                                          </div>
                                          <div style={{ textAlign: 'start' }}>
                                            {intl.get(
                                              'energy_rental.end_order_modal.deducted_unrecovered_energy_detail',
                                              {
                                                value: formatNumber(unrecoveredEnergyAmount, 0)
                                              }
                                            )}
                                          </div>
                                        </div>
                                        <div className="row-value">- {formatNumber(unrecoveredEnergyFee, 6)} TRX</div>
                                      </div>
                                    </div>
                                  }
                                >
                                  <div className="flex-center">
                                    <span
                                      className={
                                        'value value-dash' + (redAlert ? ' red' : yellowWarning ? ' yellow' : '')
                                      }
                                    >
                                      {durationUnitSwitch
                                        ? toDayHourMinString(order.canRentSeconds)
                                        : dateAfterSecondsToISO(order.canRentSeconds)}
                                    </span>

                                    {mobile ? (
                                      <div
                                        className="switch-icon"
                                        onClick={() => {
                                          this.setState({ durationUnitSwitch: !durationUnitSwitch });
                                          window.gtag('event', 'energyrent_pro_orderlist_clicktime', {
                                            'event_category': 'energyrent',
                                            'event_label': 'energyrent_pro_orderlist_clicktime'
                                          });
                                        }}
                                      ></div>
                                    ) : (
                                      <Tooltip
                                        title={() => {
                                          return intl.getHTML(
                                            'energy_rental.mini_list.rental_time_display_switch_hint'
                                          );
                                        }}
                                        placement="topRight"
                                        arrowPointAtCenter
                                        overlayClassName="j-tooltip-dropdown energy-rental-tooltip"
                                      >
                                        <div
                                          className="switch-icon"
                                          onClick={() => {
                                            this.setState({ durationUnitSwitch: !durationUnitSwitch });
                                            window.gtag('event', 'energyrent_pro_orderlist_clicktime', {
                                              'event_category': 'energyrent',
                                              'event_label': 'energyrent_pro_orderlist_clicktime'
                                            });
                                          }}
                                        ></div>
                                      </Tooltip>
                                    )}
                                  </div>
                                </Tooltip>
                              )}
                              {toBeLiquidated && (
                                <Tooltip
                                  placement="bottomRight"
                                  arrowPointAtCenter
                                  overlayInnerStyle={{ width: 300 }}
                                  overlayClassName="j-tooltip-dropdown"
                                  title={
                                    <div className="rent-info-tooltip">
                                      <div className="detail-row">
                                        <div className="row-title2">
                                          {intl.get('energy_rental.end_order_modal.remaining_trx')}
                                        </div>
                                        <div className="row-value2">
                                          {formatNumber(
                                            BigNumber(returnRentInfo.rentRemain)
                                              .plus(returnRentInfo.securityDeposit)
                                              .minus(unrecoveredEnergyFee),
                                            6
                                          )}{' '}
                                          TRX
                                        </div>
                                      </div>
                                      <div className="divider-line" />
                                      <div className="detail-row">
                                        <div className="row-title">
                                          {intl.get('energy_rental.end_order_modal.remaining_rent')}
                                        </div>
                                        <div className="row-value">
                                          {formatNumber(returnRentInfo.rentRemain, 6)} TRX
                                        </div>
                                      </div>
                                      <div className="detail-row">
                                        <div className="row-title">
                                          {intl.get('energy_rental.end_order_modal.security_deposit')}
                                        </div>
                                        <div className="row-value">
                                          {formatNumber(returnRentInfo.securityDeposit, 6)} TRX
                                        </div>
                                      </div>
                                      <div className="detail-row" style={{ alignItems: 'flex-start' }}>
                                        <div className="row-title">
                                          <div style={{ textAlign: 'start' }}>
                                            {intl.get('energy_rental.end_order_modal.deducted_unrecovered_energy_hint')}
                                          </div>
                                          <div style={{ textAlign: 'start' }}>
                                            {intl.get(
                                              'energy_rental.end_order_modal.deducted_unrecovered_energy_detail',
                                              {
                                                value: formatNumber(unrecoveredEnergyAmount, 0)
                                              }
                                            )}
                                          </div>
                                        </div>
                                        <div className="row-value">- {formatNumber(unrecoveredEnergyFee, 6)} TRX</div>
                                      </div>
                                    </div>
                                  }
                                  trigger={['hover', 'click']}
                                >
                                  <span className="j-tooltip-icon ml-4"></span>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                          {(redAlert || yellowWarning) && (
                            <div className="detail-row">
                              <div className={'warning-box ' + (yellowWarning ? 'none' : '')}>
                                {redAlert ? (
                                  <svg
                                    width="12"
                                    height="11"
                                    viewBox="0 0 12 11"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      fill="#FF5266"
                                      fillRule="evenodd"
                                      clipRule="evenodd"
                                      d="M7.53593 0.95513L11.7597 8.27099C12.4424 9.45335 11.5891 10.9313 10.2238 10.9313H1.77619C0.410912 10.9313 -0.44238 9.45335 0.240255 8.27099L4.46407 0.95513C5.14671 -0.227232 6.8533 -0.227229 7.53593 0.95513ZM6.76797 1.39852C6.42665 0.807335 5.57335 0.807335 5.23203 1.39851L1.00822 8.71437C0.666903 9.30555 1.09355 10.0445 1.77619 10.0445H10.2238C10.9064 10.0445 11.3331 9.30555 10.9918 8.71437L6.76797 1.39852Z"
                                    />
                                    <path
                                      fill="#FF5266"
                                      d="M6.5 8.02381C6.5 8.2868 6.2868 8.5 6.02381 8.5H5.97619C5.7132 8.5 5.5 8.2868 5.5 8.02381C5.5 7.76082 5.7132 7.54762 5.97619 7.54762H6.02381C6.2868 7.54762 6.5 7.76082 6.5 8.02381ZM6 6.83333C5.72386 6.83333 5.5 6.60948 5.5 6.33333V4C5.5 3.72386 5.72386 3.5 6 3.5C6.27614 3.5 6.5 3.72386 6.5 4V6.33333C6.5 6.60948 6.27614 6.83333 6 6.83333Z"
                                    />
                                  </svg>
                                ) : (
                                  <svg
                                    width="12"
                                    height="13"
                                    viewBox="0 0 12 13"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <circle cx="6" cy="6.5" r="5.5" stroke="#F58721" />
                                    <path
                                      fill="#F58721"
                                      d="M6.76365 8.95452C6.76365 9.25577 6.51944 9.49998 6.2182 9.49998H6.00001C5.69877 9.49998 5.45456 9.25577 5.45456 8.95452C5.45456 8.65328 5.69877 8.40907 6.00001 8.40907H6.2182C6.51944 8.40907 6.76365 8.65328 6.76365 8.95452ZM6.10911 7.59089C5.74761 7.59089 5.45456 7.29784 5.45456 6.93634V4.42725C5.45456 4.06575 5.74761 3.77271 6.10911 3.77271C6.4706 3.77271 6.76365 4.06576 6.76365 4.42725V6.93634C6.76365 7.29784 6.4706 7.59089 6.10911 7.59089Z"
                                    />
                                  </svg>
                                )}

                                <span className={redAlert ? 'red-tip' : 'yellow-tip'}>
                                  {redAlert
                                    ? intl.get('s9.duration_lt_40m_for_list')
                                    : intl.get('s9.duration_lt_24h_for_list')}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                        {toBeLiquidated && (
                          <div className="tobe-liquidated-warning flex-center">
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 12 12"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                fill-rule="evenodd"
                                clip-rule="evenodd"
                                d="M7.53593 1.45537L11.7597 8.77123C12.4424 9.95359 11.5891 11.4315 10.2238 11.4315H1.77619C0.410912 11.4315 -0.44238 9.95359 0.240255 8.77123L4.46407 1.45537C5.14671 0.273012 6.8533 0.273015 7.53593 1.45537ZM6.76797 1.89876C6.42665 1.30758 5.57335 1.30758 5.23203 1.89876L1.00822 9.21462C0.666903 9.8058 1.09355 10.5448 1.77619 10.5448H10.2238C10.9064 10.5448 11.3331 9.8058 10.9918 9.21462L6.76797 1.89876Z"
                                fill="#FF5266"
                              />
                              <path
                                d="M6.5 8.52381C6.5 8.7868 6.2868 9 6.02381 9H5.97619C5.7132 9 5.5 8.7868 5.5 8.52381C5.5 8.26082 5.7132 8.04762 5.97619 8.04762H6.02381C6.2868 8.04762 6.5 8.26082 6.5 8.52381ZM6 7.33333C5.72386 7.33333 5.5 7.10948 5.5 6.83333V4.5C5.5 4.22386 5.72386 4 6 4C6.27614 4 6.5 4.22386 6.5 4.5V6.83333C6.5 7.10948 6.27614 7.33333 6 7.33333Z"
                                fill="#FF5266"
                              />
                            </svg>
                            <span className="red">{intl.get('s7.tips3')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="action-btns">
                      <button
                        className="action-btn end-btn"
                        onClick={() => {
                          this.onClickEndButton(order);
                          window.gtag('event', 'click', {
                            'event_category': 'energyrent',
                            'event_label': 'energyrent_pro_orderlist_clickEnd'
                          });
                        }}
                      >
                        {intl.get('energy_rental.mini_list.end_btn')}
                      </button>
                      <button
                        className="action-btn add-btn"
                        onClick={() => {
                          this.onClickRenewButton(order);
                          window.gtag('event', 'click', {
                            'event_category': 'energyrent',
                            'event_label': 'energyrent_pro_orderlist_clickRenew'
                          });
                        }}
                      >
                        {intl.get('energy_rental.mini_list.renew_btn')}
                      </button>
                    </div>
                  </div>
                );
              })}
              {miniReceiverTotal > 0 && (
                <>
                  <div className="order-list-subtitle">
                    <span>{intl.get('s7.others_for_me')}</span>
                    <div className="olt-line"></div>
                  </div>
                  {this.othersForMeList()}
                </>
              )}
            </div>
          </div>
        </div>
        <div
          className={'blur-filter-on-list' + (orderListTotalCount + miniReceiverTotal <= 2 ? ' transparent' : '')}
        ></div>
        {/* {showOrderListBlurFilter && (
          <div className={classnames('blur-filter-on-list', { 'transparent': orderListAtBottom })}></div>
        )} */}

        {showAllOrderLink && (
          <Link
            className="order-list-link purple-link-btn hover"
            to={'/energyRentalOrderList?lang=' + lang}
            onClick={() => {
              window.gtag('event', 'click', {
                'event_category': 'energyrent',
                'event_label': 'energyrent_pro_orderlist_clickAllorders'
              });
            }}
          >
            {intl.get('energy_rental.mini_list.order_list_btn')}
          </Link>
        )}
        <EndRentalTipModal
          endRentalInfo={this.state.order}
          endRetalFn={() => this.onClickEndButton(this.state.order)}
        />
      </div>
    );
  }
}
export default RentalOrderMiniList;
