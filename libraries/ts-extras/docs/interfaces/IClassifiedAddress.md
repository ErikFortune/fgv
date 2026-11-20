[Home](../README.md) > IClassifiedAddress

# Interface: IClassifiedAddress

The result of classifying a single IP address literal.

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[address](./IClassifiedAddress.address.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The address exactly as supplied to classifyAddress.

</td></tr>
<tr><td>

[canonical](./IClassifiedAddress.canonical.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

A canonical textual form of the address: dotted-quad for IPv4, and
lowercase RFC 5952 hex-group form (with `::` run compression) for IPv6.

</td></tr>
<tr><td>

[family](./IClassifiedAddress.family.md)

</td><td>

`readonly`

</td><td>

[AddressFamily](../type-aliases/AddressFamily.md)

</td><td>

The address family of the literal as supplied — never the embedded family.

</td></tr>
<tr><td>

[classification](./IClassifiedAddress.classification.md)

</td><td>

`readonly`

</td><td>

[AddressClassification](../type-aliases/AddressClassification.md)

</td><td>

The classification used for policy decisions.

</td></tr>
<tr><td>

[embeddedIpv4](./IClassifiedAddress.embeddedIpv4.md)

</td><td>

`readonly`

</td><td>

[IEmbeddedIpv4](IEmbeddedIpv4.md)

</td><td>

Present exactly when `classification` was derived from an IPv4 address

</td></tr>
</tbody></table>
