[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskCommitRequest

# Type Alias: ITaskCommitRequest

> **ITaskCommitRequest** = [`ITaskCommitRequestBase`](../interfaces/ITaskCommitRequestBase.md) & `object` \| [`ITaskCommitRequestBase`](../interfaces/ITaskCommitRequestBase.md) & `object` \| [`ITaskCommitRequestBase`](../interfaces/ITaskCommitRequestBase.md) & `object`

A replacement of one task record, discriminated on what makes it an accepted mutation.

## Remarks

- `operation` — a command or catalog operation. `record` must add exactly the stored
  operation `operationId`. Replaying an operation already in the record returns the
  committed record without a second application.
- `observation` — a source projection. Its dedup evidence is `sourceRevision`, which must
  be present and differ from the record's current one. It adds no operation.
- `maintenance` — receipt evolution, observation telemetry or update pruning. It changes no
  semantic revision and adds no operation.

Every replacement retains all existing operation evidence, advances the record revision by
exactly one, and is refused on a stale expected revision of either kind.
