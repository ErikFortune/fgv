[Home](../../README.md) > [Entities](../README.md) > IChocolateIngredientEntity

# Interface: IChocolateIngredientEntity

Chocolate-specific ingredient

**Extends:** [`IIngredientEntity`](../../interfaces/IIngredientEntity.md)

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

[category](./IChocolateIngredientEntity.category.md)

</td><td>

`readonly`

</td><td>

"chocolate"

</td><td>

Category is always Chocolate for this type

</td></tr>
<tr><td>

[chocolateType](./IChocolateIngredientEntity.chocolateType.md)

</td><td>

`readonly`

</td><td>

[ChocolateType](../../type-aliases/ChocolateType.md)

</td><td>

Type of chocolate

</td></tr>
<tr><td>

[cacaoPercentage](./IChocolateIngredientEntity.cacaoPercentage.md)

</td><td>

`readonly`

</td><td>

[Percentage](../../type-aliases/Percentage.md)

</td><td>

Cacao percentage (e.g., 70 for 70% dark)

</td></tr>
<tr><td>

[fluidityStars](./IChocolateIngredientEntity.fluidityStars.md)

</td><td>

`readonly`

</td><td>

[FluidityStars](../../type-aliases/FluidityStars.md)

</td><td>

Fluidity in Callebaut star ratings (optional)

</td></tr>
<tr><td>

[viscosityMcM](./IChocolateIngredientEntity.viscosityMcM.md)

</td><td>

`readonly`

</td><td>

[DegreesMacMichael](../../type-aliases/DegreesMacMichael.md)

</td><td>

Viscosity in MacMichael degrees (optional)

</td></tr>
<tr><td>

[temperatureCurve](./IChocolateIngredientEntity.temperatureCurve.md)

</td><td>

`readonly`

</td><td>

[ITemperatureCurve](../../interfaces/ITemperatureCurve.md)

</td><td>

Tempering curve (optional)

</td></tr>
<tr><td>

[beanVarieties](./IChocolateIngredientEntity.beanVarieties.md)

</td><td>

`readonly`

</td><td>

readonly [CacaoVariety](../../type-aliases/CacaoVariety.md)[]

</td><td>

Bean varieties used in the chocolate (optional)

</td></tr>
<tr><td>

[applications](./IChocolateIngredientEntity.applications.md)

</td><td>

`readonly`

</td><td>

readonly [ChocolateApplication](../../type-aliases/ChocolateApplication.md)[]

</td><td>

Recommended applications for this chocolate (optional)

</td></tr>
<tr><td>

[origins](./IChocolateIngredientEntity.origins.md)

</td><td>

`readonly`

</td><td>

string[]

</td><td>

Origin of the chocolate (optional)

</td></tr>
<tr><td>

[baseId](./IIngredientEntity.baseId.md)

</td><td>

`readonly`

</td><td>

[BaseIngredientId](../../type-aliases/BaseIngredientId.md)

</td><td>

Base identifier within source (no dots)

</td></tr>
<tr><td>

[name](./IIngredientEntity.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Display name

</td></tr>
<tr><td>

[ganacheCharacteristics](./IIngredientEntity.ganacheCharacteristics.md)

</td><td>

`readonly`

</td><td>

[IGanacheCharacteristics](../../interfaces/IGanacheCharacteristics.md)

</td><td>

Ganache-relevant characteristics

</td></tr>
<tr><td>

[description](./IIngredientEntity.description.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional description

</td></tr>
<tr><td>

[manufacturer](./IIngredientEntity.manufacturer.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional manufacturer

</td></tr>
<tr><td>

[allergens](./IIngredientEntity.allergens.md)

</td><td>

`readonly`

</td><td>

readonly [Allergen](../../type-aliases/Allergen.md)[]

</td><td>

Optional list of common allergens present in the ingredient

</td></tr>
<tr><td>

[traceAllergens](./IIngredientEntity.traceAllergens.md)

</td><td>

`readonly`

</td><td>

readonly [Allergen](../../type-aliases/Allergen.md)[]

</td><td>

Optional list of trace allergens possibly present (e.g.

</td></tr>
<tr><td>

[certifications](./IIngredientEntity.certifications.md)

</td><td>

`readonly`

</td><td>

readonly [Certification](../../type-aliases/Certification.md)[]

</td><td>

Optional list of certifications the ingredient has

</td></tr>
<tr><td>

[vegan](./IIngredientEntity.vegan.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Optional indicator if the ingredient is vegan

</td></tr>
<tr><td>

[tags](./IIngredientEntity.tags.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Optional tags for searching/filtering

</td></tr>
<tr><td>

[density](./IIngredientEntity.density.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Density in g/mL for volume-to-weight conversion (default: 1.0)

</td></tr>
<tr><td>

[phase](./IIngredientEntity.phase.md)

</td><td>

`readonly`

</td><td>

[IngredientPhase](../../type-aliases/IngredientPhase.md)

</td><td>

Physical phase - display hint for UI (e.g., "pour" vs "add")

</td></tr>
<tr><td>

[measurementUnits](./IIngredientEntity.measurementUnits.md)

</td><td>

`readonly`

</td><td>

[IOptionsWithPreferred](../../interfaces/IOptionsWithPreferred.md)&lt;[IMeasurementUnitOption](../../interfaces/IMeasurementUnitOption.md), [MeasurementUnit](../../type-aliases/MeasurementUnit.md)&gt;

</td><td>

Preferred and acceptable measurement units for this ingredient

</td></tr>
<tr><td>

[urls](./IIngredientEntity.urls.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedUrl](../../interfaces/ICategorizedUrl.md)[]

</td><td>

Optional categorized URLs for external resources (manufacturer, product page, etc.)

</td></tr>
</tbody></table>
