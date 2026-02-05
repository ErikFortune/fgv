[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Editing](../README.md) / CollectionManager

# Class: CollectionManager\<TCompositeId, TBaseId, TItem\>

Defined in: [ts-chocolate/src/packlets/editing/collectionManager.ts:98](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/collectionManager.ts#L98)

Implementation of collection management operations.
Wraps a SubLibraryBase instance to provide collection-level CRUD.

## Type Parameters

### TCompositeId

`TCompositeId` *extends* `string`

Composite ID type (e.g., IngredientId)

### TBaseId

`TBaseId` *extends* `string`

Base ID type (e.g., BaseIngredientId)

### TItem

`TItem`

Item type (e.g., Ingredient)

## Implements

- [`ICollectionManager`](../interfaces/ICollectionManager.md)

## Constructors

### Constructor

> **new CollectionManager**\<`TCompositeId`, `TBaseId`, `TItem`\>(`library`): `CollectionManager`\<`TCompositeId`, `TBaseId`, `TItem`\>

Defined in: [ts-chocolate/src/packlets/editing/collectionManager.ts:110](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/collectionManager.ts#L110)

Creates a new CollectionManager.

#### Parameters

##### library

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md)\<`TCompositeId`, `TBaseId`, `TItem`\>

The sub-library to manage

#### Returns

`CollectionManager`\<`TCompositeId`, `TBaseId`, `TItem`\>

## Methods

### create()

> **create**(`collectionId`, `metadata`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`AggregatedResultMapEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CollectionId`](../../../../type-aliases/CollectionId.md), `TBaseId`, `TItem`, [`ICollectionSourceMetadata`](../../LibraryData/interfaces/ICollectionSourceMetadata.md)\>\>

Defined in: [ts-chocolate/src/packlets/editing/collectionManager.ts:137](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/collectionManager.ts#L137)

Create a new mutable collection.

#### Parameters

##### collectionId

[`CollectionId`](../../../../type-aliases/CollectionId.md)

##### metadata

[`ICollectionSourceMetadata`](../../LibraryData/interfaces/ICollectionSourceMetadata.md)

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`AggregatedResultMapEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CollectionId`](../../../../type-aliases/CollectionId.md), `TBaseId`, `TItem`, [`ICollectionSourceMetadata`](../../LibraryData/interfaces/ICollectionSourceMetadata.md)\>\>

#### Implementation of

[`ICollectionManager`](../interfaces/ICollectionManager.md).[`create`](../interfaces/ICollectionManager.md#create)

***

### delete()

> **delete**(`collectionId`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`AggregatedResultMapEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CollectionId`](../../../../type-aliases/CollectionId.md), `TBaseId`, `TItem`, [`ICollectionSourceMetadata`](../../LibraryData/interfaces/ICollectionSourceMetadata.md)\>\>

Defined in: [ts-chocolate/src/packlets/editing/collectionManager.ts:161](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/collectionManager.ts#L161)

Delete a mutable collection.

#### Parameters

##### collectionId

[`CollectionId`](../../../../type-aliases/CollectionId.md)

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`AggregatedResultMapEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CollectionId`](../../../../type-aliases/CollectionId.md), `TBaseId`, `TItem`, [`ICollectionSourceMetadata`](../../LibraryData/interfaces/ICollectionSourceMetadata.md)\>\>

#### Implementation of

[`ICollectionManager`](../interfaces/ICollectionManager.md).[`delete`](../interfaces/ICollectionManager.md#delete)

***

### exists()

> **exists**(`collectionId`): `boolean`

Defined in: [ts-chocolate/src/packlets/editing/collectionManager.ts:182](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/collectionManager.ts#L182)

Check if a collection exists.

#### Parameters

##### collectionId

[`CollectionId`](../../../../type-aliases/CollectionId.md)

#### Returns

`boolean`

#### Implementation of

[`ICollectionManager`](../interfaces/ICollectionManager.md).[`exists`](../interfaces/ICollectionManager.md#exists)

***

### get()

> **get**(`collectionId`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ICollectionSourceMetadata`](../../LibraryData/interfaces/ICollectionSourceMetadata.md)\>

Defined in: [ts-chocolate/src/packlets/editing/collectionManager.ts:124](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/collectionManager.ts#L124)

Get metadata for a specific collection by ID.

#### Parameters

##### collectionId

[`CollectionId`](../../../../type-aliases/CollectionId.md)

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ICollectionSourceMetadata`](../../LibraryData/interfaces/ICollectionSourceMetadata.md)\>

#### Implementation of

[`ICollectionManager`](../interfaces/ICollectionManager.md).[`get`](../interfaces/ICollectionManager.md#get)

***

### getAll()

> **getAll**(): readonly [`CollectionId`](../../../../type-aliases/CollectionId.md)[]

Defined in: [ts-chocolate/src/packlets/editing/collectionManager.ts:117](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/collectionManager.ts#L117)

Get all collection IDs in the library.

#### Returns

readonly [`CollectionId`](../../../../type-aliases/CollectionId.md)[]

#### Implementation of

[`ICollectionManager`](../interfaces/ICollectionManager.md).[`getAll`](../interfaces/ICollectionManager.md#getall)

***

### isMutable()

> **isMutable**(`collectionId`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`\>

Defined in: [ts-chocolate/src/packlets/editing/collectionManager.ts:189](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/collectionManager.ts#L189)

Check if a collection is mutable.

#### Parameters

##### collectionId

[`CollectionId`](../../../../type-aliases/CollectionId.md)

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`\>

#### Implementation of

[`ICollectionManager`](../interfaces/ICollectionManager.md).[`isMutable`](../interfaces/ICollectionManager.md#ismutable)

***

### updateMetadata()

> **updateMetadata**(`collectionId`, `metadata`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ICollectionSourceMetadata`](../../LibraryData/interfaces/ICollectionSourceMetadata.md)\>

Defined in: [ts-chocolate/src/packlets/editing/collectionManager.ts:171](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/collectionManager.ts#L171)

Update collection metadata.

#### Parameters

##### collectionId

[`CollectionId`](../../../../type-aliases/CollectionId.md)

##### metadata

`Partial`\<[`ICollectionSourceMetadata`](../../LibraryData/interfaces/ICollectionSourceMetadata.md)\>

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ICollectionSourceMetadata`](../../LibraryData/interfaces/ICollectionSourceMetadata.md)\>

#### Implementation of

[`ICollectionManager`](../interfaces/ICollectionManager.md).[`updateMetadata`](../interfaces/ICollectionManager.md#updatemetadata)
