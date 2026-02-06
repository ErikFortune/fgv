[Home](../README.md) > IUserEntityLibrary

# Interface: IUserEntityLibrary

User-specific library data (journals, sessions, inventory).
Separate from shared library data (ingredients, recipes, etc.).

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

[journals](./IUserEntityLibrary.journals.md)

</td><td>

`readonly`

</td><td>

[JournalLibrary](../classes/JournalLibrary.md)

</td><td>

Journal library for production records.

</td></tr>
<tr><td>

[sessions](./IUserEntityLibrary.sessions.md)

</td><td>

`readonly`

</td><td>

[SessionLibrary](../classes/SessionLibrary.md)

</td><td>

Session library for persisted editing sessions.

</td></tr>
<tr><td>

[moldInventory](./IUserEntityLibrary.moldInventory.md)

</td><td>

`readonly`

</td><td>

[MoldInventoryLibrary](../classes/MoldInventoryLibrary.md)

</td><td>

Mold inventory library for tracking owned molds.

</td></tr>
<tr><td>

[ingredientInventory](./IUserEntityLibrary.ingredientInventory.md)

</td><td>

`readonly`

</td><td>

[IngredientInventoryLibrary](../classes/IngredientInventoryLibrary.md)

</td><td>

Ingredient inventory library for tracking ingredient stock.

</td></tr>
</tbody></table>
