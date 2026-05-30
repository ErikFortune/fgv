// Copyright (c) 2026 Erik Fortune
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
  Converter,
  Converters,
  fail,
  Result,
  succeed
} from '@fgv/ts-utils';
import { FileTree, JsonObject } from '@fgv/ts-json-base';
import { createEncryptedFile, tryDecryptFile } from '../encryptedFile';
import { IKeyPairAlgorithmParams, keyPairAlgorithmParams } from '../keyPairAlgorithmParams';
import { ICryptoProvider, KeyPairAlgorithm } from '../model';
import * as Constants from '../constants';
import { jsonWebKeyShape, keyPairAlgorithm } from './converters';
import { IPrivateKeyStorage } from './privateKeyStorage';

/**
 * Parameters for {@link CryptoUtils.KeyStore.EncryptedFilePrivateKeyStorage.create}.
 * @public
 */
export interface IEncryptedFilePrivateKeyStorageCreateParams {
  /**
   * Filesystem path to the directory that holds the encrypted private-key
   * files. Used only when {@link CryptoUtils.KeyStore.IEncryptedFilePrivateKeyStorageCreateParams.tree}
   * is omitted (the default `FsTree` backing). The directory must already
   * exist.
   */
  readonly directory: string;

  /**
   * Raw AES-256-GCM key (32 bytes) used to encrypt each file's JWK content.
   * Consumer-supplied and decoupled from the keystore's password lifecycle —
   * derive it however the application sees fit (typically the same
   * password-derived key material the keystore vault uses).
   */
  readonly encryptionKey: Uint8Array;

  /**
   * {@link CryptoUtils.ICryptoProvider | Crypto provider} used for the
   * AES-256-GCM encrypt/decrypt of each file's contents.
   */
  readonly cryptoProvider: ICryptoProvider;

  /**
   * Optional {@link FileTree.IFileTreeDirectoryItem | FileTree directory}
   * override. When supplied it is used as the storage directory directly and
   * {@link CryptoUtils.KeyStore.IEncryptedFilePrivateKeyStorageCreateParams.directory} is ignored —
   * pass an in-memory tree for tests, or another Node-compatible backend. When
   * omitted, a mutable `FsTree` rooted at `directory` is used. (This backend is
   * Node-only — it round-trips keys through `node:crypto` — so a browser file
   * tree is not a supported target.)
   */
  readonly tree?: FileTree.IFileTreeDirectoryItem;
}

/**
 * Decrypted on-disk envelope for a single stored private key. The JWK is held
 * as a serialized JSON string so the whole envelope is a flat record of
 * strings, which round-trips through {@link CryptoUtils.createEncryptedFile}
 * without ambiguity.
 */
interface IStoredPrivateKeyEnvelope {
  readonly algorithm: KeyPairAlgorithm;
  readonly jwk: string;
}

const envelopeConverter: Converter<IStoredPrivateKeyEnvelope> = Converters.object<IStoredPrivateKeyEnvelope>({
  algorithm: keyPairAlgorithm,
  jwk: Converters.string
});

// WebCrypto key usages that only ever apply to a public key. Filtering these
// out of the keypair usages yields the usages valid for the private half, which
// `crypto.subtle.importKey` requires when re-importing a private JWK.
const PUBLIC_ONLY_USAGES: ReadonlyArray<KeyUsage> = ['verify', 'encrypt', 'wrapKey'];

// Safe-filename id production. The keystore mints UUIDv4 handles, which match;
// arbitrary consumer-supplied ids that could escape the storage directory are
// rejected rather than silently mangled.
const SAFE_ID: RegExp = /^[A-Za-z0-9._-]+$/;

const FILE_SUFFIX: string = '.json';

/**
 * {@link CryptoUtils.KeyStore.IPrivateKeyStorage | IPrivateKeyStorage}
 * implementation that persists each private key as its own AES-256-GCM-encrypted
 * file in a directory. The file content is the key's JWK, encrypted with a
 * consumer-supplied 32-byte key via the supplied
 * {@link CryptoUtils.ICryptoProvider | crypto provider}.
 *
 * `supportsNonExtractable` is `false`: persisting to disk requires exporting the
 * private key to JWK, which only works for `extractable: true` keys. The
 * keystore generates extractable keys when a backend reports `false` here.
 *
 * I/O goes through the {@link FileTree.FileTree | FileTree} abstraction (default
 * `FsTree`), so the same implementation works against an in-memory tree (tests)
 * or any other Node-compatible backend.
 *
 * This backend is **Node-only**: it round-trips private keys through
 * `node:crypto` (`crypto.webcrypto.subtle`), so it is intentionally excluded
 * from the browser entry point. Browser consumers should use
 * `IdbPrivateKeyStorage` from `@fgv/ts-web-extras` instead.
 *
 * Single-process assumption: there is no inter-process locking. Concurrent
 * writers to the same directory may race.
 *
 * @public
 */
