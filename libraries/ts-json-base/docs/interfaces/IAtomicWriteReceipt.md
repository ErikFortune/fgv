[Home](../README.md) > IAtomicWriteReceipt

# Interface: IAtomicWriteReceipt

Receipt returned by a successful atomic write.

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

[guarantee](./IAtomicWriteReceipt.guarantee.md)

</td><td>

`readonly`

</td><td>

"session" | "process-crash" | "os-crash" | "power-loss"

</td><td>

The guarantee actually honored.

</td></tr>
<tr><td>

[replaced](./IAtomicWriteReceipt.replaced.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

`true` if this write replaced an existing file; `false` if it created a

</td></tr>
</tbody></table>
