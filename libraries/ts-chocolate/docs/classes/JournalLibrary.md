[Home](../README.md) > JournalLibrary

# Class: JournalLibrary

A library for managing cooking Entities.Journal.AnyJournalEntryEntity | journal entries.

Journals are organized into user-defined collections (e.g., by person, location, time period).
The library provides cross-collection indexing for efficient queries by filling/confection.

Provides:
- Multi-collection storage with FileTree persistence
- Cross-collection lookup by filling ID (all journals for a filling)
- Cross-collection lookup by filling variation ID (all journals for a specific filling variation)
- Cross-collection lookup by confection ID (all journals for a confection)
- Cross-collection lookup by confection variation ID (all journals for a specific confection variation)
- Lazy index rebuilding for efficient queries

**Extends:** [`SubLibraryBase<JournalId, BaseJournalId, AnyJournalEntryEntity>`](SubLibraryBase.md)

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

readonly [IProtectedCollectionInfo](../interfaces/IProtectedCollectionInfo.md)&lt;[CollectionId](../type-aliases/CollectionId.md)&gt;[]

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

[create(params)](./JournalLibrary.create.md)

</td><td>

`static`

</td><td>

Creates a new Entities.Journal.JournalLibrary | JournalLibrary instance.

</td></tr>
<tr><td>

[createAsync(params)](./JournalLibrary.createAsync.md)

</td><td>

`static`

</td><td>

Creates a JournalLibrary instance asynchronously with encrypted file support.

</td></tr>
<tr><td>

[getJournalsForFilling(fillingId)](./JournalLibrary.getJournalsForFilling.md)

</td><td>



</td><td>

Gets all filling journal entries for a filling (across all variations and collections)

</td></tr>
<tr><td>

[getJournalsForFillingVariation(variationId)](./JournalLibrary.getJournalsForFillingVariation.md)

</td><td>



</td><td>

Gets all filling journal entries for a specific filling variation (across all collections)

</td></tr>
<tr><td>

[getJournalsForConfection(confectionId)](./JournalLibrary.getJournalsForConfection.md)

</td><td>



</td><td>

Gets all confection journal entries for a confection (across all variations and collections)

</td></tr>
<tr><td>

[getJournalsForConfectionVariation(variationId)](./JournalLibrary.getJournalsForConfectionVariation.md)

</td><td>



</td><td>

Gets all confection journal entries for a specific confection variations (across all collections)

</td></tr>
<tr><td>

[getJournal(journalId)](./JournalLibrary.getJournal.md)

</td><td>



</td><td>

Gets a journal entry by ID (searches all collections)

</td></tr>
<tr><td>

[getAllJournals()](./JournalLibrary.getAllJournals.md)

</td><td>



</td><td>

Gets all journal entries across all collections

</td></tr>
<tr><td>

[hasJournal(journalId)](./JournalLibrary.hasJournal.md)

</td><td>



</td><td>

Checks if a journal with the given ID exists (searches all collections)

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
