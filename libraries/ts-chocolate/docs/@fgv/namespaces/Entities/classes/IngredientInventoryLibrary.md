[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Entities](../README.md) / IngredientInventoryLibrary

# Class: IngredientInventoryLibrary

Defined in: [ts-chocolate/src/packlets/entities/inventory/ingredientInventoryLibrary.ts:116](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/inventory/ingredientInventoryLibrary.ts#L116)

A library for managing user [ingredient inventory entries](../interfaces/IIngredientInventoryEntryEntity.md).

Inventory entries track which ingredients the user has on hand, including quantity,
unit, and storage location. Each entry has its own base ID within the inventory collection,
and contains an `ingredientId` field with the composite IngredientId of the ingredient being inventoried.

Provides:
- Multi-collection storage with FileTree persistence
- Direct lookup by ingredient ID (searches entries by their ingredientId field)
- CRUD operations for inventory entries

## Extends

- [`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md)\<[`IngredientInventoryEntryId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryId.md), [`IngredientInventoryEntryBaseId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryBaseId.md), [`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md)\>

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

Defined in: [ts-chocolate/src/packlets/library-data/subLibrary.ts:1000](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-data/subLibrary.ts#L1000)

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

> `protected` **\_deleteCollection**(`collectionId`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`AggregatedResultMapEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CollectionId`](../../../../type-aliases/CollectionId.md), [`IngredientInventoryEntryBaseId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryBaseId.md), [`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md), [`ICollectionSourceMetadata`](../../LibraryData/interfaces/ICollectionSourceMetadata.md)\>, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:227

Deletes a collection from the internal collections map.
This is a protected method for use by derived classes that need to implement
collection deletion functionality.

#### Parameters

##### collectionId

[`CollectionId`](../../../../type-aliases/CollectionId.md)

The collection ID to delete.

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`AggregatedResultMapEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CollectionId`](../../../../type-aliases/CollectionId.md), [`IngredientInventoryEntryBaseId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryBaseId.md), [`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md), [`ICollectionSourceMetadata`](../../LibraryData/interfaces/ICollectionSourceMetadata.md)\>, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the deleted entry if found, `Failure` otherwise.

#### Remarks

- Does NOT check if the collection is mutable - callers should validate this first.
- Use `collections.get(id)` to check if a collection exists and its mutability before calling.

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`_deleteCollection`](../../LibraryData/classes/SubLibraryBase.md#_deletecollection)

***

### \[iterator\]()

> **\[iterator\]**(): `IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IngredientInventoryEntryId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryId.md), [`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md)\>\>

Defined in: ts-utils/dist/ts-utils.d.ts:91

Gets an iterator over the map entries.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IngredientInventoryEntryId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryId.md), [`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md)\>\>

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`[iterator]`](../../LibraryData/classes/SubLibraryBase.md#iterator)

***

### add()

> **add**(`key`, `value`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:105

Adds an item by its composite ID. Fails if the item already exists.

#### Parameters

##### key

[`IngredientInventoryEntryId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryId.md)

The composite ID of the item.

##### value

[`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md)

The value to add.

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the value if added, `Failure` otherwise.

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`add`](../../LibraryData/classes/SubLibraryBase.md#add)

***

### addCollectionEntry()

> **addCollectionEntry**(`entry`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`AggregatedResultMapEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CollectionId`](../../../../type-aliases/CollectionId.md), [`IngredientInventoryEntryBaseId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryBaseId.md), [`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md), [`ICollectionSourceMetadata`](../../LibraryData/interfaces/ICollectionSourceMetadata.md)\>, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:207

Adds a new collection from a pre-built entry object.

#### Parameters

##### entry

[`AggregatedResultMapEntryInit`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CollectionId`](../../../../type-aliases/CollectionId.md), [`IngredientInventoryEntryBaseId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryBaseId.md), [`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md), [`ICollectionSourceMetadata`](../../LibraryData/interfaces/ICollectionSourceMetadata.md)\>

The collection entry to add (JSON with items/entries, or pre-instantiated).

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`AggregatedResultMapEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CollectionId`](../../../../type-aliases/CollectionId.md), [`IngredientInventoryEntryBaseId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryBaseId.md), [`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md), [`ICollectionSourceMetadata`](../../LibraryData/interfaces/ICollectionSourceMetadata.md)\>, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

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

### addEntry()

> **addEntry**(`collectionId`, `entryId`, `entry`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IngredientInventoryEntryId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryId.md)\>

Defined in: [ts-chocolate/src/packlets/entities/inventory/ingredientInventoryLibrary.ts:233](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/inventory/ingredientInventoryLibrary.ts#L233)

Adds a new inventory entry.

#### Parameters

##### collectionId

[`CollectionId`](../../../../type-aliases/CollectionId.md)

The inventory collection to add to

##### entryId

[`IngredientInventoryEntryBaseId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryBaseId.md)

The base ID for this inventory entry

##### entry

[`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md)

The inventory entry data

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IngredientInventoryEntryId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryId.md)\>

