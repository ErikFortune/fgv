[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / resolveImportRootForSubLibrary

# Function: resolveImportRootForSubLibrary()

> **resolveImportRootForSubLibrary**(`root`, `subLibraryId`, `options?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IResolvedImportRoot`](../interfaces/IResolvedImportRoot.md)\>

Defined in: [ts-chocolate/src/packlets/library-data/importResolver.ts:154](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-data/importResolver.ts#L154)

Resolves a directory that can be treated as a library root for a specific sub-library.

The returned directory is guaranteed (if successful) to contain a navigable `data/<subLibraryId>`
directory, even if the input is shaped as `<subLibraryId>/...`, `data/...`, or a set of loose
collection files.

This is intended to unify import behavior across zip, filesystem, and in-memory sources.

## Parameters

### root

[`IFileTreeDirectoryItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)

Root directory to search.

### subLibraryId

[`SubLibraryId`](../type-aliases/SubLibraryId.md)

Target sub-library.

### options?

[`IResolveImportRootOptions`](../interfaces/IResolveImportRootOptions.md)

Search and compatibility options.

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IResolvedImportRoot`](../interfaces/IResolvedImportRoot.md)\>
