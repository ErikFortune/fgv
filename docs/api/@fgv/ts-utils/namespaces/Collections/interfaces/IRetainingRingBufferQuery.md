[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-utils](../../../README.md) / [Collections](../README.md) / IRetainingRingBufferQuery

# Interface: IRetainingRingBufferQuery\<T\>

Query options for [RetainingRingBuffer.query](../classes/RetainingRingBuffer.md#query).

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` *extends* [`IRetainedRecord`](IRetainedRecord.md) |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-filter"></a> `filter?` | `readonly` | (`record`) => `boolean` | If supplied, only records for which the predicate returns `true` are returned. Applied before `limit`, so `limit` bounds the filtered tail. |
| <a id="property-limit"></a> `limit?` | `readonly` | `number` | If supplied, returns at most this many records — the most recent N (tail), still ordered oldest-first. |
| <a id="property-sinceseq"></a> `sinceSeq?` | `readonly` | `number` | If supplied, only records with `seq > sinceSeq` are returned, enabling incremental paging from a previously-held cursor. |
