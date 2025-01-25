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

import {
  captureResult,
  populateObject,
  Result,
  fail,
  succeed,
  ConvertingResultMap,
  Converters,
  Converter,
  mapResults,
  Collections,
  DetailedResult
} from '@fgv/ts-utils';
import { QualifierName, QualifierTypeName, Convert, ConditionPriority, Validate } from '../common';
import { Qualifier } from './qualifier';
import { QualifierTypeMap } from './qualifierTypes/qualifierTypeMap';

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

interface IQualifierConvertContext {
  types: QualifierTypeMap;
  index?: number;
}

const validatedQualifierDecl: Converter<IValidatedQualifierDecl, IQualifierConvertContext> =
  Converters.object<IValidatedQualifierDecl, IQualifierConvertContext>({
    name: Convert.qualifierName,
    typeName: Convert.qualifierTypeName,
    defaultPriority: Convert.conditionPriority
  });

const qualifier: Converter<Qualifier, IQualifierConvertContext> = validatedQualifierDecl.map(
  (decl, context) => {
    if (!context?.types) {
      return fail('No qualifier types for conversion.');
    }
    const index = context.index ? Validate.toQualifierIndex(context.index).orDefault() : undefined;
    return context.types
      .get(decl.typeName)
      .onSuccess((type) =>
        Qualifier.create({ name: decl.name, type, defaultPriority: decl.defaultPriority, index }).withDetail(
          'success'
        )
      );
  }
);

/**
 * Parameters for creating a new {@link Qualifiers.QualifierMap | QualifierMap}.
 * @public
 */
export interface IQualifierMapCreateParams {
  qualifierTypes: QualifierTypeMap;
  qualifiers?: IQualifierDecl[];
}

/**
 * Represents a collection of named, instantiated {@link Qualifiers.Qualifier | Qualifiers}
 * for use at build or runtime.
 * @public
 */
export class QualifierMap extends ConvertingResultMap<QualifierName, Qualifier> {
  /**
   * Gets the qualifiers in the map.
   */
  public get qualifiers(): ReadonlyMap<QualifierName, Qualifier> {
    return this._inner;
  }

  protected _qualifierTypes: QualifierTypeMap;

  /**
   * Constructs a new {@link Qualifiers.QualifierMap | QualifierMap}.
   * @param params - Parameters for creating a new {@link Qualifiers.QualifierMap | QualifierMap}.
   * @public
   */
  protected constructor(params: IQualifierMapCreateParams) {
    const entries: [QualifierName, Qualifier][] = mapResults(
      (params.qualifiers ?? []).map((decl, index) => {
        return QualifierMap.validateQualifierDecl(decl)
          .onSuccess((validated) => qualifier.convert(validated, { types: params.qualifierTypes, index }))
          .onSuccess((q) => succeed<[QualifierName, Qualifier]>([q.name, q]));
      })
    ).orThrow();

    super({
      entries,
      converters: new Collections.KeyValueConverters<QualifierName, Qualifier>(
        Convert.qualifierName,
        (value: unknown) => this._convertNext(value)
      )
    });
    this._qualifierTypes = params.qualifierTypes;
  }

  /**
   * Creates a new {@link Qualifiers.QualifierMap | QualifierMap} instance.
   * @param params - {@link Qualifiers.IQualifierCreateParams | Parameters} used to
   * create the new {@link Qualifiers.QualifierMap | QualifierMap}.
   * @returns `Success` with the new {@link Qualifiers.QualifierMap | QualifierMap} if
   * successful, `Failure` with an error message otherwise.
   * @public
   */
  public static createQualifierMap(params: IQualifierMapCreateParams): Result<QualifierMap> {
    return captureResult(() => new QualifierMap(params));
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

  protected _convertNext(value: unknown): Result<Qualifier> {
    return qualifier.convert(value, { types: this._qualifierTypes, index: this.size });
  }
}
