[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IAcknowledgementResult

# Interface: IAcknowledgementResult

The result of an acknowledgement (design § 9).

## Remarks

`newlyAcknowledged` were added to the subscription's exact history by this call;
`alreadyAcknowledged` were in it before — a replay of the same receipt, or an ID another receipt
already delivered. Neither list is ever a range: each is the receipt's own IDs, split.

## Extended by

- [`ITaskAcknowledgementCommit`](ITaskAcknowledgementCommit.md)

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-alreadyacknowledged"></a> `alreadyAcknowledged` | `readonly` | readonly [`UpdateId`](../type-aliases/UpdateId.md)[] |
| <a id="property-deliveryid"></a> `deliveryId` | `readonly` | [`DeliveryId`](../type-aliases/DeliveryId.md) |
| <a id="property-newlyacknowledged"></a> `newlyAcknowledged` | `readonly` | readonly [`UpdateId`](../type-aliases/UpdateId.md)[] |
| <a id="property-subscriptionid"></a> `subscriptionId` | `readonly` | [`SubscriptionId`](../type-aliases/SubscriptionId.md) |
