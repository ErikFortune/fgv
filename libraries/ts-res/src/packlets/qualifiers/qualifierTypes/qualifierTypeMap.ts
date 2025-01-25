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

import { captureResult, Collections, ConvertingResultMap, Result, Validators } from '@fgv/ts-utils';
import { QualifierType } from './qualifierType';
import { Convert, QualifierTypeName } from '../../common';

/**
 * Factory function for creating {@link QualifierType | QualifierType} objects.
 * @public
 */
export type QualifierTypeFactory = (index: number) => Result<QualifierType>;

/**
 * Parameters used to create a {@link QualifierTypeMap | QualifierTypeMap} from
 * an array of {@link QualifierTypeFactory | QualifierTypeFactory} functions.
 * @public
 */
export interface IQualifierTypeMapCreateWithFactoryParams {
  factories: QualifierTypeFactory[];
}

/**
 * Parameters used to create a {@link QualifierTypeMap | QualifierTypeMap} from
 * an array of {@link QualifierType | QualifierType} objects.
 * @public
 */
export interface IQualifierTypeMapCreateWithObjectParams {
  qualifierTypes: QualifierType[];
}

/**
 * Parameters used to create a {@link QualifierTypeMap | QualifierTypeMap}.
 * @public
 */
export type IQualifierTypeMapCreateParams =
  | IQualifierTypeMapCreateWithFactoryParams
  | IQualifierTypeMapCreateWithObjectParams;

const converters: Collections.KeyValueConverters<QualifierTypeName, QualifierType> =
  new Collections.KeyValueConverters<QualifierTypeName, QualifierType>(
    Convert.qualifierTypeName,
    Validators.isA('QualifierType', (value: unknown) => value instanceof QualifierType)
  );

/**
 * A map of {@link QualifierType | QualifierType} objects.
 * @public
 */
export class QualifierTypeMap extends ConvertingResultMap<QualifierTypeName, QualifierType> {
  /**
   * Creates a new QualifierTypeMap object.
   * @param params - The parameters used to create the map.
   */
  public constructor(params?: IQualifierTypeMapCreateParams) {
    params = params ?? { qualifierTypes: [] };
    const types =
      'qualifierTypes' in params
        ? params.qualifierTypes
        : params.factories.map((factory, index) => {
            return factory(index).orThrow();
          });
    const entries: [QualifierTypeName, QualifierType][] = types.map((qt) => [qt.name, qt]);
    super({ converters, entries });
  }

  /**
   * Creates a new QualifierTypeMap object.
   * @param params - The parameters used to create the map.
   * @returns A Result containing the new QualifierTypeMap object or an error.
   */
  public static createQualifierTypeMap(params: IQualifierTypeMapCreateParams): Result<QualifierTypeMap> {
    return captureResult(() => new QualifierTypeMap(params));
  }
}
