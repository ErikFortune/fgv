[Home](../../README.md) > [LibraryRuntime](../README.md) > FillingRecipe

# Class: FillingRecipe

A resolved view of a recipe with navigation and version access.
Immutable - does not allow modification of underlying data.

**Implements:** [`IFillingRecipe`](../../interfaces/IFillingRecipe.md)

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

[id](./FillingRecipe.id.md)

</td><td>

`readonly`

</td><td>

[FillingId](../../type-aliases/FillingId.md)

</td><td>

The composite recipe ID (e.g., "user.dark-ganache")

</td></tr>
<tr><td>

[collectionId](./FillingRecipe.collectionId.md)

</td><td>

`readonly`

</td><td>

[CollectionId](../../type-aliases/CollectionId.md)

</td><td>

The source ID part of the composite ID

</td></tr>
<tr><td>

[baseId](./FillingRecipe.baseId.md)

</td><td>

`readonly`

</td><td>

[BaseFillingId](../../type-aliases/BaseFillingId.md)

</td><td>

The base recipe ID within the source

</td></tr>
<tr><td>

[name](./FillingRecipe.name.md)

</td><td>

`readonly`

</td><td>

[FillingName](../../type-aliases/FillingName.md)

</td><td>

Human-readable recipe name

</td></tr>
<tr><td>

[description](./FillingRecipe.description.md)

</td><td>

`readonly`

</td><td>

string | undefined

</td><td>

Optional description of the recipe

</td></tr>
<tr><td>

[tags](./FillingRecipe.tags.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Tags for categorization and search

</td></tr>
<tr><td>

[goldenVersionSpec](./FillingRecipe.goldenVersionSpec.md)

</td><td>

`readonly`

</td><td>

[FillingRecipeVariationSpec](../../type-aliases/FillingRecipeVariationSpec.md)

</td><td>

The golden version ID

</td></tr>
<tr><td>

[goldenVersion](./FillingRecipe.goldenVersion.md)

</td><td>

`readonly`

</td><td>

[FillingRecipeVersion](../../classes/FillingRecipeVersion.md)

</td><td>

The golden (default approved) version - resolved.

</td></tr>
<tr><td>

[versions](./FillingRecipe.versions.md)

</td><td>

`readonly`

</td><td>

readonly [FillingRecipeVersion](../../classes/FillingRecipeVersion.md)[]

</td><td>

All versions - resolved.

</td></tr>
<tr><td>

[latestVersion](./FillingRecipe.latestVersion.md)

</td><td>

`readonly`

</td><td>

[FillingRecipeVersion](../../classes/FillingRecipeVersion.md)

</td><td>

Gets the latest version (by created date).

</td></tr>
<tr><td>

[versionCount](./FillingRecipe.versionCount.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Number of versions

</td></tr>
<tr><td>

[entity](./FillingRecipe.entity.md)

</td><td>

`readonly`

</td><td>

[IFillingRecipeEntity](../../interfaces/IFillingRecipeEntity.md)

</td><td>

Gets the underlying recipe data entity

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

[create(context, id, recipe)](./FillingRecipe.create.md)

</td><td>

`static`

</td><td>

Factory method for creating a FillingRecipe.

</td></tr>
<tr><td>

[getGoldenVersion()](./FillingRecipe.getGoldenVersion.md)

</td><td>



</td><td>

Gets the golden (default approved) version - resolved.

</td></tr>
<tr><td>

[getVersions()](./FillingRecipe.getVersions.md)

</td><td>



</td><td>

Gets all versions - resolved.

</td></tr>
<tr><td>

[getVersion(versionSpec)](./FillingRecipe.getVersion.md)

</td><td>



</td><td>

Gets a specific version by ID.

</td></tr>
<tr><td>

[getLatestVersion()](./FillingRecipe.getLatestVersion.md)

</td><td>



</td><td>

Gets the latest version (by created date).

</td></tr>
<tr><td>

[getIngredientIds(options)](./FillingRecipe.getIngredientIds.md)

</td><td>



</td><td>

Gets unique ingredient IDs used across all versions.

</td></tr>
<tr><td>

[usesIngredient(ingredientId, options)](./FillingRecipe.usesIngredient.md)

</td><td>



</td><td>

Checks if any version uses a specific ingredient.

</td></tr>
</tbody></table>
