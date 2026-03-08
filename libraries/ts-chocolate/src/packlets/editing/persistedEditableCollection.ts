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

/**
 * Persistent wrapper around {@link EditableCollection} that owns the full
 * save pipeline: snapshot from SubLibrary → FileTree write → disk sync.
 *
 * Provides singleton identity per collection so all callers share the same
 * instance, and supports both explicit `save()` and auto-persist-on-mutate
 * modes.
 *
 * @packageDocumentation
 */

import {
  Collections,
  Converter,
  DetailedFailure,
  DetailedResult,
  Result,
  fail,
  succeed
} from '@fgv/ts-utils';
import { CryptoUtils } from '@fgv/ts-extras';

import { CollectionId } from '../common';
import { SubLibraryBase } from '../library-data';
import { EditableCollection } from './editableCollection';
import { type ICollectionOperations } from './model';

// ============================================================================
// Sync Provider Interface
// ============================================================================

/**
 * Provider for flushing in-memory FileTree changes to the filesystem.
 *
 * In the web app, this wraps `reactiveWorkspace.syncAllToDisk()`.
 * In the CLI or tests, this can be a no-op or custom implementation.
 *
 * @public
 */
export interface ISyncProvider {
  /**
   * Flush all dirty FileTree changes to the filesystem.
   * @returns `Success<true>` if sync succeeded, `Failure` with error context otherwise
   */
  syncToDisk(): Promise<Result<true>>;
}

// ============================================================================
// Parameters
// ============================================================================

/**
 * Parameters for creating a {@link PersistedEditableCollection}.
 *
 * @typeParam T - Entity type
 * @typeParam TBaseId - Base ID type (e.g., BaseIngredientId)
 * @public
 */
export interface IPersistedEditableCollectionParams<T, TBaseId extends string> {
  /**
   * The sub-library containing the collection data.
   * Used to snapshot current state on save.
   */
  readonly subLibrary: SubLibraryBase<string, TBaseId, T>;

  /**
   * Collection identifier.
   */
  readonly collectionId: CollectionId;

  /**
   * Converter for validating base ID keys.
   */
  readonly keyConverter: Converter<TBaseId, unknown>;

  /**
   * Converter for validating entity values.
   */
  readonly valueConverter: Converter<T, unknown>;

  /**
   * Optional sync provider for flushing FileTree changes to disk.
   * When absent, {@link PersistedEditableCollection.save | save()} writes to the
   * FileTree but does not sync to the filesystem.
   */
  readonly syncProvider?: ISyncProvider;

  /**
   * Optional encryption provider (or lazy getter) for encrypted collections.
   * Use a getter function when the provider is not available at construction
   * time (e.g. a KeyStore that is unlocked after app startup).
   */
  readonly encryptionProvider?:
    | CryptoUtils.IEncryptionProvider
    | (() => CryptoUtils.IEncryptionProvider | undefined);

  /**
   * When `true`, mutation methods ({@link PersistedEditableCollection.set | set()},
   * {@link PersistedEditableCollection.delete | delete()}) automatically trigger
   * {@link PersistedEditableCollection.save | save()} after each mutation.
   *
   * @defaultValue `false`
   */
  readonly autoPersist?: boolean;

  /**
   * Optional custom collection operations delegate.
   *
   * When provided, the {@link PersistedEditableCollection.addItem | addItem()},
   * {@link PersistedEditableCollection.upsertItem | upsertItem()}, and
   * {@link PersistedEditableCollection.removeItem | removeItem()} methods
   * delegate to these operations instead of the default from
   * `SubLibraryBase.getCollectionOperations()`.
   *
   * Use this to inject domain-specific behavior (e.g., branded composite ID
   * construction, field-based validation) without subclassing.
   */
  readonly operations?: ICollectionOperations<T, TBaseId>;
}

// ============================================================================
// PersistedEditableCollection
// ============================================================================

/**
 * Persistent wrapper around {@link EditableCollection} that owns the full
 * save pipeline.
 *
 * Key behaviors:
 * - **Lazy snapshot**: The underlying `EditableCollection` is created on first
 *   access via `EditableCollection.fromLibrary()`, not at construction.
 * - **Singleton identity**: Created and cached by `ChocolateEntityLibrary`,
 *   so all callers of a given collection share the same wrapper instance.
 * - **`save()` always re-snapshots**: Forces a fresh snapshot from the SubLibrary
 *   before serializing. This guarantees persistence reflects the current
 *   SubLibrary state regardless of how mutations happened.
 * - **Full pipeline**: `save()` handles FileTree write + optional disk sync.
 * - **Auto-persist mode**: When enabled, `set()` and `delete()` automatically
 *   trigger `save()` after each mutation.
 *
 * @typeParam T - Entity type
 * @typeParam TBaseId - Base ID type (e.g., BaseIngredientId)
 * @public
 */
