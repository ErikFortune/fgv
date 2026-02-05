[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Entities](../README.md) / MoldsLibrary

# Class: MoldsLibrary

Defined in: [ts-chocolate/src/packlets/entities/molds/library.ts:79](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/molds/library.ts#L79)

Multi-source mold library with type-safe access

Wraps AggregatedResultMap to provide:
- Composite ID access (e.g., "cw.chocolate-world-cw-2227")
- Multi-source management (built-in, user, app-local, etc.)
- Mutable vs immutable collection distinction
- Weakly-typed validating access for external data

## Extends

- [`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md)\<[`MoldId`](../../../../type-aliases/MoldId.md), [`BaseMoldId`](../../../../type-aliases/BaseMoldId.md), [`IMoldEntity`](../interfaces/IMoldEntity.md)\>

## Accessors

### collectionCount

#### Get Signature

> **get** **collectionCount**(): `number`

Defined in: ts-utils/dist/ts-utils.d.ts:188

The number of collections.

##### Returns

`number`

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`collectionCount`](../../LibraryData/classes/SubLibraryBase.md#collectioncount)

***

### collections

#### Get Signature

> **get** **collections**(): [`IReadOnlyValidatingResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`TCOLLECTIONID`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs), [`AggregatedResultMapEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`TCOLLECTIONID`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs), [`TITEMID`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs), [`TITEM`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs), [`TMETADATA`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>\>

Defined in: ts-utils/dist/ts-utils.d.ts:184

Provides read-only access to the underlying collections map.
Use `collections.has(id)` and `collections.get(id)` to check existence and retrieve collections.

##### Returns

[`IReadOnlyValidatingResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`TCOLLECTIONID`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs), [`AggregatedResultMapEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`TCOLLECTIONID`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs), [`TITEMID`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs), [`TITEM`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs), [`TMETADATA`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>\>

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`collections`](../../LibraryData/classes/SubLibraryBase.md#collections)

***

### protectedCollections

#### Get Signature

> **get** **protectedCollections**(): readonly [`IProtectedCollectionInfo`](../../LibraryData/interfaces/IProtectedCollectionInfo.md)\<[`CollectionId`](../../../../type-aliases/CollectionId.md)\>[]

Defined in: [ts-chocolate/src/packlets/library-data/subLibrary.ts:1000](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-data/subLibrary.ts#L1000)

Gets the list of protected collections that were captured but not decrypted.

These are encrypted collections that were encountered during loading but couldn't
be decrypted (e.g., due to missing encryption keys). They can be decrypted later
using [loadProtectedCollectionAsync](../../LibraryData/classes/SubLibraryBase.md#loadprotectedcollectionasync).

##### Returns

readonly [`IProtectedCollectionInfo`](../../LibraryData/interfaces/IProtectedCollectionInfo.md)\<[`CollectionId`](../../../../type-aliases/CollectionId.md)\>[]

Read-only array of protected collection references with metadata.

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`protectedCollections`](../../LibraryData/classes/SubLibraryBase.md#protectedcollections)

***

### size

#### Get Signature

> **get** **size**(): `number`

Defined in: ts-utils/dist/ts-utils.d.ts:57

The total number of items across all collections.

##### Returns

`number`

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`size`](../../LibraryData/classes/SubLibraryBase.md#size)

***

### validating

#### Get Signature

> **get** **validating**(): [`IReadOnlyResultMapValidator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`TCOMPOSITEID`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs), [`TITEM`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:53

A validator for weakly-typed access to the map.

##### Returns

[`IReadOnlyResultMapValidator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`TCOMPOSITEID`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs), [`TITEM`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`validating`](../../LibraryData/classes/SubLibraryBase.md#validating)

## Methods

### \_deleteCollection()

> `protected` **\_deleteCollection**(`collectionId`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`AggregatedResultMapEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CollectionId`](../../../../type-aliases/CollectionId.md), [`BaseMoldId`](../../../../type-aliases/BaseMoldId.md), [`IMoldEntity`](../interfaces/IMoldEntity.md), [`ICollectionSourceMetadata`](../../LibraryData/interfaces/ICollectionSourceMetadata.md)\>, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:227

Deletes a collection from the internal collections map.
This is a protected method for use by derived classes that need to implement
collection deletion functionality.

#### Parameters

##### collectionId

[`CollectionId`](../../../../type-aliases/CollectionId.md)

The collection ID to delete.

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`AggregatedResultMapEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CollectionId`](../../../../type-aliases/CollectionId.md), [`BaseMoldId`](../../../../type-aliases/BaseMoldId.md), [`IMoldEntity`](../interfaces/IMoldEntity.md), [`ICollectionSourceMetadata`](../../LibraryData/interfaces/ICollectionSourceMetadata.md)\>, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the deleted entry if found, `Failure` otherwise.

#### Remarks

- Does NOT check if the collection is mutable - callers should validate this first.
- Use `collections.get(id)` to check if a collection exists and its mutability before calling.

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`_deleteCollection`](../../LibraryData/classes/SubLibraryBase.md#_deletecollection)

***

### \[iterator\]()

> **\[iterator\]**(): `IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`MoldId`](../../../../type-aliases/MoldId.md), [`IMoldEntity`](../interfaces/IMoldEntity.md)\>\>

Defined in: ts-utils/dist/ts-utils.d.ts:91

Gets an iterator over the map entries.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`MoldId`](../../../../type-aliases/MoldId.md), [`IMoldEntity`](../interfaces/IMoldEntity.md)\>\>

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`[iterator]`](../../LibraryData/classes/SubLibraryBase.md#iterator)

***

### add()

> **add**(`key`, `value`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IMoldEntity`](../interfaces/IMoldEntity.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:105

Adds an item by its composite ID. Fails if the item already exists.

#### Parameters

##### key

[`MoldId`](../../../../type-aliases/MoldId.md)

The composite ID of the item.

##### value

[`IMoldEntity`](../interfaces/IMoldEntity.md)

The value to add.

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IMoldEntity`](../interfaces/IMoldEntity.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the value if added, `Failure` otherwise.

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`add`](../../LibraryData/classes/SubLibraryBase.md#add)

***

### addCollectionEntry()

> **addCollectionEntry**(`entry`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`AggregatedResultMapEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CollectionId`](../../../../type-aliases/CollectionId.md), [`BaseMoldId`](../../../../type-aliases/BaseMoldId.md), [`IMoldEntity`](../interfaces/IMoldEntity.md), [`ICollectionSourceMetadata`](../../LibraryData/interfaces/ICollectionSourceMetadata.md)\>, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:207

Adds a new collection from a pre-built entry object.

#### Parameters

##### entry

[`AggregatedResultMapEntryInit`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CollectionId`](../../../../type-aliases/CollectionId.md), [`BaseMoldId`](../../../../type-aliases/BaseMoldId.md), [`IMoldEntity`](../interfaces/IMoldEntity.md), [`ICollectionSourceMetadata`](../../LibraryData/interfaces/ICollectionSourceMetadata.md)\>

The collection entry to add (JSON with items/entries, or pre-instantiated).

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`AggregatedResultMapEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CollectionId`](../../../../type-aliases/CollectionId.md), [`BaseMoldId`](../../../../type-aliases/BaseMoldId.md), [`IMoldEntity`](../interfaces/IMoldEntity.md), [`ICollectionSourceMetadata`](../../LibraryData/interfaces/ICollectionSourceMetadata.md)\>, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the entry if added, `Failure` otherwise.

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`addCollectionEntry`](../../LibraryData/classes/SubLibraryBase.md#addcollectionentry)

***

### addCollectionWithItems()

> **addCollectionWithItems**(`collectionId`, `items?`, `options?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CollectionId`](../../../../type-aliases/CollectionId.md)\>

Defined in: ts-utils/dist/ts-utils.d.ts:215

Adds a new collection with the specified ID and optional initial entries.

#### Parameters

##### collectionId

`string`

The collection ID as a string (will be validated).

##### items?

`Iterable`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`, `unknown`\>, `any`, `any`\>

Optional initial entries for the collection.

##### options?

[`IAddCollectionWithItemsOptions`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)

Optional settings (isImmutable defaults to false).

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CollectionId`](../../../../type-aliases/CollectionId.md)\>

`Success` with the validated collection ID if added, `Failure` otherwise.

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`addCollectionWithItems`](../../LibraryData/classes/SubLibraryBase.md#addcollectionwithitems)

***

### addToCollection()

> **addToCollection**(`collectionId`, `itemId`, `value`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`MoldId`](../../../../type-aliases/MoldId.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:156

Adds an item using separate collection and item IDs.

#### Parameters

##### collectionId

[`CollectionId`](../../../../type-aliases/CollectionId.md)

The collection ID.

##### itemId

[`BaseMoldId`](../../../../type-aliases/BaseMoldId.md)

The item ID.

##### value

[`IMoldEntity`](../interfaces/IMoldEntity.md)

The value to add.

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`MoldId`](../../../../type-aliases/MoldId.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the composite ID if added, `Failure` otherwise.

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`addToCollection`](../../LibraryData/classes/SubLibraryBase.md#addtocollection)

***

### clear()

> **clear**(): `void`

Defined in: ts-utils/dist/ts-utils.d.ts:137

Clears all items from all mutable collections.
Immutable collections are not affected.

#### Returns

`void`

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`clear`](../../LibraryData/classes/SubLibraryBase.md#clear)

***

### composeId()

> **composeId**(`collectionId`, `itemId`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`MoldId`](../../../../type-aliases/MoldId.md)\>

Defined in: ts-utils/dist/ts-utils.d.ts:148

Composes a collection ID and item ID into a composite ID.

#### Parameters

##### collectionId

[`CollectionId`](../../../../type-aliases/CollectionId.md)

The collection ID.

##### itemId

[`BaseMoldId`](../../../../type-aliases/BaseMoldId.md)

The item ID.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`MoldId`](../../../../type-aliases/MoldId.md)\>

`Success` with the composite ID if valid, `Failure` otherwise.

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`composeId`](../../LibraryData/classes/SubLibraryBase.md#composeid)

***

### delete()

> **delete**(`key`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IMoldEntity`](../interfaces/IMoldEntity.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:118

Deletes an item by its composite ID.

#### Parameters

##### key

[`MoldId`](../../../../type-aliases/MoldId.md)

The composite ID of the item.

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IMoldEntity`](../interfaces/IMoldEntity.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the deleted value, `Failure` otherwise.

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`delete`](../../LibraryData/classes/SubLibraryBase.md#delete)

***

### deleteFromCollection()

> **deleteFromCollection**(`collectionId`, `itemId`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`MoldId`](../../../../type-aliases/MoldId.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:179

Deletes an item using separate collection and item IDs.

#### Parameters

##### collectionId

[`CollectionId`](../../../../type-aliases/CollectionId.md)

The collection ID.

##### itemId

[`BaseMoldId`](../../../../type-aliases/BaseMoldId.md)

The item ID.

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`MoldId`](../../../../type-aliases/MoldId.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the composite ID if deleted, `Failure` otherwise.

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`deleteFromCollection`](../../LibraryData/classes/SubLibraryBase.md#deletefromcollection)

***

### entries()

> **entries**(): `IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`MoldId`](../../../../type-aliases/MoldId.md), [`IMoldEntity`](../interfaces/IMoldEntity.md)\>\>

Defined in: ts-utils/dist/ts-utils.d.ts:73

Iterates over all entries in all collections.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`MoldId`](../../../../type-aliases/MoldId.md), [`IMoldEntity`](../interfaces/IMoldEntity.md)\>\>

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`entries`](../../LibraryData/classes/SubLibraryBase.md#entries)

***

### forEach()

> **forEach**(`cb`, `thisArg?`): `void`

Defined in: ts-utils/dist/ts-utils.d.ts:87

Calls a callback for each entry.

#### Parameters

##### cb

[`ResultMapForEachCb`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`MoldId`](../../../../type-aliases/MoldId.md), [`IMoldEntity`](../interfaces/IMoldEntity.md)\>

The callback to call.

##### thisArg?

`unknown`

Optional `this` argument for the callback.

#### Returns

`void`

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`forEach`](../../LibraryData/classes/SubLibraryBase.md#foreach)

***

### get()

> **get**(`key`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IMoldEntity`](../interfaces/IMoldEntity.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:63

Gets an item by its composite ID.

#### Parameters

##### key

[`MoldId`](../../../../type-aliases/MoldId.md)

The composite ID of the item.

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IMoldEntity`](../interfaces/IMoldEntity.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the item if found, `Failure` otherwise.

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`get`](../../LibraryData/classes/SubLibraryBase.md#get)

***

### getCollectionMetadata()

> **getCollectionMetadata**(`collectionId`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ICollectionSourceMetadata`](../../LibraryData/interfaces/ICollectionSourceMetadata.md) \| `undefined`\>

Defined in: ts-utils/dist/ts-utils.d.ts:194

Gets the metadata for a specific collection.

#### Parameters

##### collectionId

[`CollectionId`](../../../../type-aliases/CollectionId.md)

The collection ID.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ICollectionSourceMetadata`](../../LibraryData/interfaces/ICollectionSourceMetadata.md) \| `undefined`\>

`Success` with the metadata if found, `Failure` otherwise.

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`getCollectionMetadata`](../../LibraryData/classes/SubLibraryBase.md#getcollectionmetadata)

***

### getCollectionSourceItem()

> **getCollectionSourceItem**(`collectionId`): [`FileTreeItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-data/subLibrary.ts:1202](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-data/subLibrary.ts#L1202)

Get the FileTree source item for a collection, if available.

Returns the FileTree item that was used to load this collection.
This can be passed to EditableCollection to enable direct save() functionality.
Only available for collections loaded from FileTree sources.

#### Parameters

##### collectionId

[`CollectionId`](../../../../type-aliases/CollectionId.md)

ID of the collection

#### Returns

[`FileTreeItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) \| `undefined`

The FileTree source item, or undefined if not available

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`getCollectionSourceItem`](../../LibraryData/classes/SubLibraryBase.md#getcollectionsourceitem)

***

### getOrAdd()

#### Call Signature

> **getOrAdd**(`key`, `value`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IMoldEntity`](../interfaces/IMoldEntity.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:125

Gets an existing item or adds a new one.

##### Parameters

###### key

[`MoldId`](../../../../type-aliases/MoldId.md)

The composite ID of the item.

###### value

[`IMoldEntity`](../interfaces/IMoldEntity.md)

The value to add if not found.

##### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IMoldEntity`](../interfaces/IMoldEntity.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the existing or new value.

##### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`getOrAdd`](../../LibraryData/classes/SubLibraryBase.md#getoradd)

#### Call Signature

> **getOrAdd**(`key`, `factory`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IMoldEntity`](../interfaces/IMoldEntity.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:132

Gets an existing item or adds a new one using a factory.

##### Parameters

###### key

[`MoldId`](../../../../type-aliases/MoldId.md)

The composite ID of the item.

###### factory

[`ResultMapValueFactory`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`MoldId`](../../../../type-aliases/MoldId.md), [`IMoldEntity`](../interfaces/IMoldEntity.md)\>

A factory function to create the value if not found. Receives the composite ID.

##### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IMoldEntity`](../interfaces/IMoldEntity.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the existing or new value.

##### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`getOrAdd`](../../LibraryData/classes/SubLibraryBase.md#getoradd)

***

### has()

> **has**(`key`): `boolean`

Defined in: ts-utils/dist/ts-utils.d.ts:69

Checks if an item exists by its composite ID.

#### Parameters

##### key

[`MoldId`](../../../../type-aliases/MoldId.md)

The composite ID of the item.

#### Returns

`boolean`

`true` if the item exists, `false` otherwise.

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`has`](../../LibraryData/classes/SubLibraryBase.md#has)

***

### keys()

> **keys**(): `IterableIterator`\<[`MoldId`](../../../../type-aliases/MoldId.md)\>

Defined in: ts-utils/dist/ts-utils.d.ts:77

Iterates over all composite keys.

#### Returns

`IterableIterator`\<[`MoldId`](../../../../type-aliases/MoldId.md)\>

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`keys`](../../LibraryData/classes/SubLibraryBase.md#keys)

***

### loadFromFileTreeSource()

> **loadFromFileTreeSource**(`source`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`number`\>

Defined in: [ts-chocolate/src/packlets/library-data/subLibrary.ts:950](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-data/subLibrary.ts#L950)

Loads collections from a file tree source and adds them to this library.

#### Parameters

##### source

[`SubLibraryFileTreeSource`](../../LibraryData/type-aliases/SubLibraryFileTreeSource.md)

The file tree source to load from

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`number`\>

Success with the number of collections added, or Failure with error message

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`loadFromFileTreeSource`](../../LibraryData/classes/SubLibraryBase.md#loadfromfiletreesource)

***

### loadProtectedCollectionAsync()

> **loadProtectedCollectionAsync**(`encryption`, `filter?`): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`CollectionId`](../../../../type-aliases/CollectionId.md)[]\>\>

Defined in: [ts-chocolate/src/packlets/library-data/subLibrary.ts:1019](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-data/subLibrary.ts#L1019)

Decrypts and loads one or more protected collections.

#### Parameters

##### encryption

[`IEncryptionConfig`](../../LibraryData/interfaces/IEncryptionConfig.md)

The encryption configuration with keys and crypto provider.

##### filter?

readonly (`string` \| `RegExp`)[]

Optional filter to select which protected collections to load.
  - If omitted or `undefined`: Load all protected collections that can be decrypted with provided keys.
  - If an array of patterns: Only load collections whose collectionId or secretName matches any pattern.
    Patterns can be strings (exact match) or RegExp objects.

#### Returns

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`CollectionId`](../../../../type-aliases/CollectionId.md)[]\>\>

Promise resolving to Success with array of loaded collection IDs, or Failure with error.

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`loadProtectedCollectionAsync`](../../LibraryData/classes/SubLibraryBase.md#loadprotectedcollectionasync)

***

### set()

> **set**(`key`, `value`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IMoldEntity`](../interfaces/IMoldEntity.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:98

Sets an item by its composite ID. Creates the collection if it doesn't exist and is mutable.

#### Parameters

##### key

[`MoldId`](../../../../type-aliases/MoldId.md)

The composite ID of the item.

##### value

[`IMoldEntity`](../interfaces/IMoldEntity.md)

The value to set.

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IMoldEntity`](../interfaces/IMoldEntity.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the value if set, `Failure` otherwise.

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`set`](../../LibraryData/classes/SubLibraryBase.md#set)

***

### setCollectionMetadata()

> **setCollectionMetadata**(`collectionId`, `metadata`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ICollectionSourceMetadata`](../../LibraryData/interfaces/ICollectionSourceMetadata.md)\>

Defined in: ts-utils/dist/ts-utils.d.ts:201

Sets the metadata for a mutable collection.

#### Parameters

##### collectionId

[`CollectionId`](../../../../type-aliases/CollectionId.md)

The collection ID.

##### metadata

[`ICollectionSourceMetadata`](../../LibraryData/interfaces/ICollectionSourceMetadata.md)

The metadata to set.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ICollectionSourceMetadata`](../../LibraryData/interfaces/ICollectionSourceMetadata.md)\>

`Success` if set, `Failure` otherwise.

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`setCollectionMetadata`](../../LibraryData/classes/SubLibraryBase.md#setcollectionmetadata)

***

### setInCollection()

> **setInCollection**(`collectionId`, `itemId`, `value`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`MoldId`](../../../../type-aliases/MoldId.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:164

Sets an item using separate collection and item IDs.

#### Parameters

##### collectionId

[`CollectionId`](../../../../type-aliases/CollectionId.md)

The collection ID.

##### itemId

[`BaseMoldId`](../../../../type-aliases/BaseMoldId.md)

The item ID.

##### value

[`IMoldEntity`](../interfaces/IMoldEntity.md)

The value to set.

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`MoldId`](../../../../type-aliases/MoldId.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the composite ID if set, `Failure` otherwise.

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`setInCollection`](../../LibraryData/classes/SubLibraryBase.md#setincollection)

***

### toReadOnly()

> **toReadOnly**(): [`IReadOnlyResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`MoldId`](../../../../type-aliases/MoldId.md), [`IMoldEntity`](../interfaces/IMoldEntity.md)\>

Defined in: ts-utils/dist/ts-utils.d.ts:141

Returns a read-only view of this map.

#### Returns

[`IReadOnlyResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`MoldId`](../../../../type-aliases/MoldId.md), [`IMoldEntity`](../interfaces/IMoldEntity.md)\>

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`toReadOnly`](../../LibraryData/classes/SubLibraryBase.md#toreadonly)

***

### update()

> **update**(`key`, `value`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IMoldEntity`](../interfaces/IMoldEntity.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:112

Updates an existing item by its composite ID. Fails if the item doesn't exist.

#### Parameters

##### key

[`MoldId`](../../../../type-aliases/MoldId.md)

The composite ID of the item.

##### value

[`IMoldEntity`](../interfaces/IMoldEntity.md)

The new value.

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IMoldEntity`](../interfaces/IMoldEntity.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the value if updated, `Failure` otherwise.

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`update`](../../LibraryData/classes/SubLibraryBase.md#update)

***

### updateInCollection()

> **updateInCollection**(`collectionId`, `itemId`, `value`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`MoldId`](../../../../type-aliases/MoldId.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:172

Updates an item using separate collection and item IDs.

#### Parameters

##### collectionId

[`CollectionId`](../../../../type-aliases/CollectionId.md)

The collection ID.

##### itemId

[`BaseMoldId`](../../../../type-aliases/BaseMoldId.md)

The item ID.

##### value

[`IMoldEntity`](../interfaces/IMoldEntity.md)

The new value.

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`MoldId`](../../../../type-aliases/MoldId.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the composite ID if updated, `Failure` otherwise.

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`updateInCollection`](../../LibraryData/classes/SubLibraryBase.md#updateincollection)

***

### values()

> **values**(): `IterableIterator`\<[`IMoldEntity`](../interfaces/IMoldEntity.md)\>

Defined in: ts-utils/dist/ts-utils.d.ts:81

Iterates over all values.

#### Returns

`IterableIterator`\<[`IMoldEntity`](../interfaces/IMoldEntity.md)\>

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`values`](../../LibraryData/classes/SubLibraryBase.md#values)

***

### create()

> `static` **create**(`params?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`MoldsLibrary`\>

Defined in: [ts-chocolate/src/packlets/entities/molds/library.ts:96](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/molds/library.ts#L96)

Creates a new MoldsLibrary instance

#### Parameters

##### params?

[`IMoldsLibraryParams`](../namespaces/Molds/type-aliases/IMoldsLibraryParams.md)

Optional creation parameters with initial collections

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`MoldsLibrary`\>

Success with new instance, or Failure with error message

***

### createAsync()

> `static` **createAsync**(`params?`): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`MoldsLibrary`\>\>

Defined in: [ts-chocolate/src/packlets/entities/molds/library.ts:110](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/molds/library.ts#L110)

Creates a new MoldsLibrary instance asynchronously with encryption support.

Use this factory method when you need to decrypt encrypted collections.
Pass encryption config via `params.encryption`.

#### Parameters

##### params?

[`IMoldsLibraryAsyncParams`](../namespaces/Molds/type-aliases/IMoldsLibraryAsyncParams.md)

Optional creation parameters with initial collections and encryption config

#### Returns

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`MoldsLibrary`\>\>

Promise resolving to Success with new instance, or Failure with error message

***

### loadAllCollectionsAsync()

> `protected` `static` **loadAllCollectionsAsync**\<`TLibrary`, `TBaseId`, `TItem`\>(`params`): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ISubLibraryAsyncLoadResult`](../../LibraryData/interfaces/ISubLibraryAsyncLoadResult.md)\<`TBaseId`, `TItem`\>\>\>

Defined in: [ts-chocolate/src/packlets/library-data/subLibrary.ts:828](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-data/subLibrary.ts#L828)

Loads all collections asynchronously with encryption support.

This is a protected helper for derived class `createAsync()` methods.
It handles built-in collections, file sources, and merge libraries.

Encryption configuration is read from `params.libraryParams.encryption`.

#### Type Parameters

##### TLibrary

`TLibrary` *extends* [`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md)\<`string`, `TBaseId`, `TItem`\>

##### TBaseId

`TBaseId` *extends* `string`

##### TItem

`TItem`

#### Parameters

##### params

[`ISubLibraryCreateParams`](../../LibraryData/interfaces/ISubLibraryCreateParams.md)\<`TLibrary`, `TBaseId`, `TItem`\>

The creation parameters (encryption config comes from libraryParams.encryption).

#### Returns

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ISubLibraryAsyncLoadResult`](../../LibraryData/interfaces/ISubLibraryAsyncLoadResult.md)\<`TBaseId`, `TItem`\>\>\>

Promise resolving to Success with collections and protected collections, or Failure with error.

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`loadAllCollectionsAsync`](../../LibraryData/classes/SubLibraryBase.md#loadallcollectionsasync)
