/* eslint-disable no-extend-native */
import React, { lazy, Suspense, useEffect, useState, useCallback } from 'react';
import { Provider } from 'mobx-react';
import { Switch, Route, Redirect, BrowserRouter } from 'react-router-dom';
import Stores from '../stores';
import { initI18n } from '../utils/i18n';
import { BigNumber } from '../utils/helper';

const Dashboard = lazy(() => import('./JLv2/Dashboard'));
const Vault = lazy(() => import('./JLv2/Vault'));
const MarketJLv2 = lazy(() => import('./JLv2/Market'));
const LiquidationV2 = lazy(() => import('./JLv2/Liquidation'));
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
const UserRecords = lazy(() => import('../pages/userRecords'));
const Settings = lazy(() => import('../pages/settings'));
const MarketDetailV2 = lazy(() => import('./v2/MarketDetail.jsx'));

const GlobalLoadingFallback = () => (
  <></>
  // <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
  //   Loading page...
  // </div>
);

String.prototype._toBg = function () {
  const value = this.valueOf();
  return value === '--' ? BigNumber(NaN) : BigNumber(value);
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

function App() {
  const [isAppInitialized, setAppInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      await initI18n();
      await Stores.network.init();
      setAppInitialized(true);
    };

    initializeApp();
  }, []);

  if (!isAppInitialized) {
    return <GlobalLoadingFallback />;
  }

  return (
    <Provider {...Stores}>
      <BrowserRouter basename="/">
        <Suspense fallback={<GlobalLoadingFallback />}>
          <Switch>
            <Route exact path="/" render={() => <Redirect to={'/homeNew'} />} />
            <Route key="main-dashboard" path={['/home', '/homeNew', '/index.html']} component={Dashboard} />,
            <Route key="main-vault" path={['/vault']} component={Vault} />,
            <Route key="main-market-v2" path={['/marketV2']} component={MarketJLv2} />,
            <Route key="main-liquidation-v2" path='/liquidationV2' component={LiquidationV2} />,
            <Route key="main-home" path={['/homeV1']} component={HomeNew} />,
            <Route key="main-records" path="/userRecords" component={UserRecords} />,
            <Route key="main-settings" path="/settings" component={Settings} />,
            <Route key="main-market" path={['/market', '/marketNew']} component={MarketNew} />,
            <Route key="main-vote" path={['/vote', '/voteNew']} component={VoteNew} />,
            <Route key="main-marketdetail" path={['/marketDetail', '/marketDetailNew']} component={MarketDetailV2} />,
            <Route key="main-votedetail" path={['/voteDetail', '/voteDetailNew']} component={VoteDetailV2} />,
            <Route key="main-orderlist" path="/energyRentalOrderList" component={EnergyRentOrderList} />,
            <Route key="main-energy" path="/energy" component={EnergyRent} />,
            <Route key="main-rental" path="/energyRental" component={EnergyRental} />,
            <Route key="main-strx" path="/strx" component={LiquidityStake} />,
            <Route key="main-forbid" path="/forbid" component={Forbid} />,
            <Route key="main-liquidate" path="/liquidate" component={Liquidate} />,
            <Route key="main-application" path="/application" component={Application} />,
            <Redirect key="main-redirect" from="*" to="/homeNew" />
          </Switch>
        </Suspense>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
