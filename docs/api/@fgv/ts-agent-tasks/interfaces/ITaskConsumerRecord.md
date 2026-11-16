[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskConsumerRecord

# Interface: ITaskConsumerRecord

A subscription's single atomic record (`consumer-<subscriptionId>.json`): its specification,
baseline obligations, exact acknowledgement history and issued-receipt manifests.

## Remarks

`acknowledged` is the **exact** set of update IDs this subscription has acknowledged, strictly
ascending. There is no high-water revision: an update is discharged only by its own ID being here.
The set is retained for the record's whole life — task archival does not shrink it — and is read
on demand, never kept resident.

`baseline` holds the start obligations of a `current` subscription, each an immutable payload
whose audience is this subscription alone. `capacityClaims` holds the activation claim (consumed
once the record is live) and the receipt-preparation claim.

`disposed` holds the obligations it ended without acknowledging, each with its reason, strictly
ascending by id and disjoint from `acknowledged`. Together they are the subscription's exact
history. A baseline payload leaves `baseline` in the same write that acknowledges or disposes it;
its id stays in the history.

Named `ITaskConsumerRecord` to sit beside `ITaskSourceRecord`.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-acknowledged"></a> `acknowledged` | `readonly` | readonly [`UpdateId`](../type-aliases/UpdateId.md)[] | - |
| <a id="property-baseline"></a> `baseline` | `readonly` | readonly [`ITaskUpdate`](ITaskUpdate.md)[] | - |
| <a id="property-capacityclaims"></a> `capacityClaims` | `readonly` | readonly [`ITaskCapacityClaim`](../type-aliases/ITaskCapacityClaim.md)[] | - |
| <a id="property-consumerid"></a> `consumerId` | `readonly` | [`ConsumerId`](../type-aliases/ConsumerId.md) | - |
| <a id="property-createdat"></a> `createdAt` | `readonly` | [`Instant`](../type-aliases/Instant.md) | - |
| <a id="property-disposed"></a> `disposed` | `readonly` | readonly [`ITaskObligationDisposition`](ITaskObligationDisposition.md)[] | - |
| <a id="property-drainprincipals"></a> `drainPrincipals?` | `readonly` | readonly `string`[] | The principals that may bind this subscription's delivery, unique and ascending. Absent on a record written before drain principals existed: such a subscription is drained by its registering principal only. |
| <a id="property-formatversion"></a> `formatVersion` | `readonly` | `1` | - |
| <a id="property-id"></a> `id` | `readonly` | [`SubscriptionId`](../type-aliases/SubscriptionId.md) | - |
| <a id="property-issued"></a> `issued` | `readonly` | readonly [`IIssuedTaskReceipt`](IIssuedTaskReceipt.md)[] | - |
| <a id="property-policy"></a> `policy` | `readonly` | [`ITaskDeliveryPolicy`](ITaskDeliveryPolicy.md) | - |
| <a id="property-policyidentity"></a> `policyIdentity?` | `readonly` | `string` | The policy identity `disposeWithheld` requires of a binding, when one was recorded. |
| <a id="property-recordrevision"></a> `recordRevision` | `readonly` | `number` | - |
| <a id="property-registration"></a> `registration` | `readonly` | `object` | The registration that created the record: what a replay of it must repeat. |
| `registration.operationId` | `readonly` | [`OperationId`](../type-aliases/OperationId.md) | - |
| `registration.principalKey` | `readonly` | `string` | - |
| <a id="property-selection"></a> `selection` | `readonly` | [`ITaskSelection`](ITaskSelection.md) | - |
| <a id="property-start"></a> `start` | `readonly` | [`SubscriptionStart`](../type-aliases/SubscriptionStart.md) | - |
| <a id="property-state"></a> `state` | `readonly` | [`TaskSubscriptionState`](../type-aliases/TaskSubscriptionState.md) | - |
