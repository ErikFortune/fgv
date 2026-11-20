[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory-sqlite-vec](../README.md) / SqliteVecFragmentIndex

# Class: SqliteVecFragmentIndex

A persistent, `sqlite-vec`-backed `IFragmentVectorIndex` (from
`@fgv/ts-agent-memory`) — the fragment-granular sibling of
[SqliteVecVectorIndex](SqliteVecVectorIndex.md), and the **durable** counterpart to the in-memory
`InMemoryFragmentCosineIndex`.

## Remarks

Where [SqliteVecVectorIndex](SqliteVecVectorIndex.md) keys one vector per record on a
`target_key` primary key, this index holds **many** vectors per record — one per
fragment — so it keys the `vec0` table on `target_key` as a **`PARTITION KEY`**
(many rows may share it) and stores each fragment's identity in three auxiliary
columns (`+start_off`, `+end_off`, `+fragment_id`) that ride alongside the vector
and are returned on query but never filtered — in particular `fragment_id` is
stored and returned verbatim, never parsed and never part of the query path. A
query is a brute-force `vec0` KNN scan across all partitions returning per-fragment
hits, each carrying its record `target` plus whichever identity fields the stored
fragment was added with (a fragment must carry at least one).

**`vec0` schema changes require a drop-and-re-index.** A
`CREATE VIRTUAL TABLE IF NOT EXISTS` is a no-op against an existing table (SQLite
does not compare schemas) and `vec0` has no `ALTER TABLE ADD COLUMN`, so a database written by an
earlier version of this package keeps its old auxiliary columns. `create` detects
that by parsing the stored `CREATE VIRTUAL TABLE` SQL and fails with an actionable
message naming the expected and found columns, rather than letting a widened
`INSERT` surface an opaque `no such column` at statement-prepare time. There are no
in-place migrations: drop the table (or use a fresh `tableName`) and re-index.
Fragment vectors are re-derivable from the records, so this costs embedding time,
never data.

Semantics match `InMemoryFragmentCosineIndex` exactly: `addFragments` is
whole-record-replace (a single transaction deletes every prior fragment of the
target, then inserts the new set), `remove` drops every fragment of a target,
and `query` applies the optional `maxPerRecord` cap **during selection, before
the topK cut** — so one long document cannot crowd others out. The dimension is
established by the first `addFragments` (the `vec0` column is fixed-width) and
recovered from the table schema when a persistent file is reopened; similarity is
cosine (`score = 1 - cosineDistance`), byte-identical to the in-memory index.
Large-N ANN indexing is explicitly out of scope, same regime as the record index.

