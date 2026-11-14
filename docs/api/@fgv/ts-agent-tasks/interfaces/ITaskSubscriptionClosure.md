[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskSubscriptionClosure

# Interface: ITaskSubscriptionClosure

Closes one subscription (storage level).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-expectedrecordrevision"></a> `expectedRecordRevision` | `readonly` | `number` | - |
| <a id="property-obligations"></a> `obligations` | `readonly` | [`TaskSubscriptionClosureMode`](../type-aliases/TaskSubscriptionClosureMode.md) | - |
| <a id="property-reason"></a> `reason?` | `readonly` | `string` | The disposition reason `dispose` records; required for it, ignored by `retain`. |
| <a id="property-subscriptionid"></a> `subscriptionId` | `readonly` | [`SubscriptionId`](../type-aliases/SubscriptionId.md) | - |
