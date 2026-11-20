/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, fail, succeed } from '@fgv/ts-utils';
import { IPromptSlotKindRegistry, ISlotSerializer } from './interfaces';

/**
 * In-memory implementation of {@link IPromptSlotKindRegistry}.
 * @public
 */
export class SlotKindRegistry implements IPromptSlotKindRegistry {
  private readonly _entries: Map<string, ISlotSerializer>;

  private constructor() {
    this._entries = new Map();
  }

  /** Family-convention factory. */
  public static create(): Result<SlotKindRegistry> {
    return succeed(new SlotKindRegistry());
  }

  /** {@inheritDoc IPromptSlotKindRegistry.register} */
  public register(kind: string, serializer: ISlotSerializer): Result<string> {
    if (kind.length === 0) {
      return fail('slot kind: must be a non-empty string');
    }
    if (this._entries.has(kind)) {
      return fail(`slot kind '${kind}': already registered`);
    }
    this._entries.set(kind, serializer);
    return succeed(kind);
  }

  /** {@inheritDoc IPromptSlotKindRegistry.get} */
  public get(kind: string): Result<ISlotSerializer> {
    const serializer = this._entries.get(kind);
    if (serializer === undefined) {
      return fail(`slot kind '${kind}': not registered`);
    }
    return succeed(serializer);
  }

  /** {@inheritDoc IPromptSlotKindRegistry.has} */
  public has(kind: string): boolean {
    return this._entries.has(kind);
  }
}
