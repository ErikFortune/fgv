[Home](../README.md) > ICollectionManager

# Interface: ICollectionManager

Manager for collection-level CRUD operations.
Provides operations to create, delete, and rename collections within a sub-library.

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

[getAll](./ICollectionManager.getAll.md)

</td><td>

`readonly`

</td><td>

() =&gt; readonly [CollectionId](../type-aliases/CollectionId.md)[]

</td><td>

Get all collection IDs in the library.

</td></tr>
<tr><td>

[get](./ICollectionManager.get.md)

</td><td>

`readonly`

</td><td>

(collectionId: [CollectionId](../type-aliases/CollectionId.md)) =&gt; Result&lt;[ICollectionRuntimeMetadata](ICollectionRuntimeMetadata.md)&gt;

</td><td>

Get metadata for a specific collection by ID.

</td></tr>
<tr><td>

[create](./ICollectionManager.create.md)

</td><td>

`readonly`

</td><td>

(collectionId: [CollectionId](../type-aliases/CollectionId.md), metadata: [ICollectionFileMetadata](ICollectionFileMetadata.md)) =&gt; Result&lt;AggregatedResultMapEntry&lt;[CollectionId](../type-aliases/CollectionId.md), TBaseId, TItem&gt;&gt;

</td><td>

Create a new mutable collection.

</td></tr>
<tr><td>

[delete](./ICollectionManager.delete.md)

</td><td>

`readonly`

</td><td>

(collectionId: [CollectionId](../type-aliases/CollectionId.md)) =&gt; Result&lt;AggregatedResultMapEntry&lt;[CollectionId](../type-aliases/CollectionId.md), TBaseId, TItem, [ICollectionRuntimeMetadata](ICollectionRuntimeMetadata.md)&gt;&gt;

</td><td>

Delete a mutable collection.

</td></tr>
<tr><td>

[updateMetadata](./ICollectionManager.updateMetadata.md)

</td><td>

`readonly`

</td><td>

(collectionId: [CollectionId](../type-aliases/CollectionId.md), metadata: Partial&lt;[ICollectionRuntimeMetadata](ICollectionRuntimeMetadata.md)&gt;) =&gt; Result&lt;[ICollectionRuntimeMetadata](ICollectionRuntimeMetadata.md)&gt;

</td><td>

Update collection metadata.

</td></tr>
<tr><td>

[exists](./ICollectionManager.exists.md)

</td><td>

`readonly`

</td><td>

(collectionId: [CollectionId](../type-aliases/CollectionId.md)) =&gt; boolean

</td><td>

Check if a collection exists.

</td></tr>
<tr><td>

[isMutable](./ICollectionManager.isMutable.md)

</td><td>

`readonly`

</td><td>

(collectionId: [CollectionId](../type-aliases/CollectionId.md)) =&gt; Result&lt;boolean&gt;

</td><td>

Check if a collection is mutable.

</td></tr>
<tr><td>

[deleteEntity](./ICollectionManager.deleteEntity.md)

</td><td>

`readonly`

</td><td>

(compositeId: string) =&gt; Result&lt;unknown&gt;

</td><td>

Delete an entity from its collection.

</td></tr>
<tr><td>

[copyEntity](./ICollectionManager.copyEntity.md)

</td><td>

`readonly`

</td><td>

(compositeId: string, targetCollectionId: [CollectionId](../type-aliases/CollectionId.md), newBaseId?: string) =&gt; Result&lt;string&gt;

</td><td>

Copy an entity to another collection.

</td></tr>
<tr><td>

[moveEntity](./ICollectionManager.moveEntity.md)

</td><td>

`readonly`

</td><td>

(compositeId: string, targetCollectionId: [CollectionId](../type-aliases/CollectionId.md), newBaseId?: string) =&gt; Result&lt;string&gt;

</td><td>

Move an entity to another collection (copy + delete).

</td></tr>
</tbody></table>
