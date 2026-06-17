import init, {
  encrypt_with_type_env as wasm_encrypt_with_type_env,
  encrypt_with_public_key as wasm_encrypt_with_public_key
} from '../wasm/wasm_encrypt_bg.js';

let initPromise = null;

function initializeWasm() {
  if (initPromise === null) {
    initPromise = init().catch(e => {
      initPromise = null;
      console.error('Failed to initialize WebAssembly module', e);
      throw e;
    });
  }
  return initPromise;
}

/**
 * @param {'lend' | 'message'} type
 * @param {'dev' | 'prod' | 'pro'} env
 * @param {string} data
 * @returns {Promise<string>}
 */
export async function encryptData(type, env, data) {
  await initializeWasm();

  try {
    return wasm_encrypt_with_type_env(type, env, data);
  } catch (e) {
    console.error('Encryption with type/env failed:', e);
    throw new Error('Encryption failed.');
  }
}

/**
 * @param {string} publicKeyPem
 * @param {string} data
 * @returns {Promise<string>}
 */
export async function encryptWithPublicKey(publicKeyPem, data) {
  await initializeWasm();

  try {
    return wasm_encrypt_with_public_key(publicKeyPem, data);
  } catch (e) {
    console.error('Encryption with public key failed:', e);
    throw new Error('Encryption failed.');
  }
}
