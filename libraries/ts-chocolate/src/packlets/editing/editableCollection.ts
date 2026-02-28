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
  Collections,
  Converter,
  DetailedFailure,
  DetailedResult,
  Failure,
  Result,
  Success,
  ValidatingResultMap,
  fail,
  omit,
  succeed
} from '@fgv/ts-utils';
import { FileTree, JsonValue, sanitizeJsonObject } from '@fgv/ts-json-base';
import { CryptoUtils } from '@fgv/ts-extras';
import { CollectionId, Helpers as CommonHelpers } from '../common';
import {
  ICollectionSourceFile,
  ICollectionFileMetadata,
  ICollectionRuntimeMetadata,
  IEncryptedCollectionMetadata,
  SubLibraryBase,
  Converters as LibraryDataConverters
} from '../library-data';
import { IExportOptions } from './model';

// ============================================================================
// Parameters for Creating Editable Collections
// ============================================================================

/**
 * Parameters for creating an editable collection.
 * @typeParam T - Entity type
 * @typeParam TBaseId - Base ID type (e.g., BaseIngredientId)
 * @public
 */
export interface IEditableCollectionParams<T, TBaseId extends string = string> {
  /**
   * Collection identifier.
   */
  readonly collectionId: CollectionId;

  /**
   * Collection metadata (name, description, etc.).
   * Accepts ICollectionFileMetadata or ICollectionRuntimeMetadata; sourceName is stripped and not stored.
   */
  readonly metadata: ICollectionFileMetadata;

  /**
   * Whether this collection is mutable.
   * If false, all mutation operations will fail.
   */
  readonly isMutable: boolean;

  /**
   * Initial items in the collection.
   * Map of base ID to entity.
   */
  readonly initialItems: ReadonlyMap<TBaseId, T>;

  /**
   * Converter for validating base ID keys.
   */
  readonly keyConverter: Converter<TBaseId, unknown>;

  /**
   * Converter for validating values.
   */
  readonly valueConverter: Converter<T, unknown>;

  /**
   * Optional reference to the source FileTree item for persistence.
   * When present, enables direct save() functionality.
   * Collections loaded from FileTree will have this populated.
   */
  readonly sourceItem?: FileTree.FileTreeItem;

  /**
   * Optional encryption provider for encrypted save support.
   * When present and the collection's metadata includes a `secretName`,
   * {@link EditableCollection.save} will encrypt the collection before writing.
   *
   * Accepts any {@link CryptoUtils.IEncryptionProvider}: a `KeyStore`,
   * a `DirectEncryptionProvider`, or a custom implementation.
   */
  readonly encryptionProvider?: CryptoUtils.IEncryptionProvider;
}

// ============================================================================
// Save Options
// ============================================================================

/**
 * Options for {@link EditableCollection.save}.
 * @public
 */
export interface ICollectionSaveOptions {
  /**
   * Optional encryption provider override for this save operation.
   * If provided, takes precedence over the constructor-supplied provider.
   */
  readonly encryptionProvider?: CryptoUtils.IEncryptionProvider;
}

// ============================================================================
// Editable Collection Implementation
// ============================================================================

/**
 * An extension of ValidatingResultMap that adds collection metadata,
 * mutability control, and export functionality for entity editing workflows.
 *
 * Inherits all ValidatingResultMap functionality but gates mutation
 * operations behind an isMutable check.
 *
 * @typeParam T - Entity type
 * @typeParam TBaseId - Base ID type (e.g., BaseIngredientId)
 * @typeParam TId - Composite ID type (e.g., IngredientId)
 * @public
 */
export class EditableCollection<T, TBaseId extends string = string> extends ValidatingResultMap<TBaseId, T> {
  /**
   * Collection identifier.
   */
  public readonly collectionId: CollectionId;

  /**
   * Whether collection is mutable.
   */
  public readonly isMutable: boolean;

  /**
   * Optional reference to the source FileTree item for persistence.
   */
  public readonly sourceItem?: FileTree.FileTreeItem;

  private _metadata: ICollectionFileMetadata;

  /**
   * Optional encryption provider for encrypted save.
   * @internal
   */
  protected _encryptionProvider?: CryptoUtils.IEncryptionProvider;

