# `@fgv/ts-agent-memory` — Design Lock

**Status:** Phase-A output. Produced 2026-06-25.
**Input contract:** `brief.md` (locked decisions) + `design.md` (platform design) + `consumer-requirements-personaility.md` (§3 required interfaces, §8 acceptance criteria).
**Deliverable:** implementation-ready interface signatures + verified merge-patch decision + knowledge-first build plan.

---

## 1. Scope & Inputs

### What is locked (from brief.md)

- **OQ-11 (domain-keyed identity):** `entityId` is consumer-supplied. `IIdentityCodec` maps domain key ⇄ `{ scope, idStem }`. Non-temporal: `id === idStem`, one file per entity. Three concrete codecs: knowledge / LTM / MTM. The codec owns filename-safe escaping and the flat-vs-versioned layout dispatch.
- **`IWritePolicy` per kind:** admission + `mutableFields` + `applyUpdate` via JSON Merge Patch over mutable fields. Content-hash dedup runs BEFORE policy.
- **Merge-patch composes `@fgv/ts-json` `JsonEditor`** (with options; see §5 for the verification result).
- **Scope:** L2 agent-tool surface and L3 ingest orchestrator are OUT of this build.

### What this document pins

- Exact TypeScript interface signatures for all invariant-core types (envelope, edges, provenance, ids, record).
- `IIdentityCodec` interface + three concrete codec mappings written out.
- `IMemoryStore` read/write/delete signatures with dedup and policy invocation sequenced.
- `IWritePolicy` interface + two concrete v1 policies + the JsonEditor verification + compose/extend decision.
- `IMemoryRetriever` + `IMemoryQuery` with the no-resignature guarantee.
- OQ-10/OQ-13 collapse (L3 granularity — out of this build, one-line disposition).
- Knowledge-first implementation plan (Phase B / Phase C / fast-follows).

---

## 2. Finalized Type Model

### 2.1 Branded Identifiers

Pattern: `brandedIdConverter` factory from `libraries/ts-prompt-assist/src/packlets/types/ids.ts:114`. Mirror exactly — non-empty, length-capped (256), whitespace-trimmed, optional reject-substring or pattern constraints.

```typescript
// libraries/ts-agent-memory/src/packlets/types/ids.ts

import { Brand, Converter, Converters, Result, fail, succeed } from '@fgv/ts-utils';

/** Stable file-stem identifier for a memory record (equals idStem). */
export type MemoryId = Brand<string, 'MemoryId'>;

/** Consumer-supplied domain key; stable entity identity across versions. */
export type EntityId = Brand<string, 'EntityId'>;

/** Open-vocabulary record classifier (consumer-registered per kind). */
export type Kind = Brand<string, 'Kind'>;

/** Open-vocabulary tag label. */
export type Tag = Brand<string, 'Tag'>;

/** Scope path segment (may be multi-segment for MTM: `conversations/<id>`). */
export type MemoryScopeKey = Brand<string, 'MemoryScopeKey'>;

/** Open-vocabulary link-relation type. */
export type LinkType = Brand<string, 'LinkType'>;

/**
 * Converter constants — same factory pattern as ts-prompt-assist Convert.promptId.
 * All constraints enforced at convert time; no manual typeof checks in consumers.
 */
export const Convert: {
  readonly memoryId: Converter<MemoryId>;
  readonly entityId: Converter<EntityId>;
  readonly kind: Converter<Kind>;
  readonly tag: Converter<Tag>;
  readonly scopeKey: Converter<MemoryScopeKey>;
  readonly linkType: Converter<LinkType>;
};
```

**Change from design.md §2.1:** `MemoryScopeKey` accepts multi-segment paths (e.g. `conversations/<id>`) for the MTM codec — the MTM scope is `conversations/<conversationId>`, which contains a `/`. The default scope-encoding from `ts-prompt-assist/scopeEncoding.ts` rejects `/`; the store must accept an injectable scope-encoding function that handles multi-segment paths (codec-provided). The `Convert.scopeKey` converter validates as a non-empty string without the POSIX single-segment constraint — the codec's own escaping is the safety gate.

### 2.2 Structured Provenance

No change from `design.md §2.2`. Confirmed as meeting consumer §3 ("opaque payload" for `ISentiment`, `IEpistemic`):

```typescript
export type ProvenanceSource = 'agent' | 'host-ingest' | 'human' | (string & {});

export interface IProvenance {
  readonly source: ProvenanceSource;
  readonly by?: string;
  readonly model?: string;
  readonly confidence?: number;
  /** Back-link to the source experience record. Enables cross-kind provenance spine. */
  readonly derivedFrom?: MemoryId;
  readonly [key: string]: unknown;
}
```

The `[key: string]: unknown` index signature satisfies no-`any` while allowing extension without resignature.

### 2.3 Attributed Edge (`IEdge`)

No change from `design.md §2.3`. Meets consumer §3.5 (edge kind, confidence, provenance, validity, cycle-safe). `IMtmRef` (PersonAIlity LTM→MTM nav ref) becomes one `IEdge` with `type: LinkType('mtm-ref')`:

```typescript
export interface IEdge {
  readonly type: LinkType;
  readonly target: MemoryId;
  readonly confidence?: number;
  readonly provenance?: IProvenance;
  /** World-truth validity start. Present only on temporal edges. */
  readonly valid_at?: number;
  /** World-truth validity end. Null = still valid. Absent = no temporal extent. */
  readonly invalid_at?: number | null;
}
```

### 2.4 Temporal Envelope Block

```typescript
export interface ITemporalBlock {
  readonly valid_at?: number;
  readonly invalid_at?: number | null;
}
```

Present only on temporal kinds; absent = zero-cost for atemporal kinds.

