import { Tooltip } from 'antd';
import { observer } from 'mobx-react';
import React from 'react';
import intl from 'react-intl-universal';
import Stores from '../../stores';
import { BigNumber, formatNumber } from '../../utils/helper';
import config, { Config } from '../../config';
import TooltipIcon from '../../assets/images/v2/tooltip-icon.svg';
import TooltipIconWhite from '../../assets/images/v2/white-theme/tooltip-icon.svg';
import { TooltipText } from '../v2/strx/TooltipText';

const NetValue = observer(props => {
  const { network, lend, user } = Stores;

  const { userDepositDataSource: supplyList, userLendDataSource: borrowingList, totalBorrowUsdForUSDD } = user;
  const { theme } = lend;
  const { isConnected } = network;
  const isWhite = theme === 'white';
  let netAPY = BigNumber(user.netAPY).times(100);
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

  return (
    <section className="net-value">
      <div className="column tooltip-text-wrap">
        <div className="p">
          <TooltipText
            overlayClassName="j-tooltip-dropdown"
            title={intl.getHTML('v2.net_apy_tip1', { link: Config.netAPYLink })}
            placement="topRight"
            arrowPointAtCenter
          >
            <span className="fz12 gray">{intl.get('v2.net_apy')}</span>
          </TooltipText>
          <Tooltip
            overlayClassName="j-tooltip-dropdown"
            title={intl.getHTML('v2.net_apy_tip1', { link: Config.netAPYLink })}
            placement="bottom"
            arrowPointAtCenter
          >
            <img src={isWhite ? TooltipIconWhite : TooltipIcon} alt="" className="j-tooltip-icon" />
          </Tooltip>
        </div>
        <div className="p white fz18 weight">
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
            title={intl.getHTML('v2.net_worth_tip', { link: Config.netAPYLink })}
            placement="topRight"
            arrowPointAtCenter
          >
            <span className="fz12 gray">{intl.get('v2.net_worth')}</span>
          </TooltipText>
          <Tooltip
            overlayClassName="j-tooltip-dropdown"
            title={intl.getHTML('v2.net_worth_tip', { link: Config.netAPYLink })}
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
});

export default NetValue;
