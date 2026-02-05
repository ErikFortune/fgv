[Home](../../README.md) > [UserRuntime](../README.md) > IMoldInventoryEntry

# Interface: IMoldInventoryEntry

Materialized mold inventory entry with resolved mold reference.

**Extends:** [`IInventoryEntryBase<MoldInventoryEntryId, IMold, IMoldInventoryEntryEntity>`](../../interfaces/IInventoryEntryBase.md)

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

[id](./IInventoryEntryBase.id.md)

</td><td>

`readonly`

</td><td>

[MoldInventoryEntryId](../../type-aliases/MoldInventoryEntryId.md)

</td><td>

Composite inventory entry ID (collectionId.baseId)

</td></tr>
<tr><td>

[item](./IInventoryEntryBase.item.md)

</td><td>

`readonly`

</td><td>

[IMold](../../interfaces/IMold.md)

</td><td>

The resolved item being inventoried

</td></tr>
<tr><td>

[quantity](./IInventoryEntryBase.quantity.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Quantity on hand

</td></tr>
<tr><td>

[location](./IInventoryEntryBase.location.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional storage location

</td></tr>
<tr><td>

[notes](./IInventoryEntryBase.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](../../interfaces/ICategorizedNote.md)[]

</td><td>

Optional categorized notes

</td></tr>
<tr><td>

[entity](./IInventoryEntryBase.entity.md)

</td><td>

`readonly`

</td><td>

[IMoldInventoryEntryEntity](../../interfaces/IMoldInventoryEntryEntity.md)

</td><td>

The underlying entity

</td></tr>
</tbody></table>
