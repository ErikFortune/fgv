[Home](../../README.md) > [CryptoUtils](../README.md) > IEncryptedFile

# Interface: IEncryptedFile

Generic encrypted file format.
This is the JSON structure stored in encrypted files.

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

[format](./IEncryptedFile.format.md)

</td><td>

`readonly`

</td><td>

"encrypted-collection-v1"

</td><td>

Format identifier for versioning.

</td></tr>
<tr><td>

[secretName](./IEncryptedFile.secretName.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Name of the secret required to decrypt (references INamedSecret.name).

</td></tr>
<tr><td>

[algorithm](./IEncryptedFile.algorithm.md)

</td><td>

`readonly`

</td><td>

"AES-256-GCM"

</td><td>

Algorithm used for encryption.

</td></tr>
<tr><td>

[iv](./IEncryptedFile.iv.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Base64-encoded initialization vector.

</td></tr>
<tr><td>

[authTag](./IEncryptedFile.authTag.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Base64-encoded authentication tag (for GCM mode).

</td></tr>
<tr><td>

[encryptedData](./IEncryptedFile.encryptedData.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Base64-encoded encrypted data (JSON string when decrypted).

</td></tr>
<tr><td>

[metadata](./IEncryptedFile.metadata.md)

</td><td>

`readonly`

</td><td>

TMetadata

</td><td>

Optional unencrypted metadata for display/filtering.

</td></tr>
<tr><td>

[keyDerivation](./IEncryptedFile.keyDerivation.md)

</td><td>

`readonly`

</td><td>

[IKeyDerivationParams](../../interfaces/IKeyDerivationParams.md)

</td><td>

Optional key derivation parameters.

</td></tr>
</tbody></table>
