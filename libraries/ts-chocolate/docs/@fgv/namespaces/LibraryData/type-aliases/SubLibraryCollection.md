[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / SubLibraryCollection

# Type Alias: SubLibraryCollection\<TBaseId, TItem\>

> **SubLibraryCollection**\<`TBaseId`, `TItem`\> = [`Collections.IReadOnlyValidatingResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CollectionId`](../../../../type-aliases/CollectionId.md), [`SubLibraryCollectionEntry`](SubLibraryCollectionEntry.md)\<`TBaseId`, `TItem`\>\>

Defined in: [ts-chocolate/src/packlets/library-data/subLibrary.ts:121](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-data/subLibrary.ts#L121)

Type for the collections map in a sub-library.
Maps SourceId to collection entries.

## Type Parameters

### TBaseId

`TBaseId` *extends* `string`

The base item ID type (e.g., `BaseIngredientId`)

### TItem

`TItem`

The item type stored in the collection (e.g., `Ingredient`)
