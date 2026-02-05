[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Entities](../../../README.md) / [Inventory](../README.md) / IInventoryEntryEntityBase

# Interface: IInventoryEntryEntityBase

Defined in: [ts-chocolate/src/packlets/entities/inventory/model.ts:106](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/inventory/model.ts#L106)

Common properties shared by all inventory entry types.

## Extended by

- [`IIngredientInventoryEntryEntity`](../../../interfaces/IIngredientInventoryEntryEntity.md)
- [`IMoldInventoryEntryEntity`](../../../interfaces/IMoldInventoryEntryEntity.md)

## Properties

### inventoryType

> `readonly` **inventoryType**: [`InventoryType`](../../../type-aliases/InventoryType.md)

Defined in: [ts-chocolate/src/packlets/entities/inventory/model.ts:108](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/inventory/model.ts#L108)

Inventory type discriminator

***

### location?

> `readonly` `optional` **location**: `string`

Defined in: [ts-chocolate/src/packlets/entities/inventory/model.ts:110](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/inventory/model.ts#L110)

Optional storage location (e.g., 'pantry shelf 2', 'fridge', 'workshop cabinet')

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/entities/inventory/model.ts:112](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/inventory/model.ts#L112)

Optional categorized notes about this inventory item
