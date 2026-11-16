[Home](../README.md) > IAtomicWriteOptions

# Interface: IAtomicWriteOptions

Options controlling an atomic write.

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

[guarantee](./IAtomicWriteOptions.guarantee.md)

</td><td>

`readonly`

</td><td>

"session" | "process-crash" | "os-crash" | "power-loss"

</td><td>

The durability guarantee the caller requires.

</td></tr>
</tbody></table>
