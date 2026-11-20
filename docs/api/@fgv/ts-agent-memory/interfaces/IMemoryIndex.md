[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IMemoryIndex

# Interface: IMemoryIndex

The derived, in-memory secondary indexes the store maintains over its
records. Never the source of truth — the FileTree is. The index is fully
rebuildable from a walk of the store ([IMemoryIndex.rebuild](#rebuild)) and is
patched incrementally on every write ([IMemoryIndex.patch](#patch)).

## Remarks

Every read returns the projected [IIndexedMemoryEntry](IIndexedMemoryEntry.md) — scope and
envelope, no body. See that type for why.

**The conformance rule: an index is a derived, COMPLETE, FAITHFUL projection
of the vault.** An implementation may change *where* entries are stored and
*how* they are looked up; it may not change *which* entries exist or *what any
envelope says*. Concretely, [IMemoryIndex.entries](#entries) must return exactly
one entry per record the store has written and not deleted, and each entry's
envelope must be the one the store patched in.

An index that filters, truncates, deduplicates, or synthesizes entries is not
a conforming implementation, and the reason is not tidiness: **the store's
write path derives from these reads** — content-hash dedup, write-policy
admission cohorts, and temporal version histories all read the index. An index
that hides an entry does not merely hide it from queries; it changes what the
next write does. That is why the previous guidance said only a faithful
delegating decorator was safe to inject. This invariant is what that guidance
was reaching for, stated so that a genuinely different implementation (a
SQLite-backed index, a lazily-paged one) is permitted while the reshaping that
was the actual hazard stays out.

**Ordering is NOT part of the contract.** [IMemoryIndex.entries](#entries) may
return entries in any order and callers that need one sort explicitly. Note
this is a *behavioural* freedom the compiler cannot police: the bundled
[MemoryIndex](../classes/MemoryIndex.md) iterates a `Map` and so returns insertion order, which is
stable and observable, so code that came to rely on it keeps compiling and
changes results. The ordered accessors ([IMemoryIndex.byRecency](#byrecency),
[IMemoryIndex.byRank](#byrank), and the recency-ordered `byKind` / `byTag`) are
the supported way to ask for an order.

## Methods

### backlinks()

> **backlinks**(`target`): readonly [`IEdgeTarget`](IEdgeTarget.md)[]

The scope-qualified sources of records whose `links` point AT `target`
(inbound edges), keyed on the target's `(scope, id)` address. The seed map
for B2 link-traversal; results are [IEdgeTarget](IEdgeTarget.md)s so a caller can feed
them straight back in as further traversal seeds.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | [`IEdgeTarget`](IEdgeTarget.md) |

#### Returns

readonly [`IEdgeTarget`](IEdgeTarget.md)[]

***

### byKind()

> **byKind**(`kind`): readonly [`IIndexedMemoryEntry`](IIndexedMemoryEntry.md)[]

Entries of the given kind, in recency order (most-recently-updated first).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `kind` | [`Kind`](../type-aliases/Kind.md) |

#### Returns

readonly [`IIndexedMemoryEntry`](IIndexedMemoryEntry.md)[]

***

### byRank()

> **byRank**(): readonly [`IIndexedMemoryEntry`](IIndexedMemoryEntry.md)[]

All entries ordered by store-computed [IMemoryEnvelope.rank](IMemoryEnvelope.md#property-rank) descending,
with recency (most-recently-updated, then `seq`) as a tiebreak. Entries with
an absent `rank` sort LAST (after every ranked entry), then by recency among
themselves. Serves a bounded top-M ([IMemoryEnvelope.rank](IMemoryEnvelope.md#property-rank)-ordered) page
from the in-memory index with no full-vault (filesystem) scan — and since the
page is envelope-only, a caller taking the top M materializes M bodies rather
than the vault.

#### Returns

readonly [`IIndexedMemoryEntry`](IIndexedMemoryEntry.md)[]

***

### byRecency()

> **byRecency**(): readonly [`IIndexedMemoryEntry`](IIndexedMemoryEntry.md)[]

All entries in recency order (most-recently-updated first).

#### Returns

readonly [`IIndexedMemoryEntry`](IIndexedMemoryEntry.md)[]

***

### byTag()

> **byTag**(`tag`): readonly [`IIndexedMemoryEntry`](IIndexedMemoryEntry.md)[]

Entries carrying the given tag, in recency order.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `tag` | [`Tag`](../type-aliases/Tag.md) |

#### Returns

readonly [`IIndexedMemoryEntry`](IIndexedMemoryEntry.md)[]

***

### entries()

> **entries**(): readonly [`IIndexedMemoryEntry`](IIndexedMemoryEntry.md)[]

Every indexed entry (scope + envelope). Primary read surface for the store.

#### Returns

readonly [`IIndexedMemoryEntry`](IIndexedMemoryEntry.md)[]

***

### get()

> **get**(`target`): [`IIndexedMemoryEntry`](IIndexedMemoryEntry.md) \| `undefined`

The entry at a scope-qualified address, or `undefined` if none.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | [`IEdgeTarget`](IEdgeTarget.md) |

#### Returns

[`IIndexedMemoryEntry`](IIndexedMemoryEntry.md) \| `undefined`

#### Remarks

On the contract because its absence made every caller that wanted **one**
entry rebuild a map of **all** of them: both `SemanticRetriever` (resolving
at most `topK` hits) and `LinkTraversalRetriever` (resolving a BFS frontier)
built a full-index `Map` per query for want of this. The index already keys
on `(scope, id)` internally, so this exposes a lookup it was doing anyway.

***

### patch()

> **patch**(`op`, `entry`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IIndexedMemoryRecord`](IIndexedMemoryRecord.md)\>

Apply a single incremental change. `'put'` inserts or replaces the entry
at its `(scope, id)` key (removing any prior associations first); `'delete'`
removes it.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `op` | [`MemoryIndexPatchOp`](../type-aliases/MemoryIndexPatchOp.md) |
| `entry` | [`IIndexedMemoryRecord`](IIndexedMemoryRecord.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IIndexedMemoryRecord`](IIndexedMemoryRecord.md)\>

The entry that was applied.

#### Remarks

Takes the whole record — see [IMemoryIndex.rebuild](#rebuild) for why this one
does and that one does not. It costs nothing (the caller is mid-write and
holds the record already) and it is the single point at which an index
maintaining a body-derived view could observe content without a re-read.
What is *held* is still only the projection.

***

### rebuild()

> **rebuild**(`entries`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`number`\>

Replace the entire index from a full set of entries (a store walk).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `entries` | readonly [`IIndexedMemoryEntry`](IIndexedMemoryEntry.md)[] |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`number`\>

The number of entries indexed.

#### Remarks

Takes the **projected** [IIndexedMemoryEntry](IIndexedMemoryEntry.md) form, not whole records,
and the distinction is load-bearing rather than cosmetic: **`patch` writes,
`rebuild` reads.** A rebuild is a whole-vault read that happens to terminate
in the index, so requiring whole records here would force every caller — the
store's own open path included — to materialize N bodies purely to feed a
structure that projects the envelope back out and discards them. `patch`
keeps whole records because it carries exactly one, which its caller already
holds.
