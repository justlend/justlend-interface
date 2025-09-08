import React from 'react';

import { inject, observer } from 'mobx-react';
import intl from 'react-intl-universal';
import isMobile from 'ismobilejs';
import { Modal, Input, Tooltip } from 'antd';
import classnames from 'classnames';
import { saveSignInfoToLocalStorage } from '../../utils/helper';

import '../../../../assets/css/settings-modal.scss';

@inject('lend')
@inject('system')
@inject('ledger')
@inject('connect')
@inject('network')
@inject('settings')
@observer
class BindEmailModal extends React.Component {
  constructor() {
    super();

    this.state = {
      mobile: isMobile(window.navigator).any,

      isSigning: false,
      signError: '',

      emailInputValue: '',
      shouldShowEmailInputError: false,
      emailInputError: '',

      otpInputValue: '',
      shouldShowOtpInputError: false,
      otpInputError: '',

      isSendingOtp: false,
      isOtpSent: false,
      otpCountdownSecs: 0,

      isBindingEmail: false,
      bindEmailError: ''
    };
  }

  close = () => {
    const { bindEmailModalIsChangingEmail } = this.props.settings;
    if (bindEmailModalIsChangingEmail) {
      window.gtag('event', 'portfolio_setting_changeEmailpop_clickClose', {
        'event_category': 'portfolio',
        'event_label': 'portfolio_setting_changeEmailpop_clickClose'
      });
    } else {
      window.gtag('event', 'portfolio_setting_emailpop_clickClose', {
        'event_category': 'portfolio',
        'event_label': 'portfolio_setting_emailpop_clickClose'
      });
    }

    this.props.settings.setData({
      bindEmailModalVisible: false
    });
  };

  triggerSignAction = async () => {
    const { defaultAccount, isLedgerConnected, isWalletConnected } = this.props.network;
    const { isSigning } = this.state;

    if (!isSigning) {
      this.setState({
        isSigning: true,
        signError: ''
      });

      const signResult = isLedgerConnected
        ? await this.props.ledger.signMessage()
        : isWalletConnected
        ? await this.props.connect.signMessage()
        : await this.props.system.signMessage();

      if (signResult) {
        const code = await this.props.settings.setSettingsSignature(defaultAccount);

        if (code == 0 || code == 10) {
          saveSignInfoToLocalStorage(Date.now(), signResult, defaultAccount);

          if (this.props.settings.bindEmailModalVisible === true && this.props.settings.bindEmailModalStep === 2) {
            this.onClickVerify(4);
          }
        } else {
          saveSignInfoToLocalStorage('', '', '');
          this.setState({
            isSigning: false,
            signError: intl.get('settings.bind_email_modal.server_error')
          });

          if (this.props.settings.bindEmailModalVisible === true && this.props.settings.bindEmailModalStep === 2) {
            this.props.settings.setData({
              bindEmailModalStep: 5
            });
          }
        }
      } else {
        saveSignInfoToLocalStorage('', '', '');
        this.setState({
          isSigning: false,
          signError: intl.get('settings.bind_email_modal.wallet_rejected')
        });

        if (this.props.settings.bindEmailModalVisible === true && this.props.settings.bindEmailModalStep === 2) {
          this.props.settings.setData({
            bindEmailModalStep: 5
          });
        }
      }
    }
  };

  isEmailFormatValid = email => {
    // return /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/.test(email);
    return /^\s*\w+(?:\.{0,1}[\w-]+)*@[a-zA-Z0-9]+(?:[-.][a-zA-Z0-9]+)*\.[a-zA-Z]+\s*$/.test(email); // Align with backend
  };

  onChangeEmailInput = value => {
    const { bindedEmail } = this.props.settings;

    try {
      this.setState({
        emailInputValue: value
      });

      if (value === '') {
        this.setState({
          emailInputError: intl.get('settings.bind_email_modal.email_field.empty_error')
        });
      } else if (value.toUpperCase() == bindedEmail.toUpperCase()) {
        this.setState({
          emailInputError: intl.get('settings.bind_email_modal.email_field.same_email_error')
        });
      } else if (!this.isEmailFormatValid(value)) {
        this.setState({
          emailInputError: intl.get('settings.bind_email_modal.email_field.invalid_error')
        });
      } else {
        this.setState({
          emailInputError: ''
        });
      }
    } catch (e) {
      console.error(`onChangeEmailInput error: ${e}`);
    }
  };
  onChangeOtpInput = value => {
    try {
      this.setState({
        otpInputValue: value
      });

      if (value === '') {
        this.setState({
          otpInputError: intl.get('settings.bind_email_modal.otp_field.empty_error')
        });
      } else if (value.length !== 6) {
        this.setState({
          otpInputError: intl.get('settings.bind_email_modal.otp_field.invalid_error')
        });
      } else {
        this.setState({
          otpInputError: ''
        });
      }
    } catch (e) {
      console.error(`onChangeOtpInput error: ${e}`);
    }
  };

