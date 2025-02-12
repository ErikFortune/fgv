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
import { CollectibleFactory, CollectibleKey, ICollectible } from './collectible';
import { ConvertingCollector } from './convertingCollector';
import { ConvertingCollectorValidator } from './convertingCollectorValidator';
import { KeyValueEntry } from './common';
import { KeyValueConverters } from './keyValueConverters';
import { IReadOnlyValidatingCollector } from './validatingCollector';

/**
 * Parameters for constructing a {@link Collections.ValidatingConvertingCollector | ValidatingConvertingCollector}.
 * @public
 */
export interface IValidatingConvertingCollectorConstructorParams<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TITEM extends ICollectible<any, any>,
  TSRC = TITEM
> {
  /**
   * {@inheritdoc Collections.IConvertingCollectorConstructorParams.factory}
   */
  factory: CollectibleFactory<TITEM, TSRC>;

  /**
   * {@inheritdoc Collections.IConvertingCollectorValidatorCreateParams.converters}
   */
  converters: KeyValueConverters<CollectibleKey<TITEM>, TSRC>;

  /**
   * {@inheritdoc Collections.IConvertingCollectorConstructorParams.entries}
   */
  entries?: KeyValueEntry<CollectibleKey<TITEM>, TSRC>[];
}

/**
 * A {@link Collections.ConvertingCollector | ConvertingCollector} with a
 * {@link Collections.ConvertingCollectorValidator | ConvertingCollectorValidator}
 * property that enables validated use of the underlying map with weakly-typed keys and values.
 * @public
 */
export class ValidatingConvertingCollector<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TITEM extends ICollectible<any, any>,
  TSRC = TITEM
> extends ConvertingCollector<TITEM, TSRC> {
  /**
   * A {@link Collections.ConvertingCollectorValidator | ConvertingCollectorValidator} which validates keys and values
   * before inserting them into this collector.
   */
  public readonly validating: ConvertingCollectorValidator<TITEM, TSRC>;

  protected readonly _converters: KeyValueConverters<CollectibleKey<TITEM>, TSRC>;

  /**
   * Constructs a new {@link Collections.ValidatingConvertingCollector | ValidatingConvertingCollector}
   * from the supplied {@link Collections.IValidatingConvertingCollectorConstructorParams | parameters}.
   * @param params - Required parameters for constructing the collector.
   */
  public constructor(params: IValidatingConvertingCollectorConstructorParams<TITEM, TSRC>) {
    super({ factory: params.factory });
    this._converters = params.converters;
    this.validating = new ConvertingCollectorValidator({ collector: this, converters: params.converters });
    for (const entry of params.entries ?? []) {
      this.getOrAdd(entry[0], entry[1]).orThrow();
    }
  }

  /**
   * Creates a new {@link Collections.ValidatingConvertingCollector | ValidatingConvertingCollector} instance from
   * the supplied {@link Collections.IValidatingConvertingCollectorConstructorParams | parameters}.
   * @param params - Required parameters for constructing the collector.
   * @returns {@link Success} with the new collector if successful, {@link Failure} otherwise.
   */
  public static createValidatingCollector<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TITEM extends ICollectible<any, any>,
    TSRC = TITEM
  >(
    params: IValidatingConvertingCollectorConstructorParams<TITEM, TSRC>
  ): Result<ValidatingConvertingCollector<TITEM, TSRC>> {
    return captureResult(() => new ValidatingConvertingCollector(params));
  }

  /**
   * Gets a read-only version of this collector as a
   * {@link Collections.IReadOnlyValidatingResultMap | read-only map}.
   * @returns
   */
  public toReadOnly(): IReadOnlyValidatingCollector<TITEM> {
    return this;
  }
}
