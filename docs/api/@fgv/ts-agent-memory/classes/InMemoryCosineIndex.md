[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / InMemoryCosineIndex

# Class: InMemoryCosineIndex

The brute-force, in-memory cosine [IVectorIndex](../interfaces/IVectorIndex.md). Stores one
`Float32Array` per record and answers a query by computing cosine similarity
against every stored vector, returning the top-k by descending score.

## Remarks

This is the **complete** vector implementation for the fgv regime — large-N is
explicitly out of scope (the seam stays open for a consumer to swap an external
ANN backend once N grows beyond "thousands of records"). No external dependency
and no ANN structure: a linear scan over a few thousand vectors is well within
an interactive budget.

The index has a single dimension established by the first vector added; every
subsequent `add` and every `query` vector must match that dimension or fail
loudly — a mismatched dimension is an embedder-wiring bug, never a silent
zero-similarity result. [rebuild](#rebuild) clears
the index, so a re-embed with a different model (hence dimension) is supported.

Persistence (a JSON sidecar) is deliberately out of scope for this layer — the
index is in-memory and rebuilt from the store via `rebuild`; a sidecar is a
future nicety.

## Implements

- [`IVectorIndex`](../interfaces/IVectorIndex.md)

## Accessors

### size

#### Get Signature

> **get** **size**(): `number`

The number of vectors currently held.

##### Returns

`number`

The number of vectors currently held.

#### Remarks

On the contract because without it a caller cannot distinguish *"the index is
empty"* from *"nothing matched"*: [IVectorIndex.query](../interfaces/IVectorIndex.md#query) answers an empty
index with `succeed([])`, which is indistinguishable from a genuine miss. The
only other check available to a caller — "is a vector index wired?" — tests the
**wiring**, and that stays true while the index holds nothing.

Note the narrow scope: this answers *how many vectors are held*, **not** how
many there ought to be. Full coverage — "is every record that should be indexed
actually indexed?" — still requires comparing against the record source and
[IMemoryStore.embedsKind](../interfaces/IMemoryStore.md#embedskind).

Synchronous and non-`Result` because both shipped implementations can answer it
without I/O that can fail — the in-memory index reads a `Map`'s size, and the
SQLite-backed one a prepared `COUNT` against an open connection it already owns.

#### Implementation of

[`IVectorIndex`](../interfaces/IVectorIndex.md).[`size`](../interfaces/IVectorIndex.md#property-size)

## Methods

### add()

> **add**(`target`, `vector`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>\>

Add (or replace) the embedding for the scope-qualified `target`. Returns the
opaque [embeddingRef](../interfaces/IMemoryEnvelope.md#property-embeddingref) the store stamps
onto the envelope so a later read knows the record is embedded. Keying on the
`(scope, id)` address (not a bare id) is load-bearing: two records that share
a filename stem across scopes must not clobber each other's embedding.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | [`IEdgeTarget`](../interfaces/IEdgeTarget.md) |
| `vector` | `Float32Array` |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>\>

#### Implementation of

[`IVectorIndex`](../interfaces/IVectorIndex.md).[`add`](../interfaces/IVectorIndex.md#add)

***

### has()

> **has**(`target`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>\>

Whether this index holds a vector for the scope-qualified `target`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | [`IEdgeTarget`](../interfaces/IEdgeTarget.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>\>

#### Remarks

On the contract because it is what makes a **targeted** repair possible, and
the reason is sharper than convenience: the only other way to ask *"is this
record indexed?"* is [IMemoryEnvelope.embeddingRef](../interfaces/IMemoryEnvelope.md#property-embeddingref) — and that field is
the store's **belief**, which is wrong in precisely the situation a repair
runs in. A reopened vault backed by a fresh in-memory index carries an
`embeddingRef` on every record while holding no vectors at all. **A repair
that trusts the field it is repairing is not a repair.**

It also makes a case *detectable* that an `embeddingRef`-only check cannot
see at all: the index holds the vector but the envelope lost its reference
(a failure swallowed after the vector was committed). That record needs its
reference restamped and **no embedder call**, which is only knowable by
asking the index.

`Promise<Result<boolean>>`, unlike the synchronous [IVectorIndex.size](../interfaces/IVectorIndex.md#property-size),
because the two are not the same kind of accessor and should not be made to
look alike: `size` is a count both shipped implementations hold or can read
without a failure mode, while `has` on a durable backend is a keyed query
that can fail. Idempotent and side-effect-free; an absent target is
`succeed(false)`, never a failure.

#### Implementation of

[`IVectorIndex`](../interfaces/IVectorIndex.md).[`has`](../interfaces/IVectorIndex.md#has)

***

### query()

> **query**(`vector`, `topK`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IVectorQueryHit`](../interfaces/IVectorQueryHit.md)[]\>\>

Return the `topK` nearest records to `vector`, in descending score order.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `vector` | `Float32Array` |
| `topK` | `number` |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IVectorQueryHit`](../interfaces/IVectorQueryHit.md)[]\>\>

#### Implementation of

[`IVectorIndex`](../interfaces/IVectorIndex.md).[`query`](../interfaces/IVectorIndex.md#query)

***

### rebuild()

> **rebuild**(`source`, `embed`, `options?`): `Promise`\<[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IVectorRebuildReport`](../interfaces/IVectorRebuildReport.md), [`IVectorRebuildReport`](../interfaces/IVectorRebuildReport.md)\>\>

Re-embed every record from `source` and rebuild the index from scratch.
Clears the current contents (and the established dimension) first, so a
re-embed with a different model is supported. Returns an
[IVectorRebuildReport](../interfaces/IVectorRebuildReport.md) describing what was indexed, declined and skipped.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | [`IMemoryRecordSource`](../interfaces/IMemoryRecordSource.md) | The scope-qualified record source to re-embed. |
| `embed` | [`MemoryEmbedder`](../type-aliases/MemoryEmbedder.md) | The embedder applied to each record. |
| `options?` | [`IVectorRebuildOptions`](../interfaces/IVectorRebuildOptions.md) | Rebuild options; omit for the historical `'fail'` behavior. |

#### Returns

`Promise`\<[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IVectorRebuildReport`](../interfaces/IVectorRebuildReport.md), [`IVectorRebuildReport`](../interfaces/IVectorRebuildReport.md)\>\>

#### Remarks

**A failure to LIST is always fatal**, under either mode — and **leaves the
existing index untouched**: an unreadable source says nothing about which
records exist, so there is neither an honest partial to report nor any reason
to discard what is already held.

Per-record embed/add failures are governed by
[IVectorRebuildOptions.onRecordError](../interfaces/IVectorRebuildOptions.md#property-onrecorderror), which defaults to `'fail'` —
**the historical all-or-nothing contract, unchanged**: the index is rolled back
to empty rather than left partially rebuilt, so a caller that retries a query
sees a clean empty index it can reason about.

`'skip'` opts into the lenient shape the store's own open already uses: the
rebuild continues and every casualty is returned structurally on
[IVectorRebuildReport.skipped](../interfaces/IVectorRebuildReport.md#property-skipped). **It reports more, it does not report
less** — the point is to stop one bad record emptying an entire index, not to
make failures quieter. A caller that ignores `skipped` under `'skip'` has
chosen to, rather than been given no way to know.

A [MemoryEmbedder](../type-aliases/MemoryEmbedder.md) decline is not a failure under either mode: it is
counted on [IVectorRebuildReport.declined](../interfaces/IVectorRebuildReport.md#property-declined) and never appears in `skipped`.

**A `'fail'` failure carries the partial report on its `detail`** — the
rollback still runs, so that report describes the aborted attempt rather than
the (now empty) index. The one failure with no detail is a `list` failure,
which disturbs nothing and has nothing to describe.

Both consumer-supplied hooks are capture-wrapped, so a `source` or `embed`
that throws or rejects becomes a `Failure` on the path above rather than an
exception escaping mid-rebuild — which would bypass the rollback entirely.

#### Implementation of

[`IVectorIndex`](../interfaces/IVectorIndex.md).[`rebuild`](../interfaces/IVectorIndex.md#rebuild)

***

### remove()

> **remove**(`target`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IEdgeTarget`](../interfaces/IEdgeTarget.md)\>\>

Remove the embedding for the scope-qualified `target`. Returns the removed
target. Idempotent — removing a target with no embedding still succeeds
(returns the target).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | [`IEdgeTarget`](../interfaces/IEdgeTarget.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IEdgeTarget`](../interfaces/IEdgeTarget.md)\>\>

#### Implementation of

[`IVectorIndex`](../interfaces/IVectorIndex.md).[`remove`](../interfaces/IVectorIndex.md#remove)

***

### create()

> `static` **create**(): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`InMemoryCosineIndex`\>

Family-convention factory.

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`InMemoryCosineIndex`\>
