[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ICommandRequest

# Interface: ICommandRequest

A request to run one registered command against one task.

## Remarks

`operationId` is the deduplication key and `expectedRevision` the concurrency
precondition; neither is a timestamp and neither is optional.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-command"></a> `command` | `readonly` | `string` |
| <a id="property-expectedrevision"></a> `expectedRevision` | `readonly` | [`TaskRevision`](../type-aliases/TaskRevision.md) |
| <a id="property-operationid"></a> `operationId` | `readonly` | [`OperationId`](../type-aliases/OperationId.md) |
| <a id="property-parameters"></a> `parameters` | `readonly` | [`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md) |
| <a id="property-taskid"></a> `taskId` | `readonly` | [`TaskId`](../type-aliases/TaskId.md) |
