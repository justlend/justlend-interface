import React from 'react';
import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';

@inject('lend')
@observer
class BorrowDetailMobileTooltip extends React.Component {
  render() {
    const { dataList, getTooltipData } = this.props;
    const { lang, borrowDetailGraphIndex } = this.props.lend;

    const dataIndex = dataList.length - 1;
    var params = [{ dataIndex }, { dataIndex }];

    if (dataList && dataList.length > 0 && borrowDetailGraphIndex > 0) {
      const data = dataList[borrowDetailGraphIndex];
      params = [
        {
          axisValue: data.date,
          value: data.depositedAPY,
          dataIndex: borrowDetailGraphIndex
        },
        {
          axisValue: data.date,
          value: data.depositedUSD,
          dataIndex: borrowDetailGraphIndex
        }
      ];
    }

    const { dateText, borrowedAPY, borrowedUSD } = getTooltipData({
      params,
      lang,
      dataList
    });

    return (
      <div className="chart-tooltip chart-tooltip-fake interest-rate">
        <main>
          <div className="item">
            <span className="label color-light">{intl.get('market.detail_date')}</span>
            <div className="value-wrap">
              <span className="value date color-primary fs12">{dateText}</span>
            </div>
          </div>
          <div className="item">
            <span className="label color-light">{intl.get('market.borrow_apy')}</span>
            <div className="value-wrap">
              <span className="value borrow fs12">{borrowedAPY}%</span>
            </div>
          </div>
          <div className="item">
            <span className="label color-light">{intl.get('market.borrow_overview')}</span>
            <div className="value-wrap">
              <span className="value color-primary fs12">{borrowedUSD}</span>
            </div>
          </div>
        </main>
      </div>
    );
  }
}

export { BorrowDetailMobileTooltip };
