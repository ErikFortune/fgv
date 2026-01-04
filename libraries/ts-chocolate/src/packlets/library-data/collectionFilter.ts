// Copyright (c) 2024 Erik Fortune
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

import { Converter, Failure, mapResults, MessageAggregator, Result, Success, Validator } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
import { FilterPattern, ILibraryLoadParams, LibraryLoadSpec } from './model';

/**
 * Parameters used to filter and validate collections imported from a file tree.
 * @public
 */
export interface ICollectionFilterInitParams<T extends string> {
  /**
   * Patterns to include. If specified, only names matching at least one pattern are included.
   * Strings are matched exactly, RegExp patterns use `.test()`.
   */
  readonly included?: ReadonlyArray<FilterPattern>;
  /**
   * Patterns to exclude. Names matching any pattern are excluded (takes precedence over included).
   * Strings are matched exactly, RegExp patterns use `.test()`.
   */
  readonly excluded?: ReadonlyArray<FilterPattern>;
  readonly nameConverter: Converter<T> | Validator<T>;
  readonly errorOnInvalidName?: boolean;
}

/**
 * Parameters used to filter a directory.
 * @public
 */
export interface IFilterDirectoryParams {
  readonly prefix?: string;
  readonly recurseWithDelimiter?: string;
}

/**
 * Result of filtering a collection of items.
 * @public
 */
export interface IFilteredItem<T, TID extends string = string> {
  readonly name: TID;
  readonly item: T;
}

/**
 * Generic collection import filter.
 * @public
 */
export class CollectionFilter<T extends string> {
  public readonly included: ReadonlyArray<FilterPattern> | undefined;
  public readonly excluded: ReadonlyArray<FilterPattern>;
  public readonly nameConverter: Converter<T> | Validator<T>;
  public readonly errorOnInvalidName: boolean;

  /**
   * Constructs a new {@link LibraryData.CollectionFilter | collection filter}.
   * @param params -Initialization {@link LibraryData.ICollectionFilterInitParams | parameters } for a
   * {@link LibraryData.CollectionFilter | collection filter}.
   */
  public constructor(params: ICollectionFilterInitParams<T>) {
    this.included = params.included;
    this.excluded = params.excluded ?? [];
    this.nameConverter = params.nameConverter;
    this.errorOnInvalidName = params.errorOnInvalidName ?? false;
  }

  /**
   * Tests if a name matches a pattern.
   * @param name - The name to test.
   * @param pattern - The pattern to match against (string for exact match, RegExp for pattern match).
   * @returns `true` if the name matches the pattern.
   */
  private static _matchesPattern(name: string, pattern: FilterPattern): boolean {
    if (typeof pattern === 'string') {
      return name === pattern;
    }
    return pattern.test(name);
  }

  /**
   * Tests if a name matches any pattern in a list.
   * @param name - The name to test.
   * @param patterns - The patterns to match against.
   * @returns `true` if the name matches any pattern.
   */
  private static _matchesAnyPattern(name: string, patterns: ReadonlyArray<FilterPattern>): boolean {
    return patterns.some((pattern) => CollectionFilter._matchesPattern(name, pattern));
  }

  /**
   * Tests if a name should be included based on the include/exclude patterns.
   * @param name - The name to test.
   * @returns `true` if the name should be included.
   */
  private _shouldInclude(name: string): boolean {
    // Excluded patterns take precedence
    if (CollectionFilter._matchesAnyPattern(name, this.excluded)) {
      return false;
    }
    // If no include patterns specified, include all (that aren't excluded)
    if (this.included === undefined) {
      return true;
    }
    // Otherwise, must match at least one include pattern
    return CollectionFilter._matchesAnyPattern(name, this.included);
  }

