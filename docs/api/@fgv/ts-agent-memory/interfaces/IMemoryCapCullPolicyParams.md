[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IMemoryCapCullPolicyParams

# Interface: IMemoryCapCullPolicyParams

Parameters for [MemoryCapCullPolicy.create](../classes/MemoryCapCullPolicy.md#create).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-maxrecords"></a> `maxRecords?` | `readonly` | `number` | Maximum number of records the policy admits before culling the oldest. Counted over the `existing` cohort passed to [IWritePolicy.admit](IWritePolicy.md#admit). Absent = no cap (admission always accepts). |
| <a id="property-mutablefields"></a> `mutableFields` | `readonly` | readonly `string`[] | The fields a merge-patch update may touch (drawn from the record-level mutable vocabulary: `body` / `tags` / `links` / `provenance` / `embeddingRef`). Fields outside this list are immutable. **Remarks** This list — unlike [KnowledgeLwwPolicy](../classes/KnowledgeLwwPolicy.md)'s pinned surface — is caller-supplied, so it is what decides which fields get the RFC-7386 guarantees documented on [IWritePolicy.applyUpdate](IWritePolicy.md#applyupdate). Declare `provenance` here to get per-key provenance merging and `null` sub-key clearing; omit it and every provenance patch key is inert (dropped before the merge, so the existing value is preserved verbatim and even a whole-block `null` is a silent no-op rather than an error). |
