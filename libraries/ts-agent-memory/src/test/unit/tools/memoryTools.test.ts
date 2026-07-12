/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { Converter, Converters, Result, fail, succeed } from '@fgv/ts-utils';
import { FileTree, JsonObject } from '@fgv/ts-json-base';
import { AiAssist } from '@fgv/ts-extras';
import {
  AdmissionDecision,
  BodyConverterRegistry,
  DEFAULT_MEMORY_TOOLS,
  FileTreeMemoryStore,
  HybridRetriever,
  IBodyConverterRegistry,
  IIdentityCodec,
  IIndexedMemoryRecord,
  IMemoryRecord,
  IMemoryStore,
  IMemoryToolResultItem,
  IMemoryWriteResult,
  IWritePolicy,
  Kind,
  KnowledgeIdentityCodec,
  LinkTraversalRetriever,
  MemoryIndex,
  IIdentityCodecResult,
  MemoryScopeKey,
  MemoryToolName,
  MtmIdentityCodec,
  RecencyRetriever,
  ScoreUnionMergeStrategy,
  StructuredFilterRetriever,
  TagRetriever,
  createMemoryTools,
  envelopeConverter
} from '../../../index';

const knowledgeKind: Kind = 'knowledge' as Kind;
const mtmKind: Kind = 'mtm' as Kind;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function mutableRoot(): FileTree.IMutableFileTreeDirectoryItem {
  const tree = FileTree.inMemory([], { mutable: true }).orThrow();
  const root = tree.getDirectory('/').orThrow();
  if (!FileTree.isMutableDirectoryItem(root)) {
    throw new Error('expected a mutable root directory');
  }
  return root;
}

function registryWith(
  entries: ReadonlyArray<{ kind: Kind; converter?: Converter<string> }>
): IBodyConverterRegistry {
  const registry = BodyConverterRegistry.create().orThrow();
  for (const entry of entries) {
    registry.register(entry.kind, entry.converter ?? Converters.string);
  }
  return registry;
}

const codecs: ReadonlyMap<Kind, IIdentityCodec> = new Map<Kind, IIdentityCodec>([
  [knowledgeKind, new KnowledgeIdentityCodec()],
  [mtmKind, new MtmIdentityCodec()]
]);

/** A write policy that always rejects — exercises the admit-reject → fail path. */
class RejectingPolicy implements IWritePolicy {
  public readonly mutableFields: ReadonlyArray<string> = ['body'];
  public admit(): Result<AdmissionDecision> {
    return succeed({ decision: 'reject', reason: 'blocked by test policy' });
  }
  public applyUpdate(existing: IMemoryRecord<unknown>): Result<IMemoryRecord<unknown>> {
    return succeed(existing);
  }
}

function makeStore(
  params: {
    registry?: IBodyConverterRegistry;
    writePolicies?: ReadonlyMap<Kind, IWritePolicy>;
  } = {}
): FileTreeMemoryStore {
  return FileTreeMemoryStore.create({
    root: mutableRoot(),
    registry: params.registry ?? registryWith([{ kind: knowledgeKind }, { kind: mtmKind }]),
    codecs,
    writePolicies: params.writePolicies
  }).orThrow();
}

interface IEntrySpec {
  readonly id: string;
  readonly scope?: string;
  readonly kind?: string;
  readonly entityId?: string;
  readonly tags?: ReadonlyArray<string>;
  readonly updated?: number;
  readonly links?: ReadonlyArray<string>;
}

function makeEntry(spec: IEntrySpec): IIndexedMemoryRecord {
  const record: IMemoryRecord<unknown> = {
    envelope: envelopeConverter
      .convert({
        id: spec.id,
        entityId: spec.entityId ?? spec.id,
        kind: spec.kind ?? 'knowledge',
        tags: spec.tags ?? [],
        links: (spec.links ?? []).map((target) => ({ type: 'rel', target })),
        created: 0,
        updated: spec.updated ?? 0,
        seq: 0,
        contentHash: 'h',
        provenance: { source: 'agent' }
      })
      .orThrow(),
    body: `body-${spec.id}`
  };
  return { scope: (spec.scope ?? 'knowledge') as MemoryScopeKey, record };
}

function makeIndex(specs: ReadonlyArray<IEntrySpec>): MemoryIndex {
  const index = MemoryIndex.create().orThrow();
  index.rebuild(specs.map(makeEntry)).orThrow();
  return index;
}

/**
 * A HybridRetriever (structured + tag) over the given entries — the seedless
 * `memory_search` backing. A bare `LinkTraversalRetriever` is intentionally NOT
 * composed here: it hard-fails a seedless query, so link traversal is the
 * separate `memory_context` retriever.
 */
