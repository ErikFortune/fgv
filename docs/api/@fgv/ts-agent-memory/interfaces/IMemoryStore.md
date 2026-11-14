[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IMemoryStore

# Interface: IMemoryStore

The writable, FileTree-backed, content-hash-deduped memory store.

## Remarks

Extends [IMemoryRecordResolver](IMemoryRecordResolver.md) because the retrievers take a resolver
and a store is the obvious one to hand them — `{ index, resolver: store }` is
the documented wiring, and it has to type-check for the `IMemoryStore` handle
a consumer actually holds, not only for the concrete `FileTreeMemoryStore`.

## Extends

- [`IMemoryRecordResolver`](IMemoryRecordResolver.md)
- [`IIdentityResolver`](IIdentityResolver.md)

## Methods

### asRecordSource()

> **asRecordSource**(): [`IMemoryRecordSource`](IMemoryRecordSource.md)

Adapt this store to the [IMemoryRecordSource](IMemoryRecordSource.md) seam so it can drive
[IVectorIndex](IVectorIndex.md) rebuilds (e.g. `InMemoryCosineIndex.rebuild`). The
returned source's `list()` delegates to [IMemoryStore.listScoped](#listscoped),
**filtered to the kinds [embedsKind](#embedskind) reports** —
this source exists to feed the record vector index, so a kind excluded from
that index is excluded here too, and a reopen does not re-embed records the
index will never return. With no
[embedKinds](IFileTreeMemoryStoreCreateParams.md#property-embedkinds) declaration
every kind participates and the filter is the identity. `listScoped` itself is
**not** filtered and remains the whole-vault surface.

The filter also **counts what it drops**, onto
[IMemoryRecordListing.excluded](IMemoryRecordListing.md#property-excluded) — this is the layer where the exclusion
decision is made and so the only one that can. The count is always present
(empty when nothing was excluded).

The store cannot implement [IMemoryRecordSource](IMemoryRecordSource.md) directly because its
`list(filter?)` returns bare records (the ergonomic query surface) while the
seam's `list()` returns scope-qualified records.

#### Returns

[`IMemoryRecordSource`](IMemoryRecordSource.md)

***

### coverage()

> **coverage**(): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IDerivedStateCoverage`](IDerivedStateCoverage.md)\>\>

How much of the store's **derived state** exists, resolved by [Kind](../type-aliases/Kind.md).

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IDerivedStateCoverage`](IDerivedStateCoverage.md)\>\>

#### Remarks

Answers *"is my derived state consistent with my records, and if not by how
much?"* for every artifact the store derives — `rank`, record vectors, and
fragment vectors — in one call.

**Cheap and total, by contract rather than by implementation.** Every input is
an envelope field or an index-side count: it reads **no record bodies** and
calls **no embedder**, and the walk over the vault's own state touches the
filesystem not at all. That is why it takes no selection, unlike
[IMemoryStore.list](#list) — the guard there exists because an unnarrowed list
reads the vault, and putting one here would decorate a free operation and make
that guard mean less.

**The index-side counts are the one exception, and it is the caller's own
index that spends it.** A persistent index answers `size` / `recordCount` /
`fragmentCount` with a query — `SqliteVecVectorIndex` runs a prepared `COUNT`
— so on a durable backend this call does I/O and can **fail**. It is bounded
(one count per wired index, never per record) and it is why the return is a
`Result` rather than a bare value.

*If a future addition to the report would require reading a record body, it
does not belong on this report.*

The counterpart is [IMemoryStore.reconcile](#reconcile): coverage says **how big**
the gap is, cheaply; reconcile says **what it was** and closes what it can, at
the cost of re-running the embedder. Neither substitutes for the other.

**A lane is reported here whenever its *index* is wired**, which is weaker
than what reconcile requires (index **and** embedder). That is intended: an
index without an embedder still holds vectors and still answers queries, so
its coverage is a real number worth reporting. The consequence to expect is a
half-wired store that reports a gap `reconcile` will refuse to close, naming
the missing embedder.

***

### dedupScopeFor()

> **dedupScopeFor**(`kind`): [`DedupScope`](../type-aliases/DedupScope.md)

The EFFECTIVE [DedupScope](../type-aliases/DedupScope.md) for `kind` — the granularity at which a
write for this kind deduplicates against the existing vault.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `kind` | [`Kind`](../type-aliases/Kind.md) |

#### Returns

[`DedupScope`](../type-aliases/DedupScope.md)

#### Remarks

This is a **read accessor over the store's already-injected write policies**,
and it is the single place any caller — the store's own write path included —
asks what a kind's dedup granularity is. It resolves the full chain the store
applies on write: the kind's registered [IWritePolicy](IWritePolicy.md), falling back to
the store's default policy, then that policy's
[dedupScope](IWritePolicy.md#property-dedupscope), falling back to
[DEFAULT\_DEDUP\_SCOPE](../variables/DEFAULT_DEDUP_SCOPE.md). Note the store's default policy is a
[KnowledgeLwwPolicy](../classes/KnowledgeLwwPolicy.md), which declares `'content'` — so a kind with NO
registered policy resolves to `'content'`, not to `DEFAULT_DEDUP_SCOPE`.

It exists so a caller that must agree with the store about dedup granularity
— notably the ingest orchestrator's stage-4 layer-1 exact match — can read the
declaration through this seam instead of being handed a second copy of the
policy map. A second declaration site is precisely the defect this accessor
was added to remove.

Deliberately synchronous, total, and NOT `Result`-returning: it reads
constructor-injected configuration, touches no I/O, and cannot fail (every
link in the fallback chain has a total default). It exposes only the scope,
never the [IWritePolicy](IWritePolicy.md) itself, so it can never become a back door for
invoking admission or merge logic out of band.

***

### delete()

> **delete**(`kind`, `entityId`, `options?`): `Promise`\<[`MemoryWriteResult`](../type-aliases/MemoryWriteResult.md)\<[`MemoryId`](../type-aliases/MemoryId.md)\>\>

Delete a record by `(kind, entityId)`. Non-temporal kinds physically delete
the file and return the deleted record's [MemoryId](../type-aliases/MemoryId.md). Temporal
(versioned) kinds SOFT-delete: the current version is invalidated
(`invalid_at` set), history is retained, and the invalidated version's
[MemoryId](../type-aliases/MemoryId.md) is returned.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `kind` | [`Kind`](../type-aliases/Kind.md) |
| `entityId` | [`EntityId`](../type-aliases/EntityId.md) |
| `options?` | [`IMemoryDeleteOptions`](IMemoryDeleteOptions.md) |

#### Returns

`Promise`\<[`MemoryWriteResult`](../type-aliases/MemoryWriteResult.md)\<[`MemoryId`](../type-aliases/MemoryId.md)\>\>

#### Remarks

With [options.expected](IMemoryDeleteOptions.md#property-expected) the delete goes ahead only if the
record (the current version, for a versioned kind) still carries that `seq`; otherwise it fails
with `code: 'conflict'`, `current: 'absent'` when the record has gone. Same placement and the
same in-process guarantee as [IMemoryStore.put](#put). Without it, an absent record fails with
`code: 'not-found'`.

***

### dispose()?

> `optional` **dispose**(): `void`

Release whatever exclusive hold the store has on its storage, so another store may open it.
Optional: a store that holds nothing need not implement it. Idempotent. After it, every write,
delete and reconcile fails; reads still answer, from what this store last knew — once a new
owner writes, they may be stale.

#### Returns

`void`

***

### embedsKind()

> **embedsKind**(`kind`): `boolean`

Whether records of `kind` participate in the **record-granular** vector index.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `kind` | [`Kind`](../type-aliases/Kind.md) |

#### Returns

`boolean`

#### Remarks

A read accessor over the store's injected [embedKinds](IFileTreeMemoryStoreCreateParams.md#property-embedkinds)
declaration, in the same spirit as [IMemoryStore.dedupScopeFor](#dedupscopefor) — one
place to ask, so the store's write path and any caller reasoning about index
coverage cannot disagree. `true` for every kind when no declaration was made.

**This is distinct from a [MemoryEmbedder](../type-aliases/MemoryEmbedder.md) decline, and the difference is
cost.** An embedder that returns `undefined` has already been called: the
round trip is paid, and on a locally-hosted model that round trip is the
expense. A kind excluded here is never handed to the embedder at all. The
decline makes the intent *expressible*; this makes it *free*.

Deliberately synchronous, total, and NOT `Result`-returning: it reads
constructor-injected configuration, touches no I/O, and cannot fail.

***

### get()

> **get**(`kind`, `entityId`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IMemoryRecord`](IMemoryRecord.md)\<`unknown`\> \| `undefined`\>\>

Keyed read by entity id. Resolves `entityId` to a storage address via the
registered [IIdentityCodec](IIdentityCodec.md) for `kind`. Returns `undefined` when no
record exists. For a versioned (temporal) kind the current version is
*selected* from the derived in-memory index — the version history is walked
over envelopes, never bodies — and then that one version is read from
storage. So the selection costs no file reads and the result costs exactly
one, rather than one per version.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `kind` | [`Kind`](../type-aliases/Kind.md) |
| `entityId` | [`EntityId`](../type-aliases/EntityId.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IMemoryRecord`](IMemoryRecord.md)\<`unknown`\> \| `undefined`\>\>

***

### getById()

> **getById**(`scope`, `id`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IMemoryRecord`](IMemoryRecord.md)\<`unknown`\> \| `undefined`\>\>

Direct read by `(scope, MemoryId)`. Returns `undefined` when not found.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`MemoryScopeKey`](../type-aliases/MemoryScopeKey.md) |
| `id` | [`MemoryId`](../type-aliases/MemoryId.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IMemoryRecord`](IMemoryRecord.md)\<`unknown`\> \| `undefined`\>\>

***

### list()

> **list**(`selection`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IMemoryRecord`](IMemoryRecord.md)\<`unknown`\>[]\>\>

List records: select over the derived index, then materialize the survivors.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `selection` | [`MemoryListSelection`](../type-aliases/MemoryListSelection.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IMemoryRecord`](IMemoryRecord.md)\<`unknown`\>[]\>\>

#### Remarks

**The selection is required and must narrow.** Since the index holds
envelopes only, every returned record is read from storage — so a call that
narrows nothing reads the whole vault, and that has to be a decision rather
than a default. Omitting the argument is a compile error; passing one with no
`scope` / `kind` / `tag` fails with a message naming [scanEveryRecord](../functions/scanEveryRecord.md),
which is how a caller says it meant it.

The requirement buys **explicitness, not a cost bound** — `{ kind }` on a
vault dominated by that kind still materializes most of it. What it prevents
is the whole-vault read nobody chose.

If you only need to select, use [IMemoryStore.listEntries](#listentries) instead: no
selection, no file reads.

***

### listEntries()

> **listEntries**(): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IIndexedMemoryEntry`](IIndexedMemoryEntry.md)[]\>\>

Every entry in the vault — scope and envelope, **no bodies**. Reads no files
and requires no selection, because there is nothing to be careful about: it
returns what the index already holds.

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IIndexedMemoryEntry`](IIndexedMemoryEntry.md)[]\>\>

#### Remarks

This is the whole-vault read most callers actually want. Selection, grouping,
counting, "which kinds are in here", "what links at this" — all of it is
envelope work. Reach for [IMemoryStore.list](#list) with
[scanEveryRecord](../functions/scanEveryRecord.md) only when you genuinely need every body.

Synchronous in spirit but `Promise`-returning for consistency with the rest
of the store surface.

***

### listScoped()

> **listScoped**(): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IScopedMemoryRecord`](IScopedMemoryRecord.md)[]\>\>

List EVERY record in the vault, each paired with its scope-qualified
`(scope, id)` address — the projection [IMemoryRecordSource](IMemoryRecordSource.md) requires.
Unlike [list](#list), it takes no filter (whole-vault) and
returns [IScopedMemoryRecord](IScopedMemoryRecord.md)s so a re-index keys each entry on the same
scoped target the incremental embed-on-write path uses. Two records that share
a filename stem across scopes appear as distinct entries.

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IScopedMemoryRecord`](IScopedMemoryRecord.md)[]\>\>

***

### put()

> **put**(`record`, `options?`): `Promise`\<[`MemoryWriteResult`](../type-aliases/MemoryWriteResult.md)\<[`IMemoryRecord`](IMemoryRecord.md)\<`unknown`\>\>\>

Write a record. Validates the body, computes a content hash, deduplicates
(scope-wide, before policy), applies the kind's [IWritePolicy](IWritePolicy.md), stamps
transaction-time metadata (`created` / `updated` / `seq` / `contentHash`),
writes the file, and patches the index. Returns the written record — or the
existing record unchanged on a dedup no-op.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `record` | [`IMemoryRecord`](IMemoryRecord.md)\<`unknown`\> |
| `options?` | [`IMemoryWriteOptions`](IMemoryWriteOptions.md) |

#### Returns

`Promise`\<[`MemoryWriteResult`](../type-aliases/MemoryWriteResult.md)\<[`IMemoryRecord`](IMemoryRecord.md)\<`unknown`\>\>\>

#### Remarks

**Conditional write.** With [options.expected](IMemoryWriteOptions.md#property-expected) the write
goes ahead only if the address still holds what the caller read — the record's `envelope.seq`
(for a versioned kind, the current version's), or `'absent'` for nothing. A mismatch fails with
`code: 'conflict'` and the `seq` found, and writes nothing. The check runs under the store's
write lock, after the address is resolved and **before dedup**, so a dedup no-op can never mask
a conflict.

**Under `expected`, success means the addressed record was written** (or, for an identical
same-id re-put, is already exactly that). A `'content'`-scoped kind whose content already exists
under a *different* id fails with `code: 'duplicate'` and that record's `existingId`, writing
nothing; without `expected` the same put still succeeds by returning that other record, as it
always has.

The same-id record is read before content dedup on every flat put, so a same-id file that cannot
be read fails the put (`io`) even when a cross-id duplicate exists — before, such a put could
succeed by deduping onto the other record without ever reading its own.

`seq` is the token because the store issues it strictly increasing and never twice — a
persisted high-water mark carries it across restarts, including one that follows deleting the
highest record. `contentHash` is not: it excludes tags and provenance and can recur. A rewrite
of derived state (a reconcile restamp of `rank` or `embeddingRef`, a version invalidation)
keeps `seq`, and is recomputed by any write that follows, so it cannot lose a caller's update.

**In-process only.** The guarantee holds among writers sharing one store instance per root,
which the store's single-writer guard enforces within a process. It is not fencing; a second
process over the same storage is outside it.

Every failure carries an [IMemoryWriteFailure](../type-aliases/IMemoryWriteFailure.md); `.asResult` drops it for plain chaining.

***

### reconcile()

> **reconcile**(`kind`, `artifact`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ReconcileReport`](../type-aliases/ReconcileReport.md)\>\>

Repair one derived artifact for one [Kind](../type-aliases/Kind.md) — **targeted and
non-destructive**, unlike `IVectorIndex.rebuild`, which resets the index and
re-embeds everything.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `kind` | [`Kind`](../type-aliases/Kind.md) |
| `artifact` | [`DerivedArtifact`](../type-aliases/DerivedArtifact.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ReconcileReport`](../type-aliases/ReconcileReport.md)\>\>

#### Remarks

The counterpart to [IMemoryStore.coverage](#coverage): coverage says **how big**
the gap is and costs nothing; reconcile says **what it was** and closes what
it can, at the cost of reading bodies and re-running the embedder. Neither
substitutes for the other — in particular, only reconcile can distinguish a
*declined* record from a *failed* one, because learning that requires calling
the embedder again.

**It only touches what is missing.** For the vector lanes it asks
`has(target)` per record and skips the ones already held, so a repair after a
brief outage costs a handful of embedder calls rather than a whole vault.
That check is also the only way to see a record whose vector the index holds
but whose envelope lost its `embeddingRef` — which needs a restamp and no
embedder call at all, and which an `embeddingRef`-only repair cannot detect.

**`artifact` is required and names one lane.** See [DerivedArtifact](../type-aliases/DerivedArtifact.md)
for why an operation repairing "everything wired" would be the wrong shape.

**A vector lane must be wired on BOTH halves — index *and* embedder — or this
fails, and it is deliberately stricter than [IMemoryStore.coverage](#coverage).**
The two ask different questions of the same wiring. Coverage asks *what does
the index hold*, which an index alone can answer: an index wired without an
embedder is a legal store (queries work; writes simply do not embed), so
coverage reports that lane rather than pretending it is absent. Reconcile
asks to *produce* vectors, which needs the embedder. So a half-wired store
legitimately reports a coverage gap it cannot repair, and reconcile names the
missing half rather than returning a cheerful success with every record in
`failed`.

Runs under the store's write lock, like any other mutation.

***

### resolveIdentity()

> **resolveIdentity**(`kind`, `entityId`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IIdentityCodecResult`](IIdentityCodecResult.md)\>

The storage address `(kind, entityId)` maps to, without reading the record.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `kind` | [`Kind`](../type-aliases/Kind.md) | Selects the identity codec. Required: it is what makes the resolution unambiguous. |
| `entityId` | [`EntityId`](../type-aliases/EntityId.md) | The consumer-supplied domain key. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IIdentityCodecResult`](IIdentityCodecResult.md)\>

`Success` with the codec's `{ scope, idStem, isVersioned }`, or
`Failure` if no codec is registered for `kind` (and no default is wired) or the
codec rejects the id. Both are caller errors and both are loud.

#### Inherited from

[`IIdentityResolver`](IIdentityResolver.md).[`resolveIdentity`](IIdentityResolver.md#resolveidentity)

***

### resolveRecord()

> **resolveRecord**(`scope`, `id`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IMemoryRecord`](IMemoryRecord.md)\<`unknown`\> \| `undefined`\>

The record at `(scope, id)`, or `undefined` if the vault does not hold one.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`MemoryScopeKey`](../type-aliases/MemoryScopeKey.md) |
| `id` | [`MemoryId`](../type-aliases/MemoryId.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IMemoryRecord`](IMemoryRecord.md)\<`unknown`\> \| `undefined`\>

#### Inherited from

[`IMemoryRecordResolver`](IMemoryRecordResolver.md).[`resolveRecord`](IMemoryRecordResolver.md#resolverecord)
