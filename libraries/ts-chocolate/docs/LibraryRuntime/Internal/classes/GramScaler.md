[Home](../../../README.md) > [LibraryRuntime](../../README.md) > [Internal](../README.md) > GramScaler

# Class: GramScaler

Contextual scaler for gram measurements.
Rounds to the nearest gram for large amounts (\>= 10g), to 1 decimal place
for smaller amounts, and never rounds down to zero.

**Implements:** [`IUnitScaler`](../../../interfaces/IUnitScaler.md)

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

`constructor()`

</td><td>



</td><td>



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

[supportsScaling](./GramScaler.supportsScaling.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether this unit supports scaling

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

[scale(amount, factor)](./GramScaler.scale.md)

</td><td>



</td><td>

Scale an amount by a factor

</td></tr>
</tbody></table>
