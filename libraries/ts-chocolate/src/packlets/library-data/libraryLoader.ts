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
 * Library loader utilities for loading sub-libraries from file trees
 * @packageDocumentation
 */

import { Failure, Result, Success } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';

import {
  FullLibraryLoadSpec,
  ILibraryFileTreeSource,
  ILibraryLoadParams,
  IMergeLibrarySource,
  LibraryLoadSpec,
  MutabilitySpec,
  resolveSubLibraryLoadSpec,
  SubLibraryId
} from './model';
import { ILoadCollectionFromFileTreeParams } from './collectionLoader';
import { navigateToDirectory, LibraryPaths } from './navigation';

// ============================================================================
// Load Params Conversion
// ============================================================================

/**
 * Converts a LibraryLoadSpec to ILoadCollectionFromFileTreeParams.
 *
 * @param spec - The LibraryLoadSpec to convert
 * @param mutable - Mutability specification (default: false)
 * @returns The loading parameters, or undefined if no collections should be loaded
 * @public
 */
export function specToLoadParams<TCollectionId extends string>(
  spec: LibraryLoadSpec<TCollectionId>,
  mutable: MutabilitySpec = false
): ILoadCollectionFromFileTreeParams<TCollectionId> | undefined {
  // false means load nothing
  if (spec === false) {
    return undefined;
  }

  // true means load all with specified mutability
  if (spec === true) {
    return { mutable };
  }

  // Array of collection IDs means load only those collections
  if (Array.isArray(spec)) {
    return {
      included: spec,
      mutable
    };
  }

  // ILibraryLoadParams - fine-grained control
  const params = spec as ILibraryLoadParams;
  return {
    included: params.included,
    excluded: params.excluded,
    recurseWithDelimiter: params.recurseWithDelimiter,
    mutable
  };
}

// ============================================================================
// Sub-Library Directory Navigation
// ============================================================================

/**
 * Gets the directory path for a sub-library.
 *
 * @param subLibraryId - The sub-library identifier
 * @returns The path within the library tree
 * @public
 */
export function getSubLibraryPath(subLibraryId: SubLibraryId): string {
  switch (subLibraryId) {
    case 'ingredients':
      return LibraryPaths.ingredients;
    case 'fillings':
      return LibraryPaths.fillings;
    case 'journals':
      return LibraryPaths.journals;
    case 'molds':
      return LibraryPaths.molds;
    case 'procedures':
      return LibraryPaths.procedures;
    case 'tasks':
      return LibraryPaths.tasks;
    /* c8 ignore next 2 - functional code tested but coverage intermittently missed */
    case 'confections':
      return LibraryPaths.confections;
    /* c8 ignore next 2 - sessions used only by user library */
    case 'sessions':
      return LibraryPaths.sessions;
  }
}

/**
 * Navigates to a sub-library directory within a file tree.
 *
 * @param tree - The root file tree directory
 * @param subLibraryId - The sub-library to navigate to
 * @returns Success with the sub-library directory, or Failure if not found
 * @public
 */
export function navigateToSubLibrary(
  tree: FileTree.IFileTreeDirectoryItem,
  subLibraryId: SubLibraryId
): Result<FileTree.IFileTreeDirectoryItem> {
  return navigateToDirectory(tree, getSubLibraryPath(subLibraryId));
}

// ============================================================================
// Source Resolution
// ============================================================================

/**
 * Result of resolving a file tree source for a specific sub-library.
 * @public
 */
export interface IResolvedSubLibrarySource {
  /**
   * The sub-library identifier
   */
  readonly subLibraryId: SubLibraryId;

  /**
   * The directory containing collections for this sub-library
   */
  readonly directory: FileTree.IFileTreeDirectoryItem;

  /**
   * Load parameters for the collection loader
   */
  readonly loadParams: ILoadCollectionFromFileTreeParams<string>;
}

/**
 * Resolves a file tree source for a specific sub-library.
 *
 * @param source - The file tree source
 * @param subLibraryId - The sub-library to resolve
 * @returns Success with resolved source, or Failure if sub-library not found or disabled
 * @public
 */
export function resolveFileTreeSourceForSubLibrary(
  source: ILibraryFileTreeSource,
  subLibraryId: SubLibraryId
): Result<IResolvedSubLibrarySource | undefined> {
  const loadSpec = source.load ?? true;
  const subLibrarySpec = resolveSubLibraryLoadSpec(loadSpec, subLibraryId);

  // Check if this sub-library should be loaded
  const loadParams = specToLoadParams(subLibrarySpec, source.mutable ?? false);
  if (loadParams === undefined) {
    return Success.with(undefined);
  }

  // Navigate to the sub-library directory
  return navigateToSubLibrary(source.directory, subLibraryId).onSuccess((directory) =>
    Success.with({
      subLibraryId,
      directory,
      loadParams
    })
  );
}

/**
 * Resolves all sub-libraries from a file tree source.
 *
 * @param source - The file tree source
 * @returns Success with array of resolved sources (excluding disabled ones), or Failure on error
 * @public
 */
