[Home](../../README.md) > [Inventory](../README.md) > IInventoryEntryEntityBase

# Interface: IInventoryEntryEntityBase

Common properties shared by all inventory entry types.

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

[inventoryType](./IInventoryEntryEntityBase.inventoryType.md)

</td><td>

`readonly`

</td><td>

[InventoryType](../../type-aliases/InventoryType.md)

</td><td>

Inventory type discriminator

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
