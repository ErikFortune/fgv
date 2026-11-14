[Home](../../README.md) > [CryptoUtils](../README.md) > IImportKeyOptions

# Interface: IImportKeyOptions

Options for importing raw key material via KeyStore.importSecret.
Extends IImportSecretOptions with a type classification.

**Extends:** [`IImportSecretOptions`](../../interfaces/IImportSecretOptions.md)

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

[type](./IImportKeyOptions.type.md)

</td><td>

`readonly`

</td><td>

[KeyStoreSymmetricSecretType](../../type-aliases/KeyStoreSymmetricSecretType.md)

</td><td>

Symmetric secret type classification for the imported key material.

</td></tr>
<tr><td>

[replace](./IImportSecretOptions.replace.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether to replace an existing secret with the same name.

</td></tr>
<tr><td>

[description](./IImportSecretOptions.description.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional description for the secret.

</td></tr>
</tbody></table>
