[Home](../../README.md) > [CryptoUtils](../README.md) > IDirectEncryptionProviderParams

# Interface: IDirectEncryptionProviderParams

Parameters for creating a DirectEncryptionProvider.

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

[cryptoProvider](./IDirectEncryptionProviderParams.cryptoProvider.md)

</td><td>

`readonly`

</td><td>

[ICryptoProvider](../../interfaces/ICryptoProvider.md)

</td><td>

The crypto provider to use for encryption operations.

</td></tr>
<tr><td>

[key](./IDirectEncryptionProviderParams.key.md)

</td><td>

`readonly`

</td><td>

Uint8Array

</td><td>

The encryption key (32 bytes for AES-256).

</td></tr>
<tr><td>

[boundSecretName](./IDirectEncryptionProviderParams.boundSecretName.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional bound secret name.

</td></tr>
</tbody></table>
