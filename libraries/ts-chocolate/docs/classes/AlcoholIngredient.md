[Home](../README.md) > AlcoholIngredient

# Class: AlcoholIngredient

A resolved view of an alcohol ingredient with navigation capabilities.
Immutable - does not allow modification of underlying data.

**Extends:** [`IngredientBase`](IngredientBase.md)

**Implements:** [`IAlcoholIngredient`](../interfaces/IAlcoholIngredient.md)

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

[category](./AlcoholIngredient.category.md)

</td><td>

`readonly`

</td><td>

"alcohol"

</td><td>

Category is always 'alcohol' for this type

</td></tr>
<tr><td>

[alcoholByVolume](./AlcoholIngredient.alcoholByVolume.md)

</td><td>

`readonly`

</td><td>

[Percentage](../type-aliases/Percentage.md) | undefined

</td><td>

Alcohol by volume percentage (optional)

</td></tr>
<tr><td>

[flavorProfile](./AlcoholIngredient.flavorProfile.md)

</td><td>

`readonly`

</td><td>

string | undefined

</td><td>

Flavor profile description (optional)

</td></tr>
<tr><td>

[entity](./AlcoholIngredient.entity.md)

</td><td>

`readonly`

</td><td>

[IAlcoholIngredientEntity](../interfaces/IAlcoholIngredientEntity.md)

</td><td>

Gets the underlying alcohol ingredient data entity

</td></tr>
<tr><td>

[id](./IngredientBase.id.md)

</td><td>

`readonly`

</td><td>

[IngredientId](../type-aliases/IngredientId.md)

</td><td>

The composite ingredient ID (e.g., "felchlin.maracaibo-65")

</td></tr>
<tr><td>

[collectionId](./IngredientBase.collectionId.md)

</td><td>

`readonly`

</td><td>

[CollectionId](../type-aliases/CollectionId.md)

</td><td>

The source ID part of the composite ID

</td></tr>
<tr><td>

[baseId](./IngredientBase.baseId.md)

</td><td>

`readonly`

</td><td>

[BaseIngredientId](../type-aliases/BaseIngredientId.md)

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

[IGanacheCharacteristics](../interfaces/IGanacheCharacteristics.md)

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

readonly [Allergen](../type-aliases/Allergen.md)[]

</td><td>

Common allergens present

</td></tr>
<tr><td>

[traceAllergens](./IngredientBase.traceAllergens.md)

</td><td>

`readonly`

</td><td>

readonly [Allergen](../type-aliases/Allergen.md)[]

</td><td>

Trace allergens (may be present in traces)

</td></tr>
<tr><td>

[certifications](./IngredientBase.certifications.md)

</td><td>

`readonly`

</td><td>

readonly [Certification](../type-aliases/Certification.md)[]

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

readonly [ICategorizedNote](../interfaces/ICategorizedNote.md)[]

</td><td>

Categorized notes (e.g., AI assumptions, user annotations)

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

[create(context, id, ingredient)](./AlcoholIngredient.create.md)

</td><td>

`static`

</td><td>

Factory method for creating a AlcoholIngredient.

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
