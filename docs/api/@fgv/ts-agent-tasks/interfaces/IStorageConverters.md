[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IStorageConverters

# Interface: IStorageConverters

Converters for the records the storage packlet writes and reads.

## Remarks

**The write path runs these on the exact record it is about to write**, and the read path
runs them on what it reads back — one converter, both directions, so nothing can be
written that a restart would then refuse to read.

Record collections are not individually length-capped here: every record is refused
*before* it is parsed if its encoded size exceeds its type's byte ceiling, which bounds
the work, and per-owner count limits come from the repository's stored capacity profile,
which these converters do not see.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-draft"></a> `draft` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ITaskRecordDraft`](../type-aliases/ITaskRecordDraft.md)\> | - |
| <a id="property-formatversion"></a> `formatVersion` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`number`\> | Reads only `formatVersion` from an otherwise unvalidated object, so a record written by a newer storage format can be *reported* as such rather than as generic corruption. |
| <a id="property-inventoryentry"></a> `inventoryEntry` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ITaskInventoryEntry`](../type-aliases/ITaskInventoryEntry.md)\> | - |
| <a id="property-manifest"></a> `manifest` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ITaskRepositoryManifest`](ITaskRepositoryManifest.md)\> | - |
| <a id="property-operation"></a> `operation` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IStoredTaskOperation`](../type-aliases/IStoredTaskOperation.md)\> | - |
| <a id="property-operations"></a> `operations` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IStoredTaskOperation`](../type-aliases/IStoredTaskOperation.md)[]\> | - |
| <a id="property-record"></a> `record` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ITaskCommitRecord`](../type-aliases/ITaskCommitRecord.md)\> | - |
| <a id="property-resolvedrecord"></a> `resolvedRecord` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IResolvedTaskCommitRecord`](IResolvedTaskCommitRecord.md)\> | - |
| <a id="property-sourcerecord"></a> `sourceRecord` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ITaskSourceRecord`](ITaskSourceRecord.md)\> | A broker source-checkpoint record, validated in full. |
| <a id="property-unresolvedrecord"></a> `unresolvedRecord` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IUnresolvedTaskCommitRecord`](IUnresolvedTaskCommitRecord.md)\> | - |
| <a id="property-updates"></a> `updates` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`ITaskUpdate`](ITaskUpdate.md)[]\> | - |
