[Home](../README.md) > IKeyStoreFile

# Interface: IKeyStoreFile

The encrypted key store file format.

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

[format](./IKeyStoreFile.format.md)

</td><td>

`readonly`

</td><td>

"keystore-v1"

</td><td>

Format identifier.

</td></tr>
<tr><td>

[algorithm](./IKeyStoreFile.algorithm.md)

</td><td>

`readonly`

</td><td>

"AES-256-GCM"

</td><td>

Algorithm used for encryption.

</td></tr>
<tr><td>

[iv](./IKeyStoreFile.iv.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Base64-encoded initialization vector.

</td></tr>
<tr><td>

[authTag](./IKeyStoreFile.authTag.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Base64-encoded authentication tag.

</td></tr>
<tr><td>

[encryptedData](./IKeyStoreFile.encryptedData.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Base64-encoded encrypted vault contents.

</td></tr>
<tr><td>

[keyDerivation](./IKeyStoreFile.keyDerivation.md)

</td><td>

`readonly`

</td><td>

[IKeyDerivationParams](IKeyDerivationParams.md)

</td><td>

Key derivation parameters (required for key store - always password-derived).

</td></tr>
</tbody></table>