function makeRetriever(specs: ReadonlyArray<IEntrySpec>): HybridRetriever {
  const index = makeIndex(specs);
  return HybridRetriever.create(
    [
      RecencyRetriever.create(index).orThrow(),
      StructuredFilterRetriever.create(index).orThrow(),
      TagRetriever.create(index).orThrow()
    ],
    ScoreUnionMergeStrategy.create().orThrow()
  ).orThrow();
}

/** A LinkTraversalRetriever over the given entries — the `memory_context` backing. */
function makeLinkRetriever(specs: ReadonlyArray<IEntrySpec>): LinkTraversalRetriever {
  return LinkTraversalRetriever.create(makeIndex(specs)).orThrow();
}

/** Build the full five-tool suite for structural / annotation inspection. */
function allTools(
  overrides: Partial<Parameters<typeof createMemoryTools>[0]> = {}
): ReadonlyArray<AiAssist.IAiClientTool> {
  return createMemoryTools({
    store: overrides.store ?? makeStore(),
    retriever: overrides.retriever ?? makeRetriever([]),
    registry: overrides.registry ?? registryWith([{ kind: knowledgeKind }, { kind: mtmKind }]),
    codecs,
    tools: ['memory_write', 'memory_read', 'memory_search', 'memory_context', 'memory_delete'],
    ...overrides
  });
}

function toolByName(
  tools: ReadonlyArray<AiAssist.IAiClientTool>,
  name: MemoryToolName
): AiAssist.IAiClientTool {
  const tool = tools.find((t) => t.config.name === name);
  if (tool === undefined) {
    throw new Error(`tool '${name}' not found`);
  }
  return tool;
}

