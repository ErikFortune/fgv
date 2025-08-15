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

import { captureResult, Collections, Hash, mapResults, Result, succeed } from '@fgv/ts-utils';
import { Condition } from './condition';
import {
  Convert as CommonConvert,
  ConditionSetIndex,
  ConditionSetKey,
  QualifierName,
  Validate
} from '../common';
import { IValidatedConditionSetDecl } from './conditionSetDecls';
import * as ConditionsConvert from './convert';
import { ConditionCollector } from './conditionCollector';
import * as ResourceJson from '../resource-json';
import * as Context from '../context';

/**
 * Options for creating a {@link Conditions.ConditionSet | ConditionSet} declaration.
 * @remarks
 * This interface extends the {@link ResourceJson.Helpers.IDeclarationOptions | declaration options}
 * interface to include a `reduceQualifiers` option.
 * @public
 */
export interface IConditionSetDeclOptions extends ResourceJson.Helpers.IDeclarationOptions {
  /**
   * If provided, reduces the qualifiers of the condition set by removing qualifiers that are made
   * irrelevant by the filterForContext.
   */
  qualifiersToReduce?: ReadonlySet<QualifierName>;
}

/**
 * Represents a set of {@link Conditions.Condition | conditions} that must all be met in some runtime
 * context for a resource instance to be valid.
 * @public
 */
export class ConditionSet implements IValidatedConditionSetDecl {
  protected readonly _collectible: Collections.Collectible<ConditionSetKey, ConditionSetIndex>;
  /**
   * The {@link Conditions.Condition | conditions} that make up this condition
   * set.
   * @public
   */
  public readonly conditions: ReadonlyArray<Condition>;

  /**
   * The key for this condition set.
   */
  public get key(): ConditionSetKey {
    return this._collectible.key;
  }

  /**
   * The number of conditions in this condition set.
   */
  public get size(): number {
    return this.conditions.length;
  }

  /**
   * The index for this condition set.
   */
  public get index(): ConditionSetIndex | undefined {
    return this._collectible.index;
  }

  /**
   * The key for an unconditional condition set.
   */
  public static UnconditionalKey: ConditionSetKey = Validate.toConditionSetKey('').orThrow();

  /**
   * Constructor for a {@link Conditions.ConditionSet | ConditionSet} object.
   * @param params - {@link Conditions.IValidatedConditionSetDecl | Validated declaration}
   * used to create the condition set.
   */
  protected constructor(params: IValidatedConditionSetDecl) {
    const qualifiers = new Map<QualifierName, Condition>();
    for (const condition of params.conditions) {
      /* c8 ignore next 9 - there's a test for this but coverage is having a bad day */
      if (qualifiers.has(condition.qualifier.name)) {
        const existing = qualifiers.get(condition.qualifier.name)?.toString() ?? 'unknown';
        throw new Error(
          `${
            condition.qualifier.name
          }: Duplicate conditions ${existing} and ${condition.toString()} are not supported.`
        );
      }
      qualifiers.set(condition.qualifier.name, condition);
    }
    this.conditions = Array.from(params.conditions).sort(Condition.compare).reverse();
    this._collectible = new Collections.Collectible({
      key: this.toKey(),
      index: params.index,
      indexConverter: CommonConvert.conditionSetIndex
    });
  }

