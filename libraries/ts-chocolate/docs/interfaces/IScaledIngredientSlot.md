[Home](../README.md) > IScaledIngredientSlot

# Interface: IScaledIngredientSlot

A scaled ingredient filling slot — the required amount of the ingredient
is computed from the confection geometry.

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

[type](./IScaledIngredientSlot.type.md)

</td><td>

`readonly`

</td><td>

"ingredient"

</td><td>



</td></tr>
<tr><td>

[slotId](./IScaledIngredientSlot.slotId.md)

</td><td>

`readonly`

</td><td>

[SlotId](../type-aliases/SlotId.md)

</td><td>



</td></tr>
<tr><td>

[name](./IScaledIngredientSlot.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>



</td></tr>
<tr><td>

[targetWeight](./IScaledIngredientSlot.targetWeight.md)

</td><td>

`readonly`

</td><td>

[Measurement](../type-aliases/Measurement.md)

</td><td>

Required amount of this ingredient in grams

</td></tr>
<tr><td>

[ingredient](./IScaledIngredientSlot.ingredient.md)

</td><td>

`readonly`

</td><td>

[IIngredient](IIngredient.md)

</td><td>

The resolved ingredient

</td></tr>
</tbody></table>
