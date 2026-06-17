import React from 'react';
import { Link } from 'react-router-dom';
import isMobile from 'ismobilejs';
import { inject, observer } from 'mobx-react';
import intl from 'react-intl-universal';
import { Popover } from 'antd';
import '../../../assets/css/v2/tabsbar.scss';
import TouchWrapper from './TouchWrapper';
import ToPCModal from '../liquidate/ToPCModal';
import Config from '../../../config';
import Stores from '../../../stores';

@inject('network')
@inject('ui')
@inject('lend')
@inject('dashboardStore')
@observer
class TabsBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      mobile: isMobile(window.navigator).any,
      visible: false,
      applyReaded: true,
      appVisible: false,
      dropDownV1Show: false,
      dropDownV2Show: false,
      subItemOpen1: true,
      subItemOpen2: true
    };
  }

  componentDidMount() {
    const applyStatus = window.localStorage.getItem('apply_readed');
    if (applyStatus) {
      this.setState({ applyReaded: true });
    } else {
      this.setState({ applyReaded: false });
    }

    window.addEventListener('click', this.onClickOutside);
  }

  componentWillUnmount() {
    window.removeEventListener('click', this.onClickOutside);
  }

  onClickOutside = e => {
    let className = Array.prototype.slice.call(e.target.classList);
    if (!className.includes('home') && !className.includes('main-item') && !className.includes('menu-item')) {
      this.setState({ dropDownV1Show: false, dropDownV2Show: false });
    }
  };

  close = () => {
    this.setState({ visible: false });
  };

  handleActionKeyDown = (event, action) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };

  switchToLiquidate = () => {
    this.setState({ appVisible: true });
    let timer = setTimeout(() => {
      this.setState({ appVisible: false });
      clearTimeout(timer);
    }, 100);

    if (this.props.network.isRightChain === 0) {
      this.props.network.changeChain();
      return;
    }

    this.setState({ visible: true });
  };

  bsRender = () => {
    const { routeName, defaultAccount } = this.props.network;

    return (
      <>
        <Link to="/homeNew" className={routeName === 'home' ? 'current' : ''} aria-label={intl.get('v2.lend_title')}>
          <span>{intl.get('v2.lend_title')}</span>
        </Link>
        <Link
          to="/marketNew"
          className={routeName === 'market' ? 'current' : ''}
          aria-label={intl.get('liquidate.liquidate_market_list')}
        >
          <span>{intl.get('liquidate.liquidate_market_list')}</span>
        </Link>
        <a
          className={
            'flex aic' + (this.state.lang === 'en-US' ? ' en' : '') + (routeName === 'liquidate' ? ' current' : '')
          }
          onClick={this.switchToLiquidate}
          onKeyDown={event => this.handleActionKeyDown(event, this.switchToLiquidate)}
          role="button"
          tabIndex={0}
          aria-label={intl.get('liquidate.liquidate_liquidation_list')}
        >
          <span>{intl.get('liquidate.liquidate_liquidation_list')}</span>
        </a>
      </>
    );
  };

  moreRender = () => {
    const { routeName, defaultAccount } = this.props.network;

    return (
      <>
        {/* <a href={Config.juststable} target="juststable">
          <span>{intl.get('navi.juststable')}</span>
        </a> */}
        <Link to="/voteNew" className={'header-token dao' + (routeName === 'vote' ? ' current' : '')}>
          <span>{intl.get('navi.vote_btn')}</span>
        </Link>
        <a
          className="header-token stusdt"
          href="#"
          onClick={e => {
            this.props.lend.setStUSDTModalShow(true);
            e.preventDefault();
          }}
        >
          <span>{intl.get('stUsdt_top_nav')}</span>
        </a>
        {/* <a
          href="#"
          className={routeName === 'StUSDT' ? 'menu-item current' : 'menu-item'}
          onClick={e => {
            this.props.lend.setStUSDTModalShow(true);
            e.preventDefault();
          }}
          aria-label={intl.get('stUsdt_top_nav')}
        >
          <span className="menu-icons stUsdt"></span>
          <span className="menu-item-label">{intl.get('stUsdt_top_nav')}</span>
        </a> */}
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

  sbmV1DropdownRender = () => {
    const { routeName } = this.props.network;
    const { subItemOpen1, subItemOpen2 } = this.state;
    const pathname = window.location.pathname;
    const sbmVersion = pathname === '/homeNew' ? 'v2' : pathname === '/homev1' ? 'v1' : '';

    return (
      <div className={'header-dropdown-v2 header-dropdown-v2-mobile'}>
        <div className="dropdown-inner">
          <div className="dropdown-inner-content">
            <div className="sub-item v1">
              <Link
                to={`/homeV1`}
                className={'item-title header-v2-icon sbm-v2' + (routeName === 'homev1' ? ' current' : '')}
              >
                <div>{intl.get('jlv2.navibar.supply_borrow_v1')}</div>
              </Link>
              <Link
                to="/marketNew"
                className={'item-title header-v2-icon market-data-v1' + (routeName === 'market' ? ' current' : '')}
              >
                <div>{intl.get('jlv2.navibar.markets')}</div>
              </Link>
              <a
                onClick={e => {
                  e.preventDefault();
                  this.switchToLiquidate();
                }}
                className={'item-title header-v2-icon liquidate-v1' + (routeName === 'liquidate' ? ' current' : '')}
              >
                <div>{intl.get('jlv2.navibar.liquidation')}</div>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  };

  sbmV2DropdownRender = () => {
    const { routeName } = this.props.network;
    const { subItemOpen1, subItemOpen2 } = this.state;
    const pathname = window.location.pathname;
    const sbmVersion = pathname === '/homeNew' ? 'v2' : pathname === '/homev1' ? 'v1' : '';

    return (
      <div className={'header-dropdown-v2 header-dropdown-v2-mobile'}>
        <div className="dropdown-inner">
          <div className="dropdown-inner-content">
            <div className="sub-item">
              <Link
                onClick={() => this.props.dashboardStore.setHomeSearchparam('supply')}
                to={`/homeNew`}
                className={
                  'item-title header-v2-icon supply-v2' +
                  (routeName === 'dashboard' && this.props.dashboardStore.homeSearchparam === 'supply'
                    ? ' current'
                    : '')
                }
              >
                <div>{intl.get('jlv2.navibar.supply_earn')}</div>
                {/* <div>{intl.get('jlv2.navibar.supply_vault')}</div> */}
              </Link>
              <Link
                onClick={() => this.props.dashboardStore.setHomeSearchparam('borrow')}
                to={`/homeNew`}
                className={
                  'item-title header-v2-icon borrow-v2' +
                  (routeName === 'dashboard' && this.props.dashboardStore.homeSearchparam === 'borrow'
                    ? ' current'
                    : '')
                }
              >
                <div>{intl.get('jlv2.navibar.borrow_collateral')}</div>
                {/* <div>{intl.get('jlv2.navibar.lending_market')}</div> */}
              </Link>
              <Link
                to={`/liquidationV2`}
                className={'item-title header-v2-icon liquidate-v1' + (routeName === 'liquidationV2' ? ' current' : '')}
              >
                <div>{intl.get('jlv2.navibar.liquidation_v2')}</div>
                {/* <div className='market-name'>{intl.get('jlv2.navibar.liquidation_record')}</div> */}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  };

  render() {
    const { routeName } = this.props.network;
    const { theme } = this.props;
    const isWhite = theme === 'white';
    const { lang, visible, appVisible, applyReaded } = this.state;

    return (
      <>
        {!appVisible && !visible && (
          <TouchWrapper>
            <div className={`m-tabsbar ${this.props.classNames || ''} ${isWhite ? 'white' : ''}`}>
              <nav className="menu">
                <a
                  onClick={() => this.setState({ dropDownV1Show: !this.state.dropDownV1Show, dropDownV2Show: false })}
                  className={
                    'bs-route bs-route-m lend-title menu-item' +
                    (['homev1', 'market', 'liquidate'].includes(routeName) || this.state.dropDownV1Show
                      ? ' current'
                      : '')
                  }
                >
                  <span className="menu-icons home sbmv1"></span>
                  <span className="menu-item-label"> {intl.get('jlv2.navibar.sbm_v1')}</span>
                </a>
                <a
                  onClick={() => this.setState({ dropDownV2Show: !this.state.dropDownV2Show, dropDownV1Show: false })}
                  className={
                    'bs-route bs-route-m lend-title menu-item' +
                    (['dashboard', 'marketV2', 'vault', 'liquidationV2'].includes(routeName) ||
                    this.state.dropDownV2Show
                      ? ' current'
                      : '')
                  }
                >
                  <span className="menu-icons home sbmv2"></span>
                  <span className="menu-item-label"> {intl.get('jlv2.navibar.sbm_v2')}</span>
                </a>
                {this.state.dropDownV1Show && this.sbmV1DropdownRender()}
                {this.state.dropDownV2Show && this.sbmV2DropdownRender()}
                <Link to="/strx" className={routeName === 'LiquidityStake' ? 'menu-item current' : 'menu-item'}>
                  <span className="menu-icons strx"></span>
                  <span className="menu-item-label">{intl.get('strx.stake_trx_liquid_staking')}</span>
                </Link>
                <Link
                  to={(this.shouldGoToNewRentalPage() ? '/energyRental' : '/energy') + ('?lang=' + lang)}
                  className={'bs-route ' + (routeName === 'EnergyRent' ? 'menu-item current' : 'menu-item')}
                  aria-label={intl.get('strx.energy_rental')}
                >
                  <span className="menu-icons energy"></span>
                  <span className="menu-item-label">{intl.get('strx.energy_rental')}</span>
                </Link>

                <Popover
                  placement="topLeft"
                  title={''}
                  content={this.moreRender()}
                  trigger="click"
                  overlayClassName={'header-bs-pop' + (isWhite ? ' white' : '')}
                  // className="bs-route bs-route-m"
                >
                  <a className={'bs-route bs-route-m' + (routeName === 'vote' ? ' current' : '')}>
                    <span className="menu-icons more"></span>
                    <span className="menu-item-label">
                      {intl.getHTML('navi.more')}
                      <em className="bs-arrow"></em>
                    </span>
                  </a>
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
