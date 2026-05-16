/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Converter, Result } from '@fgv/ts-utils';
import { ConverterId, SlotName, ValidatorId } from '../types';
import { IBindingTraceEntry } from '../types';
import { PromptId } from '../types';

/**
 * Slot-kind serializer — turns a typed slot value into its string form for
 * Mustache substitution. Used when a slot's `kind` is non-string.
 * @public
 */
export interface ISlotSerializer {
  serialize(value: unknown): Result<string>;
}

/**
 * Context supplied to output validators.
 * @public
 */
export interface IOutputValidationContext {
  readonly promptId: PromptId;
  readonly substitutions: ReadonlyMap<SlotName, IBindingTraceEntry>;
}

/**
 * Output validator parameterized by the consumer's response union
 * (`TResponse extends \{ kind: string \}`). The chain runtime only invokes
 * `validate` when `value.kind` matches `appliesTo`.
 * @public
 */
export interface IPromptOutputValidator<TResponse extends { kind: string }> {
  /**
   * Discriminator value(s) this validator applies to. Single string for
   * single-kind validators; readonly array for cross-kind validators.
   */
  readonly appliesTo: TResponse['kind'] | ReadonlyArray<TResponse['kind']>;
  /**
   * Validates the converted output. The chain runner only invokes this when
   * `value.kind` matches `appliesTo`; defensive code may re-check.
   */
  validate(value: TResponse, context: IOutputValidationContext): Result<true>;
}

/**
 * Converter sub-registry — tracks the declared response kind alongside
 * each registered Converter so the loader can verify a descriptor's
 * `outputValidations[]` are compatible at load time (see design §17.2.4).
 * @public
 */
export interface IPromptConverterRegistry<TResponse extends { kind: string }> {
  /**
   * Registers a Converter that produces a specific `TResponse` member. The
   * `kind` parameter is the discriminator value the Converter promises to
   * emit; the runtime asserts this on first invocation per descriptor.
   */
  register<T extends TResponse>(
    id: ConverterId,
    kind: T['kind'],
    converter: Converter<T>
  ): Result<ConverterId>;

  /** Retrieves a registered Converter, narrowed to `T`. */
  get<T extends TResponse = TResponse>(id: ConverterId): Result<Converter<T>>;

  /** Returns the declared response kind for a registered Converter. */
  getKind(id: ConverterId): Result<TResponse['kind']>;

  /** True iff the given id is registered. */
  has(id: ConverterId): boolean;
}

/**
 * Slot-kind serializer sub-registry. Closed-vocabulary slot kinds (non
 * `'string'`) require a registered serializer.
 * @public
 */
export interface IPromptSlotKindRegistry {
  register(kind: string, serializer: ISlotSerializer): Result<string>;
  get(kind: string): Result<ISlotSerializer>;
  has(kind: string): boolean;
}

/**
 * Output validation sub-registry.
 * @public
 */
export interface IPromptOutputValidationRegistry<TResponse extends { kind: string }> {
  register(id: ValidatorId, validator: IPromptOutputValidator<TResponse>): Result<ValidatorId>;
  get(id: ValidatorId): Result<IPromptOutputValidator<TResponse>>;
  has(id: ValidatorId): boolean;
}

/**
 * Unified registry exposing the three typed sub-registries (per OQ-4 and
 * design §17.2.1). `TResponse` is the consumer-extended response union;
 * defaults to the open `\{ kind: string \}` lower bound for consumers who
 * only use free-text output.
 * @public
 */
export interface IPromptRegistry<TResponse extends { kind: string } = { kind: string }> {
  readonly converters: IPromptConverterRegistry<TResponse>;
  readonly slotKinds: IPromptSlotKindRegistry;
  readonly outputValidations: IPromptOutputValidationRegistry<TResponse>;
}