  /**
   * Create an editable collection.
   * Use the static `createEditable` method for proper initialization.
   */
  private constructor(
    collectionId: CollectionId,
    isMutable: boolean,
    metadata: ICollectionFileMetadata,
    params: Collections.IValidatingResultMapConstructorParams<TBaseId, T>,
    sourceItem?: FileTree.FileTreeItem,
    encryptionProvider?: CryptoUtils.IEncryptionProvider
  ) {
    super(params);
    this.collectionId = collectionId;
    this.isMutable = isMutable;
    this._metadata = { ...metadata };
    this.sourceItem = sourceItem;
    this._encryptionProvider = encryptionProvider;
  }

  /**
   * Create a new editable collection.
   * @param params - Creation parameters
   * @returns Result containing the editable collection or failure
   */
  public static createEditable<T, TBaseId extends string = string>(
    params: IEditableCollectionParams<T, TBaseId>
  ): Result<EditableCollection<T, TBaseId>> {
    if (!params.collectionId) {
      return Failure.with('Collection ID is required');
    }

    // Create key-value converters
    const converters = new Collections.KeyValueConverters<TBaseId, T>({
      key: params.keyConverter,
      value: params.valueConverter
    });

    // Convert initial items to entries
    const entries = Array.from(params.initialItems.entries());

    return Success.with(
      new EditableCollection<T, TBaseId>(
        params.collectionId,
        params.isMutable,
        params.metadata,
        {
          entries,
          converters
        },
        params.sourceItem,
        params.encryptionProvider
      )
    );
  }

  /**
   * Validate collection structure.
   * @param data - Collection data to validate
   * @returns Result of true if valid, or failure with error message
   * @public
   */
  public static validateStructure(data: unknown): Result<true> {
    if (typeof data !== 'object' || data === null) {
      return fail('Collection data must be an object');
    }

    const obj = data as Record<string, unknown>;

    if (!('items' in obj)) {
      return fail('Collection data must have an "items" field');
    }

    if (typeof obj.items !== 'object' || obj.items === null) {
      return fail('Collection "items" field must be an object');
    }

    if ('metadata' in obj) {
      if (typeof obj.metadata !== 'object' || obj.metadata === null) {
        return fail('Collection "metadata" field must be an object if present');
      }
    }

    return succeed(true);
  }

  /**
   * Parse a YAML string and create an editable collection.
   * @param content - YAML string content
   * @param params - Collection creation parameters (without initialItems)
   * @returns Result containing EditableCollection or failure
   * @public
   */
  public static fromYaml<T, TBaseId extends string = string>(
    content: string,
    params: Omit<IEditableCollectionParams<T, TBaseId>, 'initialItems'>
  ): Result<EditableCollection<T, TBaseId>> {
    const converter = LibraryDataConverters.collectionYamlConverter(params.valueConverter);
    return converter.convert(content).onSuccess((sourceFile) => {
      const itemsMap = new Map<TBaseId, T>();
      for (const [key, value] of Object.entries(sourceFile.items)) {
        const keyResult = params.keyConverter.convert(key);
        if (keyResult.isFailure()) {
          return Failure.with(`Invalid key "${key}": ${keyResult.message}`);
        }
        itemsMap.set(keyResult.value, value);
      }

      return EditableCollection.createEditable({
        ...params,
        metadata: { ...params.metadata, ...sourceFile.metadata },
        initialItems: itemsMap
      });
    });
  }

  /**
   * Parse a JSON string and create an editable collection.
   * @param content - JSON string content
   * @param params - Collection creation parameters (without initialItems)
   * @returns Result containing EditableCollection or failure
   * @public
   */
  public static fromJson<T, TBaseId extends string = string>(
    content: string,
    params: Omit<IEditableCollectionParams<T, TBaseId>, 'initialItems'>
  ): Result<EditableCollection<T, TBaseId>> {
    const converter = LibraryDataConverters.collectionJsonConverter(params.valueConverter);
    return converter.convert(content).onSuccess((sourceFile) => {
      const itemsMap = new Map<TBaseId, T>();
      for (const [key, value] of Object.entries(sourceFile.items)) {
        const keyResult = params.keyConverter.convert(key);
        if (keyResult.isFailure()) {
          return Failure.with(`Invalid key "${key}": ${keyResult.message}`);
        }
        itemsMap.set(keyResult.value, value);
      }

      return EditableCollection.createEditable({
        ...params,
        metadata: { ...params.metadata, ...sourceFile.metadata },
        initialItems: itemsMap
      });
    });
  }

