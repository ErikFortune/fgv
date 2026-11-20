[Home](../../README.md) > [Runtime](../README.md) > IResolveResourceTreeOptions

# Interface: IResolveResourceTreeOptions

Options for configuring resource tree resolution.

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

[onResourceError](./IResolveResourceTreeOptions.onResourceError.md)

</td><td>



</td><td>

"fail" | "ignore" | [ResourceErrorHandler](../../type-aliases/ResourceErrorHandler.md)

</td><td>

Controls how errors are handled when resolving individual resources in the tree.

</td></tr>
<tr><td>

[onEmptyBranch](./IResolveResourceTreeOptions.onEmptyBranch.md)

</td><td>



</td><td>

"omit" | [EmptyBranchHandler](../../type-aliases/EmptyBranchHandler.md) | "allow"

</td><td>

Controls how empty branch nodes are handled during tree composition.

</td></tr>
</tbody></table>
