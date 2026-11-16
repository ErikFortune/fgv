[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IIssuedTaskReceipt

# Interface: IIssuedTaskReceipt

One exact issued-receipt manifest: the complete inclusion the renderer produced for one
delivery, bound into its subscription's record (design § 9, *Receipt provenance*).

## Remarks

`receipt` is compared with a presented receipt in full canonical form, never by hash or by
maximum revision. `acknowledged` becomes `true` exactly once, in the commit that adds the
receipt's update IDs to the subscription's history; a replay of it afterwards is recognized, not
applied again. Expiry and abandonment remove the manifest — its pin — and never the obligations
it named or the history it produced.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-acknowledged"></a> `acknowledged` | `readonly` | `boolean` |
| <a id="property-deliveryid"></a> `deliveryId` | `readonly` | [`DeliveryId`](../type-aliases/DeliveryId.md) |
| <a id="property-expiresat"></a> `expiresAt` | `readonly` | [`Instant`](../type-aliases/Instant.md) |
| <a id="property-issuedat"></a> `issuedAt` | `readonly` | [`Instant`](../type-aliases/Instant.md) |
| <a id="property-receipt"></a> `receipt` | `readonly` | [`ITaskInclusionReceipt`](ITaskInclusionReceipt.md) |
