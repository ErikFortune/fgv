[Home](../README.md) > INamedSecret

# Interface: INamedSecret

Named secret for encryption/decryption.

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

[name](./INamedSecret.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Unique name for this secret (referenced in encrypted files).

</td></tr>
<tr><td>

[key](./INamedSecret.key.md)

</td><td>

`readonly`

</td><td>

Uint8Array

</td><td>

The actual secret key (32 bytes for AES-256).

</td></tr>
</tbody></table>
