/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, captureResult, fail, succeed } from '@fgv/ts-utils';
import { JsonSchema } from '@fgv/ts-json-base';
import { AiAssist } from '@fgv/ts-extras';
import { Convert, EntityId, IIdentityCodec, IMemoryRecord, Kind, MemoryId, Tag } from '../types';
import { IBodyConverterRegistry, envelopeConverter } from '../converters';
import { IMemoryStore } from '../store';
import { IMemoryQuery, IMemoryRetriever } from '../retrieve';

/**
 * The names of the five proof-set memory tools. A caller selects a subset via
 * {@link ICreateMemoryToolsParams.tools | tools}.
 * @public
 */
export type MemoryToolName =
  | 'memory_write'
  | 'memory_read'
  | 'memory_search'
  | 'memory_context'
  | 'memory_delete';

/**
 * The default tool subset when {@link ICreateMemoryToolsParams.tools | tools} is
 * omitted: the read-only set. Mutating tools (`memory_write` / `memory_delete`)
 * are **off by default** and must be named explicitly — writes stay
 * curation-mediated unless the host opts in.
 * @public
 */
export const DEFAULT_MEMORY_TOOLS: ReadonlyArray<MemoryToolName> = ['memory_search', 'memory_context'];

/**
 * Discriminates the outcome of a {@link createMemoryTools | memory_write} call so
 * the agent can reason about what its write actually did.
 *
 * @remarks
 * - `written` — a new record was persisted, or an existing entity was updated.
 * - `deduped` — the content already existed (content-hash dedup no-op); the
 *   store returned the existing record unchanged.
 *
 * The store's public `put` return does not surface cap-cull evictions, so a
 * `culled` outcome is not distinguishable at this layer without an L1 change or
 * observer wiring (both out of scope for L2). The writer's own record is always
 * `written` even when the write triggers a cull of older siblings.
 * @public
 */
export type MemoryWriteOutcome = 'written' | 'deduped';

/**
 * The success value returned by `memory_write.execute`.
 * @public
 */
export interface IMemoryWriteResult {
  /** What the write did — see {@link MemoryWriteOutcome}. */
  readonly outcome: MemoryWriteOutcome;
  /** The stored record's {@link MemoryId}. */
  readonly id: MemoryId;
  /** The domain {@link EntityId} the write targeted. */
  readonly entityId: EntityId;
  /** The record's {@link Kind}. */
  readonly kind: Kind;
}

/**
 * A single agent-visible search / context result item. The agent-facing key is
 * {@link IMemoryToolResultItem.handle | handle}: the host mnemonic when a
 * {@link ICreateMemoryToolsParams.handleFor | handleFor} hook is supplied, else
 * the raw {@link MemoryId}.
 * @public
 */
export interface IMemoryToolResultItem {
  /** The agent-visible key (host handle when supplied, raw {@link MemoryId} otherwise). */
  readonly handle: string;
  /** The record's {@link Kind}. */
  readonly kind: Kind;
  /** The record's domain {@link EntityId}. */
  readonly entityId: EntityId;
  /** The record's tags. */
  readonly tags: ReadonlyArray<string>;
  /** The record body (a markdown string in B1). */
  readonly body: unknown;
}

/**
 * Parameters for {@link createMemoryTools}.
 *
 * @remarks
 * **Scope isolation is constructor-fixed.** The {@link
 * ICreateMemoryToolsParams.store | store} is the sole scope authority — it is the
 * actor's own, pre-scoped memory root. No tool's `parametersSchema` declares a
 * `scope` (or any scope-widening) property, so an LLM cannot steer a tool at
 * another actor's memory.
 * @public
 */
