/**
 * V2QueryService.js
 * * This service encapsulates all read-only (view/pure) calls to the JustLend V2 smart contracts.
 */
import { TronWeb } from 'tronweb';
import { view } from '../utils/blockchain';
import Config from '../config/v2config';
import { BigNumber } from '../utils/helper';

const { contracts } = Config;
Config.MoolahAddress = contracts.MoolahProxy;
const DATA_LEN = 64;

// --- Helper Functions ---

/**
 * Parses a struct returned from a view call into a named object.
 * @param {string[]} hexArray - The array of hex strings from the view call.
 * @param {string[]} keys - The keys of the struct in order.
 * @returns {object}
 */
const parseStruct = (hexArray, keys) => {
  const obj = {};
  if (!hexArray || !keys || hexArray.length !== keys.length) return null;
  keys.forEach((key, index) => {
    obj[key] = new BigNumber(hexArray[index], 16);
  });
  return obj;
};

const tronHexToAbiHex = tronBase58 => {
  const tronHex = TronWeb.address.toHex(tronBase58);
  if (tronHex.startsWith('41')) {
    return '0x' + tronHex.slice(2);
  }
  return tronHex;
};

// =================================================================
// Moolah.sol - Core Protocol Queries
// =================================================================

/**
 * Calculates the unique ID for a market based on its parameters.
 * @param {object} marketParams - { loanToken, collateralToken, oracle, irm, lltv }
 * @returns {Promise<string>} The bytes32 market ID.
 */
export const getMarketId = async marketParams => {
  const funcSelector = 'getId((address,address,address,address,uint256))';
  const parameters = [
    {
      type: 'tuple',
      value: [
        marketParams.loanToken,
        marketParams.collateralToken,
        marketParams.oracle,
        marketParams.irm,
        marketParams.lltv
      ]
    }
  ];
  const result = await view(Config.MoolahAddress, funcSelector, parameters);
  return result.length ? `0x${result[0]}` : null;
};

/**
 * Fetches the position of a user in a specific market.
 * **Real-time update needed after**: borrow, repay, supplyCollateral, withdrawCollateral, liquidate.
 * @param {string} marketId - The bytes32 ID of the market.
 * @param {string} userAddress - The user's address.
 * @returns {Promise<object|null>} Position { supplyShares, borrowShares, collateral }
 */
export const getUserPositionInMarket = async (marketId, userAddress) => {
  const funcSelector = 'position(bytes32,address)';
  const parameters = [
    { type: 'bytes32', value: marketId },
    { type: 'address', value: userAddress }
  ];
  const result = await view(Config.MoolahAddress, funcSelector, parameters);

  if (result && result.length === 1 && typeof result[0] === 'string') {
    try {
      const data = result[0];
      let dataIndex = 0;
      return {
        supplyShares: new BigNumber(data.substr(dataIndex++ * DATA_LEN, DATA_LEN), 16),
        borrowShares: new BigNumber(data.substr(dataIndex++ * DATA_LEN, DATA_LEN), 16),
        collateral: new BigNumber(data.substr(dataIndex++ * DATA_LEN, DATA_LEN), 16)
      };
    } catch (e) {
      console.error('Error manually parsing user position:', e);
      return null;
    }
  }
  console.error('Invalid result received from position view call:', result);
  return null;
};

/**
 * Fetches the global state of a specific market.
 * **Real-time update needed after**: any user interaction with the market.
 * @param {string} marketId - The bytes32 ID of the market.
 * @returns {Promise<object|null>} Market state object.
 */
export const getMarketState = async marketId => {
  const funcSelector = 'market(bytes32)';
  const parameters = [{ type: 'bytes32', value: marketId }];
  const result = await view(Config.MoolahAddress, funcSelector, parameters);

  if (result && result.length === 1 && typeof result[0] === 'string') {
    try {
      const data = result[0];
      let dataIndex = 0;
      return {
        totalSupplyAssets: new BigNumber(data.substr(dataIndex++ * DATA_LEN, DATA_LEN), 16),
        totalSupplyShares: new BigNumber(data.substr(dataIndex++ * DATA_LEN, DATA_LEN), 16),
        totalBorrowAssets: new BigNumber(data.substr(dataIndex++ * DATA_LEN, DATA_LEN), 16),
        totalBorrowShares: new BigNumber(data.substr(dataIndex++ * DATA_LEN, DATA_LEN), 16),
        lastUpdate: new BigNumber(data.substr(dataIndex++ * DATA_LEN, DATA_LEN), 16),
        fee: new BigNumber(data.substr(dataIndex++ * DATA_LEN, DATA_LEN), 16)
      };
    } catch (e) {
      console.error('Error manually parsing market state:', e);
      return null;
    }
  }
  console.error('Invalid result received from market view call:', result);
  return null;
};

