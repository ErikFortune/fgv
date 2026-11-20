[Home](../README.md) > IReadOnlyResourceTreeLeaf

# Interface: IReadOnlyResourceTreeLeaf

Interface for leaf nodes in a resource tree.
Leaf nodes contain resource values and cannot have child nodes.
In a valid resource tree, if a path has child resources (e.g., 'app.messages.welcome'),
then that path cannot itself be a resource (i.e., 'app' cannot be both a resource and have children).

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

[id](./IReadOnlyResourceTreeLeaf.id.md)

</td><td>

`readonly`

</td><td>

[ResourceId](../type-aliases/ResourceId.md)

</td><td>



</td></tr>
<tr><td>

[name](./IReadOnlyResourceTreeLeaf.name.md)

</td><td>

`readonly`

</td><td>

[ResourceName](../type-aliases/ResourceName.md)

</td><td>



</td></tr>
<tr><td>

[resource](./IReadOnlyResourceTreeLeaf.resource.md)

</td><td>

`readonly`

</td><td>

T

</td><td>



</td></tr>
<tr><td>

[isLeaf](./IReadOnlyResourceTreeLeaf.isLeaf.md)

</td><td>

`readonly`

</td><td>

true

</td><td>



</td></tr>
<tr><td>

[isBranch](./IReadOnlyResourceTreeLeaf.isBranch.md)

</td><td>

`readonly`

</td><td>

false

</td><td>



</td></tr>
<tr><td>

[isRoot](./IReadOnlyResourceTreeLeaf.isRoot.md)

</td><td>

`readonly`

</td><td>

false

</td><td>



</td></tr>
</tbody></table>
