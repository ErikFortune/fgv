[Home](../../README.md) > [UserEntities](../README.md) > IUserEntityPersistenceConfig

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

[ISyncProvider](../../interfaces/ISyncProvider.md)

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
</tbody></table>
