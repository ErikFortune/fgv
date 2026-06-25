/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { Converter, Converters, Result, fail, succeed } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
import {
  AdmissionDecision,
  BodyConverterRegistry,
  Convert,
  EntityId,
  FileTreeMemoryStore,
  IBodyConverterRegistry,
  IIdentityCodec,
  IIdentityCodecResult,
  IMemoryRecord,
  IWritePolicy,
  Kind,
  KnowledgeIdentityCodec,
  LtmIdentityCodec,
  MemoryCapCullPolicy,
  MemoryId,
  MemoryScopeKey,
  MtmIdentityCodec,
  Tag,
  envelopeConverter,
  joinFrontmatter
} from '../../../index';

const knowledgeKind: Kind = 'knowledge' as Kind;

interface IRecordSpec {
  readonly id: string;
  readonly entityId?: string;
  readonly kind?: string;
  readonly body?: unknown;
  readonly tags?: ReadonlyArray<string>;
  readonly links?: ReadonlyArray<{ type: string; target: string }>;
}

/** Build a record whose envelope fields are validated through the B0 converter. */
function makeRecord(spec: IRecordSpec): IMemoryRecord<unknown> {
  return {
    envelope: envelopeConverter
      .convert({
        id: spec.id,
        entityId: spec.entityId ?? spec.id,
        kind: spec.kind ?? 'knowledge',
        tags: spec.tags ?? [],
        links: spec.links ?? [],
        created: 0,
        updated: 0,
        seq: 0,
        contentHash: '',
        provenance: { source: 'agent' }
      })
      .orThrow(),
    body: spec.body ?? `body for ${spec.id}`
  };
}

/** A mutable in-memory root, optionally seeded with raw files. */
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

function knowledgeRegistry(bodyConverter: Converter<string> = Converters.string): IBodyConverterRegistry {
  const registry = BodyConverterRegistry.create().orThrow();
  registry.register(knowledgeKind, bodyConverter);
  return registry;
}

const knowledgeCodecs: ReadonlyMap<Kind, IIdentityCodec> = new Map<Kind, IIdentityCodec>([
  [knowledgeKind, new KnowledgeIdentityCodec()]
]);

/** A serialized knowledge file for seeding a vault. */
function knowledgeFile(id: string, body: string, overrides: Record<string, unknown> = {}): string {
  const envelope = {
    id,
    entityId: id,
    kind: 'knowledge',
    tags: [],
    links: [],
    created: 1,
    updated: 1,
    seq: 5,
    contentHash: 'seed',
    provenance: { source: 'agent' },
    ...overrides
  };
  const frontmatter = Object.entries(envelope)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join('\n');
  return joinFrontmatter(frontmatter, body);
}

