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
 * Converters for procedure types.
 * @packageDocumentation
 */

import { Converter, Converters } from '@fgv/ts-utils';

import { Converters as CommonConverters } from '../../common';
import { Converters as TaskConverters } from '../tasks';
import { IProcedureEntity, IProcedureStepEntity } from './model';

/**
 * Converter for {@link Entities.Procedures.IProcedureStepEntity | IProcedureStepEntity}.
 * @public
 */
export const procedureStepEntity: Converter<IProcedureStepEntity> =
  Converters.strictObject<IProcedureStepEntity>({
    order: Converters.number,
    task: TaskConverters.taskEntityInvocation,
    activeTime: CommonConverters.minutes.optional(),
    waitTime: CommonConverters.minutes.optional(),
    holdTime: CommonConverters.minutes.optional(),
    temperature: CommonConverters.celsius.optional(),
    notes: Converters.arrayOf(CommonConverters.categorizedNote).optional()
  });

/**
 * Converter for {@link Entities.Procedures.IProcedureEntity | IProcedureEntity} data structure.
 * @public
 */
export const procedureEntity: Converter<IProcedureEntity> = Converters.strictObject<IProcedureEntity>({
  baseId: CommonConverters.baseProcedureId,
  name: Converters.string,
  description: Converters.string.optional(),
  category: CommonConverters.procedureType.optional(),
  steps: Converters.arrayOf(procedureStepEntity),
  tags: Converters.arrayOf(Converters.string).optional(),
  notes: Converters.arrayOf(CommonConverters.categorizedNote).optional()
});
