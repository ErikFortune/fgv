[Home](../../README.md) > [Confections](../README.md) > IIngredientFillingOptionEntity

# Interface: IIngredientFillingOptionEntity

Ingredient filling option - references an ingredient (e.g., praline paste)

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

[type](./IIngredientFillingOptionEntity.type.md)

</td><td>

`readonly`

</td><td>

"ingredient"

</td><td>

Discriminator for ingredient filling

</td></tr>
<tr><td>

[id](./IIngredientFillingOptionEntity.id.md)

</td><td>

`readonly`

</td><td>

[IngredientId](../../type-aliases/IngredientId.md)

</td><td>

The ingredient ID

</td></tr>
<tr><td>

[notes](./IIngredientFillingOptionEntity.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](../../interfaces/ICategorizedNote.md)[]

</td><td>

Optional categorized notes specific to this filling option

</td></tr>
</tbody></table>
