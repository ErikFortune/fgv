[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [Runtime](../../../README.md) / [ResourceTree](../README.md) / IReadOnlyResourceTreeChildren

# Interface: IReadOnlyResourceTreeChildren\<T, TID, TNAME\>

Interface for a read-only result-based resource tree with navigation methods.

## Extends

- [`IReadOnlyResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TNAME`, [`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\>

## Extended by

- [`IReadOnlyValidatingResourceTreeChildren`](IReadOnlyValidatingResourceTreeChildren.md)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TID` *extends* `string` | [`ResourceId`](../../../../../type-aliases/ResourceId.md) |
| `TNAME` *extends* `string` | [`ResourceName`](../../../../../type-aliases/ResourceName.md) |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="size"></a> `size` | `readonly` | `number` | Returns the number of entries in the map. |

## Methods

### \[iterator\]()

> **\[iterator\]**(): `IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TNAME`, [`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\>\>

Gets an iterator over the map entries.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TNAME`, [`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\>\>

An iterator over the map entries.

#### Inherited from

`IReadOnlyResultMap.[iterator]`

***

### entries()

> **entries**(): `IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TNAME`, [`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\>\>

Returns an iterator over the map entries.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TNAME`, [`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\>\>

An iterator over the map entries.

#### Inherited from

`IReadOnlyResultMap.entries`

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

`IReadOnlyResultMap.forEach`

***

### get()

> **get**(`key`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Gets a value from the map.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `TNAME` | The key to retrieve. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the value and detail `exists` if the key was found,
`Failure` with detail `not-found` if the key was not found or with detail
`invalid-key` if the key is invalid.

#### Inherited from

`IReadOnlyResultMap.get`

***

### getBranch()

> **getBranch**(`name`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\>

Gets a branch node by its direct name (single component).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `TNAME` | The ResourceName to look up |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\>

Result containing the node if it's a branch, or failure if not found or not a branch

***

### getBranchById()

> **getBranchById**(`id`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IReadOnlyResourceTreeBranch`](IReadOnlyResourceTreeBranch.md)\<`T`\>\>

Gets a branch node by its full ResourceId path.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `TID` | The ResourceId path to look up |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IReadOnlyResourceTreeBranch`](IReadOnlyResourceTreeBranch.md)\<`T`\>\>

Result containing the branch if found and has children, or failure otherwise

***

### getById()

> **getById**(`id`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\>

Gets a tree node by its full ResourceId path.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `TID` | The ResourceId path to look up |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\>

Result containing the node if found, or failure if not found

***

### getResource()

> **getResource**(`name`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\>

Gets a resource node by its direct name (single component).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `TNAME` | The ResourceName to look up |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\>

Result containing the node if it's a resource, or failure if not found or not a resource

***

### getResourceById()

> **getResourceById**(`id`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IReadOnlyResourceTreeLeaf`](IReadOnlyResourceTreeLeaf.md)\<`T`\>\>

Gets a resource leaf node by its full ResourceId path.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `TID` | The ResourceId path to look up |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IReadOnlyResourceTreeLeaf`](IReadOnlyResourceTreeLeaf.md)\<`T`\>\>

Result containing the leaf if found and is a resource, or failure otherwise

***

### has()

> **has**(`key`): `boolean`

Returns `true` if the map contains a key.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `TNAME` | The key to check. |

#### Returns

`boolean`

`true` if the key exists, `false` otherwise.

#### Inherited from

`IReadOnlyResultMap.has`

***

### keys()

> **keys**(): `IterableIterator`\<`TNAME`\>

Returns an iterator over the map keys.

#### Returns

`IterableIterator`\<`TNAME`\>

An iterator over the map keys.

#### Inherited from

`IReadOnlyResultMap.keys`

***

### values()

> **values**(): `IterableIterator`\<[`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\>

Returns an iterator over the map values.

#### Returns

`IterableIterator`\<[`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\>

An iterator over the map values.

#### Inherited from

`IReadOnlyResultMap.values`
