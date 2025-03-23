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
  succeed,
  succeedWithDetail,
  MessageAggregator
} from '@fgv/ts-utils';
import { Converters as JsonConverters } from '@fgv/ts-json-base';
import { ResourceManager } from '../../resources';
import { IImportable, IImportableJson, Importable } from '../importable';
import { IImporter, ImporterResultDetail } from './importer';
import { IReadOnlyQualifierCollector } from '../../qualifiers';
import { FsItem, FsItemResultDetail } from '../fsItem';

/**
 * Parameters for creating a {@link Import.Importers.FsItemImporter | FsItemImporter}.
 * @public
 */
export interface IFsItemImporterCreateParams {
  qualifiers: IReadOnlyQualifierCollector;
}

/**
 * {@link Import.Importers.IImporter | Importer} implementation which imports resources from a `FileTree`.
 * @public
 */
export class FsItemImporter implements IImporter {
  /**
   * The {@link Qualifiers.IReadOnlyQualifierCollector | qualifier collector} to use for this importer.
   */
  public readonly qualifiers: IReadOnlyQualifierCollector;

  /**
   * The types of {@link Import.IImportable | importables} that this importer can handle.
   */
  public readonly types: ReadonlyArray<string> = ['fsItem'];

  /**
   * Protected constructor for the {@link Import.Importers.FsItemImporter | FsItemImporter}.
   * @param params - Parameters for creating the {@link Import.Importers.FsItemImporter | FsItemImporter}.
   */
  protected constructor(params: IFsItemImporterCreateParams) {
    this.qualifiers = params.qualifiers;
  }

  /**
   * Creates a new {@link Import.Importers.FsItemImporter | FsItemImporter}.
   * @param params - Parameters for creating the {@link Import.Importers.FsItemImporter | FsItemImporter}.
   * @returns `Success` with the new `FsItemImporter` if successful, `Failure` with an error message if not.
   */
  public static create(params: IFsItemImporterCreateParams): Result<FsItemImporter> {
    return captureResult(() => new FsItemImporter(params));
  }

  /**
   * {@inheritdoc Import.Importers.IImporter.import}
   */
  public import(
    item: IImportable,
    __manager: ResourceManager
  ): DetailedResult<IImportable[], ImporterResultDetail> {
    const {
      value: fsItem,
      message: getTreeMessage,
      detail: getTreeDetail
    } = this._getFileTreeItemFromImportable(item);
    if (getTreeMessage !== undefined) {
      return failWithDetail(getTreeMessage, getTreeDetail === 'skipped' ? 'skipped' : 'failed');
    }

    const { value: context, message: getContextMessage } = fsItem.getContext().onSuccess((fsItemContext) => {
      return item.context ? item.context.extend(fsItemContext) : succeed(fsItemContext);
    });

    /* c8 ignore next 3 - defense in depth nearly impossible to reproduce */
    if (getContextMessage) {
      return failWithDetail(getContextMessage, 'failed');
    }

    if (fsItem.item.type === 'directory') {
      return fsItem.item
        .getChildren()
        .onSuccess((children) => {
          const errors = new MessageAggregator();
          const items: Importable[] = [];
          for (const child of children) {
            const { value: item, message, detail } = FsItem.createForItem(child, this.qualifiers);
            if (item) {
              items.push({ type: 'fsItem', item, context });
            } else if (detail !== 'skipped') {
              errors.addMessage(message);
            }
          }
          return errors.returnOrReport(succeed(items));
        })
        .withDetail('failed', 'processed');
    } else if (fsItem.item.type === 'file') {
      if (fsItem.item.extension === '.json') {
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
    }
    /* c8 ignore next 2 - defense in depth near impossible to reproduce */
    return succeedWithDetail([], 'skipped');
  }

  /**
   * Gets an {@link Import.FsItem | FsItem} from an {@link Import.IImportable | importable}.
   * @param item - The importable to convert.
   * @returns `Success` containing the `FsItem` if successful, `Failure` with an error message if not.
   */
  protected _getFileTreeItemFromImportable(item: IImportable): DetailedResult<FsItem, FsItemResultDetail> {
    if (item.type === 'fsItem') {
      if ('item' in item && item.item instanceof FsItem) {
        return succeedWithDetail(item.item, 'succeeded');
      }
      return failWithDetail(`malformed fsItem importable does not contain a valid item`, 'failed');
    }
    return failWithDetail(`${item.type}: invalid importable type for an FsItemImporter`, 'skipped');
  }
}
