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
import {
  captureAsyncResult,
  captureResult,
  fail,
  Failure,
  generateUuid,
  Result,
  succeed,
  Success,
  Uuid
} from '@fgv/ts-utils';
import * as Constants from './constants';
import { keyPairAlgorithmParams } from './keyPairAlgorithmParams';
import {
  ICryptoProvider,
  IEncryptBytesResult,
  IEncryptionResult,
  IWrapBytesOptions,
  IWrappedBytes,
  KeyPairAlgorithm,
  SeedDerivableAlgorithm
} from './model';
import { deriveKeyPairFromSeed } from './seedDerivedKeyPair';

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
   * Encrypts raw bytes using AES-256-GCM with a caller-supplied nonce and
   * optional AAD. See {@link CryptoUtils.ICryptoProvider.encryptBytes | ICryptoProvider.encryptBytes}
   * — in particular the caller's responsibility to use a unique `nonce` per
   * message under a given `key`.
   * @param key - 32-byte AES-256 key.
   * @param nonce - 12-byte GCM nonce (must be unique per message under `key`).
   * @param plaintext - The bytes to encrypt (empty permitted).
   * @param aad - Optional additional authenticated data bound into the tag.
   * @returns `Success` with the ciphertext and 16-byte auth tag, or `Failure` with an error.
   */
  public async encryptBytes(
    key: Uint8Array,
    nonce: Uint8Array,
    plaintext: Uint8Array,
    aad?: Uint8Array
  ): Promise<Result<IEncryptBytesResult>> {
    if (key.length !== Constants.AES_256_KEY_SIZE) {
      return fail(`encryptBytes: key must be ${Constants.AES_256_KEY_SIZE} bytes, got ${key.length}`);
    }
    if (nonce.length !== Constants.GCM_IV_SIZE) {
      return fail(`encryptBytes: nonce must be ${Constants.GCM_IV_SIZE} bytes, got ${nonce.length}`);
    }

    return captureResult(() => {
      const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key), Buffer.from(nonce), {
        authTagLength: Constants.GCM_AUTH_TAG_SIZE
      });
      if (aad !== undefined) {
        cipher.setAAD(Buffer.from(aad));
      }
      const encrypted = Buffer.concat([cipher.update(Buffer.from(plaintext)), cipher.final()]);
      const authTag = cipher.getAuthTag();
      return {
        ciphertext: new Uint8Array(encrypted),
        authTag: new Uint8Array(authTag)
      };
    });
  }

  /**
   * Decrypts raw bytes produced by {@link NodeCryptoProvider.encryptBytes} using
   * AES-256-GCM. See {@link CryptoUtils.ICryptoProvider.decryptBytes | ICryptoProvider.decryptBytes}.
   * Fails (never throws) on any authentication failure, including a mismatched `aad`.
   * @param key - 32-byte AES-256 key.
   * @param nonce - 12-byte GCM nonce (the same one used to encrypt).
   * @param ciphertext - The ciphertext from the `encryptBytes` result.
   * @param authTag - The 16-byte GCM auth tag from the `encryptBytes` result.
   * @param aad - The identical AAD supplied at encrypt time (or absent).
   * @returns `Success` with the decrypted plaintext bytes, or `Failure` with an error.
   */
  public async decryptBytes(
    key: Uint8Array,
    nonce: Uint8Array,
    ciphertext: Uint8Array,
    authTag: Uint8Array,
    aad?: Uint8Array
  ): Promise<Result<Uint8Array>> {
    if (key.length !== Constants.AES_256_KEY_SIZE) {
      return fail(`decryptBytes: key must be ${Constants.AES_256_KEY_SIZE} bytes, got ${key.length}`);
    }
    if (nonce.length !== Constants.GCM_IV_SIZE) {
      return fail(`decryptBytes: nonce must be ${Constants.GCM_IV_SIZE} bytes, got ${nonce.length}`);
    }
    if (authTag.length !== Constants.GCM_AUTH_TAG_SIZE) {
      return fail(
        `decryptBytes: auth tag must be ${Constants.GCM_AUTH_TAG_SIZE} bytes, got ${authTag.length}`
      );
    }

    return captureResult(() => {
      const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(key), Buffer.from(nonce), {
        authTagLength: Constants.GCM_AUTH_TAG_SIZE
      });
      if (aad !== undefined) {
        decipher.setAAD(Buffer.from(aad));
      }
      decipher.setAuthTag(Buffer.from(authTag));
      const decrypted = Buffer.concat([decipher.update(Buffer.from(ciphertext)), decipher.final()]);
      return new Uint8Array(decrypted);
    }).withErrorFormat((e) => `decryptBytes failed: ${e}`);
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
   * Generates a cryptographically random UUIDv4 via the platform Web Crypto API.
   * @returns `Success` with the generated UUID, or `Failure` if the runtime
   * does not expose `globalThis.crypto.randomUUID`.
   */
  public generateUuid(): Result<Uuid> {
    return captureResult(() => generateUuid());
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
    // Widening upcast to `AlgorithmIdentifier` steers TS to subtle.generateKey's
    // broad overload, which accepts the Ed25519 `{ name: 'Ed25519' }` shape and
    // returns `CryptoKey | CryptoKeyPair`. The narrowing back to `CryptoKeyPair`
    // is a runtime check via the `in` operator, not a type assertion.
    const result = await captureAsyncResult(async () => {
      const generated = await crypto.webcrypto.subtle.generateKey(
        params.generateKey as AlgorithmIdentifier,
        extractable,
        [...params.keyPairUsages]
      );
      if ('privateKey' in generated && 'publicKey' in generated) {
        return generated;
      }
      /* c8 ignore next - unreachable: every entry in keyPairAlgorithmParams produces a keypair */
      throw new Error(`${algorithm} unexpectedly produced a single CryptoKey`);
    });
    return result.withErrorFormat((e) => `Failed to generate ${algorithm} keypair: ${e}`);
  }

  /**
   * Derives an asymmetric keypair deterministically from a fixed secret seed.
   * @param algorithm - The seed-derivable algorithm (only `'ed25519'` today).
   * @param seed - The 32-byte secret seed.
   * @param extractable - Whether the returned private key may be exported.
   * @returns `Success` with the derived `CryptoKeyPair`, or `Failure` with an error.
   */
  public importKeyPairFromSeed(
    algorithm: SeedDerivableAlgorithm,
    seed: Uint8Array,
    extractable: boolean
  ): Promise<Result<CryptoKeyPair>> {
    return deriveKeyPairFromSeed(algorithm, seed, extractable);
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

  /**
   * Exports a public `CryptoKey` as a DER-encoded SPKI blob.
   * @param publicKey - The public `CryptoKey` to export.
   * @returns `Success` with the raw SPKI bytes, or `Failure` with error context.
   */
  public async exportPublicKeySpki(publicKey: CryptoKey): Promise<Result<Uint8Array>> {
    if (publicKey.type !== 'public') {
      return fail(`exportPublicKeySpki requires a public CryptoKey, got '${publicKey.type}'`);
    }
    const result = await captureAsyncResult(() => crypto.webcrypto.subtle.exportKey('spki', publicKey));
    return result
      .withErrorFormat((e) => `exportPublicKeySpki: failed to export key: ${e}`)
      .onSuccess((buf) => succeed(new Uint8Array(buf)));
  }

  /**
   * Imports a public key from a DER-encoded SPKI blob.
   * @param spkiBytes - The raw SPKI bytes.
   * @param algorithm - The algorithm the key was generated for.
   * @returns `Success` with the imported public `CryptoKey`, or `Failure` with error context.
   */
  public async importPublicKeySpki(
    spkiBytes: Uint8Array,
    algorithm: KeyPairAlgorithm
  ): Promise<Result<CryptoKey>> {
    const params = keyPairAlgorithmParams[algorithm];
    const result = await captureAsyncResult(() =>
      crypto.webcrypto.subtle.importKey(
        'spki',
        spkiBytes,
        params.importPublicKey as AlgorithmIdentifier,
        true,
        [...params.publicKeyUsages]
      )
    );
    return result.withErrorFormat(
      (e) => `importPublicKeySpki: failed to import ${algorithm} public key from SPKI: ${e}`
    );
  }

  /**
   * Signs `data` with `privateKey` using the algorithm inferred from the key.
   * @param privateKey - A signing `CryptoKey` (`'ecdsa-p256'` or `'ed25519'`).
   * @param data - The bytes to sign.
   * @returns `Success` with the raw signature bytes, or `Failure` with error context.
   */
  public async sign(privateKey: CryptoKey, data: Uint8Array): Promise<Result<Uint8Array>> {
    const algorithm = signAlgorithmFromKey(privateKey);
    const result = await captureAsyncResult(() => crypto.webcrypto.subtle.sign(algorithm, privateKey, data));
    return result
      .withErrorFormat((e) => `sign failed: ${e}`)
      .onSuccess((buf) => succeed(new Uint8Array(buf)));
  }

  /**
   * Verifies a signature produced by {@link NodeCryptoProvider.sign}.
   * @param publicKey - A verify `CryptoKey` (`'ecdsa-p256'` or `'ed25519'`).
   * @param signature - The raw signature bytes.
   * @param data - The original data that was signed.
   * @returns `Success` with `true` if valid, `false` if not, or `Failure` with error context.
   */
  public async verify(
    publicKey: CryptoKey,
    signature: Uint8Array,
    data: Uint8Array
  ): Promise<Result<boolean>> {
    const algorithm = signAlgorithmFromKey(publicKey);
    const result = await captureAsyncResult(() =>
      crypto.webcrypto.subtle.verify(algorithm, publicKey, signature, data)
    );
    return result.withErrorFormat((e) => `verify failed: ${e}`);
  }

  /**
   * Compares two byte arrays in constant time using Node's native
   * `crypto.timingSafeEqual`. Returns `false` for mismatched lengths
   * rather than throwing (Node's native throws on length mismatch).
   * @param a - First byte array.
   * @param b - Second byte array.
   * @returns `true` if lengths match and all bytes are equal, `false` otherwise.
   */
  public timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }

  /**
   * Computes an HMAC-SHA256 MAC for `data` using `key`.
   * @param key - An HMAC `CryptoKey` with `'sign'` usage.
   * @param data - The bytes to authenticate.
   * @returns `Success` with the 32-byte MAC, or `Failure` with error context.
   */
  public async hmacSha256(key: CryptoKey, data: Uint8Array): Promise<Result<Uint8Array>> {
    const result = await captureAsyncResult(() => crypto.webcrypto.subtle.sign({ name: 'HMAC' }, key, data));
    return result
      .withErrorFormat((e) => `hmacSha256 failed: ${e}`)
      .onSuccess((buf) => succeed(new Uint8Array(buf)));
  }

  /**
   * Verifies an HMAC-SHA256 MAC in constant time.
   * @param key - An HMAC `CryptoKey` with `'sign'` usage.
   * @param signature - The MAC bytes to verify.
   * @param data - The original data that was authenticated.
   * @returns `Success` with `true` if valid, `false` if not, or `Failure` with error context.
   */
  public async verifyHmacSha256(
    key: CryptoKey,
    signature: Uint8Array,
    data: Uint8Array
  ): Promise<Result<boolean>> {
    return (await this.hmacSha256(key, data))
      .withErrorFormat((e) => `verifyHmacSha256 failed: ${e}`)
      .onSuccess((mac) => succeed(this.timingSafeEqual(mac, signature)));
  }

  /**
   * Wraps `plaintext` for the holder of `recipientPublicKey` using
   * ECIES (ECDH P-256 + HKDF-SHA256 + AES-GCM-256). See
   * {@link CryptoUtils.ICryptoProvider.wrapBytes | ICryptoProvider.wrapBytes}.
   * @param plaintext - The bytes to wrap.
   * @param recipientPublicKey - The recipient's ECDH P-256 public `CryptoKey`.
   * @param options - HKDF salt and info; see {@link CryptoUtils.IWrapBytesOptions | IWrapBytesOptions}.
   * @returns `Success` with the wrapped payload, or `Failure` with an error.
   */
  public async wrapBytes(
    plaintext: Uint8Array,
    recipientPublicKey: CryptoKey,
    options: IWrapBytesOptions
  ): Promise<Result<IWrappedBytes>> {
    const recipientCheck = checkEcdhP256(recipientPublicKey, 'public', 'recipient public key');
    if (recipientCheck.isFailure()) {
      return fail(`wrapBytes failed: ${recipientCheck.message}`);
    }
    const subtle = crypto.webcrypto.subtle;
    const result = await captureAsyncResult(async () => {
      const ephemeral = (await subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, [
        'deriveKey'
      ])) as CryptoKeyPair;
      const hkdfBase = await subtle.deriveKey(
        { name: 'ECDH', public: recipientPublicKey },
        ephemeral.privateKey,
        { name: 'HKDF' },
        false,
        ['deriveKey']
      );
      const wrapKey = await subtle.deriveKey(
        { name: 'HKDF', salt: options.salt, info: options.info, hash: 'SHA-256' },
        hkdfBase,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );
      const nonce = crypto.randomBytes(Constants.GCM_IV_SIZE);
      const ctBuf = await subtle.encrypt({ name: 'AES-GCM', iv: nonce }, wrapKey, plaintext);
      const ephemeralPublicKey = await subtle.exportKey('jwk', ephemeral.publicKey);
      return {
        ephemeralPublicKey,
        nonce: this.toBase64(nonce),
        ciphertext: this.toBase64(new Uint8Array(ctBuf))
      };
    });
    return result.withErrorFormat((e) => `wrapBytes failed: ${e}`);
  }

  /**
   * Unwraps a payload produced by `wrapBytes` using the recipient's private
   * key. See {@link CryptoUtils.ICryptoProvider.unwrapBytes | ICryptoProvider.unwrapBytes}.
   * @param wrapped - The wrapped payload.
   * @param recipientPrivateKey - The recipient's ECDH P-256 private `CryptoKey`.
   * @param options - HKDF salt and info matching the wrap call.
   * @returns `Success` with the original `plaintext`, or `Failure` with an error.
   */
  public async unwrapBytes(
    wrapped: IWrappedBytes,
    recipientPrivateKey: CryptoKey,
    options: IWrapBytesOptions
  ): Promise<Result<Uint8Array>> {
    const recipientCheck = checkEcdhP256(recipientPrivateKey, 'private', 'recipient private key');
    if (recipientCheck.isFailure()) {
      return fail(`unwrapBytes failed: ${recipientCheck.message}`);
    }
    const nonceResult = this.fromBase64(wrapped.nonce);
    if (nonceResult.isFailure()) {
      return fail(`unwrapBytes failed: nonce: ${nonceResult.message}`);
    }
    if (nonceResult.value.length !== Constants.GCM_IV_SIZE) {
      return fail(
        `unwrapBytes failed: nonce must be ${Constants.GCM_IV_SIZE} bytes (got ${nonceResult.value.length})`
      );
    }
    const ciphertextResult = this.fromBase64(wrapped.ciphertext);
    if (ciphertextResult.isFailure()) {
      return fail(`unwrapBytes failed: ciphertext: ${ciphertextResult.message}`);
    }
    if (ciphertextResult.value.length < Constants.GCM_AUTH_TAG_SIZE) {
      return fail(
        `unwrapBytes failed: ciphertext must be at least ${Constants.GCM_AUTH_TAG_SIZE} bytes (got ${ciphertextResult.value.length})`
      );
    }
    const subtle = crypto.webcrypto.subtle;
    const result = await captureAsyncResult(async () => {
      const ephemeralPub = await subtle.importKey(
        'jwk',
        wrapped.ephemeralPublicKey,
        { name: 'ECDH', namedCurve: 'P-256' },
        false,
        []
      );
      const hkdfBase = await subtle.deriveKey(
        { name: 'ECDH', public: ephemeralPub },
        recipientPrivateKey,
        { name: 'HKDF' },
        false,
        ['deriveKey']
      );
      const wrapKey = await subtle.deriveKey(
        { name: 'HKDF', salt: options.salt, info: options.info, hash: 'SHA-256' },
        hkdfBase,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );
      const ptBuf = await subtle.decrypt(
        { name: 'AES-GCM', iv: nonceResult.value },
        wrapKey,
        ciphertextResult.value
      );
      return new Uint8Array(ptBuf);
    });
    return result.withErrorFormat((e) => `unwrapBytes failed: ${e}`);
  }
}

