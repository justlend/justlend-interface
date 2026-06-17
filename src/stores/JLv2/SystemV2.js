// Libraries
import { TronWeb } from 'tronweb';
import { makeObservable } from 'mobx';
import Config from '../../config/v2config';
import { BigNumber, toFixedUp } from '../../utils/helper';
import { triggerSmartContract, MAX_UINT256 } from '../../utils/blockchain';

const { contracts, callValueRate, trxPrecision } = Config;
Config.MoolahAddress = contracts.MoolahProxy;
Config.TRXProviderAddress = contracts.TrxProviderProxy;
// VaultAllocator is not enabled in the current frontend flow.
// Config.VaultAllocatorAddress = contracts.VaultAllocatorProxy;
Config.PublicLiquidatorAddress = contracts.PublicLiquidatorProxy;

const toChainAmount = (amount, decimals) => {
  return new BigNumber(amount).times(new BigNumber(10).pow(decimals)).toString();
};

export default class ProtocolService {
  constructor(rootStore) {
    this.rootStore = rootStore;
    makeObservable(this);
  }

  /**
   * Generic method for calling view/pure functions on a contract.
   * @returns The decoded result from the contract call.
   */
  view = async (address, functionSelector, parameters = []) => {
    try {
      const result = await triggerSmartContract(address, functionSelector, { _isConstant: true }, parameters);
      return result && result.result ? result.constant_result : [];
    } catch (error) {
      console.error(`View error ${address} - ${functionSelector}`, error.message ? error.message : error);
      return [];
    }
  };

  
  _getMarketCallbacks = (marketId, userAddress) => {
    return [
      ['marketV2', 'fetchAllMarketData', marketId, userAddress],
      ['dashboard', 'fetchPosition', userAddress] 
    ];
  };

  _getVaultCallbacks = (vaultAddress, userAddress) => {
    return [
      ['vaultV2', 'fetchAllVaultData', vaultAddress, userAddress],
      ['dashboard', 'fetchPosition', userAddress]
    ];
  };

  tronHexToAbiHex(tronBase58) {
    const tronHex = TronWeb.address.toHex(tronBase58);
    if (tronHex.startsWith('41')) {
      return '0x' + tronHex.slice(2);
    }
    return tronHex;
  }

  approve = async (tokenAddress, spenderAddress, v2ModalInfo) => {
    const { system: systemStore } = this.rootStore;
    const functionSelector = 'approve(address,uint256)';
    const parameters = [
      { type: 'address', value: spenderAddress },
      { type: 'uint256', value: MAX_UINT256 }
    ];
    const feeLimit = await this.rootStore.system.getFeeLimitCommon(tokenAddress, functionSelector, parameters);
    const options = { feeLimit };
    const result = await systemStore.triggerV2(tokenAddress, functionSelector, parameters, options, v2ModalInfo);
    return result;
  };

  // =================================================================
  // TRXProvider.sol - For native TRX interactions
  // =================================================================

  depositTrxToVault = async (vaultAddress, amount, v2ModalInfo) => {
    const { system: systemStore, network: networkStore } = this.rootStore;
    const functionSelector = 'deposit(address,address)';
    const callValue = BigNumber(amount).times(trxPrecision).toString();
    const parameters = [
      { type: 'address', value: vaultAddress },
      { type: 'address', value: networkStore.defaultAccount }
    ];
    const feeLimit = await this.rootStore.system.getFeeLimitCommon(
      Config.contracts.TrxProviderProxy,
      functionSelector,
      parameters
    );
    const options = { callValue, feeLimit };
    const result = await systemStore.triggerV2(
      Config.contracts.TrxProviderProxy,
      functionSelector,
      parameters,
      options,
      v2ModalInfo
    );
    return result;
  };

  estimateSupplyTrxGas = async (vaultAddress, amount) => {
    const { system: systemStore, network: networkStore } = this.rootStore;
    const functionSelector = 'deposit(address,address)';
    const callValue = BigNumber(amount).times(trxPrecision).toString();
    const options = { _isConstant: true, callValue };
    const parameters = [
      { type: 'address', value: vaultAddress },
      { type: 'address', value: networkStore.defaultAccount }
    ];
    const result = await systemStore.triggerEnergy(
      Config.contracts.TrxProviderProxy,
      functionSelector,
      parameters,
      options
    );
    return result && result.energy_used;
  };

