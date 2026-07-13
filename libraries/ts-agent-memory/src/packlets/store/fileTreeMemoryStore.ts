/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Hash, Logging, Result, fail, mapResults, succeed } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
import {
  AdmissionDecision,
  DEFAULT_DEDUP_SCOPE,
  DedupScope,
  EntityId,
  IEdgeTarget,
  IIdentityCodec,
  IMemoryEnvelope,
  IMemoryRecord,
  IProvenance,
  ITemporalIdentityCodec,
  IWritePolicy,
  Kind,
  KnowledgeLwwPolicy,
  MemoryId,
  MemoryScopeKey,
  RankProjector,
  Tag,
  isTemporalIdentityCodec,
  isTemporalRecord,
  isVersionCurrent,
  selectCurrentVersion,
  selectVersionAsOf
} from '../types';
import { IBodyConverterRegistry as IRegistry, parseMemoryFile, serializeMemoryFile } from '../converters';
import { IIndexedMemoryRecord, IMemoryIndex, MemoryIndex } from '../index';
import {
  IMemoryObservationRecord,
  IMemoryObserver,
  MemoryObservationOutcome,
  MemoryObservationPhase
} from '../observe';
import { IMemoryRecordSource, IScopedMemoryRecord, IVectorIndex, MemoryEmbedder } from '../vector';
import { defaultMemoryScopeEncoding } from './scopeEncoding';

/** The on-disk extension for a memory record file. */
const MEMORY_FILE_EXTENSION: string = '.md';

/**
 * Filter for {@link IMemoryStore.list}. All present fields are ANDed together.
 * @public
 */
export interface IMemoryStoreListFilter {
  /** Restrict to records in this scope. */
  readonly scope?: MemoryScopeKey;
  /** Restrict to records of this kind. */
  readonly kind?: Kind;
  /** Restrict to records carrying this tag (exact match). */
  readonly tag?: Tag;
  /**
   * For temporal (versioned) kinds: collapse each entity to the single version
   * valid at this epoch ms. Non-temporal records are timeless and pass through
   * unchanged. Absent = no temporal projection (every version is returned).
   */
  readonly asOf?: number;
}

/**
 * The writable, FileTree-backed, content-hash-deduped memory store.
 * @public
 */
export interface IMemoryStore {
  /**
   * Keyed read by entity id. Resolves `entityId` to a storage address via the
   * registered {@link IIdentityCodec} for `kind`. Returns `undefined` when no
   * record exists. For a versioned (temporal) kind this returns the current
   * version, resolved from the derived in-memory index (not re-read/re-verified
   * from disk per call — the index is kept in sync with every write).
   */
  get(kind: Kind, entityId: EntityId): Promise<Result<IMemoryRecord<unknown> | undefined>>;

  /**
   * Direct read by `(scope, MemoryId)`. Returns `undefined` when not found.
   */
  getById(scope: MemoryScopeKey, id: MemoryId): Promise<Result<IMemoryRecord<unknown> | undefined>>;

  /**
   * List records, filtered in-memory over the derived index.
   */
  list(filter?: IMemoryStoreListFilter): Promise<Result<ReadonlyArray<IMemoryRecord<unknown>>>>;

  /**
   * List EVERY record in the vault, each paired with its scope-qualified
   * `(scope, id)` address — the projection {@link IMemoryRecordSource} requires.
   * Unlike {@link IMemoryStore.list | list}, it takes no filter (whole-vault) and
   * returns {@link IScopedMemoryRecord}s so a re-index keys each entry on the same
   * scoped target the incremental embed-on-write path uses. Two records that share
   * a filename stem across scopes appear as distinct entries.
   */
  listScoped(): Promise<Result<ReadonlyArray<IScopedMemoryRecord>>>;

  /**
   * Adapt this store to the {@link IMemoryRecordSource} seam so it can drive
   * {@link IVectorIndex} rebuilds (e.g. `InMemoryCosineIndex.rebuild`). The
   * returned source's `list()` delegates to {@link IMemoryStore.listScoped}. The
   * store cannot implement {@link IMemoryRecordSource} directly because its
   * `list(filter?)` returns bare records (the ergonomic query surface) while the
   * seam's `list()` returns scope-qualified records.
   */
  asRecordSource(): IMemoryRecordSource;

  /**
   * Write a record. Validates the body, computes a content hash, deduplicates
   * (scope-wide, before policy), applies the kind's {@link IWritePolicy}, stamps
   * transaction-time metadata (`created` / `updated` / `seq` / `contentHash`),
   * writes the file, and patches the index. Returns the written record — or the
   * existing record unchanged on a dedup no-op.
   */
  put(record: IMemoryRecord<unknown>): Promise<Result<IMemoryRecord<unknown>>>;

  /**
   * Delete a record by `(kind, entityId)`. Non-temporal kinds physically delete
   * the file and return the deleted record's {@link MemoryId}. Temporal
   * (versioned) kinds SOFT-delete: the current version is invalidated
   * (`invalid_at` set), history is retained, and the invalidated version's
   * {@link MemoryId} is returned.
   */
  delete(kind: Kind, entityId: EntityId): Promise<Result<MemoryId>>;
}

/**
 * Parameters for {@link FileTreeMemoryStore.create}.
 * @public
 */
export interface IFileTreeMemoryStoreCreateParams {
  /** Root directory under which scope-encoded sub-trees live. Must be mutable. */
  readonly root: FileTree.IMutableFileTreeDirectoryItem;
  /** Per-kind body converter registry. Gates every body on write and read. */
  readonly registry: IRegistry;
  /** Per-kind write policies. Kinds without an entry use a default LWW policy. */
  readonly writePolicies?: ReadonlyMap<Kind, IWritePolicy>;
  /** Per-kind identity codecs. */
  readonly codecs?: ReadonlyMap<Kind, IIdentityCodec>;
  /**
   * Optional per-kind host projector map. When a kind has an entry, the store
   * runs the projector on the fully-resolved (post-merge) record on every put
   * AND every update — in the same pass that recomputes `contentHash` — and
   * stamps the numeric result into {@link IMemoryEnvelope.rank}, which the index's
   * rank view and `orderBy: 'rank'` retrieval sort by (descending, absent last).
   * Absent for a kind → that kind's records carry no `rank`. Purely additive and
   * zero-overhead when unwired: an absent map leaves every write byte-identical.
   * The projector is a host callback — a throw is logged at `warn` and the record
   * is stamped with no `rank`, never failing the write (mirrors the store's other
   * guard-host-callbacks conventions).
   */
  readonly rankProjectors?: ReadonlyMap<Kind, RankProjector>;
  /** Default codec for kinds without an explicit entry. */
  readonly defaultCodec?: IIdentityCodec;
  /** Scope encoding. Defaults to {@link defaultMemoryScopeEncoding}. */
  readonly scopeEncoding?: (scope: MemoryScopeKey) => Result<string>;
  /**
   * Transaction-time clock. Defaults to `Date.now`. Injectable so tests can
   * make `created` / `updated` deterministic. Also stamps observation
   * `timestamp`s.
   */
  readonly clock?: () => number;
  /**
   * Optional observers fired once per public `get` / `put` / `delete` call.
   * Purely additive — when absent, no observation records are produced and the
   * store behaves exactly as it did without this parameter. Observer errors
   * never affect the store operation (swallowed, logged to {@link
   * IFileTreeMemoryStoreCreateParams.logger | logger} at `warn`).
   */
  readonly observers?: ReadonlyArray<IMemoryObserver>;
  /**
   * Diagnostic logger for swallowed observer failures. Defaults to a
   * `Logging.NoOpLogger`.
   */
  readonly logger?: Logging.ILogger;
  /**
   * Optional vector index for semantic recall. Wired together with
   * {@link IFileTreeMemoryStoreCreateParams.embed | embed}: when both are present
   * the store embeds each written record and maintains the index on
   * `put` / `delete` / cap-cull eviction. Absent (or `embed` absent) → no
   * embedding work happens and the store behaves exactly as it does without this
   * parameter (the additive, zero-overhead-when-unwired default — mirrors the
   * observer hook).
   */
  readonly vectorIndex?: IVectorIndex;
  /**
   * Optional embedder applied to each record on write, wired together with
   * {@link IFileTreeMemoryStoreCreateParams.vectorIndex | vectorIndex}. The
   * consumer supplies it (e.g. `callProviderEmbedding` or in-process
   * transformers); the store never calls an embedding provider directly, so the
   * core stays embedder-agnostic. Embedding/index maintenance is **best-effort**:
   * a failed (or throwing) `embed` / `add` / `remove` is logged at `warn` via
   * {@link IFileTreeMemoryStoreCreateParams.logger | logger} and the record
   * operation still succeeds — the vector index is a derived view that a later
   * `rebuild` reconciles, so a vector failure never fails an authoritative write.
   */
  readonly embed?: MemoryEmbedder;
}