export interface ICreateMemoryToolsParams {
  /**
   * The pre-scoped memory store (the actor's own memory root). Sole scope
   * authority — backs `memory_write` / `memory_read` / `memory_delete`.
   */
  readonly store: IMemoryStore;
  /** Retriever backing `memory_search` (and `memory_context` via link traversal). */
  readonly retriever: IMemoryRetriever;
  /** Body converter registry — gates the toolable kinds via `has(kind)`. */
  readonly registry: IBodyConverterRegistry;
  /**
   * The per-tool enable subset. Defaults to {@link DEFAULT_MEMORY_TOOLS} (the
   * read-only set). Name `memory_write` / `memory_delete` here to opt into the
   * mutating tools.
   */
  readonly tools?: ReadonlyArray<MemoryToolName>;
  /**
   * Optional whitelist of toolable kinds. When present, a tool `kind` argument
   * outside this set is rejected. When absent, {@link
   * IBodyConverterRegistry.has | registry.has} is the sole kind gate.
   */
  readonly kinds?: ReadonlyArray<Kind>;
  /**
   * Per-kind identity codecs, used by `memory_write` to map the domain
   * {@link EntityId} to the record's storage id (the store resolves codecs
   * internally for `get` / `delete`, so read / delete do not need them). Absent
   * → `memory_write` uses {@link ICreateMemoryToolsParams.defaultCodec |
   * defaultCodec}, and fails loudly for a kind with no resolvable codec. The
   * read-only default tool set needs no codecs.
   */
  readonly codecs?: ReadonlyMap<Kind, IIdentityCodec>;
  /** Default identity codec for kinds without an explicit {@link ICreateMemoryToolsParams.codecs | codecs} entry. */
  readonly defaultCodec?: IIdentityCodec;
  /**
   * Optional host hook mapping a record to its agent-visible handle (an evocative
   * mnemonic tag). When supplied, `memory_search` / `memory_context` results use
   * the returned handle as the agent-visible key; when absent the raw
   * {@link MemoryId} is used.
   */
  readonly handleFor?: (record: IMemoryRecord<unknown>) => string;
}

/** The resolved factory context threaded into each tool's `execute`. */
interface IToolContext {
  readonly store: IMemoryStore;
  readonly retriever: IMemoryRetriever;
  readonly registry: IBodyConverterRegistry;
  readonly kinds?: ReadonlyArray<Kind>;
  readonly codecs?: ReadonlyMap<Kind, IIdentityCodec>;
  readonly defaultCodec?: IIdentityCodec;
  readonly handleFor?: (record: IMemoryRecord<unknown>) => string;
}

// ---------------------------------------------------------------------------
// Parameter schemas — authored once via JsonSchema.object(...); the schema IS
// both the wire schema (.toJson()) and the runtime validator (.convert()).
// NONE of these declare a `scope` (or scope-widening) property — the adoption
// gate is enforced structurally and asserted in the tests.
// ---------------------------------------------------------------------------

/** A single attributed link edge as authored by the agent on a write. */
// eslint-disable-next-line @rushstack/typedef-var
const linkEdgeSchema = JsonSchema.object({
  type: JsonSchema.string({ description: 'The relation type of the link.' }),
  target: JsonSchema.string({ description: 'The MemoryId this edge points at.' }),
  confidence: JsonSchema.optional(JsonSchema.number({ description: 'Optional confidence in [0, 1].' }))
});

// eslint-disable-next-line @rushstack/typedef-var
const writeSchema = JsonSchema.object({
  kind: JsonSchema.string({ description: 'The record kind (must be an enabled, registered kind).' }),
  entityId: JsonSchema.string({
    description:
      'The domain entity id. For composite (e.g. medium-term) kinds this is the full composite key.'
  }),
  body: JsonSchema.string({ description: "The serialized record body; validated by the kind's converter." }),
  tags: JsonSchema.optional(JsonSchema.array(JsonSchema.string({ description: 'A tag label.' }))),
  links: JsonSchema.optional(JsonSchema.array(linkEdgeSchema))
});
type WriteArgs = JsonSchema.Static<typeof writeSchema>;

// eslint-disable-next-line @rushstack/typedef-var
const readSchema = JsonSchema.object({
  kind: JsonSchema.string({ description: 'The record kind.' }),
  entityId: JsonSchema.string({ description: 'The domain entity id to read.' })
});

