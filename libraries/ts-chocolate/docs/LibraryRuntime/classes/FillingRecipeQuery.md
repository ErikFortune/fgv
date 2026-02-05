[Home](../../README.md) > [LibraryRuntime](../README.md) > FillingRecipeQuery

# Class: FillingRecipeQuery

Fluent query builder for recipes.
Allows chaining filters to build complex queries.

## Constructors

<table><thead><tr><th>

Constructor

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

`constructor(context)`

</td><td>



</td><td>

Creates a new FillingRecipeQuery.

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

[withIngredient(ingredientId)](./FillingRecipeQuery.withIngredient.md)

</td><td>



</td><td>

Filter to recipes using a specific ingredient (any version, as primary).

</td></tr>
<tr><td>

[withAnyIngredient(ingredientIds)](./FillingRecipeQuery.withAnyIngredient.md)

</td><td>



</td><td>

Filter to recipes using any of the given ingredients.

</td></tr>
<tr><td>

[withAllIngredients(ingredientIds)](./FillingRecipeQuery.withAllIngredients.md)

</td><td>



</td><td>

Filter to recipes using all of the given ingredients.

</td></tr>
<tr><td>

[withoutIngredient(ingredientId)](./FillingRecipeQuery.withoutIngredient.md)

</td><td>



</td><td>

Filter to recipes NOT using a specific ingredient.

</td></tr>
<tr><td>

[withDarkChocolate()](./FillingRecipeQuery.withDarkChocolate.md)

</td><td>



</td><td>

Filter to recipes containing dark chocolate (in golden version).

</td></tr>
<tr><td>

[withMilkChocolate()](./FillingRecipeQuery.withMilkChocolate.md)

</td><td>



</td><td>

Filter to recipes containing milk chocolate.

</td></tr>
<tr><td>

[withWhiteChocolate()](./FillingRecipeQuery.withWhiteChocolate.md)

</td><td>



</td><td>

Filter to recipes containing white chocolate.

</td></tr>
<tr><td>

[withRubyChocolate()](./FillingRecipeQuery.withRubyChocolate.md)

</td><td>



</td><td>

Filter to recipes containing ruby chocolate.

</td></tr>
<tr><td>

[withChocolateType(type)](./FillingRecipeQuery.withChocolateType.md)

</td><td>



</td><td>

Filter by any chocolate type.

</td></tr>
<tr><td>

[withTag(tag)](./FillingRecipeQuery.withTag.md)

</td><td>



</td><td>

Filter by tag.

</td></tr>
<tr><td>

[withAnyTag(tags)](./FillingRecipeQuery.withAnyTag.md)

</td><td>



</td><td>

Filter by any of the given tags.

</td></tr>
<tr><td>

[withAllTags(tags)](./FillingRecipeQuery.withAllTags.md)

</td><td>



</td><td>

Filter by all of the given tags.

</td></tr>
<tr><td>

[fromSource(sourceId)](./FillingRecipeQuery.fromSource.md)

</td><td>



</td><td>

Filter by source.

</td></tr>
<tr><td>

[ganacheFatContent(min, max)](./FillingRecipeQuery.ganacheFatContent.md)

</td><td>



</td><td>

Filter by ganache fat content range.

</td></tr>
<tr><td>

[validGanache()](./FillingRecipeQuery.validGanache.md)

</td><td>



</td><td>

Filter to recipes with valid ganache characteristics.

</td></tr>
<tr><td>

[ganacheWithWarnings()](./FillingRecipeQuery.ganacheWithWarnings.md)

</td><td>



</td><td>

Filter to recipes with ganache warnings (but still valid).

</td></tr>
<tr><td>

[hasMultipleVersions()](./FillingRecipeQuery.hasMultipleVersions.md)

</td><td>



</td><td>

Filter to recipes with multiple versions.

</td></tr>
<tr><td>

[minVersions(count)](./FillingRecipeQuery.minVersions.md)

</td><td>



</td><td>

Filter by minimum version count.

</td></tr>
<tr><td>

[nameContains(text)](./FillingRecipeQuery.nameContains.md)

</td><td>



</td><td>

Search by name (case-insensitive partial match).

</td></tr>
<tr><td>

[descriptionContains(text)](./FillingRecipeQuery.descriptionContains.md)

</td><td>



</td><td>

Search by description (case-insensitive partial match).

</td></tr>
<tr><td>

[where(predicate)](./FillingRecipeQuery.where.md)

</td><td>



</td><td>

Apply a custom filter predicate.

</td></tr>
<tr><td>

[execute()](./FillingRecipeQuery.execute.md)

</td><td>



</td><td>

Execute query and return matching recipes.

</td></tr>
<tr><td>

[first()](./FillingRecipeQuery.first.md)

</td><td>



</td><td>

Execute and return first matching recipe.

</td></tr>
<tr><td>

[count()](./FillingRecipeQuery.count.md)

</td><td>



</td><td>

Execute and return count of matching recipes.

</td></tr>
<tr><td>

[exists()](./FillingRecipeQuery.exists.md)

</td><td>



</td><td>

Check if any recipes match the query.

</td></tr>
</tbody></table>
