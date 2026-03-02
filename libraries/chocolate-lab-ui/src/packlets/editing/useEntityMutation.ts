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
 * - in-memory set
 * - optional editable persistence
 * - workspace cache invalidation + reactive notification
 *
 * @packageDocumentation
 */

import { useCallback } from 'react';

import { fail, succeed, type Result } from '@fgv/ts-utils';

import type { CollectionId } from '@fgv/ts-chocolate';

import { useReactiveWorkspace, useWorkspace } from '../workspace';

// ============================================================================
// Types
// ============================================================================

/**
 * Minimal editable collection shape used by the mutation helper.
 * @public
 */
export interface IEditableEntityCollection<TEntity, TBaseId extends string> {
  readonly set: (id: TBaseId, entity: TEntity) => void;
  readonly canSave: () => boolean;
  readonly save: () => Promise<Result<unknown>>;
}

/**
 * Options for {@link createSetInMutableCollection}.
 * @public
 */
export interface ISetInMutableCollectionFactoryOptions<TEntity, TBaseId extends string, TCollectionEntry> {
  /** Retrieves a collection entry by ID. */
  readonly getCollection: (collectionId: CollectionId) => Result<TCollectionEntry>;
  /** Determines whether a collection entry is mutable. */
  readonly isMutable: (entry: TCollectionEntry) => boolean;
  /** Sets an entity in the collection entry. */
  readonly setEntity: (entry: TCollectionEntry, baseId: TBaseId, entity: TEntity) => Result<unknown>;
  /** Human-friendly entity label for error context. */
  readonly entityLabel: string;
}

/**
 * Configuration for {@link useEntityMutation}.
 * @public
 */
export interface IEntityMutationOptions<TEntity, TBaseId extends string> {
  /** Sets an entity in a mutable collection entry, with validation performed by the caller. */
  readonly setInMutableCollection: (
    collectionId: CollectionId,
    baseId: TBaseId,
    entity: TEntity
  ) => Result<unknown>;

  /** Human-friendly entity label used in log messages (e.g. 'ingredient'). */
  readonly entityLabel: string;

  /**
   * Optional accessor for editable collections.
   * If absent, persistence is skipped and mutation remains in-memory.
   */
  readonly getEditableCollection?: (
    collectionId: CollectionId
  ) => Result<IEditableEntityCollection<TEntity, TBaseId>>;
}

/**
 * Parameters for creating an entity in a mutable collection.
 * @public
 */
export interface ICreateEntityMutationParams<TEntity, TBaseId extends string, TCompositeId extends string> {
  readonly mutableCollectionId: CollectionId | undefined;
  readonly baseId: TBaseId;
  readonly entity: TEntity;
  readonly compositeId: TCompositeId;
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
export function createSetInMutableCollection<TEntity, TBaseId extends string, TCollectionEntry>(
  options: ISetInMutableCollectionFactoryOptions<TEntity, TBaseId, TCollectionEntry>
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
  const { setInMutableCollection, entityLabel, getEditableCollection } = options;

  const workspace = useWorkspace();
  const reactiveWorkspace = useReactiveWorkspace();

  const refreshWorkspace = useCallback((): void => {
    workspace.data.clearCache();
    reactiveWorkspace.notifyChange();
  }, [workspace, reactiveWorkspace]);

  const persistIfRequested = useCallback(
    async (
      collectionId: CollectionId,
      baseId: TBaseId,
      entity: TEntity,
      persistToDisk: boolean
    ): Promise<void> => {
      if (!persistToDisk || !getEditableCollection) {
        return;
      }

      const editableResult = getEditableCollection(collectionId);
      if (editableResult.isFailure()) {
        workspace.data.logger.info(
          `Updated ${entityLabel} in-memory only (collection '${collectionId}'): ${editableResult.message}`
        );
        return;
      }

      const editable = editableResult.value;
      editable.set(baseId, entity);
      if (editable.canSave()) {
        const saveResult = await editable.save();
        if (saveResult.isFailure()) {
          workspace.data.logger.error(`Disk save failed for ${entityLabel}: ${saveResult.message}`);
        }
      }
    },
    [entityLabel, getEditableCollection, workspace]
  );

  const createEntity = useCallback(
    async (
      params: ICreateEntityMutationParams<TEntity, TBaseId, TCompositeId>
    ): Promise<Result<TCompositeId>> => {
      const { mutableCollectionId, baseId, entity, compositeId, exists, persistToDisk = false } = params;

      if (!mutableCollectionId) {
        const message = `Cannot add ${entityLabel}: no mutable collection available`;
        workspace.data.logger.error(message);
        return fail(message);
      }

      if (exists(compositeId)) {
        const message = `${entityLabel} '${compositeId}' already exists`;
        workspace.data.logger.error(message);
        return fail(message);
      }

      const setResult = setInMutableCollection(mutableCollectionId, baseId, entity);
      if (setResult.isFailure()) {
        const message = `Failed to add ${entityLabel}: ${setResult.message}`;
        workspace.data.logger.error(message);
        return fail(message);
      }

      await persistIfRequested(mutableCollectionId, baseId, entity, persistToDisk);
      refreshWorkspace();
      return succeed(compositeId);
    },
    [entityLabel, persistIfRequested, refreshWorkspace, setInMutableCollection, workspace]
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

      const setResult = setInMutableCollection(collectionId, baseId, entity);
      if (setResult.isFailure()) {
        const message = `Save failed (in-memory): ${setResult.message}`;
        workspace.data.logger.error(message);
        return fail(message);
      }

      await persistIfRequested(collectionId, baseId, entity, persistToDisk);
      refreshWorkspace();
      return succeed(compositeId);
    },
    [persistIfRequested, refreshWorkspace, setInMutableCollection, workspace]
  );

  return {
    createEntity,
    saveEntity
  };
}