  /**
   * Creates a new {@link Conditions.ConditionSet | ConditionSet} object.
   * @param params - {@link Conditions.IValidatedConditionSetDecl | Validated declaration}
   * used to create the condition set.
   * @returns `Success` with the new {@link Conditions.ConditionSet | ConditionSet} object if successful,
   * or `Failure` with an error message if not.
   * @public
   */
  public static create(params: IValidatedConditionSetDecl): Result<ConditionSet> {
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
   * Sets the global index for this condition set.  Once set, the index cannot be changed.
   * @param index - The index to set for this condition set.
   * @returns `Success` with the index if successful, `Failure` otherwise.
   */
  public setIndex(index: number): Result<ConditionSetIndex> {
    return this._collectible.setIndex(index);
  }

  /**
   * Determines if this condition set can match a supplied context, even if the context is partial.
   * Returns true if all conditions in the set can match the context (using canMatchPartialContext).
   * Returns false otherwise.
   * @param context - The context to match.
   * @param options - Options to use when matching.
   * @returns `true` if all conditions can match the context, `false` otherwise.
   */
  public canMatchPartialContext(
    context: Context.IValidatedContextDecl,
    options?: Context.IContextMatchOptions
  ): boolean {
    return this.conditions.every((c) => c.canMatchPartialContext(context, options));
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
   * Gets a condition set key from a loose condition set declaration.
   * @param conditionSet - The loose condition set declaration to convert.
   * @param conditionCollector - The condition collector used for validation.
   * @returns `Success` with the condition set key if successful, `Failure` otherwise.
   * @public
   */
  public static getKeyFromLooseDecl(
    conditionSet: ResourceJson.Json.ConditionSetDecl | undefined,
    conditionCollector: ConditionCollector
  ): Result<ConditionSetKey> {
    if (!conditionSet) {
      return succeed(ConditionSet.UnconditionalKey);
    }

    // Convert ConditionSetDecl to IConditionSetDecl format
    let conditionSetDecl: { conditions: ResourceJson.Json.ILooseConditionDecl[] };

    if (Array.isArray(conditionSet)) {
      // ConditionSetDeclAsArray: array of ILooseConditionDecl
      conditionSetDecl = { conditions: conditionSet };
    } else {
      // ConditionSetDeclAsRecord: Record<string, string | IChildConditionDecl>
      const conditions = Object.entries(conditionSet).map(([qualifierName, value]) => {
        if (typeof value === 'string') {
          return { qualifierName, value };
        } else {
          return { qualifierName, ...value };
        }
      });
      conditionSetDecl = { conditions };
    }

    // Validate and convert to IValidatedConditionSetDecl
    return ConditionsConvert.validatedConditionSetDecl
      .convert(conditionSetDecl, { conditions: conditionCollector })
      .onSuccess((validatedDecl) => {
        // Use proper ConditionSet.getKeyForDecl method to generate the key
        return ConditionSet.getKeyForDecl(validatedDecl);
      });
  }

  /**
   * Gets a {@link ConditionSetToken | condition set token} for this condition set,
   * if possible.
   * @param terse - If true, the token will be terse, omitting qualifier names where
   * possible.
   * @returns `Success` with the {@link ConditionSetToken | condition set token} if successful,
   * `Failure` with an error message otherwise.
   * @public
   */
  public toToken(terse?: boolean): Result<string> {
    return mapResults(this.conditions.map((c) => c.toToken(terse))).onSuccess((tokens) => {
      return Validate.toConditionSetToken(tokens.join(','));
    });
  }

  /**
   * Gets the {@link ConditionSetKey | key} for this condition set.
   * @returns The key for this condition set.
   */
  public toKey(): ConditionSetKey {
    return ConditionSet.getKeyForDecl(this).orThrow();
  }

  /**
   * Gets a hash of this condition set.
   * @returns A hash of this condition
   * set key.
   * @public
   */
  public toHash(): string {
    return Hash.Crc32Normalizer.crc32Hash([this.key]).padStart(8, '0');
  }

  /**
   * Gets a human-readable string representation of this condition set.
   * @returns A string representation of this condition set.
   */
  public toString(): string {
    return this.toKey();
  }

  /**
   * Gets the {@link ResourceJson.Json.ConditionSetDeclAsRecord | condition set declaration as a record} for this condition set.
   * @param options - {@link ResourceJson.Helpers.IDeclarationOptions | options} for the condition set declaration.
   * @returns The {@link ResourceJson.Json.ConditionSetDeclAsRecord | condition set declaration as a record} for this condition set.
   */
  public toConditionSetRecordDecl(
    options?: IConditionSetDeclOptions
  ): ResourceJson.Json.ConditionSetDeclAsRecord {
    const qualifiersToReduce = options?.qualifiersToReduce;
    const conditions = qualifiersToReduce
      ? /* c8 ignore next 1 - coverage intermittently misses the next line */
        this.conditions.filter((c) => !qualifiersToReduce.has(c.qualifier.name))
      : this.conditions;
    return Object.fromEntries(
      conditions.map((c): [string, ResourceJson.Json.IChildConditionDecl | string] => {
        return [c.qualifier.name, c.toValueOrChildConditionDecl(options)];
      })
    );
  }

  /**
   * Gets the {@link ResourceJson.Json.ConditionSetDeclAsArray | condition set declaration as an array} for this condition set.
   * @param options - {@link ResourceJson.Helpers.IDeclarationOptions | options} for the condition set declaration.
   * @returns The {@link ResourceJson.Json.ConditionSetDeclAsArray | condition set declaration as an array} for this condition set.
   */
  public toConditionSetArrayDecl(
    options?: IConditionSetDeclOptions
  ): ResourceJson.Json.ConditionSetDeclAsArray {
    /* c8 ignore next 1 - defense in depth */
    const qualifiersToReduce = options?.qualifiersToReduce;
    const conditions = qualifiersToReduce
      ? this.conditions.filter((c) => !qualifiersToReduce.has(c.qualifier.name))
      : this.conditions;
    return conditions.map((c) => c.toLooseConditionDecl(options));
  }

  /**
   * Converts this condition set to a compiled condition set representation.
   * @param options - Optional compilation options controlling the output format.
   * @returns A compiled condition set object that can be used for serialization or runtime processing.
   * @public
   */
  public toCompiled(
    options?: ResourceJson.Compiled.ICompiledResourceOptions
  ): ResourceJson.Compiled.ICompiledConditionSet {
    return {
      conditions: this.conditions.map((c) => c.index!),
      ...(options?.includeMetadata === true ? { metadata: { key: this.key } } : {})
    };
  }
}
