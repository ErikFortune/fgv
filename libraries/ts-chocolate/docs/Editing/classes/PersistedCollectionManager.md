[Home](../../README.md) > [Editing](../README.md) > PersistedCollectionManager

# Class: PersistedCollectionManager

Persistent wrapper around CollectionManager that triggers disk syncs
after structural mutations (create, delete, rename, merge, metadata update).

All mutating operations are async and await disk sync before returning.
For read-only queries (get, getAll, exists, isMutable), synchronous pass-through
methods are provided.

## Constructors

<table><thead><tr><th>

Constructor

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

`constructor(params)`

</td><td>



</td><td>

Creates a new persisted collection manager.

</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[getAll()](./PersistedCollectionManager.getAll.md)

</td><td>



</td><td>

Get all collection IDs in the library.

</td></tr>
<tr><td>

[get(collectionId)](./PersistedCollectionManager.get.md)

</td><td>



</td><td>

Get metadata for a specific collection by ID.

</td></tr>
<tr><td>

[exists(collectionId)](./PersistedCollectionManager.exists.md)

</td><td>



</td><td>

Check if a collection exists.

</td></tr>
<tr><td>

[isMutable(collectionId)](./PersistedCollectionManager.isMutable.md)

</td><td>



</td><td>

Check if a collection is mutable.

</td></tr>
<tr><td>

[create(collectionId, metadata)](./PersistedCollectionManager.create.md)

</td><td>



</td><td>

Create a new mutable collection in memory.

</td></tr>
<tr><td>

[createWithFile(collectionId, metadata)](./PersistedCollectionManager.createWithFile.md)

</td><td>



</td><td>

Create a new mutable collection with a backing YAML file on disk and sync.

</td></tr>
<tr><td>

[importCollection(collectionId, items, metadata)](./PersistedCollectionManager.importCollection.md)

</td><td>



</td><td>

Import a collection with items and metadata, then sync to disk.

</td></tr>
<tr><td>

[delete(collectionId)](./PersistedCollectionManager.delete.md)

</td><td>



</td><td>

Delete a mutable collection and sync to disk.

</td></tr>
<tr><td>

[updateMetadata(collectionId, metadata)](./PersistedCollectionManager.updateMetadata.md)

</td><td>



</td><td>

Update collection metadata and sync to disk.

</td></tr>
<tr><td>

[deleteEntity(compositeId)](./PersistedCollectionManager.deleteEntity.md)

</td><td>



</td><td>

Delete an entity from its collection.

</td></tr>
<tr><td>

[copyEntity(compositeId, targetCollectionId, newBaseId)](./PersistedCollectionManager.copyEntity.md)

</td><td>



</td><td>

Copy an entity to another collection.

</td></tr>
<tr><td>

[moveEntity(compositeId, targetCollectionId, newBaseId)](./PersistedCollectionManager.moveEntity.md)

</td><td>



</td><td>

Move an entity to another collection (copy + delete).

</td></tr>
<tr><td>

[rename(oldCollectionId, newCollectionId)](./PersistedCollectionManager.rename.md)

</td><td>



</td><td>

Rename a mutable collection to a new ID and sync to disk.

</td></tr>
<tr><td>

[merge(sourceCollectionId, targetCollectionId, onConflict)](./PersistedCollectionManager.merge.md)

</td><td>



</td><td>

Merge all items from a source collection into a target collection and sync to disk.

</td></tr>
</tbody></table>
