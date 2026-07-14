/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { Converters, Result, succeed } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
import {
  BodyConverterRegistry,
  FileTreeMemoryStore,
  IBodyConverterRegistry,
  IIdentityCodec,
  IMemoryRecord,
  IScopedMemoryRecord,
  IVectorQueryHit,
  InMemoryCosineIndex,
  Kind,
  MemoryScopeKey,
  MtmIdentityCodec,
  envelopeConverter
} from '../../../index';

const mtmKind: Kind = 'mtm' as Kind;

function mutableRoot(): FileTree.IMutableFileTreeDirectoryItem {
  const tree = FileTree.inMemory([], { mutable: true }).orThrow();
  const root = tree.getDirectory('/').orThrow();
  if (!FileTree.isMutableDirectoryItem(root)) {
    throw new Error('expected a mutable root directory');
  }
  return root;
}

function mtmRecord(entityId: string, idStem: string, body: string): IMemoryRecord<unknown> {
  return {
    envelope: envelopeConverter
      .convert({
        id: idStem,
        entityId,
        kind: 'mtm',
        tags: [],
        links: [],
        created: 0,
        updated: 0,
        seq: 0,
        contentHash: '',
        provenance: { source: 'agent' }
      })
      .orThrow(),
    body
  };
}

// Deterministic keyword-count embedder (no network): the record's vector and a
// query's vector live in the same space so cosine ordering is predictable.
const MARKERS: ReadonlyArray<string> = ['cat', 'dog', 'fish'];
function featureVector(text: string): Float32Array {
  const lower: string = text.toLowerCase();
  return Float32Array.from(MARKERS.map((m) => lower.split(m).length - 1));
}
const recordEmbed = (r: IMemoryRecord<unknown>): Promise<Result<Float32Array>> =>
  Promise.resolve(Converters.string.convert(r.body).onSuccess((body) => succeed(featureVector(body))));

function mtmStore(): FileTreeMemoryStore {
  const registry: IBodyConverterRegistry = BodyConverterRegistry.create().orThrow();
  registry.register(mtmKind, Converters.string);
  return FileTreeMemoryStore.create({
    root: mutableRoot(),
    registry,
    codecs: new Map<Kind, IIdentityCodec>([[mtmKind, new MtmIdentityCodec()]])
  }).orThrow();
}

describe('FileTreeMemoryStore.listScoped', () => {
  test('yields an empty list for an empty store', async () => {
    expect(await mtmStore().listScoped()).toSucceedWith([]);
  });

  test('pairs each record with its scope-qualified (scope, id) address', async () => {
    const store = mtmStore();
    (await store.put(mtmRecord('conv-1:3', 'turn-3', 'cat cat'))).orThrow();
    expect(await store.listScoped()).toSucceedAndSatisfy((scoped: ReadonlyArray<IScopedMemoryRecord>) => {
      expect(scoped).toHaveLength(1);
      expect(scoped[0].target).toEqual({ scope: 'conversations/conv-1', id: 'turn-3' });
      expect(scoped[0].record.envelope.id).toBe('turn-3');
      expect(scoped[0].record.body).toBe('cat cat');
    });
  });

  test('lists two same-stem records in different scopes as distinct entries', async () => {
    // conv-1:3 and conv-2:3 both mint the idStem 'turn-3' but under different
    // scopes — exactly the ambiguity a bare MemoryId could not disambiguate.
    const store = mtmStore();
    (await store.put(mtmRecord('conv-1:3', 'turn-3', 'cat'))).orThrow();
    (await store.put(mtmRecord('conv-2:3', 'turn-3', 'dog'))).orThrow();
    expect(await store.listScoped()).toSucceedAndSatisfy((scoped: ReadonlyArray<IScopedMemoryRecord>) => {
      expect(scoped).toHaveLength(2);
      const byScope = new Map(scoped.map((s) => [s.target.scope, s.target]));
      expect(byScope.get('conversations/conv-1' as MemoryScopeKey)).toEqual({
        scope: 'conversations/conv-1',
        id: 'turn-3'
      });
      expect(byScope.get('conversations/conv-2' as MemoryScopeKey)).toEqual({
        scope: 'conversations/conv-2',
        id: 'turn-3'
      });
    });
  });
});

describe('FileTreeMemoryStore.asRecordSource — drives an IVectorIndex rebuild', () => {
  test('a real store re-indexes an InMemoryCosineIndex on the scoped key', async () => {
    const store = mtmStore();
    (await store.put(mtmRecord('conv-1:3', 'turn-3', 'cat'))).orThrow();
    (await store.put(mtmRecord('conv-2:3', 'turn-3', 'dog'))).orThrow();

    const index = InMemoryCosineIndex.create().orThrow();
    // The store satisfies IMemoryRecordSource via asRecordSource(); rebuild
    // re-embeds every record and keys each vector on the scoped (scope, id).
    expect(await index.rebuild(store.asRecordSource(), recordEmbed)).toSucceedWith(2);
    expect(index.size).toBe(2);

    // The two same-stem records occupy DISTINCT vector entries: a query for 'cat'
    // resolves the conv-1 record; a query for 'dog' resolves conv-2 — each hit
    // carries the full scoped target, not a bare (colliding) id.
    expect(await index.query(featureVector('cat'), 1)).toSucceedAndSatisfy(
      (hits: ReadonlyArray<IVectorQueryHit>) => {
        expect(hits[0].target).toEqual({ scope: 'conversations/conv-1', id: 'turn-3' });
      }
    );
    expect(await index.query(featureVector('dog'), 1)).toSucceedAndSatisfy(
      (hits: ReadonlyArray<IVectorQueryHit>) => {
        expect(hits[0].target).toEqual({ scope: 'conversations/conv-2', id: 'turn-3' });
      }
    );
  });
});
