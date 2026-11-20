[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskMutationIdentity

# Interface: ITaskMutationIdentity

The identity and precondition every mutation of an existing task carries.

## Extended by

- [`IUpdateTrackedTask`](IUpdateTrackedTask.md)
- [`IReassignTask`](IReassignTask.md)
- [`IChangeTaskScopes`](IChangeTaskScopes.md)
- [`IReparentTask`](IReparentTask.md)
- [`ICompleteTaskList`](ICompleteTaskList.md)

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-expectedrevision"></a> `expectedRevision` | `readonly` | [`TaskRevision`](../type-aliases/TaskRevision.md) |
| <a id="property-operationid"></a> `operationId` | `readonly` | [`OperationId`](../type-aliases/OperationId.md) |
| <a id="property-taskid"></a> `taskId` | `readonly` | [`TaskId`](../type-aliases/TaskId.md) |
