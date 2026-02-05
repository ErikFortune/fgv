[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IChocolateLibraryCreateParams

# Interface: IChocolateLibraryCreateParams

Defined in: [ts-chocolate/src/packlets/library-runtime/chocolateLibrary.ts:109](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/chocolateLibrary.ts#L109)

Parameters for creating a [ChocolateLibrary](../../../../classes/ChocolateLibrary.md).

Sources are processed in order:
1. Built-in collections (if enabled)
2. File tree sources (in array order)
3. Pre-instantiated libraries (merged in)

When multiple sources provide the same collection ID within a sub-library,
an error is returned (strict mode - no overwrites).

## Properties

### builtin?

> `readonly` `optional` **builtin**: [`FullLibraryLoadSpec`](../../LibraryData/type-aliases/FullLibraryLoadSpec.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/chocolateLibrary.ts:117](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/chocolateLibrary.ts#L117)

[Specifies built-in data loading](../../LibraryData/type-aliases/FullLibraryLoadSpec.md) for each sub-library.

- `true` (default): Load all built-ins for all sub-libraries
- `false`: Load no built-ins
- Per-sub-library control with `ingredients`, `recipes`, or `default` keys

***

### fileSources?

> `readonly` `optional` **fileSources**: [`ILibraryFileTreeSource`](../../LibraryData/interfaces/ILibraryFileTreeSource.md) \| readonly [`ILibraryFileTreeSource`](../../LibraryData/interfaces/ILibraryFileTreeSource.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/chocolateLibrary.ts:124](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/chocolateLibrary.ts#L124)

[File tree sources](../../LibraryData/interfaces/ILibraryFileTreeSource.md) to load data from.
Each source navigates to standard paths (data/ingredients, data/recipes)
and loads collections according to the source's load spec.

***

### libraries?

> `readonly` `optional` **libraries**: [`IInstantiatedLibrarySource`](IInstantiatedLibrarySource.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/chocolateLibrary.ts:131](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/chocolateLibrary.ts#L131)

Pre-instantiated [library sources](IInstantiatedLibrarySource.md).
Used for advanced scenarios like testing or custom library construction.
If provided along with other sources, collections are combined.

***

### logger?

> `readonly` `optional` **logger**: [`LogReporter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`unknown`, `unknown`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/chocolateLibrary.ts:136](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/chocolateLibrary.ts#L136)

Optional logger for reporting load/merge issues.
