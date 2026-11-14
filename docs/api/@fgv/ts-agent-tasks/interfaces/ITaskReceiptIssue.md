[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskReceiptIssue

# Interface: ITaskReceiptIssue

Issues one receipt manifest into a subscription's record.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-expectedrecordrevision"></a> `expectedRecordRevision` | `readonly` | `number` | - |
| <a id="property-expiresat"></a> `expiresAt` | `readonly` | [`Instant`](../type-aliases/Instant.md) | - |
| <a id="property-issuedat"></a> `issuedAt` | `readonly` | [`Instant`](../type-aliases/Instant.md) | Now. Manifests that expire at or before it are evicted in the same write. |
| <a id="property-receipt"></a> `receipt` | `readonly` | [`ITaskInclusionReceipt`](ITaskInclusionReceipt.md) | The renderer's receipt. Must carry a delivery id not already in the record. |
| <a id="property-subscriptionid"></a> `subscriptionId` | `readonly` | [`SubscriptionId`](../type-aliases/SubscriptionId.md) | - |
