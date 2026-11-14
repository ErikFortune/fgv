/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, captureResult, fail, mapResults, succeed } from '@fgv/ts-utils';
import { JsonSchema } from '@fgv/ts-json-base';
import { AiAssist } from '@fgv/ts-extras';
import {
  Convert,
  EntityId,
  IEdgeTarget,
  IIdentityCodec,
  IMemoryRecord,
  Kind,
  MemoryId,
  MemoryScopeKey,
  Tag,
  scopedAddressOf
} from '../types';
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
  /**
   * The scope the stored record lives in. Together with {@link IMemoryWriteResult.id | id}
   * it is the record's address — the `{ id, scope }` a later write links to it with.
   *
   * @remarks
   * It is resolved through the store after the put commits. With `FileTreeMemoryStore`
   * that cannot fail, because `put` encodes through the same codecs. A custom
   * `IMemoryStore` whose `resolveIdentity` disagrees with its own `put` would see
   * `memory_write` report a failure for a write that was in fact persisted.
   */
  readonly scope: MemoryScopeKey;
  /** The domain {@link EntityId} the write targeted. */
  readonly entityId: EntityId;
  /** The record's {@link Kind}. */
  readonly kind: Kind;
}

/**
 * The part of an agent-visible result item that a host
 * {@link ICreateMemoryToolsParams.projectItem | projectItem} hook produces. The
 * tool layer adds {@link IMemoryToolResultItem.id | id} and
 * {@link IMemoryToolResultItem.scope | scope} on top, so a hook neither supplies
 * nor can remove them.
 * @public
 */
export interface IMemoryToolItemProjection {
  /**
   * The display key: the host mnemonic when a
   * {@link ICreateMemoryToolsParams.handleFor | handleFor} hook is supplied, the
   * raw {@link MemoryId} otherwise. It is for display and for referring to the
   * record in prose. It is NOT an address: links and context seeds use
   * {@link IMemoryToolResultItem.id | id} + {@link IMemoryToolResultItem.scope | scope}.
   */
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
 * A single agent-visible `memory_search` / `memory_context` / `memory_read`
 * result item. Its address is {@link IMemoryToolResultItem.id | id} +
 * {@link IMemoryToolResultItem.scope | scope}; its display key is
 * {@link IMemoryToolItemProjection.handle | handle}.
 *
 * @remarks
 * A bare id is unique only within a scope (the MTM codec mints `turn-<n>` under
 * every conversation), so every item carries the scope its record lives in as
 * well as its id. The tool descriptions tell the model to copy both into a
 * `memory_write` link target or a `memory_context` seed. The tool layer always
 * sets `id` and `scope`, after any host projection, so a
 * {@link ICreateMemoryToolsParams.projectItem | projectItem} hook cannot drop or
 * override them.
 * @public
 */
export interface IMemoryToolResultItem extends IMemoryToolItemProjection {
  /** The record's {@link MemoryId} (`envelope.id`), unique within {@link IMemoryToolResultItem.scope | scope}. */
  readonly id: MemoryId;
  /**
   * The scope the record lives in — the address the store read it from, derived
   * from its `(kind, entityId)` by the store's codecs (see `scopedAddressOf`).
   */
  readonly scope: MemoryScopeKey;
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
   * mnemonic tag). When supplied, `memory_search` / `memory_context` /
   * `memory_read` items use the returned handle as their display key; when absent
   * the raw {@link MemoryId} is used. Items carry their `id` and `scope` either
   * way, and those, not the handle, are what links and context seeds take.
   */
  readonly handleFor?: (record: IMemoryRecord<unknown>) => string;
  /**
   * Optional host projector mapping a record (and the requested detail tier) to
   * its agent-visible {@link IMemoryToolItemProjection}. When supplied, every
   * `memory_search` / `memory_context` / `memory_read` result item is produced by
   * this callback — the host owns how much of the body a `'gist'` vs `'full'`
   * result carries, so it can bound the default (`'gist'`) path.
   *
   * When absent, the built-in default projection is used (full body plus the
   * {@link ICreateMemoryToolsParams.handleFor | handleFor} handle), which ignores
   * the detail tier — behavior is byte-identical to a build with no projector.
   *
   * The callback is guarded exactly like `handleFor`: a throw degrades to the
   * default full-body projection for that item rather than failing the whole
   * search.
   *
   * The hook does not own {@link IMemoryToolResultItem.id | id} or
   * {@link IMemoryToolResultItem.scope | scope}: the tool layer sets both on
   * every item after the hook runs, so a value the hook returns is overwritten
   * and one it omits is still present.
   */
  readonly projectItem?: (
    record: IMemoryRecord<unknown>,
    detail: MemoryDetailTier
  ) => IMemoryToolItemProjection;
}