export class EncryptedFilePrivateKeyStorage implements IPrivateKeyStorage {
  /**
   * `false` — disk persistence round-trips via JWK, which requires extractable
   * keys.
   */
  public readonly supportsNonExtractable: false = false;

  private readonly _directory: FileTree.IFileTreeDirectoryItem;
  private readonly _encryptionKey: Uint8Array;
  private readonly _cryptoProvider: ICryptoProvider;

  private constructor(
    directory: FileTree.IFileTreeDirectoryItem,
    encryptionKey: Uint8Array,
    cryptoProvider: ICryptoProvider
  ) {
    this._directory = directory;
    // Clone so the instance holds an immutable snapshot — callers that later
    // reuse or zero their buffer must not be able to mutate our key.
    this._encryptionKey = Uint8Array.from(encryptionKey);
    this._cryptoProvider = cryptoProvider;
  }

  /**
   * Creates a new {@link CryptoUtils.KeyStore.EncryptedFilePrivateKeyStorage}.
   * @param params - {@link CryptoUtils.KeyStore.IEncryptedFilePrivateKeyStorageCreateParams}.
   * @returns `Success` with the new instance, or `Failure` if the encryption
   * key is the wrong size or the storage directory cannot be opened.
   */
  public static create(
    params: IEncryptedFilePrivateKeyStorageCreateParams
  ): Result<EncryptedFilePrivateKeyStorage> {
    const { directory, encryptionKey, cryptoProvider, tree } = params;
    if (encryptionKey.length !== Constants.AES_256_KEY_SIZE) {
      return fail(
        `EncryptedFilePrivateKeyStorage: encryptionKey must be ${Constants.AES_256_KEY_SIZE} bytes, got ${encryptionKey.length}`
      );
    }
    if (tree !== undefined) {
      return succeed(new EncryptedFilePrivateKeyStorage(tree, encryptionKey, cryptoProvider));
    }
    return FileTree.forFilesystem({ mutable: true })
      .onSuccess((ft) => ft.getDirectory(directory))
      .withErrorFormat((msg) => `EncryptedFilePrivateKeyStorage: failed to open '${directory}': ${msg}`)
      .onSuccess((dir) => succeed(new EncryptedFilePrivateKeyStorage(dir, encryptionKey, cryptoProvider)));
  }

  /**
   * Stores `key` under `id` as an encrypted JWK file.
   * @param id - Storage handle. Must be a safe filename token
   * (`[A-Za-z0-9._-]+`, not `.`/`..`).
   * @param key - The extractable private `CryptoKey` to persist.
   */
  public async store(id: string, key: CryptoKey): Promise<Result<string>> {
    return this._validateKeyToStore(id, key).thenOnSuccess(({ fileName, algorithm }) =>
      this._encryptAndWrite(algorithm, key, id, fileName)
    );
  }

  /**
   * Loads the private key stored under `id`, decrypting and re-importing it from
   * JWK.
   * @param id - Storage handle.
   */
  public async load(id: string): Promise<Result<CryptoKey>> {
    return this._fileNameFor(id)
      .onSuccess((fileName) => this._findFile(fileName))
      .onSuccess((file) =>
        file === undefined ? fail<FileTree.IFileTreeFileItem>(`key not found: '${id}'`) : succeed(file)
      )
      .thenOnSuccess((file) => this._decryptEnvelope(file, id))
      .thenOnSuccess((envelope) => this._importPrivateKey(envelope, id));
  }

