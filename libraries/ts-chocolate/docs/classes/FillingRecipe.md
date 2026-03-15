[Home](../README.md) > FillingRecipe

# Class: FillingRecipe

A resolved view of a recipe with navigation and variation access.
Immutable - does not allow modification of underlying data.

**Implements:** [`IFillingRecipe`](../interfaces/IFillingRecipe.md)

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

[FillingId](../type-aliases/FillingId.md)

</td><td>

The composite recipe ID (e.g., "user.dark-ganache")

</td></tr>
<tr><td>

[collectionId](./FillingRecipe.collectionId.md)

</td><td>

`readonly`

</td><td>

[CollectionId](../type-aliases/CollectionId.md)

</td><td>

The source ID part of the composite ID

</td></tr>
<tr><td>

[isMutable](./FillingRecipe.isMutable.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether this recipe's collection is mutable.

</td></tr>
<tr><td>

[baseId](./FillingRecipe.baseId.md)

</td><td>

`readonly`

</td><td>

[BaseFillingId](../type-aliases/BaseFillingId.md)

</td><td>

The base recipe ID within the source

</td></tr>
<tr><td>

[name](./FillingRecipe.name.md)

</td><td>

`readonly`

</td><td>

[FillingName](../type-aliases/FillingName.md)

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

[goldenVariationSpec](./FillingRecipe.goldenVariationSpec.md)

</td><td>

`readonly`

</td><td>

[FillingRecipeVariationSpec](../type-aliases/FillingRecipeVariationSpec.md)

</td><td>

The golden variation ID

</td></tr>
<tr><td>

[goldenVariation](./FillingRecipe.goldenVariation.md)

</td><td>

`readonly`

</td><td>

[FillingRecipeVariation](FillingRecipeVariation.md)

</td><td>

The golden (default approved) variation - resolved.

</td></tr>
<tr><td>

[variations](./FillingRecipe.variations.md)

</td><td>

`readonly`

</td><td>

readonly [FillingRecipeVariation](FillingRecipeVariation.md)[]

</td><td>

All variations - resolved.

</td></tr>
<tr><td>

[latestVariation](./FillingRecipe.latestVariation.md)

</td><td>

`readonly`

</td><td>

[FillingRecipeVariation](FillingRecipeVariation.md)

</td><td>

Gets the latest variation (by created date).

</td></tr>
<tr><td>

[variationCount](./FillingRecipe.variationCount.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Number of variations

</td></tr>
<tr><td>

[entity](./FillingRecipe.entity.md)

</td><td>

`readonly`

</td><td>

[IFillingRecipeEntity](../interfaces/IFillingRecipeEntity.md)

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

[getGoldenVariation()](./FillingRecipe.getGoldenVariation.md)

</td><td>



</td><td>

Gets the golden (default approved) variation - resolved.

</td></tr>
<tr><td>

[getVariations()](./FillingRecipe.getVariations.md)

</td><td>



</td><td>

Gets all variations - resolved.

</td></tr>
<tr><td>

[getVariationFromEntity(entity)](./FillingRecipe.getVariationFromEntity.md)

</td><td>



</td><td>

Wraps an arbitrary variation entity using this recipe's context.

</td></tr>
<tr><td>

[getVariation(variationSpec)](./FillingRecipe.getVariation.md)

</td><td>



</td><td>

Gets a specific variation by ID.

</td></tr>
<tr><td>

[getLatestVariation()](./FillingRecipe.getLatestVariation.md)

</td><td>



</td><td>

Gets the latest variation (by created date).

</td></tr>
<tr><td>

[getIngredientIds(options)](./FillingRecipe.getIngredientIds.md)

</td><td>



</td><td>

Gets unique ingredient IDs used across all variations.

</td></tr>
<tr><td>

[usesIngredient(ingredientId, options)](./FillingRecipe.usesIngredient.md)

</td><td>



</td><td>

Checks if any variation uses a specific ingredient.

</td></tr>
</tbody></table>
