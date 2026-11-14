[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ISubscribeRequest

# Interface: ISubscribeRequest

A request to create a subscription through [TaskBroker.subscribe](../classes/TaskBroker.md#subscribe).

## Remarks

`policy` members omitted take the broker's delivery defaults, which are then persisted: later
changes to those defaults never reach this subscription. A selection is fixed for the
subscription's life — a different selection is a different subscription.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-consumerid"></a> `consumerId` | `readonly` | [`ConsumerId`](../type-aliases/ConsumerId.md) | - |
| <a id="property-drainprincipals"></a> `drainPrincipals?` | `readonly` | readonly `string`[] | The principals that may bind this subscription's delivery and so drain it — and that may end or dispose of what it is owed (`TaskBroker.dispose`, `closeSubscription`). Each a valid principal key; duplicates are removed, then at least one and at most `maxDrainPrincipals` distinct principals must remain; stored ascending. Default: the registering principal alone. A host that subscribes on an agent's behalf names the agent here — the registering principal is not added implicitly. |
| <a id="property-operationid"></a> `operationId` | `readonly` | [`OperationId`](../type-aliases/OperationId.md) | - |
| <a id="property-policy"></a> `policy?` | `readonly` | `Partial`\<`Omit`\<[`ITaskDeliveryPolicy`](ITaskDeliveryPolicy.md), `"schemaVersion"`\>\> | - |
| <a id="property-policyidentity"></a> `policyIdentity?` | `readonly` | `string` | The identity of the consumer's own policy (`ITaskAuthorization.policyIdentity`). Without it, [IBoundTaskDelivery.disposeWithheld](IBoundTaskDelivery.md#disposewithheld) refuses every binding of this subscription. |
| <a id="property-selection"></a> `selection` | `readonly` | [`ITaskSelection`](ITaskSelection.md) | - |
| <a id="property-start"></a> `start` | `readonly` | [`SubscriptionStart`](../type-aliases/SubscriptionStart.md) | - |
| <a id="property-subscriptionid"></a> `subscriptionId` | `readonly` | [`SubscriptionId`](../type-aliases/SubscriptionId.md) | - |
