# @fgv/ts-agent-memory — Platform Design

**Status:** design document (no code ships).
**Package floated:** `@fgv/ts-agent-memory` (recommendation, not a decision — see §10).
**Primary input:** `exploration.md` §6 recommended architecture + §7 first slice + §8–§10 refinement passes (authoritative; §9/§10 supersede earlier text).
**Date:** 2026-06-25.

---

## 1. Overview & platform stance

`@fgv/ts-agent-memory` is a **structured-memory substrate for agents** — a
typed-record store with graph links, retrievers, and optional layered capabilities,
built entirely from fgv published primitives. It is **platform work, not a narrow
consumer feature**: the substrate is consumer-shape-agnostic; the consumer
(`personaility`) controls what `kind`s of records exist, what bodies they carry,
and which optional layers it wires.

### Invariant core (always present)

- **Envelope identity + typed per-kind body** — a fixed envelope (frontmatter) +
  a consumer-registered `Converter`/`JsonSchema` body dispatched on `kind`.
- **Attributed edges** — `links[]` are typed objects with optional confidence,
  provenance, and temporal extent; never bare strings.
- **FileTree-backed store** — injectable backend (`IMutableFileTreeAccessors`
  from `libraries/ts-json-base/src/packlets/file-tree/fileTreeAccessors.ts:205,434`).
- **Transaction-time metadata** — `created` / `updated` / `seq` on every write;
  free, not opt-in.
- **Content-hash dedup** — `Crc32Normalizer.computeHash` over canonical `{kind,body,links}` on every write.

### Optional layers (present-when-wired; degrade loudly when absent)

Each optional layer rides seams in the invariant core without reshaping it:

| Layer | Seam it rides |
|---|---|
| Semantic/vector recall | `embeddingRef` envelope field + `IVectorIndex` interface |
| Temporal | `temporal?` optional envelope block + per-kind `temporal-versioned` write policy |
| Observation/audit | `IMemoryObserver` interface + ring-backed store |
| Qualifier-conditional recall | scope-encoded subtrees + optional qualifier selection |

### "Platform not narrow-feature" framing

The design deliberately holds no opinion on:
- What `kind`s exist (open vocabulary; consumer-registered).
- What body shapes those kinds carry (consumer `Converter`/`JsonSchema`).
- Which optional layers are wired (`IVectorIndex`, temporal policy, observer).
- How many tool surface entries exist (L2 minimal proof set first; full suite later).
- What the classification/extraction logic is (L3: host supplies judgment; fgv supplies plumbing).

The library is correct at L1 (substrate) regardless of whether L2 (agent tools) or
L3 (host ingest) exist. L2 and L3 are consumers of L1; L1 must not know they exist.

---

## 2. Type model (the invariant core)

### 2.1 Branded identifiers

Following the pattern in `libraries/ts-prompt-assist/src/packlets/types/ids.ts:114-175`
(`brandedIdConverter`), each identifier is a branded opaque string with hygiene
rules enforced at conversion time (non-empty, length-capped, trimmed, optional
pattern/reject-substring constraints).

```typescript
// libraries/ts-agent-memory/src/packlets/types/ids.ts (illustrative)

import { Brand } from '@fgv/ts-utils';

/** Stable file-stem identifier for a memory record. */
export type MemoryId = Brand<string, 'MemoryId'>;

/** Open-vocabulary record classifier (consumer-registered). */
export type Kind = Brand<string, 'Kind'>;

/** Open-vocabulary tag label. */
export type Tag = Brand<string, 'Tag'>;

/** Scope-encoded path segment (mirrors ScopeKey from ts-prompt-assist). */
export type MemoryScopeKey = Brand<string, 'MemoryScopeKey'>;

/** Entity identity across temporal versions; stable even as a kind evolves. */
export type EntityId = Brand<string, 'EntityId'>;

/** Open-vocabulary link-relation type. */
export type LinkType = Brand<string, 'LinkType'>;

/** Converter constants — same factory pattern as Convert.promptId etc. */
export declare const Convert: {
  readonly memoryId: Converter<MemoryId>;
  readonly kind: Converter<Kind>;
  readonly tag: Converter<Tag>;
  readonly scopeKey: Converter<MemoryScopeKey>;
  readonly entityId: Converter<EntityId>;
  readonly linkType: Converter<LinkType>;
};
```

### 2.2 Structured provenance

`IProvenance` is an extensible structured block, not a flat enum. The firmest
Phase-A non-negotiable (from exploration §10.3):

```typescript
// Provenance source enum — extensible open union
export type ProvenanceSource = 'agent' | 'host-ingest' | 'human' | (string & {});

export interface IProvenance {
  /** How this record entered the store. */
  readonly source: ProvenanceSource;
  /** Agent/user/process that wrote it (optional; privacy-deployment choice). */
  readonly by?: string;
  /** Producing model id when source === 'host-ingest'. */
  readonly model?: string;
  /** Confidence score [0,1] when source === 'host-ingest'. */
  readonly confidence?: number;
  /**
   * Back-link to the source experience record (or ingest-item ref) that
   * produced this record. Enables the cross-kind provenance spine
   * (experience → derived fact). See exploration §10.1.
   */
  readonly derivedFrom?: MemoryId;
  /** Extension point: host-ingest contexts may carry additional fields. */
  readonly [key: string]: unknown;
}
```

### 2.3 Attributed edge (`IEdge`)

Edges are objects, not bare strings. This is the firmest Phase-A recommendation
from exploration §10.3 — the bare-string form fights every optional layer.

```typescript
export interface IEdge {
  /** Relation type (open vocabulary; consumer-defined). */
  readonly type: LinkType;
  /** Target record id. */
  readonly target: MemoryId;
  /** Confidence score [0,1]; absent = certain. */
  readonly confidence?: number;
  /** Provenance of this edge (who/what asserted it). */
  readonly provenance?: IProvenance;
  /**
   * World-truth time this edge became valid. Present only on temporal kinds.
   * Part of the optional temporal envelope extension (§9.4).
   */
  readonly valid_at?: number;
  /**
   * World-truth time this edge became invalid. Present only on temporal kinds.
   * Null = still valid; absent = no temporal extent recorded.
   */
  readonly invalid_at?: number | null;
}
```

### 2.4 Temporal envelope extension (optional)

Temporal is a layered optional capability, NOT a v1 universal mandate (exploration
§9.4). The `temporal?` block is absent on atemporal kinds at zero cost:

