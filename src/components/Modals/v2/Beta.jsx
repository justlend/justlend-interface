import React from 'react';
import { Link } from 'react-router-dom';
import isMobile from 'ismobilejs';
import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';
import { Modal, Select, Tooltip, Input } from 'antd';
import Config from '../../../config';
import {
  formatNumber,
  BigNumber,
  emptyReactNodeNew,
  getJTokenLogo,
  getLiquidLogo,
  numberParser,
  toBigNumberNew
} from '../../../utils/helper';
import { tokenBalanceOf } from '../../../utils/blockchain';
import '../../../assets/css/v2/liquidate-modal.scss';
import BetaIcon from '../../../assets/images/v2/beta-icon.png';
import BetaWhiteIcon from '../../../assets/images/v2/white-theme/beta-icon.png';
import BetaNewIcon from '../../../assets/images/v2/beta-new-icon.png';
import BetaNewWhiteIcon from '../../../assets/images/v2/white-theme/beta-new-icon.png';

const { Option } = Select;
@inject('lend')
@inject('system')
@inject('network')
@observer
class BetaModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      mobile: isMobile(window.navigator).any
    };
  }
  componentDidMount = () => {
    // this.listInit();
    window.gtag('event', 'betatest_invitation_popup', {
      'event_category': 'betatest',
      'event_label': 'betatest_invitation_popup'
    });
  };

  //   window.gtag('event', 'click', { 'event_category': 'liquidate', 'event_label': 'liquidate_timeout_pop' });
  betaListender = () => {
    const { theme, betaModalVisible, betaInfo, applicationMap } = this.props.lend;
    const betaMap = {
      '1': 'rent',
      '2': 'liquidate',
      '3': 'settings'
    };

    return betaInfo?.map((item, index) => {
      return [1, 2, 3].includes(item.status)
        ? applicationMap[betaMap[item.type]]?.switchOn && applicationMap[betaMap[item.type]]?.phase === 1 && (
            <div key={index}>
              <div className="flex aic">
                <span className="bl-main">
                  {item.type === 1
                    ? intl.get('beta.rental')
                    : item.type === 2
                    ? intl.get('beta.liquidate')
                    : intl.get('settings.application_beta_title')}
                </span>
                {item.status === 1 && (
                  <img className="bl-img" src={theme === 'white' ? BetaNewWhiteIcon : BetaNewIcon} />
                )}
              </div>
              {item.status !== 3 ? (
                item.type === 1 ? (
                  <Link
                    className="jl-links"
                    to="/energyRental"
                    onClick={() => {
                      window.gtag('event', 'betatest_invitation_popup_explore', {
                        'event_category': 'betatest',
                        'event_label': 'betatest_invitation_popup_explore'
                      });
                      this.close();
                    }}
                  >
                    {intl.get('beta.forward')}
                  </Link>
                ) : item.type === 2 ? (
                  <Link
                    className="jl-links"
                    to="/liquidate"
                    onClick={() => {
                      window.gtag('event', 'betatest_invitation_popup_explore', {
                        'event_category': 'betatest',
                        'event_label': 'betatest_invitation_popup_explore'
                      });
                      this.close();
                    }}
                  >
                    {intl.get('beta.forward')}
                  </Link>
                ) : (
                  <Link
                    className="jl-links"
                    to="/userRecords"
                    onClick={() => {
                      window.gtag('event', 'betatest_invitation_popup_explore', {
                        'event_category': 'betatest',
                        'event_label': 'betatest_invitation_popup_explore'
                      });
                      this.close();
                    }}
                  >
                    {intl.get('beta.forward')}
                  </Link>
                )
              ) : (
                <span className="bl-expired">{intl.get('beta.expired')}</span>
              )}
            </div>
          )
        : null;
    });
  };

  close = () => {
    const { defaultAccount } = this.props.network;
    const { betaInfo } = this.props.lend;

    this.props.lend.setBetaModalVisible(false);
    // window.localStorage.setItem('hasSeenBeta' + defaultAccount, JSON.stringify(betaInfo));
    this.props.betaCloseCallback();
  };

  render() {
    const { mobile, lang } = this.state;
    const { theme, betaModalVisible, betaInfo, applicationMap } = this.props.lend;
    const { defaultAccount } = this.props.network;

    let isExpired = false;
    betaInfo?.map(item => {
      if (item.status === 3) {
        isExpired = true;
      }
    });

    let betaModalVisibleReal = betaModalVisible && applicationMap?.canApply;

    return (
      <Modal
        title=""
        visible={betaModalVisibleReal}
        closable={true}
        maskClosable={false}
        icon={null}
        onCancel={() => {
          window.gtag('event', 'betatest_invitation_popup_close', {
            'event_category': 'betatest',
            'event_label': 'betatest_invitation_popup_close'
          });
          this.close();
        }}
        footer={null}
        width={mobile ? 'calc(100% - 40px)' : 400}
        centered
        className={`j-modal j-transaction-modal j-beta-modal ${theme}`}
        getContainer={() => document.querySelector('.j-wrapper')}
      >
        <div className="trans-title">{intl.get('beta.title')}</div>
        <div className="trans-body center">
          <div className="trans-icon mt-50">
            <img className="icon-80-80" src={theme === 'white' ? BetaWhiteIcon : BetaIcon} alt="" />
          </div>
          {defaultAccount && (
            <div className="trans-tips">
              {isExpired
                ? intl.get('beta.tips2', {
                    address:
                      defaultAccount?.substr(0, 3) + '...' + defaultAccount?.substring(defaultAccount?.length - 3)
                  })
                : intl.get('beta.tips1', {
                    address:
                      defaultAccount?.substr(0, 3) + '...' + defaultAccount?.substring(defaultAccount?.length - 3)
                  })}
            </div>
          )}
          <div className="beta-list">{this.betaListender()}</div>
          <button
            className="j-large-btn loading-close"
            onClick={() => {
              window.gtag('event', 'betatest_invitation_popup_close', {
                'event_category': 'betatest',
                'event_label': 'betatest_invitation_popup_close'
              });
              this.close();
            }}
          >
            {intl.get('beta.close')}
          </button>
        </div>
      </Modal>
    );
  }
}

export default BetaModal;