// eslint-disable-next-line @rushstack/typedef-var
const deleteSchema = JsonSchema.object({
  kind: JsonSchema.string({ description: 'The record kind.' }),
  entityId: JsonSchema.string({ description: 'The domain entity id to delete.' })
});

// eslint-disable-next-line @rushstack/typedef-var
const searchSchema = JsonSchema.object({
  kind: JsonSchema.optional(JsonSchema.string({ description: 'Restrict to this kind.' })),
  tag: JsonSchema.optional(JsonSchema.string({ description: 'Restrict to records carrying this tag.' })),
  semantic: JsonSchema.optional(
    JsonSchema.string({ description: 'Semantic query text (requires a semantic-capable retriever).' })
  ),
  limit: JsonSchema.optional(JsonSchema.integer({ description: 'Maximum number of results to return.' }))
});

// eslint-disable-next-line @rushstack/typedef-var
const contextSchema = JsonSchema.object({
  from: JsonSchema.string({ description: 'The seed MemoryId to traverse links from.' }),
  kind: JsonSchema.optional(JsonSchema.string({ description: 'Restrict reached records to this kind.' })),
  tag: JsonSchema.optional(JsonSchema.string({ description: 'Restrict reached records carrying this tag.' })),
  hops: JsonSchema.optional(JsonSchema.integer({ description: 'BFS hop count (default 1).' })),
  limit: JsonSchema.optional(JsonSchema.integer({ description: 'Maximum number of results to return.' }))
});

// ---------------------------------------------------------------------------
// Behavior annotations (Component 4) — host-advisory hints; never serialized to
// the model. openWorldHint is false throughout (a closed, local store).
// ---------------------------------------------------------------------------

const READ_ONLY_ANNOTATIONS: AiAssist.IAiToolAnnotations = {
  readOnlyHint: true,
  openWorldHint: false
};

const WRITE_ANNOTATIONS: AiAssist.IAiToolAnnotations = {
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: false
};

const DELETE_ANNOTATIONS: AiAssist.IAiToolAnnotations = {
  destructiveHint: true,
  idempotentHint: true,
  openWorldHint: false
};

// ---------------------------------------------------------------------------
// Shared validation / projection helpers
// ---------------------------------------------------------------------------

/** Validate a `kind` string and assert it is an enabled, registered toolable kind. */
function assertKindEnabled(ctx: IToolContext, kindStr: string): Result<Kind> {
  return Convert.kind.convert(kindStr).onSuccess((kind) => {
    if (!ctx.registry.has(kind)) {
      return fail(`memory tools: kind '${kind}' has no registered body converter`);
    }
    if (ctx.kinds !== undefined && !ctx.kinds.includes(kind)) {
      return fail(`memory tools: kind '${kind}' is not enabled for memory tools`);
    }
    return succeed(kind);
  });
}

/** Validate an optional `kind` string (enabled when present; `undefined` passes through). */
function resolveOptionalKind(ctx: IToolContext, kindStr?: string): Result<Kind | undefined> {
  if (kindStr === undefined) {
    return succeed(undefined);
  }
  return assertKindEnabled(ctx, kindStr);
}

/** Project a record into an agent-visible result item, applying the host handle hook when present. */
function projectItem(ctx: IToolContext, record: IMemoryRecord<unknown>): IMemoryToolResultItem {
  // `handleFor` is a host callback; guard it so a throw degrades to the raw id rather than
  // escaping the Result chain (and crashing the whole search/context call).
  const handle =
    ctx.handleFor !== undefined
      ? captureResult(() => ctx.handleFor!(record)).orDefault(record.envelope.id)
      : record.envelope.id;
  return {
    handle,
    kind: record.envelope.kind,
    entityId: record.envelope.entityId,
    tags: record.envelope.tags,
    body: record.body
  };
}

/** Resolve the identity codec used by `memory_write` to derive the storage id. */
function codecForWrite(ctx: IToolContext, kind: Kind): Result<IIdentityCodec> {
  const codec: IIdentityCodec | undefined = ctx.codecs?.get(kind) ?? ctx.defaultCodec;
  if (codec === undefined) {
    return fail(`memory_write: no identity codec available for kind '${kind}'`);
  }
  return succeed(codec);
}

