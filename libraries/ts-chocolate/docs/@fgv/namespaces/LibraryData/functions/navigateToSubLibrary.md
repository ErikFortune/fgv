[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / navigateToSubLibrary

# Function: navigateToSubLibrary()

> **navigateToSubLibrary**(`tree`, `subLibraryId`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IFileTreeDirectoryItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`string`\>\>

Defined in: [ts-chocolate/src/packlets/library-data/libraryLoader.ts:134](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/libraryLoader.ts#L134)

Navigates to a sub-library directory within a file tree.

## Parameters

### tree

[`IFileTreeDirectoryItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)

The root file tree directory

### subLibraryId

[`SubLibraryId`](../type-aliases/SubLibraryId.md)

The sub-library to navigate to

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IFileTreeDirectoryItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`string`\>\>

Success with the sub-library directory, or Failure if not found
