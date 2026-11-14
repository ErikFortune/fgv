[Home](../../README.md) > [KeyStore](../README.md) > IImportSecretBytesOptions

# Interface: IImportSecretBytesOptions

Options for importing raw opaque bytes via KeyStore.importSecretBytes.
Extends IImportSecretOptions with optional initial metadata.

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

[metadata](./IImportSecretBytesOptions.metadata.md)

</td><td>

`readonly`

</td><td>

JsonValue

</td><td>

Optional initial mutable metadata to store with the entry.

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