export class PersistedEditableCollection<T, TBaseId extends string> {
  private _editable: EditableCollection<T, TBaseId> | undefined;

  private readonly _subLibrary: SubLibraryBase<string, TBaseId, T>;
  private readonly _collectionId: CollectionId;
  private readonly _keyConverter: Converter<TBaseId, unknown>;
  private readonly _valueConverter: Converter<T, unknown>;
  private readonly _syncProvider: ISyncProvider | undefined;
  private readonly _encryptionProvider:
    | CryptoUtils.IEncryptionProvider
    | (() => CryptoUtils.IEncryptionProvider | undefined)
    | undefined;
  private readonly _autoPersist: boolean;
  private readonly _customOperations: ICollectionOperations<T, TBaseId> | undefined;
  private _defaultOperations: ICollectionOperations<T, TBaseId> | undefined;

  /**
   * Creates a new persisted editable collection wrapper.
   * @param params - Configuration parameters
   */
  public constructor(params: IPersistedEditableCollectionParams<T, TBaseId>) {
    this._subLibrary = params.subLibrary;
    this._collectionId = params.collectionId;
    this._keyConverter = params.keyConverter;
    this._valueConverter = params.valueConverter;
    this._syncProvider = params.syncProvider;
    this._encryptionProvider = params.encryptionProvider;
    this._autoPersist = params.autoPersist ?? false;
    this._customOperations = params.operations;
  }

  /**
   * The collection identifier.
   */
  public get collectionId(): CollectionId {
    return this._collectionId;
  }

  /**
   * The underlying sub-library containing the collection data.
   * Exposed for identity-based disambiguation in `saveCollection()`.
   */
  public get subLibrary(): SubLibraryBase<string, TBaseId, T> {
    return this._subLibrary;
  }

  /**
   * Access the underlying {@link EditableCollection}, lazily creating it
   * from the SubLibrary if not yet initialized.
   *
   * @returns `Success` with the editable collection, or `Failure` if the
   *   collection cannot be found or created.
   */
  public getEditable(): Result<EditableCollection<T, TBaseId>> {
    if (this._editable === undefined) {
      const encryptionProvider =
        typeof this._encryptionProvider === 'function'
          ? this._encryptionProvider()
          : this._encryptionProvider;
      const result = EditableCollection.fromLibrary(
        this._subLibrary,
        this._collectionId,
        this._keyConverter,
        this._valueConverter,
        encryptionProvider
      );
      if (result.isFailure()) {
        return result;
      }
      this._editable = result.value;
    }
    return succeed(this._editable);
  }

  /**
   * Clear the cached {@link EditableCollection}, forcing a fresh snapshot
   * from the SubLibrary on the next access.
   *
   * Call this after external mutations to the SubLibrary (e.g., via
   * {@link CollectionManager}) to ensure the next `save()` reflects
   * the current state.
   */
  public invalidate(): void {
    this._editable = undefined;
  }

  /**
   * Check whether this collection supports persistence.
   *
   * Returns `true` if the underlying collection has a mutable FileTree
   * source item. Returns `false` for built-in (immutable) collections
   * or if the editable cannot be created.
   */
  public canSave(): boolean {
    const editableResult = this.getEditable();
    if (editableResult.isFailure()) {
      return false;
    }
    return editableResult.value.canSave();
  }

  // ==========================================================================
  // Domain-Aware Mutations (delegate to SubLibrary + auto-persist)
  // ==========================================================================

  /**
   * The collection operations delegate.
   *
   * Returns the custom operations if provided at construction, otherwise
   * lazily creates the default from `SubLibraryBase.getCollectionOperations()`.
   */
  public get operations(): ICollectionOperations<T, TBaseId> {
    if (this._customOperations) {
      return this._customOperations;
    }
    if (!this._defaultOperations) {
      this._defaultOperations = this._subLibrary.getCollectionOperations(
        this._collectionId
      ) as ICollectionOperations<T, TBaseId>;
    }
    return this._defaultOperations;
  }

  /**
   * Add a new entity and persist.
   *
   * Delegates to the {@link ICollectionOperations.add | operations delegate} to
   * perform the domain-aware mutation on the SubLibrary, then runs the full
   * {@link PersistedEditableCollection.save | save()} pipeline.
   *
   * @param baseId - Base entity ID within the collection
   * @param entity - The entity to add
   * @returns Success with the composite ID string, or Failure
   */
  public async addItem(baseId: TBaseId, entity: T): Promise<Result<string>> {
    const result = this.operations.add(baseId, entity);
    if (result.isFailure()) {
      return result;
    }
    const saveResult = await this.save();
    if (saveResult.isFailure()) {
      return fail(`${this._collectionId}: add succeeded but persist failed: ${saveResult.message}`);
    }
    return result;
  }

