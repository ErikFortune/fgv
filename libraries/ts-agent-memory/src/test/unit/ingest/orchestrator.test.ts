/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { Converters, Logging, Result, fail, succeed } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
import {
  BodyConverterRegistry,
  CONTRADICTS_LINK_TYPE,
  DEFAULT_SIMILARITY_THRESHOLD,
  DEFAULT_SIMILARITY_TOP_K,
  EntityId,
  FileTreeMemoryStore,
  HOST_INGEST_PROVENANCE_SOURCE,
  IBodyConverterRegistry,
  ICandidateEdge,
  ICandidateRecord,
  IEdgeTarget,
  IEntityResolutionCandidate,
  IEntityResolver,
  IFactExtractor,
  IIdentityCodec,
  IIngestItem,
  IIngestItemResult,
  InMemoryCosineIndex,
  IMemoryClassification,
  IMemoryClassifier,
  IMemoryEnvelope,
  IMemoryRecord,
  IMemoryStore,
  IProvenance,
  IRelationContext,
  IRelationExtractor,
  IVectorIndex,
  IVectorQueryHit,
  IWritePolicy,
  Kind,
  KnowledgeIdentityCodec,
  LinkType,
  LtmIdentityCodec,
  MemoryEmbedder,
  MtmIdentityCodec,
  MemoryId,
  MemoryIngestOrchestrator,
  MemoryScopeKey,
  ResolutionVerdict,
  Tag,
  TemporalIdentityCodec,
  TemporalVersionedPolicy,
  serializeMemoryFile
} from '../../../index';

// --- kinds --------------------------------------------------------------------
const noteKind: Kind = 'note' as Kind;
const factKind: Kind = 'fact' as Kind;
const numKind: Kind = 'num' as Kind;
const orphanKind: Kind = 'orphan' as Kind;
const ltmKind: Kind = 'ltm' as Kind;

// --- shared fixtures ----------------------------------------------------------
let clockValue: number;
const clock = (): number => clockValue;

function mutableRoot(
  files: ReadonlyArray<{ path: string; contents: string }> = []
): FileTree.IMutableFileTreeDirectoryItem {
  const tree = FileTree.inMemory([...files], { mutable: true }).orThrow();
  const root = tree.getDirectory('/').orThrow();
  if (!FileTree.isMutableDirectoryItem(root)) {
    throw new Error('expected a mutable root directory');
  }
  return root;
}

function registry(): IBodyConverterRegistry {
  const reg = BodyConverterRegistry.create().orThrow();
  reg.register(noteKind, Converters.string);
  reg.register(factKind, Converters.string);
  reg.register(numKind, Converters.number);
  reg.register(orphanKind, Converters.string);
  reg.register(ltmKind, Converters.string);
  return reg;
}

const codecs: ReadonlyMap<Kind, IIdentityCodec> = new Map<Kind, IIdentityCodec>([
  [noteKind, new KnowledgeIdentityCodec()],
  [numKind, new KnowledgeIdentityCodec()],
  [ltmKind, new LtmIdentityCodec()],
  [factKind, TemporalIdentityCodec.create('facts').orThrow()]
]);

const policies: ReadonlyMap<Kind, IWritePolicy> = new Map<Kind, IWritePolicy>([
  [factKind, TemporalVersionedPolicy.create().orThrow()]
]);

// A deterministic embedder keyed by body text (three-dimensional vectors so
// cosine relationships are controllable). Unknown bodies map to a distinct axis.
const VECTORS: ReadonlyMap<string, ReadonlyArray<number>> = new Map<string, ReadonlyArray<number>>([
  ['apple pie', [1, 0, 0]],
  ['apple tart', [0.99, 0.14, 0]],
  ['banana bread', [0, 1, 0]]
]);
const embed: MemoryEmbedder = (record) => {
  if (record.body === 'boom') {
    return Promise.resolve(fail('embed boom'));
  }
  const vec: ReadonlyArray<number> = VECTORS.get(record.body as string) ?? [0, 0, 1];
  return Promise.resolve(succeed(Float32Array.from(vec)));
};

// --- mock host stages ---------------------------------------------------------
function classifier(fn: (item: IIngestItem) => Result<IMemoryClassification>): IMemoryClassifier {
  return { classify: (item) => Promise.resolve(fn(item)) };
}
function throwingClassifier(): IMemoryClassifier {
  return {
    classify: () => {
      throw new Error('classifier boom');
    }
  };
}
function extractor(
  fn: (item: IIngestItem, c: IMemoryClassification) => Result<ReadonlyArray<ICandidateRecord>>
): IFactExtractor {
  return { extract: (item, c) => Promise.resolve(fn(item, c)) };
}
function resolver(
  fn: (
    candidate: ICandidateRecord,
    similar: ReadonlyArray<IEntityResolutionCandidate>
  ) => Result<ResolutionVerdict>
): IEntityResolver {
  return { resolve: (candidate, similar) => Promise.resolve(fn(candidate, similar)) };
}
function relater(fn: (ctx: IRelationContext) => Result<ReadonlyArray<ICandidateEdge>>): IRelationExtractor {
  return { relate: (ctx) => Promise.resolve(fn(ctx)) };
}

const noEdges: IRelationExtractor = relater(() => succeed([]));
const classifyNote: IMemoryClassifier = classifier(() => succeed({ kind: noteKind, confidence: 0.9 }));

/** Extractor that emits one note candidate per item, body = item.content, entityId = item.id. */
function oneNoteExtractor(): IFactExtractor {
  return extractor((item) => succeed([candidate(noteKind, item.id, item.content as string)]));
}

function candidate(
  kind: Kind,
  entityId: string,
  body: unknown,
  opts: {
    readonly tags?: ReadonlyArray<string>;
    readonly links?: ICandidateRecord['envelope']['links'];
    readonly provenance?: IProvenance;
    readonly temporal?: IMemoryEnvelope['temporal'];
  } = {}
): ICandidateRecord {
  return {
    envelope: {
      entityId: entityId as EntityId,
      kind,
      tags: (opts.tags ?? []) as ReadonlyArray<Tag>,
      links: opts.links ?? [],
      provenance: opts.provenance ?? { source: 'agent' },
      ...(opts.temporal !== undefined ? { temporal: opts.temporal } : {})
    },
    body
  };
}

/**
 * A scope-qualified target, authored as `scope#id` or a bare id defaulting to the
 * knowledge scope (where the note/num fixtures live). `kt` is the assertion-side
 * spelling of the same helper.
 */
function scopedTarget(spec: string): IEdgeTarget {
  const hash: number = spec.indexOf('#');
  const scope: string = hash >= 0 ? spec.slice(0, hash) : 'knowledge';
  const id: string = hash >= 0 ? spec.slice(hash + 1) : spec;
  return { scope: scope as MemoryScopeKey, id: id as MemoryId };
}
function kt(id: string, scope: string = 'knowledge'): IEdgeTarget {
  return { scope: scope as MemoryScopeKey, id: id as MemoryId };
}