```typescript
export interface ITemporalBlock {
  /**
   * World-truth start time (valid-time axis, opt-in per kind).
   * Transaction time (created/updated) is free and always present.
   */
  readonly valid_at?: number;
  /** World-truth end time. Null = currently valid. Absent = atemporal. */
  readonly invalid_at?: number | null;
}
```

### 2.5 The invariant envelope (`IMemoryEnvelope`)

```typescript
export interface IMemoryEnvelope {
  // --- Core identity (always present) ---
  /** Stable identifier. MUST equal filename stem (enforced by verifyFilenameId). */
  readonly id: MemoryId;
  /** Stable entity identifier. Equals id for non-temporal kinds. For temporal-versioned
   *  kinds a single entity may have multiple versioned records sharing one entityId. */
  readonly entityId: EntityId;
  /** Consumer-registered kind (dispatches body Converter). */
  readonly kind: Kind;
  /** Open-vocabulary tags for byTag index. */
  readonly tags: ReadonlyArray<Tag>;
  /** Attributed graph edges. Never bare strings. */
  readonly links: ReadonlyArray<IEdge>;

  // --- Transaction-time metadata (always present; free) ---
  /** Ms epoch — first write. Immutable. */
  readonly created: number;
  /** Ms epoch — most recent write. */
  readonly updated: number;
  /**
   * Content hash over canonical {kind, body, links} via
   * Crc32Normalizer.computeHash (libraries/ts-utils/src/packlets/hash/hashingNormalizer.ts:43).
   * Dedup key: exact match = no-op upsert.
   */
  readonly contentHash: string;
  /** Structured provenance (never a flat enum). */
  readonly provenance: IProvenance;

  // --- Optional temporal block (present only on temporal kinds) ---
  readonly temporal?: ITemporalBlock;

  /**
   * Reference to the vector index entry for this record.
   * Set by the IVectorIndex embed-on-write hook. Null = not embedded (vector
   * layer absent or not yet run). Absent = same as null (backwards compat).
   */
  readonly embeddingRef?: string | null;
}
```

### 2.6 Per-kind body Converter registry

Body shape is consumer-controlled via a registered `Converter<unknown>` or
`ISchemaValidator<unknown>` (from `@fgv/ts-json-base` `JsonSchema`):

```typescript
export interface IBodyConverterRegistry {
  /** Register a Converter for a kind. Replaces any prior registration. */
  register<T>(kind: Kind, converter: Converter<T>): void;
  /** Register a JsonSchema (which IS a Validator) for a kind. */
  registerSchema<T>(kind: Kind, schema: JsonSchema.ISchemaValidator<T>): void;
  /**
   * Convert an unknown body value for the given kind.
   * Returns fail('no converter registered for kind <k>') if unregistered.
   */
  convert(kind: Kind, body: unknown): Result<unknown>;
}
```

The envelope `Converter` uses `Converters.object` (from `@fgv/ts-utils/conversion`)
for the fixed fields, with body dispatched through the registry. Same pattern as the
ts-prompt-assist descriptor converter (`fileTreePromptStore.ts:63`, YAML compose).

### 2.7 Memory record (envelope + body)

```typescript
export interface IMemoryRecord<TBody = unknown> {
  readonly envelope: IMemoryEnvelope;
  /** Typed body — type parameter T narrows after registry.convert(). */
  readonly body: TBody;
}
```

---

## 3. Store layer

### 3.1 Store contract (`IMemoryStore`)

Unlike the read-only v0.1 `IPromptStore`
(`libraries/ts-prompt-assist/src/packlets/store/interfaces.ts:47-55`), the memory
store implements write from day one — L2 (agent tools) requires it.

```typescript
export interface IMemoryStoreListFilter {
  readonly scope?: MemoryScopeKey;
  readonly kind?: Kind;
  readonly tag?: Tag;
}

export interface IMemoryStore {
  // --- Read surface ---
  get(scope: MemoryScopeKey, id: MemoryId): Promise<Result<IMemoryRecord | undefined>>;
  list(filter?: IMemoryStoreListFilter): Promise<Result<ReadonlyArray<IMemoryRecord>>>;

  // --- Write surface (required, not optional) ---
  /**
   * Write a record. Per-kind write policy is applied (see §3.4).
   * Content-hash dedup: if a record with the same contentHash exists, the
   * operation is a no-op returning the existing record (not an error).
   * Returns the written (or existing) record.
   */
  put(scope: MemoryScopeKey, record: IMemoryRecord): Promise<Result<IMemoryRecord>>;

  /**
   * Delete a record by id.
   * For temporal-versioned kinds, this invalidates the current version
   * (sets invalid_at = now) rather than destroying the file.
   * Returns the id of the deleted/invalidated record.
   */
  delete(scope: MemoryScopeKey, id: MemoryId): Promise<Result<MemoryId>>;

  // --- Change notification (deferred; mirrors IPromptStore.watch posture) ---
  watch?(handler: (event: IMemoryStoreEvent) => void): IDisposable;
}
```

### 3.2 FileTree-backed implementation (`FileTreeMemoryStore`)

Backed by `IMutableFileTreeAccessors` from
`libraries/ts-json-base/src/packlets/file-tree/fileTreeAccessors.ts` — specifically:
- `IIMutableFileTreeFileItem.setRawContents` (line 205) — write/overwrite a memory file.
- `IMutableFileTreeAccessors.createDirectory` (line 434) — ensure scope directory.
- `IFileTreeFileItem.getRawContents` (line 177) — read a memory file.
- `deleteFile` (line 427) — physical delete for non-temporal; never called for temporal kinds.

**Factory pattern** (fallible construction):

```typescript
export class FileTreeMemoryStore implements IMemoryStore {
  private constructor(
    private readonly _root: FileTree.IMutableFileTreeDirectoryItem,
    private readonly _registry: IBodyConverterRegistry,
    private readonly _writePolicies: ReadonlyMap<Kind, WritePolicy>,
    private readonly _scopeEncoding: (s: MemoryScopeKey) => Result<string>
  ) {}

  public static create(params: IFileTreeMemoryStoreCreateParams): Result<FileTreeMemoryStore> {
    return validateParams(params).onSuccess(
      (valid) => captureResult(() => new FileTreeMemoryStore(/* ... */))
    );
  }
}
```

