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

import { Converter, fail, mapResults, pick, Result, succeed, Validator } from '@fgv/ts-utils';
import { FileTree, JsonObject } from '@fgv/ts-json-base';
import { CollectionFilter, ICollectionFilterInitParams, IFilterDirectoryParams } from './collectionFilter';
import { ICollection, IEncryptionConfig, MutabilitySpec } from './model';
import * as LibraryConverters from './converters';
import { decryptCollectionFile, isEncryptedCollectionFile, Converters as CryptoConverters } from '../crypto';

/**
 * Parameters used to initialize a {@link LibraryData.CollectionLoader | CollectionLoader}.
 * @public
 */
export interface ICollectionLoaderInitParams<
  T,
  TCOLLECTIONID extends string = string,
  TITEMID extends string = string
> {
  readonly itemConverter: Converter<T> | Validator<T>;
  readonly collectionIdConverter: Converter<TCOLLECTIONID>;
  readonly itemIdConverter: Converter<TITEMID> | Validator<TITEMID>;
  /**
   * Optional converter to transform file names before applying the collection ID converter.
   * Defaults to {@link LibraryData.Converters.removeJsonExtension | removeJsonExtension}.
   */
  readonly fileNameConverter?: Converter<string>;
  /**
   * Default mutability specification for loaded collections.
   * Defaults to `false` (all collections immutable).
   */
  readonly mutable?: MutabilitySpec;
}

/**
 * Parameters used to load collections from a file tree.
 * @public
 */
export interface ILoadCollectionFromFileTreeParams<TCOLLECTIONID extends string>
  extends Omit<ICollectionFilterInitParams<TCOLLECTIONID>, 'nameConverter'> {
  readonly recurseWithDelimiter?: string;
  /**
   * Overrides the default mutability specification for this load operation.
   * If not specified, uses the loader's default.
   */
  readonly mutable?: MutabilitySpec;
  /**
   * Optional encryption configuration for decrypting encrypted collection files.
   * If not provided, encrypted files will be treated as regular JSON (and likely fail validation).
   */
  readonly encryption?: IEncryptionConfig;
}

/**
 * Loads collections from a file tree, validating with supplied converters and filtering as specified.
 * @public
 */
export class CollectionLoader<
  T = JsonObject,
  TCOLLECTIONID extends string = string,
  TITEMID extends string = string
