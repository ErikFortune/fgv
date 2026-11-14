[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-utils](../../../README.md) / [Collections](../README.md) / IRetainedRecord

# Interface: IRetainedRecord

Minimal structural contract a [RetainingRingBuffer](../classes/RetainingRingBuffer.md) record must satisfy:
a monotonic `seq` the buffer pages on. Records carry their own `seq` (assigned
by the caller) so the buffer is agnostic about how records are minted — a logger
assigns `seq` from its own counter, an observability layer assigns a library-global
`seq` shared across several buffers, etc.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-seq"></a> `seq` | `readonly` | `number` | Monotonic sequence number, assigned by the caller. The buffer requires **strictly increasing** `seq` across successive [push](../classes/RetainingRingBuffer.md#push) calls — `sinceSeq` cursor paging uses a strict `seq > sinceSeq` filter, so duplicate `seq` values held by a consumer cursor would never be re-yielded if pushed afterward. [lastSeq](../classes/RetainingRingBuffer.md#lastseq) likewise advances only past values strictly greater than its current value. |
