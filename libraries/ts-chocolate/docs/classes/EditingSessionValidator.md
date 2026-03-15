[Home](../README.md) > EditingSessionValidator

# Class: EditingSessionValidator

A wrapper for EditingSession that validates and converts weakly-typed inputs
to strongly-typed branded types before delegating to the underlying session.

This allows consumers to use plain strings and numbers instead of
IngredientId and Measurement branded types while still benefiting from
runtime validation.

**Implements:** [`IEditingSessionValidator`](../interfaces/IEditingSessionValidator.md)

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

`constructor(session)`

</td><td>



</td><td>

Creates a new EditingSessionValidator

</td></tr>
</tbody></table>

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

[session](./EditingSessionValidator.session.md)

</td><td>

`readonly`

</td><td>

[EditingSession](EditingSession.md)

</td><td>

The underlying editing session

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

[setIngredient(id, amount, unit, modifiers)](./EditingSessionValidator.setIngredient.md)

</td><td>



</td><td>

Sets or updates an ingredient using weakly-typed inputs

</td></tr>
<tr><td>

[removeIngredient(id)](./EditingSessionValidator.removeIngredient.md)

</td><td>



</td><td>

Removes an ingredient using a weakly-typed string

</td></tr>
<tr><td>

[scaleToTargetWeight(targetWeight)](./EditingSessionValidator.scaleToTargetWeight.md)

</td><td>



</td><td>

Scales the filling to achieve a target weight using a weakly-typed number.

</td></tr>
<tr><td>

[setProcedure(id)](./EditingSessionValidator.setProcedure.md)

</td><td>



</td><td>

Sets the procedure using a weakly-typed string

</td></tr>
<tr><td>

[toReadOnly()](./EditingSessionValidator.toReadOnly.md)

</td><td>



</td><td>

Gets a read-only version of this validator

</td></tr>
</tbody></table>
