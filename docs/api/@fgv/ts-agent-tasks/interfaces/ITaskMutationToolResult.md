[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskMutationToolResult

# Interface: ITaskMutationToolResult

What `task_create`, `task_update` and `task_reassign` return to the model.

## Remarks

The task's id, its revision after the call, and whether the call changed it. `revision` is what a
further mutation passes as `expectedRevision`. The writer's operation id and update ids are not
returned: the model never supplies an operation id, and which updates were retained says whether
anyone else is subscribed to the task.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-disposition"></a> `disposition` | `readonly` | [`TaskMutationDisposition`](../type-aliases/TaskMutationDisposition.md) |
| <a id="property-revision"></a> `revision` | `readonly` | [`TaskRevision`](../type-aliases/TaskRevision.md) |
| <a id="property-taskid"></a> `taskId` | `readonly` | [`TaskId`](../type-aliases/TaskId.md) |
