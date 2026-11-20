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

import * as Common from '../common';
import {
  captureResult,
  Collections,
  Converter,
  Converters,
  failWithDetail,
  mapResults,
  Result,
  fail,
  succeed,
  succeedWithDetail,
  ValidatingConvertingCollector
} from '@fgv/ts-utils';
import { IQualifierDecl, IValidatedQualifierDecl } from './qualifierDecl';
import { MaxConditionPriority, MinConditionPriority, QualifierName } from '../common';
import { Qualifier } from './qualifier';
import { IQualifierDeclConvertContext, qualifierDecl, validatedQualifierDecl } from './convert';
import {
  LiteralQualifierType,
  QualifierTypeCollector,
  ReadOnlyQualifierTypeCollector
} from '../qualifier-types';

/**
 * Converter for a single entry in the mixed-shape
 * {@link Qualifiers.IQualifierCollectorCreateParams.qualifiers | qualifiers}
 * input — either a bare axis-name string or a full
 * {@link Qualifiers.IQualifierDecl | declaration}. Validates the entry
 * shape at the public-API boundary rather than deferring to the
 * internal qualifier factory.
 */
const _qualifierEntriesConverter: Converter<ReadonlyArray<string | IQualifierDecl>> = Converters.arrayOf(
  Converters.oneOf<string | IQualifierDecl>([Converters.string, qualifierDecl])
);

/**
 * Readonly version of {@link Qualifiers.QualifierCollector | QualifierCollector}.
 * @public
 */
export interface IReadOnlyQualifierCollector extends Collections.IReadOnlyValidatingCollector<Qualifier> {
  /**
   * {@inheritDoc Qualifiers.QualifierCollector.qualifierTypes}
   */
  readonly qualifierTypes: ReadOnlyQualifierTypeCollector;

  /**
   * Gets a {@link Qualifiers.Qualifier | qualifier} by name or token.
   * @param nameOrToken - The name or token of the qualifier to retrieve.
   * @returns `Success` with the qualifier if found, or `Failure` if not.
   */
  getByNameOrToken(nameOrToken: string): Result<Qualifier>;

  /**
   * Checks if a qualifier with a given name or token is in the collection.
   * @param nameOrToken - The name or token of the qualifier to check.
   * @returns `true` if the qualifier is in the collection, `false` if not.
   */
  hasNameOrToken(nameOrToken: string): boolean;
}

/**
 * Parameters for creating a new {@link Qualifiers.QualifierCollector}.
 * @public
 *
 * @remarks
 * `qualifiers` accepts a mixed array of bare axis-name strings and full
 * {@link Qualifiers.IQualifierDecl | declarations}. A string element is
 * sugar for "literal qualifier with this name"; the library synthesizes a
 * {@link QualifierTypes.LiteralQualifierType | LiteralQualifierType} and a
 * declaration `{ name, typeName: name, defaultPriority: <descending> }`.
 *
 * Synthesized priorities are distributed across the
 * `[MinConditionPriority..MaxConditionPriority]` range adaptively to the
 * array length: `step = max(1, floor((Max - Min) / length))`,
 * `priority = max(Min, Max - index * step)`. Earlier elements get higher
 * priority. The formula never overflows the `ConditionPriority` range
 * regardless of input length; for inputs whose length exceeds the range
 * cardinality (\>1000 axes), trailing priorities collapse at
 * `MinConditionPriority` — supply explicit priorities in that regime
 * if uniqueness matters.
 *
 * `qualifierTypes` may be omitted only when every element of `qualifiers`
 * is a string. If any element is an {@link Qualifiers.IQualifierDecl},
 * `qualifierTypes` must be supplied and must contain the referenced
 * {@link Qualifiers.IQualifierDecl.typeName | typeNames}.
 */
export interface IQualifierCollectorCreateParams {
  /**
   * The {@link QualifierTypes.QualifierTypeCollector | qualifier types} used to
   * create {@link Qualifiers.Qualifier | qualifiers} from {@link Qualifiers.IQualifierDecl | declarations}.
   *
   * Optional only when every entry in `qualifiers` is a bare axis-name string
   * (in which case the library synthesizes a literal qualifier type per name).
   */
  qualifierTypes?: ReadOnlyQualifierTypeCollector;

