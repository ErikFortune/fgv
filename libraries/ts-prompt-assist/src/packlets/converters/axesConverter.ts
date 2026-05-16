/*
 * Copyright (c) 2026 Erik Fortune
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

import { Converter, Converters, succeed } from '@fgv/ts-utils';
import type { IQualifierDecl } from '../types';

const qualifierDeclConverter: Converter<IQualifierDecl> = Converters.object<IQualifierDecl>({
  name: Converters.string,
  typeName: Converters.string,
  defaultPriority: Converters.number,
  token: Converters.string.optional(),
  tokenIsOptional: Converters.boolean.optional(),
  defaultValue: Converters.string.optional()
});

/**
 * Converter for `_qualifiers.yaml` root-level qualifier configuration.
 * Expects the YAML file to have shape `{ qualifiers: [...] }`.
 * @public
 */
export const qualifierDeclsConverter: Converter<ReadonlyArray<IQualifierDecl>> = Converters.object({
  qualifiers: Converters.arrayOf(qualifierDeclConverter)
}).map((obj) => succeed(obj.qualifiers));