  redeemTrxFromVault = async (vaultAddress, assets, vaultShareDecimals, v2ModalInfo, shares) => {
    const { system: systemStore, network: networkStore } = this.rootStore;
    let functionSelector = 'withdraw(address,uint256,address,address)';
    if (shares) functionSelector = 'redeem(address,uint256,address,address)';
    const parameters = [
      { type: 'address', value: vaultAddress },
      { type: 'uint256', value: shares ? shares : toChainAmount(assets, vaultShareDecimals) },
      { type: 'address', value: networkStore.defaultAccount }, // receiver
      { type: 'address', value: networkStore.defaultAccount } // owner
    ];
    const feeLimit = await this.rootStore.system.getFeeLimitCommon(
      Config.contracts.TrxProviderProxy,
      functionSelector,
      parameters
    );
    const options = { feeLimit };
    const result = await systemStore.triggerV2(
      Config.contracts.TrxProviderProxy,
      functionSelector,
      parameters,
      options,
      v2ModalInfo
    );
    return result;
  };

  supplyTrxAsCollateral = async (marketParams, amount, v2ModalInfo) => {
    const functionSelector = 'supplyCollateral((address,address,address,address,uint256),address,bytes)';
    const { borrowAddress: loanToken, collateralAddress: collateralToken, oracle, irm, lltv } = marketParams;
    const callValue = BigNumber(amount).times(trxPrecision).toString();
    const parameters = [
      {
        type: '(address,address,address,address,uint256)',
        value: [
          this.tronHexToAbiHex(loanToken),
          this.tronHexToAbiHex(collateralToken),
          this.tronHexToAbiHex(oracle),
          this.tronHexToAbiHex(irm),
          BigNumber(lltv).times(1e18).toString()
        ]
      },
      { type: 'address', value: this.rootStore.network.defaultAccount },
      { type: 'bytes', value: '0x' }
    ];
    const feeLimit = await this.rootStore.system.getFeeLimitCommon(
      Config.contracts.TrxProviderProxy,
      functionSelector,
      parameters
    );
    const options = { callValue, feeLimit };
    const result = await this.rootStore.system.triggerV2(
      Config.contracts.TrxProviderProxy,
      functionSelector,
      parameters,
      options,
      v2ModalInfo
    );
    return result;
  };

  estimateCollateralTrxGas = async (marketParams, amount) => {
    const { system: systemStore } = this.rootStore;
    const { borrowAddress: loanToken, collateralAddress: collateralToken, oracle, irm, lltv } = marketParams;
    const functionSelector = 'supplyCollateral((address,address,address,address,uint256),address,bytes)';
    const callValue = BigNumber(amount).times(trxPrecision).toString();
    const options = { _isConstant: true, callValue };
    const parameters = [
      {
        type: '(address,address,address,address,uint256)',
        value: [
          this.tronHexToAbiHex(loanToken),
          this.tronHexToAbiHex(collateralToken),
          this.tronHexToAbiHex(oracle),
          this.tronHexToAbiHex(irm),
          BigNumber(lltv).times(1e18).toString()
        ]
      },
      { type: 'address', value: this.rootStore.network.defaultAccount },
      { type: 'bytes', value: '0x' }
    ];
    const result = await systemStore.triggerEnergy(
      Config.contracts.TrxProviderProxy,
      functionSelector,
      parameters,
      options
    );
    return result && result.energy_used;
  };

  borrowTrx = async (marketParams, amount, v2ModalInfo) => {
    const { system: systemStore, network: networkStore } = this.rootStore;
    const functionSelector = 'borrow((address,address,address,address,uint256),uint256,uint256,address,address)';
    const { borrowAddress: loanToken, collateralAddress: collateralToken, oracle, irm, lltv } = marketParams;
    const assets = BigNumber(amount).times(trxPrecision).toString();
    const parameters = [
      {
        type: '(address,address,address,address,uint256)',
        value: [
          this.tronHexToAbiHex(loanToken),
          this.tronHexToAbiHex(collateralToken),
          this.tronHexToAbiHex(oracle),
          this.tronHexToAbiHex(irm),
          BigNumber(lltv).times(1e18).toString()
        ]
      },
      { type: 'uint256', value: assets },
      { type: 'uint256', value: 0 },
      { type: 'address', value: networkStore.defaultAccount },
      { type: 'address', value: networkStore.defaultAccount }
    ];
    const feeLimit = await this.rootStore.system.getFeeLimitCommon(
      Config.contracts.TrxProviderProxy,
      functionSelector,
      parameters
    );
    const options = { feeLimit };
    const result = await systemStore.triggerV2(
      Config.contracts.TrxProviderProxy,
      functionSelector,
      parameters,
      options,
      v2ModalInfo
    );
    return result;
  };

