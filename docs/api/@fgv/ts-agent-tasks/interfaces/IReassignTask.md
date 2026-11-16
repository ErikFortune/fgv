[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IReassignTask

# Interface: IReassignTask

A request to change a task's responsibility. `'unassigned'` unassigns explicitly: the member is
required, so an omitted responsibility is never an accidental unassignment.

## Extends

- [`ITaskMutationIdentity`](ITaskMutationIdentity.md)

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-expectedrevision"></a> `expectedRevision` | `readonly` | [`TaskRevision`](../type-aliases/TaskRevision.md) |
| <a id="property-operationid"></a> `operationId` | `readonly` | [`OperationId`](../type-aliases/OperationId.md) |
| <a id="property-responsibility"></a> `responsibility` | `readonly` | [`IResponsibility`](IResponsibility.md) \| `"unassigned"` |
| <a id="property-taskid"></a> `taskId` | `readonly` | [`TaskId`](../type-aliases/TaskId.md) |
