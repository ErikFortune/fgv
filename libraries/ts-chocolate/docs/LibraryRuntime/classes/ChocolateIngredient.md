[Home](../../README.md) > [LibraryRuntime](../README.md) > ChocolateIngredient

# Class: ChocolateIngredient

A resolved view of a chocolate ingredient with navigation capabilities.
Immutable - does not allow modification of underlying data.

**Extends:** [`IngredientBase<IChocolateIngredientEntity>`](../../classes/IngredientBase.md)

**Implements:** [`IChocolateIngredient`](../../interfaces/IChocolateIngredient.md)

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

[category](./ChocolateIngredient.category.md)

</td><td>

`readonly`

</td><td>

"chocolate"

</td><td>

Category is always 'chocolate' for this type

</td></tr>
<tr><td>

[chocolateType](./ChocolateIngredient.chocolateType.md)

</td><td>

`readonly`

</td><td>

[ChocolateType](../../type-aliases/ChocolateType.md)

</td><td>

Type of chocolate (dark, milk, white, etc.)

</td></tr>
<tr><td>

[cacaoPercentage](./ChocolateIngredient.cacaoPercentage.md)

</td><td>

`readonly`

</td><td>

[Percentage](../../type-aliases/Percentage.md)

</td><td>

Cacao percentage (e.g., 70 for 70% dark)

</td></tr>
<tr><td>

[fluidityStars](./ChocolateIngredient.fluidityStars.md)

</td><td>

`readonly`

</td><td>

[FluidityStars](../../type-aliases/FluidityStars.md) | undefined

</td><td>

Fluidity in Callebaut star ratings (optional)

</td></tr>
<tr><td>

[viscosityMcM](./ChocolateIngredient.viscosityMcM.md)

</td><td>

`readonly`

</td><td>

[DegreesMacMichael](../../type-aliases/DegreesMacMichael.md) | undefined

</td><td>

Viscosity in MacMichael degrees (optional)

</td></tr>
<tr><td>

[fluidityMacMichael](./ChocolateIngredient.fluidityMacMichael.md)

</td><td>

`readonly`

</td><td>

[DegreesMacMichael](../../type-aliases/DegreesMacMichael.md) | undefined

</td><td>

Viscosity in MacMichael degrees (optional)

</td></tr>
<tr><td>

[temperatureCurve](./ChocolateIngredient.temperatureCurve.md)

</td><td>

`readonly`

</td><td>

[ITemperatureCurve](../../interfaces/ITemperatureCurve.md) | undefined

</td><td>

Tempering temperature curve (optional)

</td></tr>
<tr><td>

[beanVarieties](./ChocolateIngredient.beanVarieties.md)

</td><td>

`readonly`

</td><td>

readonly [CacaoVariety](../../type-aliases/CacaoVariety.md)[] | undefined

</td><td>

Bean varieties used in the chocolate (optional)

</td></tr>
<tr><td>

[cacaoVariety](./ChocolateIngredient.cacaoVariety.md)

</td><td>

`readonly`

</td><td>

[CacaoVariety](../../type-aliases/CacaoVariety.md) | undefined

</td><td>

Cacao variety (optional)

</td></tr>
<tr><td>

[applications](./ChocolateIngredient.applications.md)

</td><td>

`readonly`

</td><td>

readonly [ChocolateApplication](../../type-aliases/ChocolateApplication.md)[] | undefined

</td><td>

Recommended applications for this chocolate (optional)

</td></tr>
<tr><td>

[origins](./ChocolateIngredient.origins.md)

</td><td>

`readonly`

</td><td>

readonly string[] | undefined

</td><td>

Origin descriptions (optional)

</td></tr>
<tr><td>

[id](./IngredientBase.id.md)

</td><td>

`readonly`

</td><td>

[IngredientId](../../type-aliases/IngredientId.md)

</td><td>

The composite ingredient ID (e.g., "felchlin.maracaibo-65")

</td></tr>
<tr><td>

[collectionId](./IngredientBase.collectionId.md)

</td><td>

`readonly`

</td><td>

[CollectionId](../../type-aliases/CollectionId.md)