/**
 * The internal outcome of a locked `put`: the written (or existing, on a
 * dedup no-op) record plus the {@link MemoryId}s evicted by a `cull-oldest`
 * admission decision. The eviction file-deletes and index patches happen
 * inside the write-lock; the `evicted` ids are surfaced so the public `put`
 * can fire one `'delete'` observation per evicted record AFTER the lock
 * releases — consistent with the post-op firing of the other observation
 * hooks, and avoiding observer re-entrancy into the still-held write-lock.
 */
interface IPutOutcome {
  readonly record: IMemoryRecord<unknown>;
  readonly evicted: ReadonlyArray<MemoryId>;
}

interface IInternalParams {
  readonly root: FileTree.IMutableFileTreeDirectoryItem;
  readonly registry: IRegistry;
  readonly writePolicies: ReadonlyMap<Kind, IWritePolicy>;
  readonly codecs: ReadonlyMap<Kind, IIdentityCodec>;
  readonly rankProjectors: ReadonlyMap<Kind, RankProjector>;
  readonly defaultCodec?: IIdentityCodec;
  readonly defaultPolicy: IWritePolicy;
  readonly scopeEncoding: (scope: MemoryScopeKey) => Result<string>;
  readonly clock: () => number;
  readonly index: IMemoryIndex;
  readonly observers: ReadonlyArray<IMemoryObserver>;
  readonly logger: Logging.ILogger;
  readonly vectorIndex?: IVectorIndex;
  readonly embed?: MemoryEmbedder;
}

/**
 * Flat-layout, FileTree-backed {@link IMemoryStore}. The FileTree is the source
 * of truth; the {@link IMemoryIndex} is a derived in-memory view patched on
 * every write. Concurrent writes are serialized through a per-instance async
 * write-lock so the index and the on-disk files never interleave.
 *
 * @remarks
 * Bodies are string (markdown). Both layouts are supported: flat
 * (one-file-per-entity, non-versioned) and versioned (subtree-per-entity,
 * invalidate-don't-delete), dispatched per kind by the codec's `isVersioned`
 * flag. A kind is flat with zero behavioral impact unless it opts into a
 * {@link ITemporalIdentityCodec}.
 * @public
 */
export class FileTreeMemoryStore implements IMemoryStore {
  private readonly _root: FileTree.IMutableFileTreeDirectoryItem;
  private readonly _registry: IRegistry;
  private readonly _writePolicies: ReadonlyMap<Kind, IWritePolicy>;
  private readonly _codecs: ReadonlyMap<Kind, IIdentityCodec>;
  private readonly _rankProjectors: ReadonlyMap<Kind, RankProjector>;
  private readonly _defaultCodec: IIdentityCodec | undefined;
  private readonly _defaultPolicy: IWritePolicy;
  private readonly _scopeEncoding: (scope: MemoryScopeKey) => Result<string>;
  private readonly _clock: () => number;
  private readonly _index: IMemoryIndex;
  private readonly _hasher: Hash.Crc32Normalizer;
  private readonly _observers: ReadonlyArray<IMemoryObserver>;
  private readonly _logger: Logging.ILogger;
  private readonly _vectorIndex: IVectorIndex | undefined;
  private readonly _embed: MemoryEmbedder | undefined;

  /** Monotonic write counter; incremented inside the write-lock on each put. */
  private _seq: number;
  /**
   * Monotonic observation-sequence counter. A distinct authority from `_seq`
   * (the envelope write counter): it numbers the audit stream so a single
   * {@link MemoryObservationStore} fed by this store sees strictly increasing
   * `seq`, satisfying the ring buffer's cursor contract.
   */
  private _observationSeq: number;
  /** Tail of the write-lock promise chain that serializes mutating ops. */
  private _writeTail: Promise<unknown>;

  /**
   * The record-level mutable-field vocabulary: maps a declared mutable field
   * name to its canonical location on a record. Used to project an incoming
   * record into a merge-patch on update. B1 ships the knowledge-LWW surface
   * (body + envelope metadata); body-internal mutable fields (Phase-C cap-cull)
   * extend this map.
   */
  private static readonly _mutableFieldAccessors: ReadonlyMap<
    string,
    (record: IMemoryRecord<unknown>) => unknown
  > = new Map<string, (record: IMemoryRecord<unknown>) => unknown>([
    ['body', (r) => r.body],
    ['tags', (r) => r.envelope.tags],
    ['links', (r) => r.envelope.links],
    ['provenance', (r) => r.envelope.provenance],
    ['embeddingRef', (r) => r.envelope.embeddingRef]
  ]);

  private constructor(params: IInternalParams) {
    this._root = params.root;
    this._registry = params.registry;
    this._writePolicies = params.writePolicies;
    this._codecs = params.codecs;
    this._rankProjectors = params.rankProjectors;
    this._defaultCodec = params.defaultCodec;
    this._defaultPolicy = params.defaultPolicy;
    this._scopeEncoding = params.scopeEncoding;
    this._clock = params.clock;
    this._index = params.index;
    this._hasher = new Hash.Crc32Normalizer();
    this._observers = params.observers;
    this._logger = params.logger;
    this._vectorIndex = params.vectorIndex;
    this._embed = params.embed;
    this._seq = 0;
    this._observationSeq = 0;
    this._writeTail = Promise.resolve();
  }

  /**
   * Family-convention factory. Builds the derived index and a default LWW
   * policy, then performs an initial FileTree walk so an existing vault is
   * indexed (and the `seq` counter resumes past the highest persisted `seq`).
   */
  public static create(params: IFileTreeMemoryStoreCreateParams): Result<FileTreeMemoryStore> {
    return KnowledgeLwwPolicy.create().onSuccess((defaultPolicy) =>
      MemoryIndex.create().onSuccess((index) => {
        const store: FileTreeMemoryStore = new FileTreeMemoryStore({
          root: params.root,
          registry: params.registry,
          writePolicies: params.writePolicies ?? new Map<Kind, IWritePolicy>(),
          codecs: params.codecs ?? new Map<Kind, IIdentityCodec>(),
          rankProjectors: params.rankProjectors ?? new Map<Kind, RankProjector>(),
          defaultCodec: params.defaultCodec,
          defaultPolicy,
          scopeEncoding: params.scopeEncoding ?? defaultMemoryScopeEncoding,
          clock: params.clock ?? Date.now,
          index,
          observers: params.observers ?? [],
          logger: params.logger ?? new Logging.NoOpLogger(),
          vectorIndex: params.vectorIndex,
          embed: params.embed
        });
        return store._initialIndex().onSuccess(() => succeed(store));
      })
    );
  }

  /** {@inheritDoc IMemoryStore.get} */
  public async get(kind: Kind, entityId: EntityId): Promise<Result<IMemoryRecord<unknown> | undefined>> {
    const result: Result<IMemoryRecord<unknown> | undefined> = this._codecFor(kind).onSuccess((codec) =>
      codec.encode(entityId).onSuccess((addr) => {
        if (addr.isVersioned) {
          if (!isTemporalIdentityCodec(codec)) {
            return fail(
              `memory get '${entityId}': codec for versioned kind '${kind}' does not implement the temporal codec interface`
            );
          }
          // Versioned keyed read resolves the CURRENT version (highest-seq
          // version whose `invalid_at` is null/absent) from the entity subtree,
          // read off the derived index. `asOf` resolution is via `list({ asOf })`
          // and the temporal retrievers.
          return succeed(this._readVersionedCurrent(addr.scope));
        }
        return this._readRecord(addr.scope, addr.idStem);
      })
    );
    await this._fireObservation('read', kind, entityId, {
      outcome: result.isSuccess() ? 'success' : 'failure',
      id: result.isSuccess() ? result.value?.envelope.id : undefined,
      error: result.isFailure() ? result.message : undefined
    });
    return result;
  }

