[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IReassignmentResult

# Interface: IReassignmentResult

The receipt of a reassignment.

## Extends

- [`ITaskMutationResult`](ITaskMutationResult.md)

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-current"></a> `current?` | `readonly` | [`IResponsibility`](IResponsibility.md) |
| <a id="property-disposition"></a> `disposition` | `readonly` | [`TaskMutationDisposition`](../type-aliases/TaskMutationDisposition.md) |
| <a id="property-operationid"></a> `operationId` | `readonly` | [`OperationId`](../type-aliases/OperationId.md) |
| <a id="property-previous"></a> `previous?` | `readonly` | [`IResponsibility`](IResponsibility.md) |
| <a id="property-revision"></a> `revision` | `readonly` | [`TaskRevision`](../type-aliases/TaskRevision.md) |
| <a id="property-taskid"></a> `taskId` | `readonly` | [`TaskId`](../type-aliases/TaskId.md) |
| <a id="property-updateids"></a> `updateIds` | `readonly` | readonly [`UpdateId`](../type-aliases/UpdateId.md)[] |
