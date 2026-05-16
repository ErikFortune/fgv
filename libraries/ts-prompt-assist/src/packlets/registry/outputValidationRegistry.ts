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
import type { SlotName, ValidatorId, PromptId, IBindingTraceEntry } from '../types';

/**
 * Context passed to output validators.
 * @public
 */
export interface IOutputValidationContext {
  /** The prompt id. */
  readonly promptId: PromptId;
  /** The resolved substitutions. */
  readonly substitutions: ReadonlyMap<SlotName, IBindingTraceEntry>;
}

/**
 * An output validator that validates and optionally normalizes prompt output.
 * Type parameter `T` is the type of value validated and returned.
 * @public
 */
export interface IPromptOutputValidator<T = unknown> {
  /**
   * Validates the output. Returns a (possibly normalized) value of type `T`.
   */
  validate(output: T, context: IOutputValidationContext): Result<T>;
}

/**
 * Registry of output validators indexed by id.
 * @public
 */
export interface IPromptOutputValidationRegistry {
  /** Register a validator. Returns the id on success. */
  register(id: ValidatorId, validator: IPromptOutputValidator): Result<ValidatorId>;
  /** Get a typed validator. Fails if not registered. */
  get<T>(id: ValidatorId): Result<IPromptOutputValidator<T>>;
  /** Check if a validator is registered. */
  has(id: ValidatorId): boolean;
}

/**
 * Default implementation of {@link IPromptOutputValidationRegistry}.
 * @public
 */
export class PromptOutputValidationRegistry implements IPromptOutputValidationRegistry {
  private readonly _validators: Map<ValidatorId, IPromptOutputValidator> = new Map();

  /** {@inheritDoc IPromptOutputValidationRegistry.register} */
  public register(id: ValidatorId, validator: IPromptOutputValidator): Result<ValidatorId> {
    if (this._validators.has(id)) {
      return fail(`output validator '${id}' is already registered`);
    }
    this._validators.set(id, validator);
    return succeed(id);
  }

  /** {@inheritDoc IPromptOutputValidationRegistry.get} */
  public get<T>(id: ValidatorId): Result<IPromptOutputValidator<T>> {
    const validator = this._validators.get(id);
    if (validator === undefined) {
      return fail(`output validator '${id}' is not registered`);
    }
    return succeed(validator as IPromptOutputValidator<T>);
  }

  /** {@inheritDoc IPromptOutputValidationRegistry.has} */
  public has(id: ValidatorId): boolean {
    return this._validators.has(id);
  }
}
