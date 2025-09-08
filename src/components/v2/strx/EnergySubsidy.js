import React from 'react';
import { inject, observer } from 'mobx-react';
import intl from 'react-intl-universal';
import { Tooltip } from 'antd';
import '../../../assets/css/v2/energy-subsidy.scss';
import Config from '../../../config';
import { BigNumber, formatNumber, getQueryObj } from '../../../utils/helper';
import isMobile from 'ismobilejs';
import { TooltipText } from './TooltipText';
import NotifyImg from '../../../assets/images/notify.svg';

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

    const unclaimShow =
      isConnected &&
      (BigNumber(rewardMap.gainNew).gt(0) ||
        Object.keys(multiRewardData).length > 0 ||
        (BigNumber(rewardMap.gainLast).gt(0) && rewardMap.miningStatus == '2'));

    const processing =
      isConnected &&
      (BigNumber(rewardMap.gainNew).gt(0) || (BigNumber(rewardMap.gainLast).gt(0) && rewardMap.miningStatus == '2'));

    // const gainNewStatus = BigNumber(rewardMap.gainNew).gt(0);
    // const gainNewStatus = rewardMap.currRewardStatus == '2' && rewardMap.miningStatus == '2';
    const gainLastStatus = rewardMap.currRewardStatus == '1' && rewardMap.miningStatus == '2';

    const gainNewValue = formatNumber(rewardMap.gainNew, 6, {
      miniText: '0.000001'
    });

    const gainLastValue = formatNumber(rewardMap.gainLast, 6, {
      miniText: '0.000001'
    });

    const gainNewTobeClaimed = BigNumber(rewardMap.gainNew).gt(0)
      ? formatNumber(BigNumber(rewardMap.gainNew).plus(totalReward), 6, {
          miniText: '0.000001'
        })
      : formatNumber(BigNumber(totalReward), 6, {
          miniText: '0.000001'
        });

    const gainLastTobeClaimed = BigNumber(rewardMap.gainLast).gt(0)
      ? formatNumber(BigNumber(rewardMap.gainLast).plus(totalReward), 6, {
          miniText: '0.000001'
        })
      : formatNumber(BigNumber(totalReward), 6, {
          miniText: '0.000001'
        });

    return (
      <div
        className={
          'energy-subsidy' + (unclaimShow ? ' unclaim' : ' ') + (rewardMap.currRewardStatus == '2' ? ' status' : '')
        }
      >
        <div className="flexA">
          <img alt="" src={NotifyImg} className="notify" />
          <div className="value">
            {totalReward === '--' || (rewardMap?.gainNew === '--' && rewardMap?.gainLast === '--') ? (
              '--'
            ) : BigNumber(totalReward).gt(0) ? (
              processing ? (
                <Tooltip
                  title={intl.get('strx.part_processing', {
                    value: gainLastStatus ? gainLastValue : gainNewValue
                  })}
                  placement="top"
                  arrowPointAtCenter
                  overlayClassName="j-tooltip-dropdown"
                >
                  {intl.get('strx.tobe_claimed', {
                    value: gainLastStatus ? gainLastTobeClaimed : gainNewTobeClaimed
                  })}
                </Tooltip>
              ) : (
                intl.get('strx.tobe_claimed', {
                  value: gainLastStatus ? gainLastTobeClaimed : gainNewTobeClaimed
                })
              )
            ) : processing ? (
              intl.get('strx.all_processing', {
                value: gainLastStatus ? gainLastTobeClaimed : gainNewTobeClaimed
              })
            ) : (
              0
            )}
          </div>
        </div>
        <div className="bottom">
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
              {intl.get('strx.claime')}
            </div>
          ) : (
            <Tooltip
              overlayClassName="j-tooltip-dropdown"
              placement="top"
              arrowPointAtCenter
              title={intl.getHTML('v2.rewards.processing', { value: Number(rewardMap.currPhase) - 1 })}
              trigger="['hover','click']"
            >
              <div className="claim-btn disabled">{intl.get('strx.claime')}</div>
            </Tooltip>
          )}
        </div>
      </div>
    );
  }
}
export default EnergySubsidy;
