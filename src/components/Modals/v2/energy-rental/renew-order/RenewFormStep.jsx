import React from 'react';

import { inject, observer } from 'mobx-react';
import BigNumber from 'bignumber.js';
import intl from 'react-intl-universal';
import isMobile from 'ismobilejs';
import { Input, Tooltip } from 'antd';
import classnames from 'classnames';

import ToggleSwitch from '../../../../Widget/ToggleSwitch';
import DealNoteModal from '../DealNote';

import Config from '../../../../../config';

import { TooltipText } from '../../../../v2/energy-rental/TooltipText';

import {
  formatNumber,
  numberParser,
  addThousandSeparators,
  removeThousandSeparators,
  trimNumberAfterDecimalPlace
} from '../../../../../utils/helper';
import {
  toDayHourMinString,
  dateAfterSecondsToISO,
  getSecurityDepositDetailsUrl
} from '../../../../v2/energy-rental/utils';

@inject('network')
@inject('lend')
@inject('energyRental')
@observer
class RenewFormStep extends React.Component {
  constructor() {
    super();
    this.state = {
      mobile: isMobile(window.navigator).any,

      energyAmountSwitch: true,
      durationSwitch: false,

      energyAmountInputValue: '',
      energyAmountValue: Config.energyRental.renewOrderDefaultEnergyValue,
      energyAmountInputDecimal: 0,

      durationInputValue: '',
      durationInputDecimal: 1,
      durationIsDayUnitBoolean: true,
      durationValueInSeconds: 0,

      energyAmountInputError: '',
      durationInputError: '',

      showBalanceError: false
    };

    this.durationInputRef = null;
  }

  componentDidMount = async () => {
    const { renewOrderExistingRemainingSeconds } = this.props.energyRental;

    if (this.props.energyRental.renewOrderShouldUseSavedInfo) {
      this.setState({
        energyAmountSwitch: this.props.energyRental.renewOrderSavedInfoEnergyAmountSwitch,
        durationSwitch: this.props.energyRental.renewOrderSavedInfoDurationSwitch,

        energyAmountInputValue: this.props.energyRental.renewOrderSavedInfoEnergyAmountInputValue,
        energyAmountValue: this.props.energyRental.renewOrderSavedInfoEnergyAmountValue,

        durationInputValue: this.props.energyRental.renewOrderSavedInfoDurationInputValue,
        durationIsDayUnitBoolean: this.props.energyRental.renewOrderSavedInfoDurationIsDayUnitBoolean,
        durationValueInSeconds: this.props.energyRental.renewOrderSavedInfoDurationValueInSeconds,

        energyAmountInputError: '',
        durationInputError: ''
      });

      this.props.energyRental.updateRenewOrderInfo(
        this.props.energyRental.renewOrderSavedInfoEnergyAmountValue,
        this.props.energyRental.renewOrderSavedInfoDurationValueInSeconds,
        this.props.energyRental.renewOrderSavedInfoEnergyAmountSwitch
      );
    } else {
      if (BigNumber(renewOrderExistingRemainingSeconds).gt(0)) {
        this.setState({
          energyAmountSwitch: true,
          durationSwitch: false,

          energyAmountInputValue: '',
          energyAmountValue: Config.energyRental.renewOrderDefaultEnergyValue,

          durationInputValue: '',
          durationIsDayUnitBoolean: true,
          durationValueInSeconds: 0,

          energyAmountInputError: '',
          durationInputError: ''
        });
        this.props.energyRental.updateRenewOrderInfo(Config.energyRental.renewOrderDefaultEnergyValue, 0, true);
      } else {
        this.setState({
          energyAmountSwitch: false,
          durationSwitch: true,

          energyAmountInputValue: '',
          energyAmountValue: 0,

          durationInputValue: '',
          durationIsDayUnitBoolean: true,
          durationValueInSeconds: 0,

          energyAmountInputError: '',
          durationInputError: ''
        });
        this.props.energyRental.updateRenewOrderInfo(0, 0, false);
      }
    }
  };

