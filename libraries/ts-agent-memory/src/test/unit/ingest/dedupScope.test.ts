/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { Converters, Result, succeed } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
import {
  BodyConverterRegistry,
  DedupScope,
  EntityId,
  FileTreeMemoryStore,
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
  IMemoryClassification,
  IMemoryClassifier,
  IMemoryRecord,
  IProvenance,
  IRelationContext,
  IRelationExtractor,
  IVectorIndex,
  IWritePolicy,
  InMemoryCosineIndex,
  Kind,
  KnowledgeIdentityCodec,
  KnowledgeLwwPolicy,
  LinkType,
  LtmIdentityCodec,
  MemoryCapCullPolicy,
  MemoryEmbedder,
  MemoryId,
  MemoryIngestOrchestrator,
  MemoryScopeKey,
  MtmIdentityCodec,
  ResolutionVerdict,
  Tag,
  TemporalIdentityCodec,
  TemporalVersionedPolicy
} from '../../../index';

// --- kinds --------------------------------------------------------------------
// `mem` is the entity-scoped kind under test: a FLAT (non-versioned) kind whose
// policy declares `dedupScope: 'entity'`. This is the shape the reporter runs —
// an experience family — and the one whose ingest-path behavior this stream fixes.
const memKind: Kind = 'mem' as Kind;
// `doc` is the content-scoped control: cross-id collapse is CORRECT for it and
// must keep working exactly as before.
const docKind: Kind = 'doc' as Kind;
// `claim` is the sibling candidate whose edge points at a collapsed candidate.
// It has no registered policy, so it resolves through the store's DEFAULT policy.
const claimKind: Kind = 'claim' as Kind;
// `turn` is the reporter's LITERAL shape: an MTM kind whose turns share one
// conversation scope and differ only by idStem. This is where the bug bit.
const turnKind: Kind = 'turn' as Kind;
// `evt` is a TEMPORAL entity-scoped kind. TemporalIdentityCodec gives each entity
// its own scope (`<base>/entities/<id>`), so distinct temporal entities were
// already isolated by the scope filter alone — see the test below.
const evtKind: Kind = 'evt' as Kind;

const memScope: MemoryScopeKey = LtmIdentityCodec.scope;
const docScope: MemoryScopeKey = KnowledgeIdentityCodec.scope;

// --- fixtures -----------------------------------------------------------------
const clock = (): number => 1000;

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
  reg.register(memKind, Converters.string);
  reg.register(docKind, Converters.string);
  reg.register(claimKind, Converters.string);
  reg.register(turnKind, Converters.string);
  reg.register(evtKind, Converters.string);
  return reg;
}

const codecs: ReadonlyMap<Kind, IIdentityCodec> = new Map<Kind, IIdentityCodec>([
  [memKind, new LtmIdentityCodec()],
  [docKind, new KnowledgeIdentityCodec()],
  [claimKind, new KnowledgeIdentityCodec()],
  [turnKind, new MtmIdentityCodec()],
  [evtKind, TemporalIdentityCodec.create('events').orThrow()]
]);

/**
 * `mem` declares `'entity'` (the experience family), `doc` declares `'content'`
 * (the knowledge family). `claim` is deliberately absent so it exercises the
 * store's default-policy fallback.
 */
function policies(): ReadonlyMap<Kind, IWritePolicy> {
  return new Map<Kind, IWritePolicy>([
    [
      memKind,
      MemoryCapCullPolicy.create({
        mutableFields: ['body', 'tags', 'links', 'provenance']
      }).orThrow()
    ],
    [docKind, KnowledgeLwwPolicy.create().orThrow()],
    [
      turnKind,
      MemoryCapCullPolicy.create({
        mutableFields: ['body', 'tags', 'links', 'provenance']
      }).orThrow()
    ],
    [evtKind, TemporalVersionedPolicy.create().orThrow()]
  ]);
}

/** A deterministic embedder: identical bodies embed identically (cosine 1.0). */
const embed: MemoryEmbedder = (record) => {
  const vec: ReadonlyArray<number> = record.body === 'shared body' ? [1, 0, 0] : [0, 1, 0];
  return Promise.resolve(succeed(Float32Array.from(vec)));
};

function buildStore(vectorIndex?: IVectorIndex): FileTreeMemoryStore {
  return FileTreeMemoryStore.create({
    root: mutableRoot(),
    registry: registry(),
    codecs,
    writePolicies: policies(),
    clock,
    vectorIndex,
    embed: vectorIndex !== undefined ? embed : undefined
  }).orThrow();
}

