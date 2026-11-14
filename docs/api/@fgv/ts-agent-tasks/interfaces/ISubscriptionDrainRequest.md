[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ISubscriptionDrainRequest

# Interface: ISubscriptionDrainRequest

A request to [TaskBroker.setSubscriptionDrain](../classes/TaskBroker.md#setsubscriptiondrain): the subscription's drain authority,
replaced whole.

## Remarks

`drainPrincipals` follows the rules of [ISubscribeRequest.drainPrincipals](ISubscribeRequest.md#property-drainprincipals). An omitted
`policyIdentity` removes the recorded one. After a change, a retry of the original `subscribe` is
`conflict`: it no longer matches the subscription as it stands.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-drainprincipals"></a> `drainPrincipals` | `readonly` | readonly `string`[] |
| <a id="property-policyidentity"></a> `policyIdentity?` | `readonly` | `string` |
| <a id="property-subscriptionid"></a> `subscriptionId` | `readonly` | [`SubscriptionId`](../type-aliases/SubscriptionId.md) |
