/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

/**
 * Antagonist torture tests — cycle guard adversarial graphs (target class 6) and
 * enum-branch parity (target class 7), exercised at the ORCHESTRATOR/integration
 * level over a real {@link FileTreeMemoryStore}, complementing the pure-function
 * unit tests in `cycleGuard.test.ts` and the per-verdict tests in
 * `orchestrator.test.ts`.
 */

import '@fgv/ts-utils-jest';
import { Converters, Result, succeed } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
import {
  BodyConverterRegistry,
  EntityId,
  FileTreeMemoryStore,
  IBodyConverterRegistry,
  ICandidateEdge,
  ICandidateRecord,
  IEntityResolutionCandidate,
  IEntityResolver,
  IFactExtractor,
  IIdentityCodec,
  IIngestItem,
  IIngestItemResult,
  IMemoryClassification,
  IMemoryClassifier,
  IMemoryEnvelope,
  IMemoryRecord,
  IRelationContext,
  IRelationExtractor,
  Kind,
  KnowledgeIdentityCodec,
  MemoryId,
  MemoryIngestOrchestrator,
  ResolutionVerdict,
  Tag
} from '../../../index';

const noteKind: Kind = 'note' as Kind;

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
  reg.register(noteKind, Converters.string);
  return reg;
}

const codecs: ReadonlyMap<Kind, IIdentityCodec> = new Map<Kind, IIdentityCodec>([
  [noteKind, new KnowledgeIdentityCodec()]
]);

function buildStore(): FileTreeMemoryStore {
  return FileTreeMemoryStore.create({ root: mutableRoot(), registry: registry(), codecs }).orThrow();
}

