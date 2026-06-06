[Home](../../README.md) > [CryptoUtils](../README.md) > IEncryptedFilePrivateKeyStorageCreateParams

# Interface: IEncryptedFilePrivateKeyStorageCreateParams

Parameters for CryptoUtils.KeyStore.EncryptedFilePrivateKeyStorage.create.

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

[directory](./IEncryptedFilePrivateKeyStorageCreateParams.directory.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Filesystem path to the directory that holds the encrypted private-key
files.

</td></tr>
<tr><td>

[encryptionKey](./IEncryptedFilePrivateKeyStorageCreateParams.encryptionKey.md)

</td><td>

`readonly`

</td><td>

Uint8Array

</td><td>

Raw AES-256-GCM key (32 bytes) used to encrypt each file's JWK content.

</td></tr>
<tr><td>

[cryptoProvider](./IEncryptedFilePrivateKeyStorageCreateParams.cryptoProvider.md)

</td><td>

`readonly`

</td><td>

[ICryptoProvider](../../interfaces/ICryptoProvider.md)

</td><td>

CryptoUtils.ICryptoProvider | Crypto provider used for the

</td></tr>
<tr><td>

[tree](./IEncryptedFilePrivateKeyStorageCreateParams.tree.md)

</td><td>

`readonly`

</td><td>

IFileTreeDirectoryItem&lt;string&gt;

</td><td>

Optional FileTree.IFileTreeDirectoryItem | FileTree directory
override.

</td></tr>
</tbody></table>
