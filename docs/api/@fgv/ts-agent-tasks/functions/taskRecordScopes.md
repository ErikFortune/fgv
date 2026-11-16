[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / \_taskRecordScopes

# Function: \_taskRecordScopes()

> **\_taskRecordScopes**(`record`): readonly [`ITaskScope`](../interfaces/ITaskScope.md)[]

**`Internal`**

The scopes a task record (or record draft) carries: its envelope's when resolved, its reference's
when unresolved. Shared between the package's packlets; not part of the published surface.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `record` | [`ITaskCommitRecord`](../type-aliases/ITaskCommitRecord.md) \| [`ITaskRecordDraft`](../type-aliases/ITaskRecordDraft.md) |

## Returns

readonly [`ITaskScope`](../interfaces/ITaskScope.md)[]
