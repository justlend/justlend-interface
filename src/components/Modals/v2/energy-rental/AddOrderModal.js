import React from 'react';

import { inject, observer } from 'mobx-react';
import intl from 'react-intl-universal';
import isMobile from 'ismobilejs';
import { Modal } from 'antd';
import classnames from 'classnames';

import ExistingOrderHintStep from './renew-order/ExistingOrderHintStep';
import RenewFormStep from './renew-order/RenewFormStep';
import ConfirmDetailStep from './renew-order/ConfirmDetailStep';

import { cutMiddle, BigNumber } from '../../../../utils/helper';

import '../../../../assets/css/v2/energy-rental/add-order-modal.scss';
import '../../../../assets/css/v2/energy-rental/confirm-detail.scss';

@inject('lend')
@inject('system')
@inject('pool')
@inject('energyRental')
@inject('network')
@observer
class AddOrderModal extends React.Component {
  constructor() {
    super();
    this.state = {
      mobile: isMobile(window.navigator).any
    };
  }

  close = () => {
    this.props.system.clearRejectError();
    this.props.energyRental.setData({
      addOrderModalVisible: false,
      addOrderModalIsRenew: false
    });
    this.props.energyRental.resetExistingOrderInfo();
    this.props.energyRental.resetRenewOrderInfo();

    const { transModalInfo } = this.props.system;
    const { step } = transModalInfo;
    let { addOrderModalIsRenew } = this.props.energyRental;

    if (step === 8) {
      // transaction_confirming
      if (addOrderModalIsRenew) {
        window.gtag('event', 'energyrent_pro_retx_confirmingpop_click', {
          'event_category': 'energyrent',
          'event_label': 'energyrent_pro_retx_confirmingpop_click'
        });
      } else {
        window.gtag('event', 'energyrent_pro_tx_confirmingpop_close', {
          'event_category': 'energyrent',
          'event_label': 'energyrent_pro_tx_confirmingpop_close'
        });
      }
    }
    if (step === 82) {
      // transaction_completed
      if (addOrderModalIsRenew) {
        window.gtag('event', 'energyrent_pro_retx_successpop', {
          'event_category': 'energyrent',
          'event_label': 'energyrent_pro_retx_successpop'
        });
      } else {
        window.gtag('event', 'energyrent_pro_tx_successpop', {
          'event_category': 'energyrent',
          'event_label': 'energyrent_pro_tx_successpop'
        });
      }
    }

    const { addOrderModalStep, renewOrderExistingRemainingSeconds } = this.props.energyRental;
    if (addOrderModalStep == '2') {
      window.gtag('event', 'energyrent_pro_retx_popup', {
        'event_category': 'energyrent',
        'event_label': BigNumber(renewOrderExistingRemainingSeconds).eq(0) ? 'Expired' : 'Unexpired'
      });
    }
  };

  render() {
    const { mobile } = this.state;

    const { theme } = this.props.lend;
    const { addOrderModalVisible, addOrderModalStep, renewOrderReceiver, addOrderModalIsRenew } =
      this.props.energyRental;
    const { transModalInfo } = this.props.system;
    const { defaultAccount } = this.props.network;
    const { step } = transModalInfo;

    var modalTitle = '';
    if (addOrderModalStep == '1') {
      modalTitle = intl.get('energy_rental.renew_order_modal.existing_order_hint.modal_title');
    } else if (addOrderModalStep == '2') {
      modalTitle = intl.get('energy_rental.renew_order_modal.renew_form.modal_title');
    } else if (addOrderModalStep == '3') {
      modalTitle = intl.get('energy_rental.add_order_modal.modal_title');

      if (step === 8) {
        modalTitle = intl.get('energy_rental.transaction.transaction_confirming');
        if (addOrderModalIsRenew) {
          window.gtag('event', 'energyrent_pro_retx_confirmingpop', {
            'event_category': 'energyrent',
            'event_label': 'energyrent_pro_retx_confirmingpop'
          });
        } else {
          window.gtag('event', 'energyrent_pro_tx_confirmingpop', {
            'event_category': 'energyrent',
            'event_label': 'energyrent_pro_tx_confirmingpop'
          });
        }
      } else if (step === 82) {
        modalTitle = intl.get('energy_rental.transaction.transaction_completed');
      } else if (step === 9 || step === 83) {
        modalTitle = intl.get('energy_rental.transaction.transaction_failed');
      }
    }

    // addOrderModalStep = 2

    return (
      <Modal
        title={
          <div className={classnames('modal-title-container', { 'have-subtitle': addOrderModalStep == 2 })}>
            <div className="modal-title">{modalTitle}</div>

            {addOrderModalStep == 2 && (
              <div className="modal-subtitle">
                {cutMiddle(renewOrderReceiver, 6, 6)}

                {renewOrderReceiver == defaultAccount && (
                  <span>
                    {intl.get('energy_rental.open_bracket')}
                    {intl.get('energy_rental.add_order_modal.current_address')}
                    {intl.get('energy_rental.close_bracket')}
                  </span>
                )}
              </div>
            )}

            {addOrderModalStep == 3 && addOrderModalIsRenew && (step === 1 || step === 3) && (
              <button
                className="back-btn"
                onClick={() => {
                  this.props.energyRental.setData({
                    addOrderModalStep: 2
                  });
                  window.gtag('event', 'energyrent_pro_retx_confirmpop_back', {
                    'event_category': 'energyrent',
                    'event_label': 'energyrent_pro_retx_confirmpop_back'
                  });
                }}
              ></button>
            )}
          </div>
        }
        visible={addOrderModalVisible}
        closable={true}
        destroyOnClose={true}
        icon={null}
        onCancel={() => this.close()}
        footer={null}
        width={mobile ? 'calc(100% - 40px)' : 400}
        centered
        className={`j-modal header-border ${theme} add-order-modal`}
        getContainer={() => document.querySelector('.modal-appender')}
      >
        <div
          className={classnames(
            'add-order-modal-content',
            { 'existing-order-hint': addOrderModalStep == 1 },
            { 'renew-form': addOrderModalStep == 2 },
            { 'confirm-detail': addOrderModalStep == 3 }
          )}
        >
          {addOrderModalStep == '1' && <ExistingOrderHintStep closeModal={this.close} />}
          {addOrderModalStep == '2' && <RenewFormStep closeModal={this.close} />}
          {addOrderModalStep == '3' && (
            <ConfirmDetailStep
              closeModal={this.close}
              newOrderSubmittedCallback={this.props.newOrderSubmittedCallback}
            />
          )}
        </div>
      </Modal>
    );
  }
}

export default AddOrderModal;
