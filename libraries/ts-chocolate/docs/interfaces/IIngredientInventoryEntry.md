[Home](../README.md) > IIngredientInventoryEntry

# Interface: IIngredientInventoryEntry

Materialized ingredient inventory entry with resolved ingredient reference.

**Extends:** [`IInventoryEntryBase<IngredientInventoryEntryId, IIngredient, IIngredientInventoryEntryEntity>`](IInventoryEntryBase.md)

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

[IngredientInventoryEntryId](../type-aliases/IngredientInventoryEntryId.md)

</td><td>

Composite inventory entry ID (collectionId.baseId)

</td></tr>
<tr><td>

[item](./IInventoryEntryBase.item.md)

</td><td>

`readonly`

</td><td>

[IIngredient](IIngredient.md)

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

readonly [ICategorizedNote](ICategorizedNote.md)[]

</td><td>

Optional categorized notes

</td></tr>
<tr><td>

[entity](./IInventoryEntryBase.entity.md)

</td><td>

`readonly`

</td><td>

[IIngredientInventoryEntryEntity](IIngredientInventoryEntryEntity.md)

</td><td>

The underlying entity

</td></tr>
</tbody></table>
