[Home](../../README.md) > [Runtime](../README.md) > ResourceTree

# Namespace: ResourceTree

## Classes

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[ReadOnlyResourceTreeChildren](./classes/ReadOnlyResourceTreeChildren.md)

</td><td>

Implementation of a result-based resource tree that provides hierarchical access to resources.

</td></tr>
<tr><td>

[ResourceTreeChildrenValidator](./classes/ResourceTreeChildrenValidator.md)

</td><td>

A validator wrapper for resource tree children that validates string inputs before
delegating to the underlying tree children collection.

</td></tr>
<tr><td>

[ReadOnlyResourceTreeLeaf](./classes/ReadOnlyResourceTreeLeaf.md)

</td><td>

Implementation of a read-only resource tree leaf node that contains a resource value.

</td></tr>
<tr><td>

[ReadOnlyResourceTreeBranch](./classes/ReadOnlyResourceTreeBranch.md)

</td><td>

Implementation of a read-only resource tree branch node that contains child nodes.

</td></tr>
<tr><td>

[ReadOnlyResourceTreeRoot](./classes/ReadOnlyResourceTreeRoot.md)

</td><td>

Implementation of a read-only resource tree root that organizes resources hierarchically.

</td></tr>
</tbody></table>

## Interfaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[IReadOnlyResourceTreeLeaf](./interfaces/IReadOnlyResourceTreeLeaf.md)

</td><td>

Interface for leaf nodes in a resource tree.

</td></tr>
<tr><td>

[IReadOnlyResourceTreeBranch](./interfaces/IReadOnlyResourceTreeBranch.md)

</td><td>

Interface for branch nodes in a resource tree that contain child nodes.

</td></tr>
<tr><td>

[IReadOnlyResourceTreeRoot](./interfaces/IReadOnlyResourceTreeRoot.md)

</td><td>

Interface for the root node of a resource tree.

</td></tr>
<tr><td>

[IReadOnlyResourceTreeChildren](./interfaces/IReadOnlyResourceTreeChildren.md)

</td><td>

Interface for a read-only result-based resource tree with navigation methods.

</td></tr>
<tr><td>

[IReadOnlyValidatingResourceTreeChildren](./interfaces/IReadOnlyValidatingResourceTreeChildren.md)

</td><td>

A read-only interface for accessing resource tree children using weakly-typed string keys.

</td></tr>
<tr><td>

[IResourceTreeRootInit](./interfaces/IResourceTreeRootInit.md)

</td><td>

Interface for initializing a resource tree root with child nodes.

</td></tr>
<tr><td>

[IResourceTreeLeafInit](./interfaces/IResourceTreeLeafInit.md)

</td><td>

Interface for initializing a leaf node with a resource value.

</td></tr>
<tr><td>

[IResourceTreeBranchInit](./interfaces/IResourceTreeBranchInit.md)

</td><td>

Interface for initializing a branch node with child nodes.

</td></tr>
</tbody></table>

## Type Aliases

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[IReadOnlyResourceTreeNode](./type-aliases/IReadOnlyResourceTreeNode.md)

</td><td>

Union type representing any node in the resource tree, which can be a leaf or a branch.

</td></tr>
<tr><td>

[ResourceTreeNodeInit](./type-aliases/ResourceTreeNodeInit.md)

</td><td>

Union type for tree node initialization data.

</td></tr>
<tr><td>

[ReadOnlyResourceTreeNode](./type-aliases/ReadOnlyResourceTreeNode.md)

</td><td>

Union type representing any node in a read-only resource tree.

</td></tr>
</tbody></table>

## Functions

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[isResourceTreeRootOrNodeInit](./functions/isResourceTreeRootOrNodeInit.md)

</td><td>

Type guard to determine if an init object represents a branch or root with children.

</td></tr>
<tr><td>

[isResourceTreeLeafInit](./functions/isResourceTreeLeafInit.md)

</td><td>

Type guard to determine if an init object represents a leaf node with a resource.

</td></tr>
</tbody></table>
