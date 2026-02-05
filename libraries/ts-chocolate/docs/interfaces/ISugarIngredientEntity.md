[Home](../README.md) > ISugarIngredientEntity

# Interface: ISugarIngredientEntity

Sugar-specific ingredient

**Extends:** [`IIngredientEntity`](IIngredientEntity.md)

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

[category](./ISugarIngredientEntity.category.md)

</td><td>

`readonly`

</td><td>

"sugar"

</td><td>

Category is always Sugar for this type

</td></tr>
<tr><td>

[hydrationNumber](./ISugarIngredientEntity.hydrationNumber.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Hydration number (water molecules per sugar molecule)

</td></tr>
<tr><td>

[sweetnessPotency](./ISugarIngredientEntity.sweetnessPotency.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Sweetness potency relative to sucrose (1.0 = sucrose)

</td></tr>
<tr><td>

[baseId](./IIngredientEntity.baseId.md)

</td><td>

`readonly`

</td><td>

[BaseIngredientId](../type-aliases/BaseIngredientId.md)

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

[IGanacheCharacteristics](IGanacheCharacteristics.md)

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

readonly [Allergen](../type-aliases/Allergen.md)[]

</td><td>

Optional list of common allergens present in the ingredient

</td></tr>
<tr><td>

[traceAllergens](./IIngredientEntity.traceAllergens.md)

</td><td>

`readonly`

</td><td>

readonly [Allergen](../type-aliases/Allergen.md)[]

</td><td>

Optional list of trace allergens possibly present (e.g.

</td></tr>
<tr><td>

[certifications](./IIngredientEntity.certifications.md)

</td><td>

`readonly`

</td><td>

readonly [Certification](../type-aliases/Certification.md)[]

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

[IngredientPhase](../type-aliases/IngredientPhase.md)

</td><td>

Physical phase - display hint for UI (e.g., "pour" vs "add")

</td></tr>
<tr><td>

[measurementUnits](./IIngredientEntity.measurementUnits.md)

</td><td>

`readonly`

</td><td>

[IOptionsWithPreferred](IOptionsWithPreferred.md)&lt;[IMeasurementUnitOption](IMeasurementUnitOption.md), [MeasurementUnit](../type-aliases/MeasurementUnit.md)&gt;

</td><td>

Preferred and acceptable measurement units for this ingredient

</td></tr>
<tr><td>

[urls](./IIngredientEntity.urls.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedUrl](ICategorizedUrl.md)[]

</td><td>

Optional categorized URLs for external resources (manufacturer, product page, etc.)

</td></tr>
</tbody></table>
