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
import { keyPairAlgorithmParams } from '../keyPairAlgorithmParams';
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
   * files. Used only when {@link IEncryptedFilePrivateKeyStorageCreateParams.tree}
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
   * {@link IEncryptedFilePrivateKeyStorageCreateParams.directory} is ignored —
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
   * @param params - {@link IEncryptedFilePrivateKeyStorageCreateParams}.
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
    const fileNameResult = this._fileNameFor(id);
    if (fileNameResult.isFailure()) {
      return fail(fileNameResult.message);
    }
    const algorithmResult = this._algorithmOf(key);
    if (algorithmResult.isFailure()) {
      return fail(`failed to store private key '${id}': ${algorithmResult.message}`);
    }
    if (key.type !== 'private') {
      return fail(`failed to store private key '${id}': expected a private key, got '${key.type}'`);
    }

    const jwkResult = await captureAsyncResult(() => crypto.webcrypto.subtle.exportKey('jwk', key));
    if (jwkResult.isFailure()) {
      return fail(`failed to export private key '${id}' to JWK: ${jwkResult.message}`);
    }

    const serializeResult = captureResult(() => JSON.stringify(jwkResult.value));
    /* c8 ignore next 3 - JSON.stringify of a WebCrypto JWK record does not throw */
    if (serializeResult.isFailure()) {
      return fail(`failed to serialize private key '${id}': ${serializeResult.message}`);
    }

    const envelope: JsonObject = {
      algorithm: algorithmResult.value,
      jwk: serializeResult.value
    };

    const encryptResult = await createEncryptedFile({
      content: envelope,
      secretName: id,
      key: this._encryptionKey,
      cryptoProvider: this._cryptoProvider
    });
    /* c8 ignore next 3 - defensive: createEncryptedFile only fails on a provider encrypt error, covered in provider tests */
    if (encryptResult.isFailure()) {
      return fail(`failed to encrypt private key '${id}': ${encryptResult.message}`);
    }

    const fileTextResult = captureResult(() => JSON.stringify(encryptResult.value));
    /* c8 ignore next 3 - JSON.stringify of the plain IEncryptedFile record does not throw */
    if (fileTextResult.isFailure()) {
      return fail(`failed to serialize encrypted file for '${id}': ${fileTextResult.message}`);
    }

    return this._writeFile(fileNameResult.value, fileTextResult.value).onSuccess(() => succeed(id));
  }

  /**
   * Loads the private key stored under `id`, decrypting and re-importing it from
   * JWK.
   * @param id - Storage handle.
   */
  public async load(id: string): Promise<Result<CryptoKey>> {
    const fileResult = this._fileNameFor(id).onSuccess((fileName) => this._findFile(fileName));
    if (fileResult.isFailure()) {
      return fail(fileResult.message);
    }
    if (fileResult.value === undefined) {
      return fail(`key not found: '${id}'`);
    }

    const jsonResult = fileResult.value.getContents();
    /* c8 ignore next 3 - defensive: getContents only fails on an unreadable/unparseable file on disk */
    if (jsonResult.isFailure()) {
      return fail(`failed to read private key '${id}': ${jsonResult.message}`);
    }

    const decryptResult = await tryDecryptFile(jsonResult.value, this._encryptionKey, this._cryptoProvider);
    if (decryptResult.isFailure()) {
      return fail(`failed to decrypt private key '${id}': ${decryptResult.message}`);
    }

    const envelopeResult = envelopeConverter.convert(decryptResult.value);
    if (envelopeResult.isFailure()) {
      return fail(`failed to decrypt private key '${id}': ${envelopeResult.message}`);
    }

    return (await this._importPrivateKey(envelopeResult.value)).withErrorFormat(
      (msg) => `failed to import private key '${id}': ${msg}`
    );
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

  private async _importPrivateKey(envelope: IStoredPrivateKeyEnvelope): Promise<Result<CryptoKey>> {
    const jwkResult = captureResult(() => JSON.parse(envelope.jwk) as unknown)
      .withErrorFormat((msg) => `malformed JWK: ${msg}`)
      .onSuccess((parsed) => jsonWebKeyShape.validate(parsed));
    /* c8 ignore next 3 - JWK text we wrote ourselves as authenticated ciphertext is well-formed */
    if (jwkResult.isFailure()) {
      return fail(jwkResult.message);
    }
    const params = keyPairAlgorithmParams[envelope.algorithm];
    const usages = params.keyPairUsages.filter((usage) => !PUBLIC_ONLY_USAGES.includes(usage));
    return captureAsyncResult(() =>
      crypto.webcrypto.subtle.importKey('jwk', jwkResult.value, params.importPublicKey, true, [...usages])
    );
  }
}
