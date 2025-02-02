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
import { CollectibleFactory, ICollectible } from './collectible';
import { Collector } from './collector';
import { CollectorValidator, IReadOnlyCollectorValidator } from './collectorValidator';
import { KeyValueEntry } from './common';
import { IReadOnlyValidatingResultMap } from './validatingResultMap';
import { KeyValueConverters } from './keyValueConverters';

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
   * {@inheritdoc Collections.ValidatingCollector.validating}
   */
  readonly validating: IReadOnlyCollectorValidator<TKEY, TINDEX, TITEM>;

  /**
   * {@inheritdoc Collections.Collector.getAt}
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
  TITEM extends ICollectible<TKEY, TINDEX> = ICollectible<TKEY, TINDEX>,
  TSRC = TITEM
> {
  /**
   * {@inheritdoc Collections.ICollectorConstructorParams.factory}
   */
  factory: CollectibleFactory<TKEY, TINDEX, TITEM, TSRC>;

  /**
   * {@inheritdoc Collections.ICollectorValidatorCreateParams.converters}
   */
  converters: KeyValueConverters<TKEY, TSRC>;

  /**
   * {@inheritdoc Collections.ICollectorConstructorParams.entries}
   */
  entries?: KeyValueEntry<TKEY, TSRC>[];
}

/**
 * A {@link Collections.Collector | Collector} with a {@link Collections.CollectorValidator | CollectorValidator}
 * property that enables validated use of the underlying map with weakly-typed keys and values.
 * @public
 */
export class ValidatingCollector<
  TKEY extends string = string,
  TINDEX extends number = number,
  TITEM extends ICollectible<TKEY, TINDEX> = ICollectible<TKEY, TINDEX>,
  TSRC = TITEM
> extends Collector<TKEY, TINDEX, TITEM, TSRC> {
  /**
   * A {@link Collections.CollectorValidator | CollectorValidator} which validates keys and values
   * before inserting them into this collector.
   */
  public readonly validating: CollectorValidator<TKEY, TINDEX, TITEM, TSRC>;

  protected readonly _converters: KeyValueConverters<TKEY, TSRC>;

  /**
   * Constructs a new {@link Collections.ValidatingCollector | ValidatingCollector}
   * from the supplied {@link Collections.IValidatingCollectorConstructorParams | parameters}.
   * @param params - Required parameters for constructing the collector.
   */
  public constructor(params: IValidatingCollectorConstructorParams<TKEY, TINDEX, TITEM, TSRC>) {
    super({ factory: params.factory });
    this._converters = params.converters;
    this.validating = new CollectorValidator({ collector: this, converters: params.converters });
    for (const entry of params.entries ?? []) {
      this.getOrAdd(entry[0], entry[1]).orThrow();
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
    TITEM extends ICollectible<TKEY, TINDEX> = ICollectible<TKEY, TINDEX>,
    TSRC = TITEM
  >(
    params: IValidatingCollectorConstructorParams<TKEY, TINDEX, TITEM, TSRC>
  ): Result<ValidatingCollector<TKEY, TINDEX, TITEM, TSRC>> {
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
