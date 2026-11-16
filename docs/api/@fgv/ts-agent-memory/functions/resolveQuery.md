[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / resolveQuery

# Function: resolveQuery()

> **resolveQuery**(`entries`, `query`, `resolver`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IMemoryRecord`](../interfaces/IMemoryRecord.md)\<`unknown`\>[]\>

The shared select → order → page → materialize pipeline every non-semantic
retriever runs, and the one place the body-vs-envelope ordering decision lives.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `entries` | readonly [`IIndexedMemoryEntry`](../interfaces/IIndexedMemoryEntry.md)[] |
| `query` | [`IMemoryQuery`](../interfaces/IMemoryQuery.md) |
| `resolver` | [`IMemoryRecordResolver`](../interfaces/IMemoryRecordResolver.md) |

## Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IMemoryRecord`](../interfaces/IMemoryRecord.md)\<`unknown`\>[]\>

## Remarks

**Without `query.filter`, ordering and paging happen over envelopes and only
the page is materialized** — so `limit` genuinely bounds the number of records
read, not merely the number returned. That is what makes `limit` a legitimate
narrowing axis rather than a loophole, and it is conditional on the ordering
key being an envelope field: both shipped comparators (`recencyCompare`,
`rankCompare`) read `updated` / `seq` / `rank` and qualify. **An ordering that
keyed on a body field could not use this path** and would have to sort after
materialization, at which point `limit` bounds the result and not the read.

**With `query.filter`, every envelope-survivor must be materialized first**,
because the predicate takes a whole record. Semantics are preserved exactly;
the cost is not. Pair `filter` with an envelope axis when the read cost
matters.
