[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskCommitRequestBase

# Interface: ITaskCommitRequestBase

The common part of a replacement of one task record.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-expectedrecordrevision"></a> `expectedRecordRevision` | `readonly` | `number` | The record's current storage revision. |
| <a id="property-expectedrevision"></a> `expectedRevision` | `readonly` | [`TaskRevision`](../type-aliases/TaskRevision.md) | The task's current semantic revision (an unresolved record's reference revision). |
| <a id="property-record"></a> `record` | `readonly` | [`ITaskRecordDraft`](../type-aliases/ITaskRecordDraft.md) | - |
| <a id="property-taskid"></a> `taskId` | `readonly` | [`TaskId`](../type-aliases/TaskId.md) | - |
