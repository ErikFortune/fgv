[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Entities](../../../README.md) / [Inventory](../README.md) / MoldInventoryCollectionEntry

# Type Alias: MoldInventoryCollectionEntry

> **MoldInventoryCollectionEntry** = [`SubLibraryCollectionEntry`](../../../../LibraryData/type-aliases/SubLibraryCollectionEntry.md)\<[`MoldInventoryEntryBaseId`](MoldInventoryEntryBaseId.md), [`IMoldInventoryEntryEntity`](../../../interfaces/IMoldInventoryEntryEntity.md)\>

Defined in: [ts-chocolate/src/packlets/entities/inventory/collection.ts:49](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/inventory/collection.ts#L49)

A single entry in a mold inventory collection.
Keyed by the inventory entry's base ID (not the mold's ID).
The entry's `moldId` field contains the composite MoldId of the mold being inventoried.
