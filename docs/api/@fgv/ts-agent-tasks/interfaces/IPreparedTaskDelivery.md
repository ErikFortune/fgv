[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IPreparedTaskDelivery

# Interface: IPreparedTaskDelivery

One prepared delivery: an issued receipt over exactly one owed task revision.

## Remarks

Decide it by handing **this object** back to the pump that prepared it. The pump decides from what
it recorded when it prepared it, never from the object's fields, so a copy or an edited entry is
refused rather than trusted.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-context"></a> `context` | `readonly` | [`ITaskContext`](ITaskContext.md) | The rendered context, for a host that presents it as it is. |
| <a id="property-deliveryid"></a> `deliveryId` | `readonly` | [`DeliveryId`](../type-aliases/DeliveryId.md) | - |
| <a id="property-entry"></a> `entry` | `readonly` | [`ITaskDeliveryEntry`](ITaskDeliveryEntry.md) | - |
| <a id="property-expiresat"></a> `expiresAt` | `readonly` | [`Instant`](../type-aliases/Instant.md) | - |
| <a id="property-receipt"></a> `receipt` | `readonly` | [`ITaskInclusionReceipt`](ITaskInclusionReceipt.md) | The receipt `prepare` issued. Acknowledge it only after the host's own work has committed. |
