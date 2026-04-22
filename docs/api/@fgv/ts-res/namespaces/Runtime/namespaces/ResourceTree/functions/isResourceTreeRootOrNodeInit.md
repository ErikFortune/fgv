[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [Runtime](../../../README.md) / [ResourceTree](../README.md) / isResourceTreeRootOrNodeInit

# Function: isResourceTreeRootOrNodeInit()

> **isResourceTreeRootOrNodeInit**\<`T`\>(`init`): `init is IResourceTreeBranchInit<T>`

Type guard to determine if an init object represents a branch or root with children.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `init` | [`ResourceTreeNodeInit`](../type-aliases/ResourceTreeNodeInit.md)\<`T`\> \| [`IResourceTreeRootInit`](../interfaces/IResourceTreeRootInit.md)\<`T`\> | The initialization object to test |

## Returns

`init is IResourceTreeBranchInit<T>`

True if the init object has children property