  /** {@inheritDoc IMemoryStore.getById} */
  public async getById(
    scope: MemoryScopeKey,
    id: MemoryId
  ): Promise<Result<IMemoryRecord<unknown> | undefined>> {
    return this._readRecord(scope, id);
  }

  /** {@inheritDoc IMemoryStore.list} */
  public async list(filter?: IMemoryStoreListFilter): Promise<Result<ReadonlyArray<IMemoryRecord<unknown>>>> {
    const matches: IMemoryRecord<unknown>[] = this._index
      .entries()
      .filter((entry) => {
        if (filter?.scope !== undefined && entry.scope !== filter.scope) {
          return false;
        }
        if (filter?.kind !== undefined && entry.record.envelope.kind !== filter.kind) {
          return false;
        }
        if (filter?.tag !== undefined && !entry.record.envelope.tags.includes(filter.tag)) {
          return false;
        }
        return true;
      })
      .map((entry) => entry.record);
    if (filter?.asOf === undefined) {
      // No temporal projection requested: byte-identical to the pre-temporal
      // behavior (the flat-path guarantee — every version is returned).
      return succeed(matches);
    }
    return succeed(FileTreeMemoryStore._projectAsOf(matches, filter.asOf));
  }

  /** {@inheritDoc IMemoryStore.listScoped} */
  public async listScoped(): Promise<Result<ReadonlyArray<IScopedMemoryRecord>>> {
    // The derived index already carries each record's scope
    // ({@link IIndexedMemoryRecord.scope}), so the scoped projection is a direct
    // map — the record's `(scope, id)` is exactly the address the vector index
    // keys on. No filter/temporal projection: the seam re-embeds the whole vault.
    return succeed(
      this._index.entries().map((entry) => ({
        target: { scope: entry.scope, id: entry.record.envelope.id },
        record: entry.record
      }))
    );
  }

  /** {@inheritDoc IMemoryStore.asRecordSource} */
  public asRecordSource(): IMemoryRecordSource {
    return { list: (): Promise<Result<ReadonlyArray<IScopedMemoryRecord>>> => this.listScoped() };
  }

  /**
   * Collapse temporal records to the single version valid at `asOf` per entity;
   * non-temporal records are timeless and pass through unchanged (valid-time
   * `asOf` applies only to versioned kinds; transaction-time / full bi-temporal
   * filtering is deferred — OQ-9). An entity with no version valid at `asOf`
   * contributes nothing.
   */
  private static _projectAsOf(
    records: ReadonlyArray<IMemoryRecord<unknown>>,
    asOf: number
  ): ReadonlyArray<IMemoryRecord<unknown>> {
    const passthrough: IMemoryRecord<unknown>[] = [];
    const groups: Map<string, IMemoryRecord<unknown>[]> = new Map<string, IMemoryRecord<unknown>[]>();
    for (const record of records) {
      if (!isTemporalRecord(record)) {
        passthrough.push(record);
        continue;
      }
      const key: string = `${record.envelope.kind}\0${record.envelope.entityId}`;
      const existing: IMemoryRecord<unknown>[] | undefined = groups.get(key);
      if (existing === undefined) {
        groups.set(key, [record]);
      } else {
        existing.push(record);
      }
    }
    const result: IMemoryRecord<unknown>[] = [...passthrough];
    for (const versions of groups.values()) {
      const valid: IMemoryRecord<unknown> | undefined = selectVersionAsOf(versions, asOf);
      if (valid !== undefined) {
        result.push(valid);
      }
    }
    return result;
  }

  /** {@inheritDoc IMemoryStore.put} */
  public async put(record: IMemoryRecord<unknown>): Promise<Result<IMemoryRecord<unknown>>> {
    const result: Result<IPutOutcome> = await this._enqueue(() => this._putLocked(record));
    await this._fireObservation('write', record.envelope.kind, record.envelope.entityId, {
      outcome: result.isSuccess() ? 'success' : 'failure',
      id: result.isSuccess() ? result.value.record.envelope.id : record.envelope.id,
      provenance: record.envelope.provenance,
      error: result.isFailure() ? result.message : undefined
    });
    // Fire one `'delete'` observation per record evicted by cap-cull. The
    // evicted records are always in the same `(scope, kind)` cohort as the
    // incoming record, so resolving the scope from the incoming `entityId`
    // yields the evicted record's scope; the observation records the evicted
    // record's own `id`. A no-op / first-write / reject path yields no
    // evictions, so this loop is empty there.
    if (result.isSuccess()) {
      for (const evictedId of result.value.evicted) {
        await this._fireObservation('delete', record.envelope.kind, record.envelope.entityId, {
          outcome: 'success',
          id: evictedId
        });
      }
    }
    return result.onSuccess((outcome) => succeed(outcome.record));
  }

  /** {@inheritDoc IMemoryStore.delete} */
  public async delete(kind: Kind, entityId: EntityId): Promise<Result<MemoryId>> {
    const result: Result<MemoryId> = await this._enqueue(() => this._deleteLocked(kind, entityId));
    await this._fireObservation('delete', kind, entityId, {
      outcome: result.isSuccess() ? 'success' : 'failure',
      id: result.isSuccess() ? result.value : undefined,
      error: result.isFailure() ? result.message : undefined
    });
    return result;
  }

  /**
   * Serialize a mutating task behind the write-lock. Tasks run in submission
   * order; a failed task does not break the chain for subsequent ones.
   */
  private _enqueue<T>(task: () => Promise<Result<T>>): Promise<Result<T>> {
    const result: Promise<Result<T>> = this._writeTail.then(task);
    this._writeTail = result.then(
      () => undefined,
      () => undefined
    );
    return result;
  }

  /**
   * Build and fan out one observation record for a completed op. A no-op when no
   * observers are wired (the additive-default path pays nothing). The store is
   * the seq authority — it mints `seq` / `timestamp` so every observer sees the
   * same record. The scope is resolved best-effort via the codec.
   */
  private async _fireObservation(
    phase: MemoryObservationPhase,
    kind: Kind,
    entityId: EntityId,
    details: {
      readonly outcome: MemoryObservationOutcome;
      readonly id?: MemoryId;
      readonly provenance?: IProvenance;
      readonly error?: string;
    }
  ): Promise<void> {
    if (this._observers.length === 0) {
      return;
    }
    const record: IMemoryObservationRecord = {
      seq: ++this._observationSeq,
      timestamp: this._clock(),
      phase,
      scope: this._scopeBestEffort(kind, entityId),
      id: details.id,
      kind,
      outcome: details.outcome,
      error: details.error,
      provenance: details.provenance
    };
    const awaited: Promise<void>[] = [];
    for (const observer of this._observers) {
      if (observer.fireAndForget === true) {
        // Intentionally not awaited: a fire-and-forget observer must not extend
        // the store op's latency. `_safeObserve` swallows internally; the
        // `.catch` keeps the detached promise from being flagged as floating.
        this._safeObserve(observer, record).catch(() => undefined);
      } else {
        awaited.push(this._safeObserve(observer, record));
      }
    }
    await Promise.all(awaited);
  }

  /** Invoke one observer, swallowing any failure or throw (logged at `warn`). */
  private async _safeObserve(observer: IMemoryObserver, record: IMemoryObservationRecord): Promise<void> {
    try {
      const observed: Result<unknown> = await observer.observe(record);
      if (observed.isFailure()) {
        this._warnSwallowed(`memory observer failed (swallowed): ${observed.message}`);
      }
    } catch (error) {
      this._warnSwallowed(`memory observer threw (swallowed): ${String(error)}`);
    }
  }

  /**
   * Log a swallowed-issue warning (observer failure or best-effort vector
   * maintenance), tolerating a logger that itself throws — diagnostic logging
   * must never make a store op reject.
   */
  private _warnSwallowed(message: string): void {
    try {
      this._logger.warn(message);
    } catch {
      // Diagnostic logging must not affect the store operation.
    }
  }

  /** Resolve a scope for an observation, best-effort (undefined when unresolvable). */
  private _scopeBestEffort(kind: Kind, entityId: EntityId): MemoryScopeKey | undefined {
    return this._codecFor(kind)
      .onSuccess((codec) => codec.encode(entityId))
      .onSuccess((addr) => succeed(addr.scope))
      .orDefault();
  }

