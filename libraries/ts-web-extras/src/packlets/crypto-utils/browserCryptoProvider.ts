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

import {
  captureAsyncResult,
  captureResult,
  fail,
  Failure,
  Result,
  succeed,
  Success,
  Uuid
} from '@fgv/ts-utils';
import { CryptoUtils } from '@fgv/ts-extras';

/* c8 ignore start - Used only by browser-only methods that cannot be tested in Node.js environment */
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
/* c8 ignore stop */

/**
 * Returns a fresh Uint8Array view over a non-shared ArrayBuffer copy of `arr`.
 * Used by {@link BrowserCryptoProvider.wrapBytes | wrapBytes} and
 * {@link BrowserCryptoProvider.unwrapBytes | unwrapBytes}: Node 20's
 * webcrypto.subtle rejects raw `ArrayBuffer` for several `BufferSource`
 * parameters with "is not instance of ArrayBuffer, Buffer, TypedArray, or
 * DataView" even though `ArrayBuffer` should be valid per the spec; a
 * TypedArray view is accepted on Node 20+ and on browsers, and the explicit
 * `Uint8Array<ArrayBuffer>` return type also satisfies TypeScript's `BufferSource`
 * (which excludes the `SharedArrayBuffer` branch of `Uint8Array`'s buffer type).
 */
