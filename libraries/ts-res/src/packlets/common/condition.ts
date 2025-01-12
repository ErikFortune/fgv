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

import { Brand } from '@fgv/ts-utils';
import { QualifierIndex, QualifierName } from './qualifier';

/**
 * @public
 */
export type ConditionIndex = Brand<number, 'ConditionIndex'>;

/**
 * @public
 */
export type BinaryOperator = 'matches';

/**
 * @public
 */
export const allBinaryOperators: BinaryOperator[] = ['matches'];

/**
 * @public
 */
export type UnconditionalOperator = 'always' | 'never';

/**
 * @public
 */
export const allUnconditionalOperators: UnconditionalOperator[] = ['always', 'never'];

/**
 * @public
 */
export type ConditionOperator = UnconditionalOperator | BinaryOperator;

/**
 * Determines if a supplied operator is a {@link BinaryOperator | BinaryOperator}.
 * @param operator - the operator to test
 * @returns `true` if the operator is a {@link BinaryOperator | BinaryOperator}, `false` otherwise.
 * @public
 */
export function isUnconditionalOperator(operator: ConditionOperator): operator is UnconditionalOperator {
  return allUnconditionalOperators.includes(operator as UnconditionalOperator);
}

/**
 * Determines if a supplied operator is a {@link BinaryOperator | BinaryOperator}.
 * @param operator - the operator to test
 * @returns `true` if the operator is a {@link BinaryOperator | BinaryOperator}, `false` otherwise.
 * @public
 */
export function isBinaryOperator(operator: ConditionOperator): operator is BinaryOperator {
  return allBinaryOperators.includes(operator as BinaryOperator);
}

/**
 * @public
 */
export type ConditionPriority = Brand<number, 'ConditionPriority'>;

/**
 * @public
 */
export type ConditionSetIndex = Brand<number, 'ConditionSetIndex'>;

/**
 * @public
 */
export type DecisionIndex = Brand<number, 'DecisionIndex'>;

/**
 * @public
 */
export interface IUnconditionalCondition {
  index?: ConditionIndex;
  operator: UnconditionalOperator;
}

/**
 * @public
 */
export interface IBinaryCondition {
  index?: ConditionIndex;
  priority: ConditionPriority;
  qualifierIndex: QualifierIndex;
  operator: BinaryOperator;
  value: string;
  qualifierName?: QualifierName;
}

/**
 * @public
 */
export type ICondition = IUnconditionalCondition | IBinaryCondition;

/**
 * @public
 */
export function isUnconditionalCondition(condition: ICondition): condition is IUnconditionalCondition {
  return isUnconditionalOperator((condition as IUnconditionalCondition).operator);
}

/**
 * @public
 */
export function isBinaryCondition(condition: ICondition): condition is IBinaryCondition {
  return isBinaryOperator((condition as IBinaryCondition).operator);
}

/**
 * @public
 */
export interface IConditionSet {
  index?: ConditionSetIndex;
  conditionIndices: ConditionIndex[];
}

/**
 * @public
 */
export interface IDecision {
  index?: DecisionIndex;
  conditionSetIndices: ConditionSetIndex[];
}
