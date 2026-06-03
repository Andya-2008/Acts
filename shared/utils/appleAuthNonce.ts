import * as Crypto from 'expo-crypto';

const NONCE_CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._';

/** Raw nonce for Firebase Apple credential (unhashed). */
export function createAppleSignInRawNonce(length = 32): string {
  const bytes = Crypto.getRandomValues(new Uint8Array(length));
  let result = '';
  for (let i = 0; i < bytes.length; i += 1) {
    result += NONCE_CHARSET[bytes[i]! % NONCE_CHARSET.length];
  }
  return result;
}

/** SHA-256 hash of the raw nonce, passed to Apple `signInAsync`. */
export async function hashAppleSignInNonce(rawNonce: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
}
