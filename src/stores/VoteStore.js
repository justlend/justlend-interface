import { observable, action, makeObservable } from 'mobx';
import intl from 'react-intl-universal';
import BigNumber from 'bignumber.js';
import Config from '../config';
import { tokenBalanceOf } from '../utils/blockchain';
import { getVoteList, getUserDetail } from '../utils/backend';
const { voteDetailFilePath } = Config;

export default class VoteStore {
  @observable voteSourceList = [];
  @observable voteSourceData = null;
  @observable voteInfo = null;
  @observable oldVoteInfo = null;
  @observable voteForPop = false;
  @observable voteForPopIsFor = true;
  @observable voteForPopProposalId = null;
  @observable redeemFromVotePop = false;
  @observable redeemFromVotePopProposalId = null;
  @observable exchangeVotePop = false;
  @observable authorizePop = false;
  @observable withdrawPop = false;
  @observable voteDetailData = null;
  @observable lockNum = BigNumber(0);
  @observable addVote = null;
  @observable votedList = null;
  @observable userCanRedeemVoteList = [];
  @observable userVotingVote = [];
  @observable userCanRedeemVoteNum = null;
  @observable userVotingVoteNum = null;
  @observable voteDetailModalVisible = false;
  @observable voteOldWithdrawModalVisible = false;
  @observable swapJstToVoteModalVisible = false;

  constructor(rootStore) {
    this.rootStore = rootStore;
    makeObservable(this);
  }

  @action
  setVoteSourceList(data) {
    this.voteSourceList = data;
  }

  @action
  setUserVotingVoteNum(data) {
    this.userVotingVoteNum = data;
  }

  @action
  setRedeemFromVotePop(visible) {
    this.redeemFromVotePop = visible;
  }

  @action
  setRedeemFromVotePopProposalId(data) {
    this.redeemFromVotePopProposalId = data;
  }

  @action
  setVoteForPopIsFor(data) {
    this.voteForPopIsFor = data;
  }

  @action
  setVoteForPopProposalId(data) {
    this.voteForPopProposalId = data;
  }

  @action
  setSwapJstToVoteModalVisible(visible) {
    this.swapJstToVoteModalVisible = visible;
  }

  @action
  setVoteDetailModalVisible(visible) {
    this.voteDetailModalVisible = visible;
  }

  @action
  setVoteOldWithdrawModalVisible(visible) {
    this.voteOldWithdrawModalVisible = visible;
  }

  @action
  setVoteSourceData(data) {
    this.voteSourceData = data;
  }

  @action
  setVotedList(data) {
    this.votedList = data;
  }

  @action
  setVoteDetailData(data) {
    this.voteDetailData = data;
  }

  @action
  setAddVote(data) {
    this.addVote = data;
  }

  @action
  setUserCanRedeemVoteList(data) {
    this.userCanRedeemVoteList = data;
  }

  @action
  setUserCanRedeemVoteNum(data) {
    this.userCanRedeemVoteNum = data;
  }

  @action
  setLockNum(data) {
    this.lockNum = data;
  }

  @action
  setOldVoteInfo(data) {
    this.oldVoteInfo = data;
  }

  @action
  setVoteInfo(data) {
    this.voteInfo = data;
  }

  @action
  setVoteForPop(data) {
    this.voteForPop = data;
  }

  @action
  setExchangeVotePop(data) {
    this.exchangeVotePop = data;
  }

  @action
  setAuthorizePop(data) {
    this.authorizePop = data;
  }

  @action
  setWithdrawPop(data) {
    this.withdrawPop = data;
  }

  @action
  setData(name, value) {
    this[name] = value;
  }

  hideVoteForPop = () => {
    this.setVoteForPop(false);
  };

  hideExchangeVotePop = () => {
    this.setExchangeVotePop(false);
  };

  hideAuthorizePop = () => {
    this.setAuthorizePop(false);
  };

  hideWithdrawPop = () => {
    this.setWithdrawPop(false);
  };

  getVoteBalanceOf = async token => {
    const address = this.rootStore.network.defaultAccount || Config.defaultAddress;
    try {
      const { balance, allowance, success } = await tokenBalanceOf(token, address);
      if (success) {
        return allowance;
      }
    } catch (error) {
      console.log(`getTokenBalance error`, error);
    }
  };

