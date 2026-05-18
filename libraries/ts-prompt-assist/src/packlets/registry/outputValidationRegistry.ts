/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, fail, succeed } from '@fgv/ts-utils';
import { IPromptResponseBase, ValidatorId } from '../types';
import { IPromptOutputValidationRegistry, IPromptOutputValidator } from './interfaces';

/**
 * In-memory implementation of {@link IPromptOutputValidationRegistry}.
 * @public
 */
export class OutputValidationRegistry<TResponse extends IPromptResponseBase>
  implements IPromptOutputValidationRegistry<TResponse>
{
  private readonly _entries: Map<ValidatorId, IPromptOutputValidator<TResponse>>;

  private constructor() {
    this._entries = new Map();
  }

  /** Family-convention factory. */
  public static create<TResponse extends IPromptResponseBase>(): Result<OutputValidationRegistry<TResponse>> {
    return succeed(new OutputValidationRegistry<TResponse>());
  }

  /** {@inheritDoc IPromptOutputValidationRegistry.register} */
  public register(id: ValidatorId, validator: IPromptOutputValidator<TResponse>): Result<ValidatorId> {
    if (this._entries.has(id)) {
      return fail(`validator '${id}': already registered`);
    }
    this._entries.set(id, validator);
    return succeed(id);
  }

  /** {@inheritDoc IPromptOutputValidationRegistry.get} */
  public get(id: ValidatorId): Result<IPromptOutputValidator<TResponse>> {
    const v = this._entries.get(id);
    if (v === undefined) {
      return fail(`validator '${id}': not registered`);
    }
    return succeed(v);
  }

  /** {@inheritDoc IPromptOutputValidationRegistry.has} */
  public has(id: ValidatorId): boolean {
    return this._entries.has(id);
  }
}
