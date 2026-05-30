[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [Runtime](../../../README.md) / [ResourceTree](../README.md) / IReadOnlyResourceTreeBranch

# Interface: IReadOnlyResourceTreeBranch\<T\>

Interface for branch nodes in a resource tree that contain child nodes.
Branch nodes organize the tree structure and cannot have resource values.
If a path has child resources, it must be a branch and cannot itself be a resource.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="children"></a> `children` | `readonly` | [`IReadOnlyValidatingResourceTreeChildren`](IReadOnlyValidatingResourceTreeChildren.md)\<`T`\> |
| <a id="id"></a> `id` | `readonly` | [`ResourceId`](../../../../../type-aliases/ResourceId.md) |
| <a id="isbranch"></a> `isBranch` | `readonly` | `true` |
| <a id="isleaf"></a> `isLeaf` | `readonly` | `false` |
| <a id="isroot"></a> `isRoot` | `readonly` | `false` |
| <a id="name"></a> `name` | `readonly` | [`ResourceName`](../../../../../type-aliases/ResourceName.md) |