  /**
   * Filters items of an arbitrary type based on their extracted names.
   * @param items - Items to filter.
   * @param extractName - Function to extract the name from an item.
   * @returns `Success` with the {@link LibraryData.IFilteredItem | filtered items} or `Failure` with error messages.
   */
  public filterItems<TITEM>(
    items: ReadonlyArray<TITEM>,
    extractName: (item: TITEM) => Result<string>
  ): Result<ReadonlyArray<IFilteredItem<TITEM, T>>> {
    const errors: MessageAggregator = new MessageAggregator();
    const results: IFilteredItem<TITEM, T>[] = [];
    for (const item of items) {
      extractName(item)
        .onSuccess((extracted) => this.nameConverter.convert(extracted))
        .onSuccess((name) => {
          // Apply include/exclude filtering
          if (!this._shouldInclude(name)) {
            return Success.with(undefined);
          }
          const filteredItem = { name, item };
          results.push(filteredItem);
          return Success.with(filteredItem);
        })
        .onFailure((err) => {
          if (this.errorOnInvalidName) {
            errors.addMessage(`Invalid item name: ${err}`);
          }
          return Failure.with(err);
        });
    }
    return errors.returnOrReport(Success.with(results));
  }

  /**
   * Filters a directory in a `FileTree` using this filter's configuration and optionally supplied parameters.
   * @param dir - Directory to filter.
   * @param params - Optional filtering parameters.
   * @returns
   */
  public filterDirectory(
    dir: FileTree.FileTreeItem,
    params?: IFilterDirectoryParams
  ): Result<ReadonlyArray<IFilteredItem<FileTree.IFileTreeFileItem, T>>> {
    if (dir.type !== 'directory') {
      return Failure.with(`${dir.name}: Not a directory.`);
    }
    const { prefix, recurseWithDelimiter } = params ?? {};
    const nameExtractor = (item: FileTree.FileTreeItem): Result<string> =>
      CollectionFilter.getFileTreeItemName(item, prefix);

    return dir.getChildren().onSuccess((children) => {
      const dirs = children.filter((child) => child.type === 'directory');
      const files = children.filter((child) => child.type === 'file');
      return this.filterItems(files, nameExtractor).onSuccess((filteredFiles) => {
        if (dirs.length === 0 || recurseWithDelimiter === undefined) {
          return Success.with(filteredFiles);
        }
        return mapResults(
          dirs.map((dir) => {
            const newPrefix = `${prefix ?? ''}${dir.name}${recurseWithDelimiter}`;
            const newParams = { ...params, prefix: newPrefix };
            return this.filterDirectory(dir, newParams);
          })
        ).onSuccess((filteredDirItems) => {
          const allItems: ReadonlyArray<IFilteredItem<FileTree.IFileTreeFileItem, T>> = [
            ...filteredFiles,
            ...filteredDirItems.flat()
          ];
          return Success.with(allItems);
        });
      });
    });
  }

  public static getFileTreeItemName(item: FileTree.FileTreeItem, prefix?: string): Result<string> {
    if (prefix) {
      return Success.with(`${prefix}${item.name}`);
    }
    return Success.with(item.name);
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Creates a CollectionFilter from a LibraryLoadSpec.
 *
 * This helper provides a consistent way to convert the various forms of
 * LibraryLoadSpec into a properly configured CollectionFilter.
 *
 * @param filterSpec - The filter specification (true, false, array of IDs, or ILibraryLoadParams)
 * @param nameConverter - Converter for validating collection names
 * @returns A CollectionFilter configured according to the spec
 * @public
 */
export function createFilterFromSpec<TCollectionId extends string>(
  filterSpec: LibraryLoadSpec<TCollectionId>,
  nameConverter: Converter<TCollectionId> | Validator<TCollectionId>
): CollectionFilter<TCollectionId> {
  // true = include all (no include filter, no exclude filter)
  if (filterSpec === true) {
    return new CollectionFilter<TCollectionId>({
      nameConverter
    });
  }

  // false = include nothing (empty include list means nothing matches)
  if (filterSpec === false) {
    return new CollectionFilter<TCollectionId>({
      nameConverter,
      included: []
    });
  }

  // Array of specific IDs to include
  if (Array.isArray(filterSpec)) {
    return new CollectionFilter<TCollectionId>({
      nameConverter,
      included: filterSpec
    });
  }

  // ILibraryLoadParams with include/exclude patterns
  const params = filterSpec as ILibraryLoadParams;
  return new CollectionFilter<TCollectionId>({
    nameConverter,
    included: params.included,
    excluded: params.excluded
  });
}
