[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [SaferFetch](../README.md) / IAddressPolicy

# Interface: IAddressPolicy

A pure, synchronous decision over a set of IP addresses.

A policy performs no name resolution and no I/O: a caller resolves a
hostname to its addresses and hands the whole list to
[IAddressPolicy.checkAddresses](#checkaddresses). The list contract is
**reject-if-any** — a hostname that resolves to one public and one private
address is disallowed, because without connect-time address pinning there is
no guarantee which address the connection will use.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-name"></a> `name` | `readonly` | `string` | A stable, greppable identifier for the posture this policy implements. Surfaced in the failure message when an address is disallowed. |

## Methods

### checkAddresses()

> **checkAddresses**(`addresses`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IAddressCheckVerdict`](IAddressCheckVerdict.md)\>

Decides whether a connection may be made to a destination that resolved to
`addresses`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `addresses` | readonly `string`[] | every address the destination resolved to, or the single literal address when the destination was an IP literal. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IAddressCheckVerdict`](IAddressCheckVerdict.md)\>

`Success` with the [verdict](IAddressCheckVerdict.md) when
*every* address is permitted, `Failure` naming every address that is not.
An empty list is a failure for any policy that offers a guarantee: nothing
was verified, so nothing may be reached.
