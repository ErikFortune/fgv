[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskRegistrationRequest

# Interface: ITaskRegistrationRequest

The first write of a task: its identity, the operation that creates it and the canonical
creation request that operation carried.

## Remarks

`request` is what makes a retry recognizable. A retry with the same task ID, operation ID
and canonically equal request is the same registration — it resumes a pending one, or
replays a live one, with neither a second charge nor an early release. The same identity
with a different request is refused as a `conflict`.

`record` must carry exactly one catalog operation with `operationId`, of type
`create-tracked`, `create-list` or `register-external` (the last for an unresolved record),
whose stored request equals `request`.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-operationid"></a> `operationId` | `readonly` | [`OperationId`](../type-aliases/OperationId.md) | - |
| <a id="property-record"></a> `record` | `readonly` | [`ITaskRecordDraft`](../type-aliases/ITaskRecordDraft.md) | - |
| <a id="property-request"></a> `request` | `readonly` | [`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md) | - |
| <a id="property-sourcereplay"></a> `sourceReplay?` | `readonly` | `object` | A `source-replay` registration's finite remaining envelope. Storage reserves it as an `admitted-source-replay` claim alongside the closeout (design § 8.6); the source must be the record's own binding's. Part of the registration: a retry must offer the same one. |
| `sourceReplay.envelope` | `readonly` | [`ISourceReplayEnvelope`](ISourceReplayEnvelope.md) | - |
| `sourceReplay.sourceId` | `readonly` | `string` | - |
| <a id="property-taskid"></a> `taskId` | `readonly` | [`TaskId`](../type-aliases/TaskId.md) | - |
