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

import { Validator, Validators } from '@fgv/ts-utils';
import {
  QualifierName,
  QualifierIndex,
  QualifierTypeName,
  IQualifier,
  QualifierTypeIndex,
  QualifierTypeConfig,
  IQualifierType
} from '../qualifier';
import { Validators as JsonValidators } from '@fgv/ts-json-base';

/**
 * @public
 */
export const qualifierName: Validator<QualifierName> = Validators.string.withBrand('QualifierName');

/**
 * @public
 */
export const qualifierIndex: Validator<QualifierIndex> = Validators.number.withBrand('QualifierIndex');

/**
 * @public
 */
export const qualifierTypeName: Validator<QualifierTypeName> =
  Validators.string.withBrand('QualifierTypeName');

/**
 * @public
 */
export const qualifierTypeIndex: Validator<QualifierTypeIndex> =
  Validators.number.withBrand('QualifierTypeIndex');

/**
 * @public
 */
export const qualifierTypeConfig: Validator<QualifierTypeConfig, unknown> =
  JsonValidators.jsonValue.withBrand('QualifierTypeConfig');

/**
 * @public
 */
export const qualifierType: Validator<IQualifierType> = Validators.object<IQualifierType>({
  index: qualifierTypeIndex.optional(),
  name: qualifierTypeName,
  config: qualifierTypeConfig.optional()
});

/**
 * @public
 */
export const qualifier: Validator<IQualifier> = Validators.object<IQualifier>({
  index: qualifierIndex.optional(),
  name: qualifierName,
  qualifierTypeIndex: qualifierTypeIndex
});
