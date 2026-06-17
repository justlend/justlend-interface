import { getMockClaimMeta, markMockPeriodClaimed } from '../../service/mock/mining';

export const sendMockClaimPeriod = (period, { onPending, onSuccess } = {}) => {
  const periodKey = typeof period === 'string' ? period : period?.periodKey;
  const { delayMs, txHash } = getMockClaimMeta();
  if (typeof onPending === 'function') onPending(txHash);
  return new Promise(resolve => {
    setTimeout(() => {
      markMockPeriodClaimed(periodKey);
      if (typeof onSuccess === 'function') onSuccess(txHash);
      resolve({ status: 'success', txHash, periodKey });
    }, delayMs);
  });
};
