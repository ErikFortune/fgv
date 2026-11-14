[Home](../README.md) > IAddressGuard

# Interface: IAddressGuard

Decides whether a connection may be made. Invoked once per redirect hop, never only on
the initial URL.

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

[name](./IAddressGuard.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Stable identifier, surfaced in `'blocked-by-guard'` failures.

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

[check(chain)](./IAddressGuard.check.md)

</td><td>



</td><td>



</td></tr>
</tbody></table>
