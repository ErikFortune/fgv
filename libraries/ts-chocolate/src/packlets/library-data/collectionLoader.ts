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
  captureResult,
  Converter,
  fail,
  Logging,
  mapResults,
  pick,
  Result,
  succeed,
  Validator
} from '@fgv/ts-utils';
import { FileTree, type JsonObject, type JsonValue } from '@fgv/ts-json-base';
import * as yaml from 'js-yaml';
import { CollectionFilter, ICollectionFilterInitParams, IFilterDirectoryParams } from './collectionFilter';
import {
  ICollection,
  ICollectionLoadResult,
  ICollectionSourceFile,
  IEncryptionConfig,
  IProtectedCollectionInternal,
  MutabilitySpec
} from './model';
import * as LibraryConverters from './converters';
import {
  decryptCollectionFile,
  isEncryptedCollectionFile,
  Converters as CryptoConverters,
  IEncryptedCollectionFile
} from '../crypto';

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

  /**
   * Optional logger for reporting loading progress and issues.
   */
  readonly logger?: Logging.LogReporter<unknown>;
}

/**
 * How to handle encrypted files in synchronous loading.
 * - `'fail'`: Fail the entire load operation (original behavior)
 * - `'skip'`: Silently skip encrypted files
 * - `'warn'`: Log warning and skip encrypted files
 * - `'capture'`: Capture encrypted files for later decryption (default)
 * @public
 */
