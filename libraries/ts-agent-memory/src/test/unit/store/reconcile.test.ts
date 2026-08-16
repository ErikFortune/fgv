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
  IEmbeddedFragment,
  IFragmentReconcileReport,
  IIdentityCodec,
  IMemoryRecord,
  IVectorReconcileReport,
  InMemoryCosineIndex,
  InMemoryFragmentCosineIndex,
  Kind,
  KnowledgeIdentityCodec,
  MemoryId,
  MemoryScopeKey,
  ReconcileReport,
  envelopeConverter
} from '../../../index';
// Internal modules by design: `reconcileVectors` and `VectorMaintenance` are
// package-internal and must NOT go on the package surface just to be tested —
// `TESTING_GUIDELINES.md` sanctions reaching for the module directly instead.
// The stamp seam below can only be exercised where it is injected.
// eslint-disable-next-line @rushstack/packlets/mechanics
import { reconcileVectors } from '../../../packlets/store/storeReconcile';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { VectorMaintenance } from '../../../packlets/store/vectorMaintenance';

const knowledgeKind: Kind = 'knowledge' as Kind;
// The scope a KnowledgeIdentityCodec addresses. Branded rather than `as never`:
// `never` is assignable to everything, so a swapped scope/id or a renamed brand
// would compile silently — which is the opposite of what a test assertion is for.
const knowledgeScope: MemoryScopeKey = 'knowledge' as MemoryScopeKey;
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

/** The single record file a one-record vault holds. */
function onlyRecordFile(root: FileTree.IMutableFileTreeDirectoryItem): FileTree.IMutableFileTreeFileItem {
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
  return file;
}

const okEmbed = (): Promise<Result<Float32Array | undefined>> =>
  Promise.resolve(succeed(Float32Array.from([1, 0])));
const okFragments = (): Promise<Result<ReadonlyArray<IEmbeddedFragment>>> =>
  Promise.resolve(succeed([{ locator: { start: 0, end: 5 }, vector: Float32Array.from([1, 0]) }]));

