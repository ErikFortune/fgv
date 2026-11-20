[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskObligationDisposal

# Interface: ITaskObligationDisposal

Ends obligations of one subscription without acknowledging them (storage level).

## Remarks

Every id must be one the subscription is owed now, or already in its exact history (reported, not
written again). An id an unacknowledged issued manifest names is refused: acknowledge or abandon
that receipt first, so an obligation in flight is never ended behind the host's back.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-at"></a> `at` | `readonly` | [`Instant`](../type-aliases/Instant.md) | Now. A manifest that expires at or before it pins nothing, and is evicted in the same write. |
| <a id="property-expectedrecordrevision"></a> `expectedRecordRevision` | `readonly` | `number` | - |
| <a id="property-reason"></a> `reason` | `readonly` | `string` | - |
| <a id="property-subscriptionid"></a> `subscriptionId` | `readonly` | [`SubscriptionId`](../type-aliases/SubscriptionId.md) | - |
| <a id="property-updateids"></a> `updateIds` | `readonly` | readonly [`UpdateId`](../type-aliases/UpdateId.md)[] | - |
