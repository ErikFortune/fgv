[Home](../../../README.md) > [Runtime](../../README.md) > [ResourceTree](../README.md) > IReadOnlyResourceTreeBranch

# Interface: IReadOnlyResourceTreeBranch

Interface for branch nodes in a resource tree that contain child nodes.
Branch nodes organize the tree structure and cannot have resource values.
If a path has child resources, it must be a branch and cannot itself be a resource.

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

[id](./IReadOnlyResourceTreeBranch.id.md)

</td><td>

`readonly`

</td><td>

[ResourceId](../../../type-aliases/ResourceId.md)

</td><td>



</td></tr>
<tr><td>

[name](./IReadOnlyResourceTreeBranch.name.md)

</td><td>

`readonly`

</td><td>

[ResourceName](../../../type-aliases/ResourceName.md)

</td><td>



</td></tr>
<tr><td>

[children](./IReadOnlyResourceTreeBranch.children.md)

</td><td>

`readonly`

</td><td>

[IReadOnlyValidatingResourceTreeChildren](../../../interfaces/IReadOnlyValidatingResourceTreeChildren.md)&lt;T&gt;

</td><td>



</td></tr>
<tr><td>

[isLeaf](./IReadOnlyResourceTreeBranch.isLeaf.md)

</td><td>

`readonly`

</td><td>

false

</td><td>



</td></tr>
<tr><td>

[isBranch](./IReadOnlyResourceTreeBranch.isBranch.md)

</td><td>

`readonly`

</td><td>

true

</td><td>



</td></tr>
<tr><td>

[isRoot](./IReadOnlyResourceTreeBranch.isRoot.md)

</td><td>

`readonly`

</td><td>

false

</td><td>



</td></tr>
</tbody></table>
