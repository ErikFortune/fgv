[Home](../README.md) > IBlockPrivateNetworksGuardOptions

# Interface: IBlockPrivateNetworksGuardOptions

Options for SaferFetch.blockPrivateNetworks.

**Extends:** [`IBlockPrivateNetworksOptions`](IBlockPrivateNetworksOptions.md)

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

[allowHosts](./IBlockPrivateNetworksGuardOptions.allowHosts.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Restricts every hop to these hostnames.

</td></tr>
<tr><td>

[allowPorts](./IBlockPrivateNetworksGuardOptions.allowPorts.md)

</td><td>

`readonly`

</td><td>

readonly number[]

</td><td>

Restricts every hop to these ports.

</td></tr>
<tr><td>

[allowInsecureHttp](./IBlockPrivateNetworksGuardOptions.allowInsecureHttp.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Permits `http:` hops.

</td></tr>
<tr><td>

[resolve](./IBlockPrivateNetworksGuardOptions.resolve.md)

</td><td>

`readonly`

</td><td>

[HostResolver](../type-aliases/HostResolver.md)

</td><td>

Name resolution.

</td></tr>
<tr><td>

[allowLoopback](./IBlockPrivateNetworksOptions.allowLoopback.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Permits `127.0.0.0/8` and `::1` (and their IPv4-mapped forms).

</td></tr>
</tbody></table>
