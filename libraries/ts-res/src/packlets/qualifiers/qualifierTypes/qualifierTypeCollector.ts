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

import * as Common from '../../common';
import {
  Collections,
  Result,
  ValidatingConvertingCollector,
  captureResult,
  fail,
  succeed
} from '@fgv/ts-utils';
import { QualifierType } from './qualifierType';
import { QualifierTypeName } from '../../common';

/**
 * Parameters for creating a new {@link Qualifiers.QualifierTypes.QualifierTypeCollector | QualifierTypeCollector}.
 * @public
 */
export interface IQualifierTypeCollectorCreateParams {
  /**
   * Optional list of {@link Qualifiers.QualifierType | QualifierTypes} to add to the collector
   * on creation.
   */
  qualifierTypes?: QualifierType[];
}

/**
 * Collector for {@link Qualifiers.QualifierType | QualifierType} objects.
 * @public
 */
export class QualifierTypeCollector extends ValidatingConvertingCollector<QualifierType, QualifierType> {
  /**
   * Constructor for a {@link Qualifiers.QualifierTypes.QualifierTypeCollector | QualifierTypeCollector} object.
   * @param params - Optional {@link Qualifiers.QualifierTypes.IQualifierTypeCollectorCreateParams | parameters} used to construct the collector.
   */
  protected constructor(params?: IQualifierTypeCollectorCreateParams) {
    super({
      converters: new Collections.KeyValueConverters({
        key: Common.Convert.qualifierTypeName,
        value: QualifierTypeCollector._toQualifierType
      }),
      factory: QualifierTypeCollector._qualifierTypeFactory
    });

    params?.qualifierTypes?.forEach((qt) => {
      this.getOrAdd(qt.name, qt);
    });
  }

  /**
   * Creates a new {@link Qualifiers.QualifierTypes.QualifierTypeCollector | QualifierTypeCollector} object.
   * @param params - Optional {@link Qualifiers.QualifierTypes.IQualifierTypeCollectorCreateParams | parameters}
   * used to create the collector.
   * @returns `Success` with the new collector if successful, or `Failure` if not.
   */
  public static create(params?: IQualifierTypeCollectorCreateParams): Result<QualifierTypeCollector> {
    return captureResult(() => new QualifierTypeCollector(params));
  }

  protected static _qualifierTypeFactory(
    key: QualifierTypeName,
    index: number,
    value: QualifierType
  ): Result<QualifierType> {
    return succeed(value);
  }

  protected static _toQualifierType(from: unknown): Result<QualifierType> {
    return from instanceof QualifierType ? succeed(from) : fail('not a QualifierType');
  }
}

/**
 * Interface exposing non-mutating members of a {@link Qualifiers.QualifierTypes.QualifierTypeCollector | QualifierTypeCollector}.
 * @public
 */
export type ReadOnlyQualifierTypeCollector = Collections.IReadOnlyValidatingCollector<QualifierType>;
