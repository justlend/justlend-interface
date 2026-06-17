const DB_NAME = 'justlend-keys';
const STORE_NAME = 'sign-keys';

// ---- IndexedDB helpers ----

const openDB = () =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const getFromDB = db =>
  new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get('session');
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });

const saveToDB = (db, value) =>
  new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).put(value, 'session');
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

const getSessionKey = async () => {
  const db = await openDB();

  const existing = await getFromDB(db);
  if (existing) return existing;

  const key = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false, 
    ['encrypt', 'decrypt']
  );
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  await saveToDB(db, { key, iv });
  return { key, iv };
};

// ---- public helpers ----

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

const encryptSignInfo = async (timestamp, signResult, walletAddress) => {
  const encodedPlaintext = new TextEncoder().encode(
    JSON.stringify({ 'signResult': signResult, 'signTimestamp': timestamp, 'addr': walletAddress })
  );
  const { key, iv } = await getSessionKey();

  const ciphertext = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encodedPlaintext);

  return Buffer.from(ciphertext).toString('base64');
};
const decryptSignInfo = async ciphertext => {
  const { key, iv } = await getSessionKey();
  const encodedPlaintext = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    Buffer.from(ciphertext, 'base64')
  );

  return JSON.parse(new TextDecoder().decode(encodedPlaintext));
};