</td><td>

The source ID part of the composite ID

</td></tr>
<tr><td>

[baseId](./IngredientBase.baseId.md)

</td><td>

`readonly`

</td><td>

[BaseIngredientId](../../type-aliases/BaseIngredientId.md)

</td><td>

The base ingredient ID within the source

</td></tr>
<tr><td>

[name](./IngredientBase.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Display name of the ingredient

</td></tr>
<tr><td>

[description](./IngredientBase.description.md)

</td><td>

`readonly`

</td><td>

string | undefined

</td><td>

Optional description

</td></tr>
<tr><td>

[manufacturer](./IngredientBase.manufacturer.md)

</td><td>

`readonly`

</td><td>

string | undefined

</td><td>

Optional manufacturer

</td></tr>
<tr><td>

[ganacheCharacteristics](./IngredientBase.ganacheCharacteristics.md)

</td><td>

`readonly`

</td><td>

[IGanacheCharacteristics](../../interfaces/IGanacheCharacteristics.md)

</td><td>

Ganache-relevant characteristics

</td></tr>
<tr><td>

[tags](./IngredientBase.tags.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Tags for searching/filtering

</td></tr>
<tr><td>

[allergens](./IngredientBase.allergens.md)

</td><td>

`readonly`

</td><td>

readonly [Allergen](../../type-aliases/Allergen.md)[]

</td><td>

Common allergens present

</td></tr>
<tr><td>

[traceAllergens](./IngredientBase.traceAllergens.md)

</td><td>

`readonly`

</td><td>

readonly [Allergen](../../type-aliases/Allergen.md)[]

</td><td>

Trace allergens (possible contamination)

</td></tr>
<tr><td>

[certifications](./IngredientBase.certifications.md)

</td><td>

`readonly`

</td><td>

readonly [Certification](../../type-aliases/Certification.md)[]

</td><td>

Certifications the ingredient has

</td></tr>
<tr><td>

[vegan](./IngredientBase.vegan.md)

</td><td>

`readonly`

</td><td>

boolean | undefined

</td><td>

Whether the ingredient is vegan

</td></tr>
<tr><td>

[notes](./IngredientBase.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](../../interfaces/ICategorizedNote.md)[]

</td><td>

Categorized notes (e.g., AI assumptions, user annotations)

</td></tr>
<tr><td>

[entity](./IngredientBase.entity.md)

</td><td>

`readonly`

</td><td>

TEntity

</td><td>

Gets the underlying ingredient data entity (read-only)

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

[create(context, id, ingredient)](./ChocolateIngredient.create.md)

</td><td>

`static`

</td><td>

Factory method for creating a ChocolateIngredient.

</td></tr>
<tr><td>

[isChocolate()](./IngredientBase.isChocolate.md)

</td><td>



</td><td>

Returns true if this is a chocolate ingredient.

</td></tr>
<tr><td>

[isDairy()](./IngredientBase.isDairy.md)

</td><td>



</td><td>

Returns true if this is a dairy ingredient.

</td></tr>
<tr><td>

[isSugar()](./IngredientBase.isSugar.md)

</td><td>



</td><td>

Returns true if this is a sugar ingredient.

</td></tr>
<tr><td>

[isFat()](./IngredientBase.isFat.md)

</td><td>



</td><td>

Returns true if this is a fat ingredient.

</td></tr>
<tr><td>

[isAlcohol()](./IngredientBase.isAlcohol.md)

</td><td>



</td><td>

Returns true if this is an alcohol ingredient.

</td></tr>
<tr><td>

[usedByFillings()](./IngredientBase.usedByFillings.md)

</td><td>



</td><td>

Gets all filling recipes that use this ingredient (primary or alternate).

</td></tr>
<tr><td>

[primaryInFillings()](./IngredientBase.primaryInFillings.md)

</td><td>



</td><td>

Gets filling recipes where this ingredient is the primary choice.

</td></tr>
<tr><td>

[alternateInFillings()](./IngredientBase.alternateInFillings.md)

</td><td>



</td><td>

Gets filling recipes where this ingredient is listed as an alternate.

</td></tr>
</tbody></table>
