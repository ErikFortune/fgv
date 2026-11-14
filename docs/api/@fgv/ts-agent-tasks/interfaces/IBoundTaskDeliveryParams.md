[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IBoundTaskDeliveryParams

# Interface: IBoundTaskDeliveryParams

Parameters for [TaskBroker.bindDelivery](../classes/TaskBroker.md#binddelivery): a principal binding, plus the subscription it
consumes and the consumer identity that owns it.

## Extends

- [`IBoundTaskViewParams`](IBoundTaskViewParams.md)

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-authorization"></a> `authorization` | `readonly` | [`ITaskAuthorization`](ITaskAuthorization.md) |
| <a id="property-consumerid"></a> `consumerId` | `readonly` | [`ConsumerId`](../type-aliases/ConsumerId.md) |
| <a id="property-creationscopes"></a> `creationScopes?` | `readonly` | readonly [`ITaskScope`](ITaskScope.md)[] |
| <a id="property-principal"></a> `principal` | `readonly` | `string` |
| <a id="property-projector"></a> `projector?` | `readonly` | [`ITaskProjector`](ITaskProjector.md) |
| <a id="property-scopes"></a> `scopes` | `readonly` | readonly [`ITaskScope`](ITaskScope.md)[] |
| <a id="property-subscriptionid"></a> `subscriptionId` | `readonly` | [`SubscriptionId`](../type-aliases/SubscriptionId.md) |
