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
import { IDerivedStateCoverage } from './coverage';
import { DerivedArtifact, ReconcileReport } from './reconcile';

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
   * How much of the store's **derived state** exists, resolved by {@link Kind}.
   *
   * @remarks
   * Answers *"is my derived state consistent with my records, and if not by how
   * much?"* for every artifact the store derives — `rank`, record vectors, and
   * fragment vectors — in one call.
   *
   * **Cheap and total, by contract rather than by implementation.** Every input is
   * an envelope field or an index-side count: it reads **no record bodies** and
   * calls **no embedder**, and the walk over the vault's own state touches the
   * filesystem not at all. That is why it takes no selection, unlike
   * {@link IMemoryStore.list} — the guard there exists because an unnarrowed list
   * reads the vault, and putting one here would decorate a free operation and make
   * that guard mean less.
   *
   * **The index-side counts are the one exception, and it is the caller's own
   * index that spends it.** A persistent index answers `size` / `recordCount` /
   * `fragmentCount` with a query — `SqliteVecVectorIndex` runs a prepared `COUNT`
   * — so on a durable backend this call does I/O and can **fail**. It is bounded
   * (one count per wired index, never per record) and it is why the return is a
   * `Result` rather than a bare value.
   *
   * *If a future addition to the report would require reading a record body, it
   * does not belong on this report.*
   *
   * The counterpart is {@link IMemoryStore.reconcile}: coverage says **how big**
   * the gap is, cheaply; reconcile says **what it was** and closes what it can, at
   * the cost of re-running the embedder. Neither substitutes for the other.
   *
   * **A lane is reported here whenever its *index* is wired**, which is weaker
   * than what reconcile requires (index **and** embedder). That is intended: an
   * index without an embedder still holds vectors and still answers queries, so
   * its coverage is a real number worth reporting. The consequence to expect is a
   * half-wired store that reports a gap `reconcile` will refuse to close, naming
   * the missing embedder.
   */
  coverage(): Promise<Result<IDerivedStateCoverage>>;

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
   * Repair one derived artifact for one {@link Kind} — **targeted and
   * non-destructive**, unlike `IVectorIndex.rebuild`, which resets the index and
   * re-embeds everything.
   *
   * @remarks
   * The counterpart to {@link IMemoryStore.coverage}: coverage says **how big**
   * the gap is and costs nothing; reconcile says **what it was** and closes what
   * it can, at the cost of reading bodies and re-running the embedder. Neither
   * substitutes for the other — in particular, only reconcile can distinguish a
   * *declined* record from a *failed* one, because learning that requires calling
   * the embedder again.
   *
   * **It only touches what is missing.** For the vector lanes it asks
   * `has(target)` per record and skips the ones already held, so a repair after a
   * brief outage costs a handful of embedder calls rather than a whole vault.
   * That check is also the only way to see a record whose vector the index holds
   * but whose envelope lost its `embeddingRef` — which needs a restamp and no
   * embedder call at all, and which an `embeddingRef`-only repair cannot detect.
   *
   * **`artifact` is required and names one lane.** See {@link DerivedArtifact}
   * for why an operation repairing "everything wired" would be the wrong shape.
   *
   * **A vector lane must be wired on BOTH halves — index *and* embedder — or this
   * fails, and it is deliberately stricter than {@link IMemoryStore.coverage}.**
   * The two ask different questions of the same wiring. Coverage asks *what does
   * the index hold*, which an index alone can answer: an index wired without an
   * embedder is a legal store (queries work; writes simply do not embed), so
   * coverage reports that lane rather than pretending it is absent. Reconcile
   * asks to *produce* vectors, which needs the embedder. So a half-wired store
   * legitimately reports a coverage gap it cannot repair, and reconcile names the
   * missing half rather than returning a cheerful success with every record in
   * `failed`.
   *
   * Runs under the store's write lock, like any other mutation.
   */
  reconcile(kind: Kind, artifact: DerivedArtifact): Promise<Result<ReconcileReport>>;

  /**
   * Delete a record by `(kind, entityId)`. Non-temporal kinds physically delete
   * the file and return the deleted record's {@link MemoryId}. Temporal
   * (versioned) kinds SOFT-delete: the current version is invalidated
   * (`invalid_at` set), history is retained, and the invalidated version's
   * {@link MemoryId} is returned.
   */
  delete(kind: Kind, entityId: EntityId): Promise<Result<MemoryId>>;
}
