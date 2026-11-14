[Home](../../README.md) > [Validation](../README.md) > ValidatorTraits

# Class: ValidatorTraits

Generic implementation of Validation.ValidatorTraitValues | ValidatorTraitValues.

**Implements:** [`ValidatorTraitValues`](../../interfaces/ValidatorTraitValues.md)

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

`constructor(init, base)`

</td><td>



</td><td>

Constructs a new Validation.ValidatorTraits | ValidatorTraits optionally
initialized with the supplied base and initial values.

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

[isOptional](./ValidatorTraits.isOptional.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Indicates whether the validator accepts `undefined` as

</td></tr>
<tr><td>

[brand](./ValidatorTraits.brand.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

If present, indicates that the result will be branded

</td></tr>
<tr><td>

[constraints](./ValidatorTraits.constraints.md)

</td><td>

`readonly`

</td><td>

[FunctionConstraintTrait](../../interfaces/FunctionConstraintTrait.md)[]

</td><td>

Zero or more additional Validation.ConstraintTrait | ConstraintTraits

</td></tr>
</tbody></table>
