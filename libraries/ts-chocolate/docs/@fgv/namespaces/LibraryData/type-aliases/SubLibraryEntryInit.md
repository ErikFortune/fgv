[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / SubLibraryEntryInit

# Type Alias: SubLibraryEntryInit\<TBaseId, TItem\>

> **SubLibraryEntryInit**\<`TBaseId`, `TItem`\> = [`Collections.AggregatedResultMapEntryInit`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CollectionId`](../../../../type-aliases/CollectionId.md), `TBaseId`, `TItem`, [`ICollectionSourceMetadata`](../interfaces/ICollectionSourceMetadata.md)\>

Defined in: [ts-chocolate/src/packlets/library-data/subLibrary.ts:94](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-data/subLibrary.ts#L94)

Initialization type for a sub-library collection entry.
Fixes the collection ID type to SourceId and metadata type to ICollectionSourceMetadata.

## Type Parameters

### TBaseId

`TBaseId` *extends* `string`

The base item ID type (e.g., `BaseIngredientId`)

### TItem

`TItem`

The item type stored in the collection (e.g., `Ingredient`)
