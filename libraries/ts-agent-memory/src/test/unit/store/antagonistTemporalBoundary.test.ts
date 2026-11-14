/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

/**
 * Antagonist torture tests — bi-temporal / two-clock boundary math (target class
 * 2), complementing `temporalCodec.test.ts` (which already covers the
 * `invalid_at`-exclusive boundary and the future-dated-supersede no-gap case).
 * This file targets two remaining gaps: the `valid_at`-inclusive boundary, and
 * an out-of-order sequence of `valid_at` writes.
 */

import '@fgv/ts-utils-jest';
import { Converters } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
import {
  BodyConverterRegistry,
  EntityId,
  FileTreeMemoryStore,
  IBodyConverterRegistry,
  IIdentityCodec,
  IMemoryRecord,
  IWritePolicy,
  Kind,
  MemoryScopeKey,
  TemporalIdentityCodec,
  TemporalVersionedPolicy,
  envelopeConverter,
  isVersionValidAt
} from '../../../index';

const factKind: Kind = 'fact' as Kind;
const factScope: MemoryScopeKey = 'facts/entities/fact-1' as MemoryScopeKey;

function mutableRoot(): FileTree.IMutableFileTreeDirectoryItem {
  const tree = FileTree.inMemory([], { mutable: true }).orThrow();
  const root = tree.getDirectory('/').orThrow();
  if (!FileTree.isMutableDirectoryItem(root)) {
    throw new Error('expected a mutable root directory');
  }
  return root;
}

function registry(): IBodyConverterRegistry {
  const reg = BodyConverterRegistry.create().orThrow();
  reg.register(factKind, Converters.string);
  return reg;
}

const codecs: ReadonlyMap<Kind, IIdentityCodec> = new Map<Kind, IIdentityCodec>([
  [factKind, TemporalIdentityCodec.create('facts').orThrow()]
]);
const policies: ReadonlyMap<Kind, IWritePolicy> = new Map<Kind, IWritePolicy>([
  [factKind, TemporalVersionedPolicy.create().orThrow()]
]);

function factRecordAt(entityId: string, body: string, validAt?: number): IMemoryRecord<unknown> {
  return {
    envelope: {
      id: entityId as unknown as IMemoryRecord<unknown>['envelope']['id'],
      entityId: entityId as EntityId,
      kind: factKind,
      tags: [],
      links: [],
      created: 0,
      updated: 0,
      seq: 0,
      contentHash: '',
      provenance: { source: 'agent' },
      ...(validAt !== undefined ? { temporal: { valid_at: validAt } } : {})
    },
    body
  };
}

describe('antagonist — isVersionValidAt: valid_at is INCLUSIVE (start-boundary parity with the exclusive end)', () => {
  // Wrong impl this catches: a `>` (strict) comparison for the start boundary
  // instead of `<=`, which would incorrectly exclude the instant a version FIRST
  // became valid — an asymmetry with the already-tested exclusive end boundary.
  test('a version is valid AT its own valid_at instant, not just strictly after it', () => {
    const v1 = {
      envelope: envelopeConverter
        .convert({
          id: 'fact-1-v1',
          entityId: 'fact-1',
          kind: 'fact',
          tags: [],
          links: [],
          created: 100,
          updated: 100,
          seq: 1,
          contentHash: 'h1',
          provenance: { source: 'agent' },
          temporal: { valid_at: 100, invalid_at: 200 }
        })
        .orThrow(),
      body: 'v1'
    };
    expect(isVersionValidAt(v1, 99)).toBe(false); // strictly before
    expect(isVersionValidAt(v1, 100)).toBe(true); // AT valid_at — inclusive start
    expect(isVersionValidAt(v1, 199)).toBe(true); // just before invalid_at
    expect(isVersionValidAt(v1, 200)).toBe(false); // AT invalid_at — exclusive end
  });
});

describe('antagonist — out-of-order valid_at sequence (no gap/overlap regardless of write order)', () => {
  let clockValue: number;
  const clock = (): number => clockValue;

  function createStore(): FileTreeMemoryStore {
    return FileTreeMemoryStore.create({
      root: mutableRoot(),
      registry: registry(),
      codecs,
      writePolicies: policies,
      clock
    }).orThrow();
  }

  // Wrong impl this catches: an implementation that assumes valid_at is
  // monotonically increasing with seq (e.g. sorts by valid_at instead of seq for
  // "current" resolution), which breaks the moment a caller backdates a SECOND
  // time after an earlier future-dated write.
  test('two consecutive backdated writes still close each prior interval at the NEW valid_at, not now', async () => {
    const store = createStore();
    clockValue = 1000;
    // v1: valid_at defaults to transaction time (1000).
    expect(await store.put(factRecordAt('fact-1', 'blue'))).toSucceed();

    clockValue = 2000;
    // v2: backdated BEHIND v1's own valid_at (500 < 1000) — a correction asserting
    // "actually, this was already true starting at t=500".
    expect(await store.put(factRecordAt('fact-1', 'grey', 500))).toSucceedAndSatisfy((put) => {
      expect(put.envelope.temporal).toEqual({ valid_at: 500 });
    });
    // v1's interval must close at v2's valid_at (500), not the transaction time (2000).
    expect(await store.getById(factScope, 'fact-1-v1' as never)).toSucceedAndSatisfy((v1) => {
      expect(v1?.envelope.temporal).toEqual({ valid_at: 1000, invalid_at: 500 });
    });

    clockValue = 3000;
    // v3: backdated again, even further behind (100 < 500) — a SECOND correction.
    expect(await store.put(factRecordAt('fact-1', 'black', 100))).toSucceedAndSatisfy((put) => {
      expect(put.envelope.temporal).toEqual({ valid_at: 100 });
    });
    // v2's interval must close at v3's valid_at (100), not the transaction time (3000).
    expect(await store.getById(factScope, 'fact-1-v2' as never)).toSucceedAndSatisfy((v2) => {
      expect(v2?.envelope.temporal).toEqual({ valid_at: 500, invalid_at: 100 });
    });
    // `selectCurrentVersion` still resolves the newest write by `seq` (v3),
    // regardless of `valid_at` no longer being seq-monotonic.
    expect(await store.get(factKind, 'fact-1' as EntityId)).toSucceedAndSatisfy((cur) => {
      expect(cur?.envelope.id).toBe('fact-1-v3');
      expect(cur?.body).toBe('black');
    });
  });
});
