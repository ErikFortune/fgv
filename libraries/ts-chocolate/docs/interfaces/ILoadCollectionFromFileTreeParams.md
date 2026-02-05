[Home](../README.md) > ILoadCollectionFromFileTreeParams

# Interface: ILoadCollectionFromFileTreeParams

Parameters used to load collections from a file tree.

**Extends:** `Omit<ICollectionFilterInitParams<TCOLLECTIONID>, "nameConverter">`

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

[recurseWithDelimiter](./ILoadCollectionFromFileTreeParams.recurseWithDelimiter.md)

</td><td>

`readonly`

</td><td>

string

</td><td>



</td></tr>
<tr><td>

[mutable](./ILoadCollectionFromFileTreeParams.mutable.md)

</td><td>

`readonly`

</td><td>

[MutabilitySpec](../type-aliases/MutabilitySpec.md)

</td><td>

Overrides the default mutability specification for this load operation.

</td></tr>
<tr><td>

[encryption](./ILoadCollectionFromFileTreeParams.encryption.md)

</td><td>

`readonly`

</td><td>

[IEncryptionConfig](IEncryptionConfig.md)

</td><td>

Optional encryption configuration for decrypting encrypted collection files.

</td></tr>
<tr><td>

[onEncryptedFile](./ILoadCollectionFromFileTreeParams.onEncryptedFile.md)

</td><td>

`readonly`

</td><td>

[EncryptedFileHandling](../type-aliases/EncryptedFileHandling.md)

</td><td>

How to handle encrypted files in synchronous loading.

</td></tr>
<tr><td>

[isBuiltIn](./ILoadCollectionFromFileTreeParams.isBuiltIn.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether collections loaded from this source are built-in library data.

</td></tr>
<tr><td>

[included](./ILoadCollectionFromFileTreeParams.included.md)

</td><td>

`readonly`

</td><td>

readonly [FilterPattern](../type-aliases/FilterPattern.md)[]

</td><td>

Patterns to include.

</td></tr>
<tr><td>

[excluded](./ILoadCollectionFromFileTreeParams.excluded.md)

</td><td>

`readonly`

</td><td>

readonly [FilterPattern](../type-aliases/FilterPattern.md)[]

</td><td>

Patterns to exclude.

</td></tr>
<tr><td>

[errorOnInvalidName](./ILoadCollectionFromFileTreeParams.errorOnInvalidName.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>



</td></tr>
</tbody></table>
