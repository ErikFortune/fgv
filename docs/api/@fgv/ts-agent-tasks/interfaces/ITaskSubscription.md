[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskSubscription

# Interface: ITaskSubscription

A subscription's resident descriptor: everything but its history and payloads.

## Extends

- [`ITaskSubscriptionSpecification`](ITaskSubscriptionSpecification.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-consumerid"></a> `consumerId` | `readonly` | [`ConsumerId`](../type-aliases/ConsumerId.md) | - |
| <a id="property-createdat"></a> `createdAt` | `readonly` | [`Instant`](../type-aliases/Instant.md) | - |
| <a id="property-drainprincipals"></a> `drainPrincipals` | `readonly` | readonly `string`[] | The principals that may bind this subscription's delivery ([TaskBroker.bindDelivery](../classes/TaskBroker.md#binddelivery)), unique and ascending. A subscription recorded without them reports its registering principal alone, which is the rule applied to it. |
| <a id="property-id"></a> `id` | `readonly` | [`SubscriptionId`](../type-aliases/SubscriptionId.md) | - |
| <a id="property-policy"></a> `policy` | `readonly` | [`ITaskDeliveryPolicy`](ITaskDeliveryPolicy.md) | - |
| <a id="property-policyidentity"></a> `policyIdentity?` | `readonly` | `string` | The policy identity `disposeWithheld` requires of a binding. |
| <a id="property-principalkey"></a> `principalKey` | `readonly` | `string` | The principal that registered the subscription: the one that may change its drain principals ([TaskBroker.setSubscriptionDrain](../classes/TaskBroker.md#setsubscriptiondrain)). |
| <a id="property-recordrevision"></a> `recordRevision` | `readonly` | `number` | - |
| <a id="property-selection"></a> `selection` | `readonly` | [`ITaskSelection`](ITaskSelection.md) | - |
| <a id="property-start"></a> `start` | `readonly` | [`SubscriptionStart`](../type-aliases/SubscriptionStart.md) | - |
| <a id="property-state"></a> `state` | `readonly` | [`TaskSubscriptionState`](../type-aliases/TaskSubscriptionState.md) | - |
