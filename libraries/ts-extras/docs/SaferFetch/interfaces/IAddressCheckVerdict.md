[Home](../../README.md) > [SaferFetch](../README.md) > IAddressCheckVerdict

# Interface: IAddressCheckVerdict

The evidence behind an allowed address-policy decision.

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

[policy](./IAddressCheckVerdict.policy.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The IAddressPolicy.name | name of the policy that produced the verdict.

</td></tr>
<tr><td>

[addresses](./IAddressCheckVerdict.addresses.md)

</td><td>

`readonly`

</td><td>

readonly [IClassifiedAddress](../../interfaces/IClassifiedAddress.md)[]

</td><td>

The classification of every address the policy examined, in the order
supplied.

</td></tr>
</tbody></table>
