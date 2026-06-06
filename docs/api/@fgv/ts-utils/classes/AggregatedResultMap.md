[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-utils](../README.md) / AggregatedResultMap

# Class: AggregatedResultMap\<TCOMPOSITEID, TCOLLECTIONID, TITEMID, TITEM, TMETADATA\>

An aggregated result map that wraps a collection of [ValidatingResultMap](../namespaces/Collections/classes/ValidatingResultMap.md) instances,
keyed by collection ID. Items are accessed via composite IDs that combine the collection ID
and item ID with a delimiter.

## Extends

- [`AggregatedResultMapBase`](../namespaces/Collections/classes/AggregatedResultMapBase.md)\<`TCOMPOSITEID`, `TCOLLECTIONID`, `TITEMID`, `TITEM`, `TMETADATA`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCOMPOSITEID` *extends* `string` | - |
| `TCOLLECTIONID` *extends* `string` | - |
| `TITEMID` *extends* `string` | - |
| `TITEM` | - |
| `TMETADATA` | `unknown` |

## Constructors

### Constructor

> **new AggregatedResultMap**\<`TCOMPOSITEID`, `TCOLLECTIONID`, `TITEMID`, `TITEM`, `TMETADATA`\>(`params`): `AggregatedResultMap`\<`TCOMPOSITEID`, `TCOLLECTIONID`, `TITEMID`, `TITEM`, `TMETADATA`\>

Constructs a new AggregatedResultMap.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `params` | [`IAggregatedResultMapConstructorParams`](../namespaces/Collections/interfaces/IAggregatedResultMapConstructorParams.md)\<`TCOMPOSITEID`, `TCOLLECTIONID`, `TITEMID`, `TITEM`, `TMETADATA`\> |

#### Returns

`AggregatedResultMap`\<`TCOMPOSITEID`, `TCOLLECTIONID`, `TITEMID`, `TITEM`, `TMETADATA`\>

#### Overrides

[`AggregatedResultMapBase`](../namespaces/Collections/classes/AggregatedResultMapBase.md).[`constructor`](../namespaces/Collections/classes/AggregatedResultMapBase.md#constructor)

## Accessors

### collectionCount

#### Get Signature

> **get** **collectionCount**(): `number`

The number of collections.

##### Returns

`number`

#### Inherited from

[`AggregatedResultMapBase`](../namespaces/Collections/classes/AggregatedResultMapBase.md).[`collectionCount`](../namespaces/Collections/classes/AggregatedResultMapBase.md#collectioncount)

***

### collections

#### Get Signature

> **get** **collections**(): [`IReadOnlyValidatingResultMap`](../namespaces/Collections/interfaces/IReadOnlyValidatingResultMap.md)\<`TCOLLECTIONID`, [`AggregatedResultMapEntry`](../namespaces/Collections/type-aliases/AggregatedResultMapEntry.md)\<`TCOLLECTIONID`, `TITEMID`, `TITEM`, `TMETADATA`\>\>

Provides read-only access to the underlying collections map.
Use `collections.has(id)` and `collections.get(id)` to check existence and retrieve collections.

##### Returns

[`IReadOnlyValidatingResultMap`](../namespaces/Collections/interfaces/IReadOnlyValidatingResultMap.md)\<`TCOLLECTIONID`, [`AggregatedResultMapEntry`](../namespaces/Collections/type-aliases/AggregatedResultMapEntry.md)\<`TCOLLECTIONID`, `TITEMID`, `TITEM`, `TMETADATA`\>\>

#### Inherited from

[`AggregatedResultMapBase`](../namespaces/Collections/classes/AggregatedResultMapBase.md).[`collections`](../namespaces/Collections/classes/AggregatedResultMapBase.md#collections)

***

### size

#### Get Signature

> **get** **size**(): `number`

The total number of items across all collections.

##### Returns

`number`

Returns the number of entries in the map.

#### Inherited from

[`AggregatedResultMapBase`](../namespaces/Collections/classes/AggregatedResultMapBase.md).[`size`](../namespaces/Collections/classes/AggregatedResultMapBase.md#size)

***

### validating

#### Get Signature

> **get** **validating**(): [`IReadOnlyResultMapValidator`](../namespaces/Collections/interfaces/IReadOnlyResultMapValidator.md)\<`TCOMPOSITEID`, `TITEM`\>

A validator for weakly-typed access to the map.

##### Returns

[`IReadOnlyResultMapValidator`](../namespaces/Collections/interfaces/IReadOnlyResultMapValidator.md)\<`TCOMPOSITEID`, `TITEM`\>

A [ResultMapValidator](../namespaces/Collections/classes/ResultMapValidator.md) which validates keys and values
before inserting them into this collection.

#### Inherited from

[`AggregatedResultMapBase`](../namespaces/Collections/classes/AggregatedResultMapBase.md).[`validating`](../namespaces/Collections/classes/AggregatedResultMapBase.md#validating)

## Methods

### \_deleteCollection()

> `protected` **\_deleteCollection**(`collectionId`): [`DetailedResult`](../type-aliases/DetailedResult.md)\<[`AggregatedResultMapEntry`](../namespaces/Collections/type-aliases/AggregatedResultMapEntry.md)\<`TCOLLECTIONID`, `TITEMID`, `TITEM`, `TMETADATA`\>, [`ResultMapResultDetail`](../namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

Deletes a collection from the internal collections map.
This is a protected method for use by derived classes that need to implement
collection deletion functionality.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `collectionId` | `TCOLLECTIONID` | The collection ID to delete. |

#### Returns

[`DetailedResult`](../type-aliases/DetailedResult.md)\<[`AggregatedResultMapEntry`](../namespaces/Collections/type-aliases/AggregatedResultMapEntry.md)\<`TCOLLECTIONID`, `TITEMID`, `TITEM`, `TMETADATA`\>, [`ResultMapResultDetail`](../namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

`Success` with the deleted entry if found, `Failure` otherwise.

#### Remarks

- Does NOT check if the collection is mutable - callers should validate this first.
- Use `collections.get(id)` to check if a collection exists and its mutability before calling.

#### Inherited from

[`AggregatedResultMapBase`](../namespaces/Collections/classes/AggregatedResultMapBase.md).[`_deleteCollection`](../namespaces/Collections/classes/AggregatedResultMapBase.md#_deletecollection)

***

### \[iterator\]()

> **\[iterator\]**(): `IterableIterator`\<[`KeyValueEntry`](../namespaces/Collections/type-aliases/KeyValueEntry.md)\<`TCOMPOSITEID`, `TITEM`\>\>

Gets an iterator over the map entries.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](../namespaces/Collections/type-aliases/KeyValueEntry.md)\<`TCOMPOSITEID`, `TITEM`\>\>

#### Inherited from

[`AggregatedResultMapBase`](../namespaces/Collections/classes/AggregatedResultMapBase.md).[`[iterator]`](../namespaces/Collections/classes/AggregatedResultMapBase.md#iterator)

***

### add()

> **add**(`key`, `value`): [`DetailedResult`](../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

Adds an item by its composite ID. Fails if the item already exists.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `TCOMPOSITEID` | The composite ID of the item. |
| `value` | `TITEM` | The value to add. |

#### Returns

[`DetailedResult`](../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

`Success` with the value if added, `Failure` otherwise.

#### Inherited from

[`AggregatedResultMapBase`](../namespaces/Collections/classes/AggregatedResultMapBase.md).[`add`](../namespaces/Collections/classes/AggregatedResultMapBase.md#add)

***

### addCollectionEntry()

> **addCollectionEntry**(`entry`): [`DetailedResult`](../type-aliases/DetailedResult.md)\<[`AggregatedResultMapEntry`](../namespaces/Collections/type-aliases/AggregatedResultMapEntry.md)\<`TCOLLECTIONID`, `TITEMID`, `TITEM`, `TMETADATA`\>, [`ResultMapResultDetail`](../namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

Adds a new collection from a pre-built entry object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `entry` | [`AggregatedResultMapEntryInit`](../namespaces/Collections/type-aliases/AggregatedResultMapEntryInit.md)\<`TCOLLECTIONID`, `TITEMID`, `TITEM`, `TMETADATA`\> | The collection entry to add (JSON with items/entries, or pre-instantiated). |

#### Returns

[`DetailedResult`](../type-aliases/DetailedResult.md)\<[`AggregatedResultMapEntry`](../namespaces/Collections/type-aliases/AggregatedResultMapEntry.md)\<`TCOLLECTIONID`, `TITEMID`, `TITEM`, `TMETADATA`\>, [`ResultMapResultDetail`](../namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

`Success` with the entry if added, `Failure` otherwise.

#### Inherited from

[`AggregatedResultMapBase`](../namespaces/Collections/classes/AggregatedResultMapBase.md).[`addCollectionEntry`](../namespaces/Collections/classes/AggregatedResultMapBase.md#addcollectionentry)

***

### addCollectionWithItems()

> **addCollectionWithItems**(`collectionId`, `items?`, `options?`): [`Result`](../type-aliases/Result.md)\<`TCOLLECTIONID`\>

Adds a new collection with the specified ID and optional initial entries.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `collectionId` | `string` | The collection ID as a string (will be validated). |
| `items?` | `Iterable`\<[`KeyValueEntry`](../namespaces/Collections/type-aliases/KeyValueEntry.md)\<`string`, `unknown`\>, `any`, `any`\> | Optional initial entries for the collection. |
| `options?` | [`IAddCollectionWithItemsOptions`](../namespaces/Collections/interfaces/IAddCollectionWithItemsOptions.md)\<`TMETADATA`\> | Optional settings (isImmutable defaults to false). |

#### Returns

[`Result`](../type-aliases/Result.md)\<`TCOLLECTIONID`\>

`Success` with the validated collection ID if added, `Failure` otherwise.

#### Inherited from

[`AggregatedResultMapBase`](../namespaces/Collections/classes/AggregatedResultMapBase.md).[`addCollectionWithItems`](../namespaces/Collections/classes/AggregatedResultMapBase.md#addcollectionwithitems)

***

### addToCollection()

> **addToCollection**(`collectionId`, `itemId`, `value`): [`DetailedResult`](../type-aliases/DetailedResult.md)\<`TCOMPOSITEID`, [`ResultMapResultDetail`](../namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

Adds an item using separate collection and item IDs.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `collectionId` | `TCOLLECTIONID` | The collection ID. |
| `itemId` | `TITEMID` | The item ID. |
| `value` | `TITEM` | The value to add. |

#### Returns

[`DetailedResult`](../type-aliases/DetailedResult.md)\<`TCOMPOSITEID`, [`ResultMapResultDetail`](../namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

`Success` with the composite ID if added, `Failure` otherwise.

#### Inherited from

[`AggregatedResultMapBase`](../namespaces/Collections/classes/AggregatedResultMapBase.md).[`addToCollection`](../namespaces/Collections/classes/AggregatedResultMapBase.md#addtocollection)

***

### clear()

> **clear**(): `void`

Clears all items from all mutable collections.
Immutable collections are not affected.

#### Returns

`void`

#### Inherited from

[`AggregatedResultMapBase`](../namespaces/Collections/classes/AggregatedResultMapBase.md).[`clear`](../namespaces/Collections/classes/AggregatedResultMapBase.md#clear)

***

### composeId()

> **composeId**(`collectionId`, `itemId`): [`Result`](../type-aliases/Result.md)\<`TCOMPOSITEID`\>

Composes a collection ID and item ID into a composite ID.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `collectionId` | `TCOLLECTIONID` | The collection ID. |
| `itemId` | `TITEMID` | The item ID. |

#### Returns

[`Result`](../type-aliases/Result.md)\<`TCOMPOSITEID`\>

`Success` with the composite ID if valid, `Failure` otherwise.

#### Inherited from

[`AggregatedResultMapBase`](../namespaces/Collections/classes/AggregatedResultMapBase.md).[`composeId`](../namespaces/Collections/classes/AggregatedResultMapBase.md#composeid)

***

### delete()

> **delete**(`key`): [`DetailedResult`](../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

Deletes an item by its composite ID.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `TCOMPOSITEID` | The composite ID of the item. |

#### Returns

[`DetailedResult`](../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

`Success` with the deleted value, `Failure` otherwise.

#### Inherited from

[`AggregatedResultMapBase`](../namespaces/Collections/classes/AggregatedResultMapBase.md).[`delete`](../namespaces/Collections/classes/AggregatedResultMapBase.md#delete)

***

### deleteFromCollection()

> **deleteFromCollection**(`collectionId`, `itemId`): [`DetailedResult`](../type-aliases/DetailedResult.md)\<`TCOMPOSITEID`, [`ResultMapResultDetail`](../namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

Deletes an item using separate collection and item IDs.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `collectionId` | `TCOLLECTIONID` | The collection ID. |
| `itemId` | `TITEMID` | The item ID. |

#### Returns

[`DetailedResult`](../type-aliases/DetailedResult.md)\<`TCOMPOSITEID`, [`ResultMapResultDetail`](../namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

`Success` with the composite ID if deleted, `Failure` otherwise.

#### Inherited from

[`AggregatedResultMapBase`](../namespaces/Collections/classes/AggregatedResultMapBase.md).[`deleteFromCollection`](../namespaces/Collections/classes/AggregatedResultMapBase.md#deletefromcollection)

***

### entries()

> **entries**(): `IterableIterator`\<[`KeyValueEntry`](../namespaces/Collections/type-aliases/KeyValueEntry.md)\<`TCOMPOSITEID`, `TITEM`\>\>

Iterates over all entries in all collections.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](../namespaces/Collections/type-aliases/KeyValueEntry.md)\<`TCOMPOSITEID`, `TITEM`\>\>

#### Inherited from

[`AggregatedResultMapBase`](../namespaces/Collections/classes/AggregatedResultMapBase.md).[`entries`](../namespaces/Collections/classes/AggregatedResultMapBase.md#entries)

***

### forEach()

> **forEach**(`cb`, `thisArg?`): `void`

Calls a callback for each entry.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cb` | [`ResultMapForEachCb`](../namespaces/Collections/type-aliases/ResultMapForEachCb.md)\<`TCOMPOSITEID`, `TITEM`\> | The callback to call. |
| `thisArg?` | `unknown` | Optional `this` argument for the callback. |

