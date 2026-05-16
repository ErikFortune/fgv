/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Converter, Result, fail, succeed } from '@fgv/ts-utils';
import { ConverterId } from '../types';
import { IPromptConverterRegistry } from './interfaces';

interface IEntry<TResponse extends { kind: string }> {
  readonly kind: TResponse['kind'];
  readonly converter: Converter<TResponse>;
}

/**
 * In-memory implementation of {@link IPromptConverterRegistry}.
 * @public
 */
export class ConverterRegistry<TResponse extends { kind: string }>
  implements IPromptConverterRegistry<TResponse>
{
  private readonly _entries: Map<ConverterId, IEntry<TResponse>>;

  private constructor() {
    this._entries = new Map();
  }

  /** Family-convention factory. */
  public static create<TResponse extends { kind: string }>(): Result<ConverterRegistry<TResponse>> {
    return succeed(new ConverterRegistry<TResponse>());
  }

  public register<T extends TResponse>(
    id: ConverterId,
    kind: T['kind'],
    converter: Converter<T>
  ): Result<ConverterId> {
    if (this._entries.has(id)) {
      return fail(`converter '${id}': already registered`);
    }
    // Converter<T> where T extends TResponse is assignable to Converter<TResponse>
    // because Converter is covariant in its output type. We record the producing
    // kind alongside so callers can re-narrow via get<T>().
    const entry: IEntry<TResponse> = { kind, converter };
    this._entries.set(id, entry);
    return succeed(id);
  }

  public get<T extends TResponse = TResponse>(id: ConverterId): Result<Converter<T>> {
    const entry = this._entries.get(id);
    if (entry === undefined) {
      return fail(`converter '${id}': not registered`);
    }
    // Design-mandated narrowing per §17.2.5: the registry records the kind
    // the producer commits to; consumers ask for a narrower `T` and receive
    // a Converter typed for that T. Runtime kind-mismatch is caught by the
    // chain runner's belt+suspenders check (§17.2.4).
    //
    // Copilot review (PR #362, deferred to B-4): the cast does not verify
    // at compile time that the caller's `T` is compatible with the stored
    // `kind`. A safer surface would either remove the type parameter from
    // `get` (forcing callers to narrow via `value.kind` themselves) or
    // accept the kind discriminator on `get` and verify it before
    // returning, e.g. `get<T>(id, kind: T['kind'])`. B-4 ships the chain
    // runner that asserts kind on every call — once that lands, this
    // narrowing is verified by a runtime guard at the point of use, which
    // is the design's stated contract.
    const narrowed: Converter<T> = entry.converter as unknown as Converter<T>;
    return succeed(narrowed);
  }

  public getKind(id: ConverterId): Result<TResponse['kind']> {
    const entry = this._entries.get(id);
    if (entry === undefined) {
      return fail(`converter '${id}': not registered`);
    }
    return succeed(entry.kind);
  }

  public has(id: ConverterId): boolean {
    return this._entries.has(id);
  }
}
