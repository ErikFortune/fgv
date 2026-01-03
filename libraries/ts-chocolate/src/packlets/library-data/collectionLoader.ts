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

import { Converter, mapResults, pick, Result } from '@fgv/ts-utils';
import { FileTree, JsonObject } from '@fgv/ts-json-base';
import { CollectionFilter, ICollectionFilterInitParams, IFilterDirectoryParams } from './collectionFilter';
import { ICollection, MutabilitySpec } from './model';
import * as LibraryConverters from './converters';

/**
 * Parameters used to initialize a {@link LibraryData.CollectionLoader | CollectionLoader}.
 * @public
 */
export interface ICollectionLoaderInitParams<
  T,
  TCOLLECTIONID extends string = string,
  TITEMID extends string = string
> {
  readonly itemConverter: Converter<T>;
  readonly collectionIdConverter: Converter<TCOLLECTIONID>;
  readonly itemIdConverter: Converter<TITEMID>;
  /**
   * Optional converter to transform file names before applying the collection ID converter.
   * Defaults to {@link LibraryData.Converters.removeJsonExtension | removeJsonExtension}.
   */
  readonly fileNameConverter?: Converter<string>;
  /**
   * Default mutability specification for loaded collections.
   * Defaults to `false` (all collections immutable).
   */
  readonly mutable?: MutabilitySpec;
}

/**
 * Parameters used to load collections from a file tree.
 * @public
 */
export interface ILoadCollectionFromFileTreeParams<TCOLLECTIONID extends string>
  extends Omit<ICollectionFilterInitParams<TCOLLECTIONID>, 'nameConverter'> {
  readonly recurseWithDelimiter?: string;
  /**
   * Overrides the default mutability specification for this load operation.
   * If not specified, uses the loader's default.
   */
  readonly mutable?: MutabilitySpec;
}

/**
 * Loads collections from a file tree, validating with supplied converters and filtering as specified.
 * @public
 */
export class CollectionLoader<
  T = JsonObject,
  TCOLLECTIONID extends string = string,
  TITEMID extends string = string
> {
  private readonly _fileNameToCollectionIdConverter: Converter<TCOLLECTIONID>;
  private readonly _collectionIdConverter: Converter<TCOLLECTIONID>;
  private readonly _itemIdConverter: Converter<TITEMID>;
  private readonly _itemConverter: Converter<T>;
  private readonly _mutableDefault: MutabilitySpec;
  private readonly _collectionConverter: Converter<ICollection<T, TCOLLECTIONID, TITEMID>>;

  public constructor(params: ICollectionLoaderInitParams<T, TCOLLECTIONID, TITEMID>) {
    this._collectionIdConverter = params.collectionIdConverter;
    // For file names, first apply file name converter (default: remove .json), then collection ID converter
    const fileNameConverter = params.fileNameConverter ?? LibraryConverters.removeJsonExtension;
    this._fileNameToCollectionIdConverter = fileNameConverter.mapConvert(this._collectionIdConverter);
    this._itemIdConverter = params.itemIdConverter;
    this._itemConverter = params.itemConverter;
    this._mutableDefault = params.mutable ?? false;
    this._collectionConverter = LibraryConverters.collection({
      itemConverter: this._itemConverter,
      itemIdConverter: this._itemIdConverter,
      collectionIdConverter: this._collectionIdConverter
    });
  }

  /**
   * Loads collections from a `FileTree` using optional filtering parameters.
   * @param fileTree - The `FileTree` from which to load collections.
   * @param params - optional {@link LibraryData.ILoadCollectionFromFileTreeParams | parameters} to control filtering
   * and recursion.
   * @returns
   */
  public loadFromFileTree(
    fileTree: FileTree.FileTreeItem,
    params?: ILoadCollectionFromFileTreeParams<TCOLLECTIONID>
  ): Result<ReadonlyArray<ICollection<T, TCOLLECTIONID, TITEMID>>> {
    params = params ?? {};
    const mutabilitySpec = params.mutable ?? this._mutableDefault;
    const filterParams: ICollectionFilterInitParams<TCOLLECTIONID> = {
      ...pick(params, ['included', 'excluded', 'errorOnInvalidName']),
      nameConverter: this._fileNameToCollectionIdConverter
    };
    const dirParams: IFilterDirectoryParams = pick(params, ['recurseWithDelimiter']);
    const filter = new CollectionFilter<TCOLLECTIONID>(filterParams);
    return filter.filterDirectory(fileTree, dirParams).onSuccess((filteredItems) => {
      return mapResults(
        filteredItems.map((item) => {
          return item.item.getContents().onSuccess((json) => {
            return this._collectionConverter.convert({
              id: item.name,
              isMutable: this._isMutable(item.name, mutabilitySpec),
              items: json
            });
          });
        })
      );
    });
  }

  /**
   * Determines if a collection is mutable based on its ID and the mutability specification.
   * @param id - The collection ID.
   * @param spec - The mutability specification.
   * @returns `true` if the collection is mutable, `false` otherwise.
   */
  private _isMutable(id: TCOLLECTIONID, spec: MutabilitySpec): boolean {
    if (typeof spec === 'boolean') {
      return spec;
    }
    if ('immutable' in spec) {
      // Object with 'immutable' property means only those are immutable, rest are mutable
      return !spec.immutable.includes(id);
    }
    // Array means only these are mutable
    return spec.includes(id);
  }
}