/** Build the record to persist from validated write args (store stamps txn-time metadata). */
function buildWriteRecord(
  typed: WriteArgs,
  kind: Kind,
  entityId: EntityId,
  idStem: string
): Result<IMemoryRecord<unknown>> {
  // Plain shapes handed to `envelopeConverter`, which validates each field
  // (type → LinkType, target → MemoryId) and produces the branded IEdge[].
  const links: ReadonlyArray<Record<string, unknown>> = (typed.links ?? []).map((link) => ({
    type: link.type,
    target: link.target,
    ...(link.confidence !== undefined ? { confidence: link.confidence } : {})
  }));
  return envelopeConverter
    .convert({
      id: idStem,
      entityId,
      kind,
      tags: typed.tags ?? [],
      links,
      created: 0,
      updated: 0,
      seq: 0,
      contentHash: '',
      provenance: { source: 'agent' }
    })
    .withErrorFormat((msg) => `memory_write: invalid record: ${msg}`)
    .onSuccess((envelope) => succeed({ envelope, body: typed.body }));
}

/** Resolve the validated write args into the storage id + record (all synchronous). */
function prepareWrite(
  ctx: IToolContext,
  typed: WriteArgs
): Result<{ readonly kind: Kind; readonly entityId: EntityId; readonly record: IMemoryRecord<unknown> }> {
  return assertKindEnabled(ctx, typed.kind).onSuccess((kind) =>
    Convert.entityId.convert(typed.entityId).onSuccess((entityId) =>
      codecForWrite(ctx, kind).onSuccess((codec) =>
        codec.encode(entityId).onSuccess((addr) => {
          if (addr.isVersioned) {
            return fail(`memory_write: versioned/temporal kind '${kind}' is not supported`);
          }
          return buildWriteRecord(typed, kind, entityId, addr.idStem).onSuccess((record) =>
            succeed({ kind, entityId, record })
          );
        })
      )
    )
  );
}

/**
 * Discriminate the write outcome from a pre-put snapshot and the returned record.
 * A dedup no-op returns either a different entity (content-scope dedup) or the
 * same-id record with an unchanged `seq` (entity-scope re-put); a fresh write or
 * update advances `seq`.
 */
function writeOutcome(
  before: IMemoryRecord<unknown> | undefined,
  written: IMemoryRecord<unknown>,
  entityId: EntityId
): MemoryWriteOutcome {
  if (written.envelope.entityId !== entityId) {
    return 'deduped';
  }
  if (before !== undefined && written.envelope.seq === before.envelope.seq) {
    return 'deduped';
  }
  return 'written';
}

// ---------------------------------------------------------------------------
// Tool builders — config with a JsonSchema.object(...) parametersSchema; execute
// validates/narrows → delegates to store/retriever → returns the Result (never
// swallowed), following the ts-extras-mcp adapter shape.
//
// Each `execute` re-runs its own `parametersSchema.convert(args)` even though the
// `executeClientToolTurn` harness already validates against the same schema. This
// is deliberate: the factory returns a heterogeneous `ReadonlyArray<IAiClientTool>`
// (TParams erased to `unknown`, since the members carry different param shapes), so
// `execute` receives `unknown` and must narrow it back to the typed args. The
// re-validation is also the narrowing step exercised by the direct-call tests (which
// invoke `execute` with raw args, bypassing the harness). Re-validating an
// already-conforming shape is a cheap, side-effect-free identity.
// ---------------------------------------------------------------------------

