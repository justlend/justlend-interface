import axios from 'axios';
import Config from '../config/v2config';

const DEFAULT_TIMEOUT = 30000;
const axiosInstance = axios.create({
  timeout: DEFAULT_TIMEOUT
});

const {
  v2host,
  myPositionPath,
  indexHistoryPath,
  indexVaultListPath,
  indexMarketListPath,
  vaultInfoPath,
  vaultApyHistoryPath,
  vaultAllocationPath,
  vaultMyPositionPath,
  marketInfoPath,
  marketBorrowHistoryPath,
  marketVaultListPath,
  marketMyPositionPath,
  recordSBMv2Path,
  pendingLiquidationsPath,
  liquidationTokensPath,
  liquidationRecordsPath
} = Config.service;

/**
 * Gets the user's overall position summary (My Position).
 * @param {string} address The user's wallet address.
 */
export const getMyPosition = async address => {
  try {
    const query = new URLSearchParams({ address }).toString();
    const url = `${v2host}${myPositionPath}?${query}`;
    const { data } = await axiosInstance.get(url);

    return {
      success: true,
      data: data.data
    };
  } catch (error) {
    return {
      success: false
    };
  }
};

/**
 * Gets historical data for TVL, borrows, etc.
 * @param {number} startTime Start timestamp (in milliseconds).
 * @param {number} endTime End timestamp (in milliseconds).
 */
export const getIndexHistory = async (address, timeFilter) => {
  try {
    const query = new URLSearchParams({
      userAddress: address,
      timeFilter
    }).toString();
    const url = `${v2host}${indexHistoryPath}?${query}`;
    const { data } = await axiosInstance.get(url);
    return { success: true, data: data.data };
  } catch (error) {
    return { success: false };
  }
};

/**
 * Gets the list of vaults.
 * @param {object} params - Query parameters.
 * @param {string} params.sort - The field to sort by.
 * @param {string} params.order - The sort order ('asc' or 'desc').
 * @param {string} params.deposit - Filter by deposit asset.
 * @param {string} params.collateral - Filter by collateral asset.
 * @param {string} params.keyword - Search keyword.
 * @param {number} params.page - Page number.
 * @param {number} params.pageSize - Number of items per page.
 */
export const getIndexVaultList = async params => {
  try {
    const query = new URLSearchParams(params).toString();
    const url = `${v2host}${indexVaultListPath}?${query}`;
    const { data } = await axiosInstance.get(url);
    return { success: true, data: data.data };
  } catch (error) {
    return { success: false };
  }
};

/**
 * Gets the list of markets.
 * @param {object} params - Query parameters.
 * @param {string} params.sort - The field to sort by.
 * @param {string} params.order - The sort order ('asc' or 'desc').
 * @param {string} params.deposit - Filter by deposit asset.
 * @param {string} params.collateral - Filter by collateral asset.
 * @param {string} params.keyword - Search keyword.
 * @param {number} params.page - Page number.
 * @param {number} params.pageSize - Number of items per page.
 */
export const getIndexMarketList = async params => {
  try {
    const query = new URLSearchParams(params).toString();
    const url = `${v2host}${indexMarketListPath}?${query}`;
    const { data } = await axiosInstance.get(url);
    return { success: true, data: data.data };
  } catch (error) {
    return { success: false };
  }
};

/**
 * Gets the basic information for a specific market.
 * @param {string} marketId - The market ID.
 */
export const getMarketInfo = async marketId => {
  try {
    const query = new URLSearchParams({ marketId }).toString();
    const url = `${v2host}${marketInfoPath}?${query}`;
    const { data } = await axiosInstance.get(url);
    return { success: true, data: data.data, code: data.code };
  } catch (error) {
    return { success: false };
  }
};

/**
 * Gets the historical borrow info for a specific market.
 * @param {string} marketId - The market ID.
 * @param {number} startTime - Start timestamp (in milliseconds).
 * @param {number} endTime - End timestamp (in milliseconds).
 */
export const getMarketBorrowHistory = async marketId => {
  try {
    const query = new URLSearchParams({ marketId }).toString();
    const url = `${v2host}${marketBorrowHistoryPath}?${query}`;
    const { data } = await axiosInstance.get(url);
    return { success: true, data: data.data };
  } catch (error) {
    return { success: false };
  }
};

/**
 * Gets the list of vaults associated with a specific market.
 * @param {string} marketId - The market ID.
 * @param {object} params - Query parameters.
 * @param {string} params.sort - The field to sort by.
 * @param {string} params.order - The sort order ('asc' or 'desc').
 * @param {number} params.page - Page number.
 * @param {number} params.pageSize - Number of items per page.
 */
export const getMarketVaultList = async marketId => {
  try {
    const query = new URLSearchParams({ marketId }).toString();
    const url = `${v2host}${marketVaultListPath}?${query}`;
    const { data } = await axiosInstance.get(url);
    return { success: true, data: data.data };
  } catch (error) {
    return { success: false };
  }
};

