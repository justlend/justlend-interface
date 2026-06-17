import React from 'react';
import intl from 'react-intl-universal';
import isMobile from 'ismobilejs';
import { inject, observer } from 'mobx-react';
import BigNumber from 'bignumber.js';
import { Input, Tooltip } from 'antd';
import classnames from 'classnames';

import {
  formatNumber,
  numberParser,
  getAccount,
  getQueryObj,
  addThousandSeparators,
  removeThousandSeparators,
  trimNumberAfterDecimalPlace
} from '../../../utils/helper';
import { Config } from '../../../config';

import { TooltipText } from './TooltipText';

import { shouldShowShortRentalHint, getSecurityDepositDetailsUrl } from './utils';

import AddOrderModal from '../../Modals/v2/energy-rental/AddOrderModal';
import EndOrderModal from '../../Modals/v2/energy-rental/EndOrderModal';
import DealNoteModal from '../../Modals/v2/energy-rental/DealNote';

import HVideo from '../../../assets/images/webms/h-default.webm';
import DVideo from '../../../assets/images/webms/d-default.webm';
import HWhiteVideo from '../../../assets/images/webms/h-white-theme.webm';
import DWhiteVideo from '../../../assets/images/webms/d-white-theme.webm';
import DPoster from '../../../assets/images/webms/d-default-poster.svg';
import DPosterForWhite from '../../../assets/images/webms/d-white-theme-poster.svg';
import HPoster from '../../../assets/images/webms/h-default-poster.svg';
import HPosterForWhite from '../../../assets/images/webms/h-white-theme-poster.svg';
import '../../../assets/css/v2/energy-rental/rental-form.scss';

