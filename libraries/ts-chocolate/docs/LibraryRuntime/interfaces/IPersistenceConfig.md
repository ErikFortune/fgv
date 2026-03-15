[Home](../../README.md) > [LibraryRuntime](../README.md) > IPersistenceConfig

# Interface: IPersistenceConfig

Configuration for the persistence pipeline, supplied after library creation
via ChocolateEntityLibrary.configurePersistence | configurePersistence().

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

[syncProvider](./IPersistenceConfig.syncProvider.md)

</td><td>

`readonly`

</td><td>

[ISyncProvider](../../interfaces/ISyncProvider.md)

</td><td>

Provider for flushing FileTree changes to the filesystem.

</td></tr>
<tr><td>

[encryptionProvider](./IPersistenceConfig.encryptionProvider.md)

</td><td>

`readonly`

</td><td>

IEncryptionProvider | (() =&gt; IEncryptionProvider | undefined)

</td><td>

Encryption provider (or lazy getter) for encrypted collections.

</td></tr>
</tbody></table>
