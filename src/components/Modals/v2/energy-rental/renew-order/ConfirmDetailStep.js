import React from 'react';

import { inject, observer } from 'mobx-react';
import intl from 'react-intl-universal';

import { Tooltip } from 'antd';
import classnames from 'classnames';

import Config from '../../../../../config';

import { BigNumber, formatNumber, tronscanTXEnergyRental } from '../../../../../utils/helper';
import {
  toDayHourMinString,
  shouldShowShortRentalHint,
  fullAddressDisplayDiv
} from '../../../../v2/energy-rental/utils';

@inject('lend')
@inject('network')
@inject('system')
@inject('pool')
@inject('energyRental')
@observer
class ConfirmDetailStep extends React.Component {
  constructor() {
    super();
  }

  componentDidMount = () => {
    let { addOrderModalIsRenew } = this.props.energyRental;
    if (addOrderModalIsRenew) {
      window.gtag('event', 'energyrent_pro_retx_confirmpop', {
        'event_category': 'energyrent',
        'event_label': 'energyrent_pro_retx_confirmpop'
      });
    } else {
      window.gtag('event', 'energyrent_pro_tx_confirmpop', {
        'event_category': 'energyrent',
        'event_label': 'energyrent_pro_tx_confirmpop'
      });
    }
  };

  confirmAddOrder = async () => {
    let { submittedNewOrderTrxAmount, submittedNewOrderPrepayment, submittedNewOrderReceiver } =
      this.props.energyRental;

    if (this.props.network.isRightChain === 0) {
      this.props.network.changeChain();
      return;
    }

    this.props.system.clearRejectError();
    this.props.energyRental.setData({
      isAddOrderModalApprovingTrans: true
    });

    try {
      this.props.newOrderSubmittedCallback();

      const txID = await this.props.system.rentResourceWithLoadingFlag(
        submittedNewOrderReceiver,
        BigNumber(submittedNewOrderTrxAmount).times(Config.trxPrecision)._toFixed(0, 1),
        1,
        new BigNumber(submittedNewOrderPrepayment).times(Config.trxPrecision)._toFixed(0, 1),
        {}
      );

      if (txID) {
        setTimeout(() => {
          this.props.energyRental.getUserTrxBalance();
          this.props.energyRental.getCommonRentInfos();
          this.props.energyRental.getMiniOrderList();
          this.props.energyRental.getStrxRentAllOrderList({});
        }, 5000);
      }
    } catch (e) {
      console.log('error: confirmAddOrder');
    }
  };

  confirmRenewOrder = async () => {
    let { renewOrderTrxAmount, renewOrderPrepayment, renewOrderReceiver } = this.props.energyRental;

    if (this.props.network.isRightChain === 0) {
      this.props.network.changeChain();
      return;
    }

    this.props.system.clearRejectError();
    this.props.energyRental.setData({
      isAddOrderModalApprovingTrans: true
    });

    try {
      const txID = await this.props.system.rentResourceWithLoadingFlag(
        renewOrderReceiver,
        BigNumber(renewOrderTrxAmount).times(Config.trxPrecision)._toFixed(0, 1),
        1,
        new BigNumber(renewOrderPrepayment).times(Config.trxPrecision)._toFixed(0, 1),
        {}
      );

      if (txID) {
        this.props.energyRental.getMiniOrderList();
        setTimeout(() => {
          this.props.energyRental.getUserTrxBalance();
          this.props.energyRental.getCommonRentInfos();
          this.props.energyRental.getMiniOrderList();
          this.props.energyRental.getStrxRentAllOrderList({});
        }, 3000);
      }
    } catch (e) {
      console.log('error: confirmRenewOrder');
    }
  };