  onToggleEnergyAmountSwitch = () => {
    const { energyAmountSwitch, durationSwitch, durationValueInSeconds } = this.state;
    const { renewOrderExistingRemainingSeconds, renewOrderExistingRate } = this.props.energyRental;

    window.gtag('event', 'energyrent_pro_retx_popup_clickEnergy', {
      'event_category': 'energyrent',
      'event_label': energyAmountSwitch ? 'turnOff' : 'turnOn'
    });

    // Check if this is not expiring case
    // Check if renewOrderExistingRate is '--' to prevent user changing toggle status before market data returned
    if (BigNumber(renewOrderExistingRemainingSeconds).gt(0) && renewOrderExistingRate !== '--') {
      if (energyAmountSwitch) {
        if (durationSwitch) {
          this.setState({
            energyAmountSwitch: false,
            energyAmountInputValue: '',
            energyAmountValue: 0,
            energyAmountInputError: ''
          });

          this.props.energyRental.updateRenewOrderInfo(0, durationValueInSeconds, false);
        } else {
          // Both disabled, enable duration switch
          this.setState({
            energyAmountSwitch: false,
            energyAmountInputValue: '',
            energyAmountValue: 0,
            energyAmountInputError: '',
            durationSwitch: true
          });

          this.props.energyRental.updateRenewOrderInfo(0, 0, false);
        }
      } else {
        this.setState({
          energyAmountSwitch: true,
          energyAmountValue: Config.energyRental.renewOrderDefaultEnergyValue
        });

        this.props.energyRental.updateRenewOrderInfo(
          BigNumber(Config.energyRental.renewOrderDefaultEnergyValue),
          durationValueInSeconds,
          true
        );
      }
    }
  };
  onToggleDurationSwitch = () => {
    const { energyAmountSwitch, durationSwitch, energyAmountValue } = this.state;
    const { renewOrderExistingRemainingSeconds, renewOrderExistingRate } = this.props.energyRental;

    window.gtag('event', 'energyrent_pro_retx_popup_clickTime', {
      'event_category': 'energyrent',
      'event_label': durationSwitch ? 'turnOff' : 'turnOn'
    });

    if (BigNumber(renewOrderExistingRemainingSeconds).gt(0) && renewOrderExistingRate !== '--') {
      if (durationSwitch) {
        if (energyAmountSwitch) {
          this.setState({
            durationSwitch: false,
            durationInputValue: '',
            durationValueInSeconds: 0,
            durationInputError: ''
          });

          this.props.energyRental.updateRenewOrderInfo(BigNumber(energyAmountValue), 0, energyAmountSwitch);
        } else {
          // Both disabled, enable energy amount switch
          this.setState({
            durationSwitch: false,
            durationInputValue: '',
            durationValueInSeconds: 0,
            durationInputError: '',
            energyAmountSwitch: true,
            energyAmountValue: Config.energyRental.renewOrderDefaultEnergyValue
          });

          this.props.energyRental.updateRenewOrderInfo(
            BigNumber(Config.energyRental.renewOrderDefaultEnergyValue),
            0,
            true
          );
        }
      } else {
        this.setState({
          durationSwitch: true
        });

        this.props.energyRental.updateRenewOrderInfo(BigNumber(energyAmountValue), 0, energyAmountSwitch);
      }
    }
  };

  onChangeEnergyAmountInput = (value, shouldUpdateInputValue = true) => {
    const { durationValueInSeconds, energyAmountInputDecimal } = this.state;

    try {
      if (value === '') {
        this.setState({
          energyAmountInputValue: ''
        });
        this.onChangeEnergyAmountInput(Config.energyRental.renewOrderDefaultEnergyValue, false);
      } else if (BigNumber(value).eq(0)) {
        this.setState({
          energyAmountInputValue: trimNumberAfterDecimalPlace(value, energyAmountInputDecimal)
        });

        this.props.energyRental.updateRenewOrderInfo(BigNumber(0), durationValueInSeconds, true);
        this.validateEnergyAmountInput(0);
      } else {
        const { valid, str } = numberParser('' + value, energyAmountInputDecimal);

        if (valid && /^\d*$/.test(str)) {
          if (shouldUpdateInputValue) {
            this.setState({
              energyAmountInputValue: str,
              energyAmountValue: BigNumber(str)
            });
          } else {
            this.setState({
              energyAmountValue: BigNumber(str)
            });
          }

          this.props.energyRental.updateRenewOrderInfo(BigNumber(str), durationValueInSeconds, true);

          this.validateEnergyAmountInput(str);
        }
      }
    } catch (e) {
      console.log('error: onChangeEnergyAmountInput');
    }
  };

