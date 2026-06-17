import { observable, action, makeObservable } from 'mobx';

export default class UIStore {
  @observable networkErrorModalVisible = false;

  @observable rewardModalShow = false;
  @observable userSupplyModalShow = false;
  @observable userBorrowModalShow = false;

  @observable rewardVisible = false;
  @observable allowanceVisible = false;
  @observable miningRewardVisible = false;

  @observable showTabsBar = true;
  @observable isDepositShowMore = false;
  @observable isLendShowMore = false;
  @observable isShowMoreV2 = false;

  rootStore = null;

  constructor(rootStore) {
    this.rootStore = rootStore;
    makeObservable(this);
  }

  @action
  setUserBorrowModalShow(visible) {
    this.userBorrowModalShow = visible;
  }

  @action
  setNetworkErrorModalVisibility(visible) {
    this.networkErrorModalVisible = visible;
  }

  @action
  setRewardModalShow(visible) {
    this.rewardModalShow = visible;
  }

  @action
  setAllowanceVisible(visible) {
    this.allowanceVisible = visible;
  }

  @action
  setMiningRewardVisible(visible) {
    this.miningRewardVisible = visible;
  }

  @action
  setRewardVisible(visible) {
    this.rewardVisible = visible;
  }

  @action
  setShowTabsBar(visible) {
    this.showTabsBar = visible;
  }

  @action
  toggleShowMoreV2() {
    this.isShowMoreV2 = !this.isShowMoreV2;
  }

  @action
  toggleDepositShowMore() {
    this.isDepositShowMore = !this.isDepositShowMore;
  }

  @action
  toggleLendShowMore() {
    this.isLendShowMore = !this.isLendShowMore;
  }

  @action
  setUserSupplyModalShow(visible) {
    this.userSupplyModalShow = visible;
  }

  showNetworkErrorModal = () => {
    this.setNetworkErrorModalVisibility(true);
  };
  closeNetworkErrorModal = () => {
    this.setNetworkErrorModalVisibility(false);
  };
}
