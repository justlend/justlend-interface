import Config from '../../../config';

const { settingsTokenArray1, settingsTokenArray2 } = Config;

export function isEmailValid(email) {
  return email !== '--' && email.length > 0;
}

export const saveSignInfoToLocalStorage = async (timestamp, signResult, walletAddress) => {
  return window.localStorage.setItem('signInfo', await encryptSignInfo(timestamp, signResult, walletAddress));
};
export const getSignInfoFromLocalStorage = async () => {
  const ciphertext = window.localStorage.getItem('signInfo');

  if (ciphertext) {
    try {
      return await decryptSignInfo(ciphertext);
    } catch (e) {
      window.localStorage.setItem('signInfo', '');
      return console.error(e);
    }
  } else {
    return undefined;
  }
};

const importKey = async () => {
  return await window.crypto.subtle.importKey(
    'raw',
    Buffer.from(new Uint8Array(JSON.parse(settingsTokenArray1)), 'base64'),
    {
      name: 'AES-GCM',
      length: 256
    },
    true,
    ['encrypt', 'decrypt']
  );
};
const encryptSignInfo = async (timestamp, signResult, walletAddress) => {
  const encodedPlaintext = new TextEncoder().encode(
    JSON.stringify({ 'signResult': signResult, 'signTimestamp': timestamp, 'addr': walletAddress })
  );
  const secretKey = await importKey();

  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: Buffer.from(new Uint8Array(JSON.parse(settingsTokenArray2)), 'base64')
    },
    secretKey,
    encodedPlaintext
  );

  return Buffer.from(ciphertext).toString('base64');
};
const decryptSignInfo = async ciphertext => {
  const secretKey = await importKey();
  const encodedPlaintext = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: Buffer.from(new Uint8Array(JSON.parse(settingsTokenArray2)), 'base64')
    },
    secretKey,
    Buffer.from(ciphertext, 'base64')
  );

  return JSON.parse(new TextDecoder().decode(encodedPlaintext));
};
