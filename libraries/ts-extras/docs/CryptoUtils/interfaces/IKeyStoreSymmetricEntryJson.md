[Home](../../README.md) > [CryptoUtils](../README.md) > IKeyStoreSymmetricEntryJson

# Interface: IKeyStoreSymmetricEntryJson

JSON-serializable representation of a symmetric secret entry.

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

[name](./IKeyStoreSymmetricEntryJson.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Unique name for this secret.

</td></tr>
<tr><td>

[type](./IKeyStoreSymmetricEntryJson.type.md)

</td><td>

`readonly`

</td><td>

[KeyStoreSymmetricSecretType](../../type-aliases/KeyStoreSymmetricSecretType.md)

</td><td>

Symmetric secret type discriminator.

</td></tr>
<tr><td>

[key](./IKeyStoreSymmetricEntryJson.key.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Base64-encoded secret data.

</td></tr>
<tr><td>

[description](./IKeyStoreSymmetricEntryJson.description.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional description.

</td></tr>
<tr><td>

[createdAt](./IKeyStoreSymmetricEntryJson.createdAt.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

When this secret was added (ISO 8601).

</td></tr>
</tbody></table>