  getVoteList = async () => {
    let block = await this.rootStore.lend.getCurrentBlock();
    let listData = await getVoteList(block);

    if (!listData || !listData.proposalList) {
      console.error('getVoteList: listData or listData.proposalList is undefined or null.');
      this.setVoteSourceList([]);
      this.setVoteSourceData({});
      return { arr: [], obj: {} };
    }

    let voteList = listData.proposalList;
    if (voteList.length === 0) {
      console.warn('getVoteList: listData.proposalList is empty.');
      // Still set empty data if the input list is empty
      this.setVoteSourceList([]);
      this.setVoteSourceData({});
      return { arr: [], obj: {} };
    }

    // Process all items, attempt to enrich them, but include all of them.
    const processedItems = await Promise.all(
      voteList.map(async (originalItem, index) => {
        // Work with a copy
        let item = { ...originalItem };

        // 1. Map state to internationalized strings
        if (item.state === 0) {
          item.intl = intl.get('trans_status.pending');
        } else if (item.state === 1 || item.state === -1) {
          // State -1 will be handled later
          item.intl = intl.get('vote.status_active');
        } else if (item.state === 2) {
          item.intl = intl.get('vote.status_canceld');
        } else if (item.state === 3) {
          item.intl = intl.get('vote.status_failed');
        } else if (item.state === 4) {
          item.intl = intl.get('vote.status_passed');
        } else if (item.state === 5) {
          item.intl = intl.get('vote.status_passed');
          item.exIntl = intl.get('vote.status_queued');
        } else if (item.state === 6) {
          item.intl = intl.get('vote.status_passed');
          item.exIntl = intl.get('vote.status_expired');
        } else if (item.state === 7) {
          item.intl = intl.get('vote.status_passed');
          item.exIntl = intl.get('vote.status_executed');
        }

        // 2. Attempt to fetch and apply voteDetailFile
        let voteDetailFile = await this.getVoteDetailFile(item.proposalId);

        if (voteDetailFile) {
          // Update title/content from detail file if current item's state is -1,
          // or if title/content are missing.
          if (voteDetailFile.default?.notValid) item.notValid = true;
          if (item.state === -1 || !item.title || !item.content) {
            if (
              voteDetailFile.default &&
              voteDetailFile.default.title !== undefined &&
              voteDetailFile.default.content !== undefined
            ) {
              item.title = voteDetailFile.default.title;
              item.content = voteDetailFile.default.content;
            } else {
              item.title = voteDetailFile.title;
              item.content = voteDetailFile.content;
            }
          }
        } else {
          // voteDetailFile is falsy (missing).
          // Per your request, we "ignore" this for exclusion.
          // The item will be included with its current title/content.
          // console.log(
          //   `Proposal ID ${item.proposalId}: voteDetailFile was not found. Proceeding with existing item data (State: ${item.state}, Title: '${item.title}').`
          // );
        }

        // 3. Normalize state: if state was -1, it's treated as active (1)
        // This also ensures that if it was -1 and voteDetailFile updated it, it now becomes state 1.
        if (item.state === -1) {
          item.state = 1;
        }

        return item; // Return the processed item
      })
    );

    // 'processedItems' now contains all items, potentially enriched.
    let finalArr = processedItems;

    // 4. Sort the array
    finalArr.slice().sort((item1, item2) => {
      return item2.proposalId - item1.proposalId;
    });

    // 5. Create the object map
    let finalObj = {};
    for (const item of finalArr) {
      finalObj[item.proposalId] = item;
    }

    this.setVoteSourceList(finalArr);
    this.setVoteSourceData(finalObj);

    return { arr: finalArr, obj: finalObj };
  };

  getBalanceForVote = async () => {
    const defaultAccount = this.rootStore.network.defaultAccount || Config.defaultAddress;
    let voteInfo = await this.rootStore.system.getVoteInfo(
      Config.contract.poly,
      defaultAccount,
      Config.contract.JST,
      Config.contract.WJSTAddress
    );
    this.setVoteInfo(voteInfo);
  };

