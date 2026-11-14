[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [SaferFetch](../README.md) / IAddressCheckVerdict

# Interface: IAddressCheckVerdict

The evidence behind an allowed address-policy decision.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-addresses"></a> `addresses` | `readonly` | readonly [`IClassifiedAddress`](IClassifiedAddress.md)[] | The classification of every address the policy examined, in the order supplied. Empty for [allowAnyAddressPolicy](../functions/allowAnyAddressPolicy.md), which classifies nothing. |
| <a id="property-policy"></a> `policy` | `readonly` | `string` | The [name](IAddressPolicy.md#property-name) of the policy that produced the verdict. |