  private async _putLocked(record: IMemoryRecord<unknown>): Promise<Result<IPutOutcome>> {
    const envelope: IMemoryEnvelope = record.envelope;
    if (typeof record.body !== 'string') {
      return fail(
        `memory put '${envelope.id}': only string (markdown) bodies are supported (got ${typeof record.body})`
      );
    }
    const body: string = record.body;
    // Resolve the body converter + codec, then dispatch on layout. The flat
    // (non-versioned) path keeps its exact dedup/policy ordering; the versioned
    // path is a wholly separate branch so the flat path is behaviorally
    // unchanged (the consumer adoption guarantee).
    return this._registry
      .convert(envelope.kind, body)
      .withErrorFormat((msg) => `memory put '${envelope.id}': invalid body: ${msg}`)
      .onSuccess(() => this._codecFor(envelope.kind))
      .thenOnSuccess((codec) =>
        codec.encode(envelope.entityId).thenOnSuccess((addr) => {
          if (addr.isVersioned) {
            if (!isTemporalIdentityCodec(codec)) {
              return Promise.resolve(
                fail<IPutOutcome>(
                  `memory put '${envelope.entityId}': codec for versioned kind '${envelope.kind}' does not implement the temporal codec interface`
                )
              );
            }
            return this._putVersioned(record, body, codec, addr.scope);
          }
          if (envelope.id !== addr.idStem) {
            return Promise.resolve(
              fail<IPutOutcome>(
                `memory put: envelope id '${envelope.id}' does not match codec-derived stem '${addr.idStem}'`
              )
            );
          }
          return this._contentHash(envelope.kind, body, envelope.links).thenOnSuccess((hash) =>
            this._writeResolved(record, body, addr.scope, addr.idStem, hash)
          );
        })
      );
  }

  /**
   * Run dedup → policy → stamp → embed → write for a resolved address and content
   * hash. Async because the embed-on-write hook (when wired) does a network call
   * or in-process inference; the whole chain runs inside the write-lock so the
   * vector index, the on-disk file, and the derived index never interleave.
   */
  private async _writeResolved(
    record: IMemoryRecord<unknown>,
    body: string,
    scope: MemoryScopeKey,
    idStem: string,
    hash: string
  ): Promise<Result<IPutOutcome>> {
    const policy: IWritePolicy = this._policyFor(record.envelope.kind);
    const dedupScope: DedupScope = policy.dedupScope ?? DEFAULT_DEDUP_SCOPE;
    // Content-hash dedup runs BEFORE policy. Its granularity is the kind's
    // `dedupScope`:
    //   - 'content': an identical { kind, body, links } triple ANYWHERE in the
    //     scope (even under a different id) is a no-op (knowledge family).
    //   - 'entity' (default): only an identical re-put of the SAME id is a no-op;
    //     two distinct entities with identical content never collapse (experience
    //     families). The same-id check is folded into the `_readRecord` below.
    // (Tags / provenance are metadata and are NOT part of the hash; see
    // design-lock §2.5.)
    if (dedupScope === 'content') {
      // Cross-id content collapse: an identical { kind, body, links } triple under
      // a DIFFERENT id is a no-op (knowledge family). A same-id match is excluded
      // here and falls through to the LWW path below so a metadata-only revision
      // (tags / provenance — outside the content hash but inside the policy's
      // mutableFields) actually applies. Content-dedup must never shadow LWW for
      // the same entity.
      const duplicate: IMemoryRecord<unknown> | undefined = this._findByContentHash(
        scope,
        hash,
        record.envelope.id
      );
      if (duplicate !== undefined) {
        return succeed({ record: duplicate, evicted: [] });
      }
    }
    return this._readRecord(scope, idStem).thenOnSuccess((existing) => {
      // Same-id re-put is a no-op ONLY when the content hash matches AND the
      // mutable metadata is also unchanged. The content hash covers
      // { kind, body, links }; a matching hash with revised tags/provenance is a
      // real update that must reach applyUpdate, not be swallowed as a duplicate
      // (both dedup scopes).
      if (
        existing !== undefined &&
        existing.envelope.contentHash === hash &&
        this._isMutableMetadataUnchanged(existing, record)
      ) {
        return Promise.resolve(succeed({ record: existing, evicted: [] }));
      }
      // The admission cohort is the set of records the policy's cap applies to:
      // every record in this scope of this kind EXCEPT the target id. On a first
      // write the post-write count is `cohort.length + 1`; on an update the prior
      // same-id record is excluded so the count is still `cohort.length + 1`
      // (a replace, not a grow). The same-id `existing` record is threaded
      // separately into `_buildRecord` for the merge-patch. Knowledge LWW ignores
      // this argument, so its behavior is unchanged by the wider cohort.
      const cohort: ReadonlyArray<IMemoryRecord<unknown>> = this._admissionCohort(
        scope,
        record.envelope.kind,
        idStem
      );
      return policy
        .admit(record, cohort)
        .thenOnSuccess((decision) =>
          this._admitWrite(record, body, scope, idStem, hash, policy, existing, decision)
        );
    });
  }

  /**
   * Build → embed → persist → evict for an admitted write.
   *
   * The durable record store is authoritative; the vector index is a **derived,
   * rebuildable** view, so vector maintenance is **best-effort** — a failed embed
   * or `add` is logged and the durable write still succeeds (the index can be
   * rebuilt via {@link InMemoryCosineIndex.rebuild}). Only genuine record-store
   * failures (body/codec/policy, persist, file eviction) fail the `put`.
   *
   * Ordering: the embed + `add` run immediately before the single `_persist` so
   * the index-returned `embeddingRef` lands in one durable write (a post-persist
   * stamp would need a second write whose failure path is effectively untestable).
   * Build and persist the replacement BEFORE evicting the cull-oldest cohort, so a
   * later eviction failure never loses data with nothing written in its place.
   */
  private async _admitWrite(
    record: IMemoryRecord<unknown>,
    body: string,
    scope: MemoryScopeKey,
    idStem: string,
    hash: string,
    policy: IWritePolicy,
    existing: IMemoryRecord<unknown> | undefined,
    decision: AdmissionDecision
  ): Promise<Result<IPutOutcome>> {
    if (decision.decision === 'reject') {
      return fail(`memory put: rejected by policy: ${decision.reason}`);
    }
    return this._buildRecord(record, body, existing, policy, hash)
      .onSuccess((built) => succeed(this._stampRank(built)))
      .thenOnSuccess((built) => this._embedOnWrite(built, scope))
      .onSuccess((embeddedBuilt) => this._persist(embeddedBuilt, scope, idStem))
      .thenOnSuccess(async (persisted) => {
        // Everything after the authoritative `_persist` commit is best-effort and
        // never turns a committed write into a `Failure`:
        //   - a cull-oldest eviction that fails is logged (the per-(scope,kind)
        //     cap may be transiently exceeded; the next write's admission restores
        //     it), and only the successfully-evicted ids flow onward;
        //   - vector pruning of the evicted cohort is likewise best-effort.
        const evicted: ReadonlyArray<MemoryId> = this._applyEvictions(decision, scope);
        await this._removeEvictedVectors(evicted, scope);
        return succeed({ record: persisted, evicted });
      });
  }

  /**
   * Best-effort embed-on-write. When a vector index AND an embedder are wired,
   * embeds the built record, `add`s the vector (replace semantics handle a same-id
   * re-embed — no explicit remove), and stamps the returned `embeddingRef`. A
   * failure (returned `fail` OR a thrown/rejected hook) is logged and the
   * unembedded record is returned unchanged — the put still persists, and the
   * derived index is reconciled by a later `rebuild`. A pass-through no-op when
   * unwired (byte-identical record).
   *
   * Always succeeds (`Result` is the chain's shape, never a vector-induced
   * failure).
   */
  private async _embedOnWrite(
    built: IMemoryRecord<string>,
    scope: MemoryScopeKey
  ): Promise<Result<IMemoryRecord<string>>> {
    if (this._vectorIndex === undefined || this._embed === undefined) {
      return succeed(built);
    }
    const vectorIndex: IVectorIndex = this._vectorIndex;
    const embed: MemoryEmbedder = this._embed;
    const target: IEdgeTarget = { scope, id: built.envelope.id };
    const embedded: Result<Float32Array> = await this._tryVectorOp(
      () => embed(built),
      `embedding '${built.envelope.id}'`
    );
    if (embedded.isFailure()) {
      return succeed(built);
    }
    const added: Result<string> = await this._tryVectorOp(
      () => vectorIndex.add(target, embedded.value),
      `vector add for '${built.envelope.id}'`
    );
    if (added.isFailure()) {
      return succeed(built);
    }
    return succeed({ envelope: { ...built.envelope, embeddingRef: added.value }, body: built.body });
  }