/** The scope-qualified reference of a candidate about to be written, by its entityId. */
function srcOf(ctx: IRelationContext, entityId: string): IEdgeTarget {
  const found = ctx.candidates.find((rc) => rc.candidate.envelope.entityId === (entityId as EntityId));
  if (found === undefined) {
    throw new Error(`test relater: no candidate with entityId '${entityId}'`);
  }
  return found.id;
}

function candEdge(source: string, type: string, target: string, confidence?: number): ICandidateEdge {
  return {
    source: scopedTarget(source),
    edge: {
      type: type as LinkType,
      target: scopedTarget(target),
      ...(confidence !== undefined ? { confidence } : {})
    }
  };
}

interface IBuildParams {
  readonly files?: ReadonlyArray<{ path: string; contents: string }>;
  readonly registry?: IBodyConverterRegistry;
  readonly vectorIndex?: IVectorIndex;
  readonly embed?: MemoryEmbedder;
}

function buildStore(params: IBuildParams = {}): FileTreeMemoryStore {
  return FileTreeMemoryStore.create({
    root: mutableRoot(params.files),
    registry: params.registry ?? registry(),
    codecs,
    writePolicies: policies,
    clock,
    vectorIndex: params.vectorIndex,
    embed: params.embed
  }).orThrow();
}

interface IOrchestratorParams {
  readonly store: IMemoryStore;
  readonly registry?: IBodyConverterRegistry;
  readonly classifier?: IMemoryClassifier;
  readonly extractor?: IFactExtractor;
  readonly relationExtractor?: IRelationExtractor;
  readonly entityResolver?: IEntityResolver;
  readonly vectorIndex?: IVectorIndex;
  readonly embed?: MemoryEmbedder;
  readonly similarityThreshold?: number;
  readonly cycleGuard?: 'reject' | 'off';
}

function buildOrchestrator(params: IOrchestratorParams): MemoryIngestOrchestrator {
  return MemoryIngestOrchestrator.create({
    store: params.store,
    registry: params.registry ?? registry(),
    codecs,
    classifier: params.classifier ?? classifyNote,
    extractor: params.extractor ?? oneNoteExtractor(),
    relationExtractor: params.relationExtractor ?? noEdges,
    entityResolver: params.entityResolver,
    vectorIndex: params.vectorIndex,
    embed: params.embed,
    similarityThreshold: params.similarityThreshold,
    cycleGuard: params.cycleGuard
  }).orThrow();
}

/** A seeded note file with only `source` provenance (the additive-provenance baseline). */
function seedNote(
  id: string,
  body: string,
  provenance: Record<string, unknown> = { source: 'agent' }
): {
  path: string;
  contents: string;
} {
  const envelope: IMemoryEnvelope = {
    id: id as MemoryId,
    entityId: id as EntityId,
    kind: noteKind,
    tags: [],
    links: [],
    created: 1,
    updated: 1,
    seq: 4,
    contentHash: 'seed',
    provenance: provenance as unknown as IProvenance
  };
  return { path: `knowledge/${id}.md`, contents: serializeMemoryFile(envelope, body).orThrow() };
}

beforeEach(() => {
  clockValue = 1000;
});

