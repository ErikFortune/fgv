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

import { captureResult, Result } from '../base';
import { KeyValueEntry } from './common';
import { KeyValueConverters } from './keyValueConverters';
import { IReadOnlyResultMap } from './readonlyResultMap';
import { ResultMap } from './resultMap';
import { IReadOnlyResultMapValidator, ResultMapValidator } from './resultMapValidator';

/**
 * A read-only interface exposing non-mutating methods of a {@link Collections.ValidatingResultMap | ValidatingResultMap}.
 * @public
 */
export interface IReadOnlyValidatingResultMap<TK extends string = string, TV = unknown>
  extends IReadOnlyResultMap<TK, TV> {
  /**
   * {@inheritdoc Collections.ValidatingResultMap.validating}
   */
  readonly validating: IReadOnlyResultMapValidator<TK, TV>;
}

/**
 * Parameters for constructing a {@link Collections.ResultMap | ResultMap}.
 * @public
 */
export interface IValidatingResultMapConstructorParams<TK extends string = string, TV = unknown> {
  entries?: Iterable<KeyValueEntry<string, unknown>>;
  converters: KeyValueConverters<TK, TV>;
}

/**
 * A {@link Collections.ResultMap | ResultMap} with a {@link Collections.ResultMapValidator | validator}
 * property that enables validated use of the underlying map with weakly-typed keys and values.
 * @public
 */
export class ValidatingResultMap<TK extends string = string, TV = unknown>
  extends ResultMap<TK, TV>
  implements IReadOnlyValidatingResultMap<TK, TV>
{
  /**
   * A {@link Collections.ResultMapValidator | ResultMapValidator} which validates keys and values
   * before inserting them into this collection.
   */
  public readonly validating: ResultMapValidator<TK, TV>;

  /**
   * Constructs a new {@link Collections.ValidatingResultMap | ValidatingResultMap}.
   * @param params - Required parameters for constructing the map.
   */
  public constructor(params: IValidatingResultMapConstructorParams<TK, TV>) {
    const entries = params.converters.convertEntries([...(params.entries ?? [])]).orThrow();
    super({ entries });
    this.validating = new ResultMapValidator<TK, TV>({ map: this, converters: params.converters });
  }

  /**
   * Creates a new {@link Collections.ValidatingResultMap | ValidatingResultMap} instance.
   * @param params - Required parameters for constructing the map.
   * @returns `Success` with the new map if successful, `Failure` otherwise.
   * @public
   */
  public static createValidatingResultMap<TK extends string = string, TV = unknown>(
    params: IValidatingResultMapConstructorParams<TK, TV>
  ): Result<ValidatingResultMap<TK, TV>> {
    return captureResult(() => new ValidatingResultMap(params));
  }

  /**
   * Gets a read-only version of this map.
   */
  public toReadOnly(): IReadOnlyValidatingResultMap<TK, TV> {
    return this;
  }
}
