/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { Converters, Result, fail, succeed } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
import {
  BodyConverterRegistry,
  FileTreeMemoryStore,
  IBodyConverterRegistry,
  IIdentityCodec,
  IIndexedMemoryRecord,
  IMemoryRecord,
  IVectorIndex,
  IVectorQueryHit,
  InMemoryCosineIndex,
  Kind,
  KnowledgeIdentityCodec,
  MemoryCapCullPolicy,
  EntityId,
  MemoryId,
  MemoryIndex,
  MemoryScopeKey,
  MtmIdentityCodec,
  IWritePolicy,
  SemanticRetriever,
  envelopeConverter
} from '../../../index';

const knowledgeKind: Kind = 'knowledge' as Kind;
const mtmKind: Kind = 'mtm' as Kind;

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

/** Records add/remove call order and can be configured to fail either op. */
class SpyVectorIndex implements IVectorIndex {
  public readonly calls: string[] = [];
  public failAdd: boolean = false;
  public failRemove: boolean = false;
  private readonly _inner: InMemoryCosineIndex = InMemoryCosineIndex.create().orThrow();

  public async add(id: MemoryId, vector: Float32Array): Promise<Result<string>> {
    this.calls.push(`add:${id}`);
    return this.failAdd ? fail('add boom') : this._inner.add(id, vector);
  }
  public async remove(id: MemoryId): Promise<Result<MemoryId>> {
    this.calls.push(`remove:${id}`);
    return this.failRemove ? fail('remove boom') : this._inner.remove(id);
  }
  public query(vector: Float32Array, topK: number): Promise<Result<ReadonlyArray<IVectorQueryHit>>> {
    return this._inner.query(vector, topK);
  }
}

function knowledgeStore(
  vectorIndex?: IVectorIndex,
  embed?: (r: IMemoryRecord<unknown>) => Promise<Result<Float32Array>>
): FileTreeMemoryStore {
  const registry: IBodyConverterRegistry = BodyConverterRegistry.create().orThrow();
  registry.register(knowledgeKind, Converters.string);
  return FileTreeMemoryStore.create({
    root: mutableRoot(),
    registry,
    codecs: new Map<Kind, IIdentityCodec>([[knowledgeKind, new KnowledgeIdentityCodec()]]),
    vectorIndex,
    embed
  }).orThrow();
}

describe('FileTreeMemoryStore embed-on-write', () => {
  describe('when wired', () => {
    test('embeds on write, stamps embeddingRef, and indexes the vector', async () => {
      const index = InMemoryCosineIndex.create().orThrow();
      const store = knowledgeStore(index, recordEmbed);
      expect(await store.put(makeRecord('doc-a', 'cat cat'))).toSucceedAndSatisfy(
        (record: IMemoryRecord<unknown>) => {
          // InMemoryCosineIndex keys entries by id, so the ref IS the id.
          expect(record.envelope.embeddingRef).toBe('doc-a');
        }
      );
      expect(index.size).toBe(1);
      // The persisted file carries the embeddingRef (round-trips through disk).
      expect(await store.getById('knowledge' as MemoryScopeKey, 'doc-a' as MemoryId)).toSucceedAndSatisfy(
        (record: IMemoryRecord<unknown> | undefined) => {
          expect(record?.envelope.embeddingRef).toBe('doc-a');
        }
      );
      // The vector is queryable.
      expect(await index.query(featureVector('cat'), 1)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits[0].id).toBe('doc-a');
        }
      );
    });

    test('re-embeds on a content change: removes the stale vector then adds the new one', async () => {
      const spy = new SpyVectorIndex();
      const store = knowledgeStore(spy, recordEmbed);
      (await store.put(makeRecord('doc-a', 'cat'))).orThrow();
      (await store.put(makeRecord('doc-a', 'dog'))).orThrow();
      // First write adds; the content change removes the stale vector before
      // adding the replacement.
      expect(spy.calls).toEqual(['add:doc-a', 'remove:doc-a', 'add:doc-a']);
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
          expect(hits.map((h) => h.id)).not.toContain('turn-0');
        }
      );
    });

    test('fails the put loudly and persists nothing when embedding fails', async () => {
      const index = InMemoryCosineIndex.create().orThrow();
      const failEmbed = (): Promise<Result<Float32Array>> => Promise.resolve(fail('no model'));
      const store = knowledgeStore(index, failEmbed);
      expect(await store.put(makeRecord('doc-a', 'cat'))).toFailWith(/embedding failed: no model/i);
      // The file was never written (embed runs before persist) and the index is empty.
      expect(await store.getById('knowledge' as MemoryScopeKey, 'doc-a' as MemoryId)).toSucceedWith(
        undefined
      );
      expect(index.size).toBe(0);
    });

    test('fails the put loudly when the vector add fails', async () => {
      const spy = new SpyVectorIndex();
      spy.failAdd = true;
      const store = knowledgeStore(spy, recordEmbed);
      expect(await store.put(makeRecord('doc-a', 'cat'))).toFailWith(/vector add failed: add boom/i);
      expect(await store.getById('knowledge' as MemoryScopeKey, 'doc-a' as MemoryId)).toSucceedWith(
        undefined
      );
    });

    test('fails the put loudly when stale-vector removal fails on a content change', async () => {
      const spy = new SpyVectorIndex();
      const store = knowledgeStore(spy, recordEmbed);
      (await store.put(makeRecord('doc-a', 'cat'))).orThrow();
      spy.failRemove = true;
      expect(await store.put(makeRecord('doc-a', 'dog'))).toFailWith(
        /stale vector removal failed: remove boom/i
      );
    });

    test('fails the delete loudly when vector removal fails', async () => {
      const spy = new SpyVectorIndex();
      const store = knowledgeStore(spy, recordEmbed);
      (await store.put(makeRecord('doc-a', 'cat'))).orThrow();
      spy.failRemove = true;
      expect(await store.delete(knowledgeKind, 'doc-a' as unknown as EntityId)).toFailWith(
        /vector removal for 'doc-a' failed: remove boom/i
      );
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
});
