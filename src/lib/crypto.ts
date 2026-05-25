/**
 * Client-side AES-GCM encryption helpers using the Web Crypto API.
 * Passwords are encrypted before being written to Firestore so that
 * the plaintext never leaves the browser unencrypted.
 *
 * Key derivation: PBKDF2 from (companyId + appSalt) → AES-GCM 256-bit key.
 * All users within the same company share the same derived key, which
 * is suitable for a team password vault without a full KMS.
 */

const APP_SALT = process.env.NEXT_PUBLIC_CRYPTO_SALT ?? 'assetwise-vault-v1-salt';
const PBKDF2_ITERATIONS = 200_000;

/** Convert a string to a Uint8Array */
function encode(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/** Convert a Uint8Array or ArrayBuffer to a base64 string */
function toBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return btoa(String.fromCharCode(...bytes));
}

/** Convert a base64 string to a Uint8Array */
function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

/**
 * Derive a stable AES-GCM key from the company ID and the app salt.
 * The same companyId always produces the same key within an app instance.
 */
export async function deriveKey(companyId: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encode(companyId + APP_SALT),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encode(APP_SALT),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a plaintext password.
 * Returns the ciphertext and the random IV, both as base64 strings.
 */
export async function encryptPassword(
  plaintext: string,
  key: CryptoKey
): Promise<{ encryptedPassword: string; iv: string }> {
  const ivBytes = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: ivBytes },
    key,
    encode(plaintext)
  );

  return {
    encryptedPassword: toBase64(ciphertext),
    iv: toBase64(ivBytes),
  };
}

/**
 * Decrypt a previously encrypted password.
 * Returns the plaintext string, or null if decryption fails.
 */
export async function decryptPassword(
  encryptedPassword: string,
  iv: string,
  key: CryptoKey
): Promise<string | null> {
  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64(iv) },
      key,
      fromBase64(encryptedPassword)
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    return null;
  }
}

/** Password strength scoring (0–4) */
export type PasswordStrength = 0 | 1 | 2 | 3 | 4;

export function scorePassword(password: string): PasswordStrength {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 14) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(4, score) as PasswordStrength;
}

export const strengthLabels: Record<PasswordStrength, string> = {
  0: 'Too Short',
  1: 'Weak',
  2: 'Fair',
  3: 'Strong',
  4: 'Very Strong',
};

export const strengthColors: Record<PasswordStrength, string> = {
  0: 'bg-destructive',
  1: 'bg-orange-500',
  2: 'bg-yellow-400',
  3: 'bg-green-400',
  4: 'bg-emerald-500',
};

const CHARSET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{}|;:,.<>?';

/** Generate a cryptographically secure random password of a given length */
export function generatePassword(length = 20): string {
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (n) => CHARSET[n % CHARSET.length]).join('');
}
