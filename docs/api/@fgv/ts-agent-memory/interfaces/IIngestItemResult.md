[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IIngestItemResult

# Interface: IIngestItemResult

The result of ingesting a single [IIngestItem](IIngestItem.md): the item plus the
per-candidate outcomes (one item can yield zero or many candidate records).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-item"></a> `item` | `readonly` | [`IIngestItem`](IIngestItem.md) | The item that was ingested. |
| <a id="property-records"></a> `records` | `readonly` | readonly [`IIngestedRecordResult`](IIngestedRecordResult.md)[] | The per-candidate outcomes, in extraction order. |
