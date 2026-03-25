[Home](../../README.md) > [Runtime](../README.md) > ReadOnlyResourceTreeLeaf

# Class: ReadOnlyResourceTreeLeaf

Implementation of a read-only resource tree leaf node that contains a resource value.
Leaf nodes represent the actual resources in the tree and cannot have children.

**Implements:** [`IReadOnlyResourceTreeLeaf<T>`](../../interfaces/IReadOnlyResourceTreeLeaf.md)

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

[name](./ReadOnlyResourceTreeLeaf.name.md)

</td><td>

`readonly`

</td><td>

[ResourceName](../../type-aliases/ResourceName.md)

</td><td>



</td></tr>
<tr><td>

[id](./ReadOnlyResourceTreeLeaf.id.md)

</td><td>

`readonly`

</td><td>

[ResourceId](../../type-aliases/ResourceId.md)

</td><td>



</td></tr>
<tr><td>

[resource](./ReadOnlyResourceTreeLeaf.resource.md)

</td><td>

`readonly`

</td><td>

T

</td><td>



</td></tr>
<tr><td>

[isRoot](./ReadOnlyResourceTreeLeaf.isRoot.md)

</td><td>

`readonly`

</td><td>

false

</td><td>



</td></tr>
<tr><td>

[isBranch](./ReadOnlyResourceTreeLeaf.isBranch.md)

</td><td>

`readonly`

</td><td>

false

</td><td>



</td></tr>
<tr><td>

[isLeaf](./ReadOnlyResourceTreeLeaf.isLeaf.md)

</td><td>

`readonly`

</td><td>

true

</td><td>



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

[create(name, parentPath, resource)](./ReadOnlyResourceTreeLeaf.create.md)

</td><td>

`static`

</td><td>

Creates a new ReadOnlyResourceTreeLeaf instance.

</td></tr>
</tbody></table>