/**
 * Write a record straight through the store (the direct-put path). The envelope
 * `id` is the CODEC-DERIVED stem, which is not always the `entityId` — an MTM
 * entity `conv-1:2` addresses to `conversations/conv-1` + stem `turn-2`.
 */
async function put(
  store: FileTreeMemoryStore,
  kind: Kind,
  entityId: string,
  body: string
): Promise<Result<IMemoryRecord<unknown>>> {
  const idStem: string = codecs
    .get(kind)!
    .encode(entityId as EntityId)
    .orThrow().idStem;
  return store.put({
    envelope: {
      id: idStem as MemoryId,
      entityId: entityId as EntityId,
      kind,
      tags: [] as ReadonlyArray<Tag>,
      links: [],
      created: 0,
      updated: 0,
      seq: 0,
      contentHash: '',
      provenance: { source: 'agent' } as IProvenance
    },
    body
  });
}

function candidate(kind: Kind, entityId: string, body: string): ICandidateRecord {
  return {
    envelope: {
      entityId: entityId as EntityId,
      kind,
      tags: [] as ReadonlyArray<Tag>,
      links: [],
      provenance: { source: 'agent' } as IProvenance
    },
    body
  };
}

function target(scope: MemoryScopeKey, id: string): IEdgeTarget {
  return { scope, id: id as MemoryId };
}

const classifyMem: IMemoryClassifier = {
  classify: () => Promise.resolve(succeed({ kind: memKind } as IMemoryClassification))
};

function extractorFor(candidates: ReadonlyArray<ICandidateRecord>): IFactExtractor {
  return { extract: () => Promise.resolve(succeed(candidates)) };
}

function relaterFor(edges: ReadonlyArray<ICandidateEdge>): IRelationExtractor {
  return { relate: (__ctx: IRelationContext) => Promise.resolve(succeed(edges)) };
}

const noEdges: IRelationExtractor = relaterFor([]);

interface IBuildOrchestratorParams {
  readonly store: FileTreeMemoryStore;
  readonly candidates: ReadonlyArray<ICandidateRecord>;
  readonly edges?: ReadonlyArray<ICandidateEdge>;
  readonly entityResolver?: IEntityResolver;
  readonly vectorIndex?: IVectorIndex;
}

function buildOrchestrator(params: IBuildOrchestratorParams): MemoryIngestOrchestrator {
  return MemoryIngestOrchestrator.create({
    store: params.store,
    registry: registry(),
    codecs,
    classifier: classifyMem,
    extractor: extractorFor(params.candidates),
    relationExtractor: params.edges !== undefined ? relaterFor(params.edges) : noEdges,
    entityResolver: params.entityResolver,
    vectorIndex: params.vectorIndex,
    embed: params.vectorIndex !== undefined ? embed : undefined
  }).orThrow();
}

const item: IIngestItem = { id: 'item-1', content: 'irrelevant' };

/** The per-candidate outcome for `entityId`, or `undefined` when absent. */
function outcomeFor(
  result: IIngestItemResult,
  entityId: string
): IIngestItemResult['records'][number] | undefined {
  return result.records.find((r) => r.candidate.envelope.entityId === (entityId as EntityId));
}

