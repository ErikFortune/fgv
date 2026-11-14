[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IFragmentVectorIndex

# Interface: IFragmentVectorIndex

The fragment-granular sibling of [IVectorIndex](IVectorIndex.md): instead of one vector per
record it holds many vectors per record, each tagged with the identity its
[IEmbeddedFragment](IEmbeddedFragment.md) carried, and its `query` returns per-fragment hits
carrying that identity back. This is the seam behind sub-document semantic search
— the "discovery" half of a search-then-read contract, where a hit tells the
consumer which record AND which fragment of it to read.

## Remarks

Deliberately NOT `extends IVectorIndex`: an index holding many vectors per record
has no well-defined single-vector `add(target, vector)`. It is a parallel contract
with three operations — `addFragments`, `remove`, `query` — reusing
[IVectorQueryHit](IVectorQueryHit.md), on which both `locator` and `fragmentId` are optional. A
fragment hit populates whichever of the two its stored fragment carried; see
[IVectorQueryHit](IVectorQueryHit.md) for why that is not a discriminator and why fragment-ness
is determined by the index queried, not by field presence. Kept distinct from the
record-granular index per the consumer contract: memory recall stays
record-granular; sub-document knowledge uses a separate fragment index.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-fragmentcount"></a> `fragmentCount` | `readonly` | `number` | The total number of **fragments** held across all records. **Remarks** The fan-out, and the number a caller actually watches: fragments-per-record is what makes a fragment reconcile expensive, and neither `recordCount` nor a record-granular count answers it. |
| <a id="property-recordcount"></a> `recordCount` | `readonly` | `number` | The number of **records** with at least one fragment held. **Remarks** Deliberately **not** named `size`, unlike [IVectorIndex.size](IVectorIndex.md#property-size). This index is one-to-many, so `size` has two defensible readings and a reader arriving from the record-granular sibling — where `size` counts vectors — would take the wrong one silently. Two explicitly-named counts cost one extra member and cannot be misread. |

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
| `target` | [`IEdgeTarget`](IEdgeTarget.md) |
| `fragments` | readonly [`IEmbeddedFragment`](IEmbeddedFragment.md)[] |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`number`\>\>

***

### has()

> **has**(`target`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>\>

Whether this index holds **any** fragment for the scope-qualified `target`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | [`IEdgeTarget`](IEdgeTarget.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>\>

#### Remarks

The record-granular rationale on [IVectorIndex.has](IVectorIndex.md#has) applies verbatim —
a repair that trusts `embeddingRef` is not a repair. Note the granularity
this deliberately does **not** offer: it answers *"is this record
represented?"*, not *"is this particular fragment present?"*. Fragment
writes are whole-record-replace, so a record is either represented by the
current fragment set or not represented at all; a per-fragment membership
check would imply an incremental write path that does not exist.

***

### query()

> **query**(`vector`, `topK`, `options?`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IVectorQueryHit`](IVectorQueryHit.md)[]\>\>

Return the `topK` nearest fragments to `vector`, in descending score order,
each hit carrying its record `target` plus whichever of `locator` /
`fragmentId` the stored fragment was added with.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `vector` | `Float32Array` |
| `topK` | `number` |
| `options?` | [`IFragmentQueryOptions`](IFragmentQueryOptions.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IVectorQueryHit`](IVectorQueryHit.md)[]\>\>

#### Remarks

**Every member of `options` is applied during selection, before the `topK`
cut.** That ordering is the contract, not an implementation detail: a narrowing
applied afterwards would mean the caller's `topK` is not the `topK` that reached
the index, so a scoped search would be exact only when a global over-fetch
happened to be generous enough. See [IFragmentQueryOptions](IFragmentQueryOptions.md).

***

### rebuild()

> **rebuild**(`source`, `embed`, `options?`): `Promise`\<[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IFragmentVectorRebuildReport`](IFragmentVectorRebuildReport.md), [`IFragmentVectorRebuildReport`](IFragmentVectorRebuildReport.md)\>\>

Re-embed every record from `source` and rebuild the fragment index from
scratch — the **backfill / reconcile** operation, sibling to
[IVectorIndex.rebuild](IVectorIndex.md#rebuild).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `source` | [`IMemoryRecordSource`](IMemoryRecordSource.md) |
| `embed` | [`FragmentEmbedder`](../type-aliases/FragmentEmbedder.md) |
| `options?` | [`IVectorRebuildOptions`](IVectorRebuildOptions.md) |

#### Returns

`Promise`\<[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IFragmentVectorRebuildReport`](IFragmentVectorRebuildReport.md), [`IFragmentVectorRebuildReport`](IFragmentVectorRebuildReport.md)\>\>

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

***

### remove()

> **remove**(`target`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IEdgeTarget`](IEdgeTarget.md)\>\>

Remove every fragment for the scope-qualified `target`. Returns the removed
target. Idempotent — removing a target with no fragments still succeeds.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | [`IEdgeTarget`](IEdgeTarget.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IEdgeTarget`](IEdgeTarget.md)\>\>
