[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / resolveBuiltInSpec

# Function: resolveBuiltInSpec()

> **resolveBuiltInSpec**\<`TCollectionId`\>(`spec`, `subLibraryId`): [`LibraryLoadSpec`](../type-aliases/LibraryLoadSpec.md)\<`TCollectionId`\>

Defined in: [ts-chocolate/src/packlets/library-data/libraryLoader.ts:235](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-data/libraryLoader.ts#L235)

Resolves a FullLibraryLoadSpec for built-in loading to individual sub-library specs.

## Type Parameters

### TCollectionId

`TCollectionId` *extends* `string` = `string`

## Parameters

### spec

The full library load spec (default: true)

[`FullLibraryLoadSpec`](../type-aliases/FullLibraryLoadSpec.md) | `undefined`

### subLibraryId

[`SubLibraryId`](../type-aliases/SubLibraryId.md)

The sub-library to get spec for

## Returns

[`LibraryLoadSpec`](../type-aliases/LibraryLoadSpec.md)\<`TCollectionId`\>

The resolved LibraryLoadSpec, or false if not specified
