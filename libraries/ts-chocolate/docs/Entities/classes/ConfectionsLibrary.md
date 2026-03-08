[Home](../../README.md) > [Entities](../README.md) > ConfectionsLibrary

# Class: ConfectionsLibrary

Multi-source confection library with type-safe access

Wraps AggregatedResultMap to provide:
- Composite ID access (e.g., "user.dark-dome-bonbon")
- Multi-source management (built-in, user, app-local, etc.)
- Mutable vs immutable collection distinction
- Weakly-typed validating access for external data

**Extends:** [`SubLibraryBase<ConfectionId, BaseConfectionId, AnyConfectionRecipeEntity>`](../../classes/SubLibraryBase.md)

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

[protectedCollections](./SubLibraryBase.protectedCollections.md)

</td><td>

`readonly`

</td><td>

readonly [IProtectedCollectionInfo](../../interfaces/IProtectedCollectionInfo.md)&lt;[CollectionId](../../type-aliases/CollectionId.md)&gt;[]

</td><td>

Gets the list of protected collections that were captured but not decrypted.

</td></tr>
<tr><td>

[validating](./SubLibraryBase.validating.md)

</td><td>

`readonly`

</td><td>

IReadOnlyResultMapValidator&lt;TCOMPOSITEID, TITEM&gt;

</td><td>

A validator for weakly-typed access to the map.

</td></tr>
<tr><td>

