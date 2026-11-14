[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / MemoryIngestOrchestrator

# Class: MemoryIngestOrchestrator

Default [IMemoryIngestOrchestrator](../interfaces/IMemoryIngestOrchestrator.md).

## Implements

- [`IMemoryIngestOrchestrator`](../interfaces/IMemoryIngestOrchestrator.md)

## Methods

### ingestBatch()

> **ingestBatch**(`items`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IIngestItemResult`](../interfaces/IIngestItemResult.md)[]\>\>

Ingest a batch of items. A convenience loop over [ingestItem](../interfaces/IMemoryIngestOrchestrator.md#ingestitem) — items are processed in
order and the first failure aborts the batch.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `items` | readonly [`IIngestItem`](../interfaces/IIngestItem.md)[] |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IIngestItemResult`](../interfaces/IIngestItemResult.md)[]\>\>

#### Implementation of

[`IMemoryIngestOrchestrator`](../interfaces/IMemoryIngestOrchestrator.md).[`ingestBatch`](../interfaces/IMemoryIngestOrchestrator.md#ingestbatch)

***

### ingestItem()

> **ingestItem**(`item`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IIngestItemResult`](../interfaces/IIngestItemResult.md)\>\>

Ingest a SINGLE item end-to-end (the first-class per-turn streaming path).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `item` | [`IIngestItem`](../interfaces/IIngestItem.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IIngestItemResult`](../interfaces/IIngestItemResult.md)\>\>

#### Implementation of

[`IMemoryIngestOrchestrator`](../interfaces/IMemoryIngestOrchestrator.md).[`ingestItem`](../interfaces/IMemoryIngestOrchestrator.md#ingestitem)

***

### create()

> `static` **create**(`params`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`MemoryIngestOrchestrator`\>

Family-convention factory.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `params` | [`IMemoryIngestOrchestratorCreateParams`](../interfaces/IMemoryIngestOrchestratorCreateParams.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`MemoryIngestOrchestrator`\>
