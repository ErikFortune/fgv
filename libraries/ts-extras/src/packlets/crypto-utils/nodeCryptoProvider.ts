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

import * as crypto from 'crypto';
import { captureAsyncResult, captureResult, fail, Failure, Result, succeed, Success } from '@fgv/ts-utils';
import * as Constants from './constants';
import { keyPairAlgorithmParams } from './keyPairAlgorithmParams';
import { ICryptoProvider, IEncryptionResult, KeyPairAlgorithm } from './model';

/**
 * Node.js implementation of {@link CryptoUtils.ICryptoProvider} using the built-in crypto module.
 * Uses AES-256-GCM for authenticated encryption.
 * @public
 */
export class NodeCryptoProvider implements ICryptoProvider {
  /**
   * Encrypts plaintext using AES-256-GCM.
   * @param plaintext - UTF-8 string to encrypt
   * @param key - 32-byte encryption key
   * @returns `Success` with encryption result, or `Failure` with an error.
   */
  public async encrypt(plaintext: string, key: Uint8Array): Promise<Result<IEncryptionResult>> {
    return captureResult(() => {
      if (key.length !== Constants.AES_256_KEY_SIZE) {
        throw new Error(`Key must be ${Constants.AES_256_KEY_SIZE} bytes, got ${key.length}`);
      }

      // Generate random IV
      const iv = crypto.randomBytes(Constants.GCM_IV_SIZE);

      // Create cipher
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

      // Encrypt
      const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);

      // Get auth tag
      const authTag = cipher.getAuthTag();

      return {
        iv: new Uint8Array(iv),
        authTag: new Uint8Array(authTag),
        encryptedData: new Uint8Array(encrypted)
      };
    });
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
    if (key.length !== Constants.AES_256_KEY_SIZE) {
      return fail(`Key must be ${Constants.AES_256_KEY_SIZE} bytes, got ${key.length}`);
    }
    if (iv.length !== Constants.GCM_IV_SIZE) {
      return fail(`IV must be ${Constants.GCM_IV_SIZE} bytes, got ${iv.length}`);
    }
    if (authTag.length !== Constants.GCM_AUTH_TAG_SIZE) {
      return fail(`Auth tag must be ${Constants.GCM_AUTH_TAG_SIZE} bytes, got ${authTag.length}`);
    }

