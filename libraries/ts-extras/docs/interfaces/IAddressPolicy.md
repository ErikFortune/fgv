[Home](../README.md) > IAddressPolicy

# Interface: IAddressPolicy

A pure, synchronous decision over a set of IP addresses.

A policy performs no name resolution and no I/O: a caller resolves a
hostname to its addresses and hands the whole list to
IAddressPolicy.checkAddresses. The list contract is
**reject-if-any** — a hostname that resolves to one public and one private
address is disallowed, because without connect-time address pinning there is
no guarantee which address the connection will use.

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

[name](./IAddressPolicy.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

A stable, greppable identifier for the posture this policy implements.

</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[checkAddresses(addresses)](./IAddressPolicy.checkAddresses.md)

</td><td>



</td><td>

Decides whether a connection may be made to a destination that resolved to

</td></tr>
</tbody></table>
