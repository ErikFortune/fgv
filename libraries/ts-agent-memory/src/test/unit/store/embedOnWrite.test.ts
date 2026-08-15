/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { Converters, DetailedResult, Logging, Result, fail, succeed } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
import {
  BodyConverterRegistry,
  FileTreeMemoryStore,
  IBodyConverterRegistry,
  IEdgeTarget,
  IIdentityCodec,
  IIndexedMemoryRecord,
  IMemoryIndex,
  IMemoryRecord,
  IMemoryRecordSource,
  IVectorIndex,
  IVectorQueryHit,
  IVectorRebuildOptions,
  IVectorRebuildReport,
  InMemoryCosineIndex,
  Kind,
  KnowledgeIdentityCodec,
  MemoryCapCullPolicy,
  EntityId,
  MemoryId,
  MemoryIndex,
  MemoryIndexPatchOp,
  MemoryEmbedder,
  MemoryScopeKey,
  Tag,
  MtmIdentityCodec,
  IWritePolicy,
  SemanticRetriever,
  TemporalIdentityCodec,
  TemporalVersionedPolicy,
  envelopeConverter
} from '../../../index';

const knowledgeKind: Kind = 'knowledge' as Kind;
const mtmKind: Kind = 'mtm' as Kind;
const factKind: Kind = 'fact' as Kind;

function mutableRoot(): FileTree.IMutableFileTreeDirectoryItem {
  const tree = FileTree.inMemory([], { mutable: true }).orThrow();
  const root = tree.getDirectory('/').orThrow();
  if (!FileTree.isMutableDirectoryItem(root)) {
    throw new Error('expected a mutable root directory');
  }
  return root;
}

