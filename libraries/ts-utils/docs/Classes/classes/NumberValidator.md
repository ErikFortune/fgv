[Home](../../README.md) > [Classes](../README.md) > NumberValidator

# Class: NumberValidator

An in-place Validation.Validator | Validator for `number` values.

**Extends:** [`GenericValidator<T, TC>`](../../classes/GenericValidator.md)

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

`constructor(params)`

</td><td>



</td><td>

Constructs a new Validation.Classes.NumberValidator | NumberValidator.

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

[traits](./GenericValidator.traits.md)

</td><td>

`readonly`

</td><td>

[ValidatorTraits](../../classes/ValidatorTraits.md)

</td><td>

Validation.ValidatorTraits | Traits describing this validation.

</td></tr>
<tr><td>

[isOptional](./GenericValidator.isOptional.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Indicates whether this element is explicitly optional.

</td></tr>
<tr><td>

[brand](./GenericValidator.brand.md)

</td><td>

`readonly`

</td><td>

string | undefined

</td><td>

The brand for a branded type.

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

[validateNumber(from)](./NumberValidator.validateNumber.md)

</td><td>

`static`

</td><td>

Static method which validates that a supplied `unknown` value is a `number`.

</td></tr>
<tr><td>

[validate(from, context)](./GenericValidator.validate.md)

</td><td>



</td><td>

Tests to see if a supplied `unknown` value matches this validation.

</td></tr>
<tr><td>

[convert(from, context)](./GenericValidator.convert.md)

</td><td>



</td><td>

Tests to see if a supplied 'unknown' value matches this validation.

</td></tr>
<tr><td>

[validateOptional(from, context)](./GenericValidator.validateOptional.md)

</td><td>



</td><td>

Tests to see if a supplied `unknown` value matches this
validation.

</td></tr>
<tr><td>

[guard(from, context)](./GenericValidator.guard.md)

</td><td>



</td><td>

Non-throwing type guard

</td></tr>
<tr><td>

[optional()](./GenericValidator.optional.md)

</td><td>



</td><td>

Creates an Validation.Validator | in-place validator

</td></tr>
<tr><td>

[withConstraint(constraint, trait)](./GenericValidator.withConstraint.md)

</td><td>



</td><td>

Creates an Validation.Validator | in-place validator

</td></tr>
<tr><td>

[withBrand(brand)](./GenericValidator.withBrand.md)

</td><td>



</td><td>

The brand for a branded type.

</td></tr>
<tr><td>

[withFormattedError(formatter)](./GenericValidator.withFormattedError.md)

</td><td>



</td><td>

Creates a new Validation.Validator | in-place validator which

</td></tr>
<tr><td>

[or(other)](./GenericValidator.or.md)

</td><td>



</td><td>

Chains this validator with another of the same type, to be attempted if this

</td></tr>
</tbody></table>
