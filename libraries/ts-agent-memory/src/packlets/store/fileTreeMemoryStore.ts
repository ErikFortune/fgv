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
  IIdentityCodec,
  IMemoryEnvelope,
  IMemoryRecord,
  IProvenance,
  IWritePolicy,
  Kind,
  KnowledgeLwwPolicy,
  MemoryId,
  MemoryScopeKey,
  Tag
} from '../types';
import { IBodyConverterRegistry as IRegistry, parseMemoryFile, serializeMemoryFile } from '../converters';
import { IIndexedMemoryRecord, IMemoryIndex, MemoryIndex } from '../index';
import {
  IMemoryObservationRecord,
  IMemoryObserver,
  MemoryObservationOutcome,
  MemoryObservationPhase
} from '../observe';
import { IVectorIndex, MemoryEmbedder } from '../vector';
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
   * For temporal kinds: return only records valid at this epoch ms. No-op in
   * B1 (no temporal kinds wired).
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
   * record exists.
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
   * Write a record. Validates the body, computes a content hash, deduplicates
   * (scope-wide, before policy), applies the kind's {@link IWritePolicy}, stamps
   * transaction-time metadata (`created` / `updated` / `seq` / `contentHash`),
   * writes the file, and patches the index. Returns the written record — or the
   * existing record unchanged on a dedup no-op.
   */
  put(record: IMemoryRecord<unknown>): Promise<Result<IMemoryRecord<unknown>>>;

  /**
   * Delete a record by `(kind, entityId)`. Non-temporal kinds physically delete
   * the file. Returns the {@link MemoryId} of the deleted record.
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
   * core stays embedder-agnostic. A failed embedding fails the `put` loudly — a
   * record is never persisted with a silently missing index entry.
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

/**
 * The resolved storage address + content hash for a put, produced by the
 * synchronous prefix of `_putLocked` and handed to the async write tail.
 */
interface IResolvedWriteAddress {
  readonly scope: MemoryScopeKey;
  readonly idStem: string;
  readonly hash: string;
}

