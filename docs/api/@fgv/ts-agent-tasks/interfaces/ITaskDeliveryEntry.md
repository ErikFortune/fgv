[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskDeliveryEntry

# Interface: ITaskDeliveryEntry

One owed task revision, as the pump presents it.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-categories"></a> `categories` | `readonly` | readonly [`UpdateCategory`](../type-aliases/UpdateCategory.md)[] | The categories of the updates this revision owes, ascending. |
| <a id="property-envelope"></a> `envelope` | `readonly` | [`ITaskEnvelope`](ITaskEnvelope.md) | The task as of this revision, projected for the pump's principal. |
| <a id="property-revision"></a> `revision` | `readonly` | [`TaskRevision`](../type-aliases/TaskRevision.md) | - |
| <a id="property-taskid"></a> `taskId` | `readonly` | [`TaskId`](../type-aliases/TaskId.md) | - |
| <a id="property-terminal"></a> `terminal` | `readonly` | `boolean` | Whether this revision is a terminal state — the task's outcome. |
| <a id="property-updateids"></a> `updateIds` | `readonly` | readonly [`UpdateId`](../type-aliases/UpdateId.md)[] | The updates this revision owes, which acknowledging or disposing of it discharges. |
