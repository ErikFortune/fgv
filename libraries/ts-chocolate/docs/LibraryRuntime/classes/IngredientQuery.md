[Home](../../README.md) > [LibraryRuntime](../README.md) > IngredientQuery

# Class: IngredientQuery

Fluent query builder for ingredients.
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

Creates a new IngredientQuery.

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

[chocolate()](./IngredientQuery.chocolate.md)

</td><td>



</td><td>

Filter to only chocolate ingredients.

</td></tr>
<tr><td>

[dairy()](./IngredientQuery.dairy.md)

</td><td>



</td><td>

Filter to only dairy ingredients.

</td></tr>
<tr><td>

[sugar()](./IngredientQuery.sugar.md)

</td><td>



</td><td>

Filter to only sugar ingredients.

</td></tr>
<tr><td>

[fat()](./IngredientQuery.fat.md)

</td><td>



</td><td>

Filter to only fat ingredients.

</td></tr>
<tr><td>

[alcohol()](./IngredientQuery.alcohol.md)

</td><td>



</td><td>

Filter to only alcohol ingredients.

</td></tr>
<tr><td>

[category(category)](./IngredientQuery.category.md)

</td><td>



</td><td>

Filter by specific category.

</td></tr>
<tr><td>

[chocolateType(type)](./IngredientQuery.chocolateType.md)

</td><td>



</td><td>

Filter by chocolate type.

</td></tr>
<tr><td>

[minCacao(percentage)](./IngredientQuery.minCacao.md)

</td><td>



</td><td>

Filter by minimum cacao percentage.

</td></tr>
<tr><td>

[maxCacao(percentage)](./IngredientQuery.maxCacao.md)

</td><td>



</td><td>

Filter by maximum cacao percentage.

</td></tr>
<tr><td>

[cacaoRange(min, max)](./IngredientQuery.cacaoRange.md)

</td><td>



</td><td>

Filter by cacao percentage range.

</td></tr>
<tr><td>

[forApplication(application)](./IngredientQuery.forApplication.md)

</td><td>



</td><td>

Filter by chocolate application.

</td></tr>
<tr><td>

[minFat(min)](./IngredientQuery.minFat.md)

</td><td>



</td><td>

Filter by minimum fat content (cacaoFat + milkFat + otherFats).

</td></tr>
<tr><td>

[maxFat(max)](./IngredientQuery.maxFat.md)

</td><td>



</td><td>

Filter by maximum fat content.

</td></tr>
<tr><td>

[fatRange(min, max)](./IngredientQuery.fatRange.md)

</td><td>



</td><td>

Filter by fat content range.

</td></tr>
<tr><td>

[maxWater(max)](./IngredientQuery.maxWater.md)

</td><td>



</td><td>

Filter by maximum water content.

</td></tr>
<tr><td>

[minWater(min)](./IngredientQuery.minWater.md)

</td><td>



</td><td>

Filter by minimum water content.

</td></tr>
<tr><td>

[withTag(tag)](./IngredientQuery.withTag.md)

</td><td>



</td><td>

Filter by tag (ingredient has this tag).

</td></tr>
<tr><td>

[withAnyTag(tags)](./IngredientQuery.withAnyTag.md)

</td><td>



</td><td>

Filter by any of the given tags.

</td></tr>
<tr><td>

[withAllTags(tags)](./IngredientQuery.withAllTags.md)

</td><td>



</td><td>

Filter by all of the given tags.

</td></tr>
<tr><td>

[byManufacturer(manufacturer)](./IngredientQuery.byManufacturer.md)

</td><td>



</td><td>

Filter by manufacturer.

</td></tr>
<tr><td>

[fromSource(sourceId)](./IngredientQuery.fromSource.md)

</td><td>



</td><td>

Filter by source.

</td></tr>
<tr><td>

[vegan()](./IngredientQuery.vegan.md)

</td><td>



</td><td>

Filter to only vegan ingredients.

</td></tr>
<tr><td>

[withoutAllergen(allergen)](./IngredientQuery.withoutAllergen.md)

</td><td>



</td><td>

Filter to ingredients without specific allergen.

</td></tr>
<tr><td>

[withoutAllergens(allergens)](./IngredientQuery.withoutAllergens.md)

</td><td>



</td><td>

Filter to ingredients without any of the specified allergens.

</td></tr>
<tr><td>

[withCertification(certification)](./IngredientQuery.withCertification.md)

</td><td>



</td><td>

Filter by certification.

</td></tr>
<tr><td>

[usedInFillings()](./IngredientQuery.usedInFillings.md)

</td><td>



</td><td>

Filter to ingredients used in at least one filling recipe.

</td></tr>
<tr><td>

[unused()](./IngredientQuery.unused.md)

</td><td>



</td><td>

Filter to ingredients not used in any filling recipe.

</td></tr>
<tr><td>

[usedInAtLeast(count)](./IngredientQuery.usedInAtLeast.md)

</td><td>



</td><td>

Filter to ingredients used in at least N filling recipes.

</td></tr>
<tr><td>

[nameContains(text)](./IngredientQuery.nameContains.md)

</td><td>



</td><td>

Search by name (case-insensitive partial match).

</td></tr>
<tr><td>

[descriptionContains(text)](./IngredientQuery.descriptionContains.md)

</td><td>



</td><td>

Search by description (case-insensitive partial match).

</td></tr>
<tr><td>

[where(predicate)](./IngredientQuery.where.md)

</td><td>



</td><td>

Apply a custom filter predicate.

</td></tr>
<tr><td>

[execute()](./IngredientQuery.execute.md)

</td><td>



</td><td>

Execute query and return matching ingredients.

</td></tr>
<tr><td>

[first()](./IngredientQuery.first.md)

</td><td>



</td><td>

Execute and return first matching ingredient.

</td></tr>
<tr><td>

[count()](./IngredientQuery.count.md)

</td><td>



</td><td>

Execute and return count of matching ingredients.

</td></tr>
<tr><td>

[exists()](./IngredientQuery.exists.md)

</td><td>



</td><td>

Check if any ingredients match the query.

</td></tr>
</tbody></table>
