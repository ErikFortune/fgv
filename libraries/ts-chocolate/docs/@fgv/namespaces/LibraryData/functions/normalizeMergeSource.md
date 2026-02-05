[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / normalizeMergeSource

# Function: normalizeMergeSource()

> **normalizeMergeSource**\<`TLibrary`, `TCollectionId`\>(`source`): [`INormalizedMergeSource`](../interfaces/INormalizedMergeSource.md)\<`TLibrary`, `TCollectionId`\>

Defined in: [ts-chocolate/src/packlets/library-data/libraryLoader.ts:355](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/libraryLoader.ts#L355)

Normalizes a merge source (library or {library, filter}) to a consistent shape.

## Type Parameters

### TLibrary

`TLibrary`

### TCollectionId

`TCollectionId` *extends* `string`

## Parameters

### source

Either a library directly or an IMergeLibrarySource object

`TLibrary` | [`IMergeLibrarySource`](../interfaces/IMergeLibrarySource.md)\<`TLibrary`, `TCollectionId`\>

## Returns

[`INormalizedMergeSource`](../interfaces/INormalizedMergeSource.md)\<`TLibrary`, `TCollectionId`\>

Normalized object with library and filter (defaults to true)
