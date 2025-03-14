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
  succeedWithDetail
} from '@fgv/ts-utils';
import { JsonFile } from '@fgv/ts-json-base';
import { ResourceManager } from '../../resources';
import { IImportable, IImportableJson, IImportablePath } from '../importable';
import { IImporter, ImporterResultDetail } from './importer';
import 'path';
import path from 'path';
import fs from 'fs';
import { IReadOnlyQualifierCollector } from '../../qualifiers';
import { FsItem } from '../fsItems';
import { ImportContext } from '../importContext';

export interface IFileSystemImporterCreateParams {
  qualifiers: IReadOnlyQualifierCollector;
}

export class FileSystemImporter implements IImporter {
  public readonly qualifiers: IReadOnlyQualifierCollector;

  public readonly types: ReadonlyArray<string> = ['path', 'fsItem'];

  protected constructor(params: IFileSystemImporterCreateParams) {
    this.qualifiers = params.qualifiers;
  }

  public static create(params: IFileSystemImporterCreateParams): Result<FileSystemImporter> {
    return captureResult(() => new FileSystemImporter(params));
  }

  public import(
    item: IImportable,
    manager: ResourceManager
  ): DetailedResult<IImportable[], ImporterResultDetail> {
    const { value: fsItem, message } = this._getFsItemFromImportable(item);
    if (message !== undefined) {
      return failWithDetail(message, 'failed');
    }

    const items: IImportable[] = [];

    try {
      const context = (item.context ?? ImportContext.create().orThrow())
        .extend(fsItem.getContext().orThrow())
        .orThrow();

      if (fsItem.itemType === 'file') {
        if (path.extname(fsItem.absolutePath) === '.json') {
          return JsonFile.readJsonFileSync(fsItem.absolutePath)
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
        return succeedWithDetail(items, 'skipped');
      } else if (fsItem.itemType === 'directory') {
        const files = fs.readdirSync(fsItem.absolutePath);
        files.forEach((file) => {
          const subItem: IImportablePath = {
            type: 'path',
            path: path.join(fsItem.absolutePath, file),
            context
          };
          items.push(subItem);
        });
        return succeedWithDetail(items, 'consumed');
      }
      return succeedWithDetail(items, 'skipped');
    } catch (e) {
      return failWithDetail(`${fsItem.absolutePath}: import failed - ${e.message}`, 'failed');
    }
  }

  protected _getFsItemFromImportable(item: IImportable): Result<FsItem> {
    if (item.type === 'fsItem') {
      if ('fsItem' in item && item.fsItem instanceof FsItem) {
        return succeed(item.fsItem);
      }
      return fail(`malformed fsItem importable does not contain a valid fsItem`);
    } else if (item.type === 'path') {
      if ('path' in item && typeof item.path === 'string') {
        return FsItem.create(item.path, this.qualifiers);
      }
      return fail(`malformed path importable does not contain a string path`);
    }
    return fail(`${item.type}: not a valid importable type for a FileSystemImporter`);
  }
}