  getOldWjstBalanceForVote = async () => {
    const defaultAccount = this.rootStore.network.defaultAccount || Config.defaultAddress;
    let oldVoteInfo = await this.rootStore.system.getVoteInfo(
      Config.contract.poly,
      defaultAccount,
      Config.contract.JST,
      Config.contract.oldWJSTAddress
    );

    this.setOldVoteInfo(oldVoteInfo);
  };

  getUserDetail = async proposalId => {
    let block = await this.rootStore.lend.getCurrentBlock();
    const address = this.rootStore.network.defaultAccount || Config.defaultAddress;
    let res = await getUserDetail(address, block);
    if (res.success) {
      const votedList = [];
      for (let item of res.data.statusList) {
        if (BigNumber(item.forVotes).gt(0) || BigNumber(item.againstVotes).gt(0)) {
          votedList.push(item.proposalId);
        }
      }
      this.setVotedList(votedList);
      let voteDetail = res.data.statusList.filter(item => Number(item.proposalId) === Number(proposalId))[0];
      if (voteDetail && BigNumber(voteDetail.forVotes).gt(0)) {
        this.setAddVote('yes');
      } else if (BigNumber(voteDetail && voteDetail.againstVotes).gt(0)) {
        this.setAddVote('no');
      } else {
        this.setAddVote(null);
      }
    } else {
      return null;
    }
  };

  getVoteDetail = async proposalId => {
    try {
      let res = await this.getVoteList();

      this.setVoteDetailData(res.obj[proposalId]);
      this.getUserDetail(proposalId);
      this.getUserVote(proposalId);
      this.getBalanceForVote();
      this.getOldWjstBalanceForVote();
    } catch (error) {
      console.log('getvoteDetail: ', error);
    }
  };

  getUserWithdrawInfo = async () => {
    let block = await this.rootStore.lend.getCurrentBlock();
    // const address = this.rootStore.network.defaultAccount || Config.defaultAddress;
    const address = this.rootStore.network.defaultAccount || window.defaultAccount;
    let res = await getUserDetail(address, block);
    if (res.success) {
      // eslint-disable-next-line no-unused-expressions
      res.data?.statusList &&
        res.data?.statusList?.length > 0 &&
        res.data?.statusList.map(item => {
          const { againstVotes, abstainVotes, forVotes } = item;
          item.allVotes = new BigNumber(againstVotes)
            .plus(abstainVotes)
            .plus(forVotes)
            .div(Config.tokenDefaultPrecision)
            .toString();
        });
      const userCanRedeemVoteList = res.data?.statusList.filter(item => item.state !== 2 && item.canWithdraw);
      this.setUserCanRedeemVoteList(userCanRedeemVoteList);

      let userCanRedeemVoteNum = userCanRedeemVoteList.reduce(
        (sum, e) => BigNumber(sum).plus(BigNumber(e.allVotes || 0)),
        0
      );
      this.setUserCanRedeemVoteNum(userCanRedeemVoteNum);

      this.setData(
        'userVotingVote',
        res.data?.statusList.filter(item => item.state !== 2 && !item.canWithdraw)
      );

      const userVotingVoteNum = this.userVotingVote.reduce(
        (sum, e) => BigNumber(sum).plus(BigNumber(e.allVotes || 0)),
        0
      );
      this.setUserVotingVoteNum(userVotingVoteNum);
    } else {
      return null;
    }
  };

  getUserVote = async proposalId => {
    const { defaultAccount } = this.rootStore.network;
    const voteDetailData = this.voteDetailData;
    if (voteDetailData) {
      // 1: active 2: pending
      let vote = {
        userAddr: defaultAccount,
        proposalId,
        contractAddr: Config.contract.WJSTAddress
      };
      let lockNum = await this.rootStore.system.lockTo(vote);
      this.setLockNum(lockNum);
    }
  };

  getVoteDetailFile = async proposalId => {
    try {
      const module = await import(`../locales/${voteDetailFilePath}/vote-detail-${proposalId}.jsx`);
      return module.default || module;
    } catch (error) {
      return Promise.resolve({
        default: {
          title: intl.get('vote.number_proposal', { number: proposalId }),
          content: `New Content from Detail for ${proposalId}`,
          notValid: true
        }
      });
    }
  };
}
