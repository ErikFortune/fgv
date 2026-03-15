[Home](../../README.md) > [Entities](../README.md) > IIngredientInventoryEntryEntity

# Interface: IIngredientInventoryEntryEntity

Inventory entry for ingredients.

The ingredientId is the full composite ID (e.g., 'builtin.cocoa-butter')
identifying which specific ingredient from which collection is being inventoried.

**Extends:** [`IInventoryEntryEntityBase`](../../interfaces/IInventoryEntryEntityBase.md)

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[inventoryType](./IIngredientInventoryEntryEntity.inventoryType.md)

</td><td>

`readonly`

</td><td>

"ingredient"

</td><td>

Inventory type discriminator

</td></tr>
<tr><td>

[ingredientId](./IIngredientInventoryEntryEntity.ingredientId.md)

</td><td>

`readonly`

</td><td>

[IngredientId](../../type-aliases/IngredientId.md)

</td><td>

The composite ID of the ingredient being inventoried (collection.baseId)

</td></tr>
<tr><td>

[quantity](./IIngredientInventoryEntryEntity.quantity.md)

</td><td>

`readonly`

</td><td>

[Measurement](../../type-aliases/Measurement.md)

</td><td>

Quantity on hand

</td></tr>
<tr><td>

[unit](./IIngredientInventoryEntryEntity.unit.md)

</td><td>

`readonly`

</td><td>

[MeasurementUnit](../../type-aliases/MeasurementUnit.md)

</td><td>

Unit for the quantity (defaults to 'g' if not specified)

</td></tr>
<tr><td>

[locationId](./IInventoryEntryEntityBase.locationId.md)

</td><td>

`readonly`

</td><td>

[LocationId](../../type-aliases/LocationId.md)

</td><td>

Optional location reference (collection.baseId)

</td></tr>
<tr><td>

[notes](./IInventoryEntryEntityBase.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](../../interfaces/ICategorizedNote.md)[]

</td><td>

Optional categorized notes about this inventory item

</td></tr>
</tbody></table>
