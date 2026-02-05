[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / ICollectionLoadResult

# Interface: ICollectionLoadResult\<T, TCollectionId, TItemId\>

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:529](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-data/model.ts#L529)

Result of loading collections from a file tree.

## Type Parameters

### T

`T` = [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)

The item type

### TCollectionId

`TCollectionId` *extends* `string` = `string`

The collection ID type

### TItemId

`TItemId` *extends* `string` = `string`

The item ID type

## Properties

### collections

> `readonly` **collections**: readonly [`IRuntimeCollection`](IRuntimeCollection.md)\<`T`, `TCollectionId`, `TItemId`\>[]

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:537](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-data/model.ts#L537)

Successfully loaded collections with runtime FileTree references.

***

### protectedCollections

> `readonly` **protectedCollections**: readonly [`IProtectedCollectionInternal`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs)\<`TCollectionId`\>[]

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:542](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-data/model.ts#L542)

Protected collections that were captured but not decrypted.