  render() {
    const { defaultAccount } = this.props.network;
    const { transModalInfo } = this.props.system;
    const { step, txId } = transModalInfo;
    let {
      isAddOrderModalApprovingTrans,
      addOrderModalIsRenew,

      submittedNewOrderEnergyAmount,
      submittedNewOrderTrxAmount,
      submittedNewOrderDuration,
      submittedNewOrderPrepayment,
      submittedNewOrderReceiver,

      renewOrderEnergyAmount,
      renewOrderTrxAmount,
      renewOrderDuration,
      renewOrderPrepayment,
      renewOrderReceiver
    } = this.props.energyRental;

    var energyAmount, trxAmount, duration, prepayment, receiver;

    if (addOrderModalIsRenew) {
      energyAmount = renewOrderEnergyAmount;
      trxAmount = renewOrderTrxAmount;
      duration = renewOrderDuration;
      prepayment = renewOrderPrepayment;
      receiver = renewOrderReceiver;
    } else {
      energyAmount = submittedNewOrderEnergyAmount;
      trxAmount = submittedNewOrderTrxAmount;
      duration = submittedNewOrderDuration;
      prepayment = submittedNewOrderPrepayment;
      receiver = submittedNewOrderReceiver;
    }

    // var step = 82;
    // console.log('step: ' + step);

    var showShortRentalHint = step === 82 && shouldShowShortRentalHint(duration) && !addOrderModalIsRenew;

    return (
      <div className="confirm-detail">
        <div
          className={classnames(
            'content-icon',
            { 'loading-icon': step === 8 },
            { 'succeed-icon': step === 82 },
            { 'failed-icon': step === 9 || step === 83 }
          )}
        ></div>

        <div className={classnames('content-title', { 'light-weight': step === 1 || step === 3 })}>
          {(step === 1 || step === 3) && intl.get('energy_rental.add_order_modal.prepayment_title')}
          {step === 8 && intl.get('energy_rental.transaction.submitted_to_chain_msg')}
          {!addOrderModalIsRenew && step === 82 && intl.get('energy_rental.add_order_modal.energy_sent_hint')}
          {addOrderModalIsRenew &&
            step === 82 &&
            intl.get('energy_rental.renew_order_modal.transaction_completed.renewal_completed_msg')}
          {(step === 9 || step === 83) && intl.get('energy_rental.transaction.transaction_failed_pls_request_again')}
        </div>

        {(step === 1 || step === 3) && (
          <div className="prepayment-value">{formatNumber(prepayment, Config.trxDecimal)} TRX</div>
        )}
        {(step === 9 || step === 82 || step === 83) &&
          tronscanTXEnergyRental(
            intl.get('energy_rental.transaction.view_on_tronscan'),
            txId,
            true,
            this.props.energyRental.addOrderModalIsRenew
          )}

        {!(step === 8 || step === 9 || step === 83) && (
          <div className="rental-order-detail">
            {BigNumber(energyAmount).gt(0) && (
              <div className="detail-row">
                <div className="row-title">
                  {addOrderModalIsRenew
                    ? intl.get('energy_rental.renew_order_modal.renew_form.amount_field.confirm_title')
                    : intl.get('energy_rental.add_order_modal.energy_amount_title')}
                </div>
                <div className="row-value">
                  {intl.get('energy_rental.double_tilde')} {formatNumber(energyAmount, 0)}{' '}
                  {intl.get('energy_rental.add_order_modal.energy_amount_suffix')}
                  <Tooltip
                    title={() => {
                      return intl.getHTML('energy_rental.mini_list.energy_amount_hint', {
                        value: formatNumber(BigNumber(trxAmount), 0)
                      });
                    }}
                    placement="topRight"
                    arrowPointAtCenter
                    overlayClassName="j-tooltip-dropdown energy-rental-tooltip"
                    onMouseEnter={() => {
                      window.gtag('event', 'energyrent_pro_tx_confirmpop_hoverenergy', {
                        'event_category': 'energyrent',
                        'event_label': 'energyrent_pro_tx_confirmpop_hoverenergy'
                      });
                    }}
                  >
                    <div className="j-tooltip-icon"></div>
                  </Tooltip>
                </div>
              </div>
            )}
            {BigNumber(duration).gt(0) && (
              <div className="detail-row">
                <div className="row-title">
                  {addOrderModalIsRenew
                    ? intl.get('energy_rental.renew_order_modal.renew_form.duration_field.confirm_title')
                    : intl.get('energy_rental.add_order_modal.duration_title')}
                </div>
                <div className="row-value">
                  {intl.get('energy_rental.double_tilde')} {toDayHourMinString(duration)}
                  <Tooltip
                    title={() => {
                      return intl.getHTML('energy_rental.mini_list.rental_time_hint');
                    }}
                    placement="bottomRight"
                    arrowPointAtCenter
                    overlayClassName="j-tooltip-dropdown energy-rental-tooltip"
                    onMouseEnter={() => {
                      window.gtag('event', 'energyrent_pro_tx_confirmpop_hovertime', {
                        'event_category': 'energyrent',
                        'event_label': 'energyrent_pro_tx_confirmpop_hovertime'
                      });
                    }}
                  >
                    <div className="j-tooltip-icon"></div>
                  </Tooltip>
                </div>
              </div>
            )}
            {!addOrderModalIsRenew && (
              <div className="detail-row">
                <div className="row-title">{intl.get('energy_rental.add_order_modal.address_title')}</div>

                {submittedNewOrderReceiver == defaultAccount ? (
                  <div className="row-value address-row-value">
                    {fullAddressDisplayDiv(receiver, 'inline-address')} {intl.get('energy_rental.open_bracket')}
                    {intl.get('energy_rental.add_order_modal.current_address')}
                    {intl.get('energy_rental.close_bracket')}
                  </div>
                ) : (
                  fullAddressDisplayDiv(receiver, 'row-value address-row-value')
                )}
              </div>
            )}
          </div>
        )}

        {showShortRentalHint && (
          <div className="short-rental-hint">{intl.get('energy_rental.form.hints.short_rental_period')}</div>
        )}
        {(step === 1 || step === 3 || step === 5 || step === 4) &&
          (isAddOrderModalApprovingTrans && step !== 3 ? (
            <button className="action-btn single-action-btn confirm-btn is-signing">
              {intl.get('energy_rental.transaction.sign_in_your_wallet_msg')}
              <span className="siging-icon"></span>
            </button>
          ) : (
            <button
              className="action-btn single-action-btn confirm-btn"
              onClick={() => {
                if (addOrderModalIsRenew) {
                  this.confirmRenewOrder();
                  window.gtag('event', 'energyrent_pro_retx_confirmpop_confirm', {
                    'event_category': 'energyrent',
                    'event_label': 'energyrent_pro_retx_confirmpop_confirm'
                  });
                } else {
                  this.confirmAddOrder();
                  window.gtag('event', 'energyrent_pro_tx_confirmpop_clickconfirm', {
                    'event_category': 'energyrent',
                    'event_label': 'energyrent_pro_tx_confirmpop_clickconfirm'
                  });
                }
              }}
            >
              {intl.get('energy_rental.transaction.confirm_btn')}
            </button>
          ))}
        {(step === 8 || step === 9 || step === 82 || step === 83) && (
          <button
            className={classnames(
              'action-btn',
              'single-action-btn',
              'close-btn',
              { 'have-hint-above': showShortRentalHint },
              { 'extra-top-margin': step === 8 || step === 9 || step === 83 }
            )}
            onClick={() => {
              this.props.closeModal();
            }}
          >
            {intl.get('energy_rental.transaction.close_btn')}
          </button>
        )}

        {step === 3 && (
          <div className="j-error-tip wallet-reject">
            <span className="j-error-img"></span>
            <div>{intl.get('energy_rental.transaction.wallet_rejected')}</div>
          </div>
        )}
      </div>
    );
  }
}

export default ConfirmDetailStep;
