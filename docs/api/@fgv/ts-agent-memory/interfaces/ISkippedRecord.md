[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / ISkippedRecord

# Interface: ISkippedRecord

A record that [FileTreeMemoryStore.create](../classes/FileTreeMemoryStore.md#create) could not load and
quarantined (only produced in [\`'skip'\` mode](../type-aliases/MemoryRecordErrorMode.md)).
The `path` identifies WHICH record was skipped so a host can repair it.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-error"></a> `error` | `readonly` | `string` | The parse/validation failure message (includes the record path). |
| <a id="property-path"></a> `path` | `readonly` | `string` | The record file's on-disk path within the vault (`<scope directory>/<filename>.md`). |
| <a id="property-scope"></a> `scope?` | `readonly` | [`MemoryScopeKey`](../type-aliases/MemoryScopeKey.md) | The scope the record lives under: its parent directory path, decoded through [scopeDecoding](IFileTreeMemoryStoreCreateParams.md#property-scopedecoding) when one is supplied. Absent when that directory does not decode to a scope. |
