/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result } from '@fgv/ts-utils';
import {
  DedupScope,
  EntityId,
  IMemoryRecord,
  IMemoryRecordResolver,
  Kind,
  MemoryId,
  MemoryScopeKey
} from '../types';
import { IIndexedMemoryEntry } from '../index';
import { IMemoryRecordSource, IScopedMemoryRecord } from '../vector';
import { MemoryListSelection } from './listSelection';

/**
 * The writable, FileTree-backed, content-hash-deduped memory store.
 *
 * @remarks
 * Extends {@link IMemoryRecordResolver} because the retrievers take a resolver
 * and a store is the obvious one to hand them — `{ index, resolver: store }` is
 * the documented wiring, and it has to type-check for the `IMemoryStore` handle
 * a consumer actually holds, not only for the concrete `FileTreeMemoryStore`.
 * @public
 */
export interface IMemoryStore extends IMemoryRecordResolver {
  /**
   * Keyed read by entity id. Resolves `entityId` to a storage address via the
   * registered {@link IIdentityCodec} for `kind`. Returns `undefined` when no
   * record exists. For a versioned (temporal) kind the current version is
   * *selected* from the derived in-memory index — the version history is walked
   * over envelopes, never bodies — and then that one version is read from
   * storage. So the selection costs no file reads and the result costs exactly
   * one, rather than one per version.
   */
  get(kind: Kind, entityId: EntityId): Promise<Result<IMemoryRecord<unknown> | undefined>>;

  /**
   * Direct read by `(scope, MemoryId)`. Returns `undefined` when not found.
   */
  getById(scope: MemoryScopeKey, id: MemoryId): Promise<Result<IMemoryRecord<unknown> | undefined>>;

  /**
   * List records: select over the derived index, then materialize the survivors.
   *
   * @remarks
   * **The selection is required and must narrow.** Since the index holds
   * envelopes only, every returned record is read from storage — so a call that
   * narrows nothing reads the whole vault, and that has to be a decision rather
   * than a default. Omitting the argument is a compile error; passing one with no
   * `scope` / `kind` / `tag` fails with a message naming {@link scanEveryRecord},
   * which is how a caller says it meant it.
   *
   * The requirement buys **explicitness, not a cost bound** — `{ kind }` on a
   * vault dominated by that kind still materializes most of it. What it prevents
   * is the whole-vault read nobody chose.
   *
   * If you only need to select, use {@link IMemoryStore.listEntries} instead: no
   * selection, no file reads.
   */
  list(selection: MemoryListSelection): Promise<Result<ReadonlyArray<IMemoryRecord<unknown>>>>;

  /**
   * Every entry in the vault — scope and envelope, **no bodies**. Reads no files
   * and requires no selection, because there is nothing to be careful about: it
   * returns what the index already holds.
   *
   * @remarks
   * This is the whole-vault read most callers actually want. Selection, grouping,
   * counting, "which kinds are in here", "what links at this" — all of it is
   * envelope work. Reach for {@link IMemoryStore.list} with
   * {@link scanEveryRecord} only when you genuinely need every body.
   *
   * Synchronous in spirit but `Promise`-returning for consistency with the rest
   * of the store surface.
   */
  listEntries(): Promise<Result<ReadonlyArray<IIndexedMemoryEntry>>>;

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
   * returned source's `list()` delegates to {@link IMemoryStore.listScoped},
   * **filtered to the kinds {@link IMemoryStore.embedsKind | embedsKind} reports** —
   * this source exists to feed the record vector index, so a kind excluded from
   * that index is excluded here too, and a reopen does not re-embed records the
   * index will never return. With no
   * {@link IFileTreeMemoryStoreCreateParams.embedKinds | embedKinds} declaration
   * every kind participates and the filter is the identity. `listScoped` itself is
   * **not** filtered and remains the whole-vault surface.
   *
   * The filter also **counts what it drops**, onto
   * {@link IMemoryRecordListing.excluded} — this is the layer where the exclusion
   * decision is made and so the only one that can. The count is always present
   * (empty when nothing was excluded).
   *
   * The store cannot implement {@link IMemoryRecordSource} directly because its
   * `list(filter?)` returns bare records (the ergonomic query surface) while the
   * seam's `list()` returns scope-qualified records.
   */
  asRecordSource(): IMemoryRecordSource;

