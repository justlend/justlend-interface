import React from 'react';
import isMobile from 'ismobilejs';
import { inject, observer } from 'mobx-react';
import { tronscanTX } from '../../../utils/helper';
import { Modal, Tabs, Input, Button, Progress } from 'antd';
import intl from 'react-intl-universal';
import '../../../assets/css/v2/modal.scss';
import { BigNumber, formatNumber, renderPercent, toBigNumber } from '../../../utils/helper';
import Config from '../../../config';
import TransCancelledIcon from '../../../assets/images/v2/fail.png';
import TransSubmittedIcon from '../../../assets/images/v2/success.png';
import TransCancelledIcon1 from '../../../assets/images/v2/white-theme/fail.png';
import TransSubmittedIcon1 from '../../../assets/images/v2/white-theme/success.png';
import TransExpiredIcon from '../../../assets/images/v2/expired.png';
import TransExpiredIcon1 from '../../../assets/images/v2/white-theme/expired.png';
import TransLoadingIcon from '../../../assets/images/v2/loading.png';
import TransLoadingIcon1 from '../../../assets/images/v2/white-theme/loading.png';

@inject('network')
@inject('lend')
@inject('system')
@observer
class Transaction extends React.Component {
  constructor() {
    super();
    this.state = {
      mobile: isMobile(window.navigator).any
    };
  }

  close = () => {
    this.props.system.setData({ transModalInfo: { visible: false } });
  };

  collateralOn = async transInfo => {
    this.props.lend.hideDAWPop();
    this.close();

    const { marketList } = this.props.lend;

    if (!this.props.lend.collateralValid(marketList[transInfo?.jtokenAddress]?.collateralSymbol)) return;

    this.props.lend.setData({ visible: true, type: 1, jtokenAddress: transInfo?.jtokenAddress }, 'mortgageModalInfo');

    // let intlObj = {
    //   title: 'toast.open',
    //   title3: 'toast.open_failed',
    //   title4: 'mortgage.open_token',
    //   obj: { value: marketList[transInfo?.jtokenAddress].collateralSymbol || '' }
    // };
    // let txID = await this.props.system.openMortgage(Config.contract.unitroller, transInfo?.jtokenAddress, intlObj);
  };

