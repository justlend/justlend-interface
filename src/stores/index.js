import { makeAutoObservable } from 'mobx';
import NetworkStore from './netWork';
import UIStore from './UIStore';
import TransactionStore from './TransactionStore';
import TranslationStoreJLv2 from './JLv2/TransactionStore';
import AppStore from './AppStore';
import Lend from './lend';
import System from './system';
import SystemV2 from './JLv2/SystemV2';
import DashboardStore from './JLv2/DashboardStore';
import VaultStore from './JLv2/VaultStore';
import MarketStoreJLV2 from './JLv2/MarketStore';
import LiquidationStore from './JLv2/LiquidationStore';
import Pool from './pool';
import UserRecords from './userRecords';
import Strx from './strx';
import EnergyRental from './energyRental';
import StUsdt from './stusdt';
import Connect from './connect';
import Ledger from './ledger';
import Settings from './settings';
import UserStore from './UserStore';
import MarketStore from './MarketStore';
import VoteStore from './VoteStore';

class RootStore {
  constructor() {
    this.network = new NetworkStore(this);
    this.ui = new UIStore(this);
    this.transaction = new TransactionStore(this);
    this.transactionV2 = new TranslationStoreJLv2(this);
    this.app = new AppStore(this);
    this.lend = new Lend(this);
    this.system = new System(this);
    this.systemV2 = new SystemV2(this);
    this.dashboardStore = new DashboardStore(this);
    this.vaultStore = new VaultStore(this);
    this.marketV2 = new MarketStoreJLV2(this);
    this.liquidationV2 = new LiquidationStore(this);
    this.pool = new Pool(this);
    this.userRecords = new UserRecords(this);
    this.strx = new Strx(this);
    this.energyRental = new EnergyRental(this);
    this.stusdt = new StUsdt(this);
    this.connect = new Connect(this);
    this.ledger = new Ledger(this);
    this.settings = new Settings(this);
    this.user = new UserStore(this);
    this.market = new MarketStore(this);
    this.vote = new VoteStore(this);
    makeAutoObservable(this);
  }

  async initializeApp() {
    await this.network.init();
    if (this.network.isConnected) {
      this.transaction.startChecking();
    }
  }
}

const store = new RootStore();
export default store;