  validateEnergyAmountInput = (str = this.state.energyAmountInputValue) => {
    const { maxRentableOfType, marketData } = this.props.energyRental;
    const { energyStakePerTrx } = marketData;

    const maxAmount = BigNumber(maxRentableOfType).times(energyStakePerTrx)._toFixed(0, 1);
    const minAmount = BigNumber(Config.energyRental.renewOrderMinEnergyValue);

    if (!str && !BigNumber(str).eq(0)) {
      this.setState({ energyAmountInputError: `` });
    } else if (BigNumber(BigNumber(maxRentableOfType).times(energyStakePerTrx)).lt(minAmount)) {
      this.setState({ energyAmountInputError: intl.get('energy_rental.form.amount_field.energy_no_balance') });
    } else if (BigNumber(str).lt(minAmount)) {
      this.setState({
        energyAmountInputError: intl.getHTML('energy_rental.renew_order_modal.renew_form.amount_field.min_val_hint', {
          value: formatNumber(minAmount)
        })
      });
    } else if (BigNumber(str).gt(maxAmount)) {
      this.setState({
        energyAmountInputError: intl.getHTML('energy_rental.renew_order_modal.renew_form.amount_field.max_val_hint', {
          value: formatNumber(maxAmount)
        })
      });
    } else {
      this.setState({ energyAmountInputError: `` });
    }
  };

  rentTimeExcution = seconds => {
    let time = seconds * 0.1; // 10 percentage
    let limitTime = 2 * 60 * 60; // 2 hours

    return seconds + (time > limitTime ? limitTime : time);
  };

  onChangeDurationInput = value => {
    const { durationIsDayUnitBoolean, durationInputDecimal, energyAmountValue, energyAmountSwitch } = this.state;

    try {
      if (value === '' || BigNumber(value).eq(0)) {
        this.setState({
          durationInputValue: trimNumberAfterDecimalPlace(value, durationInputDecimal),
          durationValueInSeconds: 0
        });
        this.props.energyRental.updateRenewOrderInfo(BigNumber(energyAmountValue), 0, energyAmountSwitch);

        if (durationIsDayUnitBoolean) {
          this.setState({
            durationInputError: intl.get(
              'energy_rental.renew_order_modal.renew_form.duration_field.day_unit_min_amount_error'
            )
          });
        } else {
          this.setState({
            durationInputError: intl.get(
              'energy_rental.renew_order_modal.renew_form.duration_field.hour_unit_min_amount_error'
            )
          });
        }
      } else {
        const { valid, str } = numberParser(value, durationInputDecimal);
        if (valid && /^\d*(.|.[0-9]){0,1}$/.test(str)) {
          let seconds = BigNumber(str).isNaN()
            ? 0
            : durationIsDayUnitBoolean
            ? BigNumber(str) * 24 * 60 * 60
            : BigNumber(str) * 60 * 60;

          seconds = this.rentTimeExcution(seconds);

          this.setState({
            durationInputValue: str,
            durationValueInSeconds: seconds
          });

          this.props.energyRental.updateRenewOrderInfo(BigNumber(energyAmountValue), seconds, energyAmountSwitch);

          if (durationIsDayUnitBoolean) {
            if (BigNumber(str).lt(0.1)) {
              this.setState({
                durationInputError: intl.get(
                  'energy_rental.renew_order_modal.renew_form.duration_field.day_unit_min_amount_error'
                )
              });
            } else if (BigNumber(str).gt(30)) {
              this.setState({
                durationInputError: intl.get(
                  'energy_rental.renew_order_modal.renew_form.duration_field.day_unit_max_amount_error'
                )
              });
            } else {
              this.setState({ durationInputError: '' });
            }
          } else {
            if (BigNumber(str).lt(0.5)) {
              this.setState({
                durationInputError: intl.get(
                  'energy_rental.renew_order_modal.renew_form.duration_field.hour_unit_min_amount_error'
                )
              });
            } else if (BigNumber(str).gt(720)) {
              this.setState({
                durationInputError: intl.get(
                  'energy_rental.renew_order_modal.renew_form.duration_field.hour_unit_max_amount_error'
                )
              });
            } else {
              this.setState({ durationInputError: '' });
            }
          }
        }
      }
    } catch (e) {
      console.log('error: onChangeDurationInput');
    }
  };
  onClickDurationInputUnitSwitch = value => {
    const { energyAmountValue, energyAmountSwitch } = this.state;

    this.setState({
      durationIsDayUnitBoolean: value,
      durationInputValue: '',
      durationValueInSeconds: 0,
      durationInputError: ''
    });
    this.props.energyRental.updateRenewOrderInfo(BigNumber(energyAmountValue), 0, energyAmountSwitch);

    this.durationInputRef.focus();
  };

