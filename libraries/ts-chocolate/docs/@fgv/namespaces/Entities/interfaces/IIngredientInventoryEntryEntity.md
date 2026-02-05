[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Entities](../README.md) / IIngredientInventoryEntryEntity

# Interface: IIngredientInventoryEntryEntity

Defined in: [ts-chocolate/src/packlets/entities/inventory/model.ts:147](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/inventory/model.ts#L147)

Inventory entry for ingredients.

The ingredientId is the full composite ID (e.g., 'builtin.cocoa-butter')
identifying which specific ingredient from which collection is being inventoried.

## Extends

- [`IInventoryEntryEntityBase`](../namespaces/Inventory/interfaces/IInventoryEntryEntityBase.md)

## Properties

### ingredientId

> `readonly` **ingredientId**: [`IngredientId`](../../../../type-aliases/IngredientId.md)

Defined in: [ts-chocolate/src/packlets/entities/inventory/model.ts:150](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/inventory/model.ts#L150)

The composite ID of the ingredient being inventoried (collection.baseId)

***

### inventoryType

> `readonly` **inventoryType**: `"ingredient"`

Defined in: [ts-chocolate/src/packlets/entities/inventory/model.ts:148](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/inventory/model.ts#L148)

Inventory type discriminator

#### Overrides

[`IInventoryEntryEntityBase`](../namespaces/Inventory/interfaces/IInventoryEntryEntityBase.md).[`inventoryType`](../namespaces/Inventory/interfaces/IInventoryEntryEntityBase.md#inventorytype)

***

### location?

> `readonly` `optional` **location**: `string`

Defined in: [ts-chocolate/src/packlets/entities/inventory/model.ts:110](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/inventory/model.ts#L110)

Optional storage location (e.g., 'pantry shelf 2', 'fridge', 'workshop cabinet')

#### Inherited from

[`IInventoryEntryEntityBase`](../namespaces/Inventory/interfaces/IInventoryEntryEntityBase.md).[`location`](../namespaces/Inventory/interfaces/IInventoryEntryEntityBase.md#location)

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/entities/inventory/model.ts:112](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/inventory/model.ts#L112)

Optional categorized notes about this inventory item

#### Inherited from

[`IInventoryEntryEntityBase`](../namespaces/Inventory/interfaces/IInventoryEntryEntityBase.md).[`notes`](../namespaces/Inventory/interfaces/IInventoryEntryEntityBase.md#notes)

***

### quantity

> `readonly` **quantity**: [`Measurement`](../../../../type-aliases/Measurement.md)

Defined in: [ts-chocolate/src/packlets/entities/inventory/model.ts:152](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/inventory/model.ts#L152)

Quantity on hand

***

### unit?

> `readonly` `optional` **unit**: [`MeasurementUnit`](../../../../type-aliases/MeasurementUnit.md)

Defined in: [ts-chocolate/src/packlets/entities/inventory/model.ts:154](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/inventory/model.ts#L154)

Unit for the quantity (defaults to 'g' if not specified)