Success with the composite entry ID, or Failure if add fails

***

### addToCollection()

> **addToCollection**(`collectionId`, `itemId`, `value`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IngredientInventoryEntryId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryId.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:156

Adds an item using separate collection and item IDs.

#### Parameters

##### collectionId

[`CollectionId`](../../../../type-aliases/CollectionId.md)

The collection ID.

##### itemId

[`IngredientInventoryEntryBaseId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryBaseId.md)

The item ID.

##### value

[`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md)

The value to add.

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IngredientInventoryEntryId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryId.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

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

> **composeId**(`collectionId`, `itemId`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IngredientInventoryEntryId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryId.md)\>

Defined in: ts-utils/dist/ts-utils.d.ts:148

Composes a collection ID and item ID into a composite ID.

#### Parameters

##### collectionId

[`CollectionId`](../../../../type-aliases/CollectionId.md)

The collection ID.

##### itemId

[`IngredientInventoryEntryBaseId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryBaseId.md)

The item ID.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IngredientInventoryEntryId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryId.md)\>

`Success` with the composite ID if valid, `Failure` otherwise.

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`composeId`](../../LibraryData/classes/SubLibraryBase.md#composeid)

***

### createCollection()

> **createCollection**(`collectionId`, `metadata?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CollectionId`](../../../../type-aliases/CollectionId.md)\>

Defined in: [ts-chocolate/src/packlets/entities/inventory/ingredientInventoryLibrary.ts:315](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/inventory/ingredientInventoryLibrary.ts#L315)

Creates a new mutable collection for ingredient inventory.

#### Parameters

##### collectionId

[`CollectionId`](../../../../type-aliases/CollectionId.md)

The ID for the new collection

##### metadata?

[`ICollectionSourceMetadata`](../../LibraryData/interfaces/ICollectionSourceMetadata.md)

Optional metadata for the collection

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CollectionId`](../../../../type-aliases/CollectionId.md)\>

Success with the collection ID, or Failure if creation fails

***

### delete()

> **delete**(`key`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:118

Deletes an item by its composite ID.

#### Parameters

##### key

[`IngredientInventoryEntryId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryId.md)

The composite ID of the item.

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the deleted value, `Failure` otherwise.

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`delete`](../../LibraryData/classes/SubLibraryBase.md#delete)

***

### deleteFromCollection()

> **deleteFromCollection**(`collectionId`, `itemId`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IngredientInventoryEntryId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryId.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:179

Deletes an item using separate collection and item IDs.

#### Parameters

##### collectionId

[`CollectionId`](../../../../type-aliases/CollectionId.md)

The collection ID.

##### itemId

[`IngredientInventoryEntryBaseId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryBaseId.md)

The item ID.

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IngredientInventoryEntryId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryId.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the composite ID if deleted, `Failure` otherwise.

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`deleteFromCollection`](../../LibraryData/classes/SubLibraryBase.md#deletefromcollection)

***

### entries()

> **entries**(): `IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IngredientInventoryEntryId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryId.md), [`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md)\>\>

Defined in: ts-utils/dist/ts-utils.d.ts:73

Iterates over all entries in all collections.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IngredientInventoryEntryId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryId.md), [`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md)\>\>

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`entries`](../../LibraryData/classes/SubLibraryBase.md#entries)

***

### forEach()

> **forEach**(`cb`, `thisArg?`): `void`

Defined in: ts-utils/dist/ts-utils.d.ts:87

Calls a callback for each entry.

#### Parameters

##### cb

[`ResultMapForEachCb`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IngredientInventoryEntryId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryId.md), [`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md)\>

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