/**
 * The detail tier a `memory_search` / `memory_context` result is projected at.
 * `'gist'` is the default (bounded) path; `'full'` is opt-in. Only meaningful
 * when a host {@link ICreateMemoryToolsParams.projectItem | projectItem} is
 * supplied — the built-in default projection returns the full body regardless.
 * @public
 */
export type MemoryDetailTier = 'gist' | 'full';

/** The resolved factory context threaded into each tool's `execute`. */
interface IToolContext {
  readonly store: IMemoryStore;
  readonly retriever: IMemoryRetriever;
  readonly registry: IBodyConverterRegistry;
  readonly kinds?: ReadonlyArray<Kind>;
  readonly codecs?: ReadonlyMap<Kind, IIdentityCodec>;
  readonly defaultCodec?: IIdentityCodec;
  readonly handleFor?: (record: IMemoryRecord<unknown>) => string;
  readonly projectItem?: (
    record: IMemoryRecord<unknown>,
    detail: MemoryDetailTier
  ) => IMemoryToolItemProjection;
}

// ---------------------------------------------------------------------------
// Parameter schemas — authored once via JsonSchema.object(...); the schema IS
// both the wire schema (.toJson()) and the runtime validator (.convert()).
// NONE of these declare a `scope` (or scope-widening) property — the adoption
// gate is enforced structurally and asserted in the tests.
// ---------------------------------------------------------------------------

/**
 * The scope-qualified target of a link edge authored by the agent on a write.
 * `scope` is optional: when omitted it defaults to the writing record's OWN
 * resolved scope (the common same-conversation case); supply it explicitly to
 * point an edge at a record in a different scope. The descriptions tell the
 * model to copy `id` and `scope` from one result, since every result item
 * carries both and a bare id is ambiguous across scopes.
 */
// eslint-disable-next-line @rushstack/typedef-var
const linkTargetSchema = JsonSchema.object({
  id: JsonSchema.string({
    description:
      'The MemoryId of the record this edge points at: copy `id` from a memory_search, ' +
      'memory_context, memory_read or memory_write result (not its `handle`).'
  }),
  scope: JsonSchema.optional(
    JsonSchema.string({
      description:
        "The target record's scope: copy `scope` from the same result you took `id` from. " +
        "Records in different scopes can share an id. When omitted, defaults to the writing record's own " +
        'scope, which is right only for a target in that same scope.'
    })
  )
});

/** A single attributed link edge as authored by the agent on a write. */
// eslint-disable-next-line @rushstack/typedef-var
const linkEdgeSchema = JsonSchema.object({
  type: JsonSchema.string({ description: 'The relation type of the link.' }),
  target: linkTargetSchema,
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
  entityId: JsonSchema.string({ description: 'The domain entity id to read.' }),
  detail: JsonSchema.optional(
    JsonSchema.enumOf(['gist', 'full'] as const, { description: "'gist' | 'full' (default)." })
  )
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
  limit: JsonSchema.optional(
    JsonSchema.integer({
      description:
        'Maximum number of results to return. At least one of kind, tag, semantic or limit is required.'
    })
  ),
  offset: JsonSchema.optional(
    JsonSchema.integer({ description: 'Number of results to skip after ordering, before limit. Default 0.' })
  ),
  detail: JsonSchema.optional(
    JsonSchema.enumOf(['gist', 'full'] as const, { description: "'gist' (default) | 'full'." })
  )
});

/**
 * The scope-qualified seed a `memory_context` traversal starts from. Nested
 * `{ id, scope }` shape like a link target, but — unlike a write edge — there is
 * no writing record to default the scope from, so `scope` is REQUIRED to
 * disambiguate the seed across scopes (a bare stem like `turn-3` is otherwise
 * ambiguous). It is schema-required (not just runtime-required) so the wire
 * schema an LLM reads never advertises an optionality the tool does not honor.
 */
