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

import { Result, fail, succeed } from '@fgv/ts-utils';

/**
 * Serializes a slot value to a string for Mustache substitution.
 * @public
 */
export interface ISlotSerializer {
  /** Serialize the value to a string. */
  serialize(value: unknown): Result<string>;
}

/**
 * Registry of slot serializers indexed by kind string.
 * @public
 */
export interface IPromptSlotKindRegistry {
  /** Register a serializer. Returns the kind on success. */
  register(kind: string, serializer: ISlotSerializer): Result<string>;
  /** Get a serializer. Fails if not registered. */
  get(kind: string): Result<ISlotSerializer>;
  /** Check if a kind is registered. */
  has(kind: string): boolean;
}

/**
 * Default implementation of {@link IPromptSlotKindRegistry}.
 * @public
 */
export class PromptSlotKindRegistry implements IPromptSlotKindRegistry {
  private readonly _serializers = new Map<string, ISlotSerializer>();

  /** {@inheritDoc IPromptSlotKindRegistry.register} */
  public register(kind: string, serializer: ISlotSerializer): Result<string> {
    if (this._serializers.has(kind)) {
      return fail(`slot kind '${kind}' is already registered`);
    }
    this._serializers.set(kind, serializer);
    return succeed(kind);
  }

  /** {@inheritDoc IPromptSlotKindRegistry.get} */
  public get(kind: string): Result<ISlotSerializer> {
    const serializer = this._serializers.get(kind);
    if (serializer === undefined) {
      return fail(`slot kind '${kind}' is not registered`);
    }
    return succeed(serializer);
  }

  /** {@inheritDoc IPromptSlotKindRegistry.has} */
  public has(kind: string): boolean {
    return this._serializers.has(kind);
  }
}
