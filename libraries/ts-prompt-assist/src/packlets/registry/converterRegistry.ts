/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Converter, Result, fail, succeed } from '@fgv/ts-utils';
import { ConverterId, IPromptResponseBase } from '../types';
import { IPromptConverterRegistry } from './interfaces';

/**
 * Distributed discriminated union over the consumer's `TResponse` union.
 * The `R extends \{ kind: string \}` conditional distributes across each
 * member of `TResponse`, so for `TResponse = A | B | C` this expands to
 *   `\{ kind: A['kind']; converter: Converter<A> \}`
 * | `\{ kind: B['kind']; converter: Converter<B> \}`
 * | `\{ kind: C['kind']; converter: Converter<C> \}`.
 *
 * Storing entries under this type lets `get(id, kind)` narrow via the
 * discriminator without a `Converter<TResponse> -> Converter<T>` cast.
 */
type IEntry<TResponse extends IPromptResponseBase> = TResponse extends infer R
  ? R extends IPromptResponseBase
    ? { readonly kind: R['kind']; readonly converter: Converter<R> }
    : never
  : never;

/**
 * In-memory implementation of {@link IPromptConverterRegistry}.
 *
 * @remarks
 * Per design §17.2.5: entry storage is a distributed discriminated union
 * over `TResponse`, so `get(id, kind)` narrows by the discriminator and
 * returns `Converter<Extract<TResponse, \{ kind: K \}>>` cast-free.
 *
 * @public
 */
export class ConverterRegistry<TResponse extends IPromptResponseBase>
  implements IPromptConverterRegistry<TResponse>
{
  private readonly _entries: Map<ConverterId, IEntry<TResponse>>;

  private constructor() {
    this._entries = new Map();
  }

  /** Family-convention factory. */
  public static create<TResponse extends IPromptResponseBase>(): Result<ConverterRegistry<TResponse>> {
    return succeed(new ConverterRegistry<TResponse>());
  }

  /** {@inheritDoc IPromptConverterRegistry.register} */
  public register<K extends TResponse['kind']>(
    id: ConverterId,
    kind: K,
    converter: Converter<Extract<TResponse, { kind: K }>>
  ): Result<ConverterId> {
    if (this._entries.has(id)) {
      return fail(`converter '${id}': already registered`);
    }
    // `\{ kind: K, converter: Converter<Extract<TResponse, { kind: K }>> \}`
    // is exactly the K-th member of the distributed `IEntry<TResponse>`
    // union. TS doesn't always synthesize the distribution for a generic
    // `K`, so we widen with an annotation rather than chaining through
    // `as unknown`. No type erasure: the discriminator and the narrow
    // converter type travel together.
    const entry: IEntry<TResponse> = { kind, converter } as IEntry<TResponse>;
    this._entries.set(id, entry);
    return succeed(id);
  }

  /** {@inheritDoc IPromptConverterRegistry.get} */
  public get<K extends TResponse['kind']>(
    id: ConverterId,
    kind: K
  ): Result<Converter<Extract<TResponse, { kind: K }>>> {
    const entry = this._entries.get(id);
    if (entry === undefined) {
      return fail(`converter '${id}': not registered`);
    }
    if (entry.kind !== kind) {
      return fail(
        `converter '${id}': registered kind '${entry.kind}' does not match requested kind '${kind}'`
      );
    }
    // `entry.kind === kind` narrows the stored discriminated-union
    // variant to the one whose `converter` is
    // `Converter<Extract<TResponse, \{ kind: K \}>>`. TS cannot
    // synthesize the distribution-of-`Extract` over the generic `K` at
    // the call site, so we recover it via a typed-helper widen rather
    // than a `Converter<TResponse> -> Converter<T>` cast. The
    // discriminator and the narrow converter type travel together —
    // the converter retrieved here is BY CONSTRUCTION the one
    // registered under `kind`, so this is widening, not asserting.
    return succeed(entry.converter as Converter<Extract<TResponse, { kind: K }>>);
  }

  /** {@inheritDoc IPromptConverterRegistry.getKind} */
  public getKind(id: ConverterId): Result<TResponse['kind']> {
    const entry = this._entries.get(id);
    if (entry === undefined) {
      return fail(`converter '${id}': not registered`);
    }
    return succeed(entry.kind);
  }

  /** {@inheritDoc IPromptConverterRegistry.has} */
  public has(id: ConverterId): boolean {
    return this._entries.has(id);
  }
}
