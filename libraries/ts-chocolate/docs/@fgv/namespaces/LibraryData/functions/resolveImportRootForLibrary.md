[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / resolveImportRootForLibrary

# Function: resolveImportRootForLibrary()

> **resolveImportRootForLibrary**(`root`, `options?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IResolvedImportRoot`](../interfaces/IResolvedImportRoot.md)\>

Defined in: [ts-chocolate/src/packlets/library-data/importResolver.ts:295](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-data/importResolver.ts#L295)

Resolves a directory that can be treated as a library root for any sub-libraries.

The returned directory is guaranteed (if successful) to contain a navigable `data/` directory
with at least one standard sub-library directory (ingredients, fillings, etc.).

This is intended to unify import behavior across zip, filesystem, and in-memory sources
when importing a full library rather than a specific sub-library.

## Parameters

### root

[`IFileTreeDirectoryItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)

Root directory to search.

### options?

`Omit`\<[`IResolveImportRootOptions`](../interfaces/IResolveImportRootOptions.md), `"allowLooseFiles"`\>

Search options (allowLooseFiles is ignored for full library resolution).

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IResolvedImportRoot`](../interfaces/IResolvedImportRoot.md)\>
