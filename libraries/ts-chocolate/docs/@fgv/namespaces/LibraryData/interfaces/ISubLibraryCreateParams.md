[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / ISubLibraryCreateParams

# Interface: ISubLibraryCreateParams\<TLibrary, TBaseId, TItem\>

Defined in: [ts-chocolate/src/packlets/library-data/subLibrary.ts:304](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/subLibrary.ts#L304)

Parameters for constructing a SubLibrary with full loading support.

This interface extends the base collection parameters with factory functions
that allow the base class to handle all loading logic.

## Type Parameters

### TLibrary

`TLibrary`

The library type (e.g., `IngredientsLibrary`)

### TBaseId

`TBaseId` *extends* `string`

The base item ID type (e.g., `BaseIngredientId`)

### TItem

`TItem`

The item type stored in the collection (e.g., `Ingredient`)

## Properties

### builtInTreeProvider

> `readonly` **builtInTreeProvider**: [`SubLibraryBuiltInTreeProvider`](../type-aliases/SubLibraryBuiltInTreeProvider.md)

Defined in: [ts-chocolate/src/packlets/library-data/subLibrary.ts:324](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/subLibrary.ts#L324)

Function that provides the built-in library tree.
Used to load built-in collections.

***

### directoryNavigator

> `readonly` **directoryNavigator**: [`SubLibraryDirectoryNavigator`](../type-aliases/SubLibraryDirectoryNavigator.md)

Defined in: [ts-chocolate/src/packlets/library-data/subLibrary.ts:318](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/subLibrary.ts#L318)

Function that navigates from library root to the data directory.

***

### itemConverter

> `readonly` **itemConverter**: [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TItem`, `unknown`\> \| [`Validator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TItem`, `unknown`\>

Defined in: [ts-chocolate/src/packlets/library-data/subLibrary.ts:313](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/subLibrary.ts#L313)

Converter or validator for items within collections.

***

### itemIdConverter

> `readonly` **itemIdConverter**: [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TBaseId`, `unknown`\> \| [`Validator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TBaseId`, `unknown`\>

Defined in: [ts-chocolate/src/packlets/library-data/subLibrary.ts:308](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/subLibrary.ts#L308)

Converter or validator for item IDs within collections.

***

### libraryParams?

> `readonly` `optional` **libraryParams**: [`ISubLibraryParams`](ISubLibraryParams.md)\<`TLibrary`, [`SubLibraryEntryInit`](../type-aliases/SubLibraryEntryInit.md)\<`TBaseId`, `TItem`\>\>

Defined in: [ts-chocolate/src/packlets/library-data/subLibrary.ts:329](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/subLibrary.ts#L329)

Library creation parameters (builtin, fileSources, collections, mergeLibraries).

***

### logger?

> `readonly` `optional` **logger**: [`LogReporter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`unknown`, `unknown`\>

Defined in: [ts-chocolate/src/packlets/library-data/subLibrary.ts:332](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/subLibrary.ts#L332)

Optional logger for reporting loading progress and issues.
