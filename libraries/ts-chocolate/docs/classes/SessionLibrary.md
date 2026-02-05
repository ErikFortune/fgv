[Home](../README.md) > SessionLibrary

# Class: SessionLibrary

A library for managing persisted Entities.Session.AnySessionEntity | editing sessions.

Sessions are organized into user-defined collections. The library provides
cross-collection indexing for efficient queries by filling/confection and status.

Provides:
- Multi-collection storage with FileTree persistence
- Cross-collection lookup by filling ID (all sessions for a filling)
- Cross-collection lookup by filling version ID (all sessions for a specific version)
- Cross-collection lookup by confection ID (all sessions for a confection)
- Cross-collection lookup by confection version ID (all sessions for a specific version)
- Cross-collection lookup by status (active, planning, etc.)
- Lazy index rebuilding for efficient queries

**Extends:** [`SubLibraryBase<SessionId, BaseSessionId, AnySessionEntity>`](SubLibraryBase.md)

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

[create(params)](./SessionLibrary.create.md)

</td><td>

`static`

</td><td>

Creates a new Entities.Session.SessionLibrary | SessionLibrary instance.

</td></tr>
<tr><td>

[createAsync(params)](./SessionLibrary.createAsync.md)

</td><td>

`static`

</td><td>

Creates a SessionLibrary instance asynchronously with encrypted file support.

</td></tr>
<tr><td>

[getSessionsForFilling(fillingId)](./SessionLibrary.getSessionsForFilling.md)

</td><td>



</td><td>

Gets all filling sessions for a filling (across all versions and collections)

</td></tr>
<tr><td>

[getSessionsForFillingVersion(versionId)](./SessionLibrary.getSessionsForFillingVersion.md)

</td><td>



</td><td>

Gets all filling sessions for a specific filling version (across all collections)

</td></tr>
<tr><td>

[getSessionsForConfection(confectionId)](./SessionLibrary.getSessionsForConfection.md)

</td><td>



</td><td>

Gets all confection sessions for a confection (across all versions and collections)

</td></tr>
<tr><td>

[getSessionsForConfectionVersion(versionId)](./SessionLibrary.getSessionsForConfectionVersion.md)

</td><td>



</td><td>

Gets all confection sessions for a specific confection version (across all collections)

</td></tr>
<tr><td>

[getSessionsByStatus(status)](./SessionLibrary.getSessionsByStatus.md)

</td><td>



</td><td>

Gets all sessions with a specific status (across all collections)

</td></tr>
<tr><td>

[getActiveSessions()](./SessionLibrary.getActiveSessions.md)

</td><td>



</td><td>

Gets all active sessions (status === 'active') across all collections

</td></tr>
<tr><td>

[getSession(sessionId)](./SessionLibrary.getSession.md)

</td><td>



</td><td>

Gets a session by ID (searches all collections)

</td></tr>
<tr><td>

[getAllSessions()](./SessionLibrary.getAllSessions.md)

</td><td>



</td><td>

Gets all sessions across all collections

</td></tr>
<tr><td>

[hasSession(sessionId)](./SessionLibrary.hasSession.md)

</td><td>



</td><td>

Checks if a session with the given ID exists (searches all collections)

</td></tr>
<tr><td>

[addSession(collectionId, session)](./SessionLibrary.addSession.md)

</td><td>



</td><td>

Adds a new session to a collection.

</td></tr>
<tr><td>

[upsertSession(collectionId, session)](./SessionLibrary.upsertSession.md)

</td><td>



</td><td>

Adds or updates a session in a collection.

</td></tr>
<tr><td>

[removeSession(sessionId)](./SessionLibrary.removeSession.md)

</td><td>



</td><td>

Removes a session from its collection.

</td></tr>
<tr><td>

[createCollection(collectionId, metadata)](./SessionLibrary.createCollection.md)

</td><td>



</td><td>

Creates a new mutable collection for sessions.

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
