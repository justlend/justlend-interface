import React from 'react';
import { inject, observer } from 'mobx-react';
import intl from 'react-intl-universal';
import { Modal, Button, Progress } from 'antd';
import { BigNumber, formatNumber, renderProgress, renderPercent } from '../../utils/helper';
import Config from '../../config';
import WarningImg from '../../assets/images/TransactionCanceled.svg';

@inject('network')
@inject('lend')
@inject('system')
@observer
class Mortgage extends React.Component {
  constructor(props) {
    super();
    this.state = {};
  }

  hideModal = () => {
    this.props.lend.setData({ visible: false, type: 1, jtokenAddress: '' }, 'mortgageModalInfo');
  };

  clickMortgage = async type => {
    try {
      const { marketList } = this.props.lend;
      const { jtokenAddress } = this.props.lend.mortgageModalInfo;
      let intlObj = {
        title: type === 1 ? 'toast.open' : 'toast.close',
        title3: type === 1 ? 'toast.open_failed' : 'toast.close_failed',
        title4: type === 1 ? 'mortgage.open_token' : 'mortgage.close_token',
        obj: { value: marketList[jtokenAddress].collateralSymbol || '' }
      };
      let txID = false;
      if (type === 1) {
        txID = await this.props.system.openMortgage(Config.contract.unitroller, jtokenAddress, intlObj);
      } else {
        txID = await this.props.system.lockMortgage(Config.contract.unitroller, jtokenAddress, intlObj);
      }
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
      const { jtokenAddress, type } = mortgageModalInfo;
      const item = userList[jtokenAddress];
      const depositedUSDJtoken = BigNumber(item.deposited_usd)
        .times(item.collateralFactor)
        .div(Config.tokenDefaultPrecision);
      let borrowLimitAfter = BigNumber(0);
      if (type === 1) {
        // entermarket
        borrowLimitAfter = borrowLimit.plus(depositedUSDJtoken);
      } else {
        borrowLimitAfter = borrowLimit.minus(depositedUSDJtoken).lt(0) ? 0 : borrowLimit.minus(depositedUSDJtoken);
      }
      data.borrowLimitAfter = borrowLimitAfter;
      data.per1 = BigNumber(borrowLimit).eq(0) ? 0 : BigNumber(totalBorrowUsd).div(borrowLimit).times(100);
      data.per2 = BigNumber(totalBorrowUsd).lte(0)
        ? 0
        : BigNumber(borrowLimitAfter).eq(0)
        ? 0
        : BigNumber(totalBorrowUsd).div(borrowLimitAfter).times(100);
      return data;
    } catch (err) {
      console.log('getData: ', err);
      return data;
    }
  };

  renderContent = (mortgageModalInfo, userList, borrowLimit, totalBorrowUsd, collateralSymbol) => {
    const data = this.getData(mortgageModalInfo, userList, borrowLimit, totalBorrowUsd) || {};
    // console.log(data, 'mortgageInfo');
    const { type } = mortgageModalInfo;
    const { borrowLimitAfter, per1, per2 } = data;
    const disableStatus = BigNumber(per2).gte(100);
    return (
      <>
        <div className="content">
          <div className="r1">
            <span className="r-l">{intl.get('mortgage.borrow_limit')}</span>
            <span className="r-r">
              <span className="c-0F134F fs14 fw700">
                <span className="c-84869E fw700">
                  {formatNumber(borrowLimit, 2, { miniText: 0.01, uint: true, needDolar: true })}
                  <span className="arrow-right"></span>
                </span>
                {formatNumber(borrowLimitAfter, 2, { miniText: 0.01, uint: true, needDolar: true })}
              </span>
            </span>
          </div>
          <div className="r2">
            <span className="r-l">{intl.get('mortgage.limitused')}</span>
            <span className="r-r">
              <span className="c-0F134F fs14 fw700">
                <span className="c-84869E fw700">
                  {renderPercent(per1, { keep0: true })}
                  <span className="arrow-right"></span>
                </span>
                {renderPercent(per2, { keep0: true })}
              </span>
            </span>
          </div>
          {renderProgress(per2, { showInfo: false, reverse: true })}
        </div>
        <Button
          className="morgate-btn"
          onClick={() => {
            this.clickMortgage(type);
          }}
          disabled={disableStatus && type === 2}
        >
          {type === 1
            ? intl.get('mortgage.open_token', { value: collateralSymbol })
            : disableStatus
            ? intl.get('mortgage.using')
            : intl.get('mortgage.close_token', { value: collateralSymbol })}
        </Button>
      </>
    );
  };

  render() {
    const { mortgageModalInfo, userList, borrowLimit, totalBorrowUsd } = this.props.lend;
    const { visible, type, jtokenAddress } = mortgageModalInfo;
    const collateralSymbol =
      userList && userList[jtokenAddress] && userList[jtokenAddress].collateralSymbol
        ? userList[jtokenAddress].collateralSymbol
        : '';
    const popData = userList[jtokenAddress] || {};
    const { borrowBalanceNew } = popData;
    return (
      <Modal
        title={type === 1 ? intl.get('mortgage.open') : intl.get('mortgage.close')}
        maskClosable={false}
        visible={visible}
        closable={true}
        onCancel={() => this.hideModal()}
        footer={null}
        className="mortgage-modal"
        getContainer={() => document.querySelector('.main')}
      >
        <div className="mortgage-modal-body">
          {!BigNumber(borrowBalanceNew).gt(0) ? (
            <div className="tips">
              <div>{intl.getHTML('mortgage.explanation1')}</div>
            </div>
          ) : (
            <div className="borrow-using">
              <img src={WarningImg} alt="" />
              {intl.getHTML('mortgage.borrow_using')}
              <button onClick={() => this.hideModal()}>{intl.get('vote.approve_faild_btn')}</button>
            </div>
          )}
          {collateralSymbol &&
            !BigNumber(borrowBalanceNew).gt(0) &&
            this.renderContent(mortgageModalInfo, userList, borrowLimit, totalBorrowUsd, collateralSymbol)}
        </div>
      </Modal>
    );
  }
}

export default Mortgage;
