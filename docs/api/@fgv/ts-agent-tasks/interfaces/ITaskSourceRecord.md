[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskSourceRecord

# Interface: ITaskSourceRecord

A broker source-checkpoint record (`source-<sourceId>.json`): the committed reconciliation
position for one source.

## Remarks

Local progress only — never permission to garbage-collect the source, and never a copy of the
executor's own job record (design § 8.3). `cursor` is written only after every observation of the
page it follows has committed, so it may lag the task records but never lead them.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-cursor"></a> `cursor?` | `readonly` | `string` | - |
| <a id="property-formatversion"></a> `formatVersion` | `readonly` | `1` | - |
| <a id="property-history"></a> `history` | `readonly` | [`SourceHistoryContract`](../type-aliases/SourceHistoryContract.md) | - |
| <a id="property-id"></a> `id` | `readonly` | `string` | - |
| <a id="property-pages"></a> `pages` | `readonly` | `number` | Pages committed through this record, for diagnostics. |
| <a id="property-recordrevision"></a> `recordRevision` | `readonly` | `number` | - |
