// src/stores/DashboardStore.js
import { makeAutoObservable, runInAction } from 'mobx';
import { isEqual, debounce } from 'lodash';
import { getMyPosition, getIndexMarketList, getIndexVaultList, getIndexHistory } from '../../service/V2backend';
import { getBalanceNew, getTrxBalanceQuick } from '../../utils/blockchain';
import { formatTokenSymbol, formatVaultName } from '../../utils/formatters';
import { BigNumber } from '../../utils/helper';
import Config from '../../config/v2config';
import v1Config from '../../config';

const { tokens } = Config;
const { WTRX: WTRXAddress } = tokens;

export default class DashboardStore {
  // --- Observables (State) ---
  positionData = {};
  positionLoading = true;

  marketListData = [];
  listLoading = true;

  allVaults = [];
  userVaults = [];
  allMarkets = [];
  userMarkets = [];
  allMarketsCount = 0;
  allVaultsCount = 0;

  myVaultFold = true;
  myMarketFold = true;

  collateralTokens = [];
  supplyTokens = [];

  currentPage = 1;
  moreLoading = false;

  userBalances = {};
  allUserTokens = [];

  activeTab = 'supply'; // 'supply' or 'borrow'
  filters = {
    supplyTokens: [],
    collateralTokens: [],
    keyword: ''
  };

  isFiltered = false;

  sorter = {
    sort: '',
    order: ''
  };

  chartData = {
    supplyList: [],
    borrowList: [],
    collateralList: []
  };
  chartLoading = true;

  isPositionModalShow = false;
  homeSearchparam = ''; // supply, borrow
  isFlashing = false;
  flashingTimer = null;

  miningRefreshKey = 0;

  constructor(rootStore) {
    this.rootStore = rootStore; // Access other stores like WalletStore if needed
    makeAutoObservable(this);
  }

  bumpMiningRefresh = () => {
    this.miningRefreshKey += 1;
  };

  get supplyCount() {
    return this.positionData?.vaults?.length || 0;
  }

  get borrowCount() {
    return this.positionData?.collateralCount || 0;
  }

  // --- Actions (Mutate State) ---
  setActiveTab = tab => {
    this.activeTab = tab;
    this.currentPage = 1;
    this.filters = {
      supplyTokens: [],
      collateralTokens: [],
      keyword: ''
    };
    this.sorter = {
      sort: '',
      order: ''
    };
    this.isFiltered = false;
    this.myVaultFold = this.userVaults?.length === 0;
    this.myMarketFold = this.userMarkets?.length === 0;

    this.fetchList();
  };

  setMyVaultFold = fold => {
    this.myVaultFold = fold;
  };

  setMyMarketFold = fold => {
    this.myMarketFold = fold;
  };

  setFilter = (filterType, value) => {
    this.filters[filterType] = value;
    this.currentPage = 1;
    this.isFiltered = true;
    this.fetchList();
  };

  setPage = page => {
    this.currentPage = page;
    this.fetchList();
  };

  setSorter = (sort, order) => {
    this.sorter = { sort, order };
    this.fetchList();
  };

  fetchList = (loading, foldState) => {
    if (this.activeTab === 'supply') {
      this.fetchVaultList(loading, foldState);
    } else {
      this.fetchMarketList(loading, foldState);
    }
  };

  setClearAll = () => {
    this.filters = {
      supplyTokens: [],
      collateralTokens: [],
      keyword: ''
    };
    this.sorter = {
      sort: '',
      order: ''
    };
    this.currentPage = 1;
  };

  getDataInterval = () => {
    let timer = setInterval(() => {
      this.fetchList(false, false);
      this.fetchChartData(false);
      this.fetchPosition(false);
      this.getUserBalance(this.allUserTokens);
      this.bumpMiningRefresh();
    }, 60000);

    return timer;
  };

  fetchPosition = async (needLoading = true) => {
    const address = this.rootStore.network.defaultAccount;
    if (!address) {
      this.positionLoading = false;
      return;
    }
    if (needLoading) this.positionLoading = true;

    try {
      const response = await getMyPosition(address);
      if (response.success) {
        runInAction(() => {
          this.positionData = response.data;
        });
      }
      if (this.rootStore.user.totalBorrowUsdForUSDD === '--') {
        await this.rootStore.user.getUserData();
      } else {
        this.rootStore.lend.getCurrentBlock();
      }
    } catch (error) {
      console.error('Failed to fetch position data', error);
    } finally {
      runInAction(() => {
        this.positionLoading = false;
      });
    }
  };

  setFilterParams = (params = {}) => {
    if (this.rootStore.network.defaultAccount) {
      params.address = this.rootStore.network.defaultAccount;
    }
    if (this.filters.supplyTokens.length) {
      params.deposit = this.filters.supplyTokens.join(',');
    }
    if (this.filters.collateralTokens.length) {
      params.collateral = this.filters.collateralTokens.join(',');
    }
    if (this.filters.keyword) {
      params.keyword = this.filters.keyword;
    }
    if (this.sorter.sort) {
      params.sort = this.sorter.sort;
      params.order = this.sorter.order;
    }

    return params;
  };

  
  getUserBalance = async (tokens = []) => {
    if (this.rootStore.network.defaultAccount) {
      const userAddress = this.rootStore.network.defaultAccount;

      try {
        const balanceInfos = await getBalanceNew(userAddress, tokens);

        
        if (balanceInfos[WTRXAddress]) {
          const result = await getTrxBalanceQuick(userAddress);
          if (result.success) {
            balanceInfos[WTRXAddress] = result.balance.times(v1Config.trxPrecision);
          }
        }

        this.userBalances = balanceInfos;
      } catch (error) {
        console.error('Failed to fetch user balance', error);
      }
    }
  };

