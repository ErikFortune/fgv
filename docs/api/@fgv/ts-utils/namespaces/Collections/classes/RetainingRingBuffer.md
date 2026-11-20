[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-utils](../../../README.md) / [Collections](../README.md) / RetainingRingBuffer

# Class: RetainingRingBuffer\<T\>

A generic bounded most-recent-N ring of records, with monotonic-`seq` cursor
paging and predicate filtering.

## Remarks

The buffer is a pure storage substrate: the caller mints each record (assigning
its own `seq` and any other fields) and [push](#push)es
it. The buffer never reshapes a record — it only retains, evicts the oldest when
full (O(1), no `shift()` re-indexing regardless of capacity), and answers queries.

Separating record minting from retention lets one `seq` authority feed several
buffers consistently (e.g. an observability layer that assigns a library-global
`seq` and fans the same record out to multiple retaining stores), and lets a
single-authority consumer (e.g. a logger) own its own `seq` counter. It is the
shared mechanism beneath `RetainingLogger` and
any schema-aware observation store.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` *extends* [`IRetainedRecord`](../interfaces/IRetainedRecord.md) |

## Constructors

### Constructor

> **new RetainingRingBuffer**\<`T`\>(`params?`): `RetainingRingBuffer`\<`T`\>

Creates a new retaining ring buffer.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params?` | [`IRetainingRingBufferCreateParams`](../interfaces/IRetainingRingBufferCreateParams.md) | [Construction options](../interfaces/IRetainingRingBufferCreateParams.md). |

#### Returns

`RetainingRingBuffer`\<`T`\>

## Accessors

### lastSeq

#### Get Signature

> **get** **lastSeq**(): `number`

The highest `seq` pushed so far. A client can hold this value and pass it as
`sinceSeq` to page only records pushed afterward. Stable across eviction and
[clear()](#clear).

##### Returns

`number`

***

### records

#### Get Signature

> **get** **records**(): readonly `T`[]

The retained records, oldest-first.

##### Returns

readonly `T`[]

***

### size

#### Get Signature

> **get** **size**(): `number`

The number of records currently retained.

##### Returns

`number`

## Methods

### clear()

> **clear**(): `void`

Clears all retained records. Does NOT reset [lastSeq](#lastseq),
so a client holding a `sinceSeq` cursor never re-sees a sequence number.

#### Returns

`void`

***

### push()

> **push**(`record`): `T`

Retains a record, evicting the oldest if the ring is full.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `record` | `T` | The record to retain. Its `seq` should be greater than the `seq` of the previously-pushed record so cursor paging stays monotonic. |

#### Returns

`T`

The same record, for call-site chaining.

***

### query()

> **query**(`query?`): readonly `T`[]

Returns retained records, oldest-first, optionally filtered and paged.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `query?` | [`IRetainingRingBufferQuery`](../interfaces/IRetainingRingBufferQuery.md)\<`T`\> | [Filtering and paging options](../interfaces/IRetainingRingBufferQuery.md). |

#### Returns

readonly `T`[]

The matching records, oldest-first.
