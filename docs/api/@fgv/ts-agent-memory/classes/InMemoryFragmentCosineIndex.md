[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / InMemoryFragmentCosineIndex

# Class: InMemoryFragmentCosineIndex

The brute-force, in-memory cosine [IFragmentVectorIndex](../interfaces/IFragmentVectorIndex.md) — the
fragment-granular sibling of [InMemoryCosineIndex](InMemoryCosineIndex.md). Stores many
`Float32Array`s per record (one per [fragment](../interfaces/IEmbeddedFragment.md)) and
answers a query by computing cosine similarity against every stored fragment,
returning the top-k fragment hits by descending score. Each hit carries back
whichever of [locator](../interfaces/IFragmentLocator.md) / `fragmentId` its fragment was
added with; a fragment must carry at least one of the two.

## Remarks

Same regime and same non-goals as [InMemoryCosineIndex](InMemoryCosineIndex.md): no external
dependency, no ANN structure, a linear scan over the stored fragments — the seam
([IFragmentVectorIndex](../interfaces/IFragmentVectorIndex.md)) stays open for a consumer to swap a persistent /
ANN backend once N grows. `addFragments` is whole-record-replace, so re-authoring
a document never leaves stale fragments behind. The index has a single dimension
established by the first fragment added; every subsequent fragment and every
`query` vector must match it or fail loudly — a mismatched dimension is an
embedder-wiring bug, never a silent zero-similarity result.
[rebuild](#rebuild) clears the index (and the
established dimension), so a re-embed with a different model is supported.

The optional `maxPerRecord` cap on `query` is applied **during selection**, before
the `topK` cut, so one long document with many strong fragments cannot crowd every
other record out of the result.

## Implements

- [`IFragmentVectorIndex`](../interfaces/IFragmentVectorIndex.md)

## Accessors

### fragmentCount

#### Get Signature

> **get** **fragmentCount**(): `number`

The total number of fragments currently held across all records.

##### Returns

`number`

The total number of **fragments** held across all records.

#### Remarks

The fan-out, and the number a caller actually watches: fragments-per-record
is what makes a fragment reconcile expensive, and neither `recordCount` nor a
record-granular count answers it.

#### Implementation of

[`IFragmentVectorIndex`](../interfaces/IFragmentVectorIndex.md).[`fragmentCount`](../interfaces/IFragmentVectorIndex.md#property-fragmentcount)

***

### recordCount

#### Get Signature

> **get** **recordCount**(): `number`

The number of records that currently have at least one stored fragment.

##### Returns

`number`

The number of **records** with at least one fragment held.

#### Remarks

Deliberately **not** named `size`, unlike [IVectorIndex.size](../interfaces/IVectorIndex.md#property-size). This
index is one-to-many, so `size` has two defensible readings and a reader
arriving from the record-granular sibling — where `size` counts vectors —
would take the wrong one silently. Two explicitly-named counts cost one extra
member and cannot be misread.

#### Implementation of

[`IFragmentVectorIndex`](../interfaces/IFragmentVectorIndex.md).[`recordCount`](../interfaces/IFragmentVectorIndex.md#property-recordcount)

## Methods

### addFragments()

> **addFragments**(`target`, `fragments`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`number`\>\>

Add (or replace) all fragments for the scope-qualified `target`. Whole-record
semantics: every fragment previously held for `target` is dropped and replaced
by `fragments`, so a re-authored document never leaves stale fragments behind.
Returns the number of fragments now held for the record.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | [`IEdgeTarget`](../interfaces/IEdgeTarget.md) |
| `fragments` | readonly [`IEmbeddedFragment`](../interfaces/IEmbeddedFragment.md)[] |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`number`\>\>

#### Implementation of

[`IFragmentVectorIndex`](../interfaces/IFragmentVectorIndex.md).[`addFragments`](../interfaces/IFragmentVectorIndex.md#addfragments)

***

### has()

> **has**(`target`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>\>

Whether this index holds **any** fragment for the scope-qualified `target`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | [`IEdgeTarget`](../interfaces/IEdgeTarget.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>\>

#### Remarks

The record-granular rationale on [IVectorIndex.has](../interfaces/IVectorIndex.md#has) applies verbatim —
a repair that trusts `embeddingRef` is not a repair. Note the granularity
this deliberately does **not** offer: it answers *"is this record
represented?"*, not *"is this particular fragment present?"*. Fragment
writes are whole-record-replace, so a record is either represented by the
current fragment set or not represented at all; a per-fragment membership
check would imply an incremental write path that does not exist.

#### Implementation of

[`IFragmentVectorIndex`](../interfaces/IFragmentVectorIndex.md).[`has`](../interfaces/IFragmentVectorIndex.md#has)

***

### query()

> **query**(`vector`, `topK`, `options?`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IVectorQueryHit`](../interfaces/IVectorQueryHit.md)[]\>\>

Return the `topK` nearest fragments to `vector`, in descending score order,
each hit carrying its record `target` plus whichever of `locator` /
`fragmentId` the stored fragment was added with.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `vector` | `Float32Array` |
| `topK` | `number` |
| `options?` | [`IFragmentQueryOptions`](../interfaces/IFragmentQueryOptions.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IVectorQueryHit`](../interfaces/IVectorQueryHit.md)[]\>\>

#### Remarks

**Every member of `options` is applied during selection, before the `topK`
cut.** That ordering is the contract, not an implementation detail: a narrowing
applied afterwards would mean the caller's `topK` is not the `topK` that reached
the index, so a scoped search would be exact only when a global over-fetch
happened to be generous enough. See [IFragmentQueryOptions](../interfaces/IFragmentQueryOptions.md).

#### Implementation of

[`IFragmentVectorIndex`](../interfaces/IFragmentVectorIndex.md).[`query`](../interfaces/IFragmentVectorIndex.md#query)

***

### rebuild()

> **rebuild**(`source`, `embed`, `options?`): `Promise`\<[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IFragmentVectorRebuildReport`](../interfaces/IFragmentVectorRebuildReport.md), [`IFragmentVectorRebuildReport`](../interfaces/IFragmentVectorRebuildReport.md)\>\>

Re-embed every record from `source` and rebuild the fragment index from
scratch — the **backfill / reconcile** operation, sibling to
[IVectorIndex.rebuild](../interfaces/IVectorIndex.md#rebuild).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `source` | [`IMemoryRecordSource`](../interfaces/IMemoryRecordSource.md) |
| `embed` | [`FragmentEmbedder`](../type-aliases/FragmentEmbedder.md) |
| `options?` | [`IVectorRebuildOptions`](../interfaces/IVectorRebuildOptions.md) |

#### Returns

`Promise`\<[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IFragmentVectorRebuildReport`](../interfaces/IFragmentVectorRebuildReport.md), [`IFragmentVectorRebuildReport`](../interfaces/IFragmentVectorRebuildReport.md)\>\>

#### Remarks

On the contract for exactly the reasons its record-granular sibling is, and
the fragment lane was worse off: `rebuild` existed only on the bundled
in-memory class, and the durable `SqliteVecFragmentIndex` had **no backfill
at all**, so a persistent fragment index could not be reconciled by any
route — contractual or concrete. Records written while it was unwired, a
re-embed after a segmenter change, and reconciliation after a swallowed
fragment-embed failure were all unreachable.

Semantics are kept observably identical to the record-granular sibling so a
caller who has learned one has learned both: a `source.list()` failure is
fatal and carries no detail (nothing was attempted, and the existing index is
untouched); a genuine rebuild then resets first; `onRecordError` defaults to
`'fail'`; and a failure carries whatever the attempt had established on the
`detail`.

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

#### Implementation of

[`IFragmentVectorIndex`](../interfaces/IFragmentVectorIndex.md).[`rebuild`](../interfaces/IFragmentVectorIndex.md#rebuild)

***

### remove()

> **remove**(`target`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IEdgeTarget`](../interfaces/IEdgeTarget.md)\>\>

Remove every fragment for the scope-qualified `target`. Returns the removed
target. Idempotent — removing a target with no fragments still succeeds.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | [`IEdgeTarget`](../interfaces/IEdgeTarget.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IEdgeTarget`](../interfaces/IEdgeTarget.md)\>\>

#### Implementation of

[`IFragmentVectorIndex`](../interfaces/IFragmentVectorIndex.md).[`remove`](../interfaces/IFragmentVectorIndex.md#remove)

***

### create()

> `static` **create**(): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`InMemoryFragmentCosineIndex`\>

Family-convention factory.

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`InMemoryFragmentCosineIndex`\>