  /**
   * Evict the records named by a `cull-oldest` decision, best-effort. Runs only
   * after the authoritative `_persist`, so a failed eviction is logged (never
   * fatal) and the cap self-corrects on the next admission. Returns the ids that
   * were actually evicted (so observations / vector pruning cover only those).
   * `accept` / `reject` decisions evict nothing.
   */
  private _applyEvictions(decision: AdmissionDecision, scope: MemoryScopeKey): ReadonlyArray<MemoryId> {
    if (decision.decision !== 'cull-oldest') {
      return [];
    }
    const evicted: MemoryId[] = [];
    for (const id of decision.evict) {
      const result: Result<MemoryId> = this._evict(scope, id);
      if (result.isSuccess()) {
        evicted.push(result.value);
      } else {
        this._warnSwallowed(
          `memory put: best-effort eviction of '${id}' failed (cap may be transiently exceeded; restored on the next write): ${result.message}`
        );
      }
    }
    return evicted;
  }

  /**
   * Best-effort vector removal for each evicted record (never fails the put).
   * Every evicted record is in the same `scope` as the incoming write (the
   * cull-oldest cohort is the incoming record's `(scope, kind)` cohort), so that
   * scope qualifies each removal target.
   */
  private async _removeEvictedVectors(
    evicted: ReadonlyArray<MemoryId>,
    scope: MemoryScopeKey
  ): Promise<void> {
    for (const id of evicted) {
      await this._removeVectorBestEffort({ scope, id });
    }
  }

  /**
   * Run a consumer-supplied vector hook, normalizing a thrown/rejected hook into a
   * `Failure` and logging any failure at `warn`. Best-effort: the caller proceeds
   * regardless, since the index is rebuildable.
   */
  private async _tryVectorOp<T>(op: () => Promise<Result<T>>, label: string): Promise<Result<T>> {
    let result: Result<T>;
    try {
      result = await op();
    } catch (err) {
      result = fail(`${label} threw: ${String(err)}`);
    }
    if (result.isFailure()) {
      this._warnSwallowed(
        `memory: ${label} failed (best-effort; vector index left for rebuild): ${result.message}`
      );
    }
    return result;
  }

  /**
   * Best-effort vector removal. A no-op unless the full vector lifecycle is wired
   * (both an index AND an embedder), so an unwired store does no vector work and
   * behaves byte-identically. Failures are logged, never surfaced — a committed
   * delete/eviction must not fail because a derived index could not be pruned.
   */
  private async _removeVectorBestEffort(target: IEdgeTarget): Promise<void> {
    if (this._vectorIndex === undefined || this._embed === undefined) {
      return;
    }
    const vectorIndex: IVectorIndex = this._vectorIndex;
    await this._tryVectorOp(() => vectorIndex.remove(target), `vector removal for '${target.id}'`);
  }

  /**
   * Build the record to persist. On a first write the incoming envelope is the
   * base (final content equals the incoming content, so the dedup `hash` is
   * reused). On an update the incoming record's mutable fields are projected into
   * a merge-patch and the policy's `applyUpdate` merges them over the existing
   * record (preserving `created`); the persisted body and `contentHash` are then
   * taken from the policy's actual output, so a body-transforming policy is never
   * bypassed and the stored hash always matches the stored `{ kind, body, links }`.
   * The store stamps the transaction-time metadata it owns
   * (`created` / `updated` / `seq` / `contentHash`).
   */
  private _buildRecord(
    incoming: IMemoryRecord<unknown>,
    body: string,
    existing: IMemoryRecord<unknown> | undefined,
    policy: IWritePolicy,
    hash: string
  ): Result<IMemoryRecord<string>> {
    const now: number = this._clock();
    const seq: number = ++this._seq;
    if (existing === undefined) {
      return succeed({
        envelope: { ...incoming.envelope, created: now, updated: now, seq, contentHash: hash },
        body
      });
    }
    const patch: Record<string, unknown> = this._projectMutablePatch(incoming, policy.mutableFields);
    return policy
      .applyUpdate(existing, patch)
      .withErrorFormat((msg) => `memory put '${incoming.envelope.id}': update failed: ${msg}`)
      .onSuccess((updated) => {
        if (typeof updated.body !== 'string') {
          return fail(
            `memory put '${incoming.envelope.id}': policy returned a non-string body (${typeof updated.body})`
          );
        }
        const finalBody: string = updated.body;
        return this._contentHash(updated.envelope.kind, finalBody, updated.envelope.links).onSuccess(
          (finalHash) =>
            succeed({
              envelope: {
                ...updated.envelope,
                created: existing.envelope.created,
                updated: now,
                seq,
                contentHash: finalHash
              },
              body: finalBody
            })
        );
      });
  }

  /** Serialize and write a fully-stamped record, then patch the index. */
  private _persist(
    record: IMemoryRecord<string>,
    scope: MemoryScopeKey,
    idStem: string
  ): Result<IMemoryRecord<unknown>> {
    return serializeMemoryFile(record.envelope, record.body)
      .onSuccess((raw) => this._writeFile(scope, idStem, raw))
      .onSuccess(() => this._index.patch('put', { scope, record }))
      .onSuccess(() => succeed(record));
  }

  private async _deleteLocked(kind: Kind, entityId: EntityId): Promise<Result<MemoryId>> {
    return this._codecFor(kind).thenOnSuccess((codec) =>
      codec.encode(entityId).thenOnSuccess((addr) => {
        if (addr.isVersioned) {
          if (!isTemporalIdentityCodec(codec)) {
            return Promise.resolve(
              fail<MemoryId>(
                `memory delete '${entityId}': codec for versioned kind '${kind}' does not implement the temporal codec interface`
              )
            );
          }
          return this._deleteVersioned(entityId, addr.scope);
        }
        return this._deleteFlat(entityId, addr.scope, addr.idStem);
      })
    );
  }

  /**
   * Flat (non-versioned) delete: physically remove the record file + index
   * entry, then prune the vector best-effort. Structurally unchanged from the
   * pre-temporal delete path.
   */
  private async _deleteFlat(
    entityId: EntityId,
    scope: MemoryScopeKey,
    idStem: string
  ): Promise<Result<MemoryId>> {
    return this._readRecord(scope, idStem).thenOnSuccess((existing) => {
      if (existing === undefined) {
        return Promise.resolve(fail<MemoryId>(`memory delete '${entityId}': no record found`));
      }
      // Delete the record file + index entry (authoritative), then prune the
      // vector best-effort: a committed delete must not fail because the
      // derived index could not be pruned.
      return this._deleteFile(scope, idStem)
        .onSuccess(() => this._index.patch('delete', { scope, record: existing }))
        .thenOnSuccess(async () => {
          await this._removeVectorBestEffort({ scope, id: existing.envelope.id });
          return succeed(existing.envelope.id);
        });
    });
  }

  /**
   * Resolve the current version of a temporal entity from the derived index: the
   * highest-`seq` version under the entity subtree `scope` whose `invalid_at` is
   * null/absent. `undefined` when the entity has no current version (never
   * written, or fully invalidated / soft-deleted).
   */
  private _readVersionedCurrent(scope: MemoryScopeKey): IMemoryRecord<unknown> | undefined {
    return selectCurrentVersion(this._versionsForEntity(scope));
  }

  /**
   * Every persisted version of the entity whose subtree is `scope`. All version
   * files for one entity live under exactly that scope (which encodes the
   * entityId), so a scope filter over the index isolates one entity's versions.
   */
  private _versionsForEntity(scope: MemoryScopeKey): ReadonlyArray<IMemoryRecord<unknown>> {
    return this._index
      .entries()
      .filter((entry) => entry.scope === scope)
      .map((entry) => entry.record);
  }

