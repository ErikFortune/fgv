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
  fail,
  succeed,
  succeedWithDetail,
  FileTree,
  mapResults
} from '@fgv/ts-utils';
import { Converters as JsonConverters } from '@fgv/ts-json-base';
import { ResourceManager } from '../../resources';
import { IImportable, IImportableJson } from '../importable';
import { IImporter, ImporterResultDetail } from './importer';
import { IReadOnlyQualifierCollector } from '../../qualifiers';
import { FsItem } from '../fsItem';
import { ImportContext } from '../importContext';

export interface IFileTreeImporterCreateParams {
  qualifiers: IReadOnlyQualifierCollector;
  tree?: FileTree.FileTree;
}

export class FileTreeImporter implements IImporter {
  public readonly qualifiers: IReadOnlyQualifierCollector;
  public readonly tree: FileTree.FileTree;

  public readonly types: ReadonlyArray<string> = ['path', 'fsItem'];

  protected constructor(params: IFileTreeImporterCreateParams) {
    this.qualifiers = params.qualifiers;
    this.tree = params.tree ?? FileTree.forFilesystem().orThrow();
  }

  public static create(params: IFileTreeImporterCreateParams): Result<FileTreeImporter> {
    return captureResult(() => new FileTreeImporter(params));
  }

  public import(
    item: IImportable,
    __manager: ResourceManager
  ): DetailedResult<IImportable[], ImporterResultDetail> {
    const { value: fsItem, message } = this._getFileTreeItemFromImportable(item);
    if (message !== undefined) {
      return failWithDetail(message, 'failed');
    }

    const context = (item.context ?? ImportContext.create().orThrow())
      .extend(fsItem.getContext().orThrow())
      .orThrow();

    if (fsItem.item.type === 'directory') {
      return fsItem.item
        .getChildren()
        .onSuccess((children) =>
          mapResults(children.map((child) => FsItem.createForItem(child, this.qualifiers)))
        )
        .onSuccess((items) =>
          succeed(
            items.map((item) => {
              return {
                type: 'fsItem',
                item: item,
                context
              };
            })
          )
        )
        .withDetail('failed', 'consumed');
    } else if (fsItem.item.type === 'file' && fsItem.item.extension === '.json') {
      return fsItem.item
        .getContents(JsonConverters.jsonValue)
        .onSuccess((json) => {
          const jsonItem: IImportableJson = {
            type: 'json',
            json,
            context
          };
          return succeed([jsonItem]);
        })
        .withDetail('failed', 'processed');
    }
    return succeedWithDetail([], 'skipped');
  }

  protected _getFileTreeItemFromImportable(item: IImportable): Result<FsItem> {
    if (item.type === 'ftItem') {
      if ('item' in item && item.item instanceof FsItem) {
        return succeed(item.item);
      }
      return fail(`malformed fsItem importable does not contain a valid item`);
    } else if (item.type === 'path') {
      if ('path' in item && typeof item.path === 'string') {
        return FsItem.createForPath(item.path, this.qualifiers);
      }
      return fail(`malformed path importable does not contain a string path`);
    }
    return fail(`${item.type}: not a valid importable type for a FileTreeImporter`);
  }
}