/**
 * Gets the current user's position in a specific market.
 * @param {string} market - The market ID.
 * @param {string} address - The user's wallet address.
 */
export const getMarketMyPosition = async (market, address) => {
  try {
    // return mockApiCall(mockDB.myMarketPosition);
    const query = new URLSearchParams({ market, address }).toString();
    const url = `${v2host}${marketMyPositionPath}?${query}`;
    const { data } = await axiosInstance.get(url);
    return { success: true, data: data.data };
  } catch (error) {
    return { success: false };
  }
};

/**
 * Gets the details for a specific vault.
 * @param {string} address - The vault's contract address.
 */
export const getVaultInfo = async address => {
  try {
    const query = new URLSearchParams({ address }).toString();
    const url = `${v2host}${vaultInfoPath}?${query}`;
    const { data } = await axiosInstance.get(url);
    return { success: true, data: data.data, code: data.code };
  } catch (error) {
    return { success: false };
  }
};

/**
 * Gets the historical APY for a specific vault.
 * @param {string} address - The vault's contract address.
 */
export const getVaultApyHistory = async address => {
  try {
    const query = new URLSearchParams({ vaultAddress: address }).toString();
    const url = `${v2host}${vaultApyHistoryPath}?${query}`;
    const { data } = await axiosInstance.get(url);
    return { success: true, data: data.data };
  } catch (error) {
    return { success: false };
  }
};

/**
 * Gets the list of markets a vault has allocated funds to.
 * @param {object} params - Query parameters.
 * @param {string} params.address - The vault's contract address.
 * @param {string} params.sort - The field to sort by.
 * @param {string} params.order - The sort order ('asc' or 'desc').
 * @param {number} params.page - Page number.
 * @param {number} params.pageSize - Number of items per page.
 */
export const getVaultAllocation = async params => {
  try {
    const query = new URLSearchParams(params).toString();
    const url = `${v2host}${vaultAllocationPath}?${query}`;
    const { data } = await axiosInstance.get(url);
    if (data.code === 200) {
      return { success: true, data: data.data };
    }
  } catch (error) {
    return { success: false };
  }
};

/**
 * Gets the current user's position in a specific vault.
 * @param {string} vaultAddress - The vault's contract address.
 * @param {string} address - The user's wallet address.
 */
export const getVaultMyPosition = async (vaultAddress, address) => {
  try {
    const query = new URLSearchParams({ vaultAddress, address }).toString();
    const url = `${v2host}${vaultMyPositionPath}?${query}`;
    const { data } = await axiosInstance.get(url);
    return { success: true, data: data.data };
  } catch (error) {
    return { success: false };
  }
};

/**
 * @param {string} address - The user's wallet address.
 * @param {number} pageNo - current page
 * @param {number} pageSize - number of items per page
 */
export const getSBMV2Records = async (address, page = 1, pageSize = 10) => {
  try {
    const query = new URLSearchParams({
      address,
      pageNo: page,
      pageSize
    }).toString();
    const url = `${v2host}${recordSBMv2Path}?${query}`;
    const { data } = await axiosInstance.get(url);
    return { success: true, data: data.data };
  } catch (error) {
    return { success: false };
  }
};

/**
 * @param {object} params - Query parameters.
 * @param {string} params.sort - The field to sort by.
 * @param {string} params.order - The sort order ('asc' or 'desc').
 * @param {number} params.page - Page number.
 * @param {number} params.pageSize - Number of items per page.
 * @param {number} params.minRiskLevel - Minimum risk level.
 * @param {number} params.maxRiskLevel - Maximum risk level.
 * @param {number} params.debt - debt.
 * @param {number} params.collateral - collateral.
 */
export const getPendingLiquidations = async params => {
  try {
    const query = new URLSearchParams(params).toString();
    const url = `${v2host}${pendingLiquidationsPath}?${query}`;
    const { data } = await axiosInstance.get(url);
    if (data.code === 200) {
      return { success: true, data: data.data };
    }
  } catch (error) {
    return { success: false };
  }
};

///liquidate/records?type=bot&debt=TRX&collateral=USDT&page=1&pageSize=20
/**
 * @param {object} params - Query parameters.
 * @param {string} params.type - The type of liquidation.
 * @param {number} params.debt - debt.
 * @param {number} params.collateral - collateral.
 * @param {number} params.page - Page number.
 * @param {number} params.pageSize - Number of items per page.
 */
export const getLiquidationRecords = async params => {
  try {
    const query = new URLSearchParams(params).toString();
    const url = `${v2host}${liquidationRecordsPath}?${query}`;
    const { data } = await axiosInstance.get(url);
    if (data.code === 200) {
      return { success: true, data: data.data };
    }
  } catch (error) {
    return { success: false };
  }
};

/**
 * @description get liquidation tokens
 */
export const getLiquidationTokens = async () => {
  try {
    const url = `${v2host}${liquidationTokensPath}`;
    const { data } = await axiosInstance.get(url);
    if (data.code === 200) {
      return { success: true, data: data.data };
    }
  } catch (error) {
    return { success: false };
  }
};