### 3.3 Scope-encoded layout

Mirror the `ts-prompt-assist` scope-encoding pattern
(`libraries/ts-prompt-assist/src/packlets/store/scopeEncoding.ts`):

```
vault/                          # FileTree root (node fs | in-memory | zip | browser FSA)
  <encoded-scope>/              # one dir per scope (encoding is injected, same as prompt store)
    <memory-id>.md              # one file per memory record (frontmatter envelope + markdown body)
```

- Per-scope subtrees enable `root-per-user` service deployment with no substrate
  incompatibility (exploration §9.1: service = routing/auth wrapper over N vaults).
- Scope encoding is injectable (same interface as the prompt store).

### 3.4 Filename↔id verification

Following `fileTreePromptStore.ts:73` (`verifyFilenameId`), every loaded record
asserts `envelope.id === file.baseName`. Mismatch is a loud `Result.fail` — no
silent id drift across backends or round-trips.

### 3.5 Content-hash dedup

On every `put`:
1. Compute `contentHash = Crc32Normalizer.computeHash(canonicalize({ kind, body, links }))`.
   (`libraries/ts-utils/src/packlets/hash/hashingNormalizer.ts:43`; RFC 8785
   canonical JSON via `canonicalize`.)
2. If a record with the same `contentHash` exists in scope: return it unchanged (no-op).
3. Otherwise: write the file, update the backlink + byTag index incrementally.

### 3.6 Per-kind write policies

Write policy is registered per kind at store construction; `unknown`/missing kinds
default to `upsert`. The set of policies:

| Policy | Behavior | Primitive used |
|---|---|---|
| `upsert` | Overwrite by id; content-hash dedup applies. | `setRawContents` overwrite |
| `append-only` | New file per write; id = `<entityId>-<seq>`. | New file; no overwrite |
| `bounded-ring` | Keep at most N records for the entity; oldest evicted. | `RetainingRingBuffer` shape; delete oldest file on cap |
| `temporal-versioned` | Invalidate-don't-delete: set `invalid_at` on current; write new version. | Two `setRawContents` (old + new); never `deleteFile` |
| `immutable` | First write wins; subsequent writes with same id are errors. | Check-before-write |

`temporal-versioned` is the optional temporal policy — only enabled for kinds that
opt in. Transaction time (`created`/`updated`) is free on all policies.

**Write lock:** a single write-lock on the store serializes concurrent writes. Files
stay the source of truth; the in-memory index is patched post-write. This is the
resolution from exploration §9.1 (concurrency = lock, not index-as-truth).

---

## 4. Index + retrieval

### 4.1 Derived in-memory index

The index is **not** source of truth — it is a derived, rebuildable view over the
FileTree files. Rebuild = one full walk of the FileTree; incremental patch on each
`put`/`delete`.

```typescript
export interface IMemoryIndex {
  /** Inbound edges for a target id (backlinks). */
  readonly backlinks: ReadonlyMap<MemoryId, ReadonlyArray<IEdge>>;
  /** Record ids carrying a given tag. */
  readonly byTag: ReadonlyMap<Tag, ReadonlyArray<MemoryId>>;
  /** Record ids for a given kind. */
  readonly byKind: ReadonlyMap<Kind, ReadonlyArray<MemoryId>>;
  /** All records ordered by updated descending (recency). */
  readonly byRecency: ReadonlyArray<MemoryId>;

  /** Rebuild the index from the full FileTree walk. */
  rebuild(store: IMemoryStore): Promise<Result<IMemoryIndex>>;
  /** Patch index incrementally after a single write. */
  patch(op: 'put' | 'delete', record: IMemoryRecord): Result<void>;
}
```

Backlinks are a derived view — **never stored in the target file**. This matches
basic-memory's SQLite-derived index design and exploration §4 tension 1. Multi-hop
BFS traversal uses the in-memory index with a visited-set for cycle safety.

### 4.2 Retriever strategy interface (`IMemoryRetriever`)

```typescript
export interface IMemoryRetrieverCapabilities {
  /** Whether this retriever supports semantic/vector recall. */
  readonly supportsSemanticRecall: boolean;
  /** Whether this retriever supports temporal "as-of" queries. */
  readonly supportsTemporalQuery: boolean;
}

export interface IMemoryQuery {
  readonly scope?: MemoryScopeKey;
  readonly tag?: Tag;
  readonly kind?: Kind;
  readonly linkedFrom?: MemoryId;
  readonly linkedTo?: MemoryId;
  readonly hops?: number;          // for link-traversal; default 1
  readonly semantic?: string;      // text for semantic/vector recall
  readonly topK?: number;
  readonly asOf?: number;          // ms epoch — temporal "as-of" point
  readonly limit?: number;
  readonly filter?: (record: IMemoryRecord) => boolean;
}

export interface IMemoryRetriever {
  /** Capabilities this retriever supports; checked before dispatch. */
  readonly capabilities: IMemoryRetrieverCapabilities;
  /** Returns fail('semantic recall requires a vector index; none configured') if
   *  query.semantic is set and supportsSemanticRecall is false. */
  retrieve(query: IMemoryQuery): Promise<Result<ReadonlyArray<IMemoryRecord>>>;
}
```

Loud degradation is a first-class requirement: if a consumer asks for semantic recall
and no `IVectorIndex` is wired, the retriever returns a clear `Result.fail` with a
diagnostic message — not an empty list.

### 4.3 v1 retriever implementations

| Retriever | Description | Degrade behavior |
|---|---|---|
| `RecencyRetriever` | Returns records ordered by `updated` desc. Backed by `byRecency` index. | N/A |
| `TagRetriever` | Exact-match on `byTag` index. Returns records in recency order. | N/A |
| `LinkTraversalRetriever` | BFS from a seed id over `backlinks` + `links[]`. Bounded by `hops` (default 1) and a visited-set cycle guard. Cycle key = `Crc32Normalizer.computeHash(canonicalize(visitedSet))`. | N/A |
| `StructuredFilterRetriever` | Applies arbitrary `IMemoryQuery.filter` predicate over a kind/tag pre-filter. | N/A |
| `SemanticRetriever` | Embeds the query text, delegates to `IVectorIndex.query(vector, topK)`. | `Result.fail('semantic recall requires a vector index; none configured')` |
| `TemporalRetriever` | "As-of" point-in-time query over the temporal index. | `Result.fail('temporal query requires temporal envelope; kind <k> is not temporal')` |