function toBufferView(arr: Uint8Array): Uint8Array<ArrayBuffer> {
  const buffer = new ArrayBuffer(arr.byteLength);
  const view = new Uint8Array(buffer);
  view.set(arr);
  return view;
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
export class BrowserCryptoProvider implements CryptoUtils.ICryptoProvider {
  private readonly _crypto: Crypto;

  /* c8 ignore start - Existing browser-only methods cannot be tested in Node.js environment */
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
  public async encrypt(plaintext: string, key: Uint8Array): Promise<Result<CryptoUtils.IEncryptionResult>> {
    if (key.length !== CryptoUtils.Constants.AES_256_KEY_SIZE) {
      return Failure.with(`Key must be ${CryptoUtils.Constants.AES_256_KEY_SIZE} bytes, got ${key.length}`);
    }

    try {
      // Generate random IV
      const iv = this._crypto.getRandomValues(new Uint8Array(CryptoUtils.Constants.GCM_IV_SIZE));

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
          tagLength: CryptoUtils.Constants.GCM_AUTH_TAG_SIZE * 8 // bits
        },
        cryptoKey,
        plaintextBytes
      );

      // Split ciphertext and auth tag (auth tag is last 16 bytes)
      const encryptedArray = new Uint8Array(encryptedWithTag);
      const encryptedData = encryptedArray.slice(
        0,
        encryptedArray.length - CryptoUtils.Constants.GCM_AUTH_TAG_SIZE
      );
      const authTag = encryptedArray.slice(encryptedArray.length - CryptoUtils.Constants.GCM_AUTH_TAG_SIZE);
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
    if (key.length !== CryptoUtils.Constants.AES_256_KEY_SIZE) {
      return Failure.with(`Key must be ${CryptoUtils.Constants.AES_256_KEY_SIZE} bytes, got ${key.length}`);
    }
    if (iv.length !== CryptoUtils.Constants.GCM_IV_SIZE) {
      return Failure.with(`IV must be ${CryptoUtils.Constants.GCM_IV_SIZE} bytes, got ${iv.length}`);
    }
    if (authTag.length !== CryptoUtils.Constants.GCM_AUTH_TAG_SIZE) {
      return Failure.with(
        `Auth tag must be ${CryptoUtils.Constants.GCM_AUTH_TAG_SIZE} bytes, got ${authTag.length}`
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
          tagLength: CryptoUtils.Constants.GCM_AUTH_TAG_SIZE * 8 // bits
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
      return Success.with(
        this._crypto.getRandomValues(new Uint8Array(CryptoUtils.Constants.AES_256_KEY_SIZE))
      );
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
        CryptoUtils.Constants.AES_256_KEY_SIZE * 8 // bits
      );

      return Success.with(new Uint8Array(derivedBits));
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return Failure.with(`Key derivation failed: ${message}`);
    }
  }

  /**
   * Computes a SHA-256 hash of the given data.
   * @param data - UTF-8 string to hash
   * @returns `Success` with hex-encoded hash string, or `Failure` with an error.
   */
  public async sha256(data: string): Promise<Result<string>> {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await this._crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = new Uint8Array(hashBuffer);
      const hashHex = Array.from(hashArray)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      return succeed(hashHex);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return fail(`SHA-256 hash failed: ${message}`);
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
  /* c8 ignore stop */

  /**
   * Generates a cryptographically random UUIDv4 using the injected
   * `Crypto` instance.
   * @returns `Success` with the generated UUID, or `Failure` if the underlying
   * `Crypto` instance does not expose `randomUUID`.
   */
  public generateUuid(): Result<Uuid> {
    /* c8 ignore next 3 - randomUUID is always available in supported runtimes (Node 22+, modern browsers) */
    if (typeof this._crypto.randomUUID !== 'function') {
      return Failure.with('Crypto instance does not expose randomUUID');
    }
    return captureResult(() => this._crypto.randomUUID() as Uuid);
  }

  /* c8 ignore start - browser-only methods continue */

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

  // ============================================================================
  // Asymmetric Key Operations
  // ============================================================================

  /**
   * Generates a new asymmetric keypair via Web Crypto.
   * @param algorithm - The algorithm to use.
   * @param extractable - Whether the resulting keys may be exported.
   * @returns `Success` with the generated `CryptoKeyPair`, or `Failure` with an error.
   */
  public async generateKeyPair(
    algorithm: CryptoUtils.KeyPairAlgorithm,
    extractable: boolean
  ): Promise<Result<CryptoKeyPair>> {
    const params = CryptoUtils.keyPairAlgorithmParams[algorithm];
    // Widening upcast to `AlgorithmIdentifier` steers TS to subtle.generateKey's
    // broad overload, which accepts the Ed25519 `{ name: 'Ed25519' }` shape and
    // returns `CryptoKey | CryptoKeyPair`. The narrowing back to `CryptoKeyPair`
    // is a runtime check via the `in` operator, not a type assertion.
    const result = await captureAsyncResult(async () => {
      const generated = await this._crypto.subtle.generateKey(
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
      return Failure.with(`exportPublicKeyJwk requires a public CryptoKey, got '${publicKey.type}'`);
    }
    const result = await captureAsyncResult(() => this._crypto.subtle.exportKey('jwk', publicKey));
    return result.withErrorFormat((e) => `Failed to export public key as JWK: ${e}`);
  }

  /**
   * Imports a public-key JWK as a `CryptoKey` for the requested algorithm.
   * @param jwk - The JSON Web Key produced by a prior export.
   * @param algorithm - The algorithm the key was generated for.
   * @returns `Success` with the imported public `CryptoKey`, or `Failure` with an error.
   */
  public async importPublicKeyJwk(
    jwk: JsonWebKey,
    algorithm: CryptoUtils.KeyPairAlgorithm
  ): Promise<Result<CryptoKey>> {
    const params = CryptoUtils.keyPairAlgorithmParams[algorithm];
    const result = await captureAsyncResult(() =>
      this._crypto.subtle.importKey('jwk', jwk, params.importPublicKey, true, params.publicKeyUsages)
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
      return Failure.with(`exportPublicKeySpki requires a public CryptoKey, got '${publicKey.type}'`);
    }
    const result = await captureAsyncResult(() => this._crypto.subtle.exportKey('spki', publicKey));
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
    algorithm: CryptoUtils.KeyPairAlgorithm
  ): Promise<Result<CryptoKey>> {
    const params = CryptoUtils.keyPairAlgorithmParams[algorithm];
    const result = await captureAsyncResult(() =>
      this._crypto.subtle.importKey(
        'spki',
        toBufferView(spkiBytes),
        params.importPublicKey as AlgorithmIdentifier,
        true,
        [...params.publicKeyUsages]
      )
    );
    return result.withErrorFormat(
      (e) => `importPublicKeySpki: failed to import ${algorithm} public key from SPKI: ${e}`
    );
  }
  /* c8 ignore stop */

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
    options: CryptoUtils.IWrapBytesOptions
  ): Promise<Result<CryptoUtils.IWrappedBytes>> {
    const recipientCheck = checkEcdhP256(recipientPublicKey, 'public', 'recipient public key');
    if (recipientCheck.isFailure()) {
      return Failure.with(`wrapBytes failed: ${recipientCheck.message}`);
    }
    const subtle = this._crypto.subtle;
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
        { name: 'HKDF', salt: toBufferView(options.salt), info: toBufferView(options.info), hash: 'SHA-256' },
        hkdfBase,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );
      const nonce = this._crypto.getRandomValues(new Uint8Array(CryptoUtils.Constants.GCM_IV_SIZE));
      const ctBuf = await subtle.encrypt({ name: 'AES-GCM', iv: nonce }, wrapKey, toBufferView(plaintext));
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
    wrapped: CryptoUtils.IWrappedBytes,
    recipientPrivateKey: CryptoKey,
    options: CryptoUtils.IWrapBytesOptions
  ): Promise<Result<Uint8Array>> {
    const recipientCheck = checkEcdhP256(recipientPrivateKey, 'private', 'recipient private key');
    if (recipientCheck.isFailure()) {
      return Failure.with(`unwrapBytes failed: ${recipientCheck.message}`);
    }
    const nonceResult = this.fromBase64(wrapped.nonce);
    if (nonceResult.isFailure()) {
      return Failure.with(`unwrapBytes failed: nonce: ${nonceResult.message}`);
    }
    if (nonceResult.value.length !== CryptoUtils.Constants.GCM_IV_SIZE) {
      return Failure.with(
        `unwrapBytes failed: nonce must be ${CryptoUtils.Constants.GCM_IV_SIZE} bytes (got ${nonceResult.value.length})`
      );
    }
    const ciphertextResult = this.fromBase64(wrapped.ciphertext);
    if (ciphertextResult.isFailure()) {
      return Failure.with(`unwrapBytes failed: ciphertext: ${ciphertextResult.message}`);
    }
    if (ciphertextResult.value.length < CryptoUtils.Constants.GCM_AUTH_TAG_SIZE) {
      return Failure.with(
        `unwrapBytes failed: ciphertext must be at least ${CryptoUtils.Constants.GCM_AUTH_TAG_SIZE} bytes (got ${ciphertextResult.value.length})`
      );
    }
    const subtle = this._crypto.subtle;
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
        { name: 'HKDF', salt: toBufferView(options.salt), info: toBufferView(options.info), hash: 'SHA-256' },
        hkdfBase,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );
      const ptBuf = await subtle.decrypt(
        { name: 'AES-GCM', iv: toBufferView(nonceResult.value) },
        wrapKey,
        toBufferView(ciphertextResult.value)
      );
      return new Uint8Array(ptBuf);
    });
    return result.withErrorFormat((e) => `unwrapBytes failed: ${e}`);
  }
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
    return Failure.with(`${label} must be ECDH P-256 (got algorithm '${key.algorithm.name}')`);
  }
  const namedCurve = (key.algorithm as EcKeyAlgorithm).namedCurve;
  if (namedCurve !== 'P-256') {
    return Failure.with(`${label} must be ECDH P-256 (got curve '${namedCurve}')`);
  }
  if (key.type !== keyType) {
    return Failure.with(`${label} must be a ${keyType} CryptoKey (got '${key.type}')`);
  }
  return succeed(key);
}

/* c8 ignore start - Constructs a provider; only meaningful in a real browser environment */
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
