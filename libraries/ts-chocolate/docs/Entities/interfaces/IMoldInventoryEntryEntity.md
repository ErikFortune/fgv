[Home](../../README.md) > [Entities](../README.md) > IMoldInventoryEntryEntity

# Interface: IMoldInventoryEntryEntity

Inventory entry for molds.

The moldId is the full composite ID (e.g., 'builtin.silicone-round')
identifying which specific mold from which collection is being inventoried.

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

[inventoryType](./IMoldInventoryEntryEntity.inventoryType.md)

</td><td>

`readonly`

</td><td>

"mold"

</td><td>

Inventory type discriminator

</td></tr>
<tr><td>

[moldId](./IMoldInventoryEntryEntity.moldId.md)

</td><td>

`readonly`

</td><td>

[MoldId](../../type-aliases/MoldId.md)

</td><td>

The composite ID of the mold being inventoried (collection.baseId)

</td></tr>
<tr><td>

[count](./IMoldInventoryEntryEntity.count.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Number of this mold the user owns

</td></tr>
<tr><td>

[location](./IInventoryEntryEntityBase.location.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional storage location (e.g., 'pantry shelf 2', 'fridge', 'workshop cabinet')

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
