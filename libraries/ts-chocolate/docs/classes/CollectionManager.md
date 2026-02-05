[Home](../README.md) > CollectionManager

# Class: CollectionManager

Implementation of collection management operations.
Wraps a SubLibraryBase instance to provide collection-level CRUD.

**Implements:** [`ICollectionManager`](../interfaces/ICollectionManager.md)

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

`constructor(library)`

</td><td>



</td><td>

Creates a new CollectionManager.

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

[getAll()](./CollectionManager.getAll.md)

</td><td>



</td><td>

Get all collection IDs in the library.

</td></tr>
<tr><td>

[get(collectionId)](./CollectionManager.get.md)

</td><td>



</td><td>

Get metadata for a specific collection by ID.

</td></tr>
<tr><td>

[create(collectionId, metadata)](./CollectionManager.create.md)

</td><td>



</td><td>

Create a new mutable collection.

</td></tr>
<tr><td>

[delete(collectionId)](./CollectionManager.delete.md)

</td><td>



</td><td>

Delete a mutable collection.

</td></tr>
<tr><td>

[updateMetadata(collectionId, metadata)](./CollectionManager.updateMetadata.md)

</td><td>



</td><td>

Update collection metadata.

</td></tr>
<tr><td>

[exists(collectionId)](./CollectionManager.exists.md)

</td><td>



</td><td>

Check if a collection exists.

</td></tr>
<tr><td>

[isMutable(collectionId)](./CollectionManager.isMutable.md)

</td><td>



</td><td>

Check if a collection is mutable.

</td></tr>
</tbody></table>
