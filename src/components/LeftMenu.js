import React from 'react';
import isMobile from 'ismobilejs';
import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';
import { Link } from 'react-router-dom';
import { Layout, Select, Menu, Modal, Drawer, Tooltip, Popover, Button } from 'antd';
import { LoadingOutlined, CopyOutlined, UnorderedListOutlined } from '@ant-design/icons';
const { Option } = Select;
const { SubMenu } = Menu;
import { cutMiddle, copyToClipboard, tronscanTX, formatNumber, getModalLeft, modalCloseIcon } from '../utils/helper';
import '../assets/css/header.scss';
import Config from '../config';
import walletSuccess from '../assets/images/walletSuccess.svg';
import walletFail from '../assets/images/walletFail.svg';
import logoSingle from '../assets/images/mainLogo.svg';
import closeIcon from '../assets/images/closeBlack.svg';
import tronlink from '../assets/images/tronlinkLogo.svg';
import tronlinkBlue from '../assets/images/tronlinkBlue.svg';
import tronlinkRightArrow from '../assets/images/tronlinkRightArrow.svg';
import menuLeft from '../assets/images/menuLeft.svg';
import menuRight from '../assets/images/menuRight.svg';
import justLend from '../assets/images/justLend.svg';

@inject('network')
@observer
class LeftMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      visible: false,
      step: 1,
      accountModal: false,
      drawerVisible: false,
      mobile: isMobile(window.navigator).any
    };
  }

  componentDidMount() {
    this.props.instantActions && this.props.instantActions();
    if (!this.props.network.isConnected) {
      this.props.network.initTronLinkWallet(
        () => {
          this.props.mountedActions && this.props.mountedActions();
        },
        () => {
          this.props.unmountedActions && this.props.unmountedActions();
        },
        false
      );
    } else {
      this.props.mountedActions && this.props.mountedActions();
    }
    this.props.network.listenTronLink();
  }

  setLanguage = lang => {
    this.props.network.setData({ lang });
    this.setState({ lang });
    window.localStorage.setItem('lang', lang);
    window.location.search = `?lang=${lang}`;
  };

  handleCancel = () => {
    this.props.network.setData({ loginModalVisible: false });
  };

  goBack = () => {
    this.props.network.setData({ loginModalStep: 1 });
  };

  showLoginModal = e => {
    this.props.network.connectWallet();
  };

  loginWallet = (e, type) => {
    this.props.network.setData({ loginModalStep: 2 });
    this.props.network.initTronLinkWallet(
      () => {
        if (this.props.network.isConnected) {
          this.props.network.setData({ loginModalStep: 2 });
          this.props.mountedActions && this.props.mountedActions();
        }
      },
      () => {
        this.props.unmountedActions && this.props.unmountedActions();
      }
    );
  };

  showAccountInfo = () => {
    this.setState({ accountModal: true });
  };

  handleCancelAccount = () => {
    this.setState({ accountModal: false });
  };

  hideSecondPop = () => {
    this.props.network.setData({ noSupport: false });
    this.onClose();
  };

  openDrawer = () => {
    this.setState({ drawerVisible: true });
  };

  onClose = () => {
    this.setState({ drawerVisible: false });
  };

  renderMobileHeader = () => {
    const { isConnected, defaultAccount, routeName } = this.props.network;
    const { lang, mobile } = this.state;
    return (
      <div className="menu-content wallet-content">
        <div className="">
          <div className="mobile-drawer-logo">
            <img src={logoSingle} />
            <img src={justLend} />
          </div>
          <div className="connect-wallet">
            {isConnected ? (
              <div className={mobile ? 'account-basic-info-m' : 'account-basic-info'}>
                <div
                  onClick={() => {
                    this.showAccountInfo();
                  }}
                  className="mobile-address-text pointer"
                >
                  <div className="flex-between">
                    <img src={walletSuccess} alt="" />
                    <span>{cutMiddle(defaultAccount, 4, 4)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={e => {
                  this.showLoginModal(e);
                }}
                className="mobile-address-text pointer"
              >
                <div className="flex-between">
                  <img src={walletFail} alt="" />
                  <span>{intl.get('navi.wallet_linkbtn')}</span>
                </div>
              </div>
            )}
          </div>
          <Link className="mobile-link logos big-logo index-logo" to="/home">
            <span id={routeName === 'home' ? 'active-bg' : ''}></span>
            <span id={routeName === 'home' ? 'm-active-menu-text' : ''}>{intl.get('navi.index_btn')}</span>
          </Link>
          <Link className="mobile-link logos big-logo market-logo" to="/market">
            <span id={routeName === 'market' ? 'active-bg' : ''}></span>
            <span id={routeName === 'market' ? 'm-active-menu-text' : ''}>{intl.get('navi.market_btn')}</span>
          </Link>
          <Link className="mobile-link logos big-logo liquidity-logo" to="/miningPool">
            <span id={routeName === 'miningPool' ? 'active-bg' : ''}></span>
            {/* <span className="new-icon"></span> */}
            <span>{intl.get('navi.liquidity')}</span>
          </Link>
          <Link className="mobile-link logos big-logo vote-logo" to="/vote">
            <span id={routeName === 'vote' ? 'active-bg' : ''}></span>
            <span id={routeName === 'vote' ? 'm-active-menu-text' : ''}>{intl.get('navi.vote_btn')}</span>
          </Link>
        </div>
        <div className="horizontal-line menu"></div>
        <div>
          <a
            className="mobile-link logos small-logo white-logo"
            href={lang === 'en-US' ? Config.whitePaperEn : Config.whitePaperCn}
            target="whitePaper"
          >
            <span></span>
            <span className="fs14">{intl.get('navi.white_paper')}</span>
          </a>
          <a
            className="mobile-link logos small-logo help-logo"
            href={lang === 'en-US' ? Config.helpEn : Config.helpCn}
            target="report"
          >
            <span></span>
            <span>{intl.get('navi.help')}</span>
          </a>
          <span
            className={
              'mobile-link mobile-language-link logos small-logo language-logo new-menu' +
              (lang === 'zh-CN' ? ' ch-logo' : '')
            }
          >
            <span></span>
            <Select
              defaultValue={lang}
              style={{ width: 120 }}
              onChange={this.setLanguage}
              dropdownClassName="lang-select"
            >
              <Option value="en-US">English</Option>
              <Option value="zh-TC">繁体中文</Option>
              <Option value="zh-CN">简体中文</Option>
            </Select>
            {/* <span>
              <span
                className={'en-text ' + (lang === 'en-US' ? 'lg-active' : '')}
                onClick={() => {
                  this.setLanguage('en-US');
                }}
              >
                EN
              </span>
              <span className="slice-lg"> / </span>
              <span
                className={'zh-text ' + (lang === 'zh-TC' ? 'lg-active' : '')}
                onClick={() => {
                  this.setLanguage('zh-TC');
                }}
              >
                繁体
              </span>
              <span className="slice-lg"> / </span>
              <span
                className={'zh-text ' + (lang === 'zh-CN' ? 'lg-active' : '')}
                onClick={() => {
                  this.setLanguage('zh-CN');
                }}
              >
                简体
              </span>
            </span> */}
          </span>
          <div className="mobile-drawer-footer">
            <a className="mobile-link footer-logo" href={Config.twitter} target="twitter">
              <span className="mobile-twitter-logo"></span>
              <span>{intl.get('navi.twitter')}</span>
            </a>
            <a className="mobile-link footer-logo" href={Config.telegram} target="telegram">
              <span className="mobile-telegram-logo"></span>
              <span>{intl.get('navi.telegram')}</span>
            </a>
          </div>
        </div>
      </div>
    );
  };

  setWidth = () => {
    this.props.network.changeMenuWidth();
  };

  render() {
    const { accountModal, lang, drawerVisible, mobile } = this.state;
    const {
      isConnected,
      defaultAccount,
      defaultSelectedKeys,
      loginModalVisible,
      loginModalStep,
      routeName,
      menuFlag
    } = this.props.network;
    return (
      <>
        {!mobile ? (
          <div className={'header-container ' + (!menuFlag ? 'minWid' : '')}>
            <div className="menu-scroll-frame">
              <div className="menu-scroll">
                <div className="logos header-logos">
                  <span className="header-logo"></span>
                  <span className="header-text">
                    <span></span>
                  </span>
                </div>
                <div className="menu-content">
                  <div className="features">
                    <div className="connect-wallet">
                      {isConnected ? (
                        <div className={mobile ? 'account-basic-info-m' : 'account-basic-info'}>
                          <div
                            onClick={() => {
                              this.showAccountInfo();
                            }}
                            className="address-text pointer"
                          >
                            <img src={walletSuccess} alt="" />
                            <span className="addr-span">{cutMiddle(defaultAccount, 4, 4)}</span>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={e => {
                            this.showLoginModal(e);
                          }}
                          className="address-text pointer"
                        >
                          <img src={walletFail} alt="" />
                          <span>{intl.get('navi.wallet_linkbtn')}</span>
                        </div>
                      )}
                    </div>
                    <div className="horizontal-line menu"></div>
                    <Link className="logos big-logo index-logo" to="/home">
                      <span id={routeName === 'home' ? 'active-bg' : ''}></span>
                      <span id={routeName === 'home' ? 'active-menu-text' : ''} title={intl.get('navi.index_btn')}>
                        {intl.get('navi.index_btn')}
                      </span>
                    </Link>
                    <Link className="logos big-logo market-logo" to="/market">
                      <span id={routeName === 'market' ? 'active-bg' : ''}></span>
                      <span id={routeName === 'market' ? 'active-menu-text' : ''} title={intl.get('navi.market_btn')}>
                        {intl.get('navi.market_btn')}
                      </span>
                    </Link>
                    <Link className="logos big-logo liquidity-logo" to="/miningPool">
                      <span id={routeName === 'miningPool' ? 'active-bg' : ''}></span>
                      {/* <span className="new-icon"></span> */}
                      <span
                        id={routeName === 'miningPool' ? 'active-menu-text' : ''}
                        title={intl.get('navi.liquidity')}
                      >
                        {intl.get('navi.liquidity')}
                      </span>
                    </Link>
                    <Link className="logos big-logo vote-logo" to="/vote">
                      <span id={routeName === 'vote' ? 'active-bg' : ''}></span>
                      <span id={routeName === 'vote' ? 'active-menu-text' : ''} title={intl.get('navi.vote_btn')}>
                        {intl.get('navi.vote_btn')}
                      </span>
                    </Link>
                  </div>
                  <div className="horizontal-line menu"></div>
                  <div className="links">
                    <a
                      className="logos small-logo white-logo"
                      href={lang === 'en-US' ? Config.whitePaperEn : Config.whitePaperCn}
                      target="whitePaper"
                    >
                      <span></span>
                      <span>{intl.get('navi.white_paper')}</span>
                    </a>
                    <a
                      className="logos small-logo help-logo"
                      href={lang === 'en-US' ? Config.helpEn : Config.helpCn}
                      target="report"
                    >
                      <span></span>
                      <span>{intl.get('navi.help')}</span>
                    </a>
                    <span
                      className={
                        'lg-mobile logos small-logo language-logo new-menu' +
                        (['zh-CN', 'zh-TC'].includes(lang) ? ' ch-logo' : '')
                      }
                    >
                      <span></span>
                      <Select
                        defaultValue={lang}
                        style={{ width: 120 }}
                        onChange={this.setLanguage}
                        dropdownClassName="lang-select"
                      >
                        <Option value="en-US">English</Option>
                        <Option value="zh-TC">繁体中文</Option>
                        <Option value="zh-CN">简体中文</Option>
                      </Select>
                      {/* <span>
                        <span
                          className={'en-text ' + (lang === 'en-US' ? 'lg-active' : '')}
                          onClick={() => {
                            this.setLanguage('en-US');
                          }}
                        >
                          EN
                        </span>
                        <span className="slice-lg"> / </span>
                        <span
                          className={'zh-text ' + (lang === 'zh-TC' ? 'lg-active' : '')}
                          onClick={() => {
                            this.setLanguage('zh-TC');
                          }}
                        >
                          繁体
                        </span>
                        <span className="slice-lg"> / </span>
                        <span
                          className={'zh-text ' + (lang === 'zh-CN' ? 'lg-active' : '')}
                          onClick={() => {
                            this.setLanguage('zh-CN');
                          }}
                        >
                          简体
                        </span>
                      </span> */}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="menu-footer">
              <a className="logos mini-logo twitter-logo" href={Config.twitter} target="twitter">
                <span></span>
                <span>{intl.get('navi.twitter')}</span>
              </a>
              <a className="logos mini-logo telegram-logo" href={Config.telegram} target="telegram">
                <span></span>
                <span>{intl.get('navi.telegram')}</span>
              </a>
              <div className="arrow" onClick={() => this.setWidth()}>
                <img src={menuFlag ? menuLeft : menuRight} />
              </div>
            </div>
          </div>
        ) : (
          <div className="mobile-header">
            <div className="flex-between">
              <div className="mobile-logo flex-between">
                <span></span>
              </div>
              <div
                className="mobile-category"
                onClick={e => {
                  this.openDrawer();
                }}
              ></div>
            </div>
            <Drawer
              title={null}
              placement="right"
              className="m-menu-drawer mobile-menu-drawer"
              closable={true}
              onClose={this.onClose}
              visible={drawerVisible}
              closeIcon={<img src={closeIcon} alt="close" className="closeIconMobile"></img>}
            >
              {this.renderMobileHeader()}
            </Drawer>
          </div>
        )}
        <Modal
          title={intl.get('navi.wallet_linkbtn')}
          visible={loginModalVisible}
          onCancel={this.handleCancel}
          footer={null}
          className="login-modal custom-modal"
          width={320}
        >
          {loginModalStep === 1 ? (
            <div className="center">
              <div className="logo">
                <img src={logoSingle} alt="" />
              </div>
              <div className="mt20 fs12 c-5A5E89">{intl.get('wallet.use_justlend')}</div>
              <div className="wallet-list">
                <div
                  className="wallet-item"
                  onClick={e => {
                    this.loginWallet(e, 1);
                  }}
                >
                  <span>
                    <img src={tronlink} className="tronlink-logo" alt="" />
                  </span>
                  <div>
                    <span className="wallet-txt">{intl.get('login_modal.tronlink')}</span>
                    <img src={tronlinkRightArrow} className="tronlink-right-arrow-logo" alt="" />
                  </div>
                </div>
              </div>

              <div className="tronlink-tips">
                <span>{intl.get('wallet.accept_tips')} </span>
                <a
                  href={`${Config.fileLink}JustLend_Terms_of_Use_${lang === 'en-US' ? 'en' : lang === 'zh-CN' ? 'cn' : 'tc'
                    }.pdf`}
                  target="walletService"
                >
                  {intl.get('wallet.service')}
                </a>
                &nbsp;
                <a
                  href={`${Config.fileLink}JustLend_Privacy_Policy_${lang === 'en-US' ? 'en' : lang === 'zh-CN' ? 'cn' : 'tc'
                    }.pdf`}
                  target="walletPrivacy"
                >
                  {intl.get('wallet.privacy')}
                </a>
              </div>
            </div>
          ) : (
            <div className="center">
              <div className="logo">
                <img src={logoSingle} alt="" />
              </div>
              <div className="mt20 fs12 c-5A5E89">{intl.get('wallet.authorize_justlend')}</div>
              <div className="wallet-list">
                <div className="wallet-item flex-justify-center">
                  <div className="points">
                    <span className="point"></span>
                    <span className="point"></span>
                    <span className="point"></span>
                  </div>
                </div>
              </div>
              <div className="tronlink-tips">
                <span>{intl.get('wallet.no_wallet')} </span>
                <a href="https://chrome.google.com/webstore/detail/tronlink%EF%BC%88%E6%B3%A2%E5%AE%9D%E9%92%B1%E5%8C%85%EF%BC%89/ibnejdfjmmkpcnlpebklmnkoeoihofec">
                  {intl.get('wallet.click_to_get')}
                </a>
              </div>
            </div>
          )}
        </Modal>

        <Modal
          title={intl.get('account_modal.account')}
          footer={null}
          onCancel={this.handleCancelAccount}
          className="login-modal custom-modal"
          visible={accountModal}
          style={defaultSelectedKeys === '1'} // except scan
          width={320}
        >
          <div>
            <img className="mb16" src={tronlinkBlue} />
            <div className="address-con">
              <div className="tip-text mb16 fs12 c-5A5E89">{intl.get('account_modal.connect_with_tronlink')}</div>
              <div className="address-tex mb16">
                <div className="c-0F134F fs12">{defaultAccount}</div>
                <div
                  className="pointer c-3D56D6 fs12"
                  title={defaultAccount}
                  id="copySpan"
                  onClick={e => {
                    copyToClipboard(e, '', 'copySpan');
                  }}
                >
                  {intl.get('account_modal.copy')}
                </div>
              </div>
              {/* <div className="btn blue-border-btn">{intl.get('wallet.quit_wallet')}</div> */}
            </div>
          </div>
        </Modal>

        {/* <Modal
          title={intl.get("login_modal_add.title")}
          footer={null}
          onCancel={this.hideSecondPop}
          className="no-support-pop"
          visible={noSupport}
          width={540}
        >
          <div>
            <div className="tip">{intl.getHTML("login_modal_add.tip1")}</div>
            <div className="tip">{intl.getHTML("login_modal_add.tip2", { value: Config.tronlinkDownload })}</div>
          </div>
        </Modal> */}
      </>
    );
  }
}

export default LeftMenu;