**Connection ownership depends on which factory you use.** With
[SqliteVecFragmentIndex.create](#create) the `Database` is consumer-owned
(bring-your-own): this index loads the `sqlite-vec` extension onto it and
reads/writes the table, but never opens or closes the connection — and that is
the seam for backing this index and a record index with one connection. With
[SqliteVecFragmentIndex.open](#open) this package opens the file itself and hands
back a handle carrying the disposer for the connection it created.

**The embedding identity lives in the file**, exactly as for
[SqliteVecVectorIndex](SqliteVecVectorIndex.md): pass `identity` and
[SqliteVecFragmentIndex.identity](#identity) compares it against the row stored for
this table. While the status is `'mismatch'` or `'incomplete'`, `addFragments`
and `query` fail; `rebuild` is always allowed and is the remedy. `rebuild` is not
atomic across its `await`s, but a partial table is detectable: the clear and a
`'rebuilding'` marker commit together, and only a final transaction commits the
identity — so a crash, a `'fail'` rollback, a `release()` mid-rebuild, or a final
commit that could not be written all leave `'incomplete'`. While a rebuild runs,
even on a fresh index whose table does not exist yet, every other handle is
fenced. A rebuild cannot change the dimension: a fragment of another width fails
it in every mode, `'skip'` included, and a width change still needs a
drop-and-re-index. Every write transaction is `IMMEDIATE`. `has`, `remove`,
`recordCount` and `fragmentCount` are deliberately unfenced, so coverage and
cleanup still work on a mismatched or incomplete index. A handle opened without
an identity is fenced only on `'incomplete'`, and its rebuild leaves the status
`'absent'`. An older version of this package ignores the meta table, so a
downgrade leaves a row that may no longer describe the vectors.

## Implements

- `IFragmentVectorIndex`

## Accessors

### fragmentCount

#### Get Signature

> **get** **fragmentCount**(): `number`

The total number of fragments currently held across all records. Zero before
the first add. **Throws on a released index** — see
[SqliteVecFragmentIndex.recordCount](#recordcount).

##### Returns

`number`

#### Implementation of

`IFragmentVectorIndex.fragmentCount`

***

### recordCount

#### Get Signature

> **get** **recordCount**(): `number`

The number of records that currently have at least one stored fragment. Zero
before the first add.

##### Remarks

**Throws on a released index**, where every other member returns a `Failure` —
`IFragmentVectorIndex` declares this a synchronous `number`, so there is no
`Result` to fail into, and answering `0` would be a confident lie
indistinguishable from an empty index. Same reasoning as
[SqliteVecFragmentIndex.fragmentCount](#fragmentcount) and `SqliteVecVectorIndex.size`.

##### Returns

`number`

#### Implementation of

`IFragmentVectorIndex.recordCount`

## Methods

### addFragments()

> **addFragments**(`target`, `fragments`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`number`\>\>

IFragmentVectorIndex.addFragments

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | `IEdgeTarget` |
| `fragments` | readonly `IEmbeddedFragment`[] |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`number`\>\>

#### Implementation of

`IFragmentVectorIndex.addFragments`

***

### adoptIdentity()

> **adoptIdentity**(): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IIndexIdentityReport`](../type-aliases/IIndexIdentityReport.md)\>

Record this handle's identity over stored fragments that have none, without
re-embedding them. Legal while [SqliteVecFragmentIndex.identity](#identity) reports
`'absent'`, and idempotent on `'match'`, where it succeeds without writing;
`'mismatch'` and `'incomplete'` need a `rebuild`, and `'fresh'` / `'unchecked'`
have nothing to adopt. The status check and the write run in one transaction.

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IIndexIdentityReport`](../type-aliases/IIndexIdentityReport.md)\>

`Success` with the report (`'match'`), or `Failure` naming the
status that made adoption illegal, or a database error.

***

### has()

> **has**(`target`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>\>

IFragmentVectorIndex.has

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | `IEdgeTarget` |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>\>

#### Implementation of

`IFragmentVectorIndex.has`

***

### identity()

> **identity**(): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IIndexIdentityReport`](../type-aliases/IIndexIdentityReport.md)\>

Report the embedding identity stored in the database file for this table,
compared against the one this handle was opened with. Reads the database on
every call and never writes, so it is safe on a read-only connection.

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IIndexIdentityReport`](../type-aliases/IIndexIdentityReport.md)\>

`Success` with the report, or `Failure` if the index has been
released or the database could not be read.

#### Remarks

The fragment-lane counterpart of `SqliteVecVectorIndex.identity`; see
[IIndexIdentityReport](../type-aliases/IIndexIdentityReport.md) for the statuses. While the status is
`'mismatch'` or `'incomplete'`, `addFragments` and `query` fail; `rebuild` is
the remedy, and nothing is ever deleted automatically. Both reads behind the
report run in one read transaction, so it describes a single snapshot.

***

### query()

> **query**(`vector`, `topK`, `options?`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly `IVectorQueryHit`[]\>\>

IFragmentVectorIndex.query

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `vector` | `Float32Array` |
| `topK` | `number` |
| `options?` | `IFragmentQueryOptions` |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly `IVectorQueryHit`[]\>\>

#### Implementation of

`IFragmentVectorIndex.query`

***

### rebuild()

> **rebuild**(`source`, `embed`, `options?`): `Promise`\<[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`IFragmentVectorRebuildReport`, `IFragmentVectorRebuildReport`\>\>

IFragmentVectorIndex.rebuild

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `source` | `IMemoryRecordSource` |
| `embed` | `FragmentEmbedder` |
| `options?` | `IVectorRebuildOptions` |

#### Returns

`Promise`\<[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`IFragmentVectorRebuildReport`, `IFragmentVectorRebuildReport`\>\>

#### Implementation of

`IFragmentVectorIndex.rebuild`

***

### release()

> **release**(): `void`

Drops this index's prepared statements and marks it unusable. Does **not**
touch the connection.

#### Returns

`void`

#### Remarks

The fragment-lane counterpart of `SqliteVecVectorIndex.release`, and it
matters here for the same reason plus one more: a shared-connection
deployment — the case `create({ database })` exists for — holds a record index
*and* a fragment index over one connection, so it carries two instances of the
statement-lifetime shape rather than one. Both must be released.

`better-sqlite3` exposes no public `finalize()`, so dropping the last
reference does not finalize a statement — it makes it collectable *earlier*,
while the environment is alive, rather than surviving to process teardown.
That narrows the window in which `Statement::~Statement()` runs against a
torn-down environment; it is not a proof against it.

**Call this before closing a connection you own.**
[SqliteVecFragmentIndex.open](#open)'s handle does it for you.

Idempotent. After it, every member fails (or, for the two counts, throws)
rather than answering.

***

### remove()

> **remove**(`target`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`IEdgeTarget`\>\>

IFragmentVectorIndex.remove

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | `IEdgeTarget` |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`IEdgeTarget`\>\>

#### Implementation of

`IFragmentVectorIndex.remove`

***

### create()

> `static` **create**(`params`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`SqliteVecFragmentIndex`\>\>

Family-convention factory. Loads the `sqlite-vec` extension onto the supplied
`better-sqlite3` connection and, if the fragment table already exists (a
reopened persistent file), verifies its auxiliary-column set matches this
version's and recovers its established dimension so no re-embedding is needed on
open.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`ISqliteVecFragmentIndexCreateParams`](../interfaces/ISqliteVecFragmentIndexCreateParams.md) | See [ISqliteVecFragmentIndexCreateParams](../interfaces/ISqliteVecFragmentIndexCreateParams.md). |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`SqliteVecFragmentIndex`\>\>

`Success` with the index, or `Failure` if the table name is not a
simple identifier, the extension fails to load, or the existing table was
written by a version with a different auxiliary-column set (which requires a
drop-and-re-index — `vec0` cannot be altered in place).

***

### open()

> `static` **open**(`params`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ISqliteVecFragmentIndexHandle`](../interfaces/ISqliteVecFragmentIndexHandle.md)\>\>

Path-based factory. Opens the database file itself and returns the index
together with a disposer for the connection it created.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`ISqliteVecFragmentIndexOpenParams`](../interfaces/ISqliteVecFragmentIndexOpenParams.md) | See [ISqliteVecFragmentIndexOpenParams](../interfaces/ISqliteVecFragmentIndexOpenParams.md). |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ISqliteVecFragmentIndexHandle`](../interfaces/ISqliteVecFragmentIndexHandle.md)\>\>

`Success` with a [ISqliteVecFragmentIndexHandle](../interfaces/ISqliteVecFragmentIndexHandle.md), or `Failure` if
the driver could not be loaded, the file could not be opened, the table name is
not a simple identifier, the extension fails to load, or the existing table was
written by a version with a different auxiliary-column set.

#### Remarks

The fragment-granular sibling of [SqliteVecVectorIndex.open](SqliteVecVectorIndex.md#open), and present
for the same reason: a consumer doing sub-document retrieval only would
otherwise still value-import `better-sqlite3` and hand-roll a `captureResult`
around a constructor that throws.

**Use `create` instead when one connection must back both a fragment index and
a record index** — the intended shared-handle case. Two `open` calls on one path
give two independent connections, not a shared one.

If initialization fails after the file is opened, the connection is closed
before returning, so a failed `open` does not leak the descriptor it created.
Should that close *itself* fail — the connection is then genuinely leaked — the
returned message says so rather than hiding it. That includes the
auxiliary-column mismatch failure, which is reported by `create` only after the
file is open.
