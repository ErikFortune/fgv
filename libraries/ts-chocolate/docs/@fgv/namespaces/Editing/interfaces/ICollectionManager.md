[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Editing](../README.md) / ICollectionManager

# Interface: ICollectionManager\<TBaseId, TItem\>

Defined in: [ts-chocolate/src/packlets/editing/model.ts:263](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/editing/model.ts#L263)

Manager for collection-level CRUD operations.
Provides operations to create, delete, and rename collections within a sub-library.

## Type Parameters

### TBaseId

`TBaseId` *extends* `string` = `string`

### TItem

`TItem` = `unknown`

## Properties

### create()

> `readonly` **create**: (`collectionId`, `metadata`) => [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`AggregatedResultMapEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CollectionId`](../../../../type-aliases/CollectionId.md), `TBaseId`, `TItem`\>\>

Defined in: [ts-chocolate/src/packlets/editing/model.ts:283](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/editing/model.ts#L283)

Create a new mutable collection.

#### Parameters

##### collectionId

[`CollectionId`](../../../../type-aliases/CollectionId.md)

Unique identifier for the new collection

##### metadata

[`ICollectionSourceMetadata`](../../LibraryData/interfaces/ICollectionSourceMetadata.md)

Collection metadata (name, description)

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`AggregatedResultMapEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CollectionId`](../../../../type-aliases/CollectionId.md), `TBaseId`, `TItem`\>\>

Result indicating success or failure

***

### delete()

> `readonly` **delete**: (`collectionId`) => [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`AggregatedResultMapEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CollectionId`](../../../../type-aliases/CollectionId.md), `TBaseId`, `TItem`, [`ICollectionSourceMetadata`](../../LibraryData/interfaces/ICollectionSourceMetadata.md)\>\>

Defined in: [ts-chocolate/src/packlets/editing/model.ts:293](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/editing/model.ts#L293)

Delete a mutable collection.

#### Parameters

##### collectionId

[`CollectionId`](../../../../type-aliases/CollectionId.md)

Collection to delete

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`AggregatedResultMapEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CollectionId`](../../../../type-aliases/CollectionId.md), `TBaseId`, `TItem`, [`ICollectionSourceMetadata`](../../LibraryData/interfaces/ICollectionSourceMetadata.md)\>\>

Result indicating success or failure

***

### exists()

> `readonly` **exists**: (`collectionId`) => `boolean`

Defined in: [ts-chocolate/src/packlets/editing/model.ts:313](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/editing/model.ts#L313)

Check if a collection exists.

#### Parameters

##### collectionId

[`CollectionId`](../../../../type-aliases/CollectionId.md)

Collection identifier

#### Returns

`boolean`

True if collection exists

***

### get()

> `readonly` **get**: (`collectionId`) => [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ICollectionSourceMetadata`](../../LibraryData/interfaces/ICollectionSourceMetadata.md)\>

Defined in: [ts-chocolate/src/packlets/editing/model.ts:275](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/editing/model.ts#L275)

Get metadata for a specific collection by ID.

#### Parameters

##### collectionId

[`CollectionId`](../../../../type-aliases/CollectionId.md)

Collection identifier

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ICollectionSourceMetadata`](../../LibraryData/interfaces/ICollectionSourceMetadata.md)\>

Result containing the collection metadata or failure

***

### getAll()

> `readonly` **getAll**: () => readonly [`CollectionId`](../../../../type-aliases/CollectionId.md)[]

Defined in: [ts-chocolate/src/packlets/editing/model.ts:268](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/editing/model.ts#L268)

Get all collection IDs in the library.

#### Returns

readonly [`CollectionId`](../../../../type-aliases/CollectionId.md)[]

Array of collection IDs

***

### isMutable()

> `readonly` **isMutable**: (`collectionId`) => [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`\>

Defined in: [ts-chocolate/src/packlets/editing/model.ts:320](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/editing/model.ts#L320)

Check if a collection is mutable.

#### Parameters

##### collectionId

[`CollectionId`](../../../../type-aliases/CollectionId.md)

Collection identifier

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`\>

Result containing true if mutable, failure if not found

***

### updateMetadata()

> `readonly` **updateMetadata**: (`collectionId`, `metadata`) => [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ICollectionSourceMetadata`](../../LibraryData/interfaces/ICollectionSourceMetadata.md)\>

Defined in: [ts-chocolate/src/packlets/editing/model.ts:303](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/editing/model.ts#L303)

Update collection metadata.

#### Parameters

##### collectionId

[`CollectionId`](../../../../type-aliases/CollectionId.md)

Collection to update

##### metadata

`Partial`\<[`ICollectionSourceMetadata`](../../LibraryData/interfaces/ICollectionSourceMetadata.md)\>

Partial metadata to update

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ICollectionSourceMetadata`](../../LibraryData/interfaces/ICollectionSourceMetadata.md)\>

Result indicating success or failure
