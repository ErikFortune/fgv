[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [Runtime](../../../README.md) / [ResourceTree](../README.md) / isResourceTreeLeafInit

# Function: isResourceTreeLeafInit()

> **isResourceTreeLeafInit**\<`T`\>(`init`): `init is IResourceTreeLeafInit<T>`

Type guard to determine if an init object represents a leaf node with a resource.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `init` | [`ResourceTreeNodeInit`](../type-aliases/ResourceTreeNodeInit.md)\<`T`\> | The initialization object to test |

## Returns

`init is IResourceTreeLeafInit<T>`

True if the init object has a resource but no children
