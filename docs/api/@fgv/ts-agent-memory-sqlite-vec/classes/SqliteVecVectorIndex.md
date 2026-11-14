[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory-sqlite-vec](../README.md) / SqliteVecVectorIndex

# Class: SqliteVecVectorIndex

A persistent, `sqlite-vec`-backed `IVectorIndex` for `@fgv/ts-agent-memory`.

## Remarks

This is the **durable** counterpart to the in-memory `InMemoryCosineIndex`:
embeddings live in a `sqlite-vec` `vec0` virtual table inside a `better-sqlite3`
database, so they survive a process restart. A consumer that wires this index
into `FileTreeMemoryStore` (instead of the in-memory index) opens an existing
vault **without re-embedding it** — the vectors are already on disk. New writes
still flow through the store's incremental embed-on-write path; there is no core
store change.

The index is keyed by the canonical `edgeTargetKey` of each record's
scope-qualified `(scope, id)` address (a `TEXT PRIMARY KEY` on the `vec0` table),
so two records that share a filename stem across scopes never collide. The
dimension is established by the first `add` (the `vec0` column is fixed-width) and
recovered from the table schema when a persistent file is reopened; every later
`add`/`query` must match it or fail loudly, exactly as the in-memory index does.
Similarity is cosine (`distance_metric=cosine`): the returned `score` is
`1 - cosineDistance`, i.e. cosine similarity in `[-1, 1]`, higher = more similar —
byte-for-byte the same scoring contract as `InMemoryCosineIndex`.

Query is a brute-force `vec0` KNN scan (not an ANN structure): correct and
durable, appropriate for the same "thousands of records" regime the in-memory
index targets. Large-N ANN indexing is explicitly out of scope — see the README.