  /**
   * The EFFECTIVE {@link DedupScope} for `kind` — the granularity at which a
   * write for this kind deduplicates against the existing vault.
   *
   * @remarks
   * This is a **read accessor over the store's already-injected write policies**,
   * and it is the single place any caller — the store's own write path included —
   * asks what a kind's dedup granularity is. It resolves the full chain the store
   * applies on write: the kind's registered {@link IWritePolicy}, falling back to
   * the store's default policy, then that policy's
   * {@link IWritePolicy.dedupScope | dedupScope}, falling back to
   * {@link DEFAULT_DEDUP_SCOPE}. Note the store's default policy is a
   * {@link KnowledgeLwwPolicy}, which declares `'content'` — so a kind with NO
   * registered policy resolves to `'content'`, not to `DEFAULT_DEDUP_SCOPE`.
   *
   * It exists so a caller that must agree with the store about dedup granularity
   * — notably the ingest orchestrator's stage-4 layer-1 exact match — can read the
   * declaration through this seam instead of being handed a second copy of the
   * policy map. A second declaration site is precisely the defect this accessor
   * was added to remove.
   *
   * Deliberately synchronous, total, and NOT `Result`-returning: it reads
   * constructor-injected configuration, touches no I/O, and cannot fail (every
   * link in the fallback chain has a total default). It exposes only the scope,
   * never the {@link IWritePolicy} itself, so it can never become a back door for
   * invoking admission or merge logic out of band.
   */
  dedupScopeFor(kind: Kind): DedupScope;

  /**
   * Whether records of `kind` participate in the **record-granular** vector index.
   *
   * @remarks
   * A read accessor over the store's injected {@link IFileTreeMemoryStoreCreateParams.embedKinds | embedKinds}
   * declaration, in the same spirit as {@link IMemoryStore.dedupScopeFor} — one
   * place to ask, so the store's write path and any caller reasoning about index
   * coverage cannot disagree. `true` for every kind when no declaration was made.
   *
   * **This is distinct from a {@link MemoryEmbedder} decline, and the difference is
   * cost.** An embedder that returns `undefined` has already been called: the
   * round trip is paid, and on a locally-hosted model that round trip is the
   * expense. A kind excluded here is never handed to the embedder at all. The
   * decline makes the intent *expressible*; this makes it *free*.
   *
   * Deliberately synchronous, total, and NOT `Result`-returning: it reads
   * constructor-injected configuration, touches no I/O, and cannot fail.
   */
  embedsKind(kind: Kind): boolean;

  /**
   * Write a record. Validates the body, computes a content hash, deduplicates
   * (scope-wide, before policy), applies the kind's {@link IWritePolicy}, stamps
   * transaction-time metadata (`created` / `updated` / `seq` / `contentHash`),
   * writes the file, and patches the index. Returns the written record — or the
   * existing record unchanged on a dedup no-op.
   */
  put(record: IMemoryRecord<unknown>): Promise<Result<IMemoryRecord<unknown>>>;

  /**
   * Re-apply the kind's {@link RankProjector} to every record of `kind` already
   * in the store, restamping {@link IMemoryEnvelope.rank}. Returns the number of
   * records whose `rank` actually changed.
   *
   * @remarks
   * **This exists because `rank` is otherwise new-store-only, and fails in a way
   * that looks like it works.** The projector runs on the write path only, so
   * registering one against a populated store ranks nothing already written —
   * and because an absent `rank` sorts *last*, every pre-registration record
   * lands below every post-registration one no matter what the projector would
   * have scored it. The ordering is not merely partial; it is **inverted with
   * respect to the projector's own intent**, with no failure anywhere to say so.
   *
   * Deliberately **does not** touch `created` / `updated` / `seq`, and fires no
   * `'write'` observation. Routing a reconcile through {@link IMemoryStore.put}
   * would bump transaction time on every record — trading a wrong `rank` order
   * for a wrong recency order, and flooding any wired observer with writes that
   * are not writes. The body is re-serialized verbatim from the file's own
   * bytes; only the envelope's `rank` moves.
   *
   * Fails loudly if `kind` has no registered projector: asking to reconcile a
   * kind you never configured is a caller error, not a no-op.
   *
   * **Not atomic, and safe for it.** A failure part-way leaves earlier records
   * restamped. That is benign because restamping is idempotent — re-running
   * converges — which is also why no report shape is offered here. A count is
   * enough.
   */
  reconcileRank(kind: Kind): Promise<Result<number>>;

  /**
   * Delete a record by `(kind, entityId)`. Non-temporal kinds physically delete
   * the file and return the deleted record's {@link MemoryId}. Temporal
   * (versioned) kinds SOFT-delete: the current version is invalidated
   * (`invalid_at` set), history is retained, and the invalidated version's
   * {@link MemoryId} is returned.
   */
  delete(kind: Kind, entityId: EntityId): Promise<Result<MemoryId>>;
}
