[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskMutationResult

# Interface: ITaskMutationResult

The receipt of a catalog mutation, and its stored dedup evidence.

## Remarks

`updateIds` names the update payloads the mutation committed. An update is retained only when
someone is owed it, so this is empty while no subscription matches.

## Extended by

- [`IReassignmentResult`](IReassignmentResult.md)

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-disposition"></a> `disposition` | `readonly` | [`TaskMutationDisposition`](../type-aliases/TaskMutationDisposition.md) |
| <a id="property-operationid"></a> `operationId` | `readonly` | [`OperationId`](../type-aliases/OperationId.md) |
| <a id="property-revision"></a> `revision` | `readonly` | [`TaskRevision`](../type-aliases/TaskRevision.md) |
| <a id="property-taskid"></a> `taskId` | `readonly` | [`TaskId`](../type-aliases/TaskId.md) |
| <a id="property-updateids"></a> `updateIds` | `readonly` | readonly [`UpdateId`](../type-aliases/UpdateId.md)[] |
