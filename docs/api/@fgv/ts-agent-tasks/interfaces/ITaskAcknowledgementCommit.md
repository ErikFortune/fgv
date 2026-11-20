[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskAcknowledgementCommit

# Interface: ITaskAcknowledgementCommit

What storage returns from a committed acknowledgement.

## Extends

- [`IAcknowledgementResult`](IAcknowledgementResult.md)

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-alreadyacknowledged"></a> `alreadyAcknowledged` | `readonly` | readonly [`UpdateId`](../type-aliases/UpdateId.md)[] |
| <a id="property-deliveryid"></a> `deliveryId` | `readonly` | [`DeliveryId`](../type-aliases/DeliveryId.md) |
| <a id="property-newlyacknowledged"></a> `newlyAcknowledged` | `readonly` | readonly [`UpdateId`](../type-aliases/UpdateId.md)[] |
| <a id="property-record"></a> `record` | `readonly` | [`ITaskConsumerRecord`](ITaskConsumerRecord.md) |
| <a id="property-subscriptionid"></a> `subscriptionId` | `readonly` | [`SubscriptionId`](../type-aliases/SubscriptionId.md) |
