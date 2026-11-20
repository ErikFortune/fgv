[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IStopReconcileRequest

# Interface: IStopReconcileRequest

A request to run the host's stop pump once over one intent.

## Remarks

`limit` bounds the effects one pass performs — stop commands, dispatches, source reads,
capability checks and resolutions. Reading records costs nothing against it. A pass that stops at
its limit cannot make the intent `satisfied`: satisfaction needs every target revisited.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-intentid"></a> `intentId` | `readonly` | [`OperationId`](../type-aliases/OperationId.md) |
| <a id="property-limit"></a> `limit?` | `readonly` | `number` |
| <a id="property-taskid"></a> `taskId` | `readonly` | [`TaskId`](../type-aliases/TaskId.md) |