  /**
   * Versioned write (invalidate-don't-delete). Builds the new version's content
   * (a first version from the incoming record, or a merge of the incoming patch
   * over the current version), persists it as a NEW version file, then sets
   * `invalid_at` on the prior current version.
   *
   * Durability order: the new version is persisted FIRST. It carries the highest
   * `seq`, so a crash before the prior-version invalidation completes still
   * resolves the new version as current (`selectCurrentVersion` breaks a
   * two-current tie by highest `seq`), and `asOf` reads stay correct because each
   * version's `valid_at` lower-bounds its interval.
   */
  private async _putVersioned(
    record: IMemoryRecord<unknown>,
    body: string,
    codec: ITemporalIdentityCodec,
    scope: MemoryScopeKey
  ): Promise<Result<IPutOutcome>> {
    const envelope: IMemoryEnvelope = record.envelope;
    const entityId: EntityId = envelope.entityId;
    const kind: Kind = envelope.kind;
    // Snapshot the entity's versions BEFORE the write. `priorCurrents` is every
    // still-current version at snapshot time — normally one, but two-or-more if a
    // prior invalidation partially failed; invalidating all of them lets the write
    // self-heal a stuck state (P2-7).
    const versions: ReadonlyArray<IMemoryRecord<unknown>> = this._versionsForEntity(scope);
    const priorCurrents: ReadonlyArray<IMemoryRecord<unknown>> = versions.filter(isVersionCurrent);
    const current: IMemoryRecord<unknown> | undefined = selectCurrentVersion(versions);
    const policy: IWritePolicy = this._policyFor(kind);
    const dedupScope: DedupScope = policy.dedupScope ?? DEFAULT_DEDUP_SCOPE;
    return this._contentHash(kind, body, envelope.links).thenOnSuccess((hash) => {
      // Entity-scoped dedup: a re-put is a no-op only when the CURRENT content AND
      // its mutable metadata are unchanged (does not spawn a redundant version).
      // A metadata-only revision (tags/provenance — declared mutable by
      // TemporalVersionedPolicy) must NOT be swallowed here: it mints a new
      // version via the applyUpdate merge in `_buildVersionedRecord`, mirroring
      // the flat path. Content-scoped dedup is not a versioning concern, so only
      // the entity granularity is honored here.
      if (
        dedupScope === 'entity' &&
        current !== undefined &&
        current.envelope.contentHash === hash &&
        this._isMutableMetadataUnchanged(current, record)
      ) {
        return Promise.resolve(succeed<IPutOutcome>({ record: current, evicted: [] }));
      }
      // On the versioned path the admission cohort is the entity's ENTIRE version
      // history (no target id to exclude — the new version does not exist yet),
      // which differs from the flat path's "cohort excluding target id" shape.
      return policy.admit(record, versions).thenOnSuccess((decision) => {
        if (decision.decision === 'reject') {
          return Promise.resolve(fail<IPutOutcome>(`memory put: rejected by policy: ${decision.reason}`));
        }
        // No culling on the versioned path — history is retained (invalidate-don't-delete).
        const now: number = this._clock();
        const seq: number = ++this._seq;
        // World-truth start of the new version. Each prior current version's
        // world-truth interval CLOSES at this same instant (not at `now`) so a
        // backdated/future-dated `valid_at` leaves no gap or overlap on the
        // valid-time axis.
        const validAt: number = envelope.temporal?.valid_at ?? now;
        return codec
          .encodeVersion(entityId, seq)
          .withErrorFormat((msg) => `memory put '${entityId}': ${msg}`)
          .thenOnSuccess((versionStem) =>
            this._buildVersionedRecord(record, body, current, policy, hash, versionStem, validAt, now, seq)
              .onSuccess((built) => succeed(this._stampRank(built)))
              .thenOnSuccess((built) => this._embedOnWrite(built, scope))
              .onSuccess((embeddedBuilt) => this._persist(embeddedBuilt, scope, versionStem))
              .onSuccess((persisted) =>
                this._invalidateCurrents(scope, priorCurrents, validAt, now).onSuccess(() =>
                  succeed(persisted)
                )
              )
              .onSuccess((persisted) => succeed({ record: persisted, evicted: [] }))
          );
      });
    });
  }

  /**
   * Invalidate a set of still-current versions (close each world-truth interval at
   * `invalidAt`; stamp transaction-time `updated` = `now`). Chained so a mid-list
   * failure propagates. Invalidating every prior current — not just the
   * highest-`seq` pick — self-heals a state where a previous write's invalidation
   * only partially completed (P2-7).
   */
  private _invalidateCurrents(
    scope: MemoryScopeKey,
    currents: ReadonlyArray<IMemoryRecord<unknown>>,
    invalidAt: number,
    now: number
  ): Result<true> {
    return currents.reduce<Result<true>>(
      (acc, version) =>
        acc.onSuccess(() =>
          this._invalidateVersion(scope, version, invalidAt, now).onSuccess(() => succeed(true))
        ),
      succeed(true)
    );
  }

  /**
   * Build the new version to persist. A first version takes the incoming
   * content verbatim (its dedup `hash` is reused); a subsequent version projects
   * the incoming record's mutable fields into a merge-patch and lets the policy
   * merge them over the CURRENT version (the merge-patch-under-versioning
   * contract), recomputing the content hash from the policy's output. Each
   * version is its own record with its own transaction time (`created` = `now`)
   * and a store-minted `id` = the version stem, so `id === filename stem` holds.
   */
  private _buildVersionedRecord(
    incoming: IMemoryRecord<unknown>,
    body: string,
    current: IMemoryRecord<unknown> | undefined,
    policy: IWritePolicy,
    // Reused only for the first-version branch (its content is taken verbatim); a
    // subsequent version recomputes its hash from the merge-patched content.
    firstVersionHash: string,
    versionStem: string,
    validAt: number,
    now: number,
    seq: number
  ): Result<IMemoryRecord<string>> {
    const mintedId: MemoryId = versionStem as MemoryId;
    if (current === undefined) {
      const envelope: IMemoryEnvelope = {
        ...incoming.envelope,
        id: mintedId,
        entityId: incoming.envelope.entityId,
        created: now,
        updated: now,
        seq,
        contentHash: firstVersionHash,
        temporal: { valid_at: validAt }
      };
      return succeed({ envelope, body });
    }
    const patch: Record<string, unknown> = this._projectMutablePatch(incoming, policy.mutableFields);
    return policy
      .applyUpdate(current, patch)
      .withErrorFormat((msg) => `memory put '${incoming.envelope.entityId}': update failed: ${msg}`)
      .onSuccess((updated) => {
        if (typeof updated.body !== 'string') {
          return fail(
            `memory put '${
              incoming.envelope.entityId
            }': policy returned a non-string body (${typeof updated.body})`
          );
        }
        const finalBody: string = updated.body;
        return this._contentHash(updated.envelope.kind, finalBody, updated.envelope.links).onSuccess(
          (finalHash) => {
            const envelope: IMemoryEnvelope = {
              ...updated.envelope,
              id: mintedId,
              entityId: incoming.envelope.entityId,
              created: now,
              updated: now,
              seq,
              contentHash: finalHash,
              temporal: { valid_at: validAt }
            };
            return succeed({ envelope, body: finalBody });
          }
        );
      });
  }

  /**
   * Set `invalid_at` on a prior current version (invalidate-don't-delete) and
   * rewrite its file + index entry. The content hash is unchanged — `invalid_at`
   * is temporal metadata, not part of `{ kind, body, links }` — so the version's
   * identity is stable.
   */
  private _invalidateVersion(
    scope: MemoryScopeKey,
    version: IMemoryRecord<unknown>,
    invalidAt: number,
    now: number
  ): Result<IMemoryRecord<unknown>> {
    /* c8 ignore start -- defensive: every persisted version carries a string body (only string bodies are written) */
    if (typeof version.body !== 'string') {
      return fail(`memory put: cannot invalidate version '${version.envelope.id}': non-string body`);
    }
    /* c8 ignore stop */
    // `invalid_at` is the WORLD-TRUTH close of the interval (the superseding version's
    // `valid_at`, or the delete instant); `updated` is the transaction-time stamp.
    const invalidated: IMemoryRecord<string> = {
      envelope: {
        ...version.envelope,
        updated: now,
        temporal: { ...version.envelope.temporal, invalid_at: invalidAt }
      },
      body: version.body
    };
    return this._persist(invalidated, scope, version.envelope.id);
  }

