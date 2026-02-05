[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / SubLibraryCollectionEntry

# Type Alias: SubLibraryCollectionEntry\<TBaseId, TItem\>

> **SubLibraryCollectionEntry**\<`TBaseId`, `TItem`\> = [`Collections.AggregatedResultMapEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CollectionId`](../../../../type-aliases/CollectionId.md), `TBaseId`, `TItem`, [`ICollectionSourceMetadata`](../interfaces/ICollectionSourceMetadata.md)\>

Defined in: [ts-chocolate/src/packlets/library-data/subLibrary.ts:79](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-data/subLibrary.ts#L79)

A single entry in a sub-library collection.
Fixes the collection ID type to SourceId and metadata type to ICollectionSourceMetadata.

## Type Parameters

### TBaseId

`TBaseId` *extends* `string`

The base item ID type (e.g., `BaseIngredientId`)

### TItem

`TItem`

The item type stored in the collection (e.g., `Ingredient`)