describe('MemoryIngestOrchestrator', () => {
  describe('create', () => {
    test('constructs via the factory', () => {
      expect(
        MemoryIngestOrchestrator.create({
          store: buildStore(),
          registry: registry(),
          codecs,
          classifier: classifyNote,
          extractor: oneNoteExtractor(),
          relationExtractor: noEdges
        })
      ).toSucceed();
    });

    test('exposes the documented similarity defaults', () => {
      expect(DEFAULT_SIMILARITY_THRESHOLD).toBe(0.85);
      expect(DEFAULT_SIMILARITY_TOP_K).toBe(5);
    });
  });

  describe('single-item ingest (first-class path)', () => {
    test('classifies, extracts, and writes one record end-to-end with host-ingest provenance + derivedFrom', async () => {
      const store = buildStore();
      const orch = buildOrchestrator({ store });
      const sourceId: MemoryId = 'turn-3' as MemoryId;
      const result = await orch.ingestItem({ id: 'doc-1', content: 'the sky is blue', sourceId });
      expect(result).toSucceedAndSatisfy((r: IIngestItemResult) => {
        expect(r.item.id).toBe('doc-1');
        expect(r.records).toHaveLength(1);
        const rec = r.records[0];
        expect(rec.disposition).toBe('written');
        expect(rec.resolution.verdict).toBe('new');
        expect(rec.id).toBe('doc-1');
        expect(rec.record?.envelope.provenance.source).toBe(HOST_INGEST_PROVENANCE_SOURCE);
        expect(rec.record?.envelope.provenance.derivedFrom).toBe('turn-3');
        expect(rec.record?.body).toBe('the sky is blue');
        expect(rec.interlock).toBeUndefined();
      });
      expect(await store.get(noteKind, 'doc-1' as EntityId)).toSucceedAndSatisfy(
        (rec: IMemoryRecord<unknown> | undefined) => {
          expect(rec?.body).toBe('the sky is blue');
        }
      );
    });

    test('omits derivedFrom when the item carries no sourceId', async () => {
      const store = buildStore();
      const orch = buildOrchestrator({ store });
      const result = await orch.ingestItem({ id: 'doc-1', content: 'a fact' });
      expect(result).toSucceedAndSatisfy((r: IIngestItemResult) => {
        expect(r.records[0].record?.envelope.provenance.derivedFrom).toBeUndefined();
        expect(r.records[0].record?.envelope.provenance.source).toBe(HOST_INGEST_PROVENANCE_SOURCE);
      });
    });

    test('yields an empty record set when the extractor finds nothing memorable', async () => {
      const store = buildStore();
      const orch = buildOrchestrator({ store, extractor: extractor(() => succeed([])) });
      expect(await orch.ingestItem({ id: 'doc-1', content: 'noise' })).toSucceedAndSatisfy(
        (r: IIngestItemResult) => {
          expect(r.records).toEqual([]);
        }
      );
    });
  });

  describe('host-stage failures abort loudly', () => {
    test('classifier failure', async () => {
      const orch = buildOrchestrator({
        store: buildStore(),
        classifier: classifier(() => fail('cannot classify'))
      });
      expect(await orch.ingestItem({ id: 'doc-1', content: 'x' })).toFailWith(/cannot classify/);
    });

    test('classifier throw is captured as a failure', async () => {
      const orch = buildOrchestrator({ store: buildStore(), classifier: throwingClassifier() });
      expect(await orch.ingestItem({ id: 'doc-1', content: 'x' })).toFailWith(
        /classify threw.*classifier boom/
      );
    });

    test('extractor failure', async () => {
      const orch = buildOrchestrator({
        store: buildStore(),
        extractor: extractor(() => fail('extract error'))
      });
      expect(await orch.ingestItem({ id: 'doc-1', content: 'x' })).toFailWith(/extract error/);
    });

    test('relation-extractor failure', async () => {
      const orch = buildOrchestrator({
        store: buildStore(),
        relationExtractor: relater(() => fail('relate error'))
      });
      expect(await orch.ingestItem({ id: 'doc-1', content: 'x' })).toFailWith(/relate error/);
    });
  });

  describe('stage 3b — typed validation boundary', () => {
    test('rejects a candidate whose body fails the kind converter', async () => {
      const orch = buildOrchestrator({
        store: buildStore(),
        extractor: extractor(() => succeed([candidate(noteKind, 'doc-1', 42)]))
      });
      expect(await orch.ingestItem({ id: 'doc-1', content: 'x' })).toFailWith(
        /candidate body for kind 'note' is invalid/
      );
    });

    test('rejects a non-string body even when the converter accepts it', async () => {
      const orch = buildOrchestrator({
        store: buildStore(),
        extractor: extractor(() => succeed([candidate(numKind, 'n-1', 42)]))
      });
      expect(await orch.ingestItem({ id: 'n-1', content: 'x' })).toFailWith(/must be a string/);
    });

    test('fails when no identity codec is registered for the candidate kind', async () => {
      const orch = buildOrchestrator({
        store: buildStore(),
        extractor: extractor(() => succeed([candidate(orphanKind, 'o-1', 'body')]))
      });
      expect(await orch.ingestItem({ id: 'o-1', content: 'x' })).toFailWith(/no identity codec/);
    });

    test('fails loudly when a pre-existing snapshot record cannot be scoped (no codec for its kind)', async () => {
      // The store can persist a note (it has the note codec), but the orchestrator
      // below is wired WITHOUT a note codec — so when it snapshots the store to run
      // the edge path, it cannot resolve the seeded note's scope and fails loudly
      // (never silently drops it from the cycle graph). This is the branch the
      // scope-qualified edge change added.
      const store = buildStore();
      await putNote(store, 'legacy', 'anchor');
      const orch = MemoryIngestOrchestrator.create({
        store,
        registry: registry(),
        // Deliberately omit the note codec (and any default) that the seeded record needs.
        codecs: new Map<Kind, IIdentityCodec>([[numKind, new KnowledgeIdentityCodec()]]),
        classifier: classifier(() => succeed({ kind: numKind })),
        extractor: extractor(() => succeed([candidate(numKind, 'n-1', 7)])),
        relationExtractor: noEdges
      }).orThrow();
      expect(await orch.ingestItem({ id: 'i', content: 'x' })).toFailWith(
        /cannot resolve scope for stored record 'legacy'.*no identity codec registered for kind 'note'/i
      );
    });
  });

  describe('stage 4 — exact dedup (layer 1)', () => {
    test('an exact {kind,body} match in scope is duplicate-of (no resolver)', async () => {
      const store = buildStore({ files: [seedNote('doc-a', 'hello')] });
      const orch = buildOrchestrator({
        store,
        extractor: extractor(() => succeed([candidate(noteKind, 'doc-b', 'hello')]))
      });
      expect(await orch.ingestItem({ id: 'i', content: 'x' })).toSucceedAndSatisfy((r: IIngestItemResult) => {
        expect(r.records[0].disposition).toBe('deduped');
        expect(r.records[0].resolution).toEqual({ verdict: 'duplicate-of', target: 'doc-a' });
        expect(r.records[0].id).toBe('doc-a');
      });
      // doc-b was never written.
      expect(await store.get(noteKind, 'doc-b' as EntityId)).toSucceedWith(undefined);
    });

    test('exact dedup takes precedence over the resolver (resolver never called)', async () => {
      const vectorIndex = InMemoryCosineIndex.create().orThrow();
      const store = buildStore({ files: [seedNote('doc-a', 'hello')] });
      const orch = buildOrchestrator({
        store,
        entityResolver: resolver(() => fail('resolver must not be called')),
        vectorIndex,
        embed,
        extractor: extractor(() => succeed([candidate(noteKind, 'doc-b', 'hello')]))
      });
      expect(await orch.ingestItem({ id: 'i', content: 'x' })).toSucceedAndSatisfy((r: IIngestItemResult) => {
        expect(r.records[0].disposition).toBe('deduped');
      });
    });

    test('a distinct body is a fresh write (no resolver → exact-only fall-back)', async () => {
      const store = buildStore({ files: [seedNote('doc-a', 'hello')] });
      const orch = buildOrchestrator({
        store,
        extractor: extractor(() => succeed([candidate(noteKind, 'doc-b', 'goodbye')]))
      });
      expect(await orch.ingestItem({ id: 'i', content: 'x' })).toSucceedAndSatisfy((r: IIngestItemResult) => {
        expect(r.records[0].disposition).toBe('written');
        expect(r.records[0].resolution.verdict).toBe('new');
      });
    });
  });
});

// --- similarity + resolver fixtures ------------------------------------------
const classifyFact: IMemoryClassifier = classifier(() => succeed({ kind: factKind }));
function oneFactExtractor(): IFactExtractor {
  return extractor((item) => succeed([candidate(factKind, item.id, item.content as string)]));
}

