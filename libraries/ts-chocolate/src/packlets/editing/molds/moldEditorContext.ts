// Copyright (c) 2026 Erik Fortune
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

/**
 * Mold editor context implementation
 * @packageDocumentation
 */

import { Result, Success } from '@fgv/ts-utils';
import { ValidatingEditorContext } from '../validatingEditorContext';
import { EditableCollection } from '../editableCollection';
import { Molds, Converters as EntityConverters } from '../../entities';
import { BaseMoldId, Converters as CommonConverters, MoldId } from '../../common';
import { validateMoldEntity } from './validators';

type IMoldEntity = Molds.IMoldEntity;

// ============================================================================
// Mold Editor Context
// ============================================================================

/**
 * Editor context specialized for Mold entities.
 * Extends ValidatingEditorContext to provide both pre-validated (base)
 * and raw input (validating) methods for mold CRUD operations.
 * @public
 */
export class MoldEditorContext extends ValidatingEditorContext<IMoldEntity, BaseMoldId, MoldId> {
  /**
   * Create a mold editor context from a collection.
   * @param collection - Mutable collection of molds
   * @returns Result containing the editor context or failure
   * @public
   */
  public static createFromCollection(
    collection: EditableCollection<IMoldEntity, BaseMoldId>
  ): Result<MoldEditorContext> {
    return ValidatingEditorContext.createValidating<IMoldEntity, BaseMoldId, MoldId>({
      collection,
      entityConverter: EntityConverters.Molds.moldEntity,
      keyConverter: CommonConverters.baseMoldId,
      semanticValidator: validateMoldEntity,
      createId: CommonConverters.moldId,
      /* c8 ignore next 1 - getBaseId reserved for future use by EditorContext but not yet called */
      getBaseId: (mold: IMoldEntity) => mold.baseId,
      getName: (mold: IMoldEntity) => `${mold.manufacturer} ${mold.productNumber}`
    }).onSuccess((baseContext) => {
      // Wrap in mold-specific context
      return Success.with(
        Object.setPrototypeOf(baseContext, MoldEditorContext.prototype) as MoldEditorContext
      );
    });
  }

  /**
   * Get the mold display name for display purposes.
   * @param mold - Mold to get display name from
   * @returns Display name combining manufacturer and product number
   * @public
   */
  public getMoldDisplayName(mold: IMoldEntity): string {
    return `${mold.manufacturer} ${mold.productNumber}`;
  }

  /**
   * Get the mold format.
   * @param mold - Mold to get format from
   * @returns Mold format
   * @public
   */
  public getMoldFormat(mold: IMoldEntity): string {
    return mold.format;
  }
}
