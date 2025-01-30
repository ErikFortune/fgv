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
  Result,
  succeed,
  ConvertingResultMap,
  Converter,
  mapResults,
  Collections
} from '@fgv/ts-utils';
import { QualifierName, Convert } from '../common';
import { Qualifier } from './qualifier';
import { IQualifierDeclConvertContext, validatedQualifierDecl } from './convert/decls';
import { IQualifierDecl } from './qualifierDecl';
import { QualifierTypeCollector } from './qualifierTypes';

const qualifierFromDecl: Converter<Qualifier, IQualifierDeclConvertContext> = validatedQualifierDecl.map(
  Qualifier.create
);

/**
 * Parameters for creating a new {@link Qualifiers.QualifierMap | QualifierMap}.
 * @public
 */
export interface IQualifierMapCreateParams {
  qualifierTypes: QualifierTypeCollector;
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

  protected _qualifierTypes: QualifierTypeCollector;

  /**
   * Constructs a new {@link Qualifiers.QualifierMap | QualifierMap}.
   * @param params - Parameters for creating a new {@link Qualifiers.QualifierMap | QualifierMap}.
   * @public
   */
  protected constructor(params: IQualifierMapCreateParams) {
    const entries: [QualifierName, Qualifier][] = mapResults(
      (params.qualifiers ?? []).map((decl, index) => {
        return validatedQualifierDecl
          .convert(decl, { qualifierTypes: params.qualifierTypes, qualifierIndex: index })
          .onSuccess(Qualifier.create)
          .onSuccess((q) => succeed<[QualifierName, Qualifier]>([q.name, q]));
      })
    ).orThrow();

    super({
      entries,
      converters: new Collections.KeyValueConverters<QualifierName, Qualifier>({
        key: Convert.qualifierName,
        value: (value: unknown) => this._convertNext(value)
      })
    });
    this._qualifierTypes = params.qualifierTypes;
  }

  /**
   * Creates a new {@link Qualifiers.QualifierMap | QualifierMap} instance.
   * @param params - {@link Qualifiers.IQualifierMapCreateParams | Parameters} used to
   * create the new {@link Qualifiers.QualifierMap | QualifierMap}.
   * @returns `Success` with the new {@link Qualifiers.QualifierMap | QualifierMap} if
   * successful, `Failure` with an error message otherwise.
   * @public
   */
  public static createQualifierMap(params: IQualifierMapCreateParams): Result<QualifierMap> {
    return captureResult(() => new QualifierMap(params));
  }

  /**
   * Gets the {@link Qualifiers.Qualifier | Qualifier} at the specified index.
   * @param index - The index of the {@link Qualifiers.Qualifier | Qualifier} to retrieve.
   * @returns `Success` with the {@link Qualifiers.Qualifier | Qualifier} if successful,
   * `Failure` with an error message otherwise.
   */
  public getAt(index: number): Result<Qualifier> {
    if (index < 0 || index >= this.size) {
      return fail(`${index}: qualifier index out of range`);
    }
    const q = Array.from(this.values())[index];
    if (q.index !== index) {
      return fail(`${q.name}: expected index ${index}, got ${q.index}`);
    }
    return succeed(q);
  }

  protected _convertNext(value: unknown): Result<Qualifier> {
    return qualifierFromDecl.convert(value, {
      qualifierTypes: this._qualifierTypes,
      qualifierIndex: this.size
    });
  }
}