function buildWriteTool(ctx: IToolContext): AiAssist.IAiClientTool {
  return {
    config: {
      type: 'client_tool',
      name: 'memory_write',
      description:
        'Store a new memory record or update an existing one by (kind, entityId). ' +
        'Identical content is a no-op that returns the existing record.',
      parametersSchema: writeSchema,
      annotations: WRITE_ANNOTATIONS
    },
    execute: async (args: unknown): Promise<Result<unknown>> =>
      writeSchema
        .convert(args)
        .withErrorFormat((msg) => `memory_write: invalid arguments: ${msg}`)
        .onSuccess((typed) => prepareWrite(ctx, typed))
        .thenOnSuccess(async ({ kind, entityId, record }) =>
          // Read the prior record to discriminate written-vs-deduped. A `Failure`
          // here (corrupt file, I/O error, codec round-trip failure) is a real
          // condition distinct from the "not found" success (`undefined`); propagate
          // it rather than defaulting it away, so a genuine store fault surfaces
          // instead of being masked as a normal write.
          (await ctx.store.get(kind, entityId)).thenOnSuccess(async (before) =>
            (await ctx.store.put(record)).onSuccess((persisted) =>
              succeed<IMemoryWriteResult>({
                outcome: writeOutcome(before, persisted, entityId),
                id: persisted.envelope.id,
                entityId,
                kind
              })
            )
          )
        )
  };
}

function buildReadTool(ctx: IToolContext): AiAssist.IAiClientTool {
  return {
    config: {
      type: 'client_tool',
      name: 'memory_read',
      description: 'Read a specific memory record by (kind, entityId).',
      parametersSchema: readSchema,
      annotations: READ_ONLY_ANNOTATIONS
    },
    execute: async (args: unknown): Promise<Result<unknown>> =>
      readSchema
        .convert(args)
        .withErrorFormat((msg) => `memory_read: invalid arguments: ${msg}`)
        .onSuccess((typed) =>
          assertKindEnabled(ctx, typed.kind).onSuccess((kind) =>
            Convert.entityId.convert(typed.entityId).onSuccess((entityId) => succeed({ kind, entityId }))
          )
        )
        .thenOnSuccess(async ({ kind, entityId }) =>
          (await ctx.store.get(kind, entityId)).onSuccess((record) =>
            record === undefined
              ? succeed({ found: false })
              : succeed({ found: true, item: projectItem(ctx, record) })
          )
        )
  };
}

function buildSearchTool(ctx: IToolContext): AiAssist.IAiClientTool {
  return {
    config: {
      type: 'client_tool',
      name: 'memory_search',
      description: 'Search memories by tag, kind, or semantic text. Returns ranked results.',
      parametersSchema: searchSchema,
      annotations: READ_ONLY_ANNOTATIONS
    },
    execute: async (args: unknown): Promise<Result<unknown>> =>
      searchSchema
        .convert(args)
        .withErrorFormat((msg) => `memory_search: invalid arguments: ${msg}`)
        .onSuccess((typed) =>
          resolveOptionalKind(ctx, typed.kind).onSuccess((kind) =>
            resolveOptionalTag(typed.tag).onSuccess((tag) => succeed({ typed, kind, tag }))
          )
        )
        .thenOnSuccess(async ({ typed, kind, tag }) => {
          const query: IMemoryQuery = {
            ...(kind !== undefined ? { kind } : {}),
            ...(tag !== undefined ? { tag } : {}),
            ...(typed.semantic !== undefined ? { semantic: typed.semantic } : {}),
            ...(typed.limit !== undefined ? { limit: typed.limit } : {})
          };
          return (await ctx.retriever.retrieve(query)).onSuccess((records) =>
            succeed({ count: records.length, results: records.map((r) => projectItem(ctx, r)) })
          );
        })
  };
}

function buildContextTool(ctx: IToolContext): AiAssist.IAiClientTool {
  return {
    config: {
      type: 'client_tool',
      name: 'memory_context',
      description:
        'Build a context graph from a seed memory: returns the records linked from the seed, up to `hops` hops.',
      parametersSchema: contextSchema,
      annotations: READ_ONLY_ANNOTATIONS
    },
    execute: async (args: unknown): Promise<Result<unknown>> =>
      contextSchema
        .convert(args)
        .withErrorFormat((msg) => `memory_context: invalid arguments: ${msg}`)
        .onSuccess((typed) =>
          Convert.memoryId
            .convert(typed.from)
            .onSuccess((from) =>
              resolveOptionalKind(ctx, typed.kind).onSuccess((kind) =>
                resolveOptionalTag(typed.tag).onSuccess((tag) => succeed({ typed, from, kind, tag }))
              )
            )
        )
        .thenOnSuccess(async ({ typed, from, kind, tag }) => {
          const query: IMemoryQuery = {
            linkedFrom: from,
            ...(kind !== undefined ? { kind } : {}),
            ...(tag !== undefined ? { tag } : {}),
            ...(typed.hops !== undefined ? { hops: typed.hops } : {}),
            ...(typed.limit !== undefined ? { limit: typed.limit } : {})
          };
          return (await ctx.retriever.retrieve(query)).onSuccess((records) =>
            succeed({ seed: from, count: records.length, results: records.map((r) => projectItem(ctx, r)) })
          );
        })
  };
}

