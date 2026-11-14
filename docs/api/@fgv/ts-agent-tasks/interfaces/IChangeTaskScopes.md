[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IChangeTaskScopes

# Interface: IChangeTaskScopes

A request to change a task's scopes.

## Remarks

Expressed as additions and removals, each of which must lie within the bound view's
selectors, rather than as a replacement list: a replacement would require a principal to
restate scopes it cannot see. Scopes outside the view are never touched.

## Extends

- [`ITaskMutationIdentity`](ITaskMutationIdentity.md)

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-add"></a> `add?` | `readonly` | readonly [`ITaskScope`](ITaskScope.md)[] |
| <a id="property-expectedrevision"></a> `expectedRevision` | `readonly` | [`TaskRevision`](../type-aliases/TaskRevision.md) |
| <a id="property-operationid"></a> `operationId` | `readonly` | [`OperationId`](../type-aliases/OperationId.md) |
| <a id="property-remove"></a> `remove?` | `readonly` | readonly [`ITaskScope`](ITaskScope.md)[] |
| <a id="property-taskid"></a> `taskId` | `readonly` | [`TaskId`](../type-aliases/TaskId.md) |
