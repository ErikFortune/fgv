[Home](../../README.md) > [CryptoUtils](../README.md) > IKeyStoreSecretEntry

# Interface: IKeyStoreSecretEntry

A secret entry stored in the vault (in-memory representation).

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

[name](./IKeyStoreSecretEntry.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Unique name for this secret (used as lookup key).

</td></tr>
<tr><td>

[type](./IKeyStoreSecretEntry.type.md)

</td><td>

`readonly`

</td><td>

[KeyStoreSecretType](../../type-aliases/KeyStoreSecretType.md)

</td><td>

Secret type discriminator.

</td></tr>
<tr><td>

[key](./IKeyStoreSecretEntry.key.md)

</td><td>

`readonly`

</td><td>

Uint8Array

</td><td>

The secret data.

</td></tr>
<tr><td>

[description](./IKeyStoreSecretEntry.description.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional description for this secret.

</td></tr>
<tr><td>

[createdAt](./IKeyStoreSecretEntry.createdAt.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

When this secret was added (ISO 8601).

</td></tr>
</tbody></table>