function buildDeleteTool(ctx: IToolContext): AiAssist.IAiClientTool {
  return {
    config: {
      type: 'client_tool',
      name: 'memory_delete',
      description: 'Delete a memory record by (kind, entityId). Destructive for non-temporal kinds.',
      parametersSchema: deleteSchema,
      annotations: DELETE_ANNOTATIONS
    },
    execute: async (args: unknown): Promise<Result<unknown>> =>
      deleteSchema
        .convert(args)
        .withErrorFormat((msg) => `memory_delete: invalid arguments: ${msg}`)
        .onSuccess((typed) =>
          assertKindEnabled(ctx, typed.kind).onSuccess((kind) =>
            Convert.entityId.convert(typed.entityId).onSuccess((entityId) => succeed({ kind, entityId }))
          )
        )
        .thenOnSuccess(async ({ kind, entityId }) =>
          (await ctx.store.delete(kind, entityId)).onSuccess((id) =>
            succeed({ deleted: true, id, entityId, kind })
          )
        )
  };
}

/** Validate an optional `tag` string (`undefined` passes through). */
function resolveOptionalTag(tagStr?: string): Result<Tag | undefined> {
  if (tagStr === undefined) {
    return succeed(undefined);
  }
  return Convert.tag.convert(tagStr);
}

/** Ordered registry of the five tool builders, keyed by name. */
const TOOL_BUILDERS: ReadonlyArray<{
  readonly name: MemoryToolName;
  readonly build: (ctx: IToolContext) => AiAssist.IAiClientTool;
}> = [
  { name: 'memory_write', build: buildWriteTool },
  { name: 'memory_read', build: buildReadTool },
  { name: 'memory_search', build: buildSearchTool },
  { name: 'memory_context', build: buildContextTool },
  { name: 'memory_delete', build: buildDeleteTool }
];

/**
 * Build the selected suite of memory `AiAssist.IAiClientTool`s over a
 * pre-scoped store — ready to hand to `AiAssist.executeClientToolTurn` (and, via
 * the shared `JsonSchema.object(...)` schemas, `@fgv/ts-extras-mcp`).
 *
 * @remarks
 * **Scope isolation is make-or-break.** The returned tools close over the
 * pre-scoped {@link ICreateMemoryToolsParams.store | store}; no tool's
 * `parametersSchema` declares a `scope` (or any scope-widening) property, so an
 * LLM cannot steer a tool at another actor's memory. The store instance is the
 * sole scope authority.
 *
 * The default selection is {@link DEFAULT_MEMORY_TOOLS} (the read-only set) —
 * `memory_write` / `memory_delete` are included only when named in
 * {@link ICreateMemoryToolsParams.tools | tools}.
 * @public
 */
export function createMemoryTools(params: ICreateMemoryToolsParams): ReadonlyArray<AiAssist.IAiClientTool> {
  const ctx: IToolContext = {
    store: params.store,
    retriever: params.retriever,
    registry: params.registry,
    kinds: params.kinds,
    codecs: params.codecs,
    defaultCodec: params.defaultCodec,
    handleFor: params.handleFor
  };
  const selected: ReadonlySet<MemoryToolName> = new Set<MemoryToolName>(params.tools ?? DEFAULT_MEMORY_TOOLS);
  return TOOL_BUILDERS.filter((builder) => selected.has(builder.name)).map((builder) => builder.build(ctx));
}
