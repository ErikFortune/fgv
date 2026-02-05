[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / resolveFileTreeSource

# Function: resolveFileTreeSource()

> **resolveFileTreeSource**(`source`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IResolvedSubLibrarySource`](../interfaces/IResolvedSubLibrarySource.md)[]\>

Defined in: [ts-chocolate/src/packlets/library-data/libraryLoader.ts:204](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-data/libraryLoader.ts#L204)

Resolves all sub-libraries from a file tree source.

## Parameters

### source

[`ILibraryFileTreeSource`](../interfaces/ILibraryFileTreeSource.md)

The file tree source

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IResolvedSubLibrarySource`](../interfaces/IResolvedSubLibrarySource.md)[]\>

Success with array of resolved sources (excluding disabled ones), or Failure on error