> {
  private readonly _fileNameToCollectionIdConverter: Converter<TCOLLECTIONID>;
  private readonly _collectionIdConverter: Converter<TCOLLECTIONID>;
  private readonly _itemIdConverter: Converter<TITEMID> | Validator<TITEMID>;
  private readonly _itemConverter: Converter<T> | Validator<T>;
  private readonly _mutableDefault: MutabilitySpec;
  private readonly _collectionConverter: Converter<ICollection<T, TCOLLECTIONID, TITEMID>>;

  public constructor(params: ICollectionLoaderInitParams<T, TCOLLECTIONID, TITEMID>) {
    this._collectionIdConverter = params.collectionIdConverter;
    // For file names, first apply file name converter (default: remove .json), then collection ID converter
    const fileNameConverter = params.fileNameConverter ?? LibraryConverters.removeJsonExtension;
    this._fileNameToCollectionIdConverter = fileNameConverter.mapConvert(this._collectionIdConverter);
    this._itemIdConverter = params.itemIdConverter;
    this._itemConverter = params.itemConverter;
    this._mutableDefault = params.mutable ?? false;
    this._collectionConverter = LibraryConverters.collection({
      itemConverter: this._itemConverter,
      itemIdConverter: this._itemIdConverter,
      collectionIdConverter: this._collectionIdConverter
    });
  }

  /**
   * Loads collections from a `FileTree` using optional filtering parameters.
   * Note: This synchronous method does not support encrypted collections.
   * Use {@link LibraryData.CollectionLoader.loadFromFileTreeAsync | loadFromFileTreeAsync} for encrypted files.
   * @param fileTree - The `FileTree` from which to load collections.
   * @param params - optional {@link LibraryData.ILoadCollectionFromFileTreeParams | parameters} to control filtering
   * and recursion.
   * @returns Success with loaded collections, or Failure with error.
   */
  public loadFromFileTree(
    fileTree: FileTree.FileTreeItem,
    params?: ILoadCollectionFromFileTreeParams<TCOLLECTIONID>
  ): Result<ReadonlyArray<ICollection<T, TCOLLECTIONID, TITEMID>>> {
    params = params ?? {};
    const mutabilitySpec = params.mutable ?? this._mutableDefault;
    const filterParams: ICollectionFilterInitParams<TCOLLECTIONID> = {
      ...pick(params, ['included', 'excluded', 'errorOnInvalidName']),
      nameConverter: this._fileNameToCollectionIdConverter
    };
    const dirParams: IFilterDirectoryParams = pick(params, ['recurseWithDelimiter']);
    const filter = new CollectionFilter<TCOLLECTIONID>(filterParams);
    return filter.filterDirectory(fileTree, dirParams).onSuccess((filteredItems) => {
      return mapResults(
        filteredItems.map((item) => {
          return item.item.getContents().onSuccess((json) => {
            // Check if this is an encrypted collection file
            if (isEncryptedCollectionFile(json)) {
              return fail<ICollection<T, TCOLLECTIONID, TITEMID>>(
                `Encrypted collection "${item.name}" found - use loadFromFileTreeAsync instead`
              );
            }
            return this._collectionConverter.convert({
              id: item.name,
              isMutable: this._isMutable(item.name, mutabilitySpec),
              items: json
            });
          });
        })
      );
    });
  }

  /**
   * Loads collections from a `FileTree` asynchronously, supporting encrypted files.
   * @param fileTree - The `FileTree` from which to load collections.
   * @param params - optional {@link LibraryData.ILoadCollectionFromFileTreeParams | parameters} to control filtering
   * and recursion.
   * @returns Promise resolving to Success with loaded collections, or Failure with error.
   */
  public async loadFromFileTreeAsync(
    fileTree: FileTree.FileTreeItem,
    params?: ILoadCollectionFromFileTreeParams<TCOLLECTIONID>
  ): Promise<Result<ReadonlyArray<ICollection<T, TCOLLECTIONID, TITEMID>>>> {
    params = params ?? {};
    const mutabilitySpec = params.mutable ?? this._mutableDefault;
    const encryption = params.encryption;
    const filterParams: ICollectionFilterInitParams<TCOLLECTIONID> = {
      ...pick(params, ['included', 'excluded', 'errorOnInvalidName']),
      nameConverter: this._fileNameToCollectionIdConverter
    };
    const dirParams: IFilterDirectoryParams = pick(params, ['recurseWithDelimiter']);
    const filter = new CollectionFilter<TCOLLECTIONID>(filterParams);

    const filterResult = filter.filterDirectory(fileTree, dirParams);
    if (filterResult.isFailure()) {
      return fail(filterResult.message);
    }

    const filteredItems = filterResult.value;
    const results: Result<ICollection<T, TCOLLECTIONID, TITEMID>>[] = [];

    for (const item of filteredItems) {
      const contentsResult = item.item.getContents();
      if (contentsResult.isFailure()) {
        return fail(contentsResult.message);
      }

      const json = contentsResult.value;

      // Check if this is an encrypted collection file
      if (isEncryptedCollectionFile(json)) {
        const encryptedResult = await this._processEncryptedFileAsync(
          json as JsonObject,
          item.name,
          mutabilitySpec,
          encryption
        );
        if (encryptedResult === undefined) {
          // Skipped due to missing key with skip mode
          continue;
        }
        if (encryptedResult.isFailure()) {
          return fail(encryptedResult.message);
        }
        results.push(encryptedResult);
      } else {
        // Plain JSON - convert directly
        const collectionResult = this._collectionConverter.convert({
          id: item.name,
          isMutable: this._isMutable(item.name, mutabilitySpec),
          items: json
        });
        results.push(collectionResult);
      }
    }

    return mapResults(results);
  }

  /**
   * Processes an encrypted collection file asynchronously.
   * @returns undefined if the file should be skipped, Result otherwise.
   */
  private async _processEncryptedFileAsync(
    json: JsonObject,
    collectionName: TCOLLECTIONID,
    mutabilitySpec: MutabilitySpec,
    encryption?: IEncryptionConfig
  ): Promise<Result<ICollection<T, TCOLLECTIONID, TITEMID>> | undefined> {
    if (!encryption) {
      return fail(`Encrypted collection "${collectionName}" found but no encryption config provided`);
    }

    // Validate the encrypted file structure
    const tombstoneResult = CryptoConverters.encryptedCollectionFile.convert(json);
    if (tombstoneResult.isFailure()) {
      return this._handleEncryptionError(
        `Invalid encrypted collection format for "${collectionName}": ${tombstoneResult.message}`,
        encryption.onDecryptionError
      );
    }

    const tombstone = tombstoneResult.value;

    // Look up the key for this secret
    const keyResult = await this._findKey(tombstone.secretName, encryption);
    if (keyResult.isFailure()) {
      return this._handleEncryptionError(
        `Missing key for secret "${tombstone.secretName}" in collection "${collectionName}": ${keyResult.message}`,
        encryption.onMissingKey
      );
    }

    // Decrypt the collection
    const decryptResult = await decryptCollectionFile(tombstone, keyResult.value, encryption.cryptoProvider);
    if (decryptResult.isFailure()) {
      return this._handleEncryptionError(
        `Decryption failed for collection "${collectionName}": ${decryptResult.message}`,
        encryption.onDecryptionError
      );
    }

    // Convert the decrypted JSON to a collection
    return this._collectionConverter.convert({
      id: collectionName,
      isMutable: this._isMutable(collectionName, mutabilitySpec),
      items: decryptResult.value
    });
  }

  /**
   * Finds a key for the given secret name from the encryption config.
   */
  private async _findKey(secretName: string, encryption: IEncryptionConfig): Promise<Result<Uint8Array>> {
    // First check the secrets array
    if (encryption.secrets) {
      const secret = encryption.secrets.find((s) => s.name === secretName);
      if (secret) {
        return succeed(secret.key);
      }
    }

    // Then try the secret provider
    if (encryption.secretProvider) {
      return encryption.secretProvider(secretName);
    }

    return fail(`Secret "${secretName}" not found`);
  }

  /**
   * Handles encryption errors based on the error mode.
   * @returns undefined to skip, or Failure to propagate the error.
   */
  private _handleEncryptionError(
    message: string,
    errorMode?: 'fail' | 'skip' | 'warn'
  ): Result<ICollection<T, TCOLLECTIONID, TITEMID>> | undefined {
    const mode = errorMode ?? 'fail';
    switch (mode) {
      case 'skip':
        return undefined;
      case 'warn':
        console.warn(`[CollectionLoader] ${message}`);
        return undefined;
      case 'fail':
      default:
        return fail(message);
    }
  }

  /**
   * Determines if a collection is mutable based on its ID and the mutability specification.
   * @param id - The collection ID.
   * @param spec - The mutability specification.
   * @returns `true` if the collection is mutable, `false` otherwise.
   */
  private _isMutable(id: TCOLLECTIONID, spec: MutabilitySpec): boolean {
    if (typeof spec === 'boolean') {
      return spec;
    }
    if ('immutable' in spec) {
      // Object with 'immutable' property means only those are immutable, rest are mutable
      return !spec.immutable.includes(id);
    }
    // Array means only these are mutable
    return spec.includes(id);
  }
}
