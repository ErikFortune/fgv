[Home](../../../README.md) > [Runtime](../../README.md) > [ResourceTree](../README.md) > ResourceTreeChildrenValidator

# Class: ResourceTreeChildrenValidator

A validator wrapper for resource tree children that validates string inputs before
delegating to the underlying tree children collection.

This class implements Runtime.ResourceTree.IReadOnlyValidatingResourceTreeChildren | IReadOnlyValidatingResourceTreeChildren
by wrapping an Runtime.ResourceTree.IReadOnlyResourceTreeChildren | IReadOnlyResourceTreeChildren instance and
providing string-based access to all tree operations. All string inputs are validated using the library's
validation utilities before being passed to the underlying collection.

The validator acts as a bridge between string-based external APIs and the
strongly-typed internal tree operations, ensuring type safety and consistent
error handling throughout the resource tree navigation.

**Implements:** [`IReadOnlyResourceTreeChildren<T, string, string>`](../../../interfaces/IReadOnlyResourceTreeChildren.md)

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

`constructor(inner)`

</td><td>



</td><td>

Creates a new validator wrapper for resource tree children.

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

[size](./ResourceTreeChildrenValidator.size.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

The number of direct child nodes in this collection.

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

[getById(id)](./ResourceTreeChildrenValidator.getById.md)

</td><td>



</td><td>

Gets a tree node by its string ResourceId path, validating the input.

</td></tr>
<tr><td>

[getResource(name)](./ResourceTreeChildrenValidator.getResource.md)

</td><td>



</td><td>

Gets a resource node by its string name (single component), validating the input.

</td></tr>
<tr><td>

[getBranch(name)](./ResourceTreeChildrenValidator.getBranch.md)

</td><td>



</td><td>

Gets a branch node by its string name (single component), validating the input.

</td></tr>
<tr><td>

[getResourceById(id)](./ResourceTreeChildrenValidator.getResourceById.md)

</td><td>



</td><td>

Gets a resource leaf node by its string ResourceId path, validating the input.

</td></tr>
<tr><td>

[getBranchById(id)](./ResourceTreeChildrenValidator.getBranchById.md)

</td><td>



</td><td>

Gets a branch node by its string ResourceId path, validating the input.

</td></tr>
<tr><td>

[entries()](./ResourceTreeChildrenValidator.entries.md)

</td><td>



</td><td>

Returns an iterator of [ResourceName, node] pairs for all child nodes.

</td></tr>
<tr><td>

[forEach(cb, arg)](./ResourceTreeChildrenValidator.forEach.md)

</td><td>



</td><td>

Executes a callback function for each child node in the collection.

</td></tr>
<tr><td>

[get(key)](./ResourceTreeChildrenValidator.get.md)

</td><td>



</td><td>

Gets a child node by its string key with detailed error information.

</td></tr>
<tr><td>

[has(key)](./ResourceTreeChildrenValidator.has.md)

</td><td>



</td><td>

Checks if a child node exists at the given string key.

</td></tr>
<tr><td>

[keys()](./ResourceTreeChildrenValidator.keys.md)

</td><td>



</td><td>

Returns an iterator of ResourceName keys for all child nodes.

</td></tr>
<tr><td>

[values()](./ResourceTreeChildrenValidator.values.md)

</td><td>



</td><td>

Returns an iterator of child node values.

</td></tr>
<tr><td>

[[iterator]()](./ResourceTreeChildrenValidator._iterator_.md)

</td><td>



</td><td>

Returns an iterator for [ResourceName, node] pairs, enabling for...of iteration.

</td></tr>
</tbody></table>
