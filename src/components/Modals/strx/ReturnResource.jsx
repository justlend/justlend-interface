import React from 'react';
import isMobile from 'ismobilejs';
import { inject, observer } from 'mobx-react';
import { tronscanTX } from '../../../utils/helper';
import { Modal, Tabs, Input, Button, Progress, Tooltip } from 'antd';
import intl from 'react-intl-universal';
import '../../../assets/css/v2/modal.scss';
import '../../../assets/css/v2/strx-modal.scss';
import { BigNumber, formatNumber } from '../../../utils/helper';
import Config from '../../../config';

@inject('network')
@inject('lend')
@inject('system')
@inject('pool')
@inject('strx')
@inject('energyRental')
@observer
class ReturnResource extends React.Component {
  constructor() {
    super();
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      approving: false,
      mobile: isMobile(window.navigator).any
    };
  }

  close = () => {
    this.props.system.clearRejectError();
    this.props.strx.setData({ returnResourceVisible: false });
  };

  returnResource = async () => {
    try {
      window.gtag('event', 'PC_energy_return_confirm', {
        'event_category': 'sTRX',
        'event_label': 'energy_return_confirm'
      });

      if (this.props.network.isRightChain === 0) {
        this.props.network.changeChain();
        return;
      }

      this.props.system.clearRejectError();

      const { rentBalance, energyFee, getEnergyFee, returnRentInfo } = this.props.strx;
      const { usageChargeRatio } = this.props.energyRental;

      let unrecoveredEnergyAmount = BigNumber(returnRentInfo.unrecoveredEnergyAmount).plus(10000);
      let unrecoveredEnergyFee = BigNumber(returnRentInfo.dailyRent)
        .times(BigNumber(unrecoveredEnergyAmount).div(returnRentInfo.rentAmount))
        .times(usageChargeRatio);
      let returnRentBalance = BigNumber(returnRentInfo.rentRemain)
        .plus(returnRentInfo.securityDeposit)
        .minus(unrecoveredEnergyFee);

      const intlObj = {
        title: 'v2.transaction_confirm',
        title2: 'deposit.transactionsent',
        title3: 'v2.transaction_confirm_fail',
        title4: 'deposit.confirm_transaction',
        obj: {
          value: formatNumber(returnRentBalance, 6, { miniText: '0.000001' }),
          token: 'TRX'
        },
        transType: 'returnResource'
      };

      let feeLimit = Config.feeLimitForReturnResourceDefault;
      const energy = await this.props.system.getReturnRentFeeLimit(
        window.defaultAccount,
        BigNumber(rentBalance).times(Config.trxPrecision)._toFixed(0, 1),
        1
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

      const txID = await this.props.system.returnResource(
        window.defaultAccount,
        BigNumber(rentBalance).times(Config.trxPrecision)._toFixed(0, 1),
        1,
        BigNumber(feeLimit),
        intlObj
      );

      if (txID) {
        this.props.callback();
        this.close();
        window.gtag('event', 'PC_energy_return_confirm_success', {
          'event_category': 'sTRX',
          'event_label': 'energy_return_confirm_success'
        });
        setTimeout(() => {
          this.props.strx.getUserTrxBalance();
          this.props.strx.getAccountRentInfos();
          this.props.strx.getNotAccountRentInfos();
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
    const { returnResourceVisible, securityDeposit, returnResourceEnergy, returnRentInfo } = this.props.strx;
    const { usageChargeRatio } = this.props.energyRental;

    const diff = BigNumber(returnResourceEnergy).gt(securityDeposit)
      ? BigNumber(returnResourceEnergy).minus(securityDeposit)
      : BigNumber(securityDeposit).minus(returnResourceEnergy);

    const { approving, lang, mobile } = this.state;
    const announcementUrl =
      lang && lang.includes('en')
        ? 'https://justlendorg.zendesk.com/hc/en-us/articles/16512503468057'
        : 'https://justlendorg.zendesk.com/hc/zh-cn/articles/16512503468057';

    let unrecoveredEnergyAmount = BigNumber(returnRentInfo.unrecoveredEnergyAmount).plus(10000);
    let unrecoveredEnergyFee = BigNumber(returnRentInfo.dailyRent)
      .times(BigNumber(unrecoveredEnergyAmount).div(returnRentInfo.rentAmount))
      .times(usageChargeRatio);
    let rentRemainAndsecurityDeposit = BigNumber(returnRentInfo.rentRemain).plus(returnRentInfo.securityDeposit);

    unrecoveredEnergyFee = BigNumber(unrecoveredEnergyFee).gt(rentRemainAndsecurityDeposit)
      ? rentRemainAndsecurityDeposit
      : unrecoveredEnergyFee;

    return (
      <Modal
        title={intl.get('strx.energy_end_rental2')}
        visible={returnResourceVisible}
        closable={true}
        icon={null}
        onCancel={() => this.close()}
        footer={null}
        width={mobile ? 'calc(100% - 40px)' : 400}
        centered
        className={`j-modal j-return-resource-modal  header-border ${theme} `}
        getContainer={() => document.querySelector('.j-wrapper')}
      >
        <div className="return-resource">
          <div className="return-icon"></div>
          <div className="rs-title">{intl.get('strx.energy_end_tip0')}</div>
          <div className="rs-info">
            <div>
              <div className="rsi-title">{intl.get('strx.energy_deducted')}</div>
              <div className="rsi-value">
                {formatNumber(returnRentInfo.rentAmount, 0)} {intl.get('strx.energy_energy')}
              </div>
            </div>
            <div>
              <div className="rsi-title">{intl.get('strx.energy_asset_returned')}</div>
              <div className="rsi-value flex items-center">
                {'≈ '}
                {formatNumber(
                  BigNumber(returnRentInfo.rentRemain).plus(returnRentInfo.securityDeposit).minus(unrecoveredEnergyFee),
                  6
                )}
                {' TRX '}
                <Tooltip
                  title={
                    <span>
                      {intl.get('strx.energy_include_info', {
                        value1: formatNumber(returnRentInfo.rentRemain, 6),
                        value2: formatNumber(returnRentInfo.securityDeposit, 6)
                      })}
                      <a className="learn-more" href={announcementUrl} target="_blank" rel="noopener noreferrer">
                        &nbsp;&nbsp;{intl.get('strx.energy_lerna_more2')}
                      </a>
                    </span>
                  }
                  placement="topRight"
                  arrowPointAtCenter
                  overlayClassName="j-tooltip-dropdown"
                >
                  <span
                    className="j-tooltip-icon ml-4"
                    onMouseEnter={() => {
                      window.gtag('event', 'PC_energy_return_hover', {
                        'event_category': 'sTRX',
                        'event_label': 'energy_return_hover'
                      });
                    }}
                  ></span>
                </Tooltip>
              </div>
            </div>
          </div>
          {approving ? (
            <button className="j-large-btn j-supply rent-now j-signing" disabled>
              {intl.get('v2.sign_in_wallet')}
              <span className="siging-icon"></span>
            </button>
          ) : (
            <button className="j-large-btn j-supply rent-now" onClick={() => this.returnResource()}>
              {intl.get('strx.energy_confirm_end')}
            </button>
          )}
          {declined && transType === 'returnResource' && (
            <div className="j-error-tip wallet-reject">
              <span className="j-error-img"></span>
              <div>{intl.get('v2.reject_in_wallet')}</div>
            </div>
          )}
        </div>
      </Modal>
    );
  }
}

export default ReturnResource;