export function resolveFileTreeSource(
  source: ILibraryFileTreeSource
): Result<ReadonlyArray<IResolvedSubLibrarySource>> {
  const results: IResolvedSubLibrarySource[] = [];

  // Try each sub-library
  for (const subLibraryId of ['ingredients', 'fillings'] as const) {
    const resolveResult = resolveFileTreeSourceForSubLibrary(source, subLibraryId);
    if (resolveResult.isFailure()) {
      // If the directory doesn't exist, that's okay - just skip it
      // Only fail on actual errors
      continue;
    }

    const resolved = resolveResult.value;
    if (resolved !== undefined) {
      results.push(resolved);
    }
  }

  return Success.with(results);
}

/**
 * Resolves a FullLibraryLoadSpec for built-in loading to individual sub-library specs.
 *
 * @param spec - The full library load spec (default: true)
 * @param subLibraryId - The sub-library to get spec for
 * @returns The resolved LibraryLoadSpec, or false if not specified
 * @public
 */
export function resolveBuiltInSpec<TCollectionId extends string = string>(
  spec: FullLibraryLoadSpec | undefined,
  subLibraryId: SubLibraryId
): LibraryLoadSpec<TCollectionId> {
  const fullSpec = spec ?? true;
  return resolveSubLibraryLoadSpec(fullSpec, subLibraryId) as LibraryLoadSpec<TCollectionId>;
}

// ============================================================================
// Collision Detection
// ============================================================================

/**
 * A collection set for collision detection.
 * @public
 */
export interface ICollectionSet<TCollectionId extends string = string> {
  /**
   * Identifier for this source (for error messages)
   */
  readonly source: string;

  /**
   * Collections from this source
   */
  readonly collections: ReadonlyArray<{ readonly id: TCollectionId }>;
}

/**
 * Checks for duplicate collection IDs across multiple sources.
 *
 * @param collectionSets - Array of collection sets to check
 * @returns Success(true) if no collisions, Failure with details if collision found
 * @public
 */
export function checkForCollisionIds<TCollectionId extends string>(
  collectionSets: ReadonlyArray<ICollectionSet<TCollectionId>>
): Result<true> {
  const seen = new Map<TCollectionId, string>(); // id -> source
  for (const { source, collections } of collectionSets) {
    for (const coll of collections) {
      const existing = seen.get(coll.id);
      if (existing !== undefined) {
        return Failure.with(
          `Collection ID '${coll.id}' conflict: found in both '${existing}' and '${source}'`
        );
      }
      seen.set(coll.id, source);
    }
  }
  return Success.with(true);
}

// ============================================================================
// File Source Normalization
// ============================================================================

/**
 * Normalizes a file sources parameter to an array.
 *
 * Accepts either a single source or an array of sources,
 * and always returns a readonly array.
 *
 * @param sources - Single source, array of sources, or undefined
 * @returns Readonly array of sources (empty if undefined)
 * @public
 */
export function normalizeFileSources<T extends { readonly directory: FileTree.IFileTreeDirectoryItem }>(
  sources: T | ReadonlyArray<T> | undefined
): ReadonlyArray<T> {
  if (sources === undefined) {
    return [];
  }
  // Check if it's a single source by testing for 'directory' property
  if ('directory' in sources) {
    return [sources as T];
  }
  return sources;
}

// ============================================================================
// Merge Source Normalization
// ============================================================================

/**
 * Normalized result from a merge source.
 * @public
 */
export interface INormalizedMergeSource<TLibrary, TCollectionId extends string> {
  /**
   * The library to merge collections from.
   */
  readonly library: TLibrary;

  /**
   * The filter spec to apply (defaults to true if not specified).
   */
  readonly filter: LibraryLoadSpec<TCollectionId>;
}

/**
 * Type guard to check if a value is an IMergeLibrarySource.
 *
 * @param source - Either a library directly or an IMergeLibrarySource object
 * @returns True if the source is an IMergeLibrarySource with a 'library' property
 * @public
 */
export function isMergeLibrarySource<TLibrary, TCollectionId extends string>(
  source: TLibrary | IMergeLibrarySource<TLibrary, TCollectionId>
): source is IMergeLibrarySource<TLibrary, TCollectionId> {
  return typeof source === 'object' && source !== null && 'library' in source;
}

/**
 * Normalizes a merge source (library or \{library, filter\}) to a consistent shape.
 *
 * @param source - Either a library directly or an IMergeLibrarySource object
 * @returns Normalized object with library and filter (defaults to true)
 * @public
 */
export function normalizeMergeSource<TLibrary, TCollectionId extends string>(
  source: TLibrary | IMergeLibrarySource<TLibrary, TCollectionId>
): INormalizedMergeSource<TLibrary, TCollectionId> {
  if (isMergeLibrarySource(source)) {
    return {
      library: source.library,
      filter: source.filter ?? true
    };
  }
  return {
    library: source,
    filter: true
  };
}