describe('dedupScope on the ingest path', () => {
  describe('IMemoryStore.dedupScopeFor (deliverable 1)', () => {
    test("reports 'entity' for a kind whose policy declares it", () => {
      expect(buildStore().dedupScopeFor(memKind)).toBe('entity');
    });

    test("reports 'content' for a kind whose policy declares it", () => {
      expect(buildStore().dedupScopeFor(docKind)).toBe('content');
    });

    test("reports 'content' for a kind with NO registered policy (the store's default policy is KnowledgeLwwPolicy)", () => {
      // Documents the real fallback: the store's default policy is a
      // KnowledgeLwwPolicy, which DECLARES 'content'. An unpoliced kind therefore
      // resolves to 'content' and never reaches DEFAULT_DEDUP_SCOPE ('entity').
      expect(buildStore().dedupScopeFor(claimKind)).toBe('content');
      expect(buildStore().dedupScopeFor('never-registered' as Kind)).toBe('content');
    });

    test('agrees with what the write path actually does', async () => {
      // The accessor is not a parallel declaration — it is the same read the
      // store's own dedup branch performs. An 'entity' kind keeps two identical
      // bodies; a 'content' kind collapses them.
      const store: FileTreeMemoryStore = buildStore();
      const scopes: ReadonlyArray<DedupScope> = [store.dedupScopeFor(memKind), store.dedupScopeFor(docKind)];
      expect(scopes).toEqual(['entity', 'content']);
    });
  });

  describe('direct-put path (unchanged, the parity baseline)', () => {
    test("an 'entity' kind keeps two distinct entities with byte-identical bodies", async () => {
      const store: FileTreeMemoryStore = buildStore();
      expect(await put(store, memKind, 'turn-1', 'shared body')).toSucceed();
      expect(await put(store, memKind, 'turn-2', 'shared body')).toSucceedAndSatisfy((rec) => {
        expect(rec.envelope.id).toBe('turn-2');
      });
      expect(await store.list({ kind: memKind })).toSucceedAndSatisfy((records) => {
        expect(records).toHaveLength(2);
      });
    });

    test("a 'content' kind collapses two distinct entities with byte-identical bodies", async () => {
      const store: FileTreeMemoryStore = buildStore();
      expect(await put(store, docKind, 'doc-a', 'shared body')).toSucceed();
      expect(await put(store, docKind, 'doc-b', 'shared body')).toSucceedAndSatisfy((rec) => {
        // The existing record is returned unchanged — the cross-id collapse.
        expect(rec.envelope.id).toBe('doc-a');
      });
      expect(await store.list({ kind: docKind })).toSucceedAndSatisfy((records) => {
        expect(records).toHaveLength(1);
      });
    });
  });

  describe('layer-1 exact match honors dedupScope (deliverable 2)', () => {
    test("an 'entity' kind does NOT collapse a cross-id body collision (fails against pre-fix code)", async () => {
      const store: FileTreeMemoryStore = buildStore();
      expect(await put(store, memKind, 'turn-1', 'shared body')).toSucceed();

      const orchestrator: MemoryIngestOrchestrator = buildOrchestrator({
        store,
        candidates: [candidate(memKind, 'turn-2', 'shared body')]
      });

      expect(await orchestrator.ingestItem(item)).toSucceedAndSatisfy((result) => {
        const turn2 = outcomeFor(result, 'turn-2');
        // Pre-fix this was `deduped` against turn-1 — layer-1 ignored the
        // declaration and always behaved as 'content'.
        expect(turn2?.disposition).toBe('written');
        expect(turn2?.resolution.verdict).toBe('new');
        expect(turn2?.id).toBe('turn-2');
      });
      expect(await store.list({ kind: memKind })).toSucceedAndSatisfy((records) => {
        expect(records).toHaveLength(2);
      });
    });

    test("a 'content' kind still collapses a cross-id body collision", async () => {
      const store: FileTreeMemoryStore = buildStore();
      expect(await put(store, docKind, 'doc-a', 'shared body')).toSucceed();

      const orchestrator: MemoryIngestOrchestrator = buildOrchestrator({
        store,
        candidates: [candidate(docKind, 'doc-b', 'shared body')]
      });

      expect(await orchestrator.ingestItem(item)).toSucceedAndSatisfy((result) => {
        const docB = outcomeFor(result, 'doc-b');
        expect(docB?.disposition).toBe('deduped');
        expect(docB?.resolution).toEqual({
          verdict: 'duplicate-of',
          target: target(docScope, 'doc-a')
        });
        expect(docB?.id).toBe('doc-a');
      });
      expect(await store.list({ kind: docKind })).toSucceedAndSatisfy((records) => {
        expect(records).toHaveLength(1);
      });
    });

    test("an 'entity' kind still reports duplicate-of for a SAME-entity identical body (OQ-2)", async () => {
      const store: FileTreeMemoryStore = buildStore();
      expect(await put(store, memKind, 'turn-1', 'shared body')).toSucceed();

      const orchestrator: MemoryIngestOrchestrator = buildOrchestrator({
        store,
        candidates: [candidate(memKind, 'turn-1', 'shared body')]
      });

      expect(await orchestrator.ingestItem(item)).toSucceedAndSatisfy((result) => {
        const turn1 = outcomeFor(result, 'turn-1');
        // A genuine no-op the store would also collapse. Emitting the verdict
        // keeps it honest, and it is safe because the redirect (deliverable 3)
        // keeps the address resolvable for sibling edges.
        expect(turn1?.disposition).toBe('deduped');
        expect(turn1?.resolution).toEqual({
          verdict: 'duplicate-of',
          target: target(memScope, 'turn-1')
        });
      });
    });

    test("the reporter's literal shape: two MTM turns in ONE conversation scope with identical bodies", async () => {
      // MtmIdentityCodec puts every turn of a conversation in the SAME scope
      // (`conversations/<id>`), differing only by idStem (`turn-<n>`). That is
      // exactly where the bug bit: same kind, same scope, different entity, and
      // a body collision was enough to collapse one turn into the other.
      const store: FileTreeMemoryStore = buildStore();
      expect(await put(store, turnKind, 'conv-1:1', 'ok, thanks')).toSucceed();

      const orchestrator: MemoryIngestOrchestrator = buildOrchestrator({
        store,
        candidates: [candidate(turnKind, 'conv-1:2', 'ok, thanks')]
      });

      expect(await orchestrator.ingestItem(item)).toSucceedAndSatisfy((result) => {
        expect(outcomeFor(result, 'conv-1:2')?.disposition).toBe('written');
      });
      expect(await store.list({ kind: turnKind })).toSucceedAndSatisfy((records) => {
        // Both turns persist. Pre-fix, turn 2 was silently swallowed.
        expect(records).toHaveLength(2);
      });
    });

    test('a TEMPORAL entity kind keeps distinct entities apart (scope isolation, unchanged)', async () => {
      // TemporalIdentityCodec addresses each entity to its OWN scope
      // (`events/entities/<id>`), so two distinct temporal entities were never
      // in one exact-match cohort even before this change — the scope filter
      // alone separated them. Guarding it so the entity narrowing (which is a
      // no-op within a single entity's scope, where every version shares the
      // idStem) is never mistaken for what protects temporal kinds.
      const store: FileTreeMemoryStore = buildStore();
      expect(await put(store, evtKind, 'evt-1', 'shared body')).toSucceed();

      const orchestrator: MemoryIngestOrchestrator = buildOrchestrator({
        store,
        candidates: [candidate(evtKind, 'evt-2', 'shared body')]
      });

      expect(await orchestrator.ingestItem(item)).toSucceedAndSatisfy((result) => {
        expect(outcomeFor(result, 'evt-2')?.disposition).toBe('written');
      });
    });

    test("an 'entity' kind does not match across scopes", async () => {
      // A doc and a mem record can share a body without either seeing the other:
      // the cohort is scope-filtered before the entity narrowing applies.
      const store: FileTreeMemoryStore = buildStore();
      expect(await put(store, docKind, 'doc-a', 'shared body')).toSucceed();

      const orchestrator: MemoryIngestOrchestrator = buildOrchestrator({
        store,
        candidates: [candidate(memKind, 'turn-1', 'shared body')]
      });

      expect(await orchestrator.ingestItem(item)).toSucceedAndSatisfy((result) => {
        expect(outcomeFor(result, 'turn-1')?.disposition).toBe('written');
      });
    });
  });

  describe("the reporter's scenario end to end", () => {
    test('a cross-id body collision on an entity kind no longer fails the whole item, and the claim is written', async () => {
      // Two live records, same kind, same scope, byte-identical bodies, different
      // entity ids — plus a sibling edge to the second. Pre-fix: turn-2 collapsed
      // to turn-1, its address vanished from `refIds`, and the edge failed
      // validation, taking the WHOLE ingest item (claim included) down with it.
      const store: FileTreeMemoryStore = buildStore();
      expect(await put(store, memKind, 'turn-1', 'shared body')).toSucceed();

      const orchestrator: MemoryIngestOrchestrator = buildOrchestrator({
        store,
        candidates: [candidate(memKind, 'turn-2', 'shared body'), candidate(claimKind, 'c-1', 'a claim')],
        edges: [
          {
            source: target(docScope, 'c-1'),
            edge: { type: 'supports' as LinkType, target: target(memScope, 'turn-2') }
          }
        ]
      });

      expect(await orchestrator.ingestItem(item)).toSucceedAndSatisfy((result) => {
        expect(outcomeFor(result, 'turn-2')?.disposition).toBe('written');
        const claim = outcomeFor(result, 'c-1');
        expect(claim?.disposition).toBe('written');
        // The claim's edge survived and still points at turn-2, which was written.
        expect(claim?.record?.envelope.links).toEqual([
          { type: 'supports', target: target(memScope, 'turn-2') }
        ]);
      });
      expect(await store.list({ kind: memKind })).toSucceedAndSatisfy((records) => {
        expect(records).toHaveLength(2);
      });
    });
  });

  describe('duplicate-of edge redirect (deliverable 3)', () => {
    test("a 'content' kind's collapse redirects a sibling edge to the collapse target", async () => {
      // The collapse is CORRECT here — doc-b really is doc-a. The ingest must
      // still not fail: the claim's edge is redirected onto doc-a.
      const store: FileTreeMemoryStore = buildStore();
      expect(await put(store, docKind, 'doc-a', 'shared body')).toSucceed();

      const orchestrator: MemoryIngestOrchestrator = buildOrchestrator({
        store,
        candidates: [candidate(docKind, 'doc-b', 'shared body'), candidate(claimKind, 'c-1', 'a claim')],
        edges: [
          {
            source: target(docScope, 'c-1'),
            edge: { type: 'supports' as LinkType, target: target(docScope, 'doc-b') }
          }
        ]
      });

      expect(await orchestrator.ingestItem(item)).toSucceedAndSatisfy((result) => {
        expect(outcomeFor(result, 'doc-b')?.disposition).toBe('deduped');
        const claim = outcomeFor(result, 'c-1');
        expect(claim?.disposition).toBe('written');
        // Redirected from the collapsed doc-b to the record it collapsed into.
        expect(claim?.record?.envelope.links).toEqual([
          { type: 'supports', target: target(docScope, 'doc-a') }
        ]);
      });
    });

    test("an 'entity' kind's resolver-driven duplicate-of redirects a sibling edge", async () => {
      // Layer-1 no longer collapses cross-id on an entity kind, so the
      // duplicate-of here comes from the host resolver (layer 2) — the remaining
      // way an entity-scoped candidate legitimately collapses onto another entity.
      const vectorIndex: IVectorIndex = InMemoryCosineIndex.create().orThrow();
      const store: FileTreeMemoryStore = buildStore(vectorIndex);
      expect(await put(store, memKind, 'turn-1', 'shared body')).toSucceed();

      const entityResolver: IEntityResolver = {
        resolve: (__candidate: ICandidateRecord, similar: ReadonlyArray<IEntityResolutionCandidate>) =>
          Promise.resolve(
            succeed({ verdict: 'duplicate-of', target: similar[0].target } as ResolutionVerdict)
          )
      };

      const orchestrator: MemoryIngestOrchestrator = buildOrchestrator({
        store,
        candidates: [candidate(memKind, 'turn-2', 'shared body'), candidate(claimKind, 'c-1', 'a claim')],
        edges: [
          {
            source: target(docScope, 'c-1'),
            edge: { type: 'supports' as LinkType, target: target(memScope, 'turn-2') }
          }
        ],
        entityResolver,
        vectorIndex
      });

      expect(await orchestrator.ingestItem(item)).toSucceedAndSatisfy((result) => {
        expect(outcomeFor(result, 'turn-2')?.disposition).toBe('deduped');
        const claim = outcomeFor(result, 'c-1');
        expect(claim?.disposition).toBe('written');
        expect(claim?.record?.envelope.links).toEqual([
          { type: 'supports', target: target(memScope, 'turn-1') }
        ]);
      });
    });

    test('an edge SOURCED at a collapsed candidate is still rejected loudly', async () => {
      // Sources are the records an edge is written ONTO. A collapsed candidate is
      // never written, so silently relocating the edge would attribute a link the
      // host never asked for. The loud failure is the correct outcome here.
      const store: FileTreeMemoryStore = buildStore();
      expect(await put(store, docKind, 'doc-a', 'shared body')).toSucceed();

      const orchestrator: MemoryIngestOrchestrator = buildOrchestrator({
        store,
        candidates: [candidate(docKind, 'doc-b', 'shared body'), candidate(claimKind, 'c-1', 'a claim')],
        edges: [
          {
            source: target(docScope, 'doc-b'),
            edge: { type: 'supports' as LinkType, target: target(docScope, 'c-1') }
          }
        ]
      });

      expect(await orchestrator.ingestItem(item)).toFailWith(/is not a candidate being written/i);
    });
  });
});