  onClickSendOtp = async actionType => {
    // actionType align with backend
    // 1 - otp for first time bind
    // 2 - otp for changing to new email
    // 3 - otp for verifying old email
    const { defaultAccount } = this.props.network;
    const { lang } = this.props.lend;
    const { bindedEmail, bindEmailModalIsChangingEmail } = this.props.settings;

    const { emailInputValue, emailInputError, isSendingOtp } = this.state;

    if (isSendingOtp || (actionType !== 3 && (emailInputValue.length === 0 || emailInputError !== ''))) {
      return;
    }

    this.setState({
      isSendingOtp: true,
      otpInputError: ''
    });

    if (bindEmailModalIsChangingEmail) {
      window.gtag('event', 'portfolio_setting_changeEmailpop_clickSend', {
        'event_category': 'portfolio',
        'event_label': 'portfolio_setting_changeEmailpop_clickSend'
      });
    } else {
      window.gtag('event', 'portfolio_setting_emailpop_clickSend', {
        'event_category': 'portfolio',
        'event_label': 'portfolio_setting_emailpop_clickSend'
      });
    }

    const code = await this.props.settings.getEmailOtp(
      defaultAccount,
      actionType === 3 ? bindedEmail : emailInputValue,
      actionType,
      lang
    );

    if (code == 0) {
      this.setState({
        isSendingOtp: false,
        isOtpSent: true,
        otpCountdownSecs: 60
      });

      this.countdownInterval = setInterval(async () => {
        const { otpCountdownSecs } = this.state;

        this.setState({ otpCountdownSecs: otpCountdownSecs - 1 });

        if (otpCountdownSecs - 1 <= 0) {
          clearInterval(this.countdownInterval);
        }
      }, 1000);
    } else {
      this.setState({
        isSendingOtp: false
      });

      // code 8 => no signature found
      // code 9 => signature expired
      // code 18 => reach otp limit in 24 hours
      if (code == 18) {
        this.setState({
          shouldShowOtpInputError: true,
          otpInputError: intl.get('settings.bind_email_modal.otp_field.otp_limit_reached_error')
        });
      } else if (code == 8 || code == 9) {
        this.props.settings.setData({
          bindEmailModalVisible: false,
          settingsSignatureModalVisible: true
        });
      } else {
        this.setState({
          shouldShowOtpInputError: true,
          otpInputError: intl.get('settings.bind_email_modal.server_error')
        });
      }
    }
  };

  onClickVerify = async actionType => {
    // actionType align with backend
    // 1 - first time bind
    // 2 - verify otp before changing email
    // 3 - change email with old email otp
    // 4 - change email with wallet sign
    const { defaultAccount } = this.props.network;
    const { bindedEmail, bindEmailModalStepSavedOtp } = this.props.settings;
    const { emailInputValue, emailInputError, otpInputValue, otpInputError, isBindingEmail } = this.state;

    if (
      (actionType !== 3 && (emailInputValue.length === 0 || emailInputError !== '')) ||
      (actionType !== 4 && (otpInputValue.length === 0 || otpInputError !== '')) ||
      isBindingEmail
    ) {
      return;
    }

    this.setState({
      isBindingEmail: true,
      bindEmailError: ''
    });

    const code = await this.props.settings.verifyEmailOtp(
      defaultAccount,
      actionType === 3 ? bindedEmail : emailInputValue,
      actionType === 4 ? bindEmailModalStepSavedOtp : otpInputValue,
      actionType
    );

    if (code == 0) {
      if (actionType === 2) {
        this.props.settings.setData({
          bindEmailModalStepSavedOtp: otpInputValue,
          bindEmailModalStep: 2
        });
        this.triggerSignAction();
      } else {
        this.props.settings.setData({
          bindedEmail: emailInputValue
        });
        this.props.settings.setData({
          bindEmailModalStep: 4
        });
      }

      clearInterval(this.countdownInterval);
      this.setState({
        isBindingEmail: false,
        isOtpSent: false,
        otpCountdownSecs: 0,
        otpInputValue: '',
        otpInputError: '',
        shouldShowOtpInputError: false
      });
    } else {
      this.setState({
        isBindingEmail: false
      });

      // code 8 => no signature found
      // code 9 => signature expired
      // code 16 => otp not match
      // code 17 => otp expired
      if (code == 16) {
        this.setState({
          bindEmailError: intl.get('settings.bind_email_modal.code_incorrect_error')
        });
      } else if (code == 17) {
        this.setState({
          bindEmailError: intl.get('settings.bind_email_modal.code_expire_error')
        });
      } else if (code == 8 || code == 9) {
        this.props.settings.setData({
          bindEmailModalVisible: false,
          settingsSignatureModalVisible: true
        });
      } else {
        this.setState({
          bindEmailError: intl.get('settings.bind_email_modal.server_error')
        });
      }
    }
  };

