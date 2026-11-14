[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / materializePage

# Function: materializePage()

> **materializePage**\<`T`\>(`selected`, `query`, `resolver`, `order?`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IMemoryRecord`](../interfaces/IMemoryRecord.md)\<`unknown`\>[]\>

Materialize a selected, ordered page — **applying `query.filter` and paging in
the right order**, which is the whole reason this is shared rather than
open-coded per retriever.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` *extends* [`IIndexedMemoryEntry`](../interfaces/IIndexedMemoryEntry.md) |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `selected` | readonly `T`[] | Entries surviving the envelope pre-filter. |
| `query` | [`IMemoryQuery`](../interfaces/IMemoryQuery.md) | The query whose `filter` / `orderBy` / `limit` / `offset` apply. |
| `resolver` | [`IMemoryRecordResolver`](../interfaces/IMemoryRecordResolver.md) | Body resolver. |
| `order?` | (`candidates`) => readonly `T`[] | Applied to whichever collection is paged; identity is legal for a retriever whose ordering is intrinsic (semantic score, traversal order). |

## Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IMemoryRecord`](../interfaces/IMemoryRecord.md)\<`unknown`\>[]\>

## Remarks

Two paths, and the choice is forced by where the predicate can run:

- **No `filter`** — order and page over *envelopes*, then read only the page.
  `limit` bounds the READ, not just the result.
- **With `filter`** — the predicate takes a whole record, so every
  envelope-survivor must be read first, then filtered, then paged. Paging
  before filtering would return fewer than `limit` rows for no reason a caller
  could see.

**Every retriever must route through this.** `indexedRecordMatchesQuery`
structurally *cannot* apply `filter` — it is handed an envelope — so a
retriever that pre-filters with it and then materializes on its own silently
ignores the predicate. That regression shipped once, in the stream that moved
`filter` out of the pre-filter; this function exists so it cannot recur.
