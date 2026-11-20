[Home](../../README.md) > [Utils](../README.md) > ValidationHelpers

# Class: ValidationHelpers

A collection of validation and normalization helpers for constrained string
types.
*

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

`constructor(init)`

</td><td>



</td><td>

Constructs new Utils.ValidationHelpers | validation helpers
from supplied initializers.

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

[description](./ValidationHelpers.description.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Describes the group of tags validated by these helpers.

</td></tr>
<tr><td>

[converter](./ValidationHelpers.converter.md)

</td><td>

`readonly`

</td><td>

Converter&lt;T, TC&gt;

</td><td>

A `Converter` which converts `unknown` to the tag type

</td></tr>
<tr><td>

[isWellFormed](./ValidationHelpers.isWellFormed.md)

</td><td>

`readonly`

</td><td>

TypeGuardWithContext&lt;T, TC&gt;

</td><td>

Determines is a supplied tag is well-formed according to the

</td></tr>
<tr><td>

[isCanonical](./ValidationHelpers.isCanonical.md)

</td><td>

`readonly`

</td><td>

TypeGuardWithContext&lt;T, TC&gt;

</td><td>

Determines is a supplied tag is well-formed and uses canonical

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

[toCanonical(from, context)](./ValidationHelpers.toCanonical.md)

</td><td>



</td><td>

Converts a supplied `unknown` to the canonical form of the tag

</td></tr>
<tr><td>

[verifyIsWellFormed(from, context)](./ValidationHelpers.verifyIsWellFormed.md)

</td><td>



</td><td>

Determines if a supplied `unknown` is a well-formed representation

</td></tr>
<tr><td>

[verifyIsCanonical(from, context)](./ValidationHelpers.verifyIsCanonical.md)

</td><td>



</td><td>

Determines if a supplied `unknown` is a well-formed, canonical representation

</td></tr>
</tbody></table>
