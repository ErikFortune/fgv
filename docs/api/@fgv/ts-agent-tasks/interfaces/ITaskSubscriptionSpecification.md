[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskSubscriptionSpecification

# Interface: ITaskSubscriptionSpecification

What identifies a subscription registration: the specification a retry must repeat exactly.

## Remarks

`drainPrincipals` and `policyIdentity` are the subscription's drain authority as it stands:
[TaskBroker.setSubscriptionDrain](../classes/TaskBroker.md#setsubscriptiondrain) may change them later, after which a retry of the original
registration no longer matches and is refused (`conflict`) rather than answered with a
subscription that differs from what it asked for. A registration this release writes always
carries `drainPrincipals`; only a record written before they existed lacks them.

## Extended by

- [`ITaskSubscription`](ITaskSubscription.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-consumerid"></a> `consumerId` | `readonly` | [`ConsumerId`](../type-aliases/ConsumerId.md) | - |
| <a id="property-drainprincipals"></a> `drainPrincipals?` | `readonly` | readonly `string`[] | The principals that may bind the delivery, unique and ascending. |
| <a id="property-policy"></a> `policy` | `readonly` | [`ITaskDeliveryPolicy`](ITaskDeliveryPolicy.md) | - |
| <a id="property-policyidentity"></a> `policyIdentity?` | `readonly` | `string` | The policy identity `disposeWithheld` requires of a binding. |
| <a id="property-selection"></a> `selection` | `readonly` | [`ITaskSelection`](ITaskSelection.md) | - |
| <a id="property-start"></a> `start` | `readonly` | [`SubscriptionStart`](../type-aliases/SubscriptionStart.md) | - |
