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

import { Validate } from '../common';
import { captureResult, Result } from '@fgv/ts-utils';
import { IConditionDecl } from '../conditions';
import { ResourceId } from '../common';

/**
 * Accumulated context of a resource import operation.
 * @public
 */
export interface IImportContext {
  /**
   * Base ID for the import context for resources imported
   * in this context.
   */
  readonly baseId?: ResourceId;
  /**
   * Conditions to be applied to resources imported in this context.
   */
  readonly conditions: IConditionDecl[];
}

/**
 * Class to accumulate context for a resource import operation.
 * @public
 */
export class ImportContext implements IImportContext {
  /**
   * {@inheritdoc Import.IImportContext.baseId}
   */
  public readonly baseId: ResourceId | undefined;

  /**
   * {@inheritdoc Import.IImportContext.conditions}
   */
  public readonly conditions: IConditionDecl[];

  /**
   * Protected {@link Import.ImportContext | import context} for derived classes.
   * Public consumers use {@link Import.ImportContext.create | create} to create new instances.
   * @param baseId - The base {@link ResourceId | resource ID} for the import context.
   * @param conditions - Conditions to be applied to resources imported in this context.
   */
  protected constructor(baseId?: string, conditions?: IConditionDecl[]) {
    this.baseId = Validate.joinOptionalResourceIds(baseId).orThrow();
    this.conditions = conditions ?? [];
  }

  /**
   * Factory method to create a new {@link Import.ImportContext | import context}.
   * @param baseName - The base {@link ResourceId | resource ID} for the import context.
   * @param conditions - Conditions to be applied to resources imported in this context.
   * @returns `Success` with the new {@link Import.ImportContext | import context} if successful,
   * or `Failure` with an error message if creation fails.
   */
  public static create(baseName?: string, conditions?: IConditionDecl[]): Result<ImportContext> {
    return captureResult(() => new ImportContext(baseName, conditions));
  }

  /**
   * Adds conditions to the import context.
   * @param conditions - Conditions to be added to the import context.
   * @returns `Success` with a new {@link Import.ImportContext | import context} containing the added conditions
   * if successful, or `Failure` with an error message if the operation fails.
   */
  public withConditions(conditions: IConditionDecl[]): Result<ImportContext> {
    return ImportContext.create(this.baseId, [...this.conditions, ...conditions]);
  }

  /**
   * Appends names to the base ID of the import context.
   * @param name - The base name to set.
   * @returns `Success` with a new {@link Import.ImportContext | import context} containing the new base ID
   * if successful, or `Failure` with an error message if the operation fails.
   */
  public withName(...names: string[]): Result<ImportContext> {
    return Validate.joinResourceIds(this.baseId, ...names).onSuccess((id) => {
      return ImportContext.create(id, this.conditions);
    });
  }
}