describe('IMemoryStore.reconcile — record-vector', () => {
  test('repairs only what the index is missing, and says what it skipped', async () => {
    // The headline property: a record already held costs a membership check and
    // NO embedder call. That difference is the whole reason this is not a rebuild.
    const index = InMemoryCosineIndex.create().orThrow();
    let embedCalls: number = 0;
    const counting = (): Promise<Result<Float32Array | undefined>> => {
      embedCalls += 1;
      return okEmbed();
    };
    const store = FileTreeMemoryStore.create({
      root: mutableRoot(),
      registry: registry(),
      codecs: codecs(),
      vectorIndex: index,
      embed: counting
    }).orThrow();
    (await store.put(record('a'))).orThrow();
    (await store.put(record('b'))).orThrow();
    const afterWrites: number = embedCalls;

    // Drop one vector behind the store's back — a swallowed embed failure, or a
    // record written while the index was unwired.
    (await index.remove({ scope: knowledgeScope, id: 'b' as MemoryId })).orThrow();

    expect(await store.reconcile(knowledgeKind, 'record-vector')).toSucceedAndSatisfy(
      (r: ReconcileReport) => {
        const report = r as IVectorReconcileReport;
        expect(report.artifact).toBe('record-vector');
        expect(report.examined).toBe(2);
        expect(report.alreadyIndexed).toBe(1);
        expect(report.repaired).toBe(1);
        expect(report.failed).toHaveLength(0);
      }
    );
    // Exactly one embedder call for the one gap, not two for the kind.
    expect(embedCalls).toBe(afterWrites + 1);
  });

  test('restamps a lost embeddingRef without calling the embedder', async () => {
    // The case an embeddingRef-only repair cannot even SEE: the index holds the
    // vector, the envelope lost its reference. It needs a write and no embedding.
    const index = InMemoryCosineIndex.create().orThrow();
    let embedCalls: number = 0;
    const counting = (): Promise<Result<Float32Array | undefined>> => {
      embedCalls += 1;
      return okEmbed();
    };
    const root = mutableRoot();
    const store = FileTreeMemoryStore.create({
      root,
      registry: registry(),
      codecs: codecs(),
      vectorIndex: index,
      embed: counting
    }).orThrow();
    (await store.put(record('a'))).orThrow();
    const afterWrites: number = embedCalls;

    // Strip the reference from the file, leaving the vector in place.
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
    const raw: string = file.getRawContents().orThrow();
    file.setRawContents(raw.replace(/^embeddingRef:.*\n/m, '')).orThrow();

    const reopened = FileTreeMemoryStore.create({
      root,
      registry: registry(),
      codecs: codecs(),
      vectorIndex: index,
      embed: counting
    }).orThrow();

    expect(await reopened.reconcile(knowledgeKind, 'record-vector')).toSucceedAndSatisfy(
      (r: ReconcileReport) => {
        const report = r as IVectorReconcileReport;
        expect(report.restamped).toBe(1);
        expect(report.repaired).toBe(0);
      }
    );
    expect(embedCalls).toBe(afterWrites);
  });

  test('treats embeddingRef: null as missing and restamps it', async () => {
    // `embeddingRef` is `string | null | undefined`, and `null` is the DOCUMENTED
    // "not embedded" sentinel — so `=== undefined` misses it and the record is
    // reported as already indexed while its envelope claims no embedding. Not a
    // type error, and invisible to a coverage gate, because the sentinel is a
    // VALUE rather than a branch. Both this and the coverage sibling shipped
    // before `embeddingRefOf` existed.
    const index = InMemoryCosineIndex.create().orThrow();
    let embedCalls: number = 0;
    const counting = (): Promise<Result<Float32Array | undefined>> => {
      embedCalls += 1;
      return okEmbed();
    };
    const root = mutableRoot();
    const store = FileTreeMemoryStore.create({
      root,
      registry: registry(),
      codecs: codecs(),
      vectorIndex: index,
      embed: counting
    }).orThrow();
    (await store.put(record('a'))).orThrow();
    const afterWrites: number = embedCalls;

    // Rewrite the reference to the explicit null sentinel, leaving the vector.
    const file = onlyRecordFile(root);
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
      vectorIndex: index,
      embed: counting
    }).orThrow();

    expect(await reopened.reconcile(knowledgeKind, 'record-vector')).toSucceedAndSatisfy(
      (r: ReconcileReport) => {
        const report = r as IVectorReconcileReport;
        // Restamped, NOT alreadyIndexed: a null reference is a missing one.
        expect(report.restamped).toBe(1);
        expect(report.alreadyIndexed).toBe(0);
      }
    );
    // Still no embedder call — the vector was there all along.
    expect(embedCalls).toBe(afterWrites);
  });

  test('returns a Failure when a consumer embedder THROWS rather than failing', async () => {
    // Every hook the repair path calls is consumer-supplied. Unwrapped, a throw
    // escapes as a rejected promise out of `IMemoryStore.reconcile` and the
    // Result contract is broken at the public boundary. The write path had always
    // captured these; the repair path called the same hooks bare.
    const index = InMemoryCosineIndex.create().orThrow();
    const store = FileTreeMemoryStore.create({
      root: mutableRoot(),
      registry: registry(),
      codecs: codecs(),
      vectorIndex: index,
      embed: okEmbed
    }).orThrow();
    (await store.put(record('a'))).orThrow();
    (await index.remove({ scope: knowledgeScope, id: 'a' as MemoryId })).orThrow();

    const throwing = FileTreeMemoryStore.create({
      root: mutableRoot(),
      registry: registry(),
      codecs: codecs(),
      vectorIndex: InMemoryCosineIndex.create().orThrow(),
      embed: () => {
        throw new Error('embedder exploded');
      }
    }).orThrow();
    (await throwing.put(record('a'))).orThrow();

    // The whole call resolves rather than rejecting, and the throw is reported
    // per-record like any other fault.
    expect(await throwing.reconcile(knowledgeKind, 'record-vector')).toSucceedAndSatisfy(
      (r: ReconcileReport) => {
        const report = r as IVectorReconcileReport;
        expect(report.failed).toHaveLength(1);
        expect(report.failed[0].error).toMatch(/threw.*embedder exploded/i);
        expect(report.repaired).toBe(0);
      }
    );
  });

  test('counts a decline rather than treating it as a gap or a fault', async () => {
    const index = InMemoryCosineIndex.create().orThrow();
    const store = FileTreeMemoryStore.create({
      root: mutableRoot(),
      registry: registry(),
      codecs: codecs(),
      vectorIndex: index,
      embed: () => Promise.resolve(succeed(undefined))
    }).orThrow();
    (await store.put(record('a'))).orThrow();

    expect(await store.reconcile(knowledgeKind, 'record-vector')).toSucceedAndSatisfy(
      (r: ReconcileReport) => {
        const report = r as IVectorReconcileReport;
        expect(report.declined).toBe(1);
        expect(report.repaired).toBe(0);
        expect(report.failed).toHaveLength(0);
      }
    );
  });

  test('collects per-record failures rather than abandoning the rest of the gap', async () => {
    // A repair that stops at the first bad record leaves the rest open, which is
    // the opposite of what the caller asked for.
    const index = InMemoryCosineIndex.create().orThrow();
    let calls: number = 0;
    const flaky = (): Promise<Result<Float32Array | undefined>> => {
      calls += 1;
      return calls === 1 ? Promise.resolve(fail('no model')) : okEmbed();
    };
    const store = FileTreeMemoryStore.create({
      root: mutableRoot(),
      registry: registry(),
      codecs: codecs(),
      vectorIndex: index
    }).orThrow();
    (await store.put(record('a'))).orThrow();
    (await store.put(record('b'))).orThrow();

    const wired = FileTreeMemoryStore.create({
      root: (store as unknown as { _root: FileTree.IMutableFileTreeDirectoryItem })._root,
      registry: registry(),
      codecs: codecs(),
      vectorIndex: index,
      embed: flaky
    }).orThrow();

    expect(await wired.reconcile(knowledgeKind, 'record-vector')).toSucceedAndSatisfy(
      (r: ReconcileReport) => {
        const report = r as IVectorReconcileReport;
        expect(report.failed).toHaveLength(1);
        expect(report.failed[0].error).toMatch(/no model/i);
        expect(report.repaired).toBe(1);
      }
    );
  });

  test('refuses a kind excluded from the record index, rather than reporting a healthy zero', async () => {
    const store = FileTreeMemoryStore.create({
      root: mutableRoot(),
      registry: registry(),
      codecs: codecs(),
      vectorIndex: InMemoryCosineIndex.create().orThrow(),
      embed: okEmbed,
      embedKinds: new Set<Kind>([knowledgeKind])
    }).orThrow();
    (await store.put(record('n', noteKind))).orThrow();

    expect(await store.reconcile(noteKind, 'record-vector')).toFailWith(
      /excluded from the record vector index/i
    );
  });

  test('refuses when the lane is not wired', async () => {
    const store = FileTreeMemoryStore.create({
      root: mutableRoot(),
      registry: registry(),
      codecs: codecs()
    }).orThrow();
    expect(await store.reconcile(knowledgeKind, 'record-vector')).toFailWith(/lane is not fully wired/i);
    expect(await store.reconcile(knowledgeKind, 'fragment-vector')).toFailWith(/lane is not fully wired/i);
  });

  test('refuses a HALF-wired lane rather than failing every record', async () => {
    // An index with no embedder is a legal store — queries work, writes simply do
    // not embed. Reconciling it used to report a cheerful success with every
    // record in `failed`; a wiring mistake should say it is one.
    const store = FileTreeMemoryStore.create({
      root: mutableRoot(),
      registry: registry(),
      codecs: codecs(),
      vectorIndex: InMemoryCosineIndex.create().orThrow()
    }).orThrow();
    (await store.put(record('a'))).orThrow();
    expect(await store.reconcile(knowledgeKind, 'record-vector')).toFailWith(
      /not fully wired.*index: present.*embedder: absent/i
    );

    // The mirror case on the fragment lane: an embedder with no index.
    const halfFragment = FileTreeMemoryStore.create({
      root: mutableRoot(),
      registry: registry(),
      codecs: codecs(),
      fragmentEmbedder: okFragments
    }).orThrow();
    expect(await halfFragment.reconcile(knowledgeKind, 'fragment-vector')).toFailWith(
      /not fully wired.*index: absent.*embedder: present/i
    );
  });
});

