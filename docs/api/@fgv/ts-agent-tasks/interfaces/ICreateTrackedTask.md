[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ICreateTrackedTask

# Interface: ICreateTrackedTask

A request to create a tracked task through a bound writer.

## Remarks

Scopes are not a field: a bound creation takes the view's host-configured creation scopes.
The request is a registration identity — a retry with the same `taskId`, `operationId` and
canonical request (under the same principal) replays; anything else under that id conflicts.

## Extended by

- [`ICreateTaskList`](ICreateTaskList.md)

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-description"></a> `description?` | `readonly` | `string` |
| <a id="property-operationid"></a> `operationId` | `readonly` | [`OperationId`](../type-aliases/OperationId.md) |
| <a id="property-parentid"></a> `parentId?` | `readonly` | [`TaskId`](../type-aliases/TaskId.md) |
| <a id="property-responsibility"></a> `responsibility?` | `readonly` | [`IResponsibility`](IResponsibility.md) |
| <a id="property-stoppolicy"></a> `stopPolicy?` | `readonly` | [`ParentStopPolicy`](../type-aliases/ParentStopPolicy.md) |
| <a id="property-taskid"></a> `taskId` | `readonly` | [`TaskId`](../type-aliases/TaskId.md) |
| <a id="property-title"></a> `title` | `readonly` | `string` |
