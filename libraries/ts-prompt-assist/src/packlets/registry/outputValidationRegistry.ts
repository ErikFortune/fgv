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
import type { SlotName, ValidatorId } from '../types/ids';
import type { PromptId } from '../types/ids';
import type { IBindingTraceEntry } from '../types/descriptor';

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
 * @public
 */
export interface IPromptOutputValidator {
  /**
   * Validates the output. Returns a (possibly normalized) value.
   * Validators may return a different type than they receive to normalize.
   */
  validate(output: unknown, context: IOutputValidationContext): Result<unknown>;
}

/**
 * Registry of output validators indexed by id.
 * @public
 */
export interface IPromptOutputValidationRegistry {
  /** Register a validator. Returns the id on success. */
  register(id: ValidatorId, validator: IPromptOutputValidator): Result<ValidatorId>;
  /** Get a validator. Fails if not registered. */
  get(id: ValidatorId): Result<IPromptOutputValidator>;
  /** Check if a validator is registered. */
  has(id: ValidatorId): boolean;
}

/**
 * Default implementation of {@link IPromptOutputValidationRegistry}.
 * @public
 */
export class PromptOutputValidationRegistry implements IPromptOutputValidationRegistry {
  private readonly _validators = new Map<ValidatorId, IPromptOutputValidator>();

  /** {@inheritDoc IPromptOutputValidationRegistry.register} */
  public register(id: ValidatorId, validator: IPromptOutputValidator): Result<ValidatorId> {
    if (this._validators.has(id)) {
      return fail(`output validator '${id}' is already registered`);
    }
    this._validators.set(id, validator);
    return succeed(id);
  }

  /** {@inheritDoc IPromptOutputValidationRegistry.get} */
  public get(id: ValidatorId): Result<IPromptOutputValidator> {
    const validator = this._validators.get(id);
    if (validator === undefined) {
      return fail(`output validator '${id}' is not registered`);
    }
    return succeed(validator);
  }

  /** {@inheritDoc IPromptOutputValidationRegistry.has} */
  public has(id: ValidatorId): boolean {
    return this._validators.has(id);
  }
}
