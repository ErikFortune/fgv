/*
 * Copyright (c) 2025 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { JsonValue } from '@fgv/ts-json-base';
import * as ResourceJson from '../resource-json';
import { ImportContext } from './importContext';
import { FsItem } from './fsItem';

/**
 * Base interface for importable entities.
 * @public
 */
export interface IImportable {
  type: string;
  context?: ImportContext;
}

/**
 * Represents a filesystem path to be imported.
 * @public
 */
export interface IImportablePath extends IImportable {
  type: 'path';
  path: string;
  context?: ImportContext;
}

/**
 * Represents a filesystem item to be imported.
 * @public
 */
export interface IImportableFsItem extends IImportable {
  type: 'fsItem';
  item: FsItem;
  context?: ImportContext;
}

/**
 * Represents some JSON to be imported.
 * @public
 */
export interface IImportableJson extends IImportable {
  type: 'json';
  json: JsonValue;
  context?: ImportContext;
}

/**
 * Represents a resource collection to be imported.
 * @public
 */
export interface IImportableResourceCollection extends IImportable {
  type: 'resourceCollection';
  collection: ResourceJson.Json.IResourceCollectionDecl;
  context?: ImportContext;
}

/**
 * Represents a resource tree to be imported.
 * @public
 */
export interface IImportableResourceTree extends IImportable {
  type: 'resourceTree';
  tree: ResourceJson.Json.IResourceTreeRootDecl;
  context?: ImportContext;
}

/**
 * Type of importable entities.
 * @public
 */
export type Importable =
  | IImportablePath
  | IImportableFsItem
  | IImportableJson
  | IImportableResourceCollection
  | IImportableResourceTree;

/**
 * Type guard for {@link Import.Importable | importables}.
 * @param i - The entity to check.
 * @returns `true` if the supplied {@link Import.IImportable | IImportable} is a
 * {@link Import.Importable | known importable}, `false` otherwise.
 * @public
 */
export function isImportable(i: IImportable): i is Importable {
  return ['path', 'fsItem', 'json', 'resourceCollection', 'resourceTree'].includes(i.type);
}
