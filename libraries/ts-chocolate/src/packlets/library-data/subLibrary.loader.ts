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

import {
  Converter,
  ensureArray,
  fail,
  Logging,
  recordFromEntries,
  Result,
  succeed,
  Success,
  Validator
} from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';

import { CollectionId } from '../common';
import { Converters as CommonConverters } from '../common';
import { CollectionLoader, EncryptedFileHandling } from './collectionLoader';
import { createFilterFromSpec } from './collectionFilter';
import type { IEncryptionConfig, IProtectedCollectionInternal, LibraryLoadSpec } from './model';
import { normalizeMergeSource, specToLoadParams } from './libraryLoader';
import type {
  SubLibraryBuiltInTreeProvider,
  SubLibraryCollection,
  SubLibraryDirectoryNavigator,
  SubLibraryEntryInit,
  SubLibraryFileTreeSource,
  SubLibraryMergeSource
} from './subLibrary';

export interface IFileTreeSourceLoadResult<TBaseId extends string, TItem> {
  readonly collections: ReadonlyArray<SubLibraryEntryInit<TBaseId, TItem>>;
  readonly protectedCollections: ReadonlyArray<IProtectedCollectionInternal<CollectionId>>;
  readonly sourceItems: ReadonlyMap<CollectionId, FileTree.FileTreeItem>;
}

interface ICollectionContainer<TBaseId extends string, TItem> {
  readonly collections: SubLibraryCollection<TBaseId, TItem>;
}

function _emptyLoadResult<TBaseId extends string, TItem>(): IFileTreeSourceLoadResult<TBaseId, TItem> {
  return { collections: [], protectedCollections: [], sourceItems: new Map() };
}

function _collectSourceItems(
  collections: ReadonlyArray<{ id: CollectionId; sourceItem: FileTree.FileTreeItem }>
): ReadonlyMap<CollectionId, FileTree.FileTreeItem> {
  const sourceItems = new Map<CollectionId, FileTree.FileTreeItem>();
  for (const coll of collections) {
    sourceItems.set(coll.id, coll.sourceItem);
  }
  return sourceItems;
}

export function loadBuiltInCollections<TBaseId extends string, TItem>(
  spec: LibraryLoadSpec<CollectionId>,
  itemIdConverter: Converter<TBaseId> | Validator<TBaseId>,
  itemConverter: Converter<TItem> | Validator<TItem>,
  directoryNavigator: SubLibraryDirectoryNavigator,
  builtInTreeProvider: SubLibraryBuiltInTreeProvider,
  logger?: Logging.LogReporter<unknown>
): Result<IFileTreeSourceLoadResult<TBaseId, TItem>> {
  if (spec === false) {
    return Success.with(_emptyLoadResult());
  }

  return builtInTreeProvider().onSuccess((libraryRoot) => {
    const source: SubLibraryFileTreeSource = {
      sourceName: 'builtin',
      directory: libraryRoot,
      load: spec,
      mutable: false
    };
    return loadFromFileTreeSource(
      source,
      itemIdConverter,
      itemConverter,
      directoryNavigator,
      'capture',
      logger,
      true
    );
  });
}

export function loadFromFileTreeSource<TBaseId extends string, TItem>(
  source: SubLibraryFileTreeSource,
  itemIdConverter: Converter<TBaseId> | Validator<TBaseId>,
  itemConverter: Converter<TItem> | Validator<TItem>,
  directoryNavigator: SubLibraryDirectoryNavigator,
  onEncryptedFile?: EncryptedFileHandling,
  logger?: Logging.LogReporter<unknown>,
  isBuiltIn?: boolean
): Result<IFileTreeSourceLoadResult<TBaseId, TItem>> {
  const mutable = source.mutable ?? false;
  const loadParams = specToLoadParams(source.load ?? true, mutable);
  if (loadParams === undefined) {
    return Success.with(_emptyLoadResult());
  }

  const loader = new CollectionLoader({
    itemConverter,
    collectionIdConverter: CommonConverters.collectionId,
    itemIdConverter,
    mutable: loadParams.mutable ?? mutable,
    logger
  });

  const dataDirResult = directoryNavigator(source.directory);
  if (dataDirResult.isFailure()) {
    if (source.skipMissingDirectories) {
      return Success.with(_emptyLoadResult());
    }
    return fail(dataDirResult.message);
  }

  return loader
    .loadFromFileTree(dataDirResult.value, {
      ...loadParams,
      onEncryptedFile,
      sourceName: source.sourceName ?? 'unknown'
    })
    .onSuccess((result) => {
      const protectedCollections = result.protectedCollections.map((pc) => ({
        ...pc,
        ref: { ...pc.ref, isBuiltIn: isBuiltIn ?? false }
      }));

      return succeed({
        collections: result.collections as ReadonlyArray<SubLibraryEntryInit<TBaseId, TItem>>,
        protectedCollections,
        sourceItems: _collectSourceItems(result.collections)
      });
    });
}

