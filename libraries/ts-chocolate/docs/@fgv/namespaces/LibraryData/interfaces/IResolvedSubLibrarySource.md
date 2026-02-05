[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / IResolvedSubLibrarySource

# Interface: IResolvedSubLibrarySource

Defined in: [ts-chocolate/src/packlets/library-data/libraryLoader.ts:149](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-data/libraryLoader.ts#L149)

Result of resolving a file tree source for a specific sub-library.

## Properties

### directory

> `readonly` **directory**: [`IFileTreeDirectoryItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)

Defined in: [ts-chocolate/src/packlets/library-data/libraryLoader.ts:158](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-data/libraryLoader.ts#L158)

The directory containing collections for this sub-library

***

### loadParams

> `readonly` **loadParams**: [`ILoadCollectionFromFileTreeParams`](ILoadCollectionFromFileTreeParams.md)\<`string`\>

Defined in: [ts-chocolate/src/packlets/library-data/libraryLoader.ts:163](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-data/libraryLoader.ts#L163)

Load parameters for the collection loader

***

### subLibraryId

> `readonly` **subLibraryId**: [`SubLibraryId`](../type-aliases/SubLibraryId.md)

Defined in: [ts-chocolate/src/packlets/library-data/libraryLoader.ts:153](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-data/libraryLoader.ts#L153)

The sub-library identifier
