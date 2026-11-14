[Home](../README.md) > ICreateEncryptedFileParams

# Interface: ICreateEncryptedFileParams

Parameters for creating an CryptoUtils.IEncryptedFile | encrypted file.

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

[content](./ICreateEncryptedFileParams.content.md)

</td><td>

`readonly`

</td><td>

JsonValue

</td><td>

The JSON content to encrypt.

</td></tr>
<tr><td>

[secretName](./ICreateEncryptedFileParams.secretName.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Name of the secret used for encryption.

</td></tr>
<tr><td>

[key](./ICreateEncryptedFileParams.key.md)

</td><td>

`readonly`

</td><td>

Uint8Array

</td><td>

The encryption key (32 bytes for AES-256).

</td></tr>
<tr><td>

[cryptoProvider](./ICreateEncryptedFileParams.cryptoProvider.md)

</td><td>

`readonly`

</td><td>

[ICryptoProvider](ICryptoProvider.md)

</td><td>

CryptoUtils.ICryptoProvider | Crypto provider to use for encryption.

</td></tr>
<tr><td>

[metadata](./ICreateEncryptedFileParams.metadata.md)

</td><td>

`readonly`

</td><td>

TMetadata

</td><td>

Optional metadata to include unencrypted.

</td></tr>
<tr><td>

[metadataConverter](./ICreateEncryptedFileParams.metadataConverter.md)

</td><td>

`readonly`

</td><td>

Converter&lt;TMetadata, unknown&gt;

</td><td>

Optional converter to validate metadata before including.

</td></tr>
<tr><td>

[keyDerivation](./ICreateEncryptedFileParams.keyDerivation.md)

</td><td>

`readonly`

</td><td>

[IKeyDerivationParams](../type-aliases/IKeyDerivationParams.md)

</td><td>

Optional CryptoUtils.IKeyDerivationParams | key derivation parameters.

</td></tr>
</tbody></table>
