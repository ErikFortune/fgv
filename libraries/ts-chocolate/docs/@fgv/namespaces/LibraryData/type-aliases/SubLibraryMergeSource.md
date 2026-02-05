[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / SubLibraryMergeSource

# Type Alias: SubLibraryMergeSource\<TLibrary\>

> **SubLibraryMergeSource**\<`TLibrary`\> = `TLibrary` \| [`IMergeLibrarySource`](../interfaces/IMergeLibrarySource.md)\<`TLibrary`, [`CollectionId`](../../../../type-aliases/CollectionId.md)\>

Defined in: [ts-chocolate/src/packlets/library-data/subLibrary.ts:147](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-data/subLibrary.ts#L147)

Specifies a sub-library to merge into a new library.

Can be either:
- A library instance directly (merges all collections)
- An `IMergeLibrarySource` object with optional filtering

## Type Parameters

### TLibrary

`TLibrary`

The library type (e.g., `IngredientsLibrary`)
