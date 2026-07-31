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
  FileTreeMemoryStore,
  IBodyConverterRegistry,
  IEdgeTarget,
  IIdentityCodec,
  IIndexedMemoryRecord,
  IMemoryIndex,
  IMemoryRecord,
  Kind,
  KnowledgeIdentityCodec,
  MemoryId,
  MemoryIndex,
  MemoryIndexPatchOp,
  MemoryScopeKey,
  RecencyRetriever,
  Tag,
  envelopeConverter
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

function knowledgeRecord(id: string, body: string, tags: ReadonlyArray<string> = []): IMemoryRecord<unknown> {
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

function storeWith(index?: IMemoryIndex, root?: FileTree.IMutableFileTreeDirectoryItem): FileTreeMemoryStore {
  const registry: IBodyConverterRegistry = BodyConverterRegistry.create().orThrow();
  registry.register(knowledgeKind, Converters.string);
  return FileTreeMemoryStore.create({
    root: root ?? mutableRoot(),
    registry,
    codecs: new Map<Kind, IIdentityCodec>([[knowledgeKind, new KnowledgeIdentityCodec()]]),
    index
  }).orThrow();
}

/** One recorded {@link IMemoryIndex.patch} call. */
interface IPatchCall {
  readonly op: MemoryIndexPatchOp;
  readonly scope: MemoryScopeKey;
  readonly id: string;
}

/**
 * A counting/timing decorator over the shipped `MemoryIndex` — the exact shape
 * the injection seam exists to enable. Every call is delegated verbatim, so a
 * store wired with one behaves identically to a store using the default index;
 * the recorded counts are the measurement the consumer is after.
 */
class RecordingMemoryIndex implements IMemoryIndex {
  public readonly rebuildSizes: number[] = [];
  public readonly patchCalls: IPatchCall[] = [];
  public entriesCalls: number = 0;

  private readonly _inner: IMemoryIndex;

  private constructor(inner: IMemoryIndex) {
    this._inner = inner;
  }

  public static create(): Result<RecordingMemoryIndex> {
    return MemoryIndex.create().onSuccess((inner) => succeed(new RecordingMemoryIndex(inner)));
  }

  public rebuild(entries: ReadonlyArray<IIndexedMemoryRecord>): Result<number> {
    this.rebuildSizes.push(entries.length);
    return this._inner.rebuild(entries);
  }

  public patch(op: MemoryIndexPatchOp, entry: IIndexedMemoryRecord): Result<IIndexedMemoryRecord> {
    this.patchCalls.push({ op, scope: entry.scope, id: entry.record.envelope.id });
    return this._inner.patch(op, entry);
  }

  public entries(): ReadonlyArray<IIndexedMemoryRecord> {
    this.entriesCalls += 1;
    return this._inner.entries();
  }

  public byKind(kind: Kind): ReadonlyArray<IMemoryRecord<unknown>> {
    return this._inner.byKind(kind);
  }

  public byTag(tag: Tag): ReadonlyArray<IMemoryRecord<unknown>> {
    return this._inner.byTag(tag);
  }

  public byRecency(): ReadonlyArray<IMemoryRecord<unknown>> {
    return this._inner.byRecency();
  }

  public byRank(): ReadonlyArray<IMemoryRecord<unknown>> {
    return this._inner.byRank();
  }

  public backlinks(target: IEdgeTarget): ReadonlyArray<IEdgeTarget> {
    return this._inner.backlinks(target);
  }
}

/**
 * An index that hides every record whose body contains `hidden` from the
 * `entries()` read surface. Not a realistic index — it exists to prove the store
 * reads from the INJECTED index rather than one it built for itself. A store
 * with a private index could not produce these results.
 */
class HidingMemoryIndex implements IMemoryIndex {
  private readonly _inner: IMemoryIndex;

  private constructor(inner: IMemoryIndex) {
    this._inner = inner;
  }

  public static create(): Result<HidingMemoryIndex> {
    return MemoryIndex.create().onSuccess((inner) => succeed(new HidingMemoryIndex(inner)));
  }

  public rebuild(entries: ReadonlyArray<IIndexedMemoryRecord>): Result<number> {
    return this._inner.rebuild(entries);
  }

  public patch(op: MemoryIndexPatchOp, entry: IIndexedMemoryRecord): Result<IIndexedMemoryRecord> {
    return this._inner.patch(op, entry);
  }

  public entries(): ReadonlyArray<IIndexedMemoryRecord> {
    return this._inner.entries().filter((e) => !String(e.record.body).includes('hidden'));
  }

  public byKind(kind: Kind): ReadonlyArray<IMemoryRecord<unknown>> {
    return this._inner.byKind(kind);
  }

  public byTag(tag: Tag): ReadonlyArray<IMemoryRecord<unknown>> {
    return this._inner.byTag(tag);
  }

  public byRecency(): ReadonlyArray<IMemoryRecord<unknown>> {
    return this._inner.byRecency();
  }

  public byRank(): ReadonlyArray<IMemoryRecord<unknown>> {
    return this._inner.byRank();
  }

  public backlinks(target: IEdgeTarget): ReadonlyArray<IEdgeTarget> {
    return this._inner.backlinks(target);
  }
}

describe('FileTreeMemoryStore index injection', () => {
  describe('default (index omitted)', () => {
    test('creates and serves reads from a default MemoryIndex', async () => {
      const store = storeWith();
      (await store.put(knowledgeRecord('doc-a', 'alpha'))).orThrow();
      (await store.put(knowledgeRecord('doc-b', 'beta'))).orThrow();

      expect(await store.list()).toSucceedAndSatisfy((records: ReadonlyArray<IMemoryRecord<unknown>>) => {
        expect(records.map((r) => r.envelope.id).sort()).toEqual(['doc-a', 'doc-b']);
      });
      expect(await store.get(knowledgeKind, 'doc-a' as EntityId)).toSucceedAndSatisfy(
        (record: IMemoryRecord<unknown> | undefined) => {
          expect(record?.body).toBe('alpha');
        }
      );
      expect(await store.listScoped()).toSucceedAndSatisfy((scoped) => {
        expect(scoped).toHaveLength(2);
      });
    });

    test('reopening an existing vault re-indexes it and resumes seq', async () => {
      const root = mutableRoot();
      const first = storeWith(undefined, root);
      (await first.put(knowledgeRecord('doc-a', 'alpha'))).orThrow();

      const reopened = storeWith(undefined, root);
      expect(await reopened.list()).toSucceedAndSatisfy((records: ReadonlyArray<IMemoryRecord<unknown>>) => {
        expect(records).toHaveLength(1);
        expect(records[0].envelope.id).toBe('doc-a');
      });
      // seq resumes past the persisted high-water mark rather than restarting at 1.
      expect(await reopened.put(knowledgeRecord('doc-b', 'beta'))).toSucceedAndSatisfy(
        (record: IMemoryRecord<unknown>) => {
          expect(record.envelope.seq).toBe(2);
        }
      );
    });
  });

  describe('injected index', () => {
    test('receives the create() rebuild of an existing vault', async () => {
      const root = mutableRoot();
      const seeded = storeWith(undefined, root);
      (await seeded.put(knowledgeRecord('doc-a', 'alpha'))).orThrow();
      (await seeded.put(knowledgeRecord('doc-b', 'beta'))).orThrow();

      const recording = RecordingMemoryIndex.create().orThrow();
      const reopened = storeWith(recording, root);

      // create() rebuilt the injected index exactly once, with both persisted records.
      expect(recording.rebuildSizes).toEqual([2]);
      expect(recording.patchCalls).toEqual([]);
      expect(await reopened.list()).toSucceedAndSatisfy((records: ReadonlyArray<IMemoryRecord<unknown>>) => {
        expect(records.map((r) => r.envelope.id).sort()).toEqual(['doc-a', 'doc-b']);
      });
    });

    test('receives a put patch and a delete patch', async () => {
      const recording = RecordingMemoryIndex.create().orThrow();
      const store = storeWith(recording);

      // The empty-vault open still rebuilds (with zero entries) and patches nothing.
      expect(recording.rebuildSizes).toEqual([0]);
      expect(recording.patchCalls).toEqual([]);

      (await store.put(knowledgeRecord('doc-a', 'alpha'))).orThrow();
      expect(recording.patchCalls).toEqual([{ op: 'put', scope: knowledgeScope, id: 'doc-a' }]);

      // A content revision of the same id is another 'put' patch, not a second entry.
      (await store.put(knowledgeRecord('doc-a', 'alpha revised'))).orThrow();
      expect(recording.patchCalls).toHaveLength(2);
      expect(recording.patchCalls[1]).toEqual({ op: 'put', scope: knowledgeScope, id: 'doc-a' });

      expect(await store.delete(knowledgeKind, 'doc-a' as EntityId)).toSucceedWith('doc-a' as MemoryId);
      expect(recording.patchCalls[2]).toEqual({ op: 'delete', scope: knowledgeScope, id: 'doc-a' });
    });

    test('serves the store read surface — no second index is built', async () => {
      const recording = RecordingMemoryIndex.create().orThrow();
      const store = storeWith(recording);
      (await store.put(knowledgeRecord('doc-a', 'alpha', ['topic']))).orThrow();

      const before: number = recording.entriesCalls;
      expect(await store.list()).toSucceed();
      expect(await store.listScoped()).toSucceed();
      expect(recording.entriesCalls).toBeGreaterThan(before);

      // The injected index really holds the store's records: its projection views
      // (never touched by the store itself) answer from the patched state.
      expect(recording.byKind(knowledgeKind).map((r) => r.envelope.id)).toEqual(['doc-a']);
      expect(recording.byTag('topic' as Tag).map((r) => r.envelope.id)).toEqual(['doc-a']);
      expect(recording.byRecency().map((r) => r.envelope.id)).toEqual(['doc-a']);
      expect(recording.byRank().map((r) => r.envelope.id)).toEqual(['doc-a']);
      expect(recording.backlinks({ scope: knowledgeScope, id: 'doc-a' as MemoryId })).toEqual([]);
    });

    test('shares one index with a retriever built over the same instance', async () => {
      const recording = RecordingMemoryIndex.create().orThrow();
      const store = storeWith(recording);
      (await store.put(knowledgeRecord('doc-a', 'alpha'))).orThrow();
      (await store.put(knowledgeRecord('doc-b', 'beta'))).orThrow();

      // The consumer's real pattern: the store maintains the index, retrievers read it.
      const retriever = RecencyRetriever.create(recording).orThrow();
      expect(await retriever.retrieve({ kind: knowledgeKind })).toSucceedAndSatisfy(
        (records: ReadonlyArray<IMemoryRecord<unknown>>) => {
          expect(records.map((r) => r.envelope.id).sort()).toEqual(['doc-a', 'doc-b']);
        }
      );
    });

    test('the injected index — not a private one — determines what the store returns', async () => {
      const hiding = HidingMemoryIndex.create().orThrow();
      const store = storeWith(hiding);
      (await store.put(knowledgeRecord('doc-a', 'alpha'))).orThrow();
      (await store.put(knowledgeRecord('doc-b', 'hidden beta'))).orThrow();

      // Both records persisted, but the injected index hides one from `entries()`,
      // and every store read that goes through the index reflects exactly that.
      expect(await store.list()).toSucceedAndSatisfy((records: ReadonlyArray<IMemoryRecord<unknown>>) => {
        expect(records.map((r) => r.envelope.id)).toEqual(['doc-a']);
      });
      expect(await store.listScoped()).toSucceedAndSatisfy((scoped) => {
        expect(scoped.map((s) => s.target.id)).toEqual(['doc-a']);
      });
      // The file is still on disk — `getById` reads through to the FileTree, which
      // remains the source of truth regardless of what the derived index projects.
      expect(await store.getById(knowledgeScope, 'doc-b' as MemoryId)).toSucceedAndSatisfy(
        (record: IMemoryRecord<unknown> | undefined) => {
          expect(record?.body).toBe('hidden beta');
        }
      );
    });

    test('an index that reshapes entries() changes write semantics, not just reads', async () => {
      // The store's content-hash dedup and write-policy admission cohort both read
      // the index's `entries()`, so an index that hides a record hides it from dedup
      // too. This is the documented caveat on the `index` param — the reason to
      // inject only a faithful delegating decorator.
      const control = storeWith();
      (await control.put(knowledgeRecord('doc-b', 'hidden beta'))).orThrow();
      // Default index: an identical body under a NEW id collapses onto the existing
      // record (knowledge declares `dedupScope: 'content'`).
      expect(await control.put(knowledgeRecord('doc-c', 'hidden beta'))).toSucceedAndSatisfy(
        (record: IMemoryRecord<unknown>) => {
          expect(record.envelope.id).toBe('doc-b');
        }
      );

      const hiding = storeWith(HidingMemoryIndex.create().orThrow());
      (await hiding.put(knowledgeRecord('doc-b', 'hidden beta'))).orThrow();
      // Hiding index: doc-b is invisible to `entries()`, so the content-hash lookup
      // finds no duplicate and doc-c is written as a distinct record.
      expect(await hiding.put(knowledgeRecord('doc-c', 'hidden beta'))).toSucceedAndSatisfy(
        (record: IMemoryRecord<unknown>) => {
          expect(record.envelope.id).toBe('doc-c');
        }
      );
    });
  });
});
