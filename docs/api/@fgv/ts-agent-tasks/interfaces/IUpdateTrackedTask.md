[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IUpdateTrackedTask

# Interface: IUpdateTrackedTask

A request to patch a tracked task or list.

## Extends

- [`ITaskMutationIdentity`](ITaskMutationIdentity.md)

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-expectedrevision"></a> `expectedRevision` | `readonly` | [`TaskRevision`](../type-aliases/TaskRevision.md) |
| <a id="property-operationid"></a> `operationId` | `readonly` | [`OperationId`](../type-aliases/OperationId.md) |
| <a id="property-patch"></a> `patch` | `readonly` | [`ITrackedTaskPatch`](ITrackedTaskPatch.md) |
| <a id="property-taskid"></a> `taskId` | `readonly` | [`TaskId`](../type-aliases/TaskId.md) |
