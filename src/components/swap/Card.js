import React from 'react';
import isMobile from 'ismobilejs';
import { inject, observer } from 'mobx-react';
import intl from 'react-intl-universal';
import moment from 'moment';
import SwapModal from './Modal';
import { Tooltip, Modal } from 'antd';
import Config from '../../config';
import {
  formatNumber,
  BigNumber,
  getPoolTotalAPY,
  renderGiftIcon,
  getMiningRewards,
  renderGain
} from '../../utils/helper';
import { getAPY } from '../../utils/blockchain';
import '../../assets/css/swap.scss';
import gift from '../../assets/images/gift.svg';
import tooltip from '../../assets/images/tooltip.svg';
import { ICONS_MAP } from '../../utils/constant';

@inject('network')
@inject('system')
@inject('pool')
@observer
class SwapCard extends React.Component {
  constructor(props) {
    super(props);
    this.unmount = false;
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      mobile: isMobile(window.navigator).any,
      modalVisible: false,
      defaultKey: '1',
      tokenVisible: false
    };
  }

  componentDidMount = async () => {
    this.unmount = false;

    // this.getCountTime();
  };

  componentWillUnmount = () => {
    this.unmount = true;
  };

  openModal = async defaultKey => {
    const { cardData } = this.props;
    await this.props.pool.getTokenBalanceOf(cardData);
    if (defaultKey) {
      this.setState({ defaultKey }, () => {
        this.setState({ modalVisible: true });
      });
    } else {
      this.setState({ modalVisible: true });
    }
  };

  cancelModal = () => {
    this.setState({ modalVisible: false });
  };

  openTokenModal = () => {
    this.setState({ tokenVisible: true });
  };

  cancelTokenModal = () => {
    this.setState({ tokenVisible: false });
  };

  endStake = async clickEnable => {
    if (!clickEnable) return;

    let { cardData } = this.props;

    const intlObj = {
      title: 'stake.unstake',
      obj: {
        value: formatNumber(cardData.staked, Config.defaultDecimal),
        token: cardData.symbol
      }
    };

    const txID = await this.props.system.yamWithdraw(
      cardData,
      cardData.staked.times(cardData.precision).toString(),
      intlObj
    );
    if (txID) {
      setTimeout(() => {
        this.props.pool.getTokenBalanceOf(cardData);
        this.props.pool.getPoolData();
      }, 5000);
    }
  };

  renderGiftApy = (cardData, tronBull, item) => {
    try {
      const { pool, end } = cardData;
      let { symbol } = item;
      symbol = `${symbol}NEW`;
      const { nowTime } = this.props.network;
      const { realStartTime } = Config;
      if (nowTime > end) {
        return <span className="item-perent ellipsis">--</span>;
      }
      if (tronBull && tronBull[pool] && tronBull[pool][symbol]) {
        const apy = BigNumber(tronBull[pool][symbol]).times(1.2).times(100);
        if (apy.lte(0) && nowTime > realStartTime) {
          return (
            <span className="item-perent ellipsis">
              {'> '}
              {Config.maxAPY}
              {'%'}
            </span>
          );
        }
        if (apy.gt(Config.maxAPY) && nowTime > realStartTime) {
          return (
            <span className="item-perent ellipsis">
              {'> '}
              {Config.maxAPY}
              {'%'}
            </span>
          );
        }
        return (
          <span className="item-perent ellipsis">
            {formatNumber(apy, 2, { per: true, miniText: '0.01', gt0: true })}%
          </span>
        );
      }
      return <span className="item-perent ellipsis">--</span>;
    } catch (err) {
      console.log(err);
      return '--';
    }
  };

  renderGiftItem = (cardData, nowTime, tronBull, item, index) => {
    const { giftStart = Config.startTime, giftEnd = Config.endTime } = item;

    if (nowTime >= giftStart && nowTime <= giftEnd) {
      return (
        <div className="gift-item flexB" key={index}>
          <span className="item-name flexB">
            <img className="item-icon" src={ICONS_MAP[item.symbol.toLowerCase()]}></img>
            {item.symbol}
          </span>
          {this.renderGiftApy(cardData, tronBull, item)}
        </div>
      );
    }
    return (
      <div className="gift-item flexB" key={index}>
        <span className="item-name flexB">
          <img className="item-icon" src={ICONS_MAP[item.symbol.toLowerCase()]}></img>
          {item.symbol}
        </span>
        {'--'}
      </div>
    );
    // return <React.Fragment key={index}></React.Fragment>;
  };

  renderGift = cardData => {
    const { tronBull } = this.props.pool;
    const { nowTime } = this.props.network;
    const { start } = cardData;
    return (
      <>
        {cardData.gift &&
          cardData.gift.map((item, index) => {
            return this.renderGiftItem(cardData, nowTime, tronBull, item, index);
          })}
      </>
    );
  };

  renderTotalApyToolTips = (cardData, tronBull) => {

    return cardData.gift.map((item, index) => {
      return (
        <div className="r" key={index}>
          {item.symbol + ': '}
          {this.renderGiftApy(cardData, tronBull, item)}
        </div>
      );
    });
  };

  render() {
    const { lang, modalVisible, defaultKey, tokenVisible } = this.state;
    let { cardData } = this.props;
    let { end } = cardData;
    const { tronBull, tronbullish, tokenPrices } = this.props.pool;
    const { multyStart, nowTime, isConnected } = this.props.network;
    const exitEnable =
      isConnected &&
      (cardData.staked._toBg().gt(0) || cardData.trxClaimed._toBg().gt(0) || cardData.tokenClaimed._toBg().gt(0));
    return (
      <>
        <section className={'multiple-claimed-card'}>
          {nowTime > end ? (
            <>
              <div className="over">{intl.get('pool.over')}</div>
              <div className="header flexB">
                <div className="flex">
                  <div className="img-block">
                    <img src={ICONS_MAP[cardData.lp.toLowerCase()]} alt="token" className="token" />
                    <img src={ICONS_MAP['trx']} alt="trx" className="trxToken" />
                  </div>
                  <div className="title">
                    <div>{cardData.symbol.replace('/', '-')}</div>
                    <div className="item-name">
                      {intl.get('century.tip2')}
                      {renderGiftIcon(cardData, nowTime)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="end-time red">
                {moment(cardData.end).format('YYYY.MM.DD HH:mm:ss')} {'GMT+8'} {intl.get('pool.end')}
              </div>

              <div className="basement-locked flexB">
                <span>{intl.get('home.locked')}</span>
                <Tooltip
                  placement="top"
                  color="rgba(27,31,38,0.90)"
                  getPopupContainer={() => document.getElementsByClassName('pool-container')[0]}
                  title={
                    <div className="account-tooltip-text">
                      <div className="r">
                        {multyStart ? formatNumber(cardData.tokenAmount, 0) : '--'} {cardData.lp}
                      </div>
                      <div className="r">
                        {multyStart ? formatNumber(cardData.trxAmount, 0) : '--'} {'TRX'}
                      </div>
                    </div>
                  }
                >
                  <span className="locked">
                    {multyStart ? formatNumber(cardData.totalUSD, 0, { needDolar: true }) : '--'}
                  </span>
                </Tooltip>
              </div>

              {multyStart && (
                <div className="my-container">
                  <div className="flexB">
                    <div>{intl.get('home.my_staking')}</div>
                    <div>
                      {formatNumber(cardData.staked, Config.defaultDecimal)} {cardData.symbol}
                    </div>
                  </div>
                  <div className="flexB">
                    <div>{intl.get('home.mining_rewards')}</div>
                    <div className="earned-link">
                      <span className="earned">
                        {getMiningRewards(cardData, tronbullish, 'swap', { gt0: false }, tokenPrices)}
                      </span>
                      <span className="link" onClick={() => this.openModal('2')}>
                        {' '}
                        {intl.get('home.detail')}
                        {' >'}
                      </span>
                    </div>
                  </div>
                  {modalVisible && (
                    <SwapModal
                      visible={modalVisible}
                      onCancel={this.cancelModal}
                      cardData={cardData}
                      defaultKey={defaultKey}
                      end={nowTime > end}
                    />
                  )}
                </div>
              )}
              <div className="lend-modal-bottom">
                <button disabled={!exitEnable} onClick={() => this.endStake(exitEnable)}>
                  {intl.get('pool.unlock_withdraw')}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="header flexB">
                <div className="flex">
                  <div className="img-block">
                    <img src={ICONS_MAP[cardData.lp.toLowerCase()]} alt="token" className="token" />
                    <img src={ICONS_MAP['trx']} alt="trx" className="trxToken" />
                  </div>
                  <div className="title">
                    <div>{cardData.symbol.replace('/', '-')}</div>
                    <div className="item-name">
                      {intl.get('century.tip2')}
                      {renderGiftIcon(cardData, nowTime)}
                    </div>
                  </div>
                </div>
                <div className="swap-apy">
                  <div>{intl.get('home.total_apy')}</div>
                  {cardData.gift && cardData.gift.length > 1 ? (
                    <Tooltip
                      placement="top"
                      color="rgba(27,31,38,0.90)"
                      title={
                        <div className="account-tooltip-text">
                          <div className="r">{intl.get('home.total_apy_title')}</div>
                          {this.renderTotalApyToolTips(cardData, tronBull)}
                        </div>
                      }
                    >
                      <div>{multyStart ? getPoolTotalAPY(cardData, tronBull) : '--'}</div>
                    </Tooltip>
                  ) : (
                    <div>{multyStart ? getPoolTotalAPY(cardData, tronBull) : '--'}</div>
                  )}
                </div>
              </div>
              <div className="basement-locked flexB">
                <span>{intl.get('home.locked')}</span>
                <Tooltip
                  placement="top"
                  color="rgba(27,31,38,0.90)"
                  getPopupContainer={() => document.getElementsByClassName('pool-container')[0]}
                  title={
                    <div className="account-tooltip-text">
                      <div className="r">
                        {multyStart ? formatNumber(cardData.tokenAmount, 0) : '--'} {cardData.lp}
                      </div>
                      <div className="r">
                        {multyStart ? formatNumber(cardData.trxAmount, 0) : '--'} {'TRX'}
                      </div>
                    </div>
                  }
                >
                  <span className="locked">
                    {multyStart ? formatNumber(cardData.totalUSD, 0, { needDolar: true }) : '--'}
                  </span>
                </Tooltip>
              </div>
              <div className="container">
                <div className="flexB container-title">
                  <span>
                    {intl.get('home.mining_package')}
                    <span>{intl.getHTML('home.stake_rewards', { value: cardData.symbol.replace('/', '-') })}</span>
                  </span>
                  <img src={gift} />
                </div>
                <div className="gift-list flexB">{this.renderGift(cardData)}</div>

                {modalVisible && (
                  <SwapModal
                    visible={modalVisible}
                    onCancel={this.cancelModal}
                    cardData={cardData}
                    defaultKey={defaultKey}
                  />
                )}
              </div>
              {multyStart && (
                <div className="my-container">
                  <div className="flexB">
                    <div>{intl.get('home.my_staking')}</div>
                    <div>
                      {formatNumber(cardData.staked, Config.defaultDecimal)} {cardData.symbol}
                    </div>
                  </div>
                  <div className="flexB">
                    <div>{intl.get('home.mining_rewards')}</div>
                    <div className="earned-link">
                      <span className="earned">
                        {getMiningRewards(cardData, tronbullish, 'swap', { gt0: false }, tokenPrices)}
                      </span>
                      <span className="link" onClick={() => this.openModal('2')}>
                        {' '}
                        {intl.get('home.detail')}
                        {' >'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div className={'footer ' + (multyStart ? (BigNumber(cardData.staked).gt(0) ? 'green' : '') : 'gray')}>
                <a
                  className={'link' + (BigNumber(cardData.locked).gt(0) ? 'green' : '')}
                  href={`${Config.sunSwap}?lang=${lang}${cardData.symbol === 'TRX' ? '' : `?tokenAddress=${cardData.tokenAddress}&type=add`
                    }`}
                  target="_blank"
                >
                  {intl.get('home.get')} {cardData.symbol.replace('/', '-')}
                </a>
                <div className="btn">
                  {multyStart ? (
                    BigNumber(cardData.staked).gt(0) ? (
                      <button className="" onClick={() => this.openModal()}>
                        {intl.get('home.manage')}
                      </button>
                    ) : (
                      <button className="green" onClick={() => this.openModal()}>
                        {intl.get('home.select')}
                      </button>
                    )
                  ) : (
                    <button className="" disabled>
                      {intl.get('lend.coming')}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
        <Modal
          visible={tokenVisible}
          title={''}
          width={540}
          footer={null}
          className="token-modal new-token-modal"
          onCancel={this.cancelTokenModal}
        >
          <div>
            <div className="token-title">{intl.get('tab.my_withdrawn')}</div>
            <div className="between token-sub-title">
              <span className="name">{intl.get('tab.claim_title')}</span>
              <span className="name">
                <span className="value">
                  {getMiningRewards(cardData, tronbullish, 'swap', { gt0: false }, tokenPrices)}
                </span>
              </span>
            </div>
            <div className="claim-detail">
              <div className="flexB claim-title">
                <span>{intl.get('card_modal_add.currency')}</span>
                <span>
                  {intl.get('card_modal_add.upcoming')}
                  <Tooltip title={intl.get('card_modal_add.upcoming_tip')} arrowPointAtCenter>
                    <img src={tooltip} />
                  </Tooltip>
                </span>
                <span>
                  {intl.get('card_modal_add.frozen')}
                  <Tooltip title={intl.get('card_modal_add.frozen_tip')} placement="topRight" arrowPointAtCenter>
                    <img src={tooltip} />
                  </Tooltip>
                </span>
              </div>
              {renderGain(cardData, nowTime, tronbullish, { gt0: false })}
            </div>
          </div>
        </Modal>
      </>
    );
  }
}

export default SwapCard;
