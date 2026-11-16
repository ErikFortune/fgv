[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / orderingCompare

# Function: orderingCompare()

> **orderingCompare**(`orderBy?`): (`a`, `b`) => `number`

Select the record comparator for a query's [orderBy](../interfaces/IMemoryQuery.md#property-orderby)
axis: [rankCompare](rankCompare.md) for `'rank'`, [recencyCompare](recencyCompare.md) otherwise (the
default, byte-identical to the pre-`orderBy` behavior).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `orderBy?` | `"rank"` \| `"recency"` |

## Returns

(`a`, `b`) => `number`
