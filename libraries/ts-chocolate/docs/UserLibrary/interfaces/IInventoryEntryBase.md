[Home](../../README.md) > [UserLibrary](../README.md) > IInventoryEntryBase

# Interface: IInventoryEntryBase

Base interface for materialized inventory entries with resolved references.

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

TId

</td><td>

Composite inventory entry ID (collectionId.baseId)

</td></tr>
<tr><td>

[item](./IInventoryEntryBase.item.md)

</td><td>

`readonly`

</td><td>

TItem

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

[ILocation](../../interfaces/ILocation.md)

</td><td>

Optional resolved storage location

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

TEntity

</td><td>

The underlying entity

</td></tr>
</tbody></table>
