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

import { Converters as CommonConverters } from '../common';
import { Converters as RecipeConverters } from '../fillings';
import { IProcedure, IProcedureStep } from './model';
import { Procedure } from './procedure';

/**
 * Converter for {@link Procedures.IProcedureStep | IProcedureStep}.
 * @public
 */
export const procedureStep: Converter<IProcedureStep> = Converters.object<IProcedureStep>({
  order: Converters.number,
  description: Converters.string,
  activeTime: CommonConverters.minutes.optional(),
  waitTime: CommonConverters.minutes.optional(),
  holdTime: CommonConverters.minutes.optional(),
  temperature: CommonConverters.celsius.optional(),
  notes: Converters.string.optional()
});

/**
 * Converter for {@link Procedures.IProcedure | IProcedure} data structure.
 * @public
 */
export const procedureData: Converter<IProcedure> = Converters.object<IProcedure>({
  baseId: CommonConverters.baseProcedureId,
  name: Converters.string,
  description: Converters.string.optional(),
  category: RecipeConverters.fillingCategory.optional(),
  steps: Converters.arrayOf(procedureStep),
  tags: Converters.arrayOf(Converters.string).optional(),
  notes: Converters.string.optional()
});

/**
 * Converter for {@link Procedures.Procedure | Procedure} class instances.
 * @public
 */
export const procedure: Converter<Procedure> = Converters.generic<Procedure>((from: unknown) => {
  return procedureData.convert(from).onSuccess((data) => Procedure.create(data));
});

/**
 * Convenience alias for the procedure converter.
 * @public
 */
export const procedureConverter: Converter<Procedure> = procedure;
