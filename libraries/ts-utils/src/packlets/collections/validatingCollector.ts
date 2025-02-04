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
import { ICollectible } from './collectible';
import { IReadOnlyConvertingCollectorValidator } from './convertingCollectorValidator';
import { IReadOnlyValidatingResultMap } from './validatingResultMap';
import { KeyValueConverters } from './keyValueConverters';
import { Collector } from './collector';
import { CollectorValidator } from './collectorValidator';

/**
 * A read-only interface exposing non-mutating methods of a
 * {@link Collections.ValidatingCollector | ValidatingCollector}.
 * @public
 */

export interface IReadOnlyValidatingCollector<
  TKEY extends string = string,
  TINDEX extends number = number,
  TITEM extends ICollectible<TKEY, TINDEX> = ICollectible<TKEY, TINDEX>
> extends IReadOnlyValidatingResultMap<TKEY, TITEM> {
  /**
   * {@inheritdoc Collections.ValidatingConvertingCollector.validating}
   */
  readonly validating: IReadOnlyConvertingCollectorValidator<TKEY, TINDEX, TITEM>;

  /**
   * {@inheritdoc Collections.IReadOnlyValidatingConvertingCollector.getAt}
   */
  readonly getAt: (index: number) => Result<TITEM>;
}

/**
 * Parameters for constructing a {@link Collections.ValidatingCollector | ValidatingCollector}.
 * @public
 */
export interface IValidatingCollectorConstructorParams<
  TKEY extends string = string,
  TINDEX extends number = number,
  TITEM extends ICollectible<TKEY, TINDEX> = ICollectible<TKEY, TINDEX>
> {
  /**
   * {@inheritdoc Collections.ICollectorValidatorCreateParams.converters}
   */
  converters: KeyValueConverters<TKEY, TITEM>;

  /**
   * {@inheritdoc Collections.ICollectorConstructorParams.items}
   */
  items?: TITEM[];
}

/**
 * A {@link Collections.Collector | Collector} with a {@link Collections.CollectorValidator | CollectorValidator}
 * property that enables validated use of the underlying map with weakly-typed keys and values.
 * @public
 */
export class ValidatingCollector<
  TKEY extends string = string,
  TINDEX extends number = number,
  TITEM extends ICollectible<TKEY, TINDEX> = ICollectible<TKEY, TINDEX>
> extends Collector<TKEY, TINDEX, TITEM> {
  /**
   * A {@link Collections.CollectorValidator | CollectorValidator} which validates keys and values
   * before inserting them into this collector.
   */
  public readonly validating: CollectorValidator<TKEY, TINDEX, TITEM>;

  protected readonly _converters: KeyValueConverters<TKEY, TITEM>;

  /**
   * Constructs a new {@link Collections.ValidatingCollector | ValidatingConvertingCollector}
   * from the supplied {@link Collections.IValidatingCollectorConstructorParams | parameters}.
   * @param params - Required parameters for constructing the collector.
   */
  public constructor(params: IValidatingCollectorConstructorParams<TKEY, TINDEX, TITEM>) {
    super();
    this._converters = params.converters;
    this.validating = new CollectorValidator({ collector: this, converters: params.converters });
    for (const item of params.items ?? []) {
      this.getOrAdd(item).orThrow();
    }
  }

  /**
   * Creates a new {@link Collections.ValidatingCollector | ValidatingCollector} instance from
   * the supplied {@link Collections.IValidatingCollectorConstructorParams | parameters}.
   * @param params - Required parameters for constructing the collector.
   * @returns {@link Success} with the new collector if successful, {@link Failure} otherwise.
   */
  public static createValidatingCollector<
    TKEY extends string = string,
    TINDEX extends number = number,
    TITEM extends ICollectible<TKEY, TINDEX> = ICollectible<TKEY, TINDEX>
  >(
    params: IValidatingCollectorConstructorParams<TKEY, TINDEX, TITEM>
  ): Result<ValidatingCollector<TKEY, TINDEX, TITEM>> {
    return captureResult(() => new ValidatingCollector(params));
  }

  /**
   * Gets a read-only version of this collector as a
   * {@link Collections.IReadOnlyValidatingResultMap | read-only map}.
   * @returns
   */
  public toReadOnly(): IReadOnlyValidatingCollector<TKEY, TINDEX, TITEM> {
    return this;
  }
}
