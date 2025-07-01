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

import { captureResult, MessageAggregator, Result, succeed } from '@fgv/ts-utils';
import {
  ConditionOperator,
  NoMatch,
  PerfectMatch,
  QualifierConditionValue,
  QualifierContextValue,
  QualifierMatchScore,
  Convert as CommonConverters
} from '../common';

/**
 * Declares a hierarchy of literal values. The keys are the names of the values, and the
 * values are the names of their parents.
 * @remarks
 * The hierarchy is defined as a tree, where each value can have multiple children but
 * only one parent. The root of the tree has no parent. The hierarchy is used to determine
 * the relationship between values when matching conditions and contexts.
 * @public
 */
export type LiteralValueHierarchyDecl<T extends string> = Partial<Record<T, T>>;

/**
 * Describes a single valid literal value including optional parent and child values.
 * {@link QualifierTypes.LiteralValueHierarchy | LiteralValueHierarchy}.
 * @public
 */
export interface ILiteralValue<T extends string> {
  readonly name: T;
  readonly parent?: ILiteralValue<T>;
  readonly children?: ReadonlyArray<T>;
}

/**
 * Describes the parameters used to create a new
 * {@link QualifierTypes.LiteralValueHierarchy | LiteralValueHierarchy}.
 * @public
 */
export interface ILiteralValueHierarchyCreateParams<T extends string = string> {
  values: ReadonlyArray<T>;
  hierarchy?: LiteralValueHierarchyDecl<T>;
}

interface ILiteralValueBuilder<T extends string> {
  readonly name: T;
  parent?: ILiteralValue<T>;
  children?: T[];
}

/**
 * A class that implements a hierarchy of literal values. The hierarchy is defined as a
 * tree, where each value can have multiple children but only one parent. The root of the
 * tree has no parent. The hierarchy is used to determine the relationship between values
 * when matching conditions and contexts.
 * @public
 */
export class LiteralValueHierarchy<T extends string = string> {
  /**
   * A map of all allowed literal values to the corresponding
   * {@link QualifierTypes.ILiteralValue | ILiteralValue} validated
   * definition.
   */
  public readonly values: ReadonlyMap<T, ILiteralValue<T>>;

  protected constructor(params: ILiteralValueHierarchyCreateParams<T>) {
    this.values = LiteralValueHierarchy._buildValuesFromHierarchy(params).orThrow();
  }

  /**
   * Creates a new {@link QualifierTypes.LiteralValueHierarchy | LiteralValueHierarchy} instance.
   * @param params - The {@link QualifierTypes.ILiteralValueHierarchyCreateParams} used to create the hierarchy.
   * @returns `Success` with the new {@link QualifierTypes.LiteralValueHierarchy | hierarchy} or `Failure`
   * with an error message.
   */
  public static create<T extends string>(
    params: ILiteralValueHierarchyCreateParams<T>
  ): Result<LiteralValueHierarchy<T>> {
    return captureResult(() => new LiteralValueHierarchy(params));
  }

  /**
   * Checks if a value exists in the hierarchy.
   * @param value - The value to check.
   * @returns `true` if the value exists in the hierarchy, `false` otherwise.
   */
  public hasValue(value: T): boolean {
    return this.values.has(value);
  }

  /**
   * Gets all root values (values with no parent) in the hierarchy.
   * @returns An array of root values.
   */
  public getRoots(): T[] {
    return Array.from(this.values.values())
      .filter((v) => !v.parent)
      .map((v) => v.name);
  }

  /**
   * Gets all ancestors of a value in the hierarchy.
   * @param value - The value to get ancestors for.
   * @returns An array of ancestor values, ordered from immediate parent to root.
   */
  public getAncestors(value: T): T[] {
    const ancestors: T[] = [];
    let current = this.values.get(value);

    while (current?.parent) {
      ancestors.push(current.parent.name);
      current = current.parent;
    }

    return ancestors;
  }

  /**
   * Gets all descendants of a value in the hierarchy.
   * @param value - The value to get descendants for.
   * @returns An array of descendant values.
   */
  public getDescendants(value: T): T[] {
    const descendants: T[] = [];
    const current = this.values.get(value);

    if (current?.children) {
      for (const childName of current.children) {
        descendants.push(childName);
        descendants.push(...this.getDescendants(childName));
      }
    }

    return descendants;
  }

  public match(condition: T, context: T): QualifierMatchScore;
  /**
   * Matches a condition value against a context value, where an exact match of the condition and
   * context returns {@link PerfectMatch | PerfectMatch}, a condition value that does not
   * match the context value or any of its ancestors returns {@link NoMatch | NoMatch}, and
   * a condition value that matches the context value or any of its ancestors returns a positive
   * score that is less than {@link PerfectMatch | PerfectMatch}, with the score decreasing
   * with each ancestor in the hierarchy.
   * @remarks
   * @param condition - The condition value to match.
   * @param context - The context value to match against.
   * @param __operator - The operator used for matching (not used in this implementation).
   * @returns A {@link QualifierMatchScore | QualifierMatchScore} indicating the match score.
   */
  public match(
    condition: QualifierConditionValue,
    context: QualifierContextValue,
    __operator?: ConditionOperator
  ): QualifierMatchScore;
  public match(condition: string, context: string, __operator?: ConditionOperator): QualifierMatchScore {
    // Validate that both condition and context exist in the hierarchy
    if (!this.values.has(condition as T)) {
      return NoMatch;
    }
    if (!this.values.has(context as T)) {
      return NoMatch;
    }

    if ((condition as string) === (context as string)) {
      return PerfectMatch;
    }

    const values: ReadonlyMap<string, ILiteralValue<string>> = this.values;
    /* c8 ignore next 1 - ? is defense in depth */
    let value = values.get(context)?.parent;
    if (!value) {
      return NoMatch;
    }
    let score = PerfectMatch as number;
    while (value) {
      score *= 0.9;
      if (value.name === condition) {
        return CommonConverters.qualifierMatchScore.convert(score).orDefault(NoMatch);
      }
      value = value.parent;
    }
    return NoMatch;
  }

  protected static _buildValuesFromHierarchy<T extends string>(
    params: ILiteralValueHierarchyCreateParams<T>
  ): Result<ReadonlyMap<T, ILiteralValue<T>>> {
    const errors = new MessageAggregator();
    const values = params.values;
    const hierarchy = params.hierarchy ?? {};

    const valueMap = new Map<T, ILiteralValueBuilder<T>>(values.map((name) => [name, { name }]));

    if (hierarchy) {
      for (const [valueName, parentName] of Object.entries(hierarchy)) {
        const value = valueMap.get(valueName as T);
        if (!value) {
          errors.addMessage(`${valueName}: invalid literal value.`);
          continue;
        }

        const parent = valueMap.get(parentName as T);
        if (!parent) {
          errors.addMessage(`${valueName}: parent ${parentName} is not a valid literal value.`);
          continue;
        }

        let ancestor = parent.parent;
        let circular = false;
        const ancestors: T[] = [];

        while (ancestor) {
          ancestors.push(ancestor.name);
          if (ancestor.parent === parent || ancestor.parent === value) {
            errors.addMessage(`${valueName}: Circular reference detected: ${ancestors.join('->')}`);
            circular = true;
            break;
          }
          ancestor = ancestor.parent;
        }

        if (circular) {
          continue;
        }

        value.parent = parent;
        if (parent.children) {
          parent.children.push(value.name);
        } else {
          parent.children = [value.name];
        }
      }
    }

    return errors.returnOrReport(succeed(valueMap));
  }
}
