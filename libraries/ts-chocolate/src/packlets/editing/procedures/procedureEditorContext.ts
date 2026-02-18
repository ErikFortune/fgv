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
 * Procedure editor context implementation
 * @packageDocumentation
 */

import { Result, Success } from '@fgv/ts-utils';

import { BaseProcedureId, Converters as CommonConverters, ProcedureId } from '../../common';
import { EditableCollection } from '../editableCollection';
import { ValidatingEditorContext } from '../validatingEditorContext';
import { Procedures, Converters as EntityConverters } from '../../entities';
import { validateProcedureEntity } from './validators';

type IProcedureEntity = Procedures.IProcedureEntity;

/**
 * Editor context specialized for procedure entities.
 * @public
 */
export class ProcedureEditorContext extends ValidatingEditorContext<
  IProcedureEntity,
  BaseProcedureId,
  ProcedureId
> {
  /**
   * Create a procedure editor context from a collection.
   * @param collection - Mutable collection of procedures
   * @returns Result containing the editor context or failure
   * @public
   */
  public static createFromCollection(
    collection: EditableCollection<IProcedureEntity, BaseProcedureId>
  ): Result<ProcedureEditorContext> {
    return ValidatingEditorContext.createValidating<IProcedureEntity, BaseProcedureId, ProcedureId>({
      collection,
      entityConverter: EntityConverters.Procedures.procedureEntity,
      keyConverter: CommonConverters.baseProcedureId,
      semanticValidator: validateProcedureEntity,
      createId: CommonConverters.procedureId,
      getName: (procedure: IProcedureEntity) => procedure.name
    }).onSuccess((baseContext) => {
      return Success.with(
        Object.setPrototypeOf(baseContext, ProcedureEditorContext.prototype) as ProcedureEditorContext
      );
    });
  }
}
