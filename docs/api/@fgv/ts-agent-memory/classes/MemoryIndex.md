[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / MemoryIndex

# Class: MemoryIndex

Default in-memory [IMemoryIndex](../interfaces/IMemoryIndex.md). Maintains the derived `byKind` /
`byTag` / `byRecency` / `backlinks` views incrementally; a `'put'` for an
already-indexed key first removes the prior entry's associations so a changed
kind / tag / link set never leaves a stale reference behind.

## Implements

- [`IMemoryIndex`](../interfaces/IMemoryIndex.md)

## Methods

### backlinks()

> **backlinks**(`target`): readonly [`IEdgeTarget`](../interfaces/IEdgeTarget.md)[]

The scope-qualified sources of records whose `links` point AT `target`
(inbound edges), keyed on the target's `(scope, id)` address. The seed map
for B2 link-traversal; results are [IEdgeTarget](../interfaces/IEdgeTarget.md)s so a caller can feed
them straight back in as further traversal seeds.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | [`IEdgeTarget`](../interfaces/IEdgeTarget.md) |

#### Returns

readonly [`IEdgeTarget`](../interfaces/IEdgeTarget.md)[]

#### Implementation of

[`IMemoryIndex`](../interfaces/IMemoryIndex.md).[`backlinks`](../interfaces/IMemoryIndex.md#backlinks)

***

### byKind()

> **byKind**(`kind`): readonly [`IIndexedMemoryEntry`](../interfaces/IIndexedMemoryEntry.md)[]

Entries of the given kind, in recency order (most-recently-updated first).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `kind` | [`Kind`](../type-aliases/Kind.md) |

#### Returns

readonly [`IIndexedMemoryEntry`](../interfaces/IIndexedMemoryEntry.md)[]

#### Implementation of

[`IMemoryIndex`](../interfaces/IMemoryIndex.md).[`byKind`](../interfaces/IMemoryIndex.md#bykind)

***

### byRank()

> **byRank**(): readonly [`IIndexedMemoryEntry`](../interfaces/IIndexedMemoryEntry.md)[]

All entries ordered by store-computed [IMemoryEnvelope.rank](../interfaces/IMemoryEnvelope.md#property-rank) descending,
with recency (most-recently-updated, then `seq`) as a tiebreak. Entries with
an absent `rank` sort LAST (after every ranked entry), then by recency among
themselves. Serves a bounded top-M ([IMemoryEnvelope.rank](../interfaces/IMemoryEnvelope.md#property-rank)-ordered) page
from the in-memory index with no full-vault (filesystem) scan — and since the
page is envelope-only, a caller taking the top M materializes M bodies rather
than the vault.

#### Returns

readonly [`IIndexedMemoryEntry`](../interfaces/IIndexedMemoryEntry.md)[]

#### Implementation of

[`IMemoryIndex`](../interfaces/IMemoryIndex.md).[`byRank`](../interfaces/IMemoryIndex.md#byrank)

***

### byRecency()

> **byRecency**(): readonly [`IIndexedMemoryEntry`](../interfaces/IIndexedMemoryEntry.md)[]

All entries in recency order (most-recently-updated first).

#### Returns

readonly [`IIndexedMemoryEntry`](../interfaces/IIndexedMemoryEntry.md)[]

#### Implementation of

[`IMemoryIndex`](../interfaces/IMemoryIndex.md).[`byRecency`](../interfaces/IMemoryIndex.md#byrecency)

***

### byTag()

> **byTag**(`tag`): readonly [`IIndexedMemoryEntry`](../interfaces/IIndexedMemoryEntry.md)[]

Entries carrying the given tag, in recency order.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `tag` | [`Tag`](../type-aliases/Tag.md) |

#### Returns

readonly [`IIndexedMemoryEntry`](../interfaces/IIndexedMemoryEntry.md)[]

#### Implementation of

[`IMemoryIndex`](../interfaces/IMemoryIndex.md).[`byTag`](../interfaces/IMemoryIndex.md#bytag)

***

### entries()

> **entries**(): readonly [`IIndexedMemoryEntry`](../interfaces/IIndexedMemoryEntry.md)[]

Every indexed entry (scope + envelope). Primary read surface for the store.

#### Returns

readonly [`IIndexedMemoryEntry`](../interfaces/IIndexedMemoryEntry.md)[]

#### Implementation of

[`IMemoryIndex`](../interfaces/IMemoryIndex.md).[`entries`](../interfaces/IMemoryIndex.md#entries)

***

### get()

> **get**(`target`): [`IIndexedMemoryEntry`](../interfaces/IIndexedMemoryEntry.md) \| `undefined`

The entry at a scope-qualified address, or `undefined` if none.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | [`IEdgeTarget`](../interfaces/IEdgeTarget.md) |

#### Returns

[`IIndexedMemoryEntry`](../interfaces/IIndexedMemoryEntry.md) \| `undefined`

#### Remarks

On the contract because its absence made every caller that wanted **one**
entry rebuild a map of **all** of them: both `SemanticRetriever` (resolving
at most `topK` hits) and `LinkTraversalRetriever` (resolving a BFS frontier)
built a full-index `Map` per query for want of this. The index already keys
on `(scope, id)` internally, so this exposes a lookup it was doing anyway.

#### Implementation of

[`IMemoryIndex`](../interfaces/IMemoryIndex.md).[`get`](../interfaces/IMemoryIndex.md#get)

***

### patch()

> **patch**(`op`, `entry`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IIndexedMemoryRecord`](../interfaces/IIndexedMemoryRecord.md)\>

Apply a single incremental change. `'put'` inserts or replaces the entry
at its `(scope, id)` key (removing any prior associations first); `'delete'`
removes it.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `op` | [`MemoryIndexPatchOp`](../type-aliases/MemoryIndexPatchOp.md) |
| `entry` | [`IIndexedMemoryRecord`](../interfaces/IIndexedMemoryRecord.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IIndexedMemoryRecord`](../interfaces/IIndexedMemoryRecord.md)\>

The entry that was applied.

#### Remarks

Takes the whole record — see [IMemoryIndex.rebuild](../interfaces/IMemoryIndex.md#rebuild) for why this one
does and that one does not. It costs nothing (the caller is mid-write and
holds the record already) and it is the single point at which an index
maintaining a body-derived view could observe content without a re-read.
What is *held* is still only the projection.

#### Implementation of

[`IMemoryIndex`](../interfaces/IMemoryIndex.md).[`patch`](../interfaces/IMemoryIndex.md#patch)

***

### rebuild()

> **rebuild**(`entries`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`number`\>

Replace the entire index from a full set of entries (a store walk).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `entries` | readonly [`IIndexedMemoryEntry`](../interfaces/IIndexedMemoryEntry.md)[] |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`number`\>

The number of entries indexed.

#### Remarks

Takes the **projected** [IIndexedMemoryEntry](../interfaces/IIndexedMemoryEntry.md) form, not whole records,
and the distinction is load-bearing rather than cosmetic: **`patch` writes,
`rebuild` reads.** A rebuild is a whole-vault read that happens to terminate
in the index, so requiring whole records here would force every caller — the
store's own open path included — to materialize N bodies purely to feed a
structure that projects the envelope back out and discards them. `patch`
keeps whole records because it carries exactly one, which its caller already
holds.

#### Implementation of

[`IMemoryIndex`](../interfaces/IMemoryIndex.md).[`rebuild`](../interfaces/IMemoryIndex.md#rebuild)

***

### create()

> `static` **create**(): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`MemoryIndex`\>

Family-convention factory.

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`MemoryIndex`\>
