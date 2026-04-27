[Home](../../README.md) > [KeyStore](../README.md) > IKeyStoreSymmetricEntry

# Interface: IKeyStoreSymmetricEntry

A symmetric secret entry stored in the vault (in-memory representation).
Holds the raw key material directly — for `'encryption-key'` it is a 32-byte
AES-256 key; for `'api-key'` it is the UTF-8 encoded API key string.

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

[name](./IKeyStoreSymmetricEntry.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Unique name for this secret (used as lookup key).

</td></tr>
<tr><td>

[type](./IKeyStoreSymmetricEntry.type.md)

</td><td>

`readonly`

</td><td>

[KeyStoreSymmetricSecretType](../../type-aliases/KeyStoreSymmetricSecretType.md)

</td><td>

Symmetric secret type discriminator.

</td></tr>
<tr><td>

[key](./IKeyStoreSymmetricEntry.key.md)

</td><td>

`readonly`

</td><td>

Uint8Array

</td><td>

The secret data.

</td></tr>
<tr><td>

[description](./IKeyStoreSymmetricEntry.description.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional description for this secret.

</td></tr>
<tr><td>

[createdAt](./IKeyStoreSymmetricEntry.createdAt.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

When this secret was added (ISO 8601).

</td></tr>
</tbody></table>