  repayWithTrx = async (marketParams, amount, v2ModalInfo, sharesAmount, sharesCallValueAmount) => {
    const functionSelector = 'repay((address,address,address,address,uint256),uint256,uint256,address,bytes)';
    const { borrowAddress: loanToken, collateralAddress: collateralToken, oracle, irm, lltv } = marketParams;
    const assets = BigNumber(amount).times(trxPrecision).toString();
    let callValue = BigNumber(amount).times(trxPrecision).toString();
    if (sharesCallValueAmount) callValue = sharesCallValueAmount;
    const parameters = [
      {
        type: '(address,address,address,address,uint256)',
        value: [
          this.tronHexToAbiHex(loanToken),
          this.tronHexToAbiHex(collateralToken),
          this.tronHexToAbiHex(oracle),
          this.tronHexToAbiHex(irm),
          BigNumber(lltv).times(1e18).toString()
        ]
      },
      { type: 'uint256', value: sharesAmount ? 0 : assets },
      { type: 'uint256', value: sharesAmount ? sharesAmount : 0 },
      { type: 'address', value: this.rootStore.network.defaultAccount },
      { type: 'bytes', value: '0x' }
    ];
    const feeLimit = await this.rootStore.system.getFeeLimitCommon(
      Config.contracts.TrxProviderProxy,
      functionSelector,
      parameters
    );
    const options = { callValue, feeLimit };
    const result = await this.rootStore.system.triggerV2(
      Config.contracts.TrxProviderProxy,
      functionSelector,
      parameters,
      options,
      v2ModalInfo
    );
    return result;
  };

  estimateRepayTrxGas = async (marketParams, amount, sharesAmount, sharesCallValueAmount) => {
    const { system: systemStore } = this.rootStore;
    const { borrowAddress: loanToken, collateralAddress: collateralToken, oracle, irm, lltv } = marketParams;
    const functionSelector = 'repay((address,address,address,address,uint256),uint256,uint256,address,bytes)';
    let assets = BigNumber(amount).times(trxPrecision).toString();
    let callValue = BigNumber(amount).times(trxPrecision).toString();
    if (sharesCallValueAmount) callValue = sharesCallValueAmount;
    const options = { _isConstant: true, callValue };
    const parameters = [
      {
        type: '(address,address,address,address,uint256)',
        value: [
          this.tronHexToAbiHex(loanToken),
          this.tronHexToAbiHex(collateralToken),
          this.tronHexToAbiHex(oracle),
          this.tronHexToAbiHex(irm),
          BigNumber(lltv).times(1e18).toString()
        ]
      },
      { type: 'uint256', value: sharesAmount ? 0 : assets },
      { type: 'uint256', value: sharesAmount ? sharesAmount : 0 },
      { type: 'address', value: this.rootStore.network.defaultAccount },
      { type: 'bytes', value: '0x' }
    ];
    const result = await systemStore.triggerEnergy(
      Config.contracts.TrxProviderProxy,
      functionSelector,
      parameters,
      options
    );
    return result && result.energy_used;
  };

  estimateLiquidateTrxGas = async amount => {
    const { system: systemStore } = this.rootStore;
    const functionSelector = 'deposit()';
    const callValue = BigNumber(amount).times(trxPrecision).toString();
    const parameters = [];
    const options = { callValue, _isConstant: true };
    const result = await systemStore.triggerEnergy(
      Config.contracts.WtrxContractProxy,
      functionSelector,
      parameters,
      options
    );
    return result && result.energy_used;
  };

