import React, { lazy, Suspense } from 'react';
import { Provider } from 'mobx-react';
import { Switch, Route, HashRouter, Redirect } from 'react-router-dom';
import intl from 'react-intl-universal';
import _ from 'lodash';

import Stores from '../stores';

import { SUPPOER_LOCALES, BigNumber } from '../utils/helper';

const Home = lazy(() => import('./Home'));
const Vote = lazy(() => import('./Vote'));
const Market = lazy(() => import('./Market'));
const MarketDetail = lazy(() => import('./MarketDetail'));
const VoteDetail = lazy(() => import('./VoteDetail'));
const MiningPool = lazy(() => import('./MiningPool'));

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
    format = format.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
  }
  for (var k in date) {
    if (new RegExp('(' + k + ')').test(format)) {
      format = format.replace(
        RegExp.$1,
        RegExp.$1.length == 1 ? date[k] : ('00' + date[k]).substr(('' + date[k]).length)
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

    currentLocale = window.localStorage.getItem('lang') || 'en-US';

    if (!_.find(SUPPOER_LOCALES, { value: currentLocale })) {
      currentLocale = 'en-US';
    }

    // let currentLocale = 'en-US'; // later will deleted
    window.localStorage.setItem('lang', currentLocale);
    return intl.init({
      currentLocale,
      locales
    });
  };

  render() {
    const time = 1;
    const Routes = () => (
      <HashRouter>
        <div>
          <Route exact path="/" render={() => <Redirect to="/home" />} />
          <Suspense fallback={<div></div>}>
            <Switch>
              <Route path="/home" component={Home} />
              <Route path="/market" component={Market} />
              <Route path="/vote" component={Vote} />
              <Route path="/marketDetail" component={MarketDetail} />
              <Route path="/voteDetail" component={VoteDetail} />
              <Route path="/miningPool" component={MiningPool} />
            </Switch>
          </Suspense>
        </div>
      </HashRouter>
    );
    return (
      <Provider {...Stores}>
        <Routes />
      </Provider>
    );
  }
}

export default App;
