[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Entities](../README.md) / IMoldInventoryEntryEntity

# Interface: IMoldInventoryEntryEntity

Defined in: [ts-chocolate/src/packlets/entities/inventory/model.ts:127](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/inventory/model.ts#L127)

Inventory entry for molds.

The moldId is the full composite ID (e.g., 'builtin.silicone-round')
identifying which specific mold from which collection is being inventoried.

## Extends

- [`IInventoryEntryEntityBase`](../namespaces/Inventory/interfaces/IInventoryEntryEntityBase.md)

## Properties

### count

> `readonly` **count**: `number`

Defined in: [ts-chocolate/src/packlets/entities/inventory/model.ts:132](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/inventory/model.ts#L132)

Number of this mold the user owns

***

### inventoryType

> `readonly` **inventoryType**: `"mold"`

Defined in: [ts-chocolate/src/packlets/entities/inventory/model.ts:128](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/inventory/model.ts#L128)

Inventory type discriminator

#### Overrides

[`IInventoryEntryEntityBase`](../namespaces/Inventory/interfaces/IInventoryEntryEntityBase.md).[`inventoryType`](../namespaces/Inventory/interfaces/IInventoryEntryEntityBase.md#inventorytype)

***

### location?

> `readonly` `optional` **location**: `string`

Defined in: [ts-chocolate/src/packlets/entities/inventory/model.ts:110](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/inventory/model.ts#L110)

Optional storage location (e.g., 'pantry shelf 2', 'fridge', 'workshop cabinet')

#### Inherited from

[`IInventoryEntryEntityBase`](../namespaces/Inventory/interfaces/IInventoryEntryEntityBase.md).[`location`](../namespaces/Inventory/interfaces/IInventoryEntryEntityBase.md#location)

***

### moldId

> `readonly` **moldId**: [`MoldId`](../../../../type-aliases/MoldId.md)

Defined in: [ts-chocolate/src/packlets/entities/inventory/model.ts:130](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/inventory/model.ts#L130)

The composite ID of the mold being inventoried (collection.baseId)

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/entities/inventory/model.ts:112](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/inventory/model.ts#L112)

Optional categorized notes about this inventory item

#### Inherited from

[`IInventoryEntryEntityBase`](../namespaces/Inventory/interfaces/IInventoryEntryEntityBase.md).[`notes`](../namespaces/Inventory/interfaces/IInventoryEntryEntityBase.md#notes)
