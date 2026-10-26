/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { Converters, Result, succeed } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
import {
  BodyConverterRegistry,
  EntityId,
  IIdentityCodecResult,
  FileTreeMemoryStore,
  IIdentityCodec,
  IIndexedMemoryEntry,
  IMemoryRecord,
  IMemoryRecordResolver,
  IMemoryStoreListFilter,
  IWritePolicy,
  Kind,
  KnowledgeIdentityCodec,
  MemoryId,
  MemoryIndex,
  MemoryScopeKey,
  RecencyRetriever,
  Tag,
  TagRetriever,
  TemporalIdentityCodec,
  TemporalVersionedPolicy,
  envelopeConverter,
  MemoryListSelection,
  scanEveryRecord
} from '../../../index';

const knowledgeKind: Kind = 'knowledge' as Kind;
const knowledgeScope: MemoryScopeKey = 'knowledge' as MemoryScopeKey;

function mutableRoot(): FileTree.IMutableFileTreeDirectoryItem {
  const tree = FileTree.inMemory([], { mutable: true }).orThrow();
  const root = tree.getDirectory('/').orThrow();
  if (!FileTree.isMutableDirectoryItem(root)) {
    throw new Error('expected a mutable root directory');
  }
  return root;
}

function registry(): BodyConverterRegistry {
  const r = BodyConverterRegistry.create().orThrow();
  r.register(knowledgeKind, Converters.string);
  return r;
}

function makeStore(): FileTreeMemoryStore {
  const codecs = new Map<Kind, IIdentityCodec>([[knowledgeKind, new KnowledgeIdentityCodec()]]);
  return FileTreeMemoryStore.create({ root: mutableRoot(), registry: registry(), codecs }).orThrow();
}

