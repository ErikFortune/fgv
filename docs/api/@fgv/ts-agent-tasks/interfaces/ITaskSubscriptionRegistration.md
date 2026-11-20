[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskSubscriptionRegistration

# Interface: ITaskSubscriptionRegistration

A storage-level subscription registration — the ordered inventory protocol applied to a consumer
record.

## Remarks

`operationId`, `principalKey` and `specification` are the registration's identity: a retry with
all three equal resumes a pending registration or replays a live one; anything else under the
subscription id is refused. `baseline` is what the caller captured under the same writer; a
resumed registration writes the retry's baseline, or adopts the first record that already landed.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-baseline"></a> `baseline` | `readonly` | readonly [`ITaskUpdate`](ITaskUpdate.md)[] |
| <a id="property-createdat"></a> `createdAt` | `readonly` | [`Instant`](../type-aliases/Instant.md) |
| <a id="property-operationid"></a> `operationId` | `readonly` | [`OperationId`](../type-aliases/OperationId.md) |
| <a id="property-principalkey"></a> `principalKey` | `readonly` | `string` |
| <a id="property-specification"></a> `specification` | `readonly` | [`ITaskSubscriptionSpecification`](ITaskSubscriptionSpecification.md) |
| <a id="property-subscriptionid"></a> `subscriptionId` | `readonly` | [`SubscriptionId`](../type-aliases/SubscriptionId.md) |
