import React from 'react';
import isMobile from 'ismobilejs';
import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';
import { Table, Progress, Tooltip } from 'antd';
import SwapModal from '../../swap/Modal';
import Config from '../../../config';
import { formatNumber, BigNumber } from '../../../utils/helper';
import { getTimeNow } from '../../../utils/backend';

import { ICONS_MAP } from '../../../utils/constant';
import '../../../assets/css/mining-row.scss';

@inject('network')
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
      let { multyStart } = this.props.network;
      const res = await getTimeNow();
      if (res.success) {
        const nowTime = res.time;
        if (nowTime < Config.startTime) {
          multyStart = false;
        } else if (nowTime >= Config.startTime) {
          multyStart = true;
        }
        this.props.network.setData({ nowTime, multyStart });

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
    if (this.props.network.nowTime >= Config.latestStartTime + 10000) {
      window.localStorage.setItem('nowTime', this.props.network.nowTime);
      return;
    }
    if (this.props.network.nowTime === null) {
      await this.getNowTime();
    } else {
      const nowTime = this.props.network.nowTime + 1000;
      this.props.network.setData({
        nowTime,
        multyStart: nowTime > Config.startTime
      });
    }
    setTimeout(async () => {
      this.getCountTime();
    }, 1000);
  };

  cancelModal = () => {
    this.setState({ modalVisible: false });
  };

  endStake = async cardData => {
    window.gtag('event', 'PC_claim_withdraw', { 'event_category': 'PC_V1.5', 'event_label': 'claim_withdraw' });
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

    const txID = await this.props.system.yamWithdraw(
      cardData,
      cardData.staked.times(cardData.precision).toString(),
      intlObj,
      options
    );
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
    const { multyStart, nowTime } = this.props.network;
    const { cardData } = this.props;

    return BigNumber(cardData.staked).gt(0) ? (
      <div className="j-mining-row">
        <div className="mining-tip">
          <span>{intl.get('v2.tip6')}</span>
        </div>
        {Config.activeSwaps.map(id => (
          <div className="flex mining-rows" key={id}>
            <div className="flex ai-center">
              <div className="img-block">
                <img src={ICONS_MAP[cardData.lp.toLowerCase()]} alt="token" className="token" />
                <img src={ICONS_MAP['trx']} alt="trx" className="trxToken" />
              </div>
              <div className="row-symbol">
                <div>{cardData.symbol} </div>
                {nowTime > cardData.end && <div> {intl.get('v2.get_out')}</div>}
              </div>
            </div>
            <div className="row-token">
              {formatNumber(cardData.staked, Config.defaultDecimal)} {cardData.symbol}
              {/* {' + '} {formatNumber(cardData.trxAmount, Config.defaultDecimal)} {'TRX'} */}
            </div>
            <div className="btn">
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
              ) : multyStart ? (
                BigNumber(cardData.staked).gt(0) ? (
                  <button className="j-btn j-supply" onClick={() => this.openModal(cardData)}>
                    {intl.get('v2.deposit_withdraw')}
                  </button>
                ) : (
                  <button className="j-btn j-supply" onClick={() => this.openModal(cardData)}>
                    {intl.get('v2.deposit_withdraw')}
                  </button>
                )
              ) : (
                <button className="j-btn j-supply" disabled>
                  {intl.get('lend.coming')}
                </button>
              )}
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