### 2.5 Invariant Envelope (`IMemoryEnvelope`)

**Change from design.md §2.5:** Added `seq` field (monotonic write counter per scope, assigned by the store on every write — analogous to `RetainingRingBuffer.seq`; enables stable cursor paging in the observation store and incremental index patching without a full walk).

```typescript
export interface IMemoryEnvelope {
  // --- Core identity ---
  /** Stable file-stem identifier. MUST equal filename stem (verifyFilenameId enforces). */
  readonly id: MemoryId;
  /** Consumer-supplied domain key. Equals id for non-temporal kinds. */
  readonly entityId: EntityId;
  /** Consumer-registered kind; dispatches body Converter. */
  readonly kind: Kind;
  readonly tags: ReadonlyArray<Tag>;
  readonly links: ReadonlyArray<IEdge>;

  // --- Transaction-time metadata (always present; free) ---
  /** Ms epoch — first write. Immutable after creation. */
  readonly created: number;
  /** Ms epoch — most recent write. */
  readonly updated: number;
  /**
   * Monotonic write counter within this store instance.
   * Assigned by the store on every put. Enables cursor-paging over observation
   * records without a full walk.
   */
  readonly seq: number;
  /**
   * CRC32 content hash over canonical { kind, body, links } via
   * Crc32Normalizer.computeHash(canonicalize(...)).
   * Dedup key: exact match = no-op upsert (returns existing record).
   * Source: libraries/ts-utils/src/packlets/hash/hashingNormalizer.ts:43
   */
  readonly contentHash: string;
  /** Structured provenance (never a flat enum). */
  readonly provenance: IProvenance;

  // --- Optional temporal block ---
  readonly temporal?: ITemporalBlock;

  /**
   * Vector index entry reference. Set by IVectorIndex.add on write.
   * Null = not embedded. Absent = same as null (backwards compat seam).
   */
  readonly embeddingRef?: string | null;
}
```

### 2.6 Per-Kind Body Converter Registry

