[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / IMergeLibrarySource

# Interface: IMergeLibrarySource\<TLibrary, TCollectionId\>

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:382](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-data/model.ts#L382)

Specifies a library to merge with optional collection filtering.

Used when creating a new library that should include collections from
an existing library instance. The filter parameter allows selective
merging of collections.

## Type Parameters

### TLibrary

`TLibrary`

The type of library being merged

### TCollectionId

`TCollectionId` *extends* `string` = `string`

The type of collection identifiers (defaults to string)

## Properties

### filter?

> `readonly` `optional` **filter**: [`LibraryLoadSpec`](../type-aliases/LibraryLoadSpec.md)\<`TCollectionId`\>

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:396](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-data/model.ts#L396)

Controls which collections to merge from this library.

- `true` (default): Merge all collections.
- `false`: Merge no collections (skip this library).
- `TCollectionId[]`: Merge only the specified collections by name.
- `ILibraryLoadParams`: Fine-grained control using include/exclude patterns.

***

### library

> `readonly` **library**: `TLibrary`

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:386](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-data/model.ts#L386)

The library to merge collections from.
