[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Entities](../../../README.md) / [Inventory](../README.md) / IngredientInventoryCollectionEntry

# Type Alias: IngredientInventoryCollectionEntry

> **IngredientInventoryCollectionEntry** = [`SubLibraryCollectionEntry`](../../../../LibraryData/type-aliases/SubLibraryCollectionEntry.md)\<[`IngredientInventoryEntryBaseId`](IngredientInventoryEntryBaseId.md), [`IIngredientInventoryEntryEntity`](../../../interfaces/IIngredientInventoryEntryEntity.md)\>

Defined in: [ts-chocolate/src/packlets/entities/inventory/collection.ts:91](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/inventory/collection.ts#L91)

A single entry in an ingredient inventory collection.
Keyed by the inventory entry's base ID (not the ingredient's ID).
The entry's `ingredientId` field contains the composite IngredientId of the ingredient being inventoried.