  withdrawTrxCollateral = async (marketParams, amount, v2ModalInfo) => {
    const { system: systemStore, network: networkStore } = this.rootStore;
    const { borrowAddress: loanToken, collateralAddress: collateralToken, oracle, irm, lltv } = marketParams;
    const functionSelector = 'withdrawCollateral((address,address,address,address,uint256),uint256,address,address)';
    const assets = BigNumber(amount).times(trxPrecision).toString();
    const parameters = [
      {
        type: '(address,address,address,address,uint256)',
        value: [
          this.tronHexToAbiHex(loanToken),
          this.tronHexToAbiHex(collateralToken),
          this.tronHexToAbiHex(oracle),
          this.tronHexToAbiHex(irm),
          BigNumber(lltv).times(1e18).toString()
        ]
      },
      { type: 'uint256', value: assets },
      { type: 'address', value: networkStore.defaultAccount }, // onBehalf
      { type: 'address', value: networkStore.defaultAccount } // receiver (payable)
    ];
    const feeLimit = await this.rootStore.system.getFeeLimitCommon(
      Config.contracts.TrxProviderProxy,
      functionSelector,
      parameters
    );
    const options = { feeLimit };
    const result = await systemStore.triggerV2(
      Config.contracts.TrxProviderProxy,
      functionSelector,
      parameters,
      options,
      v2ModalInfo
    );
    return result;
  };

  // =================================================================
  // Moolah.sol - Core lending protocol
  // =================================================================

  supply = async (marketParams, amount, decimals, v2ModalInfo) => {
    const functionSelector = 'supply(bytes,uint256,uint256,address,bytes)';
    const parameters = [
      { type: 'bytes', value: marketParams },
      { type: 'uint256', value: toChainAmount(amount, decimals) },
      { type: 'uint256', value: 0 },
      { type: 'address', value: this.rootStore.network.defaultAccount }, // Get user address from store
      { type: 'bytes', value: '' }
    ];
    const feeLimit = await this.rootStore.system.getFeeLimitCommon(Config.MoolahAddress, functionSelector, parameters);
    const options = { feeLimit };
    return await this.rootStore.system.triggerV2(
      Config.MoolahAddress,
      functionSelector,
      parameters,
      options,
      v2ModalInfo
    );
  };

  withdraw = async (marketParams, amount, decimals, v2ModalInfo) => {
    const functionSelector = 'withdraw(bytes,uint256,uint256,address,address)';
    const parameters = [
      { type: 'bytes', value: marketParams },
      { type: 'uint256', value: toChainAmount(amount, decimals) },
      { type: 'uint256', value: 0 },
      { type: 'address', value: this.rootStore.network.defaultAccount },
      { type: 'address', value: this.rootStore.network.defaultAccount }
    ];
    const feeLimit = await this.rootStore.system.getFeeLimitCommon(Config.MoolahAddress, functionSelector, parameters);
    const options = { feeLimit };
    return await this.rootStore.system.triggerV2(
      Config.MoolahAddress,
      functionSelector,
      parameters,
      options,
      v2ModalInfo
    );
  };

  borrow = async (marketParams, amount, decimals, v2ModalInfo) => {
    const functionSelector = 'borrow((address,address,address,address,uint256),uint256,uint256,address,address)';
    const { borrowAddress: loanToken, collateralAddress: collateralToken, oracle, irm, lltv } = marketParams;
    const parameters = [
      {
        type: '(address,address,address,address,uint256)',
        value: [
          this.tronHexToAbiHex(loanToken),
          this.tronHexToAbiHex(collateralToken),
          this.tronHexToAbiHex(oracle),
          this.tronHexToAbiHex(irm),
          BigNumber(lltv).times(1e18).toString()
        ]
      },
      { type: 'uint256', value: toChainAmount(amount, decimals) },
      { type: 'uint256', value: 0 },
      { type: 'address', value: this.rootStore.network.defaultAccount },
      { type: 'address', value: this.rootStore.network.defaultAccount }
    ];
    const feeLimit = await this.rootStore.system.getFeeLimitCommon(Config.MoolahAddress, functionSelector, parameters);
    const options = { feeLimit };
    const result = await this.rootStore.system.triggerV2(
      Config.MoolahAddress,
      functionSelector,
      parameters,
      options,
      v2ModalInfo
    );
    return result;
  };

