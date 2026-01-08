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
 * Molds library with multi-source collection support
 * @packageDocumentation
 */

import { captureResult, fail, Logging, Result } from '@fgv/ts-utils';

import { BaseMoldId, MoldId } from '../common';
import { Converters as CommonConverters } from '../common';
import { Mold } from './mold';
import { mold as moldConverter } from './converters';
import { MoldCollectionEntryInit } from './moldsCollection';
import {
  getMoldsDirectory,
  ISubLibraryAsyncParams,
  ISubLibraryCreateParams,
  ISubLibraryParams,
  SubLibraryBase,
  SubLibraryFileTreeSource,
  SubLibraryMergeSource
} from '../library-data';
import { BuiltInData } from '../built-in';

/**
 * File tree source for mold data.
 * @public
 */
export type IMoldFileTreeSource = SubLibraryFileTreeSource;

/**
 * Specifies a molds library to merge into a new library.
 * @public
 */
export type MoldsMergeSource = SubLibraryMergeSource<MoldsLibrary>;

/**
 * Parameters for creating a MoldsLibrary instance synchronously.
 * @public
 */
export type IMoldsLibraryParams = ISubLibraryParams<MoldsLibrary, MoldCollectionEntryInit>;

/**
 * Parameters for creating a MoldsLibrary instance asynchronously with encryption support.
 * @public
 */
export type IMoldsLibraryAsyncParams = ISubLibraryAsyncParams<MoldsLibrary, MoldCollectionEntryInit>;

/**
 * Multi-source mold library with type-safe access
 *
 * Wraps AggregatedResultMap to provide:
 * - Composite ID access (e.g., "common.chocolate-world-cw-2227")
 * - Multi-source management (built-in, user, app-local, etc.)
 * - Mutable vs immutable collection distinction
 * - Weakly-typed validating access for external data
 *
 * @public
 */
export class MoldsLibrary extends SubLibraryBase<MoldId, BaseMoldId, Mold> {
  private constructor(params?: IMoldsLibraryParams) {
    super({
      itemIdConverter: CommonConverters.baseMoldId,
      itemConverter: moldConverter,
      directoryNavigator: getMoldsDirectory,
      builtInTreeProvider: BuiltInData.getLibraryTree,
      libraryParams: params
    });
  }

  /**
   * Creates a new MoldsLibrary instance
   * @param params - Optional creation parameters with initial collections
   * @returns Success with new instance, or Failure with error message
   * @public
   */
  public static create(params?: IMoldsLibraryParams): Result<MoldsLibrary> {
    return captureResult(() => new MoldsLibrary(params));
  }

  /**
   * Creates a new MoldsLibrary instance asynchronously with encryption support.
   *
   * Use this factory method when you need to decrypt encrypted collections.
   * Pass encryption config via `params.encryption`.
   *
   * @param params - Optional creation parameters with initial collections and encryption config
   * @returns Promise resolving to Success with new instance, or Failure with error message
   * @public
   */
  public static async createAsync(params?: IMoldsLibraryAsyncParams): Promise<Result<MoldsLibrary>> {
    /* c8 ignore next - default logger branch tested implicitly */
    const logger = params?.logger ?? new Logging.LogReporter<unknown>();

    const createParams: ISubLibraryCreateParams<MoldsLibrary, BaseMoldId, Mold> = {
      itemIdConverter: CommonConverters.baseMoldId,
      itemConverter: moldConverter,
      directoryNavigator: getMoldsDirectory,
      builtInTreeProvider: BuiltInData.getLibraryTree,
      libraryParams: params,
      logger
    };

    // Load all collections asynchronously with encryption support
    const collectionsResult = (await SubLibraryBase.loadAllCollectionsAsync(createParams)).report(logger);
    if (collectionsResult.isFailure()) {
      return fail(collectionsResult.message);
    }

    // Create library with pre-loaded collections (no file sources, no built-in - already loaded)
    return captureResult(
      () =>
        new MoldsLibrary({
          ...params,
          builtin: false, // Already loaded
          fileSources: undefined, // Already loaded
          collections: collectionsResult.value
        })
    );
  }
}
