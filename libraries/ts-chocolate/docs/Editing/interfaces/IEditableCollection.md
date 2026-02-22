[Home](../../README.md) > [Editing](../README.md) > IEditableCollection

# Interface: IEditableCollection

Editable collection wrapper.
Wraps a ValidatingResultMap with metadata and export functionality
for entity editing workflows.

**Extends:** `ValidatingResultMap<TBaseId, T>`

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

[collectionId](./IEditableCollection.collectionId.md)

</td><td>

`readonly`

</td><td>

[CollectionId](../../type-aliases/CollectionId.md)

</td><td>

Collection identifier.

</td></tr>
<tr><td>

[metadata](./IEditableCollection.metadata.md)

</td><td>

`readonly`

</td><td>

[ICollectionRuntimeMetadata](../../interfaces/ICollectionRuntimeMetadata.md)

</td><td>

Collection metadata (name, description, etc.).

</td></tr>
<tr><td>

[isMutable](./IEditableCollection.isMutable.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether this collection is mutable.

</td></tr>
<tr><td>

[items](./IEditableCollection.items.md)

</td><td>

`readonly`

</td><td>

ReadonlyMap&lt;TBaseId, T&gt;

</td><td>

All items in the collection.

</td></tr>
<tr><td>

[remove](./IEditableCollection.remove.md)

</td><td>

`readonly`

</td><td>

(baseId: TBaseId) =&gt; Result&lt;T&gt;

</td><td>

Remove item from collection.

</td></tr>
<tr><td>

[updateMetadata](./IEditableCollection.updateMetadata.md)

</td><td>

`readonly`

</td><td>

(metadata: Partial&lt;[ICollectionRuntimeMetadata](../../interfaces/ICollectionRuntimeMetadata.md)&gt;) =&gt; Result&lt;void&gt;

</td><td>

Update collection metadata.

</td></tr>
<tr><td>

[export](./IEditableCollection.export.md)

</td><td>

`readonly`

</td><td>

() =&gt; Result&lt;[ICollectionSourceFile](../../interfaces/ICollectionSourceFile.md)&lt;T&gt;&gt;

</td><td>

Export collection to ICollectionSourceFile format.

</td></tr>
<tr><td>

[validating](./IEditableCollection.validating.md)

</td><td>

`readonly`

</td><td>

ResultMapValidator&lt;TBaseId, T&gt;

</td><td>

A Collections.ResultMapValidator | ResultMapValidator which validates keys and values

</td></tr>
<tr><td>

[_inner](./IEditableCollection._inner.md)

</td><td>

`readonly`

</td><td>

Map&lt;TBaseId, T&gt;

</td><td>

Protected raw access to the inner `Map<TK, TV>` object.

</td></tr>
<tr><td>

[size](./IEditableCollection.size.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Returns the number of entries in the map.

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

[toReadOnly()](./IEditableCollection.toReadOnly.md)

</td><td>



</td><td>

Gets a read-only version of this map.

</td></tr>
<tr><td>

[add(key, value)](./IEditableCollection.add.md)

</td><td>



</td><td>

Sets a key/value pair in the map if the key does not already exist.

</td></tr>
<tr><td>

[clear()](./IEditableCollection.clear.md)

</td><td>



</td><td>

Clears the map.

</td></tr>
<tr><td>

[delete(key)](./IEditableCollection.delete.md)

</td><td>



</td><td>

Deletes a key from the map.

</td></tr>
<tr><td>

[entries()](./IEditableCollection.entries.md)

</td><td>



</td><td>

Returns an iterator over the map entries.

</td></tr>
<tr><td>

[forEach(cb, arg)](./IEditableCollection.forEach.md)

</td><td>



</td><td>

Calls a function for each entry in the map.

</td></tr>
<tr><td>

[get(key)](./IEditableCollection.get.md)

</td><td>



</td><td>

Gets a value from the map.

</td></tr>
<tr><td>

[getOrAdd(key, value)](./IEditableCollection.getOrAdd.md)

</td><td>



</td><td>

Gets a value from the map, or adds a supplied value it if it does not exist.

</td></tr>
<tr><td>

[has(key)](./IEditableCollection.has.md)

</td><td>



</td><td>

Returns `true` if the map contains a key.

</td></tr>
<tr><td>

[keys()](./IEditableCollection.keys.md)

</td><td>



</td><td>

Returns an iterator over the map keys.

</td></tr>
<tr><td>

[set(key, value)](./IEditableCollection.set.md)

</td><td>



</td><td>

Sets a key/value pair in the map.

</td></tr>
<tr><td>

[update(key, value)](./IEditableCollection.update.md)

</td><td>



</td><td>

Updates an existing key in the map - the map is not updated if the key does

</td></tr>
<tr><td>

[values()](./IEditableCollection.values.md)

</td><td>



</td><td>

Returns an iterator over the map values.

</td></tr>
<tr><td>

[_isResultMapValueFactory(value)](./IEditableCollection._isResultMapValueFactory.md)

</td><td>



</td><td>

Determines if a value is a Collections.ResultMapValueFactory | ResultMapValueFactory.

</td></tr>
<tr><td>

[[iterator]()](./IEditableCollection._iterator_.md)

</td><td>



</td><td>

Gets an iterator over the map entries.

</td></tr>
</tbody></table>
