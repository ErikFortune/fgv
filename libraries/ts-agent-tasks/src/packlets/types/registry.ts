/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { JsonSchema, JsonValue } from '@fgv/ts-json-base';
import { Converter, Result } from '@fgv/ts-utils';
import { ITaskSnapshot } from './envelope';
import { TaskResult } from './failure';
import { TaskKind } from './ids';

/**
 * A command descriptor whose parameter type has been erased for storage in a registry.
 *
 * @remarks
 * Erasure is by converter closure, never a cast: {@link ITaskCommandHandle.validate}
 * closes over the descriptor's own schema and encoder, so the parameter type never
 * escapes the registration call that knew it.
 * @public
 */
export interface ITaskCommandHandle {
  readonly name: string;
  readonly idempotency: 'source-key' | 'none';
  readonly conditional: boolean;
  /**
   * Validates caller-supplied parameters through the registered schema and re-encodes
   * them, yielding the canonical JSON form that is deduplicated and stored.
   */
  validate(parameters: unknown): Result<JsonValue>;
}

/**
 * Registration of one `(kind, detailVersion)` pair.
 *
 * @remarks
 * `details` is the runtime converter and is authoritative for domain invariants — it is
 * what `convert`, `decode` and `encode` all run.
 *
 * `detailSchema`, when present, is additionally the wire schema a model is offered.
 * **Registration does not check that the two agree**, and cannot: agreement is a claim
 * about every value, which no signature-level check can settle. It is a *fixture*
 * obligation — a registration's tests assert that the schema and the converter accept and
 * reject the same things, which is how the built-in kinds' agreement is established here.
 * @public
 */
export interface ITaskKindDescriptor<T> {
  readonly kind: TaskKind;
  readonly detailVersion: number;
  readonly details: Converter<T>;
  readonly detailSchema?: JsonSchema.ISchemaValidator<T>;
  readonly encode: (value: T) => Result<JsonValue>;
  readonly commands?: ReadonlyArray<ITaskCommandHandle>;
}

/**
 * The typed handle returned by a successful registration.
 *
 * @remarks
 * There is deliberately no `get<T>(id)` that trusts a caller-selected type. A handle
 * re-checks kind and detail version on every decode and obtains `T` through the
 * converter it was registered with, so a snapshot of another kind — or of another
 * version of the same kind — fails rather than being reinterpreted.
 * @public
 */
export interface ITaskKindHandle<T> {
  readonly kind: TaskKind;
  readonly detailVersion: number;
  decode(snapshot: ITaskSnapshot): Result<ITaskSnapshot<T>>;
  encode(snapshot: ITaskSnapshot<T>): Result<ITaskSnapshot>;
  getCommand(name: string): Result<ITaskCommandHandle>;
  readonly commandNames: ReadonlyArray<string>;
}

/**
 * Registry of task kinds and their commands.
 *
 * @remarks
 * Duplicate `(kind, detailVersion)` registrations fail. Registrations are frozen when a
 * broker is opened, so a kind cannot appear or change underneath committed data.
 * @public
 */
export interface ITaskKindRegistry {
  register<T>(descriptor: ITaskKindDescriptor<T>): Result<ITaskKindHandle<T>>;
  /**
   * Validates an unknown snapshot into its common envelope plus validated JSON details.
   * Fails with `unknown-kind-version` when the `(kind, detailVersion)` pair is not
   * registered — an unknown version is never treated as a validated current type.
   */
  convert(snapshot: unknown): TaskResult<ITaskSnapshot>;
  has(kind: TaskKind, detailVersion: number): boolean;
  /**
   * The command handle a registered kind declares under `name`. Fails for an unregistered kind or
   * an undeclared command. (T6: the broker validates an external command's parameters through the
   * kind that registered them, the one authority for its schema.)
   */
  getCommand(kind: TaskKind, detailVersion: number, name: string): Result<ITaskCommandHandle>;
  readonly isFrozen: boolean;
  /** Freezes the registry, and reports how many registrations it holds. */
  freeze(): Result<number>;
}
