import React from 'react';
import { inject, observer } from 'mobx-react';
import intl from 'react-intl-universal';
import { Modal, Button, Progress } from 'antd';
import {
  BigNumber,
  formatNumber,
  renderProgress,
  renderPercent,
  getDeposit,
  setRiskValue,
  progressV2
} from '../../../utils/helper';
import Config from '../../../config';
import WarningImg from '../../../assets/images/v2/fail.png';
const { jtrxAddress } = Config;

@inject('network')
@inject('user')
@inject('lend')
@inject('system')
@inject('market')
@observer
class Mortgage extends React.Component {
  constructor(props) {
    super();
    this.state = { approving: false };
  }

  hideModal = () => {
    this.props.system.clearRejectError();
    this.props.lend.setMortgageModalInfo({ visible: false, type: 1, jtokenAddress: '' });
  };

  clickMortgage = async type => {
    try {
      this.props.system.clearRejectError();

      if (type === 1) {
        window.gtag('event', 'PC_enable_mortgage_btn', {
          'event_category': 'PC_V1.5',
          'event_label': 'enable_mortgage_btn'
        });
      } else {
        window.gtag('event', 'PC_disable_mortgage_btn', {
          'event_category': 'PC_V1.5',
          'event_label': 'disable_mortgage_btn'
        });
      }
      const { marketList } = this.props.market;
      const { jtokenAddress } = this.props.lend.mortgageModalInfo;
      let intlObj = {
        title: type === 1 ? 'toast.open' : 'toast.close',
        title3: type === 1 ? 'toast.open_failed' : 'toast.close_failed',
        title4: type === 1 ? 'mortgage.open_token' : 'mortgage.close_token',
        obj: { value: marketList[jtokenAddress].collateralSymbol || '' },
        transType: 'mortgage'
      };
      this.setState({
        approving: true
      });
      let txID = false;
      const contractAddress = Config.contract.unitroller;
      let parameters = [{ type: 'address', value: jtokenAddress }];
      if (type === 1) {
        let funcSelector = 'enterMarket(address)';
        const feeLimit = await this.props.system.getFeeLimitCommon(contractAddress, funcSelector, parameters);
        const options = { feeLimit };

        txID = await this.props.system.openMortgage(contractAddress, jtokenAddress, intlObj, options);
        window.gtag('event', 'PC_enable_mortgage_success', {
          'event_category': 'PC_V1.5',
          'event_label': 'enable_mortgage_success'
        });
      } else {
        let funcSelector = 'exitMarket(address)';
        const feeLimit = await this.props.system.getFeeLimitCommon(contractAddress, funcSelector, parameters);
        const options = { feeLimit };

        txID = await this.props.system.lockMortgage(contractAddress, jtokenAddress, intlObj, options);
        window.gtag('event', 'PC_disable_mortgage_success', {
          'event_category': 'PC_V1.5',
          'event_label': 'disable_mortgage_success'
        });
      }
      this.props.lend.setMortgageModalInfo({ visible: false, type: 1, jtokenAddress: '' }); // close self and init
      this.setState({ approving: false });
    } catch (err) {
      console.log('clickMortgage', err);
    }
  };

  getData = (mortgageModalInfo, userList, borrowLimit, totalBorrowUsd) => {
    const data = {
      borrowLimitAfter: '--',
      per1: '--',
      per2: '--'
    };
    try {
      const { risk, totalBorrowValueInTrx, totalCollateralValueInTrx } = this.props.user;
      const { marketList } = this.props.market;
      const { jtokenAddress, type } = mortgageModalInfo;
      const item = userList[jtokenAddress];
      const trxAssetPrice = userList[jtrxAddress]?.assetPrice || marketList[jtrxAddress]?.assetPrice;

      // the data is from market
      if (!item) {
        data.borrowLimitAfter = borrowLimit;
        data.per1 = data.per2 = BigNumber(risk).times(100);
        return data;
      }

      let depositedUSDJtoken = BigNumber(
        jtokenAddress === Config.usddJtoken || jtokenAddress === Config.usddoldJtoken
          ? item.deposited
          : item.deposited_usd
      )
        .times(item.collateralFactor)
        .div(Config.tokenDefaultPrecision);

      let depositedUSDJtoken1 = BigNumber(item.deposited)
        .times(item.assetPrice)
        .times(BigNumber(10).pow(item.collateralDecimal))
        // .div(BigNumber(10).pow(24))
        .div(Config.defaultPrecision)
        .div(
          BigNumber(trxAssetPrice).gte(Config.oraclePricePrecision)
            ? Config.oraclePricePrecision
            : Config.tokenDefaultPrecision
        )
        .times(item.collateralFactor)
        .div(Config.tokenDefaultPrecision);

      let borrowLimitAfter = BigNumber(0);
      let borrowLimitAfter1 = BigNumber(0);
      if (type === 1) {
        // entermarket
        borrowLimitAfter1 = BigNumber(totalCollateralValueInTrx).plus(depositedUSDJtoken1);
      } else {
        borrowLimitAfter1 = BigNumber(totalCollateralValueInTrx).minus(depositedUSDJtoken1).lt(0)
          ? 0
          : BigNumber(totalCollateralValueInTrx).minus(depositedUSDJtoken1);
      }

      if (type === 1) {
        // entermarket
        borrowLimitAfter = borrowLimit.plus(depositedUSDJtoken);
      } else {
        borrowLimitAfter = borrowLimit.minus(depositedUSDJtoken).lt(0) ? 0 : borrowLimit.minus(depositedUSDJtoken);
      }

      data.borrowLimitAfter = borrowLimitAfter;
      data.per1 = BigNumber(risk).times(100);
      // data.per1 = BigNumber(borrowLimit).eq(0) ? 0 : BigNumber(totalBorrowUsd).div(borrowLimit).times(100);
      data.per2 = BigNumber(totalBorrowUsd).lte(0)
        ? 0
        : BigNumber(totalBorrowUsd).gt(0) && BigNumber(borrowLimitAfter1).eq(0)
        ? 100
        : BigNumber(borrowLimitAfter1).eq(0)
        ? 0
        : BigNumber(totalBorrowValueInTrx).div(borrowLimitAfter1).times(100);
      // : BigNumber(totalBorrowUsd).div(borrowLimitAfter).times(100);
      return data;
    } catch (err) {
      console.log('getData: ', err);
      return data;
    }
  };

