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
  failWithDetail,
  Result,
  fail,
  succeed,
  succeedWithDetail,
  ValidatingConvertingCollector
} from '@fgv/ts-utils';
import { IQualifierDecl, IValidatedQualifierDecl } from './qualifierDecl';
import { QualifierName } from '../common';
import { Qualifier } from './qualifier';
import { IQualifierDeclConvertContext, qualifierDecl, validatedQualifierDecl } from './convert';
import { ReadOnlyQualifierTypeCollector } from '../qualifier-types';

/**
 * Readonly version of {@link Qualifiers.QualifierCollector | QualifierCollector}.
 * @public
 */
export interface IReadOnlyQualifierCollector extends Collections.IReadOnlyValidatingCollector<Qualifier> {
  /**
   * {@inheritdoc Qualifiers.QualifierCollector.qualifierTypes}
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
 */
export interface IQualifierCollectorCreateParams {
  /**
   * The {@link QualifierTypes.QualifierTypeCollector | qualifier types} used to
   * create {@link Qualifiers.Qualifier | qualifiers} from {@link Qualifiers.IQualifierDecl | declarations}.
   */
  qualifierTypes: ReadOnlyQualifierTypeCollector;

  /**
   * Optional list of {@link Qualifiers.IQualifierDecl | declarations} for the qualifiers to add to the collection
   * upon creation.
   */
  qualifiers?: IQualifierDecl[];
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
   * @param params - Parameters for creating the collector.
   * @public
   */
  protected constructor(params: IQualifierCollectorCreateParams) {
    super({
      factory: (k, i, v) => this._qualifierFactory(k, i, v),
      converters: new Collections.KeyValueConverters({
        key: Common.Convert.qualifierName,
        value: qualifierDecl
      })
    });
    this.qualifierTypes = params.qualifierTypes;
    /* c8 ignore next 1 - coverage misses the branch intermittently */
    params.qualifiers?.forEach((q) => this.validating.add(q.name, q).orThrow());
  }

  /**
   * Creates a new {@link Qualifiers.QualifierCollector | QualifierCollector} object.
   * @param params - {@link Qualifiers.IQualifierCollectorCreateParams | Parameters} for creating a new {@link Qualifiers.QualifierCollector | QualifierCollector}.
   * @returns `Success` with the new collector if successful, or `Failure` if not.
   */
  public static create(params: IQualifierCollectorCreateParams): Result<QualifierCollector> {
    return captureResult(() => new QualifierCollector(params));
  }

  /**
   * {@inheritdoc Qualifiers.IReadOnlyQualifierCollector.getByNameOrToken}
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
   * {@inheritdoc Qualifiers.IReadOnlyQualifierCollector.hasNameOrToken}
   */
  public hasNameOrToken(nameOrToken: string): boolean {
    /* c8 ignore next 3 - functional code path tested but coverage intermittently missed */
    if (this.validating.has(nameOrToken)) {
      return true;
    }
    for (const q of this.values()) {
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
        if (this.hasNameOrToken(validated.token)) {
          /* c8 ignore next 3 - functional error case tested but coverage intermittently missed */
          return fail<IValidatedQualifierDecl>(
            `Qualifier token '${validated.token}' is not unique or collides with name`
          );
        } else if (this.hasNameOrToken(validated.name)) {
          /* c8 ignore next 3 - functional error case tested but coverage intermittently missed */
          return fail<IValidatedQualifierDecl>(
            `Qualifier name '${validated.name}' is not unique or collides with token`
          );
        }
        return succeed(validated);
      })
      .onSuccess(Qualifier.create);
  }
}
