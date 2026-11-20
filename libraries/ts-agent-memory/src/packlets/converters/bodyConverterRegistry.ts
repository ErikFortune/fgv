/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Converter, Converters, Result, fail, succeed } from '@fgv/ts-utils';
import { JsonSchema } from '@fgv/ts-json-base';
import { Kind } from '../types';

/**
 * Registry of per-kind body Converters. Each memory {@link Kind} registers the
 * validated shape of its body; the store dispatches an `unknown` body through
 * the registered Converter on every write. Type-safe — no `any`.
 * @public
 */
export interface IBodyConverterRegistry {
  /**
   * Register a Converter for a kind. Replaces any prior registration for the
   * same kind.
   */
  register<T>(kind: Kind, converter: Converter<T>): void;

  /**
   * Register a `JsonSchema` validator (from `@fgv/ts-json-base`) for a kind —
   * the schema IS a Validator. Replaces any prior registration for the same
   * kind.
   */
  registerSchema<T>(kind: Kind, schema: JsonSchema.ISchemaValidator<T>): void;

  /** Returns `true` if a converter is registered for the kind. */
  has(kind: Kind): boolean;

  /**
   * Get the raw converter registered for a kind. Fails if the kind is
   * unregistered. Exposed for implementors that need to re-validate a patched
   * body (e.g. a temporal-versioned policy's `applyUpdate`).
   */
  getConverter(kind: Kind): Result<Converter<unknown>>;

  /**
   * Convert an `unknown` body value for the given kind. Fails with
   * `no converter registered for kind '<k>'` when unregistered.
   */
  convert(kind: Kind, body: unknown): Result<unknown>;
}

/**
 * Default in-memory {@link IBodyConverterRegistry}.
 *
 * @remarks
 * Both `register` and `registerSchema` adapt the supplied converter/validator
 * into a `Converter<unknown>` via `Converters.generic`, so the heterogeneous
 * per-kind types are stored uniformly with no cast and no `any`. A
 * `Converter<T>` is not structurally a `Converter<unknown>` (the `map` callback
 * makes the type invariant), so the `generic` wrapper — whose callback returns
 * `Result<T>` (assignable to `Result<unknown>`) — is the type-safe bridge.
 * @public
 */
export class BodyConverterRegistry implements IBodyConverterRegistry {
  private readonly _converters: Map<Kind, Converter<unknown>>;

  private constructor() {
    this._converters = new Map<Kind, Converter<unknown>>();
  }

  /** Family-convention factory. */
  public static create(): Result<BodyConverterRegistry> {
    return succeed(new BodyConverterRegistry());
  }

  /** {@inheritDoc IBodyConverterRegistry.register} */
  public register<T>(kind: Kind, converter: Converter<T>): void {
    this._converters.set(
      kind,
      Converters.generic<unknown>((from: unknown) => converter.convert(from))
    );
  }

  /** {@inheritDoc IBodyConverterRegistry.registerSchema} */
  public registerSchema<T>(kind: Kind, schema: JsonSchema.ISchemaValidator<T>): void {
    this._converters.set(
      kind,
      Converters.generic<unknown>((from: unknown) => schema.convert(from))
    );
  }

  /** {@inheritDoc IBodyConverterRegistry.has} */
  public has(kind: Kind): boolean {
    return this._converters.has(kind);
  }

  /** {@inheritDoc IBodyConverterRegistry.getConverter} */
  public getConverter(kind: Kind): Result<Converter<unknown>> {
    const converter: Converter<unknown> | undefined = this._converters.get(kind);
    if (converter === undefined) {
      return fail(`no converter registered for kind '${kind}'`);
    }
    return succeed(converter);
  }

  /** {@inheritDoc IBodyConverterRegistry.convert} */
  public convert(kind: Kind, body: unknown): Result<unknown> {
    return this.getConverter(kind).onSuccess((converter) => converter.convert(body));
  }
}