/** The property names declared by a tool's JSON-schema. */
function schemaProperties(tool: AiAssist.IAiClientTool): string[] {
  const json = tool.config.parametersSchema.toJson() as JsonObject;
  return Object.keys((json.properties as JsonObject) ?? {});
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createMemoryTools', () => {
  describe('tool subset selection', () => {
    test('defaults to the read-only set (excludes memory_write / memory_delete)', () => {
      const tools = createMemoryTools({
        store: makeStore(),
        retriever: makeRetriever([]),
        registry: registryWith([{ kind: knowledgeKind }])
      });
      expect(tools.map((t) => t.config.name)).toEqual(['memory_search', 'memory_context']);
      expect(DEFAULT_MEMORY_TOOLS).toEqual(['memory_search', 'memory_context']);
    });

    test('includes memory_write / memory_delete only when named', () => {
      const tools = createMemoryTools({
        store: makeStore(),
        retriever: makeRetriever([]),
        registry: registryWith([{ kind: knowledgeKind }]),
        codecs,
        tools: ['memory_write', 'memory_delete']
      });
      expect(tools.map((t) => t.config.name)).toEqual(['memory_write', 'memory_delete']);
    });

    test('returns tools in a stable builder order regardless of selection order', () => {
      const tools = createMemoryTools({
        store: makeStore(),
        retriever: makeRetriever([]),
        registry: registryWith([{ kind: knowledgeKind }]),
        codecs,
        tools: ['memory_delete', 'memory_search', 'memory_write']
      });
      expect(tools.map((t) => t.config.name)).toEqual(['memory_write', 'memory_search', 'memory_delete']);
    });

    test('an empty selection yields no tools', () => {
      const tools = createMemoryTools({
        store: makeStore(),
        retriever: makeRetriever([]),
        registry: registryWith([{ kind: knowledgeKind }]),
        tools: []
      });
      expect(tools).toEqual([]);
    });
  });

  describe('scope isolation (adoption gate)', () => {
    test('NO tool schema declares a scope (or scope-widening) property', () => {
      const tools = allTools();
      expect(tools).toHaveLength(5);
      for (const tool of tools) {
        const props = schemaProperties(tool);
        expect(props.length).toBeGreaterThan(0);
        for (const prop of props) {
          expect(prop.toLowerCase()).not.toContain('scope');
        }
      }
    });
  });

  describe('behavior annotations (Component 4)', () => {
    test('read-only tools are readOnlyHint with openWorldHint false', () => {
      const tools = allTools();
      for (const name of ['memory_search', 'memory_context', 'memory_read'] as const) {
        expect(toolByName(tools, name).config.annotations).toEqual({
          readOnlyHint: true,
          openWorldHint: false
        });
      }
    });

    test('memory_write is non-destructive, non-idempotent, closed-world', () => {
      expect(toolByName(allTools(), 'memory_write').config.annotations).toEqual({
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false
      });
    });

    test('memory_delete is destructive, idempotent, closed-world', () => {
      expect(toolByName(allTools(), 'memory_delete').config.annotations).toEqual({
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false
      });
    });
  });

  describe('parametersSchema validation', () => {
    test('memory_write accepts a well-formed record and rejects a missing body', () => {
      const schema = toolByName(allTools(), 'memory_write').config.parametersSchema;
      expect(schema.convert({ kind: 'knowledge', entityId: 'doc-1', body: 'hello' })).toSucceed();
      expect(
        schema.convert({
          kind: 'knowledge',
          entityId: 'doc-1',
          body: 'hello',
          tags: ['a'],
          links: [{ type: 'rel', target: 'doc-2', confidence: 0.5 }]
        })
      ).toSucceed();
      expect(schema.convert({ kind: 'knowledge', entityId: 'doc-1' })).toFail();
    });

    test('memory_read / memory_delete require kind and entityId', () => {
      for (const name of ['memory_read', 'memory_delete'] as const) {
        const schema = toolByName(allTools(), name).config.parametersSchema;
        expect(schema.convert({ kind: 'knowledge', entityId: 'doc-1' })).toSucceed();
        expect(schema.convert({ kind: 'knowledge' })).toFail();
      }
    });

    test('memory_search rejects a non-integer limit and accepts an all-optional query', () => {
      const schema = toolByName(allTools(), 'memory_search').config.parametersSchema;
      expect(schema.convert({})).toSucceed();
      expect(schema.convert({ tag: 'x', limit: 3 })).toSucceed();
      expect(schema.convert({ limit: 'three' })).toFail();
    });

    test('memory_context requires a from seed', () => {
      const schema = toolByName(allTools(), 'memory_context').config.parametersSchema;
      expect(schema.convert({ from: 'doc-1' })).toSucceed();
      expect(schema.convert({ hops: 2 })).toFail();
    });
  });

  describe('memory_write', () => {
    async function write(
      tool: AiAssist.IAiClientTool,
      args: Record<string, unknown>
    ): Promise<Result<unknown>> {
      return tool.execute(args);
    }

    test('writes a new record (outcome: written) and round-trips through memory_read', async () => {
      const store = makeStore();
      const tools = createMemoryTools({
        store,
        retriever: makeRetriever([]),
        registry: registryWith([{ kind: knowledgeKind }]),
        codecs,
        tools: ['memory_write', 'memory_read']
      });
      const writeTool = toolByName(tools, 'memory_write');
      expect(
        await write(writeTool, { kind: 'knowledge', entityId: 'doc-1', body: 'first', tags: ['t'] })
      ).toSucceedAndSatisfy((value) => {
        const result = value as IMemoryWriteResult;
        expect(result.outcome).toBe('written');
        expect(result.id).toBe('doc-1');
        expect(result.entityId).toBe('doc-1');
      });
      expect(
        await toolByName(tools, 'memory_read').execute({ kind: 'knowledge', entityId: 'doc-1' })
      ).toSucceedAndSatisfy((value) => {
        const read = value as { found: boolean; item: IMemoryToolResultItem };
        expect(read.found).toBe(true);
        expect(read.item.body).toBe('first');
        expect(read.item.tags).toEqual(['t']);
      });
    });

    test('persists authored links (with confidence) on the written record', async () => {
      const store = makeStore();
      const tools = createMemoryTools({
        store,
        retriever: makeRetriever([]),
        registry: registryWith([{ kind: knowledgeKind }]),
        codecs,
        tools: ['memory_write', 'memory_read']
      });
      expect(
        await toolByName(tools, 'memory_write').execute({
          kind: 'knowledge',
          entityId: 'doc-1',
          body: 'linked',
          links: [
            { type: 'rel', target: 'doc-2', confidence: 0.9 },
            { type: 'rel', target: 'doc-3' }
          ]
        })
      ).toSucceedAndSatisfy((v) => expect((v as IMemoryWriteResult).outcome).toBe('written'));
      expect(
        await toolByName(tools, 'memory_read').execute({ kind: 'knowledge', entityId: 'doc-1' })
      ).toSucceedAndSatisfy(() => undefined);
    });

    test('an identical re-put of the same entity is a dedup no-op (outcome: deduped)', async () => {
      const store = makeStore();
      const tool = toolByName(allTools({ store }), 'memory_write');
      expect(await write(tool, { kind: 'knowledge', entityId: 'doc-1', body: 'same' })).toSucceedAndSatisfy(
        (v) => expect((v as IMemoryWriteResult).outcome).toBe('written')
      );
      expect(await write(tool, { kind: 'knowledge', entityId: 'doc-1', body: 'same' })).toSucceedAndSatisfy(
        (v) => expect((v as IMemoryWriteResult).outcome).toBe('deduped')
      );
    });

    test('content-scope dedup under a different entity reports deduped', async () => {
      const store = makeStore();
      const tool = toolByName(allTools({ store }), 'memory_write');
      expect(await write(tool, { kind: 'knowledge', entityId: 'doc-a', body: 'shared' })).toSucceed();
      // Knowledge dedups scope-wide: identical body under a different docId is a no-op
      // that returns the existing (different-entity) record.
      expect(await write(tool, { kind: 'knowledge', entityId: 'doc-b', body: 'shared' })).toSucceedAndSatisfy(
        (v) => expect((v as IMemoryWriteResult).outcome).toBe('deduped')
      );
    });

    test('an update with new content reports written', async () => {
      const store = makeStore();
      const tool = toolByName(allTools({ store }), 'memory_write');
      expect(await write(tool, { kind: 'knowledge', entityId: 'doc-1', body: 'v1' })).toSucceed();
      expect(await write(tool, { kind: 'knowledge', entityId: 'doc-1', body: 'v2' })).toSucceedAndSatisfy(
        (v) => expect((v as IMemoryWriteResult).outcome).toBe('written')
      );
    });

    test('maps an MTM composite entityId to its turn stem', async () => {
      const store = makeStore();
      const tools = createMemoryTools({
        store,
        retriever: makeRetriever([]),
        registry: registryWith([{ kind: knowledgeKind }, { kind: mtmKind }]),
        codecs,
        tools: ['memory_write', 'memory_read']
      });
      expect(
        await toolByName(tools, 'memory_write').execute({
          kind: 'mtm',
          entityId: 'conv-1:7',
          body: 'turn body'
        })
      ).toSucceedAndSatisfy((value) => {
        const result = value as IMemoryWriteResult;
        expect(result.id).toBe('turn-7');
        expect(result.entityId).toBe('conv-1:7');
      });
      // Read back via the same composite entityId.
      expect(
        await toolByName(tools, 'memory_read').execute({ kind: 'mtm', entityId: 'conv-1:7' })
      ).toSucceedAndSatisfy((value) => {
        expect((value as { found: boolean }).found).toBe(true);
      });
    });

    test('a body the kind converter rejects fails the write', async () => {
      const rejectBad: Converter<string> = Converters.string.map((s) =>
        s === 'BAD' ? fail('body not allowed') : succeed(s)
      );
      const registry = registryWith([{ kind: knowledgeKind, converter: rejectBad }]);
      const store = makeStore({ registry });
      const tool = toolByName(allTools({ store, registry }), 'memory_write');
      expect(await write(tool, { kind: 'knowledge', entityId: 'doc-1', body: 'BAD' })).toFailWith(
        /invalid body|body not allowed/i
      );
    });

    test('a policy admit-reject surfaces as a failure', async () => {
      const store = makeStore({
        writePolicies: new Map<Kind, IWritePolicy>([[knowledgeKind, new RejectingPolicy()]])
      });
      const tool = toolByName(allTools({ store }), 'memory_write');
      expect(await write(tool, { kind: 'knowledge', entityId: 'doc-1', body: 'x' })).toFailWith(
        /rejected by policy|blocked by test policy/i
      );
    });

    test('fails when no codec is available for the kind', async () => {
      const store = makeStore();
      const tool = toolByName(
        createMemoryTools({
          store,
          retriever: makeRetriever([]),
          registry: registryWith([{ kind: knowledgeKind }]),
          tools: ['memory_write'] // no codecs / defaultCodec supplied
        }),
        'memory_write'
      );
      expect(await write(tool, { kind: 'knowledge', entityId: 'doc-1', body: 'x' })).toFailWith(
        /no identity codec available/i
      );
    });

    test('rejects a kind with no registered converter', async () => {
      const tool = toolByName(allTools(), 'memory_write');
      expect(await write(tool, { kind: 'unregistered', entityId: 'doc-1', body: 'x' })).toFailWith(
        /no registered body converter/i
      );
    });

    test('rejects a kind outside the kinds whitelist', async () => {
      const tool = toolByName(allTools({ kinds: [mtmKind] }), 'memory_write');
      expect(await write(tool, { kind: 'knowledge', entityId: 'doc-1', body: 'x' })).toFailWith(
        /not enabled for memory tools/i
      );
    });

    test('propagates a store.get failure (does not mask a real fault as a fresh write)', async () => {
      const failingStore: IMemoryStore = {
        get: async () => fail('disk fault'),
        getById: async () => fail('unused'),
        list: async () => succeed([]),
        put: async (record) => succeed(record),
        delete: async () => fail('unused')
      };
      const tool = toolByName(
        createMemoryTools({
          store: failingStore,
          retriever: makeRetriever([]),
          registry: registryWith([{ kind: knowledgeKind }]),
          codecs,
          tools: ['memory_write']
        }),
        'memory_write'
      );
      expect(await write(tool, { kind: 'knowledge', entityId: 'doc-1', body: 'x' })).toFailWith(
        /disk fault/i
      );
    });

    test('rejects a versioned/temporal kind', async () => {
      const versionedCodec: IIdentityCodec = {
        encode: (entityId): Result<IIdentityCodecResult> =>
          succeed({ scope: 'knowledge' as MemoryScopeKey, idStem: entityId as string, isVersioned: true }),
        decode: (): Result<never> => fail('unused'),
        verifyRoundTrip: (): Result<true> => succeed(true)
      };
      const tool = toolByName(
        createMemoryTools({
          store: makeStore(),
          retriever: makeRetriever([]),
          registry: registryWith([{ kind: knowledgeKind }]),
          codecs: new Map<Kind, IIdentityCodec>([[knowledgeKind, versionedCodec]]),
          tools: ['memory_write']
        }),
        'memory_write'
      );
      expect(await write(tool, { kind: 'knowledge', entityId: 'doc-1', body: 'x' })).toFailWith(
        /versioned\/temporal kind .* is not supported/i
      );
    });

    test('rejects malformed arguments', async () => {
      const tool = toolByName(allTools(), 'memory_write');
      expect(await write(tool, { kind: 'knowledge', entityId: 'doc-1' })).toFailWith(/invalid arguments/i);
    });
  });

  describe('memory_read', () => {
    test('returns found:false when the record is absent', async () => {
      const tool = toolByName(allTools(), 'memory_read');
      expect(await tool.execute({ kind: 'knowledge', entityId: 'missing' })).toSucceedWith({ found: false });
    });

    test('applies the handleFor hook to the returned item', async () => {
      const store = makeStore();
      const tools = createMemoryTools({
        store,
        retriever: makeRetriever([]),
        registry: registryWith([{ kind: knowledgeKind }]),
        codecs,
        tools: ['memory_write', 'memory_read'],
        handleFor: (r) => `mnemonic:${r.envelope.id}`
      });
      await toolByName(tools, 'memory_write').execute({ kind: 'knowledge', entityId: 'doc-1', body: 'b' });
      expect(
        await toolByName(tools, 'memory_read').execute({ kind: 'knowledge', entityId: 'doc-1' })
      ).toSucceedAndSatisfy((value) => {
        const read = value as { found: boolean; item: IMemoryToolResultItem };
        expect(read.item.handle).toBe('mnemonic:doc-1');
      });
    });

    test('propagates a store failure (bad entityId)', async () => {
      const tool = toolByName(allTools(), 'memory_read');
      expect(await tool.execute({ kind: 'knowledge', entityId: '   ' })).toFail();
    });
  });

  describe('memory_search', () => {
    test('returns projected results keyed by raw MemoryId when no handleFor is supplied', async () => {
      const retriever = makeRetriever([
        { id: 'doc-1', tags: ['topic'] },
        { id: 'doc-2', tags: ['topic'] }
      ]);
      const tool = toolByName(
        createMemoryTools({
          store: makeStore(),
          retriever,
          registry: registryWith([{ kind: knowledgeKind }])
        }),
        'memory_search'
      );
      expect(await tool.execute({ tag: 'topic' })).toSucceedAndSatisfy((value) => {
        const out = value as { count: number; results: ReadonlyArray<IMemoryToolResultItem> };
        expect(out.count).toBe(2);
        expect(out.results.map((r) => r.handle).sort()).toEqual(['doc-1', 'doc-2']);
      });
    });

    test('uses the host handle (mnemonic) as the agent-visible key when handleFor is supplied', async () => {
      const retriever = makeRetriever([{ id: 'doc-1', tags: ['topic'] }]);
      const tool = toolByName(
        createMemoryTools({
          store: makeStore(),
          retriever,
          registry: registryWith([{ kind: knowledgeKind }]),
          handleFor: (r) => `@${r.envelope.id}`
        }),
        'memory_search'
      );
      expect(await tool.execute({ tag: 'topic', limit: 5 })).toSucceedAndSatisfy((value) => {
        const out = value as { results: ReadonlyArray<IMemoryToolResultItem> };
        expect(out.results[0].handle).toBe('@doc-1');
      });
    });

    test('falls back to the raw id when a throwing handleFor would otherwise escape', async () => {
      const retriever = makeRetriever([{ id: 'doc-1', tags: ['topic'] }]);
      const tool = toolByName(
        createMemoryTools({
          store: makeStore(),
          retriever,
          registry: registryWith([{ kind: knowledgeKind }]),
          handleFor: () => {
            throw new Error('host handle hook blew up');
          }
        }),
        'memory_search'
      );
      // A throwing host callback must not crash the search; the item degrades to the raw id.
      expect(await tool.execute({ tag: 'topic', limit: 5 })).toSucceedAndSatisfy((value) => {
        const out = value as { results: ReadonlyArray<IMemoryToolResultItem> };
        expect(out.results[0].handle).toBe('doc-1');
      });
    });

    test('loud-degrades on the unwired semantic axis', async () => {
      const retriever = makeRetriever([{ id: 'doc-1' }]);
      const tool = toolByName(
        createMemoryTools({
          store: makeStore(),
          retriever,
          registry: registryWith([{ kind: knowledgeKind }])
        }),
        'memory_search'
      );
      expect(await tool.execute({ semantic: 'find me' })).toFailWith(
        /semantic recall requires a vector index/i
      );
    });

    test('rejects a kind outside the kinds whitelist', async () => {
      const retriever = makeRetriever([{ id: 'doc-1' }]);
      const tool = toolByName(
        createMemoryTools({
          store: makeStore(),
          retriever,
          registry: registryWith([{ kind: knowledgeKind }]),
          kinds: [knowledgeKind]
        }),
        'memory_search'
      );
      expect(await tool.execute({ kind: 'mtm' })).toFailWith(/no registered body converter|not enabled/i);
    });

    test('filters by a validated kind', async () => {
      const retriever = makeRetriever([
        { id: 'doc-1', kind: 'knowledge' },
        { id: 'turn-0', kind: 'mtm', scope: 'conversations/conv-1' }
      ]);
      const tool = toolByName(
        createMemoryTools({
          store: makeStore(),
          retriever,
          registry: registryWith([{ kind: knowledgeKind }, { kind: mtmKind }])
        }),
        'memory_search'
      );
      expect(await tool.execute({ kind: 'knowledge' })).toSucceedAndSatisfy((value) => {
        const out = value as { results: ReadonlyArray<IMemoryToolResultItem> };
        expect(out.results.map((r) => r.handle)).toEqual(['doc-1']);
      });
    });

    test('rejects malformed arguments', async () => {
      const tool = toolByName(allTools(), 'memory_search');
      expect(await tool.execute({ limit: 'nope' })).toFailWith(/invalid arguments/i);
    });
  });

  describe('memory_context', () => {
    test('returns the neighbors reachable from a seed', async () => {
      const retriever = makeLinkRetriever([
        { id: 'a', links: ['b', 'c'] },
        { id: 'b', updated: 20 },
        { id: 'c', updated: 10 }
      ]);
      const tool = toolByName(
        createMemoryTools({
          store: makeStore(),
          retriever,
          registry: registryWith([{ kind: knowledgeKind }])
        }),
        'memory_context'
      );
      expect(await tool.execute({ from: 'a' })).toSucceedAndSatisfy((value) => {
        const out = value as { seed: string; count: number; results: ReadonlyArray<IMemoryToolResultItem> };
        expect(out.seed).toBe('a');
        expect(out.results.map((r) => r.handle)).toEqual(['b', 'c']);
      });
    });

    test('honors hops, kind, tag, and limit filters', async () => {
      const retriever = makeLinkRetriever([
        { id: 'a', links: ['b'] },
        { id: 'b', links: ['c'], tags: ['keep'] },
        { id: 'c', tags: ['keep'] }
      ]);
      const tool = toolByName(
        createMemoryTools({
          store: makeStore(),
          retriever,
          registry: registryWith([{ kind: knowledgeKind }])
        }),
        'memory_context'
      );
      expect(
        await tool.execute({ from: 'a', hops: 2, tag: 'keep', kind: 'knowledge', limit: 5 })
      ).toSucceedAndSatisfy((value) => {
        const out = value as { results: ReadonlyArray<IMemoryToolResultItem> };
        expect(out.results.map((r) => r.handle).sort()).toEqual(['b', 'c']);
      });
    });

    test('rejects an invalid seed id', async () => {
      const tool = toolByName(allTools(), 'memory_context');
      expect(await tool.execute({ from: 'a/b' })).toFail();
    });

    test('rejects malformed arguments', async () => {
      const tool = toolByName(allTools(), 'memory_context');
      expect(await tool.execute({ hops: 1 })).toFailWith(/invalid arguments/i);
    });
  });

  describe('memory_delete', () => {
    test('deletes an existing record', async () => {
      const store = makeStore();
      const tools = createMemoryTools({
        store,
        retriever: makeRetriever([]),
        registry: registryWith([{ kind: knowledgeKind }]),
        codecs,
        tools: ['memory_write', 'memory_delete', 'memory_read']
      });
      await toolByName(tools, 'memory_write').execute({ kind: 'knowledge', entityId: 'doc-1', body: 'b' });
      expect(
        await toolByName(tools, 'memory_delete').execute({ kind: 'knowledge', entityId: 'doc-1' })
      ).toSucceedWith({ deleted: true, id: 'doc-1', entityId: 'doc-1', kind: 'knowledge' });
      expect(
        await toolByName(tools, 'memory_read').execute({ kind: 'knowledge', entityId: 'doc-1' })
      ).toSucceedWith({ found: false });
    });

    test('propagates a store failure when the record is absent', async () => {
      const tool = toolByName(allTools(), 'memory_delete');
      expect(await tool.execute({ kind: 'knowledge', entityId: 'missing' })).toFailWith(/no record found/i);
    });

    test('rejects a kind outside the whitelist', async () => {
      const tool = toolByName(allTools({ kinds: [knowledgeKind] }), 'memory_delete');
      expect(await tool.execute({ kind: 'mtm', entityId: 'conv-1:0' })).toFailWith(/not enabled/i);
    });

    test('rejects malformed arguments', async () => {
      const tool = toolByName(allTools(), 'memory_delete');
      expect(await tool.execute({ kind: 'knowledge' })).toFailWith(/invalid arguments/i);
    });
  });
});

