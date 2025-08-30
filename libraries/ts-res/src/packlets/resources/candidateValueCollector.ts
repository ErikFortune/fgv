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

import { JsonValue, Validators as JsonValidators } from '@fgv/ts-json-base';
import { Collections, Hash, Result, captureResult, succeed, ValidatingCollector } from '@fgv/ts-utils';
import { Convert as CommonConvert, CandidateValueIndex, CandidateValueKey } from '../common';
import { CandidateValue } from './candidateValue';

/**
 * Parameters for creating a {@link Resources.CandidateValueCollector}.
 * @public
 */
export interface ICandidateValueCollectorCreateParams {
  /**
   * Optional normalizer to use for normalizing JSON values.
   * If not provided, a default Crc32Normalizer will be used.
   */
  normalizer?: Hash.Crc32Normalizer;

  /**
   * Optional initial candidate values to add to the collection.
   */
  candidateValues?: (CandidateValue | JsonValue)[];
}

/**
 * A `ValidatingCollector` for {@link Resources.CandidateValue | CandidateValues},
 * which collects candidate values supplied as either {@link Resources.CandidateValue | CandidateValue} or
 * `JsonValue`.
 * @public
 */
export class CandidateValueCollector extends ValidatingCollector<CandidateValue> {
  private readonly _normalizer: Hash.Crc32Normalizer;
  private readonly _indexToValue: Map<CandidateValueIndex, CandidateValue> = new Map();

  /**
   * Constructor for a {@link Resources.CandidateValueCollector} object.
   * @param params - Parameters to create the collector.
   * @internal
   */
  protected constructor(params: ICandidateValueCollectorCreateParams = {}) {
    super({
      converters: new Collections.KeyValueConverters<CandidateValueKey, CandidateValue>({
        key: CommonConvert.candidateValueKey,
        value: (from: unknown) => this._toCandidateValue(from)
      })
    });
    this._normalizer = params?.normalizer ?? new Hash.Crc32Normalizer();
    params.candidateValues?.forEach((candidateValue) => this.validating.add(candidateValue));
  }

  /**
   * Creates a new {@link Resources.CandidateValueCollector} object.
   * @param params - Parameters to create the collector.
   * @returns `Success` with the new collector if successful,
   * or `Failure` with an error message if not.
   * @public
   */
  public static create(params?: ICandidateValueCollectorCreateParams): Result<CandidateValueCollector> {
    return captureResult(() => new CandidateValueCollector(params));
  }

  /**
   * Converter method to handle CandidateValue | JsonValue.
   * @param from - The value to convert.
   * @returns `Success` with the CandidateValue if successful, or `Failure` with an error message if not.
   * @internal
   */
  private _toCandidateValue(from: unknown): Result<CandidateValue> {
    if (from instanceof CandidateValue) {
      return succeed(from);
    }

    // Validate as JsonValue and create new CandidateValue
    return JsonValidators.jsonValue
      .validate(from)
      .withErrorFormat((msg) => `Invalid JSON value: ${msg}`)
      .onSuccess((jsonValue) => {
        return CandidateValue.create({
          json: jsonValue,
          normalizer: this._normalizer
        });
      });
  }
}
