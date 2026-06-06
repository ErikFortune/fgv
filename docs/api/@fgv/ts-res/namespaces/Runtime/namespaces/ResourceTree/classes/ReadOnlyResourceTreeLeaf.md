[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [Runtime](../../../README.md) / [ResourceTree](../README.md) / ReadOnlyResourceTreeLeaf

# Class: ReadOnlyResourceTreeLeaf\<T\>

Implementation of a read-only resource tree leaf node that contains a resource value.
Leaf nodes represent the actual resources in the tree and cannot have children.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Implements

- [`IReadOnlyResourceTreeLeaf`](../interfaces/IReadOnlyResourceTreeLeaf.md)\<`T`\>

## Constructors

### Constructor

> `protected` **new ReadOnlyResourceTreeLeaf**\<`T`\>(`name`, `parentPath`, `resource`): `ReadOnlyResourceTreeLeaf`\<`T`\>

Creates a new leaf node. Use the static create method instead.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | [`ResourceName`](../../../../../type-aliases/ResourceName.md) | The name of this node (last segment of the path) |
| `parentPath` | [`ResourceId`](../../../../../type-aliases/ResourceId.md) \| `undefined` | The path to the parent node (undefined for root-level nodes) |
| `resource` | `T` | The resource value stored in this leaf |

#### Returns

`ReadOnlyResourceTreeLeaf`\<`T`\>

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="id"></a> `id` | `readonly` | [`ResourceId`](../../../../../type-aliases/ResourceId.md) |
| <a id="name"></a> `name` | `readonly` | [`ResourceName`](../../../../../type-aliases/ResourceName.md) |
| <a id="resource"></a> `resource` | `readonly` | `T` |

## Accessors

### isBranch

#### Get Signature

> **get** **isBranch**(): `false`

##### Returns

`false`

#### Implementation of

[`IReadOnlyResourceTreeLeaf`](../interfaces/IReadOnlyResourceTreeLeaf.md).[`isBranch`](../interfaces/IReadOnlyResourceTreeLeaf.md#isbranch)

***

### isLeaf

#### Get Signature

> **get** **isLeaf**(): `true`

##### Returns

`true`

#### Implementation of

[`IReadOnlyResourceTreeLeaf`](../interfaces/IReadOnlyResourceTreeLeaf.md).[`isLeaf`](../interfaces/IReadOnlyResourceTreeLeaf.md#isleaf)

***

### isRoot

#### Get Signature

> **get** **isRoot**(): `false`

##### Returns

`false`

#### Implementation of

[`IReadOnlyResourceTreeLeaf`](../interfaces/IReadOnlyResourceTreeLeaf.md).[`isRoot`](../interfaces/IReadOnlyResourceTreeLeaf.md#isroot)

## Methods

### create()

> `static` **create**\<`T`\>(`name`, `parentPath`, `resource`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`ReadOnlyResourceTreeLeaf`\<`T`\>\>

Creates a new ReadOnlyResourceTreeLeaf instance.

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | [`ResourceName`](../../../../../type-aliases/ResourceName.md) | The name of this node (last segment of the path) |
| `parentPath` | [`ResourceId`](../../../../../type-aliases/ResourceId.md) \| `undefined` | The path to the parent node (undefined for root-level nodes) |
| `resource` | `T` | The resource value to store in this leaf |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`ReadOnlyResourceTreeLeaf`\<`T`\>\>

Result containing the new leaf node or failure if construction fails
