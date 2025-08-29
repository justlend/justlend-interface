import { observable } from 'mobx';
import { getUserRecords } from '../pages/userRecords/utils/backend';

export default class PoolStore {
  @observable depositBorrowRecords = [];
  @observable rentRecords = [];
  @observable voteRecords = [];
  @observable strxRecords = [];
  @observable CDPRecords = [];
  @observable liquidationRecords = [];

  @observable depositBorrowTotalCount = '--';
  @observable rentTotalCount = '--';
  @observable voteTotalCount = '--';
  @observable strxTotalCount = '--';
  @observable CDPTotalCount = '--';
  @observable liquidationTotalCount = '--';
  @observable currentPageNumber = 1;
  @observable isLoading = true;
  @observable unReadCount = '--';

  constructor(rootStore) {
    this.rootStore = rootStore;
    this.interval = null;
    this.defaultIntervalSec = 60000;
    this.pageSize = 20;

    this.usdDecimal = 2;
    this.tokenDecimal = 6;
  }

  setData = (obj = {}) => {
    const self = this;
    Object.keys(obj).map(key => {
      self[key] = obj[key];
    });
  };

  setVariablesInterval = async () => {
    this.setData({
      isLoading: true
    });
    await Promise.all([
      this.getDepositBorrowRecordsData(),
      this.getLiquidityRecordsData(),
      this.getCDPRecordsData(),
      this.getRentRecordsData(),
      this.getStrxRecordsData(),
      this.getVoteRecordsData()
    ]);
    this.setData({
      isLoading: false
    });
    if (!this.interval) {
      this.setData({
        isLoading: true
      });
      this.interval = setInterval(async () => {
        await Promise.all([
          this.getDepositBorrowRecordsData(),
          this.getLiquidityRecordsData(),
          this.getCDPRecordsData(),
          this.getRentRecordsData(),
          this.getStrxRecordsData(),
          this.getVoteRecordsData()
        ]);
        this.setData({
          isLoading: false
        });
      }, this.defaultIntervalSec);
    }
  };

  clearVariablesInterval = () => {
    clearInterval(this.interval);
    this.interval = null;
  };

  getDepositBorrowRecordsData = async () => {
    try {
      const addr = this.rootStore.network.defaultAccount;
      if (!addr) {
        this.setData({
          isLoading: false
        });
        return;
      }

      const { success, data } = await getUserRecords('depositBorrow', addr, this.currentPageNumber, this.pageSize);
      if (success && data?.items?.length > 0) {
        this.setData({
          depositBorrowRecords: data.items,
          depositBorrowTotalCount: data?.totalCount
        });
      } else {
        this.setData({
          depositBorrowRecords: [],
          depositBorrowTotalCount: 0
        });
      }
    } catch (error) {
      console.log('getDepositBorrowRecordsData failed', error);
    }
  };

  getRentRecordsData = async () => {
    try {
      const addr = this.rootStore.network.defaultAccount;
      if (!addr) return;

      const { success, data } = await getUserRecords('rent', addr, this.currentPageNumber, this.pageSize);
      if (success && data?.items?.length > 0) {
        this.setData({
          rentRecords: data.items,
          rentTotalCount: data?.totalCount
        });
      } else {
        this.setData({
          rentRecords: [],
          rentTotalCount: 0
        });
      }
    } catch (error) {
      console.log('getRentRecordsData failed', error);
    }
  };

  getStrxRecordsData = async () => {
    try {
      const addr = this.rootStore.network.defaultAccount;
      if (!addr) return;

      const { success, data } = await getUserRecords('strx', addr, this.currentPageNumber, this.pageSize);
      if (success && data?.items?.length > 0) {
        this.setData({
          strxRecords: data.items,
          strxTotalCount: data?.totalCount
        });
      } else {
        this.setData({
          strxRecords: [],
          strxTotalCount: 0
        });
      }
    } catch (error) {
      console.log('getStrxRecordsData failed', error);
    }
  };

  getVoteRecordsData = async () => {
    try {
      const addr = this.rootStore.network.defaultAccount;
      if (!addr) return;

      const { success, data } = await getUserRecords('vote', addr, this.currentPageNumber, this.pageSize);
      if (success && data?.items?.length > 0) {
        this.setData({
          voteRecords: data.items,
          voteTotalCount: data?.totalCount
        });
      } else {
        this.setData({
          voteRecords: [],
          voteTotalCount: 0
        });
      }
    } catch (error) {
      console.log('getVoteRecordsData failed', error);
    }
  };

  getLiquidityRecordsData = async () => {
    try {
      const addr = this.rootStore.network.defaultAccount;
      if (!addr) return;

      const { success, data } = await getUserRecords('liquidate', addr, this.currentPageNumber, this.pageSize);
      if (success) {
        this.setData({ unReadCount: data.unReadCount });
        if (data?.items?.length > 0) {
          this.setData({
            liquidationRecords: data.items,
            liquidationTotalCount: data?.totalCount
          });
        } else {
          this.setData({
            liquidationRecords: [],
            liquidationTotalCount: 0
          });
        }
      }
      if (success) {
      }
      // this.setData({ unReadCount: 20 }); // for test
    } catch (error) {
      console.log('getLiquidityRecordsData failed', error);
    }
  };

  getCDPRecordsData = async () => {
    try {
      const addr = this.rootStore.network.defaultAccount;
      if (!addr) return;

      const { success, data } = await getUserRecords('cdp', addr, this.currentPageNumber, this.pageSize);
      if (success && data?.items?.length > 0) {
        let CDPRecords = data.items;
        CDPRecords.map((item, index) => {
          item.cdpFirst = false;
          item.cdpLast = false;
          if (index === 0 || item?.cdpId !== CDPRecords[index - 1]?.cdpId) {
            item.cdpFirst = true;
            if (index !== 0) CDPRecords[index - 1].cdpLast = true;
          }
          if (index === CDPRecords.length - 1) CDPRecords[index].cdpLast = true;
        });
        this.setData({
          CDPRecords,
          CDPTotalCount: data?.totalCount
        });
      } else {
        this.setData({
          CDPRecords: [],
          CDPTotalCount: 0
        });
      }
    } catch (error) {
      console.log('getCdpRecordsData failed', error);
    }
  };
}
