[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskSubscriptionDrainChange

# Interface: ITaskSubscriptionDrainChange

Replaces one subscription's drain authority (storage level): its drain principals, and its policy
identity (removed when omitted).

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-drainprincipals"></a> `drainPrincipals` | `readonly` | readonly `string`[] |
| <a id="property-expectedrecordrevision"></a> `expectedRecordRevision` | `readonly` | `number` |
| <a id="property-policyidentity"></a> `policyIdentity?` | `readonly` | `string` |
| <a id="property-subscriptionid"></a> `subscriptionId` | `readonly` | [`SubscriptionId`](../type-aliases/SubscriptionId.md) |
