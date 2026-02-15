[Home](../README.md) > IChocolateIngredient

# Interface: IChocolateIngredient

Runtime ingredient narrowed to chocolate type.

**Extends:** [`IIngredient<IChocolateIngredientEntity>`](IIngredient.md)

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

[category](./IChocolateIngredient.category.md)

</td><td>

`readonly`

</td><td>

"chocolate"

</td><td>

Category is always chocolate for this type

</td></tr>
<tr><td>

[chocolateType](./IChocolateIngredient.chocolateType.md)

</td><td>

`readonly`

</td><td>

[ChocolateType](../type-aliases/ChocolateType.md)

</td><td>

Type of chocolate

</td></tr>
<tr><td>

[cacaoPercentage](./IChocolateIngredient.cacaoPercentage.md)

</td><td>

`readonly`

</td><td>

[Percentage](../type-aliases/Percentage.md)

</td><td>

Cacao percentage (e.g., 70 for 70% dark)

</td></tr>
<tr><td>

[fluidityStars](./IChocolateIngredient.fluidityStars.md)

</td><td>

`readonly`

</td><td>

[FluidityStars](../type-aliases/FluidityStars.md)

</td><td>

Fluidity in Callebaut star ratings (optional)

</td></tr>
<tr><td>

[viscosityMcM](./IChocolateIngredient.viscosityMcM.md)

</td><td>

`readonly`

</td><td>

[DegreesMacMichael](../type-aliases/DegreesMacMichael.md)

</td><td>

Viscosity in MacMichael degrees (optional)

</td></tr>
<tr><td>

[temperatureCurve](./IChocolateIngredient.temperatureCurve.md)

</td><td>

`readonly`

</td><td>

[ITemperatureCurve](ITemperatureCurve.md)

</td><td>

Tempering curve (optional)

</td></tr>
<tr><td>

[beanVarieties](./IChocolateIngredient.beanVarieties.md)

</td><td>

`readonly`

</td><td>

readonly [CacaoVariety](../type-aliases/CacaoVariety.md)[]

</td><td>

Bean varieties used in the chocolate (optional)

</td></tr>
<tr><td>

[applications](./IChocolateIngredient.applications.md)

</td><td>

`readonly`

</td><td>

readonly [ChocolateApplication](../type-aliases/ChocolateApplication.md)[]

</td><td>

Recommended applications for this chocolate (optional)

</td></tr>
<tr><td>

[origins](./IChocolateIngredient.origins.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Origin of the chocolate (optional)

</td></tr>
<tr><td>

[entity](./IChocolateIngredient.entity.md)

</td><td>

`readonly`

</td><td>

[IChocolateIngredientEntity](IChocolateIngredientEntity.md)

</td><td>

Gets the underlying ingredient entity data.

</td></tr>
<tr><td>

[id](./IIngredient.id.md)

</td><td>

`readonly`

</td><td>

[IngredientId](../type-aliases/IngredientId.md)

</td><td>

The composite ingredient ID (e.g., "felchlin.maracaibo-65").

</td></tr>
<tr><td>

[collectionId](./IIngredient.collectionId.md)

</td><td>

`readonly`

</td><td>

[CollectionId](../type-aliases/CollectionId.md)

</td><td>

The collection ID part of the composite ID.

</td></tr>
<tr><td>

[baseId](./IIngredient.baseId.md)

</td><td>

`readonly`

</td><td>

[BaseIngredientId](../type-aliases/BaseIngredientId.md)

</td><td>

The base ingredient ID within the source.

</td></tr>
<tr><td>

[name](./IIngredient.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Display name

</td></tr>
<tr><td>

[ganacheCharacteristics](./IIngredient.ganacheCharacteristics.md)

</td><td>

`readonly`

</td><td>

[IGanacheCharacteristics](IGanacheCharacteristics.md)

</td><td>

Ganache-relevant characteristics

</td></tr>
<tr><td>

[description](./IIngredient.description.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional description

</td></tr>
<tr><td>

[manufacturer](./IIngredient.manufacturer.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional manufacturer

</td></tr>
<tr><td>

[allergens](./IIngredient.allergens.md)

</td><td>

`readonly`

</td><td>

readonly [Allergen](../type-aliases/Allergen.md)[]

</td><td>

Optional list of common allergens present in the ingredient

</td></tr>
<tr><td>

[traceAllergens](./IIngredient.traceAllergens.md)

</td><td>

`readonly`

</td><td>

readonly [Allergen](../type-aliases/Allergen.md)[]

</td><td>

Optional list of trace allergens possibly present (e.g.

</td></tr>
<tr><td>

[certifications](./IIngredient.certifications.md)

</td><td>

`readonly`

</td><td>

readonly [Certification](../type-aliases/Certification.md)[]

</td><td>

Optional list of certifications the ingredient has

</td></tr>
<tr><td>

[vegan](./IIngredient.vegan.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Optional indicator if the ingredient is vegan

</td></tr>
<tr><td>

[tags](./IIngredient.tags.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Optional tags for searching/filtering

</td></tr>
<tr><td>

[notes](./IIngredient.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](ICategorizedNote.md)[]

</td><td>

Optional categorized notes (e.g., AI assumptions, user annotations, sourcing)

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

[usedByFillings()](./IIngredient.usedByFillings.md)

</td><td>



</td><td>

Gets all filling recipes that use this ingredient (primary or alternate).

</td></tr>
<tr><td>

[primaryInFillings()](./IIngredient.primaryInFillings.md)

</td><td>



</td><td>

Gets filling recipes where this ingredient is the primary choice.

</td></tr>
<tr><td>

[alternateInFillings()](./IIngredient.alternateInFillings.md)

</td><td>



</td><td>

Gets filling recipes where this ingredient is listed as an alternate.

</td></tr>
<tr><td>

[isChocolate()](./IIngredient.isChocolate.md)

</td><td>



</td><td>

Returns true if this is a chocolate ingredient.

</td></tr>
<tr><td>

[isDairy()](./IIngredient.isDairy.md)

</td><td>



</td><td>

Returns true if this is a dairy ingredient.

</td></tr>
<tr><td>

[isSugar()](./IIngredient.isSugar.md)

</td><td>



</td><td>

Returns true if this is a sugar ingredient.

</td></tr>
<tr><td>

[isFat()](./IIngredient.isFat.md)

</td><td>



</td><td>

Returns true if this is a fat ingredient.

</td></tr>
<tr><td>

[isAlcohol()](./IIngredient.isAlcohol.md)

</td><td>



</td><td>

Returns true if this is an alcohol ingredient.

</td></tr>
</tbody></table>
