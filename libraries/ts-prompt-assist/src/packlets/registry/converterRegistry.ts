/*
 * Copyright (c) 2026 Erik Fortune
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

import { Converter, Result, fail, succeed } from '@fgv/ts-utils';
import type { ConverterId } from '../types';

/**
 * Registry of output converters indexed by id.
 * @public
 */
export interface IPromptConverterRegistry {
  /** Register a converter. Returns the id on success. */
  register<T>(id: ConverterId, converter: Converter<T>): Result<ConverterId>;
  /** Get a converter. Fails if not registered. */
  get<T>(id: ConverterId): Result<Converter<T>>;
  /** Check if a converter is registered. */
  has(id: ConverterId): boolean;
}

/**
 * Default implementation of {@link IPromptConverterRegistry}.
 * @public
 */
export class PromptConverterRegistry implements IPromptConverterRegistry {
  private readonly _converters: Map<ConverterId, Converter<unknown>> = new Map();

  /** {@inheritDoc IPromptConverterRegistry.register} */
  public register<T>(id: ConverterId, converter: Converter<T>): Result<ConverterId> {
    if (this._converters.has(id)) {
      return fail(`converter '${id}' is already registered`);
    }
    this._converters.set(id, converter as Converter<unknown>);
    return succeed(id);
  }

  /** {@inheritDoc IPromptConverterRegistry.get} */
  public get<T>(id: ConverterId): Result<Converter<T>> {
    const converter = this._converters.get(id);
    if (converter === undefined) {
      return fail(`converter '${id}' is not registered`);
    }
    return succeed(converter as Converter<T>);
  }

  /** {@inheritDoc IPromptConverterRegistry.has} */
  public has(id: ConverterId): boolean {
    return this._converters.has(id);
  }
}
