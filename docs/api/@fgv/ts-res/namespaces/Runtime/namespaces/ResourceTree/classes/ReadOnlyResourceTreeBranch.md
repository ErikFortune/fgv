[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [Runtime](../../../README.md) / [ResourceTree](../README.md) / ReadOnlyResourceTreeBranch

# Class: ReadOnlyResourceTreeBranch\<T\>

Implementation of a read-only resource tree branch node that contains child nodes.
Branch nodes organize other nodes in a hierarchical structure and may optionally contain a resource value.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Implements

- [`IReadOnlyResourceTreeBranch`](../interfaces/IReadOnlyResourceTreeBranch.md)\<`T`\>

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="children"></a> `children` | `readonly` | [`IReadOnlyValidatingResourceTreeChildren`](../interfaces/IReadOnlyValidatingResourceTreeChildren.md)\<`T`\> |
| <a id="id"></a> `id` | `readonly` | [`ResourceId`](../../../../../type-aliases/ResourceId.md) |
| <a id="name"></a> `name` | `readonly` | [`ResourceName`](../../../../../type-aliases/ResourceName.md) |

## Accessors

### isBranch

#### Get Signature

> **get** **isBranch**(): `true`

##### Returns

`true`

#### Implementation of

[`IReadOnlyResourceTreeBranch`](../interfaces/IReadOnlyResourceTreeBranch.md).[`isBranch`](../interfaces/IReadOnlyResourceTreeBranch.md#isbranch)

***

### isLeaf

#### Get Signature

> **get** **isLeaf**(): `false`

##### Returns

`false`

#### Implementation of

[`IReadOnlyResourceTreeBranch`](../interfaces/IReadOnlyResourceTreeBranch.md).[`isLeaf`](../interfaces/IReadOnlyResourceTreeBranch.md#isleaf)

***

### isRoot

#### Get Signature

> **get** **isRoot**(): `false`

##### Returns

`false`

#### Implementation of

[`IReadOnlyResourceTreeBranch`](../interfaces/IReadOnlyResourceTreeBranch.md).[`isRoot`](../interfaces/IReadOnlyResourceTreeBranch.md#isroot)

## Methods

### create()

> `static` **create**\<`T`\>(`childName`, `path`, `childInit`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`ReadOnlyResourceTreeBranch`\<`T`\>\>

Creates a new ReadOnlyResourceTreeBranch instance.

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `childName` | [`ResourceName`](../../../../../type-aliases/ResourceName.md) | The name of this node (last segment of the path) |
| `path` | [`ResourceId`](../../../../../type-aliases/ResourceId.md) \| `undefined` | The path to the parent node (undefined for root-level nodes) |
| `childInit` | [`IResourceTreeBranchInit`](../interfaces/IResourceTreeBranchInit.md)\<`T`\> | Initialization data containing child nodes |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`ReadOnlyResourceTreeBranch`\<`T`\>\>

Result containing the new branch node or failure if construction fails
