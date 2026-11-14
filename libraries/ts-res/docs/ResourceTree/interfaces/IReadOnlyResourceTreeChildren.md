[Home](../../README.md) > [ResourceTree](../README.md) > IReadOnlyResourceTreeChildren

# Interface: IReadOnlyResourceTreeChildren

Interface for a read-only result-based resource tree with navigation methods.

**Extends:** `IReadOnlyResultMap<TNAME, IReadOnlyResourceTreeNode<T>>`

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

[size](./IReadOnlyResourceTreeChildren.size.md)

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

[getById(id)](./IReadOnlyResourceTreeChildren.getById.md)

</td><td>



</td><td>

Gets a tree node by its full ResourceId path.

</td></tr>
<tr><td>

[getResource(name)](./IReadOnlyResourceTreeChildren.getResource.md)

</td><td>



</td><td>

Gets a resource node by its direct name (single component).

</td></tr>
<tr><td>

[getBranch(name)](./IReadOnlyResourceTreeChildren.getBranch.md)

</td><td>



</td><td>

Gets a branch node by its direct name (single component).

</td></tr>
<tr><td>

[getResourceById(id)](./IReadOnlyResourceTreeChildren.getResourceById.md)

</td><td>



</td><td>

Gets a resource leaf node by its full ResourceId path.

</td></tr>
<tr><td>

[getBranchById(id)](./IReadOnlyResourceTreeChildren.getBranchById.md)

</td><td>



</td><td>

Gets a branch node by its full ResourceId path.

</td></tr>
<tr><td>

[entries()](./IReadOnlyResourceTreeChildren.entries.md)

</td><td>



</td><td>

Returns an iterator over the map entries.

</td></tr>
<tr><td>

[forEach(cb, arg)](./IReadOnlyResourceTreeChildren.forEach.md)

</td><td>



</td><td>

Calls a function for each entry in the map.

</td></tr>
<tr><td>

[get(key)](./IReadOnlyResourceTreeChildren.get.md)

</td><td>



</td><td>

Gets a value from the map.

</td></tr>
<tr><td>

[has(key)](./IReadOnlyResourceTreeChildren.has.md)

</td><td>



</td><td>

Returns `true` if the map contains a key.

</td></tr>
<tr><td>

[keys()](./IReadOnlyResourceTreeChildren.keys.md)

</td><td>



</td><td>

Returns an iterator over the map keys.

</td></tr>
<tr><td>

[values()](./IReadOnlyResourceTreeChildren.values.md)

</td><td>



</td><td>

Returns an iterator over the map values.

</td></tr>
<tr><td>

[[iterator]()](./IReadOnlyResourceTreeChildren._iterator_.md)

</td><td>



</td><td>

Gets an iterator over the map entries.

</td></tr>
</tbody></table>
