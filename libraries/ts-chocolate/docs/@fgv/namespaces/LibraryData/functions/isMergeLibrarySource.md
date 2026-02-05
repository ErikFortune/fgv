[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / isMergeLibrarySource

# Function: isMergeLibrarySource()

> **isMergeLibrarySource**\<`TLibrary`, `TCollectionId`\>(`source`): `source is IMergeLibrarySource<TLibrary, TCollectionId>`

Defined in: [ts-chocolate/src/packlets/library-data/libraryLoader.ts:342](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-data/libraryLoader.ts#L342)

Type guard to check if a value is an IMergeLibrarySource.

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

`source is IMergeLibrarySource<TLibrary, TCollectionId>`

True if the source is an IMergeLibrarySource with a 'library' property