export function extractCollections<TBaseId extends string, TItem>(
  sources:
    | SubLibraryMergeSource<ICollectionContainer<TBaseId, TItem>>
    | ReadonlyArray<SubLibraryMergeSource<ICollectionContainer<TBaseId, TItem>>>
    | undefined
): ReadonlyArray<SubLibraryEntryInit<TBaseId, TItem>> {
  if (sources === undefined) {
    return [];
  }

  const sourceArray = ensureArray(sources);
  const result: SubLibraryEntryInit<TBaseId, TItem>[] = [];

  for (const source of sourceArray) {
    const { library, filter: filterSpec } = normalizeMergeSource(source);
    const filter = createFilterFromSpec(filterSpec, CommonConverters.collectionId);
    const collectionIds = Array.from(library.collections.keys());
    const filterResult = filter.filterItems(collectionIds, (id: CollectionId) => Success.with(id));
    if (filterResult.isSuccess()) {
      for (const filtered of filterResult.value) {
        const id = filtered.name;
        library.collections.get(id).asResult.onSuccess((collection) =>
          Success.with(
            result.push({
              id,
              isMutable: collection.isMutable,
              items: recordFromEntries(collection.items.entries())
            })
          )
        );
      }
    }
  }

  return result;
}

export async function loadBuiltInCollectionsAsync<TBaseId extends string, TItem>(
  spec: LibraryLoadSpec<CollectionId>,
  itemIdConverter: Converter<TBaseId> | Validator<TBaseId>,
  itemConverter: Converter<TItem> | Validator<TItem>,
  directoryNavigator: SubLibraryDirectoryNavigator,
  builtInTreeProvider: SubLibraryBuiltInTreeProvider,
  encryption?: IEncryptionConfig,
  logger?: Logging.LogReporter<unknown>
): Promise<Result<IFileTreeSourceLoadResult<TBaseId, TItem>>> {
  if (spec === false) {
    return Success.with(_emptyLoadResult());
  }

  const libraryRootResult = builtInTreeProvider();
  if (libraryRootResult.isFailure()) {
    return fail(libraryRootResult.message);
  }

  const source: SubLibraryFileTreeSource = {
    sourceName: 'builtin',
    directory: libraryRootResult.value,
    load: spec,
    mutable: false
  };

  return loadFromFileTreeSourceAsync(
    source,
    itemIdConverter,
    itemConverter,
    directoryNavigator,
    encryption,
    logger,
    true
  );
}

export async function loadFromFileTreeSourceAsync<TBaseId extends string, TItem>(
  source: SubLibraryFileTreeSource,
  itemIdConverter: Converter<TBaseId> | Validator<TBaseId>,
  itemConverter: Converter<TItem> | Validator<TItem>,
  directoryNavigator: SubLibraryDirectoryNavigator,
  encryption?: IEncryptionConfig,
  logger?: Logging.LogReporter<unknown>,
  isBuiltIn?: boolean
): Promise<Result<IFileTreeSourceLoadResult<TBaseId, TItem>>> {
  const mutable = source.mutable ?? false;
  const loadParams = specToLoadParams(source.load ?? true, mutable);
  if (loadParams === undefined) {
    return Success.with(_emptyLoadResult());
  }

  const loader = new CollectionLoader({
    itemConverter,
    collectionIdConverter: CommonConverters.collectionId,
    itemIdConverter,
    mutable: loadParams.mutable ?? mutable,
    logger
  });

  const dataDirResult = directoryNavigator(source.directory);
  if (dataDirResult.isFailure()) {
    if (source.skipMissingDirectories) {
      return Success.with(_emptyLoadResult());
    }
    return fail(dataDirResult.message);
  }

  return loader
    .loadFromFileTreeAsync(dataDirResult.value, {
      ...loadParams,
      encryption,
      isBuiltIn
    })
    .then((result) =>
      result.onSuccess((loadResult) => {
        const collections: SubLibraryEntryInit<TBaseId, TItem>[] = loadResult.collections.map((coll) => ({
          id: coll.id,
          isMutable: coll.isMutable,
          items: coll.items,
          metadata: coll.metadata,
          sourceItem: coll.sourceItem
        }));

        return succeed({
          collections,
          protectedCollections: loadResult.protectedCollections as ReadonlyArray<
            IProtectedCollectionInternal<CollectionId>
          >,
          sourceItems: _collectSourceItems(loadResult.collections)
        });
      })
    );
}
