[Home](../../README.md) > [Entities](../README.md) > IDecorationEntity

# Interface: IDecorationEntity

A decoration entity — a first-class library entity describing a confection decoration.
Includes ingredients (e.g., colored cocoa butter, gold leaf), optional procedures,
ratings, notes, and tags.

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

[baseId](./IDecorationEntity.baseId.md)

</td><td>

`readonly`

</td><td>

[BaseDecorationId](../../type-aliases/BaseDecorationId.md)

</td><td>

Base identifier within collection (no dots)

</td></tr>
<tr><td>

[name](./IDecorationEntity.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Human-readable name of the decoration

</td></tr>
<tr><td>

[description](./IDecorationEntity.description.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional description of the decoration

</td></tr>
<tr><td>

[ingredients](./IDecorationEntity.ingredients.md)

</td><td>

`readonly`

</td><td>

readonly [IDecorationIngredientEntity](../../interfaces/IDecorationIngredientEntity.md)[]

</td><td>

Ingredients used in this decoration

</td></tr>
<tr><td>

[procedures](./IDecorationEntity.procedures.md)

</td><td>

`readonly`

</td><td>

[IOptionsWithPreferred](../../interfaces/IOptionsWithPreferred.md)&lt;[IProcedureRefEntity](../../type-aliases/IProcedureRefEntity.md), [ProcedureId](../../type-aliases/ProcedureId.md)&gt;

</td><td>

Optional procedures with preferred selection

</td></tr>
<tr><td>

[ratings](./IDecorationEntity.ratings.md)

</td><td>

`readonly`

</td><td>

readonly [IDecorationRating](../../interfaces/IDecorationRating.md)[]

</td><td>

Optional ratings for this decoration

</td></tr>
<tr><td>

[tags](./IDecorationEntity.tags.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Optional tags for categorization and search

</td></tr>
<tr><td>

[notes](./IDecorationEntity.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](../../interfaces/ICategorizedNote.md)[]

</td><td>

Optional categorized notes about this decoration

</td></tr>
</tbody></table>