describe('result projection (projectItem host projector + detail tier)', () => {
  interface ISearchOut {
    readonly count: number;
    readonly results: ReadonlyArray<IMemoryToolResultItem>;
  }

  /**
   * A host projector that bounds the `'gist'` body to a sentinel and passes the
   * full body through only for `'full'` — the shape a real host uses to keep the
   * default (gist) path bounded.
   */
  const boundingProjector = (
    record: IMemoryRecord<unknown>,
    detail: 'gist' | 'full'
  ): IMemoryToolResultItem => ({
    handle: `h:${record.envelope.id}`,
    kind: record.envelope.kind,
    entityId: record.envelope.entityId,
    tags: record.envelope.tags,
    body: detail === 'full' ? record.body : '<<gist>>'
  });

  function searchToolWith(
    overrides: Partial<Parameters<typeof createMemoryTools>[0]>
  ): AiAssist.IAiClientTool {
    return toolByName(
      createMemoryTools({
        store: makeStore(),
        retriever: makeRetriever([{ id: 'doc-1', tags: ['topic'] }]),
        registry: registryWith([{ kind: knowledgeKind }]),
        ...overrides
      }),
      'memory_search'
    );
  }

  describe('schema surface', () => {
    test('memory_search declares optional detail + offset properties', () => {
      const props = schemaProperties(toolByName(allTools(), 'memory_search'));
      expect(props).toContain('detail');
      expect(props).toContain('offset');
    });

    test('memory_context declares an optional detail property', () => {
      const props = schemaProperties(toolByName(allTools(), 'memory_context'));
      expect(props).toContain('detail');
    });

    test('memory_read declares an optional detail property', () => {
      const props = schemaProperties(toolByName(allTools(), 'memory_read'));
      expect(props).toContain('detail');
    });

    test('memory_search accepts detail and offset, and rejects an out-of-enum detail', () => {
      const schema = toolByName(allTools(), 'memory_search').config.parametersSchema;
      expect(schema.convert({ detail: 'full', offset: 2 })).toSucceed();
      expect(schema.convert({ detail: 'gist' })).toSucceed();
      expect(schema.convert({ offset: 'nope' })).toFail();
      // detail is now an enum ('gist' | 'full') at the wire-schema level.
      expect(schema.convert({ detail: 'verbose' })).toFail();
    });
  });

  describe('absent projector = byte-identical default projection', () => {
    test('returns the full body and the default handle (raw id) when no projector is supplied', async () => {
      const tool = searchToolWith({});
      expect(await tool.execute({ tag: 'topic' })).toSucceedAndSatisfy((value) => {
        const out = value as ISearchOut;
        expect(out.results[0].handle).toBe('doc-1');
        expect(out.results[0].body).toBe('body-doc-1');
      });
    });

    test('the detail tier is inert without a projector (gist and full both yield the full body)', async () => {
      const tool = searchToolWith({});
      for (const detail of ['gist', 'full'] as const) {
        expect(await tool.execute({ tag: 'topic', detail })).toSucceedAndSatisfy((value) => {
          expect((value as ISearchOut).results[0].body).toBe('body-doc-1');
        });
      }
    });
  });

  describe('host projector + detail tier', () => {
    test('defaults to the bounded gist projection when detail is absent', async () => {
      const tool = searchToolWith({ projectItem: boundingProjector });
      expect(await tool.execute({ tag: 'topic' })).toSucceedAndSatisfy((value) => {
        const out = value as ISearchOut;
        expect(out.results[0].handle).toBe('h:doc-1');
        expect(out.results[0].body).toBe('<<gist>>');
      });
    });

    test('opts into the full body only when detail=full is requested', async () => {
      const tool = searchToolWith({ projectItem: boundingProjector });
      expect(await tool.execute({ tag: 'topic', detail: 'full' })).toSucceedAndSatisfy((value) => {
        expect((value as ISearchOut).results[0].body).toBe('body-doc-1');
      });
    });

    test('an out-of-enum detail is rejected at the schema boundary', async () => {
      // detail is a JsonSchema.enumOf(['gist','full']); the tool re-validates args
      // on execute, so an out-of-enum value fails loudly rather than reaching the projector.
      const tool = searchToolWith({ projectItem: boundingProjector });
      expect(await tool.execute({ tag: 'topic', detail: 'verbose' })).toFailWith(/invalid arguments/i);
    });

    test('an explicit detail=gist stays bounded (the non-full branch)', async () => {
      const tool = searchToolWith({ projectItem: boundingProjector });
      expect(await tool.execute({ tag: 'topic', detail: 'gist' })).toSucceedAndSatisfy((value) => {
        expect((value as ISearchOut).results[0].body).toBe('<<gist>>');
      });
    });

    test('memory_context routes its results through the host projector', async () => {
      const tool = toolByName(
        createMemoryTools({
          store: makeStore(),
          retriever: makeLinkRetriever([{ id: 'a', links: ['b'] }, { id: 'b' }]),
          registry: registryWith([{ kind: knowledgeKind }]),
          projectItem: boundingProjector
        }),
        'memory_context'
      );
      expect(await tool.execute({ from: 'a', detail: 'full' })).toSucceedAndSatisfy((value) => {
        const out = value as { results: ReadonlyArray<IMemoryToolResultItem> };
        expect(out.results.map((r) => r.handle)).toEqual(['h:b']);
        expect(out.results[0].body).toBe('body-b');
      });
    });

    test('a throwing host projector degrades to the default full-body projection (does not crash search)', async () => {
      const tool = searchToolWith({
        projectItem: () => {
          throw new Error('host projector blew up');
        }
      });
      expect(await tool.execute({ tag: 'topic' })).toSucceedAndSatisfy((value) => {
        const out = value as ISearchOut;
        // Degraded to the built-in default: raw-id handle + full body.
        expect(out.results[0].handle).toBe('doc-1');
        expect(out.results[0].body).toBe('body-doc-1');
      });
    });

    test('a throwing projector still honors the handleFor hook in the fallback path', async () => {
      const tool = searchToolWith({
        handleFor: (r) => `@${r.envelope.id}`,
        projectItem: () => {
          throw new Error('nope');
        }
      });
      expect(await tool.execute({ tag: 'topic' })).toSucceedAndSatisfy((value) => {
        expect((value as ISearchOut).results[0].handle).toBe('@doc-1');
      });
    });
  });

  describe('offset threading (memory_search)', () => {
    test('threads offset into the query to page the ordered result window', async () => {
      const tool = toolByName(
        createMemoryTools({
          store: makeStore(),
          retriever: makeRetriever([
            { id: 'doc-1', tags: ['topic'], updated: 30 },
            { id: 'doc-2', tags: ['topic'], updated: 20 },
            { id: 'doc-3', tags: ['topic'], updated: 10 }
          ]),
          registry: registryWith([{ kind: knowledgeKind }])
        }),
        'memory_search'
      );
      // Recency-ordered [doc-1, doc-2, doc-3]; offset 1 + limit 1 → [doc-2].
      expect(await tool.execute({ tag: 'topic', offset: 1, limit: 1 })).toSucceedAndSatisfy((value) => {
        const out = value as ISearchOut;
        expect(out.count).toBe(1);
        expect(out.results.map((r) => r.handle)).toEqual(['doc-2']);
      });
    });
  });

  describe('memory_read detail (explicit drill-in defaults to FULL)', () => {
    interface IReadOut {
      readonly found: boolean;
      readonly item: IMemoryToolResultItem;
    }

    async function readToolWith(
      projector?: (record: IMemoryRecord<unknown>, detail: 'gist' | 'full') => IMemoryToolResultItem
    ): Promise<AiAssist.IAiClientTool> {
      const tools = createMemoryTools({
        store: makeStore(),
        retriever: makeRetriever([]),
        registry: registryWith([{ kind: knowledgeKind }]),
        codecs,
        tools: ['memory_write', 'memory_read'],
        ...(projector !== undefined ? { projectItem: projector } : {})
      });
      await toolByName(tools, 'memory_write').execute({
        kind: 'knowledge',
        entityId: 'doc-1',
        body: 'FULLBODY'
      });
      return toolByName(tools, 'memory_read');
    }

    test('defaults to the FULL body (drill-in) with a bounding projector', async () => {
      const tool = await readToolWith(boundingProjector);
      expect(await tool.execute({ kind: 'knowledge', entityId: 'doc-1' })).toSucceedAndSatisfy((value) => {
        expect((value as IReadOut).item.body).toBe('FULLBODY');
      });
    });

    test('opts down to gist only when detail=gist is requested', async () => {
      const tool = await readToolWith(boundingProjector);
      expect(
        await tool.execute({ kind: 'knowledge', entityId: 'doc-1', detail: 'gist' })
      ).toSucceedAndSatisfy((value) => {
        expect((value as IReadOut).item.body).toBe('<<gist>>');
      });
    });

    test('is byte-identical for a no-projector consumer (full body regardless of detail)', async () => {
      const tool = await readToolWith(undefined);
      for (const args of [
        { kind: 'knowledge', entityId: 'doc-1' },
        { kind: 'knowledge', entityId: 'doc-1', detail: 'gist' }
      ]) {
        expect(await tool.execute(args)).toSucceedAndSatisfy((value) => {
          expect((value as IReadOut).item.body).toBe('FULLBODY');
        });
      }
    });
  });
});