describe('FileTreeMemoryStore', () => {
  let clockValue: number;
  const clock = (): number => clockValue;

  function createStore(
    params: {
      root?: FileTree.IMutableFileTreeDirectoryItem;
      registry?: IBodyConverterRegistry;
      codecs?: ReadonlyMap<Kind, IIdentityCodec>;
      defaultCodec?: IIdentityCodec;
      writePolicies?: ReadonlyMap<Kind, IWritePolicy>;
    } = {}
  ): Result<FileTreeMemoryStore> {
    return FileTreeMemoryStore.create({
      root: params.root ?? mutableRoot(),
      registry: params.registry ?? knowledgeRegistry(),
      codecs: params.codecs ?? knowledgeCodecs,
      defaultCodec: params.defaultCodec,
      writePolicies: params.writePolicies,
      clock
    });
  }

  beforeEach(() => {
    clockValue = 1000;
  });

  describe('create', () => {
    test('starts from an empty vault', async () => {
      const store = createStore().orThrow();
      expect(await store.list()).toSucceedWith([]);
    });

    test('indexes a pre-existing vault and resumes seq past the highest persisted seq', async () => {
      const root = mutableRoot([
        { path: 'knowledge/doc-a.md', contents: knowledgeFile('doc-a', 'A', { seq: 7 }) },
        { path: 'knowledge/doc-b.md', contents: knowledgeFile('doc-b', 'B', { seq: 3 }) },
        { path: 'knowledge/notes.txt', contents: 'not a record' },
        { path: 'top-level.md', contents: 'ignored at root' }
      ]);
      const store = createStore({ root }).orThrow();
      expect(await store.list()).toSucceedAndSatisfy((listed: ReadonlyArray<IMemoryRecord<unknown>>) => {
        expect(listed.map((r) => r.envelope.id).sort()).toEqual(['doc-a', 'doc-b']);
      });
      // The next put must get seq 8 (highest persisted was 7).
      expect(await store.put(makeRecord({ id: 'doc-c' }))).toSucceedAndSatisfy(
        (put: IMemoryRecord<unknown>) => {
          expect(put.envelope.seq).toBe(8);
        }
      );
    });

    test('fails loudly when a seeded file id does not match its filename', () => {
      const root = mutableRoot([{ path: 'knowledge/real.md', contents: knowledgeFile('wrong', 'body') }]);
      expect(createStore({ root })).toFailWith(/does not match filename stem/i);
    });

    test('fails loudly when a seeded file violates the codec round-trip (wrong scope)', () => {
      const root = mutableRoot([{ path: 'elsewhere/doc.md', contents: knowledgeFile('doc', 'body') }]);
      expect(createStore({ root })).toFailWith(/does not match expected scope/i);
    });
  });

  describe('factory defaults', () => {
    test('falls back to default codecs/policies/scope-encoding/clock when omitted', async () => {
      const store = FileTreeMemoryStore.create({
        root: mutableRoot(),
        registry: knowledgeRegistry(),
        defaultCodec: new KnowledgeIdentityCodec()
      }).orThrow();
      expect(await store.put(makeRecord({ id: 'x', body: 'y' }))).toSucceedAndSatisfy(
        (record: IMemoryRecord<unknown>) => {
          expect(record.envelope.id).toBe('x');
          // The default clock (Date.now) stamps a real epoch.
          expect(record.envelope.created).toBeGreaterThan(0);
        }
      );
    });

    test('uses a custom scope encoding when provided', async () => {
      const store = FileTreeMemoryStore.create({
        root: mutableRoot(),
        registry: knowledgeRegistry(),
        codecs: knowledgeCodecs,
        scopeEncoding: (scope) => succeed(scope as string),
        clock
      }).orThrow();
      await store.put(makeRecord({ id: 'x', body: 'y' }));
      expect(await store.get(knowledgeKind, 'x' as EntityId)).toSucceedAndSatisfy(
        (record: IMemoryRecord<unknown> | undefined) => {
          expect(record?.body).toBe('y');
        }
      );
    });
  });

  describe('put / get round-trip', () => {
    test('first write stamps created/updated/seq/contentHash and is retrievable', async () => {
      const store = createStore().orThrow();
      expect(await store.put(makeRecord({ id: 'intro', body: 'hello' }))).toSucceedAndSatisfy(
        (put: IMemoryRecord<unknown>) => {
          expect(put.envelope.created).toBe(1000);
          expect(put.envelope.updated).toBe(1000);
          expect(put.envelope.seq).toBe(1);
          expect(put.envelope.contentHash).not.toBe('');
        }
      );

      expect(await store.get(knowledgeKind, 'intro' as EntityId)).toSucceedAndSatisfy(
        (record: IMemoryRecord<unknown> | undefined) => {
          expect(record?.body).toBe('hello');
          expect(record?.envelope.id).toBe('intro');
        }
      );
    });

    test('get returns undefined for a missing entity', async () => {
      const store = createStore().orThrow();
      expect(await store.get(knowledgeKind, 'absent' as EntityId)).toSucceedWith(undefined);
    });

    test('getById reads a record directly by scope and id', async () => {
      const store = createStore().orThrow();
      await store.put(makeRecord({ id: 'direct', body: 'x' }));
      expect(await store.getById('knowledge' as MemoryScopeKey, 'direct' as MemoryId)).toSucceedAndSatisfy(
        (record: IMemoryRecord<unknown> | undefined) => {
          expect(record?.body).toBe('x');
        }
      );
    });

    test('rejects a non-string body', async () => {
      const store = createStore().orThrow();
      expect(await store.put(makeRecord({ id: 'obj', body: { a: 1 } }))).toFailWith(
        /only string .* bodies are supported/i
      );
    });

    test('rejects a body the registered converter refuses', async () => {
      const strict: Converter<string> = Converters.string.map((s) =>
        s === 'ok' ? succeed(s) : fail('must be ok')
      );
      const store = createStore({ registry: knowledgeRegistry(strict) }).orThrow();
      expect(await store.put(makeRecord({ id: 'bad', body: 'nope' }))).toFailWith(
        /invalid body.*must be ok/i
      );
    });

    test('fails when no codec is registered for the kind', async () => {
      const registry = BodyConverterRegistry.create().orThrow();
      registry.register('other' as Kind, Converters.string);
      const store = createStore({ registry }).orThrow();
      expect(await store.put(makeRecord({ id: 'x', kind: 'other' }))).toFailWith(
        /no identity codec registered/i
      );
    });
  });

  describe('content-hash dedup', () => {
    test('an identical re-put is a no-op that returns the existing record', async () => {
      const store = createStore().orThrow();
      let firstSeq: number = -1;
      let firstUpdated: number = -1;
      expect(await store.put(makeRecord({ id: 'doc', body: 'same' }))).toSucceedAndSatisfy(
        (first: IMemoryRecord<unknown>) => {
          firstSeq = first.envelope.seq;
          firstUpdated = first.envelope.updated;
        }
      );
      expect(await store.put(makeRecord({ id: 'doc', body: 'same' }))).toSucceedAndSatisfy(
        (second: IMemoryRecord<unknown>) => {
          expect(second.envelope.seq).toBe(firstSeq);
          expect(second.envelope.updated).toBe(firstUpdated);
        }
      );
    });

    test('dedup is scope-wide: a different entity with identical content collapses', async () => {
      const store = createStore().orThrow();
      let firstId: string = '';
      expect(await store.put(makeRecord({ id: 'doc-a', body: 'identical' }))).toSucceedAndSatisfy(
        (first: IMemoryRecord<unknown>) => {
          firstId = first.envelope.id as string;
        }
      );
      expect(await store.put(makeRecord({ id: 'doc-b', body: 'identical' }))).toSucceedAndSatisfy(
        (second: IMemoryRecord<unknown>) => {
          expect(second.envelope.id).toBe(firstId);
        }
      );
      // doc-b was never written.
      expect(await store.get(knowledgeKind, 'doc-b' as EntityId)).toSucceedWith(undefined);
    });
  });

  describe('last-write-wins update', () => {
    test('updates mutable fields via applyUpdate, preserving created and bumping seq/updated', async () => {
      const store = createStore().orThrow();
      let firstCreated: number = -1;
      let firstSeq: number = -1;
      expect(await store.put(makeRecord({ id: 'doc', body: 'v1', tags: ['a'] }))).toSucceedAndSatisfy(
        (first: IMemoryRecord<unknown>) => {
          firstCreated = first.envelope.created;
          firstSeq = first.envelope.seq;
        }
      );
      clockValue = 2000;
      expect(await store.put(makeRecord({ id: 'doc', body: 'v2', tags: ['b', 'c'] }))).toSucceedAndSatisfy(
        (second: IMemoryRecord<unknown>) => {
          expect(second.envelope.created).toBe(firstCreated);
          expect(second.envelope.updated).toBe(2000);
          expect(second.envelope.seq).toBe(firstSeq + 1);
          expect(second.body).toBe('v2');
          expect(second.envelope.tags).toEqual(['b', 'c']);
        }
      );

      expect(await store.list({ tag: 'a' as Tag })).toSucceedWith([]);
    });

    test('surfaces a policy applyUpdate failure with context', async () => {
      const failingPolicy: IWritePolicy = {
        mutableFields: ['body'],
        admit: (): Result<AdmissionDecision> => succeed({ decision: 'accept' }),
        applyUpdate: (): Result<IMemoryRecord<unknown>> => fail('patch blew up')
      };
      const store = createStore({
        writePolicies: new Map<Kind, IWritePolicy>([[knowledgeKind, failingPolicy]])
      }).orThrow();
      await store.put(makeRecord({ id: 'doc', body: 'v1' }));
      expect(await store.put(makeRecord({ id: 'doc', body: 'v2' }))).toFailWith(
        /update failed: patch blew up/i
      );
    });

    test('persists the policy-updated body and fails loudly if it is not a string', async () => {
      // A policy whose applyUpdate swaps in a non-string body must be rejected at
      // serialization time, not silently persist the incoming string.
      const nonStringBodyPolicy: IWritePolicy = {
        mutableFields: ['body'],
        admit: (): Result<AdmissionDecision> => succeed({ decision: 'accept' }),
        applyUpdate: (existing): Result<IMemoryRecord<unknown>> =>
          succeed({ envelope: existing.envelope, body: { not: 'a string' } })
      };
      const store = createStore({
        writePolicies: new Map<Kind, IWritePolicy>([[knowledgeKind, nonStringBodyPolicy]])
      }).orThrow();
      await store.put(makeRecord({ id: 'doc', body: 'v1' }));
      expect(await store.put(makeRecord({ id: 'doc', body: 'v2' }))).toFailWith(
        /policy returned a non-string body/i
      );
    });
  });

  describe('admission policy', () => {
    test("a 'reject' decision fails the put with the reason", async () => {
      const rejectPolicy: IWritePolicy = {
        mutableFields: [],
        admit: (): Result<AdmissionDecision> => succeed({ decision: 'reject', reason: 'over quota' }),
        applyUpdate: (r): Result<IMemoryRecord<unknown>> => succeed(r)
      };
      const store = createStore({
        writePolicies: new Map<Kind, IWritePolicy>([[knowledgeKind, rejectPolicy]])
      }).orThrow();
      expect(await store.put(makeRecord({ id: 'doc' }))).toFailWith(/rejected by policy: over quota/i);
    });

    test("a 'cull-oldest' decision evicts the named records before writing", async () => {
      let putCount = 0;
      const cullPolicy: IWritePolicy = {
        mutableFields: ['body'],
        admit: (): Result<AdmissionDecision> => {
          putCount += 1;
          // First put admits; the second evicts the first.
          return putCount === 1
            ? succeed({ decision: 'accept' })
            : succeed({ decision: 'cull-oldest', evict: ['old' as MemoryId] });
        },
        applyUpdate: (r): Result<IMemoryRecord<unknown>> => succeed(r)
      };
      const store = createStore({
        writePolicies: new Map<Kind, IWritePolicy>([[knowledgeKind, cullPolicy]])
      }).orThrow();
      await store.put(makeRecord({ id: 'old', body: 'old' }));
      expect(await store.put(makeRecord({ id: 'new', body: 'new' }))).toSucceedAndSatisfy(
        (put: IMemoryRecord<unknown>) => {
          expect(put.envelope.id).toBe('new');
        }
      );
      expect(await store.get(knowledgeKind, 'old' as EntityId)).toSucceedWith(undefined);
    });

    test("a 'cull-oldest' decision fails when an evicted record is missing", async () => {
      const cullPolicy: IWritePolicy = {
        mutableFields: ['body'],
        admit: (): Result<AdmissionDecision> =>
          succeed({ decision: 'cull-oldest', evict: ['ghost' as MemoryId] }),
        applyUpdate: (r): Result<IMemoryRecord<unknown>> => succeed(r)
      };
      const store = createStore({
        writePolicies: new Map<Kind, IWritePolicy>([[knowledgeKind, cullPolicy]])
      }).orThrow();
      expect(await store.put(makeRecord({ id: 'new', body: 'new' }))).toFailWith(
        /cannot evict 'ghost'.*not found/i
      );
    });
  });

  describe('list', () => {
    test('filters by scope, kind, and tag', async () => {
      const store = createStore().orThrow();
      await store.put(makeRecord({ id: 'a', body: 'a', tags: ['t1'] }));
      await store.put(makeRecord({ id: 'b', body: 'b', tags: ['t2'] }));

      expect(await store.list()).toSucceedAndSatisfy((r) => expect(r).toHaveLength(2));
      expect(await store.list({ scope: 'knowledge' as MemoryScopeKey })).toSucceedAndSatisfy((r) =>
        expect(r).toHaveLength(2)
      );
      expect(await store.list({ scope: 'other' as MemoryScopeKey })).toSucceedAndSatisfy((r) =>
        expect(r).toHaveLength(0)
      );
      expect(await store.list({ kind: knowledgeKind })).toSucceedAndSatisfy((r) => expect(r).toHaveLength(2));
      expect(await store.list({ kind: 'missing' as Kind })).toSucceedAndSatisfy((r) =>
        expect(r).toHaveLength(0)
      );

      expect(await store.list({ tag: 't1' as Tag })).toSucceedAndSatisfy(
        (byTag: ReadonlyArray<IMemoryRecord<unknown>>) => {
          expect(byTag).toHaveLength(1);
          expect(byTag[0].envelope.id).toBe('a');
        }
      );
    });
  });

  describe('delete', () => {
    test('removes a record and returns its id', async () => {
      const store = createStore().orThrow();
      await store.put(makeRecord({ id: 'doomed', body: 'x' }));
      expect(await store.delete(knowledgeKind, 'doomed' as EntityId)).toSucceedWith('doomed' as MemoryId);
      expect(await store.get(knowledgeKind, 'doomed' as EntityId)).toSucceedWith(undefined);
      expect(await store.list()).toSucceedAndSatisfy((r) => expect(r).toHaveLength(0));
    });

    test('fails when the record does not exist', async () => {
      const store = createStore().orThrow();
      expect(await store.delete(knowledgeKind, 'nope' as EntityId)).toFailWith(/no record found/i);
    });
  });

  describe('write-lock serialization', () => {
    test('concurrent puts all land with monotonic seq', async () => {
      const store = createStore().orThrow();
      const results = await Promise.all([
        store.put(makeRecord({ id: 'p1', body: '1' })),
        store.put(makeRecord({ id: 'p2', body: '2' })),
        store.put(makeRecord({ id: 'p3', body: '3' }))
      ]);
      const seqs: number[] = results.map((r) => {
        let seq: number = -1;
        expect(r).toSucceedAndSatisfy((rec: IMemoryRecord<unknown>) => {
          seq = rec.envelope.seq;
        });
        return seq;
      });
      expect([...seqs].sort((a, b) => a - b)).toEqual([1, 2, 3]);
      expect(await store.list()).toSucceedAndSatisfy((r) => expect(r).toHaveLength(3));
    });
  });

  describe('multi-segment scope codec', () => {
    const turnKind: Kind = 'turn' as Kind;

    /** Maps `<conv>:<turn>` ⇄ scope `conversations/<conv>`, stem `turn-<n>`. */
    const turnCodec: IIdentityCodec = {
      encode: (entityId: EntityId): Result<IIdentityCodecResult> => {
        const [conv, turn] = (entityId as string).split(':');
        return succeed({
          scope: `conversations/${conv}` as MemoryScopeKey,
          idStem: `turn-${turn}`,
          isVersioned: false
        });
      },
      decode: (scope: MemoryScopeKey, stem: string): Result<EntityId> => {
        const conv = (scope as string).split('/')[1];
        const turn = stem.replace('turn-', '');
        return Convert.entityId.convert(`${conv}:${turn}`);
      },
      verifyRoundTrip: (): Result<true> => succeed(true)
    };

    function turnStore(): FileTreeMemoryStore {
      const registry = BodyConverterRegistry.create().orThrow();
      registry.register(turnKind, Converters.string);
      return FileTreeMemoryStore.create({
        root: mutableRoot(),
        registry,
        codecs: new Map<Kind, IIdentityCodec>([[turnKind, turnCodec]]),
        clock
      }).orThrow();
    }

    test('writes and reads through a nested scope directory', async () => {
      const store = turnStore();
      await store.put(makeRecord({ id: 'turn-0', entityId: 'c1:0', kind: 'turn', body: 'first turn' }));
      expect(await store.get(turnKind, 'c1:0' as EntityId)).toSucceedAndSatisfy(
        (record: IMemoryRecord<unknown> | undefined) => {
          expect(record?.body).toBe('first turn');
          expect(record?.envelope.id).toBe('turn-0');
        }
      );
      expect((await store.list({ scope: 'conversations/c1' as MemoryScopeKey })).orThrow()).toHaveLength(1);
    });

    test('fails when the envelope id does not match the codec-derived stem', async () => {
      const store = turnStore();
      // id 'turn-9' but codec maps c1:0 → stem 'turn-0'.
      expect(
        await store.put(makeRecord({ id: 'turn-9', entityId: 'c1:0', kind: 'turn', body: 'x' }))
      ).toFailWith(/does not match codec-derived stem/i);
    });
  });

  describe('versioned codec (loud degradation)', () => {
    const versionedKind: Kind = 'versioned' as Kind;
    const versionedCodec: IIdentityCodec = {
      encode: (entityId: EntityId): Result<IIdentityCodecResult> =>
        succeed({ scope: 'versioned' as MemoryScopeKey, idStem: entityId as string, isVersioned: true }),
      decode: (__scope: MemoryScopeKey, stem: string): Result<EntityId> => Convert.entityId.convert(stem),
      verifyRoundTrip: (): Result<true> => succeed(true)
    };

    function versionedStore(): FileTreeMemoryStore {
      const registry = BodyConverterRegistry.create().orThrow();
      registry.register(versionedKind, Converters.string);
      return FileTreeMemoryStore.create({
        root: mutableRoot(),
        registry,
        codecs: new Map<Kind, IIdentityCodec>([[versionedKind, versionedCodec]]),
        clock
      }).orThrow();
    }

    test('put fails loudly on a versioned layout', async () => {
      expect(await versionedStore().put(makeRecord({ id: 'v', kind: 'versioned', body: 'x' }))).toFailWith(
        /versioned\/temporal layout not yet supported/i
      );
    });

    test('get fails loudly on a versioned layout', async () => {
      expect(await versionedStore().get(versionedKind, 'v' as EntityId)).toFailWith(
        /versioned\/temporal layout not yet supported/i
      );
    });

    test('delete fails loudly on a versioned layout', async () => {
      expect(await versionedStore().delete(versionedKind, 'v' as EntityId)).toFailWith(
        /versioned\/temporal layout not yet supported/i
      );
    });
  });

  describe('default codec', () => {
    test('a kind without an explicit codec entry uses the default codec', async () => {
      const store = FileTreeMemoryStore.create({
        root: mutableRoot(),
        registry: knowledgeRegistry(),
        codecs: new Map<Kind, IIdentityCodec>(),
        defaultCodec: new KnowledgeIdentityCodec(),
        clock
      }).orThrow();
      const put = (await store.put(makeRecord({ id: 'fallback', body: 'x' }))).orThrow();
      expect(put.envelope.id).toBe('fallback');
    });
  });

  describe('experience (memory) kinds — Phase C', () => {
    const ltmKind: Kind = 'ltm' as Kind;
    const mtmKind: Kind = 'mtm' as Kind;

    /** A registry that gates the knowledge + LTM + MTM kind bodies (all strings here). */
    function multiKindRegistry(): IBodyConverterRegistry {
      const registry = BodyConverterRegistry.create().orThrow();
      registry.register(knowledgeKind, Converters.string);
      registry.register(ltmKind, Converters.string);
      registry.register(mtmKind, Converters.string);
      return registry;
    }

    const multiKindCodecs: ReadonlyMap<Kind, IIdentityCodec> = new Map<Kind, IIdentityCodec>([
      [knowledgeKind, new KnowledgeIdentityCodec()],
      [ltmKind, new LtmIdentityCodec()],
      [mtmKind, new MtmIdentityCodec()]
    ]);

    /** Cap-cull policy for the MTM kind (entity-scoped dedup). */
    function memoryPolicies(): ReadonlyMap<Kind, IWritePolicy> {
      const capCull = MemoryCapCullPolicy.create({
        maxRecords: 5,
        mutableFields: ['body', 'tags', 'links', 'provenance', 'embeddingRef']
      }).orThrow();
      return new Map<Kind, IWritePolicy>([
        [ltmKind, capCull],
        [mtmKind, capCull]
      ]);
    }

    function memoryStore(root?: FileTree.IMutableFileTreeDirectoryItem): FileTreeMemoryStore {
      return FileTreeMemoryStore.create({
        root: root ?? mutableRoot(),
        registry: multiKindRegistry(),
        codecs: multiKindCodecs,
        writePolicies: memoryPolicies(),
        clock
      }).orThrow();
    }

    test('registers all three kind families from one FileTree vault', async () => {
      const store = memoryStore();
      (await store.put(makeRecord({ id: 'intro', kind: 'knowledge', body: 'k' }))).orThrow();
      (await store.put(makeRecord({ id: 'conv-1', entityId: 'conv-1', kind: 'ltm', body: 'l' }))).orThrow();
      (await store.put(makeRecord({ id: 'turn-5', entityId: 'conv-1:5', kind: 'mtm', body: 'm' }))).orThrow();

      expect(await store.get(knowledgeKind, 'intro' as EntityId)).toSucceedAndSatisfy((r) => {
        expect(r?.envelope.kind).toBe('knowledge');
      });
      expect(await store.get(ltmKind, 'conv-1' as EntityId)).toSucceedAndSatisfy((r) => {
        expect(r?.envelope.kind).toBe('ltm');
      });
      expect(await store.get(mtmKind, 'conv-1:5' as EntityId)).toSucceedAndSatisfy((r) => {
        expect(r?.envelope.id).toBe('turn-5');
        expect(r?.envelope.entityId).toBe('conv-1:5');
      });
    });

    test('MTM composite key persists at conversations/<id>/turn-<n> and round-trips a reload', async () => {
      const root = mutableRoot();
      const store = memoryStore(root);
      (
        await store.put(makeRecord({ id: 'turn-0', entityId: 'conv-x:0', kind: 'mtm', body: 'm0' }))
      ).orThrow();

      // A fresh store over the same root must re-index the MTM record (verifyRoundTrip
      // exercises the multi-segment scope on load).
      const reopened = memoryStore(root);
      expect(await reopened.get(mtmKind, 'conv-x:0' as EntityId)).toSucceedAndSatisfy((r) => {
        expect(r?.envelope.id).toBe('turn-0');
      });
    });

    test('entity-scoped dedup: two distinct entities with identical content both persist', async () => {
      // Regression for the flagged collapse bug: turn-5 and turn-9 share the same
      // { kind, body, links } but are distinct entities and must NOT collapse.
      const store = memoryStore();
      const five = (
        await store.put(makeRecord({ id: 'turn-5', entityId: 'conv-1:5', kind: 'mtm', body: 'identical' }))
      ).orThrow();
      const nine = (
        await store.put(makeRecord({ id: 'turn-9', entityId: 'conv-1:9', kind: 'mtm', body: 'identical' }))
      ).orThrow();

      expect(five.envelope.id).toBe('turn-5');
      expect(nine.envelope.id).toBe('turn-9');
      expect(nine.envelope.id).not.toBe(five.envelope.id);

      // Both are independently retrievable — neither collapsed into the other.
      expect(await store.get(mtmKind, 'conv-1:5' as EntityId)).toSucceedAndSatisfy((r) => {
        expect(r?.envelope.id).toBe('turn-5');
      });
      expect(await store.get(mtmKind, 'conv-1:9' as EntityId)).toSucceedAndSatisfy((r) => {
        expect(r?.envelope.id).toBe('turn-9');
      });
      expect(await store.list({ kind: mtmKind })).toSucceedAndSatisfy((records) => {
        expect(records).toHaveLength(2);
      });
    });

    test('entity-scoped dedup: an identical re-put of the SAME entity is a no-op', async () => {
      const store = memoryStore();
      let firstSeq: number = -1;
      expect(
        await store.put(makeRecord({ id: 'turn-5', entityId: 'conv-1:5', kind: 'mtm', body: 'same' }))
      ).toSucceedAndSatisfy((r) => {
        firstSeq = r.envelope.seq;
      });
      expect(
        await store.put(makeRecord({ id: 'turn-5', entityId: 'conv-1:5', kind: 'mtm', body: 'same' }))
      ).toSucceedAndSatisfy((r) => {
        expect(r.envelope.seq).toBe(firstSeq);
      });
    });

    test('merge-patch updates the body of an existing memory entity (distinct content)', async () => {
      const store = memoryStore();
      let firstCreated: number = -1;
      let firstSeq: number = -1;
      expect(
        await store.put(makeRecord({ id: 'turn-5', entityId: 'conv-1:5', kind: 'mtm', body: 'v1' }))
      ).toSucceedAndSatisfy((r) => {
        firstCreated = r.envelope.created;
        firstSeq = r.envelope.seq;
      });
      clockValue = 2000;
      expect(
        await store.put(makeRecord({ id: 'turn-5', entityId: 'conv-1:5', kind: 'mtm', body: 'v2' }))
      ).toSucceedAndSatisfy((r) => {
        expect(r.body).toBe('v2');
        expect(r.envelope.created).toBe(firstCreated);
        expect(r.envelope.updated).toBe(2000);
        expect(r.envelope.seq).toBe(firstSeq + 1);
      });
    });
  });
});
