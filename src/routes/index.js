/* eslint-disable no-extend-native */
import React, { lazy, Suspense } from 'react';
import { Provider } from 'mobx-react';
import { Switch, Route, HashRouter, Redirect, BrowserRouter } from 'react-router-dom';
import intl from 'react-intl-universal';
import _ from 'lodash';
import Config from '../config';

import Stores from '../stores';

import { SUPPORT_LOCALES, BigNumber } from '../utils/helper';

import UserRecords from '../pages/userRecords';
import Settings from '../pages/settings';

import MarketDetailV2 from './v2/MarketDetail.jsx';

const HomeNew = lazy(() => import('./v2/Home'));
const MarketNew = lazy(() => import('./v2/Market'));
const VoteNew = lazy(() => import('./v2/Vote'));
const VoteDetailV2 = lazy(() => import('./v2/VoteDetail'));
const EnergyRent = lazy(() => import('./v2/EnergyRent'));
const EnergyRentOrderList = lazy(() => import('./v2/EnergyRentOrderList'));
const EnergyRental = lazy(() => import('./v2/EnergyRental'));
const LiquidityStake = lazy(() => import('./v2/LiquidityStake'));
const Forbid = lazy(() => import('./v2/Forbid'));
const Liquidate = lazy(() => import('./v2/Liquidate'));
const Application = lazy(() => import('./v2/Application'));

const locales = {
  'en-US': require('../locales/en-US.json'),
  'zh-TC': require('../locales/zh-TC.json'),
  'zh-CN': require('../locales/zh-CN.json')
};

String.prototype._toBg = function () {
  const value = this.valueOf();
  if (value === '--') {
    return BigNumber(NaN);
  } else {
    return BigNumber(value);
  }
};

Date.prototype.format = function (format) {
  var date = {
    'M+': this.getMonth() + 1,
    'd+': this.getDate() < 10 ? `0${this.getDate()}` : this.getDate(),
    'h+': this.getHours() < 10 ? `0${this.getHours()}` : this.getHours(),
    'm+': this.getMinutes() < 10 ? `0${this.getMinutes()}` : this.getMinutes(),
    's+': this.getSeconds() < 10 ? `0${this.getSeconds()}` : this.getSeconds(),
    'q+': Math.floor((this.getMonth() + 3) / 3),
    'S+': this.getMilliseconds()
  };
  if (/(y+)/i.test(format)) {
    format = format.replace(RegExp.$1, (this.getFullYear() + '')?.substr(4 - RegExp.$1.length));
  }
  for (var k in date) {
    if (new RegExp('(' + k + ')').test(format)) {
      format = format.replace(
        RegExp.$1,
        RegExp.$1.length == 1 ? date[k] : ('00' + date[k])?.substr(('' + date[k]).length)
      );
    }
  }
  return format;
};

class App extends React.Component {
  componentDidMount() {}

  componentWillMount() {
    this.loadLocales();
  }

  loadLocales = () => {
    let currentLocale = intl.determineLocale({
      urlLocaleKey: 'lang',
      cookieLocaleKey: 'lang'
    });

    const str = window.location.search;
    if (str.indexOf('lang=') > -1 && str.split('lang=')[1]?.length >= 5) {
      currentLocale = str.split('lang=')[1]?.slice(0, 5);
    } else {
      currentLocale = window.localStorage.getItem('lang') || 'en-US';
    }

    if (!_.find(SUPPORT_LOCALES, { value: currentLocale })) {
      currentLocale = 'en-US';
    }

    window.localStorage.setItem('lang', currentLocale);
    return intl.init({
      currentLocale,
      locales
    });
  };

  render() {
    const Routes = () => (
      <BrowserRouter>
        <div>
          <Route exact path="/" render={() => <Redirect to={Config.nile ? '/strx' : '/homeNew'} />} />
          <Suspense fallback={<div></div>}>
            {Config.nile ? (
              <Switch>
                <Route path="/energy" component={EnergyRent} />
                <Route path="/energyRentalOrderList" component={EnergyRentOrderList} />
                <Route path="/energyRental" component={EnergyRental} />
                <Route path="/strx" component={LiquidityStake} />
                <Redirect path="*" to="/strx" />
              </Switch>
            ) : (
              <Switch>
                <Route path="/home" component={HomeNew} />
                <Route path="/homeNew" component={HomeNew} />
                <Route path="/userRecords" component={UserRecords} />
                <Route path="/settings" component={Settings} />
                <Route path="/marketNew" component={MarketNew} />
                <Route path="/market" component={MarketNew} />
                <Route path="/voteNew" component={VoteNew} />
                <Route path="/vote" component={VoteNew} />
                {/* <Route path="/vote-old" component={Vote} /> */}
                <Route path="/marketDetail" component={MarketDetailV2} />
                <Route path="/marketDetailNew" component={MarketDetailV2} />
                <Route path="/voteDetail" component={VoteDetailV2} />
                <Route path="/voteDetailNew" component={VoteDetailV2} />
                <Route path="/energyRentalOrderList" component={EnergyRentOrderList} />
                <Route path="/energy" component={EnergyRent} />
                <Route path="/energyRental" component={EnergyRental} />
                <Route path="/strx" component={LiquidityStake} />
                <Route path="/forbid" component={Forbid} />
                <Route path="/liquidate" component={Liquidate} />
                <Route path="/application" component={Application} />
                <Redirect path="*" to="/homeNew" />
              </Switch>
            )}
          </Suspense>
        </div>
      </BrowserRouter>
    );
    return (
      <Provider {...Stores}>
        <Routes />
      </Provider>
    );
  }
}

export default App;
