[Home](../../README.md) > [Runtime](../README.md) > ResourceTreeResolver

# Class: ResourceTreeResolver

Specialized resolver for resource tree operations, providing enhanced APIs for
resolving entire resource trees from either resource IDs or pre-built tree nodes.

This class provides a clean separation between individual resource resolution
(handled by ResourceResolver) and tree-based operations, with support for
lazy tree construction and enhanced error handling.

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

`constructor(resolver)`

</td><td>



</td><td>

Creates a Runtime.ResourceTreeResolver | ResourceTreeResolver instance.

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

[resolver](./ResourceTreeResolver.resolver.md)

</td><td>

`readonly`

</td><td>

[ResourceResolver](../../classes/ResourceResolver.md)

</td><td>

The Runtime.ResourceResolver | ResourceResolver to use for individual resource resolution

</td></tr>
<tr><td>

[tree](./ResourceTreeResolver.tree.md)

</td><td>

`readonly`

</td><td>

[IReadOnlyResourceTreeRoot](../../interfaces/IReadOnlyResourceTreeRoot.md)&lt;[IResource](../../interfaces/IResource.md)&gt;

</td><td>

Gets the built resource tree, building it lazily on first access.

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

[create(resolver)](./ResourceTreeResolver.create.md)

</td><td>

`static`

</td><td>

Creates a Runtime.ResourceTreeResolver | ResourceTreeResolver instance.

</td></tr>
<tr><td>

[resolveComposedResourceTree(resourceId, options)](./ResourceTreeResolver.resolveComposedResourceTree.md)

</td><td>



</td><td>

Resolves a resource tree from a resource ID, building the tree lazily from the resource manager.

</td></tr>
</tbody></table>