  renderPrepaidInfoBox = (totalPrepayment, securityDeposit) => {
    const { lang, mobile } = this.state;
    let {
      yufuRent,
      yajinRent,
      energyFeeForRental: energyFee,
      marginDeposit,
      liquidationFines
    } = this.props.energyRental;

    return (
      <div className="rental-order-detail">
        <div className="detail-row" id="detail-row-tooltip">
          <div className="row-title">{intl.get('renewal.prepay_rent')}</div>
          <Tooltip
            onMouseEnter={() => {
              window.gtag('event', 'energyrent_pro_payment_hoverRefund', {
                'event_category': 'energyrent',
                'event_label': 'energyrent_pro_payment_hoverRefund'
              });
            }}
            title={() => {
              return (
                <div className="rent-fee-detail">
                  <div className="flexB flexA rent-fee-detail-item">
                    <div className="name">{intl.get('renewal.energy_fee')}</div>
                    <div className="value ellipsis">
                      {BigNumber(energyFee).eq(0) ? 0 : formatNumber(energyFee, Config.trxDecimal)} TRX
                    </div>
                  </div>

                  <div className="flexB flexA rent-fee-detail-item">
                    <div className="name">{intl.get('renewal.security_deposit')}</div>
                    <div className="value ellipsis">
                      {BigNumber(marginDeposit).eq(0)
                        ? intl.get('renewal.no_extra_sd')
                        : formatNumber(marginDeposit, Config.trxDecimal, { miniText: '0.01' }) + ' TRX'}
                    </div>
                  </div>

                  <div className="flexB flexA rent-fee-detail-item">
                    <div className="name">{intl.get('renewal.liquidation_penalty')}</div>
                    <div className="value ellipsis">
                      {BigNumber(liquidationFines).eq(0)
                        ? intl.get('renewal.no_extra_fines')
                        : formatNumber(liquidationFines, Config.trxDecimal, { miniText: '0.01' }) + ' TRX'}
                    </div>
                  </div>

                  {/* <div className="flexB flexA rent-fee-detail-item">
                    <div className="name">{intl.get('s11.rent')}</div>
                    <div className="value ellipsis">
                      {BigNumber(yufuRent).eq(0) ? 0 : formatNumber(yufuRent, Config.trxDecimal)} TRX
                    </div>
                  </div> */}

                  {/* <div className="flexB flexA rent-fee-detail-item">
                    <div className={'name' + (!BigNumber(yajinRent).eq(0) ? ' ellipsis' : '')}>
                      {intl.get('strx.energy_rent_money_tips1')}
                    </div>
                    <div className="value">
                      {BigNumber(yajinRent).eq(0)
                        ? intl.get('s11.no_extra_deposit')
                        : formatNumber(yajinRent, Config.trxDecimal) + ' TRX'}
                    </div>
                  </div> */}

                  <div className="return-rule-tip">
                    <span className="return-rule-tip-text">{intl.get('renewal.tips')}</span>
                    {/* <span
                      className="jl-links"
                      onClick={() => {
                        const element = document.getElementById('energy-data-container');
                        if (element) {
                          this.props.lend.setData({ poolDataTab: '2' });
                          element.scrollIntoView();
                        }
                        this.props.closeModal();
                      }}
                    >
                      {intl.get('renewal.how_to_calculate')}
                    </span> */}
                    <a className="jl-links" href={Config.rentCalculateLink} target="rentCalculateLink">
                      {intl.get('renewal.how_to_calculate')}
                    </a>
                  </div>
                </div>
              );
            }}
            getPopupContainer={() => document.getElementById('detail-row-tooltip')}
            placement={mobile ? 'topRight' : 'bottom'}
            arrowPointAtCenter
            overlayClassName="j-tooltip-dropdown prepaid"
          >
            <div className="flex tooltip-hover">
              <div className="row-value">{formatNumber(totalPrepayment, 2, { miniText: 0.01 })}</div>
              <div className="row-suffix">TRX</div>
            </div>
          </Tooltip>
          {/* <div className="row-value prepaid-row-value">{formatNumber(totalPrepayment, 2, { miniText: 0.01 })}</div>
          <div className="row-suffix">TRX</div> */}
        </div>
        <div className="detail-row" id="detail-row-tooltip1">
          <div className="row-title">
            {!mobile ? (
              <>
                {intl.get('energy_rental.form.prepayment_info.security_deposit_title')}

                <Tooltip
                  title={() => {
                    return (
                      <div>
                        {intl.get('energy_rental.form.prepayment_info.security_deposit_hint_renew')}
                        <span className="four-pixel-placeholder" />
                        <a
                          href={getSecurityDepositDetailsUrl(lang)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => {}}
                          className="jl-links"
                        >
                          {intl.get('energy_rental.form.prepayment_info.rules_detail')}
                        </a>
                      </div>
                    );
                  }}
                  placement="topLeft"
                  arrowPointAtCenter
                  overlayClassName="j-tooltip-dropdown energy-rental-tooltip refund-amount-tooltip"
                  getPopupContainer={() => document.getElementById('detail-row-tooltip1')}
                >
                  <div className="j-tooltip-icon"></div>
                </Tooltip>
              </>
            ) : (
              <>
                <TooltipText
                  title={() => {
                    return (
                      <div>
                        {intl.get('energy_rental.form.prepayment_info.security_deposit_hint_renew')}
                        <span className="four-pixel-placeholder" />
                        <a
                          href={getSecurityDepositDetailsUrl(lang)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => {}}
                          className="jl-links"
                        >
                          {intl.get('energy_rental.form.prepayment_info.rules_detail')}
                        </a>
                      </div>
                    );
                  }}
                  placement="topLeft"
                  overlayClassName="j-tooltip-dropdown energy-rental-tooltip"
                  getPopupContainer={() => document.getElementById('detail-row-tooltip1')}
                >
                  <div className="title-part">
                    {intl.get('energy_rental.form.prepayment_info.security_deposit_title_mobile_part_one')}
                  </div>
                  <div className="title-part">
                    {intl.get('energy_rental.form.prepayment_info.security_deposit_title_mobile_part_two')}
                  </div>
                </TooltipText>
              </>
            )}
          </div>
          <div className="row-value prepaid-row-value">{formatNumber(securityDeposit, 2, { miniText: 0.01 })}</div>
          <div className="row-suffix">TRX</div>
        </div>
      </div>
    );
  };

