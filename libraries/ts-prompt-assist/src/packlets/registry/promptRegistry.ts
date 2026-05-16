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

import { Result, captureResult } from '@fgv/ts-utils';
import { IPromptConverterRegistry, PromptConverterRegistry } from './converterRegistry';
import { IPromptSlotKindRegistry, PromptSlotKindRegistry } from './slotKindRegistry';
import { IPromptOutputValidationRegistry, PromptOutputValidationRegistry } from './outputValidationRegistry';

/**
 * Unified registry for all prompt-assist registrations.
 * @public
 */
export interface IPromptRegistry {
  /** Output converter registry. */
  readonly converters: IPromptConverterRegistry;
  /** Slot-kind serializer registry. */
  readonly slotKinds: IPromptSlotKindRegistry;
  /** Output validation registry. */
  readonly outputValidations: IPromptOutputValidationRegistry;
}

/**
 * Default implementation of {@link IPromptRegistry}.
 * @public
 */
export class PromptRegistry implements IPromptRegistry {
  /** {@inheritDoc IPromptRegistry.converters} */
  public readonly converters: IPromptConverterRegistry;
  /** {@inheritDoc IPromptRegistry.slotKinds} */
  public readonly slotKinds: IPromptSlotKindRegistry;
  /** {@inheritDoc IPromptRegistry.outputValidations} */
  public readonly outputValidations: IPromptOutputValidationRegistry;

  private constructor(
    converters: IPromptConverterRegistry,
    slotKinds: IPromptSlotKindRegistry,
    outputValidations: IPromptOutputValidationRegistry
  ) {
    this.converters = converters;
    this.slotKinds = slotKinds;
    this.outputValidations = outputValidations;
  }

  /**
   * Creates a new empty {@link PromptRegistry}.
   * @returns Success with the registry.
   */
  public static create(): Result<PromptRegistry> {
    return captureResult(
      () =>
        new PromptRegistry(
          new PromptConverterRegistry(),
          new PromptSlotKindRegistry(),
          new PromptOutputValidationRegistry()
        )
    );
  }

  /**
   * Creates a new empty {@link PromptRegistry} without wrapping in Result.
   * Use in tests or initialization where failure is not expected.
   * @returns An empty PromptRegistry.
   */
  public static empty(): PromptRegistry {
    return new PromptRegistry(
      new PromptConverterRegistry(),
      new PromptSlotKindRegistry(),
      new PromptOutputValidationRegistry()
    );
  }
}
