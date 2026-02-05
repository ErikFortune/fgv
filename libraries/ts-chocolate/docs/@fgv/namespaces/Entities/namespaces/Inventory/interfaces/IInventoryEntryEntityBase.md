[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Entities](../../../README.md) / [Inventory](../README.md) / IInventoryEntryEntityBase

# Interface: IInventoryEntryEntityBase

Defined in: [ts-chocolate/src/packlets/entities/inventory/model.ts:106](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/inventory/model.ts#L106)

Common properties shared by all inventory entry types.

## Extended by

- [`IIngredientInventoryEntryEntity`](../../../interfaces/IIngredientInventoryEntryEntity.md)
- [`IMoldInventoryEntryEntity`](../../../interfaces/IMoldInventoryEntryEntity.md)

## Properties

### inventoryType

> `readonly` **inventoryType**: [`InventoryType`](../../../type-aliases/InventoryType.md)

Defined in: [ts-chocolate/src/packlets/entities/inventory/model.ts:108](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/inventory/model.ts#L108)

Inventory type discriminator

***

### location?

> `readonly` `optional` **location**: `string`

Defined in: [ts-chocolate/src/packlets/entities/inventory/model.ts:110](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/inventory/model.ts#L110)

Optional storage location (e.g., 'pantry shelf 2', 'fridge', 'workshop cabinet')

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/entities/inventory/model.ts:112](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/inventory/model.ts#L112)

Optional categorized notes about this inventory item