export type EncryptedFileHandling = 'fail' | 'skip' | 'warn' | 'capture';

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
  /**
   * How to handle encrypted files in synchronous loading.
   * - `'fail'`: Fail the entire load operation
   * - `'skip'`: Silently skip encrypted files
   * - `'warn'`: Log warning and skip encrypted files
   * - `'capture'`: Capture encrypted files for later decryption (default)
   *
   * Defaults to `'capture'` so encrypted files are tracked and can be decrypted
   * on-demand when keys become available.
   */
  readonly onEncryptedFile?: EncryptedFileHandling;
  /**
   * Whether collections loaded from this source are built-in library data.
   * Used to mark protected collections appropriately when they are captured.
   * Defaults to `false`.
   */
  readonly isBuiltIn?: boolean;
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
  private readonly _sourceFileConverter: Converter<ICollectionSourceFile<T>>;
  private readonly _logger: Logging.LogReporter<unknown>;

  public constructor(params: ICollectionLoaderInitParams<T, TCOLLECTIONID, TITEMID>) {
    this._collectionIdConverter = params.collectionIdConverter;
    // For file names, first apply file name converter (default: remove common collection extensions), then collection ID converter
    const fileNameConverter =
      params.fileNameConverter ?? LibraryConverters.removeExtension(['.json', '.yaml', '.yml']);
    this._fileNameToCollectionIdConverter = fileNameConverter.mapConvert(this._collectionIdConverter);
    this._itemIdConverter = params.itemIdConverter;
    this._itemConverter = params.itemConverter;
    this._mutableDefault = params.mutable ?? false;
    this._collectionConverter = LibraryConverters.collection({
      itemConverter: this._itemConverter,
      itemIdConverter: this._itemIdConverter,
      collectionIdConverter: this._collectionIdConverter
    });
    this._sourceFileConverter = LibraryConverters.collectionSourceFile(this._itemConverter);
    this._logger = Logging.LogReporter.createDefault(params.logger).orThrow();
  }

  /**
   * Loads collections from a `FileTree` using optional filtering parameters.
   *
   * Encrypted collections are handled according to `onEncryptedFile`:
   * - `'fail'`: Fail the entire load operation
   * - `'skip'`: Silently skip encrypted files
   * - `'warn'`: Log warning and skip
   * - `'capture'`: Capture encrypted files for later decryption (default)
   *
   * Use {@link LibraryData.CollectionLoader.loadFromFileTreeAsync | loadFromFileTreeAsync}
   * to decrypt encrypted files during loading.
   *
   * @param fileTree - The `FileTree` from which to load collections.
   * @param params - optional {@link LibraryData.ILoadCollectionFromFileTreeParams | parameters} to control filtering
   * and recursion.
   * @returns Success with load result containing collections and captured protected collections, or Failure with error.
   */
  public loadFromFileTree(
    fileTree: FileTree.FileTreeItem,
    params?: ILoadCollectionFromFileTreeParams<TCOLLECTIONID>
  ): Result<ICollectionLoadResult<T, TCOLLECTIONID, TITEMID>> {
    params = params ?? {};
    const mutabilitySpec = params.mutable ?? this._mutableDefault;
    const onEncryptedFile = params.onEncryptedFile ?? 'capture';
    /* c8 ignore next 1 - both branches tested but coverage intermittently missed */
    const isBuiltIn = params.isBuiltIn ?? false;
    const filterParams: ICollectionFilterInitParams<TCOLLECTIONID> = {
      ...pick(params, ['included', 'excluded', 'errorOnInvalidName']),
      nameConverter: this._fileNameToCollectionIdConverter
    };
    const dirParams: IFilterDirectoryParams = pick(params, ['recurseWithDelimiter']);
    const filter = new CollectionFilter<TCOLLECTIONID>(filterParams);

    // Track captured protected collections
    const protectedCollections: IProtectedCollectionInternal<TCOLLECTIONID>[] = [];

    return filter.filterDirectory(fileTree, dirParams).onSuccess((filteredItems) => {
      const results = filteredItems.map((item) => {
        const parseContents = (content: string): Result<JsonValue> => {
          const trimmed = content.trim();
          if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            return captureResult(() => JSON.parse(content) as JsonValue).onFailure(() => {
              return captureResult(() => yaml.load(content) as JsonValue).withErrorFormat(
                (e) => `Failed to parse YAML: ${e}`
              );
            });
          }
          return captureResult(() => yaml.load(content) as JsonValue).onFailure(() => {
            return captureResult(() => JSON.parse(content) as JsonValue).withErrorFormat(
              (e) => `Failed to parse JSON: ${e}`
            );
          });
        };

        return item.item
          .getRawContents()
          .onSuccess((raw) => parseContents(raw))
          .onSuccess((json): Result<ICollection<T, TCOLLECTIONID, TITEMID> | undefined> => {
            // Check if this is an encrypted collection file
            if (isEncryptedCollectionFile(json)) {
              if (onEncryptedFile === 'fail') {
                return fail(`Encrypted collection "${item.name}" found - use loadFromFileTreeAsync instead`);
              }
              if (onEncryptedFile === 'warn') {
                this._logger.warn(
                  `[CollectionLoader] Skipping encrypted collection "${item.name}" in sync mode - use loadFromFileTreeAsync`
                );
              }
              if (onEncryptedFile === 'capture') {
                // Capture the encrypted file for later decryption
                const captureResult = this._captureEncryptedFile(
                  json as JsonObject,
                  item.name,
                  mutabilitySpec,
                  isBuiltIn
                );
                if (captureResult.isSuccess()) {
                  protectedCollections.push(captureResult.value);
                  /* c8 ignore next 6 - defensive: capture only fails if isEncryptedCollectionFile passes but convert fails */
                } else {
                  // If capture fails, treat as skip with warning
                  this._logger.warn(
                    `[CollectionLoader] Failed to capture encrypted collection "${item.name}": ${captureResult.message}`
                  );
                }
              }
              // Skip this file (return undefined to filter out)
              return succeed(undefined);
            }
            // Parse as source file format { metadata?, items }
            return this._sourceFileConverter.convert(json).onSuccess((sourceFile) => {
              return this._collectionConverter.convert({
                id: item.name,
                isMutable: this._isMutable(item.name, mutabilitySpec),
                items: sourceFile.items,
                metadata: sourceFile.metadata
              });
            });
          });
      });
      return mapResults(results).onSuccess((collections) =>
        succeed({
          collections: collections.filter(
            (c): c is ICollection<T, TCOLLECTIONID, TITEMID> => c !== undefined
          ),
          protectedCollections
        })
      );
    });
  }

  /**
   * Loads collections from a `FileTree` asynchronously, supporting encrypted files.
   *
   * When encryption config is provided, attempts to decrypt encrypted files.
   * Files that cannot be decrypted (missing key with skip/warn/capture mode) are
   * captured in the result's `protectedCollections` for later decryption.
   *
   * @param fileTree - The `FileTree` from which to load collections.
   * @param params - optional {@link LibraryData.ILoadCollectionFromFileTreeParams | parameters} to control filtering
   * and recursion.
   * @returns Promise resolving to Success with load result, or Failure with error.
   */
  public async loadFromFileTreeAsync(
    fileTree: FileTree.FileTreeItem,
    params?: ILoadCollectionFromFileTreeParams<TCOLLECTIONID>
  ): Promise<Result<ICollectionLoadResult<T, TCOLLECTIONID, TITEMID>>> {
    params = params ?? {};
    const mutabilitySpec = params.mutable ?? this._mutableDefault;
    const encryption = params.encryption;
    const onEncryptedFile = params.onEncryptedFile ?? 'capture';
    const isBuiltIn = params.isBuiltIn ?? false;
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
    const protectedCollections: IProtectedCollectionInternal<TCOLLECTIONID>[] = [];

    for (const item of filteredItems) {
      const rawResult = item.item.getRawContents();
      if (rawResult.isFailure()) {
        return fail(rawResult.message);
      }

      const content = rawResult.value;

      const parseContents = (c: string): Result<JsonValue> => {
        const trimmed = c.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          return captureResult(() => JSON.parse(c) as JsonValue).onFailure(() => {
            return captureResult(() => yaml.load(c) as JsonValue).withErrorFormat(
              (e) => `Failed to parse YAML: ${e}`
            );
          });
        }
        return captureResult(() => yaml.load(c) as JsonValue).onFailure(() => {
          return captureResult(() => JSON.parse(c) as JsonValue).withErrorFormat(
            (e) => `Failed to parse JSON: ${e}`
          );
        });
      };

      const contentsResult = parseContents(content);
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
          encryption,
          onEncryptedFile,
          protectedCollections,
          isBuiltIn
        );
        if (encryptedResult === undefined) {
          // Skipped or captured due to missing key
          continue;
        }
        if (encryptedResult.isFailure()) {
          return fail(encryptedResult.message);
        }
        results.push(encryptedResult);
      } else {
        // Plain JSON - parse as source file format { metadata?, items }
        const sourceFileResult = this._sourceFileConverter.convert(json);
        if (sourceFileResult.isFailure()) {
          return fail(`Collection "${item.name}": ${sourceFileResult.message}`);
        }
        const sourceFile = sourceFileResult.value;
        const collectionResult = this._collectionConverter.convert({
          id: item.name,
          isMutable: this._isMutable(item.name, mutabilitySpec),
          items: sourceFile.items,
          metadata: sourceFile.metadata
        });
        results.push(collectionResult);
      }
    }

    return mapResults(results).onSuccess((collections) =>
      succeed({
        collections,
        protectedCollections
      })
    );
  }

  /**
   * Processes an encrypted collection file asynchronously.
   * @returns undefined if the file should be skipped/captured, Result otherwise.
   */
  private async _processEncryptedFileAsync(
    json: JsonObject,
    collectionName: TCOLLECTIONID,
    mutabilitySpec: MutabilitySpec,
    encryption: IEncryptionConfig | undefined,
    onEncryptedFile: EncryptedFileHandling,
    protectedCollections: IProtectedCollectionInternal<TCOLLECTIONID>[],
    isBuiltIn: boolean
  ): Promise<Result<ICollection<T, TCOLLECTIONID, TITEMID>> | undefined> {
    // Validate the encrypted file structure first (needed for both decrypt and capture)
    const tombstoneResult = CryptoConverters.encryptedCollectionFile.convert(json);
    if (tombstoneResult.isFailure()) {
      return this._handleEncryptionError(
        `Invalid encrypted collection format for "${collectionName}": ${tombstoneResult.message}`,
        /* c8 ignore next - optional encryption config tested implicitly */
        encryption?.onDecryptionError
      );
    }

    const encryptedFile = tombstoneResult.value;

    // If no encryption config, capture or skip based on mode
    if (!encryption) {
      return this._handleMissingKey(
        collectionName,
        mutabilitySpec,
        encryptedFile,
        onEncryptedFile,
        protectedCollections,
        `Encrypted collection "${collectionName}" found but no encryption config provided`,
        isBuiltIn
      );
    }

    // Look up the key for this secret
    const keyResult = await this._findKey(encryptedFile.secretName, encryption);
    if (keyResult.isFailure()) {
      return this._handleMissingKey(
        collectionName,
        mutabilitySpec,
        encryptedFile,
        onEncryptedFile,
        protectedCollections,
        `Missing key for secret "${encryptedFile.secretName}" in collection "${collectionName}"`,
        isBuiltIn
      );
    }

    // Decrypt the collection
    const decryptResult = await decryptCollectionFile(
      encryptedFile,
      keyResult.value,
      encryption.cryptoProvider
    );
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
      items: decryptResult.value,
      metadata: {
        secretName: encryptedFile.secretName,
        /* c8 ignore next 1 - defense in depth */
        ...(encryptedFile.metadata?.description ? { description: encryptedFile.metadata.description } : {})
      }
    });
  }

  /**
   * Handles missing key errors - either captures for later or skips/fails.
   */
  private _handleMissingKey(
    collectionName: TCOLLECTIONID,
    mutabilitySpec: MutabilitySpec,
    encryptedFile: IEncryptedCollectionFile,
    onEncryptedFile: EncryptedFileHandling,
    protectedCollections: IProtectedCollectionInternal<TCOLLECTIONID>[],
    message: string,
    isBuiltIn: boolean
  ): Result<ICollection<T, TCOLLECTIONID, TITEMID>> | undefined {
    if (onEncryptedFile === 'capture') {
      // Capture for later decryption
      protectedCollections.push({
        ref: {
          collectionId: collectionName,
          secretName: encryptedFile.secretName,
          /* c8 ignore next 2 - optional metadata fields tested implicitly */
          description: encryptedFile.metadata?.description,
          itemCount: encryptedFile.metadata?.itemCount,
          isMutable: this._isMutable(collectionName, mutabilitySpec),
          isBuiltIn
        },
        encryptedFile
      });
      return undefined;
    }

    if (onEncryptedFile === 'warn') {
      this._logger.warn(`[CollectionLoader] ${message}`);
      return undefined;
    }

    if (onEncryptedFile === 'skip') {
      return undefined;
    }

    // 'fail' mode
    return fail(message);
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
        this._logger.warn(`[CollectionLoader] ${message}`);
        return undefined;
      case 'fail':
      default:
        return fail(message);
    }
  }

  /**
   * Captures an encrypted collection file for later decryption.
   * @param json - The JSON content of the encrypted file.
   * @param collectionName - The collection name (from filename).
   * @param mutabilitySpec - The mutability specification.
   * @param isBuiltIn - Whether this collection is from built-in library data.
   * @returns Success with protected collection internal data, or Failure if the file is invalid.
   */
  private _captureEncryptedFile(
    json: JsonObject,
    collectionName: TCOLLECTIONID,
    mutabilitySpec: MutabilitySpec,
    isBuiltIn: boolean
  ): Result<IProtectedCollectionInternal<TCOLLECTIONID>> {
    // Validate the encrypted file structure
    return CryptoConverters.encryptedCollectionFile.convert(json).onSuccess((encryptedFile) => {
      return succeed({
        ref: {
          collectionId: collectionName,
          secretName: encryptedFile.secretName,
          /* c8 ignore next 2 - optional metadata fields tested implicitly */
          description: encryptedFile.metadata?.description,
          itemCount: encryptedFile.metadata?.itemCount,
          isMutable: this._isMutable(collectionName, mutabilitySpec),
          isBuiltIn
        },
        encryptedFile
      });
    });
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
