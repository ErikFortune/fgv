[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ICommandReceipt

# Interface: ICommandReceipt

The receipt returned for a command request, and retained as its dedup evidence.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-command"></a> `command` | `readonly` | `string` |
| <a id="property-operationid"></a> `operationId` | `readonly` | [`OperationId`](../type-aliases/OperationId.md) |
| <a id="property-result"></a> `result` | `readonly` | [`CommandState`](../type-aliases/CommandState.md) |
| <a id="property-taskid"></a> `taskId` | `readonly` | [`TaskId`](../type-aliases/TaskId.md) |