    return captureResult(() => {
      // Create decipher
      const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(key), Buffer.from(iv));

      // Set auth tag
      decipher.setAuthTag(Buffer.from(authTag));

      // Decrypt
      const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedData)), decipher.final()]);

      return decrypted.toString('utf8');
    }).withErrorFormat((e) => `Decryption failed: ${e}`);
  }

  /**
   * Generates a random 32-byte key suitable for AES-256.
   * @returns `Success` with generated key, or `Failure` with an error.
   */
  public async generateKey(): Promise<Result<Uint8Array>> {
    return captureResult(() => {
      const key = crypto.randomBytes(Constants.AES_256_KEY_SIZE);
      return new Uint8Array(key);
    });
  }

  /**
   * Derives a key from a password using PBKDF2.
   * @param password - Password string
   * @param salt - Salt bytes (should be at least 16 bytes)
   * @param iterations - Number of iterations (recommend 100000+)
   * @returns `Success` with derived 32-byte key, or `Failure` with an error.
   */
  public async deriveKey(
    password: string,
    salt: Uint8Array,
    iterations: number
  ): Promise<Result<Uint8Array>> {
    if (iterations < 1) {
      return fail('Iterations must be at least 1');
    }
    if (salt.length < 8) {
      return fail('Salt should be at least 8 bytes');
    }

    return new Promise((resolve) => {
      crypto.pbkdf2(
        password,
        Buffer.from(salt),
        iterations,
        Constants.AES_256_KEY_SIZE,
        'sha256',
        (err, derivedKey) => {
          /* c8 ignore next 3 - PBKDF2 internal errors are hard to trigger with valid parameters */
          if (err) {
            resolve(fail(`Key derivation failed: ${err.message}`));
          } else {
            resolve(succeed(new Uint8Array(derivedKey)));
          }
        }
      );
    });
  }

  /**
   * Computes a SHA-256 hash of the given data.
   * @param data - UTF-8 string to hash
   * @returns `Success` with hex-encoded hash string, or `Failure` with an error.
   */
  public async sha256(data: string): Promise<Result<string>> {
    return captureResult(() => {
      const hash = crypto.createHash('sha256');
      hash.update(data, 'utf8');
      return hash.digest('hex');
    });
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
    return captureResult(() => new Uint8Array(crypto.randomBytes(length)));
  }

  /**
   * Encodes binary data to base64 string.
   * @param data - Binary data to encode
   * @returns Base64-encoded string
   */
  public toBase64(data: Uint8Array): string {
    return Buffer.from(data).toString('base64');
  }

  /**
   * Decodes base64 string to binary data.
   * @param base64 - Base64-encoded string
   * @returns Success with decoded bytes, or Failure if invalid base64
   */
  public fromBase64(base64: string): Result<Uint8Array> {
    // Check for obviously invalid characters
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) {
      return Failure.with('Invalid base64 string');
    }
    return Success.with(new Uint8Array(Buffer.from(base64, 'base64')));
  }

  // ============================================================================
  // Asymmetric Key Operations
  // ============================================================================

  /**
   * Generates a new asymmetric keypair using Node's WebCrypto.
   * @param algorithm - The {@link CryptoUtils.KeyPairAlgorithm | algorithm} to use.
   * @param extractable - Whether the resulting keys may be exported.
   * @returns `Success` with the generated `CryptoKeyPair`, or `Failure` with an error.
   */
  public async generateKeyPair(
    algorithm: KeyPairAlgorithm,
    extractable: boolean
  ): Promise<Result<CryptoKeyPair>> {
    const params = keyPairAlgorithmParams[algorithm];
    const result = await captureAsyncResult(() =>
      crypto.webcrypto.subtle.generateKey(params.generateKey, extractable, params.keyPairUsages)
    );
    return result.withErrorFormat((e) => `Failed to generate ${algorithm} keypair: ${e}`);
  }

  /**
   * Exports a public `CryptoKey` as a JSON Web Key.
   * @remarks
   * Rejects non-public keys at runtime. WebCrypto's `exportKey('jwk', ...)`
   * does not enforce public-vs-private; without this guard a caller that
   * passed an extractable private key would receive its private fields
   * (`d`, `p`, `q`, ...) as JWK, defeating the method's name.
   * @param publicKey - Extractable public key to export.
   * @returns `Success` with the JWK, or `Failure` if not a public key or if export fails.
   */
  public async exportPublicKeyJwk(publicKey: CryptoKey): Promise<Result<JsonWebKey>> {
    if (publicKey.type !== 'public') {
      return fail(`exportPublicKeyJwk requires a public CryptoKey, got '${publicKey.type}'`);
    }
    const result = await captureAsyncResult(() => crypto.webcrypto.subtle.exportKey('jwk', publicKey));
    return result.withErrorFormat((e) => `Failed to export public key as JWK: ${e}`);
  }

  /**
   * Imports a public-key JWK as a `CryptoKey` for the requested algorithm.
   * @param jwk - The JSON Web Key produced by a prior export.
   * @param algorithm - The algorithm the key was generated for.
   * @returns `Success` with the imported public `CryptoKey`, or `Failure` with an error.
   */
  public async importPublicKeyJwk(jwk: JsonWebKey, algorithm: KeyPairAlgorithm): Promise<Result<CryptoKey>> {
    const params = keyPairAlgorithmParams[algorithm];
    const result = await captureAsyncResult(() =>
      crypto.webcrypto.subtle.importKey('jwk', jwk, params.importPublicKey, true, params.publicKeyUsages)
    );
    return result.withErrorFormat((e) => `Failed to import ${algorithm} public key from JWK: ${e}`);
  }
}

/**
 * Singleton instance of {@link CryptoUtils.NodeCryptoProvider}.
 * @public
 */
export const nodeCryptoProvider: NodeCryptoProvider = new NodeCryptoProvider();
