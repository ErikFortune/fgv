[Home](../../README.md) > [Internal](../README.md) > IScaledAmount

# Interface: IScaledAmount

Result of scaling an amount in a specific unit.
Contains both the raw scaled value and display-friendly representation.

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

[value](./IScaledAmount.value.md)

</td><td>

`readonly`

</td><td>

[Measurement](../../type-aliases/Measurement.md)

</td><td>

The raw scaled numeric value

</td></tr>
<tr><td>

[unit](./IScaledAmount.unit.md)

</td><td>

`readonly`

</td><td>

[MeasurementUnit](../../type-aliases/MeasurementUnit.md)

</td><td>

The unit of measurement

</td></tr>
<tr><td>

[displayValue](./IScaledAmount.displayValue.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Display string (e.g., "1 1/2 tsp" or "2 Tbsp")

</td></tr>
<tr><td>

[scalable](./IScaledAmount.scalable.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether this unit supports scaling (false for pinch)

</td></tr>
</tbody></table>