> **get**(`key`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:63

Gets an item by its composite ID.

#### Parameters

##### key

[`IngredientInventoryEntryId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryId.md)

The composite ID of the item.

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the item if found, `Failure` otherwise.

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`get`](../../LibraryData/classes/SubLibraryBase.md#get)

***

### getAllEntries()

> **getAllEntries**(): readonly [`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md)[]

Defined in: [ts-chocolate/src/packlets/entities/inventory/ingredientInventoryLibrary.ts:217](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/inventory/ingredientInventoryLibrary.ts#L217)

Gets all inventory entries.

#### Returns

readonly [`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md)[]

Array of all ingredient inventory entries

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

Defined in: [ts-chocolate/src/packlets/library-data/subLibrary.ts:1202](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-data/subLibrary.ts#L1202)

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

### getForIngredient()

> **getForIngredient**(`ingredientId`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md)\>

Defined in: [ts-chocolate/src/packlets/entities/inventory/ingredientInventoryLibrary.ts:192](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/inventory/ingredientInventoryLibrary.ts#L192)

Gets the inventory entry for a specific ingredient by searching all entries.

#### Parameters

##### ingredientId

[`IngredientId`](../../../../type-aliases/IngredientId.md)

The composite IngredientId of the ingredient to look up

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md)\>

Success with the inventory entry, or Failure if not found

***

### getOrAdd()

#### Call Signature

> **getOrAdd**(`key`, `value`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:125

Gets an existing item or adds a new one.

##### Parameters

###### key

[`IngredientInventoryEntryId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryId.md)

The composite ID of the item.

###### value

[`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md)

The value to add if not found.

##### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the existing or new value.

##### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`getOrAdd`](../../LibraryData/classes/SubLibraryBase.md#getoradd)

#### Call Signature

> **getOrAdd**(`key`, `factory`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:132

Gets an existing item or adds a new one using a factory.

##### Parameters

###### key

[`IngredientInventoryEntryId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryId.md)

The composite ID of the item.

###### factory

[`ResultMapValueFactory`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IngredientInventoryEntryId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryId.md), [`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md)\>

A factory function to create the value if not found. Receives the composite ID.

##### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

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

[`IngredientInventoryEntryId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryId.md)

The composite ID of the item.

#### Returns

`boolean`

`true` if the item exists, `false` otherwise.

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`has`](../../LibraryData/classes/SubLibraryBase.md#has)

***

### hasForIngredient()

> **hasForIngredient**(`ingredientId`): `boolean`

Defined in: [ts-chocolate/src/packlets/entities/inventory/ingredientInventoryLibrary.ts:208](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/inventory/ingredientInventoryLibrary.ts#L208)

Checks if inventory exists for a specific ingredient.

#### Parameters

##### ingredientId

[`IngredientId`](../../../../type-aliases/IngredientId.md)

The composite IngredientId to check

#### Returns

`boolean`

True if inventory exists

***

### keys()

> **keys**(): `IterableIterator`\<[`IngredientInventoryEntryId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryId.md)\>

Defined in: ts-utils/dist/ts-utils.d.ts:77

Iterates over all composite keys.

#### Returns

`IterableIterator`\<[`IngredientInventoryEntryId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryId.md)\>

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`keys`](../../LibraryData/classes/SubLibraryBase.md#keys)

***

### loadFromFileTreeSource()

> **loadFromFileTreeSource**(`source`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`number`\>

Defined in: [ts-chocolate/src/packlets/library-data/subLibrary.ts:950](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-data/subLibrary.ts#L950)

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

Defined in: [ts-chocolate/src/packlets/library-data/subLibrary.ts:1019](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-data/subLibrary.ts#L1019)

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

### removeEntry()

> **removeEntry**(`entryId`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md)\>

Defined in: [ts-chocolate/src/packlets/entities/inventory/ingredientInventoryLibrary.ts:271](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/inventory/ingredientInventoryLibrary.ts#L271)

Removes an inventory entry by its composite entry ID.

#### Parameters

##### entryId

[`IngredientInventoryEntryId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryId.md)

The composite inventory entry ID to remove

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md)\>

Success with the removed entry, or Failure if not found or remove fails

***

### removeForIngredient()

> **removeForIngredient**(`ingredientId`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md)\>

Defined in: [ts-chocolate/src/packlets/entities/inventory/ingredientInventoryLibrary.ts:298](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/inventory/ingredientInventoryLibrary.ts#L298)

Removes an inventory entry for a specific ingredient.
Searches all collections for the entry with matching ingredientId.

#### Parameters

##### ingredientId

[`IngredientId`](../../../../type-aliases/IngredientId.md)

The composite IngredientId of the ingredient whose inventory to remove

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md)\>

Success with the removed entry, or Failure if not found or remove fails

***

### set()

> **set**(`key`, `value`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:98

Sets an item by its composite ID. Creates the collection if it doesn't exist and is mutable.

#### Parameters

##### key

[`IngredientInventoryEntryId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryId.md)

The composite ID of the item.

##### value

[`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md)

The value to set.

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

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

> **setInCollection**(`collectionId`, `itemId`, `value`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IngredientInventoryEntryId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryId.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:164

Sets an item using separate collection and item IDs.

#### Parameters

##### collectionId

[`CollectionId`](../../../../type-aliases/CollectionId.md)

The collection ID.

##### itemId

[`IngredientInventoryEntryBaseId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryBaseId.md)

The item ID.

##### value

[`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md)

The value to set.

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IngredientInventoryEntryId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryId.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the composite ID if set, `Failure` otherwise.

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`setInCollection`](../../LibraryData/classes/SubLibraryBase.md#setincollection)

***

### toReadOnly()

> **toReadOnly**(): [`IReadOnlyResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IngredientInventoryEntryId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryId.md), [`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md)\>

Defined in: ts-utils/dist/ts-utils.d.ts:141

Returns a read-only view of this map.

#### Returns

[`IReadOnlyResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IngredientInventoryEntryId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryId.md), [`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md)\>

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`toReadOnly`](../../LibraryData/classes/SubLibraryBase.md#toreadonly)

***

### update()

> **update**(`key`, `value`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:112

Updates an existing item by its composite ID. Fails if the item doesn't exist.

#### Parameters

##### key

[`IngredientInventoryEntryId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryId.md)

The composite ID of the item.

##### value

[`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md)

The new value.

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the value if updated, `Failure` otherwise.

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`update`](../../LibraryData/classes/SubLibraryBase.md#update)

***

### updateInCollection()

> **updateInCollection**(`collectionId`, `itemId`, `value`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IngredientInventoryEntryId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryId.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:172

Updates an item using separate collection and item IDs.

#### Parameters

##### collectionId

[`CollectionId`](../../../../type-aliases/CollectionId.md)

The collection ID.

##### itemId

[`IngredientInventoryEntryBaseId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryBaseId.md)

The item ID.

##### value

[`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md)

The new value.

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IngredientInventoryEntryId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryId.md), [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the composite ID if updated, `Failure` otherwise.

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`updateInCollection`](../../LibraryData/classes/SubLibraryBase.md#updateincollection)

***

### upsertEntry()

> **upsertEntry**(`collectionId`, `entryId`, `entry`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IngredientInventoryEntryId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryId.md)\>

Defined in: [ts-chocolate/src/packlets/entities/inventory/ingredientInventoryLibrary.ts:253](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/inventory/ingredientInventoryLibrary.ts#L253)

Adds or updates an inventory entry.

#### Parameters

##### collectionId

[`CollectionId`](../../../../type-aliases/CollectionId.md)

The inventory collection to upsert into

##### entryId

[`IngredientInventoryEntryBaseId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryBaseId.md)

The base ID for this inventory entry

##### entry

[`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md)

The inventory entry data

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IngredientInventoryEntryId`](../namespaces/Inventory/type-aliases/IngredientInventoryEntryId.md)\>

Success with the composite entry ID, or Failure if upsert fails

***

### values()

> **values**(): `IterableIterator`\<[`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md)\>

Defined in: ts-utils/dist/ts-utils.d.ts:81

Iterates over all values.

#### Returns

`IterableIterator`\<[`IIngredientInventoryEntryEntity`](../interfaces/IIngredientInventoryEntryEntity.md)\>

#### Inherited from

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md).[`values`](../../LibraryData/classes/SubLibraryBase.md#values)

***

### create()

> `static` **create**(`params?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`IngredientInventoryLibrary`\>

Defined in: [ts-chocolate/src/packlets/entities/inventory/ingredientInventoryLibrary.ts:137](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/inventory/ingredientInventoryLibrary.ts#L137)

Creates a new IngredientInventoryLibrary instance.

#### Parameters

##### params?

[`IIngredientInventoryLibraryParams`](../namespaces/Inventory/type-aliases/IIngredientInventoryLibraryParams.md)

Optional [creation parameters](../namespaces/Inventory/type-aliases/IIngredientInventoryLibraryParams.md)

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`IngredientInventoryLibrary`\>

`Success` with new instance, or `Failure` with error message

***

### createAsync()

> `static` **createAsync**(`params?`): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`IngredientInventoryLibrary`\>\>

Defined in: [ts-chocolate/src/packlets/entities/inventory/ingredientInventoryLibrary.ts:147](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/inventory/ingredientInventoryLibrary.ts#L147)

Creates an IngredientInventoryLibrary instance asynchronously with encrypted file support.

#### Parameters

##### params?

[`IIngredientInventoryLibraryAsyncParams`](../namespaces/Inventory/type-aliases/IIngredientInventoryLibraryAsyncParams.md)

[Async creation parameters](../namespaces/Inventory/type-aliases/IIngredientInventoryLibraryAsyncParams.md)

#### Returns

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`IngredientInventoryLibrary`\>\>

Promise resolving to Success with new instance, or Failure

***

### loadAllCollectionsAsync()

> `protected` `static` **loadAllCollectionsAsync**\<`TLibrary`, `TBaseId`, `TItem`\>(`params`): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ISubLibraryAsyncLoadResult`](../../LibraryData/interfaces/ISubLibraryAsyncLoadResult.md)\<`TBaseId`, `TItem`\>\>\>

Defined in: [ts-chocolate/src/packlets/library-data/subLibrary.ts:828](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-data/subLibrary.ts#L828)

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
