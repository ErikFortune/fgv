[Home](../../README.md) > [LibraryRuntime](../README.md) > IFillingRecipe

# Interface: IFillingRecipe

A resolved runtime view of a recipe with navigation and version access.

This interface provides runtime-layer access to recipe data with:
- Composite identity (`id`, `collectionId`) for cross-source references
- Resolved version access (full objects, not just entity data)
- Scaling and calculation operations
- Usage and ingredient queries
- Resolved procedure access

Note: Does not extend Entities.Fillings.IFillingRecipeEntity | IFillingRecipeEntity
directly because `versions` has a different type (resolved vs data layer entity versions).

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

[id](./IFillingRecipe.id.md)

</td><td>

`readonly`

</td><td>

[FillingId](../../type-aliases/FillingId.md)

</td><td>

The composite recipe ID (e.g., "user.dark-ganache").

</td></tr>
<tr><td>

[collectionId](./IFillingRecipe.collectionId.md)

</td><td>

`readonly`

</td><td>

[CollectionId](../../type-aliases/CollectionId.md)

</td><td>

The collection ID part of the composite ID.

</td></tr>
<tr><td>

[baseId](./IFillingRecipe.baseId.md)

</td><td>

`readonly`

</td><td>

[BaseFillingId](../../type-aliases/BaseFillingId.md)

</td><td>

The base recipe ID within the source.

</td></tr>
<tr><td>

[name](./IFillingRecipe.name.md)

</td><td>

`readonly`

</td><td>

[FillingName](../../type-aliases/FillingName.md)

</td><td>

Human-readable recipe name.

</td></tr>
<tr><td>

[description](./IFillingRecipe.description.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional description of the recipe.

</td></tr>
<tr><td>

[tags](./IFillingRecipe.tags.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Optional tags for categorization and search.

</td></tr>
<tr><td>

[goldenVersionSpec](./IFillingRecipe.goldenVersionSpec.md)

</td><td>

`readonly`

</td><td>

[FillingRecipeVariationSpec](../../type-aliases/FillingRecipeVariationSpec.md)

</td><td>

The ID of the golden (approved default) version.

</td></tr>
<tr><td>

[goldenVersion](./IFillingRecipe.goldenVersion.md)

</td><td>

`readonly`

</td><td>

[IFillingRecipeVersion](../../interfaces/IFillingRecipeVersion.md)

</td><td>

The golden (default approved) version - resolved.

</td></tr>
<tr><td>

[versions](./IFillingRecipe.versions.md)

</td><td>

`readonly`

</td><td>

readonly [IFillingRecipeVersion](../../interfaces/IFillingRecipeVersion.md)[]

</td><td>

All versions - resolved.

</td></tr>
<tr><td>

[latestVersion](./IFillingRecipe.latestVersion.md)

</td><td>

`readonly`

</td><td>

[IFillingRecipeVersion](../../interfaces/IFillingRecipeVersion.md)

</td><td>

Gets the latest version (by created date).

</td></tr>
<tr><td>

[versionCount](./IFillingRecipe.versionCount.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Number of versions.

</td></tr>
<tr><td>

[entity](./IFillingRecipe.entity.md)

</td><td>

`readonly`

</td><td>

[IFillingRecipeEntity](../../interfaces/IFillingRecipeEntity.md)

</td><td>

Gets the underlying filling recipe entity data.

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

[getVersion(versionSpec)](./IFillingRecipe.getVersion.md)

</td><td>



</td><td>

Gets a specific version by FillingRecipeVariationSpec | version specifier.

</td></tr>
<tr><td>

[getIngredientIds(options)](./IFillingRecipe.getIngredientIds.md)

</td><td>



</td><td>

Gets unique ingredient IDs used across all versions.

</td></tr>
<tr><td>

[usesIngredient(ingredientId, options)](./IFillingRecipe.usesIngredient.md)

</td><td>



</td><td>

Checks if any version uses a specific ingredient.

</td></tr>
</tbody></table>
