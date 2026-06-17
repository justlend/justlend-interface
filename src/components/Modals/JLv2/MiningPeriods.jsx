import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { Modal, message } from 'antd';
import isMobile from 'ismobilejs';
import intl from 'react-intl-universal';
import Stores from '../../../stores';
import { useMiningPeriods, useClaimMiningPeriod } from '../../../utils/hooks/useMining';
import { BigNumber, renderSplitAmount } from '../../../utils/helper';
import { formatTokenAmount } from '../../../utils/formatters';

import '../../../assets/css/v2/modal.scss';
import '../../../assets/css/v2/vote-detail-modal.scss';

// dual-token claims are disabled (see useMining.sendRealClaimPeriod) so each
// period really only has one token with a non-zero amount; the other slot is
// a backend-side placeholder. Skip zero-amount tokens so the modal doesn't
// render lines like "+ 0 TRX" alongside the actual reward.
const hasAmount = t => Number(t?.amount) > 0;
const formatRewardAmount = t => formatTokenAmount(t?.amount).replace(/\s.*$/, '');

const sumByToken = periods => {
  const map = new Map();
  for (const p of periods) {
    for (const t of p.tokens || []) {
      if (!hasAmount(t)) continue;
      const prev = map.get(t.token) || BigNumber(0);
      map.set(t.token, prev.plus(t.amount));
    }
  }
  return Array.from(map.entries()).map(([token, amount]) => ({ token, amount }));
};

export const MiningPeriodsModal = observer(({ visible, onClose }) => {
  const { lend } = Stores;
  const [mobile] = useState(isMobile(window.navigator).any);
  const { periods, loading, refresh } = useMiningPeriods();
  const { claim, activeKey } = useClaimMiningPeriod();

  useEffect(() => {
    if (visible) refresh();
  }, [visible, refresh]);

  useEffect(() => {
    if (!visible) return;
    if (loading) return;
    if (periods.length === 0) {
      const t = setTimeout(() => onClose?.(), 800);
      return () => clearTimeout(t);
    }
  }, [visible, loading, periods.length, onClose]);

  const onClaimPeriod = async period => {
    const tokenTag = (period?.tokens?.length || 0) > 1 ? 'dual' : 'single';
    window.gtag?.('event', 'PC_mining_rewards_claim', {
      event_category: 'PC_V2',
      event_label: `mining_rewards_claim_${tokenTag}`
    });
    try {
      await claim(period);
      window.gtag?.('event', 'PC_mining_rewards_claim_success', {
        event_category: 'PC_V2',
        event_label: `mining_rewards_claim_success_${tokenTag}`
      });
      message.success(intl.get('mining.rewards.claim_success'), 2);
      refresh();
    } catch (e) {
      window.gtag?.('event', 'PC_mining_rewards_claim_fail', {
        event_category: 'PC_V2',
        event_label: `mining_rewards_claim_fail_${tokenTag}`
      });
      if (e?.code === 'ALREADY_CLAIMED') {
        message.info(intl.get('mining.rewards.claim_already_synced'), 2);
      } else {
        message.error(
          intl.get(
            e?.code === 'MERKLE_ROOT_NOT_READY' ? 'mining.rewards.claim_not_ready' : 'mining.rewards.claim_failed'
          ),
          2
        );
      }
    }
  };

  const totals = sumByToken(periods);

  return (
    <Modal
      title={intl.get('v2.rewards.claim_mining')}
      maskClosable={false}
      visible={visible}
      closable={true}
      onCancel={onClose}
      footer={null}
      className={`j-modal j-reward-modal claim header-border ${lend.theme || ''}`}
      width={450}
      centered={!mobile}
      getContainer={() => document.querySelector('.j-wrapper') || document.body}
    >
      <div className="j-rewards">
        <div className="rewards-icon"></div>
        <div className="rewards-title">{intl.get('v2.rewards.claiming')}</div>

        <div className="rewards-value">
          <div className="rewards-total-num">
            {totals.length === 0
              ? renderSplitAmount('0.00', 'USDD')
              : totals.map((t, i) => (
                  <React.Fragment key={t.token}>
                    {i > 0 && ' + '}
                    {renderSplitAmount(formatRewardAmount(t), t.token, t.amount)}
                  </React.Fragment>
                ))}
          </div>
        </div>

        <div className="rewards-lists">
          <div className="rewards-list-title">
            <span>{intl.get('v2.rewards.mining_round')}</span>
            <span>{intl.get('v2.rewards.reward_balance')}</span>
            <span></span>
          </div>

          <div className="pr">
            <div className="rewards-list-content scroll-bar">
              {periods.map(p => {
                const isSigning = activeKey === p.periodKey;
                const tokens = (p.tokens || []).filter(hasAmount);
                return (
                  <div className="j-reward-item" key={p.periodKey}>
                    <div className="j-checkbox">{intl.getHTML('v2.rewards.num', { value: p.periodKey })}</div>
                    <div className="reward-amount-col">
                      <div className="j-value">
                        {tokens.map((t, idx) => (
                          <React.Fragment key={t.token}>
                            {idx > 0 && ' + '}
                            {renderSplitAmount(formatRewardAmount(t), t.token, t.amount)}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                    <div className="claim-btn-col">
                      <button
                        className={'j-btn j-supply' + (isSigning ? ' j-signing' : '')}
                        disabled={isSigning}
                        onClick={() => onClaimPeriod(p)}
                      >
                        {intl.get('v2.rewards.claim')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
});

export default MiningPeriodsModal;
