import React from 'react';
import { inject, observer } from 'mobx-react';
import intl from 'react-intl-universal';
import { Tooltip } from 'antd';
import '../../../assets/css/v2/energy-subsidy.scss';
import Config from '../../../config';
import { BigNumber, formatNumber, getQueryObj } from '../../../utils/helper';
import isMobile from 'ismobilejs';
import { TooltipText } from './TooltipText';

@inject('network')
@inject('lend')
@inject('strx')
@observer
class EnergySubsidy extends React.Component {
  constructor(props) {
    super();
    this.state = {
      lang: getQueryObj()?.lang || window.localStorage.getItem('lang') || intl.options.currentLocale,
      mobile: isMobile(window.navigator).any
    };
  }

  getAnnouncementUrl = () => {
    const { lang } = this.state;

    const announcementUrl =
      lang && lang.includes('en')
        ? 'https://support.justlend.org/hc/en-us/articles/19326031593497'
        : 'https://support.justlend.org/hc/zh-cn/articles/19326031593497';
    return announcementUrl;
  };

  render() {
    const { userData, multiRewardData, totalReward } = this.props.strx;
    const { isConnected } = this.props.network;
    const { rewardMap } = userData;
    const { mobile, lang } = this.state;
    const announcementUrl = this.getAnnouncementUrl();

    const unclaimShow =
      isConnected &&
      (BigNumber(rewardMap.gainNew).gt(0) ||
        Object.keys(multiRewardData).length > 0 ||
        (BigNumber(rewardMap.gainLast).gt(0) && rewardMap.miningStatus == '2'));

    return (
      <div
        className={
          'energy-subsidy' + (unclaimShow ? ' unclaim' : ' ') + (rewardMap.currRewardStatus == '2' ? ' status' : '')
        }
      >
        <div className={'top' + (lang === 'en-US' ? ' en' : '')}>
          <div className="energy-subsidy-discounts">
            <span className="energy-subsidy-discount1">{intl.getHTML('strx.energy_subsidy_discount1')}</span>
            <span className="energy-subsidy-discount2">{intl.get('strx.energy_subsidy_discount2')}</span>
          </div>
          <div className={'rules' + (lang === 'en-US' ? ' en' : '')}>
            <a
              href={announcementUrl}
              className="hover"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                window.gtag('event', 'subsidy_energyRulesLink', {
                  'event_category': 'sTRX',
                  'event_label': 'subsidy_energyRulesLink'
                });
              }}
            >
              {intl.get('strx.energy_subsidy_rules')}
              <em></em>
            </a>
          </div>
        </div>
        <div className="line"></div>
        <div className="bottom">
          <div className="claim-left">
            <div className="title">
              <TooltipText
                title={intl.getHTML('strx.energy_subsidy_rent_price_tip2')}
                placement="topLeft"
                arrowPointAtCenter
                overlayClassName="j-tooltip-dropdown"
              >
                {intl.get('strx.energy_subsidy_title')}
              </TooltipText>
              <Tooltip
                title={intl.getHTML('strx.energy_subsidy_rent_price_tip2')}
                placement="top"
                arrowPointAtCenter
                overlayClassName="j-tooltip-dropdown"
              >
                <span className="j-tooltip-icon ml-6" onMouseEnter={() => {}}></span>
              </Tooltip>
            </div>
            {rewardMap.currRewardStatus == '2' ? (
              <div className="value">{intl.get('v2.processing')}</div>
            ) : (
              <div className="value">
                <span>
                  {BigNumber(rewardMap.gainNew).plus(totalReward).gt(0) ? (
                    <SplitNumber
                      value={`${formatNumber(BigNumber(rewardMap.gainNew).plus(totalReward), 3, {
                        miniText: '0.001'
                      })} `}
                    ></SplitNumber>
                  ) : (
                    0
                  )}
                </span>
                <span className="postfix">JST</span>
                <span className="trx">
                  ≈{' '}
                  {BigNumber(rewardMap.gainNew).plus(totalReward).gt(0)
                    ? formatNumber(BigNumber(rewardMap.gainNew).plus(totalReward).times(rewardMap.price2Trx), 3, {
                        miniText: '0.001'
                      })
                    : 0}{' '}
                  TRX
                </span>
              </div>
            )}
          </div>
          {Object.keys(multiRewardData).length > 0 ? (
            <div
              className="claim-btn"
              onClick={() => {
                this.props.network.setData({
                  'allowanceVisible': true
                });
                window.gtag('event', 'subsidy_claim', {
                  'event_category': 'sTRX',
                  'event_label': 'subsidy_claim'
                });
              }}
            >
              <em></em> {intl.get('strx.energy_subsidy_claim_btn')}
            </div>
          ) : rewardMap.miningStatus == '2' && BigNumber(rewardMap.gainLast).gt(0) ? (
            <Tooltip
              className=""
              overlayClassName="j-tooltip-dropdown"
              placement="bottom"
              arrowPointAtCenter
              title={intl.getHTML('v2.rewards.processing', { value: Number(rewardMap.currPhase) - 1 })}
              trigger="['hover','click']"
            >
              <div className="claim-btn disabled">
                <em></em> {intl.get('strx.energy_subsidy_claim_btn')}
              </div>
            </Tooltip>
          ) : (
            <div className="claim-btn accruing">
              <em></em> {intl.get('strx.energy_subsidy_accruing_btn')}
            </div>
          )}
        </div>
      </div>
    );
  }
}
export default EnergySubsidy;

function SplitNumber(props) {
  const { value } = props;
  const [a, b] = value.split('.');
  return (
    <>
      <span className="highlight">{a}</span>
      {b ? (
        <span className="normal" style={{ fontSize: 12 }}>
          .{b}
        </span>
      ) : (
        ''
      )}
    </>
  );
}
