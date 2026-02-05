[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / resolveFileTreeSourceForSubLibrary

# Function: resolveFileTreeSourceForSubLibrary()

> **resolveFileTreeSourceForSubLibrary**(`source`, `subLibraryId`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IResolvedSubLibrarySource`](../interfaces/IResolvedSubLibrarySource.md) \| `undefined`\>

Defined in: [ts-chocolate/src/packlets/library-data/libraryLoader.ts:174](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-data/libraryLoader.ts#L174)

Resolves a file tree source for a specific sub-library.

## Parameters

### source

[`ILibraryFileTreeSource`](../interfaces/ILibraryFileTreeSource.md)

The file tree source

### subLibraryId

[`SubLibraryId`](../type-aliases/SubLibraryId.md)

The sub-library to resolve

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IResolvedSubLibrarySource`](../interfaces/IResolvedSubLibrarySource.md) \| `undefined`\>

Success with resolved source, or Failure if sub-library not found or disabled