  /**
   * Versioned delete: SOFT delete (invalidate-don't-delete). Sets `invalid_at` on
   * the current version, leaving the entity's history intact and the entity with
   * no current version. Returns the invalidated version's {@link MemoryId}. Fails
   * with "no record found" when there is no current version — matching the flat
   * delete's not-found semantics. History is retained deliberately: temporal
   * kinds exist to preserve the audit trail (and the L3 `contradicts` interlock
   * builds on it), so a hard delete would defeat the purpose.
   */
  private async _deleteVersioned(entityId: EntityId, scope: MemoryScopeKey): Promise<Result<MemoryId>> {
    const versions: ReadonlyArray<IMemoryRecord<unknown>> = this._versionsForEntity(scope);
    const currents: ReadonlyArray<IMemoryRecord<unknown>> = versions.filter(isVersionCurrent);
    const current: IMemoryRecord<unknown> | undefined = selectCurrentVersion(versions);
    if (current === undefined) {
      return fail(`memory delete '${entityId}': no record found`);
    }
    // A delete closes the world-truth interval at the delete instant (`now` for both
    // the transaction stamp and the `invalid_at` boundary). Every still-current
    // version is invalidated (self-heals a stuck two-current state — P2-7); the
    // highest-`seq` current's id is returned.
    const now: number = this._clock();
    return this._invalidateCurrents(scope, currents, now, now).onSuccess(() => succeed(current.envelope.id));
  }

  /** Evict (physically delete) a single record file by id, patching the index. */
  private _evict(scope: MemoryScopeKey, id: MemoryId): Result<MemoryId> {
    return this._readRecord(scope, id).onSuccess((existing) => {
      if (existing === undefined) {
        return fail(`memory put: cannot evict '${id}' in scope '${scope}': not found`);
      }
      return this._deleteFile(scope, id)
        .onSuccess(() => this._index.patch('delete', { scope, record: existing }))
        .onSuccess(() => succeed(id));
    });
  }

  /** Project the incoming record's mutable fields into a merge-patch. */
  private _projectMutablePatch(
    record: IMemoryRecord<unknown>,
    mutableFields: ReadonlyArray<string>
  ): Record<string, unknown> {
    const patch: Record<string, unknown> = {};
    for (const field of mutableFields) {
      const accessor: ((record: IMemoryRecord<unknown>) => unknown) | undefined =
        FileTreeMemoryStore._mutableFieldAccessors.get(field);
      if (accessor !== undefined) {
        const value: unknown = accessor(record);
        if (value !== undefined) {
          patch[field] = value;
        }
      }
    }
    return patch;
  }

  /**
   * The admission cohort for a write: every indexed record in `scope` of `kind`
   * except the one at `idStem` (the record being written or updated). This is
   * the set a per-kind cap (e.g. {@link MemoryCapCullPolicy}) counts against, so
   * a bounded-ring policy can keep a per-scope/per-kind family within
   * `maxRecords`. Excluding the target id makes the post-write count uniform
   * across first-writes and updates.
   */
  private _admissionCohort(
    scope: MemoryScopeKey,
    kind: Kind,
    idStem: string
  ): ReadonlyArray<IMemoryRecord<unknown>> {
    return this._index
      .entries()
      .filter(
        (entry) =>
          entry.scope === scope && entry.record.envelope.kind === kind && entry.record.envelope.id !== idStem
      )
      .map((entry) => entry.record);
  }

  /**
   * Find a record in `scope` whose `contentHash` equals `hash`, if any,
   * optionally excluding a specific id. `excludeId` lets the content-scoped
   * dedup skip the same-id record so it does not shadow the LWW update path.
   */
  private _findByContentHash(
    scope: MemoryScopeKey,
    hash: string,
    excludeId?: string
  ): IMemoryRecord<unknown> | undefined {
    const match: IIndexedMemoryRecord | undefined = this._index
      .entries()
      .find(
        (entry) =>
          entry.scope === scope &&
          entry.record.envelope.contentHash === hash &&
          entry.record.envelope.id !== excludeId
      );
    return match?.record;
  }

  /**
   * True when `incoming`'s caller-authored mutable metadata (`tags` / `provenance`)
   * canonically equals `existing`'s. `body` and `links` are covered by the content
   * hash; `embeddingRef` is store-derived (not caller metadata) and is deliberately
   * excluded so a same-content re-put is not treated as changed merely because the
   * store already stamped an embedding. Used to keep an identical re-put a no-op
   * without swallowing a genuine metadata revision.
   *
   * Canonicalization never fails for a validated record (`tags`/`provenance` are
   * always plain JSON); a failure is defaulted to a non-matching sentinel so the
   * write flows to `applyUpdate` (which re-validates) rather than silently
   * no-op-ing on an un-canonicalizable value.
   */
  private _isMutableMetadataUnchanged(
    existing: IMemoryRecord<unknown>,
    incoming: IMemoryRecord<unknown>
  ): boolean {
    const key = (record: IMemoryRecord<unknown>): string =>
      this._hasher
        .canonicalize({ tags: record.envelope.tags, provenance: record.envelope.provenance })
        .orDefault('');
    const existingKey: string = key(existing);
    return existingKey !== '' && existingKey === key(incoming);
  }

  private _contentHash(kind: Kind, body: string, links: IMemoryEnvelope['links']): Result<string> {
    return this._hasher.computeHash({ kind, body, links });
  }

  /**
   * Stamp the store-computed {@link IMemoryEnvelope.rank} onto a fully-built,
   * fully-stamped record by running the kind's registered {@link RankProjector}.
   * Runs on the SAME resolved (post-merge) record whose `contentHash` was just
   * computed, so `rank` is always consistent with the current body — no separate
   * write path and no consumer write-discipline rule. A no-op pass-through
   * (byte-identical record) when the kind has no projector — the additive,
   * zero-overhead-when-unwired default. The projector is a host callback: a throw
   * is logged at `warn` and the record is stamped with NO `rank` (the field is
   * explicitly cleared, so a throw on an update drops a now-stale prior rank rather
   * than preserving it), so a ranking bug never loses an authoritative write.
   */
  private _stampRank(record: IMemoryRecord<string>): IMemoryRecord<string> {
    const projector: RankProjector | undefined = this._rankProjectors.get(record.envelope.kind);
    if (projector === undefined) {
      return record;
    }
    try {
      const rank: number = projector(record);
      return { envelope: { ...record.envelope, rank }, body: record.body };
    } catch (err) {
      this._warnSwallowed(
        `memory put '${record.envelope.id}': rank projector threw (swallowed; rank cleared): ${String(err)}`
      );
      // Explicitly CLEAR `rank` (not `return record`): on an update the merged
      // envelope carries the prior version's `rank` (the write-policy merge does
      // not touch `rank`), so returning it verbatim would keep a stale value
      // inconsistent with the revised body. Clearing honors the staleness
      // contract — an uncomputable rank means the record sorts last as "unranked".
      return { envelope: { ...record.envelope, rank: undefined }, body: record.body };
    }
  }

  private _codecFor(kind: Kind): Result<IIdentityCodec> {
    const codec: IIdentityCodec | undefined = this._codecs.get(kind) ?? this._defaultCodec;
    if (codec === undefined) {
      return fail(`no identity codec registered for kind '${kind}'`);
    }
    return succeed(codec);
  }

  private _policyFor(kind: Kind): IWritePolicy {
    return this._writePolicies.get(kind) ?? this._defaultPolicy;
  }

  /**
   * Read and validate the record at `<scope>/<idStem>.md`, returning `undefined`
   * when the scope directory or file is absent. Verifies the on-disk id ↔
   * filename round-trip on every load.
   */
  private _readRecord(scope: MemoryScopeKey, idStem: string): Result<IMemoryRecord<unknown> | undefined> {
    return this._resolveScopeDir(scope).onSuccess((scopeDir) => {
      if (scopeDir === undefined) {
        return succeed(undefined);
      }
      return scopeDir.getChildren().onSuccess((children) => {
        const targetName: string = `${idStem}${MEMORY_FILE_EXTENSION}`;
        const file: FileTree.IFileTreeFileItem | undefined = children.find(
          (c): c is FileTree.IFileTreeFileItem => c.type === 'file' && c.name === targetName
        );
        if (file === undefined) {
          return succeed(undefined);
        }
        return file
          .getRawContents()
          .onSuccess((raw) => parseMemoryFile(raw, this._registry))
          .onSuccess((parsedRecord) => this._verifyLoaded(scope, file, parsedRecord));
      });
    });
  }

