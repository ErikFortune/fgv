[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IVectorIndex

# Interface: IVectorIndex

The vector-index seam an embedding backend implements to make
[semantic recall](../classes/SemanticRetriever.md) operational.

## Remarks

Vectors cross this seam as `Float32Array` (the in-memory representation an
embedding model produces); `number[]` is reserved for the JSON-wire edges
(e.g. a provider's embedding response). The in-package brute-force cosine
implementation is [InMemoryCosineIndex](../classes/InMemoryCosineIndex.md); a consumer can swap an external
ANN backend behind the same seam once N grows beyond the in-memory regime.

Every operation returns a `Result` (async, since a real backend does I/O) so
failure is explicit and never throws across the seam.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-size"></a> `size` | `readonly` | `number` | The number of vectors currently held. **Remarks** On the contract because without it a caller cannot distinguish *"the index is empty"* from *"nothing matched"*: [IVectorIndex.query](#query) answers an empty index with `succeed([])`, which is indistinguishable from a genuine miss. The only other check available to a caller — "is a vector index wired?" — tests the **wiring**, and that stays true while the index holds nothing. Note the narrow scope: this answers *how many vectors are held*, **not** how many there ought to be. Full coverage — "is every record that should be indexed actually indexed?" — still requires comparing against the record source and [IMemoryStore.embedsKind](IMemoryStore.md#embedskind). Synchronous and non-`Result` because both shipped implementations can answer it without I/O that can fail — the in-memory index reads a `Map`'s size, and the SQLite-backed one a prepared `COUNT` against an open connection it already owns. |

## Methods

### add()

> **add**(`target`, `vector`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>\>

Add (or replace) the embedding for the scope-qualified `target`. Returns the
opaque [embeddingRef](IMemoryEnvelope.md#property-embeddingref) the store stamps
onto the envelope so a later read knows the record is embedded. Keying on the
`(scope, id)` address (not a bare id) is load-bearing: two records that share
a filename stem across scopes must not clobber each other's embedding.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | [`IEdgeTarget`](IEdgeTarget.md) |
| `vector` | `Float32Array` |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>\>

***

### has()

> **has**(`target`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>\>

Whether this index holds a vector for the scope-qualified `target`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | [`IEdgeTarget`](IEdgeTarget.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>\>

#### Remarks

On the contract because it is what makes a **targeted** repair possible, and
the reason is sharper than convenience: the only other way to ask *"is this
record indexed?"* is [IMemoryEnvelope.embeddingRef](IMemoryEnvelope.md#property-embeddingref) — and that field is
the store's **belief**, which is wrong in precisely the situation a repair
runs in. A reopened vault backed by a fresh in-memory index carries an
`embeddingRef` on every record while holding no vectors at all. **A repair
that trusts the field it is repairing is not a repair.**

It also makes a case *detectable* that an `embeddingRef`-only check cannot
see at all: the index holds the vector but the envelope lost its reference
(a failure swallowed after the vector was committed). That record needs its
reference restamped and **no embedder call**, which is only knowable by
asking the index.

`Promise<Result<boolean>>`, unlike the synchronous [IVectorIndex.size](#property-size),
because the two are not the same kind of accessor and should not be made to
look alike: `size` is a count both shipped implementations hold or can read
without a failure mode, while `has` on a durable backend is a keyed query
that can fail. Idempotent and side-effect-free; an absent target is
`succeed(false)`, never a failure.

***

### query()

> **query**(`vector`, `topK`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IVectorQueryHit`](IVectorQueryHit.md)[]\>\>

Return the `topK` nearest records to `vector`, in descending score order.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `vector` | `Float32Array` |
| `topK` | `number` |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IVectorQueryHit`](IVectorQueryHit.md)[]\>\>

***

### rebuild()

> **rebuild**(`source`, `embed`, `options?`): `Promise`\<[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IVectorRebuildReport`](IVectorRebuildReport.md), [`IVectorRebuildReport`](IVectorRebuildReport.md)\>\>

Re-embed every record from `source` and rebuild the index from scratch — the
**backfill / reconcile** operation.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `source` | [`IMemoryRecordSource`](IMemoryRecordSource.md) |
| `embed` | [`MemoryEmbedder`](../type-aliases/MemoryEmbedder.md) |
| `options?` | [`IVectorRebuildOptions`](IVectorRebuildOptions.md) |

#### Returns

`Promise`\<[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IVectorRebuildReport`](IVectorRebuildReport.md), [`IVectorRebuildReport`](IVectorRebuildReport.md)\>\>

#### Remarks

On the contract because a persisted index is unusable without it. Records
written while the index was unwired, a re-embed after a dimension change (where
the backend supports one — a `vec0`-backed table's dimension is fixed at
creation, so there it needs a drop-and-re-index instead), and reconciliation
after a swallowed embed-on-write failure are all unreachable otherwise — and the store's own docstring already promises *"the derived index
is reconciled by a later `rebuild`"*, a promise the contract could not keep for
any index but the bundled one. A caller moving from the bundled implementation
to a persistent one found the swap type-checked everywhere **except** the one
place it backfills, which is the place that mattered.

See [IVectorRebuildReport](IVectorRebuildReport.md) for what it reports and
[IVectorRebuildOptions](IVectorRebuildOptions.md) for the failure mode.

**A failure carries the report too, on the `detail`** — coverage is most
wanted exactly when a rebuild did not complete, and withholding it there made
the answer depend on the error-handling mode rather than on the question. The
`'fail'` contract itself is unchanged: it still resets, still aborts, still
returns a failure. It simply also says what it had established before it
stopped. See [IVectorRebuildReport](IVectorRebuildReport.md) for how to read a report that
arrived on a failure — it describes the attempt, not the surviving index.

On success the report is the **value** — that is where it belongs, and the
`detail` is not also populated. A failure carries no report when nothing was
attempted: always a `source.list()` failure, and additionally whatever
pre-loop step an implementation needs before it can start (the durable
`SqliteVecVectorIndex` must clear its table, and a failure to do so is such a
case). Those leave the existing index untouched, so an all-zero report would
describe an index the call never disturbed.

**A rebuild does NOT re-establish the vector dimension on a persistent
index, and this is the one place the two shipped implementations genuinely
differ.** The in-memory indexes forget their dimension when they reset, so a
rebuild with a different-dimension embedder simply re-establishes it. A
`vec0`-backed index cannot: its reset is a `DELETE FROM`, the table's
declared dimension is part of its schema, and `vec0` has no `ALTER TABLE`.
So a rebuild that changes dimension **succeeds in memory and fails on
SQLite**, where it needs the same drop-and-re-index the package README
prescribes for any schema change (drop the table, or point the index at a
fresh `tableName`). Only embedding time is at risk — vectors are derived and
the vault records remain authoritative.

***

### remove()

> **remove**(`target`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IEdgeTarget`](IEdgeTarget.md)\>\>

Remove the embedding for the scope-qualified `target`. Returns the removed
target. Idempotent — removing a target with no embedding still succeeds
(returns the target).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | [`IEdgeTarget`](IEdgeTarget.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IEdgeTarget`](IEdgeTarget.md)\>\>
