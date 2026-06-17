import { observable, makeObservable, action } from 'mobx';
import { getUserRecords } from '../pages/userRecords/utils/backend';
import { getSBMV2Records } from '../service/V2backend';
import { getStrxRentAllOrderList } from '../utils/backend';

export default class UserRecordsStore {
  @observable depositBorrowRecords = [];
  @observable rentRecords = [];
  @observable voteRecords = [];
  @observable strxRecords = [];
  @observable liquidationRecords = [];
  @observable SBMV2Records = [];
  @observable depositBorrowTotalCount = '--';
  @observable rentTotalCount = '--';
  @observable voteTotalCount = '--';
  @observable strxTotalCount = '--';
  @observable liquidationTotalCount = '--';
  @observable SBMV2TotalCount = '--';
  @observable currentPageNumber = 1;
  @observable isLoading = false;
  @observable unReadCount = '--';
  @observable detailOpen = false;
  @observable detailInfo = {};

  constructor(rootStore) {
    this.rootStore = rootStore;
    this.interval = null;
    this.defaultIntervalSec = 60000;
    this.pageSize = 20;

    this.usdDecimal = 2;
    this.tokenDecimal = 6;

    makeObservable(this);
  }

  setData = (obj = {}) => {
    const self = this;
    Object.keys(obj).map(key => {
      self[key] = obj[key];
    });
  };

  @action
  setOneData = (key, value) => {
    this[key] = value;
  };

  setVariablesInterval = async () => {
    this.setOneData('isLoading', true);

    await Promise.all([
      this.getDepositBorrowRecordsData(),
      this.getSBMV2RecordsData(),
      this.getLiquidityRecordsData(),
      this.getRentRecordsData(),
      this.getStrxRecordsData(),
      this.getVoteRecordsData()
    ]);

    this.setOneData('isLoading', false);

    if (!this.interval) {
      this.interval = setInterval(async () => {
        await Promise.all([
          this.getDepositBorrowRecordsData(),
          this.getSBMV2RecordsData(),
          this.getLiquidityRecordsData(),
          this.getRentRecordsData(),
          this.getStrxRecordsData(),
          this.getVoteRecordsData()
        ]);
      }, this.defaultIntervalSec);
    }
  };

  clearVariablesInterval = () => {
    clearInterval(this.interval);
    this.interval = null;
  };

  handleToDetail = async (type, record) => {
    this.setOneData('detailOpen', true);
    this.setOneData('detailInfo', { ...record, recordType: type });

    if (type === 'Rent') {
      const { renter, receiver, blocktimestamp } = record;
      const delegateTrxAmount = await this.getRentAllOrderListData({
        renter,
        receiver,
        blocktimestamp,
        pageSize: 1000
      });
      this.setOneData('detailInfo', { ...record, recordType: type, delegateTrxAmount });
    }
  };

  closeDetailModal = () => {
    this.setOneData('detailOpen', false);
    this.setOneData('detailInfo', {});
  };

  getDepositBorrowRecordsData = async () => {
    try {
      const addr = this.rootStore.network.defaultAccount;
      if (!addr) {
        this.setOneData('isLoading', false);
        return;
      }

      const { success, data } = await getUserRecords('depositBorrow', addr, this.currentPageNumber, this.pageSize);
      if (success && data?.items?.length > 0) {
        this.setOneData('depositBorrowRecords', data.items);
        this.setOneData('depositBorrowTotalCount', data?.totalCount);
      } else {
        this.setOneData('depositBorrowRecords', []);
        this.setOneData('depositBorrowTotalCount', 0);
      }
    } catch (error) {
      console.log('getDepositBorrowRecordsData failed', error);
    }
  };

  getSBMV2RecordsData = async () => {
    try {
      const addr = this.rootStore.network.defaultAccount;
      if (!addr) {
        this.setOneData('isLoading', false);
        return;
      }

      const { success, data } = await getSBMV2Records(addr, this.currentPageNumber, this.pageSize);

      if (success) {
        this.setOneData('SBMV2Records', data.list);
        this.setOneData('SBMV2TotalCount', data.totalCount);
      } else {
        this.setOneData('SBMV2Records', []);
        this.setOneData('SBMV2TotalCount', 0);
      }
    } catch (error) {
      console.log('getSBMV2RecordsData failed', error);
    }
  };

  getRentRecordsData = async () => {
    try {
      const addr = this.rootStore.network.defaultAccount;
      if (!addr) return;

      const { success, data } = await getUserRecords('rent', addr, this.currentPageNumber, this.pageSize);
      if (success && data?.items?.length > 0) {
        data.items.forEach(item => {
          if (item.blocktimestamp) {
            item.blockTimestamp = item.blocktimestamp;
          }
        });
        this.setOneData('rentRecords', data.items);
        this.setOneData('rentTotalCount', data?.totalCount);
      } else {
        this.setOneData('rentRecords', []);
        this.setOneData('rentTotalCount', 0);
      }
    } catch (error) {
      console.log('getRentRecordsData failed', error);
    }
  };

  // for delegate amount
  getRentAllOrderListData = async ({
    renter,
    receiver,
    rentType = 1,
    orderBy = 0,
    page = 0,
    pageSize = 10,
    blocktimestamp = ''
  }) => {
    try {
      const response = await getStrxRentAllOrderList({
        renter,
        receiver,
        rentType,
        orderBy,
        page,
        pageSize
      });

      if (response.success) {
        const datas = response.data?.orders;
        let filterData = datas.find(item => item.startTimestamp == blocktimestamp);
        return filterData?.delegateTrxAmount;
      } else {
        return '--';
      }
    } catch (error) {
      console.log('getRentAllOrderListData failed', error);
      return '--';
    }
  };

  getStrxRecordsData = async () => {
    try {
      const addr = this.rootStore.network.defaultAccount;
      if (!addr) return;

      const { success, data } = await getUserRecords('strx', addr, this.currentPageNumber, this.pageSize);
      if (success && data?.items?.length > 0) {
        this.setOneData('strxRecords', data.items);
        this.setOneData('strxTotalCount', data?.totalCount);
      } else {
        this.setOneData('strxRecords', []);
        this.setOneData('strxTotalCount', 0);
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
        this.setOneData('voteRecords', data.items);
        this.setOneData('voteTotalCount', data?.totalCount);
      } else {
        this.setOneData('voteRecords', []);
        this.setOneData('voteTotalCount', 0);
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
        this.setOneData('unReadCount', data?.unReadCount);
        if (data?.items?.length > 0) {
          this.setOneData('liquidationRecords', data.items);
          this.setOneData('liquidationTotalCount', data?.totalCount);
        } else {
          this.setOneData('liquidationRecords', []);
          this.setOneData('liquidationTotalCount', 0);
        }
      }
    } catch (error) {
      console.log('getLiquidityRecordsData failed', error);
    }
  };
}