### 4.4 `HybridRetriever`

Composes two or more retrievers and merges results by rank:

```typescript
export class HybridRetriever implements IMemoryRetriever {
  public static create(
    retrievers: ReadonlyArray<IMemoryRetriever>,
    mergeStrategy: IMergeStrategy
  ): Result<HybridRetriever>;
}
```

The reference merge strategy is simple score-union (fulltext rank + semantic cosine
similarity). The strategy is injectable — consumers can supply their own.

---

## 5. Optional layer — semantic/vector

### 5.1 `IVectorIndex` seam

The seam is part of the invariant core (the `embeddingRef` envelope field ships in
v1 so its addition is non-breaking). The impl is a fast-follow.

```typescript
export interface IVectorIndex {
  /**
   * Add or replace the vector for a record.
   * Called by the store's embed-on-write hook when a new record is written.
   */
  add(id: MemoryId, vector: Float32Array): Promise<Result<string>>;  // returns ref
  /**
   * Remove the vector for a record (called on delete).
   */
  remove(id: MemoryId): Promise<Result<MemoryId>>;
  /**
   * Cosine top-k query. Returns ids + scores, descending.
   */
  query(vector: Float32Array, topK: number): Promise<Result<ReadonlyArray<{ id: MemoryId; score: number }>>>;
}
```

### 5.2 Embed-on-write hook

When a writable `FileTreeMemoryStore` is configured with an `IVectorIndex` + an
embedding provider, each `put` call appends:
1. Embed the record body text via `callProviderEmbedding` from
   `libraries/ts-extras/src/packlets/ai-assist/` (or in-process `embed` from
   `@fgv/ts-extras-transformers`).
2. `IVectorIndex.add(id, vector)` → stores embedding, returns `embeddingRef`.
3. Patch `embeddingRef` in the written envelope.

**Re-embed-on-edit:** if `contentHash` changes on a `put`, the old embedding is
stale. The store invalidates it by calling `IVectorIndex.remove(oldId)` then
`IVectorIndex.add(newId, newVector)`. Content hash is the cache-validity key.

### 5.3 Minimal in-package cosine reference implementation

Large-N is explicitly out of scope (exploration §9.1). The permanent answer for the
fgv use case is a brute-force in-memory cosine over `Float32Array` vectors. This
is the complete vector implementation — no external ANN library needed.

The reference impl (`vector/InMemoryCosineIndex.ts`) is described as:
- In-memory `Map<MemoryId, Float32Array>` storage.
- Query: iterate all entries, compute dot-product cosine similarity, return top-k
  by score.
- Rebuild: re-embed all records via the configured embedding provider.
- No new dependency; ~30 lines of arithmetic.
- Serialization: dump to a JSON sidecar on persist (embedding vectors as
  base64-encoded binary).

Consumer can swap to an injected external ANN index behind the same `IVectorIndex`
seam if their N grows beyond "thousands of records" (exploration §9.1: large-N is
out for the foreseeable future, but the seam is open).

### 5.4 Loud degradation when unwired

A `SemanticRetriever` constructed without a wired `IVectorIndex` returns:
```
Result.fail('semantic recall requires a vector index; none configured — wire IVectorIndex on FileTreeMemoryStore.create to enable')
```
Never silently returns empty. Same pattern as the observation/safety screener
degradation in ts-prompt-assist.

---

## 6. Optional layer — temporal

### 6.1 Temporal as an optional layer (NOT a v1 universal mandate)

Temporal is co-equal with vector recall as an optional layer. Not every memory kind
is temporal. The three temporal sub-capabilities are fully separable (exploration §9.4):

1. **Temporal envelope extension** — the optional `temporal?` block (`valid_at` /
   `invalid_at`) in `IMemoryEnvelope`. Absent on atemporal kinds; present on temporal
   kinds. Zero cost to atemporal kinds.
2. **Temporal write policy** — `temporal-versioned` in the per-kind write-policy set
   (§3.6). Enabled per kind when that kind wants history.
3. **Temporal retrievers** — `TemporalRetriever` keyed on the presence of the
   `temporal?` extension. Degrade loudly for non-temporal kinds.

### 6.2 Identity model for temporal kinds

**Forward-compat Phase-A non-negotiable:** the v1 design must not bake a global
`id == filename == single current value` assumption that temporal kinds would have
to break.

Recommended default identity model:
- **Non-temporal kinds:** `entityId === id`. One file per entity; `put` overwrites.
- **Temporal kinds:** `entityId` is the stable entity identifier (shared across all
  versions). Each version has a unique `id` (e.g. `<entityId>-v<seq>`). The entity
  directory layout is:
  ```
  <scope>/
    entities/<entityId>/
      <entityId>-v1.md     # first version (invalid_at set when superseded)
      <entityId>-v2.md     # current version
  ```
  The `temporal-versioned` write policy creates the new version file and sets
  `invalid_at` on the prior one — invalidate-don't-delete, per Zep/Graphiti model.
  Current version = latest where `invalid_at` is null or absent.

This is a **Phase-A seed / recommended default, not a locked v1 decision** — see
OQ-11 in §12. The pivot: keep a flat layout and track versions via a sidecar index
instead. Recommend the `entities/<entityId>/` subtree because it keeps the
FileTree structure self-descriptive and rebuild-friendly.

### 6.3 Temporal retrievers

| Retriever | Query | Notes |
|---|---|---|
| `AsOfRetriever` | Returns the version valid at `query.asOf` ms. | Requires `temporal?` block on kind. |
| `CurrentValidRetriever` | Returns versions where `invalid_at` is null or absent. | Fast-path over byKind index. |
| `HistoryRetriever` | Returns all versions for an entityId, ascending by `valid_at`. | Full subtree walk. |

All three degrade loudly (Result.fail) for non-temporal kinds.

### 6.4 Contradicts→temporal interlock (L3 path)

In the L3 ingest pipeline (§9), a `contradicts` edge on a temporal kind triggers
the `temporal-versioned` write policy automatically: the contradicted record's
`invalid_at` is set, a new version is written. This interlock lives in the fgv-owned
pipeline orchestrator (step 5→6 of the ingest contract, §9.2).

---

## 7. Optional layer — observation/audit

