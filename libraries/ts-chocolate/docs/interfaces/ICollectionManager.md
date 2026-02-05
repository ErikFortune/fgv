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

(collectionId: [CollectionId](../type-aliases/CollectionId.md)) =&gt; Result&lt;[ICollectionSourceMetadata](ICollectionSourceMetadata.md)&gt;

</td><td>

Get metadata for a specific collection by ID.

</td></tr>
<tr><td>

[create](./ICollectionManager.create.md)

</td><td>

`readonly`

</td><td>

(collectionId: [CollectionId](../type-aliases/CollectionId.md), metadata: [ICollectionSourceMetadata](ICollectionSourceMetadata.md)) =&gt; Result&lt;AggregatedResultMapEntry&lt;[CollectionId](../type-aliases/CollectionId.md), TBaseId, TItem&gt;&gt;

</td><td>

Create a new mutable collection.

</td></tr>
<tr><td>

[delete](./ICollectionManager.delete.md)

</td><td>

`readonly`

</td><td>

(collectionId: [CollectionId](../type-aliases/CollectionId.md)) =&gt; Result&lt;AggregatedResultMapEntry&lt;[CollectionId](../type-aliases/CollectionId.md), TBaseId, TItem, [ICollectionSourceMetadata](ICollectionSourceMetadata.md)&gt;&gt;

</td><td>

Delete a mutable collection.

</td></tr>
<tr><td>

[updateMetadata](./ICollectionManager.updateMetadata.md)

</td><td>

`readonly`

</td><td>

(collectionId: [CollectionId](../type-aliases/CollectionId.md), metadata: Partial&lt;[ICollectionSourceMetadata](ICollectionSourceMetadata.md)&gt;) =&gt; Result&lt;[ICollectionSourceMetadata](ICollectionSourceMetadata.md)&gt;

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
</tbody></table>
