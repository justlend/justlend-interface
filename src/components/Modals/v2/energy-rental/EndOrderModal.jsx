import React from 'react';

import { inject, observer } from 'mobx-react';
import intl from 'react-intl-universal';
import isMobile from 'ismobilejs';
import { Modal, Tooltip } from 'antd';

import { BigNumber, formatNumber, toFixedDown } from '../../../../utils/helper';
import Config from '../../../../config';

import '../../../../assets/css/v2/energy-rental/end-order-modal.scss';

@inject('network')
@inject('lend')
@inject('system')
@inject('pool')
@inject('energyRental')
@observer
class EndOrderModal extends React.Component {
  constructor() {
    super();
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      approving: false,
      mobile: isMobile(window.navigator).any
    };
  }

  componentDidMount = async () => {
    const { endOrderModalInfo } = this.props.energyRental;
    if (endOrderModalInfo.renter && endOrderModalInfo.renter !== '--') {
      this.props.energyRental.getReturnRentInfo(endOrderModalInfo.renter, endOrderModalInfo.receiver);
    }
    window.gtag('event', 'energyrent_pro_endtx_confirmpop', {
      'event_category': 'energyrent',
      'event_label': 'energyrent_pro_endtx_confirmpop'
    });
  };

  close = () => {
    // this.props.system.clearRejectError();
    this.props.energyRental.setData({ endOrderModalVisible: false });
    window.gtag('event', 'energyrent_pro_endtx_confirmingpop_close', {
      'event_category': 'energyrent',
      'event_label': 'energyrent_pro_endtx_confirmingpop_close'
    });
  };

  returnResource = async () => {
    try {
      window.gtag('event', 'energyrent_pro_endtx_confirmpop_confirm', {
        'event_category': 'energyrent',
        'event_label': 'energyrent_pro_endtx_confirmpop_confirm'
      });
      // window.gtag('event', 'PC_energy_return_confirm', { 'event_category': 'sTRX', 'event_label': 'energy_return_confirm' });

      if (this.props.network.isRightChain === 0) {
        this.props.network.changeChain();
        return;
      }

      this.props.system.clearRejectError();

      const { defaultAccount } = this.props.network;
      const {
        endOrderModalVisible,
        securityDeposit,
        returnResourceEnergy,
        endOrderModalInfo,
        returnRentInfo,
        // rentBalance,
        marketData,
        endOrderType,
        usageChargeRatio
      } = this.props.energyRental;

      let isSelf = endOrderModalInfo.receiver === defaultAccount;
      let unrecoveredEnergyAmount = isSelf
        ? BigNumber(returnRentInfo.unrecoveredEnergyAmount).plus(10000)
        : returnRentInfo.unrecoveredEnergyAmount;

      // const { energyStakePerTrx } = marketData;
      // let rentBalance = BigNumber(returnRentInfo.rentAmount).div(energyStakePerTrx);
      let rentBalance = endOrderModalInfo.delegateTrxAmount;

      let unrecoveredEnergyFee = BigNumber(returnRentInfo.dailyRent)
        .times(BigNumber(unrecoveredEnergyAmount).div(returnRentInfo.rentAmount))
        .times(usageChargeRatio);

      let returnRentBalance = BigNumber(returnRentInfo.rentRemain)
        .plus(returnRentInfo.securityDeposit)
        .minus(unrecoveredEnergyFee);

      const { energyFee, getEnergyFee } = this.props.energyRental;

      const intlObj = {
        title: 'v2.transaction_confirm',
        title2: 'deposit.transactionsent',
        title3: 'v2.transaction_confirm_fail',
        title4: 'deposit.confirm_transaction',
        obj: {
          value: formatNumber(returnRentBalance, 6, { miniText: '0.000001' }),
          token: 'TRX'
        },
        transType: 'returnResourceNew'
      };

      let feeLimit = Config.feeLimitForReturnResourceDefault;
      const energy = await this.props.system.getReturnRentFeeLimit(
        endOrderType === 'receiver' ? endOrderModalInfo.renter : endOrderModalInfo.receiver,
        BigNumber(rentBalance).times(Config.trxPrecision)._toFixed(0, 1),
        1,
        endOrderType
      );

      let fee = energyFee || (await getEnergyFee());
      if (!BigNumber(fee).isNaN() && !BigNumber(energy).isNaN()) {
        let feeLimitCalcResult = BigNumber(BigNumber(energy).times(fee).div(1e6)._toFixed(0, 1))
          // .times(1.5)
          .plus(5)
          .times(Config.trxPrecision);
        // if (feeLimitCalcResult.gt(Config.feeLimit)) feeLimit = feeLimitCalcResult.toNumber();
        feeLimit = feeLimitCalcResult.toNumber();
      }

      this.setState({ approving: true });
      window.gtag('event', 'energyrent_pro_endtx_confirmingpop', {
        'event_category': 'energyrent',
        'event_label': 'energyrent_pro_endtx_confirmingpop'
      });

      const txID = await this.props.system.returnResource(
        endOrderType === 'receiver' ? endOrderModalInfo.renter : endOrderModalInfo.receiver,
        BigNumber(rentBalance).times(Config.trxPrecision)._toFixed(0, 1),
        1,
        BigNumber(feeLimit),
        intlObj,
        endOrderType
      );

      if (txID) {
        this.close();
        setTimeout(() => {
          this.props.energyRental.getUserTrxBalance();
          this.props.energyRental.getCommonRentInfos();
          this.props.energyRental.getMultiReward();
          this.props.energyRental.getUserData();
          this.props.energyRental.getMiniOrderList();
          this.props.energyRental.getStrxRentAllOrderList({});
        }, 5000);
      }
      this.setState({ approving: false });
    } catch (e) {
      console.log('error: returnSource');
    }
  };

  render() {
    const { transModalInfo } = this.props.system;
    const { transType, declined } = transModalInfo;
    const { theme } = this.props.lend;
    const {
      endOrderModalVisible,
      securityDeposit,
      returnResourceEnergy,
      endOrderModalInfo,
      returnRentInfo,
      usageChargeRatio
    } = this.props.energyRental;
    const { canRentSeconds, delegateTrxAmount, energyAmount, receiver, renter, startTimestamp } = endOrderModalInfo;
    const { approving, lang, mobile } = this.state;
    const { defaultAccount } = this.props.network;

    let isSelf = endOrderModalInfo.receiver === defaultAccount;
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

    return (
      <Modal
        title={intl.get('energy_rental.end_order_modal.modal_title')}
        visible={endOrderModalVisible}
        closable={true}
        icon={null}
        onCancel={() => this.close()}
        footer={null}
        width={mobile ? 'calc(100% - 40px)' : 400}
        centered
        className={`j-modal header-border end-rent-modal ${theme} `}
        getContainer={() => document.querySelector('.j-wrapper')}
      >
        <div className="end-order-modal">
          <div className={'end-order-icon ' + theme}></div>

          <div
            className="content-title"
            onMouseEnter={() => {
              window.gtag('event', 'energyrent_pro_endtx_confirmpop_hover', {
                'event_category': 'energyrent',
                'event_label': 'energyrent_pro_endtx_confirmpop_hover'
              });
            }}
          >
            {intl.get('energy_rental.end_order_modal.refund_amount')}
          </div>
          <div className="refund-amount-info">
            <div className="amount-value">
              <div className="refund-detail-tooltip">
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
                <div className="detail-row">
                  <div className="row-title">
                    <div>{intl.get('energy_rental.end_order_modal.deducted_unrecovered_energy_hint')}</div>
                    <div>
                      {intl.get('energy_rental.end_order_modal.deducted_unrecovered_energy_detail', {
                        value: formatNumber(unrecoveredEnergyAmount, 0)
                      })}
                    </div>
                  </div>
                  <div className="row-value">- {formatNumber(unrecoveredEnergyFee, 6)} TRX</div>
                </div>
                <div className="detail-row">
                  <div className="row-title energy-light">
                    <em className=""></em>
                    {intl.get('energy_rental.estimate_refund')}
                  </div>
                </div>
              </div>
              {formatNumber(
                BigNumber(toFixedDown(returnRentInfo.rentRemain, 6))
                  .plus(toFixedDown(returnRentInfo.securityDeposit, 6))
                  .minus(toFixedDown(unrecoveredEnergyFee, 6)),
                6
              )}{' '}
              TRX
            </div>
          </div>

          <div className="rental-order-detail">
            <div className="row-title">{intl.get('energy_rental.end_order_modal.rent_energy_amount')}</div>
            <div className="row-value">
              {formatNumber(returnRentInfo.rentAmount, 0)}{' '}
              {intl.get('energy_rental.add_order_modal.energy_amount_suffix')}
            </div>
          </div>

          {approving ? (
            <button className="j-large-btn j-supply rent-now end-btn j-signing" disabled>
              {intl.get('energy_rental.transaction.sign_in_your_wallet_msg')}
              <span className="siging-icon"></span>
            </button>
          ) : (
            <button
              className="j-large-btn j-supply rent-now end-btn"
              onClick={() => {
                this.returnResource();
              }}
            >
              {intl.get('energy_rental.transaction.confirm_btn')}
            </button>
          )}
          {declined && transType === 'returnResourceNew' && (
            <div className="j-error-tip wallet-reject">
              <span className="j-error-img"></span>
              <div>{intl.get('energy_rental.transaction.wallet_rejected')}</div>
            </div>
          )}
        </div>
      </Modal>
    );
  }
}

export default EndOrderModal;
