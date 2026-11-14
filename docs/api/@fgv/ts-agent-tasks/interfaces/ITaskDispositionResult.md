[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskDispositionResult

# Interface: ITaskDispositionResult

What a disposal did: the ids it added to `disposed`, and those already in the exact history.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-alreadydischarged"></a> `alreadyDischarged` | `readonly` | readonly [`UpdateId`](../type-aliases/UpdateId.md)[] |
| <a id="property-newlydisposed"></a> `newlyDisposed` | `readonly` | readonly [`UpdateId`](../type-aliases/UpdateId.md)[] |
| <a id="property-subscriptionid"></a> `subscriptionId` | `readonly` | [`SubscriptionId`](../type-aliases/SubscriptionId.md) |
