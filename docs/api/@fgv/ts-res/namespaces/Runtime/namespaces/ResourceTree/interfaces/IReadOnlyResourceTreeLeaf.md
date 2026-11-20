[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [Runtime](../../../README.md) / [ResourceTree](../README.md) / IReadOnlyResourceTreeLeaf

# Interface: IReadOnlyResourceTreeLeaf\<T\>

Interface for leaf nodes in a resource tree.
Leaf nodes contain resource values and cannot have child nodes.
In a valid resource tree, if a path has child resources (e.g., 'app.messages.welcome'),
then that path cannot itself be a resource (i.e., 'app' cannot be both a resource and have children).

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | [`ResourceId`](../../../../../type-aliases/ResourceId.md) |
| <a id="property-isbranch"></a> `isBranch` | `readonly` | `false` |
| <a id="property-isleaf"></a> `isLeaf` | `readonly` | `true` |
| <a id="property-isroot"></a> `isRoot` | `readonly` | `false` |
| <a id="property-name"></a> `name` | `readonly` | [`ResourceName`](../../../../../type-aliases/ResourceName.md) |
| <a id="property-resource"></a> `resource` | `readonly` | `T` |
