/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, fail, succeed } from '@fgv/ts-utils';
import { ValidatorId } from '../types';
import { IPromptOutputValidationRegistry, IPromptOutputValidator } from './interfaces';

/**
 * In-memory implementation of {@link IPromptOutputValidationRegistry}.
 * @public
 */
export class OutputValidationRegistry<TResponse extends { kind: string }>
  implements IPromptOutputValidationRegistry<TResponse>
{
  private readonly _entries: Map<ValidatorId, IPromptOutputValidator<TResponse>>;

  private constructor() {
    this._entries = new Map();
  }

  /** Family-convention factory. */
  public static create<TResponse extends { kind: string }>(): Result<OutputValidationRegistry<TResponse>> {
    return succeed(new OutputValidationRegistry<TResponse>());
  }

  public register(id: ValidatorId, validator: IPromptOutputValidator<TResponse>): Result<ValidatorId> {
    if (this._entries.has(id)) {
      return fail(`validator '${id}': already registered`);
    }
    this._entries.set(id, validator);
    return succeed(id);
  }

  public get(id: ValidatorId): Result<IPromptOutputValidator<TResponse>> {
    const v = this._entries.get(id);
    if (v === undefined) {
      return fail(`validator '${id}': not registered`);
    }
    return succeed(v);
  }

  public has(id: ValidatorId): boolean {
    return this._entries.has(id);
  }
}
