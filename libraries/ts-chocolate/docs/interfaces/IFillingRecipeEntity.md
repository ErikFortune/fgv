[Home](../README.md) > IFillingRecipeEntity

# Interface: IFillingRecipeEntity

Complete filling recipe with all variations

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

[baseId](./IFillingRecipeEntity.baseId.md)

</td><td>

`readonly`

</td><td>

[BaseFillingId](../type-aliases/BaseFillingId.md)

</td><td>

Base filling recipe identifier (unique within source)

</td></tr>
<tr><td>

[name](./IFillingRecipeEntity.name.md)

</td><td>

`readonly`

</td><td>

[FillingName](../type-aliases/FillingName.md)

</td><td>

Human-readable filling recipe name

</td></tr>
<tr><td>

[category](./IFillingRecipeEntity.category.md)

</td><td>

`readonly`

</td><td>

[FillingCategory](../type-aliases/FillingCategory.md)

</td><td>

Category for classifying the filling recipe type

</td></tr>
<tr><td>

[description](./IFillingRecipeEntity.description.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional description of the filling recipe

</td></tr>
<tr><td>

[tags](./IFillingRecipeEntity.tags.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Optional tags for categorization and search

</td></tr>
<tr><td>

[variations](./IFillingRecipeEntity.variations.md)

</td><td>

`readonly`

</td><td>

readonly [IFillingRecipeVariationEntity](IFillingRecipeVariationEntity.md)[]

</td><td>

Variations

</td></tr>
<tr><td>

[goldenVariationSpec](./IFillingRecipeEntity.goldenVariationSpec.md)

</td><td>

`readonly`

</td><td>

[FillingRecipeVariationSpec](../type-aliases/FillingRecipeVariationSpec.md)

</td><td>

The ID of the golden (approved default) variation

</td></tr>
<tr><td>

[derivedFrom](./IFillingRecipeEntity.derivedFrom.md)

</td><td>

`readonly`

</td><td>

[IFillingDerivationEntity](IFillingDerivationEntity.md)

</td><td>

Optional derivation info - tracks lineage if this filling recipe was forked

</td></tr>
<tr><td>

[urls](./IFillingRecipeEntity.urls.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedUrl](ICategorizedUrl.md)[]

</td><td>

Optional categorized URLs for external resources (tutorials, videos, etc.)

</td></tr>
</tbody></table>
