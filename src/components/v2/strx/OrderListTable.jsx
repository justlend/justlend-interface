import { Select, Skeleton, Table, Tooltip } from 'antd';
import isMobile from 'ismobilejs';
import { toJS } from 'mobx';
import { inject, observer } from 'mobx-react';
import React from 'react';
import intl from 'react-intl-universal';
import { Link } from 'react-router-dom';
import '../../../assets/css/v2/footer.scss';
import '../../../assets/css/v2/home-market.scss';
import '../../../assets/css/v2/rent-order-list.scss';
import energyIcon from '../../../assets/images/v2/energy-rent/mining/energy.svg';
import energyIconWhite from '../../../assets/images/v2/energy-rent/mining/white-theme/energy.svg';
import backIconWhite from '../../../assets/images/v2/energy-rental/arrow-left-white.svg';
import backIcon from '../../../assets/images/v2/energy-rental/arrow-left.svg';
import {
  BigNumber,
  cutMiddle,
  emptyReactNodeNew,
  formatNumber,
  transferTime,
  toFixedDown
} from '../../../utils/helper';
import EndRentalTipModal from '../../Modals/v2/energy-rental/EndRentalTip';

const { Option } = Select;

@inject('network')
@inject('lend')
@inject('system')
@inject('energyRental')
@observer
class OrderListTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isOrderByOpen: false,
      rentType: 1,
      orderBy: 0,
      isExpiryTime: false,
      isEnergy: true,
      mobile: isMobile(window.navigator).any,
      pageNumber: 0,
      otherPageNumber: 0,
      current: 'all',
      item: {}
    };
  }

  componentDidMount = async () => {
    const { isConnected } = this.props.network;

    if (isConnected) {
      await this.props.energyRental.getUsageChargeRatioData();
      this.getOrderList();
    } else {
      this.props.network.on('connect', async () => {
        await this.props.energyRental.getUsageChargeRatioData();
        this.getOrderList();
      });
    }
  };

  pageHeader = () => {
    const { theme } = this.props.lend;

    return (
      <div className="order-list-header">
        <Link
          className="back-btn"
          to={'/energyRental'}
          onClick={() => {
            window.gtag('event', 'energyrent_pro_orderpage_clickBack', {
              'event_category': 'energyrent',
              'event_label': 'energyrent_pro_orderpage_clickBack'
            });
          }}
        >
          <img className="back-icon" src={theme === 'white' ? backIconWhite : backIcon} alt="" />
          {intl.get('strx.rent_list_back')}
        </Link>
        <div className="title">{intl.get('strx.rent_list_title')}</div>
      </div>
    );
  };

  toggleIsExpiryTime = () => {
    const { isExpiryTime } = this.state;
    this.setState({ isExpiryTime: !isExpiryTime });
    window.gtag('event', 'energyrent_pro_orderpage_clickTimechange', {
      'event_category': 'energyrent',
      'event_label': 'energyrent_pro_orderpage_clickTimechange'
    });
  };

  toggleIsEnergy = () => {
    const { isEnergy } = this.state;
    this.setState({ isEnergy: !isEnergy });
    window.gtag('event', 'energyrent_pro_orderpage_clickDelegTRX', {
      'event_category': 'energyrent',
      'event_label': 'energyrent_pro_orderpage_clickDelegTRX'
    });
  };

  onClickEndButton = (orderInfo, rentFor) => {
    if (this.props.network.isRightChain === 0) {
      this.props.network.changeChain();
      return;
    }

    this.props.energyRental.setData({
      endOrderModalVisible: true,
      endOrderModalInfo: orderInfo
    });
    if (rentFor === 'receiver') {
      this.props.energyRental.setData({
        endOrderType: 'receiver'
      });
    }
    this.props.system.clearRejectError();
    window.gtag('event', 'energyrent_pro_orderpage_clickEnd', {
      'event_category': 'energyrent',
      'event_label': 'energyrent_pro_orderpage_clickEnd'
    });
  };

  onClickRenewButton = (receiver, canRentSeconds) => {
    if (this.props.network.isRightChain === 0) {
      this.props.network.changeChain();
      return;
    }

    this.props.energyRental.setData({
      addOrderModalVisible: true,
      isAddOrderModalApprovingTrans: false,
      addOrderModalIsRenew: true,
      renewOrderShouldUseSavedInfo: false,
      addOrderModalStep: 2,
      renewOrderExistingRemainingSeconds: canRentSeconds
    });

    this.props.energyRental.getExistingRentalOrderInfo(
      receiver,
      canRentSeconds > 0 ? 100000 : 0,
      0,
      canRentSeconds > 0 ? true : false
    );
    window.gtag('event', 'energyrent_pro_orderpage_clickRenew', {
      'event_category': 'energyrent',
      'event_label': 'energyrent_pro_orderpage_clickRenew'
    });
  };

  getInfoColumns = rentFor => {
    const { defaultAccount } = this.props.network;
    const { isExpiryTime, isEnergy } = this.state;
    const { theme } = this.props.lend;
    const isWhite = theme === 'white';

    let columns = [
      {
        title:
          rentFor === 'receiver' ? intl.get('s7.rented_from') : intl.get('energy_rental_records.receiving_address'),
        dataIndex: 'receiver',
        key: '1',
        render: (text, item) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {rentFor === 'receiver' ? item.renter : text}
            {rentFor === 'receiver' ? null : text === defaultAccount ? (
              <span className="current-receiver">{intl.get('strx.current_acct')}</span>
            ) : null}
          </div>
        )
      },
      {
        title: (
          <span onClick={this.toggleIsEnergy} style={{ cursor: 'pointer' }}>
            <span className={isEnergy ? 'active' : 'inactive'}>{intl.get('strx.energy')}</span>
            <span className="slash">|</span>
            <span className={isEnergy ? 'inactive' : 'active'}>{intl.get('strx.delegated_trx')}</span>
          </span>
        ),
        dataIndex: 'energyAmount',
        key: '2',
        render: (text, item) => (
          <div className="energyAmount">
            <img className="energy-icon" src={isWhite ? energyIconWhite : energyIcon} alt="Energy Icon" />
            {formatNumber(text, 0)}
          </div>
        )
      },
      {
        title: () => (
          <span className="flex-box">
            <span>
              {isExpiryTime
                ? intl.get('energy_rental.mini_list.rental_time_title_expiration')
                : intl.get('energy_rental.mini_list.rental_time_title_remaining')}
            </span>{' '}
            <span className="switch-icon" onClick={this.toggleIsExpiryTime} />
          </span>
        ),
        dataIndex: 'canRentSeconds',
        key: '3',
        width: '220px',
        render: (text, item, i) => this.renderCanRentSeconds(text, i, rentFor === 'receiver' ? 'receiver' : '')
      },
      {
        title: intl.get('strx.operation'),
        dataIndex: 'action',
        key: '4',
        width: '120px',
        render: (text, item) => (
          <div className="btn-wrap">
            <button
              className="j-btn j-rent-refund"
              onClick={e => {
                e.preventDefault();
                if (rentFor === 'receiver') {
                  this.setState({ item });
                  this.props.energyRental.setData({ endRentalTipShow: true });
                } else {
                  this.onClickEndButton(item);
                }
              }}
            >
              {intl.get('strx.refund')}
            </button>
            {rentFor === 'receiver' ? (
              <Tooltip
                placement="bottomRight"
                arrowPointAtCenter
                overlayClassName="j-tooltip-dropdown j-tooltip-dropdown-receiver"
                title={intl.get('s7.tips2')}
              >
                <div>
                  <button className="j-btn j-rent-renew" disabled>
                    {intl.get('strx.renew')}
                  </button>
                </div>
              </Tooltip>
            ) : (
              <button
                className="j-btn j-rent-renew"
                onClick={e => {
                  e.preventDefault();
                  this.props.energyRental.getReturnRentInfo(item.renter, item.receiver);
                  this.onClickRenewButton(item.receiver, item.canRentSeconds);
                }}
              >
                {intl.get('strx.renew')}
              </button>
            )}
          </div>
        )
      }
    ];

    if (!isEnergy) {
      columns[1] = {
        ...columns[1],
        dataIndex: 'delegateTrxAmount',
        render: (text, item) => (
          <div className="delegateTrxAmount">
            {formatNumber(text, 0, { cutZero: true, round: true, roundMode: 'ROUND_UP' })} TRX
          </div>
        )
      };
    }

    return columns;
  };

  setOrderBy = orderBy => {
    this.setState({ pageNumber: 0, orderBy }, () => this.getOrderList());
  };

  onClickShowMore = () => {
    this.setState(
      ({ pageNumber }) => ({ pageNumber: pageNumber + 1 }),
      () => this.getOrderList(true, 'renter')
    );
    window.gtag('event', 'energyrent_pro_orderpage_clickMore', {
      'event_category': 'energyrent',
      'event_label': 'energyrent_pro_orderpage_clickMore'
    });
  };

  onClickShowMoreOtherOrders = () => {
    this.setState(
      ({ otherPageNumber }) => ({ otherPageNumber: otherPageNumber + 1 }),
      () => this.getOrderList(true, 'receiver')
    );
  };

  getOrderList = async (isLoadMore = false, type) => {
    const { pageNumber, otherPageNumber, orderBy, rentType } = this.state;

    this.props.energyRental.getStrxRentAllOrderList({
      rentType,
      orderBy,
      page: type === 'receiver' ? otherPageNumber : pageNumber,
      isLoadMore,
      type
    });
  };

  renderMarketTop = () => {
    const { orderBy, current } = this.state;
    const { theme } = this.props.lend;
    const { total } = this.props.energyRental.orderList;
    const { receiverTotal } = this.props.energyRental.receiverOrdersList;
    const isWhite = theme === 'white';
    const openSelect = () => this.setState({ isOrderByOpen: true });
    const closeSelect = () => this.setState({ isOrderByOpen: false });

    return (
      <>
        <div className="order-tabs">
          <div
            className={'order-title' + (current === 'all' ? ' current' : '')}
            onClick={() => this.setState({ current: 'all' })}
          >
            {intl.get('s7.all')}
            <span className="order-count">
              {receiverTotal && total
                ? BigNumber(total).plus(receiverTotal).toString()
                : total || receiverTotal
                ? total || receiverTotal
                : 0}
            </span>
          </div>
          <div
            className={'order-title' + (current === 'renter' ? ' current' : '')}
            onClick={() => this.setState({ current: 'renter' })}
          >
            {intl.get('s7.my_rental')}
            <span className="order-count">{total}</span>
          </div>
          <div
            className={'order-title' + (current === 'receiver' ? ' current' : '')}
            onClick={() => this.setState({ current: 'receiver' })}
          >
            {intl.get('s7.others_for_me')}
            <span className="order-count">{receiverTotal ? receiverTotal : 0}</span>
          </div>
        </div>
        <div className="j-order-list">
          <Select
            className="order-select"
            defaultValue={orderBy}
            onChange={order => {
              this.setOrderBy(order);
              window.gtag('event', 'energyrent_pro_orderpage_clickchangeSort', {
                'event_category': 'energyrent',
                'event_label': 'energyrent_pro_orderpage_clickchangeSort'
              });
              closeSelect();
            }}
            // open={this.state.isOrderByOpen}
            // onMouseEnter={openSelect}
            // onTouchStart={openSelect}
            dropdownAlign={{ offset: [-45, -3] }}
            dropdownStyle={{ background: isWhite ? '#F9FAFC' : '#40414a', minWidth: '126px', padding: '10px 0' }}
          >
            <Option className={`order-option ${theme}`} value={0}>
              {intl.get('strx.expiration_time')}
            </Option>
            <Option className={`order-option ${theme}`} value={1}>
              {intl.get('strx.rental_time')}
            </Option>
          </Select>
        </div>
      </>
    );
  };

  renderCanRentSeconds = (text, i, rentFor) => {
    const timestamp = new Date().getTime() + Number(text) * 1e3;

    const { days, hours, mins, seconds } = transferTime(timestamp);
    // const days = 0, hours = 0, mins = 30, seconds = 0; // for test
    const { isExpiryTime, mobile } = this.state;
    let date = new Date(timestamp);
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    month = month < 10 ? '0' + month : month;
    let day = date.getDate();
    day = day < 10 ? '0' + day : day;
    let h = date.getHours();
    h = h < 10 ? '0' + h : h;
    let m = date.getMinutes();
    m = m < 10 ? '0' + m : m;

    let renter, receiver;
    if (rentFor === 'receiver') {
      // const { receiverOrders, receiverTotal } = this.props.energyRental.receiverOrdersList;
      const receiverOrdersList = this.props.energyRental.receiverOrdersList;
      if (receiverOrdersList) {
        renter = toJS(receiverOrdersList?.receiverOrders[i]?.renter);
        receiver = toJS(receiverOrdersList?.receiverOrders[i]?.receiver);
      }
    } else {
      const orderList = this.props.energyRental.orderList;
      if (orderList) {
        renter = toJS(orderList?.orders[i]?.renter);
        receiver = toJS(orderList?.orders[i]?.receiver);
      }
    }

    const returnRentInfo = toJS(this.props.energyRental.returnRentInfo);
    const { defaultAccount } = this.props.network;
    const { usageChargeRatio } = this.props.energyRental;
    let isSelf = receiver === defaultAccount;
    let unrecoveredEnergyAmount = isSelf
      ? BigNumber(returnRentInfo.unrecoveredEnergyAmount).plus(10000)
      : returnRentInfo.unrecoveredEnergyAmount;
    let unrecoveredEnergyFee = BigNumber(returnRentInfo.dailyRent)
      .times(BigNumber(unrecoveredEnergyAmount).div(returnRentInfo.rentAmount))
      .times(usageChargeRatio);
    let rentRemainAndsecurityDeposit = BigNumber(returnRentInfo.rentRemain).plus(returnRentInfo.securityDeposit);

    unrecoveredEnergyFee = BigNumber(unrecoveredEnergyFee).gt(rentRemainAndsecurityDeposit)
      ? rentRemainAndsecurityDeposit
      : unrecoveredEnergyFee;

    const rentInfoTooltip = text => (
      <div className="flex-cell">
        {days <= 0 && hours <= 0 && mins < 5 ? (
          <Tooltip
            placement={mobile ? 'bottomRight' : 'bottom'}
            arrowPointAtCenter
            overlayClassName="j-tooltip-dropdown j-tooltip-dropdown-receiver red"
            title={intl.get('s7.tips3')}
            trigger={['hover', 'click']}
          >
            <span>{text}</span>
          </Tooltip>
        ) : (
          text
        )}

        <Tooltip
          placement={mobile ? 'bottomRight' : 'bottom'}
          arrowPointAtCenter
          overlayInnerStyle={{ padding: 0 }}
          onMouseEnter={() => {
            this.props.energyRental.getReturnRentInfo(renter, receiver);
            window.gtag('event', 'energyrent_pro_orderpage_hoverremainTRX', {
              'event_category': 'energyrent',
              'event_label': 'energyrent_pro_orderpage_hoverremainTRX'
            });
          }}
          overlayClassName="j-tooltip-dropdown j-tooltip-dropdown-receiver"
          title={
            <div className="rent-info-tooltip">
              <div className="detail-row">
                <div className="row-title2">{intl.get('energy_rental.refund_of_deposit')}</div>
                <div className="row-value2">
                  {formatNumber(
                    BigNumber(toFixedDown(returnRentInfo.rentRemain, 6))
                      .plus(toFixedDown(returnRentInfo.securityDeposit, 6))
                      .minus(toFixedDown(unrecoveredEnergyFee, 6)),
                    6
                  )}{' '}
                  TRX
                </div>
              </div>
              <div className="divider-line" />
              <div className="detail-row">
                <div className="row-title">{intl.get('energy_rental.end_order_modal.remaining_rent')}</div>
                <div className="row-value">
                  {formatNumber(BigNumber(returnRentInfo.rentRemain).plus(returnRentInfo.securityDeposit), 6)} TRX
                </div>
              </div>
              {/* <div className="detail-row">
                <div className="row-title">{intl.get('energy_rental.end_order_modal.security_deposit')}</div>
                <div className="row-value">{formatNumber(returnRentInfo.securityDeposit, 6)} TRX</div>
              </div> */}
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
        >
          <span className="j-tooltip-icon ml-4"></span>
        </Tooltip>
      </div>
    );

    return isExpiryTime ? (
      days <= 0 && hours <= 0 && mins < 5 ? (
        <div className="flex-cell">
          {rentInfoTooltip((text = <span className="expiring expiring-new">{intl.get('s7.to_be_liquidated')}</span>))}
        </div>
      ) : (
        <div className="flex-cell">
          {days <= 0 && hours <= 0 && mins >= 5 && mins < 40 ? (
            <Tooltip
              title={
                <div className="warning-box">
                  <svg width="12" height="11" viewBox="0 0 12 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M7.53593 0.95513L11.7597 8.27099C12.4424 9.45335 11.5891 10.9313 10.2238 10.9313H1.77619C0.410912 10.9313 -0.44238 9.45335 0.240255 8.27099L4.46407 0.95513C5.14671 -0.227232 6.8533 -0.227229 7.53593 0.95513ZM6.76797 1.39852C6.42665 0.807335 5.57335 0.807335 5.23203 1.39851L1.00822 8.71437C0.666903 9.30555 1.09355 10.0445 1.77619 10.0445H10.2238C10.9064 10.0445 11.3331 9.30555 10.9918 8.71437L6.76797 1.39852Z"
                      fill="#FF5266"
                    />
                    <path
                      d="M6.5 8.02381C6.5 8.2868 6.2868 8.5 6.02381 8.5H5.97619C5.7132 8.5 5.5 8.2868 5.5 8.02381C5.5 7.76082 5.7132 7.54762 5.97619 7.54762H6.02381C6.2868 7.54762 6.5 7.76082 6.5 8.02381ZM6 6.83333C5.72386 6.83333 5.5 6.60948 5.5 6.33333V4C5.5 3.72386 5.72386 3.5 6 3.5C6.27614 3.5 6.5 3.72386 6.5 4V6.33333C6.5 6.60948 6.27614 6.83333 6 6.83333Z"
                      fill="#FF5266"
                    />
                  </svg>
                  <span>{intl.get('s9.duration_lt_40m_for_list')}</span>
                </div>
              }
              overlayClassName="j-tooltip-dropdown orderlist-wb red"
              placement="bottom"
            >
              {rentInfoTooltip(
                (text = (
                  <span className="flex-cell-text red-alert">
                    {year}-{month}-{day} {h}:{m}
                  </span>
                ))
              )}
            </Tooltip>
          ) : days <= 0 && hours < 24 && (mins >= 40 || (mins < 40 && hours >= 1)) ? (
            <Tooltip
              title={
                <div className="warning-box">
                  <svg width="12" height="13" viewBox="0 0 12 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="6" cy="6.5" r="5.5" stroke="#F58721" />
                    <path
                      d="M6.76368 8.95452C6.76368 9.25577 6.51947 9.49998 6.21823 9.49998H6.00004C5.6988 9.49998 5.45459 9.25577 5.45459 8.95452C5.45459 8.65328 5.6988 8.40907 6.00004 8.40907H6.21823C6.51947 8.40907 6.76368 8.65328 6.76368 8.95452ZM6.10914 7.59089C5.74764 7.59089 5.45459 7.29784 5.45459 6.93634V4.42725C5.45459 4.06575 5.74764 3.77271 6.10914 3.77271C6.47063 3.77271 6.76368 4.06576 6.76368 4.42725V6.93634C6.76368 7.29784 6.47063 7.59089 6.10914 7.59089Z"
                      fill="#F58721"
                    />
                  </svg>
                  <span>{intl.get('s9.duration_lt_24h_for_list')}</span>
                </div>
              }
              overlayClassName="j-tooltip-dropdown orderlist-wb yellow"
              placement="bottom"
            >
              {rentInfoTooltip(
                (text = (
                  <span className="flex-cell-text yellow-warning">
                    {year}-{month}-{day} {h}:{m}
                  </span>
                ))
              )}
            </Tooltip>
          ) : (
            rentInfoTooltip(
              (text = (
                <span className="flex-cell-text">
                  {year}-{month}-{day} {h}:{m}
                </span>
              ))
            )
          )}
        </div>
      )
    ) : (
      <div className="flex-cell">
        {rentInfoTooltip(
          (text = (
            <>
              {days <= 0 && hours <= 0 && mins >= 5 && mins < 40 ? (
                <Tooltip
                  title={
                    <div className="warning-box">
                      <svg width="12" height="11" viewBox="0 0 12 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M7.53593 0.95513L11.7597 8.27099C12.4424 9.45335 11.5891 10.9313 10.2238 10.9313H1.77619C0.410912 10.9313 -0.44238 9.45335 0.240255 8.27099L4.46407 0.95513C5.14671 -0.227232 6.8533 -0.227229 7.53593 0.95513ZM6.76797 1.39852C6.42665 0.807335 5.57335 0.807335 5.23203 1.39851L1.00822 8.71437C0.666903 9.30555 1.09355 10.0445 1.77619 10.0445H10.2238C10.9064 10.0445 11.3331 9.30555 10.9918 8.71437L6.76797 1.39852Z"
                          fill="#FF5266"
                        />
                        <path
                          d="M6.5 8.02381C6.5 8.2868 6.2868 8.5 6.02381 8.5H5.97619C5.7132 8.5 5.5 8.2868 5.5 8.02381C5.5 7.76082 5.7132 7.54762 5.97619 7.54762H6.02381C6.2868 7.54762 6.5 7.76082 6.5 8.02381ZM6 6.83333C5.72386 6.83333 5.5 6.60948 5.5 6.33333V4C5.5 3.72386 5.72386 3.5 6 3.5C6.27614 3.5 6.5 3.72386 6.5 4V6.33333C6.5 6.60948 6.27614 6.83333 6 6.83333Z"
                          fill="#FF5266"
                        />
                      </svg>
                      <span>{intl.get('s9.duration_lt_40m_for_list')}</span>
                    </div>
                  }
                  overlayClassName="j-tooltip-dropdown orderlist-wb red"
                  placement="bottom"
                >
                  {this.renderTime(days, hours, mins, 'red-alert')}
                </Tooltip>
              ) : days <= 0 && hours < 24 && (mins >= 40 || (mins < 40 && hours >= 1)) ? (
                <Tooltip
                  title={
                    <div className="warning-box">
                      <svg width="12" height="13" viewBox="0 0 12 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="6" cy="6.5" r="5.5" stroke="#F58721" />
                        <path
                          d="M6.76368 8.95452C6.76368 9.25577 6.51947 9.49998 6.21823 9.49998H6.00004C5.6988 9.49998 5.45459 9.25577 5.45459 8.95452C5.45459 8.65328 5.6988 8.40907 6.00004 8.40907H6.21823C6.51947 8.40907 6.76368 8.65328 6.76368 8.95452ZM6.10914 7.59089C5.74764 7.59089 5.45459 7.29784 5.45459 6.93634V4.42725C5.45459 4.06575 5.74764 3.77271 6.10914 3.77271C6.47063 3.77271 6.76368 4.06576 6.76368 4.42725V6.93634C6.76368 7.29784 6.47063 7.59089 6.10914 7.59089Z"
                          fill="#F58721"
                        />
                      </svg>
                      <span>{intl.get('s9.duration_lt_24h_for_list')}</span>
                    </div>
                  }
                  overlayClassName="j-tooltip-dropdown orderlist-wb yellow"
                  placement="bottom"
                >
                  {this.renderTime(days, hours, mins, 'yellow-warning')}
                </Tooltip>
              ) : (
                this.renderTime(days, hours, mins)
              )}
              {days <= 0 && hours <= 0 && mins < 5 && (
                <span className="expiring expiring-new">{intl.get('s7.to_be_liquidated')}</span>
              )}
              {/* {days <= 0 && hours <= 0 && mins <= 0 ? (
                <span className="expiring">
                  {intl.get(seconds > 0 ? 'strx.expiring' : 'energy_rental.mini_list.rental_time_expired')}
                </span>
              ) : null} */}
            </>
          ))
        )}
      </div>
    );
  };

  renderTime = (days, hours, mins, type) => {
    return (
      <span className={'flex-cell-text ' + type}>
        {days > 0 ? (
          <span>
            {days}
            {intl.get('energy_rental.date_format.day')}{' '}
          </span>
        ) : null}
        {hours > 0 ? (
          <span>
            {hours}
            {intl.get('energy_rental.date_format.hour')}{' '}
          </span>
        ) : null}
        {days > 0 || hours > 0 || mins >= 5 ? (
          <span>
            {mins}
            {intl.get('energy_rental.date_format.min')}{' '}
          </span>
        ) : null}
      </span>
    );
  };

  othersCardsMobileRender = () => {
    const { isExpiryTime, isEnergy, mobile, current } = this.state;
    const { theme } = this.props.lend;
    const isWhite = theme === 'white';
    const { defaultAccount } = this.props.network;
    const { orders, total } = this.props.energyRental.orderList;
    const { receiverOrders, receiverTotal } = this.props.energyRental.receiverOrdersList;
    const isLoading = this.props.energyRental.orderListIsLoading;

    return (
      <>
        {receiverOrders.map(
          ({ canRentSeconds, delegateTrxAmount, energyAmount, receiver, renter, startTimestamp }, i) => (
            <div className="mobile-card" key={i}>
              <div className="field">
                <div className="title">{intl.get('s7.rented_from')}</div>
                <div className="value receiver">
                  {renter === defaultAccount ? (
                    <span className="current-receiver">{intl.get('strx.current_acct')}</span>
                  ) : null}
                  <Tooltip
                    title={renter}
                    placement={!mobile ? 'top' : 'topLeft'}
                    arrowPointAtCenter
                    overlayClassName="j-tooltip-dropdown2"
                  >
                    {cutMiddle(renter, 4, 4)}
                  </Tooltip>
                </div>
              </div>

              <div className="field">
                <div className="title">
                  <span onClick={this.toggleIsEnergy} style={{ cursor: 'pointer' }}>
                    <span className={isEnergy ? 'active' : 'inactive'}>{intl.get('strx.energy')}</span>
                    <span className="slash">|</span>
                    <span className={isEnergy ? 'inactive' : 'active'}>{intl.get('strx.delegated_trx')}</span>
                  </span>
                </div>
                <div className="value">
                  {isEnergy ? (
                    <span>
                      <img className="energy-icon" src={isWhite ? energyIconWhite : energyIcon} alt="Energy Icon" />
                      {formatNumber(energyAmount, 0)}
                    </span>
                  ) : (
                    `${formatNumber(delegateTrxAmount, 0, {
                      cutZero: true,
                      round: true,
                      roundMode: 'ROUND_UP'
                    })} TRX`
                  )}
                </div>
              </div>

              <div className="field">
                <div className="title">
                  <span className="flex-box">
                    {isExpiryTime
                      ? intl.get('energy_rental.mini_list.rental_time_title_expiration')
                      : intl.get('energy_rental.mini_list.rental_time_title_remaining')}
                    <span className="switch-icon" onClick={this.toggleIsExpiryTime} />
                  </span>
                </div>
                <div className="value">{this.renderCanRentSeconds(canRentSeconds, i, 'receiver')}</div>
              </div>

              <div className="btn-wrap">
                <button
                  className="j-btn j-rent-refund"
                  onClick={e => {
                    e.preventDefault();
                    this.setState({
                      item: {
                        canRentSeconds,
                        delegateTrxAmount,
                        energyAmount,
                        receiver,
                        renter,
                        startTimestamp
                      }
                    });
                    this.props.energyRental.setData({ endRentalTipShow: true });

                    // this.onClickEndButton(
                    //   {
                    //     canRentSeconds,
                    //     delegateTrxAmount,
                    //     energyAmount,
                    //     receiver,
                    //     renter,
                    //     startTimestamp
                    //   },
                    //   'receiver'
                    // );
                  }}
                >
                  {intl.get('strx.refund')}
                </button>
                <Tooltip
                  placement="bottomLeft"
                  arrowPointAtCenter
                  overlayClassName="j-tooltip-dropdown j-tooltip-dropdown-receiver"
                  title={intl.get('s7.tips2')}
                >
                  <div className="btn-eles">
                    <button className="j-btn j-rent-renew" disabled>
                      {intl.get('strx.renew')}
                    </button>
                  </div>
                </Tooltip>
              </div>
            </div>
          )
        )}

        {receiverOrders.length < receiverTotal ? (
          <div className="load-more-btn" onClick={this.onClickShowMoreOtherOrders}>
            {intl.get('load_more')}
          </div>
        ) : null}
      </>
    );
  };

  render() {
    const { isExpiryTime, isEnergy, mobile, current } = this.state;
    const { theme } = this.props.lend;
    const isWhite = theme === 'white';
    const { defaultAccount } = this.props.network;
    const { orders, total } = this.props.energyRental.orderList;
    const { receiverOrders, receiverTotal } = this.props.energyRental.receiverOrdersList;
    const isLoading = this.props.energyRental.orderListIsLoading;

    return (
      <>
        {isLoading ? (
          <>
            <div className="order-list-header">
              <div className="order-list-skeleton">
                <Skeleton className="title-skeleton" active title={0} paragraph={{ rows: 1, width: '30%' }} />
                <Skeleton className="title-skeleton" active title={0} paragraph={{ rows: 1, width: '30%' }} />
              </div>
            </div>

            <div className="j-market-list-skeleton">
              <div className="market-title-skeleton-row">
                <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="title-skeleton" />
                <Skeleton
                  title={false}
                  paragraph={{ rows: 1, width: '100%' }}
                  active
                  className="search-input-skeleton"
                />
              </div>
              <div className="skeleton-space" />
              <Skeleton title={false} paragraph={{ rows: 10, width: '100%' }} active className="list-skeleton" />
            </div>
          </>
        ) : (
          <>
            {this.pageHeader()}

            <div className="bs-list j-market-list j-orders-list">
              <div className="market-top">{this.renderMarketTop()}</div>

              {current !== 'receiver' && total > 0 && (
                <>
                  {current === 'all' && <div className="order-cato-title">{intl.get('s7.my_rental')}</div>}
                  <div className={`ant-table-wrapper ${orders.length < total ? '' : 'hide-footer'}`}>
                    <Table
                      loading={isLoading}
                      columns={this.getInfoColumns()}
                      dataSource={orders}
                      pagination={false}
                      locale={{
                        emptyText: emptyReactNodeNew
                      }}
                      footer={() =>
                        orders.length < total ? (
                          <a className="load-more-btn" onClick={this.onClickShowMore}>
                            {intl.get('load_more')}
                          </a>
                        ) : null
                      }
                    />
                  </div>
                </>
              )}

              {current !== 'renter' && receiverTotal > 0 && (
                <>
                  {current === 'all' && <div className="order-cato-title">{intl.get('s7.others_for_me')}</div>}
                  <div className={`ant-table-wrapper ${receiverOrders?.length < receiverTotal ? '' : 'hide-footer'}`}>
                    <Table
                      loading={isLoading}
                      columns={this.getInfoColumns('receiver')}
                      dataSource={receiverOrders}
                      pagination={false}
                      locale={{
                        emptyText: emptyReactNodeNew
                      }}
                      footer={() =>
                        receiverOrders?.length < receiverTotal ? (
                          <a className="load-more-btn" onClick={this.onClickShowMoreOtherOrders}>
                            {intl.get('load_more')}
                          </a>
                        ) : null
                      }
                    />
                  </div>
                </>
              )}

              {((current === 'all' && !total && !receiverTotal) ||
                (current === 'renter' && total === 0) ||
                (current === 'receiver' && (receiverTotal === 0 || !receiverTotal))) && <>{emptyReactNodeNew()}</>}
            </div>
          </>
        )}

        <div className="j-market-list-mobile">
          {isLoading ? (
            <>
              <div className="skeleton-flex-row">
                <Skeleton title={false} paragraph={{ rows: 1, width: '100%' }} active className="title-skeleton" />
                <Skeleton
                  title={false}
                  paragraph={{ rows: 1, width: '100%' }}
                  active
                  className="search-input-skeleton"
                />
              </div>
              <div className="mobile-cards">
                {Array.from({ length: 10 }).map((_, ii) => (
                  <div className="mobile-card" key={ii}>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div className="skeleton-flex-row narrow-gap" key={i}>
                        <Skeleton
                          title={false}
                          paragraph={{ rows: 1, width: '100%' }}
                          active
                          className="title-skeleton"
                        />
                        <Skeleton
                          title={false}
                          paragraph={{ rows: 1, width: '100%' }}
                          active
                          className="search-input-skeleton"
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="market-top-mobile">{this.renderMarketTop()}</div>
              {
                <div className="mobile-cards">
                  {current !== 'receiver' && total > 0 && (
                    <>
                      <div className="order-cato-title">{intl.get('s7.my_rental')}</div>
                      {orders.map(
                        ({ canRentSeconds, delegateTrxAmount, energyAmount, receiver, renter, startTimestamp }, i) => (
                          <div className="mobile-card" key={i}>
                            <div className="field">
                              <div className="title">{intl.get('strx.receiving_address')}</div>
                              <div className="value receiver">
                                {receiver === defaultAccount ? (
                                  <span className="current-receiver">{intl.get('strx.current_acct')}</span>
                                ) : null}
                                <Tooltip
                                  title={receiver}
                                  placement={!mobile ? 'top' : 'topLeft'}
                                  arrowPointAtCenter
                                  overlayClassName="j-tooltip-dropdown2"
                                >
                                  {cutMiddle(receiver, 4, 4)}
                                </Tooltip>
                              </div>
                            </div>

                            <div className="field">
                              <div className="title">
                                <span onClick={this.toggleIsEnergy} style={{ cursor: 'pointer' }}>
                                  <span className={isEnergy ? 'active' : 'inactive'}>{intl.get('strx.energy')}</span>
                                  <span className="slash">|</span>
                                  <span className={isEnergy ? 'inactive' : 'active'}>
                                    {intl.get('strx.delegated_trx')}
                                  </span>
                                </span>
                              </div>
                              <div className="value">
                                {isEnergy ? (
                                  <span>
                                    <img
                                      className="energy-icon"
                                      src={isWhite ? energyIconWhite : energyIcon}
                                      alt="Energy Icon"
                                    />
                                    {formatNumber(energyAmount, 0)}
                                  </span>
                                ) : (
                                  `${formatNumber(delegateTrxAmount, 0, {
                                    cutZero: true,
                                    round: true,
                                    roundMode: 'ROUND_UP'
                                  })} TRX`
                                )}
                              </div>
                            </div>

                            <div className="field">
                              <div className="title">
                                <span className="flex-box">
                                  {isExpiryTime
                                    ? intl.get('energy_rental.mini_list.rental_time_title_expiration')
                                    : intl.get('energy_rental.mini_list.rental_time_title_remaining')}
                                  <span className="switch-icon" onClick={this.toggleIsExpiryTime} />
                                </span>
                              </div>
                              <div className="value">{this.renderCanRentSeconds(canRentSeconds, i)}</div>
                            </div>

                            <div className="btn-wrap">
                              <button
                                className="j-btn j-rent-refund"
                                onClick={e => {
                                  e.preventDefault();
                                  this.onClickEndButton({
                                    canRentSeconds,
                                    delegateTrxAmount,
                                    energyAmount,
                                    receiver,
                                    renter,
                                    startTimestamp
                                  });
                                }}
                              >
                                {intl.get('strx.refund')}
                              </button>
                              <button
                                className="j-btn j-rent-renew"
                                onClick={e => {
                                  e.preventDefault();
                                  this.props.energyRental.getReturnRentInfo(renter, receiver);
                                  this.onClickRenewButton(receiver, canRentSeconds);
                                }}
                              >
                                {intl.get('strx.renew')}
                              </button>
                            </div>
                          </div>
                        )
                      )}

                      {orders.length < total ? (
                        <div className="load-more-btn" onClick={this.onClickShowMore}>
                          {intl.get('load_more')}
                        </div>
                      ) : null}
                    </>
                  )}
                  {current !== 'renter' && receiverTotal > 0 && (
                    <>
                      <div className="order-cato-title">{intl.get('s7.others_for_me')}</div>
                      {this.othersCardsMobileRender()}
                    </>
                  )}
                  {((current === 'all' && !total && !receiverTotal) ||
                    (current === 'renter' && total === 0) ||
                    (current === 'receiver' && (receiverTotal === 0 || !receiverTotal))) && (
                    <div className="mobile-card">
                      <span className="no-data-icon" />
                      <div className="no-data-text">{intl.get('v2.na_data')}</div>
                    </div>
                  )}
                </div>
              }
            </>
          )}
        </div>
        <EndRentalTipModal
          endRentalInfo={this.state.item}
          endRetalFn={() => this.onClickEndButton(this.state.item, 'receiver')}
        />
      </>
    );
  }
}

export default OrderListTable;
