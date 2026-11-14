[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [SaferFetch](../README.md) / IClassifiedAddress

# Interface: IClassifiedAddress

The result of classifying a single IP address literal.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-address"></a> `address` | `readonly` | `string` | The address exactly as supplied to [classifyAddress](../functions/classifyAddress.md). |
| <a id="property-canonical"></a> `canonical` | `readonly` | `string` | A canonical textual form of the address: dotted-quad for IPv4, and lowercase RFC 5952 hex-group form (with `::` run compression) for IPv6. Note that IPv6 addresses embedding an IPv4 address canonicalize to their hex-group form (`::ffff:a9fe:a9fe`), not to the dotted-quad mixed form; `embeddedIpv4` carries the readable IPv4 value. |
| <a id="property-classification"></a> `classification` | `readonly` | [`AddressClassification`](../type-aliases/AddressClassification.md) | The classification used for policy decisions. For an IPv6 address that embeds an IPv4 address, this is the classification of the *embedded* IPv4 address. |
| <a id="property-embeddedipv4"></a> `embeddedIpv4?` | `readonly` | [`IEmbeddedIpv4`](IEmbeddedIpv4.md) | Present exactly when `classification` was derived from an IPv4 address embedded in this IPv6 address, and absent otherwise. |
| <a id="property-family"></a> `family` | `readonly` | [`AddressFamily`](../type-aliases/AddressFamily.md) | The address family of the literal as supplied — never the embedded family. |
