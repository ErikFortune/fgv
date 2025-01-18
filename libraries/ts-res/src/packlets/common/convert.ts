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

import { Converters } from '@fgv/ts-utils';
import { allConditionOperators, Conditions } from './conditions';
import { Resources } from './resources';

/* eslint-disable @rushstack/typedef-var */

/**
 * `Converter` which validates an `unknown` value as a {@link QualifierName | QualifierName}.
 * @public
 */
export const qualifierName = Converters.string.map(Conditions.toQualifierName);

/**
 * `Converter` which validates an `unknown` value as a {@link QualifierIndex | QualifierIndex}.
 * @public
 */
export const qualifierIndex = Converters.number.map(Conditions.toQualifierIndex);

/**
 * `Converter` which validates an `unknown` value as a {@link QualifierTypeName | QualifierTypeName}.
 * @public
 */
export const qualifierTypeName = Converters.string.map(Conditions.toQualifierTypeName);

/**
 * `Converter` which validates an `unknown` value as a {@link QualifierTypeIndex | QualifierTypeIndex}.
 * @public
 */
export const qualifierTypeIndex = Converters.number.map(Conditions.toQualifierTypeIndex);

/**
 * `Converter` which validates an `unknown` value as a {@link ConditionPriority | ConditionPriority}.
 * @public
 */
export const conditionPriority = Converters.number.map(Conditions.toPriority);

/**
 * `Converter` which validates an `unknown` value as a {@link ConditionOperator | ConditionOperator}.
 * @public
 */
export const conditionOperator = Converters.enumeratedValue(allConditionOperators);

/**
 * `Converter` which validates an `unknown` value as a {@link ConditionIndex | ConditionIndex}.
 * @public
 */
export const conditionIndex = Converters.number.map(Conditions.toConditionIndex);

/**
 * `Converter` which validates an `unknown` value as a {@link ConditionSetIndex | ConditionSetIndex}.
 * @public
 */
export const conditionSetIndex = Converters.number.map(Conditions.toConditionSetIndex);

/**
 * `Converter` which validates an `unknown` value as a {@link ResourceId | ResourceId}.
 * @public
 */
export const resourceId = Converters.string.map(Resources.toResourceId);

/**
 * `Converter` which validates an `unknown` value as a {@link ResourceName | ResourceName}.
 * @public
 */
export const resourceName = Converters.string.map(Resources.toResourceName);

/**
 * `Converter` which validates an `unknown` value as a {@link ResourceIndex | ResourceIndex}.
 * @public
 */
export const resourceIndex = Converters.number.map(Resources.toResourceIndex);

/**
 * `Converter` which validates an `unknown` value as a {@link ResourceTypeName | ResourceTypeName}.
 * @public
 */
export const resourceTypeName = Converters.string.map(Resources.toResourceTypeName);

/**
 * `Converter` which validates an `unknown` value as a {@link ResourceTypeIndex | ResourceTypeIndex}.
 * @public
 */
export const resourceTypeIndex = Converters.number.map(Resources.toResourceTypeIndex);