The observation pattern is cloned from `ts-prompt-assist`'s observe packlet
(`libraries/ts-prompt-assist/src/packlets/observe/promptObservationStore.ts:84`,
`observe/types.ts:162`). The memory observe packlet is structurally identical with
only the record type and query fields adapted.

### 7.1 Observer interface

```typescript
export interface IMemoryObserver {
  /** When true, observation is fire-and-forget (does not extend op latency). */
  readonly fireAndForget?: boolean;
  observe(record: IMemoryObservationRecord): Promise<Result<unknown>>;
}
```

Observer errors never affect store operations — swallowed and logged at `warn`,
same as `IPromptObserver`.

### 7.2 Observation record

```typescript
export type MemoryObservationPhase = 'read' | 'write' | 'delete' | 'retrieve';

export interface IMemoryObservationRecord {
  readonly seq: number;           // library-assigned monotonic
  readonly timestamp: number;     // ms epoch
  readonly phase: MemoryObservationPhase;
  readonly scope: MemoryScopeKey;
  readonly id: MemoryId;
  readonly kind: Kind;
  readonly outcome: 'success' | 'failure';
  readonly error?: string;
  readonly provenance?: IProvenance;  // for writes; absent for reads
  readonly querySnapshot?: IMemoryQuery;  // for retrieve phase
}
```

### 7.3 `MemoryObservationStore`

Backed by `RetainingRingBuffer<IMemoryObservationRecord>` from
`libraries/ts-utils/src/packlets/collections/retainingRingBuffer.ts:99`
(the same substrate as `PromptObservationStore._buffer`).

```typescript
export class MemoryObservationStore implements IMemoryObserver {
  public static create(params: { maxRecords?: number; qualifierResolver?: IQualifierResolver }): Result<MemoryObservationStore>;
  public get lastSeq(): number;
  public query(criteria: IMemoryObservationQuery): ReadonlyArray<IMemoryObservationRecord>;
  public clear(): void;
  public observe(record: IMemoryObservationRecord): Promise<Result<unknown>>;
}
```

Schema-aware `query` supports: `sinceSeq`, `limit`, `since`/`until`, `scope`,
`kind`, `phase`, `outcome`, `filter`. Same injectable `IQualifierResolver` pattern
as `IPromptObservationQuery` (`observe/types.ts:248`).

---

## 8. L2 — agent tool surface

L2 wires memory operations as `IAiClientTool` instances for use with
`executeClientToolTurn` from `libraries/ts-extras/src/packlets/ai-assist/`.

### 8.1 Tool parameter authoring

All tools author params via `JsonSchema.object(...)` from
`libraries/ts-json-base/src/packlets/json-schema-builder/`. The schema IS the
validator — `schema.validate(args)` is the round-trip verify step, matching the
guidance in `LIBRARY_CAPABILITIES.md`.

### 8.2 Minimal proof-set (v0.1 tools)

Five tools constitute the proof set — enough to demonstrate the agent-curates-
substrate loop end-to-end (exploration §7 "one real L2 proof"):

```typescript
// Illustrative tool descriptors

const memoryWriteTool: IAiClientTool = {
  config: {
    name: 'memory_write',
    description: 'Store a new memory record or update an existing one by id. Idempotent: identical content returns the existing record.',
    parametersSchema: JsonSchema.object({
      scope: JsonSchema.string(),
      kind: JsonSchema.string(),
      body: JsonSchema.string(),   // serialized body; kind's Converter validates
      tags: JsonSchema.optional(JsonSchema.array(JsonSchema.string())),
      links: JsonSchema.optional(JsonSchema.array(linkEdgeSchema)),
      id: JsonSchema.optional(JsonSchema.string()),  // omit → generated
    })
  },
  // behavior hints for the agent (mirroring basic-memory's MCP annotations)
  // destructiveHint: false, idempotentHint: true, readOnlyHint: false
  execute: async (args) => { /* delegates to FileTreeMemoryStore.put */ }
};

const memoryReadTool: IAiClientTool = {
  config: {
    name: 'memory_read',
    description: 'Read a specific memory record by scope and id.',
    parametersSchema: JsonSchema.object({ scope: JsonSchema.string(), id: JsonSchema.string() })
  },
  // readOnlyHint: true, idempotentHint: true
  execute: async (args) => { /* delegates to FileTreeMemoryStore.get */ }
};

const memorySearchTool: IAiClientTool = {
  config: {
    name: 'memory_search',
    description: 'Search memories by tag, kind, or semantic text. Returns ranked results.',
    parametersSchema: JsonSchema.object({
      scope: JsonSchema.optional(JsonSchema.string()),
      tag: JsonSchema.optional(JsonSchema.string()),
      kind: JsonSchema.optional(JsonSchema.string()),
      semantic: JsonSchema.optional(JsonSchema.string()),  // requires IVectorIndex
      limit: JsonSchema.optional(JsonSchema.integer()),
    })
  },
  // readOnlyHint: true, openWorldHint: true
  execute: async (args) => { /* delegates to HybridRetriever.retrieve */ }
};

const memoryContextTool: IAiClientTool = {
  config: {
    name: 'memory_context',
    description: 'Build context graph from a seed memory: returns the seed record plus its linked neighbors up to `hops` hops.',
    parametersSchema: JsonSchema.object({
      scope: JsonSchema.string(),
      from: JsonSchema.string(),  // seed MemoryId
      hops: JsonSchema.optional(JsonSchema.integer()),  // default 1
    })
  },
  // readOnlyHint: true, openWorldHint: true
  execute: async (args) => { /* delegates to LinkTraversalRetriever */ }
};

const memoryDeleteTool: IAiClientTool = {
  config: {
    name: 'memory_delete',
    description: 'Delete a memory record. For temporal kinds: invalidates (sets invalid_at) rather than destroying. Destructive for non-temporal kinds.',
    parametersSchema: JsonSchema.object({ scope: JsonSchema.string(), id: JsonSchema.string() })
  },
  // destructiveHint: true, idempotentHint: false
  execute: async (args) => { /* delegates to FileTreeMemoryStore.delete */ }
};
```

### 8.3 MCP exposure (fast-follow)

The full tool set is exposed via `adaptMcpTools` from `@fgv/ts-extras-mcp`:

```typescript
// Full tool suite wired as MCP, after the minimal proof set ships
const { tools, skipped } = await adaptMcpTools(session, { logger }).orThrow();
```

