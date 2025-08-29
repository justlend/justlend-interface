import React from 'react';

import { inject, observer } from 'mobx-react';
import intl from 'react-intl-universal';

import { BigNumber, formatNumber } from '../../../../../utils/helper';

import { toDayHourMinString, fullAddressDisplayDiv } from '../../../../v2/energy-rental/utils';

@inject('energyRental')
@observer
class ExistingOrderHintStep extends React.Component {
  constructor() {
    super();
    this.state = {};
  }
  componentDidMount = () => {
    window.gtag('event', 'energyrent_pro_retx_tipspopup', {
      'event_category': 'energyrent',
      'event_label': 'energyrent_pro_retx_tipspopup'
    });
  };

  render() {
    const { renewOrderReceiver, renewOrderExistingEnergyAmount, renewOrderExistingRemainingSeconds } =
      this.props.energyRental;

    const { closeModal } = this.props;

    return (
      <div>
        <div className="content-icon"></div>

        <div className="content-title">
          {intl.get('energy_rental.renew_order_modal.existing_order_hint.has_existing_order_msg')}
        </div>

        <div className="rental-order-detail">
          <div className="detail-row">
            <div className="row-title">
              {intl.get('energy_rental.renew_order_modal.existing_order_hint.address_field_title')}
            </div>
            {fullAddressDisplayDiv(renewOrderReceiver, 'row-value address-row-value')}
          </div>
          <div className="detail-row">
            <div className="row-title">
              {intl.get('energy_rental.renew_order_modal.existing_order_hint.rented_energy_field_title')}
            </div>
            <div className="row-value">
              {BigNumber(renewOrderExistingEnergyAmount).gt(0)
                ? formatNumber(renewOrderExistingEnergyAmount, 0) +
                  ' ' +
                  intl.get('energy_rental.renew_order_modal.existing_order_hint.rented_energy_value_suffix')
                : '--'}
            </div>
          </div>
          <div className="detail-row">
            <div className="row-title">
              {intl.get('energy_rental.renew_order_modal.existing_order_hint.remaining_time_field_title')}
            </div>
            <div className="row-value">
              {BigNumber(renewOrderExistingRemainingSeconds).gt(60)
                ? toDayHourMinString(renewOrderExistingRemainingSeconds)
                : BigNumber(renewOrderExistingRemainingSeconds).eq(0)
                ? intl.get('energy_rental.mini_list.rental_time_expired')
                : BigNumber(renewOrderExistingRemainingSeconds).gt(0) &&
                  BigNumber(renewOrderExistingRemainingSeconds).lte(60)
                ? intl.get('energy_rental.mini_list.rental_time_expire_soon')
                : '--'}
            </div>
          </div>
        </div>

        <div className="action-btns">
          <button
            className="action-btn close-btn"
            onClick={() => {
              closeModal();
            }}
          >
            {intl.get('energy_rental.renew_order_modal.existing_order_hint.cancel_btn')}
          </button>
          <button
            className="action-btn confirm-btn"
            disabled={
              BigNumber(renewOrderExistingEnergyAmount).isNaN() || BigNumber(renewOrderExistingRemainingSeconds).isNaN()
            }
            onClick={() => {
              this.props.energyRental.setData({ addOrderModalStep: 2 });
              window.gtag('event', 'energyrent_pro_retx_tipspopup_renew', {
                'event_category': 'energyrent',
                'event_label': 'energyrent_pro_retx_tipspopup_renew'
              });
            }}
          >
            {intl.get('energy_rental.renew_order_modal.existing_order_hint.renew_btn')}
          </button>
        </div>
      </div>
    );
  }
}

export default ExistingOrderHintStep;
