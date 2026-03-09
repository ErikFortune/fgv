[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / AggregatedResultMap

# Class: AggregatedResultMap\<TCOMPOSITEID, TCOLLECTIONID, TITEMID, TITEM, TMETADATA\>

An aggregated result map that wraps a collection of [ValidatingResultMap](../@fgv/namespaces/Collections/classes/ValidatingResultMap.md) instances,
keyed by collection ID. Items are accessed via composite IDs that combine the collection ID
and item ID with a delimiter.

## Extends

- [`AggregatedResultMapBase`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md)\<`TCOMPOSITEID`, `TCOLLECTIONID`, `TITEMID`, `TITEM`, `TMETADATA`\>

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

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IAggregatedResultMapConstructorParams`](../@fgv/namespaces/Collections/interfaces/IAggregatedResultMapConstructorParams.md)\<`TCOMPOSITEID`, `TCOLLECTIONID`, `TITEMID`, `TITEM`, `TMETADATA`\> |  |

#### Returns

`AggregatedResultMap`\<`TCOMPOSITEID`, `TCOLLECTIONID`, `TITEMID`, `TITEM`, `TMETADATA`\>

#### Overrides

[`AggregatedResultMapBase`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md).[`constructor`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md#constructor)

## Accessors

### collectionCount

#### Get Signature

> **get** **collectionCount**(): `number`

The number of collections.

##### Returns

`number`

#### Inherited from

[`AggregatedResultMapBase`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md).[`collectionCount`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md#collectioncount)

***

### collections

#### Get Signature

> **get** **collections**(): [`IReadOnlyValidatingResultMap`](../@fgv/namespaces/Collections/interfaces/IReadOnlyValidatingResultMap.md)\<`TCOLLECTIONID`, [`AggregatedResultMapEntry`](../@fgv/namespaces/Collections/type-aliases/AggregatedResultMapEntry.md)\<`TCOLLECTIONID`, `TITEMID`, `TITEM`, `TMETADATA`\>\>

Provides read-only access to the underlying collections map.
Use `collections.has(id)` and `collections.get(id)` to check existence and retrieve collections.

##### Returns

[`IReadOnlyValidatingResultMap`](../@fgv/namespaces/Collections/interfaces/IReadOnlyValidatingResultMap.md)\<`TCOLLECTIONID`, [`AggregatedResultMapEntry`](../@fgv/namespaces/Collections/type-aliases/AggregatedResultMapEntry.md)\<`TCOLLECTIONID`, `TITEMID`, `TITEM`, `TMETADATA`\>\>

#### Inherited from

[`AggregatedResultMapBase`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md).[`collections`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md#collections)

***

### size

#### Get Signature

> **get** **size**(): `number`

The total number of items across all collections.

##### Returns

`number`

Returns the number of entries in the map.

#### Inherited from

[`AggregatedResultMapBase`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md).[`size`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md#size)

***

### validating

#### Get Signature

> **get** **validating**(): [`IReadOnlyResultMapValidator`](../@fgv/namespaces/Collections/interfaces/IReadOnlyResultMapValidator.md)\<`TCOMPOSITEID`, `TITEM`\>

A validator for weakly-typed access to the map.

##### Returns

[`IReadOnlyResultMapValidator`](../@fgv/namespaces/Collections/interfaces/IReadOnlyResultMapValidator.md)\<`TCOMPOSITEID`, `TITEM`\>

A [ResultMapValidator](../@fgv/namespaces/Collections/classes/ResultMapValidator.md) which validates keys and values
before inserting them into this collection.

#### Inherited from

[`AggregatedResultMapBase`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md).[`validating`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md#validating)

## Methods

### \_deleteCollection()

> `protected` **\_deleteCollection**(`collectionId`): [`DetailedResult`](../type-aliases/DetailedResult.md)\<[`AggregatedResultMapEntry`](../@fgv/namespaces/Collections/type-aliases/AggregatedResultMapEntry.md)\<`TCOLLECTIONID`, `TITEMID`, `TITEM`, `TMETADATA`\>, [`ResultMapResultDetail`](../@fgv/namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

Deletes a collection from the internal collections map.
This is a protected method for use by derived classes that need to implement
collection deletion functionality.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `collectionId` | `TCOLLECTIONID` | The collection ID to delete. |

#### Returns

[`DetailedResult`](../type-aliases/DetailedResult.md)\<[`AggregatedResultMapEntry`](../@fgv/namespaces/Collections/type-aliases/AggregatedResultMapEntry.md)\<`TCOLLECTIONID`, `TITEMID`, `TITEM`, `TMETADATA`\>, [`ResultMapResultDetail`](../@fgv/namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

`Success` with the deleted entry if found, `Failure` otherwise.

#### Remarks

- Does NOT check if the collection is mutable - callers should validate this first.
- Use `collections.get(id)` to check if a collection exists and its mutability before calling.

#### Inherited from

[`AggregatedResultMapBase`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md).[`_deleteCollection`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md#_deletecollection)

***

### \[iterator\]()

> **\[iterator\]**(): `IterableIterator`\<[`KeyValueEntry`](../@fgv/namespaces/Collections/type-aliases/KeyValueEntry.md)\<`TCOMPOSITEID`, `TITEM`\>\>

Gets an iterator over the map entries.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](../@fgv/namespaces/Collections/type-aliases/KeyValueEntry.md)\<`TCOMPOSITEID`, `TITEM`\>\>

#### Inherited from

[`AggregatedResultMapBase`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md).[`[iterator]`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md#iterator)

***

### add()

> **add**(`key`, `value`): [`DetailedResult`](../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../@fgv/namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

Adds an item by its composite ID. Fails if the item already exists.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `TCOMPOSITEID` | The composite ID of the item. |
| `value` | `TITEM` | The value to add. |

#### Returns

[`DetailedResult`](../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../@fgv/namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

`Success` with the value if added, `Failure` otherwise.

#### Inherited from

[`AggregatedResultMapBase`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md).[`add`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md#add)

***

### addCollectionEntry()

> **addCollectionEntry**(`entry`): [`DetailedResult`](../type-aliases/DetailedResult.md)\<[`AggregatedResultMapEntry`](../@fgv/namespaces/Collections/type-aliases/AggregatedResultMapEntry.md)\<`TCOLLECTIONID`, `TITEMID`, `TITEM`, `TMETADATA`\>, [`ResultMapResultDetail`](../@fgv/namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

Adds a new collection from a pre-built entry object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `entry` | [`AggregatedResultMapEntryInit`](../@fgv/namespaces/Collections/type-aliases/AggregatedResultMapEntryInit.md)\<`TCOLLECTIONID`, `TITEMID`, `TITEM`, `TMETADATA`\> | The collection entry to add (JSON with items/entries, or pre-instantiated). |

#### Returns

[`DetailedResult`](../type-aliases/DetailedResult.md)\<[`AggregatedResultMapEntry`](../@fgv/namespaces/Collections/type-aliases/AggregatedResultMapEntry.md)\<`TCOLLECTIONID`, `TITEMID`, `TITEM`, `TMETADATA`\>, [`ResultMapResultDetail`](../@fgv/namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

`Success` with the entry if added, `Failure` otherwise.

#### Inherited from

[`AggregatedResultMapBase`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md).[`addCollectionEntry`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md#addcollectionentry)

***

### addCollectionWithItems()

> **addCollectionWithItems**(`collectionId`, `items?`, `options?`): [`Result`](../type-aliases/Result.md)\<`TCOLLECTIONID`\>

Adds a new collection with the specified ID and optional initial entries.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `collectionId` | `string` | The collection ID as a string (will be validated). |
| `items?` | `Iterable`\<[`KeyValueEntry`](../@fgv/namespaces/Collections/type-aliases/KeyValueEntry.md)\<`string`, `unknown`\>, `any`, `any`\> | Optional initial entries for the collection. |
| `options?` | [`IAddCollectionWithItemsOptions`](../@fgv/namespaces/Collections/interfaces/IAddCollectionWithItemsOptions.md)\<`TMETADATA`\> | Optional settings (isImmutable defaults to false). |

#### Returns

[`Result`](../type-aliases/Result.md)\<`TCOLLECTIONID`\>

`Success` with the validated collection ID if added, `Failure` otherwise.

#### Inherited from

[`AggregatedResultMapBase`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md).[`addCollectionWithItems`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md#addcollectionwithitems)

***

### addToCollection()

> **addToCollection**(`collectionId`, `itemId`, `value`): [`DetailedResult`](../type-aliases/DetailedResult.md)\<`TCOMPOSITEID`, [`ResultMapResultDetail`](../@fgv/namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

Adds an item using separate collection and item IDs.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `collectionId` | `TCOLLECTIONID` | The collection ID. |
| `itemId` | `TITEMID` | The item ID. |
| `value` | `TITEM` | The value to add. |

#### Returns

[`DetailedResult`](../type-aliases/DetailedResult.md)\<`TCOMPOSITEID`, [`ResultMapResultDetail`](../@fgv/namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

`Success` with the composite ID if added, `Failure` otherwise.

#### Inherited from

[`AggregatedResultMapBase`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md).[`addToCollection`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md#addtocollection)

***

### clear()

> **clear**(): `void`

Clears all items from all mutable collections.
Immutable collections are not affected.

#### Returns

`void`

#### Inherited from

[`AggregatedResultMapBase`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md).[`clear`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md#clear)

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

[`AggregatedResultMapBase`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md).[`composeId`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md#composeid)

***

### delete()

> **delete**(`key`): [`DetailedResult`](../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../@fgv/namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

Deletes an item by its composite ID.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `TCOMPOSITEID` | The composite ID of the item. |

#### Returns

[`DetailedResult`](../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../@fgv/namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

`Success` with the deleted value, `Failure` otherwise.

#### Inherited from

[`AggregatedResultMapBase`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md).[`delete`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md#delete)

***

### deleteFromCollection()

> **deleteFromCollection**(`collectionId`, `itemId`): [`DetailedResult`](../type-aliases/DetailedResult.md)\<`TCOMPOSITEID`, [`ResultMapResultDetail`](../@fgv/namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

Deletes an item using separate collection and item IDs.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `collectionId` | `TCOLLECTIONID` | The collection ID. |
| `itemId` | `TITEMID` | The item ID. |

#### Returns

[`DetailedResult`](../type-aliases/DetailedResult.md)\<`TCOMPOSITEID`, [`ResultMapResultDetail`](../@fgv/namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

`Success` with the composite ID if deleted, `Failure` otherwise.

#### Inherited from

[`AggregatedResultMapBase`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md).[`deleteFromCollection`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md#deletefromcollection)

***

### entries()

> **entries**(): `IterableIterator`\<[`KeyValueEntry`](../@fgv/namespaces/Collections/type-aliases/KeyValueEntry.md)\<`TCOMPOSITEID`, `TITEM`\>\>

Iterates over all entries in all collections.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](../@fgv/namespaces/Collections/type-aliases/KeyValueEntry.md)\<`TCOMPOSITEID`, `TITEM`\>\>

#### Inherited from

[`AggregatedResultMapBase`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md).[`entries`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md#entries)

***

### forEach()

> **forEach**(`cb`, `thisArg?`): `void`

Calls a callback for each entry.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cb` | [`ResultMapForEachCb`](../@fgv/namespaces/Collections/type-aliases/ResultMapForEachCb.md)\<`TCOMPOSITEID`, `TITEM`\> | The callback to call. |
| `thisArg?` | `unknown` | Optional `this` argument for the callback. |

#### Returns

`void`

#### Inherited from

[`AggregatedResultMapBase`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md).[`forEach`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md#foreach)

***

### get()

> **get**(`key`): [`DetailedResult`](../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../@fgv/namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

Gets an item by its composite ID.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `TCOMPOSITEID` | The composite ID of the item. |

#### Returns

[`DetailedResult`](../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../@fgv/namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

`Success` with the item if found, `Failure` otherwise.

#### Inherited from

[`AggregatedResultMapBase`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md).[`get`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md#get)

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

[`AggregatedResultMapBase`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md).[`getCollectionMetadata`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md#getcollectionmetadata)

***

### getOrAdd()

#### Call Signature

> **getOrAdd**(`key`, `value`): [`DetailedResult`](../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../@fgv/namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

Gets an existing item or adds a new one.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `TCOMPOSITEID` | The composite ID of the item. |
| `value` | `TITEM` | The value to add if not found. |

##### Returns

[`DetailedResult`](../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../@fgv/namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

`Success` with the existing or new value.

##### Inherited from

[`AggregatedResultMapBase`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md).[`getOrAdd`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md#getoradd)

#### Call Signature

> **getOrAdd**(`key`, `factory`): [`DetailedResult`](../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../@fgv/namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

Gets an existing item or adds a new one using a factory.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `TCOMPOSITEID` | The composite ID of the item. |
| `factory` | [`ResultMapValueFactory`](../@fgv/namespaces/Collections/type-aliases/ResultMapValueFactory.md)\<`TCOMPOSITEID`, `TITEM`\> | A factory function to create the value if not found. Receives the composite ID. |

##### Returns

[`DetailedResult`](../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../@fgv/namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

`Success` with the existing or new value.

##### Inherited from

[`AggregatedResultMapBase`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md).[`getOrAdd`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md#getoradd)

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

[`AggregatedResultMapBase`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md).[`has`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md#has)

***

### keys()

> **keys**(): `IterableIterator`\<`TCOMPOSITEID`\>

Iterates over all composite keys.

#### Returns

`IterableIterator`\<`TCOMPOSITEID`\>

#### Inherited from

[`AggregatedResultMapBase`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md).[`keys`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md#keys)

***

### set()

> **set**(`key`, `value`): [`DetailedResult`](../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../@fgv/namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

Sets an item by its composite ID. Creates the collection if it doesn't exist and is mutable.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `TCOMPOSITEID` | The composite ID of the item. |
| `value` | `TITEM` | The value to set. |

#### Returns

[`DetailedResult`](../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../@fgv/namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

`Success` with the value if set, `Failure` otherwise.

#### Inherited from

[`AggregatedResultMapBase`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md).[`set`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md#set)

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

[`AggregatedResultMapBase`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md).[`setCollectionMetadata`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md#setcollectionmetadata)

***

### setInCollection()

> **setInCollection**(`collectionId`, `itemId`, `value`): [`DetailedResult`](../type-aliases/DetailedResult.md)\<`TCOMPOSITEID`, [`ResultMapResultDetail`](../@fgv/namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

Sets an item using separate collection and item IDs.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `collectionId` | `TCOLLECTIONID` | The collection ID. |
| `itemId` | `TITEMID` | The item ID. |
| `value` | `TITEM` | The value to set. |

#### Returns

[`DetailedResult`](../type-aliases/DetailedResult.md)\<`TCOMPOSITEID`, [`ResultMapResultDetail`](../@fgv/namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

`Success` with the composite ID if set, `Failure` otherwise.

#### Inherited from

[`AggregatedResultMapBase`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md).[`setInCollection`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md#setincollection)

***

### toReadOnly()

> **toReadOnly**(): [`IReadOnlyResultMap`](../@fgv/namespaces/Collections/interfaces/IReadOnlyResultMap.md)\<`TCOMPOSITEID`, `TITEM`\>

Returns a read-only view of this map.

#### Returns

[`IReadOnlyResultMap`](../@fgv/namespaces/Collections/interfaces/IReadOnlyResultMap.md)\<`TCOMPOSITEID`, `TITEM`\>

#### Inherited from

[`AggregatedResultMapBase`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md).[`toReadOnly`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md#toreadonly)

***

### update()

> **update**(`key`, `value`): [`DetailedResult`](../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../@fgv/namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

Updates an existing item by its composite ID. Fails if the item doesn't exist.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `TCOMPOSITEID` | The composite ID of the item. |
| `value` | `TITEM` | The new value. |

#### Returns

[`DetailedResult`](../type-aliases/DetailedResult.md)\<`TITEM`, [`ResultMapResultDetail`](../@fgv/namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

`Success` with the value if updated, `Failure` otherwise.

#### Inherited from

[`AggregatedResultMapBase`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md).[`update`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md#update)

***

### updateInCollection()

> **updateInCollection**(`collectionId`, `itemId`, `value`): [`DetailedResult`](../type-aliases/DetailedResult.md)\<`TCOMPOSITEID`, [`ResultMapResultDetail`](../@fgv/namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

Updates an item using separate collection and item IDs.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `collectionId` | `TCOLLECTIONID` | The collection ID. |
| `itemId` | `TITEMID` | The item ID. |
| `value` | `TITEM` | The new value. |

#### Returns

[`DetailedResult`](../type-aliases/DetailedResult.md)\<`TCOMPOSITEID`, [`ResultMapResultDetail`](../@fgv/namespaces/Collections/type-aliases/ResultMapResultDetail.md)\>

`Success` with the composite ID if updated, `Failure` otherwise.

#### Inherited from

[`AggregatedResultMapBase`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md).[`updateInCollection`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md#updateincollection)

***

### values()

> **values**(): `IterableIterator`\<`TITEM`\>

Iterates over all values.

#### Returns

`IterableIterator`\<`TITEM`\>

#### Inherited from

[`AggregatedResultMapBase`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md).[`values`](../@fgv/namespaces/Collections/classes/AggregatedResultMapBase.md#values)

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
| `params` | [`IAggregatedResultMapConstructorParams`](../@fgv/namespaces/Collections/interfaces/IAggregatedResultMapConstructorParams.md)\<`TCOMPOSITEID`, `TCOLLECTIONID`, `TITEMID`, `TITEM`, `TMETADATA`\> | Parameters for constructing the map. |

#### Returns

[`Result`](../type-aliases/Result.md)\<`AggregatedResultMap`\<`TCOMPOSITEID`, `TCOLLECTIONID`, `TITEMID`, `TITEM`, `TMETADATA`\>\>

`Success` with the new map if successful, `Failure` otherwise.
