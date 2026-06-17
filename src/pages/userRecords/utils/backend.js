import axios from 'axios';
import Config from '../../../config';
const { service } = Config;
const { host, depositBorrowRecord, updateLastSeen, strxRecord, rentRecord, voteRecord, liquidateRecord } = service;

export const getUserRecords = async (type, addr, page, pageSize) => {
  try {
    let recordsHost = host;
    let recordsPath = '';
    if (type === 'depositBorrow') recordsPath = depositBorrowRecord;
    if (type === 'rent') recordsPath = rentRecord;
    if (type === 'strx') recordsPath = strxRecord;
    if (type === 'vote') recordsPath = voteRecord;
    if (type === 'liquidate') recordsPath = liquidateRecord;
    const url = `${recordsHost}${recordsPath}`;
    let { data } = await axios.get(url, { params: { addr, page, pageSize } });

    if (data?.code === 0) {
      return {
        success: true,
        data: data?.data
      };
    }
    return { success: false };
  } catch (error) {
    return {
      success: false
    };
  }
};

export const updateLastSeenTime = async (params = {}) => {
  try {
    const url = `${host}${updateLastSeen}`;
    let { data } = await axios.post(url, params);
    if (data?.code === 0) {
      return {
        success: true
      };
    }
    return { success: false };
  } catch (error) {
    console.error(`updateLastSeenTime error: ${error}`);
    return { success: false };
  }
};
