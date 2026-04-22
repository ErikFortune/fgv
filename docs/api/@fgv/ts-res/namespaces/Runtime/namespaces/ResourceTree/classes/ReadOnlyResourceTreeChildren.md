[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [Runtime](../../../README.md) / [ResourceTree](../README.md) / ReadOnlyResourceTreeChildren

# Class: ReadOnlyResourceTreeChildren\<T\>

Implementation of a result-based resource tree that provides hierarchical access to resources.
Extends ResultMap to provide collection-like access while adding tree-specific navigation methods.

## Extends

- [`ResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ResourceName`](../../../../../type-aliases/ResourceName.md), [`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\>

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Implements

- [`IReadOnlyValidatingResourceTreeChildren`](../interfaces/IReadOnlyValidatingResourceTreeChildren.md)\<`T`\>

## Constructors

### Constructor

> **new ReadOnlyResourceTreeChildren**\<`T`\>(`path`, `entries`): `ReadOnlyResourceTreeChildren`\<`T`\>

Creates a new ReadOnlyResourceTreeChildren instance.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | [`ResourceId`](../../../../../type-aliases/ResourceId.md) \| `undefined` | The path to this tree node (undefined for root) |
| `entries` | \[[`ResourceName`](../../../../../type-aliases/ResourceName.md), [`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\][] | Array of [name, node] tuples to populate the tree |

#### Returns

`ReadOnlyResourceTreeChildren`\<`T`\>

#### Overrides

`ResultMap<ResourceName, IReadOnlyResourceTreeNode<T>>.constructor`

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="_inner"></a> `_inner` | `readonly` | `Map`\<[`ResourceName`](../../../../../type-aliases/ResourceName.md), [`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\> | Protected raw access to the inner `Map<TK, TV>` object. |
| <a id="path"></a> `path` | `protected` | [`ResourceId`](../../../../../type-aliases/ResourceId.md) \| `undefined` | - |
| <a id="validating"></a> `validating` | `public` | [`IReadOnlyResourceTreeChildren`](../interfaces/IReadOnlyResourceTreeChildren.md)\<`T`, `string`, `string`\> | - |

## Accessors

### size

#### Get Signature

> **get** **size**(): `number`

Returns the number of entries in the map.

##### Returns

`number`

Returns the number of entries in the map.

#### Implementation of

[`IReadOnlyValidatingResourceTreeChildren`](../interfaces/IReadOnlyValidatingResourceTreeChildren.md).[`size`](../interfaces/IReadOnlyValidatingResourceTreeChildren.md#size)

#### Inherited from

`ResultMap.size`

## Methods

### \_isResultMapValueFactory()

> **\_isResultMapValueFactory**\<`TK`, `TV`\>(`value`): `value is ResultMapValueFactory<TK, TV>`

Determines if a value is a [ResultMapValueFactory](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs).

#### Type Parameters

| Type Parameter |
| ------ |
| `TK` *extends* `string` |
| `TV` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `TV` \| [`ResultMapValueFactory`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TK`, `TV`\> | The value to check. |

#### Returns

`value is ResultMapValueFactory<TK, TV>`

`true` if the value is a [ResultMapValueFactory](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs),
`false` otherwise.

#### Inherited from

`ResultMap._isResultMapValueFactory`

***

### \[iterator\]()

> **\[iterator\]**(): `IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ResourceName`](../../../../../type-aliases/ResourceName.md), [`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\>\>

Gets an iterator over the map entries.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ResourceName`](../../../../../type-aliases/ResourceName.md), [`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\>\>

An iterator over the map entries.

#### Implementation of

[`IReadOnlyValidatingResourceTreeChildren`](../interfaces/IReadOnlyValidatingResourceTreeChildren.md).[`[iterator]`](../interfaces/IReadOnlyValidatingResourceTreeChildren.md#iterator)

#### Inherited from

`ResultMap.[iterator]`

***

### add()

> **add**(`key`, `value`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Sets a key/value pair in the map if the key does not already exist.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | [`ResourceName`](../../../../../type-aliases/ResourceName.md) | The key to set. |
| `value` | [`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md) | The value to set. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the value and detail `added` if the key was added,
`Failure` with detail `exists` if the key already exists. Fails with detail
'invalid-key' or 'invalid-value' and an error message if either is invalid.

#### Inherited from

`ResultMap.add`

***

### clear()

> **clear**(): `void`

Clears the map.

#### Returns

`void`

#### Inherited from

`ResultMap.clear`

***

### delete()

> **delete**(`key`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Deletes a key from the map.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | [`ResourceName`](../../../../../type-aliases/ResourceName.md) | The key to delete. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the previous value and the detail 'deleted'
if the key was found and deleted, `Failure` with detail 'not-found'
if the key was not found, or with detail 'invalid-key' if the key is invalid.

#### Inherited from

`ResultMap.delete`

***

### entries()

> **entries**(): `IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ResourceName`](../../../../../type-aliases/ResourceName.md), [`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\>\>

Returns an iterator over the map entries.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ResourceName`](../../../../../type-aliases/ResourceName.md), [`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\>\>

An iterator over the map entries.

#### Implementation of

[`IReadOnlyValidatingResourceTreeChildren`](../interfaces/IReadOnlyValidatingResourceTreeChildren.md).[`entries`](../interfaces/IReadOnlyValidatingResourceTreeChildren.md#entries)

#### Inherited from

`ResultMap.entries`

***

### forEach()

> **forEach**(`cb`, `arg?`): `void`

Calls a function for each entry in the map.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cb` | [`ResultMapForEachCb`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ResourceName`](../../../../../type-aliases/ResourceName.md), [`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\> | The function to call for each entry. |
| `arg?` | `unknown` | An optional argument to pass to the callback. |

#### Returns

`void`

#### Implementation of

[`IReadOnlyValidatingResourceTreeChildren`](../interfaces/IReadOnlyValidatingResourceTreeChildren.md).[`forEach`](../interfaces/IReadOnlyValidatingResourceTreeChildren.md#foreach)

#### Inherited from

`ResultMap.forEach`

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

#### Implementation of

[`IReadOnlyValidatingResourceTreeChildren`](../interfaces/IReadOnlyValidatingResourceTreeChildren.md).[`get`](../interfaces/IReadOnlyValidatingResourceTreeChildren.md#get)

#### Inherited from

`ResultMap.get`

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

#### Implementation of

[`IReadOnlyValidatingResourceTreeChildren`](../interfaces/IReadOnlyValidatingResourceTreeChildren.md).[`getBranch`](../interfaces/IReadOnlyValidatingResourceTreeChildren.md#getbranch)

***

### getBranchById()

> **getBranchById**(`id`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IReadOnlyResourceTreeBranch`](../interfaces/IReadOnlyResourceTreeBranch.md)\<`T`\>\>

Gets a branch node by its full ResourceId path.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | [`ResourceId`](../../../../../type-aliases/ResourceId.md) | The ResourceId path to look up |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IReadOnlyResourceTreeBranch`](../interfaces/IReadOnlyResourceTreeBranch.md)\<`T`\>\>

Result containing the branch if found and has children, or failure otherwise

#### Implementation of

[`IReadOnlyValidatingResourceTreeChildren`](../interfaces/IReadOnlyValidatingResourceTreeChildren.md).[`getBranchById`](../interfaces/IReadOnlyValidatingResourceTreeChildren.md#getbranchbyid)

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

#### Implementation of

[`IReadOnlyValidatingResourceTreeChildren`](../interfaces/IReadOnlyValidatingResourceTreeChildren.md).[`getById`](../interfaces/IReadOnlyValidatingResourceTreeChildren.md#getbyid)

***

### getOrAdd()

#### Call Signature

> **getOrAdd**(`key`, `value`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Gets a value from the map, or adds a supplied value it if it does not exist.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | [`ResourceName`](../../../../../type-aliases/ResourceName.md) | The key to be retrieved or created. |
| `value` | [`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md) | The value to add if the key does not exist. |

##### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the value and detail `exists` if the key was found,
`Success` with the value and detail `added` if the key was not found and added.
Fails with detail 'invalid-key' or 'invalid-value' and an error message if either
is invalid.

##### Inherited from

`ResultMap.getOrAdd`

#### Call Signature

> **getOrAdd**(`key`, `factory`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Gets a value from the map, or adds a value created by a factory function if it does not exist.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | [`ResourceName`](../../../../../type-aliases/ResourceName.md) | The key of the element to be retrieved or created. |
| `factory` | [`ResultMapValueFactory`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ResourceName`](../../../../../type-aliases/ResourceName.md), [`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\> | A [factory function](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) to create the value if the key does not exist. |

##### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the value and detail `exists` if the key was found, `Success` with
the value and detail `added` if the key was not found and added. Fails with detail 'invalid-key'
or 'invalid-value' and an error message if either is invalid.

##### Inherited from

`ResultMap.getOrAdd`

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

#### Implementation of

[`IReadOnlyValidatingResourceTreeChildren`](../interfaces/IReadOnlyValidatingResourceTreeChildren.md).[`getResource`](../interfaces/IReadOnlyValidatingResourceTreeChildren.md#getresource)

***

### getResourceById()

> **getResourceById**(`id`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IReadOnlyResourceTreeLeaf`](../interfaces/IReadOnlyResourceTreeLeaf.md)\<`T`\>\>

Gets a resource leaf node by its full ResourceId path.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | [`ResourceId`](../../../../../type-aliases/ResourceId.md) | The ResourceId path to look up |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IReadOnlyResourceTreeLeaf`](../interfaces/IReadOnlyResourceTreeLeaf.md)\<`T`\>\>

Result containing the leaf if found and is a resource, or failure otherwise

#### Implementation of

[`IReadOnlyValidatingResourceTreeChildren`](../interfaces/IReadOnlyValidatingResourceTreeChildren.md).[`getResourceById`](../interfaces/IReadOnlyValidatingResourceTreeChildren.md#getresourcebyid)

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

#### Implementation of

[`IReadOnlyValidatingResourceTreeChildren`](../interfaces/IReadOnlyValidatingResourceTreeChildren.md).[`has`](../interfaces/IReadOnlyValidatingResourceTreeChildren.md#has)

#### Inherited from

`ResultMap.has`

***

### keys()

> **keys**(): `IterableIterator`\<[`ResourceName`](../../../../../type-aliases/ResourceName.md)\>

Returns an iterator over the map keys.

#### Returns

`IterableIterator`\<[`ResourceName`](../../../../../type-aliases/ResourceName.md)\>

An iterator over the map keys.

#### Implementation of

[`IReadOnlyValidatingResourceTreeChildren`](../interfaces/IReadOnlyValidatingResourceTreeChildren.md).[`keys`](../interfaces/IReadOnlyValidatingResourceTreeChildren.md#keys)

#### Inherited from

`ResultMap.keys`

***

### set()

> **set**(`key`, `value`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Sets a key/value pair in the map.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | [`ResourceName`](../../../../../type-aliases/ResourceName.md) | The key to set. |
| `value` | [`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md) | The value to set. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the new value and the detail `updated` if the
key was found and updated, `Success` with the new value and detail
`added` if the key was not found and added.  Fails with detail
'invalid-key' or 'invalid-value' and an error message if either is invalid.

#### Inherited from

`ResultMap.set`

***

### toReadOnly()

> **toReadOnly**(): [`IReadOnlyResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ResourceName`](../../../../../type-aliases/ResourceName.md), [`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\>

Gets a readonly version of this map.

#### Returns

[`IReadOnlyResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ResourceName`](../../../../../type-aliases/ResourceName.md), [`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\>

A readonly version of this map.

#### Inherited from

`ResultMap.toReadOnly`

***

### update()

> **update**(`key`, `value`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Updates an existing key in the map - the map is not updated if the key does
not exist.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | [`ResourceName`](../../../../../type-aliases/ResourceName.md) | The key to update. |
| `value` | [`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md) | The value to set. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the value and detail 'exists' if the key was found
and the value updated, `Failure` an error message and with detail `not-found`
if the key was not found, or with detail 'invalid-key' or 'invalid-value'
if either is invalid.

#### Inherited from

`ResultMap.update`

***

### values()

> **values**(): `IterableIterator`\<[`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\>

Returns an iterator over the map values.

#### Returns

`IterableIterator`\<[`IReadOnlyResourceTreeNode`](../type-aliases/IReadOnlyResourceTreeNode.md)\<`T`\>\>

An iterator over the map values.

#### Implementation of

[`IReadOnlyValidatingResourceTreeChildren`](../interfaces/IReadOnlyValidatingResourceTreeChildren.md).[`values`](../interfaces/IReadOnlyValidatingResourceTreeChildren.md#values)

#### Inherited from

`ResultMap.values`

***

### create()

#### Call Signature

> `static` **create**\<`TK`, `TV`\>(`elements`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TK`, `TV`\>\>

Creates a new [ResultMap](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs).

##### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TK` *extends* `string` | `string` |
| `TV` | `unknown` |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `elements` | `Iterable`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TK`, `TV`\>\> | An optional iterable to initialize the map. |

##### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TK`, `TV`\>\>

`Success` with the new map, or `Failure` with error details
if an error occurred.

##### Inherited from

`ResultMap.create`

#### Call Signature

> `static` **create**\<`TK`, `TV`\>(`params?`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TK`, `TV`\>\>

Creates a new [ResultMap](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs).

##### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TK` *extends* `string` | `string` |
| `TV` | `unknown` |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params?` | [`IResultMapConstructorParams`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TK`, `TV`\> | An optional set of parameters to configure the map. |

##### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TK`, `TV`\>\>

`Success` with the new map, or `Failure` with error details
if an error occurred.

##### Inherited from

`ResultMap.create`
