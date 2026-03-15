/*
 * Copyright (c) 2026 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Shared mutation helper for tab-level entity create/save workflows.
 *
 * Encapsulates the repeated collection mutation sequence used throughout tabs:
 * - resolve mutable collection
 * - duplicate checks
 * - in-memory set + disk persistence (via library helper or legacy callbacks)
 * - workspace cache invalidation + reactive notification
 *
 * @packageDocumentation
 */

import { useCallback } from 'react';

import { fail, succeed, type IResult, type Result } from '@fgv/ts-utils';

import type { CollectionId, Editing } from '@fgv/ts-chocolate';
type PersistedEditableCollection<TEntity, TBaseId extends string> = Editing.PersistedEditableCollection<
  TEntity,
  TBaseId
>;

import { useReactiveWorkspace, useWorkspace } from '../workspace';

/**
 * Infers the mutable branch of a collection entry union by requiring `items.set`.
 *
 * Useful when collection APIs return `readonly | mutable` entry unions and callers
 * need a stable writable subtype for type guards.
 *
 * @public
 */
export type MutableCollectionEntryWithSet<TEntry, TBaseId extends string, TEntity> = Extract<
  TEntry,
  {
    readonly items: {
      readonly set: (id: TBaseId, entity: TEntity) => IResult<unknown>;
    };
  }
>;

/**
 * Options for {@link createSetInMutableCollection}.
 * @public
 */
export interface ISetInMutableCollectionFactoryOptions<
  TEntity,
  TBaseId extends string,
  TCollectionEntry,
  TMutableCollectionEntry extends TCollectionEntry = TCollectionEntry
> {
  /** Retrieves a collection entry by ID. */
  readonly getCollection: (collectionId: CollectionId) => IResult<TCollectionEntry>;
  /** Determines whether a collection entry is mutable and narrows writable shape. */
  readonly isMutable: (entry: TCollectionEntry) => entry is TMutableCollectionEntry;
  /** Sets an entity in the collection entry. */
  readonly setEntity: (entry: TMutableCollectionEntry, baseId: TBaseId, entity: TEntity) => IResult<unknown>;
  /** Human-friendly entity label for error context. */
  readonly entityLabel: string;
}

/**
 * Configuration for {@link useEntityMutation}.
 *
 * Supports two modes:
 *
 * 1. **Library helper** (preferred): Provide {@link IEntityMutationOptions.saveToCollection | saveToCollection}
 *    backed by a `ChocolateEntityLibrary.saveXxx()` method. The library helper handles
 *    mutability checks, in-memory set, and disk persistence in one call.
 *
 * 2. **Legacy callbacks**: Provide {@link IEntityMutationOptions.setInMutableCollection | setInMutableCollection}
 *    and optionally {@link IEntityMutationOptions.getPersistedCollection | getPersistedCollection}.
 *    The hook orchestrates set + persist separately.
 *
 * When `saveToCollection` is provided, the legacy callbacks are ignored.
 *
 * @public
 */
export interface IEntityMutationOptions<TEntity, TBaseId extends string> {
  /**
   * Saves an entity to a mutable collection and persists to disk.
   *
   * Backed by `ChocolateEntityLibrary.saveXxx()` methods. When provided,
   * `setInMutableCollection` and `getPersistedCollection` are ignored.
   */
  readonly saveToCollection?: (
    collectionId: CollectionId,
    baseId: TBaseId,
    entity: TEntity
  ) => Promise<Result<string>>;

  /**
   * Sets an entity in a mutable collection entry, with validation performed by the caller.
   * Used when `saveToCollection` is not provided.
   */
  readonly setInMutableCollection?: (
    collectionId: CollectionId,
    baseId: TBaseId,
    entity: TEntity
  ) => Result<unknown>;

  /** Human-friendly entity label used in log messages (e.g. 'ingredient'). */
  readonly entityLabel: string;