#### Returns

`void`

#### Inherited from

[`AggregatedResultMapBase`](../namespaces/Collections/classes/AggregatedResultMapBase.md).[`forEach`](../namespaces/Collections/classes/AggregatedResultMapBase.md#foreach)

***

### get()

> **get**(`key`): [`DetailedResult`](../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

Gets an item by its composite ID.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `TCOMPOSITEID` | The composite ID of the item. |

#### Returns

[`DetailedResult`](../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

`Success` with the item if found, `Failure` otherwise.

#### Inherited from

[`AggregatedResultMapBase`](../namespaces/Collections/classes/AggregatedResultMapBase.md).[`get`](../namespaces/Collections/classes/AggregatedResultMapBase.md#get)

***

### getCollectionMetadata()

> **getCollectionMetadata**(`collectionId`): [`Result`](../type-aliases/Result.md)\<`TMETADATA` \| `undefined`\>

Gets the metadata for a specific collection.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `collectionId` | `TCOLLECTIONID` | The collection ID. |

#### Returns

[`Result`](../type-aliases/Result.md)\<`TMETADATA` \| `undefined`\>

`Success` with the metadata if found, `Failure` otherwise.

#### Inherited from

[`AggregatedResultMapBase`](../namespaces/Collections/classes/AggregatedResultMapBase.md).[`getCollectionMetadata`](../namespaces/Collections/classes/AggregatedResultMapBase.md#getcollectionmetadata)

***

### getOrAdd()

#### Call Signature

> **getOrAdd**(`key`, `value`): [`DetailedResult`](../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

Gets an existing item or adds a new one.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `TCOMPOSITEID` | The composite ID of the item. |
| `value` | `TITEM` | The value to add if not found. |

##### Returns

[`DetailedResult`](../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

`Success` with the existing or new value.

##### Inherited from

[`AggregatedResultMapBase`](../namespaces/Collections/classes/AggregatedResultMapBase.md).[`getOrAdd`](../namespaces/Collections/classes/AggregatedResultMapBase.md#getoradd)

#### Call Signature

> **getOrAdd**(`key`, `factory`): [`DetailedResult`](../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

Gets an existing item or adds a new one using a factory.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `TCOMPOSITEID` | The composite ID of the item. |
| `factory` | [`ResultMapValueFactory`](../namespaces/Collections/type-aliases/ResultMapValueFactory.md)\<`TCOMPOSITEID`, `TITEM`\> | A factory function to create the value if not found. Receives the composite ID. |

##### Returns

[`DetailedResult`](../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

`Success` with the existing or new value.

##### Inherited from

[`AggregatedResultMapBase`](../namespaces/Collections/classes/AggregatedResultMapBase.md).[`getOrAdd`](../namespaces/Collections/classes/AggregatedResultMapBase.md#getoradd)

***

### has()

> **has**(`key`): `boolean`

Checks if an item exists by its composite ID.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `TCOMPOSITEID` | The composite ID of the item. |

#### Returns

`boolean`

`true` if the item exists, `false` otherwise.

#### Inherited from

[`AggregatedResultMapBase`](../namespaces/Collections/classes/AggregatedResultMapBase.md).[`has`](../namespaces/Collections/classes/AggregatedResultMapBase.md#has)

***

### keys()

> **keys**(): `IterableIterator`\<`TCOMPOSITEID`\>

Iterates over all composite keys.

#### Returns

`IterableIterator`\<`TCOMPOSITEID`\>

#### Inherited from

[`AggregatedResultMapBase`](../namespaces/Collections/classes/AggregatedResultMapBase.md).[`keys`](../namespaces/Collections/classes/AggregatedResultMapBase.md#keys)

***

### set()

> **set**(`key`, `value`): [`DetailedResult`](../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

Sets an item by its composite ID. Creates the collection if it doesn't exist and is mutable.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `TCOMPOSITEID` | The composite ID of the item. |
| `value` | `TITEM` | The value to set. |

#### Returns

[`DetailedResult`](../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

`Success` with the value if set, `Failure` otherwise.

#### Inherited from

[`AggregatedResultMapBase`](../namespaces/Collections/classes/AggregatedResultMapBase.md).[`set`](../namespaces/Collections/classes/AggregatedResultMapBase.md#set)

***

### setCollectionMetadata()

> **setCollectionMetadata**(`collectionId`, `metadata`): [`Result`](../type-aliases/Result.md)\<`TMETADATA`\>

Sets the metadata for a mutable collection.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `collectionId` | `TCOLLECTIONID` | The collection ID. |
| `metadata` | `TMETADATA` | The metadata to set. |

#### Returns

[`Result`](../type-aliases/Result.md)\<`TMETADATA`\>

`Success` if set, `Failure` otherwise.

#### Inherited from

[`AggregatedResultMapBase`](../namespaces/Collections/classes/AggregatedResultMapBase.md).[`setCollectionMetadata`](../namespaces/Collections/classes/AggregatedResultMapBase.md#setcollectionmetadata)

***

### setInCollection()

> **setInCollection**(`collectionId`, `itemId`, `value`): [`DetailedResult`](../type-aliases/DetailedResult.md)\<`TCOMPOSITEID`, [`ResultMapResultDetail`](../namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

Sets an item using separate collection and item IDs.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `collectionId` | `TCOLLECTIONID` | The collection ID. |
| `itemId` | `TITEMID` | The item ID. |
| `value` | `TITEM` | The value to set. |

#### Returns

[`DetailedResult`](../type-aliases/DetailedResult.md)\<`TCOMPOSITEID`, [`ResultMapResultDetail`](../namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

`Success` with the composite ID if set, `Failure` otherwise.

#### Inherited from

[`AggregatedResultMapBase`](../namespaces/Collections/classes/AggregatedResultMapBase.md).[`setInCollection`](../namespaces/Collections/classes/AggregatedResultMapBase.md#setincollection)

***

### toReadOnly()

> **toReadOnly**(): [`IReadOnlyResultMap`](../namespaces/Collections/interfaces/IReadOnlyResultMap.md)\<`TCOMPOSITEID`, `TITEM`\>

Returns a read-only view of this map.

#### Returns

[`IReadOnlyResultMap`](../namespaces/Collections/interfaces/IReadOnlyResultMap.md)\<`TCOMPOSITEID`, `TITEM`\>

#### Inherited from

[`AggregatedResultMapBase`](../namespaces/Collections/classes/AggregatedResultMapBase.md).[`toReadOnly`](../namespaces/Collections/classes/AggregatedResultMapBase.md#toreadonly)

***

### update()

> **update**(`key`, `value`): [`DetailedResult`](../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

Updates an existing item by its composite ID. Fails if the item doesn't exist.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `TCOMPOSITEID` | The composite ID of the item. |
| `value` | `TITEM` | The new value. |

#### Returns

[`DetailedResult`](../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

`Success` with the value if updated, `Failure` otherwise.

#### Inherited from

[`AggregatedResultMapBase`](../namespaces/Collections/classes/AggregatedResultMapBase.md).[`update`](../namespaces/Collections/classes/AggregatedResultMapBase.md#update)

***

### updateInCollection()

> **updateInCollection**(`collectionId`, `itemId`, `value`): [`DetailedResult`](../type-aliases/DetailedResult.md)\<`TCOMPOSITEID`, [`ResultMapResultDetail`](../namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

Updates an item using separate collection and item IDs.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `collectionId` | `TCOLLECTIONID` | The collection ID. |
| `itemId` | `TITEMID` | The item ID. |
| `value` | `TITEM` | The new value. |

#### Returns

[`DetailedResult`](../type-aliases/DetailedResult.md)\<`TCOMPOSITEID`, [`ResultMapResultDetail`](../namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

`Success` with the composite ID if updated, `Failure` otherwise.

#### Inherited from

[`AggregatedResultMapBase`](../namespaces/Collections/classes/AggregatedResultMapBase.md).[`updateInCollection`](../namespaces/Collections/classes/AggregatedResultMapBase.md#updateincollection)

***

### values()

> **values**(): `IterableIterator`\<`TITEM`\>

Iterates over all values.

#### Returns

`IterableIterator`\<`TITEM`\>

#### Inherited from

[`AggregatedResultMapBase`](../namespaces/Collections/classes/AggregatedResultMapBase.md).[`values`](../namespaces/Collections/classes/AggregatedResultMapBase.md#values)

***

### create()

> `static` **create**\<`TCOMPOSITEID`, `TCOLLECTIONID`, `TITEMID`, `TITEM`, `TMETADATA`\>(`params`): [`Result`](../type-aliases/Result.md)\<`AggregatedResultMap`\<`TCOMPOSITEID`, `TCOLLECTIONID`, `TITEMID`, `TITEM`, `TMETADATA`\>\>

Creates a new AggregatedResultMap.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCOMPOSITEID` *extends* `string` | - |
| `TCOLLECTIONID` *extends* `string` | - |
| `TITEMID` *extends* `string` | - |
| `TITEM` | - |
| `TMETADATA` | `unknown` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IAggregatedResultMapConstructorParams`](../namespaces/Collections/interfaces/IAggregatedResultMapConstructorParams.md)\<`TCOMPOSITEID`, `TCOLLECTIONID`, `TITEMID`, `TITEM`, `TMETADATA`\> | Parameters for constructing the map. |

#### Returns

[`Result`](../type-aliases/Result.md)\<`AggregatedResultMap`\<`TCOMPOSITEID`, `TCOLLECTIONID`, `TITEMID`, `TITEM`, `TMETADATA`\>\>

`Success` with the new map if successful, `Failure` otherwise.
