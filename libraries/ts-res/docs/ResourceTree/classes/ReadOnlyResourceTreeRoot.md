[Home](../../README.md) > [ResourceTree](../README.md) > ReadOnlyResourceTreeRoot

# Class: ReadOnlyResourceTreeRoot

Implementation of a read-only resource tree root that organizes resources hierarchically.
The root provides the entry point for tree navigation and resource access by ResourceId paths.

**Implements:** [`IReadOnlyResourceTreeRoot<T>`](../../interfaces/IReadOnlyResourceTreeRoot.md)

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

[children](./ReadOnlyResourceTreeRoot.children.md)

</td><td>

`readonly`

</td><td>

[IReadOnlyValidatingResourceTreeChildren](../../interfaces/IReadOnlyValidatingResourceTreeChildren.md)&lt;T&gt;

</td><td>



</td></tr>
<tr><td>

[isRoot](./ReadOnlyResourceTreeRoot.isRoot.md)

</td><td>

`readonly`

</td><td>

true

</td><td>



</td></tr>
<tr><td>

[isBranch](./ReadOnlyResourceTreeRoot.isBranch.md)

</td><td>

`readonly`

</td><td>

false

</td><td>



</td></tr>
<tr><td>

[isLeaf](./ReadOnlyResourceTreeRoot.isLeaf.md)

</td><td>

`readonly`

</td><td>

false

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

[create(resources)](./ReadOnlyResourceTreeRoot.create.md)

</td><td>

`static`

</td><td>

Creates a new ReadOnlyResourceTreeRoot from an array of resources.

</td></tr>
<tr><td>

[createResourceTreeInit(resources)](./ReadOnlyResourceTreeRoot.createResourceTreeInit.md)

</td><td>

`static`

</td><td>

Converts an array of resources into tree initialization data.

</td></tr>
</tbody></table>
