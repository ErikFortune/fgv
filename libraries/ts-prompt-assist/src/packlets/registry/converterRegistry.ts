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

  public get<T extends TResponse = TResponse>(id: ConverterId): Result<Converter<T>>;
  public get<T extends TResponse>(id: ConverterId, kind: T['kind']): Result<Converter<T>>;
  public get<T extends TResponse>(id: ConverterId, kind?: T['kind']): Result<Converter<T>> {
    const entry = this._entries.get(id);
    if (entry === undefined) {
      return fail(`converter '${id}': not registered`);
    }
    if (kind !== undefined && entry.kind !== kind) {
      return fail(
        `converter '${id}': registered kind '${entry.kind}' does not match requested kind '${kind}'`
      );
    }
    // Design-mandated narrowing per §17.2.5: the registry records the kind
    // the producer commits to. The no-kind overload trusts the caller; the
    // kind-verified overload guarantees the entry.kind matches before
    // returning. Either way the chain runner's belt+suspenders check
    // (§17.2.4) verifies value.kind at the point of use.
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
