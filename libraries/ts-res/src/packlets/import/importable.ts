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

import * as ResourceJson from '../resource-json';
import { IImportContext } from './importContext';

/**
 * Type of importable entities.
 * @public
 */
export type ImportableType = 'file' | 'resourceCollection' | 'resourceTree' | 'json';

/**
 * Base interface for importable entities.
 * @public
 */
export interface IImportable<T extends ImportableType = ImportableType> {
  type: T;
}

/**
 * Interface for importable files.
 * @public
 */
export interface IImportableFile extends IImportable<'file'> {
  type: 'file';
  path: string;
  context?: IImportContext;
}

/**
 * Interface for importable resource collections.
 * @public
 */
export interface IImportableResourceCollection extends IImportable<'resourceCollection'> {
  type: 'resourceCollection';
  collection: ResourceJson.Json.IResourceCollectionDecl;
  context?: IImportContext;
}

/**
 * Interface for importable resource trees.
 * @public
 */
export interface IImportableResourceTree extends IImportable<'resourceTree'> {
  type: 'resourceTree';
  tree: ResourceJson.Json.IResourceTreeRootDecl;
  context?: IImportContext;
}

/**
 * Type of importable entities.
 * @public
 */
export type Importable = IImportableFile | IImportableResourceCollection | IImportableResourceTree;
