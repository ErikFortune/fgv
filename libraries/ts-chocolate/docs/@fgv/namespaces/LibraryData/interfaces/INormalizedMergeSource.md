[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / INormalizedMergeSource

# Interface: INormalizedMergeSource\<TLibrary, TCollectionId\>

Defined in: [ts-chocolate/src/packlets/library-data/libraryLoader.ts:323](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-data/libraryLoader.ts#L323)

Normalized result from a merge source.

## Type Parameters

### TLibrary

`TLibrary`

### TCollectionId

`TCollectionId` *extends* `string`

## Properties

### filter

> `readonly` **filter**: [`LibraryLoadSpec`](../type-aliases/LibraryLoadSpec.md)\<`TCollectionId`\>

Defined in: [ts-chocolate/src/packlets/library-data/libraryLoader.ts:332](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-data/libraryLoader.ts#L332)

The filter spec to apply (defaults to true if not specified).

***

### library

> `readonly` **library**: `TLibrary`

Defined in: [ts-chocolate/src/packlets/library-data/libraryLoader.ts:327](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-data/libraryLoader.ts#L327)

The library to merge collections from.