/**
 * Derives the algorithm identifier needed by `crypto.subtle.sign/verify`
 * from the key's embedded `algorithm` property. ECDSA requires an explicit
 * `hash` parameter that is not stored on the key object itself; all other
 * supported signing algorithms (`Ed25519`) use the key algorithm as-is.
 */
function signAlgorithmFromKey(key: CryptoKey): AlgorithmIdentifier | EcdsaParams {
  if (key.algorithm.name === 'ECDSA') {
    return { name: 'ECDSA', hash: 'SHA-256' };
  }
  return key.algorithm as AlgorithmIdentifier;
}

/**
 * Verifies that `key` is an ECDH P-256 `CryptoKey` of the expected `keyType`
 * (public or private). Used by the wrap/unwrap methods to surface a clean
 * `Failure` instead of letting the WebCrypto deriveKey call throw a less
 * informative error later in the pipeline. Key usages are intentionally not
 * checked here: WebCrypto already produces a specific error if `deriveKey` is
 * not in `usages`, and `deriveBits` is an equally valid alternative usage that
 * an explicit check would have to track.
 * @param key - The CryptoKey to validate.
 * @param keyType - The required `key.type` ('public' for wrap, 'private' for unwrap).
 * @param label - Human-readable role label included in the failure message.
 * @returns `Success` with the key (unchanged) when the algorithm, curve, and
 * type all match; otherwise `Failure` with `<label> must be ECDH P-256 (...)`.
 */
function checkEcdhP256(key: CryptoKey, keyType: 'public' | 'private', label: string): Result<CryptoKey> {
  if (key.algorithm.name !== 'ECDH') {
    return fail(`${label} must be ECDH P-256 (got algorithm '${key.algorithm.name}')`);
  }
  const namedCurve = (key.algorithm as EcKeyAlgorithm).namedCurve;
  if (namedCurve !== 'P-256') {
    return fail(`${label} must be ECDH P-256 (got curve '${namedCurve}')`);
  }
  if (key.type !== keyType) {
    return fail(`${label} must be a ${keyType} CryptoKey (got '${key.type}')`);
  }
  return succeed(key);
}

/**
 * Singleton instance of {@link CryptoUtils.NodeCryptoProvider}.
 * @public
 */
export const nodeCryptoProvider: NodeCryptoProvider = new NodeCryptoProvider();
