import React from 'react';
import isMobile from 'ismobilejs';
import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';
import { Table, Progress, Tooltip } from 'antd';
import SwapModal from '../../../Modals/swap/Modal';
import Config from '../../../../config';
import { formatNumber, BigNumber } from '../../../../utils/helper';
import { getTimeNow } from '../../../../utils/backend';
import { ICONS_MAP } from '../../../../utils/constant';
import JSTTRX from '../../../../assets/images/v2/mobile/jst-trx.png';
import JSTTRXWhite from '../../../../assets/images/v2/mobile/jst-trx-white.png';

@inject('network')
@inject('app')
@inject('lend')
@inject('pool')
@inject('system')
@observer
class MiningRow extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      toast: !window.localStorage.getItem('hideWarningTips'),
      mobile: isMobile(window.navigator).any,
      modalVisible: false,
      defaultKey: '1'
    };
  }
  componentDidMount = async () => {
    await this.getNowTime();
    this.getCountTime();
  };

  getNowTime = async () => {
    try {
      const res = await getTimeNow();
      if (res.success) {
        const nowTime = res.time;
        this.props.app.setNowTime(nowTime);

        if (nowTime >= Config.latestStartTime + 10000) {
          window.localStorage.setItem('nowTime', nowTime);
          return;
        }
      }
      setTimeout(() => {
        this.getNowTime();
      }, 3000);
    } catch (error) {
      console.log('get time error', error);
      setTimeout(() => {
        this.getNowTime();
      }, 3000);
    }
  };

  getCountTime = async () => {
    if (this.props.app.nowTime >= Config.latestStartTime + 10000) {
      window.localStorage.setItem('nowTime', this.props.app.nowTime);
      return;
    }
    if (this.props.app.nowTime === null) {
      await this.getNowTime();
    } else {
      const nowTime = this.props.app.nowTime + 1000;
      this.props.app.setNowTime(nowTime);
    }
    setTimeout(async () => {
      this.getCountTime();
    }, 1000);
  };

  cancelModal = () => {
    this.setState({ modalVisible: false });
  };

  endStake = async cardData => {
    window.gtag('event', 'H5_claim_withdraw', { 'event_category': 'H5', 'event_label': 'claim_withdraw' });
    if (
      !(
        this.props.network.isConnected &&
        (cardData.staked._toBg().gt(0) || cardData.trxClaimed._toBg().gt(0) || cardData.tokenClaimed._toBg().gt(0))
      )
    )
      return;

    const intlObj = {
      title: 'stake.unstake',
      obj: {
        value: formatNumber(cardData.staked, Config.defaultDecimal),
        token: cardData.symbol
      }
    };

    const contractAddress = cardData.pool;
    const amount = cardData.staked.times(cardData.precision).toString();
    let funcSelector = 'withdrawAndGetReward(uint256)';
    let parameters = [{ type: 'uint256', value: amount }];
    const feeLimit = await this.props.system.getFeeLimitCommon(contractAddress, funcSelector, parameters);
    const options = { feeLimit };

    const txID = await this.props.system.yamWithdraw(cardData, amount, intlObj, options);
    if (txID) {
      setTimeout(() => {
        this.props.pool.getTokenBalanceOf(cardData);
        this.props.pool.getPoolData();
      }, 5000);
    }
  };

  openModal = async (cardData, defaultKey) => {
    // const { cardData } = this.props;
    await this.props.pool.getTokenBalanceOf(cardData);
    if (defaultKey) {
      this.setState({ defaultKey }, () => {
        this.setState({ modalVisible: true });
      });
    } else {
      this.setState({ modalVisible: true });
    }
  };

  render() {
    const { modalVisible, defaultKey } = this.state;
    const { nowTime } = this.props.app;
    const { theme } = this.props.lend;
    const { cardData } = this.props;

    return BigNumber(cardData.staked).gt(0) ? (
      <div className="j-mining-row">
        <div className="mining-tip">
          <span>{intl.get('v2.tip6')}</span>
        </div>

        {Config.activeSwaps.map(id => (
          <div className="j-home-supply-ele">
            <div className="j-hse">
              <div className="j-hse-logo">
                <div className="img-block">
                  <img src={theme === 'white' ? JSTTRXWhite : JSTTRX} />
                  {/* <img src={ICONS_MAP[cardData.lp.toLowerCase()]} alt="token" className="token" />
                  <img src={ICONS_MAP['trx']} alt="trx" className="trxToken" /> */}
                </div>
                <div className="row-symbol">
                  <div>{cardData.symbol} </div>
                  {nowTime > cardData.end && <div> {intl.get('v2.get_out')}</div>}
                </div>
              </div>
              <div>
                {nowTime > cardData.end ? (
                  <button
                    className="j-btn j-supply"
                    disabled={
                      !(
                        this.props.network.isConnected &&
                        (cardData.staked._toBg().gt(0) ||
                          cardData.trxClaimed._toBg().gt(0) ||
                          cardData.tokenClaimed._toBg().gt(0))
                      )
                    }
                    onClick={() => this.endStake(cardData)}
                  >
                    {intl.get('v2.deposit_withdraw')}
                  </button>
                ) : (
                  <button className="j-btn j-supply" onClick={() => this.openModal(cardData)}>
                    {intl.get('v2.deposit_withdraw')}
                  </button>
                )}
              </div>
            </div>

            <div className="j-hse">
              <div className="j-hse-position">
                <div className="sub-desc">{intl.get('v2.holder')}</div>
              </div>
              <div className="j-hse-position">
                <div className="main-desc">
                  {formatNumber(cardData.staked, Config.defaultDecimal)} {cardData.symbol}
                </div>
              </div>
            </div>
          </div>
        ))}
        {modalVisible && (
          <SwapModal
            visible={modalVisible}
            onCancel={this.cancelModal}
            cardData={cardData}
            defaultKey={defaultKey}
            end={nowTime > cardData.end}
          />
        )}
      </div>
    ) : null;
  }
}

export default MiningRow;
