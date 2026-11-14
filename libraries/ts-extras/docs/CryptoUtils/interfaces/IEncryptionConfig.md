[Home](../../README.md) > [CryptoUtils](../README.md) > IEncryptionConfig

# Interface: IEncryptionConfig

Configuration for encrypted file handling during loading.

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

readonly [INamedSecret](../../interfaces/INamedSecret.md)[]

</td><td>

Named secrets available for decryption.

</td></tr>
<tr><td>

[secretProvider](./IEncryptionConfig.secretProvider.md)

</td><td>

`readonly`

</td><td>

[SecretProvider](../../type-aliases/SecretProvider.md)

</td><td>

Alternative: dynamic secret provider function.

</td></tr>
<tr><td>

[cryptoProvider](./IEncryptionConfig.cryptoProvider.md)

</td><td>

`readonly`

</td><td>

[ICryptoProvider](../../interfaces/ICryptoProvider.md)

</td><td>

Crypto provider implementation (Node.js or browser).

</td></tr>
<tr><td>

[onMissingKey](./IEncryptionConfig.onMissingKey.md)

</td><td>

`readonly`

</td><td>

[EncryptedFileErrorMode](../../type-aliases/EncryptedFileErrorMode.md)

</td><td>

Behavior when decryption key is missing (default: 'fail').

</td></tr>
<tr><td>

[onDecryptionError](./IEncryptionConfig.onDecryptionError.md)

</td><td>

`readonly`

</td><td>

[EncryptedFileErrorMode](../../type-aliases/EncryptedFileErrorMode.md)

</td><td>

Behavior when decryption fails (default: 'fail').

</td></tr>
</tbody></table>
