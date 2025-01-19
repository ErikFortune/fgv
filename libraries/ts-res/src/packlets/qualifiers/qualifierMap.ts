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

import { captureResult, MessageAggregator, populateObject, Result, fail, succeed } from '@fgv/ts-utils';
import { QualifierName, QualifierTypeName, Convert, ConditionPriority } from '../common';
import { Qualifier } from './qualifier';
import { QualifierType } from './qualifierTypes';

/**
 * Declares a {@link Qualifiers.Qualifier | Qualifier} for use in build or at runtime.
 * @public
 */
export interface IQualifierDecl<
  TN extends string = string,
  TT extends string = string,
  TP extends number = number
> {
  /**
   * The name of the qualifier.
   */
  name: TN;
  /**
   * The name of the type of the qualifier.
   */
  typeName: TT;
  /**
   * The default priority of conditions that depend on this qualifier.
   */
  defaultPriority: TP;
}

/**
 * A {@link Qualifiers.IQualifierDecl | qualifier declaration} with all properties
 * validated for correctness.
 * @public
 */
export type IValidatedQualifierDecl = IQualifierDecl<QualifierName, QualifierTypeName, ConditionPriority>;

/**
 * Parameters for creating a new {@link Qualifiers.QualifierMap | QualifierMap}.
 * @public
 */
export interface IQualifierMapCreateParams {
  qualifierTypes: ReadonlyMap<QualifierTypeName, QualifierType>;
  qualifiers: ReadonlyMap<QualifierName, IQualifierDecl>;
}

/**
 * Represents a collection of named, instantiated {@link Qualifiers.Qualifier | Qualifiers}
 * for use at build or runtime.
 * @public
 */
export class QualifierMap {
  /**
   * Gets the qualifiers in the map.
   */
  public get qualifiers(): ReadonlyMap<QualifierName, Qualifier> {
    return this._qualifiers;
  }

  private _qualifiers: Map<QualifierName, Qualifier>;

  /**
   * Constructs a new {@link Qualifiers.QualifierMap | QualifierMap}.
   * @param params - Parameters for creating a new {@link Qualifiers.QualifierMap | QualifierMap}.
   * @public
   */
  protected constructor(params: IQualifierMapCreateParams) {
    const errors = new MessageAggregator();
    this._qualifiers = new Map<QualifierName, Qualifier>();
    for (const [name, decl] of params.qualifiers) {
      QualifierMap.validateQualifierDecl(decl)
        .onSuccess((dv) => {
          const type = params.qualifierTypes.get(dv.typeName);
          if (type === undefined) {
            return fail<Qualifier>(`${name}: unknown qualifier type ${dv.typeName}.`);
          }
          return Qualifier.create({ name, type, defaultPriority: dv.defaultPriority });
        })
        .onSuccess((q) => {
          this._qualifiers.set(q.name, q);
          return succeed(q);
        })
        .aggregateError(errors);
    }
    if (errors.hasMessages) {
      throw new Error(errors.toString());
    }
  }

  /**
   * Creates a new {@link Qualifiers.QualifierMap | QualifierMap} instance.
   * @param params - {@link Qualifiers.IQualifierCreateParams | Parameters} used to
   * create the new {@link Qualifiers.QualifierMap | QualifierMap}.
   * @returns `Success` with the new {@link Qualifiers.QualifierMap | QualifierMap} if
   * successful, `Failure` with an error message otherwise.
   * @public
   */
  public static create(params: IQualifierMapCreateParams): Result<QualifierMap> {
    return captureResult(() => new QualifierMap(params));
  }

  /**
   * Gets a {@link Qualifiers.Qualifier | qualifier} from the map by name.
   * @param name - The name of the {@link Qualifiers.Qualifier | qualifier} to retrieve.
   * @returns `Success` with the {@link Qualifiers.Qualifier | qualifier} if found, `Failure` with an error message otherwise.
   * @public
   */
  public get(name: QualifierName): Result<Qualifier> {
    const qualifier = this._qualifiers.get(name);
    if (qualifier === undefined) {
      return fail(`Qualifier ${name} not found`);
    }
    return succeed(qualifier);
  }

  /**
   * Validates the properties of a {@link Qualifiers.IQualifierDecl | qualifier declaration} for
   * correctness.
   * @param decl - The {@link Qualifiers.IQualifierDecl | qualifier declaration} to validate.
   * @returns `Success` with the validated {@link Qualifiers.IValidatedQualifierDecl | qualifier declaration}
   * if successful, `Failure` with an error message otherwise.
   * @public
   */
  public static validateQualifierDecl(decl: IQualifierDecl): Result<IValidatedQualifierDecl> {
    return populateObject<IValidatedQualifierDecl>({
      name: () => Convert.qualifierName.convert(decl.name),
      typeName: () => Convert.qualifierTypeName.convert(decl.typeName),
      defaultPriority: () => Convert.conditionPriority.convert(decl.defaultPriority)
    });
  }
}
