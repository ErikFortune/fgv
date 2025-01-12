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
  allBinaryOperators,
  ConditionIndex,
  BinaryOperator,
  ConditionPriority,
  ConditionSetIndex,
  DecisionIndex,
  IBinaryCondition,
  ICondition,
  IConditionSet,
  IDecision,
  UnconditionalOperator,
  allUnconditionalOperators,
  IUnconditionalCondition
} from '../condition';
import { qualifierIndex, qualifierName } from './qualifier';

/**
 * @public
 */
export const conditionIndex: Validator<ConditionIndex> = Validators.number.withBrand('ConditionIndex');

/**
 * @public
 */
export const binaryOperator: Validator<BinaryOperator, unknown> =
  Validators.enumeratedValue<BinaryOperator>(allBinaryOperators);

/**
 * @public
 */
export const unconditionalOperator: Validator<UnconditionalOperator, unknown> =
  Validators.enumeratedValue<UnconditionalOperator>(allUnconditionalOperators);

/**
 * @public
 */
export const conditionPriority: Validator<ConditionPriority> =
  Validators.number.withBrand('ConditionPriority');

/**
 * @public
 */
export const conditionSetIndex: Validator<ConditionSetIndex> =
  Validators.number.withBrand('ConditionSetIndex');

/**
 * @public
 */
export const decisionIndex: Validator<DecisionIndex> = Validators.number.withBrand('DecisionIndex');

/**
 * @public
 */
export const unconditionalCondition: Validator<IUnconditionalCondition> = Validators.object({
  index: conditionIndex.optional(),
  operator: unconditionalOperator
});

/**
 * @public
 */
export const binaryCondition: Validator<IBinaryCondition> = Validators.object({
  index: conditionIndex.optional(),
  priority: conditionPriority,
  qualifierIndex: qualifierIndex,
  operator: binaryOperator,
  value: Validators.string,
  qualifierName: qualifierName.optional()
});

/**
 * @public
 */
export const condition: Validator<ICondition> = Validators.oneOf<ICondition>([
  unconditionalCondition,
  binaryCondition
]);

/**
 * @public
 */
export const conditionSet: Validator<IConditionSet> = Validators.object<IConditionSet>({
  index: conditionSetIndex.optional(),
  conditionIndices: Validators.arrayOf(conditionIndex)
});

/**
 * @public
 */
export const decision: Validator<IDecision> = Validators.object<IDecision>({
  index: decisionIndex.optional(),
  conditionSetIndices: Validators.arrayOf(conditionSetIndex)
});
