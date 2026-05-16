/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, succeed } from '@fgv/ts-utils';
import {
  IPromptConverterRegistry,
  IPromptOutputValidationRegistry,
  IPromptRegistry,
  IPromptSlotKindRegistry
} from './interfaces';
import { ConverterRegistry } from './converterRegistry';
import { OutputValidationRegistry } from './outputValidationRegistry';
import { SlotKindRegistry } from './slotKindRegistry';

/**
 * Unified registry combining the three typed sub-registries per design
 * §17.2.1. Parameterized by the consumer's response union `TResponse`.
 *
 * Consumers create an empty registry via `PromptRegistry.create<MyResponses>()`
 * and populate it at boot.
 *
 * @public
 */
export class PromptRegistry<TResponse extends { kind: string } = { kind: string }>
  implements IPromptRegistry<TResponse>
{
  public readonly converters: IPromptConverterRegistry<TResponse>;
  public readonly slotKinds: IPromptSlotKindRegistry;
  public readonly outputValidations: IPromptOutputValidationRegistry<TResponse>;

  private constructor(
    converters: IPromptConverterRegistry<TResponse>,
    slotKinds: IPromptSlotKindRegistry,
    outputValidations: IPromptOutputValidationRegistry<TResponse>
  ) {
    this.converters = converters;
    this.slotKinds = slotKinds;
    this.outputValidations = outputValidations;
  }

  /**
   * Family-convention factory. Returns an empty registry ready to be
   * populated by `.converters.register(...)` / `.slotKinds.register(...)` /
   * `.outputValidations.register(...)`.
   */
  public static create<TResponse extends { kind: string } = { kind: string }>(): Result<
    PromptRegistry<TResponse>
  > {
    return ConverterRegistry.create<TResponse>().onSuccess((converters) =>
      SlotKindRegistry.create().onSuccess((slotKinds) =>
        OutputValidationRegistry.create<TResponse>().onSuccess((outputValidations) =>
          succeed(new PromptRegistry<TResponse>(converters, slotKinds, outputValidations))
        )
      )
    );
  }
}