  render() {
    const { transModalInfo } = this.props.system;
    const { visible, step, txId, title, obj, title2, title3, title4, transType, declined } = transModalInfo;
    const { theme } = this.props.lend;
    const { mobile } = this.state;

    if (step == 82 && transType === 'returnResourceNew') {
      window.gtag('event', 'energyrent_pro_endtx_successpop', {
        'event_category': 'energyrent',
        'event_label': 'energyrent_pro_endtx_successpop'
      });
    }

    return (
      step !== 1 &&
      step !== 4 &&
      step !== 5 &&
      !declined && (
        <Modal
          title=""
          visible={visible}
          closable={false}
          icon={null}
          onCancel={() => this.props.system.hideTransModal()}
          footer={null}
          width={mobile ? 'calc(100% - 40px)' : 400}
          centered
          className={`j-modal j-transaction-modal ${theme} ${
            (obj?.transInfo?.show && step !== 8 && step !== 9) ||
            (obj?.token === 'wstUSDT' && transType === 'withdraw' && step !== 8 && step !== 9)
              ? ''
              : ' short'
          } `}
          getContainer={() => document.querySelector('.j-wrapper')}
        >
          <div className="trans-title">
            {transType === 'approve'
              ? intl.get('lend.approve')
              : step === 2
              ? intl.get(title2 || 'deposit.transactionsent', obj)
              : step === 8
              ? intl.get('transaction.transaction_confirming', obj)
              : step === 9
              ? intl.get('transaction.transaction_timeout', obj)
              : step === 82
              ? intl.get('transaction.transaction_completed', obj)
              : step === 83
              ? intl.get('transaction.transaction_failed', obj)
              : intl.get(title3 || 'v2.transaction_confirm_fail', obj)}
          </div>
          <div className="trans-body center">
            {step == 2 ? (
              <React.Fragment key="step2">
                <div className="trans-icon">
                  <img src={theme === 'white' ? TransSubmittedIcon1 : TransSubmittedIcon} alt="" />
                </div>
                <div className="trans-tips">{intl.get('deposit.explanation4')}</div>
                {obj?.transInfo?.show ? (
                  <div className="j-trans-info">
                    <div className="j-ti-eles">
                      {/* <div className="j-ti">
                        <span>{intl.getHTML('v2.tip17', { value: obj?.token })}</span>
                        <span>{renderPercent(obj?.transInfo?.collateralFactor)}</span>
                      </div> */}
                      <div className="j-ti">
                        <span>
                          {intl.getHTML('v2.tip13', {
                            value: formatNumber(obj?.transInfo?.borrowLimitAfter, 2, {
                              miniText: 0.01,
                              needDolar: true
                            })
                          })}
                        </span>
                      </div>
                    </div>
                    {/* <div className="j-ti-collateral" onClick={() => this.collateralOn(obj?.transInfo)}>
                      <span>
                        {intl.get('v2.tip19')}
                        <em></em>
                      </span>
                    </div> */}
                  </div>
                ) : (
                  <div>
                    <span className="hover">
                      {tronscanTX(intl.get('v2.tip34'), txId)}
                      <span className="warning-icon"></span>
                    </span>
                  </div>
                )}
                {obj?.transInfo?.show ? (
                  <div className="collateral-transaction">
                    <button className="btn-border" onClick={this.props.system.hideTransModal}>
                      {intl.get('deposit.closed')}
                    </button>
                    <div
                      className="btn-bg"
                      onClick={() => {
                        this.collateralOn(obj?.transInfo);
                        window.gtag('event', 'PC_enable_collateral', {
                          'event_category': 'PC_V1.5',
                          'event_label': 'enable_collateral'
                        });
                      }}
                    >
                      {intl.get('v2.tip19')}
                    </div>
                  </div>
                ) : (
                  <button
                    className="j-large-btn j-supply"
                    onClick={() => {
                      this.props.system.hideTransModal();
                      window.gtag('event', 'PC_close_success_modal', {
                        'event_category': 'PC_V1.5',
                        'event_label': 'close_success_modal'
                      });
                    }}
                  >
                    {intl.get('deposit.closed')}
                  </button>
                )}
              </React.Fragment>
            ) : null}
            {step == 3 ? (
              <React.Fragment key="step3">
                <div className="trans-icon">
                  <img src={theme === 'white' ? TransCancelledIcon1 : TransCancelledIcon} alt="" />
                </div>
                <div className="trans-tips">{intl.get('deposit.explanation3')}</div>
                <button className="j-large-btn j-supply" onClick={this.props.system.hideTransModal}>
                  {intl.get('deposit.closed')}
                </button>
              </React.Fragment>
            ) : null}
            {step == 8 ? (
              <React.Fragment key="step2">
                <div className="trans-icon">
                  <img src={theme === 'white' ? TransLoadingIcon1 : TransLoadingIcon} alt="" className="loading" />
                </div>
                <div className="trans-tips">{intl.get('transaction.transaction_on_the_chain')}</div>
                <button
                  className="j-large-btn loading-close"
                  onClick={() => {
                    this.props.system.hideTransModal();
                    // window.gtag('event', 'PC_close_success_modal', {
                    //   'event_category': 'PC_V1.5',
                    //   'event_label': 'close_success_modal'
                    // });
                  }}
                >
                  {intl.get('deposit.closed')}
                </button>
              </React.Fragment>
            ) : null}
            {step == 82 ? (
              <React.Fragment key="step2">
                <div className="trans-icon">
                  <img src={theme === 'white' ? TransSubmittedIcon1 : TransSubmittedIcon} alt="" />
                </div>
                <div className="trans-tips">
                  {transType === 'deposit' &&
                    intl.get('transaction.transaction_supply_success', {
                      amount: formatNumber(obj?.value, 3, {
                        miniText: 0.001
                      }),
                      symbol: obj?.token
                    })}
                  {transType === 'withdraw' &&
                    intl.get('transaction.transaction_withdraw_success', {
                      amount: formatNumber(obj?.value, 3, {
                        miniText: 0.001
                      }),
                      symbol: obj?.token
                    })}

                  {transType === 'borrow' &&
                    intl.get('transaction.transaction_borrow_success', {
                      amount: formatNumber(obj?.value, 3, {
                        miniText: 0.001
                      }),
                      symbol: obj?.token
                    })}

                  {transType === 'repay' &&
                    intl.get('transaction.transaction_repay_success', {
                      amount: formatNumber(obj?.value, 3, {
                        miniText: 0.001
                      }),
                      symbol: obj?.token
                    })}

                  {transType === 'returnResourceNew' &&
                    intl.get('energy_rental.end_order_modal.transaction_finished_msg', {
                      value: obj?.value
                    })}

                  {transType === 'liquidate' &&
                    intl.get('liquidate.liquidate_liquidate_success', {
                      // amount: formatNumber(obj?.value, 3, {
                      //   miniText: 0.001
                      // }),
                      amount: formatNumber(obj?.value, BigNumber(obj?.value).lt(1) ? 18 : 3, {
                        cutZero: true
                      }),
                      symbol: obj?.token
                    })}
                </div>

                {obj?.token === 'wstUSDT' && transType === 'withdraw' ? (
                  <div className="j-trans-info">
                    <div className="j-ti-eles">
                      <div className="j-wstUSDT">
                        {intl.get('transaction.wstUSDT_withdraw1')}{' '}
                        <a href="https://stusdt.io/" target="stusdt">
                          {intl.get('transaction.wstUSDT_withdraw2')}{' '}
                        </a>
                      </div>
                      <div className="j-wstUSDT">{intl.get('transaction.wstUSDT_withdraw3')}</div>
                    </div>
                  </div>
                ) : obj?.transInfo?.show ? (
                  <div className="j-trans-info">
                    <div className="j-ti-eles">
                      <div className="j-ti">
                        <span>
                          {intl.getHTML('v2.tip13', {
                            value: formatNumber(obj?.transInfo?.borrowLimitAfter, 2, {
                              miniText: 0.01,
                              needDolar: true
                            })
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <span className="hover">
                      {tronscanTX(intl.get('v2.tip34'), txId)}
                      <span className="warning-icon"></span>
                    </span>
                  </div>
                )}
                {obj?.transInfo?.show ? (
                  <div className="collateral-transaction">
                    <button className="btn-border" onClick={this.props.system.hideTransModal}>
                      {intl.get('deposit.closed')}
                    </button>
                    <div
                      className="btn-bg"
                      onClick={() => {
                        this.collateralOn(obj?.transInfo);
                        window.gtag('event', 'PC_enable_collateral', {
                          'event_category': 'PC_V1.5',
                          'event_label': 'enable_collateral'
                        });
                      }}
                    >
                      {intl.get('v2.tip19')}
                    </div>
                  </div>
                ) : (
                  <button
                    className="j-large-btn loading-close"
                    onClick={() => {
                      this.props.system.hideTransModal();
                      window.gtag('event', 'PC_close_success_modal', {
                        'event_category': 'PC_V1.5',
                        'event_label': 'close_success_modal'
                      });
                    }}
                  >
                    {intl.get('deposit.closed')}
                  </button>
                )}
              </React.Fragment>
            ) : null}
            {step == 83 ? (
              <React.Fragment key="step2">
                <div className="trans-icon">
                  <img src={theme === 'white' ? TransCancelledIcon : TransCancelledIcon} alt="" />
                </div>
                <div className="trans-tips">{intl.get('transaction.transaction_failed')}</div>

                <div>
                  <span className="hover">
                    {tronscanTX(intl.get('v2.tip34'), txId, () =>
                      window.gtag('event', 'click', {
                        'event_category': 'energyrent',
                        'event_label': 'energyrent_pro_endtx_successpop_goScan'
                      })
                    )}
                    <span className="warning-icon"></span>
                  </span>
                </div>
                <button
                  className="j-large-btn loading-close"
                  onClick={() => {
                    this.props.system.hideTransModal();
                    window.gtag('event', 'PC_close_fail_modal', {
                      'event_category': 'PC_V1.5',
                      'event_label': 'PC_close_fail_modal'
                    });
                  }}
                >
                  {intl.get('deposit.closed')}
                </button>
              </React.Fragment>
            ) : null}
            {step == 9 ? (
              <React.Fragment key="step3">
                <div className="trans-icon">
                  <img src={theme === 'white' ? TransExpiredIcon1 : TransExpiredIcon} alt="" />
                </div>
                <div className="trans-tips">{intl.get('transaction.transaction_expired')}</div>
                <button
                  className="j-large-btn loading-close"
                  onClick={() => {
                    this.props.system.hideTransModal();
                    window.gtag('event', 'PC_close_expired_modal', {
                      'event_category': 'PC_V1.5',
                      'event_label': 'close_expired_modal'
                    });
                  }}
                >
                  {intl.get('deposit.closed')}
                </button>
              </React.Fragment>
            ) : null}
          </div>
        </Modal>
      )
    );
  }
}

export default Transaction;