  confirmRenewOrder = () => {
    if (this.props.network.isRightChain === 0) {
      this.props.network.changeChain();
      return;
    }

    const {
      energyAmountSwitch,
      durationSwitch,
      energyAmountInputValue,
      energyAmountValue,
      durationInputValue,
      durationIsDayUnitBoolean,
      durationValueInSeconds,
      showBalanceError
    } = this.state;

    let { trxBalance, renewOrderPrepayment, renewOrderSafeValue } = this.props.energyRental;

    trxBalance = BigNumber(trxBalance).div(Config.trxPrecision);

    // Check balance error and safe max error
    // If yes, then show now
    const isBalaceInsufficient = BigNumber(renewOrderPrepayment).gt(trxBalance);
    const isBelowSafeMax = BigNumber(renewOrderPrepayment).plus(renewOrderSafeValue).gt(trxBalance);

    if (!showBalanceError && (isBalaceInsufficient || isBelowSafeMax)) {
      this.setState({
        showBalanceError: true
      });
    } else if (!isBalaceInsufficient) {
      this.props.energyRental.setData({
        addOrderModalStep: 3,
        isAddOrderModalApprovingTrans: false,

        renewOrderShouldUseSavedInfo: true,
        renewOrderSavedInfoEnergyAmountSwitch: energyAmountSwitch,
        renewOrderSavedInfoEnergyAmountInputValue: energyAmountInputValue,
        renewOrderSavedInfoEnergyAmountValue: energyAmountValue,
        renewOrderSavedInfoDurationSwitch: durationSwitch,
        renewOrderSavedInfoDurationInputValue: durationInputValue,
        renewOrderSavedInfoDurationIsDayUnitBoolean: durationIsDayUnitBoolean,
        renewOrderSavedInfoDurationValueInSeconds: durationValueInSeconds
      });
    }
    window.gtag('event', 'energyrent_pro_retx_popup_clickrenew', {
      'event_category': 'energyrent',
      'event_label': 'energyrent_pro_retx_popup_clickrenew'
    });
  };

