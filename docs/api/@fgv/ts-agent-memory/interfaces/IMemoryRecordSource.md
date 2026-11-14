[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IMemoryRecordSource

# Interface: IMemoryRecordSource

The minimal record-source surface [InMemoryCosineIndex.rebuild](../classes/InMemoryCosineIndex.md#rebuild) reads to
re-embed an entire vault. Each entry carries the record's scope-qualified
address (see [IScopedMemoryRecord](IScopedMemoryRecord.md)) so the rebuild keys the vector index
exactly as the incremental embed-on-write path does. A consumer backs this with
the store's scoped index — the vector packlet does not import the store packlet
(which depends on the vector packlet for [IVectorIndex](IVectorIndex.md), so the reverse
import would be a cycle).

## Methods

### list()

> **list**(): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IMemoryRecordListing`](IMemoryRecordListing.md)\>\>

List every record the rebuild should embed, each paired with its scoped
address, plus the exclusions this source applied if it tracks them. See
[IMemoryRecordListing](IMemoryRecordListing.md).

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IMemoryRecordListing`](IMemoryRecordListing.md)\>\>
