/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Converter, Result } from '@fgv/ts-utils';
import { ConverterId, PromptOutputValidatorAppliesTo, SlotName, ValidatorId } from '../types';
import { IBindingTraceEntry, IPromptResponseBase } from '../types';
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
export interface IPromptOutputValidator<TResponse extends IPromptResponseBase> {
  /**
   * Discriminator value(s) this validator applies to. Single string for
   * single-kind validators; readonly array for cross-kind validators.
   */
  readonly appliesTo: PromptOutputValidatorAppliesTo<TResponse>;
  /**
   * Validates the converted output. The chain runner only invokes this when
   * `value.kind` matches `appliesTo`; defensive code may re-check.
   */
  validate(value: TResponse, context: IOutputValidationContext): Result<true>;
}

/**
 * Converter sub-registry — tracks the declared response kind alongside
 * each registered Converter so the loader can verify a descriptor's
 * `outputValidations[]` are compatible at load time (see design §17.2.4)
 * AND so the runtime dispatch flows the narrow Converter type
 * end-to-end without a cast (see design §17.2.5).
 *
 * @remarks
 * Both `register` and `get` key off the response kind `K` rather than
 * a caller-asserted `T`. This makes the converter's produced type the
 * one source of truth — `Converter<Extract<TResponse, \{ kind: K \}>>` —
 * for both registration and lookup, eliminating the type-system-erasure
 * cast that the §17.2.5 redesign acknowledged.
 *
 * @public
 */
export interface IPromptConverterRegistry<TResponse extends IPromptResponseBase> {
  /**
   * Registers a Converter that produces the `TResponse` member discriminated
   * by `kind`. The Converter's `T` is `Extract<TResponse, \{ kind: K \}>` —
   * no caller-asserted generic.
   */
  register<K extends TResponse['kind']>(
    id: ConverterId,
    kind: K,
    converter: Converter<Extract<TResponse, { kind: K }>>
  ): Result<ConverterId>;

  /**
   * Retrieves a registered Converter narrowed to the `TResponse` member
   * matching `kind`. Cast-free in callers: the return type is
   * `Converter<Extract<TResponse, \{ kind: K \}>>` directly. Fails if no
   * Converter is registered under `id`, or if the registered Converter's
   * recorded kind doesn't equal `kind`.
   */
  get<K extends TResponse['kind']>(
    id: ConverterId,
    kind: K
  ): Result<Converter<Extract<TResponse, { kind: K }>>>;

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
  /**
   * Registers a serializer for the given slot kind. Fails if `kind` is
   * empty or if `kind` is already registered. `kind` is a plain string
   * (not a branded id), so the implementation enforces non-emptiness
   * here.
   */
  register(kind: string, serializer: ISlotSerializer): Result<string>;
  /** Returns the registered serializer for `kind`. Fails if not registered. */
  get(kind: string): Result<ISlotSerializer>;
  /** True iff a serializer is registered for `kind`. */
  has(kind: string): boolean;
}

/**
 * Output validation sub-registry.
 * @public
 */
export interface IPromptOutputValidationRegistry<TResponse extends IPromptResponseBase> {
  /** Registers a validator under `id`. Fails if `id` is already registered. */
  register(id: ValidatorId, validator: IPromptOutputValidator<TResponse>): Result<ValidatorId>;
  /** Returns the validator registered under `id`. Fails if not registered. */
  get(id: ValidatorId): Result<IPromptOutputValidator<TResponse>>;
  /** True iff a validator is registered under `id`. */
  has(id: ValidatorId): boolean;
}

/**
 * Unified registry exposing the three typed sub-registries (per OQ-4 and
 * design §17.2.1). `TResponse` is the consumer-extended response union;
 * defaults to the open `\{ kind: string \}` lower bound for consumers who
 * only use free-text output.
 * @public
 */
export interface IPromptRegistry<TResponse extends IPromptResponseBase = IPromptResponseBase> {
  readonly converters: IPromptConverterRegistry<TResponse>;
  readonly slotKinds: IPromptSlotKindRegistry;
  readonly outputValidations: IPromptOutputValidationRegistry<TResponse>;
}