Tools with `JsonSchema.object(...)` params pass `JsonSchema.fromJson` validation in
`adaptMcpTools` cleanly — the same schema is authored for both the direct
`IAiClientTool` path and the MCP exposure path.

### 8.4 Tool granularity note

The v0.1 proof set is five tools. basic-memory ships ~15 (exploration §8 OQ-8).
The full suite is deferred — granularity depends on agent ergonomics and
`personaility`'s agent design. The substrate and the minimal proof-set are
indifferent to final tool count.

---

## 9. L3 — ingest contract

### 9.1 Division of responsibility

**Host owns:** classification judgment, fact extraction, entity resolution choice.
**fgv owns:** typed validation boundary, content-hash dedup, edge/cycle safety,
provenance stamping, `contradicts`→temporal interlock.

This is the de-risked L3 scope from exploration §9.1 Tier 3 — the consumer's
pipeline feeds the substrate; we are the ingestion target, not a classifier engine.

### 9.2 Six-stage pipeline (Cognee ECL shape on fgv primitives)

The pipeline is the fgv-owned orchestrator. Host plugs in at steps 2, 3, and 5.

**Stage 1 — Intake**
fgv defines `IIngestItem` (an open-vocabulary tagged union):
```typescript
export interface IIngestItem {
  readonly sourceRef: string;    // stable reference back to source
  readonly content: string;      // raw text / serialized doc
  readonly contentType?: string; // mime type hint
  readonly [key: string]: unknown;
}
```
Host hands in `IIngestItem[]`. fgv does not own acquisition.

**Stage 2 — Classify**
Host implements `IMemoryClassifier`:
```typescript
export interface IClassification {
  readonly memoryWorthy: boolean;
  readonly kinds: ReadonlyArray<{ kind: Kind; confidence: number }>;
}

export interface IMemoryClassifier {
  classify(item: IIngestItem): Promise<Result<IClassification>>;
}
```
Host composes fgv primitives here: `classify`/`classifyAll` from
`@fgv/ts-extras-transformers`, or `callProviderEmbedding` from
`libraries/ts-extras/src/packlets/ai-assist/`, escalating to `generateJsonCompletion`
/ ollama `chatStructured` when warranted.

**Stage 3 — Extract**
Host implements `IFactExtractor`:
```typescript
export interface IFactExtractor {
  extract(
    item: IIngestItem,
    classification: IClassification
  ): Promise<Result<ReadonlyArray<ICandidateRecord>>>;
}

export interface ICandidateRecord {
  readonly envelope: Omit<IMemoryEnvelope, 'id' | 'contentHash' | 'created' | 'updated'>;
  readonly body: unknown;  // validated by fgv against kind's registered Converter
}
```
fgv validates every `ICandidateRecord.body` against the kind's registered
`Converter`/`JsonSchema` at the start of Stage 4. The JsonSchema-derives-T
principle (from `@fgv/ts-json-base`) ensures extraction schema and storage
validation schema cannot drift.

**Stage 4 — Resolve / dedup (fgv-owned)**
Two-layer deterministic dedup:
1. **Exact dedup:** `Crc32Normalizer.computeHash(canonicalize({ kind, body }))` →
   exact hash match → no-op (return existing record id).
2. **Near-dup / entity dedup (optional):** host provides `IEntityResolver`:
   ```typescript
   export interface IEntityResolver {
     resolve(
       candidate: ICandidateRecord,
       neighborhood: ReadonlyArray<IMemoryRecord>  // vector-similarity candidate-gen results
     ): Promise<Result<'new' | { decision: 'duplicate-of' | 'supersede' | 'merge-into'; id: MemoryId }>>;
   }
   ```
   When no `IEntityResolver` is wired, near-dup dedup is skipped (only exact-hash
   dedup applies). Degrades loudly via capability reporting.

**Stage 5 — Relate (host-assisted)**
Host optionally implements `IRelationExtractor`:
```typescript
export interface IRelationExtractor {
  relate(
    record: ICandidateRecord,
    neighborhood: ReadonlyArray<IMemoryRecord>  // surrounding graph context
  ): Promise<Result<ReadonlyArray<IEdge>>>;
}
```
fgv owns edge validation (attribute schema), write, and cycle-safety:
`Crc32Normalizer.computeHash(canonicalize(visitedSet))` as the cycle key, same
as the recursive resource binding in ts-prompt-assist.

**`contradicts` interlock:** if a proposed edge has `type: LinkType('contradicts')`
and the target record is a temporal kind, the orchestrator triggers the
`temporal-versioned` write policy (Stage 6) rather than plain upsert.

**Stage 6 — Load w/ provenance (fgv-owned)**
fgv writes the resolved record + edges:
- Stamps structured `IProvenance` (source item ref, producing classifier/model,
  confidence, `derivedFrom` back-link to source experience).
- Transaction time (`created`/`updated`) is free.
- Fires the observation hook (`IMemoryObserver.observe`).

### 9.3 Reader-and-writer dependency

The ingest pipeline is both a **reader** and **writer** of the substrate (exploration
§10.2). Stages 4 and 5 query the existing graph (vector similarity for dedup
candidate-gen; link/tag neighborhood for relation context) before writing. The
pipeline consumes `IMemoryRetriever` — a third reason substrate + search ship
before L3.

### 9.4 L3 sequencing

The ingest contract is designed here; implementation is commissioned when the host
wires its extractors. Substrate-first sequencing is load-bearing — the pipeline
cannot be delivered into nothing.

---

## 10. Package / packlet layout

### 10.1 Proposed structure

