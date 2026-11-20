[Home](../README.md) > RangeOf

# Class: RangeOf

Simple implementation of a possibly open-ended range of some comparable
type `<T>` with test and formatting.

**Implements:** [`RangeOfProperties<T>`](../interfaces/RangeOfProperties.md)

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

`constructor(min, max)`

</td><td>



</td><td>

Creates a new Experimental.RangeOf | RangeOf<T>.

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

[min](./RangeOf.min.md)

</td><td>

`readonly`

</td><td>

T

</td><td>

Minimum extent of the range.

</td></tr>
<tr><td>

[max](./RangeOf.max.md)

</td><td>

`readonly`

</td><td>

T

</td><td>

Maximum extent of the range.

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

[createRange(init)](./RangeOf.createRange.md)

</td><td>

`static`

</td><td>

Static constructor for a Experimental.RangeOf | RangeOf<T>.

</td></tr>
<tr><td>

[propertiesToString(range, formats, emptyValue)](./RangeOf.propertiesToString.md)

</td><td>

`static`

</td><td>

Gets a formatted description of a Experimental.RangeOfProperties | RangeOfProperties<T> given an

</td></tr>
<tr><td>

[check(t)](./RangeOf.check.md)

</td><td>



</td><td>

Checks if a supplied value is within this range.

</td></tr>
<tr><td>

[includes(t)](./RangeOf.includes.md)

</td><td>



</td><td>

Determines if a supplied value is within this range.

</td></tr>
<tr><td>

[findTransition(t)](./RangeOf.findTransition.md)

</td><td>



</td><td>

Finds the transition value that would bring a supplied value `t` into

</td></tr>
<tr><td>

[toFormattedProperties(format)](./RangeOf.toFormattedProperties.md)

</td><td>



</td><td>

Formats the minimum and maximum values of this range.

</td></tr>
<tr><td>

[format(format, formats)](./RangeOf.format.md)

</td><td>



</td><td>

Formats this range using the supplied format function.

</td></tr>
</tbody></table>
