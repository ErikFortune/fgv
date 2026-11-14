[Home](../../README.md) > [SaferFetch](../README.md) > IRequestHop

# Interface: IRequestHop

One hop in a redirect chain. Entry 0 is the caller's original request.

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

[url](./IRequestHop.url.md)

</td><td>

`readonly`

</td><td>

URL

</td><td>

The URL under consideration for this hop.

</td></tr>
<tr><td>

[status](./IRequestHop.status.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

The redirect status that produced the NEXT hop; absent on the current one.

</td></tr>
<tr><td>

[connectedAddress](./IRequestHop.connectedAddress.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The address actually connected to on this hop, when address pinning was in effect.

</td></tr>
</tbody></table>
