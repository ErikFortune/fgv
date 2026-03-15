[Home](../README.md) > IPersistedEditableCollectionParams

# Interface: IPersistedEditableCollectionParams

Parameters for creating a PersistedEditableCollection.

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

[subLibrary](./IPersistedEditableCollectionParams.subLibrary.md)

</td><td>

`readonly`

</td><td>

[SubLibraryBase](../classes/SubLibraryBase.md)&lt;string, TBaseId, T&gt;

</td><td>

The sub-library containing the collection data.

</td></tr>
<tr><td>

[collectionId](./IPersistedEditableCollectionParams.collectionId.md)

</td><td>

`readonly`

</td><td>

[CollectionId](../type-aliases/CollectionId.md)

</td><td>

Collection identifier.

</td></tr>
<tr><td>

[keyConverter](./IPersistedEditableCollectionParams.keyConverter.md)

</td><td>

`readonly`

</td><td>

Converter&lt;TBaseId, unknown&gt;

</td><td>

Converter for validating base ID keys.

</td></tr>
<tr><td>

[valueConverter](./IPersistedEditableCollectionParams.valueConverter.md)

</td><td>

`readonly`

</td><td>

Converter&lt;T, unknown&gt;

</td><td>

Converter for validating entity values.

</td></tr>
<tr><td>

[syncProvider](./IPersistedEditableCollectionParams.syncProvider.md)

</td><td>

`readonly`

</td><td>

[ISyncProvider](ISyncProvider.md)

</td><td>

Optional sync provider for flushing FileTree changes to disk.

</td></tr>
<tr><td>

[encryptionProvider](./IPersistedEditableCollectionParams.encryptionProvider.md)

</td><td>

`readonly`

</td><td>

IEncryptionProvider | (() =&gt; IEncryptionProvider | undefined)

</td><td>

Optional encryption provider (or lazy getter) for encrypted collections.

</td></tr>
<tr><td>

[autoPersist](./IPersistedEditableCollectionParams.autoPersist.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

When `true`, mutation methods (PersistedEditableCollection.set | set(),

</td></tr>
<tr><td>

[operations](./IPersistedEditableCollectionParams.operations.md)

</td><td>

`readonly`

</td><td>

[ICollectionOperations](ICollectionOperations.md)&lt;T, TBaseId&gt;

</td><td>

Optional custom collection operations delegate.

</td></tr>
<tr><td>

[onMutation](./IPersistedEditableCollectionParams.onMutation.md)

</td><td>

`readonly`

</td><td>

(compositeId: string) =&gt; void

</td><td>

Optional callback invoked after a successful entity mutation
(PersistedEditableCollection.addItem | addItem,
PersistedEditableCollection.upsertItem | upsertItem,
PersistedEditableCollection.removeItem | removeItem).

</td></tr>
</tbody></table>