  repay = async (marketParams, amount, decimals, v2ModalInfo, sharesAmount) => {
    const functionSelector = 'repay((address,address,address,address,uint256),uint256,uint256,address,bytes)';
    const { borrowAddress: loanToken, collateralAddress: collateralToken, oracle, irm, lltv } = marketParams;
    const parameters = [
      {
        type: '(address,address,address,address,uint256)',
        value: [
          this.tronHexToAbiHex(loanToken),
          this.tronHexToAbiHex(collateralToken),
          this.tronHexToAbiHex(oracle),
          this.tronHexToAbiHex(irm),
          BigNumber(lltv).times(1e18).toString()
        ]
      },
      { type: 'uint256', value: sharesAmount ? 0 : toChainAmount(amount, decimals) },
      { type: 'uint256', value: sharesAmount ? sharesAmount : 0 },
      { type: 'address', value: this.rootStore.network.defaultAccount },
      { type: 'bytes', value: '0x' }
    ];
    const feeLimit = await this.rootStore.system.getFeeLimitCommon(Config.MoolahAddress, functionSelector, parameters);
    const options = { feeLimit };
    const result = await this.rootStore.system.triggerV2(
      Config.MoolahAddress,
      functionSelector,
      parameters,
      options,
      v2ModalInfo
    );
    return result;
  };

  supplyCollateral = async (marketParams, amount, decimals, v2ModalInfo) => {
    // const { system: systemStore, network: networkStore } = this.rootStore;
    const functionSelector = 'supplyCollateral((address,address,address,address,uint256),uint256,address,bytes)';
    const { borrowAddress: loanToken, collateralAddress: collateralToken, oracle, irm, lltv } = marketParams;
    const parameters = [
      {
        type: '(address,address,address,address,uint256)',
        value: [
          this.tronHexToAbiHex(loanToken),
          this.tronHexToAbiHex(collateralToken),
          this.tronHexToAbiHex(oracle),
          this.tronHexToAbiHex(irm),
          BigNumber(lltv).times(1e18).toString()
        ]
      },
      { type: 'uint256', value: toChainAmount(amount, decimals) },
      { type: 'address', value: this.rootStore.network.defaultAccount },
      { type: 'bytes', value: '0x' }
    ];
    const feeLimit = await this.rootStore.system.getFeeLimitCommon(Config.MoolahAddress, functionSelector, parameters);
    const options = { feeLimit };
    const result = await this.rootStore.system.triggerV2(
      Config.MoolahAddress,
      functionSelector,
      parameters,
      options,
      v2ModalInfo
    );
    return result;
  };

  withdrawCollateral = async (marketParams, amount, decimals, v2ModalInfo) => {
    const functionSelector = 'withdrawCollateral((address,address,address,address,uint256),uint256,address,address)';
    const { borrowAddress: loanToken, collateralAddress: collateralToken, oracle, irm, lltv } = marketParams;
    const parameters = [
      {
        type: '(address,address,address,address,uint256)',
        value: [
          this.tronHexToAbiHex(loanToken),
          this.tronHexToAbiHex(collateralToken),
          this.tronHexToAbiHex(oracle),
          this.tronHexToAbiHex(irm),
          BigNumber(lltv).times(1e18).toString()
        ]
      },
      { type: 'uint256', value: toChainAmount(amount, decimals) },
      { type: 'address', value: this.rootStore.network.defaultAccount },
      { type: 'address', value: this.rootStore.network.defaultAccount }
    ];
    const feeLimit = await this.rootStore.system.getFeeLimitCommon(Config.MoolahAddress, functionSelector, parameters);
    const options = { feeLimit };
    const result = await this.rootStore.system.triggerV2(
      Config.MoolahAddress,
      functionSelector,
      parameters,
      options,
      v2ModalInfo
    );
    return result;
  };

  depositTrxToWtrx = async (address, amount, v2ModalInfo) => {
    const { system: systemStore } = this.rootStore;
    const functionSelector = 'deposit()';
    const callValue = BigNumber(amount).times(trxPrecision).toString();
    const parameters = [];
    const feeLimit = await this.rootStore.system.getFeeLimitCommon(
      Config.contracts.WtrxContractProxy,
      functionSelector,
      parameters
    );
    const options = { callValue, feeLimit };
    const result = await systemStore.triggerV2(
      Config.contracts.WtrxContractProxy,
      functionSelector,
      parameters,
      options,
      v2ModalInfo,
      false,
      false
    );
    return result;
  };

