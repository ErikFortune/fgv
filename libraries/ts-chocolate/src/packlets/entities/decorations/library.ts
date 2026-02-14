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
 * Decorations library with multi-source collection support
 * @packageDocumentation
 */

import { captureResult, fail, Logging, Result } from '@fgv/ts-utils';

import { BaseDecorationId, DecorationId } from '../../common';
import { Converters as CommonConverters } from '../../common';
import { IDecorationEntity } from './model';
import { decorationEntity as decorationConverter } from './converters';
import { DecorationCollectionEntryInit } from './collection';
import {
  getDecorationsDirectory,
  ISubLibraryAsyncParams,
  ISubLibraryCreateParams,
  ISubLibraryParams,
  SubLibraryBase,
  SubLibraryFileTreeSource,
  SubLibraryMergeSource
} from '../../library-data';
import { BuiltInData } from '../../built-in';

// ============================================================================
// Re-export collection types for convenience
// ============================================================================

export {
  DecorationCollectionEntry,
  DecorationCollectionEntryInit,
  DecorationCollectionValidator,
  DecorationCollection
} from './collection';

/**
 * File tree source for decoration data.
 * @public
 */
export type IDecorationFileTreeSource = SubLibraryFileTreeSource;

/**
 * Specifies a decorations library to merge into a new library.
 * @public
 */
export type DecorationsMergeSource = SubLibraryMergeSource<DecorationsLibrary>;

/**
 * Parameters for creating a DecorationsLibrary instance synchronously.
 * @public
 */
export type IDecorationsLibraryParams = ISubLibraryParams<DecorationsLibrary, DecorationCollectionEntryInit>;

/**
 * Parameters for creating a DecorationsLibrary instance asynchronously with encryption support.
 * @public
 */
export type IDecorationsLibraryAsyncParams = ISubLibraryAsyncParams<
  DecorationsLibrary,
  DecorationCollectionEntryInit
>;

/**
 * Multi-source decoration library with type-safe access
 *
 * Wraps AggregatedResultMap to provide:
 * - Composite ID access (e.g., "common.gold-leaf-accent")
 * - Multi-source management (built-in, user, app-local, etc.)
 * - Mutable vs immutable collection distinction
 * - Weakly-typed validating access for external data
 *
 * @public
 */
export class DecorationsLibrary extends SubLibraryBase<DecorationId, BaseDecorationId, IDecorationEntity> {
  private constructor(params?: IDecorationsLibraryParams) {
    super({
      itemIdConverter: CommonConverters.baseDecorationId,
      itemConverter: decorationConverter,
      directoryNavigator: getDecorationsDirectory,
      builtInTreeProvider: BuiltInData.getLibraryTree,
      libraryParams: params
    });
  }

  /**
   * Creates a new DecorationsLibrary instance
   * @param params - Optional creation parameters with initial collections
   * @returns Success with new instance, or Failure with error message
   * @public
   */
  public static create(params?: IDecorationsLibraryParams): Result<DecorationsLibrary> {
    return captureResult(() => new DecorationsLibrary(params));
  }

  /**
   * Creates a new DecorationsLibrary instance asynchronously with encryption support.
   *
   * Use this factory method when you need to decrypt encrypted collections.
   * Pass encryption config via `params.encryption`.
   *
   * @param params - Optional creation parameters with initial collections and encryption config
   * @returns Promise resolving to Success with new instance, or Failure with error message
   * @public
   */
  public static async createAsync(
    params?: IDecorationsLibraryAsyncParams
  ): Promise<Result<DecorationsLibrary>> {
    /* c8 ignore next - default logger branch tested implicitly */
    const logger = params?.logger ?? new Logging.LogReporter<unknown>();

    const createParams: ISubLibraryCreateParams<DecorationsLibrary, BaseDecorationId, IDecorationEntity> = {
      itemIdConverter: CommonConverters.baseDecorationId,
      itemConverter: decorationConverter,
      directoryNavigator: getDecorationsDirectory,
      builtInTreeProvider: BuiltInData.getLibraryTree,
      libraryParams: params,
      logger
    };

    // Load all collections asynchronously with encryption support
    const loadResult = (await SubLibraryBase.loadAllCollectionsAsync(createParams)).report(logger);
    /* c8 ignore next 3 - failure paths tested through collectionLoader tests */
    if (loadResult.isFailure()) {
      return fail(loadResult.message);
    }

    // Create library with pre-loaded collections (no file sources, no built-in - already loaded)
    return captureResult(
      () =>
        new DecorationsLibrary({
          ...params,
          builtin: false, // Already loaded
          fileSources: undefined, // Already loaded
          collections: loadResult.value.collections,
          protectedCollections: loadResult.value.protectedCollections
        })
    );
  }
}
