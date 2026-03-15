[Home](../README.md) > IUserEntityPersistenceConfig

# Interface: IUserEntityPersistenceConfig

Configuration for user entity library persistence.

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

[syncProvider](./IUserEntityPersistenceConfig.syncProvider.md)

</td><td>

`readonly`

</td><td>

[ISyncProvider](ISyncProvider.md)

</td><td>

Provider for flushing FileTree changes to the filesystem.

</td></tr>
<tr><td>

[encryptionProvider](./IUserEntityPersistenceConfig.encryptionProvider.md)

</td><td>

`readonly`

</td><td>

IEncryptionProvider | (() =&gt; IEncryptionProvider | undefined)

</td><td>

Encryption provider (or lazy getter) for encrypted collections.

</td></tr>
<tr><td>

[onMutation](./IUserEntityPersistenceConfig.onMutation.md)

</td><td>

`readonly`

</td><td>

(subLibraryId: [SubLibraryId](../type-aliases/SubLibraryId.md), compositeId: string) =&gt; void

</td><td>

Optional callback invoked after any entity mutation via persisted collections.

</td></tr>
</tbody></table>
