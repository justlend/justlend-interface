import React, { useEffect, Fragment } from 'react';
import { Tooltip } from 'antd';
import { observer } from 'mobx-react';
import intl from 'react-intl-universal';
import { Link } from 'react-router-dom';
import isMobile from 'ismobilejs';
import Store from '../../stores';
import { getIconsJLv2 } from '../../utils/constant';
import config from '../../config';
const { tronscanUrl } = config;
const mobile = isMobile(window.navigator).any;

export const TransactionModal = observer(() => {
  const { system: systemStore } = Store;
  const { transactionStateV2, closeTransactionModalV2, broadcastError } = systemStore;

  useEffect(() => {
    const HASH_TAG = '#transaction-processing';

    if (transactionStateV2.isOpen) {
      if (window.location.hash !== HASH_TAG) {
        window.history.pushState({ transactionModal: true }, '', HASH_TAG);
      }
    } else {
      if (window.location.hash === HASH_TAG) {
        window.history.back();
      }
    }

    const handlePopState = () => {
      if (transactionStateV2.isOpen && window.location.hash !== HASH_TAG) {
        closeTransactionModalV2();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [transactionStateV2.isOpen, closeTransactionModalV2]);

  if (!transactionStateV2.isOpen) {
    return null;
  }

  const isFinalState = transactionStateV2.finalStatus === 'success' || transactionStateV2.finalStatus === 'failed';
  const isLiquidateTrigger = transactionStateV2.txnType === 'liquidateTrigger';

  return (
    <div className="modal-overlay">
      <div className="transaction-modal-v2">
        <div className="modal-header">
          <div className="modal-header-title">
            {isFinalState ? intl.get('jlv2.transaction.result') : intl.get('jlv2.transaction.in_progress')}
          </div>
          <div className="close-btn" onClick={closeTransactionModalV2}></div>
        </div>
        {!isFinalState && (
          <div className="modal-progress">
            <div className="progress-title">{transactionStateV2.description}</div>
            <div className="progress-subtitle">
              {transactionStateV2.steps.length === 1
                ? intl.getHTML('jlv2.transaction.tips6', { number: transactionStateV2.steps.length })
                : intl.getHTML('jlv2.transaction.tips2', { number: transactionStateV2.steps.length })}
            </div>
          </div>
        )}

        {!isFinalState && (
          <div className={'steps-container ' + (transactionStateV2?.steps?.length === 3 ? 'multy' : '')}>
            {transactionStateV2.steps.map((step, index) => (
              <Fragment key={index}>
                <div
                  className={
                    'step-item' +
                    (step.status === 'success' ? ' step-confirmed' : '') +
                    (step.amount === 'Unlimit' ? ' single' : '')
                  }
                  key={index}
                >
                  <div className="flex aic">
                    <img className="step-icon" src={getIconsJLv2(step.token)} />
                    <div className="step-des">
                      <p>{step.name}</p>
                      {step.amount !== 'Unlimit' && (
                        <Tooltip
                          trigger={mobile ? ['click'] : ['hover']}
                          overlayClassName="j-tooltip-dropdown"
                          title={`${step.amount} ${step.token}`}
                          placement="bottom"
                          arrowPointAtCenter
                        >
                          <p>{`${step.amount} ${step.token}`}</p>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                  {step.status === 'success' ? (
                    <span className="step-success"></span>
                  ) : (
                    <div className={'step-btn ' + (step.status === 'pending' ? 'pending' : '')}>
                      {['signing', 'waiting', 'failed'].includes(step.status) && (
                        <em
                          className={'step-icon-small ' + (step.status === 'failed' ? 'wallet-sign' : 'step-loading')}
                        ></em>
                      )}
                      {step.status === 'pending' && intl.get('jlv2.transaction.pending')}
                      {step.status === 'signing' && intl.get('jlv2.transaction.sign_in_wallet')}
                      {step.status === 'waiting' && intl.get('jlv2.transaction.confirming')}
                      {step.status === 'success' && intl.get('jlv2.transaction.successul')}
                      {step.status === 'failed' && intl.get('jlv2.transaction.failed_on_chain')}
                    </div>
                  )}
                </div>
                {transactionStateV2.steps.length > 1 && index < transactionStateV2.steps.length - 1 && (
                  <div className="step-line"></div>
                )}
              </Fragment>
            ))}
          </div>
        )}

        {transactionStateV2.finalStatus === 'success' && (
          <div className="final-state">
            <div className="final-icon success"></div>
            <Tooltip
              trigger={mobile ? ['click'] : ['hover']}
              overlayClassName="j-tooltip-dropdown"
              title={transactionStateV2.successMessage || 'Transaction Confirmed'}
              placement="top"
              arrowPointAtCenter
            >
              <div className="fs-title">{transactionStateV2.successMessage || 'Transaction Confirmed'}</div>
            </Tooltip>
            <div className="flex aic">
              {transactionStateV2.steps.length > 1 && (
                <div className="fs-des mr-6">
                  {intl.getHTML('jlv2.transaction.tips3', { number: transactionStateV2.steps.length })}
                </div>
              )}
              {transactionStateV2.txId && (
                <Link className="modal-link" to="/userRecords?tab=SBMV2" target="_blank" rel="noopener noreferrer">
                  {intl.get('jlv2.transaction.view_detail')}
                </Link>
              )}
            </div>
          </div>
        )}

        {transactionStateV2.finalStatus === 'failed' && (
          <div className="final-state">
            <div className="final-icon failed"></div>
            <div className="fs-title">{transactionStateV2.errorMessage}</div>
            {
              <div className="fs-des mb-10">
                {transactionStateV2.isRejected
                  ? intl.get('v2.reject_in_wallet')
                  : broadcastError
                  ? intl.get('jlv2.transaction.broadcaste_failed')
                  : transactionStateV2.errorDesc || intl.get('jlv2.transaction.review_error')}
              </div>
            }
            {(!transactionStateV2.isRejected || !broadcastError) && transactionStateV2?.txId && !isLiquidateTrigger && (
              <a
                className="modal-link"
                href={`${tronscanUrl}/transaction/${transactionStateV2.txId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {intl.get('jlv2.record.transaction_detail')}
              </a>
            )}
          </div>
        )}
        {transactionStateV2.finalStatus && (
          <div className="modal-footer">
            <div className="modal-footer-btn" onClick={closeTransactionModalV2}>
              {intl.get('jlv2.transaction.close')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
