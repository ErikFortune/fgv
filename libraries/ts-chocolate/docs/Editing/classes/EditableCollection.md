[Home](../../README.md) > [Editing](../README.md) > EditableCollection

# Class: EditableCollection

An extension of ValidatingResultMap that adds collection metadata,
mutability control, and export functionality for entity editing workflows.

Inherits all ValidatingResultMap functionality but gates mutation
operations behind an isMutable check.

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

[collectionId](./EditableCollection.collectionId.md)

</td><td>

`readonly`

</td><td>

[CollectionId](../../type-aliases/CollectionId.md)

</td><td>

Collection identifier.

</td></tr>
<tr><td>

[isMutable](./EditableCollection.isMutable.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether collection is mutable.

</td></tr>
<tr><td>

[sourceItem](./EditableCollection.sourceItem.md)

</td><td>

`readonly`

</td><td>

FileTreeItem

</td><td>

Optional reference to the source FileTree item for persistence.

</td></tr>
<tr><td>

[validating](./EditableCollection.validating.md)

</td><td>

`readonly`

</td><td>

ResultMapValidator&lt;TBaseId, T&gt;

</td><td>

A Collections.ResultMapValidator | ResultMapValidator which validates keys and values

</td></tr>
<tr><td>

[_inner](./EditableCollection._inner.md)

</td><td>

`readonly`

</td><td>

Map&lt;TBaseId, T&gt;

</td><td>

Protected raw access to the inner `Map<TK, TV>` object.

</td></tr>
<tr><td>

[metadata](./EditableCollection.metadata.md)

</td><td>

`readonly`

</td><td>

[ICollectionFileMetadata](../../interfaces/ICollectionFileMetadata.md)

</td><td>

Collection metadata.

</td></tr>
<tr><td>

[size](./EditableCollection.size.md)

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

[createEditable(params)](./EditableCollection.createEditable.md)

</td><td>

`static`

</td><td>

Create a new editable collection.

</td></tr>
<tr><td>

[validateStructure(data)](./EditableCollection.validateStructure.md)

</td><td>

`static`

</td><td>

Validate collection structure.

</td></tr>
<tr><td>

[fromYaml(content, params)](./EditableCollection.fromYaml.md)

</td><td>

`static`

</td><td>

Parse a YAML string and create an editable collection.

</td></tr>
<tr><td>

[fromJson(content, params)](./EditableCollection.fromJson.md)

</td><td>

`static`

</td><td>

Parse a JSON string and create an editable collection.

</td></tr>
<tr><td>

[parse(content, params)](./EditableCollection.parse.md)

</td><td>

`static`

</td><td>

Parse content (auto-detecting format) and create an editable collection.

</td></tr>
<tr><td>

[fromLibrary(library, collectionId, keyConverter, valueConverter, encryptionProvider)](./EditableCollection.fromLibrary.md)

</td><td>

`static`

</td><td>

Create an editable collection from a SubLibrary collection with persistence enabled.

</td></tr>
<tr><td>

[createValidatingResultMap(params)](./EditableCollection.createValidatingResultMap.md)

</td><td>

`static`

</td><td>

Creates a new Collections.ValidatingResultMap | ValidatingResultMap instance.

</td></tr>
<tr><td>

[create(elements)](./EditableCollection.create.md)

</td><td>

`static`

</td><td>

Creates a new Collections.ResultMap | ResultMap.

</td></tr>
<tr><td>

[updateMetadata(metadata)](./EditableCollection.updateMetadata.md)

</td><td>



</td><td>

Update collection metadata.

</td></tr>
<tr><td>

[export()](./EditableCollection.export.md)

</td><td>



</td><td>

Export collection to ICollectionSourceFile format.

</td></tr>
<tr><td>

[serializeToYaml(options)](./EditableCollection.serializeToYaml.md)

</td><td>



</td><td>

Serialize collection to YAML string.

</td></tr>
<tr><td>

[serializeToJson(options)](./EditableCollection.serializeToJson.md)

</td><td>



</td><td>

Serialize collection to JSON string.

</td></tr>
<tr><td>

[serialize(format, options)](./EditableCollection.serialize.md)

</td><td>



</td><td>

Serialize collection to string based on format.

</td></tr>
<tr><td>

[canSave()](./EditableCollection.canSave.md)

</td><td>



</td><td>

Check if this collection can be saved to its source file.

</td></tr>
<tr><td>

[isDirty()](./EditableCollection.isDirty.md)

</td><td>



</td><td>

Check if the source file has unsaved changes.

</td></tr>
<tr><td>

[save(options)](./EditableCollection.save.md)

</td><td>



</td><td>

Save the collection to its source file using FileTree persistence.

</td></tr>
<tr><td>

[set(key, value)](./EditableCollection.set.md)

</td><td>



</td><td>

Add or update item in collection.

</td></tr>
<tr><td>

[add(key, value)](./EditableCollection.add.md)

</td><td>



</td><td>

Add item only if key doesn't exist.

</td></tr>
<tr><td>

[update(key, value)](./EditableCollection.update.md)

</td><td>



</td><td>

Update item only if key exists.

</td></tr>
<tr><td>

[delete(key)](./EditableCollection.delete.md)

</td><td>



</td><td>

Delete item from collection.

</td></tr>
<tr><td>

[clear()](./EditableCollection.clear.md)

</td><td>



</td><td>

Clear all items from collection.

</td></tr>
<tr><td>

[toReadOnly()](./EditableCollection.toReadOnly.md)

</td><td>



</td><td>

Gets a read-only version of this map.

</td></tr>
<tr><td>

[entries()](./EditableCollection.entries.md)

</td><td>



</td><td>

Returns an iterator over the map entries.

</td></tr>
<tr><td>

[forEach(cb, arg)](./EditableCollection.forEach.md)

</td><td>



</td><td>

Calls a function for each entry in the map.

</td></tr>
<tr><td>

[get(key)](./EditableCollection.get.md)

</td><td>



</td><td>

Gets a value from the map.

</td></tr>
<tr><td>

[getOrAdd(key, value)](./EditableCollection.getOrAdd.md)

</td><td>



</td><td>

Gets a value from the map, or adds a supplied value it if it does not exist.

</td></tr>
<tr><td>

[has(key)](./EditableCollection.has.md)

</td><td>



</td><td>

Returns `true` if the map contains a key.

</td></tr>
<tr><td>

[keys()](./EditableCollection.keys.md)

</td><td>



</td><td>

Returns an iterator over the map keys.

</td></tr>
<tr><td>

[values()](./EditableCollection.values.md)

</td><td>



</td><td>

Returns an iterator over the map values.

</td></tr>
<tr><td>

[_isResultMapValueFactory(value)](./EditableCollection._isResultMapValueFactory.md)

</td><td>



</td><td>

Determines if a value is a Collections.ResultMapValueFactory | ResultMapValueFactory.

</td></tr>
<tr><td>

[[iterator]()](./EditableCollection._iterator_.md)

</td><td>



</td><td>

Gets an iterator over the map entries.

</td></tr>
</tbody></table>
