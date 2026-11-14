[Home](../README.md) > ReadOnlyResourceTreeBranch

# Class: ReadOnlyResourceTreeBranch

Implementation of a read-only resource tree branch node that contains child nodes.
Branch nodes organize other nodes in a hierarchical structure and may optionally contain a resource value.

**Implements:** [`IReadOnlyResourceTreeBranch<T>`](../interfaces/IReadOnlyResourceTreeBranch.md)

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

[children](./ReadOnlyResourceTreeBranch.children.md)

</td><td>

`readonly`

</td><td>

[IReadOnlyValidatingResourceTreeChildren](../interfaces/IReadOnlyValidatingResourceTreeChildren.md)&lt;T&gt;

</td><td>



</td></tr>
<tr><td>

[name](./ReadOnlyResourceTreeBranch.name.md)

</td><td>

`readonly`

</td><td>

[ResourceName](../type-aliases/ResourceName.md)

</td><td>



</td></tr>
<tr><td>

[id](./ReadOnlyResourceTreeBranch.id.md)

</td><td>

`readonly`

</td><td>

[ResourceId](../type-aliases/ResourceId.md)

</td><td>



</td></tr>
<tr><td>

[isRoot](./ReadOnlyResourceTreeBranch.isRoot.md)

</td><td>

`readonly`

</td><td>

false

</td><td>



</td></tr>
<tr><td>

[isBranch](./ReadOnlyResourceTreeBranch.isBranch.md)

</td><td>

`readonly`

</td><td>

true

</td><td>



</td></tr>
<tr><td>

[isLeaf](./ReadOnlyResourceTreeBranch.isLeaf.md)

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

[create(childName, path, childInit)](./ReadOnlyResourceTreeBranch.create.md)

</td><td>

`static`

</td><td>

Creates a new ReadOnlyResourceTreeBranch instance.

</td></tr>
</tbody></table>
