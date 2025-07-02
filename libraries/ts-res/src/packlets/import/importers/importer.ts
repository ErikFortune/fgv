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

import { DetailedResult } from '@fgv/ts-utils';
import { IImportable } from '../importable';
import { ResourceManager } from '../../resources';

/**
 * Possible results of an import operation.
 * @public
 */
export type ImporterResultDetail = 'consumed' | 'processed' | 'skipped' | 'failed';

/**
 * Generic interface for an importer than accepts a typed
 * {@link Import.IImportable | importable} item, extracts any resources
 * or candidates from it, and returns an optional list of
 * additional importable items derived from the original.
 * @public
 */
export interface IImporter {
  /**
   * The types of {@link Import.Importable | importable} items that this importer can process.
   */
  readonly types: ReadonlyArray<string>;

  /**
   * Imports an item, extracting any resources or candidates from it and returns an optional
   * list of additional importable items derived from it.
   * @param item - The {@link Import.IImportable | importable} item to import.
   * @param manager - The {@link Resources.ResourceManager | resource manager} to use for the import.
   * @returns `Success` with a list of additional importable items derived from the original, or
   * `Failure` with an error message and a {@link Import.Importers.ImporterResultDetail | result detail}.
   */
  import(item: IImportable, manager: ResourceManager): DetailedResult<IImportable[], ImporterResultDetail>;
}