  /**
   * Parse content (auto-detecting format) and create an editable collection.
   * Tries JSON first if content looks like JSON, otherwise tries YAML with JSON fallback.
   * @param content - String content to parse (YAML or JSON)
   * @param params - Collection creation parameters (without initialItems)
   * @returns Result containing EditableCollection or failure
   * @public
   */
  public static parse<T, TBaseId extends string = string>(
    content: string,
    params: Omit<IEditableCollectionParams<T, TBaseId>, 'initialItems'>
  ): Result<EditableCollection<T, TBaseId>> {
    if (!content || content.trim().length === 0) {
      return fail('Content is empty');
    }

    const trimmed = content.trim();
    const converter =
      trimmed.startsWith('{') || trimmed.startsWith('[')
        ? LibraryDataConverters.collectionJsonConverter(params.valueConverter)
        : LibraryDataConverters.collectionYamlConverter(params.valueConverter);

    return converter
      .convert(content)
      .onFailure(() => {
        /* c8 ignore next 5 - coverage intermittently missed in full suite; tested by editableCollection.test.ts fallback tests */
        const fallbackConverter =
          trimmed.startsWith('{') || trimmed.startsWith('[')
            ? LibraryDataConverters.collectionYamlConverter(params.valueConverter)
            : LibraryDataConverters.collectionJsonConverter(params.valueConverter);
        return fallbackConverter.convert(content);
      })
      .onSuccess((sourceFile) => {
        const itemsMap = new Map<TBaseId, T>();
        for (const [key, value] of Object.entries(sourceFile.items)) {
          const keyResult = params.keyConverter.convert(key);
          if (keyResult.isFailure()) {
            return Failure.with(`Invalid key "${key}": ${keyResult.message}`);
          }
          itemsMap.set(keyResult.value, value);
        }

        return EditableCollection.createEditable({
          ...params,
          metadata: { ...params.metadata, ...sourceFile.metadata },
          initialItems: itemsMap
        });
      });
  }

  /**
   * Create an editable collection from a SubLibrary collection with persistence enabled.
   *
   * This convenience method automatically retrieves the sourceItem from the library
   * to enable direct save() functionality.
   *
   * @param library - The SubLibrary containing the collection
   * @param collectionId - ID of the collection to make editable
   * @param keyConverter - Converter for validating item keys
   * @param valueConverter - Converter for validating item values
   * @param encryptionProvider - Optional encryption provider for encrypted save support
   * @returns Result containing EditableCollection with persistence, or Failure
   * @public
   */
  public static fromLibrary<T, TBaseId extends string, TItem>(
    library: SubLibraryBase<string, TBaseId, TItem>,
    collectionId: CollectionId,
    keyConverter: Converter<TBaseId, unknown>,
    valueConverter: Converter<T, unknown>,
    encryptionProvider?: CryptoUtils.IEncryptionProvider
  ): Result<EditableCollection<T, TBaseId>> {
    // Get the collection from the library
    const collectionResult = library.collections.get(collectionId).asResult;
    if (collectionResult.isFailure()) {
      return Failure.with(`Collection "${collectionId}" not found`);
    }

    const collection = collectionResult.value;

    // Get the sourceItem for persistence
    const sourceItem = library.getCollectionSourceItem(collectionId);

    // Convert ValidatingResultMap to plain Map
    const itemsMap = new Map<TBaseId, T>();
    for (const [key, value] of collection.items.entries()) {
      itemsMap.set(key, value as unknown as T);
    }

    // Create editable collection with sourceItem for persistence
    // Strip sourceName (load-time concern) from metadata for editable context
    const fileMetadata = omit(collection.metadata ?? ({} as ICollectionRuntimeMetadata), ['sourceName']);
    return EditableCollection.createEditable({
      collectionId,
      metadata: fileMetadata,
      isMutable: collection.isMutable,
      initialItems: itemsMap,
      keyConverter,
      valueConverter,
      sourceItem,
      encryptionProvider
    });
  }

  // ==========================================================================
  // Metadata and Export (new functionality)
  // ==========================================================================

