[Home](../../README.md) > [Entities](../README.md) > IIngredientModifiers

# Interface: IIngredientModifiers

Modifiers that qualify how an ingredient is measured or added.
Groups measurement hints and qualifiers to avoid interface pollution.

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

[spoonLevel](./IIngredientModifiers.spoonLevel.md)

</td><td>

`readonly`

</td><td>

[SpoonLevel](../../type-aliases/SpoonLevel.md)

</td><td>

For tsp/Tbsp measurements: whether the spoon is level, heaping, or scant.

</td></tr>
<tr><td>

[toTaste](./IIngredientModifiers.toTaste.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Indicates this ingredient is "to taste" - the amount is a suggestion.

</td></tr>
<tr><td>

[yieldFactor](./IIngredientModifiers.yieldFactor.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Fraction of ingredient contributing to final recipe weight after processing.

</td></tr>
<tr><td>

[processNote](./IIngredientModifiers.processNote.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Human-readable description of the processing applied to this ingredient.

</td></tr>
</tbody></table>
