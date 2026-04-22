[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [Runtime](../../../README.md) / [ResourceTree](../README.md) / ResourceTreeChildrenValidator

# Class: ResourceTreeChildrenValidator\<T\>

A validator wrapper for resource tree children that validates string inputs before
delegating to the underlying tree children collection.

This class implements [IReadOnlyValidatingResourceTreeChildren](../interfaces/IReadOnlyValidatingResourceTreeChildren.md)
by wrapping an [IReadOnlyResourceTreeChildren](../interfaces/IReadOnlyResourceTreeChildren.md) instance and
providing string-based access to all tree operations. All string inputs are validated using the library's
validation utilities before being passed to the underlying collection.

The validator acts as a bridge between string-based external APIs and the
strongly-typed internal tree operations, ensuring type safety and consistent
error handling throughout the resource tree navigation.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Implements

- [`IReadOnlyResourceTreeChildren`](../interfaces/IReadOnlyResourceTreeChildren.md)\<`T`, `string`, `string`\>

## Constructors

### Constructor

> **new ResourceTreeChildrenValidator**\<`T`\>(`inner`): `ResourceTreeChildrenValidator`\<`T`\>

Creates a new validator wrapper for resource tree children.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `inner` | [`IReadOnlyResourceTreeChildren`](../interfaces/IReadOnlyResourceTreeChildren.md)\<`T`\> | The underlying resource tree children collection to wrap with validation |

#### Returns

`ResourceTreeChildrenValidator`\<`T`\>

## Accessors

### size

#### Get Signature

> **get** **size**(): `number`

The number of direct child nodes in this collection.

##### Returns

`number`

Returns the number of entries in the map.

#### Implementation of

[`IReadOnlyResourceTreeChildren`](../interfaces/IReadOnlyResourceTreeChildren.md).[`size`](../interfaces/IReadOnlyResourceTreeChildren.md#size)

## Methods

### \[iterator\]()

> **\[iterator\]**(): `IterableIterator`\<\[[`ResourceName`](../../../../../type-aliases/ResourceName.md), [`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\]\>

Returns an iterator for [ResourceName, node] pairs, enabling for...of iteration.

#### Returns

`IterableIterator`\<\[[`ResourceName`](../../../../../type-aliases/ResourceName.md), [`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\]\>

Iterable iterator for all child nodes

#### Implementation of

[`IReadOnlyResourceTreeChildren`](../interfaces/IReadOnlyResourceTreeChildren.md).[`[iterator]`](../interfaces/IReadOnlyResourceTreeChildren.md#iterator)

***

### entries()

> **entries**(): `IterableIterator`\<\[[`ResourceName`](../../../../../type-aliases/ResourceName.md), [`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\]\>

Returns an iterator of [ResourceName, node] pairs for all child nodes.

#### Returns

`IterableIterator`\<\[[`ResourceName`](../../../../../type-aliases/ResourceName.md), [`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\]\>

Map iterator for all child nodes

#### Implementation of

[`IReadOnlyResourceTreeChildren`](../interfaces/IReadOnlyResourceTreeChildren.md).[`entries`](../interfaces/IReadOnlyResourceTreeChildren.md#entries)

***

### forEach()

> **forEach**(`cb`, `arg?`): `void`

Executes a callback function for each child node in the collection.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cb` | (`value`, `key`, `map`, `thisArg?`) => `void` | The callback function to execute for each child node |
| `arg?` | `unknown` | Optional argument to pass to the callback |

#### Returns

`void`

#### Implementation of

[`IReadOnlyResourceTreeChildren`](../interfaces/IReadOnlyResourceTreeChildren.md).[`forEach`](../interfaces/IReadOnlyResourceTreeChildren.md#foreach)

***

### get()

> **get**(`key`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Gets a child node by its string key with detailed error information.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The string key to look up |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

DetailedResult containing the node if found, or failure with details

#### Implementation of

[`IReadOnlyResourceTreeChildren`](../interfaces/IReadOnlyResourceTreeChildren.md).[`get`](../interfaces/IReadOnlyResourceTreeChildren.md#get)

***

### getBranch()

> **getBranch**(`name`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\>

Gets a branch node by its string name (single component), validating the input.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | The string ResourceName to validate and look up |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\>

Result containing the node if it's a branch, or failure if validation fails or not found

#### Implementation of

[`IReadOnlyResourceTreeChildren`](../interfaces/IReadOnlyResourceTreeChildren.md).[`getBranch`](../interfaces/IReadOnlyResourceTreeChildren.md#getbranch)

***

### getBranchById()

> **getBranchById**(`id`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IReadOnlyResourceTreeBranch`](../interfaces/IReadOnlyResourceTreeBranch.md)\<`T`\>\>

Gets a branch node by its string ResourceId path, validating the input.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | The string ResourceId path to validate and look up |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IReadOnlyResourceTreeBranch`](../interfaces/IReadOnlyResourceTreeBranch.md)\<`T`\>\>

Result containing the branch if found and has children, or failure otherwise

#### Implementation of

[`IReadOnlyResourceTreeChildren`](../interfaces/IReadOnlyResourceTreeChildren.md).[`getBranchById`](../interfaces/IReadOnlyResourceTreeChildren.md#getbranchbyid)

***

### getById()

> **getById**(`id`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\>

Gets a tree node by its string ResourceId path, validating the input.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | The string ResourceId path to validate and look up |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\>

Result containing the node if found, or failure if validation fails or not found

#### Implementation of

[`IReadOnlyResourceTreeChildren`](../interfaces/IReadOnlyResourceTreeChildren.md).[`getById`](../interfaces/IReadOnlyResourceTreeChildren.md#getbyid)

***

### getResource()

> **getResource**(`name`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\>

Gets a resource node by its string name (single component), validating the input.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | The string ResourceName to validate and look up |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\>

Result containing the node if it's a resource, or failure if validation fails or not found

#### Implementation of

[`IReadOnlyResourceTreeChildren`](../interfaces/IReadOnlyResourceTreeChildren.md).[`getResource`](../interfaces/IReadOnlyResourceTreeChildren.md#getresource)

***

### getResourceById()

> **getResourceById**(`id`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IReadOnlyResourceTreeLeaf`](../interfaces/IReadOnlyResourceTreeLeaf.md)\<`T`\>\>

Gets a resource leaf node by its string ResourceId path, validating the input.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | The string ResourceId path to validate and look up |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IReadOnlyResourceTreeLeaf`](../interfaces/IReadOnlyResourceTreeLeaf.md)\<`T`\>\>

Result containing the leaf if found and is a resource, or failure otherwise

#### Implementation of

[`IReadOnlyResourceTreeChildren`](../interfaces/IReadOnlyResourceTreeChildren.md).[`getResourceById`](../interfaces/IReadOnlyResourceTreeChildren.md#getresourcebyid)

***

### has()

> **has**(`key`): `boolean`

Checks if a child node exists at the given string key.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The string key to check |

#### Returns

`boolean`

True if a child node exists at the key, false otherwise

#### Implementation of

[`IReadOnlyResourceTreeChildren`](../interfaces/IReadOnlyResourceTreeChildren.md).[`has`](../interfaces/IReadOnlyResourceTreeChildren.md#has)

***

### keys()

> **keys**(): `IterableIterator`\<[`ResourceName`](../../../../../type-aliases/ResourceName.md)\>

Returns an iterator of ResourceName keys for all child nodes.

#### Returns

`IterableIterator`\<[`ResourceName`](../../../../../type-aliases/ResourceName.md)\>

Map iterator for all child node keys

#### Implementation of

[`IReadOnlyResourceTreeChildren`](../interfaces/IReadOnlyResourceTreeChildren.md).[`keys`](../interfaces/IReadOnlyResourceTreeChildren.md#keys)

***

### values()

> **values**(): `IterableIterator`\<[`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\>

Returns an iterator of child node values.

#### Returns

`IterableIterator`\<[`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\>

Map iterator for all child node values

#### Implementation of

[`IReadOnlyResourceTreeChildren`](../interfaces/IReadOnlyResourceTreeChildren.md).[`values`](../interfaces/IReadOnlyResourceTreeChildren.md#values)
