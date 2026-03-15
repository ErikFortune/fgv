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
 * Locations library with multi-source collection support
 * @packageDocumentation
 */

import { captureResult, fail, Logging, Result } from '@fgv/ts-utils';

import { BaseLocationId, LocationId } from '../../common';
import { Converters as CommonConverters } from '../../common';
import { ILocationEntity } from './model';
import { locationEntity as locationConverter } from './converters';
import { LocationCollectionEntryInit } from './collection';
import {
  getLocationsDirectory,
  ISubLibraryAsyncParams,
  ISubLibraryCreateParams,
  ISubLibraryParams,
  SubLibraryBase,
  SubLibraryFileTreeSource,
  SubLibraryMergeSource
} from '../../library-data';
import { BuiltInData } from '../../built-in';

/**
 * File tree source for location data.
 * @public
 */
export type ILocationFileTreeSource = SubLibraryFileTreeSource;

/**
 * Specifies a locations library to merge into a new library.
 * @public
 */
export type LocationsMergeSource = SubLibraryMergeSource<LocationsLibrary>;

/**
 * Parameters for creating a LocationsLibrary instance synchronously.
 * @public
 */
export type ILocationsLibraryParams = ISubLibraryParams<LocationsLibrary, LocationCollectionEntryInit>;

/**
 * Parameters for creating a LocationsLibrary instance asynchronously with encryption support.
 * @public
 */
export type ILocationsLibraryAsyncParams = ISubLibraryAsyncParams<
  LocationsLibrary,
  LocationCollectionEntryInit
>;

/**
 * Multi-source location library with type-safe access.
 *
 * Wraps AggregatedResultMap to provide:
 * - Composite ID access (e.g., "user.kitchen-shelf")
 * - Multi-source management
 * - Mutable vs immutable collection distinction
 * - Weakly-typed validating access for external data
 *
 * Locations are user-specific entities with no built-in defaults.
 * Callers should pass `builtin: false` in params.
 *
 * @public
 */
export class LocationsLibrary extends SubLibraryBase<LocationId, BaseLocationId, ILocationEntity> {
  private constructor(params?: ILocationsLibraryParams) {
    super({
      itemIdConverter: CommonConverters.baseLocationId,
      itemConverter: locationConverter,
      directoryNavigator: getLocationsDirectory,
      builtInTreeProvider: BuiltInData.getLibraryTree,
      libraryParams: params
    });
  }

  /**
   * Creates a new LocationsLibrary instance
   * @param params - Optional creation parameters with initial collections
   * @returns Success with new instance, or Failure with error message
   * @public
   */
  public static create(params?: ILocationsLibraryParams): Result<LocationsLibrary> {
    return captureResult(() => new LocationsLibrary(params));
  }

  /**
   * Creates a new LocationsLibrary instance asynchronously with encryption support.
   *
   * Use this factory method when you need to decrypt encrypted collections.
   * Pass encryption config via `params.encryption`.
   *
   * @param params - Optional creation parameters with initial collections and encryption config
   * @returns Promise resolving to Success with new instance, or Failure with error message
   * @public
   */
  public static async createAsync(params?: ILocationsLibraryAsyncParams): Promise<Result<LocationsLibrary>> {
    /* c8 ignore next - default logger branch tested implicitly */
    const logger = params?.logger ?? new Logging.LogReporter<unknown>();

    const createParams: ISubLibraryCreateParams<LocationsLibrary, BaseLocationId, ILocationEntity> = {
      itemIdConverter: CommonConverters.baseLocationId,
      itemConverter: locationConverter,
      directoryNavigator: getLocationsDirectory,
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
        new LocationsLibrary({
          ...params,
          builtin: false, // Already loaded
          fileSources: undefined, // Already loaded
          collections: loadResult.value.collections,
          protectedCollections: loadResult.value.protectedCollections
        })
    );
  }
}