  /**
   * Collection metadata.
   */
  public get metadata(): ICollectionFileMetadata {
    return { ...this._metadata };
  }

  /**
   * Update collection metadata.
   * @param metadata - Partial metadata to update
   * @returns Result indicating success or failure
   */
  public updateMetadata(metadata: Partial<ICollectionFileMetadata>): Result<void> {
    if (!this.isMutable) {
      return Failure.with(`Collection "${this.collectionId}" is immutable and cannot be modified`);
    }

    this._metadata = {
      ...this._metadata,
      ...metadata
    };
    return Success.with(undefined);
  }

  /**
   * Export collection to ICollectionSourceFile format.
   * @returns Result containing collection source file or failure
   */
  public export(): Result<ICollectionSourceFile<T>> {
    // Convert Map to Record for export
    const itemsRecord: Record<TBaseId, T> = {} as Record<TBaseId, T>;
    for (const [baseId, item] of this.entries()) {
      itemsRecord[baseId] = item;
    }

    const sourceFile: ICollectionSourceFile<T> = {
      metadata: this.metadata,
      items: itemsRecord
    };

    return Success.with(sourceFile);
  }

  /**
   * Serialize collection to YAML string.
   * @param options - Optional export options
   * @returns Result containing YAML string or failure
   */
  public serializeToYaml(options?: IExportOptions): Result<string> {
    return this.export().onSuccess((sourceFile) => CommonHelpers.serializeToYaml(sourceFile, options));
  }

  /**
   * Serialize collection to JSON string.
   * @param options - Optional export options
   * @returns Result containing JSON string or failure
   */
  public serializeToJson(options?: IExportOptions): Result<string> {
    return this.export().onSuccess((sourceFile) => CommonHelpers.serializeToJson(sourceFile, options));
  }

  /**
   * Serialize collection to string based on format.
   * @param format - Export format ('yaml' or 'json')
   * @param options - Optional export options
   * @returns Result containing serialized string or failure
   */
  public serialize(format: 'yaml' | 'json', options?: IExportOptions): Result<string> {
    if (format === 'yaml') {
      return this.serializeToYaml(options);
    }
    return this.serializeToJson(options);
  }

  // ==========================================================================
  // Persistence Methods (Phase 2)
  // ==========================================================================

  /**
   * Check if this collection can be saved to its source file.
   * Returns true if the collection has a sourceItem and the FileTree supports persistence.
   * @returns True if the collection can be saved, false otherwise
   */
  public canSave(): boolean {
    if (!this.sourceItem || !('getIsMutable' in this.sourceItem)) {
      return false;
    }
    const result = this.sourceItem.getIsMutable();
    return result.isSuccess() && result.value === true;
  }

  /**
   * Check if the source file has unsaved changes.
   * Only applicable if the collection has a persistent FileTree source.
   * Note: This method is not currently implementable without access to the FileTree instance.
   * Returns false for now - dirty tracking should be done at a higher level.
   * @returns False (dirty tracking not available at collection level)
   */
  public isDirty(): boolean {
    // TODO: Implement dirty tracking when FileTree reference is available
    // For now, dirty tracking should be managed at the FileTree level
    return false;
  }

  /**
   * Save the collection to its source file using FileTree persistence.
   * Requires a sourceItem with a mutable FileTree.
   *
   * When the collection's metadata includes a `secretName` and a KeyStore
   * is available (via constructor or options), the collection is encrypted
   * before writing. Otherwise it is saved as plain YAML.
   *
   * @param options - Optional save options (e.g. KeyStore override)
   * @returns Result with `true` on success, or Failure with error context
   */
  public async save(options?: ICollectionSaveOptions): Promise<Result<true>> {
    // Check if collection is mutable
    if (!this.isMutable) {
      return Failure.with(`Collection "${this.collectionId}" is immutable and cannot be saved`);
    }

    // Check if we have a source item
    if (!this.sourceItem) {
      return Failure.with(
        `Collection "${this.collectionId}" has no source file - use export() to serialize manually`
      );
    }

    // Check if source item is a file (has getIsMutable method)
    if (!('getIsMutable' in this.sourceItem)) {
      return Failure.with(`Source item for collection "${this.collectionId}" is not a file`);
    }

    // Check if the file is mutable
    const isMutableResult = this.sourceItem.getIsMutable();
    if (isMutableResult.isFailure() || !isMutableResult.value) {
      return Failure.with(
        `Source file for collection "${this.collectionId}" is not mutable: ${
          isMutableResult.isFailure() ? isMutableResult.message : 'file is immutable'
        }`
      );
    }

    const fileItem = this.sourceItem as FileTree.IFileTreeFileItem;
    const provider = options?.encryptionProvider ?? this._encryptionProvider;
    const secretName = this._metadata.secretName;

    // Encrypted save path
    if (secretName && provider) {
      return this._saveEncrypted(fileItem, provider, secretName);
    }

    // Plain YAML save
    return this.serializeToYaml().onSuccess((yaml) => {
      return fileItem.setRawContents(yaml).onSuccess(() => succeed(true as const));
    });
  }

