[Home](../README.md) > IKeyStoreSecretEntryJson

# Interface: IKeyStoreSecretEntryJson

JSON-serializable version of secret entry (for storage).

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

[name](./IKeyStoreSecretEntryJson.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Unique name for this secret.

</td></tr>
<tr><td>

[type](./IKeyStoreSecretEntryJson.type.md)

</td><td>

`readonly`

</td><td>

[KeyStoreSecretType](../type-aliases/KeyStoreSecretType.md)

</td><td>

Secret type discriminator.

</td></tr>
<tr><td>

[key](./IKeyStoreSecretEntryJson.key.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Base64-encoded secret data.

</td></tr>
<tr><td>

[description](./IKeyStoreSecretEntryJson.description.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional description.

</td></tr>
<tr><td>

[createdAt](./IKeyStoreSecretEntryJson.createdAt.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

When this secret was added (ISO 8601).

</td></tr>
</tbody></table>
