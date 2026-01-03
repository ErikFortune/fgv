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

/**
 * Parameters used to filter and validate collections imported from a file tree.
 * @public
 */
export interface ICollectionFilterInitParams<T extends string> {
  readonly included?: ReadonlyArray<string>;
  readonly excluded?: ReadonlyArray<string>;
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
  public readonly included: ReadonlyArray<string> | undefined;
  public readonly excluded: ReadonlyArray<string>;
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
