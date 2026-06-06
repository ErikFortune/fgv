[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [Runtime](../../../README.md) / [ResourceTree](../README.md) / IReadOnlyValidatingResourceTreeChildren

# Interface: IReadOnlyValidatingResourceTreeChildren\<T\>

A read-only interface for accessing resource tree children using weakly-typed string keys.

## Extends

- [`IReadOnlyResourceTreeChildren`](IReadOnlyResourceTreeChildren.md)\<`T`\>

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="size"></a> `size` | `readonly` | `number` | Returns the number of entries in the map. |
| <a id="validating"></a> `validating` | `readonly` | [`IReadOnlyResourceTreeChildren`](IReadOnlyResourceTreeChildren.md)\<`T`, `string`, `string`\> | - |

## Methods

### \[iterator\]()

> **\[iterator\]**(): `IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ResourceName`](../../../../../type-aliases/ResourceName.md), [`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\>\>

Gets an iterator over the map entries.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ResourceName`](../../../../../type-aliases/ResourceName.md), [`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\>\>

An iterator over the map entries.

#### Inherited from

[`IReadOnlyResourceTreeChildren`](IReadOnlyResourceTreeChildren.md).[`[iterator]`](IReadOnlyResourceTreeChildren.md#iterator)

***

### entries()

> **entries**(): `IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ResourceName`](../../../../../type-aliases/ResourceName.md), [`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\>\>

Returns an iterator over the map entries.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ResourceName`](../../../../../type-aliases/ResourceName.md), [`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\>\>

An iterator over the map entries.

#### Inherited from

[`IReadOnlyResourceTreeChildren`](IReadOnlyResourceTreeChildren.md).[`entries`](IReadOnlyResourceTreeChildren.md#entries)

***

### forEach()

> **forEach**(`cb`, `arg?`): `void`

Calls a function for each entry in the map.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cb` | [`ResultMapForEachCb`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | The function to call for each entry. |
| `arg?` | `unknown` | An optional argument to pass to the callback. |

#### Returns

`void`

#### Inherited from

[`IReadOnlyResourceTreeChildren`](IReadOnlyResourceTreeChildren.md).[`forEach`](IReadOnlyResourceTreeChildren.md#foreach)

***

### get()

> **get**(`key`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Gets a value from the map.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | [`ResourceName`](../../../../../type-aliases/ResourceName.md) | The key to retrieve. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the value and detail `exists` if the key was found,
`Failure` with detail `not-found` if the key was not found or with detail
`invalid-key` if the key is invalid.

#### Inherited from

[`IReadOnlyResourceTreeChildren`](IReadOnlyResourceTreeChildren.md).[`get`](IReadOnlyResourceTreeChildren.md#get)

***

### getBranch()

> **getBranch**(`name`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\>

Gets a branch node by its direct name (single component).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | [`ResourceName`](../../../../../type-aliases/ResourceName.md) | The ResourceName to look up |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\>

Result containing the node if it's a branch, or failure if not found or not a branch

#### Inherited from

[`IReadOnlyResourceTreeChildren`](IReadOnlyResourceTreeChildren.md).[`getBranch`](IReadOnlyResourceTreeChildren.md#getbranch)

***

### getBranchById()

> **getBranchById**(`id`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IReadOnlyResourceTreeBranch`](IReadOnlyResourceTreeBranch.md)\<`T`\>\>

Gets a branch node by its full ResourceId path.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | [`ResourceId`](../../../../../type-aliases/ResourceId.md) | The ResourceId path to look up |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IReadOnlyResourceTreeBranch`](IReadOnlyResourceTreeBranch.md)\<`T`\>\>

Result containing the branch if found and has children, or failure otherwise

#### Inherited from

[`IReadOnlyResourceTreeChildren`](IReadOnlyResourceTreeChildren.md).[`getBranchById`](IReadOnlyResourceTreeChildren.md#getbranchbyid)

***

### getById()

> **getById**(`id`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\>

Gets a tree node by its full ResourceId path.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | [`ResourceId`](../../../../../type-aliases/ResourceId.md) | The ResourceId path to look up |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\>

Result containing the node if found, or failure if not found

#### Inherited from

[`IReadOnlyResourceTreeChildren`](IReadOnlyResourceTreeChildren.md).[`getById`](IReadOnlyResourceTreeChildren.md#getbyid)

***

### getResource()

> **getResource**(`name`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\>

Gets a resource node by its direct name (single component).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | [`ResourceName`](../../../../../type-aliases/ResourceName.md) | The ResourceName to look up |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\>

Result containing the node if it's a resource, or failure if not found or not a resource

#### Inherited from

[`IReadOnlyResourceTreeChildren`](IReadOnlyResourceTreeChildren.md).[`getResource`](IReadOnlyResourceTreeChildren.md#getresource)

***

### getResourceById()

> **getResourceById**(`id`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IReadOnlyResourceTreeLeaf`](IReadOnlyResourceTreeLeaf.md)\<`T`\>\>

Gets a resource leaf node by its full ResourceId path.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | [`ResourceId`](../../../../../type-aliases/ResourceId.md) | The ResourceId path to look up |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IReadOnlyResourceTreeLeaf`](IReadOnlyResourceTreeLeaf.md)\<`T`\>\>

Result containing the leaf if found and is a resource, or failure otherwise

#### Inherited from

[`IReadOnlyResourceTreeChildren`](IReadOnlyResourceTreeChildren.md).[`getResourceById`](IReadOnlyResourceTreeChildren.md#getresourcebyid)

***

### has()

> **has**(`key`): `boolean`

Returns `true` if the map contains a key.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | [`ResourceName`](../../../../../type-aliases/ResourceName.md) | The key to check. |

#### Returns

`boolean`

`true` if the key exists, `false` otherwise.

#### Inherited from

[`IReadOnlyResourceTreeChildren`](IReadOnlyResourceTreeChildren.md).[`has`](IReadOnlyResourceTreeChildren.md#has)

***

### keys()

> **keys**(): `IterableIterator`\<[`ResourceName`](../../../../../type-aliases/ResourceName.md)\>

Returns an iterator over the map keys.

#### Returns

`IterableIterator`\<[`ResourceName`](../../../../../type-aliases/ResourceName.md)\>

An iterator over the map keys.

#### Inherited from

[`IReadOnlyResourceTreeChildren`](IReadOnlyResourceTreeChildren.md).[`keys`](IReadOnlyResourceTreeChildren.md#keys)

***

### values()

> **values**(): `IterableIterator`\<[`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\>

Returns an iterator over the map values.

#### Returns

`IterableIterator`\<[`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\>

An iterator over the map values.

#### Inherited from

[`IReadOnlyResourceTreeChildren`](IReadOnlyResourceTreeChildren.md).[`values`](IReadOnlyResourceTreeChildren.md#values)
