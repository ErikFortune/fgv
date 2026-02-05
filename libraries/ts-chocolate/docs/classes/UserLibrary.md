[Home](../README.md) > UserLibrary

# Class: UserLibrary

Aggregates user-specific data libraries.

Unlike ChocolateLibrary (shared data), UserLibrary contains only
user/installation-specific data with no built-in collections.

**Implements:** [`IUserLibrary`](../interfaces/IUserLibrary.md)

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

[logger](./UserLibrary.logger.md)

</td><td>

`readonly`

</td><td>

LogReporter&lt;unknown&gt;

</td><td>

Logger used by this library and its sub-libraries.

</td></tr>
<tr><td>

[journals](./UserLibrary.journals.md)

</td><td>

`readonly`

</td><td>

[JournalLibrary](JournalLibrary.md)

</td><td>

Journal library for production records.

</td></tr>
<tr><td>

[sessions](./UserLibrary.sessions.md)

</td><td>

`readonly`

</td><td>

[SessionLibrary](SessionLibrary.md)

</td><td>

Session library for persisted editing sessions.

</td></tr>
<tr><td>

[moldInventory](./UserLibrary.moldInventory.md)

</td><td>

`readonly`

</td><td>

[MoldInventoryLibrary](MoldInventoryLibrary.md)

</td><td>

Mold inventory library for tracking owned molds.

</td></tr>
<tr><td>

[ingredientInventory](./UserLibrary.ingredientInventory.md)

</td><td>

`readonly`

</td><td>

[IngredientInventoryLibrary](IngredientInventoryLibrary.md)

</td><td>

Ingredient inventory library for tracking ingredient stock.

</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[create(params)](./UserLibrary.create.md)

</td><td>

`static`

</td><td>

Creates a new UserLibrary.UserLibrary | UserLibrary instance.

</td></tr>
</tbody></table>
