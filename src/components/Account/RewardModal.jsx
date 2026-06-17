import React from 'react';
import { observer } from 'mobx-react';
import intl from 'react-intl-universal';
import { Modal } from 'antd';
import Stores from '../../stores';
import Config from '../../config';
import { BigNumber, formatNumber } from '../../utils/helper';
import { getLendIcons } from '../../utils/constant';
import emptyImg from '../../assets/images/v2/nodata-icon.svg';
import emptyImgWhite from '../../assets/images/v2/white-theme/nodata-icon.svg';
import CloseIcon from '../../assets/images/v2/account/white-close.svg';
import CloseIconWhite from '../../assets/images/v2/white-theme/modal-close.svg';

const { miningSymbol } = Config;

const RewardModal = observer(props => {
  const { ui, lend, user, market } = Stores;

  const { theme, openMint } = lend;
  const { marketDataSource } = market;
  const { inFreeze, transferringSoon, allMiningInfo, globalSettlementStatus } = user;
  const { rewardModalShow } = ui;

  const tokens = Object.fromEntries(marketDataSource.map(item => [item.jtokenAddress, item]));
  let totalMiningrewards = BigNumber(inFreeze).plus(transferringSoon);

  const hasCurrEndTimeArr = Object.values(allMiningInfo)?.filter(
    item => BigNumber(item?.tokenGainLastAll)?.gt(0) || BigNumber(item?.tokenGainNewAll)?.gt(0)
  );
  const isWhite = theme === 'white';

  let allDataSource = Object.values(allMiningInfo);
  let currentData = allDataSource.length > 0 ? allDataSource.filter(item => BigNumber(item.tokenGainNewAll).gt(0)) : [];
  let previousData =
    allDataSource.length > 0 ? allDataSource.filter(item => BigNumber(item.tokenGainLastAll).gt(0)) : [];

  return (
    <Modal
      title={intl.get('waiting_reward_title')}
      footer={null}
      onCancel={() => ui.setRewardModalShow(false)}
      className={`account-invest-modal reward ${Object.keys(allMiningInfo)?.length > 0 ? '' : 'empty-body'}${
        theme === 'white' ? ' white' : ''
      }`}
      visible={rewardModalShow}
      width={400}
      centered
      closeIcon={<img alt="" src={isWhite ? CloseIconWhite : CloseIcon} />}
    >
      {Object.keys(allMiningInfo).length > 0 && (
        <div className="reward-modal-container">
          {currentData?.length > 0 && (
            <section className="reward-modal-main">
              <div className="current-income">
                <span className="current-income-key">{intl.get('v2.this_round')}</span>
                <div className="flex jcsb aic">
                  <span className="current-income-val">
                    {globalSettlementStatus
                      ? '--'
                      : formatNumber(totalMiningrewards, 6, { miniText: '0.01', needDolar: true })}
                  </span>
                  <span className="j-accruing">{intl.get('v2.accruing')}</span>
                </div>
              </div>

              {!globalSettlementStatus &&
                Object.values(allMiningInfo).map((item, index) => {
                  const { tokenGainNewAll, tokenAddress } = item;
                  if (BigNumber(tokenGainNewAll).gt(0))
                    return (
                      <div className={'rewards-box' + (index === 0 ? ' mt-0' : '')} key={index}>
                        <div className="rewards-title">
                          <img
                            src={tokens[tokenAddress]?.logoUrl}
                            alt=""
                            onError={e => {
                              e.target.onerror = null;
                              e.target.src = getLendIcons(tokens[tokenAddress]?.collateralSymbol);
                            }}
                          />
                          <span>
                            {intl.get('deposit_mining', {
                              'symbol': tokens[tokenAddress]?.collateralSymbol
                            })}
                          </span>
                        </div>
                        <div className="reward-value">
                          <span>{formatNumber(tokenGainNewAll, 3, { miniText: '0.001' })}</span> {miningSymbol}
                        </div>
                      </div>
                    );
                })}
              {openMint && (
                <div className="closure-time">
                  <span>{intl.getHTML('v2.settlement_time', { date: hasCurrEndTimeArr[0]?.tokenCurrEndTime })} </span>
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {Object.keys(allMiningInfo)?.length > 0 ? (
        <>
          <div className="ab-shadow"></div>
          <div className="tips">
            <p>{intl.getHTML('waiting_reward_footer')}</p>
          </div>
        </>
      ) : (
        <div className="empty">
          <img src={isWhite ? emptyImgWhite : emptyImg} alt="" />
          <p>{intl.getHTML('current_no_rewards')}</p>
        </div>
      )}
    </Modal>
  );
});

export default RewardModal;
