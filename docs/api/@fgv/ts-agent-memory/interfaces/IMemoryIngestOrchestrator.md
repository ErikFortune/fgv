[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IMemoryIngestOrchestrator

# Interface: IMemoryIngestOrchestrator

The fgv-owned six-stage ingest orchestrator. Composes the host's staged
classify / extract / (optional) resolve / relate machinery around fgv's owned
validation boundary, dedup, edge + cycle safety, provenance stamping, and the
contradicts→temporal interlock.

## Methods

### ingestBatch()

> **ingestBatch**(`items`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IIngestItemResult`](IIngestItemResult.md)[]\>\>

Ingest a batch of items. A convenience loop over [ingestItem](#ingestitem) — items are processed in
order and the first failure aborts the batch.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `items` | readonly [`IIngestItem`](IIngestItem.md)[] |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IIngestItemResult`](IIngestItemResult.md)[]\>\>

***

### ingestItem()

> **ingestItem**(`item`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IIngestItemResult`](IIngestItemResult.md)\>\>

Ingest a SINGLE item end-to-end (the first-class per-turn streaming path).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `item` | [`IIngestItem`](IIngestItem.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IIngestItemResult`](IIngestItemResult.md)\>\>
