// Copyright (c) 2024 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/* c8 ignore start - Browser-only implementation cannot be tested in Node.js environment */
import { captureResult, Failure, Result, Success } from '@fgv/ts-utils';
import { CryptoUtils } from '@fgv/ts-extras';

type ICryptoProvider = CryptoUtils.ICryptoProvider;
type IEncryptionResult = CryptoUtils.IEncryptionResult;
const CryptoConstants = CryptoUtils.Constants;

/**
 * Extracts an `ArrayBuffer` from a Uint8Array, handling the potential SharedArrayBuffer case.
 * @param arr - The Uint8Array to extract from
 * @returns An `ArrayBuffer` containing a copy of the data.
 */
function toArrayBuffer(arr: Uint8Array): ArrayBuffer {
  // Create a new ArrayBuffer and copy the data - this handles both ArrayBuffer and SharedArrayBuffer
  const buffer = new ArrayBuffer(arr.byteLength);
  new Uint8Array(buffer).set(arr);
  return buffer;
}

/**
 * Browser implementation of `ICryptoProvider` using the Web Crypto API.
 * Uses AES-256-GCM for authenticated encryption.
 *
 * Note: This provider requires a browser environment with Web Crypto API support.
 * In Node.js 15+, Web Crypto is available via globalThis.crypto or require('crypto').webcrypto.
 *
 * @public
 */
export class BrowserCryptoProvider implements ICryptoProvider {
  private readonly _crypto: Crypto;

  /**
   * Creates a new {@link CryptoUtils.BrowserCryptoProvider | BrowserCryptoProvider}.
   * @param cryptoApi - Optional Crypto instance (defaults to globalThis.crypto)
   */
  public constructor(cryptoApi?: Crypto) {
    if (cryptoApi) {
      this._crypto = cryptoApi;
    } else if (typeof globalThis !== 'undefined' && globalThis.crypto) {
      this._crypto = globalThis.crypto;
    } else if (typeof window !== 'undefined' && window.crypto) {
      this._crypto = window.crypto;
    } else {
      throw new Error('Web Crypto API not available');
    }
  }

  /**
   * Encrypts plaintext using AES-256-GCM.
   * @param plaintext - UTF-8 string to encrypt
   * @param key - 32-byte encryption key
   * @returns `Success` with encryption result, or `Failure` with an error.
   */
  public async encrypt(plaintext: string, key: Uint8Array): Promise<Result<IEncryptionResult>> {
    if (key.length !== CryptoConstants.AES_256_KEY_SIZE) {
      return Failure.with(`Key must be ${CryptoConstants.AES_256_KEY_SIZE} bytes, got ${key.length}`);
    }

    try {
      // Generate random IV
      const iv = this._crypto.getRandomValues(new Uint8Array(CryptoConstants.GCM_IV_SIZE));

      // Import the key
      const cryptoKey = await this._crypto.subtle.importKey(
        'raw',
        toArrayBuffer(key),
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );

      // Encode plaintext to bytes
      const encoder = new TextEncoder();
      const plaintextBytes = encoder.encode(plaintext);

      // Encrypt (Web Crypto appends auth tag to ciphertext)
      const encryptedWithTag = await this._crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
          tagLength: CryptoConstants.GCM_AUTH_TAG_SIZE * 8 // bits
        },
        cryptoKey,
        plaintextBytes
      );

      // Split ciphertext and auth tag (auth tag is last 16 bytes)
      const encryptedArray = new Uint8Array(encryptedWithTag);
      const encryptedData = encryptedArray.slice(
        0,
        encryptedArray.length - CryptoConstants.GCM_AUTH_TAG_SIZE
      );
      const authTag = encryptedArray.slice(encryptedArray.length - CryptoConstants.GCM_AUTH_TAG_SIZE);
      return Success.with({
        iv,
        authTag,
        encryptedData
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return Failure.with(`Encryption failed: ${message}`);
    }
  }

