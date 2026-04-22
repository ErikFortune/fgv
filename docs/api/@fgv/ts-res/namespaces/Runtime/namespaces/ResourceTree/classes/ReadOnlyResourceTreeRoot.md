[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [Runtime](../../../README.md) / [ResourceTree](../README.md) / ReadOnlyResourceTreeRoot

# Class: ReadOnlyResourceTreeRoot\<T\>

Implementation of a read-only resource tree root that organizes resources hierarchically.
The root provides the entry point for tree navigation and resource access by ResourceId paths.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Implements

- [`IReadOnlyResourceTreeRoot`](../interfaces/IReadOnlyResourceTreeRoot.md)\<`T`\>

## Constructors

### Constructor

> `protected` **new ReadOnlyResourceTreeRoot**\<`T`\>(`init`): `ReadOnlyResourceTreeRoot`\<`T`\>

Creates a new root node. Use the static create method instead.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `init` | [`IResourceTreeRootInit`](../interfaces/IResourceTreeRootInit.md)\<`T`\> | Initialization data containing child nodes |

#### Returns

`ReadOnlyResourceTreeRoot`\<`T`\>

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="children"></a> `children` | `readonly` | [`IReadOnlyValidatingResourceTreeChildren`](../interfaces/IReadOnlyValidatingResourceTreeChildren.md)\<`T`\> |

## Accessors

### isBranch

#### Get Signature

> **get** **isBranch**(): `false`

##### Returns

`false`

#### Implementation of

[`IReadOnlyResourceTreeRoot`](../interfaces/IReadOnlyResourceTreeRoot.md).[`isBranch`](../interfaces/IReadOnlyResourceTreeRoot.md#isbranch)

***

### isLeaf

#### Get Signature

> **get** **isLeaf**(): `false`

##### Returns

`false`

#### Implementation of

[`IReadOnlyResourceTreeRoot`](../interfaces/IReadOnlyResourceTreeRoot.md).[`isLeaf`](../interfaces/IReadOnlyResourceTreeRoot.md#isleaf)

***

### isRoot

#### Get Signature

> **get** **isRoot**(): `true`

##### Returns

`true`

#### Implementation of

[`IReadOnlyResourceTreeRoot`](../interfaces/IReadOnlyResourceTreeRoot.md).[`isRoot`](../interfaces/IReadOnlyResourceTreeRoot.md#isroot)

## Methods

### create()

Creates a new ReadOnlyResourceTreeRoot from either resources or initialization data.

#### Param

Either an array of [ResourceId, resource] pairs or tree initialization structure

#### Call Signature

> `static` **create**\<`T`\>(`resources`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`ReadOnlyResourceTreeRoot`\<`T`\>\>

Creates a new ReadOnlyResourceTreeRoot from an array of resources.

##### Type Parameters

| Type Parameter |
| ------ |
| `T` |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `resources` | \[[`ResourceId`](../../../../../type-aliases/ResourceId.md), `T`\][] | Array of [ResourceId, resource] pairs to build the tree from |

##### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`ReadOnlyResourceTreeRoot`\<`T`\>\>

Result containing the new root or failure if construction fails

#### Call Signature

> `static` **create**\<`T`\>(`init`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`ReadOnlyResourceTreeRoot`\<`T`\>\>

Creates a new ReadOnlyResourceTreeRoot from initialization data.

##### Type Parameters

| Type Parameter |
| ------ |
| `T` |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `init` | [`IResourceTreeRootInit`](../interfaces/IResourceTreeRootInit.md)\<`T`\> | Tree initialization structure |

##### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`ReadOnlyResourceTreeRoot`\<`T`\>\>

Result containing the new root or failure if construction fails

***

### createResourceTreeInit()

> `static` **createResourceTreeInit**\<`T`\>(`resources`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IResourceTreeRootInit`](../interfaces/IResourceTreeRootInit.md)\<`T`\>\>

Converts an array of resources into tree initialization data.
Validates that resource paths do not conflict - if a path has child resources,
it cannot itself be a resource (e.g., if 'app.messages.welcome' exists, then 'app' cannot be a resource).

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `resources` | \[[`ResourceId`](../../../../../type-aliases/ResourceId.md), `T`\][] | Array of [ResourceId, resource] pairs to convert |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IResourceTreeRootInit`](../interfaces/IResourceTreeRootInit.md)\<`T`\>\>

Result containing the initialization structure or failure if validation fails
