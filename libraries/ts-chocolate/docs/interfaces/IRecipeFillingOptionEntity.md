[Home](../README.md) > IRecipeFillingOptionEntity

# Interface: IRecipeFillingOptionEntity

Recipe filling option - references a recipe (e.g., ganache)

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

[type](./IRecipeFillingOptionEntity.type.md)

</td><td>

`readonly`

</td><td>

"recipe"

</td><td>

Discriminator for recipe filling

</td></tr>
<tr><td>

[id](./IRecipeFillingOptionEntity.id.md)

</td><td>

`readonly`

</td><td>

[FillingId](../type-aliases/FillingId.md)

</td><td>

The filling recipe ID

</td></tr>
<tr><td>

[notes](./IRecipeFillingOptionEntity.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](ICategorizedNote.md)[]

</td><td>

Optional categorized notes specific to this filling option

</td></tr>
</tbody></table>