interface IInternalParams {
  readonly root: FileTree.IMutableFileTreeDirectoryItem;
  readonly registry: IRegistry;
  readonly writePolicies: ReadonlyMap<Kind, IWritePolicy>;
  readonly codecs: ReadonlyMap<Kind, IIdentityCodec>;
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
 * B1 supports flat (non-versioned) layout only and string (markdown) bodies.
 * A codec reporting `isVersioned: true`, or a non-string body, fails loudly —
 * the versioned/temporal write path is a fast-follow.
 * @public
 */
export class FileTreeMemoryStore implements IMemoryStore {
  private readonly _root: FileTree.IMutableFileTreeDirectoryItem;
  private readonly _registry: IRegistry;
  private readonly _writePolicies: ReadonlyMap<Kind, IWritePolicy>;
  private readonly _codecs: ReadonlyMap<Kind, IIdentityCodec>;
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
          return fail(`memory get '${entityId}': versioned/temporal layout not yet supported`);
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
    return succeed(matches);
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
    // Resolve the synchronous prefix (body validation → codec address → content
    // hash) into a small descriptor, then bridge to the async write tail (which
    // embeds on write). Keeping the sync prefix intact preserves the exact
    // dedup/policy ordering of the original; only the embed step is new.
    return this._registry
      .convert(envelope.kind, body)
      .withErrorFormat((msg) => `memory put '${envelope.id}': invalid body: ${msg}`)
      .onSuccess(() => this._codecFor(envelope.kind))
      .onSuccess(
        (codec): Result<IResolvedWriteAddress> =>
          codec.encode(envelope.entityId).onSuccess((addr): Result<IResolvedWriteAddress> => {
            if (addr.isVersioned) {
              return fail(`memory put '${envelope.entityId}': versioned/temporal layout not yet supported`);
            }
            if (envelope.id !== addr.idStem) {
              return fail(
                `memory put: envelope id '${envelope.id}' does not match codec-derived stem '${addr.idStem}'`
              );
            }
            return this._contentHash(envelope.kind, body, envelope.links).onSuccess((hash) =>
              succeed({ scope: addr.scope, idStem: addr.idStem, hash })
            );
          })
      )
      .thenOnSuccess((resolved) =>
        this._writeResolved(record, body, resolved.scope, resolved.idStem, resolved.hash)
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
      const duplicate: IMemoryRecord<unknown> | undefined = this._findByContentHash(scope, hash);
      if (duplicate !== undefined) {
        return succeed({ record: duplicate, evicted: [] });
      }
    }
    return this._readRecord(scope, idStem).thenOnSuccess((existing) => {
      if (dedupScope === 'entity' && existing !== undefined && existing.envelope.contentHash === hash) {
        // Entity-scoped dedup: an identical re-put of the same entity is a no-op.
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
    const evicted: ReadonlyArray<MemoryId> = decision.decision === 'cull-oldest' ? decision.evict : [];
    return this._buildRecord(record, body, existing, policy, hash)
      .thenOnSuccess((built) => this._embedOnWrite(built))
      .onSuccess((embeddedBuilt) => this._persist(embeddedBuilt, scope, idStem))
      .thenOnSuccess(async (persisted) => {
        const evictResult: Result<true> = this._applyEvictions(decision, scope);
        if (evictResult.isFailure()) {
          return fail(evictResult.message);
        }
        // Best-effort: prune the evicted cohort's vectors after their files are
        // gone. A removal failure is logged, never fatal (the record store has
        // already committed the eviction).
        await this._removeEvictedVectors(evicted);
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
  private async _embedOnWrite(built: IMemoryRecord<string>): Promise<Result<IMemoryRecord<string>>> {
    if (this._vectorIndex === undefined || this._embed === undefined) {
      return succeed(built);
    }
    const vectorIndex: IVectorIndex = this._vectorIndex;
    const embed: MemoryEmbedder = this._embed;
    const embedded: Result<Float32Array> = await this._tryVectorOp(
      () => embed(built),
      `embedding '${built.envelope.id}'`
    );
    if (embedded.isFailure()) {
      return succeed(built);
    }
    const added: Result<string> = await this._tryVectorOp(
      () => vectorIndex.add(built.envelope.id, embedded.value),
      `vector add for '${built.envelope.id}'`
    );
    if (added.isFailure()) {
      return succeed(built);
    }
    return succeed({ envelope: { ...built.envelope, embeddingRef: added.value }, body: built.body });
  }

  /** Evict the records named by a `cull-oldest` decision (`accept` is a no-op). */
  private _applyEvictions(decision: AdmissionDecision, scope: MemoryScopeKey): Result<true> {
    if (decision.decision === 'cull-oldest') {
      return mapResults(decision.evict.map((id) => this._evict(scope, id))).onSuccess(() => succeed(true));
    }
    return succeed(true);
  }

  /** Best-effort vector removal for each evicted record (never fails the put). */
  private async _removeEvictedVectors(evicted: ReadonlyArray<MemoryId>): Promise<void> {
    for (const id of evicted) {
      await this._removeVectorBestEffort(id);
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
  private async _removeVectorBestEffort(id: MemoryId): Promise<void> {
    if (this._vectorIndex === undefined || this._embed === undefined) {
      return;
    }
    const vectorIndex: IVectorIndex = this._vectorIndex;
    await this._tryVectorOp(() => vectorIndex.remove(id), `vector removal for '${id}'`);
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
    return this._codecFor(kind)
      .onSuccess((codec) => codec.encode(entityId))
      .thenOnSuccess((addr) => {
        if (addr.isVersioned) {
          return Promise.resolve(
            fail<MemoryId>(`memory delete '${entityId}': versioned/temporal layout not yet supported`)
          );
        }
        return this._readRecord(addr.scope, addr.idStem).thenOnSuccess((existing) => {
          if (existing === undefined) {
            return Promise.resolve(fail<MemoryId>(`memory delete '${entityId}': no record found`));
          }
          // Delete the record file + index entry (authoritative), then prune the
          // vector best-effort: a committed delete must not fail because the
          // derived index could not be pruned.
          return this._deleteFile(addr.scope, addr.idStem)
            .onSuccess(() => this._index.patch('delete', { scope: addr.scope, record: existing }))
            .thenOnSuccess(async () => {
              await this._removeVectorBestEffort(existing.envelope.id);
              return succeed(existing.envelope.id);
            });
        });
      });
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

  /** Find a record in `scope` whose `contentHash` equals `hash`, if any. */
  private _findByContentHash(scope: MemoryScopeKey, hash: string): IMemoryRecord<unknown> | undefined {
    const match: IIndexedMemoryRecord | undefined = this._index
      .entries()
      .find((entry) => entry.scope === scope && entry.record.envelope.contentHash === hash);
    return match?.record;
  }

  private _contentHash(kind: Kind, body: string, links: IMemoryEnvelope['links']): Result<string> {
    return this._hasher.computeHash({ kind, body, links });
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

  /** Enforce `envelope.id === filename stem` and the codec round-trip on load. */
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
      .onSuccess((codec) => codec.verifyRoundTrip(scope, file.baseName))
      .withErrorFormat((msg) => `memory file '${file.absolutePath}': ${msg}`)
      .onSuccess(() => succeed(record));
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
