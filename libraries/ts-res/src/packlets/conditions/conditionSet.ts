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

import { captureResult, Result } from '@fgv/ts-utils';
import { Condition } from './condition';
import { ConditionSetKey, QualifierName, Validate } from '../common';
import { IValidatedConditionSetDecl } from './conditionSetDecls';

/**
 * Parameters for creating a {@link Conditions.ConditionSet | ConditionSet}.
 * @public
 */
export interface IConditionSetCreateParams {
  conditions: ReadonlyArray<Condition>;
}

/**
 * Represents a set of {@link Conditions.Condition | conditions} that must all be met in some runtime
 * context for a resource instance to be valid.
 * @public
 */
export class ConditionSet implements IValidatedConditionSetDecl {
  /**
   * The {@link Conditions.Condition | conditions} that make up this condition
   * set.
   * @public
   */
  public readonly conditions: ReadonlyArray<Condition>;

  /**
   * Constructor for a {@link Conditions.ConditionSet | ConditionSet} object.
   * @param params - {@link Conditions.IConditionSetCreateParams | Parameters} used to create the condition set.
   */
  protected constructor(params: IConditionSetCreateParams) {
    const qualifiers = new Map<QualifierName, Condition>();
    for (const condition of params.conditions) {
      if (qualifiers.has(condition.qualifier.name)) {
        const existing = qualifiers.get(condition.qualifier.name)?.toString() ?? 'unknown';
        throw new Error(
          `${
            condition.qualifier.name
          }: Duplicate conditions ${existing} and ${condition.toString()} are not supported.`
        );
      }
    }
    this.conditions = Array.from(params.conditions).sort(Condition.compare);
  }

  /**
   * Creates a new {@link Conditions.ConditionSet | ConditionSet} object.
   * @param params - {@link Conditions.IConditionSetCreateParams | Parameters} used to create the condition set.
   * @returns `Success` with the new {@link Conditions.ConditionSet | ConditionSet} object if successful,
   * or `Failure` with an error message if not.
   * @public
   */
  public static create(params: IConditionSetCreateParams): Result<ConditionSet> {
    return captureResult(() => new ConditionSet(params));
  }

  /**
   * Compares two {@link Conditions.ConditionSet | ConditionSets} for sorting purposes.
   * @param cs1 - The first {@link Conditions.ConditionSet | ConditionSet} to compare.
   * @param cs2 - The second {@link Conditions.ConditionSet | ConditionSet} to compare.
   * @returns A negative number if `cs1` should come before `cs2`, a positive
   * number if `cs1` should come after `cs2`, or zero if they are equivalent.
   * @public
   */
  public static compare(cs1: ConditionSet, cs2: ConditionSet): number {
    const len = Math.min(cs1.conditions.length, cs2.conditions.length);
    for (let i = 0; i < len; i++) {
      const diff = Condition.compare(cs1.conditions[i], cs2.conditions[i]);
      if (diff !== 0) {
        return diff;
      }
    }
    return cs1.conditions.length - cs2.conditions.length;
  }

  /**
   * Gets the {@link ConditionSetKey | key} for a supplied {@link Conditions.IValidatedConditionSetDecl | condition set declaration}.
   * @param decl - The {@link Conditions.IValidatedConditionSetDecl | condition set declaration} for which to get the key.
   * @returns `Success` with the condition set key if successful, `Failure` otherwise.
   * @public
   */
  public static getKeyForDecl(decl: IValidatedConditionSetDecl): Result<ConditionSetKey> {
    return Validate.toConditionSetKey(decl.conditions.map((c) => c.toKey()).join('+'));
  }

  /**
   * Gets the {@link ConditionSetKey | key} for this condition set.
   * @returns The key for this condition set.
   */
  public toKey(): ConditionSetKey {
    return ConditionSet.getKeyForDecl(this).orThrow();
  }

  /**
   * Gets a human-readable string representation of this condition set.
   * @returns A string representation of this condition set.
   */
  public toString(): string {
    return this.toKey();
  }
}
