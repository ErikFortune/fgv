[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ICreateTaskList

# Interface: ICreateTaskList

A request to create a task list.

## Extends

- [`ICreateTrackedTask`](ICreateTrackedTask.md)

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-completion"></a> `completion` | `readonly` | [`TaskListCompletion`](../type-aliases/TaskListCompletion.md) |
| <a id="property-description"></a> `description?` | `readonly` | `string` |
| <a id="property-operationid"></a> `operationId` | `readonly` | [`OperationId`](../type-aliases/OperationId.md) |
| <a id="property-parentid"></a> `parentId?` | `readonly` | [`TaskId`](../type-aliases/TaskId.md) |
| <a id="property-responsibility"></a> `responsibility?` | `readonly` | [`IResponsibility`](IResponsibility.md) |
| <a id="property-stoppolicy"></a> `stopPolicy?` | `readonly` | [`ParentStopPolicy`](../type-aliases/ParentStopPolicy.md) |
| <a id="property-taskid"></a> `taskId` | `readonly` | [`TaskId`](../type-aliases/TaskId.md) |
| <a id="property-title"></a> `title` | `readonly` | `string` |