  /**
   * Deletes the entry stored under `id`. Missing ids fail (the read path is
   * keystore-driven and never asks to delete an id it did not store).
   * @param id - Storage handle.
   */
  public async delete(id: string): Promise<Result<string>> {
    const fileResult = this._fileNameFor(id).onSuccess((fileName) =>
      this._findFile(fileName).onSuccess((file) => succeed({ fileName, file }))
    );
    if (fileResult.isFailure()) {
      return fail(fileResult.message);
    }
    if (fileResult.value.file === undefined) {
      return fail(`key not found: '${id}'`);
    }
    /* c8 ignore next 3 - defensive: directory items from read-only adapters lack mutation methods */
    if (!FileTree.isMutableDirectoryItem(this._directory)) {
      return fail(`failed to delete private key '${id}': storage directory is not mutable`);
    }
    return Promise.resolve(
      this._directory
        .deleteChild(fileResult.value.fileName)
        .withErrorFormat((msg) => `failed to delete private key '${id}': ${msg}`)
        .onSuccess(() => succeed(id))
    );
  }

  /**
   * Lists every stored id.
   */
  public async list(): Promise<Result<readonly string[]>> {
    return Promise.resolve(
      this._directory.getChildren().onSuccess((children) => {
        const ids = children
          .filter((child) => child.type === 'file' && child.name.endsWith(FILE_SUFFIX))
          .map((child) => child.name.slice(0, -FILE_SUFFIX.length));
        return succeed(ids);
      })
    );
  }

  private _fileNameFor(id: string): Result<string> {
    if (id === '.' || id === '..' || !SAFE_ID.test(id)) {
      return fail(`invalid storage id '${id}': must match ${SAFE_ID.source}`);
    }
    return succeed(`${id}${FILE_SUFFIX}`);
  }

  /**
   * Validates the synchronous preconditions for a store: the id is filename-safe,
   * the key is actually a private key, and its algorithm is one we support.
   * Returns the resolved filename and algorithm so the async pipeline can run
   * without re-deriving them.
   */
  private _validateKeyToStore(
    id: string,
    key: CryptoKey
  ): Result<{ fileName: string; algorithm: KeyPairAlgorithm }> {
    return this._fileNameFor(id).onSuccess((fileName) => {
      if (key.type !== 'private') {
        return fail(`failed to store private key '${id}': expected a private key, got '${key.type}'`);
      }
      return this._algorithmOf(key)
        .withErrorFormat((msg) => `failed to store private key '${id}': ${msg}`)
        .onSuccess((algorithm) => succeed({ fileName, algorithm }));
    });
  }

  /**
   * Exports `key` to JWK, wraps it in the stored envelope, encrypts it with
   * AES-256-GCM, and writes the resulting file as serialized JSON to `fileName`.
   * Returns the stored `id` on success.
   */
  private async _encryptAndWrite(
    algorithm: KeyPairAlgorithm,
    key: CryptoKey,
    id: string,
    fileName: string
  ): Promise<Result<string>> {
    return succeed(key)
      .thenOnSuccess((k) => captureAsyncResult(() => crypto.webcrypto.subtle.exportKey('jwk', k)))
      .withErrorFormat((msg) => `failed to export private key '${id}' to JWK: ${msg}`)
      .onSuccess<JsonObject>((jwk) => succeed({ algorithm, jwk: JSON.stringify(jwk) }))
      .thenOnSuccess((envelope) =>
        createEncryptedFile({
          content: envelope,
          secretName: id,
          key: this._encryptionKey,
          cryptoProvider: this._cryptoProvider
        })
      )
      .withErrorFormat((msg) => `failed to encrypt private key '${id}': ${msg}`)
      .onSuccess((encrypted) => this._writeFile(fileName, JSON.stringify(encrypted)))
      .onSuccess(() => succeed(id));
  }

  private _algorithmOf(key: CryptoKey): Result<KeyPairAlgorithm> {
    const alg = key.algorithm;
    switch (alg.name) {
      case 'ECDSA':
      case 'ECDH': {
        const curve = (alg as EcKeyAlgorithm).namedCurve;
        if (curve !== 'P-256') {
          return fail(`unsupported ${alg.name} curve '${curve}' (only P-256 is supported)`);
        }
        return succeed(alg.name === 'ECDSA' ? 'ecdsa-p256' : 'ecdh-p256');
      }
      case 'RSA-OAEP': {
        // Only the hash affects the JWK re-import params, so it is the field
        // that must match; the modulus length is recovered from the key data.
        const hash = (alg as RsaHashedKeyAlgorithm).hash.name;
        if (hash !== 'SHA-256') {
          return fail(`unsupported RSA-OAEP hash '${hash}' (only SHA-256 is supported)`);
        }
        return succeed('rsa-oaep-2048');
      }
      case 'Ed25519':
        return succeed('ed25519');
      case 'X25519':
        return succeed('x25519');
      default:
        return fail(`unsupported key algorithm '${alg.name}'`);
    }
  }