/**
 * Fetches the parameters for a given market ID.
 * @param {string} marketId - The bytes32 ID of the market.
 * @returns {Promise<object|null>} MarketParams object.
 */
export const getMarketParams = async marketId => {
  const funcSelector = 'idToMarketParams(bytes32)';
  const parameters = [{ type: 'bytes32', value: marketId }];
  const result = await view(Config.MoolahAddress, funcSelector, parameters);

  if (result && Array.isArray(result) && result.length === 1 && typeof result[0] === 'string') {
    try {
      const data = result[0];
      let dataIndex = 0;

      const marketParams = {
        // For addresses, take the 64-char chunk, slice the padding (first 24 chars),
        // prepend the '41' prefix, and convert from hex.
        loanToken: TronWeb.address.fromHex(`41${data.substr(dataIndex++ * DATA_LEN, DATA_LEN).slice(24)}`),
        collateralToken: TronWeb.address.fromHex(`41${data.substr(dataIndex++ * DATA_LEN, DATA_LEN).slice(24)}`),
        oracle: TronWeb.address.fromHex(`41${data.substr(dataIndex++ * DATA_LEN, DATA_LEN).slice(24)}`),
        irm: TronWeb.address.fromHex(`41${data.substr(dataIndex++ * DATA_LEN, DATA_LEN).slice(24)}`),
        // For uint256, take the 64-char chunk and convert from hex.
        lltv: new BigNumber(data.substr(dataIndex++ * DATA_LEN, DATA_LEN), 16)
      };

      return marketParams;
    } catch (e) {
      console.error('Error manually parsing market params from hex string:', e);
      return null;
    }
  }

  console.error('Invalid result received from idToMarketParams view call:', result);
  return null;
};

/**
 * Checks if a user's position in a market is healthy (not subject to liquidation).
 * **Real-time update needed after**: borrow, withdrawCollateral, or price changes.
 * @param {object} marketParams - The market's parameters.
 * @param {string} userAddress - The user's address.
 * @returns {Promise<boolean>}
 */
export const isHealthy = async (marketParams, userAddress) => {
  const id = await getMarketId(marketParams);
  if (!id) return true;

  const funcSelector = 'isHealthy((address,address,address,address,uint256),bytes32,address)';
  const parameters = [
    {
      type: 'tuple',
      value: [
        marketParams.loanToken,
        marketParams.collateralToken,
        marketParams.oracle,
        marketParams.irm,
        marketParams.lltv
      ]
    },
    { type: 'bytes32', value: id },
    { type: 'address', value: userAddress }
  ];
  const result = await view(Config.MoolahAddress, funcSelector, parameters);
  return result.length ? !!new BigNumber(result[0], 16).toNumber() : true;
};

/**
 * Gets the relative price between collateral and loan tokens in a market.
 * @param {object} marketParams - The market's parameters.
 * @returns {Promise<BigNumber>}
 */
export const getPrice = async marketParams => {
  const funcSelector = 'getPrice((address,address,address,address,uint256))';
  const parameters = [
    {
      type: '(address,address,address,address,uint256)',
      value: [
        tronHexToAbiHex(marketParams.loanToken),
        tronHexToAbiHex(marketParams.collateralToken),
        tronHexToAbiHex(marketParams.oracle),
        tronHexToAbiHex(marketParams.irm),
        BigNumber(marketParams.lltv).times(1e18).toString()
      ]
    }
  ];
  const result = await view(Config.MoolahAddress, funcSelector, parameters);
  return result.length ? new BigNumber(result[0], 16) : new BigNumber(0);
};

// =================================================================
// MoolahVault.sol - Vault-Specific Queries
// =================================================================

/**
 * Fetches the user's share balance in a specific vault.
 * **Real-time update needed after**: depositToVault, redeemFromVault.
 * @param {string} vaultAddress - The vault's contract address.
 * @param {string} userAddress - The user's address.
 * @returns {Promise<BigNumber>}
 */
export const getUserSharesInVault = async (vaultAddress, userAddress) => {
  const funcSelector = 'balanceOf(address)';
  const parameters = [{ type: 'address', value: userAddress }];
  const result = await view(vaultAddress, funcSelector, parameters);

  return result.length ? new BigNumber(result[0], 16) : new BigNumber(0);
};

/**
 * Fetches the total assets managed by the vault (TVL).
 * **Real-time update needed after**: any user deposit or withdraw.
 * @param {string} vaultAddress - The vault's contract address.
 * @returns {Promise<BigNumber>}
 */
export const getVaultTotalAssets = async vaultAddress => {
  const funcSelector = 'totalAssets()';
  const result = await view(vaultAddress, funcSelector, []);

  return result.length ? new BigNumber(result[0], 16) : new BigNumber(0);
};

