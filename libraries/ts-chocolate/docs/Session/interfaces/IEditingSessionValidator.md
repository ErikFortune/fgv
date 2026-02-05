[Home](../../README.md) > [Session](../README.md) > IEditingSessionValidator

# Interface: IEditingSessionValidator

Full interface for EditingSessionValidator.
Provides validated mutating operations using weakly-typed inputs.

**Extends:** [`IReadOnlyEditingSessionValidator`](../../interfaces/IReadOnlyEditingSessionValidator.md)

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

[session](./IReadOnlyEditingSessionValidator.session.md)

</td><td>

`readonly`

</td><td>

[EditingSession](../../classes/EditingSession.md)

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

[setIngredient(id, amount, unit, modifiers)](./IEditingSessionValidator.setIngredient.md)

</td><td>



</td><td>

Sets or updates an ingredient using weakly-typed inputs

</td></tr>
<tr><td>

[removeIngredient(id)](./IEditingSessionValidator.removeIngredient.md)

</td><td>



</td><td>

Removes an ingredient using a weakly-typed string

</td></tr>
<tr><td>

[scaleToTargetWeight(targetWeight)](./IEditingSessionValidator.scaleToTargetWeight.md)

</td><td>



</td><td>

Scales the filling to achieve a target weight using a weakly-typed number.

</td></tr>
<tr><td>

[setProcedure(id)](./IEditingSessionValidator.setProcedure.md)

</td><td>



</td><td>

Sets the procedure using a weakly-typed string

</td></tr>
<tr><td>

[toReadOnly()](./IEditingSessionValidator.toReadOnly.md)

</td><td>



</td><td>

Gets a read-only version of this validator

</td></tr>
</tbody></table>
