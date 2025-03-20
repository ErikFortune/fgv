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
  FileTree,
  mapResults,
  Result,
  fail,
  succeed,
  failWithDetail
} from '@fgv/ts-utils';
import { Helpers as CommonHelpers, Validate } from '../common';
import * as Conditions from '../conditions';
import { IReadOnlyQualifierCollector } from '../qualifiers';
import { ImportContext } from './importContext';

/**
 * Result details for {@link Import.FsItem | FsItem} operations.
 * @public
 */
export type FsItemResultDetail = 'failed' | 'skipped' | 'succeeded';

/**
 * Interface describing some single file system item.
 * @public
 */
export interface IFsItemProps {
  /**
   * The underlying `FileTreeItem` for this item.
   */
  readonly item: FileTree.FileTreeItem;

  /**
   * The base name of the file system item, once
   * any conditions set tokens have been removed.
   */
  readonly baseName: string;

  /**
   * {@link Conditions.IValidatedConditionDecl | Conditions} extracted
   * from the base name of the {@link Import.FsItem | FsItem}.
   */
  readonly conditions: Conditions.IValidatedConditionDecl[];
}

/**
 * Class describing some file system item to be imported.
 * @public
 */
export class FsItem implements IFsItemProps {
  /**
   * {@inheritDoc Import.IFsItemProps.baseName}
   */
  public readonly baseName: string;

  /**
   * {@inheritDoc Import.IFsItemProps.conditions}
   */
  public readonly conditions: Conditions.IValidatedConditionDecl[];

  /**
   * {@inheritDoc Import.IFsItemProps.item}
   */
  public readonly item: FileTree.FileTreeItem;

  /**
   * The {@link Qualifiers.IReadOnlyQualifierCollector | qualifiers} to use for this item.
   */
  public readonly qualifiers: IReadOnlyQualifierCollector;

  /**
   * Protected constructor creates a new {@link Import.FsItem | FsItem}.
   * @param props - The {@link Import.IFsItemProps | file system item properties} to use for this item.
   * @param qualifiers - The {@link Qualifiers.IReadOnlyQualifierCollector | qualifiers} used to parse
   * embedded condition set tokens.
   * @param tree - file tree implementation to use for this item.
   * @returns `Success` containing the new {@link Import.FsItem | FsItem} if successful, or a `Failure`
   * containing an error message if not.
   */
  protected constructor(props: IFsItemProps, qualifiers: IReadOnlyQualifierCollector) {
    const { baseName, conditions, item } = props;
    this.baseName = baseName;
    this.conditions = conditions;
    this.item = item;
    this.qualifiers = qualifiers;
  }

  /**
   * Creates a new {@link Import.FsItem | FsItem} from a `FileTreeItem`.
   * @param item - The `FileTreeItem` to import.
   * @param qualifiers - The {@link Qualifiers.IReadOnlyQualifierCollector | qualifiers} used to parse
   * embedded condition set tokens.
   * @returns `Success` containing the new {@link Import.FsItem | FsItem} if successful, or a `Failure`
   * containing an error message if not.  Note that the result detail `skipped` indicates that the item
   * was not created because it is not relevant - this is a soft error that should be silently ignored.
   */
  public static createForItem(
    item: FileTree.FileTreeItem,
    qualifiers: IReadOnlyQualifierCollector
  ): DetailedResult<FsItem, FsItemResultDetail> {
    const baseName: string = item.type === 'file' ? item.baseName : item.name;

    if (item.type === 'file' && item.extension !== '.json') {
      return failWithDetail(`${item.absolutePath}: not a JSON file`, 'skipped');
    }

    return FsItem.tryParseBaseName(baseName, qualifiers)
      .withErrorFormat((msg) => `${baseName}: error extracting conditions - ${msg}`)
      .onSuccess(({ baseName: newBaseName, conditions }) => {
        return captureResult(() => new FsItem({ baseName: newBaseName, conditions, item }, qualifiers));
      })
      .withDetail('failed', 'succeeded');
  }

  /**
   * Creates a new {@link Import.FsItem | FsItem} from a file system path.
   * @param importPath - The path to the file system item to import.
   * @param qualifiers - The {@link Qualifiers.IReadOnlyQualifierCollector | qualifiers} used to parse
   * embedded condition set tokens.
   * @param fs - An optional {@link Import.IImporterFilesystem | file system implementation} to use for this item.
   * @returns `Success` containing the new {@link Import.FsItem | FsItem} if an item is created
   * successfully, or a `Failure` containing an error message if it is not.  Note that the result detail
   * `skipped` indicates that the item was not created because it is not relevant - this is a soft error
   * that should be silently ignored.
   */
  public static createForPath(
    importPath: string,
    qualifiers: IReadOnlyQualifierCollector,
    tree?: FileTree.FileTree
  ): DetailedResult<FsItem, FsItemResultDetail> {
    if (tree === undefined) {
      const treeResult = FileTree.forFilesystem();
      /* c8 ignore next 3 - defense in depth should never happen */
      if (treeResult.isFailure()) {
        return failWithDetail(treeResult.message, 'failed');
      }
      tree = treeResult.value;
    }

    return tree
      .getItem(importPath)
      .withDetail<FsItemResultDetail>('failed')
      .onSuccess((item) => FsItem.createForItem(item, qualifiers));
  }

  /**
   * Tries to parse a base name into a base name and a set of conditions.
   * @param baseName - The base name to parse.
   * @param qualifiers - The {@link Qualifiers.IReadOnlyQualifierCollector | qualifiers} used to parse
   * embedded condition set tokens.
   * @returns `Success` containing the parsed base name and conditions on success, or `Failure` containing
   * an error message if it is not.
   */
  public static tryParseBaseName(
    baseName: string,
    qualifiers: IReadOnlyQualifierCollector
  ): Result<Omit<IFsItemProps, 'item'>> {
    const nameParts = baseName.split('.');
    const segmentToTest = nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0];
    const validatedConditions = CommonHelpers.parseConditionSetTokenParts(segmentToTest).onSuccess(
      (parts) => {
        return mapResults(
          parts.map((part) => Conditions.ConditionTokens.validateConditionTokenParts(part, qualifiers))
        ).onFailure((msg) => {
          if (parts.length === 1 && parts[0].qualifier === undefined) {
            return succeed([]);
          }
          return fail(msg);
        });
      }
    );
    if (validatedConditions.isFailure()) {
      return fail(validatedConditions.message);
    }
    const conditions = validatedConditions.value;
    if (conditions.length > 0) {
      baseName = nameParts.filter((s) => s !== segmentToTest).join('.');
    }
    return succeed({ baseName, conditions });
  }

  /**
   * Gets the context for this file system item.
   * @returns `Success` containing the {@link Import.ImportContext | import context} for this item
   * if successful, or a `Failure` containing an error message if an error occurs.
   */
  public getContext(): Result<ImportContext> {
    return Validate.toOptionalResourceId(this.baseName).onSuccess((baseId) => {
      const conditions = this.conditions.map((c) => {
        return {
          qualifierName: c.qualifier.name,
          value: c.value,
          operator: c.operator,
          priority: c.priority
        };
      });
      return ImportContext.create({ baseId, conditions });
    });
  }
}