  /**
   * Optional list of {@link Qualifiers.IQualifierDecl | declarations} or bare
   * axis-name strings for the qualifiers to add to the collection on creation.
   *
   * @remarks
   * A string element `'foo'` is sugar for a literal qualifier:
   * `{ name: 'foo', typeName: 'foo', defaultPriority: <descending> }` backed by
   * a synthesized {@link QualifierTypes.LiteralQualifierType | LiteralQualifierType}
   * named `'foo'`.
   */
  qualifiers?: ReadonlyArray<string | IQualifierDecl>;
}

/**
 * Collects {@link Qualifiers.Qualifier | Qualifiers} from {@link Qualifiers.IQualifierDecl | declarations},
 * with strongly-typed ({@link QualifierName | QualifierName} and {@link QualifierIndex | QualifierIndex}) key
 * and index.
 * @public
 */
export class QualifierCollector
  extends ValidatingConvertingCollector<Qualifier, IQualifierDecl>
  implements IReadOnlyQualifierCollector
{
  /**
   * The {@link QualifierTypes.QualifierTypeCollector | qualifier types} that this collector uses.
   */
  public qualifierTypes: ReadOnlyQualifierTypeCollector;

  /**
   * Constructor for a {@link Qualifiers.QualifierCollector | QualifierCollector} object.
   * @param qualifierTypes - The {@link QualifierTypes.ReadOnlyQualifierTypeCollector | qualifier types}
   * used to validate declarations.
   * @param qualifiers - Optional list of fully-resolved {@link Qualifiers.IQualifierDecl | declarations}.
   * @public
   */
  protected constructor(
    qualifierTypes: ReadOnlyQualifierTypeCollector,
    qualifiers?: ReadonlyArray<IQualifierDecl>
  ) {
    super({
      factory: (k, i, v) => this._qualifierFactory(k, i, v),
      converters: new Collections.KeyValueConverters({
        key: Common.Convert.qualifierName,
        value: qualifierDecl
      })
    });
    this.qualifierTypes = qualifierTypes;
    /* c8 ignore next 1 - coverage misses the branch intermittently */
    qualifiers?.forEach((q) => this.validating.add(q.name, q).orThrow());
  }

  /**
   * Creates a new {@link Qualifiers.QualifierCollector | QualifierCollector} object.
   * @param params - {@link Qualifiers.IQualifierCollectorCreateParams | Parameters} for creating a new {@link Qualifiers.QualifierCollector | QualifierCollector}.
   * @returns `Success` with the new collector if successful, or `Failure` if not.
   *
   * @remarks
   * Accepts a mixed array of bare axis-name strings and full
   * {@link Qualifiers.IQualifierDecl | declarations}. String elements are sugar
   * for a literal qualifier: the library synthesizes a
   * {@link QualifierTypes.LiteralQualifierType | LiteralQualifierType} named
   * after the string and a declaration `{ name, typeName: name, defaultPriority }`.
   * Synthesized priorities are distributed across the
   * `[MinConditionPriority..MaxConditionPriority]` range adaptively to the
   * input length (`step = max(1, floor((Max - Min) / length))`,
   * `priority = max(Min, Max - index * step)`). Earlier elements get higher
   * priority — matching the "earlier qualifier wins when multiple match"
   * mental model — and the formula never overflows the `ConditionPriority`
   * range regardless of input length.
   *
   * `qualifierTypes` may be omitted only when every element of `qualifiers`
   * is a string. If any element is a declaration, `qualifierTypes` is
   * required (and must include the referenced typeNames); the error message
   * names the offending typeName when it is missing.
   */
  public static create(params: IQualifierCollectorCreateParams): Result<QualifierCollector> {
    return QualifierCollector._resolveCreateParams(params).onSuccess(({ qualifierTypes, qualifiers }) => {
      return captureResult(() => new QualifierCollector(qualifierTypes, qualifiers));
    });
  }

  /**
   * Resolves the public {@link Qualifiers.IQualifierCollectorCreateParams | create params}
   * into the concrete `(qualifierTypes, qualifiers)` pair the constructor expects.
   *
   * @remarks
   * Validates the mixed-shape `qualifiers` input through
   * {@link Converters.oneOf} (string vs {@link Qualifiers.IQualifierDecl})
   * at the public-API boundary, then partitions into bare-string and decl
   * buckets to drive type synthesis. If any decl is present and
   * `qualifierTypes` is omitted, fails with an error that names the
   * offending typeNames.
   *
   * @internal
   */
  private static _resolveCreateParams(params: IQualifierCollectorCreateParams): Result<{
    qualifierTypes: ReadOnlyQualifierTypeCollector;
    qualifiers?: ReadonlyArray<IQualifierDecl>;
  }> {
    const raw = params.qualifiers;
    if (raw === undefined || raw.length === 0) {
      if (params.qualifierTypes === undefined) {
        return succeed({ qualifierTypes: QualifierCollector._emptyQualifierTypes(), qualifiers: undefined });
      }
      return succeed({ qualifierTypes: params.qualifierTypes, qualifiers: undefined });
    }

    return _qualifierEntriesConverter.convert(raw).onSuccess((entries) => {
      const stringNames: string[] = [];
      const declTypeNames: string[] = [];
      for (const entry of entries) {
        if (typeof entry === 'string') {
          stringNames.push(entry);
        } else {
          declTypeNames.push(entry.typeName);
        }
      }

      if (declTypeNames.length > 0 && params.qualifierTypes === undefined) {
        const unique = Array.from(new Set(declTypeNames));
        return fail<{
          qualifierTypes: ReadOnlyQualifierTypeCollector;
          qualifiers?: ReadonlyArray<IQualifierDecl>;
        }>(
          `qualifierTypes must be supplied when qualifiers include declarations; ` +
            `missing types for: ${unique.map((n) => `'${n}'`).join(', ')}`
        );
      }

      return QualifierCollector._resolveQualifierTypes(params.qualifierTypes, stringNames).onSuccess(
        (qualifierTypes) => {
          const decls = QualifierCollector._normalizeQualifierDecls(entries);
          return succeed({ qualifierTypes, qualifiers: decls });
        }
      );
    });
  }

  /**
   * Returns the provided {@link QualifierTypes.ReadOnlyQualifierTypeCollector | qualifier-type collector}
   * (or synthesizes a new one) augmented with synthesized literal qualifier types for the supplied
   * string names that are not already present.
   *
   * @internal
   */
  private static _resolveQualifierTypes(
    provided: ReadOnlyQualifierTypeCollector | undefined,
    stringNames: ReadonlyArray<string>
  ): Result<ReadOnlyQualifierTypeCollector> {
    if (stringNames.length === 0) {
      // No bare names to synthesize. The all-decls case requires `provided` to be defined
      // (else _resolveCreateParams would have failed before calling us); fall back to an
      // empty type collector only as a defensive measure.
      /* c8 ignore next 1 - defensive: unreachable when called from _resolveCreateParams */
      return succeed(provided ?? QualifierCollector._emptyQualifierTypes());
    }
    return mapResults(stringNames.map((name) => LiteralQualifierType.create({ name }))).onSuccess(
      (literalTypes) => {
        return QualifierTypeCollector.create().onSuccess((collector) => {
          const existingAdds: ReadonlyArray<Result<unknown>> =
            provided !== undefined
              ? Array.from(provided.values()).map((existing) => collector.add(existing))
              : [];
          const literalAdds: ReadonlyArray<Result<unknown>> = literalTypes
            .filter((lit) => !collector.has(lit.name))
            .map((lit) => collector.add(lit));
          return mapResults([...existingAdds, ...literalAdds]).onSuccess(() =>
            succeed(collector as ReadOnlyQualifierTypeCollector)
          );
        });
      }
    );
  }

  /**
   * Normalizes a mixed `(string | IQualifierDecl)[]` into a fully-resolved
   * `IQualifierDecl[]`, assigning descending default priorities to synthesized
   * decls within the `[MinConditionPriority..MaxConditionPriority]` range.
   *
   * @remarks
   * Step size is adaptive to input length:
   * `step = max(1, floor((Max - Min) / length))`. Each synthesized priority
   * is `max(Min, Max - index * step)` — clamped at the bottom so length
   * extremes (\>1000 axes) degrade gracefully into a tail of equal-`Min`
   * priorities rather than overflowing the `ConditionPriority` range.
   *
   * @internal
   */
  private static _normalizeQualifierDecls(
    qualifiers: ReadonlyArray<string | IQualifierDecl>
  ): ReadonlyArray<IQualifierDecl> {
    const range = MaxConditionPriority - MinConditionPriority;
    const step = Math.max(1, Math.floor(range / qualifiers.length));
    return qualifiers.map((q, index) => {
      if (typeof q === 'string') {
        const raw = MaxConditionPriority - index * step;
        return {
          name: q,
          typeName: q,
          defaultPriority: Math.max(MinConditionPriority, raw)
        };
      }
      return q;
    });
  }

  /**
   * Returns an empty {@link QualifierTypes.ReadOnlyQualifierTypeCollector | qualifier-type collector}
   * used as a placeholder when no qualifiers are supplied and the caller omits
   * `qualifierTypes`.
   *
   * @internal
   */
  private static _emptyQualifierTypes(): ReadOnlyQualifierTypeCollector {
    /* c8 ignore next 1 - QualifierTypeCollector.create() is total for the empty case */
    return QualifierTypeCollector.create().orThrow();
  }

  /**
   * {@inheritDoc Qualifiers.IReadOnlyQualifierCollector.getByNameOrToken}
   */
  public getByNameOrToken(nameOrToken: string): Result<Qualifier> {
    return this.validating.get(nameOrToken).onFailure((message) => {
      for (const q of this.values()) {
        if (q.token === nameOrToken) {
          return succeedWithDetail(q, 'success');
        }
      }
      return failWithDetail(`Qualifier token '${nameOrToken}' not found`, 'not-found');
    });
  }

  /**
   * {@inheritDoc Qualifiers.IReadOnlyQualifierCollector.hasNameOrToken}
   */
  public hasNameOrToken(nameOrToken: string): boolean {
    /* c8 ignore next 3 - functional code path tested but coverage intermittently missed */
    if (this.validating.has(nameOrToken)) {
      return true;
    }
    for (const q of this.values()) {
      /* c8 ignore next 3 - functional code path tested but coverage intermittently missed */
      if (q.token === nameOrToken) {
        return true;
      }
    }
    return false;
  }

  /**
   * Gets a read-only view of this collector.
   * @returns A read-only view of this collector.
   */
  public toReadOnly(): IReadOnlyQualifierCollector {
    return this;
  }

  /**
   * Factory method for creating a {@link Qualifiers.Qualifier | Qualifier} from a {@link Qualifiers.IQualifierDecl | declaration}.
   * @param __key - The key for the qualifier.
   * @param index - The index of the qualifier.
   * @param decl - The {@link Qualifiers.IQualifierDecl | declaration} for the qualifier.
   * @returns `Success` with the new {@link Qualifiers.Qualifier | Qualifier} if successful, or `Failure` if not.
   * @public
   */
  protected _qualifierFactory(__key: QualifierName, index: number, decl: IQualifierDecl): Result<Qualifier> {
    const convertContext: IQualifierDeclConvertContext = {
      qualifierTypes: this.qualifierTypes,
      qualifierIndex: index
    };
    return validatedQualifierDecl
      .convert(decl, convertContext)
      .onSuccess((validated) => {
        /* c8 ignore next 9 - coverage intermittently misses this block */
        if (this.hasNameOrToken(validated.token)) {
          return fail<IValidatedQualifierDecl>(
            `Qualifier token '${validated.token}' is not unique or collides with name`
          );
        } else if (this.hasNameOrToken(validated.name)) {
          return fail<IValidatedQualifierDecl>(
            `Qualifier name '${validated.name}' is not unique or collides with token`
          );
        }
        return succeed(validated);
      })
      .onSuccess(Qualifier.create);
  }
}