function record(id: string, body: string, tags: ReadonlyArray<string> = []): IMemoryRecord<unknown> {
  return {
    envelope: envelopeConverter
      .convert({
        id,
        entityId: id,
        kind: 'knowledge',
        tags: [...tags],
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

/** Counts materializations, so a test can assert what a read actually cost. */
class CountingResolver implements IMemoryRecordResolver {
  public reads: number = 0;
  private readonly _inner: IMemoryRecordResolver;
  public constructor(inner: IMemoryRecordResolver) {
    this._inner = inner;
  }
  public resolveRecord(scope: MemoryScopeKey, id: MemoryId): Result<IMemoryRecord<unknown> | undefined> {
    this.reads += 1;
    return this._inner.resolveRecord(scope, id);
  }
}

/** The store's own index, reached through the injection seam. */
async function indexOf(store: FileTreeMemoryStore): Promise<{ index: MemoryIndex }> {
  const index = MemoryIndex.create().orThrow();
  index.rebuild((await store.listEntries()).orThrow()).orThrow();
  return { index };
}

const temporalKind: Kind = 'fact' as Kind;

/** A store whose `fact` kind is versioned, for the temporal write/delete paths. */
function temporalStore(root: FileTree.IMutableFileTreeDirectoryItem): FileTreeMemoryStore {
  const reg = BodyConverterRegistry.create().orThrow();
  reg.register(temporalKind, Converters.string);
  return FileTreeMemoryStore.create({
    root,
    registry: reg,
    codecs: new Map<Kind, IIdentityCodec>([[temporalKind, TemporalIdentityCodec.create('facts').orThrow()]]),
    writePolicies: new Map<Kind, IWritePolicy>([[temporalKind, TemporalVersionedPolicy.create().orThrow()]])
  }).orThrow();
}

/** A record the consumer hands to `put`; the store mints the version id. */
function versioned(entityId: string, body: string): IMemoryRecord<unknown> {
  return {
    envelope: {
      id: entityId as unknown as IMemoryRecord<unknown>['envelope']['id'],
      entityId: entityId as EntityId,
      kind: temporalKind,
      tags: [],
      links: [],
      created: 0,
      updated: 0,
      seq: 0,
      contentHash: '',
      provenance: { source: 'agent' }
    },
    body
  };
}

async function seeded(ids: ReadonlyArray<string>): Promise<FileTreeMemoryStore> {
  const store = makeStore();
  for (const id of ids) {
    (await store.put(record(id, `body-${id}`))).orThrow();
  }
  return store;
}

describe('partial-read store surface', () => {
  describe('list requires a selection that narrows', () => {
    test('rejects a selection with no narrowing axis, naming the opt-out', async () => {
      const store = await seeded(['a']);
      expect(await store.list({})).toFailWith(/must narrow by scope, kind or tag[\s\S]*scanEveryRecord/);
    });

    test('rejects an asOf-only selection — asOf projects, it does not narrow', async () => {
      // The distinction the message has to carry: `asOf` collapses versions of an
      // entity, it never excludes an entity, so it bounds nothing about how many
      // files a list reads.
      const store = await seeded(['a']);
      expect(await store.list({ asOf: 500 })).toFailWith(/must narrow by scope, kind or tag/);
    });

    test.each([
      ['scope', { scope: knowledgeScope }],
      ['kind', { kind: knowledgeKind }],
      ['tag', { tag: 'tagged' as unknown as Tag }]
    ])('accepts a selection narrowed by %s', async (name, selection) => {
      expect(typeof name).toBe('string');
      const store = makeStore();
      (await store.put(record('a', 'body-a', ['tagged']))).orThrow();
      expect(await store.list(selection as IMemoryStoreListFilter)).toSucceedAndSatisfy(
        (records: ReadonlyArray<IMemoryRecord<unknown>>) => {
          expect(records.map((r) => r.envelope.id)).toEqual(['a']);
        }
      );
    });

    test('scanEveryRecord() reads the whole vault, bodies included', async () => {
      const store = await seeded(['a', 'b']);
      expect(await store.list(scanEveryRecord())).toSucceedAndSatisfy(
        (records: ReadonlyArray<IMemoryRecord<unknown>>) => {
          expect(records.map((r) => r.envelope.id).sort()).toEqual(['a', 'b']);
          expect(records.map((r) => r.body).sort()).toEqual(['body-a', 'body-b']);
        }
      );
    });

    test('scanEveryRecord({ asOf }) carries the temporal projection through', async () => {
      // The reason the opt-out takes `asOf` at all: a whole-vault as-of snapshot
      // is a legitimate thing to want, and without this it would be unsayable.
      const store = await seeded(['a']);
      expect(await store.list(scanEveryRecord({ asOf: 500 }))).toSucceedAndSatisfy(
        (records: ReadonlyArray<IMemoryRecord<unknown>>) => {
          // Non-temporal records are timeless and pass through unchanged.
          expect(records.map((r) => r.envelope.id)).toEqual(['a']);
        }
      );
    });

    test('a scan cannot be combined with a narrowing axis — enforced at COMPILE time', async () => {
      // Not a runtime assertion: the guarantee is that this cannot be written.
      //
      // The union's members are structural, and TypeScript's excess-property check
      // admits any property declared by ANY member of a union — so before the
      // `never` markers, `{ scanEveryRecord: true, kind }` type-checked, `list`
      // took the scan branch, and the narrowing was silently discarded. A call
      // that reads the WHOLE VAULT while looking narrowed is the one outcome a
      // surface built around deliberate whole-vault reads must not permit.
      //
      // `@ts-expect-error` is the pin: if the markers are ever removed, this stops
      // being an error and the directive itself becomes the build failure. Keep it.
      const store = await seeded(['a']);
      // @ts-expect-error -- scanEveryRecord is mutually exclusive with scope/kind/tag
      const mixed: MemoryListSelection = { scanEveryRecord: true, kind: knowledgeKind };
      // Referenced so the binding is not merely unused; the assertion above is the test.
      expect(typeof mixed).toBe('object');
      expect(await store.list(scanEveryRecord())).toSucceed();
    });
  });

  describe('listEntries is the free whole-vault read', () => {
    test('returns every entry as scope + envelope, with no body', async () => {
      const store = await seeded(['a', 'b']);
      expect(await store.listEntries()).toSucceedAndSatisfy((entries: ReadonlyArray<IIndexedMemoryEntry>) => {
        expect(entries.map((e) => e.envelope.id).sort()).toEqual(['a', 'b']);
        expect(entries.every((e) => e.scope === knowledgeScope)).toBe(true);
        // The projection is the point: there is no body to reach for.
        expect(entries.every((e) => !('body' in e))).toBe(true);
        expect(entries.every((e) => !('record' in e))).toBe(true);
      });
    });

    test('needs no selection at all — nothing about it is worth being careful with', async () => {
      // `list` requires a narrowing selection because it reads a file per record.
      // `listEntries` reads none, so requiring one would be ceremony without a
      // reason, and the asymmetry is deliberate rather than an oversight.
      const store = await seeded([]);
      expect(await store.listEntries()).toSucceedWith([]);
    });
  });

  describe('materialization', () => {
    test('a narrowed selection reads only the records it returns', async () => {
      // The property the whole design turns on: selection is over envelopes, so
      // narrowing bounds the READ and not merely the result. Measured through the
      // resolver seam rather than by patching the store, because the seam is the
      // thing that exists to be observed.
      const store = makeStore();
      (await store.put(record('keep', 'body-keep', ['wanted']))).orThrow();
      for (const id of ['x', 'y', 'z']) {
        (await store.put(record(id, `body-${id}`))).orThrow();
      }
      const counting = new CountingResolver(store);
      const retriever = TagRetriever.create({
        index: (await indexOf(store)).index,
        resolver: counting
      }).orThrow();
      expect(await retriever.retrieve({ tag: 'wanted' as Tag })).toSucceedAndSatisfy(
        (records: ReadonlyArray<IMemoryRecord<unknown>>) => {
          expect(records.map((r) => r.envelope.id)).toEqual(['keep']);
        }
      );
      // Four records in the vault, one selected, one file read.
      expect(counting.reads).toBe(1);
    });

    test('limit bounds the READ, not just the result, when no body filter is set', async () => {
      // This is the condition the `limit`-as-narrowing-axis exemption depends on:
      // ordering is on envelope fields, so the page can be taken BEFORE anything
      // is materialized. An ordering keyed on a body field could not do this.
      const store = await seeded(['a', 'b', 'c', 'd', 'e']);
      const counting = new CountingResolver(store);
      const retriever = RecencyRetriever.create({
        index: (await indexOf(store)).index,
        resolver: counting
      }).orThrow();
      expect(await retriever.retrieve({ limit: 2 })).toSucceedAndSatisfy(
        (records: ReadonlyArray<IMemoryRecord<unknown>>) => {
          expect(records).toHaveLength(2);
        }
      );
      expect(counting.reads).toBe(2);
    });

    test('a non-positive limit reads nothing at all', async () => {
      // The page window is applied to ENTRIES on this path, so `limit: 0` is not
      // merely an empty result — it is an empty result that cost no file reads.
      const store = await seeded(['a', 'b']);
      const counting = new CountingResolver(store);
      const retriever = RecencyRetriever.create({
        index: (await indexOf(store)).index,
        resolver: counting
      }).orThrow();
      expect(await retriever.retrieve({ limit: 0 })).toSucceedWith([]);
      expect(counting.reads).toBe(0);
    });

    test('a body filter forces materialization of every envelope-survivor', async () => {
      // The honest cost of `query.filter`: it takes a whole record, so every
      // record surviving the envelope pre-filter has to be read before it can be
      // applied. Semantics are preserved exactly; the cost is not, which is why
      // the guidance is to pair `filter` with an envelope axis.
      const store = await seeded(['a', 'b', 'c']);
      const counting = new CountingResolver(store);
      const retriever = RecencyRetriever.create({
        index: (await indexOf(store)).index,
        resolver: counting
      }).orThrow();
      expect(
        await retriever.retrieve({ limit: 1, filter: (r) => String(r.body).endsWith('-c') })
      ).toSucceedAndSatisfy((records: ReadonlyArray<IMemoryRecord<unknown>>) => {
        expect(records.map((r) => r.envelope.id)).toEqual(['c']);
      });
      // All three read despite `limit: 1` — the filter could not be applied sooner.
      expect(counting.reads).toBe(3);
    });

    test('resolveIdentity returns the codec address without reading the record', async () => {
      // The resolution `get` performs before it reads anything, exposed on its own.
      const store = makeStore();
      expect(store.resolveIdentity('knowledge' as Kind, 'doc-a' as EntityId)).toSucceedAndSatisfy(
        (address: IIdentityCodecResult) => {
          expect(address.scope).toBeDefined();
          expect(address.idStem).toBe('doc-a');
          expect(address.isVersioned).toBe(false);
        }
      );
    });

    test('resolveIdentity fails loudly for a kind with no codec', async () => {
      const store = makeStore();
      expect(store.resolveIdentity('no-such-kind' as Kind, 'doc-a' as EntityId)).toFailWith(
        /no identity codec registered/i
      );
    });

    test('resolveRecord answers an unknown address with undefined, not a failure', async () => {
      // A record can legitimately vanish between selection and materialization,
      // and that is a miss rather than a fault.
      const store = await seeded(['a']);
      expect(store.resolveRecord(knowledgeScope, 'nope' as MemoryId)).toSucceedWith(undefined);
    });

    test('a record that vanishes between selection and materialization is dropped, not fatal', async () => {
      const store = await seeded(['a', 'b']);
      const retriever = RecencyRetriever.create({
        index: (await indexOf(store)).index,
        resolver: {
          resolveRecord: (scope: MemoryScopeKey, id: MemoryId): Result<IMemoryRecord<unknown> | undefined> =>
            id === ('b' as MemoryId) ? succeed(undefined) : store.resolveRecord(scope, id)
        }
      }).orThrow();
      expect(await retriever.retrieve({})).toSucceedAndSatisfy(
        (records: ReadonlyArray<IMemoryRecord<unknown>>) => {
          expect(records.map((r) => r.envelope.id)).toEqual(['a']);
        }
      );
    });

    test('listScoped fails loudly rather than returning a quietly short vault', async () => {
      // It is the sole feed for `asRecordSource()`, and therefore for the vector
      // index's coverage report. A dropped record would land in none of
      // `records` / `excluded` / `indexed` / `declined` / `skipped`, so a caller
      // computing coverage would undercount in the direction of looking
      // healthier — the exact failure `vectorRecordSource`'s tally exists to
      // prevent, reintroduced one layer down. A loud failure is recoverable.
      const root = mutableRoot();
      const codecs = new Map<Kind, IIdentityCodec>([[knowledgeKind, new KnowledgeIdentityCodec()]]);
      const store = FileTreeMemoryStore.create({ root, registry: registry(), codecs }).orThrow();
      (await store.put(record('a', 'body-a'))).orThrow();
      (await store.put(record('b', 'body-b'))).orThrow();

      // Delete one file behind the store's back, leaving the index claiming it —
      // the same observable state a mid-read eviction produces.
      const scopeDir = root
        .getChildren()
        .orThrow()
        .find((c): c is FileTree.IFileTreeDirectoryItem => c.type === 'directory');
      if (scopeDir === undefined) {
        throw new Error('expected the knowledge scope directory');
      }
      const file = scopeDir
        .getChildren()
        .orThrow()
        .find((c): c is FileTree.IFileTreeFileItem => c.type === 'file');
      if (file === undefined || !FileTree.isMutableFileItem(file)) {
        throw new Error('expected a mutable record file');
      }
      file.delete().orThrow();

      expect(await store.listScoped()).toFailWith(/has no record in the vault/);
    });
  });

  describe('a read that fails mid-write propagates rather than being swallowed', () => {
    /** Delete a record's file behind the store's back, leaving the index claiming it. */
    function orphanOne(root: FileTree.IMutableFileTreeDirectoryItem): void {
      // Depth-first: temporal kinds nest one level deeper than flat ones, and the
      // point is only to remove SOME record the index still claims.
      const found: FileTree.IFileTreeFileItem | undefined = firstFile(root);
      if (found === undefined || !FileTree.isMutableFileItem(found)) {
        throw new Error('expected a mutable record file');
      }
      found.delete().orThrow();
    }

    function firstFile(dir: FileTree.IFileTreeDirectoryItem): FileTree.IFileTreeFileItem | undefined {
      for (const child of dir.getChildren().orThrow()) {
        if (child.type === 'file') {
          return child;
        }
        const nested: FileTree.IFileTreeFileItem | undefined = firstFile(child);
        if (nested !== undefined) {
          return nested;
        }
      }
      return undefined;
    }

    test('content dedup fails when the matched record cannot be read', async () => {
      // `_findByContentHash` selects on the envelope's hash and then materializes
      // the ONE match. If that read fails the write must fail too: silently
      // treating it as "no duplicate" would write a second copy of content the
      // vault already claims to hold.
      const root = mutableRoot();
      const codecs = new Map<Kind, IIdentityCodec>([[knowledgeKind, new KnowledgeIdentityCodec()]]);
      const store = FileTreeMemoryStore.create({ root, registry: registry(), codecs }).orThrow();
      (await store.put(record('a', 'shared'))).orThrow();
      orphanOne(root);
      // Same content, different id → content dedup finds 'a' by hash and cannot read it.
      expect(await store.put(record('b', 'shared'))).toFailWith(/has no record in the vault/);
    });

    test('a versioned write fails when the entity version snapshot cannot be read', async () => {
      const root = mutableRoot();
      const store = temporalStore(root);
      (await store.put(versioned('v', 'first'))).orThrow();
      orphanOne(root);
      expect(await store.put(versioned('v', 'second'))).toFailWith(/has no record in the vault/);
    });

    test('a versioned delete fails when the entity version snapshot cannot be read', async () => {
      const root = mutableRoot();
      const store = temporalStore(root);
      (await store.put(versioned('v', 'first'))).orThrow();
      orphanOne(root);
      expect(await store.delete(temporalKind, 'v' as EntityId)).toFailWith(/has no record in the vault/);
    });
  });

  describe('the index holds no bodies', () => {
    test('a reopened store serves reads from the vault, not from retained bodies', async () => {
      const root = mutableRoot();
      const codecs = new Map<Kind, IIdentityCodec>([[knowledgeKind, new KnowledgeIdentityCodec()]]);
      const first = FileTreeMemoryStore.create({ root, registry: registry(), codecs }).orThrow();
      (await first.put(record('a', 'body-a'))).orThrow();

      // A second store over the same tree rebuilds its index by walking the vault.
      // Its `rebuild` takes projected entries, so the walk retains no bodies — and
      // reads still resolve, because the FileTree is the source of truth.
      const second = FileTreeMemoryStore.create({ root, registry: registry(), codecs }).orThrow();
      expect(await second.listEntries()).toSucceedAndSatisfy(
        (entries: ReadonlyArray<IIndexedMemoryEntry>) => {
          expect(entries.map((e) => e.envelope.id)).toEqual(['a']);
        }
      );
      expect(await second.get(knowledgeKind, 'a' as EntityId)).toSucceedAndSatisfy(
        (r: IMemoryRecord<unknown> | undefined) => {
          expect(r?.body).toBe('body-a');
        }
      );
    });
  });
});
