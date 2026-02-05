[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / ISubLibraryParams

# Interface: ISubLibraryParams\<TLibrary, TEntryInit\>

Defined in: [ts-chocolate/src/packlets/library-data/subLibrary.ts:180](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/subLibrary.ts#L180)

Parameters for creating a sub-library instance.

## Extended by

- [`ISubLibraryAsyncParams`](ISubLibraryAsyncParams.md)

## Type Parameters

### TLibrary

`TLibrary`

The library type (e.g., `IngredientsLibrary`)

### TEntryInit

`TEntryInit`

The collection entry initialization type (e.g., `IngredientCollectionEntryInit`)

## Properties

### builtin?

> `readonly` `optional` **builtin**: [`LibraryLoadSpec`](../type-aliases/LibraryLoadSpec.md)\<[`CollectionId`](../../../../type-aliases/CollectionId.md)\>

Defined in: [ts-chocolate/src/packlets/library-data/subLibrary.ts:190](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/subLibrary.ts#L190)

Controls which built-in collections are loaded.
Built-in collections are always immutable.

- `true` (default): Load all built-in collections.
- `false`: Load no built-in collections.
- `SourceId[]`: Load only the specified built-in collections by name.
- `ILibraryLoadParams`: Fine-grained control using include/exclude patterns.

***

### collections?

> `readonly` `optional` **collections**: readonly `TEntryInit`[]

Defined in: [ts-chocolate/src/packlets/library-data/subLibrary.ts:203](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/subLibrary.ts#L203)

Optional additional collections.
Each collection can be provided as a JSON entry or pre-built entry.

***

### fileSources?

> `readonly` `optional` **fileSources**: [`SubLibraryFileTreeSource`](../type-aliases/SubLibraryFileTreeSource.md) \| readonly [`SubLibraryFileTreeSource`](../type-aliases/SubLibraryFileTreeSource.md)[]

Defined in: [ts-chocolate/src/packlets/library-data/subLibrary.ts:197](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/subLibrary.ts#L197)

File tree sources to load collections from.
Collections are loaded and merged with built-in collections.
Duplicate collection IDs across sources cause an error.

***

### logger?

> `readonly` `optional` **logger**: [`LogReporter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`unknown`, `unknown`\>

Defined in: [ts-chocolate/src/packlets/library-data/subLibrary.ts:222](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/subLibrary.ts#L222)

Optional logger for reporting loading progress and issues.

***

### mergeLibraries?

> `readonly` `optional` **mergeLibraries**: [`SubLibraryMergeSource`](../type-aliases/SubLibraryMergeSource.md)\<`TLibrary`\> \| readonly [`SubLibraryMergeSource`](../type-aliases/SubLibraryMergeSource.md)\<`TLibrary`\>[]

Defined in: [ts-chocolate/src/packlets/library-data/subLibrary.ts:217](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/subLibrary.ts#L217)

Existing libraries to merge collections from.

Collections are extracted from these libraries and merged with
builtin, file source, and explicit collections. Collection ID
collisions across any sources cause an error.

Can be:
- A single library (merges all collections)
- An `IMergeLibrarySource` object with optional filtering
- An array of the above

***

### protectedCollections?

> `readonly` `optional` **protectedCollections**: readonly [`IProtectedCollectionInternal`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs)\<[`CollectionId`](../../../../type-aliases/CollectionId.md)\>[]

Defined in: [ts-chocolate/src/packlets/library-data/subLibrary.ts:233](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/subLibrary.ts#L233)

Protected collections that were captured during loading.

These are encrypted collections that could not be decrypted (e.g., due to missing keys).
They can be decrypted later using `loadProtectedCollectionAsync`.

This field is typically populated by `loadAllCollectionsAsync` and passed to
the constructor by derived class `createAsync()` methods.