async function putFull(
  store: FileTreeMemoryStore,
  entityId: string,
  body: string,
  links: IMemoryEnvelope['links'] = []
): Promise<void> {
  const rec: IMemoryRecord<unknown> = {
    envelope: {
      id: entityId as MemoryId,
      entityId: entityId as EntityId,
      kind: noteKind,
      tags: [],
      links,
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

function classifier(fn: (item: IIngestItem) => Result<IMemoryClassification>): IMemoryClassifier {
  return { classify: (item) => Promise.resolve(fn(item)) };
}
function extractor(
  fn: (item: IIngestItem, c: IMemoryClassification) => Result<ReadonlyArray<ICandidateRecord>>
): IFactExtractor {
  return { extract: (item, c) => Promise.resolve(fn(item, c)) };
}
function relater(fn: (ctx: IRelationContext) => Result<ReadonlyArray<ICandidateEdge>>): IRelationExtractor {
  return { relate: (ctx) => Promise.resolve(fn(ctx)) };
}
function resolver(
  fn: (
    candidate: ICandidateRecord,
    similar: ReadonlyArray<IEntityResolutionCandidate>
  ) => Result<ResolutionVerdict>
): IEntityResolver {
  return { resolve: (candidate, similar) => Promise.resolve(fn(candidate, similar)) };
}

const classifyNote: IMemoryClassifier = classifier(() => succeed({ kind: noteKind }));

function candidate(
  entityId: string,
  body: unknown,
  links: ICandidateRecord['envelope']['links'] = []
): ICandidateRecord {
  return {
    envelope: {
      entityId: entityId as EntityId,
      kind: noteKind,
      tags: [],
      links,
      provenance: { source: 'agent' }
    },
    body
  };
}

function candEdge(source: string, type: string, target: string): ICandidateEdge {
  return { source: source as MemoryId, edge: { type: type as never, target: target as MemoryId } };
}

function buildOrchestrator(params: {
  store: FileTreeMemoryStore;
  extractor: IFactExtractor;
  relationExtractor: IRelationExtractor;
  entityResolver?: IEntityResolver;
}): MemoryIngestOrchestrator {
  return MemoryIngestOrchestrator.create({
    store: params.store,
    registry: registry(),
    codecs,
    classifier: classifyNote,
    extractor: params.extractor,
    relationExtractor: params.relationExtractor,
    entityResolver: params.entityResolver
  }).orThrow();
}

describe('antagonist — cycle guard through EXISTING store edges (integration)', () => {
  // Wrong impl this catches: an orchestrator that only feeds the cycle guard the
  // proposed-edge batch (as its own pure-function unit tests do) and forgets to
  // fold in the store snapshot's existing edges, so a cycle that closes THROUGH
  // an already-persisted edge is silently admitted.
  test('a proposed edge that closes a cycle through a pre-existing on-disk edge is rejected', async () => {
    const store = buildStore();
    // Existing on-disk edge: doc-a -> doc-b (persisted before this ingest runs).
    await putFull(store, 'doc-a', 'anchor-a', [{ type: 'rel' as never, target: 'doc-b' as MemoryId }]);
    await putFull(store, 'doc-b', 'anchor-b');

    // This ingest re-writes doc-b (a 'new'-verdict same-id update, since no
    // resolver is wired) and proposes doc-b -> doc-a, which — unioned with the
    // EXISTING doc-a -> doc-b edge — closes a 2-cycle that exists ONLY because of
    // the on-disk edge, not anything proposed in this batch.
    const orch = buildOrchestrator({
      store,
      extractor: extractor(() => succeed([candidate('doc-b', 'anchor-b-v2')])),
      relationExtractor: relater(() => succeed([candEdge('doc-b', 'rel', 'doc-a')]))
    });
    expect(await orch.ingestItem({ id: 'i', content: 'x' })).toFailWith(/would create a cycle/);

    // Confirm the guard fired BEFORE any write — doc-b's content must be unchanged.
    expect(await store.get(noteKind, 'doc-b' as EntityId)).toSucceedAndSatisfy(
      (rec: IMemoryRecord<unknown> | undefined) => expect(rec?.body).toBe('anchor-b')
    );
  });

  test('a long existing chain plus one proposed edge closing the loop is rejected', async () => {
    const store = buildStore();
    // Existing chain: a -> b -> c -> d (four pre-existing on-disk edges spanning
    // three hops), persisted before this ingest.
    await putFull(store, 'chain-a', 'a', [{ type: 'rel' as never, target: 'chain-b' as MemoryId }]);
    await putFull(store, 'chain-b', 'b', [{ type: 'rel' as never, target: 'chain-c' as MemoryId }]);
    await putFull(store, 'chain-c', 'c', [{ type: 'rel' as never, target: 'chain-d' as MemoryId }]);
    await putFull(store, 'chain-d', 'd');

    // Proposed: chain-d -> chain-a, closing the whole loop through the existing chain.
    const orch = buildOrchestrator({
      store,
      extractor: extractor(() => succeed([candidate('chain-d', 'd-v2')])),
      relationExtractor: relater(() => succeed([candEdge('chain-d', 'rel', 'chain-a')]))
    });
    expect(await orch.ingestItem({ id: 'i', content: 'x' })).toFailWith(/would create a cycle/);
  });

  test('cycleGuard "off" admits a cycle that closes through an existing edge', async () => {
    const store = buildStore();
    await putFull(store, 'doc-a', 'anchor-a', [{ type: 'rel' as never, target: 'doc-b' as MemoryId }]);
    await putFull(store, 'doc-b', 'anchor-b');
    const orch = MemoryIngestOrchestrator.create({
      store,
      registry: registry(),
      codecs,
      classifier: classifyNote,
      extractor: extractor(() => succeed([candidate('doc-b', 'anchor-b-v2')])),
      relationExtractor: relater(() => succeed([candEdge('doc-b', 'rel', 'doc-a')])),
      cycleGuard: 'off'
    }).orThrow();
    expect(await orch.ingestItem({ id: 'i', content: 'x' })).toSucceedAndSatisfy((r: IIngestItemResult) => {
      expect(r.records[0].record?.envelope.links).toEqual([{ type: 'rel', target: 'doc-a' }]);
    });
  });
});

describe('antagonist — resolver target need not be a surfaced `similar` candidate (structural-only gate)', () => {
  // Documents (and locks in) the actual contract: fgv validates a target-bearing
  // verdict STRUCTURALLY (exists in the store + matching kind), uniformly across
  // all three target-bearing verdicts, regardless of whether the resolver's
  // choice was among the `similar` candidates it was shown. Wrong impl this
  // guards against: fgv silently restricting itself to `similar` membership
  // (which would incorrectly reject a host resolver with external knowledge), OR
  // fgv skipping the structural check for one of the three verdicts.
  test.each(['duplicate-of', 'supersede', 'merge-into'] as const)(
    "verdict '%s' targeting a valid existing record OUTSIDE the surfaced similar set is accepted",
    async (verdict) => {
      const store = buildStore();
      await putFull(store, 'doc-a', 'apple pie'); // will be surfaced as `similar`
      await putFull(store, 'doc-q', 'unrelated target'); // exists, but never surfaced

      const { InMemoryCosineIndex } = await import('../../../index');
      const vectorIndex = InMemoryCosineIndex.create().orThrow();
      const embed = (): Promise<Result<Float32Array>> =>
        Promise.resolve(succeed(Float32Array.from([1, 0, 0])));
      // Only doc-a is embedded/indexed; doc-q is never surfaced by similarity —
      // it can only be reached by the resolver's own out-of-band choice.
      (await vectorIndex.add('doc-a' as MemoryId, Float32Array.from([1, 0, 0]))).orThrow();

      const orch = MemoryIngestOrchestrator.create({
        store,
        registry: registry(),
        codecs,
        classifier: classifyNote,
        extractor: extractor(() => succeed([candidate('doc-b', 'apple tart')])),
        relationExtractor: relater(() => succeed([])),
        vectorIndex,
        embed,
        entityResolver: resolver(() => succeed({ verdict, target: 'doc-q' as MemoryId } as ResolutionVerdict))
      }).orThrow();

      const result = await orch.ingestItem({ id: 'i', content: 'x' });
      if (verdict === 'duplicate-of') {
        expect(result).toSucceedAndSatisfy((r: IIngestItemResult) => {
          expect(r.records[0].disposition).toBe('deduped');
          expect(r.records[0].id).toBe('doc-q');
        });
      } else if (verdict === 'supersede') {
        expect(result).toSucceedAndSatisfy((r: IIngestItemResult) => {
          expect(r.records[0].disposition).toBe('written');
          expect(r.records[0].resolution).toEqual({ verdict: 'supersede', target: 'doc-q' });
        });
      } else {
        expect(result).toSucceedAndSatisfy((r: IIngestItemResult) => {
          expect(r.records[0].disposition).toBe('merged');
          expect(r.records[0].id).toBe('doc-q');
        });
      }
    }
  );
});

describe('antagonist — enum-branch parity: uniform structural rejection across target-bearing verdicts', () => {
  // A single table-driven test locking in that EVERY target-bearing verdict arm
  // shares the SAME two structural checks (existence, then kind match) in the
  // SAME order — the exact class of hole ("only merge-into checked") that a
  // prior review caught. Wrong impl this guards against: a future edit that adds
  // a fourth verdict or refactors validation per-branch and re-introduces an
  // asymmetric gap.
  const verdicts = ['duplicate-of', 'supersede', 'merge-into'] as const;

  test.each(verdicts)(
    "verdict '%s' rejects a nonexistent target with the SAME message shape",
    async (verdict) => {
      const store = buildStore();
      await putFull(store, 'doc-a', 'apple pie');
      const { InMemoryCosineIndex } = await import('../../../index');
      const vectorIndex = InMemoryCosineIndex.create().orThrow();
      const embed = (): Promise<Result<Float32Array>> =>
        Promise.resolve(succeed(Float32Array.from([1, 0, 0])));
      const orch = MemoryIngestOrchestrator.create({
        store,
        registry: registry(),
        codecs,
        classifier: classifyNote,
        extractor: extractor(() => succeed([candidate('doc-b', 'apple tart')])),
        relationExtractor: relater(() => succeed([])),
        vectorIndex,
        embed,
        entityResolver: resolver(() => succeed({ verdict, target: 'ghost' as MemoryId } as ResolutionVerdict))
      }).orThrow();
      (await vectorIndex.add('doc-a' as MemoryId, Float32Array.from([1, 0, 0]))).orThrow();
      expect(await orch.ingestItem({ id: 'i', content: 'x' })).toFailWith(
        `ingest 'i': ${verdict} target 'ghost' does not exist in the store`
      );
    }
  );

  test.each(verdicts)(
    "verdict '%s' rejects a foreign-kind target with the SAME message shape",
    async (verdict) => {
      const otherKind: Kind = 'other' as Kind;
      const reg = registry();
      reg.register(otherKind, Converters.string);
      const otherCodecs: ReadonlyMap<Kind, IIdentityCodec> = new Map<Kind, IIdentityCodec>([
        ...codecs,
        [otherKind, new KnowledgeIdentityCodec()]
      ]);
      const store = FileTreeMemoryStore.create({
        root: mutableRoot(),
        registry: reg,
        codecs: otherCodecs
      }).orThrow();
      const foreignRec: IMemoryRecord<unknown> = {
        envelope: {
          id: 'foreign-1' as MemoryId,
          entityId: 'foreign-1' as EntityId,
          kind: otherKind,
          tags: [] as ReadonlyArray<Tag>,
          links: [],
          created: 0,
          updated: 0,
          seq: 0,
          contentHash: '',
          provenance: { source: 'agent' }
        },
        body: 'apple pie'
      };
      (await store.put(foreignRec)).orThrow();
      const { InMemoryCosineIndex } = await import('../../../index');
      const vectorIndex = InMemoryCosineIndex.create().orThrow();
      const embed = (): Promise<Result<Float32Array>> =>
        Promise.resolve(succeed(Float32Array.from([1, 0, 0])));
      const orch = MemoryIngestOrchestrator.create({
        store,
        registry: reg,
        codecs: otherCodecs,
        classifier: classifyNote,
        extractor: extractor(() => succeed([candidate('doc-b', 'apple tart')])),
        relationExtractor: relater(() => succeed([])),
        vectorIndex,
        embed,
        entityResolver: resolver(() =>
          succeed({ verdict, target: 'foreign-1' as MemoryId } as ResolutionVerdict)
        )
      }).orThrow();
      (await vectorIndex.add('foreign-1' as MemoryId, Float32Array.from([1, 0, 0]))).orThrow();
      expect(await orch.ingestItem({ id: 'i', content: 'x' })).toFailWith(
        `ingest 'i': ${verdict} target 'foreign-1' is kind 'other' but the candidate is kind 'note'`
      );
    }
  );
});
