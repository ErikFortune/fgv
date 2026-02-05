[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / resolveSubLibraryLoadSpec

# Function: resolveSubLibraryLoadSpec()

> **resolveSubLibraryLoadSpec**(`spec`, `subLibraryId`): [`LibraryLoadSpec`](../type-aliases/LibraryLoadSpec.md)

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:277](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-data/model.ts#L277)

Resolves a FullLibraryLoadSpec to a LibraryLoadSpec for a specific sub-library.

## Parameters

### spec

[`FullLibraryLoadSpec`](../type-aliases/FullLibraryLoadSpec.md)

The full library load spec

### subLibraryId

[`SubLibraryId`](../type-aliases/SubLibraryId.md)

The sub-library to resolve for

## Returns

[`LibraryLoadSpec`](../type-aliases/LibraryLoadSpec.md)

The resolved LibraryLoadSpec for the sub-library