  /**
   * Optional accessor for persisted collection singletons.
   * Used when `saveToCollection` is not provided. If absent, persistence is skipped.
   */
  readonly getPersistedCollection?: (
    collectionId: CollectionId
  ) => Result<PersistedEditableCollection<TEntity, TBaseId>>;
}

/**
 * Parameters for creating an entity in a mutable collection.
 * @public
 */
export interface ICreateEntityMutationParams<TEntity, TBaseId extends string, TCompositeId extends string> {
  readonly targetCollectionId?: CollectionId;
  readonly defaultCollectionId?: CollectionId;
  readonly getCompositeId: (collectionId: CollectionId, baseId: TBaseId) => TCompositeId;
  readonly baseId: TBaseId;
  readonly entity: TEntity;
  readonly exists: (compositeId: TCompositeId) => boolean;
  readonly persistToDisk?: boolean;
}

/**
 * Parameters for saving an existing entity to its collection.
 * @public
 */
export interface ISaveEntityMutationParams<TEntity, TBaseId extends string, TCompositeId extends string> {
  readonly compositeId: TCompositeId;
  readonly baseId: TBaseId;
  readonly entity: TEntity;
  readonly persistToDisk?: boolean;
}

/**
 * Mutation callbacks returned by {@link useEntityMutation}.
 * @public
 */
export interface IEntityMutationActions<TEntity, TBaseId extends string, TCompositeId extends string> {
  /** Create and store a new entity in the selected mutable collection. */
  readonly createEntity: (
    params: ICreateEntityMutationParams<TEntity, TBaseId, TCompositeId>
  ) => Promise<Result<TCompositeId>>;

  /** Save an existing entity by composite ID back to its collection. */
  readonly saveEntity: (
    params: ISaveEntityMutationParams<TEntity, TBaseId, TCompositeId>
  ) => Promise<Result<TCompositeId>>;
}

/**
 * Creates a reusable `setInMutableCollection` callback for {@link useEntityMutation}.
 *
 * Uses Result chaining to normalize error context for collection lookup, mutability,
 * and set operations.
 *
 * @public
 */
export function createSetInMutableCollection<
  TEntity,
  TBaseId extends string,
  TCollectionEntry,
  TMutableCollectionEntry extends TCollectionEntry = TCollectionEntry
