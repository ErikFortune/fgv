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
  IDerivedStateCoverage,
  IEmbeddedFragment,
  IIdentityCodec,
  IMemoryRecord,
  InMemoryCosineIndex,
  InMemoryFragmentCosineIndex,
  Kind,
  KnowledgeIdentityCodec,
  RankProjector,
  envelopeConverter
} from '../../../index';

const knowledgeKind: Kind = 'knowledge' as Kind;
const noteKind: Kind = 'note' as Kind;

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
  r.register(noteKind, Converters.string);
  return r;
}

function codecs(): Map<Kind, IIdentityCodec> {
  return new Map<Kind, IIdentityCodec>([
    [knowledgeKind, new KnowledgeIdentityCodec()],
    [noteKind, new KnowledgeIdentityCodec()]
  ]);
}

function record(id: string, kind: Kind = knowledgeKind): IMemoryRecord<unknown> {
  return {
    envelope: envelopeConverter
      .convert({
        id,
        entityId: id,
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
    body: `body-${id}`
  };
}

const embed = (): Promise<Result<Float32Array>> => Promise.resolve(succeed(Float32Array.from([1, 0])));
const fragmentEmbedder = (): Promise<Result<ReadonlyArray<IEmbeddedFragment>>> =>
  Promise.resolve(succeed([{ locator: { start: 0, end: 5 }, vector: Float32Array.from([1, 0]) }]));

describe('IMemoryStore.coverage', () => {
  test('reports records per kind and nothing else when nothing is derived', async () => {
    // The bare store: no projector, no index lanes. Every artifact member must be
    // ABSENT rather than zero — the store is not failing to derive anything, it
    // was never asked to.
    const store = FileTreeMemoryStore.create({
      root: mutableRoot(),
      registry: registry(),
      codecs: codecs()
    }).orThrow();
    (await store.put(record('a'))).orThrow();
    (await store.put(record('b', noteKind))).orThrow();

    expect(await store.coverage()).toSucceedAndSatisfy((c: IDerivedStateCoverage) => {
      expect(c.records.get(knowledgeKind)).toBe(1);
      expect(c.records.get(noteKind)).toBe(1);
      expect(c.rank).toBeUndefined();
      expect(c.recordVectors).toBeUndefined();
      expect(c.fragmentVectors).toBeUndefined();
    });
  });

  test('a wired-but-empty lane reports zero — which is NOT the same as absent', async () => {
    // The distinction the optional members exist for: an unwired fragment index
    // is not a problem, and a wired one holding nothing probably is.
    const store = FileTreeMemoryStore.create({
      root: mutableRoot(),
      registry: registry(),
      codecs: codecs(),
      fragmentIndex: InMemoryFragmentCosineIndex.create().orThrow()
    }).orThrow();

    expect(await store.coverage()).toSucceedAndSatisfy((c: IDerivedStateCoverage) => {
      expect(c.fragmentVectors).toEqual({ indexRecordCount: 0, indexFragmentCount: 0 });
      expect(c.recordVectors).toBeUndefined();
    });
  });

  test('reports record-vector coverage per kind against the index size', async () => {
    const store = FileTreeMemoryStore.create({
      root: mutableRoot(),
      registry: registry(),
      codecs: codecs(),
      vectorIndex: InMemoryCosineIndex.create().orThrow(),
      embed
    }).orThrow();
    (await store.put(record('a'))).orThrow();
    (await store.put(record('b'))).orThrow();

    expect(await store.coverage()).toSucceedAndSatisfy((c: IDerivedStateCoverage) => {
      expect(c.recordVectors?.perKind.get(knowledgeKind)).toEqual({ expected: 2, covered: 2 });
      expect(c.recordVectors?.indexSize).toBe(2);
    });
  });

  test('an excluded kind reports expected 0 against a non-zero record count', async () => {
    // The exclusion story, stated rather than inferred: `records: 1, expected: 0`
    // says the kind exists and is deliberately not embedded. Omitting the kind
    // would have said nothing.
    const store = FileTreeMemoryStore.create({
      root: mutableRoot(),
      registry: registry(),
      codecs: codecs(),
      vectorIndex: InMemoryCosineIndex.create().orThrow(),
      embed,
      embedKinds: new Set<Kind>([knowledgeKind])
    }).orThrow();
    (await store.put(record('a'))).orThrow();
    (await store.put(record('b', noteKind))).orThrow();

    expect(await store.coverage()).toSucceedAndSatisfy((c: IDerivedStateCoverage) => {
      expect(c.records.get(noteKind)).toBe(1);
      expect(c.recordVectors?.perKind.get(noteKind)).toEqual({ expected: 0, covered: 0 });
      expect(c.recordVectors?.perKind.get(knowledgeKind)).toEqual({ expected: 1, covered: 1 });
    });
  });

  test('a residual embeddingRef on a now-excluded kind never pushes covered above expected', async () => {
    // The narrowing case: a record embedded under a wide `embedKinds`, then the
    // store reopened with that kind excluded and the record never re-put. Its
    // envelope still carries an `embeddingRef`. Counting it as `covered` would
    // report `expected: 0, covered: 1` and make `expected - covered` negative for
    // anyone sizing the gap, contradicting `IArtifactCoverage.covered`'s "of
    // those". The residue is not swallowed — its vector still counts toward
    // `indexSize`, which is the belief-vs-fact channel that exists for it.
    const root = mutableRoot();
    const wide = FileTreeMemoryStore.create({
      root,
      registry: registry(),
      codecs: codecs(),
      vectorIndex: InMemoryCosineIndex.create().orThrow(),
      embed
    }).orThrow();
    (await wide.put(record('a', noteKind))).orThrow();

    const narrowed = FileTreeMemoryStore.create({
      root,
      registry: registry(),
      codecs: codecs(),
      vectorIndex: InMemoryCosineIndex.create().orThrow(),
      embed,
      embedKinds: new Set<Kind>([knowledgeKind])
    }).orThrow();

    expect(await narrowed.coverage()).toSucceedAndSatisfy((c: IDerivedStateCoverage) => {
      expect(c.records.get(noteKind)).toBe(1);
      expect(c.recordVectors?.perKind.get(noteKind)).toEqual({ expected: 0, covered: 0 });
    });
  });

  test('does not count embeddingRef: null as covered', async () => {
    // `null` is the documented "not embedded" sentinel, so `!== undefined` counts
    // an embedding that is not there — inflating coverage in the confident
    // direction, which is the one direction a health surface must not be wrong in.
    // The reconcile sibling had the same bug running the other way.
    const root = mutableRoot();
    const store = FileTreeMemoryStore.create({
      root,
      registry: registry(),
      codecs: codecs(),
      vectorIndex: InMemoryCosineIndex.create().orThrow(),
      embed
    }).orThrow();
    (await store.put(record('a'))).orThrow();

    const scopeDir = root
      .getChildren()
      .orThrow()
      .find((c): c is FileTree.IFileTreeDirectoryItem => c.type === 'directory');
    const file = scopeDir
      ?.getChildren()
      .orThrow()
      .find((c): c is FileTree.IFileTreeFileItem => c.type === 'file');
    if (file === undefined || !FileTree.isMutableFileItem(file)) {
      throw new Error('expected a mutable record file');
    }
    file
      .setRawContents(
        file
          .getRawContents()
          .orThrow()
          .replace(/^embeddingRef:.*$/m, 'embeddingRef: null')
      )
      .orThrow();

    const reopened = FileTreeMemoryStore.create({
      root,
      registry: registry(),
      codecs: codecs(),
      vectorIndex: InMemoryCosineIndex.create().orThrow(),
      embed
    }).orThrow();

    expect(await reopened.coverage()).toSucceedAndSatisfy((c: IDerivedStateCoverage) => {
      expect(c.recordVectors?.perKind.get(knowledgeKind)).toEqual({ expected: 1, covered: 0 });
    });
  });

  test('covered is a BELIEF and indexSize is a FACT — their divergence is the signal', async () => {
    // The load-bearing property. A vault whose records carry `embeddingRef` from a
    // previous session, reopened against a FRESH in-memory index, reports full
    // per-kind coverage and an index holding nothing. Collapsing these into one
    // percentage would destroy the only free way to notice.
    const root = mutableRoot();
    const seeded = FileTreeMemoryStore.create({
      root,
      registry: registry(),
      codecs: codecs(),
      vectorIndex: InMemoryCosineIndex.create().orThrow(),
      embed
    }).orThrow();
    (await seeded.put(record('a'))).orThrow();
    (await seeded.put(record('b'))).orThrow();

    const reopened = FileTreeMemoryStore.create({
      root,
      registry: registry(),
      codecs: codecs(),
      vectorIndex: InMemoryCosineIndex.create().orThrow(),
      embed
    }).orThrow();

    expect(await reopened.coverage()).toSucceedAndSatisfy((c: IDerivedStateCoverage) => {
      expect(c.recordVectors?.perKind.get(knowledgeKind)?.covered).toBe(2);
      expect(c.recordVectors?.indexSize).toBe(0);
    });
  });

  test('reports rank coverage only for kinds with a registered projector', async () => {
    const projector: RankProjector = (): number => 5;
    const store = FileTreeMemoryStore.create({
      root: mutableRoot(),
      registry: registry(),
      codecs: codecs(),
      rankProjectors: new Map<Kind, RankProjector>([[knowledgeKind, projector]])
    }).orThrow();
    (await store.put(record('a'))).orThrow();
    (await store.put(record('b', noteKind))).orThrow();

    expect(await store.coverage()).toSucceedAndSatisfy((c: IDerivedStateCoverage) => {
      expect(c.rank?.get(knowledgeKind)).toEqual({ expected: 1, covered: 1 });
      // Not 0% — the store was never asked to rank a note.
      expect(c.rank?.get(noteKind)).toBeUndefined();
    });
  });

  test('reports the fragment fan-out, which record counts cannot express', async () => {
    const store = FileTreeMemoryStore.create({
      root: mutableRoot(),
      registry: registry(),
      codecs: codecs(),
      fragmentIndex: InMemoryFragmentCosineIndex.create().orThrow(),
      fragmentEmbedder
    }).orThrow();
    (await store.put(record('a'))).orThrow();

    expect(await store.coverage()).toSucceedAndSatisfy((c: IDerivedStateCoverage) => {
      expect(c.fragmentVectors?.indexRecordCount).toBe(1);
      expect(c.fragmentVectors?.indexFragmentCount).toBe(1);
    });
  });

  test('reads no files — it is answerable against a vault whose files are gone', async () => {
    // The contract, pinned rather than asserted: coverage is envelope-and-count
    // only, so deleting every record file behind the store's back changes nothing
    // it reports. (`list` would fail here; that difference is the point.)
    const root = mutableRoot();
    const store = FileTreeMemoryStore.create({
      root,
      registry: registry(),
      codecs: codecs()
    }).orThrow();
    (await store.put(record('a'))).orThrow();

    const scopeDir = root
      .getChildren()
      .orThrow()
      .find((c): c is FileTree.IFileTreeDirectoryItem => c.type === 'directory');
    if (scopeDir === undefined) {
      throw new Error('expected the knowledge scope directory');
    }
    for (const child of scopeDir.getChildren().orThrow()) {
      if (child.type === 'file' && FileTree.isMutableFileItem(child)) {
        child.delete().orThrow();
      }
    }

    expect(await store.coverage()).toSucceedAndSatisfy((c: IDerivedStateCoverage) => {
      expect(c.records.get(knowledgeKind)).toBe(1);
    });
  });
});