  renderContent = (mortgageModalInfo, userList, borrowLimit, totalBorrowUsd, collateralSymbol) => {
    const data = this.getData(mortgageModalInfo, userList, borrowLimit, totalBorrowUsd) || {};
    const { type } = mortgageModalInfo;
    const { borrowLimitAfter, per1, per2 } = data;
    const disableStatus =
      BigNumber(per2).gte(100) || (BigNumber(totalBorrowUsd).gt(0) && BigNumber(borrowLimitAfter).eq(0));

    const { transModalInfo } = this.props.system;
    const { declined, transType } = transModalInfo;

    return (
      <>
        <div className="content">
          <div className="r1 flex">
            <span className="r-l">{intl.get('v2.borrow_limit')}</span>
            <span className="r-r">
              <span className="j-values ellipse">
                <span className="old-value ellipse">
                  {formatNumber(borrowLimit, 2, { miniText: 0.01, uint: true, needDolar: true })}
                </span>
                <span className="arrow-right"></span>
                <span className="new-value ellipse">
                  {BigNumber(borrowLimitAfter).eq(0)
                    ? 0
                    : formatNumber(borrowLimitAfter, 2, { miniText: 0.01, uint: true, needDolar: true })}
                </span>
              </span>
            </span>
          </div>
          <div className="r2">
            <span className="r-l">{intl.get('v2.risk_value')}</span>
            <span className="r-r">
              <span className="j-values">
                <span className="old-value">
                  {/* {per1 == 0 ? '0' : setRiskValue(per1, 2)} */}
                  {renderPercent(per1, { keep0: true, needPerSymbol: false })}
                </span>
                <span className="arrow-right"></span>
                {setRiskValue(per2, 2, { miniText: 0.01 })}
                {/* {renderPercent(per2, { keep0: true })} */}
              </span>
            </span>
          </div>
          {progressV2(per1, per2)}
          {/* {renderProgress(per2, { showInfo: false, reverse: true })} */}
        </div>
        {this.state.approving ? (
          <button className="j-large-btn j-supply j-signing" disabled>
            {intl.get('v2.sign_in_wallet')}
            <span className="siging-icon"></span>
          </button>
        ) : (
          <Button
            className="j-large-btn j-supply"
            onClick={() => {
              this.clickMortgage(type);
            }}
            disabled={disableStatus && type === 2}
          >
            {type === 1
              ? intl.get('v2.enable_collateral_symbol', { symbol: collateralSymbol })
              : intl.get('v2.disable_collateral_symbol', { symbol: collateralSymbol })}
          </Button>
        )}
        {disableStatus && (
          <div className="j-error-tip wallet-reject">
            <span className="j-error-img"></span>
            <div>{intl.get('v2.in_use')}</div>
          </div>
        )}

        {declined && transType === 'mortgage' && (
          <div className="j-error-tip wallet-reject">
            <span className="j-error-img"></span>
            <div>{intl.get('v2.reject_in_wallet')}</div>
          </div>
        )}
      </>
    );
  };

  render() {
    const { mortgageModalInfo } = this.props.lend;
    const { userList, totalBorrowUsdForUSDD, borrowLimit } = this.props.user;
    const { visible, type, jtokenAddress } = mortgageModalInfo;
    const collateralSymbol =
      userList && userList[jtokenAddress] && userList[jtokenAddress].collateralSymbol
        ? userList[jtokenAddress].collateralSymbol
        : mortgageModalInfo.collateralSymbol;
    const popData = userList[jtokenAddress] || {};
    const { borrowBalanceNew } = popData;

    return (
      <Modal
        title={type === 1 ? intl.get('v2.enable_collateral') : intl.get('v2.disable_collateral')}
        maskClosable={false}
        visible={visible}
        closable={true}
        onCancel={() => {
          this.hideModal();
        }}
        width={400}
        footer={null}
        centered
        className="j-modal j-mortgage-modal header-border enable-collateral-modal"
        getContainer={() => document.querySelector('.j-wrapper')}
      >
        <div className="mortgage-modal-body">
          {!BigNumber(borrowBalanceNew).gt(0) ? (
            <div className="tips">
              {type === 1 ? (
                <>
                  <div>{intl.getHTML('v2.tip29')}</div>
                </>
              ) : (
                <>
                  <div>{intl.getHTML('v2.tip31')}</div>
                  <div>{intl.getHTML('v2.tip32')}</div>
                </>
              )}
            </div>
          ) : (
            <div className="borrow-using">
              <span className="cancel-img"></span>
              {intl.getHTML('v2.tip12')}
              <button className="j-large-btn j-supply" onClick={() => this.hideModal()}>
                {intl.get('vote.approve_faild_btn')}
              </button>
            </div>
          )}
          {collateralSymbol &&
            !BigNumber(borrowBalanceNew).gt(0) &&
            this.renderContent(mortgageModalInfo, userList, borrowLimit, totalBorrowUsdForUSDD, collateralSymbol)}
        </div>
      </Modal>
    );
  }
}

export default Mortgage;