>(
  options: ISetInMutableCollectionFactoryOptions<TEntity, TBaseId, TCollectionEntry, TMutableCollectionEntry>
): (collectionId: CollectionId, baseId: TBaseId, entity: TEntity) => Result<unknown> {
  const { getCollection, isMutable, setEntity, entityLabel } = options;

  return (collectionId: CollectionId, baseId: TBaseId, entity: TEntity): Result<unknown> =>
    getCollection(collectionId)
      .withErrorFormat((msg) => `Collection '${collectionId}' not found: ${msg}`)
      .onSuccess((entry) => {
        if (!isMutable(entry)) {
          return fail(`Collection '${collectionId}' is not mutable`);
        }

        return setEntity(entry, baseId, entity)
          .withErrorFormat((msg) => `Failed to set ${entityLabel}: ${msg}`)
          .onSuccess(() => succeed(true));
      });
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Provides shared create/save mutation callbacks for tab entity workflows.
 *
 * @public
 */
export function useEntityMutation<TEntity, TBaseId extends string, TCompositeId extends string>(
  options: IEntityMutationOptions<TEntity, TBaseId>
): IEntityMutationActions<TEntity, TBaseId, TCompositeId> {
  const { saveToCollection, setInMutableCollection, entityLabel, getPersistedCollection } = options;

  const workspace = useWorkspace();
  const reactiveWorkspace = useReactiveWorkspace();

  const refreshWorkspace = useCallback((): void => {
    workspace.data.clearCache();
    reactiveWorkspace.notifyChange();
  }, [workspace, reactiveWorkspace]);

  // ---- Legacy persistence path (used when saveToCollection is not provided) ----

  const legacyPersistIfRequested = useCallback(
    async (collectionId: CollectionId, persistToDisk: boolean): Promise<void> => {
      if (!persistToDisk || !getPersistedCollection) {
        return;
      }

      const persistedResult = getPersistedCollection(collectionId);
      if (persistedResult.isFailure()) {
        workspace.data.logger.info(
          `Updated ${entityLabel} in-memory only (collection '${collectionId}'): ${persistedResult.message}`
        );
        return;
      }

      // save() handles: re-snapshot from SubLibrary → FileTree write → disk sync
      const saveResult = await persistedResult.value.save();
      if (saveResult.isFailure()) {
        workspace.data.logger.error(`Disk save failed for ${entityLabel}: ${saveResult.message}`);
      }
    },
    [entityLabel, getPersistedCollection, workspace]
  );

  // ---- Unified save: delegates to library helper or legacy path ----

  const saveToCollectionOrLegacy = useCallback(
    async (
      collectionId: CollectionId,
      baseId: TBaseId,
      entity: TEntity,
      persistToDisk: boolean
    ): Promise<Result<true>> => {
      if (saveToCollection) {
        // Library helper path: handles set + persist in one call
        const result = await saveToCollection(collectionId, baseId, entity);
        if (result.isFailure()) {
          return fail(result.message);
        }
        return succeed(true);
      }

      // Legacy path: manual set + separate persist
      if (!setInMutableCollection) {
        return fail(`${entityLabel}: no saveToCollection or setInMutableCollection provided`);
      }

      const setResult = setInMutableCollection(collectionId, baseId, entity);
      if (setResult.isFailure()) {
        return fail(setResult.message);
      }
      await legacyPersistIfRequested(collectionId, persistToDisk);
      return succeed(true);
    },
    [saveToCollection, setInMutableCollection, entityLabel, legacyPersistIfRequested, workspace]
  );

  // ---- Public actions ----

  const createEntity = useCallback(
    async (
      params: ICreateEntityMutationParams<TEntity, TBaseId, TCompositeId>
    ): Promise<Result<TCompositeId>> => {
      const {
        targetCollectionId,
        defaultCollectionId,
        getCompositeId,
        baseId,
        entity,
        exists,
        persistToDisk = false
      } = params;

      const mutableCollectionId = targetCollectionId ?? defaultCollectionId;

      if (!mutableCollectionId) {
        const message = `Cannot add ${entityLabel}: no mutable collection available`;
        workspace.data.logger.error(message);
        return fail(message);
      }

      const compositeId = getCompositeId(mutableCollectionId, baseId);

      if (exists(compositeId)) {
        const message = `${entityLabel} '${compositeId}' already exists`;
        workspace.data.logger.error(message);
        return fail(message);
      }

      const saveResult = await saveToCollectionOrLegacy(mutableCollectionId, baseId, entity, persistToDisk);
      if (saveResult.isFailure()) {
        const message = `Failed to add ${entityLabel}: ${saveResult.message}`;
        workspace.data.logger.error(message);
        return fail(message);
      }

      refreshWorkspace();
      return succeed(compositeId);
    },
    [entityLabel, saveToCollectionOrLegacy, refreshWorkspace, workspace]
  );

  const saveEntity = useCallback(
    async (
      params: ISaveEntityMutationParams<TEntity, TBaseId, TCompositeId>
    ): Promise<Result<TCompositeId>> => {
      const { compositeId, baseId, entity, persistToDisk = true } = params;

      const collectionPart = compositeId.split('.')[0];
      if (!collectionPart) {
        const message = `Save failed: invalid composite ID '${compositeId}'`;
        workspace.data.logger.error(message);
        return fail(message);
      }
      const collectionId = collectionPart as CollectionId;

      const saveResult = await saveToCollectionOrLegacy(collectionId, baseId, entity, persistToDisk);
      if (saveResult.isFailure()) {
        const message = `Save failed: ${saveResult.message}`;
        workspace.data.logger.error(message);
        return fail(message);
      }

      refreshWorkspace();
      return succeed(compositeId);
    },
    [saveToCollectionOrLegacy, refreshWorkspace, workspace]
  );

  return {
    createEntity,
    saveEntity
  };
}
