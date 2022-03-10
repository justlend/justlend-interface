import React from 'react';
import isMobile from 'ismobilejs';
import intl from 'react-intl-universal';
import { Tabs, Tooltip } from 'antd';
import { inject, observer } from 'mobx-react';
import NavTable from './Common/NavTable';
const { TabPane } = Tabs;
import { formatNumber } from '../utils/helper';
import Config from '../config';
import Countdown from './countdown';
@inject('network')
@inject('lend')
@observer
class UserList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      lendActive: false
    };
  }

  render() {
    const { lang } = this.state;
    const { multyRealStart, btcstStart } = this.props.network;
    const { transferringSoon, inFreeze, userCurrencyData, userDepositDataSource, userLendDataSource } = this.props.lend;
    let depositLenth = '';
    if (userDepositDataSource && userDepositDataSource.length > 0) {
      depositLenth = '(' + userDepositDataSource.length + ')';
    }
    let lendLength = '';
    if (userLendDataSource && userLendDataSource.length > 0) {
      lendLength = '(' + userLendDataSource.length + ')';
    }
    let mintLength = '';

    // btcstStart
    if (userCurrencyData && userCurrencyData.length > 0) {
      mintLength = '(' + userCurrencyData.length + ')';
    }
    return (
      <div className="userList-container">
        <div className="userList-container-box">
          <Tabs defaultActiveKey="1" activeKey={this.state.activeKey}>
            <TabPane tab={`${intl.get('index.my_mydeposit')}${depositLenth}`} key="1">
              <NavTable type="deposit" />
            </TabPane>
            <TabPane tab={`${intl.get('index.my_myborrow')}${lendLength}`} key="2">
              <NavTable type="lend" />
            </TabPane>
            {multyRealStart && (
              <TabPane tab={`${intl.get('index.my_miningrewards')}${mintLength}`} key="3">
                <div className="mint-tip">
                  <div>
                    <Tooltip
                      title={
                        <>
                          <>{intl.get('index.my_detailRewards_soon_hover')}</>
                          <a href={lang === 'en-US' ? Config.noticeEn : Config.noticeCn} target="notice">
                            {intl.get('index.notice')}
                          </a>
                        </>
                      }
                      placement="topRight"
                      overlayClassName="tool-top-right"
                    >
                      <span className="with-logo">{intl.get('index.my_miningrewards_soon')}</span>
                    </Tooltip>
                    <span className="black">
                      {formatNumber(transferringSoon, 2, { miniText: 0.01, needDolar: true })}
                    </span>
                  </div>
                  <div className="ml-80">
                    <Tooltip
                      title={
                        <>
                          <>{intl.get('index.my_detailRewards_freeze_hover')}</>
                          <a href={lang === 'en-US' ? Config.noticeEn : Config.noticeCn} target="notice">
                            {intl.get('index.notice')}
                          </a>
                        </>
                      }
                      placement="topRight"
                      overlayClassName="tool-top-right"
                    >
                      <span className="with-logo">{intl.get('index.my_miningrewards_freeze')}</span>
                    </Tooltip>
                    <span className="black">{formatNumber(inFreeze, 2, { miniText: 0.01, needDolar: true })} </span>
                  </div>
                </div>
                <div className="mint-detail-title">{intl.get('index.my_detailRewards')}</div>
                <NavTable type="mint" />
              </TabPane>
            )}
          </Tabs>
        </div>
        <Countdown
          title={intl.get('index_centurymining_banner1')}
          desc={intl.get('index_centurymining_banner2')}
          lang={lang}
        />
      </div>
    );
  }
}

export default UserList;