**Connection ownership depends on which factory you use.** With
[SqliteVecVectorIndex.create](#create) the `Database` is consumer-owned
(bring-your-own): this index loads the `sqlite-vec` extension onto it and
reads/writes the table, but never opens or closes the connection — and that is
the seam for backing a record index and a fragment index with one connection.
With [SqliteVecVectorIndex.open](#open) this package opens the file itself and
hands back a handle carrying the disposer for the connection it created.

**The embedding identity lives in the file.** Pass `identity` (an opaque string
naming the embedding model) and the index stores it in an ordinary
`fgv_sqlite_vec_meta` table, one row per index table, so it travels with the
vectors through a copy or restore. [SqliteVecVectorIndex.identity](#identity) compares
it on every call. While the status is `'mismatch'` or `'incomplete'`, `add` and
`query` fail with a message naming the status; `rebuild` is always allowed and is
the remedy. The first `add` to a fresh index creates the table and stores the
identity in one transaction; each fence check shares a transaction with the read
or write it guards, and every write transaction is `IMMEDIATE`. Nothing is
deleted automatically. `has`, `remove` and `size` are deliberately unfenced, so
coverage reporting and cleanup still work on a mismatched or incomplete index.
A handle opened without an identity is fenced only on `'incomplete'`: it can
write under another handle's stored identity, and its rebuild leaves the status
`'absent'` — identity checking is opt-in, per handle. An older version of this
package ignores the meta table entirely, so a file written by it (or rebuilt by
it after a downgrade) carries a row that no longer describes its vectors.

## Implements

- `IVectorIndex`

## Accessors

### size

#### Get Signature

> **get** **size**(): `number`

The number of vectors currently held. Zero before the first `add`.

##### Remarks

**Throws on a released index**, where every other member returns a `Failure` —
because `IVectorIndex` declares this a synchronous `number` and there is no
`Result` to fail into. Throwing preserves the behaviour a released index had
before it had an explicit released state (the underlying statement threw
against the closed connection); the alternative, answering `0`, would be a
confident lie indistinguishable from an empty index.

##### Returns

`number`

#### Implementation of

`IVectorIndex.size`

## Methods

### add()

> **add**(`target`, `vector`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>\>

IVectorIndex.add

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | `IEdgeTarget` |
| `vector` | `Float32Array` |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>\>

#### Implementation of

`IVectorIndex.add`

***

### adoptIdentity()

> **adoptIdentity**(): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IIndexIdentityReport`](../type-aliases/IIndexIdentityReport.md)\>

Record this handle's identity over stored vectors that have none, without
re-embedding them — a one-time migration for a consumer that kept the identity
somewhere else.

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IIndexIdentityReport`](../type-aliases/IIndexIdentityReport.md)\>

`Success` with the report (`'match'`), or `Failure` naming the
status that made adoption illegal, or a database error (for example on a
read-only connection).

#### Remarks

Legal while [SqliteVecVectorIndex.identity](#identity) reports `'absent'`, and
idempotent on `'match'`, where it succeeds without writing. `'mismatch'` and
`'incomplete'` are refused because adopting would certify vectors that are
known to be wrong or partial; they need a `rebuild`. `'fresh'` and
`'unchecked'` are refused because there is nothing, or no identity, to adopt.
The status check and the write run in one transaction.

***

### has()

> **has**(`target`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>\>

IVectorIndex.has

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | `IEdgeTarget` |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>\>

#### Implementation of

`IVectorIndex.has`

***

### identity()

> **identity**(): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IIndexIdentityReport`](../type-aliases/IIndexIdentityReport.md)\>

Report the embedding identity stored in the database file, compared against
the one this handle was opened with. Reads the database on every call and
never writes, so it is safe on a read-only connection.

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IIndexIdentityReport`](../type-aliases/IIndexIdentityReport.md)\>

`Success` with the report, or `Failure` if the index has been
released or the database could not be read.

#### Remarks

See [IIndexIdentityReport](../type-aliases/IIndexIdentityReport.md) for what each status means. While the status
is `'mismatch'` or `'incomplete'`, `add` and `query` fail; `rebuild` is the
remedy, and nothing is ever deleted automatically. Both reads behind the
report run in one read transaction, so it describes a single snapshot.

***

### query()

> **query**(`vector`, `topK`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly `IVectorQueryHit`[]\>\>

IVectorIndex.query

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `vector` | `Float32Array` |
| `topK` | `number` |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly `IVectorQueryHit`[]\>\>

#### Implementation of

`IVectorIndex.query`

***

### rebuild()

> **rebuild**(`source`, `embed`, `options?`): `Promise`\<[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`IVectorRebuildReport`, `IVectorRebuildReport`\>\>

Re-embed every record from `source` and rebuild the persisted index — see
`IVectorIndex.rebuild` for the mode semantics, which this implementation
matches exactly.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `source` | `IMemoryRecordSource` |
| `embed` | `MemoryEmbedder` |
| `options?` | `IVectorRebuildOptions` |

#### Returns

`Promise`\<[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`IVectorRebuildReport`, `IVectorRebuildReport`\>\>

#### Remarks

**Not atomic, and cannot be.** `better-sqlite3` transactions are synchronous,
so one cannot span the `await embed(...)` calls this loop makes — unlike
[SqliteVecVectorIndex.add](#add), which wraps its delete-then-insert. The
`'fail'` / `'skip'` modes therefore cover only failures JavaScript can catch:
a process kill mid-rebuild leaves the table holding neither the old index nor
the complete new one, and the remedy is to run `rebuild` again.

**A partial table is detectable.** The clear and a `'rebuilding'` marker in the
identity row commit in one transaction; only a final transaction at the end
replaces the marker with the handle's identity. Until then
[SqliteVecVectorIndex.identity](#identity) reports `'incomplete'` and `add` and
`query` are fenced — after a crash, after a `'fail'` rollback, and after a
final commit that could not be written (for example `SQLITE_BUSY` from another
connection on the same file). The marker is a crash marker, not a lock: two
rebuilds of one table on two connections at once are not coordinated.

A rebuild cannot change the dimension. A vector whose width differs from the
table's is **not** a per-record error: the rebuild fails in every mode,
including `'skip'`, and leaves the index `'incomplete'`. A swap to a model of a
different width needs the table dropped (or a fresh `tableName`) and
re-indexed. A `release()` while the rebuild runs also fails it before the final
commit, leaving `'incomplete'`.

#### Implementation of

`IVectorIndex.rebuild`

***

### release()

> **release**(): `void`

Drops this index's prepared statements and marks it unusable. Does **not**
touch the connection.

#### Returns

`void`

#### Remarks

`better-sqlite3` exposes no public `finalize()`, so releasing the last
reference to a `Statement` does not finalize it — it makes it collectable
*earlier*, while the environment is alive, rather than surviving to process
teardown. That narrows the window in which `Statement::~Statement()` runs
against a torn-down environment; it is not a proof against it.

**Call this before closing a connection you own.** [SqliteVecVectorIndex.open](#open)'s handle does it for you. A `create()`-made index
holds a connection it does not own and stays structurally incapable of
closing it — this method drops only what the index itself allocated, which is
why it is safe to expose there.

Idempotent. After it, every member fails (or, for `size`, throws) rather than
answering: a released index is deliberately distinguishable from one that has
simply never had an `add`, whose `_stmts` are also absent but which answers
`size === 0` truthfully.

***

### remove()

> **remove**(`target`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`IEdgeTarget`\>\>

IVectorIndex.remove

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | `IEdgeTarget` |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`IEdgeTarget`\>\>

#### Implementation of

`IVectorIndex.remove`

***

### create()

> `static` **create**(`params`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`SqliteVecVectorIndex`\>\>

Family-convention factory. Loads the `sqlite-vec` extension onto the supplied
`better-sqlite3` connection and, if the vector table already exists (a reopened
persistent file), recovers its established dimension so no re-embedding is
needed on open.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`ISqliteVecVectorIndexCreateParams`](../interfaces/ISqliteVecVectorIndexCreateParams.md) | See [ISqliteVecVectorIndexCreateParams](../interfaces/ISqliteVecVectorIndexCreateParams.md). |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`SqliteVecVectorIndex`\>\>

`Success` with the index, or `Failure` if the table name is not a
simple identifier or the extension fails to load.

***

### open()

> `static` **open**(`params`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ISqliteVecVectorIndexHandle`](../interfaces/ISqliteVecVectorIndexHandle.md)\>\>

Path-based factory. Opens the database file itself and returns the index
together with a disposer for the connection it created.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`ISqliteVecVectorIndexOpenParams`](../interfaces/ISqliteVecVectorIndexOpenParams.md) | See [ISqliteVecVectorIndexOpenParams](../interfaces/ISqliteVecVectorIndexOpenParams.md). |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ISqliteVecVectorIndexHandle`](../interfaces/ISqliteVecVectorIndexHandle.md)\>\>

`Success` with a [ISqliteVecVectorIndexHandle](../interfaces/ISqliteVecVectorIndexHandle.md), or `Failure` if
the driver could not be loaded, the file could not be opened, the table name is
not a simple identifier, or the extension fails to load.

#### Remarks

The convenience over [SqliteVecVectorIndex.create](#create) is that the consumer
neither value-imports `better-sqlite3` nor re-establishes `Result` discipline
around a constructor that throws — this is the one place the package leaked its
own dependency into consumer source.

**Use `create` instead when one connection must back more than one index** (a
record index and a fragment index in the same file, the intended shared-handle
case). Two `open` calls on one path give two independent connections, not a
shared one.

If initialization fails after the file is opened, the connection is closed
before returning, so a failed `open` does not leak the descriptor it created.
Should that close *itself* fail — the connection is then genuinely leaked — the
returned message says so rather than hiding it.