@inject('network')
@inject('lend')
@inject('system')
@inject('strx')
@inject('energyRental')
@observer
class RentalForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: getQueryObj()?.lang || window.localStorage.getItem('lang') || intl.options.currentLocale,
      mobile: isMobile(window.navigator).any,

      energyAmountInputValue: '',
      energyAmountInputDecimal: 0,
      energyAmountValue: Config.energyRental.newOrderDefaultEnergyValue,

      durationOptionIndex: 1,
      durationInputValue: '',
      durationInputDecimal: 1,
      durationIsDayUnitBoolean: true,
      durationValueInSeconds: this.rentTimeExcution(1 * 24 * 60 * 60),

      isOtherAddressInputActive: false,
      otherAddressInputValue: '',
      otherAddressVerifiedValue: '',

      energyAmountInputError: '',
      durationInputError: '',
      otherAddressInputError: '',

      showBalanceError: false,
      playStatus: 0, // 1: day played, 2: hour played
      videoUrl: DVideo,
      innerTheme: this.props.lend.theme
    };

    this.durationInputRef = null;
    this.switchRef = null;
  }

  componentDidMount = async () => {
    const { energyAmountValue, durationValueInSeconds } = this.state;
    let timer = setInterval(() => {
      if (this.props.energyRental.totalFrozenOfType !== '--') {
        this.props.energyRental.updateNewOrderInfo(energyAmountValue, durationValueInSeconds);
        clearTimeout(timer);
      }
    }, 1000);

    this.initVideo(!this.state.durationIsDayUnitBoolean, true);
  };

  componentDidUpdate = () => {
    if (this.props.lend.theme !== this.state.innerTheme) {
      this.initVideo(!this.state.durationIsDayUnitBoolean, true);
      this.setState({ innerTheme: this.props.lend.theme });
    }
  };

  initVideo = (durationIsDayUnitBoolean = this.state.durationIsDayUnitBoolean, isStopPlay = false) => {
    const { theme } = this.props.lend;

    let url = HVideo;
    if (!durationIsDayUnitBoolean) {
      url = DVideo;
    }

    if (theme === 'white') {
      url = HWhiteVideo;
      if (!durationIsDayUnitBoolean) {
        url = DWhiteVideo;
      }
    }

    this.setState({ videoUrl: url }, () => {
      if (!isStopPlay) {
        this.switchRef
          .play()
          .then(_ => {
            setTimeout(() => {
              this.setState({ playStatus: durationIsDayUnitBoolean ? 1 : 2 });
            }, 1500);
          })
          .catch(error => {});
      }
    });
  };

  resetFormInput = () => {
    this.setState({
      energyAmountInputValue: '',
      energyAmountValue: Config.energyRental.newOrderDefaultEnergyValue,

      durationOptionIndex: 1,
      durationInputValue: '',
      durationIsDayUnitBoolean: true,
      durationValueInSeconds: this.rentTimeExcution(1 * 24 * 60 * 60),

      isOtherAddressInputActive: false,
      otherAddressInputValue: '',
      otherAddressVerifiedValue: '',

      energyAmountInputError: '',
      durationInputError: '',
      otherAddressInputError: '',

      showBalanceError: false
    });

    this.props.energyRental.updateNewOrderInfo(
      Config.energyRental.newOrderDefaultEnergyValue,
      this.rentTimeExcution(1 * 24 * 60 * 60)
    );
  };

  renderEnergyAmountInput = () => {
    const { energyAmountInputValue, energyAmountValue, energyAmountInputError } = this.state;
    const { isConnected } = this.props.network;
    let { maxRentableOfType, marketData, trxBalance } = this.props.energyRental;
    const { energyStakePerTrx } = marketData;

    trxBalance = BigNumber(trxBalance).div(Config.trxPrecision);

    const estimatedTransactionCount =
      energyAmountValue && energyAmountValue > 0 ? BigNumber(energyAmountValue).idiv(Config.estimatedEnergyPerTx) : 0;

    return (
      <>
        <div className="field-title">
          <div className="title-text">{intl.get('energy_rental.form.amount_field.title')}</div>

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
          className={classnames('energy-amount-input-group', { 'j-error-input-group': energyAmountInputError })}
        >
          <Input
            className="j-input energy-amount-input"
            placeholder={addThousandSeparators(Config.energyRental.newOrderDefaultEnergyValue)}
            allowClear
            addonBefore={<span className="energy-logo"></span>}
            // addonAfter={
            //   <div
            //     className={classnames('max-btn', {
            //       'disabled': BigNumber(maxRentableOfType).isNaN() || BigNumber(energyStakePerTrx).isNaN()
            //     })}
            //     onClick={this.onClickMaxBtn}
            //   >
            //     {intl.get('energy_rental.form.amount_field.max_amount_btn')}
            //   </div>
            // }
            value={addThousandSeparators(energyAmountInputValue)}
            onChange={event => this.onChangeEnergyAmountInput(removeThousandSeparators(event.target.value))}
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

        <div className="estimated-transaction-count-hint">
          {intl.get('energy_rental.tilde') + ' '}
          {intl.get(
            estimatedTransactionCount > 1
              ? 'energy_rental.form.amount_field.estimated_transaction_count_hint_plural'
              : 'energy_rental.form.amount_field.estimated_transaction_count_hint',
            {
              value: estimatedTransactionCount
            }
          )}
        </div>
      </>
    );
  };

  onChangeEnergyAmountInput = (value, shouldUpdateInputValue = true) => {
    const { durationValueInSeconds, energyAmountInputDecimal } = this.state;

    try {
      if (value === '') {
        this.setState({
          energyAmountInputValue: ''
        });
        this.onChangeEnergyAmountInput(Config.energyRental.newOrderDefaultEnergyValue, false);
      } else if (BigNumber(value).eq(0)) {
        this.setState({
          energyAmountInputValue: trimNumberAfterDecimalPlace(value, energyAmountInputDecimal)
        });

        this.props.energyRental.updateNewOrderInfo(BigNumber(0), durationValueInSeconds);
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

          this.props.energyRental.updateNewOrderInfo(BigNumber(str), durationValueInSeconds);

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
    const minAmount = BigNumber(Config.energyRental.newOrderMinEnergyValue);

    if (!str && !BigNumber(str).eq(0)) {
      this.setState({ energyAmountInputError: `` });
    } else if (BigNumber(BigNumber(maxRentableOfType).times(energyStakePerTrx)).lt(minAmount)) {
      this.setState({ energyAmountInputError: intl.get('energy_rental.form.amount_field.energy_no_balance') });
    } else if (BigNumber(str).lt(minAmount)) {
      this.setState({
        energyAmountInputError: intl.getHTML('energy_rental.form.amount_field.min_amount_error', {
          value: formatNumber(minAmount)
        })
      });
    } else if (BigNumber(str).gt(maxAmount)) {
      this.setState({
        energyAmountInputError: intl.getHTML('energy_rental.form.amount_field.max_amount_error', {
          value: formatNumber(maxAmount)
        })
      });
    } else {
      this.setState({ energyAmountInputError: `` });
    }
  };

  renderDurationInput = () => {
    const { durationOptionIndex, durationInputError, durationInputValue, durationIsDayUnitBoolean, mobile } =
      this.state;
    let { trxBalance } = this.props.energyRental;
    trxBalance = BigNumber(trxBalance).div(Config.trxPrecision);
    const { theme } = this.props.lend;
    const isWhite = theme === 'white';

    return (
      <>
        <div className="field-title">
          <div className="title-text">{intl.get('energy_rental.form.duration_field.title')}</div>
        </div>

        <div className="duration-input-row">
          <div
            className={classnames('duration-option', { 'selected': durationOptionIndex == 0 })}
            onClick={() => {
              this.setState({ showBalanceError: true });
              this.onClickDurationOption(0);
              window.gtag('event', 'energyrent_pro_renttime_clickchange', {
                'event_category': 'energyrent',
                'event_label': '3_hour'
              });
            }}
          >
            {intl.get('energy_rental.form.duration_field.three_hour')}
          </div>
          <div
            className={classnames('duration-option', { 'selected': durationOptionIndex == 1 })}
            onClick={() => {
              this.setState({ showBalanceError: true });
              this.onClickDurationOption(1);
              window.gtag('event', 'energyrent_pro_renttime_clickchange', {
                'event_category': 'energyrent',
                'event_label': '1_day'
              });
            }}
          >
            {intl.get('energy_rental.form.duration_field.one_day')}
          </div>
          <div
            className={classnames('duration-option', { 'selected': durationOptionIndex == 2 })}
            onClick={() => {
              this.setState({ showBalanceError: true });
              this.onClickDurationOption(2);
              window.gtag('event', 'energyrent_pro_renttime_clickchange', {
                'event_category': 'energyrent',
                'event_label': '3_days'
              });
            }}
          >
            {intl.get('energy_rental.form.duration_field.three_day')}
          </div>
          <Input.Group
            compact
            className={classnames(
              'duration-input-group',
              { 'j-error-input-group': durationInputError },
              { 'j-have-val-input-group': durationInputValue }
            )}
          >
            <Input
              className="j-input duration-input"
              placeholder={intl.get('energy_rental.form.duration_field.other_options')}
              value={addThousandSeparators(durationInputValue)}
              onChange={event => {
                this.onChangeDurationInput(removeThousandSeparators(event.target.value));
                window.gtag('event', 'energyrent_pro_renttime_clickchange', {
                  'event_category': 'energyrent',
                  'event_label': 'coustom'
                });
              }}
              onFocus={() => {
                this.setState({ showBalanceError: true });
              }}
              addonAfter={
                <Tooltip
                  placement="bottom"
                  overlayClassName="j-tooltip-dropdown rental-switch-time"
                  title={durationIsDayUnitBoolean === true ? intl.get('s9.switch_hour') : intl.get('s9.switch_day')}
                >
                  <div
                    className="switch-unit-button"
                    onMouseDown={event => {
                      event.preventDefault();
                    }}
                    onClick={() => {
                      this.setState({ showBalanceError: true, playStatus: 0 });
                      this.onClickDurationInputUnitSwitch(!durationIsDayUnitBoolean);
                      window.gtag('event', 'energyrent_pro_cutomtime_clickunit', {
                        'event_category': 'energyrent',
                        'event_label': durationIsDayUnitBoolean ? 'day' : 'hour'
                      });
                    }}
                  >
                    {durationIsDayUnitBoolean === true
                      ? intl.get('energy_rental.form.duration_field.day_unit')
                      : intl.get('energy_rental.form.duration_field.hour_unit')}
                    {mobile ? (
                      <img
                        alt="time-switch-icon"
                        className={this.state.lang === 'en-US' ? 'ml-4' : ''}
                        src={
                          durationIsDayUnitBoolean
                            ? isWhite
                              ? DPosterForWhite
                              : DPoster
                            : isWhite
                            ? HPosterForWhite
                            : HPoster
                        }
                      />
                    ) : (
                      <video
                        id="banner-video"
                        className={this.state.lang === 'en-US' ? 'ml-4' : ''}
                        muted
                        playsInline
                        ref={ref => {
                          this.switchRef = ref;
                        }}
                        key={this.state.videoUrl}
                      >
                        <source src={this.state.videoUrl} type="video/webm" />
                        Your browser does not support the video tag.
                      </video>
                    )}
                  </div>
                </Tooltip>
              }
              ref={ref => {
                this.durationInputRef = ref;
              }}
            />
          </Input.Group>

          {durationInputError && (
            <div className="j-error-tip">
              <span className="j-error-img"></span>
              <div className="j-safe-text">{durationInputError}</div>
            </div>
          )}
        </div>
        {((durationIsDayUnitBoolean === true &&
          BigNumber(durationInputValue).gte(0.1) &&
          BigNumber(durationInputValue).lt(1)) ||
          (durationIsDayUnitBoolean !== true &&
            BigNumber(durationInputValue).gte(1) &&
            BigNumber(durationInputValue).lt(22)) ||
          durationOptionIndex == 0) && (
          <div className="pretty-short-warning start">
            <svg width="12" height="13" viewBox="0 0 12 13" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="6" cy="6.5" r="5.5" stroke="#F58721" />
              <path
                fill="#F58721"
                d="M6.76368 8.95452C6.76368 9.25577 6.51947 9.49998 6.21823 9.49998H6.00004C5.6988 9.49998 5.45459 9.25577 5.45459 8.95452C5.45459 8.65328 5.6988 8.40907 6.00004 8.40907H6.21823C6.51947 8.40907 6.76368 8.65328 6.76368 8.95452ZM6.10914 7.59089C5.74764 7.59089 5.45459 7.29784 5.45459 6.93634V4.42725C5.45459 4.06575 5.74764 3.77271 6.10914 3.77271C6.47063 3.77271 6.76368 4.06576 6.76368 4.42725V6.93634C6.76368 7.29784 6.47063 7.59089 6.10914 7.59089Z"
              />
            </svg>
            <div className="ml-5">
              <span>{intl.get('s9.pretty_short_pre')}</span>
              <Tooltip
                placement="bottom"
                overlayClassName="j-tooltip-dropdown pretty-short-tip"
                title={intl.get('s9.pretty_short_hover')}
              >
                <span className="dashed">{intl.get('s9.pretty_short_dashed')}</span>
              </Tooltip>
              <span>{intl.get('s9.pretty_short_suf')}</span>
            </div>
          </div>
        )}
      </>
    );
  };

  onClickDurationOption = option => {
    const { energyAmountValue } = this.state;

    var valueInSeconds = 0;

    if (option == 0) {
      valueInSeconds = 3 * 60 * 60;
    } else if (option == 1) {
      valueInSeconds = 1 * 24 * 60 * 60;
    } else if (option == 2) {
      valueInSeconds = 3 * 24 * 60 * 60;
    }

    valueInSeconds = this.rentTimeExcution(valueInSeconds);

    this.setState({
      durationOptionIndex: option,
      durationInputValue: '',
      durationValueInSeconds: valueInSeconds,
      durationInputError: ''
    });
    this.props.energyRental.updateNewOrderInfo(energyAmountValue, valueInSeconds);
  };

  rentTimeExcution = seconds => {
    let time = seconds * 0.1; // 10 percentage
    let limitTime = 2 * 60 * 60; // 2 hours

    return seconds + (time > limitTime ? limitTime : time);
  };

  onChangeDurationInput = value => {
    const { durationIsDayUnitBoolean, durationInputDecimal, energyAmountValue } = this.state;

    try {
      if (value === '' || BigNumber(value).eq(0)) {
        this.setState({
          durationOptionIndex: 3,
          durationInputValue: trimNumberAfterDecimalPlace(value, durationInputDecimal),
          durationValueInSeconds: 0
        });
        this.props.energyRental.updateNewOrderInfo(energyAmountValue, 0);

        if (durationIsDayUnitBoolean) {
          this.setState({
            durationInputError: intl.get('energy_rental.form.duration_field.day_unit_min_amount_error')
          });
        } else {
          this.setState({
            durationInputError: intl.get('energy_rental.form.duration_field.hour_unit_min_amount_error')
          });
        }
      } else {
        const { valid, str } = numberParser(value, durationInputDecimal);
        if (valid && /^\d*(.|.[0-9]){0,1}$/.test(str)) {
          let seconds = durationIsDayUnitBoolean ? BigNumber(str) * 24 * 60 * 60 : BigNumber(str) * 60 * 60;

          seconds = this.rentTimeExcution(seconds);

          this.setState({
            durationOptionIndex: 3,
            durationInputValue: str,
            durationValueInSeconds: seconds
          });
          this.props.energyRental.updateNewOrderInfo(energyAmountValue, seconds);

          if (durationIsDayUnitBoolean) {
            if (BigNumber(str).lt(0.1)) {
              this.setState({
                durationInputError: intl.get('energy_rental.form.duration_field.day_unit_min_amount_error')
              });
            } else if (BigNumber(str).gt(30)) {
              this.setState({
                durationInputError: intl.get('energy_rental.form.duration_field.day_unit_max_amount_error')
              });
            } else {
              this.setState({ durationInputError: '' });
            }
          } else {
            if (BigNumber(str).lt(1)) {
              this.setState({
                durationInputError: intl.get('energy_rental.form.duration_field.hour_unit_min_amount_error')
              });
            } else if (BigNumber(str).gt(720)) {
              this.setState({
                durationInputError: intl.get('energy_rental.form.duration_field.hour_unit_max_amount_error')
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
    const { energyAmountValue, durationIsDayUnitBoolean, mobile } = this.state;

    if (!mobile) this.initVideo(value);

    this.setState({
      durationIsDayUnitBoolean: value,
      durationInputValue: '',
      durationValueInSeconds: 0,
      durationInputError: '',
      durationOptionIndex: 3
    });
    this.props.energyRental.updateNewOrderInfo(energyAmountValue, 0);

    if (!mobile && this.durationInputRef) {
      this.durationInputRef.focus();
    }
  };

  renderOtherAddressInput = () => {
    const { isConnected } = this.props.network;
    const { isOtherAddressInputActive, otherAddressInputValue, otherAddressInputError } = this.state;

    return (
      <>
        {isConnected ? (
          <div
            className={classnames('field-title', 'other-address-field-title', {
              'is-active': isOtherAddressInputActive
            })}
          >
            <div
              className="title-text"
              onClick={() => {
                if (isOtherAddressInputActive) {
                  this.setState({
                    isOtherAddressInputActive: false,
                    otherAddressInputValue: '',
                    otherAddressInputError: '',
                    otherAddressVerifiedValue: ''
                  });
                } else {
                  this.setState({
                    isOtherAddressInputActive: true
                  });
                }
                window.gtag('event', 'energyrent_pro_rentforothers_clickBtn', {
                  'event_category': 'energyrent',
                  'event_label': 'energyrent_pro_rentforothers_clickBtn'
                });
              }}
            >
              {intl.get('energy_rental.form.others_address_field.title')}
            </div>
          </div>
        ) : (
          <Tooltip
            title={() => {
              return (
                <div className="connect-wallet-hint">
                  {intl.get('energy_rental.form.others_address_field.connect_wallet_first_msg')}
                </div>
              );
            }}
            placement="bottomRight"
            overlayClassName="j-tooltip-dropdown energy-rental-tooltip"
          >
            <div className={classnames('field-title', 'other-address-field-title', 'not-connected')}>
              <div className="title-text">{intl.get('energy_rental.form.others_address_field.title')}</div>
            </div>
          </Tooltip>
        )}

        {isOtherAddressInputActive && (
          <Input.Group
            compact
            className={classnames('other-address-input-group', { 'j-error-input-group': otherAddressInputError })}
          >
            <Input
              className="j-input other-address-input"
              placeholder={intl.get('energy_rental.form.others_address_field.placeholder')}
              value={otherAddressInputValue}
              onChange={event => this.onChangeOtherAddressInput(event.target.value)}
              onClick={() => {
                window.gtag('event', 'energyrent_pro_rentforothers_clickEnter', {
                  'event_category': 'energyrent',
                  'event_label': 'energyrent_pro_rentforothers_clickEnter'
                });
              }}
              onFocus={() => {
                this.setState({ showBalanceError: true });
              }}
              allowClear
              addonAfter={<></>}
            />

            {otherAddressInputError && (
              <div className="j-error-tip">
                <span className="j-error-img"></span>
                <div className="j-safe-text">{otherAddressInputError}</div>
              </div>
            )}
          </Input.Group>
        )}

        <div className="other-address-input-placeholder"></div>
      </>
    );
  };

  onChangeOtherAddressInput = async value => {
    this.setState({
      otherAddressInputValue: value,
      otherAddressVerifiedValue: '',
      otherAddressInputError: ''
    });

    try {
      const accountInfo = await getAccount(value);

      if (accountInfo && Object.keys(accountInfo).length > 0) {
        if (accountInfo?.type === 'Contract') {
          this.setState({
            otherAddressInputError: intl.get('energy_rental.form.others_address_field.contract_address_error')
          });
        } else {
          this.setState({
            otherAddressInputValue: value,
            otherAddressVerifiedValue: value,
            otherAddressInputError: ''
          });
        }
      } else {
        this.setState({ otherAddressInputError: intl.get('energy_rental.form.others_address_field.inactive_error') });
      }
    } catch (e) {
      console.log('error: onChangeOtherAddressInput', e);
      window.gtag('event', 'energyrent_pro_rentforothers_errortips', {
        'event_category': 'energyrent',
        'event_label': 'energyrent_pro_rentforothers_errortips'
      });

      this.setState({ otherAddressInputError: intl.get('energy_rental.form.others_address_field.invalid_address') });
    }
  };

  renderPrepaidInfoBox = (totalPrepayment, securityDeposit) => {
    const { lang, mobile } = this.state;
    let { yufuRent, yajinRent, rentEnergyFee, rentSecurityDeposit, rentLiquidatePenalty } = this.props.energyRental;

    return (
      <div className="prepaid-info-box">
        <div className="info-row emphazied">
          <div className="row-title">{intl.get('energy_rental.form.prepayment_info.prepayment_title')}</div>

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
                    <div className="name">{intl.get('energy_rental.energy_fee')}</div>
                    <div className="value ellipsis">
                      {BigNumber(rentEnergyFee).eq(0) ? 0 : formatNumber(rentEnergyFee, Config.trxDecimal)} TRX
                    </div>
                  </div>

                  <div className="flexB flexA rent-fee-detail-item">
                    <div className="name">{intl.get('energy_rental.security_deposit')}</div>
                    <div className="value ellipsis">
                      {BigNumber(rentSecurityDeposit).eq(0)
                        ? intl.get('renewal.no_extra_sd')
                        : formatNumber(rentSecurityDeposit, Config.trxDecimal, { miniText: '0.01' }) + ' TRX'}
                    </div>
                  </div>

                  <div className="flexB flexA rent-fee-detail-item">
                    <div className="name">{intl.get('energy_rental.liquidation_penalty')}</div>
                    <div className="value ellipsis">
                      {BigNumber(rentLiquidatePenalty).eq(0)
                        ? intl.get('renewal.no_extra_fines')
                        : formatNumber(rentLiquidatePenalty, Config.trxDecimal, { miniText: '0.01' }) + ' TRX'}
                    </div>
                  </div>

                  <div className="return-rule-tip">
                    <span className="return-rule-tip-text">{intl.get('new_rent.rent_tips1')}</span>
                    {/* <span
                      className="jl-links"
                      onClick={() => {
                        const element = document.getElementById('energy-data-container');
                        if (element) {
                          this.props.lend.setData({ poolDataTab: '2' });
                          element.scrollIntoView();
                        }
                      }}
                    >
                      {intl.get('new_rent.how_to_calculate')}
                    </span> */}
                    <a className="jl-links" href={Config.rentCalculateLink} target="rentCalculateLink">
                      {intl.get('renewal.how_to_calculate')}
                    </a>
                  </div>
                </div>
              );
            }}
            placement={mobile ? 'bottomLeft' : 'bottom'}
            arrowPointAtCenter
            overlayClassName="j-tooltip-dropdown prepaid"
          >
            <div className="flex tooltip-hover">
              <div className="row-value">{formatNumber(totalPrepayment, 2, { miniText: 0.01 })}</div>
              <div className="row-suffix">TRX</div>
            </div>
          </Tooltip>
        </div>
        <div className="info-row">
          <div className="row-title">
            {!mobile ? (
              <>
                {intl.get('energy_rental.form.prepayment_info.security_deposit_title')}

                <Tooltip
                  onMouseEnter={() => {
                    window.gtag('event', 'energyrent_pro_payment_hoverRefund', {
                      'event_category': 'energyrent',
                      'event_label': 'energyrent_pro_payment_hoverRefund'
                    });
                  }}
                  title={() => {
                    return (
                      <div>
                        {intl.get('energy_rental.form.prepayment_info.security_deposit_hint')}
                        <span className="four-pixel-placeholder" />
                        <a
                          href={getSecurityDepositDetailsUrl(lang)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => {
                            window.gtag('event', 'energyrent_pro_payment_hover_clickdetail', {
                              'event_category': 'energyrent',
                              'event_label': 'energyrent_pro_payment_hover_clickdetail'
                            });
                          }}
                          className="purple-link-btn hover"
                        >
                          {intl.get('energy_rental.form.prepayment_info.rules_detail')}
                        </a>
                      </div>
                    );
                  }}
                  placement="topLeft"
                  arrowPointAtCenter
                  overlayClassName="j-tooltip-dropdown energy-rental-tooltip refund-amount-tooltip"
                >
                  <div className="j-tooltip-icon"></div>
                </Tooltip>
              </>
            ) : (
              <>
                <TooltipText
                  onMouseEnter={() => {
                    window.gtag('event', 'energyrent_pro_payment_hoverRefund', {
                      'event_category': 'energyrent',
                      'event_label': 'energyrent_pro_payment_hoverRefund'
                    });
                  }}
                  title={() => {
                    return (
                      <div>
                        {intl.get('energy_rental.form.prepayment_info.security_deposit_hint')}
                        <span className="four-pixel-placeholder" />
                        <a
                          href={getSecurityDepositDetailsUrl(lang)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => {
                            window.gtag('event', 'energyrent_pro_payment_hover_clickdetail', {
                              'event_category': 'energyrent',
                              'event_label': 'energyrent_pro_payment_hover_clickdetail'
                            });
                          }}
                          className="purple-link-btn hover"
                        >
                          {intl.get('energy_rental.form.prepayment_info.rules_detail')}
                        </a>
                      </div>
                    );
                  }}
                  placement="topLeft"
                  overlayClassName="j-tooltip-dropdown energy-rental-tooltip"
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
          <div className="row-value">{formatNumber(securityDeposit, 2, { miniText: 0.01 })}</div>
          <div className="row-suffix">TRX</div>
        </div>
      </div>
    );
  };

  confirmAddOrder = async (newOrderPrepayment = this.props.energyRental.newOrderPrepayment) => {
    if (this.props.network.isRightChain === 0) {
      this.props.network.changeChain();
      return;
    }

    const { otherAddressVerifiedValue, showBalanceError } = this.state;

    let { trxBalance, newOrderSafeValue } = this.props.energyRental;

    trxBalance = BigNumber(trxBalance).div(Config.trxPrecision);

    // Check balance error and safe max error
    // If yes, then show error now
    const isBalaceInsufficient = BigNumber(newOrderPrepayment).gt(trxBalance);
    const isBelowSafeMax = BigNumber(newOrderPrepayment).plus(newOrderSafeValue).gt(trxBalance);

    if (!showBalanceError && (isBalaceInsufficient || isBelowSafeMax)) {
      this.setState({
        showBalanceError: true
      });
    } else if (!isBalaceInsufficient) {
      this.props.system.clearRejectError();

      if (this.props.energyRental.rentPaused) {
        return this.props.energyRental.setData({ rentPausedVisible: true });
      }

      const receiver = otherAddressVerifiedValue ? otherAddressVerifiedValue : window.defaultAccount;

      this.setState({ isCheckingIfOrderExist: true });

      const balance = await this.props.energyRental.getRenterReceiverRentBalance(receiver);
      if (BigNumber(balance).gt(0)) {
        this.props.energyRental.setData({
          addOrderModalVisible: true,
          isAddOrderModalApprovingTrans: false,
          addOrderModalIsRenew: true,
          addOrderModalStep: 1,
          renewOrderShouldUseSavedInfo: false,
          renewOrderExistingRemainingSeconds: '--'
        });

        this.props.energyRental.getExistingRentalOrderInfo(receiver);

        this.resetFormInput();
      } else if (BigNumber(balance).eq(0)) {
        this.props.energyRental.setData({
          addOrderModalVisible: true,
          isAddOrderModalApprovingTrans: false,
          addOrderModalIsRenew: false,
          addOrderModalStep: 3,
          submittedNewOrderReceiver: receiver,
          submittedNewOrderEnergyAmount: this.props.energyRental.newOrderEnergyAmount,
          submittedNewOrderTrxAmount: this.props.energyRental.newOrderTrxAmount,
          submittedNewOrderDuration: this.props.energyRental.newOrderDuration,
          submittedNewOrderPrepayment: this.props.energyRental.newOrderPrepayment
        });
      }

      this.setState({ isCheckingIfOrderExist: false });
    }
  };

  render() {
    const { showSectionHeader, currentRentalPrice, isUtilizationAboveKink } = this.props;
    const {
      showBalanceError,
      energyAmountValue,
      durationValueInSeconds,
      energyAmountInputError,
      durationInputError,
      otherAddressInputError,
      isOtherAddressInputActive,
      otherAddressVerifiedValue,
      isCheckingIfOrderExist
    } = this.state;

    const { isConnected } = this.props.network;
    let {
      trxBalance,
      newOrderEnergyAmount,
      newOrderDuration,
      newOrderPrepayment,
      newOrderSecurityDeposit,
      newOrderTrxSavedVsBurning,
      newOrderTrxSavedVsStaking,
      newOrderSafeValue
    } = this.props.energyRental;
    trxBalance = BigNumber(trxBalance).div(Config.trxPrecision);

    const haveAnyInputError = energyAmountInputError || durationInputError || otherAddressInputError;

    const isNewOrderInfoUpdated =
      BigNumber(energyAmountValue).eq(BigNumber(newOrderEnergyAmount)) &&
      BigNumber(durationValueInSeconds).eq(BigNumber(newOrderDuration));

    const isBothValueValid =
      !BigNumber(energyAmountValue).isNaN() &&
      BigNumber(energyAmountValue).gt(0) &&
      !BigNumber(durationValueInSeconds).isNaN() &&
      BigNumber(durationValueInSeconds).gt(0);

    const isBalaceInsufficient = BigNumber(newOrderPrepayment).gt(trxBalance);
    const showHighRentalPriceHint = isUtilizationAboveKink;
    const showSafeMaxHint =
      showBalanceError && !haveAnyInputError && BigNumber(newOrderPrepayment).plus(newOrderSafeValue).gt(trxBalance);
    const showShortRentalHint = !haveAnyInputError && shouldShowShortRentalHint(durationValueInSeconds);

    return (
      <>
        <div className="rental-form section-content-container">
          {showSectionHeader && (
            <div className="section-header">
              <div className="title">{intl.get('energy_rental.form.add_order_title')}</div>
            </div>
          )}

          <div className="form-content">
            {this.renderEnergyAmountInput()}
            {this.renderDurationInput()}

            {this.renderOtherAddressInput()}

            {this.renderPrepaidInfoBox(newOrderPrepayment, newOrderSecurityDeposit)}

            <div className="rent-action-button-container">
              {showHighRentalPriceHint && (
                <div className="high-rental-price-hint">
                  {intl.get('energy_rental.form.hints.hign_rental_price', {
                    value: formatNumber(currentRentalPrice, 0, { miniText: '0.001' })
                  })}
                </div>
              )}
              {showSafeMaxHint && (
                <div className="safe-max-hint">
                  {intl.get('energy_rental.form.hints.safe_max_hints', { value: formatNumber(newOrderSafeValue, 2) })}
                </div>
              )}

              {isConnected ? (
                isBalaceInsufficient && showBalanceError ? (
                  <button className="j-large-btn j-supply rent-action-button" disabled={true}>
                    {intl.get('energy_rental.form.action_btn.insufficient_trx')}
                  </button>
                ) : (
                  <button
                    className="j-large-btn j-supply rent-action-button"
                    disabled={
                      !isNewOrderInfoUpdated ||
                      !isBothValueValid ||
                      isCheckingIfOrderExist ||
                      haveAnyInputError ||
                      (isOtherAddressInputActive && otherAddressVerifiedValue === '')
                    }
                    onClick={() => {
                      this.confirmAddOrder(newOrderPrepayment);

                      if (this.props.energyRental.isNeedShowDealTip()) {
                        this.props.energyRental.setData({ dealNoteShow: true });
                      }

                      window.gtag('event', 'energyrent_pro_click_rentNow', {
                        'event_category': 'energyrent',
                        'event_label': !isOtherAddressInputActive ? 'currentAddr' : 'otherAddr'
                      });
                    }}
                  >
                    {(!isNewOrderInfoUpdated || isCheckingIfOrderExist) &&
                    !(haveAnyInputError || (isOtherAddressInputActive && otherAddressVerifiedValue === '')) ? (
                      <span className="siging-icon"></span>
                    ) : (
                      intl.get('energy_rental.form.action_btn.rent')
                    )}
                  </button>
                )
              ) : (
                <button
                  className="j-large-btn j-supply rent-action-button"
                  onClick={() => this.props.network.connectWalletV2()}
                >
                  {intl.get('energy_rental.form.action_btn.connect_wallet')}
                </button>
              )}
            </div>
            {/* delete this tip for now */}
            {/* <div className="trx-saved-hint">
              <div className="hint-content">
                {intl.getHTML('energy_rental.form.hints.trx_saved', {
                  savedValue: formatNumber(newOrderTrxSavedVsBurning, 2, { showNegative: true, miniText: '0.01' }),
                  stakingValue: formatNumber(newOrderTrxSavedVsStaking, 2, { miniText: '0.01' })
                })}
              </div>
            </div> */}

            {/* <div className="rent-feedback">
            <em></em>
            <a className="j-tooltip-link hover" href="https://forms.gle/d1TYmXQPs3DAoFng8" target="feedback">
              {intl.get('liquidate.feedback')}
            </a>
          </div> */}
          </div>

          {this.props.energyRental.addOrderModalVisible && (
            <AddOrderModal newOrderSubmittedCallback={this.resetFormInput} />
          )}
          {this.props.energyRental.endOrderModalVisible && <EndOrderModal successCallback={() => {}} />}
        </div>
        {/* <DealNoteModal callback={this.confirmAddOrder} /> */}
      </>
    );
  }
}
export default RentalForm;