```
@fgv/ts-agent-memory            # libraries/ts-agent-memory/
  src/
    index.ts                    # public re-exports
    packlets/
      types/                    # MemoryId, Kind, Tag, MemoryScopeKey, EntityId, LinkType brands;
                                # IMemoryEnvelope, IEdge, ITemporalBlock, IProvenance,
                                # IMemoryRecord; per-kind write-policy enum; Convert constants
      converters/               # envelope Converter (Converters.object over YAML frontmatter +
                                # per-kind body dispatch via IBodyConverterRegistry);
                                # IBodyConverterRegistry interface + default impl
      store/                    # IMemoryStore; FileTreeMemoryStore; scope encoding;
                                # verifyFilenameId; write-lock; IMemoryStoreEvent
      index/                    # IMemoryIndex; derived backlink + byTag + byKind + byRecency;
                                # rebuild (full walk) + patch (incremental on put/delete)
      retrieve/                 # IMemoryRetriever; IMemoryQuery; IMemoryRetrieverCapabilities;
                                # RecencyRetriever, TagRetriever, LinkTraversalRetriever,
                                # StructuredFilterRetriever, SemanticRetriever,
                                # TemporalRetriever; HybridRetriever; IMergeStrategy
      vector/                   # IVectorIndex; InMemoryCosineIndex (reference impl, fast-follow);
                                # embed-on-write hook; re-embed-on-edit invalidation
      observe/                  # IMemoryObserver; IMemoryObservationRecord;
                                # IMemoryObservationQuery; MemoryObservationStore;
                                # IQualifierResolver (cloned from ts-prompt-assist)
      tools/                    # (L2) IAiClientTool factory set; behavior-hint metadata;
                                # tool suite factory (returns tool array for executeClientToolTurn)
      ingest/                   # (L3) IIngestItem; IMemoryClassifier; IFactExtractor;
                                # IEntityResolver; IRelationExtractor; ICandidateRecord;
                                # IMemoryIngestOrchestrator (fgv-owned stages 4-6);
                                # contradicts→temporal interlock
    test/
      unit/
        packlets/               # mirrors src/packlets/ layout
```

### 10.2 ts-prompt-assist shared-core extraction decision

**Decision: defer.** The overlap is real (~80% structural). The named seam is:
```
IFileTreeTypedRecordStore<TRecord> + IScopeChainResolver + RetainingRingBuffer-backed observe
```
Extraction is cheap under the lockstep version policy — one alpha bumps everyone.
But memory's write semantics, link/backlink index, temporal axis, and vector index
diverge enough from the read-only prompt store that freezing a shared interface now
would likely require breaking changes before memory ships. The `RetainingRingBuffer`
substrate is already de-facto shared at the primitive level
(`libraries/ts-utils/src/packlets/collections/retainingRingBuffer.ts`). Revisit
formal extraction once memory ships and the two stores' surfaces have demonstrably
converged.

### 10.3 Node-first + browser-sibling posture

`FileTree` is cross-runtime by design
(`libraries/ts-json-base/src/packlets/file-tree/fileTree.ts`) — the same interface
works over `FsTree` (Node), in-memory, zip (`ts-extras/zip-file-tree`), and browser
File System Access API (`ts-web-extras/file-tree`). The memory store is runtime-
agnostic as long as the injected `FileTree` backend is.

- Node default: `FsTree` via `@fgv/ts-json-base`.
- Browser: inject `FileTree` over File System Access API from `@fgv/ts-web-extras`.
- Test: in-memory FileTree (no filesystem dependency in tests).

The `vector/InMemoryCosineIndex` is pure arithmetic — no Node-specific dependency.
`callProviderEmbedding` (for embedding) has both Node and proxy paths.

No browser-sibling package (`@fgv/ts-web-agent-memory`) is required at v1. If
browser-native file-system persistence is needed, the consumer injects the
`@fgv/ts-web-extras` FileTree backend.

---

## 11. v1 first slice vs. deferred

### 11.1 Ships in v0.1 (the "real not a toy" bar)

These collectively demonstrate store→link→retrieve→audit end-to-end:

1. **Envelope + body.** `IMemoryEnvelope` Converter (YAML frontmatter via
   `Yaml.yamlConverter`); `IBodyConverterRegistry`; branded ids; `contentHash` via
   `Crc32Normalizer`. Extensible envelope (optional `temporal?` block present in the
   type; absent = zero-cost for atemporal kinds).
2. **Writable FileTree store.** `FileTreeMemoryStore` with `get`/`list`/`put`/`delete`
   over `IMutableFileTreeAccessors` (`fileTreeAccessors.ts:205,434`).
   Filename↔id verification. Content-hash dedup. Upsert + append-only + bounded-ring
   write policies (temporal-versioned deferred to fast-follow with vector).
3. **Derived index + non-vector retrievers.** Rebuild-on-walk index; `RecencyRetriever`,
   `TagRetriever`, `LinkTraversalRetriever` (bounded BFS, cycle-safe), `StructuredFilterRetriever`.
   `IVectorIndex` seam present (interface + `embeddingRef` field) but impl not wired.
4. **Observation/audit.** `MemoryObservationStore` (ring-backed, schema-aware query).
   Every `put`/`get`/`delete`/`retrieve` fires an observation.
5. **One L2 proof.** `memory_write` + `memory_read` + `memory_search` + `memory_context` +
   `memory_delete` tools wired through `executeClientToolTurn` in a
   `samples/testbed` scenario. Proves the agent-curates-substrate loop end-to-end.
   Not a full tool suite.

### 11.2 Immediate fast-follow (not gating v0.1, but close)

- `InMemoryCosineIndex` + `SemanticRetriever` + embed-on-write hook. (OQ-1
  resolved: build the minimal in-package cosine; large-N is out permanently.)
- `temporal-versioned` write policy + `temporal?` envelope block enforcement +
  `AsOfRetriever` / `CurrentValidRetriever` / `HistoryRetriever`.

### 11.3 Later (own stream or deferred)

- Full L2 tool suite (behavioral refinement, more tool types, edge-case coverage).
- MCP exposure via `adaptMcpTools`.
- L3 ingest orchestrator (`IMemoryIngestOrchestrator` + host interfaces). Own
  stream — commissioned when the host is ready to wire extractors.
- `watch` / change notification.
- Qualifier-conditional recall (ts-res candidate selection; seam is in scope
  encoding, which v1 ships).
- Shared-core extraction with `ts-prompt-assist`.
- Temporal query depth beyond point-in-time: state-transition timelines, full
  bi-temporal retrieval (OQ-9).

---

## 12. Open questions & pivots (hedged)

Each carries a recommended default and the pivot it represents.

---

**OQ-1 — Vector impl (RESOLVED in §9.3)**
Build the minimal in-package cosine (`InMemoryCosineIndex`). Large-N is explicitly
out. The minimal impl is the permanent answer. Seam ships in v0.1; impl is an
immediate fast-follow.

---

**OQ-2 — Writable store in ts-prompt-assist**
The prompt store stayed read-only at v0.1 by choice. Should the writable
`FileTreeMemoryStore` pattern backport?
- **Recommended default:** let memory prove the writable pattern; backport or extract
  jointly when shapes have converged.
- **Pivot:** backport now if a prompt-assist consumer needs write before memory
  ships. Cheap under lockstep; just not yet justified.

