[Home](../../README.md) > [ResourceTree](../README.md) > ReadOnlyResourceTreeChildren

# Class: ReadOnlyResourceTreeChildren

Implementation of a result-based resource tree that provides hierarchical access to resources.
Extends ResultMap to provide collection-like access while adding tree-specific navigation methods.

**Extends:** `ResultMap<ResourceName, IReadOnlyResourceTreeNode<T>>`

**Implements:** [`IReadOnlyValidatingResourceTreeChildren<T>`](../../interfaces/IReadOnlyValidatingResourceTreeChildren.md)

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

`constructor(path, entries)`

</td><td>



</td><td>

Creates a new ReadOnlyResourceTreeChildren instance.

</td></tr>
</tbody></table>

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

[validating](./ReadOnlyResourceTreeChildren.validating.md)

</td><td>



</td><td>

[IReadOnlyResourceTreeChildren](../../interfaces/IReadOnlyResourceTreeChildren.md)&lt;T, string, string&gt;

</td><td>



</td></tr>
<tr><td>

[_inner](./ReadOnlyResourceTreeChildren._inner.md)

</td><td>

`readonly`

</td><td>

Map&lt;[ResourceName](../../type-aliases/ResourceName.md), [IReadOnlyResourceTreeNode](../../type-aliases/IReadOnlyResourceTreeNode.md)&lt;T&gt;&gt;

</td><td>

Protected raw access to the inner `Map<TK, TV>` object.

</td></tr>
<tr><td>

[size](./ReadOnlyResourceTreeChildren.size.md)

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

[create(elements)](./ReadOnlyResourceTreeChildren.create.md)

</td><td>

`static`

</td><td>

Creates a new Collections.ResultMap | ResultMap.

</td></tr>
<tr><td>

[getResource(name)](./ReadOnlyResourceTreeChildren.getResource.md)

</td><td>



</td><td>

Gets a resource node by its direct name (single component).

</td></tr>
<tr><td>

[getBranch(name)](./ReadOnlyResourceTreeChildren.getBranch.md)

</td><td>



</td><td>

Gets a branch node by its direct name (single component).

</td></tr>
<tr><td>

[getById(id)](./ReadOnlyResourceTreeChildren.getById.md)

</td><td>



</td><td>

Gets a tree node by its full ResourceId path.

</td></tr>
<tr><td>

[getResourceById(id)](./ReadOnlyResourceTreeChildren.getResourceById.md)

</td><td>



</td><td>

Gets a resource leaf node by its full ResourceId path.

</td></tr>
<tr><td>

[getBranchById(id)](./ReadOnlyResourceTreeChildren.getBranchById.md)

</td><td>



</td><td>

Gets a branch node by its full ResourceId path.

</td></tr>
<tr><td>

[add(key, value)](./ReadOnlyResourceTreeChildren.add.md)

</td><td>



</td><td>

Sets a key/value pair in the map if the key does not already exist.

</td></tr>
<tr><td>

[clear()](./ReadOnlyResourceTreeChildren.clear.md)

</td><td>



</td><td>

Clears the map.

</td></tr>
<tr><td>

[delete(key)](./ReadOnlyResourceTreeChildren.delete.md)

</td><td>



</td><td>

Deletes a key from the map.

</td></tr>
<tr><td>

[entries()](./ReadOnlyResourceTreeChildren.entries.md)

</td><td>



</td><td>

Returns an iterator over the map entries.

</td></tr>
<tr><td>

[forEach(cb, arg)](./ReadOnlyResourceTreeChildren.forEach.md)

</td><td>



</td><td>

Calls a function for each entry in the map.

</td></tr>
<tr><td>

[get(key)](./ReadOnlyResourceTreeChildren.get.md)

</td><td>



</td><td>

Gets a value from the map.

</td></tr>
<tr><td>

[getOrAdd(key, value)](./ReadOnlyResourceTreeChildren.getOrAdd.md)

</td><td>



</td><td>

Gets a value from the map, or adds a supplied value it if it does not exist.

</td></tr>
<tr><td>

[has(key)](./ReadOnlyResourceTreeChildren.has.md)

</td><td>



</td><td>

Returns `true` if the map contains a key.

</td></tr>
<tr><td>

[keys()](./ReadOnlyResourceTreeChildren.keys.md)

</td><td>



</td><td>

Returns an iterator over the map keys.

</td></tr>
<tr><td>

[set(key, value)](./ReadOnlyResourceTreeChildren.set.md)

</td><td>



</td><td>

Sets a key/value pair in the map.

</td></tr>
<tr><td>

[update(key, value)](./ReadOnlyResourceTreeChildren.update.md)

</td><td>



</td><td>

Updates an existing key in the map - the map is not updated if the key does

</td></tr>
<tr><td>

[values()](./ReadOnlyResourceTreeChildren.values.md)

</td><td>



</td><td>

Returns an iterator over the map values.

</td></tr>
<tr><td>

[toReadOnly()](./ReadOnlyResourceTreeChildren.toReadOnly.md)

</td><td>



</td><td>

Gets a readonly version of this map.

</td></tr>
<tr><td>

[_isResultMapValueFactory(value)](./ReadOnlyResourceTreeChildren._isResultMapValueFactory.md)

</td><td>



</td><td>

Determines if a value is a Collections.ResultMapValueFactory | ResultMapValueFactory.

</td></tr>
<tr><td>

[[iterator]()](./ReadOnlyResourceTreeChildren._iterator_.md)

</td><td>



</td><td>

Gets an iterator over the map entries.

</td></tr>
</tbody></table>
