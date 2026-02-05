[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / resolveSubLibraryLoadSpec

# Function: resolveSubLibraryLoadSpec()

> **resolveSubLibraryLoadSpec**(`spec`, `subLibraryId`): [`LibraryLoadSpec`](../type-aliases/LibraryLoadSpec.md)

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:277](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-data/model.ts#L277)

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
