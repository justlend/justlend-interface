import React from 'react';
import { inject, observer } from 'mobx-react';
import intl from 'react-intl-universal';
import { Tooltip } from 'antd';
import '../../../assets/css/v2/energy-rental/energy-subsidy-bar.scss';
import { BigNumber, formatNumber, getQueryObj } from '../../../utils/helper';
import NotifyImg from '../../../assets/images/v2/energy-rental/subsidy.svg';
import NotifyImgWhiteTheme from '../../../assets/images/v2/energy-rental/subsidy-white-theme.svg';

@inject('network')
@inject('lend')
@inject('energyRental')
@observer
class EnergySubsidyBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: getQueryObj()?.lang || window.localStorage.getItem('lang') || intl.options.currentLocale
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
    const { isConnected } = this.props.network;
    const { theme } = this.props.lend;
    const {
      totalReward,
      multiRewardData,
      userData: {
        rewardMap: { gainNew, gainLast, miningStatus, currPhase, currRewardStatus }
      }
    } = this.props.energyRental;

    const isWhite = theme === 'white';

    const unclaimShow =
      isConnected &&
      (BigNumber(gainNew).gt(0) ||
        Object.keys(multiRewardData).length > 0 ||
        (BigNumber(gainLast).gt(0) && miningStatus == '2'));

    const processing = isConnected && (BigNumber(gainNew).gt(0) || (BigNumber(gainLast).gt(0) && miningStatus == '2'));

    const gainLastStatus = currRewardStatus == '1' && miningStatus == '2';

    const gainNewValue = formatNumber(gainNew, 6, {
      miniText: '0.000001'
    });

    const gainLastValue = formatNumber(gainLast, 6, {
      miniText: '0.000001'
    });

    const gainNewTobeClaimed = BigNumber(gainNew).gt(0)
      ? formatNumber(BigNumber(gainNew).plus(totalReward), 6, {
          miniText: '0.000001'
        })
      : formatNumber(BigNumber(totalReward), 6, {
          miniText: '0.000001'
        });

    const gainLastTobeClaimed = BigNumber(gainLast).gt(0)
      ? formatNumber(BigNumber(gainLast).plus(totalReward), 6, {
          miniText: '0.000001'
        })
      : formatNumber(BigNumber(totalReward), 6, {
          miniText: '0.000001'
        });

    return (
      // Remove unclaim class and fix css
      <div
        className={
          'energy-subsidy-bar section-content-container unclaim' +
          (unclaimShow ? ' ' : ' hidden') +
          (currRewardStatus == '2' ? ' status' : '')
        }
      >
        <div className="flexA">
          <img alt="" src={isWhite ? NotifyImgWhiteTheme : NotifyImg} className="notify" />
          <div className="value">
            {totalReward === '--' || (gainNew === '--' && gainLast === '--') ? (
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
              className="claim-btn purple-link-btn hover"
              onClick={() => {
                this.props.network.setData({
                  'allowanceVisible': true
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
              title={intl.getHTML('v2.rewards.processing', { value: Number(currPhase) - 1 })}
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
export default EnergySubsidyBar;
