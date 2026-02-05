[Home](../README.md) > IProtectedCollectionInfo

# Interface: IProtectedCollectionInfo

Public reference to a protected (encrypted) collection that was captured
during loading but not decrypted due to missing keys.

Contains only metadata that was stored unencrypted in the collection file.
The actual encrypted data is stored internally for later decryption.

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

[collectionId](./IProtectedCollectionInfo.collectionId.md)

</td><td>

`readonly`

</td><td>

TCollectionId

</td><td>

The collection identifier (derived from filename).

</td></tr>
<tr><td>

[secretName](./IProtectedCollectionInfo.secretName.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The name of the secret required to decrypt this collection.

</td></tr>
<tr><td>

[description](./IProtectedCollectionInfo.description.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional human-readable description from unencrypted metadata.

</td></tr>
<tr><td>

[itemCount](./IProtectedCollectionInfo.itemCount.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Optional item count from unencrypted metadata.

</td></tr>
<tr><td>

[isMutable](./IProtectedCollectionInfo.isMutable.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether this collection would be mutable once loaded.

</td></tr>
<tr><td>

[isBuiltIn](./IProtectedCollectionInfo.isBuiltIn.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether this collection is from the built-in library data.

</td></tr>
<tr><td>

[keyDerivation](./IProtectedCollectionInfo.keyDerivation.md)

</td><td>

`readonly`

</td><td>

IKeyDerivationParams

</td><td>

Optional key derivation parameters from the encrypted file.

</td></tr>
</tbody></table>