  private _findFile(fileName: string): Result<FileTree.IFileTreeFileItem | undefined> {
    return this._directory.getChildren().onSuccess((children) => {
      const found = children.find((child) => child.type === 'file' && child.name === fileName);
      return succeed(found as FileTree.IFileTreeFileItem | undefined);
    });
  }

  private _writeFile(fileName: string, text: string): Result<string> {
    return this._findFile(fileName).onSuccess((existing) => {
      if (existing !== undefined) {
        /* c8 ignore next 3 - defensive: file items from read-only adapters lack mutation methods */
        if (!FileTree.isMutableFileItem(existing)) {
          return fail(`${existing.absolutePath}: not mutable`);
        }
        return existing.setRawContents(text);
      }
      /* c8 ignore next 3 - defensive: directory items from read-only adapters lack mutation methods */
      if (!FileTree.isMutableDirectoryItem(this._directory)) {
        return fail(`${this._directory.absolutePath}: not mutable`);
      }
      return this._directory.createChildFile(fileName, text).onSuccess(() => succeed(text));
    });
  }

  /**
   * Reads `file`, decrypts the AES-256-GCM envelope, and validates it into the
   * typed `IStoredPrivateKeyEnvelope`. Read, decrypt, and shape failures
   * all surface as a decrypt failure for `id`.
   */
  private async _decryptEnvelope(
    file: FileTree.IFileTreeFileItem,
    id: string
  ): Promise<Result<IStoredPrivateKeyEnvelope>> {
    return file
      .getContents()
      .thenOnSuccess((json) => tryDecryptFile(json, this._encryptionKey, this._cryptoProvider))
      .onSuccess((decrypted) => envelopeConverter.convert(decrypted))
      .withErrorFormat((msg) => `failed to decrypt private key '${id}': ${msg}`);
  }

  /**
   * Parses and shape-validates the stored JWK, then re-imports it as a private
   * `CryptoKey` for the envelope's algorithm. The WebCrypto JWK-import algorithm
   * descriptor is shared between public and private keys for every supported
   * algorithm, so {@link CryptoUtils.IKeyPairAlgorithmParams.importPublicKey} is reused here;
   * the public/private distinction is carried by the requested `usages`.
   */
  private async _importPrivateKey(
    envelope: IStoredPrivateKeyEnvelope,
    id: string
  ): Promise<Result<CryptoKey>> {
    const params = keyPairAlgorithmParams[envelope.algorithm];
    return captureResult(() => JSON.parse(envelope.jwk) as unknown)
      .onSuccess((parsed) => jsonWebKeyShape.validate(parsed))
      .withErrorFormat((msg) => `malformed JWK: ${msg}`)
      .thenOnSuccess((jwk) =>
        captureAsyncResult(() =>
          crypto.webcrypto.subtle.importKey(
            'jwk',
            jwk,
            params.importPublicKey,
            true,
            this._importUsagesFor(jwk, params)
          )
        )
      )
      .withErrorFormat((msg) => `failed to import private key '${id}': ${msg}`);
  }

  /**
   * Computes the key usages to request when re-importing a stored private key.
   * WebCrypto rejects `importKey` if the requested usages include operations
   * absent from the JWK's `key_ops`, so a key originally created with a narrower
   * usage set than the algorithm default (e.g. an ECDH key with only
   * `deriveBits`) would fail to load against the algorithm-wide defaults.
   * Intersect the algorithm's private usages with the JWK's recorded `key_ops`
   * so we request exactly the operations the stored key actually supports;
   * fall back to the algorithm's private usages when `key_ops` is absent.
   */
  private _importUsagesFor(jwk: JsonWebKey, params: IKeyPairAlgorithmParams): KeyUsage[] {
    const privateUsages = params.keyPairUsages.filter((usage) => !PUBLIC_ONLY_USAGES.includes(usage));
    const keyOps = jwk.key_ops;
    if (keyOps === undefined) {
      return [...privateUsages];
    }
    return privateUsages.filter((usage) => keyOps.includes(usage));
  }
}
