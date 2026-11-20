[Home](../README.md) > ValidatorTraitValues

# Interface: ValidatorTraitValues

Interface describing the supported validator traits.

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

[isOptional](./ValidatorTraitValues.isOptional.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Indicates whether the validator accepts `undefined` as

</td></tr>
<tr><td>

[brand](./ValidatorTraitValues.brand.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

If present, indicates that the result will be branded

</td></tr>
<tr><td>

[constraints](./ValidatorTraitValues.constraints.md)

</td><td>

`readonly`

</td><td>

[FunctionConstraintTrait](FunctionConstraintTrait.md)[]

</td><td>

Zero or more additional Validation.ConstraintTrait | ConstraintTraits

</td></tr>
</tbody></table>
