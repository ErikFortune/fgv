[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskWithheldDisposal

# Interface: ITaskWithheldDisposal

What [IBoundTaskDelivery.disposeWithheld](IBoundTaskDelivery.md#disposewithheld) did.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-disposed"></a> `disposed` | `readonly` | `number` | How many withheld obligations this call ended. |
| <a id="property-more"></a> `more` | `readonly` | `boolean` | Whether more withheld ids remain past `limit`. |
| <a id="property-pinned"></a> `pinned` | `readonly` | `number` | How many withheld obligations an unexpired issued receipt still names: left owed. |
| <a id="property-subscriptionid"></a> `subscriptionId` | `readonly` | [`SubscriptionId`](../type-aliases/SubscriptionId.md) | - |