  /**
   * Enforce `envelope.id === filename stem`, the codec round-trip, AND that the
   * envelope's own `entityId` agrees with the id decoded from the subtree scope.
   * The round-trip only validates (scope, stem) consistency; the codec derives
   * `entityId` from the scope path and never reads the envelope's `entityId`
   * field, so a tampered/corrupt file whose frontmatter declares a foreign
   * `entityId` would otherwise load undetected — and `entityId` is trusted
   * verbatim downstream (e.g. merge-into re-addressing). Cross-check it here.
   */
  private _verifyLoaded(
    scope: MemoryScopeKey,
    file: FileTree.IFileTreeFileItem,
    record: IMemoryRecord<unknown>
  ): Result<IMemoryRecord<unknown>> {
    if (record.envelope.id !== file.baseName) {
      return fail(
        `memory file '${file.absolutePath}': envelope id '${record.envelope.id}' does not match filename stem '${file.baseName}'`
      );
    }
    return this._codecFor(record.envelope.kind)
      .onSuccess((codec) =>
        codec.verifyRoundTrip(scope, file.baseName).onSuccess(() => codec.decode(scope, file.baseName))
      )
      .withErrorFormat((msg) => `memory file '${file.absolutePath}': ${msg}`)
      .onSuccess((decodedEntityId) => {
        if (decodedEntityId !== record.envelope.entityId) {
          return fail(
            `memory file '${file.absolutePath}': envelope entityId '${record.envelope.entityId}' does not match scope-derived entityId '${decodedEntityId}'`
          );
        }
        return succeed(record);
      });
  }

  /**
   * Resolve the directory for a scope, returning `undefined` when it does not
   * exist. Navigation only — does not create. Folds the path segments through
   * `getChildren` so an absent segment short-circuits to `undefined`.
   */
  private _resolveScopeDir(scope: MemoryScopeKey): Result<FileTree.IFileTreeDirectoryItem | undefined> {
    return this._scopeEncoding(scope).onSuccess((encoded) => {
      const segments: string[] = encoded.split('/').filter((s) => s.length > 0);
      return segments.reduce<Result<FileTree.IFileTreeDirectoryItem | undefined>>(
        (acc, segment) =>
          acc.onSuccess((current) => {
            if (current === undefined) {
              return succeed(undefined);
            }
            return current
              .getChildren()
              .onSuccess((children) =>
                succeed(
                  children.find(
                    (c): c is FileTree.IFileTreeDirectoryItem => c.type === 'directory' && c.name === segment
                  )
                )
              );
          }),
        succeed(this._root)
      );
    });
  }

  /** Ensure the scope directory exists, creating segments as needed. */
  private _ensureScopeDir(scope: MemoryScopeKey): Result<FileTree.IMutableFileTreeDirectoryItem> {
    return this._scopeEncoding(scope).onSuccess((encoded) => {
      const segments: string[] = encoded.split('/').filter((s) => s.length > 0);
      return segments.reduce<Result<FileTree.IMutableFileTreeDirectoryItem>>(
        (acc, segment) =>
          acc.onSuccess((current) =>
            current.getChildren().onSuccess((children) => {
              const existing: FileTree.FileTreeItem | undefined = children.find(
                (c) => c.type === 'directory' && c.name === segment
              );
              if (existing === undefined) {
                return current.createChildDirectory(segment);
              }
              /* c8 ignore next 3 -- defensive: a child of a mutable in-memory/fs tree is itself mutable; the guard protects against a read-only adapter handed in as root */
              if (!FileTree.isMutableDirectoryItem(existing)) {
                return fail(`${existing.absolutePath}: directory is not mutable`);
              }
              return succeed(existing);
            })
          ),
        succeed(this._root)
      );
    });
  }

  /** Write (create or overwrite) `<scope>/<idStem>.md` with `raw`. */
  private _writeFile(scope: MemoryScopeKey, idStem: string, raw: string): Result<true> {
    return this._ensureScopeDir(scope).onSuccess((scopeDir) =>
      scopeDir.getChildren().onSuccess((children) => {
        const fileName: string = `${idStem}${MEMORY_FILE_EXTENSION}`;
        const existing: FileTree.FileTreeItem | undefined = children.find(
          (c) => c.type === 'file' && c.name === fileName
        );
        if (existing === undefined) {
          return scopeDir.createChildFile(fileName, raw).onSuccess(() => succeed(true));
        }
        /* c8 ignore next 3 -- defensive: a file in a mutable tree is mutable; guards a read-only adapter */
        if (!FileTree.isMutableFileItem(existing)) {
          return fail(`${existing.absolutePath}: file is not mutable`);
        }
        return existing.setRawContents(raw).onSuccess(() => succeed(true));
      })
    );
  }

  /**
   * Physically delete `<scope>/<idStem>.md`. The scope-missing and file-missing
   * guards are unreachable through the callers (`delete` / `_evict` both read the
   * record first, so the directory and file exist) but are kept so a future
   * direct caller degrades loudly rather than silently.
   */
  private _deleteFile(scope: MemoryScopeKey, idStem: string): Result<true> {
    return this._resolveScopeDir(scope).onSuccess((scopeDir) => {
      /* c8 ignore next 3 -- unreachable: callers read the record (hence the scope dir) first */
      if (scopeDir === undefined) {
        return fail(`memory delete: scope '${scope}' not found`);
      }
      const fileName: string = `${idStem}${MEMORY_FILE_EXTENSION}`;
      return scopeDir.getChildren().onSuccess((children) => {
        const file: FileTree.FileTreeItem | undefined = children.find(
          (c) => c.type === 'file' && c.name === fileName
        );
        /* c8 ignore next 3 -- unreachable: callers read the record (hence the file) first */
        if (file === undefined) {
          return fail(`memory delete: file '${fileName}' not found in scope '${scope}'`);
        }
        /* c8 ignore next 3 -- defensive: a file in a mutable tree is mutable; guards a read-only adapter */
        if (!FileTree.isMutableFileItem(file)) {
          return fail(`${file.absolutePath}: file is not mutable`);
        }
        return file.delete().onSuccess(() => succeed(true));
      });
    });
  }

  /**
   * Walk the FileTree once and rebuild the index. Also resumes the `seq`
   * counter past the highest persisted `seq` so new writes stay monotonic.
   */
  private _initialIndex(): Result<true> {
    return this._collectEntries(this._root, []).onSuccess((entries) =>
      this._index.rebuild(entries).onSuccess(() => {
        for (const entry of entries) {
          if (entry.record.envelope.seq > this._seq) {
            this._seq = entry.record.envelope.seq;
          }
        }
        return succeed(true);
      })
    );
  }

  /** Recursively collect every `.md` record under `dir` (scope = path segments). */
  private _collectEntries(
    dir: FileTree.IFileTreeDirectoryItem,
    scopeSegments: ReadonlyArray<string>
  ): Result<ReadonlyArray<IIndexedMemoryRecord>> {
    return dir.getChildren().onSuccess((children) => {
      const results: Result<ReadonlyArray<IIndexedMemoryRecord>>[] = children.map((child) => {
        if (child.type === 'directory') {
          return this._collectEntries(child, [...scopeSegments, child.name]);
        }
        if (!child.name.endsWith(MEMORY_FILE_EXTENSION) || scopeSegments.length === 0) {
          // Skip non-record files and any record-shaped file sitting at the root
          // (records always live under at least one scope segment).
          return succeed<ReadonlyArray<IIndexedMemoryRecord>>([]);
        }
        const scope: MemoryScopeKey = scopeSegments.join('/') as MemoryScopeKey;
        return child
          .getRawContents()
          .onSuccess((raw) => parseMemoryFile(raw, this._registry))
          .onSuccess((parsedRecord) => this._verifyLoaded(scope, child, parsedRecord))
          .onSuccess((verified) =>
            succeed<ReadonlyArray<IIndexedMemoryRecord>>([{ scope, record: verified }])
          );
      });
      return mapResults(results).onSuccess((perChild) =>
        succeed<ReadonlyArray<IIndexedMemoryRecord>>(perChild.flat())
      );
    });
  }
}
