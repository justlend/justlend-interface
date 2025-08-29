import React from 'react';
import { Link } from 'react-router-dom';
import isMobile from 'ismobilejs';
import { inject, observer } from 'mobx-react';
import intl from 'react-intl-universal';
import { Popover } from 'antd';
import '../../../assets/css/v2/tabsbar.scss';
import TouchWrapper from './TouchWrapper';
import ToPCModal from '../liquidate/ToPCModal';
import { isWhiteAccount, getBrowserInfo } from '../../../utils/helper';
import Config from '../../../config';

import BetaImg from '../../../assets/images/v2/beta.png';
import BetaWhiteImg from '../../../assets/images/v2/white-theme/beta.png';
import NewIcon from '../../../assets/images/header/new.svg';
import BetaNewIcon from '../../../assets/images/v2/beta-new-icon.png';
import BetaNewWhiteIcon from '../../../assets/images/v2/white-theme/beta-new-icon.png';

@inject('network')
@inject('lend')
@observer
class TabsBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      mobile: isMobile(window.navigator).any,
      visible: false,
      applyReaded: true,
      appVisible: false
    };
  }

  componentDidMount() {
    const applyStatus = window.localStorage.getItem('apply_readed');
    if (applyStatus) {
      this.setState({ applyReaded: true });
    } else {
      this.setState({ applyReaded: false });
    }
  }

  close = () => {
    this.setState({ visible: false });
  };

  switchToLiquidate = () => {
    this.setState({ appVisible: true });
    let timer = setTimeout(() => {
      this.setState({ appVisible: false });
      clearTimeout(timer);
    }, 100);

    // const { isConnected } = this.props.network;
    // if (!isConnected) {
    //   return this.props.network.connectWalletV2();
    // }

    if (this.props.network.isRightChain === 0) {
      this.props.network.changeChain();
      return;
    }

    if (this.props.network.isMainNetwork === 0) {
      this.props.network.showNetworkErrorModal();
      return;
    }

    // const { defaultAccount } = this.props.network;

    // const browserInfo = getBrowserInfo();
    // const isStoraged = window.localStorage.getItem(
    //   defaultAccount + (browserInfo.browser !== 'Unknown' ? browserInfo.browser : browserInfo.appName)
    // );
    // if (!isStoraged) {
    //   this.props.lend.setData({ disclaimerShow: true, isDisclaimerStoraged: false });
    //   return;
    // }

    // const { hasLiquidateBetaAuthority, applicationMap } = this.props.lend;
    // const { lang } = this.state;
    // const phase = applicationMap['liquidate']?.phase;
    // const href = window.location.origin + `/liquidate?lang=${lang}`;

    // if (phase === 1 && !hasLiquidateBetaAuthority) {
    //   this.props.lend.setData({ applocationTipShow: true, pre: 'liquidate' });
    // } else {
    //   this.setState({ visible: true });
    // }
    this.setState({ visible: true });
  };

  bsRender = () => {
    const { routeName, defaultAccount } = this.props.network;
    // console.log(routeName, 'routeName');
    const { applicationMap, theme } = this.props.lend;

    return (
      <>
        <Link to="/homeNew" className={routeName === 'home' ? 'current' : ''}>
          <span>{intl.get('v2.lend_title')}</span>
        </Link>
        <Link to="/marketNew" className={routeName === 'market' ? 'current' : ''}>
          <span>{intl.get('liquidate.liquidate_market_list')}</span>
        </Link>
        <a
          className={
            'flex aic' + (this.state.lang === 'en-US' ? ' en' : '') + (routeName === 'liquidate' ? ' current' : '')
          }
          onClick={this.switchToLiquidate}
        >
          <span>{intl.get('liquidate.liquidate_liquidation_list')}</span>
        </a>
        {/* {applicationMap['liquidate']?.switchOn && (
          <a
            className={
              'flex aic' + (this.state.lang === 'en-US' ? ' en' : '') + (routeName === 'liquidate' ? ' current' : '')
            }
            onClick={this.switchToLiquidate}
          >
            <span>{intl.get('liquidate.liquidate_liquidation_list')}</span>
          </a>
        )} */}
      </>
    );
  };

  moreRender = () => {
    const { routeName, defaultAccount } = this.props.network;
    // console.log(routeName, 'routeName');
    const { applicationMap, theme } = this.props.lend;
    const { lang, applyReaded } = this.state;

    return (
      <>
        <a
          href={Config.juststable}
          onClick={e => {
            // window.gtag('event', 'nav_stUSDT', { 'event_category': 'PC', 'event_label': 'nav_stUSDT' });
          }}
          target="juststable"
        >
          <span>{intl.get('navi.juststable')}</span>
        </a>
        <a
          href="#"
          className={routeName === 'StUSDT' ? 'menu-item current' : 'menu-item'}
          onClick={e => {
            this.props.lend.setData({
              stUSDTModalShow: true
            });
            e.preventDefault();
          }}
        >
          <span className="menu-icons stUsdt"></span>
          <span className="menu-item-label">{intl.get('stUsdt_top_nav')}</span>
        </a>
      </>
    );
  };

  shouldGoToNewRentalPage = () => {
    const lastVisitValue = window.localStorage.getItem('lastVisitEnergyRentalPage');
    if (lastVisitValue == null || lastVisitValue == 'energyRental') {
      return true;
    } else {
      return false;
    }
  };

  render() {
    const { routeName } = this.props.network;
    const { hasEnergyBetaAuthority, applicationMap } = this.props.lend;
    const { theme } = this.props;
    const isWhite = theme === 'white';
    const { lang, visible, appVisible, applyReaded } = this.state;

    return (
      <>
        {!appVisible && !visible && (
          <TouchWrapper>
            <div className={`m-tabsbar ${this.props.classNames || ''} ${isWhite ? 'white' : ''}`}>
              <nav className="menu">
                {/* <Link to="/homeNew" className={routeName === 'home' ? 'menu-item current' : 'menu-item'}>
              <span className="menu-icons home"></span>
              <span className="menu-item-label">{intl.get('v2.lend_title')}</span>
            </Link> */}
                <Popover
                  placement="topLeft"
                  title={''}
                  content={this.bsRender()}
                  trigger="click"
                  overlayClassName={'header-bs-pop' + (isWhite ? ' white' : '')}
                >
                  <a
                    className={
                      'bs-route bs-route-m lend-title' +
                      (['home', 'market', 'liquidate'].includes(routeName) ? ' menu-item current' : '')
                    }
                  >
                    <span className="menu-icons home"></span>
                    <span className="menu-item-label">
                      {intl.getHTML('v2.lend_title_s9')}
                      <em className="bs-arrow"></em>
                    </span>
                  </a>
                </Popover>
                <Link to="/strx" className={routeName === 'LiquidityStake' ? 'menu-item current' : 'menu-item'}>
                  <span className="menu-icons strx"></span>
                  <span className="menu-item-label">{intl.get('strx.stake_trx_liquid_staking')}</span>
                </Link>
                <Link
                  to={(this.shouldGoToNewRentalPage() ? '/energyRental' : '/energy') + ('?lang=' + lang)}
                  className={'bs-route ' + (routeName === 'EnergyRent' ? 'menu-item current' : 'menu-item')}
                >
                  <span className="menu-icons energy"></span>
                  <span className="menu-item-label">{intl.get('strx.energy_rental')}</span>
                </Link>
                <Link to="/voteNew" className={routeName === 'vote' ? 'menu-item current' : 'menu-item'}>
                  <span className="menu-icons dao"></span>
                  <span className="menu-item-label">{intl.get('navi.vote_btn')}</span>
                </Link>

                <Popover
                  placement="topLeft"
                  title={''}
                  content={this.moreRender()}
                  trigger="click"
                  overlayClassName={'header-bs-pop' + (isWhite ? ' white' : '')}
                  className="bs-route bs-route-m"
                >
                  <a className={'bs-route bs-route-m'}>
                    <span className="menu-icons more"></span>
                    <span className="menu-item-label">
                      {intl.getHTML('navi.more')}
                      <em className="bs-arrow"></em>
                    </span>
                  </a>
                  {/* {!applyReaded && <img className="new-icon" src={NewIcon} alt="new_icon" />} */}
                </Popover>
              </nav>
            </div>
          </TouchWrapper>
        )}

        {<ToPCModal visible={visible} close={this.close} />}
      </>
    );
  }
}

export default TabsBar;