  fetchMarketList = async (loading = true, foldState = true) => {
    this.currentPage === 1 ? (this.listLoading = !!loading) : (this.moreLoading = true);
    try {
      const params = { userPage: 1, userPageSize: 1000, allPage: 1, allPageSize: 20 * this.currentPage }; // Fetch all data
      this.setFilterParams(params);
      const response = await getIndexMarketList(params);
      const data = response.data || {};

      runInAction(() => {
        this.allMarkets = (data.allMarkets || []).map(item => {
          item.collateralSymbol = formatTokenSymbol(item.collateralAddress, item.collateralSymbol);
          item.loanSymbol = formatTokenSymbol(item.loanAddress, item.loanSymbol);
          return item;
        });
        this.userMarkets = (data.userMarkets || [])
          .map(item => {
            item.collateralSymbol = formatTokenSymbol(item.collateralAddress, item.collateralSymbol);
            item.loanSymbol = formatTokenSymbol(item.loanAddress, item.loanSymbol);
            return item;
          })
          .sort((a, b) => BigNumber(b.risk).minus(a.risk).toNumber());
        this.allMarketsCount = data.allMarketsCount || 0;

        if (foldState) {
          if (this.isFiltered) {
            this.myMarketFold = false;
          } else {
            this.myMarketFold = data?.userMarketsCount == 0;
          }
        }
      });
    } catch (error) {
      console.error('Failed to fetch market list', error);
      runInAction(() => {
        this.allMarkets = [];
        this.userMarkets = [];
        this.allMarketsCount = 0;
      });
    } finally {
      runInAction(() => {
        this.currentPage === 1 ? (this.listLoading = false) : (this.moreLoading = false);
      });
    }
  };

  fetchVaultList = async (loading = true, foldState = true) => {
    this.currentPage === 1 ? (this.listLoading = loading) : (this.moreLoading = true);
    try {
      const params = { userPage: 1, userPageSize: 1000, allPage: 1, allPageSize: 20 * this.currentPage }; // Fetch all data
      this.setFilterParams(params);

      const response = await getIndexVaultList(params);
      const data = response.data || {};

      
      const userTokens = data.collateralTokens?.map(vault => vault.address) || [];
      const allTokens = data.depositTokens?.map(vault => vault.address) || [];
      const newTokenArr = Array.from(new Set([...userTokens, ...allTokens]));

      
      if (!isEqual(this.allUserTokens, newTokenArr)) {
        this.getUserBalance(newTokenArr);
      }

      runInAction(() => {
        this.allVaults = (data.allVaults?.list || []).map(item => {
          item.assetSymbol = formatTokenSymbol(item.assetAddress, item.assetSymbol);
          item.vaultName = formatVaultName(item.vaultName);
          return item;
        });
        this.userVaults = (data.userVaults?.list || []).map(item => {
          item.assetSymbol = formatTokenSymbol(item.assetAddress, item.assetSymbol);
          item.vaultName = formatVaultName(item.vaultName);
          return item;
        });
        this.allVaultsCount = data.allVaults?.totalCount || 0;
        this.collateralTokens = data.collateralTokens || [];
        this.supplyTokens = data.depositTokens || [];
        this.allUserTokens = newTokenArr;

        if (foldState) {
          if (this.isFiltered) {
            this.myVaultFold = false;
          } else {
            this.myVaultFold = data.userVaults?.totalCount == 0;
          }
        }
      });
    } catch (error) {
      console.error('Failed to fetch market list', error);
      runInAction(() => {
        this.allVaults = [];
        this.userVaults = [];
        this.allVaultsCount = 0;
        this.userVaultsCount = 0;
        this.collateralTokens = [];
        this.supplyTokens = [];
      });
    } finally {
      runInAction(() => {
        this.currentPage === 1 ? (this.listLoading = false) : (this.moreLoading = false);
      });
    }
  };

  fetchChartData = async (needLoading = true) => {
    const address = this.rootStore.network.defaultAccount;
    if (!address) {
      this.chartLoading = false;
      return;
    }
    if (needLoading) this.chartLoading = true;

    try {
      const response = await getIndexHistory(address, 'ONE_DAY');

      if (response.data?.supplyList?.length) {
        runInAction(() => {
          this.chartData = response.data;
        });
      }
    } catch (error) {
      console.error('Failed to fetch chart data', error);
    } finally {
      runInAction(() => {
        this.chartLoading = false;
      });
    }
  };

  showPositionV1Modal = () => {
    runInAction(() => {
      this.isPositionModalShow = true;
    });
  };

  closePositionV1Modal = () => {
    runInAction(() => {
      this.isPositionModalShow = false;
    });
  };

  setHomeSearchparam = param => {
    this.homeSearchparam = param;
  };

  flashingAnimation = debounce(async () => {
    this.flashingTimer && clearTimeout(this.flashingTimer);
    this.isFlashing = true;

    this.flashingTimer = setTimeout(() => {
      clearTimeout(this.flashingTimer);
      this.isFlashing = false;
    }, 7000);
  });

  flashingEnd = () => {
    this.isFlashing = false;
  };
}
