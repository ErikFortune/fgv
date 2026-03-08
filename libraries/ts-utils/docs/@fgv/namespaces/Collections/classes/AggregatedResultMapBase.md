[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Collections](../README.md) / AggregatedResultMapBase

# Class: AggregatedResultMapBase\<TCOMPOSITEID, TCOLLECTIONID, TITEMID, TITEM, TMETADATA\>

Base class for an aggregated result map that wraps a collection of [ValidatingResultMap](ValidatingResultMap.md) instances,
keyed by collection ID. Items are accessed via composite IDs that combine the collection ID
and item ID with a delimiter.

## Remarks

Consumers should inherit from this class or use [AggregatedResultMap](../../../../classes/AggregatedResultMap.md)
for fully generic.

## Extended by

- [`AggregatedResultMap`](../../../../classes/AggregatedResultMap.md)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCOMPOSITEID` *extends* `string` | - |
| `TCOLLECTIONID` *extends* `string` | - |
| `TITEMID` *extends* `string` | - |
| `TITEM` | - |
| `TMETADATA` | `unknown` |

## Implements

- [`IResultMap`](../interfaces/IResultMap.md)\<`TCOMPOSITEID`, `TITEM`\>
- [`IReadOnlyValidatingResultMap`](../interfaces/IReadOnlyValidatingResultMap.md)\<`TCOMPOSITEID`, `TITEM`\>

## Constructors

### Constructor

> `protected` **new AggregatedResultMapBase**\<`TCOMPOSITEID`, `TCOLLECTIONID`, `TITEMID`, `TITEM`, `TMETADATA`\>(`params`): `AggregatedResultMapBase`\<`TCOMPOSITEID`, `TCOLLECTIONID`, `TITEMID`, `TITEM`, `TMETADATA`\>

Protected constructor for derived classes.
Use the [create static method](../../../../classes/AggregatedResultMap.md#create) for safe construction with error handling.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IAggregatedResultMapConstructorParams`](../interfaces/IAggregatedResultMapConstructorParams.md)\<`TCOMPOSITEID`, `TCOLLECTIONID`, `TITEMID`, `TITEM`, `TMETADATA`\> | [Parameters](../interfaces/IAggregatedResultMapConstructorParams.md) for constructing the map. |

#### Returns

`AggregatedResultMapBase`\<`TCOMPOSITEID`, `TCOLLECTIONID`, `TITEMID`, `TITEM`, `TMETADATA`\>

#### Throws

If initialization fails (e.g., invalid collections).

## Accessors

### collectionCount

#### Get Signature

> **get** **collectionCount**(): `number`

The number of collections.

##### Returns

`number`

***

### collections

#### Get Signature

> **get** **collections**(): [`IReadOnlyValidatingResultMap`](../interfaces/IReadOnlyValidatingResultMap.md)\<`TCOLLECTIONID`, [`AggregatedResultMapEntry`](../type-aliases/AggregatedResultMapEntry.md)\<`TCOLLECTIONID`, `TITEMID`, `TITEM`, `TMETADATA`\>\>

Provides read-only access to the underlying collections map.
Use `collections.has(id)` and `collections.get(id)` to check existence and retrieve collections.

##### Returns

[`IReadOnlyValidatingResultMap`](../interfaces/IReadOnlyValidatingResultMap.md)\<`TCOLLECTIONID`, [`AggregatedResultMapEntry`](../type-aliases/AggregatedResultMapEntry.md)\<`TCOLLECTIONID`, `TITEMID`, `TITEM`, `TMETADATA`\>\>

***

### size

#### Get Signature

> **get** **size**(): `number`

The total number of items across all collections.

##### Returns

`number`

Returns the number of entries in the map.

#### Implementation of

