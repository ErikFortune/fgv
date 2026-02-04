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
 * Tasks library with multi-source collection support
 * @packageDocumentation
 */

import { captureResult, fail, Logging, Result } from '@fgv/ts-utils';

import { BaseTaskId, TaskId } from '../../common';
import { Converters as CommonConverters } from '../../common';
import { IRawTaskEntity } from './model';
import { rawTaskEntity as taskConverter } from './converters';
import { TaskCollectionEntryInit } from './collection';
import {
  getTasksDirectory,
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
  TaskCollectionEntry,
  TaskCollectionEntryInit,
  TaskCollectionValidator,
  TaskCollection
} from './collection';

/**
 * File tree source for task data.
 * @public
 */
export type ITaskFileTreeSource = SubLibraryFileTreeSource;

/**
 * Specifies a tasks library to merge into a new library.
 * @public
 */
export type TasksMergeSource = SubLibraryMergeSource<TasksLibrary>;

/**
 * Parameters for creating a TasksLibrary instance synchronously.
 * @public
 */
export type ITasksLibraryParams = ISubLibraryParams<TasksLibrary, TaskCollectionEntryInit>;

/**
 * Parameters for creating a TasksLibrary instance asynchronously with encryption support.
 * @public
 */
export type ITasksLibraryAsyncParams = ISubLibraryAsyncParams<TasksLibrary, TaskCollectionEntryInit>;

/**
 * Multi-source task library with type-safe access
 *
 * Wraps AggregatedResultMap to provide:
 * - Composite ID access (e.g., "common.melt-chocolate")
 * - Multi-source management (built-in, user, app-local, etc.)
 * - Mutable vs immutable collection distinction
 * - Weakly-typed validating access for external data
 *
 * @public
 */
export class TasksLibrary extends SubLibraryBase<TaskId, BaseTaskId, IRawTaskEntity> {
  private constructor(params?: ITasksLibraryParams) {
    super({
      itemIdConverter: CommonConverters.baseTaskId,
      itemConverter: taskConverter,
      directoryNavigator: getTasksDirectory,
      builtInTreeProvider: BuiltInData.getLibraryTree,
      libraryParams: params
    });
  }

  /**
   * Creates a new TasksLibrary instance
   * @param params - Optional creation parameters with initial collections
   * @returns Success with new instance, or Failure with error message
   * @public
   */
  public static create(params?: ITasksLibraryParams): Result<TasksLibrary> {
    return captureResult(() => new TasksLibrary(params));
  }

  /**
   * Creates a new TasksLibrary instance asynchronously with encryption support.
   *
   * Use this factory method when you need to decrypt encrypted collections.
   * Pass encryption config via `params.encryption`.
   *
   * @param params - Optional creation parameters with initial collections and encryption config
   * @returns Promise resolving to Success with new instance, or Failure with error message
   * @public
   */
  public static async createAsync(params?: ITasksLibraryAsyncParams): Promise<Result<TasksLibrary>> {
    /* c8 ignore next - default logger branch tested implicitly */
    const logger = params?.logger ?? new Logging.LogReporter<unknown>();

    const createParams: ISubLibraryCreateParams<TasksLibrary, BaseTaskId, IRawTaskEntity> = {
      itemIdConverter: CommonConverters.baseTaskId,
      itemConverter: taskConverter,
      directoryNavigator: getTasksDirectory,
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
        new TasksLibrary({
          ...params,
          builtin: false, // Already loaded
          fileSources: undefined, // Already loaded
          collections: loadResult.value.collections,
          protectedCollections: loadResult.value.protectedCollections
        })
    );
  }
}