describe('IMemoryStore.reconcile — every casualty is collected, never fatal', () => {
  /** An index that fails the membership check. */
  function failingHas(): InMemoryCosineIndex {
    const index = InMemoryCosineIndex.create().orThrow();
    (index as unknown as { has: () => Promise<Result<boolean>> }).has = () =>
      Promise.resolve(fail('connection reset'));
    return index;
  }

  test('a failed membership check costs that record, not the call', async () => {
    const store = FileTreeMemoryStore.create({
      root: mutableRoot(),
      registry: registry(),
      codecs: codecs(),
      vectorIndex: failingHas(),
      embed: okEmbed
    }).orThrow();
    (await store.put(record('a'))).orThrow();

    expect(await store.reconcile(knowledgeKind, 'record-vector')).toSucceedAndSatisfy(
      (r: ReconcileReport) => {
        expect(r.failed).toHaveLength(1);
        expect(r.failed[0].error).toMatch(/membership check failed.*connection reset/i);
      }
    );
  });

  test('a record the index claims but the vault no longer holds is a casualty', async () => {
    const index = InMemoryCosineIndex.create().orThrow();
    const root = mutableRoot();
    const store = FileTreeMemoryStore.create({
      root,
      registry: registry(),
      codecs: codecs(),
      vectorIndex: index,
      embed: okEmbed
    }).orThrow();
    (await store.put(record('a'))).orThrow();
    (await index.remove({ scope: knowledgeScope, id: 'a' as MemoryId })).orThrow();

    const scopeDir = root
      .getChildren()
      .orThrow()
      .find((c): c is FileTree.IFileTreeDirectoryItem => c.type === 'directory');
    for (const child of scopeDir?.getChildren().orThrow() ?? []) {
      if (child.type === 'file' && FileTree.isMutableFileItem(child)) {
        child.delete().orThrow();
      }
    }

    expect(await store.reconcile(knowledgeKind, 'record-vector')).toSucceedAndSatisfy(
      (r: ReconcileReport) => {
        expect(r.failed).toHaveLength(1);
        expect(r.failed[0].error).toMatch(/index claims this record but the vault has no such file/i);
      }
    );
  });

  test('a corrupt file makes both the read and the restamp a casualty, not a crash', async () => {
    // Covers the two write-side failure paths: stamping a fresh reference, and
    // restamping a lost one — both go through the same envelope rewrite.
    const index = InMemoryCosineIndex.create().orThrow();
    const root = mutableRoot();
    const store = FileTreeMemoryStore.create({
      root,
      registry: registry(),
      codecs: codecs(),
      vectorIndex: index,
      embed: okEmbed
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

    // (a) index holds the vector, envelope has no ref, file is unreadable → the
    // restamp fails and is collected.
    const raw: string = file.getRawContents().orThrow();
    file.setRawContents(raw.replace(/^embeddingRef:.*\n/m, '')).orThrow();
    const reopened = FileTreeMemoryStore.create({
      root,
      registry: registry(),
      codecs: codecs(),
      vectorIndex: index,
      embed: okEmbed
    }).orThrow();
    file.setRawContents('no frontmatter here').orThrow();
    expect(await reopened.reconcile(knowledgeKind, 'record-vector')).toSucceedAndSatisfy(
      (r: ReconcileReport) => {
        expect(r.failed).toHaveLength(1);
        expect(r.failed[0].error).toMatch(/restamping the embedding reference failed/i);
      }
    );

    // (b) index does NOT hold it, so the record is read, embedded, and the stamp
    // fails on the same corrupt file.
    (await index.remove({ scope: knowledgeScope, id: 'a' as MemoryId })).orThrow();
    expect(await reopened.reconcile(knowledgeKind, 'record-vector')).toSucceedAndSatisfy(
      (r: ReconcileReport) => {
        expect(r.failed).toHaveLength(1);
        expect(r.failed[0].error).toMatch(
          /reading the record failed|stamping the embedding reference failed/i
        );
      }
    );
  });
});

describe('IMemoryStore.reconcile — fragment-vector', () => {
  test('repairs the missing records and reports the fan-out', async () => {
    const index = InMemoryFragmentCosineIndex.create().orThrow();
    const store = FileTreeMemoryStore.create({
      root: mutableRoot(),
      registry: registry(),
      codecs: codecs(),
      fragmentIndex: index,
      fragmentEmbedder: okFragments
    }).orThrow();
    (await store.put(record('a'))).orThrow();
    (await store.put(record('b'))).orThrow();
    (await index.remove({ scope: knowledgeScope, id: 'b' as MemoryId })).orThrow();

    expect(await store.reconcile(knowledgeKind, 'fragment-vector')).toSucceedAndSatisfy(
      (r: ReconcileReport) => {
        const report = r as IFragmentReconcileReport;
        expect(report.artifact).toBe('fragment-vector');
        expect(report.alreadyIndexed).toBe(1);
        expect(report.repaired).toBe(1);
        expect(report.fragments).toBe(1);
      }
    );
  });

  test('a fragment embedder failure is collected per record, not fatal', async () => {
    const index = InMemoryFragmentCosineIndex.create().orThrow();
    const root = mutableRoot();
    const store = FileTreeMemoryStore.create({
      root,
      registry: registry(),
      codecs: codecs(),
      fragmentIndex: index,
      fragmentEmbedder: okFragments
    }).orThrow();
    (await store.put(record('a'))).orThrow();
    (await index.remove({ scope: knowledgeScope, id: 'a' as MemoryId })).orThrow();

    const failing = FileTreeMemoryStore.create({
      root,
      registry: registry(),
      codecs: codecs(),
      fragmentIndex: index,
      fragmentEmbedder: () => Promise.resolve(fail('segmenter down'))
    }).orThrow();

    expect(await failing.reconcile(knowledgeKind, 'fragment-vector')).toSucceedAndSatisfy(
      (r: ReconcileReport) => {
        expect(r.failed).toHaveLength(1);
        expect(r.failed[0].error).toMatch(/segmenter down/i);
        expect(r.repaired).toBe(0);
      }
    );
  });

  test("an empty fragment array is this lane's decline", async () => {
    const store = FileTreeMemoryStore.create({
      root: mutableRoot(),
      registry: registry(),
      codecs: codecs(),
      fragmentIndex: InMemoryFragmentCosineIndex.create().orThrow(),
      fragmentEmbedder: () => Promise.resolve(succeed([]))
    }).orThrow();
    (await store.put(record('a'))).orThrow();

    expect(await store.reconcile(knowledgeKind, 'fragment-vector')).toSucceedAndSatisfy(
      (r: ReconcileReport) => {
        const report = r as IFragmentReconcileReport;
        expect(report.declined).toBe(1);
        expect(report.repaired).toBe(0);
      }
    );
  });
});

describe('reconcileVectors — the injected stamp seam', () => {
  test('a failed reference stamp after a successful embed is a casualty', async () => {
    // Reached directly rather than through the store: the stamp is an injected
    // seam, and the store's own file paths fail EARLIER than this line (the read
    // rejects a corrupt file before the write is attempted), so the only honest
    // way to exercise it is at the seam it is injected through.
    const index = InMemoryCosineIndex.create().orThrow();
    const maintenance = new VectorMaintenance({
      vectorIndex: index,
      embed: okEmbed,
      embedsKind: () => true,
      warn: () => undefined
    });
    const rec = record('a');
    const result = await reconcileVectors({
      kind: knowledgeKind,
      artifact: 'record-vector',
      targets: [{ scope: knowledgeScope, envelope: rec.envelope }],
      maintenance,
      embedsKind: () => true,
      resolve: () => succeed(rec),
      stampRef: () => fail('disk full')
    });
    expect(result).toSucceedAndSatisfy((r: ReconcileReport) => {
      expect(r.failed).toHaveLength(1);
      expect(r.failed[0].error).toMatch(/stamping the embedding reference failed.*disk full/i);
      expect(r.repaired).toBe(0);
    });
  });
});

describe('VectorMaintenance repair entry points guard their own wiring', () => {
  // Reachable only by calling them directly — `reconcile` checks first. They are
  // still guards rather than c8-ignored defensive code, because they are
  // package-internal entry points a future caller could reach without the check.
  const bare = new VectorMaintenance({ embedsKind: () => true, warn: () => undefined });
  const t = { scope: knowledgeScope, id: 'a' as MemoryId };

  test('reembedRecord refuses an unwired record lane', async () => {
    expect(await bare.reembedRecord(record('a'), t)).toFailWith(/record-vector lane is not wired/i);
  });

  test('reembedFragments refuses an unwired fragment lane', async () => {
    expect(await bare.reembedFragments(record('a'), t)).toFailWith(/fragment lane is not wired/i);
  });
});