  getLoanTokenAmountNeed = async (marketId, seizedAssets, repaidShares, decimals) => {
    const functionSelector = 'loanTokenAmountNeed(bytes32,uint256,uint256)';
    // console.log('getLoanTokenAmountNeed seizedAssets', repaidShares ? 0 : toChainAmount(seizedAssets, decimals));
    const parameters = [
      { type: 'bytes32', value: marketId },
      { type: 'uint256', value: repaidShares ? 0 : toChainAmount(seizedAssets, decimals) },
      { type: 'uint256', value: repaidShares || 0 }
    ];
    return await this.view(Config.PublicLiquidatorAddress, functionSelector, parameters);
  };

  liquidate = async (marketId, borrower, seizedAssets, repaidShares, decimals, v2ModalInfo) => {
    const functionSelector = 'liquidate(bytes32,address,uint256,uint256)';
    console.log('liquidate seizedAssets', repaidShares ? 0 : toChainAmount(seizedAssets, decimals));

    const parameters = [
      { type: 'bytes32', value: marketId },
      { type: 'address', value: borrower },
      { type: 'uint256', value: repaidShares ? 0 : toChainAmount(seizedAssets, decimals) },
      { type: 'uint256', value: repaidShares || 0 }
    ];
    const feeLimit = await this.rootStore.system.getFeeLimitCommon(
      Config.PublicLiquidatorAddress,
      functionSelector,
      parameters
    );
    const options = { feeLimit };

    return await this.rootStore.system.triggerV2(
      Config.PublicLiquidatorAddress,
      functionSelector,
      parameters,
      options,
      v2ModalInfo
    );
  };

  // =================================================================
  // MoolahVault.sol - Yield farming vaults
  // =================================================================

  depositToVault = async (vaultAddress, amount, decimals, v2ModalInfo) => {
    const { system: systemStore, network: networkStore } = this.rootStore;
    const functionSelector = 'deposit(uint256,address)';
    const parameters = [
      { type: 'uint256', value: toChainAmount(amount, decimals) },
      { type: 'address', value: networkStore.defaultAccount }
    ];
    const feeLimit = await this.rootStore.system.getFeeLimitCommon(vaultAddress, functionSelector, parameters);
    const options = { feeLimit };
    const result = await systemStore.triggerV2(vaultAddress, functionSelector, parameters, options, v2ModalInfo);
    return result;
  };

  redeemFromVault = async (vaultAddress, assets, decimals, v2ModalInfo, shares) => {
    let functionSelector = 'withdraw(uint256,address,address)';
    if (shares) functionSelector = 'redeem(uint256,address,address)';
    const parameters = [
      { type: 'uint256', value: shares ? shares : toChainAmount(assets, decimals) },
      { type: 'address', value: this.rootStore.network.defaultAccount },
      { type: 'address', value: this.rootStore.network.defaultAccount }
    ];
    const feeLimit = await this.rootStore.system.getFeeLimitCommon(vaultAddress, functionSelector, parameters);
    const options = { feeLimit };
    const result = await this.rootStore.system.triggerV2(
      vaultAddress,
      functionSelector,
      parameters,
      options,
      v2ModalInfo
    );
    return result;
  };

  // =================================================================
  // VaultAllocator.sol - Reallocate vault investments
  // =================================================================

  // reallocateVault = async (vaultAddress, withdrawals, supplyMarketParams, feeInTrx, v2ModalInfo) => {
  //   const functionSelector = 'reallocateTo(address,tuple[],bytes)';
  //   const feeInSun = BigNumber(feeInTrx).times(trxPrecision).toString();
  //   const parameters = [
  //     { type: 'address', value: vaultAddress },
  //     { type: 'tuple[]', value: withdrawals },
  //     { type: 'bytes', value: supplyMarketParams }
  //   ];
  //   const feeLimit = await this.rootStore.system.getFeeLimitCommon(
  //     Config.VaultAllocatorAddress,
  //     functionSelector,
  //     parameters
  //   );
  //   const options = { callValue: feeInSun, feeLimit };
  //   return await this.rootStore.system.triggerV2(
  //     Config.VaultAllocatorAddress,
  //     functionSelector,
  //     parameters,
  //     options,
  //     v2ModalInfo
  //   );
  // };
}