  /**
   * Add or update an entity and persist.
   *
   * Delegates to the {@link ICollectionOperations.upsert | operations delegate} to
   * perform the domain-aware mutation on the SubLibrary, then runs the full
   * {@link PersistedEditableCollection.save | save()} pipeline.
   *
   * @param baseId - Base entity ID within the collection
   * @param entity - The entity to set
   * @returns Success with the composite ID string, or Failure
   */
  public async upsertItem(baseId: TBaseId, entity: T): Promise<Result<string>> {
    const result = this.operations.upsert(baseId, entity);
    if (result.isFailure()) {
      return result;
    }
    const saveResult = await this.save();
    if (saveResult.isFailure()) {
      return fail(`${this._collectionId}: upsert succeeded but persist failed: ${saveResult.message}`);
    }
    return result;
  }

  /**
   * Remove an entity and persist.
   *
   * Delegates to the {@link ICollectionOperations.remove | operations delegate} to
   * perform the domain-aware mutation on the SubLibrary, then runs the full
   * {@link PersistedEditableCollection.save | save()} pipeline.
   *
   * @param baseId - Base entity ID to remove
   * @returns Success with the removed entity, or Failure
   */
  public async removeItem(baseId: TBaseId): Promise<Result<T>> {
    const result = this.operations.remove(baseId);
    if (result.isFailure()) {
      return result;
    }
    const saveResult = await this.save();
    if (saveResult.isFailure()) {
      return fail(`${this._collectionId}: remove succeeded but persist failed: ${saveResult.message}`);
    }
    return result;
  }

  // ==========================================================================
  // Save Pipeline
  // ==========================================================================

  /**
   * Persist the collection's current in-memory state to disk.
   *
   * Pipeline:
   * 1. Invalidate cached snapshot (force re-read from SubLibrary)
   * 2. Create fresh {@link EditableCollection} from SubLibrary
   * 3. Serialize and write to FileTree via `editable.save()`
   * 4. If a sync provider is configured, flush FileTree to filesystem
   *
   * @returns `Success<true>` if the full pipeline succeeded, `Failure` with
   *   error context otherwise. Returns failure if the collection is immutable,
   *   has no FileTree source, or if any step in the pipeline fails.
   */
  public async save(): Promise<Result<true>> {
    // Always re-snapshot from SubLibrary to capture latest state
    this.invalidate();

    const editableResult = this.getEditable();
    if (editableResult.isFailure()) {
      return fail(`${this._collectionId}: ${editableResult.message}`);
    }

    const editable = editableResult.value;
    if (!editable.canSave()) {
      return fail(`Collection '${this._collectionId}' does not support persistence`);
    }

    const saveResult = await editable.save();
    if (saveResult.isFailure()) {
      return fail(`${this._collectionId}: save failed: ${saveResult.message}`);
    }

    if (this._syncProvider) {
      const syncResult = await this._syncProvider.syncToDisk();
      if (syncResult.isFailure()) {
        return fail(`${this._collectionId}: disk sync failed: ${syncResult.message}`);
      }
    }

    return succeed(true as const);
  }

  // ==========================================================================
  // Proxied Mutations (for auto-persist mode)
  // ==========================================================================

  /**
   * Add or update an item in the collection.
   *
   * Delegates to the underlying {@link EditableCollection.set | EditableCollection.set()}.
   * When auto-persist is enabled, triggers {@link PersistedEditableCollection.save | save()}
   * after the mutation.
   *
   * @param key - Base entity ID
   * @param value - Entity value
   * @returns The set result from the underlying collection
   */
  public set(key: TBaseId, value: T): DetailedResult<T, Collections.ResultMapResultDetail> {
    const editableResult = this.getEditable();
    if (editableResult.isFailure()) {
      return DetailedFailure.with<T, Collections.ResultMapResultDetail>(editableResult.message);
    }
    const result = editableResult.value.set(key, value);
    if (result.isSuccess() && this._autoPersist) {
      // Fire-and-forget: auto-persist is best-effort.
      // Errors are logged by the sync provider, not propagated to the caller.
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.save();
    }
    return result;
  }

  /**
   * Delete an item from the collection.
   *
   * Delegates to the underlying {@link EditableCollection.delete | EditableCollection.delete()}.
   * When auto-persist is enabled, triggers {@link PersistedEditableCollection.save | save()}
   * after the mutation.
   *
   * @param key - Base entity ID to delete
   * @returns The delete result from the underlying collection
   */
  public delete(key: TBaseId): DetailedResult<T, Collections.ResultMapResultDetail> {
    const editableResult = this.getEditable();
    if (editableResult.isFailure()) {
      return DetailedFailure.with<T, Collections.ResultMapResultDetail>(editableResult.message);
    }
    const result = editableResult.value.delete(key);
    if (result.isSuccess() && this._autoPersist) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.save();
    }
    return result;
  }
}