  onClickSignAgain = () => {
    this.setState({
      isSigning: false
    });

    this.props.settings.setData({
      bindEmailModalStep: 1
    });
  };

  render() {
    const {
      mobile,
      emailInputValue,
      shouldShowEmailInputError,
      emailInputError,
      otpInputValue,
      shouldShowOtpInputError,
      otpInputError,
      isSigning,
      signError,
      isOtpSent,
      otpCountdownSecs,
      isBindingEmail,
      bindEmailError
    } = this.state;
    const { theme } = this.props.lend;

    const { bindedEmail, bindEmailModalVisible, bindEmailModalStep, bindEmailModalIsChangingEmail } =
      this.props.settings;

    var modalTitle;

    if (bindEmailModalIsChangingEmail) {
      modalTitle = intl.get('settings.bind_email_modal.modal_title_change_email');
      window.gtag('event', 'portfolio_setting_changeEmailpop', {
        'event_category': 'portfolio',
        'event_label': 'portfolio_setting_changeEmailpop'
      });
    } else {
      modalTitle = intl.get('settings.bind_email_modal.modal_title_link_email');
      window.gtag('event', 'portfolio_setting_emailpop', {
        'event_category': 'portfolio',
        'event_label': 'portfolio_setting_emailpop'
      });
    }

    if (bindEmailModalStep === 2) {
      window.gtag('event', 'portfolio_setting_changeEmail_sign', {
        'event_category': 'portfolio',
        'event_label': 'portfolio_setting_changeEmail_sign'
      });
    }

    if (bindEmailModalStep === 3) {
      modalTitle = intl.get('settings.bind_email_modal.modal_title_verify_with_current_email');
    }
    if (bindEmailModalStep === 4) {
      modalTitle = intl.get('settings.bind_email_modal.modal_title_success');
      if (bindEmailModalIsChangingEmail) {
        window.gtag('event', 'portfolio_setting_changeEmail_successd', {
          'event_category': 'portfolio',
          'event_label': 'portfolio_setting_changeEmail_successd'
        });
      } else {
        window.gtag('event', 'portfolio_setting_emailpop_successd', {
          'event_category': 'portfolio',
          'event_label': 'portfolio_setting_emailpop_successd'
        });
      }
    }

    if (bindEmailModalStep === 5) {
      window.gtag('event', 'portfolio_setting_changeEmail_failed', {
        'event_category': 'portfolio',
        'event_label': 'portfolio_setting_changeEmail_failed'
      });
    }

    return (
      <Modal
        title={modalTitle}
        visible={bindEmailModalVisible}
        maskClosable={false}
        closable={bindEmailModalStep !== 4}
        destroyOnClose={true}
        icon={null}
        onCancel={() => this.close()}
        footer={null}
        width={mobile ? 'calc(100% - 40px)' : 400}
        centered
        className={`j-modal header-border ${theme} settings-modal`}
        getContainer={() => document.querySelector('.j-wrapper')}
      >
        <div className="settings-modal-content bind-email-modal-content">
          {bindEmailModalStep === 1 && (
            <>
              <div className="input-section">
                <div className="field-title">
                  <div className="title-text">
                    {bindEmailModalIsChangingEmail
                      ? intl.get('settings.bind_email_modal.email_field.title_change_email')
                      : intl.get('settings.bind_email_modal.email_field.title_link_email')}
                  </div>
                </div>

                <Input.Group
                  compact
                  className={classnames('email-input-group', {
                    'j-error-input-group': shouldShowEmailInputError && emailInputError
                  })}
                >
                  <Input
                    className={classnames('j-input', 'email-input')}
                    placeholder={intl.get('settings.bind_email_modal.email_field.placeholder')}
                    value={emailInputValue}
                    onChange={event => this.onChangeEmailInput(event.target.value)}
                    onBlur={event => this.setState({ shouldShowEmailInputError: true })}
                    allowClear
                    addonAfter={<></>}
                  />

                  {shouldShowEmailInputError && emailInputError && (
                    <div className="j-error-tip">
                      <span className="j-error-img"></span>
                      <div className="j-safe-text">{emailInputError}</div>
                    </div>
                  )}
                </Input.Group>
              </div>

              <div className="input-section">
                <div className="field-title">
                  <div className="title-text">{intl.get('settings.bind_email_modal.otp_field.title')}</div>
                </div>

                <Input.Group
                  compact
                  className={classnames('otp-input-group', {
                    'j-error-input-group': shouldShowOtpInputError && otpInputError && isOtpSent
                  })}
                >
                  <Input
                    className={classnames('j-input', 'otp-input')}
                    placeholder={intl.get('settings.bind_email_modal.otp_field.placeholder')}
                    value={otpInputValue}
                    onChange={event => this.onChangeOtpInput(event.target.value)}
                    onBlur={event => this.setState({ shouldShowOtpInputError: true })}
                    allowClear
                    addonAfter={
                      <div className="add-on-after-wrapper">
                        <div className="send-otp-btn-wrapper">
                          {otpCountdownSecs === 0 && (
                            <div
                              className={classnames('send-otp-btn', {
                                'enabled': emailInputValue.length > 0 && emailInputError === ''
                              })}
                              onClick={() => {
                                this.onClickSendOtp(bindedEmail.length > 0 ? 2 : 1);
                              }}
                            >
                              {intl.get('settings.bind_email_modal.otp_field.send_btn')}
                            </div>
                          )}
                          {otpCountdownSecs > 0 && (
                            <Tooltip
                              title={intl.get('settings.bind_email_modal.otp_field.countdown_hint')}
                              placement="topRight"
                              arrowPointAtCenter
                              overlayClassName="j-tooltip-dropdown bind-email-otp-countdown-tooltip"
                            >
                              <div className="seconds-countdown">
                                {otpCountdownSecs}
                                {'s'}
                              </div>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    }
                    maxLength={6}
                    disabled={!isOtpSent}
                  />

                  {shouldShowOtpInputError && otpInputError && (
                    <div className="j-error-tip">
                      <span className="j-error-img"></span>
                      <div className="j-safe-text">{otpInputError}</div>
                    </div>
                  )}
                </Input.Group>
              </div>

              <div className={classnames('otp-sent-hint', { 'visible': isOtpSent })}>
                {intl.get('settings.bind_email_modal.otp_sent_hint')}
              </div>

              <button
                className={classnames('action-btn', 'link-btn', { 'is-signing': isBindingEmail })}
                disabled={
                  emailInputValue.length === 0 ||
                  emailInputError !== '' ||
                  otpInputValue.length === 0 ||
                  otpInputError !== ''
                }
                onClick={() => {
                  this.onClickVerify(bindedEmail.length > 0 ? 2 : 1);
                }}
              >
                {intl.get('settings.bind_email_modal.link_btn')}
                {isBindingEmail && <span className="siging-icon"></span>}
              </button>

              {bindEmailError && (
                <div className="j-error-tip wallet-reject">
                  <span className="j-error-img"></span>
                  <div>{bindEmailError}</div>
                </div>
              )}
            </>
          )}

          {bindEmailModalStep === 2 && (
            <>
              <div className="content-icon loading-icon"></div>
              <div className="content-title">{intl.get('settings.bind_email_modal.verify_identity_title')}</div>
              <div className="content-subtitle">
                {intl.get('settings.bind_email_modal.verify_identity_description')}
              </div>

              <button
                className="other-ways-btn hover"
                disabled={isBindingEmail}
                onClick={() => {
                  window.gtag('event', 'portfolio_setting_changeEmail_clickOthers', {
                    'event_category': 'portfolio',
                    'event_label': 'portfolio_setting_changeEmail_clickOthers'
                  });
                  this.props.settings.setData({
                    bindEmailModalStep: 3
                  });
                }}
              >
                {intl.get('settings.bind_email_modal.other_ways_btn')}
              </button>
            </>
          )}

          {bindEmailModalStep === 3 && (
            <>
              <div className="current-email-hint">
                {intl.get('settings.bind_email_modal.current_email_hint', { 'mail': bindedEmail })}
              </div>

              <div className="input-section">
                <div className="field-title">
                  <div className="title-text">{intl.get('settings.bind_email_modal.otp_field.title')}</div>
                </div>

                <Input.Group
                  compact
                  className={classnames('otp-input-group', {
                    'j-error-input-group': shouldShowOtpInputError && otpInputError && isOtpSent
                  })}
                >
                  <Input
                    className={classnames('j-input', 'otp-input')}
                    placeholder={intl.get('settings.bind_email_modal.otp_field.placeholder')}
                    value={otpInputValue}
                    onChange={event => this.onChangeOtpInput(event.target.value)}
                    onBlur={event => this.setState({ shouldShowOtpInputError: true })}
                    allowClear
                    addonAfter={
                      <div className="add-on-after-wrapper">
                        <div className="send-otp-btn-wrapper">
                          {otpCountdownSecs === 0 && (
                            <div
                              className={classnames('send-otp-btn', 'enabled')}
                              onClick={() => {
                                this.onClickSendOtp(3);
                              }}
                            >
                              {intl.get('settings.bind_email_modal.otp_field.send_btn')}
                            </div>
                          )}
                          {otpCountdownSecs > 0 && (
                            <Tooltip
                              title={intl.get('settings.bind_email_modal.otp_field.countdown_hint')}
                              placement="topRight"
                              arrowPointAtCenter
                              overlayClassName="j-tooltip-dropdown bind-email-otp-countdown-tooltip"
                            >
                              <div className="seconds-countdown">
                                {otpCountdownSecs}
                                {'s'}
                              </div>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    }
                    maxLength={6}
                    disabled={!isOtpSent}
                  />

                  {shouldShowOtpInputError && otpInputError && (
                    <div className="j-error-tip">
                      <span className="j-error-img"></span>
                      <div className="j-safe-text">{otpInputError}</div>
                    </div>
                  )}
                </Input.Group>
              </div>

              <div className={classnames('otp-sent-hint', 'extra-top-margin', { 'visible': isOtpSent })}>
                {intl.get('settings.bind_email_modal.otp_sent_hint')}
              </div>

              <button
                className={classnames('action-btn', 'link-btn', { 'is-signing': isBindingEmail })}
                disabled={otpInputValue.length === 0 || otpInputError !== ''}
                onClick={() => {
                  this.onClickVerify(3);
                }}
              >
                {intl.get('settings.bind_email_modal.link_btn')}
                {isBindingEmail && <span className="siging-icon"></span>}
              </button>

              {bindEmailError && (
                <div className="j-error-tip wallet-reject">
                  <span className="j-error-img"></span>
                  <div>{bindEmailError}</div>
                </div>
              )}
            </>
          )}

          {bindEmailModalStep === 4 && (
            <>
              <div className="content-icon succeed-icon"></div>
              <div className="content-title">{intl.get('settings.bind_email_modal.confirm_msg')}</div>

              <button
                className="action-btn sign-btn"
                onClick={() => {
                  this.close();
                }}
              >
                {intl.get('settings.bind_email_modal.close_btn')}
              </button>
            </>
          )}

          {bindEmailModalStep === 5 && (
            <>
              <div className="content-icon failed-icon"></div>
              <div className="content-title">{intl.get('settings.bind_email_modal.failed_msg')}</div>
              <div className="content-subtitle">
                {intl.get('settings.bind_email_modal.verify_identity_description')}
              </div>

              <button
                className="other-ways-btn zero-bottom-margin hover"
                onClick={() => {
                  this.props.settings.setData({
                    bindEmailModalStep: 3
                  });
                }}
              >
                {intl.get('settings.bind_email_modal.other_ways_btn')}
              </button>

              <button
                className="action-btn sign-btn"
                onClick={() => {
                  window.gtag('event', 'portfolio_setting_riskAlert_signFailed_clickSign', {
                    'event_category': 'portfolio',
                    'event_label': 'portfolio_setting_riskAlert_signFailed_clickSign'
                  });
                  this.setState({
                    signError: ''
                  });
                  this.props.settings.setData({
                    bindEmailModalStep: 2
                  });
                  this.triggerSignAction();
                }}
              >
                {intl.get('settings.bind_email_modal.request_again_btn')}
              </button>

              {signError && (
                <div className="j-error-tip wallet-reject">
                  <span className="j-error-img"></span>
                  <div>{signError}</div>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>
    );
  }
}

export default BindEmailModal;
