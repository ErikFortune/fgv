[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / SubLibraryBase

# Abstract Class: SubLibraryBase\<TCompositeId, TBaseId, TItem\>

Defined in: [ts-chocolate/src/packlets/library-data/subLibrary.ts:356](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-data/subLibrary.ts#L356)

Base class for sub-libraries that use SourceId as the collection ID.

This abstract class standardizes:
- Collection ID type: Always `SourceId`
- Separator: Always `.` (dot)
- Collection ID converter: Always `CommonConverters.sourceId`
- Loading logic for built-in, file source, and merge library collections

This reduces the type parameter count from 4 to 3 and eliminates
boilerplate in derived classes.

## Extends

- [`AggregatedResultMapBase`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TCompositeId`, [`CollectionId`](../../../../type-aliases/CollectionId.md), `TBaseId`, `TItem`, [`ICollectionSourceMetadata`](../interfaces/ICollectionSourceMetadata.md)\>

## Extended by

- [`ConfectionsLibrary`](../../Entities/classes/ConfectionsLibrary.md)
- [`FillingsLibrary`](../../Entities/classes/FillingsLibrary.md)
- [`IngredientsLibrary`](../../Entities/classes/IngredientsLibrary.md)
- [`JournalLibrary`](../../Entities/classes/JournalLibrary.md)
- [`SessionLibrary`](../../Entities/classes/SessionLibrary.md)
- [`IngredientInventoryLibrary`](../../Entities/classes/IngredientInventoryLibrary.md)
- [`MoldInventoryLibrary`](../../Entities/classes/MoldInventoryLibrary.md)
- [`MoldsLibrary`](../../Entities/classes/MoldsLibrary.md)
- [`ProceduresLibrary`](../../Entities/classes/ProceduresLibrary.md)
- [`TasksLibrary`](../../Entities/classes/TasksLibrary.md)

## Type Parameters

### TCompositeId

`TCompositeId` *extends* `string`

The composite ID type (e.g., `IngredientId`)

### TBaseId

`TBaseId` *extends* `string`

The base item ID type (e.g., `BaseIngredientId`)

### TItem

`TItem`

The item type stored in collections (e.g., `Ingredient`)

## Constructors

### Constructor

> `protected` **new SubLibraryBase**\<`TCompositeId`, `TBaseId`, `TItem`\>(`params`): `SubLibraryBase`\<`TCompositeId`, `TBaseId`, `TItem`\>

Defined in: [ts-chocolate/src/packlets/library-data/subLibrary.ts:411](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-data/subLibrary.ts#L411)

Creates a new SubLibraryBase instance with full loading support.

This constructor handles all collection loading:
- Built-in collections (from BuiltInData)
- File source collections
- Merge library collections
- Additional explicit collections

#### Parameters

##### params

[`ISubLibraryCreateParams`](../interfaces/ISubLibraryCreateParams.md)\<`SubLibraryBase`\<`TCompositeId`, `TBaseId`, `TItem`\>, `TBaseId`, `TItem`\>

Creation parameters including factory functions and library params

#### Returns

`SubLibraryBase`\<`TCompositeId`, `TBaseId`, `TItem`\>

#### Throws

Error if loading fails (use captureResult in derived create())

#### Overrides

`Collections.AggregatedResultMapBase< TCompositeId, CollectionId, TBaseId, TItem, ICollectionSourceMetadata >.constructor`

## Accessors

### collectionCount

#### Get Signature

> **get** **collectionCount**(): `number`

Defined in: ts-utils/dist/ts-utils.d.ts:188

The number of collections.

##### Returns

`number`

#### Inherited from

`Collections.AggregatedResultMapBase.collectionCount`

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

`Collections.AggregatedResultMapBase.collections`

***

### protectedCollections

#### Get Signature

> **get** **protectedCollections**(): readonly [`IProtectedCollectionInfo`](../interfaces/IProtectedCollectionInfo.md)\<[`CollectionId`](../../../../type-aliases/CollectionId.md)\>[]

Defined in: [ts-chocolate/src/packlets/library-data/subLibrary.ts:1000](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-data/subLibrary.ts#L1000)

Gets the list of protected collections that were captured but not decrypted.

These are encrypted collections that were encountered during loading but couldn't
be decrypted (e.g., due to missing encryption keys). They can be decrypted later
using [loadProtectedCollectionAsync](#loadprotectedcollectionasync).

##### Returns

readonly [`IProtectedCollectionInfo`](../interfaces/IProtectedCollectionInfo.md)\<[`CollectionId`](../../../../type-aliases/CollectionId.md)\>[]

Read-only array of protected collection references with metadata.

***

### size

#### Get Signature

> **get** **size**(): `number`

Defined in: ts-utils/dist/ts-utils.d.ts:57

The total number of items across all collections.

##### Returns

`number`

#### Inherited from

`Collections.AggregatedResultMapBase.size`

***

### validating

#### Get Signature

> **get** **validating**(): [`IReadOnlyResultMapValidator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`TCOMPOSITEID`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs), [`TITEM`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:53

A validator for weakly-typed access to the map.

##### Returns

[`IReadOnlyResultMapValidator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`TCOMPOSITEID`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs), [`TITEM`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

#### Inherited from

`Collections.AggregatedResultMapBase.validating`

## Methods

### \_deleteCollection()

> `protected` **\_deleteCollection**(`collectionId`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`AggregatedResultMapEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CollectionId`](../../../../type-aliases/CollectionId.md), `TBaseId`, `TItem`, [`ICollectionSourceMetadata`](../interfaces/ICollectionSourceMetadata.md)\>, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:227

Deletes a collection from the internal collections map.
This is a protected method for use by derived classes that need to implement
collection deletion functionality.

#### Parameters

##### collectionId

[`CollectionId`](../../../../type-aliases/CollectionId.md)

The collection ID to delete.

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`AggregatedResultMapEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CollectionId`](../../../../type-aliases/CollectionId.md), `TBaseId`, `TItem`, [`ICollectionSourceMetadata`](../interfaces/ICollectionSourceMetadata.md)\>, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the deleted entry if found, `Failure` otherwise.

#### Remarks

- Does NOT check if the collection is mutable - callers should validate this first.
- Use `collections.get(id)` to check if a collection exists and its mutability before calling.

#### Inherited from

`Collections.AggregatedResultMapBase._deleteCollection`

***

### \[iterator\]()

> **\[iterator\]**(): `IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TCompositeId`, `TItem`\>\>

Defined in: ts-utils/dist/ts-utils.d.ts:91

Gets an iterator over the map entries.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TCompositeId`, `TItem`\>\>

#### Inherited from

`Collections.AggregatedResultMapBase.[iterator]`

***

### add()

> **add**(`key`, `value`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TItem`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:105

Adds an item by its composite ID. Fails if the item already exists.

#### Parameters

##### key

`TCompositeId`

The composite ID of the item.

##### value

`TItem`

The value to add.

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TItem`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the value if added, `Failure` otherwise.

#### Inherited from

`Collections.AggregatedResultMapBase.add`

***

### addCollectionEntry()

> **addCollectionEntry**(`entry`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`AggregatedResultMapEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CollectionId`](../../../../type-aliases/CollectionId.md), `TBaseId`, `TItem`, [`ICollectionSourceMetadata`](../interfaces/ICollectionSourceMetadata.md)\>, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:207

Adds a new collection from a pre-built entry object.

#### Parameters

##### entry

[`AggregatedResultMapEntryInit`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CollectionId`](../../../../type-aliases/CollectionId.md), `TBaseId`, `TItem`, [`ICollectionSourceMetadata`](../interfaces/ICollectionSourceMetadata.md)\>

The collection entry to add (JSON with items/entries, or pre-instantiated).

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`AggregatedResultMapEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CollectionId`](../../../../type-aliases/CollectionId.md), `TBaseId`, `TItem`, [`ICollectionSourceMetadata`](../interfaces/ICollectionSourceMetadata.md)\>, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the entry if added, `Failure` otherwise.

#### Inherited from

`Collections.AggregatedResultMapBase.addCollectionEntry`

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

`Collections.AggregatedResultMapBase.addCollectionWithItems`

***

### addToCollection()

> **addToCollection**(`collectionId`, `itemId`, `value`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TCompositeId`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:156

Adds an item using separate collection and item IDs.

#### Parameters

##### collectionId

[`CollectionId`](../../../../type-aliases/CollectionId.md)

The collection ID.

##### itemId

`TBaseId`

The item ID.

##### value

`TItem`

The value to add.

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TCompositeId`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the composite ID if added, `Failure` otherwise.

#### Inherited from

`Collections.AggregatedResultMapBase.addToCollection`

***

### clear()

> **clear**(): `void`

Defined in: ts-utils/dist/ts-utils.d.ts:137

Clears all items from all mutable collections.
Immutable collections are not affected.

#### Returns

`void`

#### Inherited from

`Collections.AggregatedResultMapBase.clear`

***

### composeId()

> **composeId**(`collectionId`, `itemId`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TCompositeId`\>

Defined in: ts-utils/dist/ts-utils.d.ts:148

Composes a collection ID and item ID into a composite ID.

#### Parameters

##### collectionId

[`CollectionId`](../../../../type-aliases/CollectionId.md)

The collection ID.

##### itemId

`TBaseId`

The item ID.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TCompositeId`\>

`Success` with the composite ID if valid, `Failure` otherwise.

#### Inherited from

`Collections.AggregatedResultMapBase.composeId`

***

### delete()

> **delete**(`key`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TItem`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:118

Deletes an item by its composite ID.

#### Parameters

##### key

`TCompositeId`

The composite ID of the item.

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TItem`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the deleted value, `Failure` otherwise.

#### Inherited from

`Collections.AggregatedResultMapBase.delete`

***

### deleteFromCollection()

> **deleteFromCollection**(`collectionId`, `itemId`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TCompositeId`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:179

Deletes an item using separate collection and item IDs.

#### Parameters

##### collectionId

[`CollectionId`](../../../../type-aliases/CollectionId.md)

The collection ID.

##### itemId

`TBaseId`

The item ID.

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TCompositeId`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the composite ID if deleted, `Failure` otherwise.

#### Inherited from

`Collections.AggregatedResultMapBase.deleteFromCollection`

***

### entries()

> **entries**(): `IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TCompositeId`, `TItem`\>\>

Defined in: ts-utils/dist/ts-utils.d.ts:73

Iterates over all entries in all collections.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TCompositeId`, `TItem`\>\>

#### Inherited from

`Collections.AggregatedResultMapBase.entries`

***

### forEach()

> **forEach**(`cb`, `thisArg?`): `void`

Defined in: ts-utils/dist/ts-utils.d.ts:87

Calls a callback for each entry.

#### Parameters

##### cb

[`ResultMapForEachCb`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TCompositeId`, `TItem`\>

The callback to call.

##### thisArg?

`unknown`

Optional `this` argument for the callback.

#### Returns

`void`

#### Inherited from

`Collections.AggregatedResultMapBase.forEach`

***

### get()

> **get**(`key`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TItem`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:63

Gets an item by its composite ID.

#### Parameters

##### key

`TCompositeId`

The composite ID of the item.

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TItem`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the item if found, `Failure` otherwise.

#### Inherited from

`Collections.AggregatedResultMapBase.get`

***

### getCollectionMetadata()

> **getCollectionMetadata**(`collectionId`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ICollectionSourceMetadata`](../interfaces/ICollectionSourceMetadata.md) \| `undefined`\>

Defined in: ts-utils/dist/ts-utils.d.ts:194

Gets the metadata for a specific collection.

#### Parameters

##### collectionId

[`CollectionId`](../../../../type-aliases/CollectionId.md)

The collection ID.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ICollectionSourceMetadata`](../interfaces/ICollectionSourceMetadata.md) \| `undefined`\>

`Success` with the metadata if found, `Failure` otherwise.

#### Inherited from

`Collections.AggregatedResultMapBase.getCollectionMetadata`

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

***

### getOrAdd()

#### Call Signature

> **getOrAdd**(`key`, `value`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TItem`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:125

Gets an existing item or adds a new one.

##### Parameters

###### key

`TCompositeId`

The composite ID of the item.

###### value

`TItem`

The value to add if not found.

##### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TItem`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the existing or new value.

##### Inherited from

`Collections.AggregatedResultMapBase.getOrAdd`

#### Call Signature

> **getOrAdd**(`key`, `factory`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TItem`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:132

Gets an existing item or adds a new one using a factory.

##### Parameters

###### key

`TCompositeId`

The composite ID of the item.

###### factory

[`ResultMapValueFactory`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TCompositeId`, `TItem`\>

A factory function to create the value if not found. Receives the composite ID.

##### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TItem`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the existing or new value.

##### Inherited from

`Collections.AggregatedResultMapBase.getOrAdd`

***

### has()

> **has**(`key`): `boolean`

Defined in: ts-utils/dist/ts-utils.d.ts:69

Checks if an item exists by its composite ID.

#### Parameters

##### key

`TCompositeId`

The composite ID of the item.

#### Returns

`boolean`

`true` if the item exists, `false` otherwise.

#### Inherited from

`Collections.AggregatedResultMapBase.has`

***

### keys()

> **keys**(): `IterableIterator`\<`TCompositeId`\>

Defined in: ts-utils/dist/ts-utils.d.ts:77

Iterates over all composite keys.

#### Returns

`IterableIterator`\<`TCompositeId`\>

#### Inherited from

`Collections.AggregatedResultMapBase.keys`

***

### loadFromFileTreeSource()

> **loadFromFileTreeSource**(`source`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`number`\>

Defined in: [ts-chocolate/src/packlets/library-data/subLibrary.ts:950](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-data/subLibrary.ts#L950)

Loads collections from a file tree source and adds them to this library.

#### Parameters

##### source

[`SubLibraryFileTreeSource`](../type-aliases/SubLibraryFileTreeSource.md)

The file tree source to load from

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`number`\>

Success with the number of collections added, or Failure with error message

***

### loadProtectedCollectionAsync()

> **loadProtectedCollectionAsync**(`encryption`, `filter?`): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`CollectionId`](../../../../type-aliases/CollectionId.md)[]\>\>

Defined in: [ts-chocolate/src/packlets/library-data/subLibrary.ts:1019](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-data/subLibrary.ts#L1019)

Decrypts and loads one or more protected collections.

#### Parameters

##### encryption

[`IEncryptionConfig`](../interfaces/IEncryptionConfig.md)

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

***

### set()

> **set**(`key`, `value`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TItem`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:98

Sets an item by its composite ID. Creates the collection if it doesn't exist and is mutable.

#### Parameters

##### key

`TCompositeId`

The composite ID of the item.

##### value

`TItem`

The value to set.

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TItem`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the value if set, `Failure` otherwise.

#### Inherited from

`Collections.AggregatedResultMapBase.set`

***

### setCollectionMetadata()

> **setCollectionMetadata**(`collectionId`, `metadata`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ICollectionSourceMetadata`](../interfaces/ICollectionSourceMetadata.md)\>

Defined in: ts-utils/dist/ts-utils.d.ts:201

Sets the metadata for a mutable collection.

#### Parameters

##### collectionId

[`CollectionId`](../../../../type-aliases/CollectionId.md)

The collection ID.

##### metadata

[`ICollectionSourceMetadata`](../interfaces/ICollectionSourceMetadata.md)

The metadata to set.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ICollectionSourceMetadata`](../interfaces/ICollectionSourceMetadata.md)\>

`Success` if set, `Failure` otherwise.

#### Inherited from

`Collections.AggregatedResultMapBase.setCollectionMetadata`

***

### setInCollection()

> **setInCollection**(`collectionId`, `itemId`, `value`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TCompositeId`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:164

Sets an item using separate collection and item IDs.

#### Parameters

##### collectionId

[`CollectionId`](../../../../type-aliases/CollectionId.md)

The collection ID.

##### itemId

`TBaseId`

The item ID.

##### value

`TItem`

The value to set.

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TCompositeId`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the composite ID if set, `Failure` otherwise.

#### Inherited from

`Collections.AggregatedResultMapBase.setInCollection`

***

### toReadOnly()

> **toReadOnly**(): [`IReadOnlyResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TCompositeId`, `TItem`\>

Defined in: ts-utils/dist/ts-utils.d.ts:141

Returns a read-only view of this map.

#### Returns

[`IReadOnlyResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TCompositeId`, `TItem`\>

#### Inherited from

`Collections.AggregatedResultMapBase.toReadOnly`

***

### update()

> **update**(`key`, `value`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TItem`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:112

Updates an existing item by its composite ID. Fails if the item doesn't exist.

#### Parameters

##### key

`TCompositeId`

The composite ID of the item.

##### value

`TItem`

The new value.

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TItem`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the value if updated, `Failure` otherwise.

#### Inherited from

`Collections.AggregatedResultMapBase.update`

***

### updateInCollection()

> **updateInCollection**(`collectionId`, `itemId`, `value`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TCompositeId`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:172

Updates an item using separate collection and item IDs.

#### Parameters

##### collectionId

[`CollectionId`](../../../../type-aliases/CollectionId.md)

The collection ID.

##### itemId

`TBaseId`

The item ID.

##### value

`TItem`

The new value.

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TCompositeId`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the composite ID if updated, `Failure` otherwise.

#### Inherited from

`Collections.AggregatedResultMapBase.updateInCollection`

***

### values()

> **values**(): `IterableIterator`\<`TItem`\>

Defined in: ts-utils/dist/ts-utils.d.ts:81

Iterates over all values.

#### Returns

`IterableIterator`\<`TItem`\>

#### Inherited from

`Collections.AggregatedResultMapBase.values`

***

### loadAllCollectionsAsync()

> `protected` `static` **loadAllCollectionsAsync**\<`TLibrary`, `TBaseId`, `TItem`\>(`params`): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ISubLibraryAsyncLoadResult`](../interfaces/ISubLibraryAsyncLoadResult.md)\<`TBaseId`, `TItem`\>\>\>

Defined in: [ts-chocolate/src/packlets/library-data/subLibrary.ts:828](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-data/subLibrary.ts#L828)

Loads all collections asynchronously with encryption support.

This is a protected helper for derived class `createAsync()` methods.
It handles built-in collections, file sources, and merge libraries.

Encryption configuration is read from `params.libraryParams.encryption`.

#### Type Parameters

##### TLibrary

`TLibrary` *extends* `SubLibraryBase`\<`string`, `TBaseId`, `TItem`\>

##### TBaseId

`TBaseId` *extends* `string`

##### TItem

`TItem`

#### Parameters

##### params

[`ISubLibraryCreateParams`](../interfaces/ISubLibraryCreateParams.md)\<`TLibrary`, `TBaseId`, `TItem`\>

The creation parameters (encryption config comes from libraryParams.encryption).

#### Returns

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ISubLibraryAsyncLoadResult`](../interfaces/ISubLibraryAsyncLoadResult.md)\<`TBaseId`, `TItem`\>\>\>

Promise resolving to Success with collections and protected collections, or Failure with error.