  /**
   * Decrypts ciphertext using AES-256-GCM.
   * @param encryptedData - Encrypted bytes
   * @param key - 32-byte decryption key
   * @param iv - Initialization vector (12 bytes)
   * @param authTag - GCM authentication tag (16 bytes)
   * @returns `Success` with decrypted UTF-8 string, or `Failure` with an error.
   */
  public async decrypt(
    encryptedData: Uint8Array,
    key: Uint8Array,
    iv: Uint8Array,
    authTag: Uint8Array
  ): Promise<Result<string>> {
    if (key.length !== CryptoConstants.AES_256_KEY_SIZE) {
      return Failure.with(`Key must be ${CryptoConstants.AES_256_KEY_SIZE} bytes, got ${key.length}`);
    }
    if (iv.length !== CryptoConstants.GCM_IV_SIZE) {
      return Failure.with(`IV must be ${CryptoConstants.GCM_IV_SIZE} bytes, got ${iv.length}`);
    }
    if (authTag.length !== CryptoConstants.GCM_AUTH_TAG_SIZE) {
      return Failure.with(
        `Auth tag must be ${CryptoConstants.GCM_AUTH_TAG_SIZE} bytes, got ${authTag.length}`
      );
    }

    try {
      // Import the key
      const cryptoKey = await this._crypto.subtle.importKey(
        'raw',
        toArrayBuffer(key),
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );

      // Web Crypto expects ciphertext + auth tag concatenated
      const encryptedWithTag = new Uint8Array(encryptedData.length + authTag.length);
      encryptedWithTag.set(encryptedData);
      encryptedWithTag.set(authTag, encryptedData.length);

      // Decrypt
      const decrypted = await this._crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: toArrayBuffer(iv),
          tagLength: CryptoConstants.GCM_AUTH_TAG_SIZE * 8 // bits
        },
        cryptoKey,
        encryptedWithTag
      );

      // Decode to string
      const decoder = new TextDecoder();
      return Success.with(decoder.decode(decrypted));
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return Failure.with(`Decryption failed: ${message}`);
    }
  }

  /**
   * Generates a random 32-byte key suitable for AES-256.
   * @returns Success with generated key, or Failure with error
   */
  public async generateKey(): Promise<Result<Uint8Array>> {
    try {
      return Success.with(this._crypto.getRandomValues(new Uint8Array(CryptoConstants.AES_256_KEY_SIZE)));
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return Failure.with(`Key generation failed: ${message}`);
    }
  }

  /**
   * Derives a key from a password using PBKDF2.
   * @param password - Password string
   * @param salt - Salt bytes (should be at least 16 bytes)
   * @param iterations - Number of iterations (recommend 100000+)
   * @returns Success with derived 32-byte key, or Failure with error
   */
  public async deriveKey(
    password: string,
    salt: Uint8Array,
    iterations: number
  ): Promise<Result<Uint8Array>> {
    if (iterations < 1) {
      return Failure.with('Iterations must be at least 1');
    }
    if (salt.length < 8) {
      return Failure.with('Salt should be at least 8 bytes');
    }

    try {
      // Encode password
      const encoder = new TextEncoder();
      const passwordBytes = encoder.encode(password);

      // Import password as key material
      const keyMaterial = await this._crypto.subtle.importKey('raw', passwordBytes, 'PBKDF2', false, [
        'deriveBits'
      ]);

      // Derive key bits
      const derivedBits = await this._crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: toArrayBuffer(salt),
          iterations: iterations,
          hash: 'SHA-256'
        },
        keyMaterial,
        CryptoConstants.AES_256_KEY_SIZE * 8 // bits
      );

      return Success.with(new Uint8Array(derivedBits));
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return Failure.with(`Key derivation failed: ${message}`);
    }
  }

  // ============================================================================
  // Platform Utility Methods
  // ============================================================================

  /**
   * Generates cryptographically secure random bytes.
   * @param length - Number of bytes to generate
   * @returns Success with random bytes, or Failure with error
   */
  public generateRandomBytes(length: number): Result<Uint8Array> {
    if (length < 1) {
      return Failure.with('Length must be at least 1');
    }
    try {
      return Success.with(this._crypto.getRandomValues(new Uint8Array(length)));
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return Failure.with(`Random bytes generation failed: ${message}`);
    }
  }

  /**
   * Encodes binary data to base64 string.
   * @param data - Binary data to encode
   * @returns Base64-encoded string
   */
  public toBase64(data: Uint8Array): string {
    // Convert Uint8Array to binary string, then to base64
    let binary = '';
    for (let i = 0; i < data.length; i++) {
      binary += String.fromCharCode(data[i]);
    }
    return btoa(binary);
  }

  /**
   * Decodes base64 string to binary data.
   * @param base64 - Base64-encoded string
   * @returns Success with decoded bytes, or Failure if invalid base64
   */
  public fromBase64(base64: string): Result<Uint8Array> {
    try {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return Success.with(bytes);
    } catch (e) {
      return Failure.with('Invalid base64 string');
    }
  }
}

/**
 * Creates a {@link CryptoUtils.BrowserCryptoProvider | BrowserCryptoProvider} if Web
 * Crypto API is available.
 * @returns `Success` with provider, or `Failure` if not available
 * @public
 */
export function createBrowserCryptoProvider(): Result<BrowserCryptoProvider> {
  return captureResult(() => new BrowserCryptoProvider());
}
/* c8 ignore stop */
