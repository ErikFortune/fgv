[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IReparentTask

# Interface: IReparentTask

A request to move a task under another parent (`{ taskId }`), or to make it a root
(`'root'`). The member is required and a parent is tagged, so no task id can be mistaken for the
root.

## Extends

- [`ITaskMutationIdentity`](ITaskMutationIdentity.md)

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-expectedrevision"></a> `expectedRevision` | `readonly` | [`TaskRevision`](../type-aliases/TaskRevision.md) |
| <a id="property-operationid"></a> `operationId` | `readonly` | [`OperationId`](../type-aliases/OperationId.md) |
| <a id="property-parent"></a> `parent` | `readonly` | \{ `taskId`: [`TaskId`](../type-aliases/TaskId.md); \} \| `"root"` |
| <a id="property-taskid"></a> `taskId` | `readonly` | [`TaskId`](../type-aliases/TaskId.md) |