[size](./SubLibraryBase.size.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

The total number of items across all collections.

</td></tr>
<tr><td>

[collections](./SubLibraryBase.collections.md)

</td><td>

`readonly`

</td><td>

IReadOnlyValidatingResultMap&lt;TCOLLECTIONID, AggregatedResultMapEntry&lt;TCOLLECTIONID, TITEMID, TITEM, TMETADATA&gt;&gt;

</td><td>

Provides read-only access to the underlying collections map.

</td></tr>
<tr><td>

[collectionCount](./SubLibraryBase.collectionCount.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

The number of collections.

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

[create(params)](./ConfectionsLibrary.create.md)

</td><td>

`static`

</td><td>

Creates a new ConfectionsLibrary instance

</td></tr>
<tr><td>

[createAsync(params)](./ConfectionsLibrary.createAsync.md)

</td><td>

`static`

</td><td>

Creates a new ConfectionsLibrary instance asynchronously with encryption support.

</td></tr>
<tr><td>

[loadFromFileTreeSource(source)](./SubLibraryBase.loadFromFileTreeSource.md)

</td><td>



</td><td>

Loads collections from a file tree source and adds them to this library.

</td></tr>
<tr><td>

[loadProtectedCollectionAsync(encryption, filter)](./SubLibraryBase.loadProtectedCollectionAsync.md)

</td><td>



</td><td>

Decrypts and loads one or more protected collections.

</td></tr>
<tr><td>

[getCollectionSourceItem(collectionId)](./SubLibraryBase.getCollectionSourceItem.md)

</td><td>



</td><td>

Get the FileTree source item for a collection, if available.

</td></tr>
<tr><td>

[createCollectionFile(collectionId, content, extension)](./SubLibraryBase.createCollectionFile.md)

</td><td>



</td><td>

Creates a file for a collection in the mutable data directory and

</td></tr>
<tr><td>

[setActiveMutableSource(sourceName, dataDirectory, sourceRoot)](./SubLibraryBase.setActiveMutableSource.md)

</td><td>



</td><td>

Sets the active mutable source for new collection creation.

</td></tr>
<tr><td>

[removeSource(sourceName)](./SubLibraryBase.removeSource.md)

</td><td>



</td><td>

Remove all mutable collections whose metadata `sourceName` matches the given source.

</td></tr>
<tr><td>

[getCollectionOperations(collectionId)](./SubLibraryBase.getCollectionOperations.md)

</td><td>



</td><td>

Returns a default collection operations delegate for the given collection.

</td></tr>
<tr><td>

[get(key)](./SubLibraryBase.get.md)

</td><td>



</td><td>

Gets an item by its composite ID.

</td></tr>
<tr><td>

[has(key)](./SubLibraryBase.has.md)

</td><td>



</td><td>

Checks if an item exists by its composite ID.

</td></tr>
<tr><td>

[entries()](./SubLibraryBase.entries.md)

</td><td>



</td><td>

Iterates over all entries in all collections.

</td></tr>
<tr><td>

[keys()](./SubLibraryBase.keys.md)

</td><td>



</td><td>

Iterates over all composite keys.

</td></tr>
<tr><td>

[values()](./SubLibraryBase.values.md)

</td><td>



</td><td>

Iterates over all values.

</td></tr>
<tr><td>

[forEach(cb, thisArg)](./SubLibraryBase.forEach.md)

</td><td>



</td><td>

Calls a callback for each entry.

</td></tr>
<tr><td>

[set(key, value)](./SubLibraryBase.set.md)

</td><td>



</td><td>

Sets an item by its composite ID.

</td></tr>
<tr><td>

[add(key, value)](./SubLibraryBase.add.md)

</td><td>



</td><td>

Adds an item by its composite ID.

</td></tr>
<tr><td>

[update(key, value)](./SubLibraryBase.update.md)

</td><td>



</td><td>

Updates an existing item by its composite ID.

</td></tr>
<tr><td>

[delete(key)](./SubLibraryBase.delete.md)

</td><td>



</td><td>

Deletes an item by its composite ID.

</td></tr>
<tr><td>

[getOrAdd(key, value)](./SubLibraryBase.getOrAdd.md)

</td><td>



</td><td>

Gets an existing item or adds a new one.

</td></tr>
<tr><td>

[clear()](./SubLibraryBase.clear.md)

</td><td>



</td><td>

Clears all items from all mutable collections.

</td></tr>
<tr><td>

[toReadOnly()](./SubLibraryBase.toReadOnly.md)

</td><td>



</td><td>

Returns a read-only view of this map.

</td></tr>
<tr><td>

[composeId(collectionId, itemId)](./SubLibraryBase.composeId.md)

</td><td>



</td><td>

Composes a collection ID and item ID into a composite ID.

</td></tr>
<tr><td>

[addToCollection(collectionId, itemId, value)](./SubLibraryBase.addToCollection.md)

</td><td>



</td><td>

Adds an item using separate collection and item IDs.

</td></tr>
<tr><td>

[setInCollection(collectionId, itemId, value)](./SubLibraryBase.setInCollection.md)

</td><td>



</td><td>

Sets an item using separate collection and item IDs.

</td></tr>
<tr><td>

[updateInCollection(collectionId, itemId, value)](./SubLibraryBase.updateInCollection.md)

</td><td>



</td><td>

Updates an item using separate collection and item IDs.

</td></tr>
<tr><td>

[deleteFromCollection(collectionId, itemId)](./SubLibraryBase.deleteFromCollection.md)

</td><td>



</td><td>

Deletes an item using separate collection and item IDs.

</td></tr>
<tr><td>

[getCollectionMetadata(collectionId)](./SubLibraryBase.getCollectionMetadata.md)

</td><td>



</td><td>

Gets the metadata for a specific collection.

</td></tr>
<tr><td>

[setCollectionMetadata(collectionId, metadata)](./SubLibraryBase.setCollectionMetadata.md)

</td><td>



</td><td>

Sets the metadata for a mutable collection.

</td></tr>
<tr><td>

[addCollectionEntry(entry)](./SubLibraryBase.addCollectionEntry.md)

</td><td>



</td><td>

Adds a new collection from a pre-built entry object.

</td></tr>
<tr><td>

[addCollectionWithItems(collectionId, items, options)](./SubLibraryBase.addCollectionWithItems.md)

</td><td>



</td><td>

Adds a new collection with the specified ID and optional initial entries.

</td></tr>
<tr><td>

[[iterator]()](./SubLibraryBase._iterator_.md)

</td><td>



</td><td>

Gets an iterator over the map entries.

</td></tr>
</tbody></table>