**Change from design.md §2.6:** `convert` returns `Result<unknown>` and the `IBodyConverterRegistry` also exposes `getConverter` for implementors who need the raw converter (e.g. the temporal-versioned policy's `applyUpdate` needs to re-validate the patched body). Added `has` for existence check:

```typescript
export interface IBodyConverterRegistry {
  /** Register a Converter for a kind. Replaces any prior registration. */
  register<T>(kind: Kind, converter: Converter<T>): void;
  /** Register a JsonSchema validator for a kind (schema IS a Validator). */
  registerSchema<T>(kind: Kind, schema: ISchemaValidator<T>): void;
  /** Returns true if a converter is registered for the kind. */
  has(kind: Kind): boolean;
  /**
   * Convert an unknown body value for the given kind.
   * Returns fail('no converter registered for kind <k>') if unregistered.
   */
  convert(kind: Kind, body: unknown): Result<unknown>;
}
```

`ISchemaValidator<T>` comes from `libraries/ts-json-base/src/packlets/json-schema-builder/`.

### 2.7 Memory Record

```typescript
export interface IMemoryRecord<TBody = unknown> {
  readonly envelope: IMemoryEnvelope;
  readonly body: TBody;
}
```

Type parameter `TBody` narrows after `registry.convert()` returns and the caller casts (via a narrowing helper, not `as any`). The store's public `get`/`list` surface uses `IMemoryRecord<unknown>`; consumers narrow by checking `envelope.kind` and casting through the registered Converter result.

---

## 3. `IIdentityCodec`

### 3.1 Interface

The codec is the single source of truth for:
- How a consumer-supplied domain key maps to `{ scope, idStem }`.
- Filename-safe escaping of the idStem.
- The flat-vs-versioned layout dispatch (non-temporal: one file per entity; temporal: subtree).
- Reversibility: decode recovers `EntityId` from `{ scope, encodedStem }`.

```typescript
/**
 * Injected per kind; maps consumer domain key ⇄ FileTree storage address.
 * The codec owns all filename escaping so the store never touches raw domain keys.
 */
export interface IIdentityCodecResult {
  /** Scope path segment (may be multi-level for MTM: "conversations/<id>"). */
  readonly scope: MemoryScopeKey;
  /** Filename stem (the part before ".md"). Must be filename-safe after encoding. */
  readonly idStem: string;
  /**
   * Whether this kind uses versioned layout (temporal: multiple files per entity)
   * vs flat layout (one file per entity). Non-temporal = always false.
   */
  readonly isVersioned: boolean;
}

export interface IIdentityCodec {
  /**
   * Encode a consumer-supplied entity id to a FileTree address.
   * Deterministic and pure — no I/O.
   */
  encode(entityId: EntityId): Result<IIdentityCodecResult>;

  /**
   * Decode a FileTree address back to the original EntityId.
   * Must be the exact inverse of encode for non-versioned kinds.
   */
  decode(scope: MemoryScopeKey, encodedStem: string): Result<EntityId>;

  /**
   * For non-versioned kinds: assert that the round-trip
   * encode(decode(scope, stem)).idStem === stem
   * (used by verifyFilenameId during load).
   */
  verifyRoundTrip(scope: MemoryScopeKey, stem: string): Result<true>;
}
```

### 3.2 Three Concrete Codec Mappings

**Knowledge codec** (`KnowledgeIdentityCodec`)
- Input `entityId`: the consumer's `docId` (e.g. `"intro-to-rust"`).
- `encode`: scope = `MemoryScopeKey("knowledge")`, idStem = `entityId` (passthrough; validates filename-safe).
- `decode`: `EntityId(encodedStem)`.
- `isVersioned`: `false`.
- Escaping: validate idStem matches `[A-Za-z0-9._-]+` (POSIX portable filename set). Reject reserved Windows device names. Same constraints as `ts-prompt-assist/scopeEncoding.ts`.
- Layout: `vault/knowledge/<docId>.md`.

**LTM codec** (`LtmIdentityCodec`)
- Input `entityId`: `conversationId`.
- `encode`: scope = `MemoryScopeKey("conversations")`, idStem = `conversationId`.
- `decode`: `EntityId(encodedStem)`.
- `isVersioned`: `false` (v1 non-temporal; temporal variant is a fast-follow).
- Escaping: same POSIX portable filename set constraint.
- Layout: `vault/conversations/<conversationId>.md`.

**MTM codec** (`MtmIdentityCodec`)
- Input `entityId`: `<conversationId>:<turnIndex>` (colon-separated composite).
- `encode`:
  - Split on `:` → `conversationId`, `turnIndex`.
  - scope = `MemoryScopeKey("conversations/" + escape(conversationId))`.
  - idStem = `"turn-" + turnIndex`.
  - The `/` in the scope path is handled by the store's multi-segment scope resolver (not the single-segment default scope encoding from ts-prompt-assist).
- `decode`: scope `"conversations/<id>"` + stem `"turn-<N>"` → EntityId `"<id>:<N>"`.
- `isVersioned`: `false`.
- Escaping: `conversationId` validated against POSIX portable set (no `/`, `:`, etc.). `turnIndex` validated as a non-negative integer string.
- Layout: `vault/conversations/<conversationId>/turn-<N>.md`.

### 3.3 `verifyFilenameId` Usage

`verifyFilenameId` runs on every file loaded from the FileTree. It:
1. Calls `codec.decode(scope, file.baseName)` to get the expected `EntityId`.
2. Calls `codec.encode(entityId)` to recover `{ scope, idStem }`.
3. Asserts `idStem === file.baseName`. Mismatch = loud `Result.fail`.

Pattern mirrors `libraries/ts-prompt-assist/src/packlets/store/fileTreePromptStore.ts:73-83`.

### 3.4 Flat-vs-Versioned Layout Dispatch

The store uses `codec.encode(entityId).isVersioned` to decide:
- `false`: `<scopeDir>/<idStem>.md` — one file per entity; `put` overwrites via `saveFileContents`.
- `true` (temporal, fast-follow): `<scopeDir>/entities/<entityId>/` subtree with `<entityId>-v<seq>.md` version files; `put` writes new version + patches `invalid_at` on prior.

The store never inspects the entity id format directly; all layout decisions go through the codec.

---

## 4. `IMemoryStore`

### 4.1 Store Contract

**Changes from design.md §3.1:**
- `get` now takes `EntityId` (not `MemoryId` + scope), routing through the codec — this is the keyed-read the consumer requires in §3.2 ("keyed lookup by entity id"). The store resolves `EntityId` → `{ scope, idStem }` → file path via the registered codec for the kind. Added a `getById` (by raw `MemoryId` + scope) for direct access.
- `list` filter extended with `asOf` for temporal query (present, optional; no-op in v1 without temporal retriever wired).
- `put` accepts `IMemoryRecord<unknown>` (envelope + body); the store validates `body` via the registry before writing.
- `delete` marks temporal kinds via `invalid_at` (soft-delete); destroys non-temporal files.
- Explicit `IDisposable` import needed; mirrors `ts-prompt-assist/store/interfaces.ts:55`.

```typescript
export interface IMemoryStoreListFilter {
  readonly scope?: MemoryScopeKey;
  readonly kind?: Kind;
  readonly tag?: Tag;
  /** For temporal kinds: return only records valid at this epoch ms. */
  readonly asOf?: number;
}

export interface IMemoryStoreEvent {
  readonly type: 'put' | 'delete';
  readonly scope: MemoryScopeKey;
  readonly id: MemoryId;
  readonly kind: Kind;
}

export interface IDisposable {
  dispose(): void;
}

export interface IMemoryStore {
  // --- Read ---

  /**
   * Keyed read by entity id.
   * Resolves entityId via the registered IIdentityCodec for the given kind.
   * Returns undefined if no record exists.
   */
  get(kind: Kind, entityId: EntityId): Promise<Result<IMemoryRecord<unknown> | undefined>>;

  /**
   * Direct lookup by (scope, MemoryId). For internal use and temporal version access.
   * Returns undefined if not found.
   */
  getById(scope: MemoryScopeKey, id: MemoryId): Promise<Result<IMemoryRecord<unknown> | undefined>>;

  /**
   * List records. Applies filter in-memory over the derived index.
   * For large vaults, prefer IMemoryRetriever (which can use the index directly).
   */
  list(filter?: IMemoryStoreListFilter): Promise<Result<ReadonlyArray<IMemoryRecord<unknown>>>>;

  // --- Write ---

  /**
   * Write a record. Sequence:
   * 1. Validate body via IBodyConverterRegistry.
   * 2. Compute contentHash over { kind, body, links }.
   * 3. If existing record with same contentHash: return it (no-op dedup).
   * 4. Apply IWritePolicy for the kind (admission + mutable-field merge for updates).
   * 5. Write file via IMutableFileTreeAccessors.saveFileContents.
   * 6. Patch in-memory index (byKind, byTag, byRecency, backlinks).
   * 7. Fire IMemoryObserver (fire-and-forget or awaited per observer config).
   * Returns the written (or existing for dedup no-op) record.
   */
  put(record: IMemoryRecord<unknown>): Promise<Result<IMemoryRecord<unknown>>>;

  /**
   * Delete a record by (kind, entityId).
   * Non-temporal kinds: physical file delete via IMutableFileTreeAccessors.deleteFile.
   * Temporal kinds: sets invalid_at = Date.now() on the current-valid version file.
   * Returns the MemoryId of the deleted/invalidated record.
   */
  delete(kind: Kind, entityId: EntityId): Promise<Result<MemoryId>>;

  // --- Change notification (deferred; mirrors IPromptStore.watch posture) ---
  watch?(handler: (event: IMemoryStoreEvent) => void): IDisposable;
}
```

### 4.2 Content-Hash Dedup Sequence (on `put`)

1. `body` validated via `registry.convert(kind, rawBody)` → typed body or `Result.fail`.
2. Canonical form: `Crc32Normalizer.computeHash(canonicalize({ kind, body, links }))` using `libraries/ts-utils/src/packlets/hash/hashingNormalizer.ts:43` (`computeHash`) and `Normalizer.canonicalize` (RFC 8785 canonical JSON, stable key ordering).
3. Index lookup: if any record in the scope with `envelope.contentHash === computed` → return that record unchanged. **No write. No policy invocation.**
4. Policy invoked only when dedup does not trigger.

### 4.3 Write-Lock Posture

A single async mutex per `FileTreeMemoryStore` instance serializes concurrent `put`/`delete` calls. The FileTree is source of truth; the in-memory index is patched post-write. No optimistic locking — the expected scale (thousands of records) does not warrant it.

### 4.4 Store Factory

```typescript
export interface IFileTreeMemoryStoreCreateParams {
  /** Root: must be IMutableFileTreeDirectoryItem from fileTreeAccessors.ts:251 */
  readonly root: FileTree.IMutableFileTreeDirectoryItem;
  readonly registry: IBodyConverterRegistry;
  /** Per-kind write policies. Missing kinds → default 'upsert' policy. */
  readonly writePolicies?: ReadonlyMap<Kind, IWritePolicy>;
  /** Per-kind identity codecs. Required for non-trivial kinds. */
  readonly codecs?: ReadonlyMap<Kind, IIdentityCodec>;
  /** Default codec for kinds without an explicit codec entry (passthrough). */
  readonly defaultCodec?: IIdentityCodec;
  /** Scope encoding for the multi-segment MTM scope path. Default: reject '/'. */
  readonly scopeEncoding?: (scope: MemoryScopeKey) => Result<string>;
  readonly observers?: ReadonlyArray<IMemoryObserver>;
  readonly vectorIndex?: IVectorIndex;
}

export class FileTreeMemoryStore implements IMemoryStore {
  private constructor(/* internal params */) {}

  public static create(params: IFileTreeMemoryStoreCreateParams): Result<FileTreeMemoryStore>;
}
```

---

## 5. `IWritePolicy`

### 5.1 JsonEditor Merge-Patch Verification

**Source read:** `libraries/ts-json/src/packlets/editor/jsonEditor.ts` and `common.ts`.

**Findings:**

`JsonEditor.mergeObjectInPlace` processes source properties into target using `_mergeClonedProperty` (`jsonEditor.ts:350`).

Key behaviors:
1. **`null` handling:** `_mergeClonedProperty` line 365: `if (newValue === null && state.options.merge?.nullAsDelete === true) { delete target[key]; }`. **Default `nullAsDelete` is `false` (`common.ts:167`).** By default, `null` is treated as a regular JSON value (merged in), NOT as a deletion signal.
2. **RFC-7386 requires `null` = delete.** The default behavior diverges from RFC-7386 JSON Merge Patch here.
3. **Nested objects:** deep-merges recursively (`jsonEditor.ts:378-383`: if `isJsonObject(newValue)` and `isJsonObject(existing)`, calls `mergeObjectInPlace` recursively). This IS RFC-7386 compliant.
4. **Arrays:** default `arrayMergeBehavior: 'append'` (`common.ts:161-162`). RFC-7386 requires arrays to be replaced wholesale. **This diverges from RFC-7386.**
5. **Rules (templates, conditionals, multivalue, references):** active by default; these process Mustache-style template keys which is non-RFC-7386 behavior.

**Verdict:** `JsonEditor` as-is with default options does NOT implement RFC-7386 JSON Merge Patch for two reasons:
- `nullAsDelete` defaults to `false`; RFC-7386 requires `null` = delete.
- `arrayMergeBehavior` defaults to `'append'`; RFC-7386 requires array replacement.

**Decision: compose `JsonEditor` with explicit options — DO NOT hand-roll, DO NOT extend the primitive.**

The divergences are resolved via `JsonEditor.create` options that are already present on the existing surface. No new exports are needed:

```typescript
// The RFC-7386-compliant merge options for use in IWritePolicy.applyUpdate
const MERGE_PATCH_OPTIONS: Partial<IJsonEditorOptions> = {
  merge: {
    nullAsDelete: true,       // RFC-7386: null = delete key
    arrayMergeBehavior: 'replace'  // RFC-7386: arrays replaced wholesale
  },
  // Disable template/conditional/multivalue/reference rules — memory bodies
  // are plain data, not template-expanded JSON.
};
// Created once at store construction; shared across policy invocations:
const mergePatchEditor = JsonEditor.create(MERGE_PATCH_OPTIONS, []).orThrow();
```

The editor is created with an empty rules array (`[]`) to disable template expansion. `JsonEditor.create` (`jsonEditor.ts:118`) accepts `rules?: IJsonEditorRule[]`; passing `[]` produces a plain object merger without rule processing. This is a composition of the existing surface — no extension required.

**Citation:** `libraries/ts-json/src/packlets/editor/common.ts:57-71` (merge options interface); `libraries/ts-json/src/packlets/editor/jsonEditor.ts:159-170` (`_getDefaultOptions` showing the defaults); `jsonEditor.ts:364-365` (nullAsDelete branch).

### 5.2 `IWritePolicy` Interface

```typescript
/**
 * Admission decision returned by IWritePolicy.admit.
 */
export type AdmissionDecision =
  | { readonly decision: 'accept' }
  | { readonly decision: 'reject'; readonly reason: string }
  | {
      readonly decision: 'cull-oldest';
      /** MemoryIds to evict before writing the incoming record. */
      readonly evict: ReadonlyArray<MemoryId>;
    };

/**
 * Per-kind write policy. Injected at store construction.
 * Invoked AFTER content-hash dedup (dedup is always pre-policy).
 */
export interface IWritePolicy {
  /**
   * Names of fields that are allowed to change on an update without
   * triggering a new entity (mutable fields). Immutable fields that
   * change constitute a new entity (contentHash differs → new record).
   * Used by applyUpdate to restrict which fields the patch may touch.
   */
  readonly mutableFields: ReadonlyArray<string>;

  /**
   * Determine whether the incoming record is admitted.
   * @param incoming - The record about to be written.
   * @param existing - Current records for this entityId in the scope
   *   (empty array on first write).
   * @returns AdmissionDecision.
   */
  admit(
    incoming: IMemoryRecord<unknown>,
    existing: ReadonlyArray<IMemoryRecord<unknown>>
  ): Result<AdmissionDecision>;

  /**
   * Apply a JSON Merge Patch update to the mutable fields of an existing record.
   * Called when the admission decision is 'accept' AND an existing record with the
   * same entityId exists (i.e. this is an update, not a first write).
   *
   * The patch must only touch fields declared in mutableFields.
   * The store validates this constraint after applyUpdate returns.
   *
   * @param existing - The current persisted record.
   * @param patch - A partial JSON object (Merge Patch format per RFC-7386).
   *   Null values delete the corresponding key.
   *   Only keys in mutableFields are applied; others are silently ignored by the store.
   * @returns The updated record (envelope + body). Must return Result<IMemoryRecord>.
   */
  applyUpdate(
    existing: IMemoryRecord<unknown>,
    patch: Record<string, unknown>
  ): Result<IMemoryRecord<unknown>>;
}
```

### 5.3 Two Concrete v1 Policies

**Knowledge LWW Policy** (`KnowledgeLwwPolicy`)

```typescript
export class KnowledgeLwwPolicy implements IWritePolicy {
  /**
   * Mutable fields: body fields the consumer may update without creating a
   * new knowledge entity. For knowledge docs: content, tags, links, provenance.
   * id, entityId, kind, created, contentHash are immutable.
   */
  readonly mutableFields = ['body', 'tags', 'links', 'provenance', 'embeddingRef'];

  admit(
    incoming: IMemoryRecord<unknown>,
    _existing: ReadonlyArray<IMemoryRecord<unknown>>
  ): Result<AdmissionDecision> {
    // Last-write-wins: always accept. No cap, no cull.
    return succeed({ decision: 'accept' });
  }

  applyUpdate(
    existing: IMemoryRecord<unknown>,
    patch: Record<string, unknown>
  ): Result<IMemoryRecord<unknown>> {
    // Apply patch via RFC-7386 JsonEditor to a mutable-fields-only view.
    // mergePatchEditor created with nullAsDelete:true, arrayMergeBehavior:'replace', rules:[].
    const mutableView: Record<string, unknown> = {};
    for (const field of this.mutableFields) {
      if (field in (existing as Record<string, unknown>)) {
        mutableView[field] = (existing as Record<string, unknown>)[field];
      }
    }
    return mergePatchEditor
      .mergeObjectInPlace(mutableView as JsonObject, patch as JsonObject)
      .onSuccess((merged) => {
        // Reconstruct record with updated mutable fields.
        return succeed({
          envelope: { ...existing.envelope, ...merged, updated: Date.now() },
          body: merged['body'] ?? existing.body
        } as IMemoryRecord<unknown>);
      });
  }
}
```

**Memory Cap-Cull Policy** (`MemoryCapCullPolicy`)

Used for `ISummarizedTurnMemory` / `ISummarizedConversationMemory` (bounded-ring admission):

```typescript
export interface IMemoryCapCullPolicyParams {
  /** Maximum number of records per entityId. Default: no cap (undefined). */
  readonly maxRecords?: number;
  /** Fields the consumer may update via merge-patch. */
  readonly mutableFields: ReadonlyArray<string>;
}

export class MemoryCapCullPolicy implements IWritePolicy {
  readonly mutableFields: ReadonlyArray<string>;
  private readonly _maxRecords: number | undefined;

  private constructor(params: IMemoryCapCullPolicyParams) {
    this.mutableFields = params.mutableFields;
    this._maxRecords = params.maxRecords;
  }

  public static create(params: IMemoryCapCullPolicyParams): Result<MemoryCapCullPolicy> {
    return captureResult(() => new MemoryCapCullPolicy(params));
  }

  admit(
    incoming: IMemoryRecord<unknown>,
    existing: ReadonlyArray<IMemoryRecord<unknown>>
  ): Result<AdmissionDecision> {
    if (this._maxRecords === undefined || existing.length < this._maxRecords) {
      return succeed({ decision: 'accept' });
    }
    // Cap exceeded: evict oldest by `envelope.created` ascending.
    const toEvict = [...existing]
      .sort((a, b) => a.envelope.created - b.envelope.created)
      .slice(0, existing.length - this._maxRecords + 1)
      .map((r) => r.envelope.id);
    return succeed({ decision: 'cull-oldest', evict: toEvict });
  }

  applyUpdate(
    existing: IMemoryRecord<unknown>,
    patch: Record<string, unknown>
  ): Result<IMemoryRecord<unknown>> {
    // Same RFC-7386 merge-patch as LWW, restricted to mutableFields.
    // mergePatchEditor: nullAsDelete:true, arrayMergeBehavior:'replace', rules:[].
    const mutableView: Record<string, unknown> = {};
    for (const field of this.mutableFields) {
      if (field in (existing as Record<string, unknown>)) {
        mutableView[field] = (existing as Record<string, unknown>)[field];
      }
    }
    return mergePatchEditor
      .mergeObjectInPlace(mutableView as JsonObject, patch as JsonObject)
      .onSuccess((merged) => {
        return succeed({
          envelope: { ...existing.envelope, ...merged, updated: Date.now() },
          body: merged['body'] ?? existing.body
        } as IMemoryRecord<unknown>);
      });
  }
}
```

**Note on `RetainingRingBuffer`:** The cap-cull policy's admission logic conceptually mirrors `RetainingRingBuffer` eviction (`libraries/ts-utils/src/packlets/collections/retainingRingBuffer.ts`). However, the ring buffer is an in-memory data structure — it cannot directly drive file deletion. The policy produces an `evict: MemoryId[]` list; the store executes the file deletions and index patches. This is the correct boundary: policy decides; store acts.

---

## 6. `IMemoryRetriever` + Query Model

### 6.1 No-Resignature Guarantee

The `IMemoryQuery` interface carries `semantic` and `asOf` as optional fields from day one. The `IMemoryRetrieverCapabilities` interface lets consumers probe support before calling. This means:

- Adding a vector backend: implement `SemanticRetriever`, wire `IVectorIndex`, set `supportsSemanticRecall: true`. No interface change.
- Adding a temporal backend: implement temporal indexing, set `supportsTemporalQuery: true`. No interface change.
- Adding cross-kind filters: extend `IMemoryQuery` with new optional fields. Existing retrievers ignore unknown fields. No resignature.

### 6.2 Exact Signatures

```typescript
export interface IMemoryRetrieverCapabilities {
  /** Semantic/vector recall is operational (IVectorIndex wired). */
  readonly supportsSemanticRecall: boolean;
  /** Temporal "as-of" queries are operational (temporal index wired). */
  readonly supportsTemporalQuery: boolean;
  /** Link traversal is supported (in-memory backlink index present). */
  readonly supportsLinkTraversal: boolean;
}

export interface IMemoryQuery {
  /** Restrict to records in this scope. */
  readonly scope?: MemoryScopeKey;
  /** Restrict to records with this tag (exact match). */
  readonly tag?: Tag;
  /** Restrict to records with this kind. */
  readonly kind?: Kind;
  /** Restrict to records linked FROM this id (outbound from linkedFrom). */
  readonly linkedFrom?: MemoryId;
  /** Restrict to records linked TO this id (backlinks into linkedTo). */
  readonly linkedTo?: MemoryId;
  /** BFS hop count for link traversal. Default: 1. */
  readonly hops?: number;
  /**
   * Text query for semantic/vector recall.
   * If set and supportsSemanticRecall is false: retriever returns
   *   Result.fail('semantic recall requires a vector index; none configured').
   */
  readonly semantic?: string;
  /** Top-K for semantic recall. Default: 10. */
  readonly topK?: number;
  /**
   * As-of epoch ms for temporal "valid at" queries.
   * If set and supportsTemporalQuery is false: retriever returns
   *   Result.fail('temporal query requires temporal index; none configured for kind <k>').
   */
  readonly asOf?: number;
  /** Maximum records to return. Applied after all other filters. */
  readonly limit?: number;
  /** Arbitrary predicate applied after kind/tag/scope pre-filter. */
  readonly filter?: (record: IMemoryRecord<unknown>) => boolean;
}

export interface IMemoryRetriever {
  /** Capabilities this retriever exposes. Check before dispatch. */
  readonly capabilities: IMemoryRetrieverCapabilities;
  /**
   * Retrieve records matching the query.
   * Returns Result.fail with a diagnostic message for unsupported capabilities
   * (never returns empty silently when a requested capability is absent).
   */
  retrieve(query: IMemoryQuery): Promise<Result<ReadonlyArray<IMemoryRecord<unknown>>>>;
}
```

### 6.3 v1 Retriever Set

All v1 retrievers live in `packlets/retrieve/`. Capabilities:

| Retriever | `supportsSemanticRecall` | `supportsTemporalQuery` | `supportsLinkTraversal` | Notes |
|---|---|---|---|---|
| `RecencyRetriever` | false | false | false | `byRecency` index, returns descending by `updated`. |
| `TagRetriever` | false | false | false | `byTag` exact match, recency-ordered within tag. |
| `LinkTraversalRetriever` | false | false | true | BFS from seed id over `backlinks`+`links[]`. Bounded by `hops` + visited-set cycle guard. Cycle key: `Crc32Normalizer.computeHash(canonicalize(visitedSetArray))`. |
| `StructuredFilterRetriever` | false | false | false | Applies `IMemoryQuery.filter` predicate over kind/tag pre-filter. |
| `SemanticRetriever` | true | false | false | Requires wired `IVectorIndex`. Degrades loudly. |
| `TemporalRetriever` | false | true | false | Requires temporal index. Degrades loudly. Fast-follow only. |
| `HybridRetriever` | (composes) | (composes) | (composes) | Union of composed retrievers; injectable `IMergeStrategy`. |

`HybridRetriever.create(retrievers, mergeStrategy): Result<HybridRetriever>` — capabilities are the union of composed retrievers' capabilities.

---

## 7. OQ-10/OQ-13 Collapse

**OQ-10** (L3 host-interface granularity: one opaque `IMemoryIngestor` vs. staged split) and **OQ-13** (whether `IEntityResolver` is optional or required) are both **out of this build**. L3 is deferred to its own stream. The decision is deferred until L3 is commissioned. The staged split design from `design.md §9` is the recommended default when that stream opens; no design work needed here.

One-line disposition: **defer; decide at L3 commission time; no impact on Phase B or Phase C.**

---

## 8. Knowledge-First Implementation Plan

### 8.1 Packlet Build Order

Dependencies flow: `types` → `converters` → `store` → `index` → `retrieve`. The `observe` packlet depends on `types` only. The `vector` packlet depends on `types` + (fast-follow) `@fgv/ts-extras/ai-assist`.

```
types/        # ids, envelope, edge, provenance, record, IIdentityCodec, IWritePolicy
converters/   # IBodyConverterRegistry impl; envelope Converter (YAML frontmatter + body dispatch)
store/        # IMemoryStore; FileTreeMemoryStore; write-lock; scope encoding; verifyFilenameId
index/        # IMemoryIndex; derived backlink + byTag + byKind + byRecency; rebuild + patch
retrieve/     # IMemoryRetriever; IMemoryQuery; all v1 retrievers; HybridRetriever
observe/      # IMemoryObserver; IMemoryObservationRecord; MemoryObservationStore (ring-backed)
vector/       # IVectorIndex seam only (interface + embeddingRef field); InMemoryCosineIndex deferred
```

### 8.2 Phase B — Knowledge Slice

**Goal:** the `IKnowledgeSearchProvider`-shaped surface the consumer adopts first. Zero memory-kind code; zero cap-cull; zero MTM/LTM codec.

**Files shipped:**

```
libraries/ts-agent-memory/
  package.json          # @fgv/ts-agent-memory; deps: ts-utils, ts-json-base, ts-json, ts-extras (Yaml)
  tsconfig.json
  jest.config.json
  src/
    index.ts            # public re-exports (types, store, retrieve)
    packlets/
      types/
        ids.ts          # MemoryId, EntityId, Kind, Tag, MemoryScopeKey, LinkType + Convert constants
        envelope.ts     # IMemoryEnvelope, IEdge, ITemporalBlock, IProvenance, IMemoryRecord
        identityCodec.ts  # IIdentityCodec, IIdentityCodecResult, KnowledgeIdentityCodec
        writePolicy.ts  # IWritePolicy, AdmissionDecision, KnowledgeLwwPolicy
        index.ts        # re-export
      converters/
        bodyConverterRegistry.ts  # IBodyConverterRegistry + default impl
        envelopeConverter.ts      # Converter<IMemoryEnvelope> via Converters.object (YAML frontmatter)
        index.ts
      store/
        fileTreeMemoryStore.ts  # FileTreeMemoryStore; IMemoryStore; verifyFilenameId; write-lock
        scopeEncoding.ts        # defaultMemoryScopeEncoding (multi-segment-aware)
        index.ts
      index/
        memoryIndex.ts   # IMemoryIndex; derived maps; rebuild; patch
        index.ts
      retrieve/
        retriever.ts          # IMemoryRetriever, IMemoryQuery, IMemoryRetrieverCapabilities
        recencyRetriever.ts
        tagRetriever.ts
        structuredFilterRetriever.ts
        hybridRetriever.ts    # HybridRetriever + IMergeStrategy
        index.ts
      observe/
        observer.ts            # IMemoryObserver, IMemoryObservationRecord, IMemoryObservationQuery
        memoryObservationStore.ts  # MemoryObservationStore (RetainingRingBuffer-backed)
        index.ts
      vector/
        vectorIndex.ts   # IVectorIndex interface only (no impl); seam for embeddingRef
        index.ts
    test/
      unit/
        packlets/
          types/...
          converters/...
          store/...
          index/...
          retrieve/...
          observe/...
```

**Acceptance subset (Phase B):**
- `IKnowledgeDoc` registerable as a kind body via `IBodyConverterRegistry.register`.
- `KnowledgeIdentityCodec` encodes/decodes `docId` → `{ scope: "knowledge", idStem: docId }`.
- `FileTreeMemoryStore.put` / `get` / `list` / `delete` working with `KnowledgeLwwPolicy`.
- Content-hash dedup (Crc32Normalizer, canonical JSON).
- `RecencyRetriever`, `TagRetriever`, `StructuredFilterRetriever`, `HybridRetriever`.
- `MemoryObservationStore` (ring-backed, schema-aware query).
- `IVectorIndex` interface present; `SemanticRetriever` returns loud `Result.fail` when no index wired.
- 100% test coverage; `rushx build` + `rushx lint` + `rushx test` green.
- No `any` anywhere.

**Dependency order within Phase B:**
1. `types/` (no deps within the package).
2. `converters/` (depends on `types/`).
3. `store/` (depends on `types/`, `converters/`).
4. `index/` (depends on `types/`, `store/`).
5. `retrieve/` (depends on `types/`, `index/`).
6. `observe/` (depends on `types/`).
7. `vector/` (interface only; depends on `types/`).
8. `index.ts` re-exports; `package.json` / build config.

### 8.3 Phase C — Memory Slice

**Goal:** experience kind families, attributed edges (cycle-safe), cap-cull/merge-patch write policies, MTM/LTM identity codecs, `LinkTraversalRetriever`.

**Adds / extends:**

```
packlets/
  types/
    writePolicy.ts  # + MemoryCapCullPolicy, IMemoryCapCullPolicyParams
    identityCodec.ts  # + LtmIdentityCodec, MtmIdentityCodec
  retrieve/
    linkTraversalRetriever.ts  # BFS with cycle guard
  # Everything else extends in-place (no new packlets)
```

**New consumer-facing surfaces:**
- `LtmIdentityCodec`: `conversationId` → `{ scope: "conversations", idStem: conversationId }`.
- `MtmIdentityCodec`: `<conversationId>:<turnIndex>` → `{ scope: "conversations/<conversationId>", idStem: "turn-<N>" }`.
- `MemoryCapCullPolicy`: cap-cull admission + RFC-7386 merge-patch on `mutableMemoryFields`.
- `LinkTraversalRetriever`: BFS from seed id, bounded by `hops`, cycle-safe.
- `ISummarizedTurnMemory` and `ISummarizedConversationMemory` registerable as kind bodies (consumer registers; fgv ships the plumbing).

**Acceptance subset (Phase C — cumulative, extends Phase B):**
- All three kind families registerable from one FileTree vault.
- MTM `(conversationId, turnIndex)` domain key maps correctly.
- `MemoryCapCullPolicy` evicts oldest on cap; merge-patch restricted to `mutableFields`.
- `LinkTraversalRetriever` BFS terminates on cycle; visited-set cycle key is hash-stable.
- Attributed edges written with confidence + provenance; cycle guard fires on self-loop and multi-hop cycle.

### 8.4 Fast-Follows (Post-v1)

- **Vector:** `InMemoryCosineIndex` (brute-force cosine; no external ANN) + `SemanticRetriever` operational + embed-on-write hook via `callProviderEmbedding` from `@fgv/ts-extras/ai-assist`.
- **Temporal:** `temporal-versioned` write policy + `ITemporalBlock` enforcement + `AsOfRetriever` / `CurrentValidRetriever` / `HistoryRetriever` + temporal codec variants.
- **Observe:** `MemoryObservationStore` is already planned in Phase B; fast-follow adds `qualifierResolver` injection for similarity-aware observation querying.
- **L2 tool surface:** five-tool proof set (`memory_write`, `memory_read`, `memory_search`, `memory_context`, `memory_delete`) wired via `executeClientToolTurn` in `samples/testbed`. Out of Phase B/C; own stream.
- **L3 ingest orchestrator:** own stream, commissioned when host extractors are ready.

---

## 9. Open Risks / Decisions for the Orchestrator

### 9.1 Unresolved Items

1. **Multi-segment scope encoding:** The MTM scope `"conversations/<conversationId>"` contains a `/`. The `ts-prompt-assist` `defaultScopeEncoding` rejects `/`. The store needs a multi-segment scope resolver that treats `/`-separated components individually (each component validated against the POSIX portable set) rather than treating the whole path as a single segment. This is not complex, but it is a new function that should be pinned in Phase B even though MTM codec ships in Phase C (the scope encoding API must accept multi-segment keys from day one so Phase C is additive). **Recommendation:** implement `defaultMemoryScopeEncoding` in Phase B that allows `/`-separated segments, each individually portable-filename-safe.

2. **YAML vs. Markdown frontmatter serialization:** `design.md` calls for `FileTree markdown+frontmatter`. The `ts-prompt-assist` store uses YAML files (`Yaml.yamlConverter` from `@fgv/ts-extras`). Memory records need YAML frontmatter (`---\n...\n---\n`) + markdown body. The `envelopeConverter.ts` must serialize/deserialize this format. A frontmatter splitter (no external dep; ~15 lines) splits the raw string on the `---` delimiters and feeds the YAML portion to `Yaml.yamlConverter`. The markdown portion is the record body (for text-based knowledge docs). This is straightforward but must be specified before Phase B implements `envelopeConverter.ts`. **No orchestrator action needed; Phase B implementer owns the frontmatter serialization detail.**

3. **`seq` counter scope:** The `IMemoryEnvelope.seq` field needs a monotonic counter. Question: per-store-instance global counter, or per-scope counter? Recommendation: per-store-instance global (simpler; observation records need a stable global cursor across scopes). **Recommendation: global counter on `FileTreeMemoryStore`, incremented atomically inside the write-lock on every successful `put`.**

### 9.2 Consumer §8 Acceptance Criteria Coverage Checklist

| Consumer §8 acceptance criterion | Where satisfied |
|---|---|
| Both kind families registerable from one FileTree vault, bodies Converter-validated, no `any`. | `IBodyConverterRegistry` (§2.6); `KnowledgeIdentityCodec` + `MtmIdentityCodec` + `LtmIdentityCodec` (§3); Phase B ships knowledge; Phase C ships experience. |
| Keyed read + metadata query (`Result`-returning), retrieval interface stable against future semantic backend. | `IMemoryStore.get(kind, entityId)` (§4.1); `IMemoryRetriever` + `IMemoryQuery` (§6.1-6.2) with `semantic`/`asOf` present-but-optional; capabilities reporting guarantees no resignature. |
| Attributed-edge write (cycle-safe) + content-hash dedup on write. | `IEdge` (§2.3); dedup sequence §4.2; cycle guard in `LinkTraversalRetriever` (§6.3) + edge validation at `put`. |
| Pluggable per-kind write policy accepting admission + mutable-field + merge-patch. | `IWritePolicy` (§5.2); `KnowledgeLwwPolicy` (§5.3); `MemoryCapCullPolicy` (§5.3); JsonEditor with `nullAsDelete:true`+`arrayMergeBehavior:'replace'` (§5.1). |
| All public surface returns `Result`, validates via Converters, does I/O through FileTree. | All store methods return `Promise<Result<...>>`; `IBodyConverterRegistry.convert` gates body; `IMutableFileTreeAccessors` is the only I/O surface (§4.1, §4.4). |
| OQ-11 resolved with documented domain-keyed-identity mapping. | §3: `IIdentityCodec` interface + three concrete codec mappings (knowledge/LTM/MTM). |

All six acceptance criteria are covered by the planned surface.

---

*End of design-lock.*
