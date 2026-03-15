[Home](../README.md) > IEncryptionConfig

# Interface: IEncryptionConfig

Configuration for handling encrypted collections during loading.

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

[secrets](./IEncryptionConfig.secrets.md)

</td><td>

`readonly`

</td><td>

readonly INamedSecret[]

</td><td>

Array of named secrets to use for decryption.

</td></tr>
<tr><td>

[secretProvider](./IEncryptionConfig.secretProvider.md)

</td><td>

`readonly`

</td><td>

[SecretProvider](../type-aliases/SecretProvider.md)

</td><td>

Optional function to dynamically provide keys by secret name.

</td></tr>
<tr><td>

[cryptoProvider](./IEncryptionConfig.cryptoProvider.md)

</td><td>

`readonly`

</td><td>

ICryptoProvider

</td><td>

The crypto provider to use for decryption.

</td></tr>
<tr><td>

[onMissingKey](./IEncryptionConfig.onMissingKey.md)

</td><td>

`readonly`

</td><td>

EncryptedFileErrorMode

</td><td>

How to handle encrypted files when the required secret is not available.

</td></tr>
<tr><td>

[onDecryptionError](./IEncryptionConfig.onDecryptionError.md)

</td><td>

`readonly`

</td><td>

EncryptedFileErrorMode

</td><td>

How to handle decryption errors (e.g., wrong key, corrupted data).

</td></tr>
</tbody></table>
