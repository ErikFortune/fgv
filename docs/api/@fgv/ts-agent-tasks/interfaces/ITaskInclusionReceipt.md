[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskInclusionReceipt

# Interface: ITaskInclusionReceipt

A pure description of what one rendered context included.

## Remarks

A receipt is a value, not a checkpoint and not proof of delivery. Producing one writes
nothing. It is canonical: entries are ordered by task ID then revision, update IDs are
ordered within an entry, and neither repeats — so two receipts describing the same
inclusion are identical. `deliveryId` is echoed from the input when one was supplied; the
renderer never mints one and never authenticates one.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-deliveryid"></a> `deliveryId?` | `readonly` | [`DeliveryId`](../type-aliases/DeliveryId.md) |
| <a id="property-included"></a> `included` | `readonly` | readonly [`IInclusionEntry`](IInclusionEntry.md)[] |
| <a id="property-version"></a> `version` | `readonly` | `1` |