  render() {
    const {
      showBalanceError,
      energyAmountSwitch,
      durationSwitch,
      energyAmountInputValue,
      energyAmountValue,
      durationInputValue,
      durationIsDayUnitBoolean,
      durationValueInSeconds,
      energyAmountInputError,
      durationInputError
    } = this.state;

    const { isConnected } = this.props.network;
    let {
      kink,
      marketData,
      trxBalance,
      renewOrderPrepayment,
      renewOrderSecurityDeposit,
      renewOrderExistingEnergyAmount,
      renewOrderExistingRemainingSeconds,
      renewOrderEnergyAmount,
      renewOrderDuration,
      renewOrderSafeValue
    } = this.props.energyRental;

    const isRenewingExpiredOrder = BigNumber(renewOrderExistingRemainingSeconds).eq(0);

    var formEnergyAmount = !isRenewingExpiredOrder && energyAmountSwitch ? energyAmountValue : BigNumber(0);
    var totalEnergy = renewOrderExistingEnergyAmount;
    var totalDuration = renewOrderExistingRemainingSeconds;

    if (formEnergyAmount && !BigNumber(formEnergyAmount).isNaN()) {
      totalEnergy = BigNumber(formEnergyAmount).plus(totalEnergy);
    }
    if (durationValueInSeconds && !BigNumber(durationValueInSeconds).isNaN()) {
      totalDuration = BigNumber(durationValueInSeconds).plus(totalDuration);
    }

    trxBalance = BigNumber(trxBalance).div(Config.trxPrecision);
    const isBalaceInsufficient = BigNumber(renewOrderPrepayment).gt(trxBalance);

    const isRenewOrderInfoUpdated =
      (BigNumber(formEnergyAmount).eq(BigNumber(renewOrderEnergyAmount)) ||
        ((BigNumber(formEnergyAmount).isNaN() || BigNumber(formEnergyAmount).eq(0)) &&
          (BigNumber(renewOrderEnergyAmount).isNaN() || BigNumber(renewOrderEnergyAmount).eq(0)))) &&
      (BigNumber(durationValueInSeconds).eq(BigNumber(renewOrderDuration)) ||
        ((BigNumber(durationValueInSeconds).isNaN() || BigNumber(durationValueInSeconds).eq(0)) &&
          (BigNumber(renewOrderDuration).isNaN() || BigNumber(renewOrderDuration).eq(0))));

    const anyActiveInputIsActiveAndEmpty =
      (!isRenewingExpiredOrder && energyAmountSwitch && BigNumber(energyAmountValue).eq(0)) ||
      (durationSwitch && BigNumber(durationValueInSeconds).eq(0));
    const isBothInputEmpty = BigNumber(formEnergyAmount).eq(0) && BigNumber(durationValueInSeconds).eq(0);

    const haveAnyInputError =
      (energyAmountInputError && !isRenewingExpiredOrder) ||
      durationInputError ||
      anyActiveInputIsActiveAndEmpty ||
      isBothInputEmpty;

    const currentRentalPrice = marketData.trx1wEnergy * 100;
    const currentItem = marketData && marketData.model && marketData.model.find(x => x.current === true);
    const utilizationRate = currentItem ? currentItem.base * 100 : '--';

    const showHighRentalPriceHint = utilizationRate !== '--' && BigNumber(utilizationRate).gte(kink);
    const showSafeMaxHint =
      showBalanceError &&
      !haveAnyInputError &&
      BigNumber(renewOrderPrepayment).plus(renewOrderSafeValue).gt(trxBalance);

    const estimatedTransactionCount =
      totalEnergy && totalEnergy > 0 ? BigNumber(totalEnergy).idiv(Config.estimatedEnergyPerTx) : 0;

    return (
      <div>
        <div className="input-section">
          <div className="field-title">
            <div className="title-text">
              {intl.get('energy_rental.renew_order_modal.renew_form.amount_field.title')}

              <ToggleSwitch
                on={!isRenewingExpiredOrder && energyAmountSwitch}
                disabled={isRenewingExpiredOrder}
                onClick={() => {
                  this.onToggleEnergyAmountSwitch();
                }}
              />
            </div>
            <div className="available-amount-title">
              {intl.get('energy_rental.form.amount_field.available_trx_amount')}
            </div>

            <div className="available-amount-value">
              {isConnected && formatNumber(BigNumber(trxBalance), Config.trxDecimal)}
            </div>
            <div className="available-amount-suffix">{isConnected ? 'TRX' : '--'}</div>
          </div>
          <Input.Group
            compact
            className={classnames(
              'energy-amount-input-group',
              { 'j-error-input-group': energyAmountInputError },
              { 'input-group-disabled': !energyAmountSwitch || isRenewingExpiredOrder },
              { 'input-group-always-disabled': isRenewingExpiredOrder }
            )}
          >
            <Input
              className={classnames('j-input', 'energy-amount-input', {
                'enabled-input': !isRenewingExpiredOrder && energyAmountSwitch
              })}
              placeholder={
                isRenewingExpiredOrder
                  ? intl.get('energy_rental.renew_order_modal.renew_form.expired_hint')
                  : energyAmountSwitch
                  ? addThousandSeparators(Config.energyRental.renewOrderDefaultEnergyValue)
                  : intl.get('energy_rental.renew_order_modal.renew_form.amount_field.placeholder')
              }
              value={addThousandSeparators(energyAmountInputValue)}
              onChange={event => this.onChangeEnergyAmountInput(removeThousandSeparators(event.target.value))}
              allowClear
              addonBefore={<span className="energy-logo"></span>}
              addonAfter={<></>}
              disabled={!energyAmountSwitch || isRenewingExpiredOrder}
              onFocus={() => {
                this.setState({ showBalanceError: true });
              }}
            />

            {energyAmountInputError && (
              <div className="j-error-tip">
                <span className="j-error-img"></span>
                <div className="j-safe-text">{energyAmountInputError}</div>
              </div>
            )}
          </Input.Group>
        </div>

        <div className="input-section">
          <div className="field-title">
            <div className="title-text">
              {intl.get('energy_rental.renew_order_modal.renew_form.duration_field.title')}

              <ToggleSwitch
                on={isRenewingExpiredOrder || durationSwitch}
                onClick={() => {
                  this.onToggleDurationSwitch();
                }}
              />
            </div>
          </div>
          <Input.Group
            compact
            className={classnames(
              'duration-input-group',
              { 'j-error-input-group': durationInputError },
              { 'input-group-disabled': !durationSwitch && !isRenewingExpiredOrder }
            )}
          >
            <Input
              className="j-input duration-input"
              placeholder={intl.get('energy_rental.renew_order_modal.renew_form.duration_field.placeholder')}
              value={addThousandSeparators(durationInputValue)}
              onChange={event => this.onChangeDurationInput(removeThousandSeparators(event.target.value))}
              allowClear
              addonBefore={<span className="time-logo"></span>}
              addonAfter={
                <div
                  className="switch-unit-button"
                  onClick={() => {
                    if (isRenewingExpiredOrder || durationSwitch) {
                      this.onClickDurationInputUnitSwitch(!durationIsDayUnitBoolean);
                      window.gtag('event', 'energyrent_pro_retx_popup_timeUnit', {
                        'event_category': 'energyrent',
                        'event_label': 'energyrent_pro_retx_popup_timeUnit'
                      });
                    }
                  }}
                >
                  {durationIsDayUnitBoolean === true
                    ? intl.get('energy_rental.form.duration_field.day_unit')
                    : intl.get('energy_rental.form.duration_field.hour_unit')}
                </div>
              }
              ref={ref => {
                this.durationInputRef = ref;
              }}
              disabled={!durationSwitch && !isRenewingExpiredOrder}
              onFocus={() => {
                this.setState({ showBalanceError: true });
              }}
            />

            {durationInputError && (
              <div className="j-error-tip">
                <span className="j-error-img"></span>
                <div className="j-safe-text">{durationInputError}</div>
              </div>
            )}
          </Input.Group>
        </div>

        <div className="input-section">
          <div className="field-title">
            <div className="title-text">
              {intl.get('energy_rental.renew_order_modal.renew_form.after_renewal_info.title')}
            </div>
          </div>

          <div className="after-renew-detail">
            <div className="detail-row energy-icon-prefix">
              <span className="row-title">
                {intl.get('energy_rental.renew_order_modal.renew_form.after_renewal_info.energy_title')}
                {' ' + intl.get('energy_rental.dash') + ' '}
                {formatNumber(totalEnergy, 0)}
              </span>
              <span className="row-value">
                {' ' + intl.get('energy_rental.tilde') + ' '}
                {intl.get(
                  estimatedTransactionCount > 1
                    ? 'energy_rental.form.amount_field.estimated_transaction_count_hint_plural'
                    : 'energy_rental.form.amount_field.estimated_transaction_count_hint',
                  {
                    value: estimatedTransactionCount
                  }
                )}
              </span>
            </div>
            <div className={'duration-box ' + (BigNumber(totalDuration).lt(86400) ? 'warning' : '')}>
              <div className="detail-row duration-icon-prefix">
                <span className="row-title">
                  {intl.get('energy_rental.renew_order_modal.renew_form.after_renewal_info.duration_title')}
                  {' ' + intl.get('energy_rental.dash') + ' '}
                  {BigNumber(totalDuration).gt(60)
                    ? toDayHourMinString(totalDuration)
                    : BigNumber(totalDuration).eq(0)
                    ? intl.get('energy_rental.mini_list.rental_time_expired')
                    : BigNumber(totalDuration).gt(0) && BigNumber(totalDuration).lte(60)
                    ? intl.get('energy_rental.mini_list.rental_time_expire_soon')
                    : '--'}
                </span>
                {BigNumber(totalDuration).gt(60) && (
                  <span className="row-value">
                    {' ' + intl.get('energy_rental.tilde') + ' '}
                    {dateAfterSecondsToISO(totalDuration)}
                  </span>
                )}
              </div>
              {BigNumber(totalDuration).lt(86400) && (
                <div className="detail-row">
                  <div className="pretty-short-warning">
                    <svg width="12" height="13" viewBox="0 0 12 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="6" cy="6.5" r="5.5" stroke="#F58721" />
                      <path
                        fill="#F58721"
                        d="M6.76368 8.95452C6.76368 9.25577 6.51947 9.49998 6.21823 9.49998H6.00004C5.6988 9.49998 5.45459 9.25577 5.45459 8.95452C5.45459 8.65328 5.6988 8.40907 6.00004 8.40907H6.21823C6.51947 8.40907 6.76368 8.65328 6.76368 8.95452ZM6.10914 7.59089C5.74764 7.59089 5.45459 7.29784 5.45459 6.93634V4.42725C5.45459 4.06575 5.74764 3.77271 6.10914 3.77271C6.47063 3.77271 6.76368 4.06576 6.76368 4.42725V6.93634C6.76368 7.29784 6.47063 7.59089 6.10914 7.59089Z"
                      />
                    </svg>
                    <span className="ml-8">{intl.get('s9.duration_lt_24h_for_modal')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {this.renderPrepaidInfoBox(renewOrderPrepayment, renewOrderSecurityDeposit)}

        {showHighRentalPriceHint && (
          <div className="high-rental-price-hint">
            {intl.get('energy_rental.form.hints.hign_rental_price', {
              value: formatNumber(currentRentalPrice, 0, { miniText: '0.001' })
            })}
          </div>
        )}
        {showSafeMaxHint && (
          <div className="safe-max-hint">
            {intl.get('energy_rental.form.hints.safe_max_hints', { value: formatNumber(renewOrderSafeValue, 2) })}
          </div>
        )}

        {isBalaceInsufficient && showBalanceError ? (
          <button
            className={classnames('action-btn confirm-btn single-action-btn', {
              'have-hint-above': showSafeMaxHint || showHighRentalPriceHint
            })}
            disabled={true}
          >
            {intl.get('energy_rental.form.action_btn.insufficient_trx')}
          </button>
        ) : (
          <button
            className={classnames('action-btn confirm-btn single-action-btn', {
              'have-hint-above': showSafeMaxHint || showHighRentalPriceHint
            })}
            disabled={!isRenewOrderInfoUpdated || BigNumber(renewOrderPrepayment).isNaN() || haveAnyInputError}
            onClick={() => {
              this.confirmRenewOrder();
              if (this.props.energyRental.isNeedShowDealTip()) {
                this.props.energyRental.setData({ dealNoteShow: true });
              }
            }}
          >
            {(!isRenewOrderInfoUpdated || BigNumber(renewOrderPrepayment).isNaN()) && !haveAnyInputError ? (
              <span className="siging-icon"></span>
            ) : (
              intl.get('energy_rental.renew_order_modal.renew_form.renew_action_btn')
            )}
          </button>
        )}

        {/* <DealNoteModal callback={this.confirmRenewOrder} /> */}
      </div>
    );
  }
}

export default RenewFormStep;
