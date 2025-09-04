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

import {
  captureResult,
  DetailedResult,
  failWithDetail,
  Result,
  succeedWithDetail,
  FileTree
} from '@fgv/ts-utils';
import { ResourceManagerBuilder } from '../../resources';
import { IImportable } from '../importable';
import { IImporter, ImporterResultDetail } from './importer';
import { IReadOnlyQualifierCollector } from '../../qualifiers';
import { FsItem, FsItemResultDetail } from '../fsItem';

/**
 * Parameters for creating a {@link Import.Importers.PathImporter | PathImporter}.
 * @public
 */
export interface IPathImporterCreateParams {
  qualifiers: IReadOnlyQualifierCollector;
  tree?: FileTree.FileTree;
  ignoreFileTypes?: string[];
}

/**
 * {@link Import.Importers.IImporter | Importer} implementation which imports resources from a `FileTree`
 * given a path.
 * @public
 */
export class PathImporter implements IImporter {
  /**
   * The {@link Qualifiers.IReadOnlyQualifierCollector | qualifier collector} to use for this importer.
   */
  public readonly qualifiers: IReadOnlyQualifierCollector;

  /**
   * The `FileTree` from which resources will be imported.
   */
  public readonly tree: FileTree.FileTree;

  /**
   * The types of {@link Import.IImportable | importables} that this importer can handle.
   */
  public readonly types: ReadonlyArray<string> = ['path'];

  /**
   * The types of files to ignore when importing.  Any file not ignored is converted
   * to an {@link Import.IImportableFsItem | IImportableFsItem}.
   */
  public readonly ignoreFileTypes: string[];

  /**
   * Protected constructor for the {@link Import.Importers.PathImporter | PathImporter}.
   * @param params - Parameters for creating the {@link Import.Importers.PathImporter | PathImporter}.
   */
  protected constructor(params: IPathImporterCreateParams) {
    this.qualifiers = params.qualifiers;
    this.tree = params.tree ?? FileTree.forFilesystem().orThrow();
    this.ignoreFileTypes = params.ignoreFileTypes ?? [];
  }

  /**
   * Creates a new {@link Import.Importers.PathImporter | PathImporter}.
   * @param params - Parameters for creating the {@link Import.Importers.PathImporter | dirPathImporter}.
   * @returns `Success` with the new `PathImporter` if successful, `Failure` with an error message if not.
   */
  public static create(params: IPathImporterCreateParams): Result<PathImporter> {
    return captureResult(() => new PathImporter(params));
  }

  /**
   * {@inheritdoc Import.Importers.IImporter.import}
   */
  public import(
    item: IImportable,
    __manager: ResourceManagerBuilder
  ): DetailedResult<IImportable[], ImporterResultDetail> {
    const {
      value: fsItem,
      message: getTreeMessage,
      detail: getTreeDetail
    } = this._getFileTreeItemFromImportable(item);
    if (getTreeMessage !== undefined) {
      return failWithDetail(getTreeMessage, getTreeDetail === 'skipped' ? 'skipped' : 'failed');
    }

    if (fsItem.item.type === 'file' && this.ignoreFileTypes.includes(fsItem.item.extension)) {
      return succeedWithDetail([], 'processed');
    }

    // extracted characteristics are in the fsItem so add them to the context when
    // that is imported instead of now.
    const context = item.context;

    return succeedWithDetail([{ type: 'fsItem', item: fsItem, context }], 'processed');
  }

  /**
   * Gets an {@link Import.FsItem | FsItem} from an {@link Import.IImportable | importable}.
   * @param item - The importable to convert.
   * @returns `Success` containing the `FsItem` if successful, `Failure` with an error message if not.
   */
  protected _getFileTreeItemFromImportable(item: IImportable): DetailedResult<FsItem, FsItemResultDetail> {
    if (item.type === 'path') {
      if ('path' in item && typeof item.path === 'string') {
        return FsItem.createForPath(item.path, this.qualifiers, this.tree);
      }
      return failWithDetail(`malformed path importable does not contain a string path`, 'failed');
    }
    return failWithDetail(`${item.type}: invalid importable type for a PathImporter`, 'skipped');
  }
}
