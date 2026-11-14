[Home](../README.md) > AggregatedResultMapBase

# Class: AggregatedResultMapBase

Base class for an aggregated result map that wraps a collection of ValidatingResultMap instances,
keyed by collection ID. Items are accessed via composite IDs that combine the collection ID
and item ID with a delimiter.

**Implements:** [`IResultMap<TCOMPOSITEID, TITEM>`](../interfaces/IResultMap.md), [`IReadOnlyValidatingResultMap<TCOMPOSITEID, TITEM>`](../interfaces/IReadOnlyValidatingResultMap.md)

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

[validating](./AggregatedResultMapBase.validating.md)

</td><td>

`readonly`

</td><td>

[IReadOnlyResultMapValidator](../interfaces/IReadOnlyResultMapValidator.md)&lt;TCOMPOSITEID, TITEM&gt;

</td><td>

A validator for weakly-typed access to the map.

</td></tr>
<tr><td>

[size](./AggregatedResultMapBase.size.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

The total number of items across all collections.

</td></tr>
<tr><td>

[collections](./AggregatedResultMapBase.collections.md)

</td><td>

`readonly`

</td><td>

[IReadOnlyValidatingResultMap](../interfaces/IReadOnlyValidatingResultMap.md)&lt;TCOLLECTIONID, [AggregatedResultMapEntry](../type-aliases/AggregatedResultMapEntry.md)&lt;TCOLLECTIONID, TITEMID, TITEM, TMETADATA&gt;&gt;

</td><td>

Provides read-only access to the underlying collections map.

</td></tr>
<tr><td>

[collectionCount](./AggregatedResultMapBase.collectionCount.md)

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

[get(key)](./AggregatedResultMapBase.get.md)

</td><td>



</td><td>

Gets an item by its composite ID.

</td></tr>
<tr><td>

[has(key)](./AggregatedResultMapBase.has.md)

</td><td>



</td><td>

Checks if an item exists by its composite ID.

</td></tr>
<tr><td>

[entries()](./AggregatedResultMapBase.entries.md)

</td><td>



</td><td>

Iterates over all entries in all collections.

</td></tr>
<tr><td>

[keys()](./AggregatedResultMapBase.keys.md)

</td><td>



</td><td>

Iterates over all composite keys.

</td></tr>
<tr><td>

[values()](./AggregatedResultMapBase.values.md)

</td><td>



</td><td>

Iterates over all values.

</td></tr>
<tr><td>

[forEach(cb, thisArg)](./AggregatedResultMapBase.forEach.md)

</td><td>



</td><td>

Calls a callback for each entry.

</td></tr>
<tr><td>

[set(key, value)](./AggregatedResultMapBase.set.md)

</td><td>



</td><td>

Sets an item by its composite ID.

</td></tr>
<tr><td>

[add(key, value)](./AggregatedResultMapBase.add.md)

</td><td>



</td><td>

Adds an item by its composite ID.

</td></tr>
<tr><td>

[update(key, value)](./AggregatedResultMapBase.update.md)

</td><td>



</td><td>

Updates an existing item by its composite ID.

</td></tr>
<tr><td>

[delete(key)](./AggregatedResultMapBase.delete.md)

</td><td>



</td><td>

Deletes an item by its composite ID.

</td></tr>
<tr><td>

[getOrAdd(key, value)](./AggregatedResultMapBase.getOrAdd.md)

</td><td>



</td><td>

Gets an existing item or adds a new one.

</td></tr>
<tr><td>

[clear()](./AggregatedResultMapBase.clear.md)

</td><td>



</td><td>

Clears all items from all mutable collections.

</td></tr>
<tr><td>

[toReadOnly()](./AggregatedResultMapBase.toReadOnly.md)

</td><td>



</td><td>

Returns a read-only view of this map.

</td></tr>
<tr><td>

[composeId(collectionId, itemId)](./AggregatedResultMapBase.composeId.md)

</td><td>



</td><td>

Composes a collection ID and item ID into a composite ID.

</td></tr>
<tr><td>

[addToCollection(collectionId, itemId, value)](./AggregatedResultMapBase.addToCollection.md)

</td><td>



</td><td>

Adds an item using separate collection and item IDs.

</td></tr>
<tr><td>

[setInCollection(collectionId, itemId, value)](./AggregatedResultMapBase.setInCollection.md)

</td><td>



</td><td>

Sets an item using separate collection and item IDs.

</td></tr>
<tr><td>

[updateInCollection(collectionId, itemId, value)](./AggregatedResultMapBase.updateInCollection.md)

</td><td>



</td><td>

Updates an item using separate collection and item IDs.

</td></tr>
<tr><td>

[deleteFromCollection(collectionId, itemId)](./AggregatedResultMapBase.deleteFromCollection.md)

</td><td>



</td><td>

Deletes an item using separate collection and item IDs.

</td></tr>
<tr><td>

[getCollectionMetadata(collectionId)](./AggregatedResultMapBase.getCollectionMetadata.md)

</td><td>



</td><td>

Gets the metadata for a specific collection.

</td></tr>
<tr><td>

[setCollectionMetadata(collectionId, metadata)](./AggregatedResultMapBase.setCollectionMetadata.md)

</td><td>



</td><td>

Sets the metadata for a mutable collection.

</td></tr>
<tr><td>

[addCollectionEntry(entry)](./AggregatedResultMapBase.addCollectionEntry.md)

</td><td>



</td><td>

Adds a new collection from a pre-built entry object.

</td></tr>
<tr><td>

[addCollectionWithItems(collectionId, items, options)](./AggregatedResultMapBase.addCollectionWithItems.md)

</td><td>



</td><td>

Adds a new collection with the specified ID and optional initial entries.

</td></tr>
<tr><td>

[[iterator]()](./AggregatedResultMapBase._iterator_.md)

</td><td>



</td><td>

Gets an iterator over the map entries.

</td></tr>
</tbody></table>
