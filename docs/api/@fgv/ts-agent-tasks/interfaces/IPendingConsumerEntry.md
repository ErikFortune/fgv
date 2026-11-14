[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IPendingConsumerEntry

# Interface: IPendingConsumerEntry

A pending subscription registration: accepted into the inventory, its record possibly not yet
written, and **not active** — no commit names it in an audience until the entry goes live.

## Remarks

Holds the registration's identity and its `subscription-activation` claim, which reserves the
first record's whole footprint. A crash in this window leaves the reservation held and the
subscription inactive until the same registration is retried. (T7.)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-capacityclaims"></a> `capacityClaims` | `readonly` | readonly [`ITaskCapacityClaim`](../type-aliases/ITaskCapacityClaim.md)[] | - |
| <a id="property-id"></a> `id` | `readonly` | [`SubscriptionId`](../type-aliases/SubscriptionId.md) | - |
| <a id="property-operationid"></a> `operationId` | `readonly` | [`OperationId`](../type-aliases/OperationId.md) | - |
| <a id="property-principalkey"></a> `principalKey` | `readonly` | `string` | - |
| <a id="property-recordfingerprint"></a> `recordFingerprint` | `readonly` | `string` | The canonical fingerprint of the exact first record this registration committed to write. A record found at the name is adopted only when it matches, so a landed record whose contents were altered — its baseline included — is never activated. |
| <a id="property-specification"></a> `specification` | `readonly` | [`ITaskSubscriptionSpecification`](ITaskSubscriptionSpecification.md) | - |
| <a id="property-state"></a> `state` | `readonly` | `"pending"` | - |
