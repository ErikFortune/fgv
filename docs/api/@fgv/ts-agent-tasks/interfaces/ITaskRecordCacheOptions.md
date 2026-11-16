[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskRecordCacheOptions

# Interface: ITaskRecordCacheOptions

Parsed-record cache limits.

## Remarks

One cache per repository, shared by every record read — never one per task, subscription or
source. An entry is valid only for the record revision and exact text it was read at. With a
cache, a read that hits it does not re-read the file, so out-of-band damage to a cached record
is detected at its next uncached read rather than at this one.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-maxencodedbytes"></a> `maxEncodedBytes` | `readonly` | `number` | Encoded bytes charged for held records. At most 8 MiB. |
| <a id="property-maxentries"></a> `maxEntries` | `readonly` | `number` | At most 32. |
