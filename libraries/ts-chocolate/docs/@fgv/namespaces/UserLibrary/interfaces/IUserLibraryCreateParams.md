[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [UserLibrary](../README.md) / IUserLibraryCreateParams

# Interface: IUserLibraryCreateParams

Defined in: [ts-chocolate/src/packlets/user-library/model.ts:112](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/user-library/model.ts#L112)

Parameters for creating a [UserLibrary](../classes/UserLibrary.md).

User libraries have no built-in data - all data is user-provided.

Sources are processed in order:
1. File tree sources (in array order)
2. Pre-instantiated libraries (merged in)

## Properties

### fileSources?

> `readonly` `optional` **fileSources**: [`ILibraryFileTreeSource`](../../LibraryData/interfaces/ILibraryFileTreeSource.md) \| readonly [`ILibraryFileTreeSource`](../../LibraryData/interfaces/ILibraryFileTreeSource.md)[]

Defined in: [ts-chocolate/src/packlets/user-library/model.ts:116](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/user-library/model.ts#L116)

File tree sources to load data from.

***

### libraries?

> `readonly` `optional` **libraries**: [`IInstantiatedUserLibrarySource`](IInstantiatedUserLibrarySource.md)

Defined in: [ts-chocolate/src/packlets/user-library/model.ts:121](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/user-library/model.ts#L121)

Pre-instantiated library sources.

***

### logger?

> `readonly` `optional` **logger**: [`ILogger`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)

Defined in: [ts-chocolate/src/packlets/user-library/model.ts:126](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/user-library/model.ts#L126)

Logger for library operations.
