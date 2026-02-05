[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / ISubLibraryAsyncLoadResult

# Interface: ISubLibraryAsyncLoadResult\<TBaseId, TItem\>

Defined in: [ts-chocolate/src/packlets/library-data/subLibrary.ts:266](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-data/subLibrary.ts#L266)

Result from async collection loading operations.

Contains both successfully loaded collections and protected collections
that were captured but could not be decrypted (e.g., due to missing keys).

## Type Parameters

### TBaseId

`TBaseId` *extends* `string`

The base item ID type (e.g., `BaseIngredientId`)

### TItem

`TItem`

The item type stored in the collection (e.g., `Ingredient`)

## Properties

### collections

> `readonly` **collections**: readonly [`SubLibraryEntryInit`](../type-aliases/SubLibraryEntryInit.md)\<`TBaseId`, `TItem`\>[]

Defined in: [ts-chocolate/src/packlets/library-data/subLibrary.ts:270](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-data/subLibrary.ts#L270)

Successfully loaded collections ready to be added to the library.

***

### protectedCollections

> `readonly` **protectedCollections**: readonly [`IProtectedCollectionInternal`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs)\<[`CollectionId`](../../../../type-aliases/CollectionId.md)\>[]

Defined in: [ts-chocolate/src/packlets/library-data/subLibrary.ts:276](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-data/subLibrary.ts#L276)

Protected collections that were captured but not decrypted.
These can be decrypted later using `loadProtectedCollectionAsync`.
