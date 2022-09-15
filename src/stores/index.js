import { observable } from 'mobx';

import NetworkStore from './netWork';
import PoolStore from './pool';
import Lend from './lend';
import System from './system';
import Pool from './pool';
import WalletConnectStore from './walletConnect';

import Config from '../config';

class RootStore {
  constructor() {
    this.network = new NetworkStore(this);
    this.lend = new Lend(this);
    this.system = new System(this);
    this.pool = new Pool(this);
    this.walletConnect = new WalletConnectStore(this);
  }
}

const store = new RootStore();
export default store;
