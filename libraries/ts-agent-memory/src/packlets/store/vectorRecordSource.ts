/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, succeed } from '@fgv/ts-utils';
import { Kind } from '../types';
import { IMemoryRecordListing, IMemoryRecordSource, IScopedMemoryRecord } from '../vector';

/**
 * The two store capabilities the vector record source needs, taken structurally
 * so this module does not import the store (which imports it).
 */
export interface IVectorRecordSourceHost {
  /** The whole-vault scoped listing, unfiltered. */
  listScoped(): Promise<Result<ReadonlyArray<IScopedMemoryRecord>>>;
  /** Whether records of `kind` participate in the record-granular vector index. */
  embedsKind(kind: Kind): boolean;
}

/**
 * Adapt a store's whole-vault scoped listing into the `IMemoryRecordSource` a
 * vector-index rebuild reads: filtered to the kinds that participate in the
 * record-granular index, and **counting what it drops**.
 *
 * @remarks
 * The filter exists because this source drives `IVectorIndex` rebuilds, so a kind
 * excluded from that index has no business being re-embedded on open — which is
 * where the cost is worst, since a rebuild embeds the whole vault serially. With
 * no `embedKinds` declaration every kind passes and this is the identity filter.
 *
 * The **tally** exists because this is the only layer that can produce it. A
 * rebuild never sees an excluded record and so cannot count one; a coverage report
 * assembled without this number leaves those records in none of `indexed` /
 * `declined` / `skipped`, and a caller computing coverage undercounts — in the
 * direction of looking healthier.
 *
 * The map is always present, empty when nothing was excluded: this source can
 * always say, so it always does. An absent `excluded` means *"this source does not
 * track exclusions"*, which is a different answer and not one this source gives.
 */
export function vectorRecordSource(host: IVectorRecordSourceHost): IMemoryRecordSource {
  return {
    list: async (): Promise<Result<IMemoryRecordListing>> =>
      (await host.listScoped()).onSuccess((scoped: ReadonlyArray<IScopedMemoryRecord>) => {
        const excluded: Map<Kind, number> = new Map<Kind, number>();
        const records: ReadonlyArray<IScopedMemoryRecord> = scoped.filter((s) => {
          const kind: Kind = s.record.envelope.kind;
          if (host.embedsKind(kind)) {
            return true;
          }
          excluded.set(kind, (excluded.get(kind) ?? 0) + 1);
          return false;
        });
        return succeed({ records, excluded });
      })
  };
}