  // ==========================================================================
  // Private: Encrypted Save
  // ==========================================================================

  /**
   * Encrypts the collection and writes it to the file item.
   * @internal
   */
  private async _saveEncrypted(
    fileItem: FileTree.IFileTreeFileItem,
    provider: CryptoUtils.IEncryptionProvider,
    secretName: string
  ): Promise<Result<true>> {
    const metadata: IEncryptedCollectionMetadata = {
      collectionId: this.collectionId,
      itemCount: this.size
    };

    const contentResult = this.export()
      .withErrorFormat((msg) => `${this.collectionId}: export: ${msg}`)
      .onSuccess((exported) =>
        sanitizeJsonObject(exported.items).withErrorFormat(
          (msg) => `${this.collectionId}: serialize items: ${msg}`
        )
      );
    /* c8 ignore next 3 - defensive: export and sanitize of valid collection should not fail */
    if (contentResult.isFailure()) {
      return fail(contentResult.message);
    }

    const encryptedResult = await provider.encryptByName(
      secretName,
      contentResult.value as unknown as JsonValue,
      metadata
    );
    if (encryptedResult.isFailure()) {
      return fail(`${this.collectionId}: encrypt: ${encryptedResult.message}`);
    }

    const jsonContent = JSON.stringify(encryptedResult.value, null, 2);
    return fileItem
      .setRawContents(jsonContent)
      .withErrorFormat((msg) => `${this.collectionId}: write encrypted: ${msg}`)
      .onSuccess(() => succeed(true as const));
  }

  // ==========================================================================
  // Override mutation methods to check isMutable
  // ==========================================================================

  /**
   * Helper to verify mutability before performing operation.
   * @param op - Operation to perform if mutable
   * @returns
   */
  private _applyIfMutable<T>(
    op: () => DetailedResult<T, Collections.ResultMapResultDetail>
  ): DetailedResult<T, Collections.ResultMapResultDetail> {
    if (!this.isMutable) {
      return DetailedFailure.with<T, Collections.ResultMapResultDetail>(
        `Collection "${this.collectionId}" is immutable and cannot be modified`
      );
    }
    return op();
  }

  /**
   * Add or update item in collection.
   * Fails if collection is immutable.
   */
  public override set(key: TBaseId, value: T): DetailedResult<T, Collections.ResultMapResultDetail> {
    return this._applyIfMutable(() => super.set(key, value));
  }

  /**
   * Add item only if key doesn't exist.
   * Fails if collection is immutable.
   */
  public override add(key: TBaseId, value: T): DetailedResult<T, Collections.ResultMapResultDetail> {
    return this._applyIfMutable(() => super.add(key, value));
  }

  /**
   * Update item only if key exists.
   * Fails if collection is immutable.
   */
  public override update(key: TBaseId, value: T): DetailedResult<T, Collections.ResultMapResultDetail> {
    return this._applyIfMutable(() => super.update(key, value));
  }

  /**
   * Delete item from collection.
   * Fails if collection is immutable.
   */
  public override delete(key: TBaseId): DetailedResult<T, Collections.ResultMapResultDetail> {
    return this._applyIfMutable(() => super.delete(key));
  }

  /**
   * Clear all items from collection.
   * Fails if collection is immutable.
   */
  public override clear(): Result<boolean> {
    return this._applyIfMutable(() => {
      super.clear();
      return Success.with(true).withDetail('success');
    });
  }
}