function makeRecord(
  id: string,
  body: string,
  kind: string = 'knowledge',
  entityId?: string
): IMemoryRecord<unknown> {
  return {
    envelope: envelopeConverter
      .convert({
        id,
        entityId: entityId ?? id,
        kind,
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

/**
 * Deterministic keyword-count embedder (no network). Counts occurrences of three
 * marker words, so a record's vector and a query's vector live in the same space
 * and cosine ordering is fully predictable.
 */
const MARKERS: ReadonlyArray<string> = ['cat', 'dog', 'fish'];
function featureVector(text: string): Float32Array {
  const lower: string = text.toLowerCase();
  return Float32Array.from(MARKERS.map((m) => lower.split(m).length - 1));
}
const recordEmbed = (r: IMemoryRecord<unknown>): Promise<Result<Float32Array>> =>
  // A real embedder receives an `IMemoryRecord<unknown>` and must validate the
  // body through a Converter rather than casting — this models that idiom.
  Promise.resolve(
    Converters.string
      .convert(r.body)
      .withErrorFormat((msg) => `cannot embed: body is not a string: ${msg}`)
      .onSuccess((body) => succeed(featureVector(body)))
  );
const queryEmbed = (text: string): Promise<Result<Float32Array>> =>
  Promise.resolve(succeed(featureVector(text)));

/**
 * A faithful delegating {@link MemoryIndex} that appends a marker when the store
 * commits a `put` — the last step of `_persist`, so anything recorded after it
 * happened after the write landed. Injected via the documented `index` seam
 * rather than by spying on internals.
 */
class CommitRecordingIndex implements IMemoryIndex {
  private readonly _inner: IMemoryIndex = MemoryIndex.create().orThrow();
  private readonly _order: string[];

  public constructor(order: string[]) {
    this._order = order;
  }
  public rebuild(entries: ReadonlyArray<IIndexedMemoryRecord>): Result<number> {
    return this._inner.rebuild(entries);
  }
  public patch(op: MemoryIndexPatchOp, entry: IIndexedMemoryRecord): Result<IIndexedMemoryRecord> {
    return this._inner.patch(op, entry).onSuccess((applied) => {
      if (op === 'put') {
        this._order.push(`commit:${applied.record.envelope.id}`);
      }
      return succeed(applied);
    });
  }
  public entries(): ReadonlyArray<IIndexedMemoryRecord> {
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

/** Records add/remove call order and can be configured to fail either op. */
class SpyVectorIndex implements IVectorIndex {
  public readonly calls: string[];
  public failAdd: boolean = false;
  public failRemove: boolean = false;
  private readonly _inner: InMemoryCosineIndex = InMemoryCosineIndex.create().orThrow();

  /** Pass a shared array to interleave these calls with another double's. */
  public constructor(calls: string[] = []) {
    this.calls = calls;
  }
  public async add(target: IEdgeTarget, vector: Float32Array): Promise<Result<string>> {
    this.calls.push(`add:${target.id}`);
    return this.failAdd ? fail('add boom') : this._inner.add(target, vector);
  }
  public async remove(target: IEdgeTarget): Promise<Result<IEdgeTarget>> {
    this.calls.push(`remove:${target.id}`);
    return this.failRemove ? fail('remove boom') : this._inner.remove(target);
  }
  public query(vector: Float32Array, topK: number): Promise<Result<ReadonlyArray<IVectorQueryHit>>> {
    return this._inner.query(vector, topK);
  }
  public get size(): number {
    return this._inner.size;
  }
  public rebuild(
    source: IMemoryRecordSource,
    embed: MemoryEmbedder,
    options?: IVectorRebuildOptions
  ): Promise<DetailedResult<IVectorRebuildReport, IVectorRebuildReport>> {
    return this._inner.rebuild(source, embed, options);
  }
}

function knowledgeStore(
  vectorIndex?: IVectorIndex,
  embed?: MemoryEmbedder,
  logger?: Logging.ILogger
): FileTreeMemoryStore {
  const registry: IBodyConverterRegistry = BodyConverterRegistry.create().orThrow();
  registry.register(knowledgeKind, Converters.string);
  return FileTreeMemoryStore.create({
    root: mutableRoot(),
    registry,
    codecs: new Map<Kind, IIdentityCodec>([[knowledgeKind, new KnowledgeIdentityCodec()]]),
    vectorIndex,
    embed,
    logger
  }).orThrow();
}

describe('FileTreeMemoryStore embed-on-write', () => {
  describe('when wired', () => {
    test('embeds on write, stamps embeddingRef, and indexes the vector', async () => {
      const index = InMemoryCosineIndex.create().orThrow();
      const store = knowledgeStore(index, recordEmbed);
      expect(await store.put(makeRecord('doc-a', 'cat cat'))).toSucceedAndSatisfy(
        (record: IMemoryRecord<unknown>) => {
          // InMemoryCosineIndex keys entries by the scope-qualified target, so the
          // ref IS that canonical key (scope + NUL + id).
          expect(record.envelope.embeddingRef).toBe('knowledge\0doc-a');
        }
      );
      expect(index.size).toBe(1);
      // The persisted file carries the embeddingRef (round-trips through disk).
      expect(await store.getById('knowledge' as MemoryScopeKey, 'doc-a' as MemoryId)).toSucceedAndSatisfy(
        (record: IMemoryRecord<unknown> | undefined) => {
          expect(record?.envelope.embeddingRef).toBe('knowledge\0doc-a');
        }
      );
      // The vector is queryable.
      expect(await index.query(featureVector('cat'), 1)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits[0].target.id).toBe('doc-a');
        }
      );
    });

    test('re-embeds on a content change by re-adding (replace semantics, no eager remove)', async () => {
      const spy = new SpyVectorIndex();
      const store = knowledgeStore(spy, recordEmbed);
      (await store.put(makeRecord('doc-a', 'cat'))).orThrow();
      (await store.put(makeRecord('doc-a', 'dog'))).orThrow();
      // The content change re-adds (IVectorIndex.add replaces for a same id) —
      // no redundant eager remove.
      expect(spy.calls).toEqual(['add:doc-a', 'add:doc-a']);
      // The index now reflects the new content ('dog'), not the original.
      expect(await spy.query(featureVector('dog'), 1)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits[0].score).toBeCloseTo(1);
        }
      );
    });

    test('does not re-embed a dedup no-op (identical content)', async () => {
      const spy = new SpyVectorIndex();
      const store = knowledgeStore(spy, recordEmbed);
      (await store.put(makeRecord('doc-a', 'cat'))).orThrow();
      (await store.put(makeRecord('doc-a', 'cat'))).orThrow();
      // The second identical put is a content-dedup no-op — no second embedding.
      expect(spy.calls).toEqual(['add:doc-a']);
    });

    test('removes the vector on delete', async () => {
      const spy = new SpyVectorIndex();
      const store = knowledgeStore(spy, recordEmbed);
      (await store.put(makeRecord('doc-a', 'cat'))).orThrow();
      expect(await store.delete(knowledgeKind, 'doc-a' as unknown as EntityId)).toSucceedWith(
        'doc-a' as MemoryId
      );
      expect(spy.calls).toEqual(['add:doc-a', 'remove:doc-a']);
      expect(await spy.query(featureVector('cat'), 5)).toSucceedWith([]);
    });

    test('removes evicted vectors on cap-cull eviction', async () => {
      const index = InMemoryCosineIndex.create().orThrow();
      const capCull: IWritePolicy = MemoryCapCullPolicy.create({
        maxRecords: 2,
        mutableFields: ['body', 'tags', 'links', 'provenance', 'embeddingRef']
      }).orThrow();
      const registry: IBodyConverterRegistry = BodyConverterRegistry.create().orThrow();
      registry.register(mtmKind, Converters.string);
      const store = FileTreeMemoryStore.create({
        root: mutableRoot(),
        registry,
        codecs: new Map<Kind, IIdentityCodec>([[mtmKind, new MtmIdentityCodec()]]),
        writePolicies: new Map<Kind, IWritePolicy>([[mtmKind, capCull]]),
        vectorIndex: index,
        embed: recordEmbed
      }).orThrow();

      // Distinct bodies so each gets a distinct vector; maxRecords=2 evicts the
      // oldest on the third write.
      (await store.put(makeRecord('turn-0', 'cat', 'mtm', 'conv-1:0'))).orThrow();
      (await store.put(makeRecord('turn-1', 'dog', 'mtm', 'conv-1:1'))).orThrow();
      (await store.put(makeRecord('turn-2', 'fish', 'mtm', 'conv-1:2'))).orThrow();
      // turn-0 was evicted from the store AND the vector index.
      expect(index.size).toBe(2);
      expect(await index.query(featureVector('cat'), 5)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits.map((h) => h.target.id)).not.toContain('turn-0');
        }
      );
    });

    test('persists the record (best-effort) and logs when embedding fails', async () => {
      const index = InMemoryCosineIndex.create().orThrow();
      const logger = new Logging.InMemoryLogger();
      const failEmbed = (): Promise<Result<Float32Array>> => Promise.resolve(fail('no model'));
      const store = knowledgeStore(index, failEmbed, logger);
      // The durable write succeeds; only the derived index is skipped (rebuildable).
      expect(await store.put(makeRecord('doc-a', 'cat'))).toSucceedAndSatisfy(
        (record: IMemoryRecord<unknown>) => {
          expect(record.envelope.embeddingRef).toBeUndefined();
        }
      );
      expect(await store.getById('knowledge' as MemoryScopeKey, 'doc-a' as MemoryId)).toSucceedAndSatisfy(
        (record: IMemoryRecord<unknown> | undefined) => {
          expect(record?.envelope.id).toBe('doc-a');
        }
      );
      expect(index.size).toBe(0);
      expect(logger.logged.some((m) => /embedding 'doc-a' failed.*no model/i.test(m))).toBe(true);
    });

    test('persists the record (best-effort) and logs when the vector add fails', async () => {
      const spy = new SpyVectorIndex();
      spy.failAdd = true;
      const logger = new Logging.InMemoryLogger();
      const store = knowledgeStore(spy, recordEmbed, logger);
      expect(await store.put(makeRecord('doc-a', 'cat'))).toSucceedAndSatisfy(
        (record: IMemoryRecord<unknown>) => {
          expect(record.envelope.embeddingRef).toBeUndefined();
        }
      );
      expect(await store.getById('knowledge' as MemoryScopeKey, 'doc-a' as MemoryId)).toSucceedAndSatisfy(
        (record: IMemoryRecord<unknown> | undefined) => {
          expect(record?.envelope.id).toBe('doc-a');
        }
      );
      expect(logger.logged.some((m) => /vector add for 'doc-a' failed.*add boom/i.test(m))).toBe(true);
    });

    test('best-effort embed survives a throwing/rejecting embedder', async () => {
      const index = InMemoryCosineIndex.create().orThrow();
      const logger = new Logging.InMemoryLogger();
      const throwingEmbed = (): Promise<Result<Float32Array>> => Promise.reject(new Error('embedder kaboom'));
      const store = knowledgeStore(index, throwingEmbed, logger);
      expect(await store.put(makeRecord('doc-a', 'cat'))).toSucceed();
      expect(index.size).toBe(0);
      expect(logger.logged.some((m) => /embedding 'doc-a' threw.*embedder kaboom/i.test(m))).toBe(true);
    });

    test('a committed delete succeeds (best-effort) and logs when vector removal fails', async () => {
      const spy = new SpyVectorIndex();
      const logger = new Logging.InMemoryLogger();
      const store = knowledgeStore(spy, recordEmbed, logger);
      (await store.put(makeRecord('doc-a', 'cat'))).orThrow();
      spy.failRemove = true;
      // The record is already gone; vector cleanup failure must NOT fail the delete.
      expect(await store.delete(knowledgeKind, 'doc-a' as unknown as EntityId)).toSucceedWith(
        'doc-a' as MemoryId
      );
      expect(await store.getById('knowledge' as MemoryScopeKey, 'doc-a' as MemoryId)).toSucceedWith(
        undefined
      );
      expect(logger.logged.some((m) => /vector removal for 'doc-a' failed.*remove boom/i.test(m))).toBe(true);
    });
  });

  describe('when unwired', () => {
    test('a store without a vector index or embedder leaves embeddingRef unset', async () => {
      const store = knowledgeStore();
      expect(await store.put(makeRecord('doc-a', 'cat'))).toSucceedAndSatisfy(
        (record: IMemoryRecord<unknown>) => {
          expect(record.envelope.embeddingRef).toBeUndefined();
        }
      );
    });

    test('a vector index without an embedder is fully inert (no add or remove)', async () => {
      const spy = new SpyVectorIndex();
      const store = knowledgeStore(spy, undefined);
      expect(await store.put(makeRecord('doc-a', 'cat'))).toSucceedAndSatisfy(
        (record: IMemoryRecord<unknown>) => {
          expect(record.envelope.embeddingRef).toBeUndefined();
        }
      );
      // The vector lifecycle is wholly off without an embedder: neither put nor
      // delete touches the index (a remove would target a record never embedded).
      (await store.delete(knowledgeKind, 'doc-a' as unknown as EntityId)).orThrow();
      expect(spy.calls).toEqual([]);
    });
  });

  describe('semantic recall end-to-end', () => {
    test('a wired store + InMemoryCosineIndex + SemanticRetriever returns cosine top-k', async () => {
      const index = InMemoryCosineIndex.create().orThrow();
      const store = knowledgeStore(index, recordEmbed);
      (await store.put(makeRecord('cats', 'cat cat cat'))).orThrow();
      (await store.put(makeRecord('dogs', 'dog dog dog'))).orThrow();
      (await store.put(makeRecord('fishes', 'fish fish fish'))).orThrow();

      // SemanticRetriever takes an IMemoryIndex separate from the store (the
      // store's derived index is private and the two are intentionally
      // decoupled), so build a record index mirroring the store — keyed by the
      // shared vectorIndex instance — for hit hydration.
      const listed: ReadonlyArray<IMemoryRecord<unknown>> = (await store.list()).orThrow();
      const recordIndex = MemoryIndex.create().orThrow();
      recordIndex
        .rebuild(
          listed.map((record): IIndexedMemoryRecord => ({ scope: 'knowledge' as MemoryScopeKey, record }))
        )
        .orThrow();

      const retriever = SemanticRetriever.create({
        index: recordIndex,
        backend: { vectorIndex: index, embedQuery: queryEmbed }
      }).orThrow();
      expect(retriever.capabilities.supportsSemanticRecall).toBe(true);

      expect(await retriever.retrieve({ semantic: 'cat', topK: 2 })).toSucceedAndSatisfy(
        (records: ReadonlyArray<IMemoryRecord<unknown>>) => {
          // 'cats' is the closest; 'dogs'/'fishes' are orthogonal (cosine 0) so
          // only the cat record ranks above them — it is first.
          expect(records[0].envelope.id).toBe('cats');
        }
      );
    });
  });

  describe('versioned (temporal) embed-on-write', () => {
    // Wires the vector lifecycle against a TemporalIdentityCodec-backed kind so the
    // versioned put path (`_putVersioned -> _embedOnWrite(built, scope)`) is
    // exercised with a real vector index. The flat-path tests already cover the
    // SHARED `_embedOnWrite` line, so this asserts specifically that the VERSIONED
    // call site threads the correct entity scope (not the version stem or some
    // other variable) into the vector target — a scope swap at that call site would
    // fail these assertions, whereas line coverage alone would not catch it.
    function temporalStore(
      vectorIndex: IVectorIndex,
      embed: (r: IMemoryRecord<unknown>) => Promise<Result<Float32Array>>
    ): FileTreeMemoryStore {
      const reg: IBodyConverterRegistry = BodyConverterRegistry.create().orThrow();
      reg.register(factKind, Converters.string);
      return FileTreeMemoryStore.create({
        root: mutableRoot(),
        registry: reg,
        codecs: new Map<Kind, IIdentityCodec>([[factKind, TemporalIdentityCodec.create('facts').orThrow()]]),
        writePolicies: new Map<Kind, IWritePolicy>([[factKind, TemporalVersionedPolicy.create().orThrow()]]),
        vectorIndex,
        embed
      }).orThrow();
    }

    test('stamps the entity-scope-qualified target as embeddingRef for each version', async () => {
      const spy = new SpyVectorIndex();
      const store = temporalStore(spy, recordEmbed);
      // Two versions of the SAME temporal entity `greeting` (distinct bodies so the
      // second mints a new version rather than deduping). The entity subtree scope
      // is `facts/entities/greeting`; the version stem is `greeting-v<store-seq>`
      // (the store's monotonic seq, which starts at 1 for the first write).
      expect(await store.put(makeRecord('greeting', 'cat', 'fact'))).toSucceedAndSatisfy(
        (record: IMemoryRecord<unknown>) => {
          // embeddingRef IS edgeTargetKey(target) = `<entity-scope>\0<version-stem>`.
          // A wrong scope at the versioned call site would corrupt the prefix here.
          expect(record.envelope.embeddingRef).toBe('facts/entities/greeting\0greeting-v1');
        }
      );
      expect(await store.put(makeRecord('greeting', 'dog', 'fact'))).toSucceedAndSatisfy(
        (record: IMemoryRecord<unknown>) => {
          expect(record.envelope.embeddingRef).toBe('facts/entities/greeting\0greeting-v2');
        }
      );
      // Both versions were added under the entity scope, keyed by their version stems.
      expect(spy.calls).toEqual(['add:greeting-v1', 'add:greeting-v2']);
    });

    test('keeps two temporal entities under distinct scopes — no cross-entity vector collision', async () => {
      const index = InMemoryCosineIndex.create().orThrow();
      const store = temporalStore(index, recordEmbed);
      (await store.put(makeRecord('greeting', 'cat', 'fact'))).orThrow();
      (await store.put(makeRecord('farewell', 'fish', 'fact'))).orThrow();
      // Two distinct entity subtrees → two distinct vector entries.
      expect(index.size).toBe(2);
      // A query surfaces both, each carrying its own entity-scope-qualified target.
      expect(await index.query(featureVector('cat'), 5)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          const targets = hits.map((h) => `${h.target.scope}\0${h.target.id}`).sort();
          expect(targets).toEqual([
            'facts/entities/farewell\0farewell-v2',
            'facts/entities/greeting\0greeting-v1'
          ]);
        }
      );
    });
  });

  describe('when the embedder declines a record', () => {
    /**
     * A policy embedder: it embeds knowledge and deliberately declines anything
     * else. This is the shape the `undefined` return exists to make expressible —
     * before it, the only way to say "not this one" was `fail`, which is
     * indistinguishable from an embedder outage.
     */
    const decliningEmbed: MemoryEmbedder = (r) =>
      r.envelope.kind === knowledgeKind ? recordEmbed(r) : Promise.resolve(succeed(undefined));

    test('stores the record with no embeddingRef and adds nothing to the index', async () => {
      const index = InMemoryCosineIndex.create().orThrow();
      const store = knowledgeStore(index, () => Promise.resolve(succeed(undefined)));
      expect(await store.put(makeRecord('doc-a', 'cat cat'))).toSucceedAndSatisfy(
        (record: IMemoryRecord<unknown>) => {
          expect(record.envelope.embeddingRef).toBeUndefined();
        }
      );
      expect(index.size).toBe(0);
      // And the absence round-trips through disk rather than being an in-memory artifact.
      expect(await store.getById('knowledge' as MemoryScopeKey, 'doc-a' as MemoryId)).toSucceedAndSatisfy(
        (record: IMemoryRecord<unknown> | undefined) => {
          expect(record?.envelope.embeddingRef).toBeUndefined();
        }
      );
    });

    test('logs nothing — a decline is policy, not a fault', async () => {
      // The distinction that matters: the failure paths above each emit a warn.
      // A decline must not, or routine policy reads as a recurring outage.
      const logger = new Logging.InMemoryLogger();
      const store = knowledgeStore(
        InMemoryCosineIndex.create().orThrow(),
        () => Promise.resolve(succeed(undefined)),
        logger
      );
      expect(await store.put(makeRecord('doc-a', 'cat cat'))).toSucceed();
      expect(logger.logged).toHaveLength(0);
    });

    test('never calls the index for a declined record', async () => {
      const spy = new SpyVectorIndex();
      const store = knowledgeStore(spy, () => Promise.resolve(succeed(undefined)));
      expect(await store.put(makeRecord('doc-a', 'cat cat'))).toSucceed();
      expect(spy.calls).toEqual([]);
    });

    test('declines one kind while still embedding another, in the same store', async () => {
      const index = InMemoryCosineIndex.create().orThrow();
      const registry: IBodyConverterRegistry = BodyConverterRegistry.create().orThrow();
      registry.register(knowledgeKind, Converters.string);
      registry.register(factKind, Converters.string);
      const store = FileTreeMemoryStore.create({
        root: mutableRoot(),
        registry,
        codecs: new Map<Kind, IIdentityCodec>([
          [knowledgeKind, new KnowledgeIdentityCodec()],
          [factKind, new KnowledgeIdentityCodec()]
        ]),
        vectorIndex: index,
        embed: decliningEmbed
      }).orThrow();

      expect(await store.put(makeRecord('doc-a', 'cat cat', 'knowledge'))).toSucceedAndSatisfy(
        (record: IMemoryRecord<unknown>) => {
          expect(record.envelope.embeddingRef).toBe('knowledge\0doc-a');
        }
      );
      expect(await store.put(makeRecord('fact-a', 'cat cat', 'fact'))).toSucceedAndSatisfy(
        (record: IMemoryRecord<unknown>) => {
          expect(record.envelope.embeddingRef).toBeUndefined();
        }
      );
      // Only the embedded kind occupies an index slot — which is the point: a
      // declined kind cannot crowd the topK window it can never be returned from.
      expect(index.size).toBe(1);
    });
  });

  describe('when a decline arrives for a record that was already embedded', () => {
    /**
     * An embedder whose policy changes between writes: it embeds until `declining`
     * is set, then declines. This is the shape a consumer produces by narrowing
     * which kinds they index, or by an embedder that starts skipping records whose
     * revised content it has nothing useful to say about.
     */
    function togglingEmbed(state: { declining: boolean }): MemoryEmbedder {
      return (r) => (state.declining ? Promise.resolve(succeed(undefined)) : recordEmbed(r));
    }

    test('drops the inherited embeddingRef rather than persisting a stale one', async () => {
      const state = { declining: false };
      const index = InMemoryCosineIndex.create().orThrow();
      const store = knowledgeStore(index, togglingEmbed(state));

      expect(await store.put(makeRecord('doc-a', 'cat cat'))).toSucceedAndSatisfy(
        (record: IMemoryRecord<unknown>) => {
          expect(record.envelope.embeddingRef).toBe('knowledge\0doc-a');
        }
      );

      state.declining = true;
      expect(await store.put(makeRecord('doc-a', 'dog dog'))).toSucceedAndSatisfy(
        (record: IMemoryRecord<unknown>) => {
          // The update inherits the previous envelope's fields, so without the
          // drop this would still claim an embedding the store just declined.
          expect(record.envelope.embeddingRef).toBeUndefined();
        }
      );
      // And the absence is what landed on disk, not just what `put` returned.
      expect(await store.getById('knowledge' as MemoryScopeKey, 'doc-a' as MemoryId)).toSucceedAndSatisfy(
        (record: IMemoryRecord<unknown> | undefined) => {
          expect(record?.envelope.embeddingRef).toBeUndefined();
        }
      );
    });

    test('removes the stale vector, so a query cannot answer on superseded content', async () => {
      const state = { declining: false };
      const index = InMemoryCosineIndex.create().orThrow();
      const store = knowledgeStore(index, togglingEmbed(state));
      (await store.put(makeRecord('doc-a', 'cat cat'))).orThrow();
      expect(index.size).toBe(1);

      state.declining = true;
      (await store.put(makeRecord('doc-a', 'dog dog'))).orThrow();

      // Clearing the reference alone would leave this entry in place, and a
      // 'cat' query would keep returning doc-a — scored on a body it no longer
      // has, for a record that claims not to be indexed at all.
      expect(index.size).toBe(0);
      expect(await index.query(featureVector('cat'), 5)).toSucceedWith([]);
    });

    test('does not touch the index when there was no inherited reference', async () => {
      // The common decline: a record that was never embedded. It must not cost a
      // remove round trip — on a durable index that is a wasted DB write per put.
      const spy = new SpyVectorIndex();
      const store = knowledgeStore(spy, () => Promise.resolve(succeed(undefined)));
      expect(await store.put(makeRecord('doc-a', 'cat cat'))).toSucceed();
      expect(await store.put(makeRecord('doc-a', 'dog dog'))).toSucceed();
      expect(spy.calls).toEqual([]);
    });

    test('drops the reference even when the index remove fails', async () => {
      // Best-effort like the rest of the vector path: the record's claim about
      // itself should be true even when the derived index is momentarily stale.
      const state = { declining: false };
      const spy = new SpyVectorIndex();
      const logger = new Logging.InMemoryLogger();
      const store = knowledgeStore(spy, togglingEmbed(state), logger);
      (await store.put(makeRecord('doc-a', 'cat cat'))).orThrow();

      state.declining = true;
      spy.failRemove = true;
      expect(await store.put(makeRecord('doc-a', 'dog dog'))).toSucceedAndSatisfy(
        (record: IMemoryRecord<unknown>) => {
          expect(record.envelope.embeddingRef).toBeUndefined();
        }
      );
      expect(spy.calls).toEqual(['add:doc-a', 'remove:doc-a']);
      // A failed remove IS a fault (unlike the decline itself), so it is logged.
      expect(logger.logged.some((m) => /vector remove for declined 'doc-a'/.test(m))).toBe(true);
    });

    test('prunes the stale vector only after the write has committed', async () => {
      // Ordering that matters: a persist that fails leaves the PREVIOUS body on
      // disk, and the superseded vector is still an accurate embedding of THAT
      // body. Pruning at the point of the decline would delete a correct vector
      // on behalf of a write that never landed — so the prune belongs on the far
      // side of the commit, the same rule the cull-oldest pruning already
      // follows. Asserted as ordering against the index patch, which is the last
      // step of the commit.
      const order: string[] = [];
      const state = { declining: false };
      const spy = new SpyVectorIndex(order);
      const registry: IBodyConverterRegistry = BodyConverterRegistry.create().orThrow();
      registry.register(knowledgeKind, Converters.string);
      const store = FileTreeMemoryStore.create({
        root: mutableRoot(),
        registry,
        codecs: new Map<Kind, IIdentityCodec>([[knowledgeKind, new KnowledgeIdentityCodec()]]),
        index: new CommitRecordingIndex(order),
        vectorIndex: spy,
        embed: togglingEmbed(state)
      }).orThrow();
      (await store.put(makeRecord('doc-a', 'cat cat'))).orThrow();

      order.length = 0;
      state.declining = true;
      (await store.put(makeRecord('doc-a', 'dog dog'))).orThrow();
      expect(order).toEqual(['commit:doc-a', 'remove:doc-a']);
    });
  });

  describe('embedKinds — declaring which kinds participate', () => {
    /** A store registering two kinds, optionally restricting which are embedded. */
    function twoKindStore(
      index: IVectorIndex,
      embed: MemoryEmbedder,
      embedKinds?: ReadonlySet<Kind>
    ): FileTreeMemoryStore {
      const registry: IBodyConverterRegistry = BodyConverterRegistry.create().orThrow();
      registry.register(knowledgeKind, Converters.string);
      registry.register(factKind, Converters.string);
      return FileTreeMemoryStore.create({
        root: mutableRoot(),
        registry,
        codecs: new Map<Kind, IIdentityCodec>([
          [knowledgeKind, new KnowledgeIdentityCodec()],
          [factKind, new KnowledgeIdentityCodec()]
        ]),
        vectorIndex: index,
        embed,
        embedKinds
      }).orThrow();
    }

    test('with no declaration every kind participates — unchanged behavior', async () => {
      const index = InMemoryCosineIndex.create().orThrow();
      const store = twoKindStore(index, recordEmbed);
      expect(store.embedsKind(knowledgeKind)).toBe(true);
      expect(store.embedsKind(factKind)).toBe(true);
      expect(await store.put(makeRecord('doc-a', 'cat', 'knowledge'))).toSucceed();
      expect(await store.put(makeRecord('fact-a', 'cat', 'fact'))).toSucceed();
      expect(index.size).toBe(2);
    });

    test('an excluded kind is never handed to the embedder at all', async () => {
      // The distinction from a MemoryEmbedder decline: a decline is CALLED and
      // returns undefined, paying the round trip. This must not call it.
      const seen: string[] = [];
      const countingEmbed: MemoryEmbedder = (r) => {
        seen.push(r.envelope.kind as string);
        return recordEmbed(r);
      };
      const index = InMemoryCosineIndex.create().orThrow();
      const store = twoKindStore(index, countingEmbed, new Set<Kind>([knowledgeKind]));
      expect(await store.put(makeRecord('doc-a', 'cat', 'knowledge'))).toSucceed();
      expect(await store.put(makeRecord('fact-a', 'cat', 'fact'))).toSucceed();
      expect(seen).toEqual(['knowledge']);
      expect(index.size).toBe(1);
    });

    test('an excluded kind is stored normally, just without an embeddingRef', async () => {
      const store = twoKindStore(
        InMemoryCosineIndex.create().orThrow(),
        recordEmbed,
        new Set<Kind>([knowledgeKind])
      );
      expect(await store.put(makeRecord('fact-a', 'cat', 'fact'))).toSucceedAndSatisfy(
        (record: IMemoryRecord<unknown>) => {
          expect(record.envelope.embeddingRef).toBeUndefined();
        }
      );
      // Still fully readable — exclusion is about the index, not about storage.
      expect(await store.get(factKind, 'fact-a' as EntityId)).toSucceedAndSatisfy(
        (record: IMemoryRecord<unknown> | undefined) => {
          expect(record?.body).toBe('cat');
        }
      );
    });

    test('narrowing the declaration retires the embeddings the store no longer maintains', async () => {
      // The migration case: a vault embedded everything, then the consumer
      // narrowed `embedKinds`. Without this, every previously-embedded record of
      // a now-excluded kind would keep claiming an embedding the store will
      // never refresh, and its vector would keep answering queries.
      const index = InMemoryCosineIndex.create().orThrow();
      const root = mutableRoot();
      const registry: IBodyConverterRegistry = BodyConverterRegistry.create().orThrow();
      registry.register(knowledgeKind, Converters.string);
      registry.register(factKind, Converters.string);
      const codecs = new Map<Kind, IIdentityCodec>([
        [knowledgeKind, new KnowledgeIdentityCodec()],
        [factKind, new KnowledgeIdentityCodec()]
      ]);
      const before = FileTreeMemoryStore.create({
        root,
        registry,
        codecs,
        vectorIndex: index,
        embed: recordEmbed
      }).orThrow();
      (await before.put(makeRecord('fact-a', 'cat', 'fact'))).orThrow();
      expect(index.size).toBe(1);

      // Reopen the SAME vault with the kind excluded, then re-put the record.
      const after = FileTreeMemoryStore.create({
        root,
        registry,
        codecs,
        vectorIndex: index,
        embed: recordEmbed,
        embedKinds: new Set<Kind>([knowledgeKind])
      }).orThrow();
      expect(await after.put(makeRecord('fact-a', 'dog', 'fact'))).toSucceedAndSatisfy(
        (record: IMemoryRecord<unknown>) => {
          expect(record.envelope.embeddingRef).toBeUndefined();
        }
      );
      expect(index.size).toBe(0);
    });

    test('embedsKind reports the declaration', () => {
      const store = twoKindStore(
        InMemoryCosineIndex.create().orThrow(),
        recordEmbed,
        new Set<Kind>([knowledgeKind])
      );
      expect(store.embedsKind(knowledgeKind)).toBe(true);
      expect(store.embedsKind(factKind)).toBe(false);
    });

    test('asRecordSource omits excluded kinds, so a rebuild does not pay for them', async () => {
      // The restart cost: a rebuild embeds the whole vault serially, so an
      // un-queried kind is worst exactly here.
      const store = twoKindStore(
        InMemoryCosineIndex.create().orThrow(),
        recordEmbed,
        new Set<Kind>([knowledgeKind])
      );
      expect(await store.put(makeRecord('doc-a', 'cat', 'knowledge'))).toSucceed();
      expect(await store.put(makeRecord('fact-a', 'cat', 'fact'))).toSucceed();

      const fresh = InMemoryCosineIndex.create().orThrow();
      const seen: string[] = [];
      const countingEmbed: MemoryEmbedder = (r) => {
        seen.push(r.envelope.kind as string);
        return recordEmbed(r);
      };
      expect(await fresh.rebuild(store.asRecordSource(), countingEmbed)).toSucceedAndSatisfy(
        (report: IVectorRebuildReport) => {
          expect(report.indexed).toEqual(new Map([['knowledge', 1]]));
          // The excluded kind is COUNTED rather than silently absent — this is the
          // arithmetic that previously did not add up: the 'fact' record appeared
          // in none of indexed / declined / skipped, so a caller computing coverage
          // undercounted, and undercounted in the direction of looking healthier.
          expect(report.excluded!).toEqual(new Map([['fact', 1]]));
        }
      );
      expect(seen).toEqual(['knowledge']);
    });

    test('accumulates the exclusion count across records of the same kind', async () => {
      // Two of one excluded kind, one of another, so the tally is exercised past
      // its first occurrence — a per-kind count that only ever reads 1 would be
      // indistinguishable from a presence flag.
      const store = twoKindStore(
        InMemoryCosineIndex.create().orThrow(),
        recordEmbed,
        new Set<Kind>([knowledgeKind])
      );
      expect(await store.put(makeRecord('doc-a', 'cat', 'knowledge'))).toSucceed();
      expect(await store.put(makeRecord('fact-a', 'cat', 'fact'))).toSucceed();
      expect(await store.put(makeRecord('fact-b', 'dog', 'fact'))).toSucceed();

      const fresh = InMemoryCosineIndex.create().orThrow();
      expect(await fresh.rebuild(store.asRecordSource(), recordEmbed)).toSucceedAndSatisfy(
        (report: IVectorRebuildReport) => {
          expect(report.indexed).toEqual(new Map([['knowledge', 1]]));
          expect(report.excluded!).toEqual(new Map([['fact', 2]]));
        }
      );
    });

    test('listScoped still returns every record — only the vector source is filtered', async () => {
      const store = twoKindStore(
        InMemoryCosineIndex.create().orThrow(),
        recordEmbed,
        new Set<Kind>([knowledgeKind])
      );
      expect(await store.put(makeRecord('doc-a', 'cat', 'knowledge'))).toSucceed();
      expect(await store.put(makeRecord('fact-a', 'cat', 'fact'))).toSucceed();
      expect(await store.listScoped()).toSucceedAndSatisfy((all: ReadonlyArray<unknown>) => {
        expect(all).toHaveLength(2);
      });
    });
  });
});
