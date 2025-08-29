import { observable } from 'mobx';

import NetworkStore from './netWork';
import PoolStore from './pool';
import Lend from './lend';
import System from './system';
import Pool from './pool';
import UserRecords from './userRecords';
import Strx from './strx';
import EnergyRental from './energyRental';
import StUsdt from './stusdt';
import Connect from './connect';
import Ledger from './ledger';
import Settings from './settings';

import Config from '../config';

class RootStore {
  constructor() {
    this.network = new NetworkStore(this);
    this.lend = new Lend(this);
    this.system = new System(this);
    this.pool = new Pool(this);
    this.userRecords = new UserRecords(this);
    this.strx = new Strx(this);
    this.energyRental = new EnergyRental(this);
    this.stusdt = new StUsdt(this);
    this.connect = new Connect(this);
    this.ledger = new Ledger(this);
    this.settings = new Settings(this);
  }
}

const store = new RootStore();
export default store;
