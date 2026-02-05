[Home](../README.md) > IResolvedRecipeFillingOption

# Interface: IResolvedRecipeFillingOption

Resolved recipe filling option.

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

[type](./IResolvedRecipeFillingOption.type.md)

</td><td>

`readonly`

</td><td>

"recipe"

</td><td>

Discriminator for type-safe access

</td></tr>
<tr><td>

[id](./IResolvedRecipeFillingOption.id.md)

</td><td>

`readonly`

</td><td>

[FillingId](../type-aliases/FillingId.md)

</td><td>

The filling ID (satisfies IHasId for IOptionsWithPreferred)

</td></tr>
<tr><td>

[filling](./IResolvedRecipeFillingOption.filling.md)

</td><td>

`readonly`

</td><td>

[IFillingRecipe](IFillingRecipe.md)

</td><td>

The resolved filling recipe object

</td></tr>
<tr><td>

[notes](./IResolvedRecipeFillingOption.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](ICategorizedNote.md)[]

</td><td>

Optional notes specific to this filling option

</td></tr>
<tr><td>

[entity](./IResolvedRecipeFillingOption.entity.md)

</td><td>

`readonly`

</td><td>

[IRecipeFillingOptionEntity](IRecipeFillingOptionEntity.md)

</td><td>

The original recipe filling option entity data

</td></tr>
</tbody></table>
