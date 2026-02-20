[Home](../../README.md) > [LibraryRuntime](../README.md) > IScaledRecipeSlot

# Interface: IScaledRecipeSlot

A scaled recipe filling slot — the selected filling's golden variation
has been scaled to the computed target weight.

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

[type](./IScaledRecipeSlot.type.md)

</td><td>

`readonly`

</td><td>

"recipe"

</td><td>



</td></tr>
<tr><td>

[slotId](./IScaledRecipeSlot.slotId.md)

</td><td>

`readonly`

</td><td>

[SlotId](../../type-aliases/SlotId.md)

</td><td>



</td></tr>
<tr><td>

[name](./IScaledRecipeSlot.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>



</td></tr>
<tr><td>

[targetWeight](./IScaledRecipeSlot.targetWeight.md)

</td><td>

`readonly`

</td><td>

[Measurement](../../type-aliases/Measurement.md)

</td><td>

Target weight for this slot in grams

</td></tr>
<tr><td>

[scaleFactor](./IScaledRecipeSlot.scaleFactor.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Scale factor applied to the filling's base weight

</td></tr>
<tr><td>

[produced](./IScaledRecipeSlot.produced.md)

</td><td>

`readonly`

</td><td>

[ProducedFilling](../../classes/ProducedFilling.md)

</td><td>

Scaled filling with per-ingredient amounts

</td></tr>
<tr><td>

[resolvedIngredients](./IScaledRecipeSlot.resolvedIngredients.md)

</td><td>

`readonly`

</td><td>

readonly [IResolvedFillingIngredient](../../interfaces/IResolvedFillingIngredient.md)&lt;[IIngredient](../../interfaces/IIngredient.md)&lt;[IngredientEntity](../../type-aliases/IngredientEntity.md)&gt;&gt;[]

</td><td>

Resolved ingredients from the source variation (for display names)

</td></tr>
</tbody></table>
