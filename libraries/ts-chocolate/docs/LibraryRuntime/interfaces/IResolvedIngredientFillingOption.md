[Home](../../README.md) > [LibraryRuntime](../README.md) > IResolvedIngredientFillingOption

# Interface: IResolvedIngredientFillingOption

Resolved ingredient filling option.

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

[type](./IResolvedIngredientFillingOption.type.md)

</td><td>

`readonly`

</td><td>

"ingredient"

</td><td>

Discriminator for type-safe access

</td></tr>
<tr><td>

[id](./IResolvedIngredientFillingOption.id.md)

</td><td>

`readonly`

</td><td>

[IngredientId](../../type-aliases/IngredientId.md)

</td><td>

The ingredient ID (satisfies IHasId for IOptionsWithPreferred)

</td></tr>
<tr><td>

[ingredient](./IResolvedIngredientFillingOption.ingredient.md)

</td><td>

`readonly`

</td><td>

[IIngredient](../../interfaces/IIngredient.md)

</td><td>

The resolved ingredient object

</td></tr>
<tr><td>

[notes](./IResolvedIngredientFillingOption.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](../../interfaces/ICategorizedNote.md)[]

</td><td>

Optional notes specific to this filling option

</td></tr>
<tr><td>

[entity](./IResolvedIngredientFillingOption.entity.md)

</td><td>

`readonly`

</td><td>

[IIngredientFillingOptionEntity](../../interfaces/IIngredientFillingOptionEntity.md)

</td><td>

The original ingredient filling option entity data

</td></tr>
</tbody></table>
