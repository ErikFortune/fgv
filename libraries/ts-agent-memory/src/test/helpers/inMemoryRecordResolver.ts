/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, succeed } from '@fgv/ts-utils';
import {
  IIndexedMemoryEntry,
  IMemoryRecord,
  IMemoryRecordResolver,
  MemoryId,
  MemoryScopeKey,
  edgeTargetKey
} from '../../index';

/**
 * A test `IMemoryRecordResolver` backed by a fixed set of records, keyed on the
 * scope-qualified address exactly as the index is.
 *
 * @remarks
 * Shared rather than hand-rolled per suite on purpose: a partial resolver cast
 * into place is the mock-shape contagion `CODING_STANDARDS.md` names, and it
 * would have been written a dozen times over during this conversion.
 *
 * An address it does not hold resolves `succeed(undefined)` — the "vanished
 * between selection and materialization" case, which the contract treats as a
 * miss rather than a fault.
 */
export class InMemoryRecordResolver implements IMemoryRecordResolver {
  private readonly _byKey: Map<string, IMemoryRecord<unknown>>;
  /** Every address `resolveRecord` was called with, in call order. */
  public readonly calls: { scope: MemoryScopeKey; id: MemoryId }[] = [];

  public constructor(entries: ReadonlyArray<{ scope: MemoryScopeKey; record: IMemoryRecord<unknown> }>) {
    this._byKey = new Map(
      entries.map((e) => [edgeTargetKey({ scope: e.scope, id: e.record.envelope.id }), e.record])
    );
  }

  /** The projected index entries for the same records. */
  public get entries(): ReadonlyArray<IIndexedMemoryEntry> {
    return Array.from(this._byKey.entries()).map(([key, record]) => ({
      scope: key.split('\0')[0] as MemoryScopeKey,
      envelope: record.envelope
    }));
  }

  /** How many records this resolver was asked to materialize. */
  public get resolvedCount(): number {
    return this.calls.length;
  }

  public resolveRecord(scope: MemoryScopeKey, id: MemoryId): Result<IMemoryRecord<unknown> | undefined> {
    this.calls.push({ scope, id });
    return succeed(this._byKey.get(edgeTargetKey({ scope, id })));
  }
}
