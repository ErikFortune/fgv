[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IStopCommandMarker

# Interface: IStopCommandMarker

The provenance a target's stop command carries in the target's own record: which intent, of which
root, it is an attempt of.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-intentid"></a> `intentId` | `readonly` | [`OperationId`](../type-aliases/OperationId.md) |
| <a id="property-rootid"></a> `rootId` | `readonly` | [`TaskId`](../type-aliases/TaskId.md) |
