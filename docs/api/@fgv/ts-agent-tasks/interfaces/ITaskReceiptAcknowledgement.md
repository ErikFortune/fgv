[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskReceiptAcknowledgement

# Interface: ITaskReceiptAcknowledgement

Acknowledges one issued manifest.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-at"></a> `at` | `readonly` | [`Instant`](../type-aliases/Instant.md) | Now. A manifest that expires at or before it is refused. |
| <a id="property-deliveryid"></a> `deliveryId` | `readonly` | [`DeliveryId`](../type-aliases/DeliveryId.md) | - |
| <a id="property-expectedrecordrevision"></a> `expectedRecordRevision` | `readonly` | `number` | - |
| <a id="property-subscriptionid"></a> `subscriptionId` | `readonly` | [`SubscriptionId`](../type-aliases/SubscriptionId.md) | - |
