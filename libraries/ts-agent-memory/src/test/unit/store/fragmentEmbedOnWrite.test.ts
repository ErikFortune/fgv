/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { Converters, Logging, Result, fail, succeed } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
import {
  BodyConverterRegistry,
  EntityId,
  FileTreeMemoryStore,
  FragmentSemanticRetriever,
  IBodyConverterRegistry,
  IEdgeTarget,
  IEmbeddedFragment,
  IFragmentVectorIndex,
  IIdentityCodec,
  IMemoryRecord,
  IVectorQueryHit,
  InMemoryFragmentCosineIndex,
  Kind,
  KnowledgeIdentityCodec,
  MemoryCapCullPolicy,
  MemoryId,
  MemoryScopeKey,
  MtmIdentityCodec,
  IWritePolicy,
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

/** Deterministic keyword-count feature space (no network), shared with the query side. */
const MARKERS: ReadonlyArray<string> = ['cat', 'dog', 'fish'];
function featureVector(text: string): Float32Array {
  const lower: string = text.toLowerCase();
  return Float32Array.from(MARKERS.map((m) => lower.split(m).length - 1));
}

/**
 * Fragment embedder: chunks the body into whitespace-delimited words, emitting one
 * fragment per word with its true `[start, end)` character offsets and a feature
 * vector for that word. Models the consumer-owned chunking policy.
 */
const fragmentEmbed = (r: IMemoryRecord<unknown>): Promise<Result<ReadonlyArray<IEmbeddedFragment>>> =>
  Promise.resolve(
    Converters.string
      .convert(r.body)
      .withErrorFormat((msg) => `cannot embed fragments: body is not a string: ${msg}`)
      .onSuccess((body) => {
        const fragments: IEmbeddedFragment[] = [];
        const re: RegExp = /\S+/g;
        let m: RegExpExecArray | null = re.exec(body);
        while (m !== null) {
          fragments.push({
            locator: { start: m.index, end: m.index + m[0].length },
            vector: featureVector(m[0])
          });
          m = re.exec(body);
        }
        return succeed(fragments);
      })
  );

const queryEmbed = (text: string): Promise<Result<Float32Array>> =>
  Promise.resolve(succeed(featureVector(text)));

/** Records addFragments/remove call order and can be configured to fail either op. */
class SpyFragmentIndex implements IFragmentVectorIndex {
  public readonly calls: string[] = [];
  public failAdd: boolean = false;
  public failRemove: boolean = false;
  private readonly _inner: InMemoryFragmentCosineIndex = InMemoryFragmentCosineIndex.create().orThrow();

  public async addFragments(
    target: IEdgeTarget,
    fragments: ReadonlyArray<IEmbeddedFragment>
  ): Promise<Result<number>> {
    this.calls.push(`add:${target.id}:${fragments.length}`);
    return this.failAdd ? fail('add boom') : this._inner.addFragments(target, fragments);
  }
  public async remove(target: IEdgeTarget): Promise<Result<IEdgeTarget>> {
    this.calls.push(`remove:${target.id}`);
    return this.failRemove ? fail('remove boom') : this._inner.remove(target);
  }
  public query(
    vector: Float32Array,
    topK: number,
    maxPerRecord?: number
  ): Promise<Result<ReadonlyArray<IVectorQueryHit>>> {
    return this._inner.query(vector, topK, maxPerRecord);
  }
}

function knowledgeStore(params: {
  fragmentIndex?: IFragmentVectorIndex;
  fragmentEmbedder?: (r: IMemoryRecord<unknown>) => Promise<Result<ReadonlyArray<IEmbeddedFragment>>>;
  logger?: Logging.ILogger;
}): FileTreeMemoryStore {
  const registry: IBodyConverterRegistry = BodyConverterRegistry.create().orThrow();
  registry.register(knowledgeKind, Converters.string);
  return FileTreeMemoryStore.create({
    root: mutableRoot(),
    registry,
    codecs: new Map<Kind, IIdentityCodec>([[knowledgeKind, new KnowledgeIdentityCodec()]]),
    fragmentIndex: params.fragmentIndex,
    fragmentEmbedder: params.fragmentEmbedder,
    logger: params.logger
  }).orThrow();
}

describe('FileTreeMemoryStore fragment-embed-on-write', () => {
  describe('when wired', () => {
    test('embeds fragments on write and indexes them (queryable by span)', async () => {
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      const store = knowledgeStore({ fragmentIndex: index, fragmentEmbedder: fragmentEmbed });
      expect(await store.put(makeRecord('doc-a', 'cat dog'))).toSucceed();
      // Two words → two fragments.
      expect(index.recordCount).toBe(1);
      expect(index.fragmentCount).toBe(2);
      // A query for 'cat' surfaces the 'cat' span [0,3], not the 'dog' span.
      expect(await index.query(featureVector('cat'), 1)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits[0].target.id).toBe('doc-a');
          expect(hits[0].locator).toEqual({ start: 0, end: 3 });
        }
      );
    });

    test('stamps nothing on the record (fragments have no per-record embeddingRef)', async () => {
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      const store = knowledgeStore({ fragmentIndex: index, fragmentEmbedder: fragmentEmbed });
      expect(await store.put(makeRecord('doc-a', 'cat dog'))).toSucceedAndSatisfy(
        (record: IMemoryRecord<unknown>) => {
          expect(record.envelope.embeddingRef).toBeUndefined();
        }
      );
    });

    test('re-embeds on a content change via whole-record replace', async () => {
      const spy = new SpyFragmentIndex();
      const store = knowledgeStore({ fragmentIndex: spy, fragmentEmbedder: fragmentEmbed });
      (await store.put(makeRecord('doc-a', 'cat'))).orThrow();
      (await store.put(makeRecord('doc-a', 'dog fish'))).orThrow();
      // First write: 1 fragment; second: 2 fragments, replacing the first.
      expect(spy.calls).toEqual(['add:doc-a:1', 'add:doc-a:2']);
      // The 'cat' fragment is gone — the new 'dog'/'fish' spans are orthogonal to a
      // 'cat' query (best score 0), proving the whole-record replace dropped it.
      expect(await spy.query(featureVector('cat'), 5)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits.every((h) => h.score === 0)).toBe(true);
        }
      );
      expect(await spy.query(featureVector('fish'), 1)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits[0].score).toBeCloseTo(1);
        }
      );
    });

    test('does not re-embed a dedup no-op (identical content)', async () => {
      const spy = new SpyFragmentIndex();
      const store = knowledgeStore({ fragmentIndex: spy, fragmentEmbedder: fragmentEmbed });
      (await store.put(makeRecord('doc-a', 'cat'))).orThrow();
      (await store.put(makeRecord('doc-a', 'cat'))).orThrow();
      expect(spy.calls).toEqual(['add:doc-a:1']);
    });

    test('removes the fragments on delete', async () => {
      const spy = new SpyFragmentIndex();
      const store = knowledgeStore({ fragmentIndex: spy, fragmentEmbedder: fragmentEmbed });
      (await store.put(makeRecord('doc-a', 'cat dog'))).orThrow();
      expect(await store.delete(knowledgeKind, 'doc-a' as unknown as EntityId)).toSucceedWith(
        'doc-a' as MemoryId
      );
      expect(spy.calls).toEqual(['add:doc-a:2', 'remove:doc-a']);
      expect(await spy.query(featureVector('cat'), 5)).toSucceedWith([]);
    });

    test('removes evicted fragments on cap-cull eviction', async () => {
      const index = InMemoryFragmentCosineIndex.create().orThrow();
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
        fragmentIndex: index,
        fragmentEmbedder: fragmentEmbed
      }).orThrow();

      (await store.put(makeRecord('turn-0', 'cat', 'mtm', 'conv-1:0'))).orThrow();
      (await store.put(makeRecord('turn-1', 'dog', 'mtm', 'conv-1:1'))).orThrow();
      (await store.put(makeRecord('turn-2', 'fish', 'mtm', 'conv-1:2'))).orThrow();
      // turn-0 evicted from the store AND its fragments from the index.
      expect(index.recordCount).toBe(2);
      expect(await index.query(featureVector('cat'), 5)).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          expect(hits.map((h) => h.target.id)).not.toContain('turn-0');
        }
      );
    });

    test('persists the record (best-effort) and logs when fragment embedding fails', async () => {
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      const logger = new Logging.InMemoryLogger();
      const failEmbed = (): Promise<Result<ReadonlyArray<IEmbeddedFragment>>> =>
        Promise.resolve(fail('no model'));
      const store = knowledgeStore({ fragmentIndex: index, fragmentEmbedder: failEmbed, logger });
      expect(await store.put(makeRecord('doc-a', 'cat'))).toSucceed();
      expect(await store.getById('knowledge' as MemoryScopeKey, 'doc-a' as MemoryId)).toSucceedAndSatisfy(
        (record: IMemoryRecord<unknown> | undefined) => {
          expect(record?.envelope.id).toBe('doc-a');
        }
      );
      expect(index.recordCount).toBe(0);
      expect(logger.logged.some((m) => /fragment embedding 'doc-a' failed.*no model/i.test(m))).toBe(true);
    });

    test('persists the record (best-effort) and logs when the fragment add fails', async () => {
      const spy = new SpyFragmentIndex();
      spy.failAdd = true;
      const logger = new Logging.InMemoryLogger();
      const store = knowledgeStore({ fragmentIndex: spy, fragmentEmbedder: fragmentEmbed, logger });
      expect(await store.put(makeRecord('doc-a', 'cat'))).toSucceed();
      expect(await store.getById('knowledge' as MemoryScopeKey, 'doc-a' as MemoryId)).toSucceedAndSatisfy(
        (record: IMemoryRecord<unknown> | undefined) => {
          expect(record?.envelope.id).toBe('doc-a');
        }
      );
      expect(logger.logged.some((m) => /fragment add for 'doc-a' failed.*add boom/i.test(m))).toBe(true);
    });

    test('best-effort embed survives a throwing/rejecting fragment embedder', async () => {
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      const logger = new Logging.InMemoryLogger();
      const throwingEmbed = (): Promise<Result<ReadonlyArray<IEmbeddedFragment>>> =>
        Promise.reject(new Error('embedder kaboom'));
      const store = knowledgeStore({ fragmentIndex: index, fragmentEmbedder: throwingEmbed, logger });
      expect(await store.put(makeRecord('doc-a', 'cat'))).toSucceed();
      expect(index.recordCount).toBe(0);
      expect(logger.logged.some((m) => /fragment embedding 'doc-a' threw.*embedder kaboom/i.test(m))).toBe(
        true
      );
    });

    test('a committed delete succeeds (best-effort) and logs when fragment removal fails', async () => {
      const spy = new SpyFragmentIndex();
      const logger = new Logging.InMemoryLogger();
      const store = knowledgeStore({ fragmentIndex: spy, fragmentEmbedder: fragmentEmbed, logger });
      (await store.put(makeRecord('doc-a', 'cat'))).orThrow();
      spy.failRemove = true;
      expect(await store.delete(knowledgeKind, 'doc-a' as unknown as EntityId)).toSucceedWith(
        'doc-a' as MemoryId
      );
      expect(await store.getById('knowledge' as MemoryScopeKey, 'doc-a' as MemoryId)).toSucceedWith(
        undefined
      );
      expect(logger.logged.some((m) => /fragment removal for 'doc-a' failed.*remove boom/i.test(m))).toBe(
        true
      );
    });
  });

  describe('when unwired', () => {
    test('a store without a fragment index or embedder does no fragment work', async () => {
      const store = knowledgeStore({});
      expect(await store.put(makeRecord('doc-a', 'cat'))).toSucceedAndSatisfy(
        (record: IMemoryRecord<unknown>) => {
          expect(record.envelope.embeddingRef).toBeUndefined();
        }
      );
    });

    test('a fragment index without an embedder is fully inert (no add or remove)', async () => {
      const spy = new SpyFragmentIndex();
      const store = knowledgeStore({ fragmentIndex: spy });
      (await store.put(makeRecord('doc-a', 'cat'))).orThrow();
      (await store.delete(knowledgeKind, 'doc-a' as unknown as EntityId)).orThrow();
      expect(spy.calls).toEqual([]);
    });
  });

  describe('fragment discovery end-to-end', () => {
    test('a wired store + InMemoryFragmentCosineIndex + FragmentSemanticRetriever returns per-span hits', async () => {
      const index = InMemoryFragmentCosineIndex.create().orThrow();
      const store = knowledgeStore({ fragmentIndex: index, fragmentEmbedder: fragmentEmbed });
      (await store.put(makeRecord('doc-a', 'cat cat dog'))).orThrow();
      (await store.put(makeRecord('doc-b', 'fish fish'))).orThrow();

      const retriever = FragmentSemanticRetriever.create({
        backend: { fragmentIndex: index, embedQuery: queryEmbed }
      }).orThrow();
      expect(retriever.capabilities.supportsFragmentRecall).toBe(true);

      // maxPerRecord=1 keeps doc-a's two 'cat' spans from crowding out the field.
      expect(await retriever.retrieve({ semantic: 'cat', topK: 5, maxPerRecord: 1 })).toSucceedAndSatisfy(
        (hits: ReadonlyArray<IVectorQueryHit>) => {
          // The top hit is a 'cat' span in doc-a; the doc-a cap is honored.
          expect(hits[0].target.id).toBe('doc-a');
          expect(hits[0].locator).toEqual({ start: 0, end: 3 });
          const perRecord = hits.filter((h) => h.target.id === 'doc-a');
          expect(perRecord).toHaveLength(1);
        }
      );
    });
  });
});