---

**OQ-3 — L3 home (REFRAMED in §9)**
The classifier/distillation pipeline is the consumer's. Our L3 surface is the
ingestion write/merge/provenance API.
- **Recommended default:** implement L3 as a packlet within `@fgv/ts-agent-memory`
  (`ingest/` packlet) — not a separate package — so the substrate and orchestrator
  ship together.
- **Pivot:** own package (`@fgv/ts-agent-memory-ingest`) if the host's pipeline
  grows complex enough to warrant separation. Defer this decision until L3 is
  commissioned.

---

**OQ-4 — Multi-hop graph depth**
Derived in-memory index covers tag + one-hop + bounded BFS. When does a consumer
need deeper?
- **Recommended default:** keep the derived in-memory index permanently for the
  fgv use case (thousands of records; exploration §9.1 large-N out).
- **Pivot:** a heavier index (SQLite-derived, like basic-memory) behind the same
  `IMemoryIndex` seam, without touching files. Add when a consumer demonstrates a
  multi-hop depth that BFS-over-in-mem cannot serve.

---

**OQ-5 — Scope/qualifier model depth**
Memory may need only flat scopes, or full ts-res qualifier-conditional recall
(per-tenant/language/persona).
- **Recommended default:** ship flat scopes (scope-encoded subtrees) in v1. Add
  qualifier-conditional recall (inject ts-res candidate selection) as an additive
  enhancement when `personaility` demonstrates a concrete per-context axis need.
- **Pivot:** full qualifier-conditional recall from v0.1 if the consumer's use case
  requires it (e.g. per-language memory variants). The seam (scope-encoded subtrees)
  is identical either way.

---

**OQ-6 — Per-kind write policy vocabulary**
v1 ships: upsert, append-only, bounded-ring, (fast-follow) temporal-versioned,
immutable. The concrete kinds and their policies are the consumer's domain model.
- **Recommended default:** keep the policy set open/pluggable at construction; ship
  the five named policies. Consumer registers which policy applies to each kind.
- **Pivot:** none needed — the pluggable-per-kind seam is stable.

---

**OQ-7 — Provenance/redaction for machine-made memories**
The observe pattern is most-permissive (stores bodies verbatim). Redaction and
retention are deployment policy.
- **Recommended default:** ship most-permissive. Consumer wraps `MemoryObservationStore`
  with a redacting `IMemoryObserver` or substitutes it entirely (per ts-prompt-assist
  `PromptObservationStore` precedent).
- **Pivot:** add a built-in redaction hook to `MemoryObservationStore.create` if
  there is a concrete multi-tenant requirement where PII cannot be retained.

---

**OQ-8 — Tool/MCP surface granularity**
Proof set is five tools. basic-memory ships ~15.
- **Recommended default:** ship the five-tool proof set in v0.1. Expand based on
  `personaility`'s agent ergonomics feedback.
- **Pivot:** ship the full suite immediately if consumer agent design is fixed and
  tool count is known. The substrate is indifferent.

---

**OQ-9 — Temporal query depth (exploration §9.3)**
Temporal capture (extensible envelope + per-kind invalidate-don't-delete) ships when
the temporal layer is wired. Query depth beyond point-in-time is the open question.
- **Recommended default:** ship `AsOfRetriever` (point-in-time) + `CurrentValidRetriever`
  + `HistoryRetriever` as the initial temporal retriever set. Full bi-temporal
  reasoning (state-transition timelines, LongMemEval-class queries) deferred.
- **Pivot:** deeper temporal query if `personaility`'s episodic pipeline requires
  "what did the agent believe about X between time A and time B?" queries. The
  capture is already in the envelope; the query layer is additive.

---

**OQ-10 — L3 host-interface granularity**
One opaque `IMemoryIngestor` vs. the four-stage split (`IMemoryClassifier` +
`IFactExtractor` + `IEntityResolver?` + `IRelationExtractor`).
- **Recommended default:** the staged split. fgv's dedup + provenance + temporal-
  interlock + cycle machinery (stages 4–6) is the value-add over a raw write API;
  a single opaque interface would push that machinery back onto the host. The staged
  split also makes each host-supplied component independently testable.
- **Pivot:** one `IMemoryIngestor` if the host's pipeline is fully integrated and
  the staged boundary adds friction rather than safety. This is a genuine design
  fork; decide when L3 is commissioned.

---

**OQ-11 (Phase-A seed) — Entity-id vs. version identity model for temporal kinds**
The recommended default is `entities/<entityId>/` subtree layout (§6.2) with
per-version files. This MUST be decided before Phase-A ships, as the identity model
affects file layout, index structure, and the temporal-versioned write policy.
- **Recommended default:** `entities/<entityId>/` subtree with
  `<entityId>-v<seq>.md` version files. Current = `invalid_at` null. Stable
  `entityId` is always the lookup key; version `id` is for direct access.
- **Pivot:** flat layout with a sidecar version-index file (`<entityId>.index.json`
  listing version ids). Simpler FileTree structure; more complex rebuild. Prefer
  the subtree layout because it is self-describing and rebuild-friendly.
- **Non-negotiable:** do NOT bake `id == filename == single current value` as a
  global assumption. Non-temporal kinds use it freely (`entityId === id`); temporal
  kinds must not be forced to break it.

---

**OQ-12 (Phase-A seed) — Episodic kind via bounded-ring write policy**
The substrate supports an `episode` kind with `bounded-ring` write policy
(`RetainingRingBuffer` shape, N most recent, `lastSeq` stable across eviction).
This is validated as a generality test in exploration §4 tension 5, NOT a build
target.
- **Recommended default:** do not build the episodic kind; let `personaility` define
  it if needed. The substrate provably supports it without reshaping.
- **Pivot:** build it if `personaility` replaces its existing episodic pipeline with
  this substrate.

---

**OQ-13 (Phase-A seed) — Host-interface granularity for IEntityResolver**
`IEntityResolver` is declared optional (Stage 4). Near-dup / entity dedup without
it falls back to exact-hash only.
- **Recommended default:** ship with `IEntityResolver` as optional; document the
  degradation clearly.
- **Pivot:** make `IEntityResolver` required if the host's pipeline can always
  supply one and the exact-hash-only fallback produces unacceptable near-dup rates.
  This can be decided at L3 commission time without reshaping earlier stages.
