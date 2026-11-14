[Home](../../README.md) > [KeyStore](../README.md) > IAddSecretFromPasswordOptions

# Interface: IAddSecretFromPasswordOptions

Options for adding a secret derived from a password.

**Extends:** [`IAddSecretOptions`](../../interfaces/IAddSecretOptions.md)

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

[replace](./IAddSecretFromPasswordOptions.replace.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether to replace an existing secret with the same name.

</td></tr>
<tr><td>

[iterations](./IAddSecretFromPasswordOptions.iterations.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

PBKDF2 iterations for key derivation.

</td></tr>
<tr><td>

[description](./IAddSecretOptions.description.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional description for the secret.

</td></tr>
</tbody></table>