[`IReadOnlyValidatingResultMap`](../interfaces/IReadOnlyValidatingResultMap.md).[`size`](../interfaces/IReadOnlyValidatingResultMap.md#size)

***

### validating

#### Get Signature

> **get** **validating**(): [`IReadOnlyResultMapValidator`](../interfaces/IReadOnlyResultMapValidator.md)\<`TCOMPOSITEID`, `TITEM`\>

A validator for weakly-typed access to the map.

##### Returns

[`IReadOnlyResultMapValidator`](../interfaces/IReadOnlyResultMapValidator.md)\<`TCOMPOSITEID`, `TITEM`\>

A [ResultMapValidator](ResultMapValidator.md) which validates keys and values
before inserting them into this collection.

#### Implementation of

[`IReadOnlyValidatingResultMap`](../interfaces/IReadOnlyValidatingResultMap.md).[`validating`](../interfaces/IReadOnlyValidatingResultMap.md#validating)

## Methods

### \_deleteCollection()

> `protected` **\_deleteCollection**(`collectionId`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<[`AggregatedResultMapEntry`](../type-aliases/AggregatedResultMapEntry.md)\<`TCOLLECTIONID`, `TITEMID`, `TITEM`, `TMETADATA`\>, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Deletes a collection from the internal collections map.
This is a protected method for use by derived classes that need to implement
collection deletion functionality.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `collectionId` | `TCOLLECTIONID` | The collection ID to delete. |

#### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<[`AggregatedResultMapEntry`](../type-aliases/AggregatedResultMapEntry.md)\<`TCOLLECTIONID`, `TITEMID`, `TITEM`, `TMETADATA`\>, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

`Success` with the deleted entry if found, `Failure` otherwise.

#### Remarks

- Does NOT check if the collection is mutable - callers should validate this first.
- Use `collections.get(id)` to check if a collection exists and its mutability before calling.

***

### \[iterator\]()

> **\[iterator\]**(): `IterableIterator`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<`TCOMPOSITEID`, `TITEM`\>\>

Gets an iterator over the map entries.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<`TCOMPOSITEID`, `TITEM`\>\>

#### Implementation of

[`IReadOnlyValidatingResultMap`](../interfaces/IReadOnlyValidatingResultMap.md).[`[iterator]`](../interfaces/IReadOnlyValidatingResultMap.md#iterator)

***

### add()

> **add**(`key`, `value`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Adds an item by its composite ID. Fails if the item already exists.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `TCOMPOSITEID` | The composite ID of the item. |
| `value` | `TITEM` | The value to add. |

#### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

`Success` with the value if added, `Failure` otherwise.

#### Implementation of

[`IResultMap`](../interfaces/IResultMap.md).[`add`](../interfaces/IResultMap.md#add)

***

### addCollectionEntry()

> **addCollectionEntry**(`entry`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<[`AggregatedResultMapEntry`](../type-aliases/AggregatedResultMapEntry.md)\<`TCOLLECTIONID`, `TITEMID`, `TITEM`, `TMETADATA`\>, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Adds a new collection from a pre-built entry object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `entry` | [`AggregatedResultMapEntryInit`](../type-aliases/AggregatedResultMapEntryInit.md)\<`TCOLLECTIONID`, `TITEMID`, `TITEM`, `TMETADATA`\> | The collection entry to add (JSON with items/entries, or pre-instantiated). |

#### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<[`AggregatedResultMapEntry`](../type-aliases/AggregatedResultMapEntry.md)\<`TCOLLECTIONID`, `TITEMID`, `TITEM`, `TMETADATA`\>, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

`Success` with the entry if added, `Failure` otherwise.

***

### addCollectionWithItems()

> **addCollectionWithItems**(`collectionId`, `items?`, `options?`): [`Result`](../../../../type-aliases/Result.md)\<`TCOLLECTIONID`\>

Adds a new collection with the specified ID and optional initial entries.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `collectionId` | `string` | The collection ID as a string (will be validated). |
| `items?` | `Iterable`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<`string`, `unknown`\>, `any`, `any`\> | Optional initial entries for the collection. |
| `options?` | [`IAddCollectionWithItemsOptions`](../interfaces/IAddCollectionWithItemsOptions.md)\<`TMETADATA`\> | Optional settings (isImmutable defaults to false). |

#### Returns

[`Result`](../../../../type-aliases/Result.md)\<`TCOLLECTIONID`\>

`Success` with the validated collection ID if added, `Failure` otherwise.

***

### addToCollection()

> **addToCollection**(`collectionId`, `itemId`, `value`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TCOMPOSITEID`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Adds an item using separate collection and item IDs.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `collectionId` | `TCOLLECTIONID` | The collection ID. |
| `itemId` | `TITEMID` | The item ID. |
| `value` | `TITEM` | The value to add. |

#### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TCOMPOSITEID`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

`Success` with the composite ID if added, `Failure` otherwise.

***

### clear()

> **clear**(): `void`

Clears all items from all mutable collections.
Immutable collections are not affected.

#### Returns

`void`

#### Implementation of

[`IResultMap`](../interfaces/IResultMap.md).[`clear`](../interfaces/IResultMap.md#clear)

***

### composeId()

> **composeId**(`collectionId`, `itemId`): [`Result`](../../../../type-aliases/Result.md)\<`TCOMPOSITEID`\>

Composes a collection ID and item ID into a composite ID.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `collectionId` | `TCOLLECTIONID` | The collection ID. |
| `itemId` | `TITEMID` | The item ID. |

#### Returns

[`Result`](../../../../type-aliases/Result.md)\<`TCOMPOSITEID`\>

`Success` with the composite ID if valid, `Failure` otherwise.

***

### delete()

> **delete**(`key`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Deletes an item by its composite ID.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `TCOMPOSITEID` | The composite ID of the item. |

#### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

`Success` with the deleted value, `Failure` otherwise.

#### Implementation of

[`IResultMap`](../interfaces/IResultMap.md).[`delete`](../interfaces/IResultMap.md#delete)

***

### deleteFromCollection()

> **deleteFromCollection**(`collectionId`, `itemId`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TCOMPOSITEID`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Deletes an item using separate collection and item IDs.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `collectionId` | `TCOLLECTIONID` | The collection ID. |
| `itemId` | `TITEMID` | The item ID. |

#### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TCOMPOSITEID`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

`Success` with the composite ID if deleted, `Failure` otherwise.

***

### entries()

> **entries**(): `IterableIterator`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<`TCOMPOSITEID`, `TITEM`\>\>

Iterates over all entries in all collections.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<`TCOMPOSITEID`, `TITEM`\>\>

#### Implementation of

[`IReadOnlyValidatingResultMap`](../interfaces/IReadOnlyValidatingResultMap.md).[`entries`](../interfaces/IReadOnlyValidatingResultMap.md#entries)

***

### forEach()

> **forEach**(`cb`, `thisArg?`): `void`

Calls a callback for each entry.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cb` | [`ResultMapForEachCb`](../type-aliases/ResultMapForEachCb.md)\<`TCOMPOSITEID`, `TITEM`\> | The callback to call. |
| `thisArg?` | `unknown` | Optional `this` argument for the callback. |

#### Returns

`void`

#### Implementation of

[`IReadOnlyValidatingResultMap`](../interfaces/IReadOnlyValidatingResultMap.md).[`forEach`](../interfaces/IReadOnlyValidatingResultMap.md#foreach)

***

### get()

> **get**(`key`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Gets an item by its composite ID.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `TCOMPOSITEID` | The composite ID of the item. |

#### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

`Success` with the item if found, `Failure` otherwise.

#### Implementation of

[`IReadOnlyValidatingResultMap`](../interfaces/IReadOnlyValidatingResultMap.md).[`get`](../interfaces/IReadOnlyValidatingResultMap.md#get)

***

### getCollectionMetadata()

> **getCollectionMetadata**(`collectionId`): [`Result`](../../../../type-aliases/Result.md)\<`TMETADATA` \| `undefined`\>

Gets the metadata for a specific collection.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `collectionId` | `TCOLLECTIONID` | The collection ID. |

#### Returns

[`Result`](../../../../type-aliases/Result.md)\<`TMETADATA` \| `undefined`\>

`Success` with the metadata if found, `Failure` otherwise.

***

### getOrAdd()

#### Call Signature

> **getOrAdd**(`key`, `value`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Gets an existing item or adds a new one.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `TCOMPOSITEID` | The composite ID of the item. |
| `value` | `TITEM` | The value to add if not found. |

##### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

`Success` with the existing or new value.

##### Implementation of

[`IResultMap`](../interfaces/IResultMap.md).[`getOrAdd`](../interfaces/IResultMap.md#getoradd)

#### Call Signature

> **getOrAdd**(`key`, `factory`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Gets an existing item or adds a new one using a factory.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `TCOMPOSITEID` | The composite ID of the item. |
| `factory` | [`ResultMapValueFactory`](../type-aliases/ResultMapValueFactory.md)\<`TCOMPOSITEID`, `TITEM`\> | A factory function to create the value if not found. Receives the composite ID. |

##### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

`Success` with the existing or new value.

##### Implementation of

[`IResultMap`](../interfaces/IResultMap.md).[`getOrAdd`](../interfaces/IResultMap.md#getoradd)

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

#### Implementation of

[`IReadOnlyValidatingResultMap`](../interfaces/IReadOnlyValidatingResultMap.md).[`has`](../interfaces/IReadOnlyValidatingResultMap.md#has)

***

### keys()

> **keys**(): `IterableIterator`\<`TCOMPOSITEID`\>

Iterates over all composite keys.

#### Returns

`IterableIterator`\<`TCOMPOSITEID`\>

#### Implementation of

[`IReadOnlyValidatingResultMap`](../interfaces/IReadOnlyValidatingResultMap.md).[`keys`](../interfaces/IReadOnlyValidatingResultMap.md#keys)

***

### set()

> **set**(`key`, `value`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Sets an item by its composite ID. Creates the collection if it doesn't exist and is mutable.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `TCOMPOSITEID` | The composite ID of the item. |
| `value` | `TITEM` | The value to set. |

#### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

`Success` with the value if set, `Failure` otherwise.

#### Implementation of

[`IResultMap`](../interfaces/IResultMap.md).[`set`](../interfaces/IResultMap.md#set)

***

### setCollectionMetadata()

> **setCollectionMetadata**(`collectionId`, `metadata`): [`Result`](../../../../type-aliases/Result.md)\<`TMETADATA`\>

Sets the metadata for a mutable collection.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `collectionId` | `TCOLLECTIONID` | The collection ID. |
| `metadata` | `TMETADATA` | The metadata to set. |

#### Returns

[`Result`](../../../../type-aliases/Result.md)\<`TMETADATA`\>

`Success` if set, `Failure` otherwise.

***

### setInCollection()

> **setInCollection**(`collectionId`, `itemId`, `value`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TCOMPOSITEID`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Sets an item using separate collection and item IDs.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `collectionId` | `TCOLLECTIONID` | The collection ID. |
| `itemId` | `TITEMID` | The item ID. |
| `value` | `TITEM` | The value to set. |

#### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TCOMPOSITEID`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

`Success` with the composite ID if set, `Failure` otherwise.

***

### toReadOnly()

> **toReadOnly**(): [`IReadOnlyResultMap`](../interfaces/IReadOnlyResultMap.md)\<`TCOMPOSITEID`, `TITEM`\>

Returns a read-only view of this map.

#### Returns

[`IReadOnlyResultMap`](../interfaces/IReadOnlyResultMap.md)\<`TCOMPOSITEID`, `TITEM`\>

#### Implementation of

[`IResultMap`](../interfaces/IResultMap.md).[`toReadOnly`](../interfaces/IResultMap.md#toreadonly)

***

### update()

> **update**(`key`, `value`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Updates an existing item by its composite ID. Fails if the item doesn't exist.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `TCOMPOSITEID` | The composite ID of the item. |
| `value` | `TITEM` | The new value. |

#### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

`Success` with the value if updated, `Failure` otherwise.

#### Implementation of

[`IResultMap`](../interfaces/IResultMap.md).[`update`](../interfaces/IResultMap.md#update)

***

### updateInCollection()

> **updateInCollection**(`collectionId`, `itemId`, `value`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TCOMPOSITEID`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Updates an item using separate collection and item IDs.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `collectionId` | `TCOLLECTIONID` | The collection ID. |
| `itemId` | `TITEMID` | The item ID. |
| `value` | `TITEM` | The new value. |

#### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TCOMPOSITEID`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

`Success` with the composite ID if updated, `Failure` otherwise.

***

### values()

> **values**(): `IterableIterator`\<`TITEM`\>

Iterates over all values.

#### Returns

`IterableIterator`\<`TITEM`\>

#### Implementation of

[`IReadOnlyValidatingResultMap`](../interfaces/IReadOnlyValidatingResultMap.md).[`values`](../interfaces/IReadOnlyValidatingResultMap.md#values)
