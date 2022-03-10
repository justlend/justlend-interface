import React from 'react';
import intl from 'react-intl-universal';
import isMobile from 'ismobilejs';
import BigNumber from 'bignumber.js';
import { inject, observer } from 'mobx-react';
import LeftMenu from './LeftMenu';
import Account from '../components/Account';
import Intro from '../components/Intro';
import ValueIntro from '../components/ValueIntro';
import UserList from '../components/UserList';
import InfoList from '../components/InfoList';
import { Spin, Modal } from 'antd';
import DAW from './Modals/DAW';
import BorrowModal from './Modals/Borrow';
import TransactionModal from './Modals/Transaction';
import FooterPage from '../components/Footer';
import '../assets/css/home.scss';
import Config from '../config';

@inject('network')
@inject('lend')
@inject('system')
@inject('pool')
@observer
class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      lendActive: true,
      mobile: isMobile(window.navigator).any
    };
  }

  componentDidMount = async () => {
    this.props.lend.setVariablesInterval();
    this.props.pool.setVariablesInterval();
    await this.props.network.getNowTime();
    this.props.network.getCountTime();
  };

  componentWillUnmount() {
    this.props.lend.clearVariablesInterval();
    this.props.pool.clearVariablesInterval();
  }

  renderLoginButton = () => {
    const { lang, mobile } = this.state;
    return (
      <div className="intro-container">
        <div className={'intro-bg ' + (mobile ? 'intro-bg-mobile' : '')}>
          <div className="intro-image"></div>
          <div className={'intro-text' + (lang === 'en-US' ? ' english-text' : '')}>
            <p className="intro-title">
              <span></span>
              {/* <span>JustLend</span> */}
            </p>
            <p className="intro-subtitle">{intl.getHTML('index.my_introduction1')}</p>
          </div>
        </div>
      </div>
    );
  };

  renderUserInfo = (userDataSource, isConnected, transferringSoon, inFreeze) => {
    if (isConnected === null) {
      return this.renderLoginButton();
    }
    if (isConnected === false) {
      return <Intro />;
    }
    if (isConnected === true) {
      if (userDataSource === null && !BigNumber(transferringSoon).gt(0) && !BigNumber(inFreeze).gt(0)) {
        return (
          <div className="loading-box">
            <Spin size="large" />
          </div>
        );
      }
      if (
        Array.isArray(userDataSource) &&
        userDataSource.length === 0 &&
        !BigNumber(transferringSoon).gt(0) &&
        !BigNumber(inFreeze).gt(0)
      ) {
        return <Intro />;
      }
      if (
        (Array.isArray(userDataSource) && userDataSource.length > 0) ||
        BigNumber(transferringSoon).gt(0) ||
        BigNumber(inFreeze).gt(0)
      ) {
        return <UserList />;
      }
    }
  };

  getUserData = async () => {
    await this.props.lend.getMintInfo();
    await this.props.lend.getUserData();
    await this.props.lend.getTokenBalanceInfo();
  };

  getMarketData = async () => {
    await this.props.lend.getMintInfo();
    await this.props.lend.getMarketData();
    await this.props.lend.getDashboardData();
    await this.props.lend.getDefiTVL();
    await this.props.pool.getPoolData();
  };

  render() {
    const {
      DAWPop,
      userDataSource,
      borrowModalInfo,
      transferringSoon,
      inFreeze,
      totalCollateralShow,
      hideTotalCollateralPop
    } = this.props.lend;
    const { isConnected, menuFlag } = this.props.network;
    const { lang, mobile } = this.state;
    let hrefCH = Config.noticeCn;
    let hrefEN = Config.noticeEn;

    let noticeHref = lang === 'en-US' ? hrefEN : hrefCH;
    return (
      <div className={mobile ? '' : 'flex-end'}>
        <LeftMenu instantActions={this.getMarketData} mountedActions={this.getUserData}></LeftMenu>
        <div
          className={
            mobile
              ? 'main right-container mobile-right-container'
              : menuFlag
                ? 'main right-container'
                : 'main right-container max-width'
          }
        >
          <div className="main-content">
            <div className="home-notice">
              <span className="loudspeaker"></span>
              <span className="notice-content">
                <a href={noticeHref} target="notice">
                  {intl.get('banner.notice7')}
                </a>
              </span>
            </div>
            <div className="nav-container">
              {mobile ? (
                <>
                  <ValueIntro />
                  <Account />
                  {this.renderUserInfo(userDataSource, isConnected, transferringSoon, inFreeze)}
                </>
              ) : (
                <>
                  <Account />
                  <div className="nav-right-container">
                    <ValueIntro />
                    {this.renderUserInfo(userDataSource, isConnected, transferringSoon, inFreeze)}
                  </div>{' '}
                </>
              )}
            </div>
            <InfoList></InfoList>
          </div>
          {DAWPop.show && <DAW />}
          {borrowModalInfo.visible && <BorrowModal></BorrowModal>}
          <TransactionModal></TransactionModal>
          <FooterPage></FooterPage>
        </div>
        <Modal
          visible={totalCollateralShow}
          title={intl.get('collateral_tip_title')}
          width={370}
          footer={null}
          className={'mortgage-modal tac'}
          onCancel={() => hideTotalCollateralPop()}
        >
          <div className={'mortgage-modal-body' + (lang === 'zh-CN' ? ' tac' : '')}>
            {intl.getHTML('collateral_tip')}
          </div>
          <button className="collateral_btn" onClick={() => hideTotalCollateralPop()}>
            {intl.get('collateral_ok')}
          </button>
        </Modal>
      </div>
    );
  }
}

export default Home;
