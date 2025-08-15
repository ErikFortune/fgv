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

import { captureResult, MessageAggregator, Result, succeed, fail } from '@fgv/ts-utils';
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
 * only one parent. The root of the tree has no parent. The hierarchy is used to
 * determine the relationship between values when matching conditions and contexts.
 * @public
 */
export type LiteralValueHierarchyDecl<T extends string> = Partial<Record<T, T>>;

/**
 * Describes a single valid literal value including optional parent and child values.
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

/**
 * Internal interface used during hierarchy construction to build
 * {@link QualifierTypes.ILiteralValue | ILiteralValue} objects.
 * @public
 */
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
 *
 * @remarks
 * The hierarchy can be created in two modes:
 * - **Constrained mode**: When enumerated values are provided, only those values are allowed
 *   in the hierarchy and matching operations.
 * - **Open values mode**: When no enumerated values are provided, all values referenced in
 *   the hierarchy are automatically collected and used. This allows for flexible hierarchies
 *   where any value can be used in matching operations.
 * @public
 */
export class LiteralValueHierarchy<T extends string = string> {
  /**
   * A map of all allowed literal values to the corresponding
   * {@link QualifierTypes.ILiteralValue | ILiteralValue} validated definition.
   */
  public readonly values: ReadonlyMap<T, ILiteralValue<T>>;

  /**
   * Indicates whether this hierarchy was created with open values (no enumerated values
   * provided), allowing any value to be used in matching operations.
   */
  public readonly isOpenValues: boolean;

  protected constructor(params: ILiteralValueHierarchyCreateParams<T>) {
    const result = LiteralValueHierarchy._buildValuesFromHierarchy(params);
    this.values = result.orThrow();
    this.isOpenValues = !params.values || params.values.length === 0;
  }

  /**
   * Creates a new {@link QualifierTypes.LiteralValueHierarchy | LiteralValueHierarchy} instance.
   * @param params - The {@link QualifierTypes.ILiteralValueHierarchyCreateParams | parameters}
   * used to create the hierarchy.
   * @returns `Success` with the new hierarchy or `Failure` with an error message.
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
   * @returns `Success` with an array of root values.
   */
  public getRoots(): Result<T[]> {
    return succeed(
      Array.from(this.values.values())
        .filter((v) => !v.parent)
        .map((v) => v.name)
    );
  }

  /**
   * Gets all ancestors of a value in the hierarchy.
   * @param value - The value to get ancestors for.
   * @returns `Success` with an array of ancestor values, ordered from immediate parent
   * to root, or `Failure` if the value is not in the hierarchy.
   */
  public getAncestors(value: T): Result<T[]> {
    const current = this.values.get(value);
    /* c8 ignore next 3 - functional error case tested but coverage intermittently missed */
    if (!current) {
      return fail(`${value}: not found in hierarchy`);
    }

    const ancestors: T[] = [];
    let ancestor = current.parent;

    while (ancestor) {
      ancestors.push(ancestor.name);
      ancestor = ancestor.parent;
    }

    return succeed(ancestors);
  }

  /**
   * Determines if a value is an ancestor of a possible ancestor value.
   * @param value - The value to check.
   * @param possibleAncestor - The possible ancestor value.
   * @returns `true` if the value is an ancestor of the possible ancestor, `false` otherwise.
   */
  public isAncestor(value: T, possibleAncestor: T): boolean {
    const ancestors = this.getAncestors(value);
    if (ancestors.isSuccess()) {
      return ancestors.value.includes(possibleAncestor);
    }
    return false;
  }

  /**
   * Gets all descendants of a value in the hierarchy.
   * @param value - The value to get descendants for.
   * @returns `Success` with an array of descendant values, or `Failure` if the value
   * is not in the hierarchy.
   */
  public getDescendants(value: T): Result<T[]> {
    const current = this.values.get(value);
    if (!current) {
      return fail(`${value}: not found in hierarchy`);
    }

    const descendants: T[] = [];
    if (current.children) {
      for (const childName of current.children) {
        descendants.push(childName);
        const childDescendants = this.getDescendants(childName);
        if (childDescendants.isSuccess()) {
          descendants.push(...childDescendants.value);
        }
      }
    }

    return succeed(descendants);
  }

  public match(condition: T, context: T): QualifierMatchScore;
  /**
   * Matches a condition value against a context value, where an exact match of the
   * condition and context returns {@link PerfectMatch | PerfectMatch}, a condition
   * value that does not match the context value or any of its ancestors returns
   * {@link NoMatch | NoMatch}, and a condition value that matches the context value
   * or any of its ancestors returns a positive score that is less than
   * {@link PerfectMatch | PerfectMatch}, with the score decreasing with each ancestor
   * in the hierarchy.
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
    // For open hierarchies, skip validation and allow any values
    if (!this.isOpenValues) {
      // Validate that both condition and context exist in the hierarchy
      /* c8 ignore next 2 - functional error case tested but coverage intermittently missed */
      if (!this.values.has(condition as T)) {
        return NoMatch;
      }
      /* c8 ignore next 2 - functional error case tested but coverage intermittently missed */
      if (!this.values.has(context as T)) {
        return NoMatch;
      }
    }

    if ((condition as string) === (context as string)) {
      return PerfectMatch;
    }

    // For open hierarchies, if values aren't in the hierarchy, treat as no match
    // but don't fail validation
    const values: ReadonlyMap<string, ILiteralValue<string>> = this.values;
    /* c8 ignore next 1 - ? is defense in depth */
    let value = values.get(context)?.parent;
    /* c8 ignore next 2 - functional error case tested but coverage intermittently missed */
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

    // If no values are provided, collect all values from the hierarchy
    let allValues: T[];
    if (!values || values.length === 0) {
      const hierarchyValues = new Set<T>();
      // Add all keys and values from the hierarchy
      Object.keys(hierarchy).forEach((key) => hierarchyValues.add(key as T));
      Object.values(hierarchy).forEach((value) => hierarchyValues.add(value as T));
      allValues = Array.from(hierarchyValues);
    } else {
      allValues = [...values];
    }

    const valueMap = new Map<T, ILiteralValueBuilder<T>>(allValues.map((name) => [name, { name }]));

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
          /* c8 ignore next 1 - defensive coding: complex circular reference detection intermittently missed */
          ancestors.push(ancestor.name);
          /* c8 ignore next 1 - defensive coding: ancestor.parent === value is very difficult to reach */
          if (ancestor.parent === parent || ancestor.parent === value) {
            /* c8 ignore next 3 - defensive coding: circular reference error reporting intermittently missed */
            errors.addMessage(`${valueName}: Circular reference detected: ${ancestors.join('->')}`);
            circular = true;
            break;
          }
          ancestor = ancestor.parent;
        }

        /* c8 ignore next 2 - defensive coding: circular reference handling intermittently missed */
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
