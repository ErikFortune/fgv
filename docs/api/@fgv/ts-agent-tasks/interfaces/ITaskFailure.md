[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskFailure

# Interface: ITaskFailure

Classified detail for a failed task operation.

## Remarks

`capacity` accompanies `backpressure` and no other code; the converter enforces that.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-capacity"></a> `capacity?` | `readonly` | [`ICapacityFailure`](ICapacityFailure.md) |
| <a id="property-code"></a> `code` | `readonly` | [`TaskFailureCode`](../type-aliases/TaskFailureCode.md) |
| <a id="property-operationid"></a> `operationId?` | `readonly` | [`OperationId`](../type-aliases/OperationId.md) |
| <a id="property-retry"></a> `retry` | `readonly` | `"safe"` \| `"reconcile-first"` \| `"after-host-action"` |
