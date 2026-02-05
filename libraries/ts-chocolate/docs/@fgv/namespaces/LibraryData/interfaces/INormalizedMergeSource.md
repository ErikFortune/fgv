[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / INormalizedMergeSource

# Interface: INormalizedMergeSource\<TLibrary, TCollectionId\>

Defined in: [ts-chocolate/src/packlets/library-data/libraryLoader.ts:323](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-data/libraryLoader.ts#L323)

Normalized result from a merge source.

## Type Parameters

### TLibrary

`TLibrary`

### TCollectionId

`TCollectionId` *extends* `string`

## Properties

### filter

> `readonly` **filter**: [`LibraryLoadSpec`](../type-aliases/LibraryLoadSpec.md)\<`TCollectionId`\>

Defined in: [ts-chocolate/src/packlets/library-data/libraryLoader.ts:332](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-data/libraryLoader.ts#L332)

The filter spec to apply (defaults to true if not specified).

***

### library

> `readonly` **library**: `TLibrary`

Defined in: [ts-chocolate/src/packlets/library-data/libraryLoader.ts:327](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-data/libraryLoader.ts#L327)

The library to merge collections from.