/**
 * Fetches the maximum amount of assets a user can withdraw.
 * @param {string} vaultAddress - The vault's contract address.
 * @param {string} userAddress - The user's address.
 * @returns {Promise<BigNumber>}
 */
export const getMaxWithdrawFromVault = async (vaultAddress, userAddress) => {
  const funcSelector = 'maxWithdraw(address)';
  const parameters = [{ type: 'address', value: userAddress }];
  const result = await view(vaultAddress, funcSelector, parameters);

  return result.length ? new BigNumber(result[0], 16) : new BigNumber(0);
};

/**
 * Fetches the vault's configuration for a specific market.
 * @param {string} vaultAddress - The vault's contract address.
 * @param {string} marketId - The market's ID.
 * @returns {Promise<object|null>}
 */
export const getVaultMarketConfig = async (vaultAddress, marketId) => {
  const funcSelector = 'config(bytes32)';
  const parameters = [{ type: 'bytes32', value: marketId }];
  const result = await view(vaultAddress, funcSelector, parameters);

  if (result && result.length === 1 && typeof result[0] === 'string') {
    try {
      const data = result[0];
      let dataIndex = 0;
      return {
        cap: new BigNumber(data.substr(dataIndex++ * DATA_LEN, DATA_LEN), 16),
        enabled: !!new BigNumber(data.substr(dataIndex++ * DATA_LEN, DATA_LEN), 16).toNumber(),
        marketType: new BigNumber(data.substr(dataIndex++ * DATA_LEN, DATA_LEN), 16),
        removableAt: new BigNumber(data.substr(dataIndex++ * DATA_LEN, DATA_LEN), 16)
      };
    } catch (e) {
      console.error('Error manually parsing vault market config:', e);
      return null;
    }
  }
  console.error('Invalid result received from vault config view call:', result);
  return null;
};

// =================================================================
// General Token Queries
// =================================================================

/**
 * Fetches the allowance a spender has for an owner's token.
 * **Real-time check needed before**: any transaction that transfers tokens (supply, repay, supplyCollateral, depositToVault).
 * @param {string} tokenAddress - The TRC20 token contract address.
 * @param {string} ownerAddress - The address of the token owner.
 * @param {string} spenderAddress - The address of the contract that will spend the tokens.
 * @returns {Promise<BigNumber>}
 */
export const getAllowance = async (tokenAddress, ownerAddress, spenderAddress) => {
  const funcSelector = 'allowance(address,address)';
  const parameters = [
    { type: 'address', value: ownerAddress },
    { type: 'address', value: spenderAddress }
  ];
  const result = await view(tokenAddress, funcSelector, parameters);

  return result.length ? new BigNumber(result[0], 16) : new BigNumber(0);
};

/**
 * calculates the maximum amount a user can borrow from a market based on liquidity and collateral.
 * @param {string} marketId - market bytes32 ID
 * @param {string} userAddress - user's address
 * @returns {Promise<BigNumber>} The maximum borrowable amount in loan token units.
 */
export const getAvailableToBorrow = async (marketId, userAddress) => {
  if (!marketId || !userAddress) return new BigNumber(0);

  try {
    // 1. parallel fetch market state, user position, and market params
    const [marketState, userPosition, marketParams] = await Promise.all([
      getMarketState(marketId),
      getUserPositionInMarket(marketId, userAddress),
      getMarketParams(marketId)
    ]);

    if (!marketState || !userPosition || !marketParams) {
      return new BigNumber(0);
    }

    // 2. calculate market liquidity
    const marketLiquidity = marketState.totalSupplyAssets.minus(marketState.totalBorrowAssets);

    // 3. calculate user's borrowing power based on collateral
    // 3a. get collateral price
    const collateralPrice = await getPrice(marketParams);

    // 3b. calculate max borrowable value based on collateral (userPosition.collateral * collateralPrice * lltv)
    const maxBorrowableValue = userPosition.collateral
      .times(collateralPrice)
      .times(marketParams.lltv)
      .div(new BigNumber(10).pow(36)); // TODO, check decimals

    // 3c. calculate current debt in loan token units
    let currentDebt = new BigNumber(0);
    if (BigNumber(marketState.totalBorrowShares).gt(0)) {
      currentDebt = userPosition.borrowShares.times(marketState.totalBorrowAssets).div(marketState.totalBorrowShares);
    }

    // 3d. calculate remaining borrowing power
    const userBorrowingPower = maxBorrowableValue.minus(currentDebt);

    // 4. return the minimum of market liquidity and user's borrowing power
    const availableToBorrow = BigNumber.min(marketLiquidity, userBorrowingPower);

    // Ensure non-negative result
    return availableToBorrow.gt(0) ? availableToBorrow : new BigNumber(0);
  } catch (error) {
    console.error('Failed to get available to borrow:', error);
    return new BigNumber(0);
  }
};