async function putNote(store: FileTreeMemoryStore, id: string, body: string): Promise<void> {
  const rec: IMemoryRecord<unknown> = {
    envelope: {
      id: id as MemoryId,
      entityId: id as EntityId,
      kind: noteKind,
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
  (await store.put(rec)).orThrow();
}

function mockStore(overrides: Partial<IMemoryStore>): IMemoryStore {
  return {
    get:
      overrides.get ??
      ((): Promise<Result<IMemoryRecord<unknown> | undefined>> => Promise.resolve(succeed(undefined))),
    getById:
      overrides.getById ??
      ((): Promise<Result<IMemoryRecord<unknown> | undefined>> => Promise.resolve(succeed(undefined))),
    list:
      overrides.list ??
      ((): Promise<Result<ReadonlyArray<IMemoryRecord<unknown>>>> => Promise.resolve(succeed([]))),
    put: overrides.put ?? ((r): Promise<Result<IMemoryRecord<unknown>>> => Promise.resolve(succeed(r))),
    delete: overrides.delete ?? ((): Promise<Result<MemoryId>> => Promise.resolve(fail('n/a')))
  };
}

describe('MemoryIngestOrchestrator — stage 4 similarity (layer 2)', () => {
  test('resolver verdict new writes the candidate despite a near-duplicate', async () => {
    const vectorIndex = InMemoryCosineIndex.create().orThrow();
    const store = buildStore({ vectorIndex, embed });
    await putNote(store, 'doc-a', 'apple pie');
    const orch = buildOrchestrator({
      store,
      vectorIndex,
      embed,
      entityResolver: resolver(() => succeed({ verdict: 'new' })),
      extractor: extractor(() => succeed([candidate(noteKind, 'doc-b', 'apple tart')]))
    });
    expect(await orch.ingestItem({ id: 'i', content: 'x' })).toSucceedAndSatisfy((r: IIngestItemResult) => {
      expect(r.records[0].disposition).toBe('written');
      expect(r.records[0].resolution.verdict).toBe('new');
    });
  });

  test('resolver verdict duplicate-of dedups against the surfaced neighbor', async () => {
    const vectorIndex = InMemoryCosineIndex.create().orThrow();
    const store = buildStore({ vectorIndex, embed });
    await putNote(store, 'doc-a', 'apple pie');
    const orch = buildOrchestrator({
      store,
      vectorIndex,
      embed,
      entityResolver: resolver((__c, similar) => succeed({ verdict: 'duplicate-of', target: similar[0].id })),
      extractor: extractor(() => succeed([candidate(noteKind, 'doc-b', 'apple tart')]))
    });
    expect(await orch.ingestItem({ id: 'i', content: 'x' })).toSucceedAndSatisfy((r: IIngestItemResult) => {
      expect(r.records[0].disposition).toBe('deduped');
      expect(r.records[0].id).toBe('doc-a');
    });
    expect(await store.get(noteKind, 'doc-b' as EntityId)).toSucceedWith(undefined);
  });

  test('resolver verdict supersede writes the candidate and records the superseded target', async () => {
    const vectorIndex = InMemoryCosineIndex.create().orThrow();
    const store = buildStore({ vectorIndex, embed });
    await putNote(store, 'doc-a', 'apple pie');
    const orch = buildOrchestrator({
      store,
      vectorIndex,
      embed,
      entityResolver: resolver((__c, similar) => succeed({ verdict: 'supersede', target: similar[0].id })),
      extractor: extractor(() => succeed([candidate(noteKind, 'doc-b', 'apple tart')]))
    });
    expect(await orch.ingestItem({ id: 'i', content: 'x' })).toSucceedAndSatisfy((r: IIngestItemResult) => {
      expect(r.records[0].disposition).toBe('written');
      expect(r.records[0].resolution).toEqual({ verdict: 'supersede', target: 'doc-a' });
      expect(r.records[0].id).toBe('doc-b');
    });
    expect(await store.get(noteKind, 'doc-b' as EntityId)).toSucceedAndSatisfy(
      (rec: IMemoryRecord<unknown> | undefined) => expect(rec?.body).toBe('apple tart')
    );
  });

  test('resolver verdict merge-into re-addresses the write to the target entity', async () => {
    const vectorIndex = InMemoryCosineIndex.create().orThrow();
    const store = buildStore({ vectorIndex, embed });
    await putNote(store, 'doc-a', 'apple pie');
    const orch = buildOrchestrator({
      store,
      vectorIndex,
      embed,
      entityResolver: resolver((__c, similar) => succeed({ verdict: 'merge-into', target: similar[0].id })),
      extractor: extractor(() => succeed([candidate(noteKind, 'doc-b', 'apple tart')]))
    });
    expect(await orch.ingestItem({ id: 'i', content: 'x' })).toSucceedAndSatisfy((r: IIngestItemResult) => {
      expect(r.records[0].disposition).toBe('merged');
      expect(r.records[0].id).toBe('doc-a');
    });
    // The merge updated doc-a's body (LWW merge patch) and never minted doc-b.
    expect(await store.get(noteKind, 'doc-a' as EntityId)).toSucceedAndSatisfy(
      (rec: IMemoryRecord<unknown> | undefined) => expect(rec?.body).toBe('apple tart')
    );
    expect(await store.get(noteKind, 'doc-b' as EntityId)).toSucceedWith(undefined);
  });

  test('merge-into with a non-existent target fails loudly', async () => {
    const vectorIndex = InMemoryCosineIndex.create().orThrow();
    const store = buildStore({ vectorIndex, embed });
    await putNote(store, 'doc-a', 'apple pie');
    const orch = buildOrchestrator({
      store,
      vectorIndex,
      embed,
      entityResolver: resolver(() => succeed({ verdict: 'merge-into', target: 'ghost' as MemoryId })),
      extractor: extractor(() => succeed([candidate(noteKind, 'doc-b', 'apple tart')]))
    });
    expect(await orch.ingestItem({ id: 'i', content: 'x' })).toFailWith(
      /merge-into target 'ghost' does not exist/
    );
  });

  test('a below-threshold neighbor is not surfaced (resolver not called)', async () => {
    const vectorIndex = InMemoryCosineIndex.create().orThrow();
    const store = buildStore({ vectorIndex, embed });
    await putNote(store, 'doc-a', 'apple pie');
    const orch = buildOrchestrator({
      store,
      vectorIndex,
      embed,
      entityResolver: resolver(() => fail('resolver must not be called')),
      extractor: extractor(() => succeed([candidate(noteKind, 'doc-b', 'banana bread')]))
    });
    expect(await orch.ingestItem({ id: 'i', content: 'x' })).toSucceedAndSatisfy((r: IIngestItemResult) => {
      expect(r.records[0].resolution.verdict).toBe('new');
    });
  });

  test('the candidate self-hit is excluded from surfaced neighbors', async () => {
    const vectorIndex = InMemoryCosineIndex.create().orThrow();
    const store = buildStore({ vectorIndex, embed });
    await putNote(store, 'doc-a', 'apple pie');
    const orch = buildOrchestrator({
      store,
      vectorIndex,
      embed,
      entityResolver: resolver(() => fail('resolver must not be called')),
      extractor: extractor(() => succeed([candidate(noteKind, 'doc-a', 'apple tart')]))
    });
    // Re-ingesting the SAME entity: its own prior vector is the only over-threshold
    // hit, and it is skipped as the self-hit, so no resolver dispatch occurs.
    expect(await orch.ingestItem({ id: 'i', content: 'x' })).toSucceedAndSatisfy((r: IIngestItemResult) => {
      expect(r.records[0].resolution.verdict).toBe('new');
      expect(r.records[0].disposition).toBe('written');
    });
  });

  test('a surfaced hit with no backing record is skipped', async () => {
    const ghostIndex: IVectorIndex = {
      add: (id) => Promise.resolve(succeed(id as string)),
      remove: (id) => Promise.resolve(succeed(id)),
      query: (): Promise<Result<ReadonlyArray<IVectorQueryHit>>> =>
        Promise.resolve(succeed([{ id: 'ghost' as MemoryId, score: 0.99 }]))
    };
    const orch = buildOrchestrator({
      store: buildStore(),
      vectorIndex: ghostIndex,
      embed,
      entityResolver: resolver(() => fail('resolver must not be called')),
      extractor: extractor(() => succeed([candidate(noteKind, 'doc-b', 'apple tart')]))
    });
    expect(await orch.ingestItem({ id: 'i', content: 'x' })).toSucceedAndSatisfy((r: IIngestItemResult) => {
      expect(r.records[0].resolution.verdict).toBe('new');
    });
  });

  test('an embedder failure surfaces loudly', async () => {
    const vectorIndex = InMemoryCosineIndex.create().orThrow();
    const orch = buildOrchestrator({
      store: buildStore(),
      vectorIndex,
      embed,
      entityResolver: resolver(() => succeed({ verdict: 'new' })),
      extractor: extractor(() => succeed([candidate(noteKind, 'doc-b', 'boom')]))
    });
    expect(await orch.ingestItem({ id: 'i', content: 'x' })).toFailWith(/embed boom/);
  });

  test('a similarity-query failure surfaces loudly', async () => {
    const failingIndex: IVectorIndex = {
      add: (id) => Promise.resolve(succeed(id as string)),
      remove: (id) => Promise.resolve(succeed(id)),
      query: (): Promise<Result<ReadonlyArray<IVectorQueryHit>>> => Promise.resolve(fail('query kaput'))
    };
    const orch = buildOrchestrator({
      store: buildStore(),
      vectorIndex: failingIndex,
      embed,
      entityResolver: resolver(() => succeed({ verdict: 'new' })),
      extractor: extractor(() => succeed([candidate(noteKind, 'doc-b', 'apple tart')]))
    });
    expect(await orch.ingestItem({ id: 'i', content: 'x' })).toFailWith(/query kaput/);
  });

  test('a custom similarityThreshold gates the resolver dispatch', async () => {
    const vectorIndex = InMemoryCosineIndex.create().orThrow();
    const store = buildStore({ vectorIndex, embed });
    await putNote(store, 'doc-a', 'apple pie');
    const orch = buildOrchestrator({
      store,
      vectorIndex,
      embed,
      similarityThreshold: 0.999, // 0.99 neighbor now falls below threshold
      entityResolver: resolver(() => fail('resolver must not be called')),
      extractor: extractor(() => succeed([candidate(noteKind, 'doc-b', 'apple tart')]))
    });
    expect(await orch.ingestItem({ id: 'i', content: 'x' })).toSucceedAndSatisfy((r: IIngestItemResult) => {
      expect(r.records[0].resolution.verdict).toBe('new');
    });
  });
});

describe('MemoryIngestOrchestrator — layer-2 wiring gates (exact-only fall-back)', () => {
  const failResolver: IEntityResolver = resolver(() => fail('resolver must not be called'));
  const almostSimilar = extractor(() => succeed([candidate(noteKind, 'doc-b', 'apple tart')]));

  test('no resolver → exact-only', async () => {
    const vectorIndex = InMemoryCosineIndex.create().orThrow();
    const store = buildStore({ vectorIndex, embed });
    await putNote(store, 'doc-a', 'apple pie');
    const orch = buildOrchestrator({ store, vectorIndex, embed, extractor: almostSimilar });
    expect(await orch.ingestItem({ id: 'i', content: 'x' })).toSucceedAndSatisfy((r: IIngestItemResult) =>
      expect(r.records[0].resolution.verdict).toBe('new')
    );
  });

  test('resolver + embed but no vector index → exact-only', async () => {
    const orch = buildOrchestrator({
      store: buildStore(),
      embed,
      entityResolver: failResolver,
      extractor: almostSimilar
    });
    expect(await orch.ingestItem({ id: 'i', content: 'x' })).toSucceedAndSatisfy((r: IIngestItemResult) =>
      expect(r.records[0].resolution.verdict).toBe('new')
    );
  });

  test('resolver + vector index but no embedder → exact-only', async () => {
    const vectorIndex = InMemoryCosineIndex.create().orThrow();
    const orch = buildOrchestrator({
      store: buildStore(),
      vectorIndex,
      entityResolver: failResolver,
      extractor: almostSimilar
    });
    expect(await orch.ingestItem({ id: 'i', content: 'x' })).toSucceedAndSatisfy((r: IIngestItemResult) =>
      expect(r.records[0].resolution.verdict).toBe('new')
    );
  });
});

describe('MemoryIngestOrchestrator — stage 5 relate + cycle guard', () => {
  test('attaches a valid edge to an existing record', async () => {
    const store = buildStore();
    await putNote(store, 'doc-a', 'anchor');
    const orch = buildOrchestrator({
      store,
      extractor: extractor(() => succeed([candidate(noteKind, 'doc-b', 'goodbye')])),
      relationExtractor: relater(() => succeed([candEdge('doc-b', 'mentions', 'doc-a', 0.7)]))
    });
    expect(await orch.ingestItem({ id: 'i', content: 'x' })).toSucceedAndSatisfy((r: IIngestItemResult) => {
      expect(r.records[0].edges).toHaveLength(1);
      expect(r.records[0].record?.envelope.links).toEqual([
        { type: 'mentions', target: kt('doc-a'), confidence: 0.7 }
      ]);
    });
  });

  test('attaches an edge between two sibling candidates', async () => {
    const orch = buildOrchestrator({
      store: buildStore(),
      extractor: extractor(() =>
        succeed([candidate(noteKind, 'doc-b', 'first'), candidate(noteKind, 'doc-c', 'second')])
      ),
      relationExtractor: relater(() => succeed([candEdge('doc-b', 'rel', 'doc-c')]))
    });
    expect(await orch.ingestItem({ id: 'i', content: 'x' })).toSucceedAndSatisfy((r: IIngestItemResult) => {
      expect(r.records).toHaveLength(2);
      expect(r.records[0].record?.envelope.links).toEqual([{ type: 'rel', target: kt('doc-c') }]);
      expect(r.records[1].edges).toEqual([]);
    });
  });

  test('rejects an edge whose source is not a candidate being written', async () => {
    const orch = buildOrchestrator({
      store: buildStore(),
      extractor: extractor(() => succeed([candidate(noteKind, 'doc-b', 'x')])),
      relationExtractor: relater(() => succeed([candEdge('ghost', 'rel', 'doc-b')]))
    });
    expect(await orch.ingestItem({ id: 'i', content: 'x' })).toFailWith(
      /edge source 'knowledge\/ghost' is not a candidate being written/
    );
  });

  test('rejects an edge whose target resolves to nothing', async () => {
    const orch = buildOrchestrator({
      store: buildStore(),
      extractor: extractor(() => succeed([candidate(noteKind, 'doc-b', 'x')])),
      relationExtractor: relater(() => succeed([candEdge('doc-b', 'rel', 'ghost')]))
    });
    expect(await orch.ingestItem({ id: 'i', content: 'x' })).toFailWith(
      /edge target 'knowledge\/ghost' resolves to neither/
    );
  });

  test('rejects a cycle-inducing edge (default guard)', async () => {
    const orch = buildOrchestrator({
      store: buildStore(),
      extractor: extractor(() =>
        succeed([candidate(noteKind, 'doc-b', 'first'), candidate(noteKind, 'doc-c', 'second')])
      ),
      relationExtractor: relater(() =>
        succeed([candEdge('doc-b', 'rel', 'doc-c'), candEdge('doc-c', 'rel', 'doc-b')])
      )
    });
    expect(await orch.ingestItem({ id: 'i', content: 'x' })).toFailWith(/would create a cycle/);
  });

  test('cycleGuard "off" admits an otherwise-cyclic edge set', async () => {
    const orch = buildOrchestrator({
      store: buildStore(),
      cycleGuard: 'off',
      extractor: extractor(() =>
        succeed([candidate(noteKind, 'doc-b', 'first'), candidate(noteKind, 'doc-c', 'second')])
      ),
      relationExtractor: relater(() =>
        succeed([candEdge('doc-b', 'rel', 'doc-c'), candEdge('doc-c', 'rel', 'doc-b')])
      )
    });
    expect(await orch.ingestItem({ id: 'i', content: 'x' })).toSucceedAndSatisfy((r: IIngestItemResult) => {
      expect(r.records[0].record?.envelope.links).toEqual([{ type: 'rel', target: kt('doc-c') }]);
      expect(r.records[1].record?.envelope.links).toEqual([{ type: 'rel', target: kt('doc-b') }]);
    });
  });

  test('a contradicts edge on a NON-temporal kind persists as a plain link (no interlock)', async () => {
    const store = buildStore();
    await putNote(store, 'doc-a', 'anchor');
    const orch = buildOrchestrator({
      store,
      extractor: extractor(() => succeed([candidate(noteKind, 'doc-b', 'goodbye')])),
      relationExtractor: relater(() => succeed([candEdge('doc-b', 'contradicts', 'doc-a')]))
    });
    expect(await orch.ingestItem({ id: 'i', content: 'x' })).toSucceedAndSatisfy((r: IIngestItemResult) => {
      expect(r.records[0].interlock).toBeUndefined();
      expect(r.records[0].record?.envelope.links).toEqual([{ type: 'contradicts', target: kt('doc-a') }]);
    });
  });

  describe('_validateEdges cross-scope target disambiguation', () => {
    // Two EXISTING records share the idStem 'turn-3' across two conversations
    // (the MTM codec mints per-scope stems). A stage-5 edge target must resolve
    // to the CORRECT (scope, id) — with bare-id keying both would alias and a
    // wrong-scope target would silently validate. Guards the ingest-validation seam.
    const mtmKind: Kind = 'mtm' as Kind;

    function mtmRegistry(): IBodyConverterRegistry {
      const reg = registry();
      reg.register(mtmKind, Converters.string);
      return reg;
    }

    const mtmCodecs: ReadonlyMap<Kind, IIdentityCodec> = new Map<Kind, IIdentityCodec>([
      [mtmKind, new MtmIdentityCodec()]
    ]);

    async function seedTurn(store: FileTreeMemoryStore, entityId: string, body: string): Promise<void> {
      const addr = new MtmIdentityCodec().encode(entityId as EntityId).orThrow();
      const rec: IMemoryRecord<unknown> = {
        envelope: {
          id: addr.idStem as MemoryId,
          entityId: entityId as EntityId,
          kind: mtmKind,
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
      (await store.put(rec)).orThrow();
    }

    function buildMtmOrchestrator(
      store: FileTreeMemoryStore,
      relationExtractor: IRelationExtractor
    ): MemoryIngestOrchestrator {
      return MemoryIngestOrchestrator.create({
        store,
        registry: mtmRegistry(),
        codecs: mtmCodecs,
        classifier: classifier(() => succeed({ kind: mtmKind })),
        // The candidate is a fresh turn-5 under conv-a (distinct stem from the seeds).
        extractor: extractor(() => succeed([candidate(mtmKind, 'conv-a:5', 'a new turn')])),
        relationExtractor
      }).orThrow();
    }

    async function seededStore(): Promise<FileTreeMemoryStore> {
      const store = FileTreeMemoryStore.create({
        root: mutableRoot(),
        registry: mtmRegistry(),
        codecs: mtmCodecs,
        clock
      }).orThrow();
      await seedTurn(store, 'conv-a:3', 'anchor in conversation a');
      await seedTurn(store, 'conv-b:3', 'anchor in conversation b');
      return store;
    }

    test('accepts a same-stem edge target that resolves to the correct scope', async () => {
      const store = await seededStore();
      const orch = buildMtmOrchestrator(
        store,
        relater((ctx) =>
          succeed([
            {
              source: srcOf(ctx, 'conv-a:5'),
              edge: { type: 'rel' as LinkType, target: kt('turn-3', 'conversations/conv-a') }
            }
          ])
        )
      );
      expect(await orch.ingestItem({ id: 'i', content: 'x' })).toSucceedAndSatisfy((r: IIngestItemResult) => {
        expect(r.records[0].record?.envelope.links).toEqual([
          { type: 'rel', target: kt('turn-3', 'conversations/conv-a') }
        ]);
      });
    });

    test('rejects a same-stem edge target whose scope has no matching record', async () => {
      const store = await seededStore();
      const orch = buildMtmOrchestrator(
        store,
        relater((ctx) =>
          succeed([
            {
              source: srcOf(ctx, 'conv-a:5'),
              // turn-3 exists under conv-a and conv-b, but NOT conv-z.
              edge: { type: 'rel' as LinkType, target: kt('turn-3', 'conversations/conv-z') }
            }
          ])
        )
      );
      expect(await orch.ingestItem({ id: 'i', content: 'x' })).toFailWith(
        /edge target 'conversations\/conv-z\/turn-3' resolves to neither a sibling candidate nor an existing record/
      );
    });
  });
});

describe('MemoryIngestOrchestrator — contradicts→temporal interlock', () => {
  test('a contradicts edge on a temporal kind invalidates the prior version and writes a new one', async () => {
    const store = buildStore();
    const firstOrch = buildOrchestrator({
      store,
      classifier: classifyFact,
      extractor: oneFactExtractor()
    });
    clockValue = 1000;
    const first = await firstOrch.ingestItem({ id: 'fact-1', content: 'the sky is blue' });
    const v1Id: MemoryId = first.orThrow().records[0].id;
    expect(v1Id).toBe('fact-1-v1');

    clockValue = 2000;
    const secondOrch = buildOrchestrator({
      store,
      classifier: classifyFact,
      extractor: extractor(() => succeed([candidate(factKind, 'fact-1', 'the sky is grey')])),
      relationExtractor: relater((ctx) =>
        succeed([
          {
            source: srcOf(ctx, 'fact-1'),
            edge: { type: CONTRADICTS_LINK_TYPE, target: kt(v1Id, 'facts/entities/fact-1') }
          }
        ])
      )
    });
    expect(await secondOrch.ingestItem({ id: 'fact-1', content: 'the sky is grey' })).toSucceedAndSatisfy(
      (r: IIngestItemResult) => {
        expect(r.records[0].interlock).toBe('temporal-versioned');
        expect(r.records[0].disposition).toBe('written');
        expect(r.records[0].record?.envelope.links).toEqual([
          { type: CONTRADICTS_LINK_TYPE, target: kt(v1Id, 'facts/entities/fact-1') }
        ]);
      }
    );

    // The current version is the new (contradicting) one.
    expect(await store.get(factKind, 'fact-1' as EntityId)).toSucceedAndSatisfy(
      (rec: IMemoryRecord<unknown> | undefined) => expect(rec?.body).toBe('the sky is grey')
    );
    // The prior version is invalidated (invalidate-don't-delete).
    expect(await store.list()).toSucceedAndSatisfy((all: ReadonlyArray<IMemoryRecord<unknown>>) => {
      const v1 = all.find((rec) => rec.envelope.id === v1Id);
      expect(v1?.envelope.temporal?.invalid_at).toBe(2000);
    });
  });

  test('an invalidated version does not exact-dedup a later candidate that repeats its body', async () => {
    const store = buildStore();
    clockValue = 1000;
    const o1 = buildOrchestrator({ store, classifier: classifyFact, extractor: oneFactExtractor() });
    const first = await o1.ingestItem({ id: 'fact-1', content: 'blue' });
    const v1Id: MemoryId = first.orThrow().records[0].id;

    clockValue = 2000;
    const o2 = buildOrchestrator({
      store,
      classifier: classifyFact,
      extractor: extractor(() => succeed([candidate(factKind, 'fact-1', 'grey')])),
      relationExtractor: relater((ctx) =>
        succeed([
          {
            source: srcOf(ctx, 'fact-1'),
            edge: { type: CONTRADICTS_LINK_TYPE, target: kt(v1Id, 'facts/entities/fact-1') }
          }
        ])
      )
    });
    (await o2.ingestItem({ id: 'fact-1', content: 'grey' })).orThrow();

    // Re-introduce the ORIGINAL body: the invalidated v1 must be skipped by exact
    // dedup, so this is a NEW version, not a duplicate-of.
    clockValue = 3000;
    const o3 = buildOrchestrator({
      store,
      classifier: classifyFact,
      extractor: extractor(() => succeed([candidate(factKind, 'fact-1', 'blue')]))
    });
    expect(await o3.ingestItem({ id: 'fact-1', content: 'blue' })).toSucceedAndSatisfy(
      (r: IIngestItemResult) => {
        expect(r.records[0].resolution.verdict).toBe('new');
        expect(r.records[0].disposition).toBe('written');
      }
    );
  });
});

describe('MemoryIngestOrchestrator — additive-provenance non-regression', () => {
  test('a pre-existing record with only source provenance still loads and validates unchanged', async () => {
    const store = buildStore({ files: [seedNote('legacy', 'old note', { source: 'human' })] });
    // Loads at construction time.
    expect(await store.getById('knowledge' as MemoryScopeKey, 'legacy' as MemoryId)).toSucceedAndSatisfy(
      (rec: IMemoryRecord<unknown> | undefined) => {
        expect(rec?.envelope.provenance).toEqual({ source: 'human' });
        expect(rec?.envelope.provenance.by).toBeUndefined();
        expect(rec?.envelope.provenance.derivedFrom).toBeUndefined();
      }
    );
    // An unrelated ingest does not disturb it.
    const orch = buildOrchestrator({ store });
    (await orch.ingestItem({ id: 'fresh', content: 'new content' })).orThrow();
    expect(await store.getById('knowledge' as MemoryScopeKey, 'legacy' as MemoryId)).toSucceedAndSatisfy(
      (rec: IMemoryRecord<unknown> | undefined) => {
        expect(rec?.envelope.provenance).toEqual({ source: 'human' });
      }
    );
  });
});

describe('MemoryIngestOrchestrator — ingestBatch', () => {
  test('ingests a batch in order', async () => {
    const store = buildStore();
    const orch = buildOrchestrator({ store });
    const result = await orch.ingestBatch([
      { id: 'doc-1', content: 'one' },
      { id: 'doc-2', content: 'two' }
    ]);
    expect(result).toSucceedAndSatisfy((results: ReadonlyArray<IIngestItemResult>) => {
      expect(results).toHaveLength(2);
      expect(results.map((r) => r.item.id)).toEqual(['doc-1', 'doc-2']);
      expect(results.every((r) => r.records[0].disposition === 'written')).toBe(true);
    });
  });

  test('aborts the batch on the first item failure', async () => {
    const orch = buildOrchestrator({
      store: buildStore(),
      classifier: classifier((item) =>
        item.id === 'bad' ? fail('classify bad') : succeed({ kind: noteKind })
      )
    });
    expect(
      await orch.ingestBatch([
        { id: 'bad', content: 'one' },
        { id: 'doc-2', content: 'two' }
      ])
    ).toFailWith(/classify bad/);
  });
});

describe('MemoryIngestOrchestrator — store failure paths', () => {
  test('a store snapshot (list) failure aborts the item', async () => {
    const store = mockStore({ list: () => Promise.resolve(fail('list down')) });
    const orch = buildOrchestrator({ store });
    expect(await orch.ingestItem({ id: 'doc-1', content: 'x' })).toFailWith(
      /failed to snapshot store.*list down/
    );
  });

  test('a store put failure surfaces as a write failure', async () => {
    const store = mockStore({ put: () => Promise.resolve(fail('put kaput')) });
    const orch = buildOrchestrator({ store });
    expect(await orch.ingestItem({ id: 'doc-1', content: 'x' })).toFailWith(/write failed.*put kaput/);
  });
});

describe('MemoryIngestOrchestrator — optional constructor params', () => {
  test('falls back to defaultCodec when no per-kind codec map is supplied', async () => {
    const store = buildStore();
    const orch = MemoryIngestOrchestrator.create({
      store,
      registry: registry(),
      defaultCodec: new KnowledgeIdentityCodec(),
      classifier: classifyNote,
      extractor: oneNoteExtractor(),
      relationExtractor: noEdges
    }).orThrow();
    expect(await orch.ingestItem({ id: 'doc-1', content: 'hello' })).toSucceedAndSatisfy(
      (r: IIngestItemResult) => expect(r.records[0].disposition).toBe('written')
    );
  });

  test('honors an explicit similarityTopK and logs a captured host throw to the supplied logger', async () => {
    const logger = new Logging.InMemoryLogger('detail');
    const orch = MemoryIngestOrchestrator.create({
      store: buildStore(),
      registry: registry(),
      codecs,
      classifier: throwingClassifier(),
      extractor: oneNoteExtractor(),
      relationExtractor: noEdges,
      similarityTopK: 3,
      logger
    }).orThrow();
    expect(await orch.ingestItem({ id: 'doc-1', content: 'x' })).toFailWith(/classifier boom/);
    expect(logger.logged.some((m) => /classifier boom/.test(m))).toBe(true);
  });
});

describe('MemoryIngestOrchestrator — review-punch-list fixes', () => {
  test('a stored record with a non-string body fails the exact-dedup pass loudly', async () => {
    const weird: IMemoryRecord<unknown> = {
      envelope: {
        id: 'weird' as MemoryId,
        entityId: 'weird' as EntityId,
        kind: noteKind,
        tags: [],
        links: [],
        created: 0,
        updated: 0,
        seq: 0,
        contentHash: '',
        provenance: { source: 'agent' }
      },
      body: 42
    };
    const store = mockStore({ list: () => Promise.resolve(succeed([weird])) });
    const orch = buildOrchestrator({ store });
    expect(await orch.ingestItem({ id: 'doc-1', content: 'hello' })).toFailWith(
      /stored record 'weird' has a non-string body/
    );
  });

  test('duplicate stage-5 edges are deduped on the written record', async () => {
    const store = buildStore();
    await putNote(store, 'doc-a', 'anchor');
    const orch = buildOrchestrator({
      store,
      extractor: extractor(() => succeed([candidate(noteKind, 'doc-b', 'goodbye')])),
      relationExtractor: relater(() =>
        succeed([candEdge('doc-b', 'rel', 'doc-a'), candEdge('doc-b', 'rel', 'doc-a')])
      )
    });
    expect(await orch.ingestItem({ id: 'i', content: 'x' })).toSucceedAndSatisfy((r: IIngestItemResult) => {
      expect(r.records[0].record?.envelope.links).toEqual([{ type: 'rel', target: kt('doc-a') }]);
    });
  });

  test('two candidates merging into the same target do not duplicate a shared edge', async () => {
    const vectorIndex = InMemoryCosineIndex.create().orThrow();
    const store = buildStore({ vectorIndex, embed });
    await putNote(store, 'doc-a', 'apple pie');
    await putNote(store, 'doc-x', 'target');
    const orch = buildOrchestrator({
      store,
      vectorIndex,
      embed,
      entityResolver: resolver((__c, similar) => succeed({ verdict: 'merge-into', target: similar[0].id })),
      extractor: extractor(() =>
        succeed([candidate(noteKind, 'doc-b', 'apple tart'), candidate(noteKind, 'doc-c', 'apple tart')])
      ),
      relationExtractor: relater(() => succeed([candEdge('doc-a', 'rel', 'doc-x')]))
    });
    expect(await orch.ingestItem({ id: 'i', content: 'x' })).toSucceed();
    expect(await store.get(noteKind, 'doc-a' as EntityId)).toSucceedAndSatisfy(
      (rec: IMemoryRecord<unknown> | undefined) => {
        expect(rec?.envelope.links).toEqual([{ type: 'rel', target: kt('doc-x') }]);
      }
    );
  });
});

describe('MemoryIngestOrchestrator — merge-into safety (second review)', () => {
  // Seed a record with pre-existing tags + links under a flat codec (id === entityId).
  async function putFull(
    store: FileTreeMemoryStore,
    kind: Kind,
    entityId: string,
    body: string,
    opts: { tags?: ReadonlyArray<string>; links?: IMemoryEnvelope['links'] } = {}
  ): Promise<void> {
    const rec: IMemoryRecord<unknown> = {
      envelope: {
        id: entityId as MemoryId,
        entityId: entityId as EntityId,
        kind,
        tags: (opts.tags ?? []) as ReadonlyArray<Tag>,
        links: opts.links ?? [],
        created: 0,
        updated: 0,
        seq: 0,
        contentHash: '',
        provenance: { source: 'agent' }
      },
      body
    };
    (await store.put(rec)).orThrow();
  }

  test('merge-into UNIONs the target’s existing tags + links (never overwrites them)', async () => {
    const vectorIndex = InMemoryCosineIndex.create().orThrow();
    const store = buildStore({ vectorIndex, embed });
    await putFull(store, noteKind, 'doc-a', 'apple pie', {
      tags: ['old-tag'],
      links: [{ type: 'existing' as LinkType, target: kt('doc-z') }]
    });
    await putFull(store, noteKind, 'doc-x', 'target of stage-5');
    const orch = buildOrchestrator({
      store,
      vectorIndex,
      embed,
      entityResolver: resolver((__c, similar) => succeed({ verdict: 'merge-into', target: similar[0].id })),
      extractor: extractor(() =>
        succeed([
          candidate(noteKind, 'doc-b', 'apple tart', {
            tags: ['new-tag'],
            links: [{ type: 'candlink' as LinkType, target: kt('doc-z') }]
          })
        ])
      ),
      relationExtractor: relater(() => succeed([candEdge('doc-a', 'stage5', 'doc-x')]))
    });
    expect(await orch.ingestItem({ id: 'i', content: 'x' })).toSucceedAndSatisfy((r: IIngestItemResult) => {
      expect(r.records[0].disposition).toBe('merged');
    });
    expect(await store.get(noteKind, 'doc-a' as EntityId)).toSucceedAndSatisfy(
      (rec: IMemoryRecord<unknown> | undefined) => {
        // Original tag preserved AND the candidate's tag gained, each once.
        expect([...(rec?.envelope.tags ?? [])].sort()).toEqual(['new-tag', 'old-tag']);
        // Original link + candidate link + stage-5 edge, each exactly once.
        expect(rec?.envelope.links).toEqual([
          { type: 'existing', target: kt('doc-z') },
          { type: 'candlink', target: kt('doc-z') },
          { type: 'stage5', target: kt('doc-x') }
        ]);
      }
    );
  });

  test('merge-into a different-kind target fails loudly', async () => {
    const vectorIndex = InMemoryCosineIndex.create().orThrow();
    const store = buildStore({ vectorIndex, embed });
    // A DIFFERENT-kind (ltm) record embedded so it surfaces as a neighbor of a note candidate.
    await putFull(store, ltmKind, 'conv-1', 'apple pie');
    const orch = buildOrchestrator({
      store,
      vectorIndex,
      embed,
      entityResolver: resolver((__c, similar) => succeed({ verdict: 'merge-into', target: similar[0].id })),
      extractor: extractor(() => succeed([candidate(noteKind, 'doc-b', 'apple tart')]))
    });
    expect(await orch.ingestItem({ id: 'i', content: 'x' })).toFailWith(
      /merge-into target 'conv-1' is kind 'ltm' but the candidate is kind 'note'/
    );
  });

  test('supersede with a non-existent target fails loudly', async () => {
    const vectorIndex = InMemoryCosineIndex.create().orThrow();
    const store = buildStore({ vectorIndex, embed });
    await putFull(store, noteKind, 'doc-a', 'apple pie');
    const orch = buildOrchestrator({
      store,
      vectorIndex,
      embed,
      entityResolver: resolver(() => succeed({ verdict: 'supersede', target: 'ghost' as MemoryId })),
      extractor: extractor(() => succeed([candidate(noteKind, 'doc-b', 'apple tart')]))
    });
    expect(await orch.ingestItem({ id: 'i', content: 'x' })).toFailWith(
      /supersede target 'ghost' does not exist/
    );
  });

  test('duplicate-of with a non-existent target fails loudly', async () => {
    const vectorIndex = InMemoryCosineIndex.create().orThrow();
    const store = buildStore({ vectorIndex, embed });
    await putFull(store, noteKind, 'doc-a', 'apple pie');
    const orch = buildOrchestrator({
      store,
      vectorIndex,
      embed,
      entityResolver: resolver(() => succeed({ verdict: 'duplicate-of', target: 'ghost' as MemoryId })),
      extractor: extractor(() => succeed([candidate(noteKind, 'doc-b', 'apple tart')]))
    });
    expect(await orch.ingestItem({ id: 'i', content: 'x' })).toFailWith(
      /duplicate-of target 'ghost' does not exist/
    );
  });
});
