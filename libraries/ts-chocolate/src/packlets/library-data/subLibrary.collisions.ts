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

import { Logging } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';

import { CollectionId } from '../common';
import type { IConflictingCollectionCopy, IProtectedCollectionInternal } from './model';

export interface IConflictCopyInternal extends IConflictingCollectionCopy {
  readonly sourceItem?: FileTree.FileTreeItem;
}

interface IDedupEntry {
  readonly id: CollectionId;
  readonly metadata?: unknown;
  readonly isMutable?: boolean;
  readonly sourceItem?: FileTree.FileTreeItem;
}

function _getMetadataFields(metadata: unknown): { sourceName?: string; secretName?: string } {
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }

  const maybe = metadata as { sourceName?: unknown; secretName?: unknown };
  return {
    sourceName: typeof maybe.sourceName === 'string' ? maybe.sourceName : undefined,
    secretName: typeof maybe.secretName === 'string' ? maybe.secretName : undefined
  };
}

export interface IDedupSource<TEntry extends IDedupEntry> {
  readonly sourceLabel: string;
  readonly collections: ReadonlyArray<TEntry>;
  readonly sourceItems: ReadonlyMap<CollectionId, FileTree.FileTreeItem>;
}

export function appendConflictCopy(
  conflicts: Map<CollectionId, IConflictCopyInternal[]>,
  collectionId: CollectionId,
  loser: IConflictCopyInternal
): void {
  conflicts.set(collectionId, [...(conflicts.get(collectionId) ?? []), loser]);
}

export function createConflictCopyFromProtected(
  protectedCollection: IProtectedCollectionInternal<CollectionId>
): IConflictCopyInternal {
  return {
    sourceName: protectedCollection.sourceName,
    isEncrypted: true,
    itemCount: protectedCollection.ref.itemCount,
    secretName: protectedCollection.ref.secretName,
    isMutable: protectedCollection.ref.isMutable,
    sourceItem: protectedCollection.sourceItem
  };
}

export function addProtectedOrConflict(
  protectedCollections: Map<CollectionId, IProtectedCollectionInternal<CollectionId>>,
  conflicts: Map<CollectionId, IConflictCopyInternal[]>,
  protectedCollection: IProtectedCollectionInternal<CollectionId>,
  logger?: Logging.LogReporter<unknown>
): void {
  const collectionId = protectedCollection.ref.collectionId;
  const existing = protectedCollections.get(collectionId);
  if (existing !== undefined) {
    appendConflictCopy(conflicts, collectionId, createConflictCopyFromProtected(protectedCollection));
    logger?.warn(
      `[SubLibrary] Protected collection ID collision: '${collectionId}' from '${
        protectedCollection.sourceName ?? 'unknown'
      }' conflicts with existing. Skipping duplicate.`
    );
    return;
  }

  protectedCollections.set(collectionId, protectedCollection);
}

export function dedupeCollectionsWithConflicts<TEntry extends IDedupEntry>(
  sources: ReadonlyArray<IDedupSource<TEntry>>,
  additionalCollections: ReadonlyArray<TEntry>,
  logger?: Logging.LogReporter<unknown>
): {
  readonly collections: ReadonlyArray<TEntry>;
  readonly activeSourceItems: ReadonlyMap<CollectionId, FileTree.FileTreeItem>;
  readonly preInitConflicts: ReadonlyMap<CollectionId, ReadonlyArray<IConflictCopyInternal>>;
} {
  const seenIds = new Map<CollectionId, string>();
  const preInitConflicts = new Map<CollectionId, IConflictCopyInternal[]>();
  const activeSourceItems = new Map<CollectionId, FileTree.FileTreeItem>();
  const collections: TEntry[] = [];

  for (const source of sources) {
    for (const collection of source.collections) {
      const existingSource = seenIds.get(collection.id);
      if (existingSource !== undefined) {
        const metadataFields = _getMetadataFields(collection.metadata);
        const loser: IConflictCopyInternal = {
          sourceName: metadataFields.sourceName ?? source.sourceLabel,
          isEncrypted: metadataFields.secretName !== undefined,
          itemCount: undefined,
          secretName: metadataFields.secretName,
          isMutable: collection.isMutable ?? false,
          sourceItem: source.sourceItems.get(collection.id)
        };
        appendConflictCopy(preInitConflicts, collection.id, loser);
        logger?.warn(
          `[SubLibrary] Collection ID collision: '${collection.id}' from '${source.sourceLabel}' conflicts with existing from '${existingSource}'. Skipping duplicate.`
        );
        continue;
      }

      seenIds.set(collection.id, source.sourceLabel);
      const sourceItem = source.sourceItems.get(collection.id);
      if (sourceItem !== undefined) {
        activeSourceItems.set(collection.id, sourceItem);
      }
      collections.push(collection);
    }
  }

  for (const collection of additionalCollections) {
    collections.push(collection);
    if (collection.sourceItem !== undefined) {
      activeSourceItems.set(collection.id, collection.sourceItem);
    }
  }

  return {
    collections,
    activeSourceItems,
    preInitConflicts
  };
}

export function dedupeCollectionsByFirstSeen<TEntry extends { readonly id: CollectionId }>(
  sources: ReadonlyArray<{ sourceLabel: string; collections: ReadonlyArray<TEntry> }>,
  logger?: Logging.LogReporter<unknown>
): ReadonlyArray<TEntry> {
  const seenIds = new Map<CollectionId, string>();
  const collections: TEntry[] = [];

  for (const source of sources) {
    for (const collection of source.collections) {
      const existingSource = seenIds.get(collection.id);
      if (existingSource !== undefined) {
        logger?.warn(
          `[SubLibrary] Collection ID collision (async): '${collection.id}' from '${source.sourceLabel}' conflicts with '${existingSource}'. Skipping duplicate.`
        );
        continue;
      }

      seenIds.set(collection.id, source.sourceLabel);
      collections.push(collection);
    }
  }

  return collections;
}