// eslint-disable-next-line @rushstack/typedef-var
const contextSeedSchema = JsonSchema.object({
  id: JsonSchema.string({
    description:
      'The MemoryId of the seed record to traverse links from: copy `id` from a memory_search, ' +
      'memory_context or memory_read result (not its `handle`).'
  }),
  scope: JsonSchema.string({
    description:
      'The scope of the seed record: copy `scope` from the same result item you took `id` from ' +
      '(required — a bare seed id is ambiguous across scopes).'
  })
});

// eslint-disable-next-line @rushstack/typedef-var
const contextSchema = JsonSchema.object({
  from: contextSeedSchema,
  kind: JsonSchema.optional(JsonSchema.string({ description: 'Restrict reached records to this kind.' })),
  tag: JsonSchema.optional(JsonSchema.string({ description: 'Restrict reached records carrying this tag.' })),
  hops: JsonSchema.optional(JsonSchema.integer({ description: 'BFS hop count (default 1).' })),
  limit: JsonSchema.optional(JsonSchema.integer({ description: 'Maximum number of results to return.' })),
  detail: JsonSchema.optional(
    JsonSchema.enumOf(['gist', 'full'] as const, { description: "'gist' (default) | 'full'." })
  )
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

/**
 * Resolve the requested detail tier from the optional tool `detail` string.
 * `'full'` is the only opt-in value; every other input (absent, or an
 * unrecognized string) resolves safely to the bounded default `'gist'`.
 */
function resolveDetail(detail?: string): MemoryDetailTier {
  return detail === 'full' ? 'full' : 'gist';
}

/** The built-in default projection: full body plus the guarded host handle. Ignores the detail tier. */
function defaultProjectItem(ctx: IToolContext, record: IMemoryRecord<unknown>): IMemoryToolItemProjection {
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

/**
 * Project a record's agent-visible fields at the requested detail tier. When a
 * host {@link ICreateMemoryToolsParams.projectItem | projectItem} is supplied it
 * owns the projection; otherwise the built-in {@link defaultProjectItem} (full
 * body) is used. The host callback is guarded like `handleFor` — a throw
 * degrades to the default full-body projection for that item rather than
 * failing the whole search/context call.
 */
function projectFields(
  ctx: IToolContext,
  record: IMemoryRecord<unknown>,
  detail: MemoryDetailTier
): IMemoryToolItemProjection {
  if (ctx.projectItem === undefined) {
    return defaultProjectItem(ctx, record);
  }
  // Guard the host projector like `handleFor`: a throw degrades to the built-in
  // full-body projection (itself throw-safe) rather than escaping the chain.
  return captureResult(() => ctx.projectItem!(record, detail)).orDefaultWith(() =>
    defaultProjectItem(ctx, record)
  );
}

/**
 * Resolve a loaded record's scope through the store. The store is
 * consumer-injected, so a throwing `resolveIdentity` is captured into a
 * `Failure` (as `scopedAddressOf` asks of its callers) rather than escaping the
 * tool's Result chain.
 */
function scopeOf(ctx: IToolContext, record: IMemoryRecord<unknown>): Result<MemoryScopeKey> {
  return captureResult(() => scopedAddressOf(record, ctx.store)).onSuccess((address) =>
    address.onSuccess(({ scope }) => succeed(scope))
  );
}

/**
 * Project a record into an agent-visible result item: the host or default
 * projection, plus the record's address: `id` (its `envelope.id`) and `scope`
 * (as the store's codecs derive it). Both are spread LAST so a host projection
 * can neither drop nor override them. A record whose scope cannot be resolved fails
 * the call rather than reaching the model unqualified, since an unqualified id
 * is exactly the ambiguity the field exists to remove.
 */
function projectItem(
  ctx: IToolContext,
  record: IMemoryRecord<unknown>,
  detail: MemoryDetailTier
): Result<IMemoryToolResultItem> {
  return scopeOf(ctx, record)
    .withErrorFormat(
      (msg) =>
        `cannot resolve the scope of record '${record.envelope.id}' (kind '${record.envelope.kind}'): ${msg}`
    )
    .onSuccess((scope) => succeed({ ...projectFields(ctx, record, detail), id: record.envelope.id, scope }));
}

/** Project every record into a result item; fails if any record's scope cannot be resolved. */
function projectItems(
  ctx: IToolContext,
  records: ReadonlyArray<IMemoryRecord<unknown>>,
  detail: MemoryDetailTier
): Result<ReadonlyArray<IMemoryToolResultItem>> {
  return mapResults(records.map((record) => projectItem(ctx, record, detail)));
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
  idStem: string,
  sourceScope: string
): Result<IMemoryRecord<unknown>> {
  // Plain shapes handed to `envelopeConverter`, which validates each field
  // (type → LinkType, target → { scope, id }) and produces the branded IEdge[].
  // An edge target with no explicit `scope` defaults to the writing record's own
  // resolved scope — the same-conversation case authors just an id.
  const links: ReadonlyArray<Record<string, unknown>> = (typed.links ?? []).map((link) => ({
    type: link.type,
    target: { scope: link.target.scope ?? sourceScope, id: link.target.id },
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
          return buildWriteRecord(typed, kind, entityId, addr.idStem, addr.scope).onSuccess((record) =>
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
        "Identical content is a no-op that returns the existing record. Returns the stored record's " +
        '`id` and `scope`. To link to a record another memory tool returned, copy `id` and `scope` ' +
        'from that result into the link target; records in different scopes can share an id.',
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
            (await ctx.store.put(record)).asResult.onSuccess((persisted) =>
              // The persisted record can be a different entity (content-scope
              // dedup), so its address is resolved from the record, not the request.
              //
              // This runs AFTER the put has committed, so a failure here reports a
              // write that did persist. With `FileTreeMemoryStore` it is unreachable:
              // `put` encodes through the same codecs `resolveIdentity` uses, so a
              // record it just stored always resolves. Only a custom store whose
              // resolver disagrees with its own `put` can reach it.
              scopeOf(ctx, persisted)
                .withErrorFormat((msg) => `memory_write: cannot resolve the stored record's scope: ${msg}`)
                .onSuccess((scope) =>
                  succeed<IMemoryWriteResult>({
                    outcome: writeOutcome(before, persisted, entityId),
                    id: persisted.envelope.id,
                    scope,
                    entityId,
                    kind
                  })
                )
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
      description:
        'Read a specific memory record by (kind, entityId). The returned item carries its `id` ' +
        'and `scope`; copy both to link to it.',
      parametersSchema: readSchema,
      annotations: READ_ONLY_ANNOTATIONS
    },
    execute: async (args: unknown): Promise<Result<unknown>> =>
      readSchema
        .convert(args)
        .withErrorFormat((msg) => `memory_read: invalid arguments: ${msg}`)
        .onSuccess((typed) =>
          assertKindEnabled(ctx, typed.kind).onSuccess((kind) =>
            Convert.entityId.convert(typed.entityId).onSuccess((entityId) => {
              // `memory_read` is the explicit drill-in path, so its detail default is
              // INVERTED vs search/context: `'full'` unless the caller opts down to `'gist'`.
              const detail: MemoryDetailTier = typed.detail === 'gist' ? 'gist' : 'full';
              return succeed({ kind, entityId, detail });
            })
          )
        )
        .thenOnSuccess(async ({ kind, entityId, detail }) =>
          (await ctx.store.get(kind, entityId)).onSuccess((record) =>
            record === undefined
              ? succeed({ found: false })
              : projectItem(ctx, record, detail)
                  .withErrorFormat((msg) => `memory_read: ${msg}`)
                  .onSuccess((item) => succeed({ found: true, item }))
          )
        )
  };
}

function buildSearchTool(ctx: IToolContext): AiAssist.IAiClientTool {
  return {
    config: {
      type: 'client_tool',
      name: 'memory_search',
      description:
        'Search memories by tag, kind, or semantic text. Returns ranked results. ' +
        'Each result carries its `id` and the `scope` its record lives in, plus a display `handle`; ' +
        'records in different scopes can share an id, so to link to a result (memory_write) or start ' +
        'from it (memory_context), copy `id` and `scope` from the result. ' +
        'At least one of kind, tag, semantic or limit must be supplied.',
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
        .onSuccess(({ typed, kind, tag }) => {
          // A search with no axis at all is a whole-vault read issued by a model,
          // and since the index holds envelopes only it materializes every body
          // to answer. An LLM asking for "everything" is nearly always an
          // under-specified query rather than an intended full scan, so this
          // refuses instead of serving it — the model can retry with an axis,
          // which is the outcome we want anyway.
          //
          // `limit` counts: an ordered top-N materializes N records rather than
          // the vault (see `resolveQuery`), so it bounds the read as genuinely as
          // `kind` or `tag` does.
          if (
            kind === undefined &&
            tag === undefined &&
            typed.semantic === undefined &&
            typed.limit === undefined
          ) {
            return fail<{ typed: typeof typed; kind: typeof kind; tag: typeof tag }>(
              'memory_search: supply at least one of kind, tag, semantic or limit — ' +
                'an unrestricted search reads every record in the vault'
            );
          }
          return succeed({ typed, kind, tag });
        })
        .thenOnSuccess(async ({ typed, kind, tag }) => {
          const detail: MemoryDetailTier = resolveDetail(typed.detail);
          const query: IMemoryQuery = {
            ...(kind !== undefined ? { kind } : {}),
            ...(tag !== undefined ? { tag } : {}),
            ...(typed.semantic !== undefined ? { semantic: typed.semantic } : {}),
            ...(typed.limit !== undefined ? { limit: typed.limit } : {}),
            ...(typed.offset !== undefined ? { offset: typed.offset } : {})
          };
          return (await ctx.retriever.retrieve(query)).onSuccess((records) =>
            projectItems(ctx, records, detail)
              .withErrorFormat((msg) => `memory_search: ${msg}`)
              .onSuccess((results) => succeed({ count: results.length, results }))
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
        'Build a context graph from a seed memory: returns the records linked from the seed, up to `hops` hops. ' +
        'Seed it by copying `id` and `scope` from a result; results carry both, like memory_search.',
      parametersSchema: contextSchema,
      annotations: READ_ONLY_ANNOTATIONS
    },
    execute: async (args: unknown): Promise<Result<unknown>> =>
      contextSchema
        .convert(args)
        .withErrorFormat((msg) => `memory_context: invalid arguments: ${msg}`)
        .onSuccess((typed) =>
          resolveContextSeed(typed.from).onSuccess((from) =>
            resolveOptionalKind(ctx, typed.kind).onSuccess((kind) =>
              resolveOptionalTag(typed.tag).onSuccess((tag) => succeed({ typed, from, kind, tag }))
            )
          )
        )
        .thenOnSuccess(async ({ typed, from, kind, tag }) => {
          const detail: MemoryDetailTier = resolveDetail(typed.detail);
          const query: IMemoryQuery = {
            linkedFrom: from,
            ...(kind !== undefined ? { kind } : {}),
            ...(tag !== undefined ? { tag } : {}),
            ...(typed.hops !== undefined ? { hops: typed.hops } : {}),
            ...(typed.limit !== undefined ? { limit: typed.limit } : {})
          };
          return (await ctx.retriever.retrieve(query)).onSuccess((records) =>
            projectItems(ctx, records, detail)
              .withErrorFormat((msg) => `memory_context: ${msg}`)
              .onSuccess((results) => succeed({ seed: from, count: results.length, results }))
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
          (await ctx.store.delete(kind, entityId)).asResult.onSuccess((id) =>
            succeed({ deleted: true, id, entityId, kind })
          )
        )
  };
}

/**
 * Resolve a `memory_context` seed argument into a scope-qualified
 * {@link IEdgeTarget}. Both `id` and `scope` are present here — the tool's
 * `parametersSchema` ({@link contextSeedSchema}) makes `scope` schema-required —
 * so this only brands the two fields; a malformed value fails via the branded
 * converters (e.g. a path-unsafe seed id).
 */
function resolveContextSeed(from: { readonly id: string; readonly scope: string }): Result<IEdgeTarget> {
  return Convert.memoryId
    .convert(from.id)
    .onSuccess((id) => Convert.scopeKey.convert(from.scope).onSuccess((scope) => succeed({ scope, id })));
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
    handleFor: params.handleFor,
    projectItem: params.projectItem
  };
  const selected: ReadonlySet<MemoryToolName> = new Set<MemoryToolName>(params.tools ?? DEFAULT_MEMORY_TOOLS);
  return TOOL_BUILDERS.filter((builder) => selected.has(builder.name)).map((builder) => builder.build(ctx));
}
