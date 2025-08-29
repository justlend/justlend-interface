import { Tooltip } from 'antd';
import { inject, observer } from 'mobx-react';
import React from 'react';
import intl from 'react-intl-universal';
import compoundedRewardIcon from '../../../assets/images/v2/compounded-reward.png';
import fireIcon from '../../../assets/images/v2/fire.svg';
import TooltipIcon from '../../../assets/images/v2/tooltip-icon.svg';
import TooltipIconWhite from '../../../assets/images/v2/white-theme/tooltip-icon.svg';
import config from '../../../config';
import { BigNumber, formatNumber, tooltip } from '../../../utils/helper';
import { TooltipText } from '../strx/TooltipText';
import arrowRightPurple from '../../../assets/images/arrow-right-purple.svg';
const { miningSymbol } = config;
@inject('network')
@inject('lend')
@observer
class NetValue extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      collapsed: false
    };
  }

  render() {
    let netAPY = BigNumber(this.props.lend.netAPY).times(100);
    const {
      userDepositDataSource: supplyList,
      userLendDataSource: borrowingList,
      netWorth,
      theme,
      totalBorrowUsdForUSDD
    } = this.props.lend;
    let totalDeposit = BigNumber(0);
    let totalLend = BigNumber(0);

    if (supplyList && supplyList.length > 0) {
      supplyList.map((item, index) => {
        if (item.jtokenAddress === config.usddJtoken || item.jtokenAddress === config.usddoldJtoken) {
          totalDeposit = totalDeposit.plus(item.deposited);
        } else {
          totalDeposit = totalDeposit.plus(item.deposited_usd);
        }
      });
    }
    if (!BigNumber(totalBorrowUsdForUSDD).isNaN()) {
      totalLend = totalBorrowUsdForUSDD;
    }

    const { isConnected } = this.props.network;
    const isWhite = theme === 'white';
    const link = 'https://support.justlend.org/hc/en-us/articles/6997270186393';

    return (
      <section className="net-value">
        <div className="column tooltip-text-wrap">
          <div className="p">
            <TooltipText
              overlayClassName="j-tooltip-dropdown"
              // title={intl.get('v2.net_apy_tip')}
              title={tooltip(intl.get('v2.net_apy_tip1'), [
                // {
                //   title: intl.get('v2.net_apy_tip2', { miningSymbol }),
                //   link,
                //   linkText: intl.get('v2.net_apy_tip3'),
                //   linkIcon: arrowRightPurple
                // },
                { title: intl.get('v2.net_apy_tip4') },
                {
                  title: intl.get('v2.net_apy_tip5'),
                  iconContent: [
                    {
                      content: intl.get('v2.net_apy_tip6')
                    },
                    {
                      content: intl.get('v2.net_apy_tip7'),
                      icon: fireIcon
                    },
                    {
                      content: intl.get('v2.net_apy_tip8'),
                      icon: compoundedRewardIcon
                    }
                  ]
                }
              ])}
              placement="topRight"
              arrowPointAtCenter
            >
              <span className="fz12 gray">{intl.get('v2.net_apy')}</span>
            </TooltipText>
            <Tooltip
              overlayClassName="j-tooltip-dropdown"
              // title={intl.get('v2.net_apy_tip')}
              title={tooltip(intl.get('v2.net_apy_tip1'), [
                // {
                //   title: intl.get('v2.net_apy_tip2', { miningSymbol }),
                //   link,
                //   linkText: intl.get('v2.net_apy_tip3'),
                //   linkIcon: arrowRightPurple
                // },
                { title: intl.get('v2.net_apy_tip4') },
                {
                  title: intl.get('v2.net_apy_tip5'),
                  iconContent: [
                    {
                      content: intl.get('v2.net_apy_tip6')
                    },
                    {
                      content: intl.get('v2.net_apy_tip7'),
                      icon: fireIcon
                    },
                    {
                      content: intl.get('v2.net_apy_tip8'),
                      icon: compoundedRewardIcon
                    }
                  ]
                }
              ])}
              placement="bottom"
              arrowPointAtCenter
            >
              <img src={isWhite ? TooltipIconWhite : TooltipIcon} alt="" className="j-tooltip-icon" />
            </Tooltip>
          </div>
          <div className="p white fz18 weight">
            {/* {(supplyList?.length > 0 || borrowingList?.length > 0) && isConnected
              ? netAPY.eq(0)
                ? 0
                : netAPY.gt(0)
                ? netAPY.gt(0.01)
                  ? formatNumber(netAPY, 2, { cutZero: false, per: true })
                  : 0.01
                : netAPY.lt(0) && netAPY.lt(-0.01)
                ? formatNumber(netAPY, 2, { cutZero: false, per: true })
                : -0.01
              : '--'} */}
            {(supplyList?.length > 0 || borrowingList?.length > 0) && isConnected
              ? formatNumber(netAPY, 2, { cutZero: false, per: true, showNegative: true })
              : '--'}
            %
          </div>
        </div>
        <div className="mt17 column tooltip-text-wrap">
          <div className="p">
            <TooltipText
              overlayClassName="j-tooltip-dropdown"
              title={intl.get('v2.net_worth_tip')}
              placement="topRight"
              arrowPointAtCenter
            >
              <span className="fz12 gray">{intl.get('v2.net_worth')}</span>
            </TooltipText>
            <Tooltip
              overlayClassName="j-tooltip-dropdown"
              title={intl.get('v2.net_worth_tip')}
              placement="bottom"
              arrowPointAtCenter
            >
              <img src={isWhite ? TooltipIconWhite : TooltipIcon} alt="" className="j-tooltip-icon" />
            </Tooltip>
          </div>
          <div className="p">
            <span className="white fz18 weight tar mr-0">
              {(supplyList?.length > 0 || borrowingList?.length > 0) && isConnected
                ? `$${formatNumber(BigNumber(totalDeposit).minus(totalLend), 2, { cutZero: false })}`
                : '--'}
            </span>
          </div>
        </div>
      </section>
    );
  }
}

export default NetValue;
