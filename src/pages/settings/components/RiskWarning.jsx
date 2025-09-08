import React from 'react';
import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';
import isMobile from 'ismobilejs';
import classnames from 'classnames';

import { Modal, Tooltip } from 'antd';

import { shortenEmailAddress } from '../../../utils/helper';
import {
  getFaqUrlNotReceivingEmail,
  getFaqUrlWhatIsLiquidation,
  getFaqUrlHowToAvoidRentalLiquidation,
  getFaqUrlHowToAvoidCDPLiquidation
} from '../utils/config';
import { isEmailValid, getSignInfoFromLocalStorage } from '../utils/helper';

import ToggleSwitch from '../../../components/Widget/ToggleSwitch';
import config from '../../../config';
const { feedbackUrl } = config;
@inject('settings')
@inject('network')
@inject('lend')
@observer
class RiskWarning extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      mobile: isMobile(window.navigator).any,

      isUpdatingSnbAlertState: false,
      isUpdatingRentalAlertState: false,
      isUpdatingCdpAlertState: false,

      showSnbRules: false,
      showRentalRules: false,
      showCdpRules: false
    };
  }

  closeRulesDetailModal = () => {
    this.setState({
      showSnbRules: false,
      showRentalRules: false,
      showCdpRules: false
    });
  };

  openBindEmailModal = () => {
    const { bindedEmail } = this.props.settings;

    this.props.settings.setData({
      bindEmailModalVisible: true,
      bindEmailModalIsChangingEmail: isEmailValid(bindedEmail),
      bindEmailModalStep: 1
    });
  };

  openSettingsSignatureModal = () => {
    this.props.settings.setData({
      settingsSignatureModalVisible: true
    });
  };

  checkIfEmailValidOnClickingToggle = () => {
    const { bindedEmail } = this.props.settings;

    const isBindedEmailValid = isEmailValid(bindedEmail);

    if (isBindedEmailValid) {
      return true;
    } else {
      return false;
    }
  };

  checkIfLastSignIsStillValid = async () => {
    const { defaultAccount } = this.props.network;

    const lastSignInfo = await getSignInfoFromLocalStorage();

    return (
      lastSignInfo !== undefined &&
      lastSignInfo !== null &&
      lastSignInfo.signTimestamp !== null &&
      lastSignInfo.addr === defaultAccount &&
      Date.now() - lastSignInfo.signTimestamp < 60 * 60 * 1000
    );
  };

  onClickSnbAlertToggle = async () => {
    if (await this.checkIfEmailValidOnClickingToggle()) {
      if (await this.checkIfLastSignIsStillValid()) {
        this.switchSnbAlert();
      } else {
        this.openSettingsSignatureModal();
      }
    } else {
      this.openBindEmailModal();
    }
  };
  onClickRentalAlertToggle = async () => {
    if (await this.checkIfEmailValidOnClickingToggle()) {
      if (await this.checkIfLastSignIsStillValid()) {
        this.switchRentalAlert();
      } else {
        this.openSettingsSignatureModal();
      }
    } else {
      this.openBindEmailModal();
    }
  };
  onClickCdpAlertToggle = async () => {
    if (await this.checkIfEmailValidOnClickingToggle()) {
      if (await this.checkIfLastSignIsStillValid()) {
        this.switchCdpAlert();
      } else {
        this.openSettingsSignatureModal();
      }
    } else {
      this.openBindEmailModal();
    }
  };

  switchSnbAlert = async () => {
    const { isUpdatingSnbAlertState } = this.state;
    const { defaultAccount } = this.props.network;
    const { snbRiskAlertOn } = this.props.settings;

    const finalSnbAlert = isUpdatingSnbAlertState ? !snbRiskAlertOn : snbRiskAlertOn;
    if (finalSnbAlert) {
      window.gtag('event', 'portfolio_setting_riskAlert_clickSbmClose', {
        'event_category': 'portfolio',
        'event_label': 'portfolio_setting_riskAlert_clickSbmClose'
      });
    } else {
      window.gtag('event', 'portfolio_setting_riskAlert_clickSbmOpen', {
        'event_category': 'portfolio',
        'event_label': 'portfolio_setting_riskAlert_clickSbmOpen'
      });
    }

    if (isUpdatingSnbAlertState) {
      return;
    }

    if (!snbRiskAlertOn && window.localStorage.getItem('snbAlert') === null) {
      window.localStorage.setItem('snbAlert', true);
      this.setState({
        isUpdatingSnbAlertState: true,
        showSnbRules: true,
        showRentalRules: false,
        showCdpRules: false
      });
    } else {
      this.setState({
        isUpdatingSnbAlertState: true
      });
    }

    const code = await this.props.settings.updateNotiSettings(defaultAccount, 1, !snbRiskAlertOn);

    if (code === 0) {
      if (!snbRiskAlertOn) {
        this.props.showSuccessPopup();
      }
    } else {
      if (code === 8 || code === 9) {
        this.openSettingsSignatureModal();
      } else {
        window.gtag('event', 'portfolio_setting_riskAlert_signFailed', {
          'event_category': 'portfolio',
          'event_label': 'portfolio_setting_riskAlert_signFailed'
        });
      }
    }

    this.setState({
      isUpdatingSnbAlertState: false
    });
  };
  switchRentalAlert = async () => {
    const { isUpdatingRentalAlertState } = this.state;
    const { defaultAccount } = this.props.network;
    const { rentalRiskAlertOn } = this.props.settings;

    if (isUpdatingRentalAlertState) {
      return;
    }

    const finalRentalAlert = isUpdatingRentalAlertState ? !rentalRiskAlertOn : rentalRiskAlertOn;
    if (finalRentalAlert) {
      window.gtag('event', 'portfolio_setting_riskAlert_clickErClose', {
        'event_category': 'portfolio',
        'event_label': 'portfolio_setting_riskAlert_clickErClose'
      });
    } else {
      window.gtag('event', 'portfolio_setting_riskAlert_clickErOpen', {
        'event_category': 'portfolio',
        'event_label': 'portfolio_setting_riskAlert_clickErOpen'
      });
    }

    if (!rentalRiskAlertOn && window.localStorage.getItem('rentalAlert') === null) {
      window.localStorage.setItem('rentalAlert', true);
      this.setState({
        isUpdatingRentalAlertState: true,
        showSnbRules: false,
        showRentalRules: true,
        showCdpRules: false
      });
    } else {
      this.setState({
        isUpdatingRentalAlertState: true
      });
    }

    const code = await this.props.settings.updateNotiSettings(defaultAccount, 2, !rentalRiskAlertOn);

    if (code === 0) {
      if (!rentalRiskAlertOn) {
        this.props.showSuccessPopup();
      }
    } else {
      if (code === 8 || code === 9) {
        this.openSettingsSignatureModal();
      } else {
        window.gtag('event', 'portfolio_setting_riskAlert_signFailed', {
          'event_category': 'portfolio',
          'event_label': 'portfolio_setting_riskAlert_signFailed'
        });
      }
    }

    this.setState({
      isUpdatingRentalAlertState: false
    });
  };
  switchCdpAlert = async () => {
    const { isUpdatingCdpAlertState } = this.state;
    const { defaultAccount } = this.props.network;
    const { cdpRiskAlertOn, walletHaveCdpPosition } = this.props.settings;

    if (!walletHaveCdpPosition || isUpdatingCdpAlertState) {
      return;
    }

    const finalCdpAlert = isUpdatingCdpAlertState ? !cdpRiskAlertOn : cdpRiskAlertOn;
    if (finalCdpAlert) {
      window.gtag('event', 'portfolio_setting_riskAlert_clickErClose', {
        'event_category': 'portfolio',
        'event_label': 'portfolio_setting_riskAlert_clickErClose'
      });
    } else {
      window.gtag('event', 'portfolio_setting_riskAlert_clickCdpOpen', {
        'event_category': 'portfolio',
        'event_label': 'portfolio_setting_riskAlert_clickCdpOpen'
      });
    }

    if (!cdpRiskAlertOn && window.localStorage.getItem('cdpAlert') === null) {
      window.localStorage.setItem('cdpAlert', true);
      this.setState({
        isUpdatingCdpAlertState: true,
        showSnbRules: false,
        showRentalRules: false,
        showCdpRules: true
      });
    } else {
      this.setState({
        isUpdatingCdpAlertState: true
      });
    }

    const code = await this.props.settings.updateNotiSettings(defaultAccount, 3, !cdpRiskAlertOn);

    if (code === 0) {
      if (!cdpRiskAlertOn) {
        this.props.showSuccessPopup();
      }
    } else {
      if (code === 8 || code === 9) {
        this.openSettingsSignatureModal();
      } else {
        window.gtag('event', 'portfolio_setting_riskAlert_signFailed', {
          'event_category': 'portfolio',
          'event_label': 'portfolio_setting_riskAlert_signFailed'
        });
      }
    }

    this.setState({
      isUpdatingCdpAlertState: false
    });
  };

  onClickSnbRules = () => {
    this.setState({
      showSnbRules: true,
      showRentalRules: false,
      showCdpRules: false
    });
  };
  onClickRentalRules = () => {
    this.setState({
      showSnbRules: false,
      showRentalRules: true,
      showCdpRules: false
    });
  };
  onClickCdpRules = () => {
    this.setState({
      showSnbRules: false,
      showRentalRules: false,
      showCdpRules: true
    });
  };

  renderSnbRulesContent = () => {
    return (
      <div className="rules-detail-content-wrapper">
        <div className="detail-desc">{intl.get('settings.risk_warning.rules_detail.snb_rules.description')}</div>

        <div className="alert-rules-section">
          <div className="section-title">{intl.get('settings.risk_warning.rules_detail.section_title_rules')}</div>

          <div className="rules-list">
            <div className="rule">
              <span className="rule-icon risk-90"></span>
              <div className="rule-content">
                <div className="rule-title">
                  {intl.get('settings.risk_warning.rules_detail.snb_rules.rule_one_title')}
                </div>
                <div className="rule-desc">
                  {intl.get('settings.risk_warning.rules_detail.snb_rules.rule_one_desc')}
                </div>
              </div>
            </div>
            <div className="rule">
              <span className="rule-icon risk-95"></span>
              <div className="rule-content">
                <div className="rule-title">
                  {intl.get('settings.risk_warning.rules_detail.snb_rules.rule_two_title')}
                </div>
                <div className="rule-desc">
                  {intl.get('settings.risk_warning.rules_detail.snb_rules.rule_two_desc')}
                </div>
              </div>
            </div>
            <div className="rule">
              <span className="rule-icon alert-alarm"></span>
              <div className="rule-content">
                <div className="rule-title">
                  {intl.get('settings.risk_warning.rules_detail.snb_rules.rule_three_title')}
                </div>
                <div className="rule-desc">
                  {intl.get('settings.risk_warning.rules_detail.snb_rules.rule_three_desc')}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="faq-section">
          <div className="section-title">{intl.get('settings.risk_warning.rules_detail.section_title_faq')}</div>

          <div className="faq-list">
            <a className="faq" target="_blank" rel="noopener noreferrer" href={getFaqUrlNotReceivingEmail()}>
              {intl.get('settings.risk_warning.rules_detail.faq.not_receiving_email')}
            </a>
            <a className="faq" target="_blank" rel="noopener noreferrer" href={getFaqUrlWhatIsLiquidation()}>
              {intl.get('settings.risk_warning.rules_detail.faq.forced_liquidation')}
            </a>
          </div>
        </div>
      </div>
    );
  };
  renderRentalRulesContent = () => {
    return (
      <div className="rules-detail-content-wrapper">
        <div className="detail-desc">{intl.get('settings.risk_warning.rules_detail.rental_rules.description')}</div>

        <div className="alert-rules-section">
          <div className="section-title">{intl.get('settings.risk_warning.rules_detail.section_title_rules')}</div>

          <div className="rules-list">
            <div className="rule">
              <span className="rule-icon three-hour"></span>
              <div className="rule-content">
                <div className="rule-title">
                  {intl.get('settings.risk_warning.rules_detail.rental_rules.rule_one_title')}
                </div>
                <div className="rule-desc">
                  {intl.get('settings.risk_warning.rules_detail.rental_rules.rule_one_desc')}
                </div>
              </div>
            </div>
            <div className="rule">
              <span className="rule-icon price-surge"></span>
              <div className="rule-content">
                <div className="rule-title">
                  {intl.get('settings.risk_warning.rules_detail.rental_rules.rule_two_title')}
                </div>
                <div className="rule-desc">
                  {intl.get('settings.risk_warning.rules_detail.rental_rules.rule_two_desc')}
                </div>
              </div>
            </div>
            <div className="rule">
              <span className="rule-icon alert-alarm"></span>
              <div className="rule-content">
                <div className="rule-title">
                  {intl.get('settings.risk_warning.rules_detail.rental_rules.rule_three_title')}
                </div>
                <div className="rule-desc">
                  {intl.get('settings.risk_warning.rules_detail.rental_rules.rule_three_desc')}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="faq-section">
          <div className="section-title">{intl.get('settings.risk_warning.rules_detail.section_title_faq')}</div>

          <div className="faq-list">
            <a className="faq" target="_blank" rel="noopener noreferrer" href={getFaqUrlNotReceivingEmail()}>
              {intl.get('settings.risk_warning.rules_detail.faq.not_receiving_email')}
            </a>
            <a className="faq" target="_blank" rel="noopener noreferrer" href={getFaqUrlHowToAvoidRentalLiquidation()}>
              {intl.get('settings.risk_warning.rules_detail.faq.forced_liquidation')}
            </a>
            {/* <a className="faq" target="_blank" rel="noopener noreferrer" href={getFaqUrlHowToAvoidRentalLiquidation()}>
              {intl.get('settings.risk_warning.rules_detail.faq.prevent_liquidation')}
            </a> */}
          </div>
        </div>
      </div>
    );
  };
  renderCdpRulesContent = () => {
    return (
      <div className="rules-detail-content-wrapper">
        <div className="detail-desc">{intl.get('settings.risk_warning.rules_detail.cdp_rules.description')}</div>

        <div className="alert-rules-section">
          <div className="section-title">{intl.get('settings.risk_warning.rules_detail.section_title_rules')}</div>

          <div className="rules-list">
            <div className="rule">
              <span className="rule-icon ratio-below-200"></span>
              <div className="rule-content">
                <div className="rule-title">
                  {intl.get('settings.risk_warning.rules_detail.cdp_rules.rule_one_title')}
                </div>
                <div className="rule-desc">
                  {intl.get('settings.risk_warning.rules_detail.cdp_rules.rule_one_desc')}
                </div>
              </div>
            </div>
            <div className="rule">
              <span className="rule-icon alert-alarm"></span>
              <div className="rule-content">
                <div className="rule-title">
                  {intl.get('settings.risk_warning.rules_detail.cdp_rules.rule_two_title')}
                </div>
                <div className="rule-desc">
                  {intl.get('settings.risk_warning.rules_detail.cdp_rules.rule_two_desc')}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="faq-section">
          <div className="section-title">{intl.get('settings.risk_warning.rules_detail.section_title_faq')}</div>

          <div className="faq-list">
            <a className="faq" target="_blank" rel="noopener noreferrer" href={getFaqUrlNotReceivingEmail()}>
              {intl.get('settings.risk_warning.rules_detail.faq.not_receiving_email')}
            </a>
            {/* <a className="faq" target="_blank" rel="noopener noreferrer" href={getFaqUrlWhatIsLiquidation()}>
              {intl.get('settings.risk_warning.rules_detail.faq.forced_liquidation')}
            </a> */}
            <a className="faq" target="_blank" rel="noopener noreferrer" href={getFaqUrlHowToAvoidCDPLiquidation()}>
              {intl.get('settings.risk_warning.rules_detail.faq.prevent_liquidation')}
            </a>
          </div>
        </div>
      </div>
    );
  };

  render() {
    const {
      mobile,
      isUpdatingSnbAlertState,
      isUpdatingRentalAlertState,
      isUpdatingCdpAlertState,
      showSnbRules,
      showRentalRules,
      showCdpRules
    } = this.state;
    const { bindedEmail, snbRiskAlertOn, rentalRiskAlertOn, cdpRiskAlertOn, walletHaveCdpPosition } =
      this.props.settings;
    const { theme } = this.props.lend;

    const finalSnbAlert = isUpdatingSnbAlertState ? !snbRiskAlertOn : snbRiskAlertOn;
    const finalRentalAlert = isUpdatingRentalAlertState ? !rentalRiskAlertOn : rentalRiskAlertOn;
    const finalCdpAlert = isUpdatingCdpAlertState ? !cdpRiskAlertOn : cdpRiskAlertOn;

    const haveActiveAlertOn = finalSnbAlert || finalRentalAlert || (walletHaveCdpPosition && finalCdpAlert);
    const allAlertOn = finalSnbAlert && finalRentalAlert && (!walletHaveCdpPosition || finalCdpAlert);

    const isBindedEmailValid = isEmailValid(bindedEmail);
    const isWhite = theme === 'white';

    return (
      <div className="settings-section">
        <div className="settings-main-content">
          {mobile ? (
            <div className="settings-section-title">
              <div className="title-text">{intl.get('settings.risk_warning.title')}</div>

              <div className="link-email-hint">
                <div className="hint-message">
                  {isBindedEmailValid
                    ? intl.get('settings.risk_warning.linked_hint')
                    : intl.get('settings.risk_warning.unlinked_hint')}
                  {isBindedEmailValid && <div className="hint-email-addr">{shortenEmailAddress(bindedEmail, 2)}</div>}
                </div>
                <button
                  className="hint-link hover"
                  onClick={() => {
                    this.openBindEmailModal();
                    window.gtag('event', 'portfolio_setting_riskAlert_clickNewEmail', {
                      'event_category': 'portfolio',
                      'event_label': 'portfolio_setting_riskAlert_clickNewEmail'
                    });
                  }}
                >
                  {isBindedEmailValid
                    ? intl.get('settings.risk_warning.change_email_btn')
                    : intl.get('settings.risk_warning.link_btn')}
                </button>
              </div>
            </div>
          ) : (
            <div className="settings-section-title">
              <div className="flex-sp">
                <div className="title-text">{intl.get('settings.risk_warning.title')}</div>
                <div className={'settings-feedback ' + (isWhite ? 'white' : '')}>
                  <div className="m-flex-a">
                    <svg width="18" height="19" viewBox="0 0 18 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M13.5999 9.93485C13.4898 9.82285 13.3383 9.75963 13.1814 9.75963C13.0244 9.75963 12.8729 9.82285 12.7628 9.93485L9.0287 13.6724C8.91686 13.7844 8.85552 13.9344 8.85372 14.0933V15.6198C8.85372 15.9486 9.1189 16.2141 9.44721 16.2141H10.9715C11.1285 16.2141 11.28 16.1509 11.3919 16.0389L15.1242 12.3013C15.3551 12.0701 15.3551 11.6926 15.1242 11.4613L13.5999 9.93485ZM15.1711 10.6936L14.3702 9.8915C14.0166 9.53743 14.0166 8.96297 14.3702 8.60891C14.7237 8.25484 15.2974 8.25484 15.6509 8.60891L16.4519 9.41098C16.8055 9.76505 16.8055 10.3395 16.4519 10.6936C16.0983 11.0494 15.5247 11.0494 15.1711 10.6936ZM2.57422 4.81532V13.4683C2.57422 14.9839 3.80089 16.2123 5.3144 16.2123H6.44546V14.3697C6.44546 14.1439 6.53566 13.9272 6.69441 13.7682L13.2589 7.19083C13.5223 6.9036 13.8687 6.70669 14.2475 6.62721C14.4134 6.59289 14.5848 6.59289 14.7508 6.62721C15.0755 6.52063 15.2956 6.21895 15.2974 5.87752V4.81532C15.2974 3.29969 14.0707 2.07129 12.5572 2.07129H5.3144C3.80089 2.06948 2.57422 3.29788 2.57422 4.81532ZM4.93188 5.01769C4.93188 4.69224 5.19572 4.42841 5.52117 4.42841H12.5926C12.918 4.42841 13.1819 4.69224 13.1819 5.01769C13.1819 5.34314 12.9181 5.60698 12.5926 5.60698H5.52117C5.19572 5.60698 4.93188 5.34314 4.93188 5.01769ZM5.52117 7.96436C5.19572 7.96436 4.93188 8.22819 4.93188 8.55364C4.93188 8.87909 5.19572 9.14293 5.52117 9.14293H7.87831C8.20377 9.14293 8.4676 8.87909 8.4676 8.55364C8.4676 8.22819 8.20377 7.96436 7.87831 7.96436H5.52117Z"
                        fill={isWhite ? '#737480' : '#B3B4B7'}
                      />
                    </svg>
                    <button className="hint-link hover" onClick={() => window.open(feedbackUrl, 'feedback')}>
                      {intl.get('v2.feedback')}
                      <svg
                        className="arrow"
                        width="5"
                        height="9"
                        viewBox="0 0 5 9"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M1 7.5L4 4.5L1 1.5" strokeLinecap="square" stroke={isWhite ? '#4C54FF' : '#9195FB'} />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-sp">
                <div className="link-email-hint">
                  <div className="hint-message">
                    {isBindedEmailValid
                      ? intl.get('settings.risk_warning.linked_hint')
                      : intl.get('settings.risk_warning.unlinked_hint')}
                    {isBindedEmailValid && <div className="hint-email-addr">{shortenEmailAddress(bindedEmail, 2)}</div>}
                  </div>
                  <button
                    className="hint-link hover"
                    onClick={() => {
                      this.openBindEmailModal();
                      window.gtag('event', 'portfolio_setting_riskAlert_clickNewEmail', {
                        'event_category': 'portfolio',
                        'event_label': 'portfolio_setting_riskAlert_clickNewEmail'
                      });
                    }}
                  >
                    {isBindedEmailValid
                      ? intl.get('settings.risk_warning.change_email_btn')
                      : intl.get('settings.risk_warning.link_btn')}
                  </button>
                </div>
                <div className={'m-flex-a ' + (mobile ? 'mt-10' : '')}>
                  <svg
                    className="tip"
                    width="14"
                    height="15"
                    viewBox="0 0 14 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M4.46552 11.2573H10.1235V9.72563C10.7455 9.14191 11.1801 8.38001 11.3702 7.53985C11.5604 6.6997 11.4973 5.82052 11.1891 5.01761C10.881 4.21471 10.3423 3.52556 9.64359 3.04057C8.9449 2.55558 8.11887 2.29737 7.27383 2.29982C6.4288 2.30227 5.60422 2.56526 4.90824 3.0543C4.21226 3.54334 3.67737 4.23559 3.37373 5.04027C3.07008 5.84495 3.01186 6.72449 3.20669 7.56352C3.40153 8.40256 3.84032 9.16193 4.46552 9.74203V11.2573ZM4.90694 12.6996H9.61197C9.72827 12.6996 9.8398 12.6524 9.92204 12.5685C10.0043 12.4846 10.0505 12.3708 10.0505 12.2521C10.0505 12.1335 10.0043 12.0197 9.92204 11.9358C9.8398 11.8519 9.72827 11.8047 9.61197 11.8047H4.90694C4.79065 11.8047 4.67911 11.8519 4.59688 11.9358C4.51465 12.0197 4.46845 12.1335 4.46845 12.2521C4.46845 12.3708 4.51465 12.4846 4.59688 12.5685C4.67911 12.6524 4.79065 12.6996 4.90694 12.6996ZM9.1218 6.88858C9.20403 6.9725 9.31556 7.01964 9.43186 7.01964C9.48944 7.01964 9.54646 7.00806 9.59966 6.98558C9.65286 6.96309 9.7012 6.93013 9.74192 6.88858C9.78264 6.84704 9.81494 6.79771 9.83697 6.74343C9.85901 6.68914 9.87035 6.63096 9.87035 6.5722C9.86765 5.87597 9.5949 5.20915 9.11174 4.71754C8.62859 4.22593 7.97433 3.94951 7.29201 3.94873C7.17571 3.94873 7.06418 3.99587 6.98195 4.07978C6.89971 4.16369 6.85352 4.2775 6.85352 4.39617C6.85352 4.51483 6.89971 4.62864 6.98195 4.71255C7.06418 4.79646 7.17571 4.8436 7.29201 4.8436C7.74186 4.84399 8.17327 5.026 8.49205 5.34988C8.81082 5.67375 8.99105 6.11318 8.99336 6.5722C8.99336 6.69087 9.03956 6.80467 9.1218 6.88858Z"
                      fill={isWhite ? '#737480' : '#B3B4B7'}
                    />
                  </svg>
                  <span className="ml-4">{intl.get('s9.feedback')}</span>
                </div>
              </div>
            </div>
          )}

          <div className="settings-section-content">
            {!haveActiveAlertOn && (
              <div className="settings-option-list">
                <div className={classnames('settings-option', 'snb-alert-option', { 'showing-rules': showSnbRules })}>
                  <span className="option-icon"></span>
                  <div className="option-content">
                    <div className="option-title">{intl.get('settings.risk_warning.snb_alert_title')}</div>
                    <div className="option-subtitle">
                      <div className="subtitle-text">{intl.get('settings.risk_warning.snb_alert_subtitle')}</div>

                      <button
                        className="rules-link hover"
                        onClick={() => {
                          this.onClickSnbRules();
                        }}
                      >
                        {intl.get('settings.risk_warning.rules_link')}
                      </button>
                    </div>
                  </div>
                  <div className="option-action-wrapper">
                    <ToggleSwitch on={finalSnbAlert} onClick={this.onClickSnbAlertToggle} />
                  </div>
                </div>

                <div
                  className={classnames('settings-option', 'rental-alert-option', {
                    'showing-rules': showRentalRules
                  })}
                >
                  <span className="option-icon"></span>
                  <div className="option-content">
                    <div className="option-title">{intl.get('settings.risk_warning.rental_alert_title')}</div>
                    <div className="option-subtitle">
                      <div className="subtitle-text">{intl.get('settings.risk_warning.rental_alert_subtitle')}</div>

                      <button
                        className="rules-link hover"
                        onClick={() => {
                          this.onClickRentalRules();
                        }}
                      >
                        {intl.get('settings.risk_warning.rules_link')}
                      </button>
                    </div>
                  </div>
                  <div className="option-action-wrapper">
                    <ToggleSwitch on={finalRentalAlert} onClick={this.onClickRentalAlertToggle} />
                  </div>
                </div>

                {walletHaveCdpPosition && (
                  <div className={classnames('settings-option', 'cdp-alert-option', { 'showing-rules': showCdpRules })}>
                    <span className="option-icon"></span>
                    <div className="option-content">
                      <div className="option-title">
                        {intl.get('settings.risk_warning.cdp_alert_title')}
                        <Tooltip
                          title={intl.getHTML('settings.risk_warning.cdp_alert_hint_hover_content')}
                          placement="top"
                          arrowPointAtCenter
                          overlayClassName="j-tooltip-dropdown cdp-alert-hint-tooltip"
                          className="title-hint"
                        >
                          {intl.get('settings.risk_warning.cdp_alert_hint')}
                        </Tooltip>
                      </div>
                      <div className="option-subtitle">
                        <div className="subtitle-text">{intl.get('settings.risk_warning.cdp_alert_subtitle')}</div>

                        <button
                          className="rules-link hover"
                          onClick={() => {
                            this.onClickCdpRules();
                          }}
                        >
                          {intl.get('settings.risk_warning.rules_link')}
                        </button>
                      </div>
                    </div>
                    <div className="option-action-wrapper">
                      <ToggleSwitch on={finalCdpAlert} onClick={this.onClickCdpAlertToggle} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {haveActiveAlertOn && (
              <div className="settings-option-list">
                <div className="option-list-title">{intl.get('settings.risk_warning.active_list_title')}</div>

                {finalSnbAlert && (
                  <div className={classnames('settings-option', 'snb-alert-option', { 'showing-rules': showSnbRules })}>
                    <span className="option-icon"></span>
                    <div className="option-content">
                      <div className="option-title">{intl.get('settings.risk_warning.snb_alert_title')}</div>
                      <div className="option-subtitle">
                        <div className="subtitle-text">{intl.get('settings.risk_warning.snb_alert_subtitle')}</div>

                        <button
                          className="rules-link hover"
                          onClick={() => {
                            this.onClickSnbRules();
                          }}
                        >
                          {intl.get('settings.risk_warning.rules_link')}
                        </button>
                      </div>
                    </div>
                    <div className="option-action-wrapper">
                      <ToggleSwitch on={finalSnbAlert} onClick={this.onClickSnbAlertToggle} />
                    </div>
                  </div>
                )}

                {finalRentalAlert && (
                  <div
                    className={classnames('settings-option', 'rental-alert-option', {
                      'showing-rules': showRentalRules
                    })}
                  >
                    <span className="option-icon"></span>
                    <div className="option-content">
                      <div className="option-title">{intl.get('settings.risk_warning.rental_alert_title')}</div>
                      <div className="option-subtitle">
                        <div className="subtitle-text">{intl.get('settings.risk_warning.rental_alert_subtitle')}</div>

                        <button
                          className="rules-link hover"
                          onClick={() => {
                            this.onClickRentalRules();
                          }}
                        >
                          {intl.get('settings.risk_warning.rules_link')}
                        </button>
                      </div>
                    </div>
                    <div className="option-action-wrapper">
                      <ToggleSwitch on={finalRentalAlert} onClick={this.onClickRentalAlertToggle} />
                    </div>
                  </div>
                )}

                {walletHaveCdpPosition && finalCdpAlert && (
                  <div className={classnames('settings-option', 'cdp-alert-option', { 'showing-rules': showCdpRules })}>
                    <span className="option-icon"></span>
                    <div className="option-content">
                      <div className="option-title">
                        {intl.get('settings.risk_warning.cdp_alert_title')}
                        <Tooltip
                          title={intl.getHTML('settings.risk_warning.cdp_alert_hint_hover_content')}
                          placement="top"
                          arrowPointAtCenter
                          overlayClassName="j-tooltip-dropdown cdp-alert-hint-tooltip"
                          className="title-hint"
                        >
                          {intl.get('settings.risk_warning.cdp_alert_hint')}
                        </Tooltip>
                      </div>
                      <div className="option-subtitle">
                        <div className="subtitle-text">{intl.get('settings.risk_warning.cdp_alert_subtitle')}</div>

                        <button
                          className="rules-link hover"
                          onClick={() => {
                            this.onClickCdpRules();
                          }}
                        >
                          {intl.get('settings.risk_warning.rules_link')}
                        </button>
                      </div>
                    </div>
                    <div className="option-action-wrapper">
                      <ToggleSwitch on={finalCdpAlert} onClick={this.onClickCdpAlertToggle} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {haveActiveAlertOn && !allAlertOn && (
              <div className="settings-option-list">
                <div className="option-list-title">{intl.get('settings.risk_warning.paused_list_title')}</div>

                {!finalSnbAlert && (
                  <div className={classnames('settings-option', 'snb-alert-option', { 'showing-rules': showSnbRules })}>
                    <span className="option-icon"></span>
                    <div className="option-content">
                      <div className="option-title">{intl.get('settings.risk_warning.snb_alert_title')}</div>
                      <div className="option-subtitle">
                        <div className="subtitle-text">{intl.get('settings.risk_warning.snb_alert_subtitle')}</div>

                        <button
                          className="rules-link hover"
                          onClick={() => {
                            this.onClickSnbRules();
                          }}
                        >
                          {intl.get('settings.risk_warning.rules_link')}
                        </button>
                      </div>
                    </div>
                    <div className="option-action-wrapper">
                      <ToggleSwitch on={finalSnbAlert} onClick={this.onClickSnbAlertToggle} />
                    </div>
                  </div>
                )}

                {!finalRentalAlert && (
                  <div
                    className={classnames('settings-option', 'rental-alert-option', {
                      'showing-rules': showRentalRules
                    })}
                  >
                    <span className="option-icon"></span>
                    <div className="option-content">
                      <div className="option-title">{intl.get('settings.risk_warning.rental_alert_title')}</div>
                      <div className="option-subtitle">
                        <div className="subtitle-text">{intl.get('settings.risk_warning.rental_alert_subtitle')}</div>

                        <button
                          className="rules-link hover"
                          onClick={() => {
                            this.onClickRentalRules();
                          }}
                        >
                          {intl.get('settings.risk_warning.rules_link')}
                        </button>
                      </div>
                    </div>
                    <div className="option-action-wrapper">
                      <ToggleSwitch on={finalRentalAlert} onClick={this.onClickRentalAlertToggle} />
                    </div>
                  </div>
                )}

                {walletHaveCdpPosition && !finalCdpAlert && (
                  <div className={classnames('settings-option', 'cdp-alert-option', { 'showing-rules': showCdpRules })}>
                    <span className="option-icon"></span>
                    <div className="option-content">
                      <div className="option-title">
                        {intl.get('settings.risk_warning.cdp_alert_title')}
                        <Tooltip
                          title={intl.getHTML('settings.risk_warning.cdp_alert_hint_hover_content')}
                          placement="top"
                          arrowPointAtCenter
                          overlayClassName="j-tooltip-dropdown cdp-alert-hint-tooltip"
                          className="title-hint"
                        >
                          {intl.get('settings.risk_warning.cdp_alert_hint')}
                        </Tooltip>
                      </div>
                      <div className="option-subtitle">
                        <div className="subtitle-text">{intl.get('settings.risk_warning.cdp_alert_subtitle')}</div>

                        <button
                          className="rules-link hover"
                          onClick={() => {
                            this.onClickCdpRules();
                          }}
                        >
                          {intl.get('settings.risk_warning.rules_link')}
                        </button>
                      </div>
                    </div>
                    <div className="option-action-wrapper">
                      <ToggleSwitch on={finalCdpAlert} onClick={this.onClickCdpAlertToggle} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {mobile && (
            <div className={'settings-feedback ' + (isWhite ? 'white' : '')}>
              <div className="m-flex-a">
                <svg width="18" height="19" viewBox="0 0 18 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M13.5999 9.93485C13.4898 9.82285 13.3383 9.75963 13.1814 9.75963C13.0244 9.75963 12.8729 9.82285 12.7628 9.93485L9.0287 13.6724C8.91686 13.7844 8.85552 13.9344 8.85372 14.0933V15.6198C8.85372 15.9486 9.1189 16.2141 9.44721 16.2141H10.9715C11.1285 16.2141 11.28 16.1509 11.3919 16.0389L15.1242 12.3013C15.3551 12.0701 15.3551 11.6926 15.1242 11.4613L13.5999 9.93485ZM15.1711 10.6936L14.3702 9.8915C14.0166 9.53743 14.0166 8.96297 14.3702 8.60891C14.7237 8.25484 15.2974 8.25484 15.6509 8.60891L16.4519 9.41098C16.8055 9.76505 16.8055 10.3395 16.4519 10.6936C16.0983 11.0494 15.5247 11.0494 15.1711 10.6936ZM2.57422 4.81532V13.4683C2.57422 14.9839 3.80089 16.2123 5.3144 16.2123H6.44546V14.3697C6.44546 14.1439 6.53566 13.9272 6.69441 13.7682L13.2589 7.19083C13.5223 6.9036 13.8687 6.70669 14.2475 6.62721C14.4134 6.59289 14.5848 6.59289 14.7508 6.62721C15.0755 6.52063 15.2956 6.21895 15.2974 5.87752V4.81532C15.2974 3.29969 14.0707 2.07129 12.5572 2.07129H5.3144C3.80089 2.06948 2.57422 3.29788 2.57422 4.81532ZM4.93188 5.01769C4.93188 4.69224 5.19572 4.42841 5.52117 4.42841H12.5926C12.918 4.42841 13.1819 4.69224 13.1819 5.01769C13.1819 5.34314 12.9181 5.60698 12.5926 5.60698H5.52117C5.19572 5.60698 4.93188 5.34314 4.93188 5.01769ZM5.52117 7.96436C5.19572 7.96436 4.93188 8.22819 4.93188 8.55364C4.93188 8.87909 5.19572 9.14293 5.52117 9.14293H7.87831C8.20377 9.14293 8.4676 8.87909 8.4676 8.55364C8.4676 8.22819 8.20377 7.96436 7.87831 7.96436H5.52117Z"
                    fill={isWhite ? '#737480' : '#B3B4B7'}
                  />
                </svg>
                <button className="hint-link hover" onClick={() => window.open(feedbackUrl, 'feedback')}>
                  {intl.get('v2.feedback')}
                  <svg
                    className="arrow"
                    width="5"
                    height="9"
                    viewBox="0 0 5 9"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M1 7.5L4 4.5L1 1.5" strokeLinecap="square" stroke={isWhite ? '#4C54FF' : '#9195FB'} />
                  </svg>
                </button>
              </div>
              <div className={'m-flex-a ' + (mobile ? 'mt-10' : '')}>
                <svg
                  className="tip"
                  width="14"
                  height="15"
                  viewBox="0 0 14 15"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M4.46552 11.2573H10.1235V9.72563C10.7455 9.14191 11.1801 8.38001 11.3702 7.53985C11.5604 6.6997 11.4973 5.82052 11.1891 5.01761C10.881 4.21471 10.3423 3.52556 9.64359 3.04057C8.9449 2.55558 8.11887 2.29737 7.27383 2.29982C6.4288 2.30227 5.60422 2.56526 4.90824 3.0543C4.21226 3.54334 3.67737 4.23559 3.37373 5.04027C3.07008 5.84495 3.01186 6.72449 3.20669 7.56352C3.40153 8.40256 3.84032 9.16193 4.46552 9.74203V11.2573ZM4.90694 12.6996H9.61197C9.72827 12.6996 9.8398 12.6524 9.92204 12.5685C10.0043 12.4846 10.0505 12.3708 10.0505 12.2521C10.0505 12.1335 10.0043 12.0197 9.92204 11.9358C9.8398 11.8519 9.72827 11.8047 9.61197 11.8047H4.90694C4.79065 11.8047 4.67911 11.8519 4.59688 11.9358C4.51465 12.0197 4.46845 12.1335 4.46845 12.2521C4.46845 12.3708 4.51465 12.4846 4.59688 12.5685C4.67911 12.6524 4.79065 12.6996 4.90694 12.6996ZM9.1218 6.88858C9.20403 6.9725 9.31556 7.01964 9.43186 7.01964C9.48944 7.01964 9.54646 7.00806 9.59966 6.98558C9.65286 6.96309 9.7012 6.93013 9.74192 6.88858C9.78264 6.84704 9.81494 6.79771 9.83697 6.74343C9.85901 6.68914 9.87035 6.63096 9.87035 6.5722C9.86765 5.87597 9.5949 5.20915 9.11174 4.71754C8.62859 4.22593 7.97433 3.94951 7.29201 3.94873C7.17571 3.94873 7.06418 3.99587 6.98195 4.07978C6.89971 4.16369 6.85352 4.2775 6.85352 4.39617C6.85352 4.51483 6.89971 4.62864 6.98195 4.71255C7.06418 4.79646 7.17571 4.8436 7.29201 4.8436C7.74186 4.84399 8.17327 5.026 8.49205 5.34988C8.81082 5.67375 8.99105 6.11318 8.99336 6.5722C8.99336 6.69087 9.03956 6.80467 9.1218 6.88858Z"
                    fill={isWhite ? '#737480' : '#B3B4B7'}
                  />
                </svg>
                <span>{intl.get('s9.feedback')}</span>
              </div>
            </div>
          )}
        </div>

        <div className={classnames('rules-detail-drawer', { 'active': showSnbRules })}>
          <button
            className="back-btn"
            onClick={() => {
              this.setState({
                showSnbRules: false
              });
            }}
          >
            {intl.get('settings.risk_warning.rules_detail.back_btn')}
          </button>

          <div className="detail-title">{intl.get('settings.risk_warning.rules_detail.snb_rules.title')}</div>
          {this.renderSnbRulesContent()}
        </div>

        <div className={classnames('rules-detail-drawer', { 'active': showRentalRules })}>
          <button
            className="back-btn hover"
            onClick={() => {
              this.setState({
                showRentalRules: false
              });
            }}
          >
            {intl.get('settings.risk_warning.rules_detail.back_btn')}
          </button>

          <div className="detail-title">{intl.get('settings.risk_warning.rules_detail.rental_rules.title')}</div>
          {this.renderRentalRulesContent()}
        </div>

        <div className={classnames('rules-detail-drawer', { 'active': showCdpRules })}>
          <button
            className="back-btn hover"
            onClick={() => {
              this.setState({
                showCdpRules: false
              });
            }}
          >
            {intl.get('settings.risk_warning.rules_detail.back_btn')}
          </button>

          <div className="detail-title">{intl.get('settings.risk_warning.rules_detail.cdp_rules.title')}</div>
          {this.renderCdpRulesContent()}
        </div>

        {mobile && (
          <>
            <Modal
              title={intl.get('settings.risk_warning.rules_detail.snb_rules.title')}
              visible={showSnbRules}
              maskClosable={false}
              closable={true}
              destroyOnClose={true}
              icon={null}
              onCancel={() => this.closeRulesDetailModal()}
              footer={null}
              width={mobile ? 'calc(100% - 40px)' : 400}
              centered
              className={`j-modal header-border ${theme} settings-modal risk-warning-modal`}
              getContainer={() => document.querySelector('.j-wrapper')}
            >
              {this.renderSnbRulesContent()}
            </Modal>
            <Modal
              title={intl.get('settings.risk_warning.rules_detail.rental_rules.title')}
              visible={showRentalRules}
              maskClosable={false}
              closable={true}
              destroyOnClose={true}
              icon={null}
              onCancel={() => this.closeRulesDetailModal()}
              footer={null}
              width={mobile ? 'calc(100% - 40px)' : 400}
              centered
              className={`j-modal header-border ${theme} settings-modal risk-warning-modal`}
              getContainer={() => document.querySelector('.j-wrapper')}
            >
              {this.renderRentalRulesContent()}
            </Modal>
            <Modal
              title={intl.get('settings.risk_warning.rules_detail.cdp_rules.title')}
              visible={showCdpRules}
              maskClosable={false}
              closable={true}
              destroyOnClose={true}
              icon={null}
              onCancel={() => this.closeRulesDetailModal()}
              footer={null}
              width={mobile ? 'calc(100% - 40px)' : 400}
              centered
              className={`j-modal header-border ${theme} settings-modal risk-warning-modal`}
              getContainer={() => document.querySelector('.j-wrapper')}
            >
              {this.renderCdpRulesContent()}
            </Modal>
          </>
        )}
      </div>
    );
  }
}

export default RiskWarning;
