[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ICompleteTaskList

# Interface: ICompleteTaskList

An explicit request to complete a task list.

## Remarks

Succeeds only when every current child — the complete authoritative set, hidden and archived
children included — has succeeded. An empty list, manual or automatic, completes only this
way.

## Extends

- [`ITaskMutationIdentity`](ITaskMutationIdentity.md)

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-expectedrevision"></a> `expectedRevision` | `readonly` | [`TaskRevision`](../type-aliases/TaskRevision.md) |
| <a id="property-operationid"></a> `operationId` | `readonly` | [`OperationId`](../type-aliases/OperationId.md) |
| <a id="property-outcome"></a> `outcome` | `readonly` | [`ITaskOutcome`](ITaskOutcome.md) |
| <a id="property-taskid"></a> `taskId` | `readonly` | [`TaskId`](../type-aliases/TaskId.md) |
